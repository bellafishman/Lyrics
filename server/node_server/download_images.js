const fs = require('fs');
const path = require('path');
const axios = require('axios');
const express = require('express');
const sharp = require('sharp');
const app = express();
const { getSpotifyAccessToken } = require('./src/spotify_auth');

let spotifyAccessToken = '';

app.use(async (req, res, next) => {
  if (!spotifyAccessToken) {
    try {
      spotifyAccessToken = await getSpotifyAccessToken();
    } catch (error) {
      return res.status(500).send('Failed to get Spotify access token');
    }
  }
  req.spotifyAccessToken = spotifyAccessToken;
  next();
});

async function apiCallWithRetry(token, apiRequestFunc, updateTokenCallback) {
    try {
      return await apiRequestFunc(token);
    } catch (error) {
        if (error.response && error.response.status === 401) {
        console.log('Token expired. Getting a new token...');
        try {
            const newToken = await getSpotifyAccessToken();
            updateTokenCallback(newToken);
            return await apiRequestFunc(newToken);
        } catch (tokenError) {
            console.error('Failed to refresh Spotify access token:', tokenError);
            throw new Error('Failed to refresh Spotify access token');
        }
        } else {
        console.error('API request failed:', error.response ? error.response.data : error.message);
        throw error;
        }
    }
}

async function downloadImage(url, index, folderPath) {
    try {
        console.log("DOWNLOAD-IMAGE");
        const response = await axios({
            url,
            responseType: 'arraybuffer',
        });

        const buffer = Buffer.from(response.data, 'binary');
        const filePath = path.join(folderPath, `image${index}.jpg`); // Use index for filenames

        // Process the image with sharp
        await sharp(buffer)
            .resize(800) // Example: Resize the image
            .toFile(filePath); // Save as file

        console.log(`Image saved to ${filePath}`);
    } catch (error) {
        console.error(`Failed to download image from ${url}:`, error);
        throw error;
    }
}

async function downloadImages(imageUrls, folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const downloadPromises = imageUrls.map((url, index) => {
        return downloadImage(url, index + 1, folderPath); // Pass index to filename
    });

    try {
        await Promise.all(downloadPromises);
        console.log('All images downloaded and processed successfully.');
    } catch (error) {
        console.error('Error downloading and processing images:', error);
    }
}
  
async function getPlaylistTracks(playlistId, token) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}?market=ES&fields=tracks.items(track(album(images)))`;
    try {
        const response = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting playlist tracks:', error.response ? error.response.data : error.message);
        throw error;
    }
}
  
// API route to get images
app.get('/api/get-images/:id', async (req, res) => {
    const playlistId = req.params.id;
    const folderPath = path.join(__dirname, 'album-images');

    try {
        const data = await apiCallWithRetry(req.spotifyAccessToken, async (token) => {
            const playlistData = await getPlaylistTracks(playlistId, token);

            // Extract the URL of the 2nd image from each album
            const imageUrls = playlistData.tracks.items.flatMap(item => {
                const images = item.track.album.images;
                if (images.length > 1) {
                    return images[1].url; // Get the 2nd image URL
                }
                return []; // Return an empty array if there are not enough images
            });


            // Download images
            await downloadImages(imageUrls, folderPath);

            return { message: 'Images downloaded successfully' };
        }, newToken => {
            spotifyAccessToken = newToken;
            req.spotifyAccessToken = newToken;
        });

            res.json(data);
    } catch (error) {
        res.status(500).send('Error getting playlist images');
    }
});
  
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//
// Bella Fishman
// Handle interactions (GET requests) with spotify API
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { getSpotifyAccessToken, getClientRefresh } = require('./spotify_auth');


async function getUserTokens(userId, spotifyAccessToken) {
  try {
    // Find user by their Spotify user ID
    const user = await User.findOne({ 'spotify.userId': userId });

    if (!user) {
      return {
        accessToken: spotifyAccessToken,
        refreshToken: ''
      };
    }

    // Return tokens
    return {
      accessToken: user.spotify.accesstoken,
      refreshToken: user.spotify.refreshtoken
    };
  } catch (error) {
    console.error('Error retrieving user tokens:', error.message);
    throw error; // Or handle error appropriately
  }
}

async function apiCallWithRetry(token, refreshToken, apiRequestFunc, updateTokenCallback, updateRefreshTokenCallback) {
  try {
    // Attempt the API request with the current token
    return await apiRequestFunc(token);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Token expired, get a new token
      console.log('Token expired. Getting a new token...');
      try {
        let newToken = '';
        let newRefreshToken = '';
        if (!refreshToken) {
          console.log('Getting Spotify access token');
          newToken = await getSpotifyAccessToken();
          newRefreshToken = ''; // No refresh token if a new token is obtained directly
        } else {
          console.log('Getting Spotify client access token');
          [newToken, newRefreshToken] = await getClientRefresh(refreshToken);
          console.log('New token: ', newToken);
        }

        updateTokenCallback(newToken);
        updateRefreshTokenCallback(newRefreshToken);

        // Retry the API request with the new token
        return await apiRequestFunc(newToken);
      } catch (tokenError) {
        throw new Error('Failed to refresh Spotify access token');
      }
    } else {
      throw error; // Re-throw other errors to be handled by the caller
    }
  }
}


async function getSpotifyUserProfile(accessToken) {
  try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
          headers: {
              'Authorization': `Bearer ${accessToken}`
          }
      });

      return response.data;
  } catch (error) {
      console.error('Error fetching Spotify user profile:', error.response ? error.response.data : error.message);
      throw error;
  }
}

// search spotify for tracks, artist songs, and playlist info
async function searchSpotify(query, token, type = 'track') {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=10`;
  
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching Spotify:', error.response ? error.response.data : error.message);
      throw error;
    }
}

// get specific track info
async function getTrackInfo(trackId, token) {
    const url = `https://api.spotify.com/v1/tracks/${trackId}`;
  
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting track info:', error.response ? error.response.data : error.message);
      throw error;
    }
}


// get specific track info from playlist
async function getPlaylistTracks(playlistId, token) {
    // add filters to only get relevant information
    console.log('getting playlist tracks!');
    const url = `https://api.spotify.com/v1/playlists/${playlistId}` + '?market=ES&fields=name%2Ctracks.items%28track%28album%28images%29%2Cartists%2Cid%2Cname%29%29';
    //console.log(`Authorization header: Bearer ${token}`);
    try {
      console.log('sending request for playlist tracks to spotify');
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

// get specific track info from playlist
async function getMyPlaylistTracks(token) {
  // add filters to only get relevant information
  const url = 'https://api.spotify.com/v1/me/playlists?limit=3&offset=0';
  //console.log(`Authorization header: Bearer ${token}`);
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting playlist my tracks:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// get specific track info
async function getNewReleases(trackId, token) {
    const url = `https://api.spotify.com/v1/tracks/${trackId}`;
  
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting new releases:', error.response ? error.response.data : error.message);
      throw error;
    }
}


// export to be accessed in index.js for client side calls
module.exports = {
    searchSpotify,
    getTrackInfo,
    getPlaylistTracks,
    getMyPlaylistTracks,
    getNewReleases,
    apiCallWithRetry,
    getSpotifyUserProfile
};


//
// Bella Fishman
// Connects to Spotify API and gets access token
// runs on page load and stores Spotify token on session storage to avoid excessive api token calls

const axios = require('axios');
require('dotenv').config();
const { UserModel } = require('../models/Users');
const querystring = require('node:querystring'); 
const qs = require('qs');


const SPOTIFY_Key = process.env.SPOTIFY_ID;
const SPOTIFY_Secret = process.env.SPOTIFY_SECRET;
const redirect_uri = 'http://localhost/8080/callback';
const tokenUrl = 'https://accounts.spotify.com/api/token';


// server - server authentication flow
async function getSpotifyAccessToken() {
    
    const data = 'grant_type=client_credentials';
  
    try {
      const response = await axios.post(tokenUrl, data, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_Key + ':' + SPOTIFY_Secret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
  
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Spotify access token:', error.response ? error.response.data : error.message);
      throw error;
    }
}

// client - server authentication flow
async function SpotifyClientLogin(req, res) {
  const code = req.query.code; // The authorization code returned from Spotify
  
  try {
    // Exchange authorization code for access token
    const tokenData = await getSpotifyClientAccessToken(code, redirect_uri);

    // Use access token to get user info from Spotify
    const spotifyUserData = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.accessToken}`
      }
    });

    const { id: spotifyId, email, display_name: name } = spotifyUserData.data;

    // Check if user already exists
    let user = await UserModel.findOne({ spotifyId });
    if (!user) {
      // If not, create a new user
      user = await UserModel.create({
        name,
        email,
        spotifyId,
        spotifyToken: tokenData.accessToken,
        spotifyRefreshToken: tokenData.refreshToken,
      });
    }


    // Redirect user to the desired page or return their data
    //res.redirect(`http://localhost:5173/welcome?userId=${user._id}`);
    return {tokenData};

  } catch (error) {
    res.status(500).json({ error: 'Failed to log in with Spotify' });
  }
}
// client auth token
async function getSpotifyClientAccessToken(code, redirect_uri) {
  //console.log(code);
  const data = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirect_uri,
    client_id: SPOTIFY_Key,
    client_secret: SPOTIFY_Secret
  };

  try {
    //console.log('posting to get token');
    const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify(data), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    // Return the access token and refresh token if needed
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token
    };

  } catch (error) {
    console.error('Error getting Spotify access token:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function getClientRefresh(refreshToken) {
  const tokenUrl = 'https://accounts.spotify.com/api/token';

  const authHeader = 'Basic ' + Buffer.from(`${SPOTIFY_Key}:${SPOTIFY_Secret}`).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  try {
    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data;
    return { newAccessToken, newRefreshToken };
  } catch (error) {
    throw new Error('Failed to refresh Spotify token: ' + error.message);
  }
}


  
module.exports = { getSpotifyAccessToken, SpotifyClientLogin, getSpotifyClientAccessToken, getClientRefresh };
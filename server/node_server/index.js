const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const querystring = require('node:querystring'); 
const jwt = require('jsonwebtoken');
// connection to mongodb
const {mongoose} = require('mongoose');
// allow connection to python scripts for lyrics
const { exec } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const UserModel = require('./models/Users');
const LyricCommentsModel = require('./models/LyricComments');
const TrackCommentsModel = require('./models/TrackComments');
const { searchSpotify, getTrackInfo, getPlaylistTracks, getMyPlaylistTracks, getNewReleases, apiCallWithRetry, getSpotifyUserProfile } = require('./src/spotify_connect');
const { getLyrics } = require('./src/get_lyrics');
const { getSpotifyAccessToken, getSpotifyClientAccessToken } = require('./src/spotify_auth');


const app = express();
// db:
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('DB connected'))
  .catch((err) => console.log('DB not connected: ', err));


const allowedOrigins = [
  'https://lyrics-lake.vercel.app',
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Include cookies in CORS requests
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../client/dist')));


const SPOTIFY_Key = process.env.SPOTIFY_ID;
const SPOTIFY_Secret = process.env.SPOTIFY_SECRET;
const jwtSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH;


// const { downloadImages } = require('./download_images')


const redirect_uri = 'https://lyrics-server.vercel.app/callback'

// Serve the static files from the React app



// get spotify access token on page to be used on all requests by 1 client
let spotifyAccessToken = '';


// LOGIN TO SPOTIFY PATHWAY
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
app.get('/api/spotify-login', function(req, res) {

  var state = generateRandomString(16);
  var scope = 'user-read-private user-read-email';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: SPOTIFY_Key,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});
// callback response
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  
  try {
    console.log('callback sending');
    const tokenData = await getSpotifyClientAccessToken(code, 'https://lyrics-server.vercel.app/callback');
    
    const userData = await getSpotifyUserProfile(tokenData.accessToken);
    console.log("UserData: ", userData)
    

    // check if user already exists in database:
    let user = await UserModel.findOne({ 'email': userData.email });

    // user not in DB
    if (!user) {
      // Save user data to MongoDB
      const user = new UserModel({
        email: userData.email,
        name: userData.display_name, // Assuming `name` in schema corresponds to `display_name` from Spotify
        image: userData.images.length > 0 ? Buffer.from(userData.images[0].url) : null, // Convert image URL to Buffer
        spotify: {
            userId: userData.id, // Spotify User ID
            accesstoken: tokenData.accessToken, // Spotify Access Token
            refreshtoken: tokenData.refreshToken
        }
      });
      await user.save();
      console.log('User saved to database');
    }
    // user already in DB
    else {
      console.log('User already exists');
      user.image = userData.images.length > 0 ? userData.images[0].url : null;
      user.spotify.userId = userData.id;
      user.spotify.accesstoken = tokenData.accessToken;
      user.spotify.refreshtoken = tokenData.refreshToken;
      // add spotify info to users data
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1d' });
    const refreshtoken = jwt.sign({ userId: user._id }, refreshSecret, { expiresIn: '7d' }); 

    // SAVE TO USER PROFILE INSTEAD
    spotifyAccessToken = tokenData.accessToken;
    spotifyRefreshToken = tokenData.refreshToken;

    // welcome?access_token=${tokenData.accessToken}&refresh_token=${tokenData.refreshToken}
    res.redirect(`${redirect_uri}?token=${token}&refreshtoken=${refreshtoken}`);
  } catch (error) {
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

// APP SIGN UP PATHWAY
app.post('/api/signup', async (req, res) => {
  const { email, name, password } = req.body;

  console.log("email: ", email);
  console.log("password: ", password);

  try {
    // check if user exists first:
    let user = await UserModel.findOne({ email });
    
    if (!user) {
      // IMPORTANT: hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new UserModel({
          email,
          name,
          password: hashedPassword,
      });
      await user.save();
      console.log('saved user to DB');

      //console.log(user);

      const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1d' });
      const refreshtoken = jwt.sign({ userId: user._id }, refreshSecret, { expiresIn: '7d' }); 

      //console.log("Signup Token: ", token);

      res.json({ token, refreshtoken });
    }
    else {
      res.status(500).json({ message: 'Email already in use.', error: err.message });
    }

  } catch (err) {
    res.status(500).json({ message: 'Error creating user.', error: err.message });
  }
});

// APP LOGIN PATHWAY
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  //console.log("email: ", email);
  //console.log("password: ", password);

  try {
     // Check if user exists first:
     let user = await UserModel.findOne({ email });

     // If user not found, return an error
     if (!user) {
         return res.status(404).json({ message: 'User not found' });
     }

     // Check if the password is correct:
     const isMatch = await bcrypt.compare(password, user.password);
     if (!isMatch) {
         return res.status(401).json({ message: 'Invalid password' });
     }
     // Create jwt token for user
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1d' });
    const refreshtoken = jwt.sign({ userId: user._id }, refreshSecret, { expiresIn: '7d' }); 

    // Return token to be saved on client side
    res.json({ token, refreshtoken });

  } catch (err) {
    res.status(500).json({ message: 'Error creating user.', error: err.message });
  }
});


// USER ROUTES:
//Check to make sure header is not undefined, if so, return Forbidden (403)
const checkToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  //console.log('Authorization Header:', authHeader);

  const token = authHeader?.split(' ')[1];
  //console.log('Extracted Token:', token);

  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Failed to authenticate token' });

    req.user = decoded; // Attach user info to request object
    next();
  });
}
//This is a protected route 
app.get('/api/user/data', checkToken, async (req, res) => {
  try {
    console.log("USER ID in USER/DATA: ", req.user.userId);
    const user = await UserModel.findById(req.user.userId);


    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
});
// refresh jwt token:
app.post('/api/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  jwt.verify(refreshToken, refreshSecret, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid refresh token' });

    const token = jwt.sign({ userId: decoded._id  }, jwtSecret, { expiresIn: '1d' });
    const refreshtoken = jwt.sign({ userId: decoded._id  }, refreshSecret, { expiresIn: '7d' }); 

    // Return token to be saved on client side
    res.json({ token, refreshtoken });
  });
});


// Get Access token for NON-Spotify Users
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

// Workflow:
    // 1. user looks up artist, song, or artist and song
    // 2. top 10 results through spotify search api
    // 3. user can choose a song from search which will direct to azapi_script to get lyrics
    //      AND spotify song_id to display more song information
    //
    // 1. home page shows various spotify api queries including ...
    //  a.  songs within spotify playlist "Top 50"
    //  b.  songs in albums from new releases using '/browse/new-releases'

// interact with comment routes:
// get Lyric Comments
app.get('/api/lyriccomments/:trackId/:lyricId', async (req, res) => {
  
    const trackId = String(req.params.trackId);
    const lyricId = String(req.params.lyricId);
    console.log("trackId: ", trackId);
    console.log("lyricId: ", lyricId)
    try {
      const comments = await LyricCommentsModel.aggregate([
        {
          $match: { trackId, lyricId }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'Id', // users id field
            foreignField: 'userId', // lyric-comments id field
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            comments: 1,
            userId: 1,
            username: '$user.name', 
            likes: 1
          }
        }
      ]);
      console.log(comments);
      res.json({comments});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// post Lyric Comment
app.post('/api/postlyriccomments', async (req, res) => {
  const { trackId, lyricId, userId, commentText } = req.body;
  try {
      const newComment = new LyricCommentsModel({
          comments: commentText,
          userId,
          trackId,
          lyricId
      });
      await newComment.save();
      res.status(201).json(newComment);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Get Song Comments
app.get('/api/trackcomments/:trackId', async (req, res) => {
  const { trackId } = req.params;
  try {
      const comments = await TrackCommentsModel.find({ trackId });
      res.json(comments);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});
// post song comment
app.post('/api/trackcomments', async (req, res) => {
  const { trackId, userId, commentText } = req.body;
  try {
      const newComment = new TrackCommentsModel({
          comments: commentText,
          userId,
          trackId,
      });
      await newComment.save();
      res.status(201).json(newComment);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


// SPOTIFY API FUNCTIONS:
function getUserIdFromToken(token) {
  try {
    // Replace 'your_secret_key' with the actual secret key used to sign your JWT tokens
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId; // Assuming 'userId' is a key in your JWT payload
  } catch (err) {
    console.error('Error decoding token:', err);
    return null; // Return null if token is invalid or an error occurs
  }
}

// Search
app.get('/api/search', async (req, res) => {
  const { query, type = 'track' } = req.query;
  const token = req.headers.authorization?.split(' ')[1];
  let accessToken, refreshToken;

  if (token) {
    // User is authenticated
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).send('Invalid token');
    }

    try {
      // Fetch user data from the database
      const user = await User.findOne({ 'spotify.userId': userId });

      if (user) {
        // User is authenticated via Spotify
        accessToken = user.spotify.accesstoken;
        refreshToken = user.spotify.refreshtoken;
      } else {
        // Use a default access token if the user is not authenticated via Spotify
        accessToken = spotifyAccessToken;
        refreshToken = ''; // Default refresh token may not be needed if access token is valid
      }
    } catch (err) {
      return res.status(500).send('Error fetching user data');
    }
  } else {
    // No authentication provided, use default access token
    accessToken = spotifyAccessToken;
    refreshToken = ''; // No refresh token if no user is logged in
  }

  try {
    const trackInfo = await apiCallWithRetry(accessToken, refreshToken, (token) => searchSpotify(query, token, type), 
      (newToken) => accessToken = newToken, 
      (newRefreshToken) => refreshToken = newRefreshToken
    );

    res.json(trackInfo);
  } catch (error) {
    res.status(500).send('Error fetching track info and lyrics');
  }
});

// Track Information
app.get('/api/track/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let accessToken, refreshToken;

  if (token) {
    // User is authenticated
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).send('Invalid token');
    }

    try {
      // Fetch user data from the database
      const user = await User.findOne({ 'spotify.userId': userId });

      if (user) {
        // User is authenticated via Spotify
        accessToken = user.spotify.accesstoken;
        refreshToken = user.spotify.refreshtoken;
      } else {
        // Use a default access token if the user is not authenticated via Spotify
        accessToken = spotifyAccessToken;
        refreshToken = ''; // Default refresh token may not be needed if access token is valid
      }
    } catch (err) {
      return res.status(500).send('Error fetching user data');
    }
  } else {
    // No authentication provided, use default access token
    accessToken = spotifyAccessToken;
    refreshToken = ''; // No refresh token if no user is logged in
  }

  const trackId = req.params.id;

  try {
    const trackInfo = await apiCallWithRetry(accessToken, refreshToken, (token) => getTrackInfo(trackId, token), 
      (newToken) => accessToken = newToken, 
      (newRefreshToken) => refreshToken = newRefreshToken
    );

    res.json(trackInfo);
  } catch (error) {
    res.status(500).send('Error fetching track info and lyrics');
  }
});


// Lyrics
app.get('/api/lyrics', async (req, res) => {
  const { artistName, trackName } = req.query;
  console.log('got to api/lyrics');
  // decode components, commas, exclamations for api call
  const artist = decodeURIComponent(artistName);
  const track = decodeURIComponent(trackName);

  if (!artistName || !trackName) {
    return res.status(400).send('Missing artistName or trackName');
  }

  const token = req.headers.authorization?.split(' ')[1];
  let accessToken, refreshToken;

  if (token) {
    // User is authenticated
    const userId = getUserIdFromToken(token);
    console.log(userId);

    if (!userId) {
      return res.status(401).send('Invalid token');
    }

    try {
      // Fetch user data from the database
      const user = await User.findOne({ 'spotify.userId': userId });
      console.log('getting user');
      if (user) {
        // User is authenticated via Spotify
        accessToken = user.spotify.accesstoken;
        refreshToken = user.spotify.refreshtoken;
      } else {
        // Use a default access token if the user is not authenticated via Spotify
        accessToken = spotifyAccessToken;
        console.log(spotifyAccessToken);
        refreshToken = ''; // Default refresh token may not be needed if access token is valid
      }
    } catch (err) {
      return res.status(500).send('Error fetching user data');
    }
  } else {
    // No authentication provided, use default access token
    accessToken = spotifyAccessToken;
    console.log('no token: ', spotifyAccessToken);
    refreshToken = ''; // No refresh token if no user is logged in
  }

  try {
    const trackInfo = await apiCallWithRetry(accessToken, refreshToken, (token) => getLyrics(track, artist, token), 
      (newToken) => accessToken = newToken, 
      (newRefreshToken) => refreshToken = newRefreshToken
    );

    res.json(trackInfo);
  } catch (error) {
    res.status(500).send('Error fetching track info and lyrics');
  }
});

// Playlist Tracks
// ex: Top 50 Global Songs
app.get('/api/playlist/:id', async (req, res) => {
  // get id content from params
  const playlistId = req.params.id;
  const token = req.headers.authorization?.split(' ')[1];
  let accessToken, refreshToken;

  if (token) {
    // User is authenticated
    console.log('user is authenticated');
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).send('Invalid token');
    }

    try {
      // Fetch user data from the database
      console.log('getting user from db');
      const user = await User.findOne({ 'spotify.userId': userId });

      if (user) {
        // User is authenticated via Spotify
        accessToken = user.spotify.accesstoken;
        refreshToken = user.spotify.refreshtoken;
      } else {
        // Use a default access token if the user is not authenticated via Spotify
        accessToken = spotifyAccessToken;
        refreshToken = ''; // Default refresh token may not be needed if access token is valid
      }
    } catch (err) {
      return res.status(500).send('Error fetching user data');
    }
  } else {
    // No authentication provided, use default access token
    accessToken = spotifyAccessToken;
    refreshToken = ''; // No refresh token if no user is logged in
  }

  try {
    const trackInfo = await apiCallWithRetry(accessToken, refreshToken, (token) => getPlaylistTracks(playlistId, token), 
      (newToken) => accessToken = newToken, 
      (newRefreshToken) => refreshToken = newRefreshToken
    );

    res.json(trackInfo);
  } catch (error) {
    res.status(500).send('Error fetching track info and lyrics');
  }
});

// User's Playlist Tracks
app.get('/api/my-playlists', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let accessToken, refreshToken;

  if (token) {
    // User is authenticated
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).send('Invalid token');
    }

    try {
      // Fetch user data from the database
      const user = await User.findOne({ 'spotify.userId': userId });

      if (user) {
        // User is authenticated via Spotify
        accessToken = user.spotify.accesstoken;
        refreshToken = user.spotify.refreshtoken;
      } else {
        // Use a default access token if the user is not authenticated via Spotify
        accessToken = spotifyAccessToken;
        refreshToken = ''; // Default refresh token may not be needed if access token is valid
      }
    } catch (err) {
      return res.status(500).send('Error fetching user data');
    }
  } else {
    // No authentication provided, use default access token
    accessToken = spotifyAccessToken;
    refreshToken = ''; // No refresh token if no user is logged in
  }

  try {
    const trackInfo = await apiCallWithRetry(accessToken, refreshToken, (token) => getMyPlaylistTracks(token), 
      (newToken) => accessToken = newToken, 
      (newRefreshToken) => refreshToken = newRefreshToken
    );

    res.json(trackInfo);
  } catch (error) {
    res.status(500).send('Error fetching track info and lyrics');
  }
});


// New Releases
app.get('/api/new-releases', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let accessToken, refreshToken;

  if (token) {
    // User is authenticated
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).send('Invalid token');
    }

    try {
      // Fetch user data from the database
      const user = await User.findOne({ 'spotify.userId': userId });

      if (user) {
        // User is authenticated via Spotify
        accessToken = user.spotify.accesstoken;
        refreshToken = user.spotify.refreshtoken;
      } else {
        // Use a default access token if the user is not authenticated via Spotify
        accessToken = spotifyAccessToken;
        refreshToken = ''; // Default refresh token may not be needed if access token is valid
      }
    } catch (err) {
      return res.status(500).send('Error fetching user data');
    }
  } else {
    // No authentication provided, use default access token
    accessToken = spotifyAccessToken;
    refreshToken = ''; // No refresh token if no user is logged in
  }

  try {
    const trackInfo = await apiCallWithRetry(accessToken, refreshToken, (token) => getPlaylistTracks(playlistId, token), 
      (newToken) => accessToken = newToken, 
      (newRefreshToken) => refreshToken = newRefreshToken
    );

    res.json(trackInfo);
  } catch (error) {
    res.status(500).send('Error fetching track info and lyrics');
  }
});


// Direct routing to react client side router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));
});
const PORT = 8080;
app.listen(PORT, function() {
  console.log('Listening on http://localhost:'+PORT);
});
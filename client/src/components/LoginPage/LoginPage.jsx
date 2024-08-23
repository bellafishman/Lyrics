import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  // change once in production!!!!!
  const apiUrl = import.meta.env.VITE_API_URL;

  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const [error, setError] = useState(null);

  const handleSpotifyLogin = () => {
    // backend has cors permisison to spotify sign in
    window.location.href = `${apiUrl}/api/spotify-login`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${apiUrl}/api/login`, { email, password })
        .then(response => {
          const { token, refreshtoken } = response.data;
          console.log("frontend token: ", token);
          localStorage.setItem('ALLEARS-token', token);
          localStorage.setItem('ALLEARS-refreshtoken', refreshtoken);
          // Handle success, e.g., redirect to another page or show a success message
          window.location.href = `https://lyrics-lake.vercel.app/?token=${token}`; // Redirect to homepage
        })
        .catch(err => {
            console.error('Error:', err);
            setError(err.response?.data?.message || err.message);
        });
  };


  return (
    <div className='Login-Container'>
      {error && (
        <div className='error'>
            {error}
        </div>
      )}
      <div className="Login">
        <div className='Login-head'>
          <Link to="/" className="Login-Name" aria-label="Home">All Ears</Link>
          <button 
            onClick={handleSpotifyLogin}
            className='spotify'  
              >Connect Your Spotify Account</button>
        </div>
        <h3>Enter your login credentials</h3>
        <form onSubmit={handleSubmit}>
          <label className='LoginLabel' htmlFor="first">Username:</label>
          <input 
                className='LoginInput'
                type="text" 
                id="email" 
                name="email" 
                placeholder="Enter your Email" 
                required 
                onChange={(e) => setEmail(e.target.value)}
          />

          <label className='LoginLabel' htmlFor="password">Password:</label>
          <input 
            className='LoginInput'
            type="password"
            id="password" 
            name="password"
            placeholder="Enter your Password" 
            required 
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="wrap">
            <button 
              className='LoginButton'
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>
        <p>
          Not registered?
          <Link 
            to="/signup"
            style={{ textDecoration: 'none' }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

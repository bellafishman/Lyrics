import React,  {useState} from 'react';
import { Link } from 'react-router-dom';
// allow connection to mongodb
import axios from 'axios'

export default function SignUpPage() {
    // change once in production!!!!!
    const apiUrl = import.meta.env.VITE_API_URL;

    const [name, setName] = useState();
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();

    const [error, setError] = useState(null);

    const handleSpotifyLogin = async () => {
        // backend has cors permisison to spotify sign in
        window.location.href = `${apiUrl}/api/spotify-login`;  
    };


    const handleSubmit = (e) => {
      e.preventDefault();
      axios.post(`${apiUrl}/api/signup`, { email, name, password })
        .then(response => {
          const { token, refreshtoken } = response.data;
          console.log("frontend token: ", token);
          if (token) {
            // Store the token and redirect manually
            localStorage.setItem('ALLEARS-token', token);
            localStorage.setItem('ALLEARS-refreshtoken', refreshtoken);
            window.location.href = `http://localhost:5173/?token=${token}`;
          }
        })
        .catch(err => {
          console.error('Error:', err.response?.data?.message || err.message);
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
        <h1 className='Login-Name'>All Ears</h1>
        <h3>Sign Up for New Music Experience!</h3>
        <button
            onClick={handleSpotifyLogin}
            className='spotify
            '>Sign Up with Spotify Here!</button>
        <form onSubmit={handleSubmit}>

            <label className='LoginLabel' htmlFor="email">Email:</label>
            <input 
                className='LoginInput'
                type="text" 
                id="email" 
                name="email" 
                placeholder="Enter your Email" 
                required 
                onChange={(e) => setEmail(e.target.value)}
            />
            <label className='LoginLabel' htmlFor="first">Username:</label>
            <input 
                className='LoginInput'
                type="text" 
                id="first" 
                name="first" 
                placeholder="Enter a Username" 
                required 
                onChange={(e) => setName(e.target.value)}
            />

            <label className='LoginLabel' htmlFor="password">Password:</label>
            <input 
                className='LoginInput'
                type="password"
                id="password" 
                name="password"
                placeholder="Enter a Password" 
                required 
                onChange={(e) => setPassword(e.target.value)}
            />

            <div className="wrap">
                <button 
                    className='LoginButton'
                    type="submit"
                >
                    Sign Up!
                </button>
            </div>
        </form>
      </div>
    </div>
    );
}

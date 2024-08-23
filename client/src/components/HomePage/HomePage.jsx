import React from 'react'
import { useEffect, useState } from 'react' 
import Suggestions from './Suggestions'
import HomeHeader from './HomeHeader'
import { useNavigate } from 'react-router-dom'; 

export default function HomePage() {
  // change once in production!!!!!
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log("APIUrl: ", apiUrl);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("user"); // default is user

  const navigate = useNavigate()
  useEffect(() => {
    const fetchUserData = async () => {
      // Extract token from URL
      const queryParams = new URLSearchParams(window.location.search);
      let token = queryParams.get('token');
      let refreshToken = queryParams.get('refreshtoken');

      if (token) {
        // Store token in local storage
        localStorage.setItem('ALLEARS-token', token);
      } else {
        // Retrieve token from local storage
        token = localStorage.getItem('ALLEARS-token');
        // Redirect to login page if no token found
        if (!token) {
          navigate('/login'); // redirect to login page
          return;
        }
      }
      if (refreshToken) {
        localStorage.setItem('ALLEARS-refresh-token', refreshToken);
      }
      console.log("got token: ", token);
      try {
        // Call API to get user data
        let response = await fetch(`${apiUrl}/user/data`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // token in the Authorization header
          },
        });

        // refresh token if needed
        if (response.status === 401) {
          // Token might be expired, try refreshing
          const refreshResponse = await fetch(`${apiUrl}/api/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
    
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('ALLEARS-token', data.token);
            // Retry the original request with the new access token
            response = await fetch(`${apiUrl}/user/data`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${data.token}`, // token in the Authorization header
              },
            });
          }
          else {
            console.error('Error fetching user data:', error);
          }
        }

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        console.log(data);

        setUser(data); // Set user data
        setUserName(data.name);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false); // Set loading to false after data fetch
      }
    };

    fetchUserData();
  }, [navigate]); // navigate is a dependency
  

  // Handle Different API Calls for Suggested Songs, Artists ...
  const handleApiCall = async (type, id = null) => {
    // change url based on type inputted
    let url = '';
  
    if (type === 'playlist') {
      url = `${apiUrl}/api/playlist/${id}`;
    } 
    else if (type === 'my-playlists') {
      url = `${apiUrl}/api/my-playlists`;
    } 
    else if (type === 'new-releases') {
      url = `${apiUrl}/api/new-releases`;
    } 
    else {
      // handle other cases or set a default
      url = `${apiUrl}/api/default-endpoint`;
    }
    try {
      const response = await fetch(url);
      const data = await response.json();
      // Process or set the state with the data
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


  return (
    <div>
      
      <HomeHeader 
        userName={userName} 
      />
      
    
      
      <div className='suggestions'>
        {/* when user is loaded, load their first 50 liked songs and some mroe unique user playlists ... */}
        {user && (
          <div>
            <Suggestions 
              handleApiCall={() => handleApiCall("my-playlists")}
            /> 
            <Suggestions 
              handleApiCall={() => handleApiCall("my-playlists")}
            /> 
          </div>
          )}
        {/*Top 50*/}
        <Suggestions 
          handleApiCall={() => handleApiCall("playlist", "37i9dQZF1DXcBWIGoYBM5M")}
        /> 
        {/*New Music Friday*/}
        <Suggestions 
          handleApiCall={() => handleApiCall("playlist", "37i9dQZF1DX4JAvHpjipBk")}
        />
        {/*Hot Country*/}
        <Suggestions 
          handleApiCall={() => handleApiCall("playlist", "37i9dQZF1DX1lVhptIYRda")}
        />
        {/*Rap Caviar*/} 
        <Suggestions 
          handleApiCall={() => handleApiCall("playlist", "37i9dQZF1DX0XUsuxWHRQd")}
        />

      </div>

    </div>
  )
}

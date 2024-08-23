import React, { useEffect, useState } from 'react'
import Suggestions from './Suggestions'


export default function SuggestionsContainer(props) {
  const {apiUrl} = props;

  // display loading sign until all components Suggestions have loaded
  const [loadingStatus, setLoadingStatus] = useState([true, true, true, true]);

  // update loading status for each Suggestions
  const handleLoadingComplete = (index) => {
    setLoadingStatus((prevStatus) => {
        const newStatus = [...prevStatus];
        newStatus[index] = false;
        return newStatus;
    });
  };

  // all Loaded if all are false
  const allLoaded = loadingStatus.every(status => !status);

  // Handle Different API Calls for Suggested Songs, Artists ...
  const handleApiCall = async (type, id = null) => {
    // change url based on type inputted
    let url = '';
  
    if (type === 'playlist') {
      url = `${apiUrl}/api/playlist/${id}`;
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
    <div className='suggestionsContainer'>
      {allLoaded ? (
      <div className='suggestions'>
          {/*Top 50*/}
          <Suggestions 
            handleApiCall={() => handleApiCall("playlist", "37i9dQZF1DXcBWIGoYBM5M")}
            onLoaded={() => handleLoadingComplete(0)}
          /> 
          {/*New Music Friday*/}
          <Suggestions 
            handleApiCall={() => handleApiCall("playlist", "37i9dQZF1DX4JAvHpjipBk")}
            onLoaded={() => handleLoadingComplete(1)}
          />
          {/*Hot Country*/}
          <Suggestions 
            handleApiCall={() => handleApiCall("playlist", "37i9dQZF1DX1lVhptIYRda")}
            onLoaded={() => handleLoadingComplete(2)}
          />
          {/*Rap Caviar*/} 
          <Suggestions 
            handleApiCall={() => handleApiCall("playlist", "37i9dQZF1DX0XUsuxWHRQd")}
            onLoaded={() => handleLoadingComplete(3)}
          />
      </div>
      ) : (
        /* HTML: <div class="loader"></div> */
        <div className="loader"></div>
      )}
    </div>
  )
}

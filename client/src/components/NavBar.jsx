import React, {useState} from 'react'
import { Link } from 'react-router-dom'
import Search from './HomePage/Search';
import SearchResults from './HomePage/SearchResults';

export default function NavBar() {
  // change once in production!!!!!
  const apiUrl = import.meta.env.VITE_API_URL;


  // Search
  const [searchValue, setSearchValue] = useState('');

  // display or no display search dropdown
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  // SearchResults
  const [searchResults, setSearchResults] = useState([]);
  // Search API Call
  const handleApiSearch = async (newSearch) => {
      // error case: no call if newSearch is empty
      if (!newSearch.trim()) {
          console.log('Search query is empty. No API call made.');
          return;
      }
      try {
        const token = localStorage.getItem('ALLEARS-token');
        const response = await fetch(`${apiUrl}/api/search?query=${newSearch}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
            'Content-Type': 'application/json'  // Ensure content type is JSON
          }
        });
        const data = await response.json();
        console.log("Returned data: ", data);

        // process and parse data here?

        setSearchResults(data);
        setIsOverlayVisible(true);
      } catch (error) {
          console.error('Error fetching data:', error);
      }   
  };

  const openOverlay = () => {
      setIsOverlayVisible(true);
  };

  const closeOverlay = () => {
      setIsOverlayVisible(false);
  };

  return (
    <header className='NavBar'> 
      <nav>
        
        <Link to="/" className="NavBar-HomeLink" aria-label="Home">
          <img className='NavBar-logo' src='/imgs/logo.png' />
          <strong className='NavBar-Name'>All Ears</strong></Link>

        <div className='searchContent'>
          <button className='searchButton' onClick={openOverlay}>
              <i className="fa-solid fa-magnifying-glass"></i> 
          </button>

          {isOverlayVisible && (
              <div className={`search-overlay visible`}>
                  <div className='search-results-container'>
                      <button onClick={closeOverlay} className='close-button'>
                          <i className="fa-solid fa-xmark"></i>
                      </button>
                      <Search 
                          handleApiSearch={handleApiSearch}
                          searchValue={searchValue} 
                          setSearchValue={setSearchValue}/>
                      <SearchResults searchResults={searchResults} />
                  </div>
              </div>
          )}
        </div>
        
        <Link to="/login" className='NavBar-Login' aria-label="Login">Login</Link>
      </nav>
    </header>
  )
}

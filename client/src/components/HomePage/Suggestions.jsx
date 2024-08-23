import React, { useEffect, useState } from 'react'
// allow me to send info to songpage through url with onClick event to not mess with css styling
import { useNavigate } from 'react-router-dom';

{ /*
use infinite scrolling pagnation to allow users to access more music from suggestions
without taking time to load everything at once
*/}

const Suggestions = ({ handleApiCall }) => {
  const [results, setResults] = useState({ name: '', tracks: { items: [] } });
  // infinite scrolling parameters:
  const [page, setPage] = useState(0);
  // default 5 items but chages for small screens
  const [itemsPerPage, setItemsPerPage] = useState(5); 
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 768) { // Small screens, e.g., mobile
        setItemsPerPage(3);
      } else if (window.innerWidth < 992) { // Medium screens, e.g., tablets
        setItemsPerPage(4);
      } else { // Large screens, e.g., desktops
        setItemsPerPage(5);
      }
    };
    updateItemsPerPage(); // Set initial value
    window.addEventListener('resize', updateItemsPerPage); // Update on window resize

    return () => {
      window.removeEventListener('resize', updateItemsPerPage); // Cleanup on component unmount
    };
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      const data = await handleApiCall();
      setResults(data);
      // Assuming data contains the total number of items, calculate pages
      setTotalPages(Math.ceil(data.tracks.items.length / itemsPerPage));
    };
    fetchData();
  }, [handleApiCall]);

  const navigate = useNavigate();
  const onTrackClick = (trackId, artists, track) => {
    // Navigate to the song-specific page
    navigate(`/song/${trackId}?artist=${encodeURIComponent(artists)}&track=${encodeURIComponent(track)}`);
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(prevPage => prevPage - 1);
    }
  };

  // Get current page items
  const getPaginatedTracks = () => {
    const startIndex = page * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return results.tracks.items.slice(startIndex, endIndex);
  };

  return (
    <div className='suggestion'>
      <p className='suggestion-title'>{results.name}</p>

      <div className='suggestion-content'>
        <button onClick={handlePrevPage} disabled={page === 0} className='suggestionsPrev suggestionsScroll'>
          <i className={`fa-solid fa-chevron-left ${page == 0 ? 'hidden-icon' : ''}`}></i>
        </button>

        <div className='track-container'>
          {getPaginatedTracks().map(item => {
            const track = item.track;
            const albumCover = track.album.images[0]?.url;
            const artists = track.artists.map(artist => artist.name).join(', ');

            return (
              <button 
                key={track.id} 
                className='track'
                onClick={() => onTrackClick(track.id, track.artists[0].name, track.name)}>

                <img src={albumCover} alt={`${track.name} album cover`} className='album-cover'/>
                <div className='track-info'>
                    <p className='track-name'>{track.name}</p>
                    <p className='track-artists'>{artists}</p>
                </div>

              </button>
            );
          })}
        </div>

        <button onClick={handleNextPage} disabled={page >= totalPages - 1} className='suggestionsNext suggestionsScroll'>
          <i className={`fa-solid fa-chevron-right ${page >= totalPages - 1 ? 'hidden-icon' : ''}`}></i>
        </button>
      </div>
    </div>
  )
};

export default Suggestions;

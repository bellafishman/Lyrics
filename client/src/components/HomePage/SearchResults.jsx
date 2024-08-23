import React from 'react'
// similar to Suggestions to link to songpage specific
import { useNavigate } from 'react-router-dom';

export default function SearchResults(props) {
  const { searchResults } = props
  
  if (!searchResults || !searchResults.tracks || !Array.isArray(searchResults.tracks.items)) {
    return (<div className='no-results'>Search For Results!</div>
  )};

  const navigate = useNavigate();
  const onTrackClick = (trackId, artists, track) => {
    // Navigate to the song-specific page
    navigate(`/song/${trackId}?artist=${encodeURIComponent(artists)}&track=${encodeURIComponent(track)}`);
  };


  return (
    <div className='searchResults'>
      {searchResults.tracks.items.map((track) => {
        const albumCover = track.album.images[2]?.url;
        const albumName = track.album.name;
        const artists = track.artists.map(artist => artist.name).join(', ');

        return (
          <button 
            key={track.id} 
            className='search-track'
            onClick={() => onTrackClick(track.id, track.artists[0].name, track.name)} >
            <img src={albumCover} alt={`${track.name} album cover`} className='search-album-cover'/>
            <div className='search-track-info'>
              <p className='search-track-name'>{track.name}</p>
              <p className='search-track-artists'>{artists}</p>
              <p className='search-album-name'>{albumName}</p>
            </div>
          </button>
        );
      })}      
    </div>
  )
}

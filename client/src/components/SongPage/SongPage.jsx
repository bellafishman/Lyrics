import React, {useState, useEffect} from 'react'
// useParams to access the spotifyTrackId, artistName, & songName from the URL
import { useParams, useSearchParams } from 'react-router-dom';
import Header from './Header';
import Lyrics from './Lyrics';
import SideBar from './SideBar';
import Loading from '../Loading';
import Error from '../Error';

export default function SongPage() {

  const { trackId } = useParams();
  // ending up having to use searchParams to send all of the data
  const [searchParams] = useSearchParams();
  const artistName = searchParams.get('artist');
  const trackName_OG = searchParams.get('track');

  // Remove any "(Feat. ...)" or "(feat. ...)" from the track name
  const trackName = trackName_OG.replace(/\(feat\..*\)/i, '').trim();


  // ADD ERROR CASE FOR NO SONG SELECTED
  if (!trackId) {
    return <p>oops... We dont have that song!</p>;
  }

  const apiUrl = import.meta.env.VITE_API_URL;


  const [selectedLine, setSelectedLine] = useState(null);
  /* default is false, no showing modal sidebar*/
  const [showModal, setShowModal] = useState(false);

  function handleToggleModal() {
    /* reverts value for showModal state */
    setShowModal(!showModal)
  }

  // get lyrics and some track info
    // like album cover, album name, all artists, etc
  const [trackInfo, setTrackInfo] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('loading track info')
      try {
        // encode artist and track name in url search params to send to api
        const queryParams = new URLSearchParams({
          artistName: encodeURIComponent(artistName),
          trackName: encodeURIComponent(trackName),
        }).toString();
        const token = localStorage.getItem('ALLEARS-token');
        // Fetch track info and lyrics in parallel
        const responses = await Promise.all([
          fetch(`${apiUrl}/api/track/${trackId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then(res => res.json()),
          
          fetch(`${apiUrl}/api/lyrics?${queryParams}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then(res => res.json())
        ]);



        const [trackData, lyricsData] = responses;


        // extract important track Info like artists, album cover, etc
        const extractTrackData = {
          name: trackName,
          album: trackData.album.name,
          albumCover: trackData.album.images[0].url,
          albumType: trackData.album.album_type,
          albumLink: trackData.album.external_urls,
          artists: trackData.artists.map(artist => artist.name).join(', '),
          artistsIds: trackData.artists.map(artist => artist.id).join(', '),
          duration: trackData.duration_ms,
          previewUrl: trackData.preview_url
        };
        
        // set lyrics and trackinfo
        console.log(" got all info! ")
        setTrackInfo(extractTrackData);
        setLyrics(lyricsData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trackId, artistName, trackName]);


  // add a loading and error state ...... 
  if (loading) 
    return 
      <Loading />

  if (error)
    return <Error />

  return (
    <div>
      <Header
        trackInfo={trackInfo}
      />
      <Lyrics 
        lyrics={lyrics}
        setSelectedLine={setSelectedLine} 
        handleToggleModal={handleToggleModal} 
      />
      
      {showModal && 
        (<SideBar 
          handleToggleModal={handleToggleModal} 
          lyricId={selectedLine}
          trackId={trackId}
          apiUrl={apiUrl}/>)}
    </div>
  )
}

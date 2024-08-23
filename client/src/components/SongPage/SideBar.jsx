import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';

export default function SideBar(props) {

  const {handleToggleModal, lyricId, trackId, apiUrl} = props;

  const [commentText, setCommentText] = useState('');
  const [lyricComments, setLyricComments] = useState([]);
  const [userid, setUserid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // call api to get song lyric index comments
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user token from token in localStorage
        // if not logged in, can only see comments, not make them
        const token = localStorage.getItem('ALLEARS-token');
        let userId = null;
        if (token) {
          const decodedToken = jwtDecode(token);
          userId = decodedToken?.userId;
          setUserid(userId);
        }


        // Fetch lyric comments from the API
        const response = await axios.get(`${apiUrl}/api/lyriccomments/${trackId}/${lyricId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        //console.log("Cleint responde: ", response);
        //console.log("Cleint responde.data: ", response.data);
        if (response.data) {
          setLyricComments(response.data.comments);
        } else {
          setLyricComments([]);
        }

        console.log("Got all info!");
      } catch (err) {
        setError(err);
        console.error('Error fetching lyric comments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trackId, lyricId]);



  // handle posting new comments ....
  const handleCommentSubmit = async () => {
    if (commentText.trim() === '') return; // need actual text in comment

    try {
      let token = localStorage.getItem('ALLEARS-token')
      const response = await fetch(`${apiUrl}/api/postlyriccomments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          commentText,
          userId: String(userid),
          trackId,
          lyricId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const newComment = await response.json();
      setLyricComments([...lyricComments, newComment]); // Update comments list and show user that comment is sent
      setCommentText(''); // Clear the textarea
    } catch (error) {
      setError(error.message);
    }
  };


  return (
    <div className='sidebar'>
      <div className='sidebarContents'>
        <button className='sidebarExit' onClick={handleToggleModal}>
            <i className="fa-solid fa-xmark"></i>
        </button>
      
        {/* Render lyrics comments here */}
        {lyricComments.length > 0 ? (
          <div className='commentContainer'>
            {lyricComments.map((comment, index) => (
              <div c
                className='comment' 
                key={index}>
                <strong>{comment.username}</strong>: {comment.comments}
              </div>
            ))}
          </div>
        ) : (
          <p>No comments available.</p>
        )}
        {/* comment area if user is sign in */}
        {userid && (
          <div className="add-lyriccomments">
            <textarea
              className='textarea'
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}>
            </textarea>
            <button 
              className="submitComment"
              onClick={handleCommentSubmit}>
              <i class="fa-regular fa-paper-plane"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import React from 'react'

export default function Lyrics(props) {
  const {lyrics, setSelectedLine, handleToggleModal } = props;
  

  if (!lyrics) {
    console.log('no lyrics passed to Lyrics');
    return;
  }
  const lyricLines = lyrics.split('\n');

  return (
    <div className='lyrics'>
      {lyricLines.map((line, index) => {
        // for line breaks 
        if (line.trim() === '') {
          // Render an empty <p> for line breaks
          return <p key={index} className='lyric-break'></p>;
        }
        return (
          <div key={index} >
            <button 
              className='lyric-line' 
              onClick={() => 
                {setSelectedLine(index);
                  handleToggleModal();
            }}>
                <p>{line}</p>
            </button>
          </div>
        );
      })}      
    </div>
  )
}

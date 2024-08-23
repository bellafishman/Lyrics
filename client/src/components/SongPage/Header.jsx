import React, { useEffect, useState } from 'react'
import NavBar from '../NavBar';

export default function Header(props) {
  const {trackInfo} = props;

  return (
    <div className='LyricHeader'>
      <NavBar />
      <div className='lyric-header'>
        <img src={trackInfo.albumCover} alt={`${trackInfo.name} album cover`} className='Lyric-album-cover'/>
        <div className='lyric-info'>
          <h2 className='lyric-trackname'>{trackInfo.name}</h2>
          <h3 className='lyric-trackartists'>{trackInfo.artists}</h3>
          <p className='lyric-albuminfo'>{`${trackInfo.albumType.toUpperCase()}: ${trackInfo.album}`}</p>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'

export default function Error() {
  return (
    <div>
        oops ... An error occured
        Reload the page or head back to <Link className='Login-Name' to='/'>All Ears</Link>
    </div>
  )
}

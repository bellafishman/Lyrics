import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link  } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import LoginPage from './components/LoginPage/LoginPage';
import SongPage from './components/SongPage/SongPage';
import SignUpPage from './components/LoginPage/SignUpPage';
import Error from './components/Error';

function App() {

  return (
      <Router>
          {/* A <Routes> looks through its children <Route>s and
              renders the first one that matches the current URL. */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />}/>
            <Route path="/index" element={<HomePage />}/>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/song/:trackId" element={<SongPage />} />
            <Route path="/error" element={<Error />} />
          </Routes>

      </Router>
  )
}

export default App

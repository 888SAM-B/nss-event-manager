import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

import Home from './components/home.jsx'
import Login from './components/login.jsx'
import CollegeDashboard from './components/college-dashboard.jsx'
import { UserProvider } from './context/UserContext.jsx'

function App() {
  return (
    <UserProvider>
      <div>
        <Routes>
          <Route path='/' element={<Home />} ></Route>
          <Route path='/login' element={<Login />} ></Route>
          <Route path='/college-dashboard' element={<CollegeDashboard />} ></Route>
          <Route path='*' element={<h1>404 Not Found</h1>} ></Route>

        </Routes>
      </div>
    </UserProvider>
  )
}

export default App

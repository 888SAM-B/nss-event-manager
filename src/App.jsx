import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

import Home from './components/home.jsx'
import Login from './components/login.jsx'
import CollegeDashboard from './components/college-dashboard.jsx'
import { UserProvider } from './context/UserContext.jsx'
import UnitLogin from './components/unitLogin.jsx'
import UnitDashboard from './components/unitDashboard.jsx'
import AddEvent from './components/add-event.jsx'
import ExploreEvents from './components/explore-event.jsx'

function App() {
  return (
    <UserProvider>
      <div>
        <Routes>
          <Route path='/' element={<Home />} ></Route>
          <Route path='/login' element={<Login />} ></Route>
          <Route path='/college-dashboard' element={<CollegeDashboard />} ></Route>
          <Route path='/unit-login' element={<UnitLogin />} ></Route>
          <Route path='/unit-dashboard' element={<UnitDashboard />} ></Route>
          <Route path='/events' element={<AddEvent />} ></Route>
          <Route path='/explore-events' element={<ExploreEvents />} ></Route>``
          <Route path='*' element={<h1>404 Not Found</h1>} ></Route>

        </Routes>
      </div>
    </UserProvider>
  )
}

export default App

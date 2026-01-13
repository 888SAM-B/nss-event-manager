import { useEffect, useState } from 'react'
import {Routes,Route} from 'react-router-dom'
import './App.css'

import Home from './components/home.jsx'
function App() {
  return (
    <>
     <div>
      <Routes>
        <Route path='/' element={<Home/>} ></Route>
       
        <Route path='*' element={<h1>404 Not Found</h1>} ></Route>

      </Routes>
     </div>
    </>
  )
}

export default App

import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios';

const exploreEvents = () => {
  const location = useLocation();
  const collegeCode = location.state.collegeCode;
  const unitCode = location.state.unitCode;

  useEffect(() => {
    const getEvents = async () => {
      const getEvents = await axios.get(`${import.meta.env.VITE_API_URL}/getEvents/${collegeCode}/${unitCode}`)

      console.log(getEvents.data);
      console.log(getEvents.data.unitEvents);
      console.log(getEvents.data.collegeEvents);
      console.log(getEvents.data.otherEvents);
    }
    getEvents();
  }, [])

  return (
    <div>
      <h1>{collegeCode}</h1>
      <h1>{unitCode}</h1>

      <div className="event-card">

      </div>
    </div>
  )
}

export default exploreEvents
import React from 'react'
import Banner from './Banner.jsx'
import Src from './Src.jsx'
import Events from './Events.jsx'
import Schedule from './Schedule.jsx'
import Aiche from './Aiche.jsx'
import Sponsors from './Sponsors.jsx'
import Teams from './Teams.jsx'
import Faq from './Faq.jsx'
import './Main.css'

const Main = () => {
  return (
    <div className="home-container">
      <Banner />
      <Sponsors />
      <Src />
      <Events />
      {/* <Schedule /> */}
      <Aiche/>
      <Teams />
      <Faq />
    </div>
  )
}

export default Main

import React from 'react'
import Banner from './Banner.jsx'
import NotebookFeature from './NotebookFeature.jsx'
import Src from './Src.jsx'
import Aiche from './Aiche.jsx'
import Events from './Events.jsx'
import Sponsors from './Sponsors.jsx'
import Teams from './Teams.jsx'
import Faq from './Faq.jsx'
import './Main.css'
import './animations.css'

const Main = () => {
  return (
    <>
      <Banner />
      <NotebookFeature />
      <Sponsors />
      <Src />
      <Aiche />
      <Events />
      <Teams />
      <Faq />
    </>
  )
}

export default Main

import React from "react"
import Navbar from "../components/Navbar"
import AllImages from "../components/Gallery/AllImages"
import AnnouncementBar from '../components/AnnouncementBar';
import CustomCursor from "../components/common/CustomCursor";


const Gallery = () => {
  return (
    <div className="bg-black font-Lato">
      <CustomCursor/>
      <div className="h-[80vh]flex flex-col">
        <AnnouncementBar />
        <Navbar />
        <AllImages />
      </div>
    </div>
  )
}

export default Gallery

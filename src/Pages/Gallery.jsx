import React from "react"
import Navbar from "../components/Navbar"
import AllImages from "../components/Gallery/AllImages"
import AnnouncementBar from '../components/AnnouncementBar';
import CustomCursor from "../components/common/CustomCursor";


const Gallery = () => {
  return (
    <div className="bg-black font-sans min-h-screen w-full relative overflow-x-hidden">
      <CustomCursor/>
      <div className="flex flex-col">
        <AnnouncementBar />
        <Navbar />
        <AllImages />
      </div>
    </div>
  )
}

export default Gallery

import React from "react"
import EventsPage from "../components/Events/EventsPage"
import Navbar from "../components/Navbar"
import AnnouncementBar from "../components/AnnouncementBar"
import ContactUs from "../components/ContactUs"
import CustomCursor from "../components/common/CustomCursor";

const Events = () => {
  return (
    <div className="bg-black font-Lato">
      <CustomCursor/>
      <AnnouncementBar />
      <Navbar />
      <EventsPage />
      <ContactUs />
    </div>
  )
}

export default Events

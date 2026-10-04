import React from "react"
import Navbar from "../components/Navbar"
import ProfileCard from "../components/Committee/ProfileCard"
import Departments from "../components/Committee/Departments"
import ContactUs from "../components/ContactUs"
import AnnouncementBar from '../components/AnnouncementBar';

export default function DepartmentPage(props) {
  let { heading, heads, core } = props
  // console.log(heading)

  console.log(heading.includes("&"))

  if (heading.includes("&")) {
    heading = heading.split("&")
  }

  return (
    <div className="bg-black font-sans overflow-x-hidden min-h-screen w-full relative">
      <div className="flex min-h-[50vh] sm:min-h-[60vh] flex-col bg-black">
        <AnnouncementBar />
        <Navbar />
        <div
          className={`
        mt-24 sm:mt-36 bg-black px-4 sm:px-8
        ${heading.length === 2 ? "btwnMdAndLg:mt-24" : "btwnMdAndLg:mt-32"}
         btwnMdAndLg:px-12 lg:px-16 xl:px-20`}
        >
          <div className="text-center max-w-7xl mx-auto">
            <h1 className="font-Bebas text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] tracking-tight sm:tracking-wider leading-[0.95] uppercase text-primary text-center max-w-full break-words">
              {heading.length === 2 ? (
                <>
                  {heading[0]}
                  <br />
                  &
                  <br />
                  {heading[1]}
                </>
              ) : (
                heading
              )}
            </h1>
          </div>
        </div>
      </div>
      <ProfileCard data={heads} heading={"Heads"} />
      {core && core.length > 0 && <ProfileCard data={core} heading={"Core"} />}
      <Departments />

      {/* Footer */}
      <ContactUs />
    </div>
  )
}

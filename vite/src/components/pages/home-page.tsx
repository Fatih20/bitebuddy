import React, { useEffect, useState } from "react"
import PageContainer from "../custom/page-container"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { useNavigate } from "react-router"
import Cookies from "js-cookie"
import { CookieConfig } from "@/_config/cookie-config"

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if(Cookies.get(CookieConfig.COOKIE_AUTH)){
      setIsAuthenticated(true)
    }
  }, [])

  const handleAuth = () => {
    Cookies.set(CookieConfig.COOKIE_AUTH, "true")
    window.location.reload();
  }
  
  const handleChat = () => {
    navigate('/chat')
  }
  
  if (isAuthenticated){
    return (
      <>
        <PageContainer>
          <Card className="bg-accentSecondary mx-4 rounded-[0.5rem] mt-6">
          <CardContent className="my-3 py-0 flex justify-between items-center">
            <div>
              <CardTitle className="text-primary-foreground text-xl">BuddyAI</CardTitle>
              <CardDescription>Ask us for recommendations...</CardDescription>
            </div>
            <Button size={"icon"} variant={"accent"} onClick={handleChat}>
              <img src="arrowforward.svg"/>
            </Button>
          </CardContent>
          </Card>
        </PageContainer>
      </>
    )
  }
  else{
    return (
      <>
        <PageContainer>
          <div className="relative flex flex-col w-full h-full">
            <div className="absolute inset-0 bg-accent flex items-start justify-center z-10">
              <img src="bitebuddy_crowd.svg" className="h-full" alt="illustration of a crowd"/>
            </div>

            <div className="flex-grow"/>
            <Card className="relative z-20 rounded-t-[2.5rem] rounded-b-none">
              <CardHeader className="pb-2">
                <CardTitle className="pt-6 text-[1.5rem] mx-4">Bite Buddy For Hackjakarta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mx-4 text-md">This project is made for the Hackjakarta hackathon. Some functions are not available as our goal is to relicate an actual food delivery service. Please enjoy and have fun with our app!</p>
              </CardContent>
              <CardFooter className="pt-6">
                <Button variant={"secondary"} className="w-full mx-2 text-lg py-6" onClick={handleAuth}>Start as Guest</Button>
              </CardFooter>
            </Card>
          </div>
        </PageContainer>
      </>
    )
  }
}

export default HomePage

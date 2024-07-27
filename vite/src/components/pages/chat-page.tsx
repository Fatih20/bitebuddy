import React, { useEffect, useState } from "react"
import PageContainer from "../custom/page-container"
import { Button } from "../ui/button"
import { useNavigate } from "react-router"
import Cookies from "js-cookie"
import { CookieConfig } from "@/_config/cookie-config"
import { Input } from "../ui/input"
import ChatBox from "../custom/chat-box"
import { Chat, ChatType } from "@/lib/types/Chat"
import { Switch } from "../ui/switch"
import { Toggle } from "../ui/toggle"

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [talkback, setTalkback] = useState<boolean>(false);
  const [isNotFirstTime, setIsNotFirstTime] = useState(false);

  useEffect(() => {
    if(!Cookies.get(CookieConfig.COOKIE_AUTH)){
      navigate('/')
    }
    if(Cookies.get(CookieConfig.COOKIE_TALKBACK)){
      setIsNotFirstTime(true)
      setTalkback(Cookies.get(CookieConfig.COOKIE_TALKBACK) === "true")
    }

    const newChat = {
      type: ChatType.TEXT,
      text: 'This is a user message',
      isUser: true,
    };
    const newChat2 = {
      type: ChatType.TEXT,
      text: 'This is a server message',
      isUser: false,
    };

    if(chats.length === 0){
      setChats((prevChats) => [...prevChats, newChat])
      setChats((prevChats) => [...prevChats, newChat2])
    }
  }, [])
  
  const handleBack = () => {
    navigate(-1)
  }

  const handleTalkbackSwitch = () => {
    if(talkback){
      Cookies.set(CookieConfig.COOKIE_TALKBACK, "false")
      setTalkback(false)
    } else{
      Cookies.set(CookieConfig.COOKIE_TALKBACK, "true")
      setTalkback(true)
    }
  }

  const handleDismiss = () => {
    Cookies.set(CookieConfig.COOKIE_TALKBACK, "false")
    window.location.reload();
  }
  
  const handleTalkbackOn = () => {
    Cookies.set(CookieConfig.COOKIE_TALKBACK, "true")
    window.location.reload();
  }
  
  if (isNotFirstTime){
    return (
      <>
        <PageContainer>
          <div className="w-full h-full flex flex-col">
            <div className="bg-accent h-[3.5rem] flex items-center">
              <div className="flex-grow h-full flex items-center">
                <Button className="absolute bg-transparent hover:bg-accentSecondary" onClick={handleBack}>
                  <img src="arrowleft.svg"/>
                </Button>
              </div>
              <p className="text-white text-xl">Talk To Chatbot</p>
              <div className="flex-grow h-full flex items-center justify-end">
                <Button className={`absolute mr-4 bg-transparent hover:bg-accentSecondary`} size={"icon"} onClick={handleTalkbackSwitch}>
                  <img src={`${talkback? "mic.svg" : "arrowforward.svg"}`} className={`${talkback? "" : "opacity-50"}`}/>
                </Button>
              </div>
            </div>
            <ChatBox chats={chats}/>
            <div className="bg-accent h-[2.5rem] flex px-2 gap-1 pt-2 pb-16">
              <Input placeholder="Feeling Hungry?" className="placeholder:text-gray-400"/>
              <Button className="w-[3.5rem]" variant={"accentSecondary"} size={"icon"} onClick={handleBack}>
                <img src="arrowright.svg"/>
              </Button>
              <Button className="w-[3.5rem]" size={"icon"} onClick={handleBack}>
                <img src="mic.svg"/>
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    )
  }
  else{
    return (
      <>
        <PageContainer>
          <div className="relative flex flex-col w-full h-full">
            <div className="bg-accent w-full h-full flex flex-col items-center justify-center">
              <div className="flex-grow w-full"/>
              <img src="talkback.gif" className="w-[70%]" alt="Illustration of talkback"/>
              <div className="flex-grow w-full flex flex-col items-center">
                <div className="absolute flex flex-col gap-4 w-[50%]">
                  <p className="text-white break-words text-center text-sm mb-4">Talkback helps reads things on the screen to you!</p>  
                  <Button variant={"secondary"} onClick={handleTalkbackOn} className="flex items-center align-center gap-2">
                    <p>Turn on Talkback</p>
                    <img src="arrowright.svg" className="w-5 h-5 mt-[0.1rem]"/>
                  </Button>
                  <Button variant={"transparent"} onClick={handleDismiss}>Dismiss</Button>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </>
    )
  }
}

export default HomePage

import React from "react"
import PageContainer from "../custom/page-container"
import { Button } from "../ui/button"
import { useNavigate } from "react-router"
import { useTransition } from "@/lib/providers/TransitionProvider";

const DonePage: React.FC = () => {
  const navigate = useNavigate();
  const { startTransition } = useTransition();

  const handleDone = () => {
    startTransition('animate-fadeOut', () => navigate("/"))
  }

  return (
    <>
      <PageContainer>
        <div className="relative flex flex-col w-full h-full">
          <div className="bg-accent w-full h-full flex flex-col items-center justify-center">
          <div className="flex-grow w-full flex flex-col items-center align-center justify-center">
              <div className="absolute flex flex-col gap-4 w-[50%]">
                <p className="text-white break-words text-center text-4xl my-4">Hang tight,</p>  
              </div>
            </div>
            <img src="goods.gif" className="w-[50%]" alt="Illustration of talkback"/>
            <div className="flex-grow w-full flex flex-col items-center">
              <div className="absolute flex flex-col gap-4 w-[50%]">
                <p className="text-white break-words text-center text-md my-4">Your food will arrive soon!</p>  
                <Button variant={"accentSecondary"} onClick={handleDone}>Back to main menu</Button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

export default DonePage

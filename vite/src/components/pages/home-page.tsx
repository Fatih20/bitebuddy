import React, { useEffect, useState } from "react";
import PageContainer from "../custom/page-container";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";
import { CookieConfig } from "@/_config/cookie-config";
import { useTransition } from "@/lib/providers/TransitionProvider";
import { NopButton } from "../custom/nop-button";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { startTransition } = useTransition();
  const [reload, setReload] = useState<boolean>(false);

  useEffect(() => {}, [reload]);

  const handleAuth = () => {
    Cookies.set(CookieConfig.COOKIE_AUTH, "true");
    // startTransition('animate-fadeOut', () => {
    //   startTransition('animate-fadeIn', () => {
    //   })
    // })
    setReload(!reload);
  };

  const handleChat = () => {
    Cookies.remove(CookieConfig.COOKIE_CONVERSATION);
    startTransition("animate-fadeOut", () => navigate("/chat"));
  };

  if (Cookies.get(CookieConfig.COOKIE_AUTH) === "true") {
    return (
      <>
        <PageContainer>
          <div className="p-4">
            <Card className="bg-accentSecondary rounded-[0.5rem]">
              <CardContent className="my-3 py-0 flex justify-between items-center">
                <div>
                  <CardTitle className="text-primary-foreground text-xl">
                    BuddyAI
                  </CardTitle>
                  <CardDescription>
                    Ask us for recommendations...
                  </CardDescription>
                </div>
                <Button size={"icon"} variant={"accent"} onClick={handleChat}>
                  <img src="arrowforward.svg" />
                </Button>
              </CardContent>
            </Card>
            <div className="w-full flex justify-around py-2">
              <NopButton icon="icons/home-icon-Food.png" title="Food" />
              <NopButton icon="icons/home-icon-Mart.png" title="Shop" />
              <NopButton icon="icons/home-icon-Delivery.png" title="Package" />
              <NopButton icon="icons/home-icon-Transport.png" title="Travel" />
            </div>
            <div className="w-full flex py-2 gap-4">
              <div className="bg-plainMild hover:bg-plainSecondary flex flex-col h-fit p-4 flex-grow transition-all duration-500 rounded-xl hover:cursor-pointer">
                <p>Your Wallet</p>
                <p className="text-black font-bold">IDR4.000.000</p>
              </div>
              <div className="bg-plainMild hover:bg-plainSecondary flex flex-col h-fit p-4 flex-grow transition-all duration-500 rounded-xl hover:cursor-pointer">
                <p>Your vouchers</p>
                <p className="text-black font-bold">All food free!</p>
              </div>
            </div>
            <p className="py-2 text-xl font-bold">Try our new chatbot!</p>
            <div className="relative w-full py-2">
              <img src="images/home-try-chatbot.png" className="w-full" />
              <Button
                className="absolute inset-0 w-32 ml-[4%] mt-[30%]"
                onClick={handleChat}
              >
                <img src="arrowrightSecondary.svg" />
              </Button>
            </div>
            <p className="py-2 text-xl font-bold">Learn about our project</p>
            <div className="grid grid-cols-2 w-full gap-4">
              <div className="w-full">
                <button
                  className="hover:opacity-50 transition-all duration-500 rounded-xl w-full"
                  onClick={() => {
                    startTransition("animate-fadeOut", () =>
                      navigate("/about/team")
                    );
                  }}
                >
                  <img
                    src="/images/team.jpg"
                    className="w-full aspect-square rounded-xl"
                  />
                </button>
                <p className="font-semibold text-md">Meet The Team</p>
              </div>
              <div className="w-full">
                <button
                  className="hover:opacity-50 transition-all duration-500 rounded-xl w-full"
                  onClick={() => {
                    startTransition("animate-fadeOut", () =>
                      navigate("/about/buddy")
                    );
                  }}
                >
                  <img
                    src="/images/logo.jpg"
                    className="w-full aspect-square rounded-xl"
                  />
                </button>
                <p className="font-semibold text-md">Meet Buddy</p>
              </div>
            </div>
          </div>
        </PageContainer>
      </>
    );
  } else {
    return (
      <>
        <PageContainer>
          <div className="relative flex flex-col w-full h-full">
            <div className="absolute inset-0 bg-accent flex items-start justify-center z-10">
              <img
                src="bitebuddy_crowd.svg"
                className="h-full"
                alt="illustration of a crowd"
              />
            </div>

            <div className="flex-grow" />
            <Card className="relative z-20 rounded-t-[2.5rem] rounded-b-none">
              <CardHeader className="pb-2">
                <CardTitle className="pt-6 text-[1.5rem] mx-4">
                  Bite Buddy For Hackjakarta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mx-4 text-md">
                  This project is made for the Hackjakarta hackathon. Some
                  functions are not available as our goal is to relicate an
                  actual food delivery service. Please enjoy and have fun with
                  our app!
                </p>
              </CardContent>
              <CardFooter className="pt-6">
                <Button
                  variant={"secondary"}
                  className="w-full mx-2 text-lg py-6"
                  onClick={handleAuth}
                >
                  Start as Guest
                </Button>
              </CardFooter>
            </Card>
          </div>
        </PageContainer>
      </>
    );
  }
};

export default HomePage;

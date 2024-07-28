import React, {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PageContainer from "../custom/page-container";
import { Button } from "../ui/button";
import { Visualizer } from "react-sound-visualizer";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";
import { CookieConfig } from "@/_config/cookie-config";
import ChatBox from "../custom/chat-box";
import { Chat, ChatType } from "@/lib/types/Chat";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Textarea } from "../ui/textarea";
import axios from "axios"; // Import axios
import { useTransition } from "@/lib/providers/TransitionProvider";
import { FoodMessage } from "@/lib/types/api/MessageReturn";
import CircularLoading from "../custom/loading-circle";
import { useFoods } from "@/lib/providers/FoodsProvider";
import { isMobile } from "react-device-detect";

const HomePage: React.FC = () => {
  let prep = 0;
  const navigate = useNavigate();
  const { startTransition } = useTransition();
  const { setChosenFood } = useFoods();
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [countdown, setCountdown] = useState(20);
  const [chats, setChats] = useState<Chat[]>([]);
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);
  const [reload, setReload] = useState<boolean>(false);
  const [talkback, setTalkback] = useState<boolean>(
    Cookies.get(CookieConfig.COOKIE_TALKBACK) === "true"
  );
  const [sendTrigger, setSendTrigger] = useState<boolean>(false);
  const [quickChatTrigger, setQuickChatTrigger] = useState<boolean>(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();
  const visualizer = useRef<(canvas: HTMLCanvasElement) => void>();
  const visualizerStartRef = useRef<(() => void) | undefined>(undefined);

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(
    (v) => v.name === "Microsoft Ava Online (Natural) - English (United States)"
  );
  let idleTimeout: NodeJS.Timeout;

  const waitChat: Chat = {
    type: ChatType.WAIT,
  };

  useEffect(() => {
    if (prep !== 0) {
      return;
    }
    prep = 1;

    if (!Cookies.get(CookieConfig.COOKIE_AUTH)) {
      startTransition("animate-fadeOut", () => navigate("/"));
    }
    if (Cookies.get(CookieConfig.COOKIE_CONVERSATION)) {
      if (Cookies.get(CookieConfig.COOKIE_CONVERSATION) == "undefined") {
        Cookies.remove(CookieConfig.COOKIE_CONVERSATION);
        showQuickChat();
      } else {
        const getChats = async () => {
          const response = await axios.get(
            `https://bitebuddy.weajiwibisono.com/api/messages/${Cookies.get(
              CookieConfig.COOKIE_CONVERSATION
            )}`
          );
          console.log(response.data);
          response.data.messages.forEach(
            (element: {
              content: { type: string; text: string; foods?: FoodMessage[] };
              role: string;
              id: string;
            }) => {
              const addedChat: Chat = {
                type: element.content.type,
                isUser: element.role === "user",
                text: element.content.text,
                foods: element.content.foods,
                messageId: element.id,
              };
              setChats((prevChats) => [...prevChats, addedChat]);
            }
          );
        };

        getChats();
      }
    } else {
      showQuickChat();
    }

    // const newChat: Chat = {
    //   type: ChatType.WAIT,
    // };
    // const newChat2: Chat = {
    //   type: ChatType.TEXT,
    //   text: 'This is a server message',
    //   isUser: false,
    // };
    // const newChat3: Chat = {
    //   type: ChatType.FOOD,
    //   isUser: false,
    //   foods: [
    //     {
    //       restaurantId: "1",
    //       restaurantName: "Diagram Coffee - Lengkong",
    //       menuId: "1",
    //       menuName: "Roempi Iced Coffee Milk",
    //       menuPrice: "28000",
    //       menuSections: "drink"
    //     },
    //     {
    //       restaurantId: "1",
    //       restaurantName: "Diagram Coffee - Lengkong",
    //       menuId: "1",
    //       menuName: "Roempi Iced Coffee Milk",
    //       menuPrice: "28000",
    //       menuSections: "drink"
    //     },
    //   ]
    // };
    // const newChat4: Chat = {
    //   type: ChatType.QUICK,
    //   quickChats: [ "This is a user messageThis is a user messageThis is a user messageThis is a user message", "Order Bbb", "Order Cc"],
    // };

    // if(chats.length === 0){
    // setChats((prevChats) => [...prevChats, newChat])
    //   setChats((prevChats) => [...prevChats, newChat2])
    //   setChats((prevChats) => [...prevChats, newChat3])
    //   setChats((prevChats) => [...prevChats, newChat4])
    // }
  }, []);

  useEffect(() => {
    setInputValue(transcript);

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      handleSend();
    }, 5000);

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [transcript]);

  useEffect(() => {
    console.log("Page reloaded");
  }, [reload]);

  useEffect(() => {
    handleSend();
  }, [sendTrigger]);

  useEffect(() => {
    setSendTrigger(!sendTrigger);
  }, [quickChatTrigger]);

  useEffect(() => {
    if (visualizerStartRef.current) {
      visualizerStartRef.current();
    }
  }, [visualizer.current]);

  const showQuickChat = () => {
    const quickChat: Chat = {
      type: ChatType.QUICK,
      quickChats: [
        "I'm in the mood for some sushi",
        "I need some coffee",
        "I want some indomie",
      ],
    };
    setChats((prevChats) => [...prevChats, quickChat]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    startTransition("animate-fadeOut", () => navigate(-1));
  };

  const handleCountdown = (progress: number) => {
    setCountdown(20 - Math.ceil(progress / 5));
  };

  const removeLastChat = () => {
    setChats((prevChat) => prevChat.slice(0, -1));
  };

  const handleQuickChat = (str: string) => {
    setInputValue(str);
    removeLastChat();
    setQuickChatTrigger(!quickChatTrigger);
  };

  const handleTalkbackSwitch = () => {
    if (talkback) {
      Cookies.set(CookieConfig.COOKIE_TALKBACK, "false");
      setTalkback(false);
    } else {
      Cookies.set(CookieConfig.COOKIE_TALKBACK, "true");
      setTalkback(true);
    }
  };

  const handleDismiss = () => {
    Cookies.set(CookieConfig.COOKIE_TALKBACK, "false");
    setTalkback(false);
    setReload(!reload);
  };

  const handleTalkbackOn = () => {
    Cookies.set(CookieConfig.COOKIE_TALKBACK, "true");
    setTalkback(true);
    setReload(!reload);
  };

  const handleVoice = async () => {
    if (!browserSupportsSpeechRecognition) {
      console.log("browser not support");
      alert("Browser does not support speech recognition");
      return;
    }
    if (!isMicrophoneAvailable) {
      console.log("mic not avail");
      alert("Microphone is unavailable");
      return;
    }

    if (idleTimeout) {
      clearTimeout(idleTimeout);
    }

    if (listening) {
      console.log("stop listening");
      SpeechRecognition.stopListening();
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      }
    } else {
      resetTranscript();
      try {
        if (!isMobile) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

          setAudioStream(stream);
        }
        await SpeechRecognition.startListening({ continuous: true, language: "en-US" });
      } catch (error) {
        console.error("Failed to get audio stream:", error);
      }
    }
  };

  const handleSend = async () => {
    if (inputValue) {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      if (inputValue.toLowerCase().startsWith("process payment")) {
        clearTimeout(idleTimeout);

        let num = -1;
        for (let i = chats.length - 1; i >= 0; i--) {
          if (chats[i].type === ChatType.FOOD) {
            num = i;
            break;
          }
        }

        if (num == -1) {
          const sentText: Chat = {
            type: ChatType.TEXT,
            isUser: true,
            text: inputValue,
          };
          setChats((prevChats) => [...prevChats, sentText]);

          const text = "Sorry, I have not recommended food to you before.";
          const replyText: Chat = {
            type: ChatType.TEXT,
            isUser: false,
            text: text,
          };
          setChats((prevChats) => [...prevChats, replyText]);

          if (talkback) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = voice!;
            window.speechSynthesis.speak(utterance);
          }
        } else {
          setChosenFood(chats[num].foods!);
          startTransition("animate-fadeOut", () => navigate("/checkout"));
        }

        return;
      }

      try {
        setInputValue("");
        SpeechRecognition.stopListening();
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
        }

        const sentText: Chat = {
          type: ChatType.TEXT,
          isUser: true,
          text: inputValue,
        };
        setChats((prevChats) => [...prevChats, sentText]);
        setChats((prevChats) => [...prevChats, waitChat]);
        if (chats.length > 0 && chats[0].type == ChatType.QUICK) {
          setChats((prevChats) => prevChats.slice(1));
        }

        if (talkback) {
          const text = "Searching for your food... It takes up to 20 seconds";
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = voice!;
          window.speechSynthesis.speak(utterance);
        }

        setInputDisabled(true);
        const response = await axios.post(
          "https://bitebuddy.weajiwibisono.com/api/chat",
          {
            type: "text",
            text: inputValue,
            conversationId: Cookies.get(CookieConfig.COOKIE_CONVERSATION),
          }
        );
        removeLastChat();
        Cookies.set(
          CookieConfig.COOKIE_CONVERSATION,
          response.data.conversationId
        );
        console.log(response.data);
        setInputDisabled(false);

        response.data.messages.forEach(
          (element: {
            type: string;
            text: string;
            foods?: FoodMessage[];
            id: string;
          }) => {
            const addedChat: Chat = {
              type: element.type,
              isUser: false,
              text: element.text,
              foods: element.foods,
              messageId: element.id,
            };
            setChats((prevChats) => [...prevChats, addedChat]);

            if (talkback) {
              let text: string;
              let utterance: SpeechSynthesisUtterance;
              switch (addedChat.type) {
                case ChatType.TEXT:
                  utterance = new SpeechSynthesisUtterance(addedChat.text);
                  utterance.voice = voice!;
                  window.speechSynthesis.speak(utterance);

                  break;

                case ChatType.FOOD:
                  text = "";
                  text += "Here is your order: ";
                  text += addedChat.foods![0].restaurantName + ".";
                  text += "Consists of: ";
                  addedChat.foods!.forEach((element) => {
                    text += element.portion + " ";
                    text += element.menuName + ",";
                  });
                  text +=
                    '. You can also say or type "process payment" to proceed';
                  utterance = new SpeechSynthesisUtterance(text);
                  utterance.voice = voice!;
                  window.speechSynthesis.speak(utterance);
                  break;

                default:
                  break;
              }
            }
          }
        );

        // if (chats[chats.length - 1].type != ChatType.FOOD) {
        //   showQuickChat();
        // }
      } catch (error) {
        console.error("Error sending message:", error);
      }
      setInputValue("");
    }

    if (listening) {
      SpeechRecognition.stopListening();
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      }
    }
  };

  const VisualizerComponent = useMemo(() => {
    return audioStream ? (
      <Visualizer audio={audioStream}>
        {({ canvasRef, start }) => {
          visualizer.current = canvasRef;
          visualizerStartRef.current = start;
          return (
            <>
              <div className="bg-plain p-4">
                <canvas
                  ref={canvasRef}
                  className="bg-primary border border-solid border-black w-full rounded-full h-[2rem]"
                />
              </div>
            </>
          );
        }}
      </Visualizer>
    ) : null;
  }, [audioStream]);

  if (Cookies.get(CookieConfig.COOKIE_TALKBACK)) {
    return (
      <>
        <PageContainer>
          <div className="w-full h-full flex flex-col">
            <div className="bg-accent h-[3.5rem] flex items-center">
              <div className="flex-grow h-full flex items-center pl-2">
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  className="absolute bg-transparent hover:bg-accentSecondary"
                  onClick={handleBack}
                >
                  <img src="arrowleft.svg" />
                </Button>
              </div>
              <p className="text-white text-xl">Talk To BuddyAI</p>
              <div className="flex-grow h-full flex items-center justify-end">
                <Button
                  className={`absolute mr-4 bg-transparent hover:bg-accentSecondary`}
                  size={"icon"}
                  onClick={handleTalkbackSwitch}
                >
                  <img
                    src={`${talkback ? "headphone.svg" : "headphoneoff.svg"}`}
                    className={`${talkback ? "" : "opacity-50"}`}
                  />
                </Button>
              </div>
            </div>
            <ChatBox chats={chats} onQuickChat={handleQuickChat} />
            {listening && VisualizerComponent}
            <div className="bg-accent h-[2.5rem] flex px-2 gap-1 pt-2 pb-16">
              <Textarea
                placeholder="Feeling Hungry?"
                className="resize-none h-10 min-h-0 placeholder:text-gray-400 no-scrollbar"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  resetTranscript();
                }}
                onKeyDown={handleKeyDown}
                disabled={inputDisabled}
              />
              <Button
                className="w-[3.5rem]"
                variant={"accentSecondary"}
                size={"icon"}
                onClick={handleSend}
                disabled={inputDisabled}
              >
                <img src="arrowright.svg" />
              </Button>
              <Button
                className="w-[3.5rem] bg-[#00804D] hover:bg-[#005433]"
                size={"icon"}
                onClick={handleVoice}
                disabled={inputDisabled}
              >
                <img src={`${listening ? "micoff.svg" : "mic.svg"}`} />
              </Button>
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
            <div className="bg-accent w-full h-full flex flex-col items-center justify-center">
              <div className="absolute w-full h-full flex z-1">
                <div className="flex-grow w-full" />
                <CircularLoading
                  onComplete={handleTalkbackOn}
                  onChange={handleCountdown}
                  target={20}
                />
                <div className="flex-grow w-full" />
              </div>

              <div className="flex-grow w-full flex items-center justify-center font-bold">
                <p className="text-3xl text-white">{countdown}</p>
              </div>
              <img
                src="talkback.gif"
                className="w-[50%]  z-10"
                alt="Illustration of talkback"
              />

              <div className="flex-grow w-full flex flex-col items-center">
                <div className="absolute flex flex-col gap-4 w-[50%]">
                  <p className="text-white break-words text-center text-sm mb-4">
                    Talkback helps reads things on the screen to you!
                  </p>
                  <Button
                    variant={"secondary"}
                    onClick={handleTalkbackOn}
                    className="flex items-center align-center gap-2"
                  >
                    <p>Turn on Talkback</p>
                    <img src="arrowright.svg" className="w-5 h-5 mt-[0.1rem]" />
                  </Button>
                  <Button variant={"transparent"} onClick={handleDismiss}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }
};

export default HomePage;

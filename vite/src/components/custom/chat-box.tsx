import React, { useEffect, useRef } from "react";
import { Chat, ChatType } from "@/lib/types/Chat";
import ChatBubble from "./chat-bubble";
import FoodBubble from "./food-bubble";
import QuickChatBubble from "./quick-chat-bubble";
import WaitBubble from "./wait-bubble";

interface ChatBoxProps {
  chats: Chat[];
  onQuickChat: (str: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ chats, onQuickChat }) => {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  return (
    <>
      <div 
        ref={chatContainerRef}
        className="flex-grow bg-plain w-full h-1 flex flex-col justify-start p-4 gap-4 overflow-y-auto no-scrollbar"
        >
        {chats.map(
          ({ type, foods, text, isUser, quickChats, messageId }, index) => {
            switch (type) {
              case ChatType.FOOD:
                return <FoodBubble foods={foods!} key={index} id={messageId} />;

              case ChatType.WAIT:
                return <WaitBubble/>;

              case ChatType.TEXT:
                return (
                  <ChatBubble
                    text={text!}
                    isUser={isUser!}
                    key={index}
                    id={messageId}
                  />
                );

              case ChatType.QUICK:
                return (
                  <QuickChatBubble
                    texts={quickChats!}
                    onClick={onQuickChat}
                    key={index}
                  />
                );

              default:
                return <>Error: Invalid chat type</>;
            }
          }
        )}
      </div>
    </>
  );
};

export default ChatBox;

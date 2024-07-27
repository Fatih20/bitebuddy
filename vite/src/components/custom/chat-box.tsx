import React from "react"
import { Chat, ChatType } from "@/lib/types/Chat"
import ChatBubble from "./chat-bubble"
import FoodBubble from "./food-bubble"

interface ChatBoxProps{
  chats: Chat[]
}

const ChatBox: React.FC<ChatBoxProps> = ({ chats }) => {  
  return (
    <>
      <div className="flex-grow bg-gray-300 w-full h-1 flex flex-col justify-start p-4 gap-4 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-200">
        {chats.map(({ type, foods, text, isUser }) => {
          switch (type) {
            case ChatType.FOOD:
              return (
                <FoodBubble foods={foods!}/>
              )

            case ChatType.TEXT:
              return (
                <ChatBubble text={text!} isUser={isUser}/>
              )

            default:
              return (
                <>Error: Invalid chat type</>
              )
          }
        })}
      </div>
    </>
  )
}

export default ChatBox

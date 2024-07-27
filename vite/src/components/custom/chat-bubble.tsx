import React from "react"

interface ChatBubbleProps{
  isUser: boolean,
  text: string,
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ isUser, text }) => {  
  return (
    <>
      <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] p-3 rounded-lg break-words ${isUser ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>
          {text}
        </div>
      </div>
    </>
  )
}

export default ChatBubble

import React from "react";
import { FeedbackButton } from "./feedback";

interface ChatBubbleProps {
  isUser: boolean;
  text: string;
  id?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ isUser, text, id }) => {
  return (
    <>
      <div>
        <div
          className={`animate-popUp w-full flex ${isUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[60%] p-3 rounded-lg break-words ${
              isUser ? "bg-primary text-primary-foreground" : "bg-plainMild"
            }`}
          >
            {text}
          </div>
        </div>
        {!isUser && id && <FeedbackButton messageId={id} />}
      </div>
    </>
  );
};

export default ChatBubble;

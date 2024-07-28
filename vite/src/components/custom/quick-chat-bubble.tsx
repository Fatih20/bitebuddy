import React from "react";
import { Button } from "../ui/button";

interface QuickChatBubbleProps {
  texts: string[];
  onClick: (str: string) => void;
}

const QuickChatBubble: React.FC<QuickChatBubbleProps> = ({
  texts,
  onClick,
}) => {
  return (
    <>
      <div className="animate-popUp w-full flex justify-end items-end">
        <div className="flex flex-col w-full max-w-[60%]">
          <div className="flex justify-end items-center bg-secondary border border-solid border-plainSecondary rounded-t-lg p-3">
            <p className="text-sm text-white px-3">
              Quick chat recommendations
            </p>
            <img src="/quickchat.svg" className="pt-1" />
          </div>
          {texts.map((text, index) => (
            <Button
              key={index}
              onClick={() => {
                onClick(text);
              }}
              className={`p-3 rounded-none break-words whitespace-normal border border-solid border-plainSecondary bg-white hover:bg-gray-200 text-black w-full text-right
                ${index === texts.length - 1 ? "rounded-b-lg" : ""}`}
              style={{ height: "auto", display: "block", whiteSpace: "normal" }}
            >
              {text}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default QuickChatBubble;

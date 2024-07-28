import React from "react";

const WaitBubble: React.FC = () => {
  return (
    <>
      <div>
        <div className={`animate-popUp w-full flex justify-start`}>
          <div className="flex flex-col max-w-[60%]">
            <img src="loading.gif"/>
            <div className={`p-3 rounded-lg break-words bg-plainMild`}>
              <p>Searching for your food...</p>
              <p>It takes up to 20 seconds</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WaitBubble;

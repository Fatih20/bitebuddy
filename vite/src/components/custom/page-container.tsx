import React from "react";

interface PageContainerProps {
  children?: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <div className="flex justify-center">
      <div className=" w-[100vw] sm:max-w-[500px] h-[100vh] flex flex-col items-center justify-center">
        <div className={`w-full h-full bg-plain`}>{children}</div>
      </div>
    </div>
  );
};

export default PageContainer;

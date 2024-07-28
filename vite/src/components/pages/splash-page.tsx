import React from "react";
import PageContainer from "../custom/page-container";

interface SplashScreenProps {
  className?: string;
}

const SplashPage: React.FC<SplashScreenProps> = ({ className, ...props }) => {
  return (
    <PageContainer>
      <div
        className={`bg-accent w-full h-full flex items-center justify-center ${className}`}
        {...props}
      >
        <img src="/bitebuddy_logo_title.svg" className="w-1/2" alt="logo" />
      </div>
    </PageContainer>
  );
};

export { SplashPage };

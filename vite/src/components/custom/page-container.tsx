import React, { useEffect, useState } from "react"

interface PageContainerProps {
  children?: React.ReactNode
}

const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  const [isPortrait, setIsPortrait] = useState(false);

  const updateAspectRatio = () => {
    setIsPortrait(window.innerHeight > window.innerWidth);
  };

  useEffect(() => {
    updateAspectRatio();
    window.addEventListener('resize', updateAspectRatio);

    return () => {
      window.removeEventListener('resize', updateAspectRatio);
    };
  }, []);
  
  return (
    <>
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black">
        <div className={`${isPortrait ? 'w-full' : 'h-full'} bg-white`} style={{aspectRatio:9/16}}>
          {children}
        </div>
      </div>
    </>
  )
}

export default PageContainer

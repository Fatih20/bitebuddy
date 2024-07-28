import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router';

interface TransitionContextType {
  transition: string;
  startTransition: (newTransition: string, callback: () => void) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function useTransition() {
  const context = useContext(TransitionContext);
  if (context === undefined) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
}

interface TransitionProviderProps {
  children: ReactNode;
}

export function TransitionProvider({ children }: TransitionProviderProps) {
  const [transition, setTransition] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    setTransition('animate-fadeIn');
  }, [location]);

  const startTransition = (newTransition: string, callback: () => void) => {
    setTransition(newTransition);
    setTimeout(callback, 500); // Adjust the timeout to match your animation duration
  };

  return (
    <TransitionContext.Provider value={{ transition, startTransition }}>
      <div className={`bg-white`}>
        <div className={`${transition} bg-white`}>
        {children}
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
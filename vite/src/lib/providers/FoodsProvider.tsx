import { createContext, useState, ReactNode, useContext } from 'react';
import { FoodMessage } from '../types/api/MessageReturn';

interface FoodContextType {
  chosenFood: FoodMessage[];
  setChosenFood: (value: FoodMessage[]) => void;
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

export function useFoods() {
  const context = useContext(FoodContext);
  if (context === undefined) {
    throw new Error('useFood must be used within a FoodProvider');
  }
  return context;
}

interface FoodProviderProps {
  children: ReactNode;
}

export function FoodProvider({ children }: FoodProviderProps) {
  const [chosenFood, setChosenFood] = useState<FoodMessage[]>([]);

  return (
    <FoodContext.Provider value={{ chosenFood, setChosenFood }}>
        {children}
    </FoodContext.Provider>
  );
}
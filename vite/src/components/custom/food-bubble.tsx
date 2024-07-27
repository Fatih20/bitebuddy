import { FoodMessage } from "@/lib/types/api/MessageReturn"
import React from "react"

interface FoodBubbleProps{
  foods: FoodMessage[],
}

// TODO: Foodbubble, wait until backend calls are fixed
const FoodBubble: React.FC<FoodBubbleProps> = ({ foods }) => {  
  return (
    <>
      <div className={"w-full flex rounded-lg"}>
        {/* {foods.map(({ restaurantId, restaurantName, menuId, menuName, menuPrice, menuSections }) => {
            
        })} */}
      </div>
    </>
  )
}

export default FoodBubble

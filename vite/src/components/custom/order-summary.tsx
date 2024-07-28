import { FoodMessage } from "@/lib/types/api/MessageReturn"
import React, { useState } from "react"
import { Button } from "../ui/button"
import { capitalizeFirstLetter, rupiah, toTitleCase } from "@/lib/localization"

interface OrderSummaryProps{
  foods: FoodMessage[],
  onChange?: () => void,
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ foods, onChange }) => {  
  const [reload, setReload] = useState<boolean>(false);

  return (
    <>
      <div className="w-full flex justify-end items-start">
        <div className="flex flex-col w-full">
          <div className="flex justify-start items-center bg-accentSecondary border border-solid border-plainSecondary rounded-t-lg p-3">
            <p className="text-sm text-white">{foods[0]?.restaurantName? toTitleCase(foods[0].restaurantName) : "No restaurant name given"}</p>
          </div>
          {foods.map(({ menuDescription, menuName, menuPrice, portion }, index) => {
              return (
                <div className={`p-3 border-l border-r border-solid border-plainSecondary
                  ${index === foods.length - 1 ? 'rounded-b-lg border-b' : ''}`}>

                  <p>{toTitleCase(menuName)}</p>
                  <p className="text-sm text-gray-500 pt-1">{capitalizeFirstLetter(menuDescription)}</p>
                  <div className={`flex justify-between py-2
                      ${index !== foods.length - 1 ? 'border-b border-solid border-plainSecondary' : ''}`}>
                    <p className="text-sm">{rupiah.format(menuPrice * portion)}</p>
                    
                    {/* TODO: Food Number */}
                    <div className="flex items-center gap-4">
                      <Button
                        size={"icon"}
                        variant={"secondary"}
                        className="h-6 w-6 rounded-sm"
                        onClick={() => {
                          if(foods[index].portion > 1){
                            foods[index].portion--
                          }
                          setReload(!reload)
                          if(onChange){
                            onChange()
                          }
                        }}
                      >
                        <img src="minus.svg" />
                      </Button>
                      <p className="text-sm">{portion}</p>
                      <Button
                        size={"icon"}
                        variant={"secondary"}
                        className="h-6 w-6 rounded-sm"
                        onClick={() => {
                          foods[index].portion++
                          setReload(!reload)
                          if(onChange){
                            onChange()
                          }
                        }}
                      >
                        <img src="plus.svg" />
                      </Button>
                    </div>

                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </>
  )
}

// {texts.map((text, index) => (
//   <Button
//     key={index}
//     onClick={() => {onClick(text)}}
//     className={`p-3 rounded-none break-words whitespace-normal border border-solid border-plainSecondary bg-white hover:bg-plainSecondary text-black w-full text-right
//       ${index === texts.length - 1 ? 'rounded-b-lg' : ''}`}
//       style={{ height: 'auto', display: 'block', whiteSpace: 'normal' }}>
//     {text}
//   </Button>
// ))}

export default OrderSummary

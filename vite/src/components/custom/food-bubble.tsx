import { FoodMessage } from "@/lib/types/api/MessageReturn";
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { FeedbackButton } from "./feedback";
import { useFoods } from "@/lib/providers/FoodsProvider";
import { useNavigate } from "react-router";
import { useTransition } from "@/lib/providers/TransitionProvider";
import { capitalizeFirstLetter, rupiah, toTitleCase } from "@/lib/localization";

interface FoodBubbleProps {
  foods: FoodMessage[];
  id?: string;
}

const FoodBubble: React.FC<FoodBubbleProps> = ({ foods, id }) => {
  const { setChosenFood } = useFoods();
  const navigate = useNavigate();
  const { startTransition } = useTransition();
  const [reload, setReload] = useState<boolean>(false);

  const handlePayment = () => {
    setChosenFood(foods)
    startTransition('animate-fadeOut', () => navigate('/checkout'))
  }

  return (
    <>
      <div>
        <div className={"animate-popUp relative w-full flex rounded-lg"}>
          <img src="temp/food1.png" className="absolute w-full" />
          <Card className="relative z-20 rounded-lg border border-solid border-plainSecondary mt-24 w-full">
            <CardHeader className="pb-2">
              <CardTitle className="ext-[1.5rem] text-[1.2rem] border-b border-solid border-plainSecondary pb-3">
                {toTitleCase(foods[0].restaurantName)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {foods.map(({ menuDescription, menuName, menuPrice, portion }, index) => {
                return (
                  <div className="py-2">
                    <p>{toTitleCase(menuName)}</p>
                    <p className="text-sm text-gray-500 pt-1">
                      {capitalizeFirstLetter(menuDescription)}
                    </p>
                    <div className="flex justify-between pt-2">
                      <p className="text-sm">{rupiah.format(menuPrice * portion)}</p>

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
                          }}
                        >
                          <img src="plus.svg" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter>
              <Button
                variant={"secondary"}
                className="w-full text-lg py-6"
                onClick={handlePayment}
              >
                Process Payment
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="bg-white border border-solid border-plainSecondary rounded-lg flex p-4 gap-2 mt-2">
          <img src="note.svg"/>
          <div>
            <p className="font-bold">Note</p>
            <p>You can also say or type "process payment" to proceed</p>
          </div>
        </div>
        {id && <FeedbackButton messageId={id} />}
      </div>
    </>
  );
};

export default FoodBubble;

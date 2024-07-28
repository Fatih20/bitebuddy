import React, { useState } from "react"
import PageContainer from "../custom/page-container"
import { Button } from "../ui/button"
import { useNavigate } from "react-router";
import OrderSummary from "../custom/order-summary";
import { useTransition } from "@/lib/providers/TransitionProvider";
import { PaymentDetails } from "../custom/payment-details";
import { useFoods } from "@/lib/providers/FoodsProvider";
import { rupiah } from "@/lib/localization";

const CheckoutPage: React.FC = () => {
  const [reload, setReload] = useState<boolean>(false);
  const { chosenFood } = useFoods();
  const navigate = useNavigate();
  const { startTransition } = useTransition();
  const [ sum, setSum ] = useState(0);

  const handleBack = () => {
    startTransition('animate-fadeOut', () => navigate(-1))
  }

  const handleChange = () => {
    let localsum = 0
    chosenFood.forEach(({ menuPrice, portion }) => {
      localsum += menuPrice * portion
    });
    setSum(localsum)

    setReload(!reload)
  }

  const handleCheckout = () => {
    startTransition('animate-fadeOut', () => navigate('/done'))
  }

  return (
    <>
      <PageContainer>
        <div className="w-full h-full flex flex-col">
          <div className="bg-accent h-[3.5rem] flex items-center">
            <div className="flex-grow h-full flex items-center">
              <Button className="absolute bg-transparent hover:bg-accentSecondary" onClick={handleBack}>
                <img src="arrowleft.svg"/>
              </Button>
            </div>
            <p className="text-white text-xl">Check Out</p>
            <div className="flex-grow h-full flex items-center justify-end"/>
          </div>
          <div className="flex-grow bg-plain w-full h-1 flex flex-col justify-start p-4 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-200">
            <p className="pb-4">Order Summary</p>
            <OrderSummary foods={chosenFood} onChange={handleChange}/>
            <p className="py-4">Payment Details</p>
            <PaymentDetails/>
            <p className="py-4">Delivery Address</p>
            <div className="border rounded-lg border-solid border-plainSecondary p-4 flex items-start gap-4">
              <img src="location.svg" className="w-8 pt-1"/>
              <p>Grab's office - South Quarter Tower C, 7th Floor and Mezzanine, Jl. R.A. Kartini No.Kav.8,. RW.4 Cilandak.</p>
            </div>
            <p className="py-4">Payment Summary</p>
            <div className="border rounded-lg border-solid border-plainSecondary p-4 flex flex-col">
              <div className="w-full flex justify-between">
                <p>Price</p>
                <p>{rupiah.format(sum)}</p>
              </div>
              <div className="w-full flex justify-between">
                <p>Subtotal</p>
                <p><s>{rupiah.format(sum)}</s></p>
              </div>
              <div className="w-full flex justify-between mt-4 pt-1 border-t border-solid border-plainSecondary">
                <p>Total Payment</p>
                <p>{rupiah.format(0)}</p>
              </div>
            </div>
            <Button variant={"secondary"} onClick={handleCheckout} className="w-full text-lg py-6 mt-10 flex items-center align-center gap-2">
              <p>Place Order</p>
              <img src="arrowright.svg" className="w-5 h-5 mt-[0.1rem]"/>
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

export default CheckoutPage

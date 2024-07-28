import { Frown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";
import { CookieConfig } from "@/_config/cookie-config";
import { useTransition } from "@/lib/providers/TransitionProvider";

export const NopButton = ({ title, icon }: { title: string; icon: string }) => {
  const { startTransition } = useTransition();
  const navigate = useNavigate();
  const handleChat = () => {
    Cookies.remove(CookieConfig.COOKIE_CONVERSATION);
    startTransition("animate-fadeOut", () => navigate("/chat"));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-transparent hover:bg-transparent hover:opacity-80 flex flex-col h-fit transition-all duration-500">
          <img src={icon} />
          <label className="text-black">{title}</label>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[350px]">
        <DialogHeader>
          <div className="h-9 w-9 flex items-center justify-center mx-auto rounded-full bg-[#A1C2FA]">
            <Frown className="w-6 h-6 text-accentSecondary" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Can't go here :(
          </DialogTitle>
          <DialogDescription className="text-gray-700 text-md text-center">
            The interface shown here replicates Grab's style to illustrate how
            our solution could seamessly integrate with existing platforms.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            size={"lg"}
            className="w-full text-lg"
            onClick={handleChat}
          >
            Go to BuddyAI instead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

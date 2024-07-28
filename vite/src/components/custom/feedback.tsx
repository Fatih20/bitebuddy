import { useState } from "react";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import axios from "axios";
import { CookieConfig } from "@/_config/cookie-config";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Frown } from "lucide-react";

export const FeedbackOption = ({
  label,
  selectedValue,
  updateSelected,
}: {
  label: string;
  selectedValue: string;
  updateSelected: (val: string) => void;
}) => {
  return (
    <Button
      variant={"outline"}
      className={cn(
        selectedValue === label ? "bg-accentSecondary text-white" : "",
        "rounded-none hover:bg-accentSecondary"
      )}
      onClick={() => {
        updateSelected(label);
      }}
    >
      {label}
    </Button>
  );
};

export const FeedbackButton = ({ messageId }: { messageId: string }) => {
  const [voted, setVoted] = useState<boolean | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const handleFeedback = () => {
    setOpen(false);
    setVoted(true);
    axios
      .put(
        `https://bitebuddy.weajiwibisono.com/api/feedback/${Cookies.get(
          CookieConfig.COOKIE_CONVERSATION
        )}/${messageId}`,
        {
          isPositive: false,
          comment: selectedLabel,
          reason: [reason],
        }
      )
      .then(() => {
        setOpenDialog(true);
      });
  };

  const handleThumbsup = () => {
    setVoted(false);
    axios.put(
      `https://bitebuddy.weajiwibisono.com/api/feedback/${Cookies.get(
        CookieConfig.COOKIE_CONVERSATION
      )}/${messageId}`,
      {
        isPositive: true,
        comment: "",
        reason: [],
      }
    );
  };

  return (
    <div className="pl-3 pt-3 flex gap-x-2">
      <Button
        size={"sm"}
        className={`bg-transparent hover:bg-transparent hover:opacity-60 p-0 m-0 h-fit`}
        disabled={voted !== null}
        onClick={handleThumbsup}
      >
        <img src="/thumbsup.svg " />
      </Button>
      <Dialog open={openDialog} onOpenChange={(val) => setOpenDialog(val)}>
        <DialogContent className="max-w-[350px]">
          <DialogHeader>
            <div className="h-9 w-9 flex items-center justify-center mx-auto rounded-full bg-[#A1C2FA]">
              <Frown className="w-6 h-6 text-accentSecondary" />
            </div>
            <DialogTitle className="text-2xl text-center">
              We're sorry for the inconvenience
            </DialogTitle>
            <DialogDescription className="text-gray-700 text-md text-center">
              We already have your feedback and hope to improve our suggestion
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                size={"lg"}
                className="w-full text-lg"
              >
                Okay
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Drawer open={open} onOpenChange={(val) => setOpen(val)}>
        <DrawerTrigger asChild>
          <Button
            size={"sm"}
            className={`bg-transparent hover:bg-transparent hover:opacity-60 p-0 m-0 h-fit`}
            disabled={voted !== null}
          >
            <img src="/thumbsdown.svg " />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="sm:max-w-[500px] mx-auto px-4 py-2">
          <DrawerHeader>
            <DrawerTitle className="font-semibold">
              Buddy Response Feedback
            </DrawerTitle>
            <Separator className="my-1" />
          </DrawerHeader>
          <div className="px-4 ">
            <div className="flex gap-x-2 ">
              <FeedbackOption
                label="Not what I want"
                selectedValue={selectedLabel}
                updateSelected={(val) => setSelectedLabel(val)}
              />
              <FeedbackOption
                label="Repetitive Answer"
                selectedValue={selectedLabel}
                updateSelected={(val) => setSelectedLabel(val)}
              />
              <FeedbackOption
                label="Other"
                selectedValue={selectedLabel}
                updateSelected={(val) => setSelectedLabel(val)}
              />
            </div>
            <div className="mt-1">
              <Label>Tell us more</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none mt-1 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="What was the issue with the response and tell us how could it be improved"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              disabled={selectedLabel === ""}
              className="bg-[#00804D] rounded-lg text-lg"
              onClick={() => handleFeedback()}
            >
              Submit
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

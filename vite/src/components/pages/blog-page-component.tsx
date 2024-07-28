import { useNavigate } from "react-router";
import PageContainer from "../custom/page-container";
import { Button } from "../ui/button";
import { useTransition } from "@/lib/providers/TransitionProvider";
import Cookies from "js-cookie";
import { CookieConfig } from "@/_config/cookie-config";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Section {
  title?: string;
  description: string;
}

interface BlogPageProps {
  title: string;
  sections: Section[];
  withCta: boolean;
  image?: string;
}

export const BlogPageComponent = ({
  title,
  sections,
  withCta,
  image,
}: BlogPageProps) => {
  const navigate = useNavigate();
  const { startTransition } = useTransition();
  const handleBack = () => {
    startTransition("animate-fadeOut", () => navigate("/"));
  };
  const handleChat = () => {
    Cookies.remove(CookieConfig.COOKIE_CONVERSATION);
    startTransition("animate-fadeOut", () => navigate("/chat"));
  };

  return (
    <PageContainer>
      <div className="flex flex-col px-5 py-2">
        <div className="h-[3.5rem] flex items-center gap-x-4 mt-3">
          <Button
            onClick={handleBack}
            size={"icon"}
            variant={"ghost"}
            className="hover:bg-accentSecondary"
          >
            <ArrowLeft />
          </Button>
          <p className="font-bold text-xl">{title}</p>
        </div>
        {image && (
          <img src={image} className="w-full aspect-video rounded-xl" />
        )}
        <div className="pt-5 pb-2">
          {sections.map((section) => {
            return (
              <>
                {section.title && (
                  <h2 className="font-semibold">{section.title}</h2>
                )}
                <p className="mb-4">{section.description}</p>
              </>
            );
          })}
        </div>
        {withCta && (
          <div className="pb-2">
            <Button
              type="button"
              variant="secondary"
              size={"lg"}
              className="w-full text-lg"
              onClick={handleChat}
            >
              Try our chatbot <ArrowRight className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

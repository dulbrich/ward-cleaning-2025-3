import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { FC, useEffect, useState } from "react";

const ScrollToTopButton: FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show button when page is scrolled down
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          size="icon"
          variant="outline"
          className="fixed bottom-24 right-6 z-50 rounded-full shadow-md bg-background/90 hover:bg-background"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </>
  );
};

export default ScrollToTopButton; 
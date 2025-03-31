import { Brain } from "lucide-react";

const BottomBar = () => {
  return (
    <footer className="fixed w-full bottom-0 z-40 flex items-center justify-start px-4 h-12">
      <a
        href="https://t.me/despilce"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 group"
      >
        <Brain className="w-4 h-4 text-primary animate-swing group-hover:text-red-500 transition-all duration-300" />

        <p className="text-xs font-bold">by despilce</p>
      </a>
    </footer>
  );
};

export default BottomBar;

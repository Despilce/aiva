import { useState, useEffect } from "react";
import { Brain } from "lucide-react";

const BottomBar = () => {
  const [color, setColor] = useState("text-primary");

  useEffect(() => {
    const colors = [
      "text-primary",
      "text-red-500",
      "text-green-500",
      "text-blue-500",
    ];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % colors.length;
      setColor(colors[index]);
    }, 500); // Change color every 500ms

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return (
    <footer className="fixed w-full bottom-0 z-40 flex items-center justify-start px-2 h-11">
      <a href="https://t.me/despilce" className="flex items-center space-x-2">
        <Brain
          className={`w-4 h-4 ${color} animate-swing transition-all duration-300`}
        />
        <p className="text-xs font-bold">by despilce</p>
      </a>
    </footer>
  );
};

export default BottomBar;

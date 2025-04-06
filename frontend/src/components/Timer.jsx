import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const Timer = () => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds timer
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const { selectedUser } = useChatStore();
  const { socket, authUser } = useAuthStore();

  useEffect(() => {
    let intervalId;

    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            setIsExpired(true);
            // Emit timer expired event
            socket.emit("timerExpired", {
              senderId: authUser._id,
              receiverId: selectedUser._id,
            });
            clearInterval(intervalId);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, timeLeft, socket, authUser._id, selectedUser._id]);

  useEffect(() => {
    // Listen for timer start event
    socket.on("timerStarted", ({ senderId }) => {
      if (senderId !== authUser._id) {
        setTimeLeft(30);
        setIsRunning(true);
        setIsExpired(false);
      }
    });

    // Listen for timer stop event
    socket.on("timerStopped", ({ senderId }) => {
      if (senderId !== authUser._id) {
        setIsRunning(false);
      }
    });

    // Listen for timer expired event
    socket.on("timerExpired", ({ senderId }) => {
      if (senderId !== authUser._id) {
        setTimeLeft(0);
        setIsRunning(false);
        setIsExpired(true);
      }
    });

    return () => {
      socket.off("timerStarted");
      socket.off("timerStopped");
      socket.off("timerExpired");
    };
  }, [socket, authUser._id]);

  const startTimer = () => {
    setIsRunning(true);
    setIsExpired(false);
    setTimeLeft(30);
    // Emit timer start event
    socket.emit("timerStarted", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
    });
  };

  const stopTimer = () => {
    setIsRunning(false);
    // Emit timer stop event
    socket.emit("timerStopped", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Only allow students to control the timer
  const canControlTimer = authUser.userType === "student";

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <div
        className={`text-xl font-mono font-bold ${
          isExpired
            ? "text-error"
            : isRunning
            ? "text-primary"
            : "text-base-content"
        }`}
      >
        {formatTime(timeLeft)}
      </div>
      {canControlTimer && (
        <>
          {!isRunning && !isExpired && (
            <button onClick={startTimer} className="btn btn-sm btn-primary">
              Start Timer
            </button>
          )}
          {isRunning && (
            <button onClick={stopTimer} className="btn btn-sm btn-error">
              Stop Timer
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Timer;

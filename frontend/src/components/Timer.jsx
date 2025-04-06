import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Pause, Play, Square } from "lucide-react";

const Timer = () => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds timer
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const { selectedUser } = useChatStore();
  const { socket, authUser } = useAuthStore();

  useEffect(() => {
    let intervalId;

    if (isRunning && !isPaused && timeLeft > 0) {
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
  }, [isRunning, isPaused, timeLeft, socket, authUser._id, selectedUser._id]);

  useEffect(() => {
    // Listen for timer start event
    socket.on("timerStarted", ({ senderId }) => {
      if (senderId !== authUser._id) {
        setTimeLeft(30);
        setIsRunning(true);
        setIsPaused(false);
        setIsExpired(false);
      }
    });

    // Listen for timer pause event
    socket.on("timerPaused", ({ senderId, timeRemaining }) => {
      if (senderId !== authUser._id) {
        setTimeLeft(timeRemaining);
        setIsPaused(true);
      }
    });

    // Listen for timer resume event
    socket.on("timerResumed", ({ senderId, timeRemaining }) => {
      if (senderId !== authUser._id) {
        setTimeLeft(timeRemaining);
        setIsPaused(false);
      }
    });

    // Listen for timer total stop event
    socket.on("timerTotalStopped", ({ senderId }) => {
      if (senderId !== authUser._id) {
        setTimeLeft(30);
        setIsRunning(false);
        setIsPaused(false);
        setIsExpired(false);
      }
    });

    // Listen for timer expired event
    socket.on("timerExpired", ({ senderId }) => {
      if (senderId !== authUser._id) {
        setTimeLeft(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsExpired(true);
      }
    });

    return () => {
      socket.off("timerStarted");
      socket.off("timerPaused");
      socket.off("timerResumed");
      socket.off("timerTotalStopped");
      socket.off("timerExpired");
    };
  }, [socket, authUser._id]);

  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
    setIsExpired(false);
    setTimeLeft(30);
    // Emit timer start event
    socket.emit("timerStarted", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
    });
  };

  const pauseTimer = () => {
    setIsPaused(true);
    // Emit timer pause event with current time
    socket.emit("timerPaused", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
      timeRemaining: timeLeft,
    });
  };

  const resumeTimer = () => {
    setIsPaused(false);
    // Emit timer resume event with current time
    socket.emit("timerResumed", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
      timeRemaining: timeLeft,
    });
  };

  const totalStopTimer = () => {
    setTimeLeft(30);
    setIsRunning(false);
    setIsPaused(false);
    setIsExpired(false);
    // Emit timer total stop event
    socket.emit("timerTotalStopped", {
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
        <div className="flex gap-2">
          {!isRunning && !isExpired && (
            <button onClick={startTimer} className="btn btn-sm btn-primary">
              Start Timer
            </button>
          )}
          {isRunning && (
            <>
              <button
                onClick={isPaused ? resumeTimer : pauseTimer}
                className="btn btn-sm btn-warning"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? (
                  <Play className="size-4" />
                ) : (
                  <Pause className="size-4" />
                )}
              </button>
              <button
                onClick={totalStopTimer}
                className="btn btn-sm btn-error"
                title="Stop"
              >
                <Square className="size-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Timer;

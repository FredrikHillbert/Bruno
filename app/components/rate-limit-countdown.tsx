import { useState, useEffect } from 'react';

interface RateLimitCountdownProps {
  resetTime: Date;
  onComplete?: () => void;
}

export function RateLimitCountdown({ resetTime, onComplete }: RateLimitCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
  }>({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = resetTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        if (onComplete) onComplete();
        return true; // Return true when complete
      }
      
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ minutes, seconds });
      return false; // Not complete yet
    };
    
    // Calculate immediately
    const isComplete = calculateTimeLeft();
    if (isComplete) return;
    
    // Then set up interval
    const timer = setInterval(() => {
      const isComplete = calculateTimeLeft();
      if (isComplete) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resetTime, onComplete]);

  return (
    <div className="mt-1 text-sm font-medium">
      Available again in: 
      <span className="ml-1 text-amber-400">
        {timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
        {timeLeft.seconds}s
      </span>
    </div>
  );
}
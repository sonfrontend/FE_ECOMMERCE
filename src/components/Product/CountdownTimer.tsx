import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDateStr?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endDateStr }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    if (!endDateStr) {
      setTimeLeft(null);
      return;
    }

    const endDate = new Date(endDateStr).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        setTimeLeft(null);
        return false;
      }
      
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
      return true;
    };

    const isStillRunning = updateTimer();
    if (isStillRunning) {
      const timer = setInterval(() => {
        if (!updateTimer()) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [endDateStr]);

  if (!timeLeft) return null;

  return (
    <div className='flex items-center gap-1 bg-[#ee4d2d] text-white px-1.5 py-0.5 rounded-sm shadow-sm text-[10px] md:text-[11px] font-bold tracking-wide'>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span>{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
    </div>
  );
};

export default CountdownTimer;

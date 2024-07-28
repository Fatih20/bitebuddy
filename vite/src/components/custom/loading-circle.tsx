import React, { useEffect, useState } from 'react';

interface CircularLoadingProps {
  target: number;
  onComplete?: () => void;
  onChange?: (progress: number) => void;
}

const CircularLoading: React.FC<CircularLoadingProps> = ({ onComplete, onChange, target }) => {
  const [progress, setProgress] = useState(0);
  const coeff = 10.0 / target

  useEffect(() => {
    if(onChange){
      onChange(progress);
    }
    if(progress >= 100 && onComplete){
      onComplete()
    }
  }, [progress])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + coeff : 0));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const circleStyle = {
    strokeDasharray: 283,
    strokeDashoffset: 283 - (283 * progress) / 100,
  };

  return (
    <svg className="w-25 h-25" viewBox="0 0 100 100">
      <circle
        cx="50%"
        cy="50%"
        r="45"
        stroke="white"
        strokeWidth="10"
        fill="none"
      />
      <circle
        cx="50%"
        cy="50%"
        r="45"
        stroke="#00804D"
        strokeWidth="10"
        fill="none"
        strokeLinecap="square"
        style={circleStyle}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
};

export default CircularLoading;
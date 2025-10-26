
import React from 'react';

interface TickerProps {
  remaining: number;
  initial: number;
}

export const Ticker: React.FC<TickerProps> = ({ remaining, initial }) => {
  const percentage = (remaining / initial) * 100;
  
  return (
    <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-300">Daily Image Generations Remaining</h3>
        <span className="text-lg font-bold text-white">{remaining} / {initial}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-teal-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

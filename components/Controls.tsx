import React, { useCallback, useState } from 'react';
import type { Duration, ImageStyle } from '../types';
import { imageStyles } from '../types';
import { FileUploadIcon, PlayIcon, StopIcon, ResetIcon } from './icons';

interface ControlsProps {
  fileName: string;
  setFileContent: (content: string) => void;
  setFileName: (name: string) => void;
  duration: Duration;
  setDuration: (duration: Duration) => void;
  imageStyle: ImageStyle;
  setImageStyle: (style: ImageStyle) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  isPlaying: boolean;
  fileLoaded: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  fileName,
  setFileContent,
  setFileName,
  duration,
  setDuration,
  imageStyle,
  setImageStyle,
  onStart,
  onStop,
  onReset,
  isPlaying,
  fileLoaded
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File | undefined) => {
    if (file && (file.type === "text/plain" || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
        setFileName(file.name);
      };
      reader.readAsText(file);
    } else if (file) {
      console.warn("Invalid file type, only .txt is accepted.", file.type);
      // In a real app, you might want to show an error to the user here.
    }
  }, [setFileContent, setFileName]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
    event.target.value = ''; // Allow re-uploading the same file
  };

  const handleDurationChange = useCallback((field: keyof Duration, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    const max = field === 'hours' ? 99 : 59;
    setDuration({ ...duration, [field]: Math.max(0, Math.min(numValue, max)) });
  }, [duration, setDuration]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow drop
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const isDurationSet = duration.hours > 0 || duration.minutes > 0 || duration.seconds > 0;

  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-6">
      <div className="space-y-2">
        <label htmlFor="file-upload" className="text-sm font-medium text-gray-300">1. Upload Text File</label>
        <label
          htmlFor="file-upload"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`group flex items-center justify-center w-full h-20 px-4 transition-all duration-200 bg-gray-900 border-2 border-dashed rounded-lg cursor-pointer hover:border-teal-400 ${
            isDragging ? 'border-teal-400 bg-teal-500/10 scale-105' : 'border-gray-600'
          }`}
        >
          <div className="flex items-center space-x-3 text-center pointer-events-none">
            <FileUploadIcon className="w-6 h-6 text-gray-500 group-hover:text-teal-400 transition-colors" />
            <p className="text-gray-400 group-hover:text-white transition-colors text-sm break-all">
              {fileName || 'Click or drag & drop a .txt file'}
            </p>
          </div>
        </label>
        <input id="file-upload" type="file" accept=".txt" onChange={handleFileChange} className="hidden" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">2. Set Audiobook Duration</label>
        <div className="flex items-center space-x-2 pt-5">
          {Object.keys(duration).map((key) => (
            <div key={key} className="relative w-full">
              <input
                type="number"
                min="0"
                max={key === 'hours' ? 99 : 59}
                value={duration[key as keyof Duration].toString().padStart(2, '0')}
                onChange={(e) => handleDurationChange(key as keyof Duration, e.target.value)}
                className="w-full p-2 text-center bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                aria-label={key}
              />
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>

       <div className="space-y-2 pt-2">
        <label htmlFor="style-select" className="text-sm font-medium text-gray-300">3. Select Image Style</label>
         <div className="relative">
            <select
                id="style-select"
                value={imageStyle}
                onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
                className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                 style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
            >
                {imageStyles.map(style => (
                    <option key={style} value={style} className="bg-gray-800 text-white">{style}</option>
                ))}
            </select>
        </div>
      </div>
      
      <div className="pt-4 flex space-x-3">
        {!isPlaying ? (
          <button
            onClick={onStart}
            disabled={!fileLoaded || !isDurationSet}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-500 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
          >
            <PlayIcon className="w-5 h-5" />
            Start Visualization
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
          >
            <StopIcon className="w-5 h-5" />
            Stop
          </button>
        )}
        <button 
          onClick={onReset}
          className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
          aria-label="Reset"
        >
            <ResetIcon className="w-5 h-5"/>
        </button>
      </div>
    </div>
  );
};
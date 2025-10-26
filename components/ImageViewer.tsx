import React from 'react';
import { ImageIcon, CheckCircleIcon } from './icons';

interface ImageViewerProps {
  image: string | null;
  previousImage: string | null;
  isPlaying: boolean;
  isFinished: boolean;
  isPreloading: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ image, previousImage, isPlaying, isFinished, isPreloading }) => {
  return (
    <div className="relative w-full aspect-video bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden flex items-center justify-center shadow-2xl shadow-black/50">
      {previousImage && (
        <img
          src={previousImage}
          alt="Previous AI generated visualization"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {image && (
        <img
          key={image}
          src={image}
          alt="AI generated visualization"
          className="absolute inset-0 w-full h-full object-cover animate-fade-in"
        />
      )}
      
      {!isPlaying && !image && !previousImage && !isFinished && (
         <div className="text-center text-gray-500 p-8">
            <ImageIcon className="w-16 h-16 mx-auto mb-4"/>
            <h2 className="text-2xl font-semibold text-gray-300">Ready to Visualize</h2>
            <p className="mt-2 max-w-sm mx-auto">Upload your text, set the duration, and hit 'Start' to begin the visual journey.</p>
        </div>
      )}

      {isFinished && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 text-center text-gray-300 p-8 animate-fade-in">
           <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-teal-400"/>
            <h2 className="text-2xl font-semibold">Visualization Complete</h2>
            <p className="mt-2 text-gray-400">You can now reset to start a new session.</p>
        </div>
      )}
      
      {isPreloading && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-500/20 overflow-hidden" title="Preloading next image...">
            <div className="h-full bg-teal-400 animate-preload-bar"></div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-in-out;
        }
        @keyframes preload-bar-anim {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-preload-bar {
            width: 50%;
            animation: preload-bar-anim 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
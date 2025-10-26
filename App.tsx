import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Controls } from './components/Controls';
import { ImageViewer } from './components/ImageViewer';
import { Ticker } from './components/Ticker';
import { ProgressBar } from './components/ProgressBar';
import { generateImageFromText } from './services/geminiService';
import type { Duration, ImageStyle } from './types';
import { imageStyles } from './types';

const INITIAL_GENERATIONS = 100;
const UPDATE_INTERVAL_SECONDS = 20;
const LOCAL_STORAGE_KEY = 'audiobook-visualizer-generations';

const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [duration, setDuration] = useState<Duration>({ hours: 0, minutes: 0, seconds: 0 });
  const [imageStyle, setImageStyle] = useState<ImageStyle>(imageStyles[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [nextImage, setNextImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingGenerations, setRemainingGenerations] = useState<number>(INITIAL_GENERATIONS);
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [imageSourceFile, setImageSourceFile] = useState<string>('');

  const wordsRef = useRef<string[]>([]);
  const currentWordIndexRef = useRef<number>(0);
  const intervalIdRef = useRef<number | null>(null);
  const wordsPerIntervalRef = useRef<number>(0);

  // Effect to load and manage daily reset from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let storedData;

    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      storedData = item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Failed to read from localStorage", error);
      storedData = null;
    }

    if (storedData && storedData.lastReset === today) {
      setRemainingGenerations(storedData.count);
    } else {
      // It's a new day or no data exists, so reset.
      setRemainingGenerations(INITIAL_GENERATIONS);
      try {
        const newData = { count: INITIAL_GENERATIONS, lastReset: today };
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
      } catch (error) {
         console.error("Failed to write to localStorage during reset", error);
      }
    }
    setIsStorageInitialized(true);
  }, []); // Run only once on mount

  // Effect to save remaining generations to localStorage on change
  useEffect(() => {
    if (!isStorageInitialized) {
      return; // Don't save until the initial value has been loaded
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const dataToStore = { count: remainingGenerations, lastReset: today };
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error("Failed to save to localStorage", error);
    }
  }, [remainingGenerations, isStorageInitialized]);

  const stopVisualization = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setIsPreloading(false);
  }, []);

  const getStylePromptFragment = (style: ImageStyle): string => {
    switch (style) {
      case 'Fantasy':
        return 'in a dramatic, high-fantasy art style';
      case 'Sci-Fi':
        return 'in a futuristic, science-fiction concept art style';
      case 'Realistic':
        return 'in a photorealistic, cinematic style';
      case 'Hand-drawn':
        return 'in a detailed, hand-drawn ink and wash style';
      case "Children's Book":
        return 'in a whimsical, colorful childrens book illustration style';
      default:
        return 'artistic';
    }
  };
  
  const generateImageForChunk = useCallback(async (startIndex: number) => {
    const end = Math.min(startIndex + wordsPerIntervalRef.current, wordsRef.current.length);
    const textChunk = wordsRef.current.slice(startIndex, end).join(' ');

    if (!textChunk.trim()) {
        return null;
    }

    const styleFragment = getStylePromptFragment(imageStyle);
    const prompt = `An atmospheric, evocative, ${styleFragment} illustration for an audiobook, capturing the mood of this scene: ${textChunk}. Important: Do not include any text, words, or letters in the image.`;

    try {
      const imageData = await generateImageFromText(prompt);
      setRemainingGenerations(prev => prev - 1);
      return `data:image/jpeg;base64,${imageData}`;
    } catch (err) {
      console.error(err);
      setError('Failed to generate image. Please try again.');
      stopVisualization();
      throw err;
    }
  }, [stopVisualization, imageStyle]);

  const preloadNextImage = useCallback(async () => {
    if (isPreloading) return;

    const nextStartIndex = currentWordIndexRef.current + wordsPerIntervalRef.current;
    if (nextStartIndex >= wordsRef.current.length) {
      return;
    }
    
    setIsPreloading(true);
    try {
      const imageData = await generateImageForChunk(nextStartIndex);
      if (imageData) {
        setNextImage(imageData);
      }
    } catch (err) {
      console.error("Failed to preload image:", err);
    } finally {
      setIsPreloading(false);
    }
  }, [isPreloading, generateImageForChunk]);

  const advanceVisualization = useCallback(() => {
    // End condition
    if (currentWordIndexRef.current + wordsPerIntervalRef.current >= wordsRef.current.length) {
      // Display the last generated image if it exists
      if(nextImage) {
        setPreviousImage(currentImage);
        setCurrentImage(nextImage);
        setNextImage(null);
        setProgress(100);
      }
      stopVisualization();
      setIsFinished(true);
      return;
    }
    
    if (nextImage) {
      setPreviousImage(currentImage);
      setCurrentImage(nextImage);
      setNextImage(null);

      currentWordIndexRef.current += wordsPerIntervalRef.current;
      const newProgress = (currentWordIndexRef.current / wordsRef.current.length) * 100;
      setProgress(newProgress);
      
      preloadNextImage();
    } else {
      console.warn("Next image not preloaded in time. Waiting for next cycle.");
      preloadNextImage(); // Attempt to kick off preload again in case it failed
    }
  }, [nextImage, currentImage, preloadNextImage, stopVisualization]);

  useEffect(() => {
    if (previousImage) {
      const timer = setTimeout(() => setPreviousImage(null), 800);
      return () => clearTimeout(timer);
    }
  }, [previousImage]);

  useEffect(() => {
    const totalSeconds = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
    const canPreload = fileContent && totalSeconds > 0 && !isPlaying && fileName && fileName !== imageSourceFile;

    if (!canPreload) return;
    
    const initialLoad = async () => {
      stopVisualization();
      setError(null);
      setProgress(0);
      setIsFinished(false);
      setCurrentImage(null);
      setNextImage(null);

      wordsRef.current = fileContent.split(/\s+/).filter(word => word.length > 0);
      if (wordsRef.current.length === 0) {
        setError("The uploaded file is empty.");
        setImageSourceFile(fileName);
        return;
      }

      wordsPerIntervalRef.current = Math.ceil((wordsRef.current.length / totalSeconds) * UPDATE_INTERVAL_SECONDS);
      setImageSourceFile(fileName);
      
      setIsLoading(true);
      try {
        const firstImageData = await generateImageForChunk(0);
        if (firstImageData) {
          setCurrentImage(firstImageData);
          currentWordIndexRef.current = 0;
          setProgress((wordsPerIntervalRef.current / wordsRef.current.length) * 100);
          preloadNextImage(); // Kick off preload for the second image
        } else {
          setProgress(100);
          setIsFinished(true);
        }
      } catch (err) {
        // Error is set in generateImageForChunk
      } finally {
        setIsLoading(false);
      }
    };

    initialLoad();
  }, [fileContent, fileName, duration, isPlaying, imageSourceFile, stopVisualization, generateImageForChunk, preloadNextImage]);

  const handleStart = () => {
    const totalSeconds = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
    if (!fileContent || totalSeconds <= 0 || !currentImage) {
      setError("Please upload a text file and set a valid duration for the first image to load.");
      return;
    }
    setIsPlaying(true);
    intervalIdRef.current = window.setInterval(advanceVisualization, UPDATE_INTERVAL_SECONDS * 1000);
  };
  
  const handleStop = () => stopVisualization();

  const handleReset = () => {
    stopVisualization();
    setFileContent('');
    setFileName('');
    setDuration({ hours: 0, minutes: 0, seconds: 0 });
    setImageStyle(imageStyles[0]);
    setIsPlaying(false);
    setCurrentImage(null);
    setPreviousImage(null);
    setNextImage(null);
    setIsLoading(false);
    setError(null);
    // When resetting, we don't reset the daily counter from storage, just the session.
    // The daily counter will reset on its own tomorrow.
    setProgress(0);
    setIsFinished(false);
    setImageSourceFile('');
    currentWordIndexRef.current = 0;
    wordsRef.current = [];
  };

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-teal-500/30">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        <div className="lg:w-1/3 flex flex-col space-y-6">
          <header className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-white tracking-tight">Audiobook Visualizer <span className="text-teal-400">AI</span></h1>
            <p className="text-gray-400 mt-2">Bring your public domain audiobooks to life with AI-generated art.</p>
          </header>
          
          <Ticker remaining={remainingGenerations} initial={INITIAL_GENERATIONS} />
          
          <Controls 
            fileName={fileName}
            setFileContent={setFileContent}
            setFileName={setFileName}
            duration={duration}
            setDuration={setDuration}
            imageStyle={imageStyle}
            setImageStyle={setImageStyle}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
            isPlaying={isPlaying}
            fileLoaded={!!fileContent}
          />

          {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
        </div>

        <div className="lg:w-2/3 flex flex-col">
          <ImageViewer 
            image={currentImage} 
            previousImage={previousImage}
            isPlaying={isPlaying}
            isFinished={isFinished}
            isPreloading={isPreloading && isPlaying}
          />
          {(isPlaying || progress > 0) && <ProgressBar progress={progress} />}
        </div>
      </div>
       <footer className="w-full max-w-7xl mx-auto text-center text-gray-500 mt-8 text-sm">
        <p>&copy; {new Date().getFullYear()} Audiobook Visualizer AI. Images generated by Google Imagen.</p>
      </footer>
    </div>
  );
};

export default App;
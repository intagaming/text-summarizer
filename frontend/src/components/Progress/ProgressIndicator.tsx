import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface ProgressIndicatorProps {
  progress: number;
  label: string;
}

export const useProgress = (initialProgress = 0) => {
  const [progress, setProgress] = useState(initialProgress);

  const startProgress = (intervalCallback: () => number, interval = 500) => {
    const intervalId = setInterval(() => {
      setProgress(intervalCallback());
    }, interval);

    return () => clearInterval(intervalId);
  };

  return { progress, setProgress, startProgress };
};

export const ProgressIndicator = ({ progress, label }: ProgressIndicatorProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <Progress value={progress * 100} className="h-2" />
    </div>
  );
};
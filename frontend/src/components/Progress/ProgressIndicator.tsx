import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  progress: number;
  label: string;
}

export const ProgressIndicator = ({
  progress,
  label,
}: ProgressIndicatorProps) => {
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

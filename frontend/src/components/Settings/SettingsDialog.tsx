import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

const API_KEY = "text-summarizer-api-key";

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState(() => {
    const savedApiKey = localStorage.getItem(API_KEY);
    return savedApiKey || "";
  });

  useEffect(() => {
    localStorage.setItem(API_KEY, apiKey);
  }, [apiKey]);

  return { apiKey, setApiKey };
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const SettingsDialog = ({
  open,
  onOpenChange,
  apiKey,
  setApiKey,
}: SettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
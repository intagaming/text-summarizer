import { useState, useEffect } from "react";
import { summarizeText } from "./api/summarize";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, FileInput, Sun, Moon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const schema = z.object({
  file: z.instanceof(File),
  query: z.string().min(1, "Query is required"),
});

type FormData = z.infer<typeof schema>;

function App() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const THEME_KEY = "text-summarizer-theme";
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!apiKey) {
      setError("Please set your OpenAI API key in settings");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const text = await data.file.text();
      const summary = await summarizeText(text, data.query, apiKey);
      setSummary(summary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background ${theme}`}>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              Text Summarizer
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                  aria-label="Toggle theme"
                />
                <Moon className="h-4 w-4" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
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

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file">Upload Document</Label>
                <div className="flex items-center gap-2">
                  <FileInput className="h-5 w-5" />
                  <Input
                    id="file"
                    type="file"
                    {...register("file")}
                    className="w-full"
                  />
                </div>
                {errors.file && (
                  <p className="text-sm text-destructive">
                    {errors.file.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="query">Query</Label>
                <Textarea
                  id="query"
                  {...register("query")}
                  rows={3}
                  placeholder="Enter your query for summarization..."
                />
                {errors.query && (
                  <p className="text-sm text-destructive">
                    {errors.query.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Generating Summary..." : "Generate Summary"}
              </Button>
            </form>
          </CardContent>

          {error && (
            <CardFooter className="text-destructive text-sm">
              {error}
            </CardFooter>
          )}

          {summary && (
            <CardContent>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Summary</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {summary}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

export default App;

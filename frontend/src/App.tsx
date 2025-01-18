import { useState, useEffect } from "react";
import { summarizeText } from "./api/summarize";
import { ProgressiveSummarizer } from "./api/progressiveSummarizer";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const schema = z
  .object({
    file: z
      .instanceof(File)
      .refine(
        (file) =>
          file.type === "application/epub+zip" || file.type === "text/plain",
        {
          message: "Only EPUB and text files are allowed",
        }
      ),
    query: z.string().optional(),
    type: z.enum(["book", "general"]),
    stopUntilChapter: z.string().optional(),
  })
  .refine((data) => data.type !== "general" || data.query, {
    message: "Query is required for general text summarization",
    path: ["query"],
  });

type FormData = z.infer<typeof schema>;

function App() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState(() => {
    const savedApiKey = localStorage.getItem("text-summarizer-api-key");
    return savedApiKey || "";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const THEME_KEY = "text-summarizer-theme";
  const API_KEY = "text-summarizer-api-key";

  useEffect(() => {
    localStorage.setItem(API_KEY, apiKey);
  }, [apiKey]);
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const convertEpubToChapters = async (file: File): Promise<string[]> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:8080/convertEpubToChapters",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: { chapters: string[] } = await response.json();
      return data.chapters; // Return array of chapters
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to convert EPUB file"
      );
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!apiKey) {
      setError("Please set your OpenAI API key in settings");
      return;
    }

    setIsLoading(true);
    setError("");
    setSummary(null);

    try {
      if (data.file.type === "application/epub+zip") {
        setIsConverting(true);
        const text = await convertEpubToChapters(data.file);
        setIsConverting(false);
        setSummary(
          await new ProgressiveSummarizer(
            text,
            apiKey,
            data.stopUntilChapter || ""
          ).summarizeChapters()
        );
      } else {
        const text = await data.file.text();
        setSummary(await summarizeText(text, data.query || "", apiKey));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
      setIsConverting(false);
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
                    className="w-full"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setValue("file", files[0]);
                      }
                    }}
                  />
                </div>
                {errors.file && (
                  <p className="text-sm text-destructive">
                    {errors.file.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Summarization Type</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("type", value as "book" | "general")
                  }
                  defaultValue="general"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General text</SelectItem>
                    <SelectItem value="book">
                      Summarize to resume reading a book
                    </SelectItem>
                  </SelectContent>
                </Select>

                {watch("type") === "general" && (
                  <>
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
                  </>
                )}
                {watch("type") === "book" && (
                  <div className="space-y-2">
                    <Label htmlFor="stopUntilChapter">
                      Summarize Until Chapter
                    </Label>
                    <Input
                      id="stopUntilChapter"
                      {...register("stopUntilChapter")}
                      placeholder="Enter the chapter to stop summarizing at"
                    />
                    {errors.stopUntilChapter && (
                      <p className="text-sm text-destructive">
                        {errors.stopUntilChapter.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || isConverting}
                className="w-full"
              >
                {isConverting
                  ? "Converting EPUB..."
                  : isLoading
                  ? "Generating Summary..."
                  : "Generate Summary"}
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

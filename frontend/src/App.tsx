import { useState, useEffect } from "react";
import { summarizeText } from "./api/summarize";
import { ProgressiveSummarizer } from "./api/progressiveSummarizer";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const schema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) =>
        file.type === "application/epub+zip" || file.type === "text/plain",
      {
        message: "Only EPUB and text files are allowed",
      }
    ),
  type: z.enum(["book"]),
  stopUntilChapter: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function App() {
  const [summary, setSummary] = useState<string | null>(null);
  const [chapterSummaries, setChapterSummaries] = useState<
    Array<{ chapter: string; summary: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [tocChapters, setTocChapters] = useState<string[]>([]);
  const [convertedChapters, setConvertedChapters] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
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

  const { handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const convertEpubToChapters = async (
    file: File
  ): Promise<{ chapters: string[]; toc: string[] }> => {
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

      const data: { chapters: string[]; toc: string[] } = await response.json();
      return data;
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
    setProgress(0);

    try {
      if (data.file.type === "application/epub+zip") {
        if (!convertedChapters.length) {
          setIsConverting(true);
          const { chapters, toc } = await convertEpubToChapters(data.file);
          setConvertedChapters(chapters);
          setTocChapters(toc);
          setIsConverting(false);

          if (!data.stopUntilChapter) {
            setShowChapterSelect(true);
            return;
          }
        }

        const summarizer = new ProgressiveSummarizer(
          convertedChapters,
          apiKey,
          data.stopUntilChapter || "",
          tocChapters
        );

        // Update progress as chapters are summarized
        const interval = setInterval(() => {
          setProgress(summarizer.getProgress());
        }, 500);

        const summary = await summarizer.summarizeChapters();
        clearInterval(interval);
        setProgress(1);

        setSummary(summary);
        setChapterSummaries(
          summarizer
            .getChapterSummaries()
            .filter((s) => s.chapter !== "" || s.summary !== "")
        );
      } else {
        const text = await data.file.text();
        setSummary(await summarizeText(text, "", apiKey));
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
                        setConvertedChapters([]);
                        setSummary(null);
                        setChapterSummaries([]);
                        setIsLoading(false);
                        setIsConverting(false);
                        setShowChapterSelect(false);
                        setTocChapters([]);
                        setError("");
                        setProgress(0);
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
                    setValue("type", value as "book")
                  }
                  defaultValue="book"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">
                      Summarize to resume reading a book
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showChapterSelect && (
                <div className="space-y-2">
                  <Label>
                    Up until which chapter do you want to summarize (inclusive)?
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("stopUntilChapter", value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {tocChapters.map((chapter, index) => (
                        <SelectItem key={index} value={chapter}>
                          {chapter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || isConverting}
                className="w-full"
              >
                {isConverting
                  ? "Converting EPUB..."
                  : isLoading
                  ? "Generating Summary..."
                  : showChapterSelect
                  ? "Continue"
                  : "Generate Summary"}
              </Button>
            </form>
          </CardContent>

          {error && (
            <CardFooter className="text-destructive text-sm">
              {error}
            </CardFooter>
          )}

          {(isLoading || isConverting) && (
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Summarizing chapters...</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <Progress value={progress * 100} className="h-2" />
            </CardContent>
          )}

          {summary && (
            <CardContent>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Chapter Summaries</h2>
                <div className="space-y-2">
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={`item-${chapterSummaries.length - 1}`}
                  >
                    {chapterSummaries.map((chapter, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <CardTitle className="text-lg">
                            {chapter.chapter}
                          </CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {chapter.summary}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

export default App;

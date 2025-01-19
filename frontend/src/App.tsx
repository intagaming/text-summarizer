import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Settings } from "lucide-react";
import { useState } from "react";
import { ProgressiveSummarizer } from "./api/progressiveSummarizer";
import { ProgressIndicator } from "./components/Progress/ProgressIndicator";
import { SettingsDialog } from "./components/Settings/SettingsDialog";
import {
  SummaryForm,
  SummaryFormData,
} from "./components/SummaryForm/SummaryForm";
import { SummaryResults } from "./components/SummaryResults/SummaryResults";
import { ThemeToggle } from "./components/Theme/ThemeToggle";

const App = () => {
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { apiKey } = useSettingsStore();

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

  const handleSubmit = async (data: SummaryFormData) => {
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
        let localConvertedChapters = convertedChapters;
        if (!convertedChapters.length) {
          setIsConverting(true);
          const { chapters, toc } = await convertEpubToChapters(data.file);
          localConvertedChapters = chapters;
          setConvertedChapters(chapters);
          setTocChapters(toc);
          setIsConverting(false);

          if (!data.stopUntilChapter) {
            setShowChapterSelect(true);
            return;
          }
        }

        const summarizer = new ProgressiveSummarizer(
          localConvertedChapters,
          apiKey,
          data.stopUntilChapter || "",
          tocChapters
        );

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

  const resetState = () => {
    setConvertedChapters([]);
    setSummary(null);
    setChapterSummaries([]);
    setIsLoading(false);
    setIsConverting(false);
    setShowChapterSelect(false);
    setTocChapters([]);
    setError("");
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <h1 className="text-2xl font-bold">Text Summarizer</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>

          <SettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
          />

          <CardContent>
            <SummaryForm
              onSubmit={handleSubmit}
              errors={{ file: { message: error } }}
              showChapterSelect={showChapterSelect}
              tocChapters={tocChapters}
              isLoading={isLoading}
              isConverting={isConverting}
              onFileChange={resetState}
            />
          </CardContent>

          {error && (
            <CardFooter className="text-destructive text-sm">
              {error}
            </CardFooter>
          )}

          {(isLoading || isConverting) && (
            <CardContent>
              <ProgressIndicator
                progress={progress}
                label="Summarizing chapters..."
              />
            </CardContent>
          )}

          {summary && (
            <CardContent>
              <SummaryResults chapterSummaries={chapterSummaries} />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default App;

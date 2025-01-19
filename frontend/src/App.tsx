import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Settings } from "lucide-react";
import { useState, useRef } from "react";
import { ProgressiveSummarizer } from "./api/progressiveSummarizer";
import { convertEpubToChapters } from "./api/epubConverter";
import { ProgressIndicator } from "./components/Progress/ProgressIndicator";
import { SettingsDialog } from "./components/Settings/SettingsDialog";
import {
  SummaryForm,
  SummaryFormData,
} from "./components/SummaryForm/SummaryForm";
import { SummaryResults } from "./components/SummaryResults/SummaryResults";
import { ThemeToggle } from "./components/Theme/ThemeToggle";
import { Button } from "./components/ui/button";

const App = () => {
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
  const summarizerRef = useRef<ProgressiveSummarizer | null>(null);
  const { apiKey, provider, model } = useSettingsStore();

  const handleSubmit = async (data: SummaryFormData) => {
    if (!apiKey) {
      setError("Please set your OpenAI API key in settings");
      return;
    }

    setIsLoading(true);
    setError("");
    setChapterSummaries([]);
    setProgress(0);

    let interval: NodeJS.Timeout | undefined = undefined;

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

        const newSummarizer = new ProgressiveSummarizer(
          localConvertedChapters,
          apiKey,
          provider,
          model,
          data.stopUntilChapter || "",
          tocChapters
        );
        summarizerRef.current = newSummarizer;

        interval = setInterval(() => {
          setProgress(newSummarizer.getProgress());
        }, 500);

        let done = false;
        while (!done) {
          const {
            chapter,
            summary,
            done: chapterDone,
          } = await newSummarizer.summarizeNextChapter();
          setChapterSummaries((prev) =>
            [...prev, { chapter, summary }].filter(
              (s) => s.chapter !== "" || s.summary !== ""
            )
          );

          done = chapterDone;
        }

        clearInterval(interval);
        setProgress(1);
      }
    } catch (err) {
      if (
        !(err instanceof Error && err.message === "Summarization cancelled")
      ) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } finally {
      if (interval) {
        clearInterval(interval);
      }
      setIsLoading(false);
      setIsConverting(false);
    }
  };

  const resetState = () => {
    setConvertedChapters([]);
    setChapterSummaries([]);
    setIsLoading(false);
    setIsConverting(false);
    setShowChapterSelect(false);
    setTocChapters([]);
    setError("");
    setProgress(0);
    summarizerRef.current = null;
  };

  const handleCancel = () => {
    if (summarizerRef.current) {
      summarizerRef.current.cancel();
    }
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
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <ProgressIndicator
                    progress={progress}
                    label="Summarizing chapters..."
                  />
                </div>
                <Button variant="destructive" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}

          {chapterSummaries.length > 0 && (
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

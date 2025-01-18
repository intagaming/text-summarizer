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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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
  const [chapterSummaries, setChapterSummaries] = useState<
    Array<{ chapter: string; summary: string }>
  >([
    {
      chapter: "Chapter One",
      summary:
        "Violet Sorrengail, a scribe destined for the Riders Quadrant, faces her mother's decree on Conscription Day.  Her sister, Mira, a seasoned rider, tries to dissuade their mother, but Violet is ultimately assigned to the Riders Quadrant.  Violet's mother, General Sorrengail, is unmoved by her daughter's pleas and Mira's arguments, emphasizing Violet's lack of physical strength and her scribe background.  Mira, recognizing Violet's vulnerability, equips her with rider gear and provides crucial advice for survival.  The chapter culminates with Violet and Mira reaching the entrance to the Riders Quadrant, where Violet encounters Xaden Riorson, the son of a traitorous leader, and the potential danger he poses.  The chapter ends with Dylan, a fellow candidate, falling from the parapet, highlighting the perilous nature of the Riders Quadrant.",
    },
    {
      chapter: "Chapter Two",
      summary:
        "Violet, determined not to die on the perilous parapet of the Riders Quadrant, navigates the treacherous path, reciting historical facts to maintain composure.  She encounters the aggressive Jack Barlowe, who tries to push her off the parapet.  Violet manages to reach safety, but not without a close call.  Jack, despite threats, is restrained by the rules of the quadrant, and Violet is accepted into the citadel.  The chapter highlights the dangers and challenges faced by candidates in the Riders Quadrant, emphasizing the importance of survival and the potential for violence.",
    },
    {
      chapter: "Chapter Three",
      summary:
        "Violet, having survived the perilous parapet, finds herself in the courtyard of the Riders Quadrant citadel.  She encounters Dain Aetos, a familiar figure from her past, now a second-year rider.  Violet's knee is injured, and she experiences nausea and trembling.  Dain helps her to an alcove, where she rests and bandages her knee.  A tense encounter ensues with Dain, who questions Violet's presence in the Riders Quadrant and her mother's decision.  Violet explains her situation, and Dain, recognizing the danger, suggests she leave.  Violet refuses, asserting her determination to succeed.  The chapter concludes with Violet and Dain's discussion about her future in the Riders Quadrant, and their decision to have Violet join Dain's squad in Fourth Wing, highlighting the challenges and dangers Violet faces in her new environment.",
    },
    {
      chapter: "Chapter Four",
      summary:
        "Violet, now a first-year rider in Fourth Wing, attends a morning formation where cadet deaths are commemorated.  She observes the challenges and potential dangers faced by her fellow cadets, including the repetition of the year for some.  Violet and her squad are assigned to the sparring gym later that day.  Violet encounters Dain, a familiar figure from her past, now a second-year rider.  Their conversation reveals that Xaden Riorson, a cadet with a history of conflict, wants Violet dead, and has manipulated her squad placement to facilitate this.  Dain, recognizing the danger, urges Violet to be cautious, particularly during Battle Brief.  The chapter ends with Violet spotting Xaden, who is observing her, and the realization that she is in immediate danger.",
    },
    {
      chapter: "Chapter Five",
      summary:
        "Violet objects to a Battle Brief plan that forces children of rebel leaders to witness executions.  The chapter details the Battle Brief class, where Violet learns about a recent attack on the Eastern Wing by Braevi gryphons and riders.  Violet, using her scribe training, correctly deduces that the attacking riders were already on their way due to the dragons sensing the faltering wards.  This observation leads to a heated exchange with Jack Barlowe, who mocks Violet's deduction.  Violet's insightful analysis is eventually validated by Professor Devera.  The chapter concludes with Violet's sparring match against Imogen, a marked one, where Violet's injury leads to her yielding.  The chapter highlights Violet's growing awareness of the political and strategic complexities of the conflict and the dangers she faces within the Riders Quadrant.",
    },
  ]);
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
        const summarizer = new ProgressiveSummarizer(
          text,
          apiKey,
          data.stopUntilChapter || ""
        );
        setSummary(await summarizer.summarizeChapters());
        setChapterSummaries(
          summarizer
            .getChapterSummaries()
            .filter((s) => s.chapter !== "" || s.summary !== "")
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

          {!summary && (
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

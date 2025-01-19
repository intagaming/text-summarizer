import { summarizeChapter } from "./summarize";
import { EventEmitter } from "events";

export class ProgressiveSummarizer extends EventEmitter {
  private chapters: string[];
  private currentChapter: number;
  private previousSummary: string;
  private apiKey: string;
  private provider: string;
  private model: string;
  private stopUntilChapter: string;
  private chapterSummaries: Array<{ chapter: string; summary: string }>;
  private tableOfContents: string[];
  private isCancelled: boolean;
  private abortController: AbortController;

  constructor(
    chapters: string[],
    apiKey: string,
    provider: string,
    model: string,
    stopUntilChapter: string,
    tableOfContents: string[]
  ) {
    super();
    this.chapters = chapters;
    this.currentChapter = 0;
    this.previousSummary = "";
    this.apiKey = apiKey;
    this.provider = provider;
    this.model = model;
    this.stopUntilChapter = stopUntilChapter;
    this.chapterSummaries = [];
    this.tableOfContents = tableOfContents;
    this.isCancelled = false;
    this.abortController = new AbortController();
  }

  async summarizeNextChapter(): Promise<{
    chapter: string;
    summary: string;
    done: boolean;
  }> {
    if (this.currentChapter >= this.chapters.length || this.isCancelled) {
      throw new Error(
        this.isCancelled
          ? "Summarization cancelled"
          : "All chapters have been summarized"
      );
    }

    const chapterText = this.chapters[this.currentChapter];

    const { chapter, summary, stop } = await summarizeChapter(
      this.previousSummary,
      chapterText,
      this.apiKey,
      this.provider,
      this.model,
      this.stopUntilChapter,
      this.tableOfContents,
      this.abortController.signal
    );

    this.chapterSummaries.push({ chapter, summary });
    this.previousSummary = summary;
    this.currentChapter++;

    return {
      chapter,
      summary,
      done: stop || this.currentChapter >= this.chapters.length,
    };
  }

  async summarizeChapters(): Promise<string> {
    while (this.currentChapter < this.chapters.length) {
      const { done } = await this.summarizeNextChapter();
      if (done) break;
    }

    return this.chapterSummaries
      .map((cs) => `## ${cs.chapter}\n\n${cs.summary}`)
      .join("\n\n");
  }

  getChapterSummaries() {
    return this.chapterSummaries;
  }

  getProgress() {
    return this.currentChapter / this.chapters.length;
  }

  cancel() {
    this.isCancelled = true;
    this.emit("cancel");
    this.abortController.abort();
    this.abortController = new AbortController(); // Reset for potential reuse
  }

  checkCancelled() {
    return this.isCancelled;
  }
}

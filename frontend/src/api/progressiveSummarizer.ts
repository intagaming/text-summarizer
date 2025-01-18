import { summarizeChapter } from "./summarize";

export class ProgressiveSummarizer {
  private chapters: string[];
  private currentChapter: number;
  private previousSummary: string;
  private apiKey: string;

  constructor(chapters: string[], apiKey: string) {
    this.chapters = chapters;
    this.currentChapter = 0;
    this.previousSummary = "";
    this.apiKey = apiKey;
  }

  async summarizeNextChapter(): Promise<{ summary: string; done: boolean }> {
    if (this.currentChapter >= this.chapters.length) {
      return { summary: this.previousSummary, done: true };
    }

    const chapterText = this.chapters[this.currentChapter];

    const summary = await summarizeChapter(
      this.previousSummary,
      chapterText,
      this.apiKey
    );

    if (!summary) {
      throw new Error("Failed to generate summary for this chapter");
    }

    this.previousSummary = `${this.previousSummary}\n\n${summary}`;
    this.currentChapter++;

    return {
      summary: summary || "",
      done: this.currentChapter >= this.chapters.length,
    };
  }

  getProgress(): number {
    return this.chapters.length > 0
      ? this.currentChapter / this.chapters.length
      : 0;
  }
}

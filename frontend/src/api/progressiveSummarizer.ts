import { summarizeChapter } from "./summarize";

export class ProgressiveSummarizer {
  private chapters: string[];
  private currentChapter: number;
  private previousSummary: string;
  private apiKey: string;
  private stopUntilChapter: string;
  private chapterSummaries: Array<{chapter: string; summary: string}>;

  constructor(chapters: string[], apiKey: string, stopUntilChapter: string) {
    this.chapters = chapters;
    this.currentChapter = 0;
    this.previousSummary = "";
    this.apiKey = apiKey;
    this.stopUntilChapter = stopUntilChapter;
    this.chapterSummaries = [];
  }

  async summarizeNextChapter(): Promise<{ chapter: string; summary: string; done: boolean }> {
    if (this.currentChapter >= this.chapters.length) {
      throw new Error("All chapters have been summarized");
    }

    const chapterText = this.chapters[this.currentChapter];

    const { chapter, summary, stop } = await summarizeChapter(
      this.previousSummary,
      chapterText,
      this.apiKey,
      this.stopUntilChapter
    );

    this.chapterSummaries.push({chapter, summary});
    this.previousSummary = `${this.previousSummary}\n\n${chapter}\n${summary}`.trim();
    this.currentChapter++;

    return {
      chapter: chapter || "",
      summary: summary || "",
      done: stop || this.currentChapter >= this.chapters.length,
    };
  }

  getChapterSummaries(): Array<{chapter: string; summary: string}> {
    return this.chapterSummaries;
  }

  getProgress(): number {
    return this.chapters.length > 0
      ? this.currentChapter / this.chapters.length
      : 0;
  }

  async summarizeChapters(): Promise<string> {
    while (!(await this.summarizeNextChapter()).done) {
      // Continue summarizing until done
    }
    return this.previousSummary;
  }
}

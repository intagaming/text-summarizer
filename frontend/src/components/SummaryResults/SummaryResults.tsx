import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { CardTitle } from "@/components/ui/card";

interface ChapterSummary {
  chapter: string;
  summary: string;
}

interface SummaryResultsProps {
  chapterSummaries: ChapterSummary[];
}

export const SummaryResults = ({ chapterSummaries }: SummaryResultsProps) => {
  return (
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
  );
};
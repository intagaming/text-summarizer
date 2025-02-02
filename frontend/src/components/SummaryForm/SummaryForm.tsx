import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileInput } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { summaryFormSchema } from "./summaryFormSchema";

export type SummaryFormData = z.infer<typeof summaryFormSchema>;

interface SummaryFormProps {
  onSubmit: (data: SummaryFormData) => void;
  showChapterSelect: boolean;
  tocChapters: string[];
  isLoading: boolean;
  isConverting: boolean;
  onFileChange: (file: File) => void;
}

export const SummaryForm = ({
  onSubmit,
  showChapterSelect,
  tocChapters,
  isLoading,
  isConverting,
  onFileChange,
}: SummaryFormProps) => {
  const { handleSubmit, setValue, control, watch } = useForm<SummaryFormData>({
    resolver: zodResolver(summaryFormSchema),
    defaultValues: {
      type: "book",
    },
  });

  const file = watch("file");
  const stopUntilChapter = watch("stopUntilChapter");

  return (
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
                setValue("stopUntilChapter", undefined);
                onFileChange(files[0]);
              }
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Summarization Type</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
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
          )}
        />
      </div>

      {showChapterSelect && (
        <div className="space-y-2">
          <Label>
            Up until which chapter do you want to summarize (inclusive)?
          </Label>
          <Controller
            name="stopUntilChapter"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
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
            )}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={
          !file ||
          isLoading ||
          isConverting ||
          (showChapterSelect && !stopUntilChapter)
        }
        className="w-full"
      >
        {(() => {
          if (isConverting) return "Converting EPUB...";
          if (isLoading) return "Generating Summary...";
          if (showChapterSelect && !stopUntilChapter) return "Choose a chapter";
          if (showChapterSelect) return `Generate summary`;
          return "Continue";
        })()}
      </Button>
    </form>
  );
};

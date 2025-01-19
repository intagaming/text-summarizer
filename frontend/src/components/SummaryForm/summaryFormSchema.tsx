import { z } from "zod";

export const summaryFormSchema = z.object({
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

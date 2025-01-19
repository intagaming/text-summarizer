export const convertEpubToChapters = async (
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
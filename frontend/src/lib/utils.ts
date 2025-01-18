import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateStringSimilarity(str1: string, str2: string): number {
  // Normalize strings
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const s1 = normalize(str1)
  const s2 = normalize(str2)

  // Create a matrix to store distances
  const len1 = s1.length
  const len2 = s2.length
  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  // Calculate similarity ratio
  const maxLen = Math.max(len1, len2)
  return 1 - (matrix[len1][len2] / maxLen)
}

export function isChapterMatch(chapter: string, target: string): boolean {
  const similarity = calculateStringSimilarity(chapter, target)
  return similarity >= 0.98
}

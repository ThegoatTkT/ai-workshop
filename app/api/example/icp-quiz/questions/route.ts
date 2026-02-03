import { NextResponse } from "next/server";
import icpData from "@/lib/data/icp-titles.json";

interface QuizQuestion {
  id: number;
  title: string;
  isICP: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

export async function GET() {
  try {
    // Get 10 random real ICP titles
    const realTitles = getRandomItems(icpData.allTitles, 10);

    // Get 10 random fake titles
    const fakeTitles = getRandomItems(icpData.fakeTitles, 10);

    // Create questions array
    const questions: QuizQuestion[] = [
      ...realTitles.map((title, index) => ({
        id: index,
        title,
        isICP: true,
      })),
      ...fakeTitles.map((title, index) => ({
        id: index + 10,
        title,
        isICP: false,
      })),
    ];

    // Shuffle all questions
    const shuffledQuestions = shuffleArray(questions).map((q, index) => ({
      ...q,
      id: index + 1,
    }));

    return NextResponse.json({
      questions: shuffledQuestions,
      total: shuffledQuestions.length,
    });
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz questions" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

interface Answer {
  id: number;
  title: string;
  isICP: boolean;
  userAnswer: boolean;
}

interface SubmitRequest {
  answers: Answer[];
}

interface ResultDetail {
  id: number;
  title: string;
  isICP: boolean;
  userAnswer: boolean;
  isCorrect: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Invalid request: answers array is required" },
        { status: 400 },
      );
    }

    // Calculate results
    const details: ResultDetail[] = answers.map((answer) => ({
      id: answer.id,
      title: answer.title,
      isICP: answer.isICP,
      userAnswer: answer.userAnswer,
      isCorrect: answer.isICP === answer.userAnswer,
    }));

    const correct = details.filter((d) => d.isCorrect).length;
    const total = details.length;
    const percentage = Math.round((correct / total) * 100);

    return NextResponse.json({
      correct,
      total,
      percentage,
      details,
    });
  } catch (error) {
    console.error("Error processing quiz submission:", error);
    return NextResponse.json(
      { error: "Failed to process quiz submission" },
      { status: 500 },
    );
  }
}

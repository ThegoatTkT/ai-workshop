"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

interface Question {
  id: number;
  title: string;
  isICP: boolean;
}

interface Answer {
  id: number;
  title: string;
  isICP: boolean;
  userAnswer: boolean;
}

interface ResultDetail {
  id: number;
  title: string;
  isICP: boolean;
  userAnswer: boolean;
  isCorrect: boolean;
}

interface QuizResult {
  correct: number;
  total: number;
  percentage: number;
  details: ResultDetail[];
}

type QuizState = "start" | "quiz" | "results";

export default function ICPQuizPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizState, setQuizState] = useState<QuizState>("start");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Map<number, boolean>>(new Map());
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/example/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push("/example/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/example/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const startQuiz = async () => {
    setIsLoadingQuestions(true);
    try {
      const response = await fetch("/api/example/icp-quiz/questions");
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setAnswers(new Map());
        setResult(null);
        setQuizState("quiz");
      } else {
        alert("Failed to load quiz questions. Please try again.");
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      alert("Failed to load quiz questions. Please try again.");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleAnswer = (questionId: number, isICP: boolean) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, isICP);
      return newAnswers;
    });
  };

  const submitQuiz = async () => {
    if (answers.size !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const answersArray: Answer[] = questions.map((q) => ({
        id: q.id,
        title: q.title,
        isICP: q.isICP,
        userAnswer: answers.get(q.id) ?? false,
      }));

      const response = await fetch("/api/example/icp-quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersArray }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setQuizState("results");
      } else {
        alert("Failed to submit quiz. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setQuizState("start");
    setQuestions([]);
    setAnswers(new Map());
    setResult(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 text-accent">
          <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-primary">
                  ICP Quiz
                </h1>
                <p className="text-sm text-muted-foreground">
                  Test your knowledge of Ideal Customer Profiles
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/example")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Start Screen */}
        {quizState === "start" && (
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8 animate-fade-in text-center">
            <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              ICP Knowledge Quiz
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Test your ability to identify Ideal Customer Profile (ICP) job
              titles. You&apos;ll be shown 20 job titles - some are real ICP
              targets, some are not. Can you tell the difference?
            </p>
            <div className="bg-primary/5 rounded-xl p-4 mb-6 max-w-md mx-auto">
              <h3 className="font-semibold text-primary mb-2">How it works:</h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>
                    20 questions total (10 real ICP titles + 10 non-ICP titles)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>
                    For each title, choose &quot;ICP&quot; or &quot;Not
                    ICP&quot;
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>Submit to see your score and detailed results</span>
                </li>
              </ul>
            </div>
            <button
              onClick={startQuiz}
              disabled={isLoadingQuestions}
              className="btn-accent px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoadingQuestions ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                "Start Quiz"
              )}
            </button>
          </div>
        )}

        {/* Quiz Screen */}
        {quizState === "quiz" && (
          <div className="space-y-6 animate-fade-in">
            {/* Progress */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Progress
                </span>
                <span className="text-sm font-semibold text-accent">
                  {answers.size} / {questions.length}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{
                    width: `${(answers.size / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <h2 className="font-display text-lg font-bold text-foreground mb-6">
                Is this job title an ICP target?
              </h2>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`border rounded-xl p-4 transition-all duration-200 ${
                      answers.has(question.id)
                        ? "border-accent/30 bg-accent/5"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-foreground">
                          {question.title}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAnswer(question.id, true)}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                            answers.get(question.id) === true
                              ? "bg-success text-white"
                              : "bg-gray-100 text-muted-foreground hover:bg-success/20 hover:text-success"
                          }`}
                        >
                          ICP
                        </button>
                        <button
                          onClick={() => handleAnswer(question.id, false)}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                            answers.get(question.id) === false
                              ? "bg-destructive text-white"
                              : "bg-gray-100 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                          }`}
                        >
                          Not ICP
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                onClick={submitQuiz}
                disabled={isSubmitting || answers.size !== questions.length}
                className="btn-accent px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : answers.size !== questions.length ? (
                  `Answer All Questions (${questions.length - answers.size} remaining)`
                ) : (
                  "Submit Quiz"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {quizState === "results" && result && (
          <div className="space-y-6 animate-fade-in">
            {/* Score Card */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8 text-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  result.percentage >= 70
                    ? "bg-success/10"
                    : result.percentage >= 50
                      ? "bg-warning/10"
                      : "bg-destructive/10"
                }`}
              >
                <span
                  className={`text-4xl font-bold ${
                    result.percentage >= 70
                      ? "text-success"
                      : result.percentage >= 50
                        ? "text-warning"
                        : "text-destructive"
                  }`}
                >
                  {result.percentage}%
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                {result.percentage >= 70
                  ? "Great Job!"
                  : result.percentage >= 50
                    ? "Good Effort!"
                    : "Keep Practicing!"}
              </h2>
              <p className="text-muted-foreground mb-6">
                You got{" "}
                <span className="font-semibold text-foreground">
                  {result.correct}
                </span>{" "}
                out of{" "}
                <span className="font-semibold text-foreground">
                  {result.total}
                </span>{" "}
                correct
              </p>
              <button
                onClick={resetQuiz}
                className="btn-accent px-6 py-2.5 cursor-pointer"
              >
                Try Again
              </button>
            </div>

            {/* Detailed Results */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <h3 className="font-display text-lg font-bold text-foreground mb-4">
                Detailed Results
              </h3>
              <div className="space-y-3">
                {result.details.map((detail, index) => (
                  <div
                    key={detail.id}
                    className={`border rounded-xl p-4 ${
                      detail.isCorrect
                        ? "border-success/30 bg-success/5"
                        : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            detail.isCorrect
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {detail.isCorrect ? "\u2713" : "\u2717"}
                        </span>
                        <div>
                          <span className="font-medium text-foreground block">
                            {detail.title}
                          </span>
                          <div className="flex gap-4 mt-1 text-sm">
                            <span className="text-muted-foreground">
                              Correct:{" "}
                              <span
                                className={
                                  detail.isICP
                                    ? "text-success font-medium"
                                    : "text-destructive font-medium"
                                }
                              >
                                {detail.isICP ? "ICP" : "Not ICP"}
                              </span>
                            </span>
                            {!detail.isCorrect && (
                              <span className="text-muted-foreground">
                                Your answer:{" "}
                                <span
                                  className={
                                    detail.userAnswer
                                      ? "text-success font-medium"
                                      : "text-destructive font-medium"
                                  }
                                >
                                  {detail.userAnswer ? "ICP" : "Not ICP"}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

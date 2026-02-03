"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface User {
  id: string;
  username: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/example/auth/me");
        if (!response.ok) {
          router.push("/example/login");
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        router.push("/example/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/example/auth/logout", { method: "POST" });
      router.push("/example/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - White with shadow */}
      <header className="bg-white border-b border-gray-100 shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
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
                  AI Sales Workshop - Example App
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome,{" "}
                  <span className="font-medium text-foreground">
                    {user.username}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {user.role === "admin" && (
                <Link
                  href="/example/admin/users"
                  className="px-4 py-2 text-sm font-semibold text-primary border-2 border-primary/20 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 cursor-pointer"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-destructive border border-gray-200 rounded-lg hover:border-destructive/30 hover:bg-destructive/5 transition-all duration-200 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="mb-10 animate-fade-in">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Available Applications
          </h2>
          <p className="text-muted-foreground">
            Select an application to get started
          </p>
        </div>

        {/* Application Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* LeadGen Messaging App */}
          <div
            className="group bg-white rounded-xl border border-gray-100 p-6 shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  LeadGen Messaging
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered LinkedIn message generation
                </p>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground mb-6 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                Upload opportunity data via Excel
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                Automated prospect research
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                Generate 3-message sequences
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                Export results to Excel
              </li>
            </ul>
            <Link
              href="/example/leadgen"
              className="block w-full text-center btn-accent cursor-pointer"
            >
              Open Application
            </Link>
          </div>

          {/* ICP Quiz App */}
          <div
            className="group bg-white rounded-xl border border-gray-100 p-6 shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  ICP Quiz
                </h3>
                <p className="text-sm text-muted-foreground">
                  Test your Ideal Customer Profile knowledge
                </p>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground mb-6 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Identify decision-maker titles
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                20 questions per quiz
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Instant feedback and scoring
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Track your ICP knowledge
              </li>
            </ul>
            <Link
              href="/example/icp-quiz"
              className="block w-full text-center btn-primary cursor-pointer"
            >
              Start Quiz
            </Link>
          </div>

          {/* Placeholder for future apps */}
          <div
            className="bg-white/60 rounded-xl border border-gray-100 p-6 opacity-60 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-gray-500 mb-1">
                  Coming Soon
                </h3>
                <p className="text-sm text-gray-400">
                  More AI applications in development
                </p>
              </div>
            </div>
            <button
              disabled
              className="block w-full text-center px-4 py-2.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed font-medium"
            >
              Not Available
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, BookOpen, Brain, Zap } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="absolute top-40 right-20 animate-float-delayed">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="absolute bottom-40 left-20 animate-float">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center">
            <Zap className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Generate
          <span className="block text-blue-600 dark:text-blue-400">Smart Quizzes</span>
          <span className="block text-gray-700 dark:text-gray-300">Instantly</span>
        </h1>

        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Transform your lecture content into engaging quizzes with AI. Upload materials, add questions, and get
          personalized quizzes in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-full">
            <Link href="/generate" className="flex items-center gap-2">
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 text-lg rounded-full bg-transparent"
          >
            <Link href="#features">Learn More</Link>
          </Button>
        </div>

        <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
          Powered by Google Gemini AI • Free to use • No signup required
        </div>
      </div>
    </section>
  )
}
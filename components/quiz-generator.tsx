"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Loader2, CheckCircle, Presentation } from "lucide-react"
import { QuizDisplay } from "@/components/quiz-display"
import { InteractiveQuiz } from "@/components/interactive-quiz" 

interface Quiz {
  Question: string
  Options: string[]
  Correct: string
  Explanation: string
}

interface QuizResponse {
  quizzes: Quiz[]
}

interface RawQuizResponseDisplayProps {
  rawText: string
}

interface ParsedQuestion {
  stem: string
  options: { label: string; text: string }[]
  correctAnswer: string
  explanation: string
}

/**
 * A heuristic parser for raw AI quiz text, expecting a format like:
 * 
 * **Question X:**
 * 
 * **Stem:** ...
 * **(a)** ...
 * **(b)** ...
 * **Correct Answer:** (b)
 * **Explanation:** ...
 *
 * Adjust the regexes if your format varies.
 */
function parseRawQuiz(rawText: string): ParsedQuestion[] {
  // Split the text into question sections by "**Question X:**" headings
  const questionSplits = rawText.split(/(\*\*Question \d+:\*\*)/).filter(Boolean)

  const questions: ParsedQuestion[] = []

  for (let i = 0; i < questionSplits.length; i++) {
    const header = questionSplits[i].match(/\*\*Question \d+:\*\*/)
    if (header) {
      const content = questionSplits[i + 1] || ""
      i++ // Skip the content chunk next iteration since we already handled it here

      // Extract stem text after "**Stem:**"
      const stemMatch = content.match(/\*\*Stem:\*\*\s*([\s\S]*?)(?=\*\(\w\)\*\*|\*\*Correct Answer:\*\*|\*\*Explanation:\*\*|$)/)
      const stem = stemMatch ? stemMatch[1].trim() : ""

      // Extract options - lines starting "**(a)** ..." to "**(d)** ..."
      const optionRegex = /\*\*\(([a-d])\)\*\*\s*([^\n]+)/g
      const options: { label: string; text: string }[] = []
      let optMatch: RegExpExecArray | null
      while ((optMatch = optionRegex.exec(content)) !== null) {
        options.push({ label: optMatch[1], text: optMatch[2].trim() })
      }

      // Extract correct answer e.g. "**Correct Answer:** (b)"
      const correctMatch = content.match(/\*\*Correct Answer:\*\*\s*\(([a-d])\)/)
      const correctAnswer = correctMatch ? correctMatch[1] : ""

      // Extract explanation text after "**Explanation:**"
      const explanationMatch = content.match(/\*\*Explanation:\*\*\s*([\s\S]*)/)
      const explanation = explanationMatch ? explanationMatch[1].trim() : ""

      questions.push({ stem, options, correctAnswer, explanation })
    }
  }

  return questions
}

function RawQuizResponseDisplay({ rawText }: RawQuizResponseDisplayProps) {
  const questions = parseRawQuiz(rawText)

  if (questions.length === 0) {
    // Just render raw text prettily if parsing failed
    return (
      <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-sm text-gray-900 dark:text-gray-100">
        {rawText}
      </pre>
    )
  }

  return (
    <div className="space-y-8">
      {questions.map((q, idx) => (
        <div
          key={idx}
          className="p-4 border rounded-lg bg-white dark:bg-gray-700 shadow-sm"
          aria-label={`Question ${idx + 1}`}
        >
          <h3 className="font-semibold text-lg mb-2">Question {idx + 1}</h3>
          <p className="mb-3 italic">{q.stem}</p>

          <ul className="list-disc list-inside mb-3">
            {q.options.map((opt) => (
              <li
                key={opt.label}
                className={
                  opt.label === q.correctAnswer
                    ? "font-bold text-green-700 dark:text-green-400"
                    : ""
                }
              >
                <strong>({opt.label})</strong> {opt.text}
              </li>
            ))}
          </ul>

          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded text-sm mb-2">
            <strong>Correct Answer:</strong> ({q.correctAnswer})
          </div>

          <p className="text-gray-700 dark:text-gray-300 text-sm">{q.explanation}</p>
        </div>
      ))}
    </div>
  )
}

export function QuizBattererator() {
  const [prompt, setPrompt] = useState("")
  const [numQuizzes, setNumQuizzes] = useState(5)
  const [questions, setQuestions] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [slidesFile, setSlidesFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [rawResponse, setRawResponse] = useState<string>("")
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSlidesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setSlidesFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) {
      setError("Please provide lecture content or topic")
      return
    }

    setIsLoading(true)
    setError("")
    setRawResponse("")
    setQuizzes([])

    try {
      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("num_quizzes", numQuizzes.toString())

      if (questions.trim()) {
        formData.append("questions", questions)
      }

      if (slidesFile) {
        formData.append("file", slidesFile)
      } else if (file) {
        formData.append("file", file)
      }

      const response = await fetch("http://localhost:5011/generate-quiz", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate quiz")
      }

      // Always parse whatever text output is available
      // Prefer raw_response, else try quizzes if string, else fallback to stringified data
      let quizText = ""
      if (typeof data === "string") {
        quizText = data
      } else if ("raw_response" in data && typeof data.raw_response === "string") {
        quizText = data.raw_response
      } else if ("quizzes" in data && typeof data.quizzes === "string") {
        quizText = data.quizzes
      } else {
        quizText = JSON.stringify(data)
      }

      setRawResponse(quizText)

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // If quizzes loaded successfully, show quiz display as before
  if (quizzes.length > 0) {
    return <QuizDisplay quizzes={quizzes} onReset={() => setQuizzes([])} />
  }

  if (rawResponse) {
    return (
      <Card className="...">
        <CardHeader className="...">
          <CardTitle className="...">Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <InteractiveQuiz rawText={rawResponse} />
          <div className="mt-6 text-center">
            <Button
              onClick={() => setRawResponse("")}
              variant="outline"
            >
              Back to Quiz Generator
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default: show the quiz generation form
  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 border dark:border-gray-700">
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
          Quiz Generation Form
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lecture Content and Slides Upload - Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lecture Content */}
            <div className="space-y-2">
              <Label
                htmlFor="prompt"
                className="text-base font-medium text-gray-900 dark:text-white"
              >
                Lecture Content or Topic *
              </Label>
              <Textarea
                id="prompt"
                placeholder="Enter your lecture content, topic, or key concepts you want to create quizzes about..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-40 resize-none border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Slides Upload */}
            <div className="space-y-2">
              <Label
                htmlFor="slidesFile"
                className="text-base font-medium text-gray-900 dark:text-white"
              >
                Upload Your Slides
              </Label>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-300 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-700/50 min-h-40 flex flex-col justify-center">
                <input
                  id="slidesFile"
                  type="file"
                  onChange={handleSlidesFileChange}
                  accept=".pdf,.pptx,.ppt,.key"
                  className="hidden"
                />
                <label htmlFor="slidesFile" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-3">
                    {slidesFile ? (
                      <>
                        <CheckCircle className="w-10 h-10 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {slidesFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Click to change slides
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Presentation className="w-10 h-10 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Upload Presentation Slides
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PowerPoint, PDF, Keynote supported
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Number of Quizzes */}
          <div className="space-y-2">
            <Label
              htmlFor="numQuizzes"
              className="text-base font-medium text-gray-900 dark:text-white"
            >
              Number of Questions *
            </Label>
            <Input
              id="numQuizzes"
              type="number"
              min={1}
              max={20}
              value={numQuizzes}
              onChange={(e) => setNumQuizzes(Number.parseInt(e.target.value) || 5)}
              className="border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white max-w-xs"
              required
            />
          </div>

          {/* Student Questions */}
          <div className="space-y-2">
            <Label
              htmlFor="questions"
              className="text-base font-medium text-gray-900 dark:text-white"
            >
              Specific Questions to Cover (Optional)
            </Label>
            <Textarea
              id="questions"
              placeholder="Enter specific questions from students or topics you want to ensure are covered in the quiz..."
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              className="min-h-24 resize-none border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Additional Materials Upload */}
          <div className="space-y-2">
            <Label
              htmlFor="file"
              className="text-base font-medium text-gray-900 dark:text-white"
            >
              Upload Additional Materials (Optional)
            </Label>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-300 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-700/50">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.txt,.docx,.doc,.pptx,.ppt,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.ico,.webp"
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-4">
                  {file ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Click to change file
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Documents, spreadsheets, images supported
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* File Priority Notice */}
          {slidesFile && file && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Your slides will be used as the primary source for quiz generation. Additional
                materials will be used as supplementary content.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg rounded-full disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Generate Quiz
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import React from "react"

interface RawQuizResponseDisplayProps {
  rawText: string
}

interface ParsedQuestion {
  stem: string
  options: { label: string; text: string }[]
  correctAnswer: string
  explanation: string
}

function parseRawQuiz(rawText: string): ParsedQuestion[] {
  // Split on question headers (e.g., "**Question 1:**" or "**Question 1:**\n\n**Stem:** ...")
  // This parser is heuristic and works with your sample format, you can improve if needed.
  const questionBlocks = rawText.split(/(\*\*Question \d+:\*\*)/).filter(Boolean)

  // Combine question marker + content pairs
  const questions: ParsedQuestion[] = []

  for (let i = 0; i < questionBlocks.length; i++) {
    const headerMatch = questionBlocks[i].match(/\*\*Question \d+:\*\*/)
    if (headerMatch) {
      const questionContent = questionBlocks[i + 1] || ""
      i++ // skip next since it's content for this question

      // Extract stem
      const stemMatch = questionContent.match(/\*\*Stem:\*\*\s*(.+)/)
      const stem = stemMatch ? stemMatch[1].trim() : ""

      // Extract options: lines starting with **(a)**, **(b)** etc.
      const optionRegex = /^\*\*\(([a-d])\)\*\*\s*(.+)$/gm
      const options: { label: string; text: string }[] = []
      let optMatch: RegExpExecArray | null
      while ((optMatch = optionRegex.exec(questionContent)) !== null) {
        options.push({ label: optMatch[1], text: optMatch[2].trim() })
      }

      // Extract Correct answer e.g. "**Correct Answer:** (b)"
      const correctMatch = questionContent.match(/\*\*Correct Answer:\*\*\s*\(([a-d])\)/)
      const correctAnswer = correctMatch ? correctMatch[1] : ""

      // Extract Explanation (everything after "**Explanation:**")
      const explanationMatch = questionContent.match(/\*\*Explanation:\*\*\s*([\s\S]+)/)
      const explanation = explanationMatch ? explanationMatch[1].trim() : ""

      questions.push({ stem, options, correctAnswer, explanation })
    }
  }

  return questions
}

export function RawQuizResponseDisplay({ rawText }: RawQuizResponseDisplayProps) {
  const questions = parseRawQuiz(rawText)

  if (questions.length === 0) {
    // fallback: just show raw text with simple whitespace preservation
    return (
      <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-sm text-gray-900 dark:text-gray-100">
        {rawText}
      </pre>
    )
  }

  return (
    <div className="space-y-8">
      {questions.map((q, i) => (
        <div key={i} className="p-4 border rounded-lg bg-white dark:bg-gray-700 shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Question {i + 1}</h3>
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

          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded text-sm">
            <strong>Correct Answer:</strong> ({q.correctAnswer})
          </div>

          <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm">{q.explanation}</p>
        </div>
      ))}
    </div>
  )
}

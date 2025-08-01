"use client"

import React, { useState, useEffect } from "react"

interface QuizOption {
  label: string // "A", "B", "C", "D"
  text: string
}

interface QuizQuestion {
  number: number
  stem: string
  options: QuizOption[]
  correctAnswer: string // "A", "B", "C", "D"
  explanation: string
}

function parseQuiz(rawText: string): QuizQuestion[] {
  // Match all question headers, e.g. **Question 1:**
  const questionHeaderRegex = /\*\*Question \d+:\*\*/g
  const questionHeaders = rawText.match(questionHeaderRegex)
  if (!questionHeaders) return []

  // Split text into question blocks at question headers (discard before first question)
  const questionBlocks = rawText.split(questionHeaderRegex).slice(1)

  const questions: QuizQuestion[] = []

  questionBlocks.forEach((block, idx) => {
    const number = idx + 1

    // Extract stem: text following "**Stem:**" up to start of options or Correct Answer or end of block
    const stemMatch = block.match(
      /\*\*Stem:\*\*\s*([\s\S]*?)(?=\*\*[A-D]\.\*\*|Correct Answer:|$)/
    )
    const stem = stemMatch ? stemMatch[1].trim() : ""

    // Extract options: lines like "**A.** Option text"
    const optionRegex = /\*\*([A-D])\.\*\*\s*([^\n\r]+)/g
    const options: QuizOption[] = []

    let match
    while ((match = optionRegex.exec(block)) !== null) {
      options.push({ label: match[1], text: match[2].trim() })
    }

    // Extract correct answer: line "**Correct Answer:** C" (single letter, no parentheses)
    const correctAnswerMatch = block.match(/\*\*Correct Answer:\*\*\s*([A-D])/)
    const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1] : ""

    // Extract explanation: text after "**Explanation:**" until end of block
    const explanationMatch = block.match(/\*\*Explanation:\*\*\s*([\s\S]*)/)
    const explanation = explanationMatch ? explanationMatch[1].trim() : ""

    // Add parsed question if valid stem and correct answer
    if (stem && correctAnswer) {
      questions.push({ number, stem, options, correctAnswer, explanation })
    }
  })

  return questions
}

interface InteractiveQuizProps {
  rawText: string
}

export function InteractiveQuiz({ rawText }: InteractiveQuizProps) {
  const questions = React.useMemo(() => parseQuiz(rawText), [rawText])
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    new Array(questions.length).fill(null)
  )
  const [score, setScore] = useState(0)

  // Update score when answers change
  useEffect(() => {
    let s = 0
    answers.forEach((ans, i) => {
      if (ans && ans.toUpperCase() === questions[i].correctAnswer.toUpperCase()) {
        s++
      }
    })
    setScore(s)
  }, [answers, questions])

  function handleSelect(questionIndex: number, choice: string) {
    if (answers[questionIndex] !== null) return // Don't allow changing once answered

    const newAnswers = [...answers]
    newAnswers[questionIndex] = choice
    setAnswers(newAnswers)
  }

  if (questions.length === 0) {
    return <div className="p-4">No quiz data found or failed to parse.</div>
  }

  return (
    <div className="flex flex-col lg:flex-row lg:space-x-6 p-4 max-w-5xl mx-auto">
      {/* Questions column */}
      <div className="flex-1">
        {questions.map((q, i) => {
          const userAnswer = answers[i]
          const isCorrect = userAnswer?.toUpperCase() === q.correctAnswer.toUpperCase()
          return (
            <div key={q.number} className="mb-8 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
              <h3 className="font-semibold text-xl mb-3">
                Question {q.number}
              </h3>
              <p className="mb-4 text-gray-900 dark:text-gray-100">{q.stem}</p>

              <ul className="space-y-2 mb-4">
                {q.options.map((opt) => {
                  const disabled = userAnswer !== null
                  const selected = userAnswer === opt.label
                  const correct = opt.label === q.correctAnswer

                  let optionClass = "cursor-pointer rounded-md border border-gray-300 dark:border-gray-600 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center"

                  if (disabled) {
                    if (selected && correct) {
                      optionClass += " bg-green-200 dark:bg-green-700 border-green-500"
                    } else if (selected && !correct) {
                      optionClass += " bg-red-200 dark:bg-red-700 border-red-500"
                    } else if (correct) {
                      optionClass += " bg-green-100 dark:bg-green-800 border-green-400"
                    } else {
                      optionClass += " opacity-60 cursor-not-allowed"
                    }
                  } else if (selected) {
                    optionClass += " bg-blue-100 dark:bg-blue-800 border-blue-400"
                  }

                  return (
                    <li
                      key={opt.label}
                      className={optionClass}
                      onClick={() => !disabled && handleSelect(i, opt.label)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && !disabled) {
                          e.preventDefault()
                          handleSelect(i, opt.label)
                        }
                      }}
                    >
                      <span className="font-bold mr-4 select-none">{opt.label}.</span>
                      <span>{opt.text}</span>
                      {disabled && selected && (
                        <span className="ml-auto font-bold text-xl select-none">
                          {isCorrect ? "✓" : "✗"}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>

              {userAnswer !== null && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <strong>
                    {isCorrect ? "Correct!" : `Wrong. Correct answer: ${q.correctAnswer}.`}
                  </strong>
                  <p className="mt-2 whitespace-pre-line">{q.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Score panel */}
      <aside className="w-full lg:w-60 mt-6 lg:mt-0 sticky top-20 h-min self-start">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Score</h2>
          <p className="text-lg mb-2">
            {score} / {questions.length} correct
          </p>
          <progress
            max={questions.length}
            value={score}
            className="w-full h-4 rounded bg-gray-300 dark:bg-gray-700"
          />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Select an answer for each question to see explanations and your score update.
          </p>
        </div>
      </aside>
    </div>
  )
}
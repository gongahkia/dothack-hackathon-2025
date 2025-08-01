import React from "react"

interface RawQuizResponseDisplayProps {
  rawText: string
}

interface ParsedQuestion {
  number: number
  stem: string
  options: { label: string; text: string }[]
  correctAnswer: string | null
  explanation: string
  tfAnswer?: string // handles True/False or similar
}

// Flexible parser: can be tweaked to handle the variety of LLM outputs!
function parseRawQuiz(rawText: string): ParsedQuestion[] {
  const sections = rawText.split(/\*\*Question (\d+):\*\*/g)
  const questions: ParsedQuestion[] = []
  for (let i = 1; i < sections.length; i += 2) {
    const number = Number(sections[i])
    const text = sections[i + 1] ?? ""

    // Stem
    const stemMatch = text.match(/\*\*Stem:\*\*\s*([\s\S]*?)(?=(\*\*\([a-dA-D]\)\*\*|\*\*Answer:|\*\*Correct Answer:|\*\*Explanation:|\*\*))/)
    const stem = stemMatch ? stemMatch[1].trim() : ""

    // Options
    const options: { label: string; text: string }[] = []
    const optionRegex = /\*\*\(([a-dA-D])\)\*\*\s*([^\n]+)/g
    let optMatch
    while ((optMatch = optionRegex.exec(text))) {
      options.push({ label: optMatch[1], text: optMatch[2].trim() })
    }

    // True/False style (detects Answer or Correct Answer without MC)
    let tfAnswer = null
    let tfAnswerMatch = text.match(/\*\*Answer:\*\*\s*(True|False|true|false)/i)
    if (!tfAnswerMatch) tfAnswerMatch = text.match(/\*\*Correct Answer:\*\*\s*(True|False|true|false)/i)
    if (tfAnswerMatch) tfAnswer = tfAnswerMatch[1]

    // Correct letter (multiple choice)
    let correctAnswer = null
    const correctMatch = text.match(/\*\*Correct Answer:\*\* *\(?([a-dA-D])\)?/)
    if (correctMatch) correctAnswer = correctMatch[1].toLowerCase()

    // Explanation
    const explanationMatch = text.match(/\*\*Explanation:\*\*\s*([\s\S]*)/)
    const explanation = explanationMatch ? explanationMatch[1].trim() : ""

    questions.push({
      number,
      stem,
      options,
      correctAnswer,
      explanation,
      tfAnswer: tfAnswer ? tfAnswer.trim() : undefined,
    })
  }
  return questions
}

export function RawQuizResponseDisplay({ rawText }: RawQuizResponseDisplayProps) {
  const questions = parseRawQuiz(rawText)
  if (questions.length === 0) {
    return (
      <div className="prose dark:prose-invert max-w-full">
        <p>{rawText}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {questions.map((q) => (
        <div
          key={q.number}
          className="p-6 border rounded-lg bg-white dark:bg-gray-700 shadow-sm"
        >
          <h3 className="font-semibold text-lg mb-2">
            Question {q.number}
          </h3>
          <div className="mb-3 text-gray-900 dark:text-gray-100">
            {q.stem}
          </div>
          {/* MC Options */}
          {q.options.length > 0 && (
            <div className="mb-3">
              <ul className="space-y-2">
                {q.options.map((opt) => (
                  <li
                    key={opt.label}
                    className={`flex items-start ${
                      q.correctAnswer === opt.label.toLowerCase()
                        ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500"
                        : ""
                    } rounded px-2 py-1`}
                  >
                    <span className="font-semibold min-w-[2em] mr-2">({opt.label})</span>
                    <span>{opt.text}</span>
                    {q.correctAnswer === opt.label.toLowerCase() && (
                      <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">✓</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* True/False answer */}
          {q.options.length === 0 && q.tfAnswer && (
            <div className="mb-3">
              <div>
                <span className="font-bold text-blue-700 dark:text-blue-300">Answer:</span>{" "}
                <span
                  className={
                    q.tfAnswer.toLowerCase() === "true"
                      ? "text-green-700 dark:text-green-400 font-semibold"
                      : "text-red-700 dark:text-red-400 font-semibold"
                  }
                >
                  {q.tfAnswer}
                </span>
              </div>
            </div>
          )}
          {/* Explanation */}
          {q.explanation && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm mt-2">
              <span className="font-bold text-green-700 dark:text-green-300 mr-2">
                Explanation:
              </span>
              <span className="text-gray-800 dark:text-gray-100">{q.explanation}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
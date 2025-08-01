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

function parseRawQuiz(rawJSON: string): ParsedQuestion[] {
  let parsedArray;
  try {
    parsedArray = JSON.parse(rawJSON);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    return [];
  }

  if (!Array.isArray(parsedArray)) {
    console.error("Parsed JSON is not an array");
    return [];
  }

  return parsedArray.map((item, idx) => {
    const optionsArray: { label: string; text: string }[] = [];

    if (item.options && typeof item.options === "object") {
      for (const [key, value] of Object.entries(item.options)) {
        optionsArray.push({ label: key.toLowerCase(), text: String(value) });
      }
      // Optional: sort by label a,b,c,d
      optionsArray.sort((a, b) => a.label.localeCompare(b.label));
    }

    return {
      stem: item.question ?? `Question ${idx + 1}`,
      options: optionsArray,
      correctAnswer: (item.correct ?? "").toLowerCase(),
      explanation: item.explanation ?? "",
    };
  });
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
      {questions.map((q, idx) => {
        // Assign number from idx + 1
        const number = idx + 1

        return (
          <div
            key={number}
            className="p-6 border rounded-lg bg-white dark:bg-gray-700 shadow-sm"
          >
            <h3 className="font-semibold text-lg mb-2">
              Question {number}
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
        )
      })}
    </div>
  )
}
// components/show-past-quizzes.tsx
import React from "react";

interface Quiz {
  id: string;
  title: string;
  dateCreated: string; // ISO string
  numberOfQuestions: number;
}

interface ShowPastQuizzesProps {
  quizzes: Quiz[];
}

export function ShowPastQuizzes({ quizzes }: ShowPastQuizzesProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Past Quizzes
      </h2>
      {quizzes.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 italic">No past quizzes found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Date Created</th>
                <th className="p-3 text-left"># Questions</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr
                  key={quiz.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3">{quiz.title}</td>
                  <td className="p-3">{new Date(quiz.dateCreated).toLocaleDateString()}</td>
                  <td className="p-3">{quiz.numberOfQuestions}</td>
                  <td className="p-3">
                    <a
                      href={`/quizzes/${quiz.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

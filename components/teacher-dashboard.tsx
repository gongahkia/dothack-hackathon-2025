import React from "react";

interface Student {
  name: string;
  email: string;
  // You can add more fields like avatar, lastLogin, etc.
}

interface TeacherDashboardProps {
  students: Student[];
}

export function TeacherDashboard({ students }: TeacherDashboardProps) {
  // You might fetch 'students' in the page, or do it here with useEffect and state.

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left-side panel: Quick stats, classes, and nav links */}
      <aside className="w-full lg:w-1/3 bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6 lg:mb-0">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, Teacher!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            View student progress, manage accounts, upload materials, and monitor engagement.
          </p>
        </div>

        {/* Navigation links for dashboard pages */}
        <nav className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Dashboard Menu
          </h3>
          <ul className="space-y-2">
            <li>
              <a
                href="/generate"
                className="block px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 font-medium transition"
              >
                Generate Quizzes
              </a>
            </li>
            <li>
              <a
                href="/past-quizzes"
                className="block px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 font-medium transition"
              >
                Show Past Quizzes
              </a>
            </li>
            <li>
              <a
                href="/classes"
                className="block px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 font-medium transition"
              >
                Show Classes
              </a>
            </li>
            <li>
              <a
                href="/manage-students"
                className="block px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 font-medium transition"
              >
                Manage Students
              </a>
            </li>
            <li>
              <a
                href="/teacher-dashboard" // Current dashboard, could be root if preferred
                className="block px-4 py-2 rounded bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-indigo-200 font-semibold"
              >
                Dashboard (Flagged Students)
              </a>
            </li>
          </ul>
        </nav>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <a
              href="/accounts"
              className="block px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 font-medium transition"
            >
              Manage Accounts
            </a>
            <a
              href="/upload"
              className="block px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 font-medium transition"
            >
              Upload Materials
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Overview
          </h3>
          <div className="flex gap-4">
            <div className="flex-1 bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {students.length}
              </div>
              <div className="text-sm text-blue-900 dark:text-blue-400">Students</div>
            </div>
            <div className="flex-1 bg-red-50 dark:bg-red-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-700 dark:text-red-300">7</div>
              <div className="text-sm text-red-900 dark:text-red-400">Active Classes</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content: Student list and flagged statuses */}
      <section className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Students
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Flags</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 italic text-gray-500 dark:text-gray-400">
                    No students yet
                  </td>
                </tr>
              )}
              {students.map((student, idx) => {
                // Example flagged condition: simple email includes "flag"
                const flagged = student.email.toLowerCase().includes("flag");
                return (
                  <tr
                    key={idx}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      flagged ? "bg-red-100 dark:bg-red-800" : ""
                    }`}
                  >
                    <td className="p-3">{student.name}</td>
                    <td className="p-3">{student.email}</td>
                    <td className="p-3 font-semibold">
                      {flagged ? (
                        <span className="text-red-700 dark:text-red-400">⚠️ Flagged</span>
                      ) : (
                        <span className="text-green-700 dark:text-green-400">✓ OK</span>
                      )}
                    </td>
                    <td className="p-3">
                      <a
                        href={`/students/${encodeURIComponent(student.email)}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Progress
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* You can add a footer or other dashboard widgets here */}
      </section>
    </div>
  );
}
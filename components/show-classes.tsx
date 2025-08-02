// components/show-classes.tsx
import React from "react";

interface ClassEntry {
  id: string;
  name: string;
  studentCount: number;
}

interface ShowClassesProps {
  classes: ClassEntry[];
}

export function ShowClasses({ classes }: ShowClassesProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Classes
      </h2>
      {classes.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 italic">No classes found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <th className="p-3 text-left">Class Name</th>
                <th className="p-3 text-left">Students Enrolled</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr
                  key={cls.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3">{cls.name}</td>
                  <td className="p-3">{cls.studentCount}</td>
                  <td className="p-3">
                    <a
                      href={`/classes/${cls.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Class
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
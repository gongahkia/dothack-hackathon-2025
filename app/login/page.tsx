"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";

export default function LoginPage() {
  const [step, setStep] = useState<null | "student" | "teacher">(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRoleSelect = (role: "student" | "teacher") => {
    setStep(role);
    setError("");
    setUsername("");
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError("");

    // Simulate login - replace with real authentication logic
    setTimeout(() => {
      if (username && password) {
        router.push("/dashboard");
      } else {
        setError("Please enter both username and password.");
        setLoggingIn(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <Navigation />
      <main className="py-24 flex items-center justify-center min-h-[60vh]">
        {!step ? (
          <div className="bg-white  shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col gap-6 items-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 ">Login as</h2>
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
                onClick={() => handleRoleSelect("student")}
              >
                Student
              </button>
              <button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
                onClick={() => handleRoleSelect("teacher")}
              >
                Teacher
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleLogin}
            className="bg-white  shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col gap-4"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-900 ">
              {step.charAt(0).toUpperCase() + step.slice(1)} Login
            </h2>
            <input
              type="text"
              placeholder="Username"
              className="px-4 py-2 rounded border border-gray-300  bg-gray-100  text-gray-900  focus:outline-none"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loggingIn}
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              className="px-4 py-2 rounded border border-gray-300  bg-gray-100  text-gray-900  focus:outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loggingIn}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded disabled:opacity-50"
              disabled={loggingIn}
            >
              {loggingIn ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              className="text-sm text-gray-500 hover:underline mt-2"
              onClick={() => setStep(null)}
              disabled={loggingIn}
            >
              Back
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
"use client"

import React, { useState } from "react"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { Navigation } from "@/components/navigation"
import { LoginModal } from "@/components/login-modal";

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);

  function handleLogin(role: "student" | "teacher") {
    setShowLogin(false);
    // Here you can redirect based on role, e.g.:
    if (role === "student") {
      window.location.href = "/student/workspace";
    } else {
      window.location.href = "/teacher/workspace";
    }
  }
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <main>
        <HeroSection />
        {/* Add Login button somewhere visible */}
        <div className="flex justify-center my-8">
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-3 bg-[#8B6C53] hover:bg-[#7A5B3F] text-white font-semibold rounded-md transition"
          >
            Login
          </button>
        </div>
        <FeaturesSection />
      </main>


      {/* Show modal if showLogin is true */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, FileText, DownloadCloud, CheckCircle, FileWarning, ShieldCheck, RefreshCcw } from "lucide-react";

const REPORT_TRIGGER_URL = "http://localhost:5011/generate-report";
const REPORT_DOWNLOAD_URL = "http://localhost:5011/download/report";

export function GenerateReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<string | null>(null);

  // Optionally: Check existing report info, e.g., last modified time
  async function checkReport() {
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch(REPORT_DOWNLOAD_URL, { method: "HEAD" });
      if (res.ok) {
        setDownloadUrl(REPORT_DOWNLOAD_URL);
        setIsGenerated(true);
        // Get time (if server provides it)
        const lastModified = res.headers.get("Last-Modified");
        if (lastModified) setGenerationTime(lastModified);
      } else {
        setIsGenerated(false);
        setDownloadUrl(null);
      }
    } catch (e) {
      setIsGenerated(false);
      setDownloadUrl(null);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateReport() {
    setIsGenerating(true);
    setError(null);
    setIsGenerated(false);
    setDownloadUrl(null);
    setGenerationTime(null);
    try {
      const res = await fetch(REPORT_TRIGGER_URL, { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to generate. Please check backend/logs.");
        setIsGenerating(false);
        return;
      }
      const data = await res.json();
      if (data && data.success) {
        setIsGenerated(true);
        setError(null);
        // Optionally check if report is immediately available
        setDownloadUrl(REPORT_DOWNLOAD_URL);
        checkReport();
      } else {
        setError(data?.error || "Unknown server error.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }

  // UI Rendering
  return (
    <Card className="max-w-xl mx-auto shadow-lg border-0 bg-white dark:bg-gray-800 mt-12">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Student Report Generation
        </CardTitle>
        <div className="text-gray-600 dark:text-gray-300 text-base py-2">
          Generate and download a comprehensive PDF report for your current class & quizzes.<br />
          Includes quiz statistics, explanations, individual performance, and actionable feedback for teaching improvement.
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-2/3 bg-blue-700 hover:bg-blue-800 text-white text-lg flex items-center justify-center disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />Generating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />Generate Report PDF
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isGenerating}
            onClick={checkReport}
            className="flex items-center ml-4 px-4"
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Check Existing
          </Button>
        </div>

        {/* Show download when available */}
        {isGenerated && downloadUrl && (
          <a
            href={downloadUrl}
            className="block mt-2 w-full bg-green-600 hover:bg-green-700 rounded-full text-white p-3 text-center font-semibold text-lg transition"
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            <DownloadCloud className="w-5 h-5 inline-block -mt-1 mr-1" />
            Download Latest Report
          </a>
        )}
        {/* Show last generated time if available */}
        {generationTime && (
          <div className="mt-2 text-sm text-gray-800 dark:text-gray-200 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1 text-blue-600" />
            Last Generated: <span className="ml-2">{generationTime}</span>
          </div>
        )}

        {/* Success */}
        {isGenerated && (
          <div className="flex items-center bg-green-50 border border-green-200 dark:bg-green-800 dark:border-green-700 rounded-lg p-3 mt-4">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 dark:text-green-100 font-semibold">
              Report is ready to download and review with your students!
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center bg-red-50 border border-red-200 dark:bg-red-800 dark:border-red-700 rounded-lg p-3 mt-4">
            <FileWarning className="w-5 h-5 text-red-700 mr-2" />
            <span className="text-red-800 dark:text-red-100">{error}</span>
          </div>
        )}

        <hr className="my-6" />

        <div className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Note for Teachers:</strong> <br />
          This report includes anonymised student results, question-level analytics, and detailed feedback to help you reflect and iterate on your teaching. Please ensure all necessary quiz and student data has been generated beforehand.<br />
          For privacy, keep reports secure when sharing.
        </div>
      </CardContent>
    </Card>
  );
}

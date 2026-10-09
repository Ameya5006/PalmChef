import React, { useState } from "react";
import { useRecipesStore } from "@/store/recipes";
import { extractPdfText, splitIntoSteps, parseDurationToSeconds } from "@/utils/pdfParser";
import type { RecipeStep } from "@/types";

type Mode = "file" | "link";

const AddRecipeForm: React.FC = () => {
  const addRecipe = useRecipesStore((s) => s.addRecipe);

  const [mode, setMode] = useState<Mode>("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [url, setUrl] = useState("");

  // -----------------------------
  // FILE UPLOAD
  // -----------------------------
  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const rawText = await extractPdfText(file);
      const parts = splitIntoSteps(rawText);

      const steps: RecipeStep[] = parts.map((t) => ({
        id: crypto.randomUUID(),
        text: t,
        timer: (() => {
          const seconds = parseDurationToSeconds(t);
          return seconds ? { seconds } : undefined;
        })()
      }));

      addRecipe({
        id: crypto.randomUUID(),
        title: file.name.replace(/\.pdf$/i, ""),
        sourceType: "pdf",
        sourceRef: file.name,
        createdAt: Date.now(),
        steps
      });
    } catch (err: any) {
      setError(err.message || "Failed to parse PDF.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // LINK ADD
  // -----------------------------
  const handleLinkAdd = () => {
    if (!url.trim()) return;

    addRecipe({
      id: crypto.randomUUID(),
      title: url,
      sourceType: "url",
      sourceRef: url,
      createdAt: Date.now(),
      steps: [
        {
          id: crypto.randomUUID(),
          text: `Open recipe at ${url}`
        }
      ]
    });

    setUrl("");
  };

  return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Add a Recipe
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Upload a PDF or drop in a link to build your library.
          </p>
        </div>
      </div>
      {/* Mode Switch */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("file")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            mode === "file"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          Upload PDF
        </button>

        <button
          onClick={() => setMode("link")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
              mode === "link"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          Add via Link
        </button>
      </div>

      {/* FILE MODE */}
      {mode === "file" && (
        <label className="block rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            Upload PDF
          </span>
          <input
            type="file"
            accept="application/pdf"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="mt-2 block w-full text-sm"
                      />
        </label>
      )}

      {/* LINK MODE */}
      {mode === "link" && (
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/recipe.pdf"
            className="flex-grow rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <button
            onClick={handleLinkAdd}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"          >
            Add
          </button>
        </div>
      )}

      {loading && <p className="text-sky-500 text-sm mt-2">Processing…</p>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default AddRecipeForm;

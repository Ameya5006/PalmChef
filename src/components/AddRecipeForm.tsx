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
    <div className="border rounded-xl p-6 shadow-sm bg-slate-50 dark:bg-slate-800">
      <h2 className="text-lg font-semibold mb-4">Add a Recipe</h2>

      {/* Mode Switch */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("file")}
          className={`px-4 py-2 rounded-md ${
            mode === "file"
              ? "bg-sky-500 text-white"
              : "bg-slate-200 dark:bg-slate-700"
          }`}
        >
          Upload PDF
        </button>

        <button
          onClick={() => setMode("link")}
          className={`px-4 py-2 rounded-md ${
            mode === "link"
              ? "bg-sky-500 text-white"
              : "bg-slate-200 dark:bg-slate-700"
          }`}
        >
          Add via Link
        </button>
      </div>

      {/* FILE MODE */}
      {mode === "file" && (
        <label className="block">
          <span className="text-sm">Upload PDF:</span>
          <input
            type="file"
            accept="application/pdf"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="mt-1 block w-full text-sm"
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
            className="flex-grow rounded-md border p-2 text-sm dark:bg-slate-900 dark:border-slate-700"
          />
          <button
            onClick={handleLinkAdd}
            className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600"
          >
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

"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Download,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge } from "@/components/admin/StudioUI";
import { TestQuestion, QuestionOption } from "@/types";

interface BulkQuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedQuestions: TestQuestion[], mode: "append" | "replace") => void;
  existingQuestionsCount: number;
}

/**
 * Robust CSV parser handling multiline quotes, escaped quotes, and commas
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = "";
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function BulkQuestionImportModal({
  isOpen,
  onClose,
  onImport,
  existingQuestionsCount,
}: BulkQuestionImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rawParsedQuestions, setRawParsedQuestions] = useState<TestQuestion[]>([]);
  const [parsedQuestions, setParsedQuestions] = useState<TestQuestion[]>([]);
  const [negativeMarkingPolicy, setNegativeMarkingPolicy] = useState<
    "file" | "25percent" | "33percent" | "1mark" | "zero"
  >("file");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const applyNegativeMarkingPolicy = (
    questions: TestQuestion[],
    policy: "file" | "25percent" | "33percent" | "1mark" | "zero"
  ) => {
    return questions.map((q) => {
      let neg = q.negativeMarks ?? 0;
      if (policy === "25percent") {
        neg = Number((q.marks * 0.25).toFixed(2));
      } else if (policy === "33percent") {
        neg = Number((q.marks * (1 / 3)).toFixed(2));
      } else if (policy === "1mark") {
        neg = 1;
      } else if (policy === "zero") {
        neg = 0;
      }
      return { ...q, negativeMarks: neg };
    });
  };

  const handlePolicyChange = (newPolicy: "file" | "25percent" | "33percent" | "1mark" | "zero") => {
    setNegativeMarkingPolicy(newPolicy);
    setParsedQuestions(applyNegativeMarkingPolicy(rawParsedQuestions, newPolicy));
  };

  const handleDownloadCSVTemplate = () => {
    const headers =
      "question,optionA,optionB,optionC,optionD,correctOption,marks,negativeMarks,topic,explanation\n";
    const sampleRows = [
      '"What is the SI unit of electrical current?","Ampere","Volt","Ohm","Coulomb","A",4,1,"General Physics","The ampere (symbol: A) is the base SI unit of electric current."',
      '"Which gas is most abundant in Earth\'s atmosphere?","Oxygen","Nitrogen","Carbon Dioxide","Argon","B",4,1,"Chemistry","Nitrogen accounts for approximately 78% of Earth\'s atmosphere by volume."',
      '"What is the derivative of sin(x) with respect to x?","cos(x)","-cos(x)","tan(x)","-sin(x)","A",4,1,"Mathematics","By differentiation rules, d/dx[sin(x)] = cos(x)."',
      '"A vehicle moves at uniform speed of 72 km/h. What is its speed in m/s?","15 m/s","20 m/s","25 m/s","30 m/s","B",4,1,"Mechanics","72 * (5/18) = 20 m/s."',
      '"Sample Non-Negative / CBSE Question: Frequency of AC current in India?","50 Hz","60 Hz","100 Hz","220 Hz","A",2,0,"Electricity","Demonstrates standard 0 penalty when tests do not enforce negative marking."',
    ].join("\n");

    const blob = new Blob([headers + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "testorbit_sample_questions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSONTemplate = () => {
    const sample = [
      {
        question: "What is the SI unit of electrical current?",
        options: [
          { id: "A", text: "Ampere" },
          { id: "B", text: "Volt" },
          { id: "C", text: "Ohm" },
          { id: "D", text: "Coulomb" },
        ],
        correctOptionId: "A",
        marks: 4,
        negativeMarks: 1,
        topic: "General Physics",
        explanation: "The ampere (symbol: A) is the base SI unit of electric current.",
      },
      {
        question: "Which gas is most abundant in Earth's atmosphere?",
        options: [
          { id: "A", text: "Oxygen" },
          { id: "B", text: "Nitrogen" },
          { id: "C", text: "Carbon Dioxide" },
          { id: "D", text: "Argon" },
        ],
        correctOptionId: "B",
        marks: 4,
        negativeMarks: 1,
        topic: "Chemistry",
        explanation: "Nitrogen accounts for approximately 78% of Earth's atmosphere by volume.",
      },
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "testorbit_sample_questions.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setParsing(true);
    setErrorMsg(null);
    setWarnings([]);
    setParsedQuestions([]);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          throw new Error("The selected file is empty.");
        }

        if (selectedFile.name.endsWith(".json")) {
          parseJSONContent(text);
        } else {
          parseCSVContent(text);
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to parse file.");
        setParsedQuestions([]);
      } finally {
        setParsing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg("Failed to read the uploaded file.");
      setParsing(false);
    };

    reader.readAsText(selectedFile);
  };

  const parseJSONContent = (rawText: string) => {
    const parsed = JSON.parse(rawText);
    const rawList: any[] = Array.isArray(parsed)
      ? parsed
      : parsed.questions && Array.isArray(parsed.questions)
      ? parsed.questions
      : [parsed];

    if (rawList.length === 0) {
      throw new Error("No question records found in JSON.");
    }

    const localWarnings: string[] = [];
    const questions: TestQuestion[] = rawList.map((item, idx) => {
      const qNum = idx + 1;
      const text = item.text || item.question || item.statement || `Question ${qNum}`;

      let options: QuestionOption[] = [];
      if (Array.isArray(item.options)) {
        if (typeof item.options[0] === "string") {
          const ids: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
          options = item.options.slice(0, 4).map((optText: string, oIdx: number) => ({
            id: ids[oIdx] || "A",
            text: String(optText),
          }));
        } else {
          options = item.options.map((opt: any, oIdx: number) => ({
            id: (opt.id || ["A", "B", "C", "D"][oIdx] || "A") as "A" | "B" | "C" | "D",
            text: String(opt.text || opt.title || ""),
          }));
        }
      }

      // Ensure 4 options exist
      const neededIds: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
      while (options.length < 4) {
        const nextId = neededIds[options.length] || "D";
        options.push({ id: nextId, text: `Option ${nextId}` });
      }

      let correctOptionId: "A" | "B" | "C" | "D" = "A";
      const rawAns = String(item.correctOptionId || item.correctOption || item.correctAnswer || item.answer || "")
        .trim()
        .toUpperCase();

      if (["A", "B", "C", "D"].includes(rawAns)) {
        correctOptionId = rawAns as "A" | "B" | "C" | "D";
      } else if (["0", "1", "2", "3"].includes(rawAns)) {
        correctOptionId = (["A", "B", "C", "D"][parseInt(rawAns)] || "A") as "A" | "B" | "C" | "D";
      } else {
        const foundIdx = options.findIndex(
          (o) => o.text.trim().toLowerCase() === rawAns.toLowerCase()
        );
        if (foundIdx >= 0) {
          correctOptionId = options[foundIdx].id;
        } else {
          localWarnings.push(`Question #${qNum}: Correct answer unrecognized, set to Option A.`);
        }
      }

      let marks = 4;
      if (item.marks !== undefined && item.marks !== null) {
        const parsedMarks = typeof item.marks === "number" ? item.marks : parseFloat(String(item.marks).trim());
        if (!isNaN(parsedMarks) && parsedMarks > 0) {
          marks = parsedMarks;
        }
      }

      let negativeMarks = 0;
      const rawNegItem = item.negativeMarks ?? item.negativeMarking ?? item.penalty ?? item.negMarks;
      if (rawNegItem !== undefined && rawNegItem !== null) {
        const parsedNeg = typeof rawNegItem === "number" ? rawNegItem : parseFloat(String(rawNegItem).trim());
        if (!isNaN(parsedNeg)) {
          negativeMarks = Math.abs(parsedNeg);
        } else if (["no", "none", "nil", "zero"].includes(String(rawNegItem).trim().toLowerCase())) {
          negativeMarks = 0;
        }
      } else {
        negativeMarks = Number((marks * 0.25).toFixed(2));
      }

      return {
        id: "q-" + Date.now().toString(36) + "-" + idx,
        questionNumber: qNum,
        text,
        options,
        correctOptionId,
        marks,
        negativeMarks,
        topic: item.topic || item.subject || "General",
        explanation: item.explanation || item.solution || "",
      };
    });

    setWarnings(localWarnings);
    setRawParsedQuestions(questions);
    setParsedQuestions(applyNegativeMarkingPolicy(questions, negativeMarkingPolicy));
  };

  const parseCSVContent = (rawText: string) => {
    const rows = parseCSV(rawText);
    if (rows.length < 2) {
      throw new Error("CSV file must contain at least a header row and 1 question row.");
    }

    const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const dataRows = rows.slice(1);

    const findCol = (candidates: string[]) => {
      return header.findIndex((h) => candidates.includes(h));
    };

    const textIdx = findCol(["question", "questiontext", "text", "statement", "q"]);
    const optAIdx = findCol(["optiona", "a", "opt1", "option1"]);
    const optBIdx = findCol(["optionb", "b", "opt2", "option2"]);
    const optCIdx = findCol(["optionc", "c", "opt3", "option3"]);
    const optDIdx = findCol(["optiond", "d", "opt4", "option4"]);
    const combinedOptsIdx = findCol(["options", "choices"]);
    const correctIdx = findCol(["correctoption", "correctanswer", "answer", "ans", "correct"]);
    const marksIdx = findCol(["marks", "mark", "score"]);
    const negMarksIdx = findCol([
      "negativemarks",
      "negativemarking",
      "negmarks",
      "negmarking",
      "negativemark",
      "negmark",
      "negative",
      "penalty",
      "penaltymarks",
      "penaltymark",
      "minusmarks",
      "minusmark",
      "deduction",
      "deductions",
      "negativescore",
      "negscore",
    ]);
    const topicIdx = findCol(["topic", "subject", "chapter", "tag"]);
    const explanationIdx = findCol(["explanation", "solution", "rationale"]);

    if (textIdx === -1) {
      throw new Error(
        "Could not detect question text column. Expected 'question', 'text', or 'statement' header."
      );
    }

    const localWarnings: string[] = [];
    const questions: TestQuestion[] = [];

    dataRows.forEach((row, idx) => {
      const qNum = idx + 1;
      const questionText = row[textIdx]?.trim();
      if (!questionText) {
        return; // skip empty rows
      }

      let optionTexts: string[] = [];
      if (optAIdx !== -1 && optBIdx !== -1) {
        optionTexts = [
          row[optAIdx] || "Option A",
          row[optBIdx] || "Option B",
          optCIdx !== -1 && row[optCIdx] ? row[optCIdx] : "Option C",
          optDIdx !== -1 && row[optDIdx] ? row[optDIdx] : "Option D",
        ];
      } else if (combinedOptsIdx !== -1 && row[combinedOptsIdx]) {
        const splitByPipe = row[combinedOptsIdx].split("|");
        optionTexts = splitByPipe.length > 1 ? splitByPipe : row[combinedOptsIdx].split(",");
      }

      while (optionTexts.length < 4) {
        const needed = ["A", "B", "C", "D"][optionTexts.length];
        optionTexts.push(`Option ${needed}`);
      }

      const options: QuestionOption[] = [
        { id: "A", text: optionTexts[0]?.trim() || "Option A" },
        { id: "B", text: optionTexts[1]?.trim() || "Option B" },
        { id: "C", text: optionTexts[2]?.trim() || "Option C" },
        { id: "D", text: optionTexts[3]?.trim() || "Option D" },
      ];

      let correctOptionId: "A" | "B" | "C" | "D" = "A";
      const rawAns = (correctIdx !== -1 ? row[correctIdx] : "")?.trim().toUpperCase();

      if (["A", "B", "C", "D"].includes(rawAns)) {
        correctOptionId = rawAns as "A" | "B" | "C" | "D";
      } else if (["0", "1", "2", "3"].includes(rawAns)) {
        correctOptionId = (["A", "B", "C", "D"][parseInt(rawAns)] || "A") as "A" | "B" | "C" | "D";
      } else if (rawAns) {
        const found = options.findIndex(
          (o) => o.text.trim().toLowerCase() === rawAns.toLowerCase()
        );
        if (found >= 0) {
          correctOptionId = options[found].id;
        } else {
          localWarnings.push(`Row ${qNum + 1}: Unrecognized answer "${rawAns}", set to Option A.`);
        }
      } else {
        localWarnings.push(`Row ${qNum + 1}: Missing answer column, defaulted to Option A.`);
      }

      let marks = 4;
      if (marksIdx !== -1 && row[marksIdx] !== undefined && row[marksIdx].trim() !== "") {
        const parsedMarks = parseFloat(row[marksIdx].trim());
        if (!isNaN(parsedMarks) && parsedMarks > 0) {
          marks = parsedMarks;
        }
      }

      let negativeMarks = 0;
      if (negMarksIdx !== -1 && row[negMarksIdx] !== undefined && row[negMarksIdx].trim() !== "") {
        const rawNeg = row[negMarksIdx].trim();
        const parsedNeg = parseFloat(rawNeg);
        if (!isNaN(parsedNeg)) {
          negativeMarks = Math.abs(parsedNeg);
        } else if (["no", "none", "nil", "zero"].includes(rawNeg.toLowerCase())) {
          negativeMarks = 0;
        }
      } else {
        // If negative marks column is absent in the CSV, default to 25% of question marks
        negativeMarks = Number((marks * 0.25).toFixed(2));
      }

      const topic = topicIdx !== -1 && row[topicIdx] ? row[topicIdx].trim() : "General";
      const explanation =
        explanationIdx !== -1 && row[explanationIdx] ? row[explanationIdx].trim() : "";

      questions.push({
        id: "q-" + Date.now().toString(36) + "-" + idx,
        questionNumber: qNum,
        text: questionText,
        options,
        correctOptionId,
        marks,
        negativeMarks,
        topic,
        explanation,
      });
    });

    if (questions.length === 0) {
      throw new Error("No valid question rows found in the CSV file.");
    }

    setWarnings(localWarnings);
    setRawParsedQuestions(questions);
    setParsedQuestions(applyNegativeMarkingPolicy(questions, negativeMarkingPolicy));
  };

  const handleConfirmImport = () => {
    if (parsedQuestions.length === 0) return;
    onImport(parsedQuestions, importMode);
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Bulk Import Questions</h2>
                <StudioBadge variant="info">CSV / JSON</StudioBadge>
              </div>
              <p className="text-xs text-slate-500">
                Upload questions in bulk and attach them directly to this mock test.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Template Download Bar */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-start gap-2 text-indigo-900">
              <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Need standard formatting?</span>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Download ready-to-fill templates with required columns and answer structures.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadCSVTemplate}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50/50 shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV Template</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJSONTemplate}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50/50 shadow-xs transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-blue-600" />
                <span>JSON Template</span>
              </button>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/40"
                : "border-slate-200 hover:border-indigo-300 bg-slate-50/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processFile(f);
              }}
              className="hidden"
            />

            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 mx-auto mb-2">
              <Upload className="w-5 h-5 text-indigo-600" />
            </div>

            <p className="text-xs font-semibold text-slate-800">
              {file ? file.name : "Drag & drop your CSV or JSON file here"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports standard MCQ formatting up to 10MB
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{file ? "Choose Another File" : "Browse Computer"}</span>
            </button>
          </div>

          {/* Parsing Status */}
          {parsing && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Parsing and validating questions...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Parse Error:</span> {errorMsg}
              </div>
            </div>
          )}

          {/* Success Summary & Mode Selection */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    Successfully validated {parsedQuestions.length} questions from{" "}
                    {file?.name || "file"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                >
                  {isPreviewExpanded ? "Hide Preview" : "Inspect Preview"}
                  {isPreviewExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Import Notice ({warnings.length} adjustments made):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-700 max-h-24 overflow-y-auto space-y-0.5">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mode Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Import Action for Current Test
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      importMode === "append"
                        ? "bg-white border-indigo-500 shadow-xs text-slate-900"
                        : "bg-transparent border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === "append"}
                      onChange={() => setImportMode("append")}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="font-semibold block">Append Questions</span>
                      <span className="text-[11px] text-slate-500">
                        Add to current {existingQuestionsCount} question(s) (Total will be{" "}
                        {existingQuestionsCount + parsedQuestions.length})
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      importMode === "replace"
                        ? "bg-white border-rose-500 shadow-xs text-slate-900"
                        : "bg-transparent border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="mt-0.5 text-rose-600"
                    />
                    <div>
                      <span className="font-semibold block text-rose-700">
                        Replace Existing
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Overwrite all {existingQuestionsCount} question(s) with these{" "}
                        {parsedQuestions.length} questions
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Negative Marking Policy Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Negative Marking Calibration
                  </span>
                  <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {parsedQuestions.some((q) => (q.negativeMarks || 0) > 0)
                      ? `Negative marking applied (${parsedQuestions.filter((q) => (q.negativeMarks || 0) > 0).length} of ${parsedQuestions.length} items)`
                      : "No Negative Marking (0 Penalty)"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Choose how negative marks should be assigned to imported questions.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {[
                    { id: "file", label: "File Values", desc: "Keep CSV/JSON values" },
                    { id: "25percent", label: "25% of Marks", desc: "-0.5 for 2M, -1 for 4M" },
                    { id: "33percent", label: "1/3rd of Marks", desc: "-0.66 for 2M, -1.33 for 4M" },
                    { id: "1mark", label: "-1 Mark Flat", desc: "-1 mark per wrong MCQ" },
                    { id: "zero", label: "No Penalty (0)", desc: "CBSE / Non-negative" },
                  ].map((policy) => (
                    <button
                      key={policy.id}
                      type="button"
                      onClick={() => handlePolicyChange(policy.id as any)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        negativeMarkingPolicy === policy.id
                          ? "bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600/20"
                          : "bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`block text-xs font-bold ${
                          negativeMarkingPolicy === policy.id ? "text-indigo-700" : "text-slate-800"
                        }`}
                      >
                        {policy.label}
                      </span>
                      <span className="block text-[10px] text-slate-500 leading-tight mt-0.5">
                        {policy.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Preview List */}
              {isPreviewExpanded && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {parsedQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 bg-white space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">
                          Question #{idx + 1} • {q.topic}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">
                            Correct: Option {q.correctOptionId}
                          </span>
                          <span className="text-slate-600 font-mono font-medium">
                            +{q.marks}M {q.negativeMarks !== undefined && q.negativeMarks > 0 ? `(-${q.negativeMarks}M)` : "(No -ve)"}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-700 font-medium line-clamp-2">{q.text}</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 pt-1">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`px-1.5 py-0.5 rounded ${
                              opt.id === q.correctOptionId
                                ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                                : "bg-slate-50"
                            }`}
                          >
                            <span className="font-bold">{opt.id}:</span> {opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={parsedQuestions.length === 0 || parsing}
            onClick={handleConfirmImport}
            className="text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>
              Import {parsedQuestions.length > 0 ? `${parsedQuestions.length} Questions` : ""}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

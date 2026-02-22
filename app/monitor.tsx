"use client";

import { useState } from "react";
import SearchBar from "./searchbar";
import { Badge } from "@/components/ui/badge";

interface PageDiff {
  url: string;
  status: "new" | "changed" | "unchanged";
  oldContent?: string;
  newContent: string;
  addedLines: number;
  removedLines: number;
}

function computeDiff(oldText: string, newText: string): { added: number; removed: number; lines: { type: "add" | "remove" | "same"; text: string }[] } {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const lines: { type: "add" | "remove" | "same"; text: string }[] = [];
  let added = 0, removed = 0;
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length) { lines.push({ type: "add", text: newLines[i] }); added++; }
    else if (i >= newLines.length) { lines.push({ type: "remove", text: oldLines[i] }); removed++; }
    else if (oldLines[i] !== newLines[i]) { lines.push({ type: "remove", text: oldLines[i] }); lines.push({ type: "add", text: newLines[i] }); added++; removed++; }
    else { lines.push({ type: "same", text: oldLines[i] }); }
  }
  return { added, removed, lines };
}

export default function Monitor() {
  const [data, setData] = useState<any[] | null>(null);
  const [previousData, setPreviousData] = useState<Map<string, string>>(new Map());
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const diffs: PageDiff[] = (data || []).filter((p) => p?.url).map((page) => {
    const oldContent = previousData.get(page.url);
    if (!oldContent) return { url: page.url, status: "new" as const, newContent: page.content || "", addedLines: (page.content || "").split("\n").length, removedLines: 0 };
    if (oldContent === (page.content || "")) return { url: page.url, status: "unchanged" as const, oldContent, newContent: page.content || "", addedLines: 0, removedLines: 0 };
    const { added, removed } = computeDiff(oldContent, page.content || "");
    return { url: page.url, status: "changed" as const, oldContent, newContent: page.content || "", addedLines: added, removedLines: removed };
  });

  const changed = diffs.filter((d) => d.status === "changed").length;
  const unchanged = diffs.filter((d) => d.status === "unchanged").length;
  const newPages = diffs.filter((d) => d.status === "new").length;
  const selectedDiff = diffs.find((d) => d.url === selectedUrl);
  const diffLines = selectedDiff?.oldContent ? computeDiff(selectedDiff.oldContent, selectedDiff.newContent).lines : null;

  const onSaveComplete = () => {
    const newMap = new Map(previousData);
    (data || []).forEach((p) => { if (p?.url) newMap.set(p.url, p.content || ""); });
    setPreviousData(newMap);
  };

  return (
    <div className="flex flex-col h-screen">
      <SearchBar setDataValues={setData} onSaveComplete={onSaveComplete} />
      <div className="flex-1 overflow-auto p-4">
        {diffs.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-500">{changed}</p>
                <p className="text-sm text-muted-foreground">Changed</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{unchanged}</p>
                <p className="text-sm text-muted-foreground">Unchanged</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{newPages}</p>
                <p className="text-sm text-muted-foreground">New</p>
              </div>
            </div>
            <div className="flex gap-4 h-[calc(100vh-250px)]">
              <div className="w-1/3 border rounded-lg overflow-auto">
                {diffs.map((diff) => (
                  <button key={diff.url} className={`w-full text-left p-3 border-b hover:bg-muted/50 text-sm ${selectedUrl === diff.url ? "bg-muted" : ""}`} onClick={() => setSelectedUrl(diff.url)}>
                    <div className="flex items-center gap-2">
                      <Badge variant={diff.status === "changed" ? "secondary" : diff.status === "new" ? "default" : "outline"} className="text-xs">{diff.status}</Badge>
                      <span className="truncate">{diff.url}</span>
                    </div>
                    {diff.status === "changed" && <p className="text-xs text-muted-foreground mt-1">+{diff.addedLines} -{diff.removedLines}</p>}
                  </button>
                ))}
              </div>
              <div className="flex-1 border rounded-lg overflow-auto font-mono text-xs">
                {diffLines ? diffLines.map((line, i) => (
                  <div key={i} className={`px-3 py-0.5 ${line.type === "add" ? "bg-green-500/10 text-green-400" : line.type === "remove" ? "bg-red-500/10 text-red-400" : ""}`}>
                    <span className="inline-block w-6 text-muted-foreground mr-2">{i + 1}</span>
                    <span className="mr-2">{line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}</span>
                    {line.text}
                  </div>
                )) : selectedDiff ? (
                  <pre className="p-3 whitespace-pre-wrap">{selectedDiff.newContent}</pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">Select a page to view diff</div>
                )}
              </div>
            </div>
          </>
        )}
        {!data && <div className="flex items-center justify-center h-full text-muted-foreground">Enter a URL to monitor changes</div>}
      </div>
    </div>
  );
}

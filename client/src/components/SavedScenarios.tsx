/*
 * Saved Scenarios panel — Apple-style floating card.
 * Shows saved scenarios with load/rename/delete + checkbox selection for comparison.
 */

import { useState } from "react";
import type { SavedScenario } from "@/hooks/useScenarios";
import type { CalculatorInputs } from "@/lib/calculator";
import { formatNumber } from "@/lib/calculator";
import { Trash2, RotateCcw, Pencil, Check, X, Bookmark, GitCompareArrows } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

interface SavedScenariosProps {
  scenarios: SavedScenario[];
  onLoad: (inputs: CalculatorInputs) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onCompare: (a: SavedScenario, b: SavedScenario) => void;
}

export default function SavedScenarios({
  scenarios,
  onLoad,
  onDelete,
  onRename,
  onCompare,
}: SavedScenariosProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Max 2 selections
        if (next.size >= 2) {
          // Remove the oldest selection
          const first = next.values().next().value;
          if (first) next.delete(first);
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleCompare = () => {
    const ids = Array.from(selectedIds);
    if (ids.length !== 2) return;
    const a = scenarios.find((s) => s.id === ids[0]);
    const b = scenarios.find((s) => s.id === ids[1]);
    if (a && b) {
      onCompare(a, b);
      setSelectedIds(new Set());
    }
  };

  if (scenarios.length === 0) {
    return (
      <div className="apple-card p-6 text-center">
        <Bookmark className="w-8 h-8 text-[#86868b]/40 mx-auto mb-3" />
        <p className="text-[15px] font-medium text-[#86868b]">No saved scenarios</p>
        <p className="text-[13px] text-[#86868b]/70 mt-1">
          Run a simulation and save it to compare later.
        </p>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canCompare = selectedIds.size === 2;

  return (
    <div className="apple-card overflow-hidden">
      {/* Header with Compare button */}
      <div className="p-5 md:p-6 pb-3 flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight flex items-center gap-2">
          <Bookmark className="w-4.5 h-4.5 text-[#0071e3]" />
          Saved Scenarios
          <span className="text-[13px] font-normal text-[#86868b] ml-1">
            ({scenarios.length})
          </span>
        </h3>

        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && !canCompare && (
            <span className="text-[12px] text-[#86868b]">
              Select {2 - selectedIds.size} more to compare
            </span>
          )}
          {scenarios.length >= 2 && (
            <button
              onClick={handleCompare}
              disabled={!canCompare}
              className={`
                flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-[8px] transition-all duration-200
                ${canCompare
                  ? "text-white bg-[#0071e3] hover:bg-[#0077ed] shadow-[0_1px_4px_rgba(0,113,227,0.2)]"
                  : "text-[#86868b] bg-[#f5f5f7] cursor-not-allowed"
                }
              `}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              Compare
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-[#f5f5f7]">
        {scenarios.map((s) => {
          const isSelected = selectedIds.has(s.id);
          return (
            <div
              key={s.id}
              className={`
                px-5 md:px-6 py-4 transition-colors group
                ${isSelected ? "bg-[#0071e3]/[0.03]" : "hover:bg-[#f5f5f7]/50"}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox for comparison selection */}
                {scenarios.length >= 2 && (
                  <div className="pt-0.5 shrink-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(s.id)}
                      className="rounded-[5px] border-[#d2d2d7] data-[state=checked]:bg-[#0071e3] data-[state=checked]:border-[#0071e3]"
                    />
                  </div>
                )}

                {/* Name + summary */}
                <div className="flex-1 min-w-0">
                  {editingId === s.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editName.trim()) {
                            onRename(s.id, editName);
                            setEditingId(null);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="apple-input text-[14px] py-1.5 px-2.5 flex-1"
                      />
                      <button
                        onClick={() => {
                          if (editName.trim()) {
                            onRename(s.id, editName);
                            setEditingId(null);
                          }
                        }}
                        className="p-1.5 rounded-[6px] text-[#34c759] hover:bg-[#34c759]/10 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-[6px] text-[#86868b] hover:bg-[#86868b]/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[15px] font-medium text-[#1d1d1f] truncate">
                        {s.name}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        <span className="text-[12px] text-[#86868b]">
                          10Y: <span className="text-[#1d1d1f] font-medium">RM {formatNumber(s.results.equity10.toFixed(0))}</span>
                        </span>
                        <span className="text-[12px] text-[#86868b]">
                          20Y: <span className="text-[#1d1d1f] font-medium">RM {formatNumber(s.results.equity20.toFixed(0))}</span>
                        </span>
                        <span className="text-[12px] text-[#86868b]">
                          30Y: <span className="text-[#1d1d1f] font-medium">RM {formatNumber(s.results.equity30.toFixed(0))}</span>
                        </span>
                        <span className="text-[12px] text-[#86868b]">
                          {s.results.propertiesOwned} properties
                        </span>
                      </div>
                      <p className="text-[11px] text-[#86868b]/60 mt-1">
                        {formatDate(s.savedAt)}
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                {editingId !== s.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onLoad(s.inputs)}
                          className="p-2 rounded-[8px] text-[#0071e3] hover:bg-[#0071e3]/10 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>Load this scenario</p></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setEditingId(s.id);
                            setEditName(s.name);
                          }}
                          className="p-2 rounded-[8px] text-[#86868b] hover:bg-[#86868b]/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>Rename</p></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onDelete(s.id)}
                          className="p-2 rounded-[8px] text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>Delete</p></TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

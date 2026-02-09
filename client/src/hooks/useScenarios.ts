import { useState, useCallback, useEffect } from "react";
import type { CalculatorInputs, FullSimulationResult } from "@/lib/calculator";

export interface SavedScenario {
  id: string;
  name: string;
  inputs: CalculatorInputs;
  results: {
    equity10: number;
    equity20: number;
    equity30: number;
    propertiesOwned: number;
  };
  savedAt: string; // ISO date string
}

const STORAGE_KEY = "propertylab_scenarios";

function loadFromStorage(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedScenario[];
  } catch {
    return [];
  }
}

function saveToStorage(scenarios: SavedScenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function useScenarios() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);

  // Load on mount
  useEffect(() => {
    setScenarios(loadFromStorage());
  }, []);

  const saveScenario = useCallback(
    (name: string, inputs: CalculatorInputs, results: FullSimulationResult) => {
      const newScenario: SavedScenario = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name.trim(),
        inputs,
        results: {
          equity10: results.results10.netEquity,
          equity20: results.results20.netEquity,
          equity30: results.results30.netEquity,
          propertiesOwned: results.results30.propertiesOwned,
        },
        savedAt: new Date().toISOString(),
      };
      setScenarios((prev) => {
        const updated = [newScenario, ...prev];
        saveToStorage(updated);
        return updated;
      });
    },
    []
  );

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const renameScenario = useCallback((id: string, newName: string) => {
    setScenarios((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, name: newName.trim() } : s
      );
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return { scenarios, saveScenario, deleteScenario, renameScenario };
}

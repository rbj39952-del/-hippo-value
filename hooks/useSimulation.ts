"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SimOutput } from "@/lib/engine";
import { simulate } from "@/lib/engine";

/** Simulation en arrière-plan (Web Worker), repli sur le thread principal. */
export function useSimulation() {
  const worker = useRef<Worker | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    try {
      worker.current = new Worker(new URL("../lib/sim.worker.ts", import.meta.url));
    } catch {
      worker.current = null;
    }
    return () => worker.current?.terminate();
  }, []);

  const run = useCallback(
    (scores: number[], runs = 5000, sigma = 8) =>
      new Promise<SimOutput>((resolve) => {
        setRunning(true);
        const done = (o: SimOutput) => {
          setRunning(false);
          resolve(o);
        };
        const w = worker.current;
        if (!w) return done(simulate(scores, runs, sigma));
        w.onmessage = (e: MessageEvent<SimOutput>) => done(e.data);
        w.postMessage({ scores, runs, sigma });
      }),
    []
  );

  return { run, running };
}

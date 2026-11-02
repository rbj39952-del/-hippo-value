import { simulate } from "./engine";

self.onmessage = (e: MessageEvent<{ scores: number[]; runs: number; sigma: number }>) => {
  const { scores, runs, sigma } = e.data;
  (self as unknown as Worker).postMessage(simulate(scores, runs, sigma));
};

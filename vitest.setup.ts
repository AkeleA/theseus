import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("@upstash/redis", () => {
  const store = new Map<string, string>();
  class Redis {
    async get(k: string) {
      return store.get(k) ?? null;
    }
    async set(k: string, v: string) {
      store.set(k, v);
      return "OK";
    }
    async del() {
      return 1;
    }
  }
  return { Redis };
});

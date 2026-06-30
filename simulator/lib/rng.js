/** Seeded pseudo-random number generator (LCG) for deterministic demos */
export function createRng(seed = Date.now()) {
  let state = (Number(seed) >>> 0) || 1;
  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    },
    bool(probability = 0.5) {
      return this.next() < probability;
    },
  };
}

let globalRng = createRng();

export function setSeed(seed) {
  globalRng = createRng(seed);
}

export function getRng() {
  return globalRng;
}

export function pick(arr) {
  return globalRng.pick(arr);
}

export function randomInt(min, max) {
  return globalRng.int(min, max);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isoNow(offsetSeconds = 0) {
  return new Date(Date.now() + offsetSeconds * 1000).toISOString();
}

export function offsetTimestamp(baseDate, offsetSeconds) {
  return new Date(baseDate.getTime() + offsetSeconds * 1000).toISOString();
}

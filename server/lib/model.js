// model.js — simple typing-behavior model
export function extractFeatures(events) {
  const down = new Map();
  const holdTimes = [];
  const pressTimes = [];

  for (const e of events) {
    if (e.d === "down") {
      if (down.has(e.k)) continue;
      down.set(e.k, e.t);
      pressTimes.push(e.t);
    } else if (e.d === "up") {
      const t0 = down.get(e.k);
      if (t0 != null) {
        holdTimes.push(e.t - t0);
        down.delete(e.k);
      }
    }
  }

  const iki = [];
  for (let i = 1; i < pressTimes.length; i++)
    iki.push(pressTimes[i] - pressTimes[i - 1]);

  const stats = (arr) => {
    if (!arr.length) return { mean: 0, std: 0 };
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = Math.sqrt(
      arr.reduce((s, x) => s + (x - mean) * (x - mean), 0) /
        Math.max(1, arr.length - 1)
    );
    return { mean, std };
  };

  const h = stats(holdTimes);
  const i = stats(iki);
  return { vec: [h.mean, h.std, i.mean, i.std], n: { ht: holdTimes.length, iki: iki.length } };
}

function cosine(a, b) {
  let dp = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dp += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dp / (Math.sqrt(na) * Math.sqrt(nb));
}

export function compareProfiles(prof, sample) {
  const sim = cosine(prof.vec, sample.vec);
  const coverage = Math.min(
    1,
    (sample.n.ht + sample.n.iki) /
      Math.max(1, (prof.n.ht + prof.n.iki) / 2)
  );
  const score = Math.max(0, Math.min(1, 0.85 * sim + 0.15 * coverage));
  return { similarity: sim, coverage, score };
}

export function mergeProfile(oldProf, newSample) {
  const alpha = 0.2;
  const vec = oldProf
    ? oldProf.vec.map((v, i) => (1 - alpha) * v + alpha * newSample.vec[i])
    : newSample.vec.slice();
  const n = oldProf
    ? {
        ht: Math.round(
          (1 - alpha) * oldProf.n.ht + alpha * newSample.n.ht
        ),
        iki: Math.round(
          (1 - alpha) * oldProf.n.iki + alpha * newSample.n.iki
        ),
      }
    : { ...newSample.n };
  return { vec, n, updatedAt: Date.now() };
}

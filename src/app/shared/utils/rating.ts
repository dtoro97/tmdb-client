export function normalizeRatingValue(value: number): number {
    const normalized = Math.round(Math.min(10, Math.max(0.5, value)) * 2) / 2;
    return Number(normalized.toFixed(1));
}

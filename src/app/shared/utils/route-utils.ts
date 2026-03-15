export function parseCsvParam(value: string | null | undefined): string[] {
    if (!value) {
        return [];
    }

    return value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
}

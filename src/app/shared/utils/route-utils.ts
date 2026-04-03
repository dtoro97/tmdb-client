export const parseListParams = (value: string | null | undefined): string[] => {
    if (!value) {
        return [];
    }

    return value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
};

export const parseNumberListParam = (
    value: string | null,
    parser: 'int' | 'float' = 'int',
): number[] => {
    return parseListParams(value)
        .map((part) =>
            parser === 'int'
                ? Number.parseInt(part, 10)
                : Number.parseFloat(part),
        )
        .filter((part) => !Number.isNaN(part));
};

export const parseNumberParam = (
    value: string | null,
    parser: 'int' | 'float' = 'float',
): number | null => {
    if (!value) {
        return null;
    }

    const parsed =
        parser === 'int'
            ? Number.parseInt(value, 10)
            : Number.parseFloat(value);

    return Number.isNaN(parsed) ? null : parsed;
};

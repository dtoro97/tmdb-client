import { isDefined } from './is-defined';

type NumberParamParser = 'int' | 'float';

const INTEGER_PARAM_PATTERN = /^-?\d+$/;
const FLOAT_PARAM_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)$/;

export const parseStringParam = (
    value: string | null | undefined,
): string | null => {
    const normalized = value?.trim();
    return normalized ? normalized : null;
};

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
    value: string | null | undefined,
    parser: NumberParamParser = 'int',
): number[] => {
    return parseListParams(value)
        .map((part) => parseNumberParam(part, parser))
        .filter(isDefined);
};

export const parseNumberParam = (
    value: string | null | undefined,
    parser: NumberParamParser = 'float',
): number | null => {
    const normalized = parseStringParam(value);
    if (!normalized) {
        return null;
    }

    const pattern =
        parser === 'int' ? INTEGER_PARAM_PATTERN : FLOAT_PARAM_PATTERN;

    if (!pattern.test(normalized)) {
        return null;
    }

    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
        return null;
    }

    return parser === 'int' && !Number.isInteger(parsed) ? null : parsed;
};

export const parsePositiveNumberParam = (
    value: string | null | undefined,
): number | null => {
    const parsed = parseNumberParam(value);
    return parsed !== null && parsed > 0 ? parsed : null;
};

export const parsePositiveIntegerParam = (
    value: string | null | undefined,
): number | null => {
    const parsed = parseNumberParam(value, 'int');
    return parsed !== null && parsed > 0 ? parsed : null;
};

export const parsePositiveIntegerListParam = (
    value: string | null | undefined,
): number[] => [
    ...new Set(
        parseNumberListParam(value, 'int').filter((entry) => entry > 0),
    ),
];

export const parsePageParam = (
    value: string | null | undefined,
    fallback = 1,
): number => parsePositiveIntegerParam(value) ?? fallback;

export const parseBoundedIntegerParam = (
    value: string | null | undefined,
    min: number,
    max: number,
): number | null => {
    const parsed = parseNumberParam(value, 'int');
    return parsed !== null && parsed >= min && parsed <= max ? parsed : null;
};

export const parseEnumParam = <T extends string>(
    value: unknown,
    allowedValues: readonly T[],
    fallback: T,
): T =>
    typeof value === 'string' && allowedValues.includes(value as T)
        ? (value as T)
        : fallback;

export const parseRegionParam = (
    value: unknown,
    fallback: string,
): string => {
    if (typeof value !== 'string') {
        return fallback;
    }

    const region = value.trim().toUpperCase();
    return /^[A-Z]{2}$/.test(region) ? region : fallback;
};

export const parseLanguageParam = (
    value: string | null | undefined,
): string | null => {
    const language = value?.trim().toLowerCase();
    return language && /^[a-z]{2}$/.test(language) ? language : null;
};

export const serializeNumberListParam = (
    values: readonly number[] | null | undefined,
    separator = ',',
): string | null => (values?.length ? values.join(separator) : null);

export const serializePositiveNumberParam = (
    value: unknown,
): number | null => {
    if (value === null) {
        return null;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) && value > 0 ? value : null;
    }

    return typeof value === 'string' ? parsePositiveNumberParam(value) : null;
};

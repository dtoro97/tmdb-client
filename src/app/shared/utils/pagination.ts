export interface PageItemRangeInput {
    readonly page: number;
    readonly pageSize: number;
    readonly itemCount: number;
    readonly totalResults: number;
}

export interface PageItemRange {
    readonly start: number;
    readonly end: number;
}

export const toPageItemRange = ({
    page,
    pageSize,
    itemCount,
    totalResults,
}: PageItemRangeInput): PageItemRange => {
    if (totalResults <= 0 || itemCount <= 0) {
        return { start: 0, end: 0 };
    }

    const start = (page - 1) * pageSize + 1;

    return {
        start,
        end: Math.min(totalResults, start + itemCount - 1),
    };
};

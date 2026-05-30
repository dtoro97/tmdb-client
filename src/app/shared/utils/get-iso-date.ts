export const toISODate = (date: Date): string => date.toISOString().split('T')[0];

export const getISODate = (daysOffset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return toISODate(d);
};

export const getCurrentMonthName = (date = new Date()): string =>
    new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date);

export const getCurrentMonthDateWindow = (
    date = new Date(),
): { from: string; to: string } => {
    const year = date.getFullYear();
    const month = date.getMonth();

    return {
        from: toISODate(new Date(year, month, 1)),
        to: toISODate(new Date(year, month + 1, 0)),
    };
};

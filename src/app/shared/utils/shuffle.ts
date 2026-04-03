export const shuffle = <T>(items: T[]): T[] => {
    const clone = [...items];
    for (let index = clone.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
    }
    return clone;
};

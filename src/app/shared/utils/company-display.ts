export const formatCompanyName = (name: string, originCountry?: string | null): string => {
    return originCountry ? `${name} (${originCountry})` : name;
};

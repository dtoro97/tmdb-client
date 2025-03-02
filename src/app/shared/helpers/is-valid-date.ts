export const isValidDate = (value: string) => {
  return /\d{4}-\d\d-\d\d/.test(value);
};

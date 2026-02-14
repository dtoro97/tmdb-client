export class DateHelper {
  static formatToISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static getTodayISO(): string {
    return this.formatToISO(new Date());
  }

  static isValidDate(value: any): boolean {
    return value && !isNaN(Date.parse(value));
  }
}

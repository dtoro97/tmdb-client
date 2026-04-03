import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowserStorageService {
    getItem(key: string): string | null {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        return localStorage.getItem(key);
    }

    getItemOrDefault(key: string, fallback: string): string {
        return this.getItem(key) ?? fallback;
    }

    setItem(key: string, value: string): void {
        if (typeof localStorage === 'undefined') {
            return;
        }

        localStorage.setItem(key, value);
    }

    writeItem(key: string, value: string | null): void {
        if (value === null) {
            this.removeItem(key);
            return;
        }

        this.setItem(key, value);
    }

    removeItem(key: string): void {
        if (typeof localStorage === 'undefined') {
            return;
        }

        localStorage.removeItem(key);
    }
}

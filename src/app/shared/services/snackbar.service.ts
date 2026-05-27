import { Injectable } from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

export enum SnackbarType {
    Success = 'success',
    Error = 'error',
}

export interface SnackbarLink {
    readonly label: string;
    readonly routerLink: string | readonly unknown[];
}

export interface SnackbarConfig {
    readonly message: string;
    readonly type: SnackbarType;
    readonly duration?: number;
    readonly link?: SnackbarLink;
}

export type SnackbarData = SnackbarConfig;

const PANEL_CLASS_BY_TYPE: Record<SnackbarType, string> = {
    [SnackbarType.Success]: 'snackbar-success',
    [SnackbarType.Error]: 'snackbar-error',
};

@Injectable({ providedIn: 'root' })
export class SnackbarService {
    constructor(private readonly snackBar: MatSnackBar) {}

    openSnackbar<T>(component: ComponentType<T>, config: SnackbarConfig): MatSnackBarRef<T> {
        return this.snackBar.openFromComponent(component, {
            data: config,
            duration: config.duration ?? 5 * 1000,
            panelClass: PANEL_CLASS_BY_TYPE[config.type],
        });
    }
}

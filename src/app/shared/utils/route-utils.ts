import { inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

export const getQueryParam = (queryParamName: string) => {
    const activatedRoute = inject(ActivatedRoute);
    return activatedRoute.snapshot.queryParamMap.get(queryParamName);
};

export const getParam = (paramName: string) => {
    const activatedRoute = inject(ActivatedRoute);
    return activatedRoute.snapshot.paramMap.get(paramName);
};
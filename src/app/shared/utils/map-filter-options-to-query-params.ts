import { HttpParams } from '@angular/common/http';

export function mapFilterOptionsToQueryParams(
  filterOptions: Record<string, unknown>,
) {
  const queryParams: Record<
    string,
    string | number | boolean | ReadonlyArray<string | number | boolean>
  > = {};
  const httpParams = new HttpParams({
    fromObject: removeNullsAndEmptyArrays(filterOptions),
  });
  httpParams.keys().forEach((key) => {
    const params = httpParams.getAll(key);
    if (params) {
      queryParams[key] =
        params && params.length > 1 ? params.join(',') : params;
    }
  });
  return queryParams;
}

export function removeNullsAndEmptyArrays(
  filterOption: Record<string, unknown>,
): Record<
  string,
  string | number | boolean | ReadonlyArray<string | number | boolean>
> {
  const params: Record<
    string,
    string | number | boolean | ReadonlyArray<string | number | boolean>
  > = {};
  for (const [key, value] of Object.entries(filterOption)) {
    if (value != null && value !== '' && (value as [])?.length !== 0) {
      params[key] = value as
        | string
        | number
        | boolean
        | ReadonlyArray<string | number | boolean>;
    }
  }
  return params;
}

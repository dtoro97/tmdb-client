import { IResultModel } from './result-interface';

export interface ResponseDataModel {
  page: number;
  results?: IResultModel[] | null;
  total_pages: number;
  total_results: number;
}

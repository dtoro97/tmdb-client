import { IResultModel } from './result-interface';

export interface ResponseDataModel {
  page: number;
  results: IResultModel[];
  total_pages: number;
  total_results: number;
}

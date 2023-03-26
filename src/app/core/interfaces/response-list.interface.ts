import { IResponseListItem } from './response-list-item.interface';

export interface IResponseList {
  page: number;
  results?: IResponseListItem[] | null;
  total_pages: number;
  total_results: number;
}

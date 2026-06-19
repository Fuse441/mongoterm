import { ObjectId } from "mongodb";

export interface IQueryOptions {
  page?: number;
  pageSize?: number;
}

export interface IUpdateRecordInput {
  _id: ObjectId;
  updateFields: Record<string, unknown>;
}

export interface IQueryResult<T = unknown> {
  docs: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

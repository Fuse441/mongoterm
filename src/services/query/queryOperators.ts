/*
|--------------------------------------------------------------------------
| MONGODB QUERY OPERATORS
|--------------------------------------------------------------------------
| Reference list used to drive the query box's autocomplete dropdown (and
| reused by the shell modal). Keep this the single place new operators are
| added — see CLAUDE.md's "keeping docs in sync" section.
*/

export interface IQueryOperator {
  op: string;
  description: string;
}

export const QUERY_OPERATORS: IQueryOperator[] = [
  { op: "$eq", description: "Matches values equal to a specified value" },
  { op: "$ne", description: "Matches values not equal to a specified value" },
  { op: "$gt", description: "Matches values greater than a specified value" },
  { op: "$gte", description: "Matches values greater than or equal to a specified value" },
  { op: "$lt", description: "Matches values less than a specified value" },
  { op: "$lte", description: "Matches values less than or equal to a specified value" },
  { op: "$in", description: "Matches any value in the given array" },
  { op: "$nin", description: "Matches none of the values in the given array" },
  { op: "$and", description: "Joins query clauses with a logical AND" },
  { op: "$or", description: "Joins query clauses with a logical OR" },
  { op: "$nor", description: "Joins query clauses with a logical NOR (matches none)" },
  { op: "$not", description: "Inverts the effect of a query expression" },
  { op: "$exists", description: "Matches documents that have (or lack) the given field" },
  { op: "$type", description: "Matches documents where a field is of the given BSON type" },
  { op: "$regex", description: "Matches string values against a regular expression" },
  { op: "$options", description: "Regex flags to use with $regex (e.g. \"i\")" },
  { op: "$size", description: "Matches arrays with exactly the given number of elements" },
  { op: "$all", description: "Matches arrays that contain all of the given elements" },
  { op: "$elemMatch", description: "Matches an array field with an element satisfying all conditions" },
  { op: "$mod", description: "Matches values where value % divisor === remainder" },
  { op: "$text", description: "Performs a text search on a text-indexed field" },
  { op: "$search", description: "The search string to use with $text" },
  { op: "$expr", description: "Allows aggregation expressions inside a normal query" },
  { op: "$where", description: "Matches documents satisfying a JavaScript expression (slow, avoid if possible)" },
];

export function findQueryOperators(prefix: string): IQueryOperator[] {
  if (!prefix) return [];
  const needle = prefix.toLowerCase();
  return QUERY_OPERATORS.filter((o) => o.op.toLowerCase().startsWith(needle));
}

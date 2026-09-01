// PostgREST caps every select at max_rows (1000 here) and TRUNCATES SILENTLY — the
// review's silent-truncation class (H2: the export's completeness promise; L2: placed
// bits misclassified as loose once placements pass 1000). These two helpers close it:
//   pagedRows — page with .range() until a short page. The caller MUST give the query
//     a stable .order() (Postgres without ORDER BY has no stable pagination — rows
//     could repeat or vanish across pages, the same silent breach by another door).
//   chunk — slice an id list for .in() queries (1000+ uuids in a GET query string
//     blows URL limits long before correctness does).

export async function pagedRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

export function chunk<T>(xs: T[], size = 200): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

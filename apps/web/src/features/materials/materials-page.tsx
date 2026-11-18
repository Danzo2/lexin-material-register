import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc.ts";
import { FilterBar } from "./filter-bar.tsx";
import { MaterialsTable } from "./materials-table.tsx";
import { PaginationBar } from "./pagination-bar.tsx";
import { SearchBox } from "./search-box.tsx";
import { EmptyState, ErrorState, RefetchIndicator, TableSkeleton } from "./table-states.tsx";
import { useListParams } from "./use-list-params.ts";

export function MaterialsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { params, setParams, clearAll } = useListParams();
  // The parsed URL is the query input, so the query key is exactly the URL state.
  const list = useQuery(
    trpc.materials.list.queryOptions(params, { placeholderData: keepPreviousData }),
  );

  function renderResults() {
    if (list.isPending) return <TableSkeleton />;
    if (list.isError)
      return (
        <ErrorState
          error={list.error}
          onRetry={() => {
            // Refetch every active query, not just the list: if the API was down at
            // page load, the filter options failed too and need the same retry.
            void queryClient.refetchQueries({ type: "active" });
          }}
        />
      );
    // Use the total, not the page: a page past the end has no rows but still has
    // matches, and the pagination bar offers "Go to last page" for that case.
    if (list.data.total === 0) return <EmptyState onClearAll={clearAll} />;
    return (
      <>
        <RefetchIndicator active={list.isPlaceholderData}>
          <MaterialsTable rows={list.data.rows} dimmed={list.isPlaceholderData} />
        </RefetchIndicator>
        {/* Page and size come from the URL, not the response: while the next page
            loads, `list.data` is still the previous page, so a second Next click
            would otherwise ask for the same page again. */}
        <PaginationBar
          page={params.page}
          pageSize={params.pageSize}
          total={list.data.total}
          onChange={setParams}
        />
      </>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Material Register</h1>
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox
          value={params.q}
          onSearch={(q) => {
            setParams({ q }, { replace: true });
          }}
        />
        <FilterBar params={params} onChange={setParams} onClearAll={clearAll} />
      </div>
      {renderResults()}
    </main>
  );
}

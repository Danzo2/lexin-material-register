import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc.ts";
import { FilterBar } from "./filter-bar.tsx";
import { MaterialsTable } from "./materials-table.tsx";
import { PaginationBar } from "./pagination-bar.tsx";
import { SearchBox } from "./search-box.tsx";
import { EmptyState, ErrorState, TableSkeleton } from "./table-states.tsx";
import { useListParams } from "./use-list-params.ts";

export function MaterialsPage() {
  const trpc = useTRPC();
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
            void list.refetch();
          }}
        />
      );
    if (list.data.rows.length === 0) return <EmptyState onClearAll={clearAll} />;
    return (
      <>
        <MaterialsTable rows={list.data.rows} dimmed={list.isPlaceholderData} />
        <PaginationBar
          page={list.data.page}
          pageSize={list.data.pageSize}
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

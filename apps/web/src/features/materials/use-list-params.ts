import { parseListSearchParams, toListSearchParams, type MaterialListInput } from "@lexin/shared";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

export type ListParamsPatch = Partial<MaterialListInput>;

/**
 * The table state lives only in the URL. This hook parses it with the shared
 * schema and writes changes back, so refresh and shared links restore the view.
 */
export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseListSearchParams(searchParams), [searchParams]);

  // Any change other than paging sends the user back to page 1. Reading `prev`
  // (not `params`) means a late debounced write can't undo a newer change.
  const setParams = useCallback(
    (patch: ListParamsPatch, options: { replace?: boolean } = {}) => {
      setSearchParams(
        (prev) => toListSearchParams({ ...parseListSearchParams(prev), page: 1, ...patch }),
        { replace: options.replace ?? false },
      );
    },
    [setSearchParams],
  );

  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return { params, setParams, clearAll };
}

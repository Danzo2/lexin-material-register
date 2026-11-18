import { parseListSearchParams, toListSearchParams, type MaterialListInput } from "@lexin/shared";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

export type ListParamsPatch = Partial<MaterialListInput>;
/** A patch, or a function of the latest URL state for changes that depend on it. */
export type ListParamsUpdate = ListParamsPatch | ((prev: MaterialListInput) => ListParamsPatch);

/**
 * The table state lives only in the URL. This hook parses it with the shared
 * schema and writes changes back, so refresh and shared links restore the view.
 */
export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseListSearchParams(searchParams), [searchParams]);

  // Any change other than paging sends the user back to page 1.
  // The base is the live browser URL, not React Router's `prev`: `prev` is the
  // search params of the last render, and the URL changes before React re-renders,
  // so two quick clicks (or a late debounced search) would otherwise overwrite
  // each other.
  const setParams = useCallback(
    (update: ListParamsUpdate, options: { replace?: boolean } = {}) => {
      setSearchParams(
        () => {
          const current = parseListSearchParams(new URLSearchParams(window.location.search));
          const patch = typeof update === "function" ? update(current) : update;
          return toListSearchParams({ ...current, page: 1, ...patch });
        },
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

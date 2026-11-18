import { isRouteErrorResponse, useRouteError } from "react-router";

/** Last-resort screen for render errors and unknown routes, instead of React Router's dev page. */
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Unknown error";

  return (
    <main role="alert" className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <a href="/" className="mt-4 inline-block text-sm underline">
        Back to the register
      </a>
    </main>
  );
}

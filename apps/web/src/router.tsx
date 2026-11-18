import { createBrowserRouter } from "react-router";
import { MaterialsPage } from "./features/materials/materials-page.tsx";
import { RouteError } from "./route-error.tsx";

export const router = createBrowserRouter([
  { path: "/", element: <MaterialsPage />, errorElement: <RouteError /> },
]);

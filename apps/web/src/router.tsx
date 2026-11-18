import { createBrowserRouter } from "react-router";
import { MaterialsPage } from "./routes/materials.tsx";

export const router = createBrowserRouter([{ path: "/", element: <MaterialsPage /> }]);

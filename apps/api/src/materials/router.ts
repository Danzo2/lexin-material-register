import { filterOptionsInput, materialListInput } from "@lexin/shared";
import { publicProcedure, router } from "../trpc.ts";
import { listMaterials } from "./list.ts";
import { filterOptions } from "./options.ts";

export const materialsRouter = router({
  list: publicProcedure
    .input(materialListInput)
    .query(({ ctx, input }) => listMaterials(ctx.db, input)),
  filterOptions: publicProcedure
    .input(filterOptionsInput)
    .query(({ ctx }) => filterOptions(ctx.db)),
});

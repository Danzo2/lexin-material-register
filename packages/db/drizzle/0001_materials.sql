CREATE TYPE "public"."material_status" AS ENUM('active', 'obsolete', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('spare_part', 'consumable', 'raw_material', 'tool');--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" varchar(64) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "manufacturers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "manufacturers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "materials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"material_number" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"type" "material_type" NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"mpn" text NOT NULL,
	"plant_id" integer NOT NULL,
	"status" "material_status" NOT NULL,
	"unit_of_measure" varchar(8) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"stock_on_hand" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materials_material_number_unique" UNIQUE("material_number")
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "plants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(4) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "plants_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "materials_type_idx" ON "materials" USING btree ("type");--> statement-breakpoint
CREATE INDEX "materials_status_idx" ON "materials" USING btree ("status");--> statement-breakpoint
CREATE INDEX "materials_plant_id_idx" ON "materials" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "materials_manufacturer_id_idx" ON "materials" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "materials_description_idx" ON "materials" USING btree ("description");--> statement-breakpoint
CREATE INDEX "materials_unit_price_idx" ON "materials" USING btree ("unit_price");--> statement-breakpoint
CREATE INDEX "materials_stock_on_hand_idx" ON "materials" USING btree ("stock_on_hand");--> statement-breakpoint
CREATE INDEX "materials_updated_at_idx" ON "materials" USING btree ("updated_at");
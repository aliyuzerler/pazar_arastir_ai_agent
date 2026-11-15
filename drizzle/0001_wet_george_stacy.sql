CREATE TABLE "pricing_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"marketplace_fee_rate" numeric(8, 4) NOT NULL,
	"payment_fee_rate" numeric(8, 4) NOT NULL,
	"other_variable_fee_rate" numeric(8, 4) NOT NULL,
	"target_margin_rate" numeric(8, 4) NOT NULL,
	"fixed_per_order_cost" numeric(18, 4) NOT NULL,
	"tax_mode" text DEFAULT 'not_modelled' NOT NULL,
	"commission_base" text DEFAULT 'gross_price' NOT NULL,
	"currency" char(3) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"sku" text,
	"title" text NOT NULL,
	"brand" text,
	"model" text,
	"mpn" text,
	"gtin" text,
	"gtin_normalized" text,
	"category" text,
	"description" text,
	"attributes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"product_url" text,
	"image_url" text,
	"unit_cost" numeric(18, 4) NOT NULL,
	"currency" char(3) NOT NULL,
	"inbound_shipping_per_unit" numeric(18, 4) DEFAULT '0' NOT NULL,
	"packaging_cost" numeric(18, 4) DEFAULT '0' NOT NULL,
	"other_fixed_cost" numeric(18, 4) DEFAULT '0' NOT NULL,
	"pricing_profile_id" uuid,
	"tracking_enabled" boolean DEFAULT false NOT NULL,
	"tracking_interval_hours" integer,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pricing_profiles" ADD CONSTRAINT "pricing_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_pricing_profile_id_pricing_profiles_id_fk" FOREIGN KEY ("pricing_profile_id") REFERENCES "public"."pricing_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pricing_profiles_workspace_idx" ON "pricing_profiles" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "products_workspace_idx" ON "products" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "products_gtin_idx" ON "products" USING btree ("workspace_id","gtin_normalized");--> statement-breakpoint
CREATE UNIQUE INDEX "products_workspace_sku_uq" ON "products" USING btree ("workspace_id","sku");
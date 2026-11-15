CREATE TABLE "price_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"offer_id" uuid,
	"product_id" uuid NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"price_amount" numeric(18, 4) NOT NULL,
	"currency" char(3) NOT NULL,
	"shipping_amount" numeric(18, 4),
	"delivered_total_amount" numeric(18, 4),
	"availability_status" text DEFAULT 'unknown' NOT NULL,
	"stock_quantity" integer,
	"source_kind" text NOT NULL,
	"source_record_id" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "price_observations_product_idx" ON "price_observations" USING btree ("workspace_id","product_id","observed_at");--> statement-breakpoint
CREATE INDEX "price_observations_offer_idx" ON "price_observations" USING btree ("offer_id");
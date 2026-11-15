CREATE TABLE "research_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"query_plan" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"providers_requested" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provider_errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_results" integer DEFAULT 0 NOT NULL,
	"exact_count" integer DEFAULT 0 NOT NULL,
	"substitute_count" integer DEFAULT 0 NOT NULL,
	"error_summary" text,
	"idempotency_key" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"product_id" uuid,
	"provider_id" text NOT NULL,
	"provider_offer_id" text NOT NULL,
	"title" text NOT NULL,
	"brand" text,
	"model" text,
	"mpn" text,
	"gtin" text,
	"seller_name" text NOT NULL,
	"marketplace" text,
	"product_url" text NOT NULL,
	"image_url" text,
	"price_amount" numeric(18, 4) NOT NULL,
	"currency" char(3) NOT NULL,
	"shipping_amount" numeric(18, 4),
	"delivered_total_amount" numeric(18, 4),
	"availability_status" text DEFAULT 'unknown' NOT NULL,
	"stock_quantity" integer,
	"rating" numeric(3, 2),
	"review_count" integer,
	"condition" text,
	"variant_attributes" jsonb,
	"is_demo" boolean DEFAULT false NOT NULL,
	"raw_reference" jsonb,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_observed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL,
	"match_type" text NOT NULL,
	"match_score" numeric(5, 2) NOT NULL,
	"match_method" text NOT NULL,
	"match_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"differences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_matches" ADD CONSTRAINT "product_matches_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_matches" ADD CONSTRAINT "product_matches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_matches" ADD CONSTRAINT "product_matches_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "research_runs_idempotency_uq" ON "research_runs" USING btree ("workspace_id","idempotency_key") WHERE idempotency_key is not null;--> statement-breakpoint
CREATE INDEX "research_runs_product_idx" ON "research_runs" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offers_provider_offer_uq" ON "offers" USING btree ("workspace_id","provider_id","provider_offer_id");--> statement-breakpoint
CREATE INDEX "offers_product_idx" ON "offers" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_matches_offer_uq" ON "product_matches" USING btree ("product_id","offer_id");--> statement-breakpoint
CREATE INDEX "product_matches_workspace_idx" ON "product_matches" USING btree ("workspace_id");
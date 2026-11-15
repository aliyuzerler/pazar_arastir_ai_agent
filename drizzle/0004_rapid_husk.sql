CREATE TABLE "pricing_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"research_run_id" uuid,
	"pricing_profile_id" uuid,
	"strategy" text NOT NULL,
	"recommended_price" numeric(18, 4) NOT NULL,
	"currency" char(3) NOT NULL,
	"break_even_price" numeric(18, 4) NOT NULL,
	"target_price" numeric(18, 4) NOT NULL,
	"expected_contribution" numeric(18, 4) NOT NULL,
	"expected_margin" numeric(8, 4) NOT NULL,
	"market_reference_price" numeric(18, 4),
	"confidence_score" numeric(4, 2) NOT NULL,
	"calculation_inputs" jsonb NOT NULL,
	"explanation" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pricing_recommendations" ADD CONSTRAINT "pricing_recommendations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_recommendations" ADD CONSTRAINT "pricing_recommendations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_recommendations" ADD CONSTRAINT "pricing_recommendations_research_run_id_research_runs_id_fk" FOREIGN KEY ("research_run_id") REFERENCES "public"."research_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_recommendations" ADD CONSTRAINT "pricing_recommendations_pricing_profile_id_pricing_profiles_id_fk" FOREIGN KEY ("pricing_profile_id") REFERENCES "public"."pricing_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pricing_recommendations_product_idx" ON "pricing_recommendations" USING btree ("product_id","created_at");
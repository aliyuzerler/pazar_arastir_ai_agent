CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"offer_id" uuid,
	"type" text NOT NULL,
	"threshold_percent" numeric(5, 2),
	"old_price" numeric(18, 4),
	"new_price" numeric(18, 4),
	"currency" char(3),
	"message" text NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"frequency_hours" integer DEFAULT 24 NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lock_until" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_quota_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"day" date NOT NULL,
	"used_queries" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_jobs" ADD CONSTRAINT "monitoring_jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_jobs" ADD CONSTRAINT "monitoring_jobs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_quota_usage" ADD CONSTRAINT "provider_quota_usage_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_workspace_created_idx" ON "alerts" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "monitoring_jobs_product_uq" ON "monitoring_jobs" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "monitoring_jobs_due_idx" ON "monitoring_jobs" USING btree ("status","next_run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_quota_day_uq" ON "provider_quota_usage" USING btree ("workspace_id","provider_id","day");
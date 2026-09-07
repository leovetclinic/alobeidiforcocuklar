ALTER TABLE `order_items` ADD `status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `inventory_applied` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `approved_at` integer;

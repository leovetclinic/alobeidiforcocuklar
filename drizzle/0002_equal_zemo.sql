ALTER TABLE `categories` ADD `icon` text DEFAULT '🧸' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `inventory_applied` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `approved_at` integer;

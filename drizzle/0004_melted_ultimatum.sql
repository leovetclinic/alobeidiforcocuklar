ALTER TABLE `order_items` ADD `product_code` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `governorate` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `landmark` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_fee` integer DEFAULT 0 NOT NULL;
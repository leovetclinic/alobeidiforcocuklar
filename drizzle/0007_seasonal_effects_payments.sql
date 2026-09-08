CREATE TABLE `seasonal_effects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`preset` text DEFAULT 'winter' NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`start_date` text,
	`end_date` text,
	`speed` text DEFAULT 'normal' NOT NULL,
	`density` integer DEFAULT 25 NOT NULL,
	`opacity` integer DEFAULT 35 NOT NULL,
	`element_size` integer DEFAULT 24 NOT NULL,
	`motion` text DEFAULT 'fall' NOT NULL,
	`desktop_enabled` integer DEFAULT true NOT NULL,
	`mobile_enabled` integer DEFAULT true NOT NULL,
	`pages` text DEFAULT 'home,products' NOT NULL,
	`custom_symbols` text,
	`bar_enabled` integer DEFAULT false NOT NULL,
	`bar_text` text,
	`bar_text_color` text DEFAULT '#ffffff' NOT NULL,
	`bar_background` text DEFAULT '#8b5e83' NOT NULL,
	`bar_link` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo_url` text,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`action_type` text DEFAULT 'whatsapp' NOT NULL,
	`whatsapp_message` text,
	`direct_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `payment_methods` (`name`,`active`,`sort_order`,`action_type`,`whatsapp_message`,`created_at`,`updated_at`) VALUES
('Zain Cash',1,1,'whatsapp','مرحباً، أريد معرفة تفاصيل الدفع عن طريق Zain Cash.',unixepoch()*1000,unixepoch()*1000),
('Visa / MasterCard',1,2,'whatsapp','مرحباً، أريد معرفة تفاصيل الدفع عن طريق Visa / MasterCard.',unixepoch()*1000,unixepoch()*1000);

CREATE TABLE `products` (
  `id` CHAR(36) NOT NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `quantity` BIGINT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL,
  `launch_date` DATE,
  PRIMARY KEY (`id`)
);

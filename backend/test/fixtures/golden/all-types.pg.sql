CREATE TABLE "products" (
  "id" UUID NOT NULL,
  "product_name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "price" NUMERIC(10,2) NOT NULL,
  "quantity" BIGINT NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL,
  "launch_date" DATE,
  PRIMARY KEY ("id")
);

import { Migration } from '@mikro-orm/migrations';

export class Migration20250702091946 extends Migration {

  override async up(): Promise<void> {
    // Create category_custom_attribute table if not exists
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "category_custom_attribute" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "label" TEXT NOT NULL DEFAULT '',
        "category_id" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "category_custom_attribute_pkey" PRIMARY KEY ("id")
      );
    `);

    // Index on deleted_at
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_category_custom_attribute_deleted_at"
      ON "category_custom_attribute" (deleted_at) WHERE deleted_at IS NULL;
    `);

    // Create product_custom_attribute table if not exists
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_custom_attribute" (
        "id" TEXT NOT NULL,
        "product_id" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "category_custom_attribute_id" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "product_custom_attribute_pkey" PRIMARY KEY ("id")
      );
    `);

    // Indexes
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_custom_attribute_category_custom_attribute_id"
      ON "product_custom_attribute" (category_custom_attribute_id) WHERE deleted_at IS NULL;
    `);
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_custom_attribute_deleted_at"
      ON "product_custom_attribute" (deleted_at) WHERE deleted_at IS NULL;
    `);

    // Conditionally add foreign key constraint
    this.addSql(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'product_custom_attribute_category_custom_attribute_id_foreign'
        ) THEN
          ALTER TABLE "product_custom_attribute"
          ADD CONSTRAINT "product_custom_attribute_category_custom_attribute_id_foreign"
          FOREIGN KEY ("category_custom_attribute_id")
          REFERENCES "category_custom_attribute" ("id")
          ON UPDATE CASCADE ON DELETE CASCADE;
        END IF;
      END$$;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_custom_attribute" drop constraint if exists "product_custom_attribute_category_custom_attribute_id_foreign";`);

    this.addSql(`drop table if exists "category_custom_attribute" cascade;`);

    this.addSql(`drop table if exists "product_custom_attribute" cascade;`);
  }

}

import { Migration } from '@mikro-orm/migrations';

export class Migration20250516122255 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "category_custom_attribute" ("id" text not null, "key" text not null, "label" text not null default '', "category_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "category_custom_attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_custom_attribute_deleted_at" ON "category_custom_attribute" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_custom_attribute" ("id" text not null, "product_id" text not null, "value" text not null, "category_custom_attribute_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_custom_attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_custom_attribute_category_custom_attribute_id" ON "product_custom_attribute" (category_custom_attribute_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_custom_attribute_deleted_at" ON "product_custom_attribute" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_custom_attribute" add constraint "product_custom_attribute_category_custom_attribute_id_foreign" foreign key ("category_custom_attribute_id") references "category_custom_attribute" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_custom_attribute" drop constraint if exists "product_custom_attribute_category_custom_attribute_id_foreign";`);

    this.addSql(`drop table if exists "category_custom_attribute" cascade;`);

    this.addSql(`drop table if exists "product_custom_attribute" cascade;`);
  }

}

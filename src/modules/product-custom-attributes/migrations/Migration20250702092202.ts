import { Migration } from '@mikro-orm/migrations';

export class Migration20250702092202 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_custom_attribute" add column if not exists "is_visible" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_custom_attribute" drop column if exists "is_visible";`);
  }

}

import { Migration } from '@mikro-orm/migrations';

export class Migration20250926065639 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_custom_attribute" add column if not exists "options" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_custom_attribute" drop column if exists "options";`);
  }

}

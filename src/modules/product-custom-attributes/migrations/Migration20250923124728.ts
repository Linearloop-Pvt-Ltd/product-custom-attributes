import { Migration } from '@mikro-orm/migrations';

export class Migration20250923124728 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "category_custom_attribute" add column if not exists "type" text not null default 'text';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "category_custom_attribute" drop column if exists "type";`);
  }

}

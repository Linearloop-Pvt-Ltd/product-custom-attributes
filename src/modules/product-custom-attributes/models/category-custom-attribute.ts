import { model } from "@medusajs/framework/utils"
import ProductCustomAttribute from "./product-custom-attribute"

const CategoryCustomAttribute = model.define("category_custom_attribute", {
  id: model.id().primaryKey(),
  key: model.text(),
  label: model.text().default(""),
  category_id: model.text(),
  product_custom_attributes: model.hasMany(() => ProductCustomAttribute)
}).cascades({
  delete: ["product_custom_attributes"],
})

export default CategoryCustomAttribute 
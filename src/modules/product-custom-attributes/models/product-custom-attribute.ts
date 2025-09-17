import { model } from "@medusajs/framework/utils";
import CategoryCustomAttribute from "./category-custom-attribute";

const ProductCustomAttribute = model.define("product_custom_attribute", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  value: model.text(),
  is_visible: model.boolean().default(true),
  category_custom_attribute: model.belongsTo(() => CategoryCustomAttribute, {
    mappedBy: "product_custom_attributes",
  }),
});

export default ProductCustomAttribute;

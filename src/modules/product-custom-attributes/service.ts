import { MedusaService } from "@medusajs/framework/utils";
import ProductCustomAttribute from "./models/product-custom-attribute";
import CategoryCustomAttribute from "./models/category-custom-attribute";

class ProductCustomAttributeModuleService extends MedusaService({
  ProductCustomAttribute,
  CategoryCustomAttribute,
}) {}

export default ProductCustomAttributeModuleService;

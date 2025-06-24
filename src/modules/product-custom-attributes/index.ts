import { Module } from "@medusajs/framework/utils";
import ProductCustomAttributeModuleService from "./service";

export const PRODUCT_CUSTOM_ATTRIBUTES_MODULE = "product_custom_attributes";

export default Module(PRODUCT_CUSTOM_ATTRIBUTES_MODULE, {
  service: ProductCustomAttributeModuleService,
});

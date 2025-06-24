import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CreateProductCustomAttributeInput } from "../../modules/product-custom-attributes/types";
import ProductCustomAttributeModuleService from "../../modules/product-custom-attributes/service";
import { PRODUCT_CUSTOM_ATTRIBUTES_MODULE } from "../../modules/product-custom-attributes";

export const createProductCustomAttributeStep = createStep(
  "create-product-custom-attribute",
  async (
    {
      product_id,
      category_custom_attribute_id,
      value,
    }: CreateProductCustomAttributeInput,
    { container }
  ) => {
    const productCustomAttributeService: ProductCustomAttributeModuleService =
      container.resolve(PRODUCT_CUSTOM_ATTRIBUTES_MODULE);

    const productCustomAttribute =
      await productCustomAttributeService.createProductCustomAttributes({
        product_id,
        category_custom_attribute_id,
        value: value || "",
      });

    return new StepResponse(productCustomAttribute);
  },
  async ({ product_id }: CreateProductCustomAttributeInput, { container }) => {
    const productCustomAttributeService: ProductCustomAttributeModuleService =
      container.resolve(PRODUCT_CUSTOM_ATTRIBUTES_MODULE);

    const productCustomAttribute =
      await productCustomAttributeService.deleteProductCustomAttributes({
        product_id,
      });

    return new StepResponse(productCustomAttribute);
  }
);

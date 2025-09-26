import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CreateCategoryCustomAttributeInput } from "../../modules/product-custom-attributes/types";
import ProductCustomAttributeModuleService from "../../modules/product-custom-attributes/service";
import { PRODUCT_CUSTOM_ATTRIBUTES_MODULE } from "../../modules/product-custom-attributes";

export const createCategoryCustomAttributeStep = createStep(
  "create-category-custom-attribute",
  async (
    { type, label, category_id }: CreateCategoryCustomAttributeInput,
    { container }
  ) => {
    const productCustomAttributeService: ProductCustomAttributeModuleService =
      container.resolve(PRODUCT_CUSTOM_ATTRIBUTES_MODULE);

    const caKey = label.toLowerCase().replace(/\s+/g, "-");

    const categoryCustomAttribute =
      await productCustomAttributeService.createCategoryCustomAttributes({
        label,
        type,
        key: caKey,
        category_id,
      });

    return new StepResponse(categoryCustomAttribute);
  }
);

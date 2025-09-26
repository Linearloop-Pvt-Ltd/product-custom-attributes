import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { PRODUCT_CUSTOM_ATTRIBUTES_MODULE } from "../../modules/product-custom-attributes";
import { UpdateCategoryCustomAttributeInput } from "../../modules/product-custom-attributes/types";
import ProductCustomAttributeModuleService from "../../modules/product-custom-attributes/service";

export const updateCategoryCustomAttributeStep = createStep(
  "update-category-custom-attribute",
  async (
    { id, label, type, deleted_at }: UpdateCategoryCustomAttributeInput,
    { container }
  ) => {
    const productCustomAttributeService: ProductCustomAttributeModuleService =
      container.resolve(PRODUCT_CUSTOM_ATTRIBUTES_MODULE);

    const categoryCustomAttribute =
      await productCustomAttributeService.updateCategoryCustomAttributes({
        id,
        ...(label && { label }),
        ...(type && { type }),
        ...(deleted_at && { deleted_at }),
      });

    return new StepResponse(categoryCustomAttribute);
  }
);

import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { UpdateProductCustomAttributeInput } from "../../modules/product-custom-attributes/types";
import ProductCustomAttributeModuleService from "../../modules/product-custom-attributes/service";
import { PRODUCT_CUSTOM_ATTRIBUTES_MODULE } from "../../modules/product-custom-attributes";

export const updateProductCustomAttributeStep = createStep(
  "update-product-custom-attribute",
  async (
    { product_custom_attributes }: UpdateProductCustomAttributeInput,
    { container }
  ) => {
    const productCustomAttributeService: ProductCustomAttributeModuleService =
      container.resolve(PRODUCT_CUSTOM_ATTRIBUTES_MODULE);

    const productCustomAttribute =
      await productCustomAttributeService.updateProductCustomAttributes(
        product_custom_attributes
      );

    return new StepResponse(productCustomAttribute);
  }
);

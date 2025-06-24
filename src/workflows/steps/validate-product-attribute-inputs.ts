import { MedusaError } from "@medusajs/framework/utils"
import { createStep } from "@medusajs/framework/workflows-sdk"
import { CreateProductCustomAttributeInput } from "../../modules/product-custom-attributes/types"


export const validateProductAttributeInputsStep = createStep(
  "validate-product-attributes",
  async (input: CreateProductCustomAttributeInput) => {
    if (!input.category_custom_attribute_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Required attribute category_custom_attribute_id is missing"
      )
    }
    // Allow empty values since users can fill them later
  }
)
import { MedusaError } from "@medusajs/framework/utils";
import { createStep } from "@medusajs/framework/workflows-sdk";

type Input = {
  label: string;
  type: string;
};

export const validateCategoryAttributeInputsStep = createStep(
  "validate-category-attributes",
  async (input: Input) => {
    if (!input.label || !input.type) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Required attributes is missing"
      );
    }
  }
);

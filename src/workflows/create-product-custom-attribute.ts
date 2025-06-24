import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CreateProductCustomAttributeInput } from "../modules/product-custom-attributes/types";
import { createProductCustomAttributeStep } from "./steps/create-product-custom-attributes";
import { validateProductAttributeInputsStep } from "./steps/validate-product-attribute-inputs";

export const createProductCustomAttributeWorkflow = createWorkflow(
  "create-product-custom-attribute",
  (postInput: CreateProductCustomAttributeInput) => {
    validateProductAttributeInputsStep(postInput);
    const productCustomAttribute = createProductCustomAttributeStep(postInput);

    return new WorkflowResponse(productCustomAttribute);
  }
);

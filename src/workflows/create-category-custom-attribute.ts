import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CreateCategoryCustomAttributeInput } from "../modules/product-custom-attributes/types";
import { createCategoryCustomAttributeStep } from "./steps/create-category-custom-attributes";
import { validateCategoryAttributeInputsStep } from "./steps/validate-category-attribute-inputs";

export const createCategoryCustomAttributeWorkflow = createWorkflow(
  "create-category-custom-attribute",
  (postInput: CreateCategoryCustomAttributeInput) => {

    validateCategoryAttributeInputsStep(postInput);

    const categoryCustomAttribute = createCategoryCustomAttributeStep(postInput);

    return new WorkflowResponse(categoryCustomAttribute);
  }
);

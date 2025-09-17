import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateCategoryCustomAttributeStep } from "./steps/update-category-custom-attributes";
import { UpdateCategoryCustomAttributeInput } from "../modules/product-custom-attributes/types";

export const updateCategoryCustomAttributeWorkflow = createWorkflow(
  "update-category-custom-attribute",
  (postInput: UpdateCategoryCustomAttributeInput) => {
    const categoryCustomAttribute = updateCategoryCustomAttributeStep(postInput);

    return new WorkflowResponse(categoryCustomAttribute);
  }
);

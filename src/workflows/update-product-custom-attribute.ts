import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { UpdateProductCustomAttributeInput } from "../modules/product-custom-attributes/types";
import { updateProductCustomAttributeStep } from "./steps/update-product-custom-attributes";

export const updateProductCustomAttributeWorkflow = createWorkflow(
  "update-product-custom-attribute",
  (postInput: UpdateProductCustomAttributeInput) => {
    const productCustomAttribute = updateProductCustomAttributeStep(postInput);

    return new WorkflowResponse(productCustomAttribute);
  }
);

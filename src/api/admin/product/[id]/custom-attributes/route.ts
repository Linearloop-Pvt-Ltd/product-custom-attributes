import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CreateProductCustomAttributeInput } from "../../../../../modules/product-custom-attributes/types";
import { createProductCustomAttributeWorkflow } from "../../../../../workflows/create-product-custom-attribute";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductCustomAttributeWorkflow } from "../../../../../workflows/update-product-custom-attribute";

export async function POST(
  req: MedusaRequest<CreateProductCustomAttributeInput>,
  res: MedusaResponse
) {
  const { result: productCustomAttribute } =
    await createProductCustomAttributeWorkflow(req.scope).run({
      input: {
        product_id: req.params.id,
        category_custom_attribute_id: req.body.category_custom_attribute_id,
        value: req.body.value,
      },
    });

  res.json({
    productCustomAttribute,
  });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query");
  const { id } = await req.params;

  const { data } = await query.graph({
    entity: "product_custom_attributes",
    fields: ["*", "category_custom_attribute.*"],
    filters: {
      product_id: id,
    },
  });

  if (!data.length) {
    return res.json({
      product_custom_attributes: [],
    });
  }

  return res.json({
    product_custom_attributes: data,
  });
}

export async function PATCH(
  req: MedusaRequest<{
    product_custom_attributes: { id: string; value?: string; deleted_at?: string }[];
  }>,
  res: MedusaResponse
) {
  try {
    
    // Ensure we have a valid request body
    if (!req.body || !req.body.product_custom_attributes || !Array.isArray(req.body.product_custom_attributes)) {
      console.error("Invalid request body format:", req.body);
      return res.status(400).json({
        message: "Invalid request body. Expected product_custom_attributes array.",
        received: req.body
      });
    }
    
    // Ensure each item in the array has an id
    const invalidItems = req.body.product_custom_attributes.filter(item => !item.id);
    if (invalidItems.length > 0) {
      console.error("Invalid items in product_custom_attributes:", invalidItems);
      return res.status(400).json({
        message: "Each item in product_custom_attributes must have an id.",
        invalidItems
      });
    }

    const { result: productCustomAttribute } =
      await updateProductCustomAttributeWorkflow(req.scope).run({
        input: req.body,
      });

    return res.json({
      productCustomAttribute,
    });
  } catch (error) {
    console.error("Error in PATCH handler:", error);
    return res.status(500).json({
      message: "Failed to update product custom attribute",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId } = await req.params;
  const attributeId = req.query.id;
  
  if (!attributeId) {
    return res.status(400).json({
      message: "Attribute ID is required",
    });
  }

  try {
    // Use the workflow to update the deleted_at field (soft delete)
    const { result: productCustomAttribute } =
      await updateProductCustomAttributeWorkflow(req.scope).run({
        input: {
          product_custom_attributes: [
            {
              id: attributeId as string,
              deleted_at: new Date().toISOString(),
            },
          ],
        },
      });

    return res.status(200).json({
      id: attributeId,
      object: "product_custom_attribute",
      deleted: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete product custom attribute",
      error: error.message,
    });
  }
}

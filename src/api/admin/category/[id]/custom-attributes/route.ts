import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CreateCategoryCustomAttributeInput } from "../../../../../modules/product-custom-attributes/types";
import { createCategoryCustomAttributeWorkflow } from "../../../../../workflows/create-category-custom-attribute";
import { updateCategoryCustomAttributeWorkflow } from "../../../../../workflows/update-category-custom-attribute";

export async function POST(
  req: MedusaRequest<CreateCategoryCustomAttributeInput>,
  res: MedusaResponse
) {
  const { result: categoryCustomAttribute } =
    await createCategoryCustomAttributeWorkflow(req.scope).run({
      input: {
        label: req.body.label,
        type: req.body.type,
        category_id: req.params.id,
      },
    });

  res.json({
    categoryCustomAttribute,
  });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query");
  const { id } = await req.params;

  const { data } = await query.graph({
    entity: "category_custom_attributes",
    fields: ["*"],
    filters: {
      category_id: id,
      deleted_at: null,
    },
  });

  if (!data.length) {
    return res.json({
      category_custom_attributes: [],
    });
  }

  return res.json({
    category_custom_attributes: data,
  });
}

export async function PATCH(
  req: MedusaRequest<{
    id: string;
    type?: string;
    label?: string;
    deleted_at?: string;
  }>,
  res: MedusaResponse
) {
  const { result: categoryCustomAttribute } =
    await updateCategoryCustomAttributeWorkflow(req.scope).run({
      input: {
        id: req.body.id,
        ...(req.body.type && { type: req.body.type }),
        ...(req.body.label && { label: req.body.label }),
        ...(req.body.deleted_at && { deleted_at: req.body.deleted_at }),
      },
    });

  res.json({
    categoryCustomAttribute,
  });
}

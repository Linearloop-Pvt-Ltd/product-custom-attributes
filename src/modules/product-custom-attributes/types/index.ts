export type CreateCategoryCustomAttributeInput = {
  label: string;
  category_id: string;
};

export type CreateProductCustomAttributeInput = {
  product_id?: string;
  category_custom_attribute_id?: string;
  value?: string;
};

export type ProductCustomAttributeTypes = {
  id: string;
  value?: string;
  product_id?: string;
  category_custom_attribute_id?: string;
  deleted_at?: string;
};

export type UpdateProductCustomAttributeInput = {
  product_custom_attributes: ProductCustomAttributeTypes[];
};

export type UpdateCategoryCustomAttributeInput = {
  id: string;
  label?: string;
  deleted_at?: string;
};

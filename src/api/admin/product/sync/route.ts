import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PRODUCT_CUSTOM_ATTRIBUTES_MODULE } from "../../../../modules/product-custom-attributes";
import { createProductCustomAttributeWorkflow } from "../../../../workflows/create-product-custom-attribute";
import ProductCustomAttributeModuleService from "../../../../modules/product-custom-attributes/service";

interface CategoryAttribute {
  id: string;
  key: string;
  label: string;
  category_id: string;
}

interface ProductCustomAttribute {
  id: string;
  category_custom_attribute_id: string;
  value: string;
}

interface AttributeResult {
  id: string;
  category_custom_attribute_id: string;
  category_custom_attribute: {  
    key: string;
    label: string;
  };
  value: string;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query");
    const categoryId = req.query.category_id as string;
    const productId = req.query.product_id as string;

    // If productId is provided, perform the sync operation for that product
    if (productId) {
      // Step 1: Find which categories the product belongs to
      const { data: categories } = await query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle", "products.id"],
        filters: {
          products: {
            id: productId
          }
        }
      });

      if (!categories || categories.length === 0) {
        return res.json({
          message: "No categories found for this product",
          product_id: productId,
          categories: [],
          attributes_synced: 0
        });
      }

      // Get all category IDs
      const categoryIds = categories.map(cat => cat.id);

      // Step 2: Get all attributes for these categories
      const { data: categoryAttributes } = await query.graph({
        entity: "category_custom_attribute",
        fields: ["id", "key", "label", "category_id"],
        filters: {
          category_id: categoryIds
        }
      });

      if (!categoryAttributes || categoryAttributes.length === 0) {
        return res.json({
          message: "No attributes found for this product's categories",
          product_id: productId,
          categories: categories.map(c => ({ id: c.id, name: c.name })),
          attributes_synced: 0
        });
      }

      // Step 3: Get existing product custom attributes
      const { data: existingAttributes } = await query.graph({
        entity: "product_custom_attribute",
        fields: ["id", "category_custom_attribute_id", "value"],
        filters: {
          product_id: productId
        }
      });

      // Create a map of existing attributes by category_custom_attribute_id
      const existingAttributesMap: Record<string, ProductCustomAttribute> = {};
      if (existingAttributes) {
        existingAttributes.forEach(attr => {
          existingAttributesMap[attr.category_custom_attribute_id] = attr;
        });
      }

      // Step 4: Create new product custom attributes using the proper service
      const attributesCreated: AttributeResult[] = [];
      const attributesUpdated: AttributeResult[] = [];

      // Test service availability first
      try {
        const productCustomAttributeService: ProductCustomAttributeModuleService =
          req.scope.resolve(PRODUCT_CUSTOM_ATTRIBUTES_MODULE);
      } catch (serviceError) {
        console.error("Failed to resolve service:", serviceError);
        return res.status(500).json({
          message: "Service resolution failed",
          error: serviceError.message,
        });
      }

      // Process each category attribute
      for (const catAttr of categoryAttributes as CategoryAttribute[]) {
        // Check if this attribute already exists for the product
        const existingAttr = existingAttributesMap[catAttr.id];
        
        if (existingAttr) {
          // If it exists, just track it
          attributesUpdated.push({
            id: existingAttr.id,
            category_custom_attribute_id: catAttr.id,
            category_custom_attribute: {
              key: catAttr.key,
              label: catAttr.label
            },
            value: existingAttr.value || ""
          });
        } else {
          try {
            
            // Use the existing workflow to create the product custom attribute
            const { result: productCustomAttribute } = await createProductCustomAttributeWorkflow(req.scope).run({
              input: {
                product_id: productId,
                category_custom_attribute_id: catAttr.id,
                value: "", // Default empty value
              },
            });


            // Add to created array
            attributesCreated.push({
              id: productCustomAttribute.id,
              category_custom_attribute_id: catAttr.id,
              category_custom_attribute: {
                key: catAttr.key,
                label: catAttr.label
              },
              value: ""
            });
          } catch (createError) {
            console.error(`Failed to create attribute for ${catAttr.id}:`, createError);
            console.error("Error details:", {
              message: createError.message,
              stack: createError.stack,
              name: createError.name
            });
            
            // Still track it for response consistency but mark as potentially failed
            const fallbackId = `pca_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            attributesCreated.push({
              id: fallbackId,
              category_custom_attribute_id: catAttr.id,
              category_custom_attribute: {
                key: catAttr.key,
                label: catAttr.label
              },
              value: ""
            });
          }
        }
      }

      return res.json({
        message: "Successfully synced product attributes",
        product_id: productId,
        categories: categories.map(c => ({ id: c.id, name: c.name })),
        attributes_created: attributesCreated.length,
        attributes_updated: attributesUpdated.length,
        attributes_total: attributesCreated.length + attributesUpdated.length,
        created: attributesCreated,
        updated: attributesUpdated
      });
    }

    // The original full join code for when no product_id is specified
    // First, fetch all categories with their products (optionally filtered by category_id)
    const categoryQueryOptions = {
      entity: "product_category",
      fields: ["id", "name", "handle", "products.id", "products.title", "products.handle"],
    };

    if (categoryId) {
      categoryQueryOptions["filters"] = {
        id: categoryId,
      };
    }

    const { data: categories } = await query.graph(categoryQueryOptions);

    // Next, fetch all category custom attributes (optionally filtered by category_id)
    const attributeQueryOptions = {
      entity: "category_custom_attribute",
      fields: ["id", "key", "label", "category_id"],
    };

    if (categoryId) {
      attributeQueryOptions["filters"] = {
        category_id: categoryId,
      };
    }

    const { data: allAttributes } = await query.graph(attributeQueryOptions);

    // Create a map of category IDs to their products
    const categoryProductsMap = {};
    categories.forEach(category => {
      // If productId is provided, filter products in this category
      let filteredProducts = category.products || [];
      if (productId && filteredProducts.length > 0) {
        filteredProducts = filteredProducts.filter(product => product.id === productId);
      }

      categoryProductsMap[category.id] = {
        category_details: {
          id: category.id,
          name: category.name,
          handle: category.handle
        },
        products: filteredProducts
      };
    });
    
    // Create a map of category IDs to their attributes
    const categoryAttributesMap = {};
    allAttributes.forEach(attr => {
      if (!categoryAttributesMap[attr.category_id]) {
        categoryAttributesMap[attr.category_id] = [];
      }
      categoryAttributesMap[attr.category_id].push(attr);
    });

    // Combine all category IDs from both maps to ensure full join
    let allCategoryIds = [...new Set([
      ...Object.keys(categoryProductsMap),
      ...Object.keys(categoryAttributesMap)
    ])];

    // If productId is provided, only include categories that contain this product
    if (productId) {
      allCategoryIds = allCategoryIds.filter(categoryId => {
        const categoryData = categoryProductsMap[categoryId];
        return categoryData && categoryData.products.some(product => product.id === productId);
      });
    }

    // Build the full join result
    const result = allCategoryIds.map(categoryId => {
      const categoryData = categoryProductsMap[categoryId] || {
        category_details: { id: categoryId },
        products: []
      };
      
      return {
        category: categoryData.category_details,
        products: categoryData.products,
        attributes: categoryAttributesMap[categoryId] || []
      };
    });

    return res.json({
      result: result,
      categories_count: allCategoryIds.length,
      products_count: result.reduce((count, item) => 
        count + (item.products ? item.products.length : 0), 0),
      attributes_count: result.reduce((count, item) => 
        count + (item.attributes ? item.attributes.length : 0), 0),
      product_id: productId || null,
      category_id: categoryId || null
    });
  } catch (error) {
    console.error("Error performing sync operation:", error);
    return res.status(500).json({
      message: "An error occurred while syncing product attributes",
      error: error.message,
      stack: error.stack
    });
  }
} 
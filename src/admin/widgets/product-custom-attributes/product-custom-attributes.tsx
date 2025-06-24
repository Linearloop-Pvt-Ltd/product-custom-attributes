import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import { Pencil, Trash } from "@medusajs/icons";
import { Container, Heading, Text, Button, Input, Textarea } from "@medusajs/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { SectionRow } from "../../components/section-row";
import { sdk } from "../../lib/sdk";
import { ProductCustomAttribute } from "./types";

// Extended interface for UI state
interface ProductCustomAttributeWithUI extends ProductCustomAttribute {
  is_edit?: boolean;
}

// Interface for sync result
interface SyncResult {
  message: string;
  product_id: string;
  categories: Array<{
    id: string;
    name: string;
  }>;
  attributes_created: number;
  attributes_updated: number;
  attributes_total: number;
  created: Array<{
    id: string;
    category_custom_attribute_id: string;
    category_custom_attribute: {
      key: string;
      label: string;
    };
    value: string;
  }>;
  updated: Array<any>;
}

// Add this interface for API response
interface SaveAttributeResponse {
  productCustomAttribute: {
    id: string;
    [key: string]: any;
  };
}

const ProductCustomAttributesWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{
    product_custom_attributes: ProductCustomAttribute[];
  }>({
    queryFn: () =>
      sdk.client.fetch(`/admin/product/${product.id}/custom-attributes`),
    queryKey: [["product", product.id, "custom-attributes"]],
  });

  const [productAttributes, setProductAttributes] = useState<
    ProductCustomAttributeWithUI[]
  >([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Update local state when data changes
  useEffect(() => {
    if (data?.product_custom_attributes) {
      setProductAttributes(
        data.product_custom_attributes.map((attr) => ({
          ...attr,
          is_edit: false,
        }))
      );
    }
  }, [data?.product_custom_attributes]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await sdk.client.fetch(`/admin/product/sync?product_id=${product.id}`);
      setSyncResult(result as SyncResult);
      
      // Invalidate the query to refetch the data
      await queryClient.invalidateQueries({
        queryKey: [["product", product.id, "custom-attributes"]],
      });
      
      // If we have created attributes in the result, add them to the local state
      if (result && (result as SyncResult).created && (result as SyncResult).created.length > 0) {
        const syncData = result as SyncResult;
        
        // Create properly typed product attributes from sync result
        const newAttributes: ProductCustomAttributeWithUI[] = syncData.created.map(attr => {
          return {
            id: attr.id,
            product_id: product.id,
            category_custom_attribute_id: attr.category_custom_attribute_id,
            value: attr.value,
            category_custom_attribute: {
              id: attr.category_custom_attribute_id,
              key: attr.category_custom_attribute.key,
              label: attr.category_custom_attribute.label,
              category_id: "", // We don't have this in the sync result, but need it for the type
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: null
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            is_edit: false
          };
        });
        
        setProductAttributes(prev => [...prev, ...newAttributes]);
      }
      
    } catch (error) {
      console.error("Error syncing categories:", error);
      alert("Failed to sync categories");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async (id: string, value: string) => {
    try {
      // Find the attribute to get its category_custom_attribute_id
      const attribute = productAttributes.find(attr => attr.id === id);
      
      if (!attribute?.category_custom_attribute_id) {
        console.error("Cannot find category_custom_attribute_id");
        return;
      }

      // For existing attributes, use PATCH with the attribute ID
      if (id && !id.startsWith('temp_')) {
        const payload = {
          product_custom_attributes: [
            {
              id: id,
              value: value
            }
          ]
        };

        const url = `/admin/product/${product.id}/custom-attributes`;
        const method = "PATCH";
        
        // Detailed logging for debugging
        console.log("Update Request Details:", {
          url: url,
          method: method,
          payload: payload,
          stringifiedPayload: JSON.stringify(payload)
        });

        // Try using a direct fetch call instead of the SDK
        try {
          const baseUrl = window.location.origin;
          const fullUrl = `${baseUrl}/admin/product/${product.id}/custom-attributes`;
          
          console.log("Making direct fetch call to:", fullUrl);
          
          const response = await fetch(fullUrl, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update: ${response.status} ${errorText}`);
          }
          
          const data = await response.json();
          console.log("Direct fetch response:", data);
        } catch (fetchError) {
          console.error("Direct fetch failed:", fetchError);
          
          // Fall back to SDK if direct fetch fails
          console.log("Falling back to SDK fetch");
          await sdk.client.fetch(
            url,
            {
              method,
              body: JSON.stringify(payload),
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        }
      } 
      // For new attributes, use POST with category_custom_attribute_id
      else {
        const payload = {
          category_custom_attribute_id: attribute.category_custom_attribute_id,
          value: value
        };

        const url = `/admin/product/${product.id}/custom-attributes`;
        const method = "POST";
        
        console.log("Create Request Details:", {
          url: url,
          method: method,
          payload: payload
        });

        const response = await sdk.client.fetch(
          url,
          {
            method,
            body: JSON.stringify(payload),
            headers: {
              "Content-Type": "application/json",
            },
          }
        ) as SaveAttributeResponse;

        console.log("API response:", response);

        // If this was a new attribute, we need to update the ID with the one from the response
        if (response && response.productCustomAttribute?.id) {
          setProductAttributes((prev) =>
            prev.map((attr) =>
              attr.id === id ? { ...attr, id: response.productCustomAttribute.id, value, is_edit: false } : attr
            )
          );
          
          // Exit early as we've already updated the state
          queryClient.invalidateQueries({
            queryKey: [["product", product.id, "custom-attributes"]],
          });
          return;
        }
      }

      // Update local state for existing attributes
      setProductAttributes((prev) =>
        prev.map((attr) =>
          attr.id === id ? { ...attr, value, is_edit: false } : attr
        )
      );

      // Refresh the data after saving
      queryClient.invalidateQueries({
        queryKey: [["product", product.id, "custom-attributes"]],
      });
    } catch (error: any) {
      console.error("Failed to update attribute", error);
      alert(`Error: ${error?.message || "Failed to save attribute"}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // The backend expects the ID as a query parameter, not in the path
      const url = `/admin/product/${product.id}/custom-attributes?id=${id}`;
      
      console.log("Delete Request Details:", {
        url: url,
        method: "DELETE",
        attributeId: id,
        productId: product.id
      });
      
      await sdk.client.fetch(
        url,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state to remove the deleted attribute
      setProductAttributes((prev) =>
        prev.filter((attr) => attr.id !== id)
      );
      
      // Refresh the data after deleting
      queryClient.invalidateQueries({
        queryKey: [["product", product.id, "custom-attributes"]],
      });
    } catch (error: any) {
      console.error("Failed to delete attribute", error);
      alert(`Error deleting attribute: ${error?.message || "Unknown error"}`);
    }
  };

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Custom Attributes </Heading>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? "Syncing..." : "Sync Categories"}
            </Button>
          </div>
        </div>
        
        {syncResult && syncResult.created && syncResult.created.length > 0 && (
          <div className="px-6 py-2 bg-emerald-50">
            <Text size="small" className="text-emerald-700">
              Successfully synced {syncResult.attributes_total} attributes from {syncResult.categories.length} categories.
            </Text>
          </div>
        )}
        
        <div className="px-6 py-4">
          {isLoading ? (
            "Loading..."
          ) : productAttributes?.filter(attr => !attr.deleted_at).length ? (
            <ul className="space-y-4">
              {productAttributes.filter(attr => !attr.deleted_at).map((attr: ProductCustomAttributeWithUI) => (
                <SectionRow
                  key={attr.id}
                  title={attr?.category_custom_attribute?.label || "Unknown"}
                  value={
                    attr?.is_edit ? (
                      <Textarea
                        rows={3}
                        value={attr?.value || ""}
                        onChange={(e) => {
                          setProductAttributes(
                            productAttributes.map((pa) =>
                              pa.id === attr.id
                                ? { ...attr, value: e.target.value }
                                : pa
                            )
                          );
                        }}
                        placeholder={`Enter value for ${attr?.category_custom_attribute?.label}`}
                      />
                    ) : (
                      attr?.value || <Text size="small" className="text-ui-fg-subtle">No value set</Text>
                    )
                  }
                  actions={
                    attr?.is_edit ? (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleSave(attr.id, attr.value || "")}
                      >
                        Save
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-ui-fg-muted hover:text-ui-fg-base transition-colors"
                          onClick={() => {
                            setProductAttributes(
                              productAttributes.map((pa) =>
                                pa.id === attr.id
                                  ? { ...attr, is_edit: true }
                                  : pa
                              )
                            );
                          }}
                          title="Edit attribute value"
                        >
                          <Pencil />
                        </button>
                        <button
                          type="button"
                          className="text-ui-fg-muted hover:text-ui-fg-base transition-colors"
                          onClick={() => handleDelete(attr.id)}
                          title="Delete attribute"
                        >
                          <Trash />
                        </button>
                      </div>
                    )
                  }
                />
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <Text size="small" className="text-ui-fg-subtle mb-4">No custom attributes found.</Text>
              <Text size="small">
                Click "Sync Categories" to fetch attributes from the product's categories.
              </Text>
            </div>
          )}
        </div>
      </Container>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.before", // Or another appropriate injection zone
});

export default ProductCustomAttributesWidget;

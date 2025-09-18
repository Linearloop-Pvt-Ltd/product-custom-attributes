import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import { Pencil, Spinner, Trash } from "@medusajs/icons";
import { Container, Heading, Text, Button, Textarea, Switch } from "@medusajs/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { SectionRow } from "../../components/section-row";
import { sdk } from "../../lib/sdk";
import { ProductCustomAttribute } from "./types";

// Extended interface for UI state
interface ProductCustomAttributeWithUI extends ProductCustomAttribute {
  is_edit?: boolean;
  is_visible?: boolean;
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
    is_visible?: boolean;
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
            is_visible: attr.is_visible,
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
              value: value,
              is_visible: attribute.is_visible,
            }
          ]
        };

        const url = `/admin/product/${product.id}/custom-attributes`;
        const method = "PATCH";
        // Try using a direct fetch call instead of the SDK
        try {
          await sdk.client.fetch(
            url,
            {
              method,
              body: payload,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        } catch (fetchError) {
         console.error(fetchError, "fetchError");
        }
      } else {
        const payload = {
          category_custom_attribute_id: attribute.category_custom_attribute_id,
          value: value,
          is_visible: attribute.is_visible,
        };

        const url = `/admin/product/${product.id}/custom-attributes`;
        const method = "POST";
        
        const response = await sdk.client.fetch(
          url,
          {
            method,
            body: payload,
            headers: {
              "Content-Type": "application/json",
            },
          }
        ) as SaveAttributeResponse;

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
    const confirmed = window.confirm(
      "Are you sure you want to delete this custom attribute? This action cannot be undone."
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const url = `/admin/product/${product.id}/custom-attributes?id=${id}`;
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
      alert(`Error deleting attribute: ${error?.message || "Unknown error"}`);
    }
  };

  const handleToggleVisibility = async (id: string, is_visible: boolean) => {
    try {
      const attribute = productAttributes.find((attr) => attr.id === id);
      if (!attribute) return;

      const payload = {
        product_custom_attributes: [
          {
            id: id,
            value: attribute.value,
            is_visible: is_visible,
          },
        ],
      };

      const url = `/admin/product/${product.id}/custom-attributes`;
      const method = "PATCH";

      // Only use sdk.client.fetch for API call
      await sdk.client.fetch(url, {
        method,
        body: payload,
        headers: {
          "Content-Type": "application/json",
        },
      });

      setProductAttributes((prev) =>
        prev.map((attr) =>
          attr.id === id ? { ...attr, is_visible } : attr
        )
      );

      queryClient.invalidateQueries({
        queryKey: [["product", product.id, "custom-attributes"]],
      });
    } catch (error: any) {
      console.error("Failed to update visibility", error);
      alert(`Error: ${error?.message || "Failed to update visibility"}`);
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
              {isSyncing ? <Spinner className="animate-spin" /> : "Sync Custom Attributes"}
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
            <div className="flex items-center justify-center h-full">
              <Spinner className="animate-spin" />
            </div>
          ) : productAttributes?.filter(attr => !attr.deleted_at).length ? (
            <div className="grid grid-cols-4 gap-x-4 gap-y-8">
              {/* Data Rows */}
              {productAttributes.filter(attr => !attr.deleted_at).map((attr: ProductCustomAttributeWithUI) => (
                <>
                  {/* Attribute Label */}
                  <div className="flex items-center text-left">
                    {attr?.category_custom_attribute?.label || "Unknown"}
                  </div>
                  {/* Attribute Value */}
                  <div className="flex flex-col justify-start text-left">
                    {attr?.is_edit ? (
                      <div className="flex items-center gap-2">
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
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleSave(attr.id, attr.value || "")}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div>
                        {attr?.value || <Text size="small" className="text-ui-fg-subtle"> -- </Text>}
                      </div>
                    )}
                  </div>
                  {/* Visibility Switch */}
                  <div className="flex items-center gap-2 justify-start text-left">
                    <Switch
                      checked={!!attr.is_visible}
                      onCheckedChange={(checked) => handleToggleVisibility(attr.id, checked)}
                      id={`is-visible-switch-${attr.id}`}
                    />
                    <label htmlFor={`is-visible-switch-${attr.id}`}>
                      Visible
                    </label>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-start text-left">
                    {!attr?.is_edit && (
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
                    )}
                    {!attr?.is_edit && (
                      <button
                        type="button"
                        className="text-ui-fg-muted hover:text-ui-fg-base transition-colors"
                        onClick={() => handleDelete(attr.id)}
                        title="Delete attribute"
                      >
                        <Trash />
                      </button>
                    )}
                  </div>
                </>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Text size="small" className="text-ui-fg-subtle mb-4">No custom attributes found.</Text>
              <Text size="small">
                Click "Sync Custom Attributes" to fetch attributes from the product's categories.
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

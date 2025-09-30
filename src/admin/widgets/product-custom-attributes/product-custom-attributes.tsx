import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import { Pencil, Spinner, Trash } from "@medusajs/icons";
import {
  Container,
  Heading,
  Text,
  Button,
  Textarea,
  Switch,
  Drawer,
  Label,
} from "@medusajs/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { SectionRow } from "../../components/section-row";
import { sdk } from "../../lib/sdk";
import { ProductCustomAttribute } from "./types";
import { toast } from "@medusajs/ui";
import { ConfirmationDialog } from "../../components/delete-confirmation";
import { FileUpload } from "../../components/file-uploader";

interface ProductCustomAttributeWithUI extends ProductCustomAttribute {
  is_edit?: boolean;
  is_visible?: boolean;
  // Allow optional type on nested category attribute for UI logic
  category_custom_attribute: ProductCustomAttribute["category_custom_attribute"] & {
    type?: string | null;
  };
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
      type?: string | null;
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

  // Drawer state for editing
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] =
    useState<ProductCustomAttributeWithUI | null>(null);
  const [editFormData, setEditFormData] = useState<{
    value: string;
    is_visible: boolean;
  }>({ value: "", is_visible: false });

  useEffect(() => {
    if (data?.product_custom_attributes) {
      setProductAttributes(
        data.product_custom_attributes.map((attr) => ({
          ...attr,
          is_edit: false,
        })) as ProductCustomAttributeWithUI[]
      );
    }
  }, [data?.product_custom_attributes]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await sdk.client.fetch(
        `/admin/product/sync?product_id=${product.id}`
      );
      setSyncResult(result as SyncResult);

      await queryClient.invalidateQueries({
        queryKey: [["product", product.id, "custom-attributes"]],
      });

      if (
        result &&
        (result as SyncResult).created &&
        (result as SyncResult).created.length > 0
      ) {
        const syncData = result as SyncResult;

        const newAttributes: ProductCustomAttributeWithUI[] =
          syncData.created.map((attr) => {
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
                type: attr.category_custom_attribute.type ?? null,
                category_id: "", // unknown here
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                deleted_at: null,
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: null,
              is_edit: false,
            };
          });

        setProductAttributes((prev) => [...prev, ...newAttributes]);
      }

      toast.success("Custom attributes synced");
    } catch (error) {
      console.error("Error syncing categories:", error);
      toast.error("Failed to sync categories");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async (id: string, value: string, is_visible: boolean) => {
    try {
      const attribute = productAttributes.find((attr) => attr.id === id);

      if (!attribute?.category_custom_attribute_id) {
        console.error("Cannot find category_custom_attribute_id");
        toast.error("Failed to save: missing attribute reference");
        return;
      }

      if (id && !id.startsWith("temp_")) {
        const payload = {
          product_custom_attributes: [
            {
              id: id,
              value: value,
              is_visible: is_visible,
            },
          ],
        };

        const url = `/admin/product/${product.id}/custom-attributes`;
        const method = "PATCH";
        try {
          await sdk.client.fetch(url, {
            method,
            body: payload,
            headers: {
              "Content-Type": "application/json",
            },
          });
          toast.success("Attribute updated successfully");
        } catch (fetchError) {
          console.error(fetchError, "fetchError");
          toast.error("Failed to update attribute");
          return;
        }
      } else {
        const payload = {
          category_custom_attribute_id: attribute.category_custom_attribute_id,
          value: value,
          is_visible: is_visible,
        };

        const url = `/admin/product/${product.id}/custom-attributes`;
        const method = "POST";

        const response = (await sdk.client.fetch(url, {
          method,
          body: payload,
          headers: {
            "Content-Type": "application/json",
          },
        })) as SaveAttributeResponse;

        if (response && response.productCustomAttribute?.id) {
          setProductAttributes((prev) =>
            prev.map((attr) =>
              attr.id === id
                ? {
                    ...attr,
                    id: response.productCustomAttribute.id,
                    value,
                    is_visible,
                    is_edit: false,
                  }
                : attr
            )
          );

          queryClient.invalidateQueries({
            queryKey: [["product", product.id, "custom-attributes"]],
          });
          toast.success("Attribute created");
          return;
        }
      }

      setProductAttributes((prev) =>
        prev.map((attr) =>
          attr.id === id ? { ...attr, value, is_visible, is_edit: false } : attr
        )
      );

      queryClient.invalidateQueries({
        queryKey: [["product", product.id, "custom-attributes"]],
      });
    } catch (error: any) {
      console.error("Failed to update attribute", error);
      toast.error(error?.message || "Failed to save attribute");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const url = `/admin/product/${product.id}/custom-attributes?id=${id}`;
      await sdk.client.fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setProductAttributes((prev) => prev.filter((attr) => attr.id !== id));

      queryClient.invalidateQueries({
        queryKey: [["product", product.id, "custom-attributes"]],
      });

      toast.success("Attribute deleted");
    } catch (error: any) {
      toast.error(error?.message || "Error deleting attribute");
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

      await sdk.client.fetch(url, {
        method,
        body: payload,
        headers: {
          "Content-Type": "application/json",
        },
      });

      setProductAttributes((prev) =>
        prev.map((attr) => (attr.id === id ? { ...attr, is_visible } : attr))
      );

      queryClient.invalidateQueries({
        queryKey: [["product", product.id, "custom-attributes"]],
      });

      toast.success("Visibility updated");
    } catch (error: any) {
      console.error("Failed to update visibility", error);
      toast.error(error?.message || "Failed to update visibility");
    }
  };

  // Upload file for file-type attributes: returns final file URL
  const uploadFileAndGetUrl = async (file: File): Promise<string> => {
    // 1) get presigned POST
    const presign = (await sdk.client.fetch(`/admin/s3-presigned-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        name: file.name,
        type: file.type,
      },
    })) as {
      success: boolean;
      url: string;
      fields: Record<string, string>;
      fileUrl: string;
    };

    if (!presign?.success) {
      throw new Error("Failed to get upload URL");
    }

    // 2) upload to S3 with formData
    const formData = new FormData();
    Object.entries(presign.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("Content-Type", file.type);
    formData.append("file", file);

    const s3Res = await fetch(presign.url, {
      method: "POST",
      body: formData,
    });

    if (!s3Res.ok) {
      throw new Error("Failed to upload file");
    }

    // 3) return accessible file URL
    return presign.fileUrl;
  };

  const handleUploadForAttribute = async (
    attr: ProductCustomAttributeWithUI,
    file?: File | null
  ) => {
    if (!file) return;
    try {
      const fileUrl = await uploadFileAndGetUrl(file);

      // apply value and save
      const id = attr.id;
      // Optimistic UI
      setProductAttributes((prev) =>
        prev.map((a) => (a.id === id ? { ...a, value: fileUrl } : a))
      );
      await handleSave(id, fileUrl, attr.is_visible || false);
      toast.success("File uploaded");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "File upload failed");
    }
  };

  // Open edit drawer for an attribute
  const openEditDrawer = (attribute: ProductCustomAttributeWithUI) => {
    setEditingAttribute(attribute);
    setEditFormData({
      value: attribute.value || "",
      is_visible: attribute.is_visible || false,
    });
    setEditDrawerOpen(true);
  };

  // Save changes from edit drawer
  const handleEditSave = async () => {
    if (!editingAttribute) return;

    await handleSave(
      editingAttribute.id,
      editFormData.value,
      editFormData.is_visible
    );

    setEditDrawerOpen(false);
    setEditingAttribute(null);
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
              {isSyncing ? (
                <Spinner className="animate-spin" />
              ) : (
                "Sync Custom Attributes"
              )}
            </Button>
          </div>
        </div>

        {syncResult && syncResult.created && syncResult.created.length > 0 && (
          <div className="px-6 py-2 bg-emerald-50">
            <Text size="small" className="text-emerald-700">
              Successfully synced {syncResult.attributes_total} attributes from{" "}
              {syncResult.categories.length} categories.
            </Text>
          </div>
        )}

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner className="animate-spin" />
            </div>
          ) : productAttributes?.filter((attr) => !attr.deleted_at).length ? (
            <div className="grid gap-y-6">
              {productAttributes
                .filter((attr) => !attr.deleted_at)
                .map((attr: ProductCustomAttributeWithUI) => (
                  <div
                    key={attr.id}
                    className="grid grid-cols-[1.5fr_2.5fr_auto_auto] gap-x-6 items-start"
                  >
                    {/* Attribute Label */}
                    <div className="flex items-start text-left pt-1">
                      <span className="font-medium">
                        {attr?.category_custom_attribute?.label || "Unknown"}
                      </span>
                    </div>

                    {/* Attribute Value */}
                    <div className="flex items-start">
                      {attr?.category_custom_attribute?.type === "file" ? (
                        attr?.value ? (
                          <div
                            onClick={() => window.open(attr.value, "_blank")}
                            className="cursor-pointer w-[450px]"
                          >
                            <img
                              src={attr.value}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded"
                            />
                          </div>
                        ) : (
                          <Text size="small" className="text-ui-fg-subtle pt-1">
                            --
                          </Text>
                        )
                      ) : (
                        <span className="break-words max-w-full w-[450px] leading-relaxed">
                          {attr?.value || (
                            <Text size="small" className="text-ui-fg-subtle">
                              --
                            </Text>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Visibility Switch */}
                    <div className="flex items-start gap-2 justify-start text-left pt-1 min-w-[120px]">
                      <Switch
                        checked={!!attr.is_visible}
                        disabled
                        id={`is-visible-switch-${attr.id}`}
                      />
                      <label
                        htmlFor={`is-visible-switch-${attr.id}`}
                        className="whitespace-nowrap"
                      >
                        Visible
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-2 justify-start text-left min-w-[180px]">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => openEditDrawer(attr)}
                      >
                        <Pencil />
                        Edit
                      </Button>
                      <ConfirmationDialog
                        variant="danger"
                        title="Delete Attribute"
                        description="Are you sure you want to delete this custom attribute? This action cannot be undone."
                        onConfirm={() => handleDelete(attr.id)}
                        confirmText="Delete"
                        cancelText="Cancel"
                      >
                        <Button variant="danger" size="small">
                          <Trash />
                          Delete
                        </Button>
                      </ConfirmationDialog>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Text size="small" className="text-ui-fg-subtle mb-4">
                No custom attributes found.
              </Text>
              <Text size="small">
                Click "Sync Custom Attributes" to fetch attributes from the
                product's categories.
              </Text>
            </div>
          )}
        </div>
      </Container>

      {/* Edit Drawer */}
      <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>Edit Custom Attribute</Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-6">
            {editingAttribute && (
              <>
                <div>
                  <Label size="small" weight="plus">
                    {editingAttribute.category_custom_attribute?.label ||
                      "Custom Attribute"}
                  </Label>
                  {editingAttribute.category_custom_attribute?.type ===
                  "file" ? (
                    <div className="mt-2">
                      <FileUpload
                        initialUrl={editingAttribute.value}
                        onUploaded={async (url) => {
                          if (editingAttribute) {
                            await handleSave(
                              editingAttribute.id,
                              url,
                              editingAttribute.is_visible || false
                            );
                            setEditDrawerOpen(false); // Close drawer after upload and save
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <Textarea
                      rows={4}
                      value={editFormData.value}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          value: e.target.value,
                        })
                      }
                      placeholder={`Enter value for ${editingAttribute.category_custom_attribute?.label}`}
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editFormData.is_visible}
                      onCheckedChange={(checked) =>
                        setEditFormData({
                          ...editFormData,
                          is_visible: checked,
                        })
                      }
                      id="edit-visibility-switch"
                    />
                    <Label htmlFor="edit-visibility-switch">
                      Make this attribute visible to customers
                    </Label>
                  </div>
                </div>
              </>
            )}
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary">
                  Cancel
                </Button>
              </Drawer.Close>
              {editingAttribute?.category_custom_attribute?.type !== "file" && (
                <Button size="small" onClick={handleEditSave}>
                  Save Changes
                </Button>
              )}
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.before", // Or another appropriate injection zone
});

export default ProductCustomAttributesWidget;

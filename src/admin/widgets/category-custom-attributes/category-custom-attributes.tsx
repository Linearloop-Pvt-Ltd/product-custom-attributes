import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import {
  Button,
  Container,
  Heading,
  Input,
  Select,
  Text,
  toast,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { SectionRow } from "../../components/section-row";
import { sdk } from "../../lib/sdk";
import { Pencil, Spinner, Trash } from "@medusajs/icons";
import { useState, useEffect } from "react";
import { CategoryCustomAttribute } from "../product-custom-attributes/types";
import { attributeTypes } from "../../lib/constants";
import { ConfirmationDialog } from "../../components/delete-confirmation";
// Adjust this type based on your plugin's response structure

type AttributeType = "text" | "file";

type UIAttribute = CategoryCustomAttribute & {
  is_edit?: boolean;
  type?: AttributeType;
  editLabel?: string;
};

const CategoryCustomAttributesWidget = ({
  data: product_category,
}: DetailWidgetProps<AdminProduct>) => {
  const { data, isLoading } = useQuery<{
    category_custom_attributes: CategoryCustomAttribute[];
  }>({
    queryFn: () =>
      sdk.client.fetch(
        `/admin/category/${product_category.id}/custom-attributes`
      ),
    queryKey: [["category", product_category.id, "custom-attributes"]],
  });

  const [categoryAttributes, setCategoryAttributes] = useState<UIAttribute[]>(
    data?.category_custom_attributes || []
  );

  const [newAttribute, setNewAttribute] = useState<{
    label: string;
    type: AttributeType;
  }>({ label: "", type: "text" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add is_edit key with default value (false) to each attribute in the data array, if data exists

  useEffect(() => {
    if (data?.category_custom_attributes) {
      setCategoryAttributes(
        data.category_custom_attributes.map((attr) => ({
          ...attr,
          is_edit: (attr as any).is_edit ?? false,
          // If backend doesn't send type yet, default to "text"
          type: (attr as any).type ?? "text",
        }))
      );
    }
  }, [data?.category_custom_attributes]);

  const handleSave = async (id: string, value: string) => {
    try {
      // Call the API to update the custom attribute
      await sdk.client.fetch(
        `/admin/category/${product_category.id}/custom-attributes`,
        {
          method: "PATCH",
          body: {
            id: id,
            label: value,
          },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setCategoryAttributes((prev) =>
        prev.map((attr) =>
          attr.id === id
            ? { ...attr, label: value, is_edit: false, editLabel: undefined }
            : attr
        )
      );
      toast.success("Attribute updated successfully.");
    } catch (error) {
      toast.error(
        "Failed to update attribute! Please try again after some time."
      );
    }
  };

  const handleCancelEdit = (id: string) => {
    setCategoryAttributes((prev) =>
      prev.map((attr) =>
        attr.id === id
          ? { ...attr, is_edit: false, editLabel: undefined }
          : attr
      )
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const deletePayload = {
        id: id,
        deleted_at: new Date().toISOString(),
      };

      await sdk.client.fetch(
        `/admin/category/${product_category.id}/custom-attributes`,
        {
          method: "PATCH",
          body: deletePayload,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state to reflect the deletion
      setCategoryAttributes((prev) =>
        prev.map((attr) =>
          attr.id === id
            ? { ...attr, deleted_at: new Date().toISOString() }
            : attr
        )
      );
      toast.success("Attribute deleted successfully.");
    } catch (error) {
      toast.error(
        "Failed to delete attribute! Please try again after some time."
      );
    }
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttribute.label) return;
    setIsSubmitting(true);
    try {
      const createAttributePayload = {
        label: newAttribute.label,
        type: newAttribute.type,
      };

      const created: { categoryCustomAttribute: CategoryCustomAttribute } =
        await sdk.client.fetch(
          `/admin/category/${product_category.id}/custom-attributes`,
          {
            method: "POST",
            // Include type so backend can adopt later; ignored if not supported yet
            body: createAttributePayload,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      setCategoryAttributes((prev) => [
        ...(prev || []),
        {
          ...created.categoryCustomAttribute,
          is_edit: false,
          type: newAttribute.type,
        },
      ]);
      setNewAttribute({ label: "", type: "text" });
      toast.success("Attribute added successfully");
    } catch (error) {
      toast.error("Failed to add attribute! Please try again after some time.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Custom Attributes </Heading>
        </div>
        {/* Add Attribute Form */}
        <form
          onSubmit={handleAddAttribute}
          className="px-6 py-2 flex gap-2 items-end"
        >
          <div>
            <label className="block text-xs mb-1">Type</label>
            <Select
              value={newAttribute.type}
              onValueChange={(val: AttributeType) =>
                setNewAttribute({ ...newAttribute, type: val })
              }
            >
              <Select.Trigger>
                <Select.Value placeholder="Select a type" />
              </Select.Trigger>
              <Select.Content>
                {attributeTypes.map((item) => (
                  <Select.Item key={item.value} value={item.value}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div>
            <label className="block text-xs mb-1">Label</label>
            <Input
              type="text"
              value={newAttribute.label}
              onChange={(e) =>
                setNewAttribute({ ...newAttribute, label: e.target.value })
              }
              placeholder="e.g. Brand"
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="animate-spin" /> : "Add"}
          </Button>
        </form>
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner className="animate-spin" />
            </div>
          ) : categoryAttributes?.filter((attr) => !attr.deleted_at).length ? (
            <ul>
              {categoryAttributes
                .filter((attr) => !attr.deleted_at)
                .map((attr: UIAttribute, index) => (
                  <SectionRow
                    key={attr.id}
                    title={`Attribute ${index + 1}`}
                    value={
                      attr?.is_edit ? (
                        <div className="flex items-center gap-3">
                          <Input
                            type="text"
                            value={attr?.editLabel ?? attr?.label ?? ""}
                            onChange={(e) => {
                              setCategoryAttributes(
                                categoryAttributes.map((ca) =>
                                  ca.id === attr.id
                                    ? { ...attr, editLabel: e.target.value }
                                    : ca
                                )
                              );
                            }}
                          />
                          <span className="text-xs text-ui-fg-muted">
                            Type:{" "}
                            <span className="px-2 py-0.5 border rounded">
                              {attr?.type ?? "text"}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span>{attr?.label}</span>
                          <span className="text-xs text-ui-fg-muted px-2 py-0.5 border rounded">
                            {(attr?.type ?? "text") === "text"
                              ? "Text field"
                              : "File"}
                          </span>
                        </div>
                      )
                    }
                    actions={
                      attr?.is_edit ? (
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            onClick={() => handleCancelEdit(attr.id)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() =>
                              handleSave(attr.id, attr.editLabel ?? attr.label)
                            }
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setCategoryAttributes(
                                categoryAttributes.map((catAttribute) =>
                                  catAttribute.id === attr.id
                                    ? {
                                        ...attr,
                                        is_edit: true,
                                        editLabel: attr.label,
                                      }
                                    : catAttribute
                                )
                              );
                            }}
                            title="Edit attribute"
                          >
                            <Pencil />
                          </Button>

                          <ConfirmationDialog
                            onConfirm={() => handleDelete(attr.id)}
                            description="Are you sure you want to delete this custom attribute? This action cannot be undone."
                            title="Delete Attribute?"
                          >
                            <Button variant="danger">
                              <Trash />
                            </Button>
                          </ConfirmationDialog>
                        </div>
                      )
                    }
                  />
                ))}
            </ul>
          ) : (
            <Text size="small">No custom attributes found.</Text>
          )}
        </div>
      </Container>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: "product_category.details.before", // Or another appropriate injection zone
});

export default CategoryCustomAttributesWidget;

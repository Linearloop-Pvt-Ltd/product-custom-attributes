import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import { Container, Heading, Input, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { SectionRow } from "../../components/section-row";
import { sdk } from "../../lib/sdk";
import { Pencil, Spinner, Trash } from "@medusajs/icons";
import { useState, useEffect } from "react";
import { CategoryCustomAttribute } from "../product-custom-attributes/types";
// Adjust this type based on your plugin's response structure

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

  const [categoryAttributes, setCategoryAttributes] = useState<
    CategoryCustomAttribute[]
  >(data?.category_custom_attributes || []);

  const [newAttribute, setNewAttribute] = useState({ label: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add is_edit key with default value (false) to each attribute in the data array, if data exists

  useEffect(() => {
    if (data?.category_custom_attributes) {
      setCategoryAttributes(
        data.category_custom_attributes.map((attr) => ({
          ...attr,
          is_edit: attr.is_edit ?? false,
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
          body:  {
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
          attr.id === id ? { ...attr, label: value, is_edit: false } : attr
        )
      );
    } catch (error) {
      console.error("Failed to update attribute", error);
    }
  };

  const handleDelete = async (id: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this custom attribute? This action cannot be undone."
    );
    
    if (!confirmed) {
      return;
    }

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
          attr.id === id ? { ...attr, deleted_at: new Date().toISOString() } : attr
        )
      );
    } catch (error) {
      console.error("Failed to delete attribute", error);
    }
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttribute.label) return;
    setIsSubmitting(true);
    try {
      const created: { categoryCustomAttribute: CategoryCustomAttribute } = await sdk.client.fetch(
        `/admin/category/${product_category.id}/custom-attributes`,
        {
          method: "POST",
          // body: JSON.stringify({
          //   label: newAttribute.label,
          // }),
          body: { label: newAttribute.label },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setCategoryAttributes((prev) => [
        ...(prev || []),
        { ...created.categoryCustomAttribute, is_edit: false },
      ]);
      setNewAttribute({ label: '' });
    } catch (error) {
      console.error("Failed to add attribute", error);
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
        <form onSubmit={handleAddAttribute} className="px-6 py-2 flex gap-2 items-end">
          <div>
            <label className="block text-xs mb-1">Label</label>
            <Input
              type="text"
              value={newAttribute.label}
              onChange={e => setNewAttribute({ label: e.target.value })}
              placeholder="e.g. Brand"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-ui-bg-base border rounded px-3 py-1 text-sm h-8 w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner className="animate-spin" /> : 'Add'}
          </button>
        </form>
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner className="animate-spin" />
            </div>
          ) : categoryAttributes?.filter(attr => !attr.deleted_at).length ? (
            <ul>
              {categoryAttributes.filter(attr => !attr.deleted_at).map(
                (attr: CategoryCustomAttribute, index) => (
                  <SectionRow
                    key={attr.id}
                    title={`Attribute ${index + 1}`}
                    value={
                      attr?.is_edit ? (
                        <Input
                          type="text"
                          value={attr?.label}
                          onChange={(e) => {
                            setCategoryAttributes(
                              categoryAttributes.map((ca) =>
                                ca.id === attr.id
                                  ? { ...attr, label: e.target.value }
                                  : ca
                              )
                            );
                          }}
                        />
                      ) : (
                        attr?.label
                      )
                    }
                    actions={
                      attr?.is_edit ? (
                        <button onClick={() => handleSave(attr.id, attr.label)} className="bg-ui-bg-base border rounded px-3 py-1 text-sm">
                          Save
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-ui-fg-muted hover:text-ui-fg-base transition-colors"
                            onClick={() => {
                              setCategoryAttributes(
                                categoryAttributes.map((catAttribute) =>
                                  catAttribute.id === attr.id
                                    ? { ...attr, is_edit: true }
                                    : catAttribute
                                )
                              );
                            }}
                            title="Edit attribute"
                          >
                            <Pencil />
                          </button>
                          {/* Add Delete button */}
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
                )
              )}
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

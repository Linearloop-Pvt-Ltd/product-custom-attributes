import { Button, Drawer, Label } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { set, useForm } from "react-hook-form";
import { ProductCustomAttribute } from "../types";

type Attribute = {
  id: string;
  value: string;
};

interface EditCustomAttributesInterface {
  attributes: ProductCustomAttribute[] | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
  product_id?: string;
}

export const EditCustomAttributes = (props: EditCustomAttributesInterface) => {
  const {
    attributes: currentAttributes,
    open = false,
    setOpen,
    product_id,
  } = props;


  const [attributes, setAttributes] = useState<ProductCustomAttribute[]>(
    currentAttributes || []
  );
  const { register, handleSubmit, reset, watch } = useForm();

  useEffect(() => {
    setAttributes(currentAttributes || []);
    const defaultValues =
      currentAttributes &&
      currentAttributes.reduce((acc: any, attr: Attribute) => {
        acc[attr.id] = attr.value;
        return acc;
      }, {});
    reset(defaultValues); // sets the form with default values
  }, [currentAttributes]);

  const onSubmit = async (data: any) => {
    const formatted = Object.entries(data).map(([key, value]) => ({
      id: key,
      value: value,
    }));
    const response = await fetch(
      `/admin/product/${product_id}/custom-attributes`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_custom_attributes: formatted }),
      }
    );

    if (!response.ok) {
      console.error("Failed to update custom attributes");
      return;
    }
    setOpen(false);
    alert("Custom attributes updated successfully");
  };


  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Content>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <Drawer.Header>Update Custom Attributes</Drawer.Header>
          <Drawer.Body className="flex max-w-full flex-1 flex-col gap-y-8 overflow-y-auto">
            {attributes.map((attr: ProductCustomAttribute) => (
              <div key={`ca-${attr.id}`}>
                <Label size="small" weight="plus">
                  {attr?.category_custom_attribute?.label}
                </Label>
                <input
                  {...register(attr.id)}
                  className="border p-2 rounded w-full"
                  defaultValue={attr.value}
                />
              </div>
            ))}
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary">
                  Cancel
                </Button>
              </Drawer.Close>
              <Button size="small" type="submit">
                Save
              </Button>
            </div>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
};

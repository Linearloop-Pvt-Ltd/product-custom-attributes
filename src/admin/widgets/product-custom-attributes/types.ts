// export interface ProductCustomAttribute {
//   id: string;
//   product_id: string;
//   value: string;
//   category_custom_attribute_id: string;
//   category_custom_attribute: {
//     id: string;
//     key: string;
//     label: string;
//     category_id: string;
//     created_at: string;
//     updated_at: string;
//     deleted_at: null;
//   };
//   created_at: string;
//   updated_at: string;
//   deleted_at: null;
// }

// export interface CategoryCustomAttribute {
//   id: string;
//   key: string;
//   label: string;
//   category_id: string;
//   created_at: string;
//   updated_at: string;
//   deleted_at: null;
//   is_edit?: boolean;
//   is_deleted?: boolean;
// }

export interface ProductCustomAttribute {
  id: string;
  product_id: string;
  value: string;
  category_custom_attribute_id: string;
  category_custom_attribute: {
    id: string;
    key: string;
    label: string;
    category_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null; // Can be timestamp string or null
  };
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // Can be timestamp string or null
}

export interface CategoryCustomAttribute {
  id: string;
  key: string;
  label: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // Can be timestamp string or null
  is_edit?: boolean; // Keep for UI state management
  // Removed is_deleted since we're using deleted_at for soft deletion
}
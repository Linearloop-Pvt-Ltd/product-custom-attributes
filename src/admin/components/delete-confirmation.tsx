import { Prompt } from "@medusajs/ui";
import React from "react";

interface ConfirmationDialogProps {
  title?: string;
  description?: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "confirmation";
  children: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title = "Delete Record",
  description = "Are you sure? This cannot be undone",
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  children,
}) => {
  return (
    <Prompt variant={variant}>
      <Prompt.Trigger asChild>{children}</Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>{title}</Prompt.Title>
          <Prompt.Description>{description}</Prompt.Description>
        </Prompt.Header>
        <Prompt.Footer>
          <Prompt.Cancel>{cancelText}</Prompt.Cancel>
          <Prompt.Action onClick={onConfirm}>{confirmText}</Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
};

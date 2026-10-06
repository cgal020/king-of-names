"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmButtonProps = {
  label: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
};

// A button that asks before doing something that cannot be undone.
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  variant = "outline",
  className,
}: ConfirmButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant={variant} size="touch-lg" className={className} />}>
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="touch">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" size="touch" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

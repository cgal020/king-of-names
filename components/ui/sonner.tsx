"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      // Inverted (foreground on background), radius 14, 14px above the tab bar.
      position="bottom-center"
      offset={{ bottom: "calc(var(--tabbar-h) + 14px)" }}
      mobileOffset={{ bottom: "calc(var(--tabbar-h) + 14px)" }}
      duration={4000}
      style={
        {
          "--normal-bg": "var(--foreground)",
          "--normal-text": "var(--background)",
          "--normal-border": "transparent",
          "--border-radius": "14px",
          "--success-bg": "var(--foreground)",
          "--success-text": "var(--background)",
          "--error-bg": "var(--foreground)",
          "--error-text": "var(--background)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !text-[0.9375rem] !shadow-card",
          description: "!text-[color-mix(in_oklab,var(--background)_78%,var(--foreground))]",
          actionButton: "!bg-transparent !font-semibold !text-(--background) !underline !underline-offset-3",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

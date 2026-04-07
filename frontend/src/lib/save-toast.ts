import { toast } from "@/components/ui/sonner";

export const showSaveSignInToast = (sectionLabel: string) => {
  toast.info("Sign in required", {
    description: `Save ${sectionLabel.toLowerCase()} results to your account from Settings.`,
    duration: 4200,
  });
};

export const showSaveSuccessToast = (sectionLabel: string) => {
  toast.success("Saved to Settings", {
    description: `${sectionLabel} has been added to your saved library.`,
    duration: 3800,
  });
};

export const showSaveErrorToast = (sectionLabel: string) => {
  toast.error("Save not completed", {
    description: `We could not store ${sectionLabel.toLowerCase()} just now. Please try again.`,
    duration: 4200,
  });
};

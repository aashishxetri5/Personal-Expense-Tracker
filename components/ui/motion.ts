/**
 * Shared enter/exit animation classes for floating surfaces.
 * Keeps popovers, menus and dialogs moving identically.
 */
export const OVERLAY_MOTION =
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 " +
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 " +
  "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1";

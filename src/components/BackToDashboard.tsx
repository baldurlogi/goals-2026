import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

/**
 * Lightweight breadcrumb link back to the root dashboard.
 * Drop at the top of any tab or page that needs it.
 */
export function BackToDashboard() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <LayoutDashboard className="h-3 w-3" />
      Dashboard
    </Link>
  );
}
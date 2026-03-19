import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title: string;
  description: string;
  status?: "loading" | "error" | "empty";
  actionLabel?: string;
  onAction?: () => void;
  busy?: boolean;
};

const STATUS_ICON = {
  loading: Loader2,
  error: AlertCircle,
  empty: RefreshCw,
} as const;

export function ProfileStateCard({
  title,
  description,
  status = "loading",
  actionLabel,
  onAction,
  busy = false,
}: Props) {
  const Icon = STATUS_ICON[status];

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg rounded-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon className={status === "loading" ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        {actionLabel && onAction ? (
          <CardContent className="flex justify-center pt-0">
            <Button type="button" variant={status === "error" ? "default" : "outline"} onClick={onAction} disabled={busy}>
              {busy ? "Trying again…" : actionLabel}
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}

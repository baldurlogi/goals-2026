import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function MacroTargetsCard() {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">🥗 Macro targets</CardTitle>
          <Badge variant="secondary">Cut/Lean bulk</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Row label="Calories" value="2,450–2,650 kcal" />
        <Separator />
        <Row label="Protein" value="170–185 g" />
        <Row label="Carbs" value="230–260 g" />
        <Row label="Fats" value="60–70 g" />

        <div className="pt-2 text-xs text-muted-foreground">
          Protein first → then fill carbs/fats (matches your goal step notes).
        </div>
      </CardContent>
    </Card>
  );
}

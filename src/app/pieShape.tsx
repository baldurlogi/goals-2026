import { Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts";
import type { DonutDatum } from "@/app/hooks/useSpendingDashboard";

/**
 * Drop-in replacement for the deprecated <Cell> pattern.
 * Pass donutData so the shape fn can look up the color by name.
 */
export function makeShapeFn(donutData: DonutDatum[]) {
  return function ColoredSector(props: PieSectorShapeProps) {
    const entry = donutData.find((d) => d.name === (props as { name?: string }).name);
    return <Sector {...props} fill={entry?.color ?? "#94A3B8"} stroke="transparent" />;
  };
}
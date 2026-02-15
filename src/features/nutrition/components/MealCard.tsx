import type { Meal } from "../nutritionTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

export function MealCard({ title, meal }: { title: string; meal: Meal }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">{title}</CardTitle>
                <CardDescription className="text-xs">
                    {meal.macros.cal} kcal · {meal.macros.protein}g protein · {meal.macros.carbs}g carbs · {meal.macros.fat}g fat
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
                <Accordion type="single" collapsible>
                    <AccordionItem value="items">
                        <AccordionTrigger className="text-sm">{meal.name}</AccordionTrigger>
                        <AccordionContent>
                            <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                                {meal.items.map((x) => (
                                    <li key={x}>{x}</li>
                                ))}
                            </ul>

                            {(meal.when || meal.note) && <Separator className="my-3" />}

                            {meal.when && <div className="text-xs text-emerald-600 dark:text-emerald-400">💡 {meal.when}</div>}
                            {meal.note && <div className="mt-1 text-xs text-muted-foreground">{meal.note}</div>}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
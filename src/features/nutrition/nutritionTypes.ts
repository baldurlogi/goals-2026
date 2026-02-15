export type Macros = { cal: number; protein: number; carbs: number; fat: number };

export type Meal = {
    name: string;
    items: string[];
    macros: Macros;
    when?: string;
    note?: string;
};
import { useRef, useState } from "react";
import { useTodoDashboard } from "../hooks/useTodoDashboard";
import { addTodo, deleteTodo, toggleTodo } from "@/features/todos/todoStorage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckSquare, ChevronRight, Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { type Todo } from "@/features/todos/todoStorage"; // adjust path to where Todo type lives



export function TodoCard() {
    const { todos = [] } = useTodoDashboard();

    const total = todos.length;
    const doneCount = todos.filter((t) => t.done).length;

    const incomplete = todos.filter((t) => !t.done);
    const preview = incomplete.slice(0, 4);

    const hasMore = incomplete.length > preview.length;
    const extraCount = Math.max(0, incomplete.length - preview.length);

    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleAdd() {
        const text = input.trim();
        if (!text) return;
        await addTodo(text);
        setInput("");
        inputRef.current?.focus();
    }

    return (
        <Card className="relative overflow-hidden lg:col-span-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-500 via-blue-400 to-indigo-400" />

            <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="h-3.5 w-3.5 text-sky-500" />
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            To-do
                        </span>
                    </div>
                    {doneCount > 0 && (
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                            {doneCount}/{total} done
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-1 pb-4">
                {/* Item list */}
                {preview.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                        Nothing here - add something below.
                    </p>
                ) : (
                    <>
                        {preview.map((item: Todo) => (
                            <div
                                key={item.id}
                                className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/40"
                            >
                                <Checkbox
                                    checked={item.done}
                                    onCheckedChange={async () => { await toggleTodo(item.id); }}
                                    className="shrink-0"
                                />
                                <span className="flex-1 text-sm leading-snug">{item.text}</span>
                                <button
                                    type="button"
                                    onClick={async () => { await deleteTodo(item.id); }}
                                    className="invisible shrink-0 text-muted-foreground/40 hvoer:text-muted-foreground group-hover:visible"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}

                        {hasMore && (
                            <p className="pt-0.5 text-[10px] text-muted-foreground">
                                +{extraCount} more on the Todos page
                            </p>
                        )}
                    </>
                )}

                {/* Quick-add */}
                <div className="flex items-center gap-1.5 pt-2">
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder="Add a task..."
                        className="flex-1 rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={handleAdd}
                        disabled={!input.trim()}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Footer link */}
                <div className="flex justify-end pt-1">
                    <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <Link to="/todos">
                            See all <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
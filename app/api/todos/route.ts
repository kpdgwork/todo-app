import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export type Todo = {
  id: string; title: string; notes?: string; list: string; dueDate?: string;
  priority: "low" | "medium" | "high"; completed: boolean; assigneeId?: string; createdAt: string;
};

const dbPath = path.join(process.cwd(), "data", "todos.json");

async function readTodos(): Promise<Todo[]> {
  try { return JSON.parse(await fs.readFile(dbPath, "utf8")); }
  catch { return []; }
}
async function saveTodos(todos: Todo[]) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(todos, null, 2), "utf8");
}

export async function GET() {
  return NextResponse.json(await readTodos());
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "A title is required" }, { status: 400 });
  const todo: Todo = { id: crypto.randomUUID(), title: body.title.trim(), notes: body.notes?.trim() || "", list: body.list || "My tasks", dueDate: body.dueDate || "", priority: body.priority || "medium", completed: false, assigneeId: body.assigneeId || "", createdAt: new Date().toISOString() };
  const todos = await readTodos(); todos.unshift(todo); await saveTodos(todos);
  return NextResponse.json(todo, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const todos = await readTodos();
  const index = todos.findIndex((todo) => todo.id === body.id);
  if (index < 0) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  todos[index] = { ...todos[index], ...body, id: todos[index].id };
  await saveTodos(todos);
  return NextResponse.json(todos[index]);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const todos = await readTodos();
  await saveTodos(todos.filter((todo) => todo.id !== id));
  return new NextResponse(null, { status: 204 });
}

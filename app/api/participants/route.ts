import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const file = path.join(process.cwd(), "data", "participants.json");
    return NextResponse.json(JSON.parse(await fs.readFile(file, "utf8")));
  } catch {
    return NextResponse.json([]);
  }
}

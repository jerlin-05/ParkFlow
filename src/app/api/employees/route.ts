import "@/lib/init";
import { NextRequest, NextResponse } from "next/server";
import { state, addEmployee } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(state.employees);
}

export async function POST(req: NextRequest) {
  const { name, role, shift } = await req.json();
  if (!name || !role) return NextResponse.json({ error: "name and role are required." }, { status: 400 });
  const employee = addEmployee(name, role, shift);
  return NextResponse.json(employee, { status: 201 });
}

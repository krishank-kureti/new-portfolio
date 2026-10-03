import { NextResponse } from "next/server";
import { createContactMessage } from "@/lib/server/contact";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; email?: string; message?: string };
    if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    const message = await createContactMessage({ name: body.name, email: body.email, message: body.message });
    return NextResponse.json({ id: message.id }, { status: 201 });
  } catch (error) {
    console.error("Contact submission failed", error);
    return NextResponse.json({ error: "Unable to save message." }, { status: 500 });
  }
}

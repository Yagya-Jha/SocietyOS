import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, invite_code, flat_number, phone, role } = await req.json();

    if (!email || !password || !invite_code) {
      return NextResponse.json(
        { error: "Email, password, and invite code are required" },
        { status: 400 }
      );
    }

    const society = await prisma.society.findUnique({
      where: { invite_code },
    });

    if (!society) {
      return NextResponse.json(
        { error: "Invalid society invite code" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        society_id: society.id,
        flat_number,
        phone,
        role: role === "admin" ? "admin" : "resident",
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

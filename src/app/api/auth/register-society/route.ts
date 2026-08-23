import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const { society_name, society_address, admin_name, admin_email, admin_password, admin_phone } = await req.json();

    if (!society_name || !admin_email || !admin_password) {
      return NextResponse.json(
        { error: "Society name, Admin email, and Password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: admin_email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this admin email already exists" },
        { status: 400 }
      );
    }

    // Generate unique invite code
    let invite_code = generateInviteCode();
    while (await prisma.society.findUnique({ where: { invite_code } })) {
      invite_code = generateInviteCode();
    }

    const hashedPassword = await bcrypt.hash(admin_password, 10);

    // Create society and admin in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const society = await tx.society.create({
        data: {
          name: society_name,
          address: society_address,
          invite_code,
        },
      });

      const admin = await tx.user.create({
        data: {
          name: admin_name,
          email: admin_email,
          password_hash: hashedPassword,
          phone: admin_phone,
          role: "admin",
          society_id: society.id,
        },
      });

      return { society, admin };
    });

    return NextResponse.json(
      { 
        message: "Society and admin created successfully", 
        societyId: result.society.id,
        inviteCode: result.society.invite_code 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Society registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

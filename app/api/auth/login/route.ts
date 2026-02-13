import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Support both email and username login
    const loginIdentifier = validatedData.email.includes("@")
      ? validatedData.email
      : validatedData.email;

    const result = await loginUser(loginIdentifier, validatedData.password);

    if (!result) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("session", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error: any) {
    console.error("Login error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "البيانات المدخلة غير صحيحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول", details: error.message },
      { status: 500 }
    );
  }
}

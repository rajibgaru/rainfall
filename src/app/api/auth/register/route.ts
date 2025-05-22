// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    // Extract all fields including phone
    const { name, email, phone, password } = await request.json();
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Validate phone number (basic validation)
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: "Please provide a valid phone number" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 10);
    
    // Create new user with phone number
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone, // Add phone to user data
        password: hashedPassword,
        role: "USER"
      }
    });
    
    // Return success response
    return NextResponse.json(
      { 
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
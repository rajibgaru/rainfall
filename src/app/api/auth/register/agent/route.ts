// src/app/api/auth/register/agent/route.ts
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Extract all required fields
    const { 
      name, 
      email, 
      phone, 
      password,
      companyName,
      licenseNumber,
      licenseState,
      businessAddress,
      businessPhone,
      website,
      bio
    } = data;
    
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
    
    // Validate required fields
    if (!name || !email || !phone || !password || !companyName || 
        !licenseNumber || !licenseState || !businessAddress || 
        !businessPhone) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 10);
    
    // Create new agent user (initially verified to simplify the process)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "AGENT",
        companyName,
        licenseNumber,
        licenseState,
        businessAddress,
        businessPhone,
        website: website || null,
        bio: bio || null,
        isVerified: true // Auto-verify agents for simplicity
      }
    });
    
    // Return success response
    return NextResponse.json(
      { 
        message: "Agent registration successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    );
  } catch (error) {
    console.error("Agent registration error:", error);
    
    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}
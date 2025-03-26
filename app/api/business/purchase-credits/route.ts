import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { plan } = await request.json()

    if (!plan) {
      return NextResponse.json({ success: false, message: "Plan is required" }, { status: 400 })
    }

    let amount = 0
    let credits = 0

    switch (plan) {
      case "small":
        amount = 17900 // €179.00
        credits = 20
        break
      case "medium":
        amount = 39900 // €399.00
        credits = 50
        break
      case "large":
        amount = 69900 // €699.00
        credits = 100
        break
      default:
        return NextResponse.json({ success: false, message: "Invalid plan" }, { status: 400 })
    }

    // In a real app, you would:
    // 1. Create a Stripe checkout session
    // 2. Return the session URL to the client

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Return a success response with a mock checkout URL
    return NextResponse.json({
      success: true,
      checkoutUrl: `/checkout?session=mock_session_${Math.random().toString(36).substring(2, 15)}`,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 })
  }
}


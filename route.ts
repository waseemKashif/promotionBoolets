import { type NextRequest, NextResponse } from "next/server"

const ANSAR_API_URL = "https://www.ansargallery.com/en/rest/V1/ahmarket-recommendation/buywith-and-recom-product/25249"
const BEARER_TOKEN = "hmgp2e5zrtmlbikvrfl2h4d9s0z5309h"
const GLOBAL_ZONE = "1" // You may need to adjust this value

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(ANSAR_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BEARER_TOKEN}`,
        zoneNumber: GLOBAL_ZONE,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  } catch (error) {
    console.error("Error fetching products from Ansar Gallery:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

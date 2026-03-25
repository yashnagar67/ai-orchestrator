import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const {nodes,edges} = await request.json();
    console.log("Received workflow:", body);
    const targetIds=new Set(edges.map())
    return NextResponse.json({ success: true, message: "Workflow received" }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ success: false, error: "Failed to parse request" }, { status: 400 });
  }
}


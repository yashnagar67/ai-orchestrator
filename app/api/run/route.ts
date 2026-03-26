import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const {nodes,edges} = await request.json();
  
    const targetIds=new Set(edges.map((edge : any)=>edge.target));
    const startNodes=nodes.filter((node :any)=>!targetIds.has(node.id))
    if(startNodes.length==0){
      console.log("No starting Node Found did your create infinte loop?")
      return NextResponse.json({error:"No starting Node Found did your create infinte loop?"},{status:400})
    }
    console.log("-----------------------------------");
    console.log(`🚀 Pipeline Triggered! Found ${startNodes.length} starting point(s).`);
    for(const node of startNodes){
      console.log(`Starting Agent: ${node.data.label}`);
      await new Promise((resolve)=>setTimeout(resolve,2000))
      console.log(`Agent ${node.data.label} Completed`);

    }
    console.log("-----------------------------------");

    return NextResponse.json({ success: true, message: "Pipeline run completed." });
  
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ success: false, error: "Failed to parse graph" }, { status: 400 });
  }
}


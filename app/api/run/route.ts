import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
const Ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });





export async function POST(request: Request) {
  try {
    const { nodes, edges } = await request.json();

    const targetIds = new Set(edges.map((edge: any) => edge.target));
    const startNodes = nodes.filter((node: any) => !targetIds.has(node.id))
    if (startNodes.length == 0) {
      console.log("No starting Node Found did your create infinte loop?")
      return NextResponse.json({ error: "No starting Node Found did your create infinte loop?" }, { status: 400 })
    }
    let accumulatedContext = ""; // This is the memory passed down the wire
    let currentNode = startNodes;
    const finalResults = [];
    console.log("-----------------------------------");
    console.log(`🚀 Pipeline Triggered! Found ${startNodes.length} starting point(s).`);
    for (const node of startNodes) {
      currentNode = node;
      console.log(`Starting Agent: ${node.data.label}`);


      const nextEdge = edges.filter((e: any) => e.source == node.id)
      console.log(edges);

      const prompt = `You are acting as a ${currentNode.data.label}. 
        your prompt is ${currentNode.data.prompt}
       context from previous agents: "${accumulatedContext}".
      If the context is empty,means you are first Agent node
      Keep your response under 50 words.`;

      const response = await Ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      })
      const aiOutput = await response.text;
      accumulatedContext += `\n-${node.data.label}:\n${aiOutput}`;




      // for (const edge of nextEdge) {
      //   const nextNode = nodes.find((n: any) => n.id == edge.target)
      //   currentNode = nextNode
      //   console.log("here is prompt")
      //   const response = await Ai.models.generateContent({
      //     model: "gemini-2.5-flash",
      //     contents: prompt,
      //   });
      //   const aiOutput = await response.text;

      // }
      finalResults.push({
        nodeId: currentNode.id,
        label: currentNode.data.label,
        output: aiOutput,
      })



    }

    console.log("-----------------------------------");

    return NextResponse.json({ success: true, message: "Pipeline run completed.", finalResults });

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ success: false, error: "Failed to parse graph" }, { status: 400 });
  }
}


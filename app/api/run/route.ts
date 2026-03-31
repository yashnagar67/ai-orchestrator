import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Resend } from 'resend';
// import { WelcomeEmail } from '@/components/emails/WelcomeEmail';
const resend=new Resend(process.env.RESEND_API_KEY);

const Ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const getPrompt=(node:any,accumulatedContext:string) : string=>{
  if(node.data.label=="🤖 Research Agent"){
    return `You are acting as a Research Agent. 
        Task Given by the user  ${node.data.prompt}
       context from previous agents: "${accumulatedContext}".
      If the context is empty,means you are first Agent node
      Keep your response under 50 words.`;
}else if(node.data.label=="Writer Agent"){
  return `You are acting as a Writer Agent. 
        Task Given by the user  ${node.data.prompt}
       context from previous agents: "${accumulatedContext}".
      
      Keep your response under 50 words.`;
  
}else{
  return `You are acting as a ${node.data.label}. 
        Task Given by the user  ${node.data.prompt}
       context from previous agents: "${accumulatedContext}".
      
      Keep your response under 50 words.`;
}
}

const execution_plan=(node:any, edges:any)=>{
  const executionPlan=[]
  const liner=[]
// for(const n of node){
  
//   // console.log("dependencies of ",n.data.label,n.dependencies)
// }
node.forEach((n:any)=>{
  n.count=(edges.filter((e:any)=>e.target==n.id).map((e:any)=>e.source)).length
  console.log("this is count",n.count)
})

for(let i=0;i<3;i++){
  const staterNode=node.filter((n:any)=>n.count==0)
  executionPlan.push(staterNode.map((n:any)=>n.id))
  node=node.filter((n:any)=>!staterNode.includes(n.id))
  console.log("this is node list after removing stater node",node)
  for(const s of staterNode){
    const pointer=edges.filter((e:any)=>e.source==s.id).map((e:any)=>e.target).map((e:any)=>node.find((n:any)=>n.id==e))
    if(pointer.length>0){
      pointer.forEach((p:any)=>{
       p.count-=1
      })
    }
    
  }
  
  

  
}
  

// for(let i=0;i<3;i++){
// const staterNode=node.filter((n:any)=>n.count==0)
// node= node.filter((n:any)=>!staterNode.includes(n.id))
// console.log('THis is starter Node',staterNode)
// executionPlan.push(staterNode)
// for(const s of staterNode){
//   const pointer= edges.filter((e:any)=>e.source==s.id).map((e:any)=>e.target)
//   if(pointer.length>0){
//     pointer.forEach((p:any)=>{
//       p.count=p.count-1;
      
      
//     })
    
//   }
  
// }
// }

console.log("this is execution Plan",executionPlan)


  
}



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
    let nextEdge=[];
     execution_plan(nodes,edges)
    for (const node of startNodes) {
      currentNode = node;
      console.log(`Starting Agent: ${node.data.label}`);


       nextEdge = edges.filter((e: any) => e.source == node.id)
      // console.log(edges);


      const prompt = `You are acting as a ${currentNode.data.label}. 
        your prompt is ${currentNode.data.prompt}
       context from previous agents: "${accumulatedContext}".
      If the context is empty,means you are first Agent node
      Keep your response under 50 words.`;
      const groundingtool={
        googleSearch: {}
      }

      // const response = await Ai.models.generateContent({
      //   model: "gemini-2.5-flash",
      //   contents: getPrompt(currentNode,accumulatedContext),
      //   config:{
      //     tools:[groundingtool]
      //   }
      // })
      // const aiOutput = await response.text;
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      const aiOutput = `[Garbage Data] Simulated response for ${currentNode.data.label}`;
      accumulatedContext += `\n-${node.data.label}:\n${aiOutput}`;

// ok now , uncomment the ai call, now i wanna see how it working


      for (const edge of nextEdge) {
        const nextNode = nodes.find((n: any) => n.id == edge.target)
        currentNode = nextNode
        console.log("here is prompt")
        // const response = await Ai.models.generateContent({
        //   model: "gemini-2.5-flash",
        //   contents: getPrompt(currentNode,accumulatedContext),
        // });
        // const aiOutput = await response.text;

        await new Promise(resolve => setTimeout(resolve, 2000));
        const aiOutput = `[Garbage Data] Simulated response for ${currentNode.data.label}`;
         nextEdge=edges.filter((e: any) => e.source == currentNode.id)

      }
      for(const edge of nextEdge){

        currentNode=nodes.find((n: any) => n.id == edge.target)
       
      //   const {data, error}=await resend.emails.send({
      //     from: 'onboarding@resend.dev',
      //     to: 'nagary811@gmail.com',
      //     subject: 'AI Orchestrator Workflow',
      //     html:`<h1>${aiOutput}</h1>`


      //   })
      //   if(error){
      //     console.log("Error sending email",error)
      //   }
      //   else{
      //     console.log("Email sent successfully",data)
      //   }
        
          
        
      //   console.log("This is our current node",currentNode.data.label)
        
      }
      
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


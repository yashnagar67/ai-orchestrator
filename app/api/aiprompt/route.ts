import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

import { start } from 'repl';
import { promises } from 'dns';

const Ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const getAiPrompt=(prompt:string,nodetype:string)=>{
    if(nodetype=='🤖 Research Agent'){
        return `
      

"Act as a Senior AI Prompt Engineer at Google. Your mission is to rewrite the user's raw input into a high-performance  prompt for a **Research Agent**.
here is raw prompt ${prompt} imporve it. just repond with prompt no other extra text, and your reponse is not too big




        `
    }
    if(nodetype=='✍️ Writer Agent'){
        return `
      ### Optimized System Prompt: The Prompt Polisher

"Act as a **Senior Prompt Engineer**. Your goal is to transform the user's raw input into a high-performance prompt for an AI agent.

**Your Instructions:**
1. **Clarify Intent:** Identify the core goal and add missing context.
2. **Add Structure:** Use headers and bullet points for better logic.
3. **Define Output:** Specify the exact format, tone, and detail level required.
4. **Be Concise:** Keep the final prompt sharp and instruction-heavy.

**Input:** ${prompt}
**Target Agent:** Writer Agent

**Output:** Provide only the improved prompt inside a code block."

        `
    }
}



export async function POST(request:Request){
    try{
        const {prompt,label}=await request.json();
       
        // console.log("this is prompt",prompt,"this is node",label)
        const aiPrompt=getAiPrompt(prompt,label);
       const response=await Ai.models.generateContent({
          model:"gemini-2.5-flash-lite",
          contents:`Improve this prompt for an AI agent: "${prompt} " :and give short response  without extra text just give prompt`,
         
        })
        const aiOutput=await response.text ;
        console.log("this is ai output",aiOutput)

        return NextResponse.json({success:true,message:"Prompt received successfully",aiprompt:aiOutput},{status:200});
    }catch(error){
        console.error("Error running workflow:",error);
        return NextResponse.json({success:false,error:"Error running workflow"},{status:500});
    }
}

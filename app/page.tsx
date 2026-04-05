"use client";

import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';


const initialNodes = [
  { id: '1', position: { x: 250, y: 100 }, data: { label: '🤖 Research Agent', prompt: '',example:"E.g., Make a research on protein folding..." } }
];
const initialEdges: Edge[] = [];

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [loading, setLoading] = useState(false);
  const [aioutput, setAIOuput] = useState<{ agent: string, output: string }[] | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const updateNodePrompt = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newPrompt = e.target.value;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return { ...node, data: { ...node.data, prompt: newPrompt } };
        }
        return node;
      })
    );
  };
  const saveWorkflow = async () => {
    const currentworkflow = {
      title: "My first workflow",
      nodes: nodes,
      edges: edges,

    };
    const { data, error } = await supabase.from("workflows").insert([currentworkflow]);
    if (error) {
      console.error("Error saving workflow:", error);
    } else {
      console.log("Saved Successfully", data);
      alert("Workflow saved successfully!",);
    }
  }

 const aiprompt=async(nodemon:any)=>{
  try{
    console.log("Ai button is clicked")
  const response=await fetch('/api/aiprompt',{
    method:"POST",
    body:JSON.stringify({prompt:nodemon.data.prompt,label:nodemon.data.label}),
    headers:{
      "Content-Type":"application/json",
    },
  })

   const data=await response.json();
   console.log("Response from backend", data.aiprompt);
   if(data.success){
    setNodes((nds)=>nds.map((n)=>n.id===nodemon.id?{...n,data:{...n.data,prompt:data.aiprompt||n.data.prompt}}:{...n}))
      
   }
}catch(error){
  console.error("Error running workflow:", error);
}
 }

  const sendtobackend = async () => {
    const workflow = { nodes, edges };
    setLoading(true);
    setAIOuput(null);
    try {
      const response = await fetch("api/run", {
        method: "POST",
        body: JSON.stringify(workflow),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        setAIOuput(data.finalResults.map((res: any) => ({ agent: res.label, output: res.output })));
      }
      console.log("Response from backend", data);
    } catch (error) {
      console.error("Error running workflow:", error);
    } finally {
      setLoading(false);
    }

  }
  useEffect(() => {
    const fetchworkflow = async () => {
      const { data, error } = await supabase.from('workflows').select("*").order('created_at', { ascending: false }).limit(1).single();
      if (error) {
        console.log("Error fetching workflow:", error);
      } else {
        console.log("Fetched Successfully", data);
        setNodes(data.nodes);
        setEdges(data.edges);
      }
    }
    fetchworkflow();
  }, [])

  // NEW: Function to add a new agent dynamically
  const addNewAgent = (agentType: string,example:string) => {
    const newNode = {
      id: Date.now().toString(),
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: agentType, prompt: '',example:example },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>

      {/* NEW: The Sidebar UI */}
      <div className="w-64 bg-gray-50 p-4 border-r border-gray-200 flex flex-col gap-4 z-10 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800">Agent Library</h2>
        <p className="text-sm text-gray-500 mb-4">Click to add to canvas</p>

        <button
          onClick={() => addNewAgent('🤖 Research Agent','E.g., Make a research on protein folding...')}
          className="bg-white p-3 border border-gray-200 rounded-md shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all text-left font-medium text-gray-700"
        >
          + Research Agent
        </button>

        <button
          onClick={() => addNewAgent('✍️ Writer Agent','E.g. Write a short story about a robot....')}
          className="bg-white p-3 border border-gray-200 rounded-md shadow-sm hover:bg-green-50 hover:border-green-300 transition-all text-left font-medium text-gray-700"
        >
          + Writer Agent
        </button>
        <button
          onClick={() => addNewAgent('📧 Email Agent','E.g. Write a short story about a robot....')}
          className="bg-white p-3 border border-gray-200 rounded-md shadow-sm hover:bg-green-50 hover:border-green-300 transition-all text-left font-medium text-gray-700"
        >
          + Email Agent
        </button>
        <button
          onClick={() => addNewAgent('🔗 Webhook Agent','E.g. https://api.mywebhook.com/endpoint')}
          className="bg-white p-3 border border-gray-200 rounded-md shadow-sm hover:bg-yellow-50 hover:border-yellow-300 transition-all text-left font-medium text-gray-700"
        >
          + Webhook Agent
        </button>
        <button
          onClick={saveWorkflow}
          className="mt-auto bg-black text-white p-3 rounded-md shadow-md hover:bg-gray-800 active:bg-gray-700 active:scale-95 transition-all duration-150 font-bold"
        >
          💾 Save Workflow
        </button>
        <button
          onClick={sendtobackend}
          className="mt-auto bg-green-500 text-white p-3 rounded-md shadow-md hover:bg-green-600 active:bg-green-700 active:scale-95 transition-all duration-150 font-bold"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (

            "▶️ Run Pipline"
          )}
        </button>

      </div>

      {/* The Canvas Area */}
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {/* AI Output Panel */}
        {aioutput && aioutput.length > 0 && (
          <div className="absolute top-4 right-4 w-96 max-h-[80vh] overflow-y-auto bg-white p-6 rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800">Pipeline Results</h2>
              <button onClick={() => setAIOuput(null)} className="text-gray-400 hover:text-red-500 transition-colors">✖</button>
            </div>
            {aioutput.map((result, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-2">
                <span className="font-semibold text-blue-600 text-sm border-b border-blue-100 pb-1">{result.agent}</span>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{result.output}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* The Right Sidebar */}
      {selectedNodeId && (
        <div className="w-80 bg-white p-6 border-l border-gray-200 flex flex-col gap-6 shadow-2xl z-20 overflow-y-auto">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Agent Details</h2>
            <button onClick={() => setSelectedNodeId(null)} className="text-gray-400 hover:text-red-500 transition-colors">✖</button>
          </div>
          
          {(() => {
            const selectedNode = nodes.find(n => n.id === selectedNodeId);
            if (!selectedNode) return null;
            return (
              <>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                  <span className="font-semibold text-blue-800 text-xs uppercase tracking-wider block mb-1">Agent Type</span>
                  <span className="text-sm font-medium text-blue-900">{selectedNode.data.label as React.ReactNode}</span>
                </div>
                {selectedNode.data.label === "📧 Email Agent" ? (
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="font-semibold text-gray-700 text-sm">Recipient Email</label>
                    <input 
                      type="email"
                      className="w-full text-sm p-4 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black transition-all"
                      placeholder="e.g., user@example.com"
                      value={selectedNode.data.prompt as string || ''}
                      onChange={updateNodePrompt}
                    />
                    <p className="text-xs text-gray-500 leading-relaxed">This email address will receive the final output from the pipeline.</p>
                  </div>
                ) : selectedNode.data.label === "🔗 Webhook Agent" ? (
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="font-semibold text-gray-700 text-sm">Target URL</label>
                    <input 
                      type="url"
                      className="w-full text-sm p-4 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black transition-all"
                      placeholder="e.g., https://my-webhook.com/api"
                      value={selectedNode.data.prompt as string || ''}
                      onChange={updateNodePrompt}
                    />
                    <p className="text-xs text-gray-500 leading-relaxed">This URL will be called with the pipeline result data payload.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="font-semibold text-gray-700 text-sm">Task Prompt</label>
                    <div className="relative flex-1 flex">
                      <textarea 
                        className="w-full h-full min-h-[200px] text-sm p-4 pb-12 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-black transition-all"
                        placeholder={selectedNode.data.example as string || 'Enter your prompt here'}
                        value={selectedNode.data.prompt as string || ''}
                        onChange={updateNodePrompt}
                      />
                      <button 
                        className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-md text-white hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer pointer-events-auto"
                        title="Improve prompt with AI"
                        onClick={()=>aiprompt(selectedNode)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2ZM15.36 11.83C15.93 11.96 16.51 12.06 17.07 12.18C17.65 12.31 17.66 12.83 17.08 12.96C15.82 13.25 14.56 13.34 13.31 13.78C12.39 14.1 11.99 14.49 11.66 15.42C11.19 16.73 11.08 18.06 10.76 19.39C10.63 19.98 10.11 20 9.98 19.41C9.65 17.86 9.49 16.3 8.87 14.86C8.36 13.68 7.57 12.92 6.3 12.55C5.16 12.21 4.02 11.93 2.87 11.61C2.33 11.45 2.33 10.95 2.85 10.82C4.1 10.51 5.37 10.42 6.63 9.94C7.57 9.58 8 9.17 8.35 8.21C8.83 6.89 8.95 5.54 9.28 4.2C9.42 3.59 9.92 3.6 10.05 4.21C10.39 5.75 10.56 7.31 11.18 8.75C11.69 9.94 12.48 10.69 13.75 11.07C14.28 11.23 14.82 11.39 15.36 11.55V11.83Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">This prompt is attached to the agent and will be sent to the backend during execution.</p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
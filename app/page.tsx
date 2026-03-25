"use client";

import React, { useCallback,useEffect } from 'react';
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
  { id: '1', position: { x: 250, y: 100 }, data: { label: '🤖 Research Agent' } }
];
const initialEdges: Edge[] = [];

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );
  const saveWorkflow=async()=>{
    const currentworkflow={
      title:"My first workflow",
      nodes:nodes,
      edges:edges,

    };
    const {data,error}=await supabase.from("workflows").insert([currentworkflow]);
    if(error){
      console.error("Error saving workflow:",error);
    }else{
      console.log("Saved Successfully",data);
      alert("Workflow saved successfully!",);
    }
  }
  const sendtobackend=async()=>{
    const workflow={nodes,edges};
    const response=await fetch("api/run",{
      method:"POST",
      body:JSON.stringify(workflow),
      headers:{
        "Content-Type":"application/json",
      },
    });
    const data=await response.json();
    console.log("Response from backend",data);

  }
  useEffect(()=>{
    const fetchworkflow=async()=>{
      const {data ,error}=await supabase.from('workflows').select("*").order('created_at', { ascending: false }).limit(1).single();
      if(error){
        console.log("Error fetching workflow:",error);
      }else{
        console.log("Fetched Successfully",data);
        setNodes(data.nodes);
        setEdges(data.edges);
      }
    }
    fetchworkflow();
  },[])

  // NEW: Function to add a new agent dynamically
  const addNewAgent = (agentType: string) => {
    const newNode = {
      id: Date.now().toString(), 
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 }, 
      data: { label: agentType },
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
          onClick={() => addNewAgent('🤖 Research Agent')}
          className="bg-white p-3 border border-gray-200 rounded-md shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all text-left font-medium text-gray-700"
        >
          + Research Agent
        </button>
        
        <button 
          onClick={() => addNewAgent('✍️ Writer Agent')}
          className="bg-white p-3 border border-gray-200 rounded-md shadow-sm hover:bg-green-50 hover:border-green-300 transition-all text-left font-medium text-gray-700"
        >
          + Writer Agent
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
    ▶️ Run Pipline
  </button>

      </div>

      {/* The Canvas Area */}
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
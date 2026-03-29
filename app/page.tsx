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

  const updateNodePrompt = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
                
                <div className="flex flex-col gap-2 flex-1">
                  <label className="font-semibold text-gray-700 text-sm">Task Prompt</label>
                  <textarea 
                    className="w-full flex-1 min-h-[200px] text-sm p-4 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-black transition-all"
                    placeholder={selectedNode.data.example as string || 'Enter your prompt here'}
                    value={selectedNode.data.prompt as string || ''}
                    onChange={updateNodePrompt}
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">This prompt is attached to the agent and will be sent to the backend during execution.</p>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
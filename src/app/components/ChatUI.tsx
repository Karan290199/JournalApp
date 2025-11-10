"use client";

import { useChat } from "@/hooks/useChat";
import ChatMessage from "./ChatMessage";

export default function ChatUI() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="flex flex-col h-screen max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🧠 My Journal</h1>

      <div className="flex-1 overflow-y-auto border rounded-lg bg-white p-4 shadow-sm">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Start a conversation with your journal assistant...
          </div>
        )}
        {messages.map((m) => (
          <ChatMessage 
            key={m.id} 
            role={m.role as "user" | "assistant"} 
            content={m.content} 
          />
        ))}
        {isLoading && (
          <div className="text-left my-2">
            <div className="inline-block p-2 rounded bg-gray-200">
              Thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="text-left my-2">
            <div className="inline-block p-2 rounded bg-red-100 text-red-800 text-sm">
              Error: {error.message}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex mt-4">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Write something..."
          className="flex-1 border p-3 rounded-l-lg outline-none"
          disabled={isLoading}
        />
        <button 
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded-r-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}

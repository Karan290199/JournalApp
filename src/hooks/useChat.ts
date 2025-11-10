"use client";

import { useState, useCallback, useRef } from "react";

interface UseChatOptions {
  api?: string;
  id?: string;
  initialMessages?: any[];
  onResponse?: (response: Response) => void;
  onFinish?: (message: any) => void;
  onError?: (error: Error) => void;
}

interface UseChatHelpers {
  messages: any[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: Error | undefined;
  reload: () => void;
  stop: () => void;
  setMessages: (messages: any[]) => void;
  setInput: (input: string) => void;
}

export function useChat(options: UseChatOptions = {}): UseChatHelpers {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>(options.initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageIdCounterRef = useRef(0);
  const apiEndpoint = options.api || "/api/chat";

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    messageIdCounterRef.current += 1;
    return `${Date.now()}-${messageIdCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage = { 
        id: generateMessageId(),
        role: "user" as const, 
        content: input.trim() 
      };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);
      setError(undefined);

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        const cleanText = responseText.trim();

        const assistantMessage = {
          id: generateMessageId(),
          role: "assistant" as const,
          content: cleanText || "I'm sorry, I couldn't find anything to share right now.",
        };

        setMessages((prev) => [...prev, assistantMessage]);

        console.log("Received assistant response:", cleanText);
      } catch (err: any) {
        if (err.name === "AbortError") {
          return; // Request was aborted, don't set error
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, messages, isLoading, apiEndpoint, generateMessageId]
  );

  const reload = useCallback(() => {
    // Regenerate the last assistant message
    // This would need to be implemented
  }, []);

  const setInputValue = useCallback((value: string) => {
    setInput(value);
  }, []);

  return {
    messages: messages.map((m, index) => ({
      id: m.id || `msg-${index}-${Date.now()}`,
      role: m.role,
      content: typeof m.content === "string" ? m.content : (m.content ? JSON.stringify(m.content) : ""),
    })),
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
    setInput: setInputValue,
  };
}


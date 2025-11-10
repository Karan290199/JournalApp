declare module 'ai/react' {
  export interface UseChatOptions {
    api?: string;
    id?: string;
    initialMessages?: any[];
    onResponse?: (response: Response) => void;
    onFinish?: (message: any) => void;
    onError?: (error: Error) => void;
  }

  export interface UseChatHelpers {
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

  export function useChat(options?: UseChatOptions): UseChatHelpers;
}


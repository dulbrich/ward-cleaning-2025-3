export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

type SearchParamsMessage = {
  type?: string;
  message?: string;
};

// Type guard functions
function isSuccessMessage(msg: any): msg is { success: string } {
  return msg && typeof msg.success === 'string';
}

function isErrorMessage(msg: any): msg is { error: string } {
  return msg && typeof msg.error === 'string';
}

function isTextMessage(msg: any): msg is { message: string } {
  return msg && typeof msg.message === 'string' && !('type' in msg);
}

function isSearchParamsMessage(msg: any): msg is SearchParamsMessage {
  return msg && 'type' in msg && 'message' in msg;
}

export function FormMessage({ message }: { message: Message | SearchParamsMessage | null }) {
  // If message is null, return nothing
  if (!message) {
    return null;
  }
  
  // Handle searchParams object by converting it to Message type
  if (isSearchParamsMessage(message)) {
    const type = message.type;
    const content = message.message;
    
    if (!content) return null;
    
    if (type === 'success') {
      return (
        <div className="flex flex-col gap-2 w-full max-w-md text-sm">
          <div className="text-foreground border-l-2 border-foreground px-4">
            {content}
          </div>
        </div>
      );
    } else if (type === 'error') {
      return (
        <div className="flex flex-col gap-2 w-full max-w-md text-sm">
          <div className="text-destructive-foreground border-l-2 border-destructive-foreground px-4">
            {content}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col gap-2 w-full max-w-md text-sm">
          <div className="text-foreground border-l-2 px-4">{content}</div>
        </div>
      );
    }
  }
  
  // Handle regular Message type
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {isSuccessMessage(message) && (
        <div className="text-foreground border-l-2 border-foreground px-4">
          {message.success}
        </div>
      )}
      {isErrorMessage(message) && (
        <div className="text-destructive-foreground border-l-2 border-destructive-foreground px-4">
          {message.error}
        </div>
      )}
      {isTextMessage(message) && (
        <div className="text-foreground border-l-2 px-4">{message.message}</div>
      )}
    </div>
  );
}

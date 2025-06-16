import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function ChatMessageLoading() {
  return (
    <div className="mb-4 flex justify-start">
      <div className="mr-2 flex-shrink-0">
        <Avatar className="h-8 w-8 border border-zinc-800">
          <AvatarFallback className="bg-zinc-800 text-zinc-400">
            AI
          </AvatarFallback>
          <AvatarImage src="" alt="AI" />
        </Avatar>
      </div>
      <div className="flex max-w-[80%] flex-col items-start">
        <div className="rounded-xl rounded-bl-sm bg-zinc-800 px-4 py-3 text-white">
          <div className="flex items-center">
            <div className="flex space-x-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 delay-75"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 delay-150"></div>
            </div>
            <span className="ml-2 text-xs text-zinc-400">
              AI is thinking...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

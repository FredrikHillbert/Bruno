import { memo, useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2, Send } from "lucide-react";

export const ChatInput = memo(
  ({
    input,
    handleInputChange,
    handleSubmit,
    status,
    disabled,
  }: {
    input: string;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    status: string;
    disabled?: boolean;
  }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle textarea changes
    const handleTextareaChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const textarea = e.target;

      // Optimize resizing by doing it directly in the DOM
      requestAnimationFrame(() => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      });

      // Pass to parent's handleInputChange
      handleInputChange(e);
    };

    // Handle form submission
    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (isSubmitting) return;

      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      setIsSubmitting(true);

      // Blur to prevent additional keyboard events
      if (textareaRef.current) {
        textareaRef.current.blur();
      }

      // Submit the form
      handleSubmit(e);
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    // Reset submitting state when status changes
    useEffect(() => {
      if (status !== "submitting") {
        setIsSubmitting(false);
      }
    }, [status]);

    return (
      <form onSubmit={handleFormSubmit} ref={formRef} className="relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className={`min-h-[60px] w-full resize-none pr-12 bg-zinc-900 border-zinc-700 
            placeholder:text-zinc-500 text-white focus-visible:ring-green-800
            transition-opacity ${isSubmitting ? "opacity-50" : "opacity-100"}`}
          disabled={status === "submitted" || isSubmitting || disabled}
        />
        <Button
          type="submit"
          size="icon"
          disabled={
            status === "submitted" || isSubmitting || !input.trim() || disabled
          }
          className="absolute bottom-2 right-2 rounded-full bg-green-700 hover:bg-green-600 text-white"
        >
          {status === "submitted" || isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    );
  }
);

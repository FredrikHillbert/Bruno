import { memo, useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import type { ChatRequestOptions } from "ai";

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
    handleSubmit: (
      event?: {
        preventDefault?: () => void;
      },
      chatRequestOptions?: ChatRequestOptions
    ) => void;
    status: string;
    disabled?: boolean;
  }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<FileList | null>(null);

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
      if (trimmedInput.length === 0 && (!files || files.length === 0)) return;

      setIsSubmitting(true);

      // Blur to prevent additional keyboard events
      if (textareaRef.current) {
        textareaRef.current.blur();
      }

      // Submit the form
      handleSubmit(e, {
        experimental_attachments: files || undefined,
      });
      setFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setFiles(e.target.files);
      } else {
        setFiles(null);
      }
    };

    const handleRemoveFile = () => {
      setFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        {/* File preview */}
        {files && files.length > 0 && (
          <div className="p-3 border-t border-zinc-700 bg-zinc-900">
            <div className="relative w-fit">
              {Array.from(files).map((file, index) => (
                <div key={index} className="relative w-fit inline-block mr-2">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-20 w-20 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-20 w-20 flex items-center justify-center bg-zinc-800 rounded-md">
                      <span className="text-xs text-white overflow-hidden text-ellipsis whitespace-nowrap max-w-full px-2">
                        {file.name}
                      </span>
                    </div>
                  )}
                  {index === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="absolute -top-2 -right-2 bg-zinc-800/80 hover:bg-zinc-700 h-6 w-6 rounded-full"
                    >
                      <X className="h-3 w-3 text-white" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* File input button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
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

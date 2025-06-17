import React, { useEffect, useRef, useState } from "react";
import { type Message } from "ai";
import { ChatMessage } from "./chat-message";

// 1. Create a memoized MessageList component
export const MessageList = React.memo(
  ({
    messages,
    userImage,
  }: {
    messages: Message[];
    userImage?: string | null;
  }) => {
    return (
      <div className="flex flex-col space-y-4 pb-20">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            userImage={userImage}
          />
        ))}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to determine if we should re-render
    // Only re-render if messages array has changed in length or content
    if (prevProps.messages.length !== nextProps.messages.length) return false;

    // For deep comparison of messages
    for (let i = 0; i < prevProps.messages.length; i++) {
      if (prevProps.messages[i].content !== nextProps.messages[i].content)
        return false;
      if (prevProps.messages[i].id !== nextProps.messages[i].id) return false;
    }

    return true; // Don't re-render if no relevant changes
  }
);

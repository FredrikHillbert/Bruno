"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Eye, EyeOff, ExternalLink } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: string, apiKey: string) => void;
  currentKeys: Record<string, string>;
}

const providers = [
  {
    id: "openai",
    name: "OpenAI",
    placeholder: "sk-...",
    url: "https://platform.openai.com/api-keys",
    description: "GPT-4o, GPT-4o Mini, GPT-3.5 Turbo",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    placeholder: "sk-ant-...",
    url: "https://console.anthropic.com/settings/keys",
    description: "Claude 3.5 Sonnet, Claude 3 Haiku",
  },
  {
    id: "google",
    name: "Google AI",
    placeholder: "AI...",
    url: "https://aistudio.google.com/app/apikey",
    description: "Gemini 1.5 Pro, Gemini 1.5 Flash",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    placeholder: "sk-...",
    url: "https://platform.deepseek.com/api_keys",
    description: "DeepSeek Chat, DeepSeek Coder",
  },
  {
    id: "meta",
    name: "Meta via Groq",
    placeholder: "sk-meta-...",
    url: "https://console.groq.com/keys",
    description: "Llama 3.1, Llama 3.2",
  },
];

export function ApiKeyModal({
  isOpen,
  onClose,
  onSave,
  currentKeys,
}: ApiKeyModalProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(currentKeys);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("openai");

  const handleSave = (provider: string) => {
    const key = apiKeys[provider];
    if (key?.trim()) {
      onSave(provider, key.trim());
    }
  };

  const handleRemove = (provider: string) => {
    const newKeys = { ...currentKeys };
    delete newKeys[provider];
    localStorage.setItem("api-keys", JSON.stringify(newKeys));
    setApiKeys(newKeys);
    onSave(provider, "");
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  console.log("Current API Keys:", currentKeys);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys Management
          </DialogTitle>
          <DialogDescription>
            Add your API keys to access different AI providers. Keys are stored
            locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription>
            <strong>Bring Your Own Key (BYOK)</strong> - Use your own API keys
            for unlimited access. You only pay for what you use directly to the
            AI providers.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            {providers.map((provider) => {
              return (
                <TabsTrigger
                  key={provider.id}
                  value={provider.id}
                  className="text-xs"
                >
                  {provider.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {providers.map((provider) => (
            <TabsContent
              key={provider.id}
              value={provider.id}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-key`}>
                  {provider.name} API Key
                </Label>
                <div className="relative">
                  <Input
                    id={`${provider.id}-key`}
                    type={showKeys[provider.id] ? "text" : "password"}
                    placeholder={provider.placeholder}
                    defaultValue={currentKeys[provider.id] || ""}
                    onChange={(e) =>
                      setApiKeys((prev) => ({
                        ...prev,
                        [provider.id]: e.target.value,
                      }))
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleShowKey(provider.id)}
                  >
                    {showKeys[provider.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {provider.description}
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  Don't have an API key?
                  <Button variant="link" className="p-0 h-auto ml-1" asChild>
                    <a
                      href={provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get one from {provider.name}{" "}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave(provider.id)}
                  disabled={!apiKeys[provider.id]?.trim()}
                  className="flex-1"
                >
                  Save {provider.name} Key
                </Button>
                {currentKeys[provider.id] && (
                  <Button
                    variant="outline"
                    onClick={() => handleRemove(provider.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

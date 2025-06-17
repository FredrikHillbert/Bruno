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
import { Key, Eye, EyeOff, ExternalLink, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "./ui/scroll-area";

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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [activeTab, setActiveTab] = useState(
    currentKeys.openrouter ? "openrouter" : "openai"
  );

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

  return (
    <ScrollArea className="space-y-4 max-h-2/3">
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl bg-black text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys Management
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Add your API keys to access different AI providers. Keys are
              stored locally and never sent to our servers.
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-green-950/20 border border-green-800/50 ">
            <AlertDescription className="text-white">
              <strong>Recommended: OpenRouter</strong> - Use a single API key to
              access 200+ AI models from OpenAI, Anthropic, Meta, Google, and
              more with a simple pay-as-you-go model.
            </AlertDescription>
          </Alert>

          {/* OpenRouter Section (Always visible) */}
          <div className="space-y-2 border border-zinc-800 rounded-lg p-4 bg-black">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="openrouter-key"
                className="text-lg font-medium text-white"
              >
                OpenRouter API Key
              </Label>
              {currentKeys.openrouter && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-800/30 text-green-400 border border-green-800/50">
                  Active
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="openrouter-key"
                type={showKeys.openrouter ? "text" : "password"}
                placeholder="sk-or-v1-..."
                defaultValue={currentKeys.openrouter || ""}
                onChange={(e) =>
                  setApiKeys((prev) => ({
                    ...prev,
                    openrouter: e.target.value,
                  }))
                }
                className="pr-10 bg-zinc-900 border-zinc-700 text-white"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleShowKey("openrouter")}
              >
                {showKeys.openrouter ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-zinc-400">
              Access models from OpenAI, Anthropic, Meta, Google, Mistral, and
              more with a single API key.
            </p>

            <div className="mt-4 p-3 rounded-md bg-zinc-800/50 border border-zinc-700">
              <h4 className="font-medium text-white mb-1">
                Why use OpenRouter?
              </h4>
              <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
                <li>Access 200+ models with a single API key</li>
                <li>Pay-as-you-go pricing with no subscription</li>
                <li>
                  No rate limits from our platform when using your own key
                </li>
              </ul>
              <div className="mt-2 text-sm">
                <Button
                  variant="link"
                  className="p-0 h-auto text-green-500"
                  asChild
                >
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get a key from OpenRouter
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleSave("openrouter")}
                disabled={!apiKeys.openrouter?.trim()}
                className="flex-1 bg-green-800 hover:bg-green-700 text-white"
              >
                {currentKeys.openrouter
                  ? "Update OpenRouter Key"
                  : "Save OpenRouter Key"}
              </Button>
              {currentKeys.openrouter && (
                <Button
                  variant="outline"
                  onClick={() => handleRemove("openrouter")}
                  className="border-red-900/30 text-red-400 hover:bg-red-100 hover:text-red-600"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Options Collapsible */}
          <Collapsible
            open={showAdvancedOptions}
            onOpenChange={setShowAdvancedOptions}
            className="border border-zinc-800 rounded-lg"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full justify-between p-4 rounded-lg hover:bg-gray-200"
              >
                <span className="text-sm font-medium">
                  Advanced: Direct Provider Keys
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showAdvancedOptions ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-xs text-zinc-500 mb-4">
                You can also use API keys directly from specific providers. This
                is only recommended if you already have existing keys or
                specific needs.
              </p>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  {providers.map((provider) => (
                    <TabsTrigger
                      key={provider.id}
                      value={provider.id}
                      className="text-xs"
                    >
                      {provider.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {providers.map((provider) => (
                  <TabsContent
                    key={provider.id}
                    value={provider.id}
                    className="space-y-4 mt-4"
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
                          className="pr-10 bg-zinc-900 border-zinc-700 text-white"
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
                      <p className="text-sm text-zinc-500">
                        {provider.description}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-green-500"
                            asChild
                          >
                            <a
                              href={provider.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Get one from {provider.name}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        </p>
                      </div>
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
            </CollapsibleContent>
          </Collapsible>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

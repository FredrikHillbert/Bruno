import { Link } from "react-router";
import { ExternalLink, Key, ArrowLeft, Check, AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function LearnMore() {
  return (
    <div className="container max-w-3xl py-8 px-4 mx-auto">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to chat
        </Link>
        <h1 className="text-3xl font-bold mb-2">Using Your Own API Keys</h1>
        <p className="text-muted-foreground">
          Learn how to use your own API keys to access AI models completely for free, with your data never leaving your browser.
        </p>
      </div>
      
      <div className="mb-10 p-6 bg-card border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Why Use Your Own API Key?</h2>
        
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center mb-2">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="font-medium">Zero Cost to You</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We don't charge any extra fees - you only pay for what you use directly to the AI provider.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center mb-2">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="font-medium">Maximum Privacy</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Your API key and conversations stay in your browser - we never see or store your data.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center mb-2">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="font-medium">Full Control</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Use multiple providers, switch between them, and manage your own usage limits.
            </p>
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">Keep Your Keys Secure</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your API keys should be kept private. Never share them with others or expose them in public repositories.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">How to Get API Keys</h2>
        <p className="mb-6 text-muted-foreground">
          Select your preferred AI provider below for step-by-step instructions on how to obtain and use an API key.
        </p>
        
        <Tabs defaultValue="openai" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="meta">Meta</TabsTrigger>
            <TabsTrigger value="mistral">Mistral</TabsTrigger>
            <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
          </TabsList>
          
          <TabsContent value="openai" className="border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">OpenAI API Key</h3>
            
            <ol className="space-y-6">
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">1</span>
                <div>
                  <p className="font-medium">Create an OpenAI account</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visit <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">
                      OpenAI Platform <ExternalLink className="ml-1 h-3 w-3" />
                    </a> and sign up for an account if you don't already have one.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">2</span>
                <div>
                  <p className="font-medium">Navigate to API keys section</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once logged in, go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">
                      API Keys <ExternalLink className="ml-1 h-3 w-3" />
                    </a> in your account dashboard.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">3</span>
                <div>
                  <p className="font-medium">Create a new API key</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click on "Create new secret key" and give it a name (e.g., "T3-Clone App").
                  </p>
                  <div className="mt-2">
                    <img src="/images/openai-create-key.png" alt="OpenAI Create Key" className="rounded border dark:border-gray-700" />
                  </div>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">4</span>
                <div>
                  <p className="font-medium">Copy your API key</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copy the generated API key. <strong>Important:</strong> This is the only time you'll see the full key, so make sure to save it somewhere secure.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">5</span>
                <div>
                  <p className="font-medium">Add the API key to the app</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Return to our application, select OpenAI as your provider, and paste the key when prompted.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your key will be securely stored in your browser's local storage and never sent to our servers.
                  </p>
                </div>
              </li>
            </ol>
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-2">Example OpenAI Key Format:</h4>
              <div className="flex items-center p-3 bg-muted rounded">
                <code className="text-sm flex-1">sk-ABCdefGHIjklMNOpqrSTUvwxYZ0123456789</code>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Pricing & Usage</h4>
              <p className="text-sm text-muted-foreground">
                OpenAI offers $5 of free credits for new users. After that, you'll pay per token used 
                (roughly 1 token = 4 characters). GPT-4 costs approximately $0.01-0.02 per message, 
                while GPT-3.5 is much cheaper at ~$0.001 per message.
              </p>
              <div className="mt-2">
                <a 
                  href="https://openai.com/pricing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline inline-flex items-center"
                >
                  See OpenAI's pricing details
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="anthropic" className="border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Anthropic API Key</h3>
            
            <ol className="space-y-6">
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">1</span>
                <div>
                  <p className="font-medium">Sign up for Anthropic Console</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visit <a href="https://console.anthropic.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">
                      Anthropic Console <ExternalLink className="ml-1 h-3 w-3" />
                    </a> and create an account.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">2</span>
                <div>
                  <p className="font-medium">Access API Keys section</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once logged in, navigate to the API Keys section in your dashboard.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">3</span>
                <div>
                  <p className="font-medium">Create a new API key</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Create Key" and name your key (e.g., "T3-Clone Access").
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">4</span>
                <div>
                  <p className="font-medium">Copy and save your key</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copy the generated API key and store it securely - you won't be able to see it again.
                  </p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border mr-3 text-xs font-medium">5</span>
                <div>
                  <p className="font-medium">Add the API key to our app</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Return to our application, select Anthropic as your provider, and paste the key.
                  </p>
                </div>
              </li>
            </ol>
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-2">Example Anthropic Key Format:</h4>
              <div className="flex items-center p-3 bg-muted rounded">
                <code className="text-sm flex-1">sk-ant-api03-abcdefg123456789</code>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Pricing & Usage</h4>
              <p className="text-sm text-muted-foreground">
                Anthropic provides free credits for new users to try Claude models. Pricing is based on input and output tokens.
                Claude 3 Sonnet costs approximately $0.003 per 1K input tokens and $0.015 per 1K output tokens.
              </p>
              <div className="mt-2">
                <a 
                  href="https://www.anthropic.com/pricing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline inline-flex items-center"
                >
                  See Anthropic's pricing details
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
          </TabsContent>
          
          {/* Add similar content for other providers */}
          <TabsContent value="google" className="border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Google AI API Key</h3>
            {/* Google-specific instructions */}
            <p className="text-muted-foreground">Instructions for accessing Google's Gemini API coming soon...</p>
          </TabsContent>
          
          <TabsContent value="meta" className="border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Meta AI API Key</h3>
            {/* Meta-specific instructions */}
            <p className="text-muted-foreground">Instructions for accessing Meta's Llama models coming soon...</p>
          </TabsContent>
          
          <TabsContent value="mistral" className="border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Mistral API Key</h3>
            {/* Mistral-specific instructions */}
            <p className="text-muted-foreground">Instructions for accessing Mistral AI models coming soon...</p>
          </TabsContent>
          
          <TabsContent value="deepseek" className="border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">DeepSeek API Key</h3>
            {/* DeepSeek-specific instructions */}
            <p className="text-muted-foreground">Instructions for accessing DeepSeek models coming soon...</p>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        
        {/* <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Are my API keys safe?</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Yes. Your API keys are stored solely in your browser's local storage. They never leave your device and are not sent to our servers.
                Your keys are used directly from your browser to communicate with the AI provider's servers.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>How much will using my own API keys cost?</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Costs vary by provider. Many offer free tiers for new users (like OpenAI's $5 free credit).
                Typical costs range from $0.0005 to $0.02 per message depending on the model used. You can set rate limits with the provider to control spending.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>Will my conversations be private?</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                When using your own API keys, your conversations go directly from your browser to the AI provider's servers.
                We don't see, store, or process the content of your messages. Your privacy policy with the AI provider (OpenAI, Anthropic, etc.) will apply to your conversations.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>Can I use multiple providers?</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Absolutely! You can add API keys for multiple providers and switch between them at any time.
                This gives you flexibility to use different models for different types of questions or to compare responses.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>What if I don't want to use my own API keys?</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                We offer a Premium subscription that gives you access to all AI providers without needing your own API keys.
                With Premium, we handle all the API costs, and you get additional features like higher rate limits and priority support.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion> */}
      </div>
      
      <div className="flex justify-between items-center pt-6 border-t">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to chat
        </Link>
        
        <Button onClick={() => window.history.back()}>
          <Key className="mr-2 h-4 w-4" />
          Add API Key
        </Button>
      </div>
    </div>
  );
}
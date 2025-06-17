import { useLayoutContext } from "@/routes/layout";
import { Key } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router";

interface NoAccessSectionProps {
    onProviderChange: (provider: string) => void;
    onOpenApiKeyModal: () => void;
}

export default function NoAccessSection(
    { onProviderChange, onOpenApiKeyModal }: NoAccessSectionProps
) {
  const { user, apiKeys, selectedProvider } = useLayoutContext();
  // Get free providers that the user can access
  const availableFreeProviders = user
    ? ["meta", "google", "mistral", "deepseek"]
    : [];

  // Get providers with API keys
  const providersWithKeys = Object.keys(apiKeys).filter(
    (key) => apiKeys[key] && apiKeys[key].trim() !== ""
  );

  // Get a list of all providers the user can access
  const accessibleProviders = [
    ...new Set([...availableFreeProviders, ...providersWithKeys]),
  ];

  // Determine if there are alternatives to show
  const hasAlternatives = accessibleProviders.length > 0;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 md:p-8 bruno-bg">
      <div className="w-full max-w-xl space-y-6 rounded-xl bruno-border bruno-card p-6 shadow-md">
        {/* Header with Alert */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:oklch(var(--bruno-red)/0.1)] dark:bg-[color:oklch(var(--bruno-red)/0.15)]">
            <Key className="h-8 w-8 text-[color:oklch(var(--bruno-red))]" />
          </div>

          <h2 className="mb-2 text-xl font-bold bruno-text-primary">
            {hasAlternatives
              ? `Access to ${
                  selectedProvider.charAt(0).toUpperCase() +
                  selectedProvider.slice(1)
                } Required`
              : "Access to AI Models"}
          </h2>

          {hasAlternatives && (
            <div className="mb-4 p-2 rounded-lg bg-red-900/20 border border-red-700/30">
              <p className="text-sm text-zinc-300">
                You don't currently have access to{" "}
                <span className="font-medium text-white">
                  {selectedProvider.charAt(0).toUpperCase() +
                    selectedProvider.slice(1)}
                </span>
                . Choose another provider or add your API key.
              </p>
            </div>
          )}

          {user ? (
            <p className="bruno-text-secondary mb-4">
              You're signed in! You have these options to access models:
            </p>
          ) : (
            <p className="bruno-text-secondary mb-4">
              Get started with BrunoChat in seconds:
            </p>
          )}
        </div>

        {/* Main Options */}
        <div className="grid gap-4">
          {/* Alternative Providers Section - Only show if there are alternatives */}
          {hasAlternatives && (
            <div className="flex flex-col space-y-3 rounded-lg border border-green-700/30 bg-green-900/10 p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-white">Available Providers</h3>
                <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs text-white">
                  Recommended
                </span>
              </div>
              <p className="flex-1 text-sm text-zinc-400">
                Switch to one of these providers that you already have access
                to:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableFreeProviders.includes("meta") && (
                  <Button
                    onClick={() => onProviderChange("meta")}
                    variant="outline"
                    className="border-green-700/50 text-green-500 hover:bg-green-900/30"
                  >
                    Use Llama
                  </Button>
                )}
                {availableFreeProviders.includes("google") && (
                  <Button
                    onClick={() => onProviderChange("google")}
                    variant="outline"
                    className="border-green-700/50 text-green-500 hover:bg-green-900/30"
                  >
                    Use Gemini
                  </Button>
                )}
                {availableFreeProviders.includes("deepseek") && (
                  <Button
                    onClick={() => onProviderChange("deepseek")}
                    variant="outline"
                    className="border-green-700/50 text-green-500 hover:bg-green-900/30"
                  >
                    Use DeepSeek
                  </Button>
                )}

                {providersWithKeys.includes("openrouter") && (
                  <Button
                    variant="outline"
                    onClick={() => onProviderChange("openrouter")}
                    className="border-green-700/50 text-green-500 hover:bg-green-900/30"
                  >
                    Use OpenRouter
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* API Key Option */}
          <div className="flex flex-col space-y-3 rounded-lg bruno-border bg-[color:oklch(var(--muted)/0.5)] p-4">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium bruno-text-primary">
                Use Your Own API Key
              </h3>
              {!user && (
                <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs text-[color:oklch(var(--secondary-foreground))]">
                  No account needed
                </span>
              )}
            </div>
            <p className="flex-1 text-sm bruno-text-secondary">
              Add your own API key from OpenRouter to access 200+ models from
              all providers with a single key.
            </p>

            <div className="text-xs bg-[color:oklch(var(--muted)/0.7)] p-2 rounded bruno-border bruno-text-secondary">
              OpenRouter gives you pay-as-you-go access to models from OpenAI,
              Anthropic, Google, Meta and others with just one API key.
            </div>

            <Button onClick={onOpenApiKeyModal} className="text-white">
              <Key className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
          </div>

          {/* Create Account Option - Only for non-logged in users */}
          {!user && (
            <div className="flex flex-col space-y-3 rounded-lg border border-green-700/30 bg-green-900/10 p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium bruno-text-primary">
                  Create a Free Account
                </h3>
              </div>
              <p className="flex-1 text-sm bruno-text-secondary">
                Sign up for a free account to access multiple free models and
                save your chat history.
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                <Link
                  to="/sign-up"
                  className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all bg-gradient-to-r from-green-400 to-green-700"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/sign-in"
                  className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all bg-green-500 "
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Help Link */}
        <p className="text-center text-xs mt-4">
          <Link to="/learn-more" className="text-green-500 hover:underline">
            Learn more
          </Link>{" "}
          about API keys and free models.
        </p>
      </div>
    </div>
  );
}

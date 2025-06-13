import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { User } from "@/routes/layout";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  user: User | null;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  onSubscribe,
  user,
}: SubscriptionModalProps) {
  // This is critical - we need to call onOpenChange when Dialog state changes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user?.isSubscribed ? "Your Premium Subscription" : "Upgrade to Premium"}
          </DialogTitle>
          <DialogDescription>
            {user?.isSubscribed
              ? "You already have a premium subscription. Enjoy all the benefits!"
              : "Get unlimited access to all AI models and cloud synchronization."}
          </DialogDescription>
        </DialogHeader>

        {!user?.isSubscribed ? (
          <>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-2">Premium Benefits</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>
                      Use our API keys - no need to bring your own keys
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>Cloud sync of your chat history across devices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>
                      Access to all AI models including GPT-4 and Claude
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-2">Pricing</h3>
                <p className="text-2xl font-bold">
                  $9.99 <span className="text-sm font-normal">/month</span>
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Cancel anytime
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={onSubscribe} className="w-full">
                Subscribe Now
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="rounded-lg border p-4 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-2">
              You're a Premium Member
            </h3>
            <p className="text-muted-foreground">
              Enjoy all the benefits of your premium subscription.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

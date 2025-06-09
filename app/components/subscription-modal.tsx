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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Crown, Key, Zap } from "lucide-react";
import type { UserPlan } from "@/routes/home";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: UserPlan) => void;
  currentPlan: UserPlan;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  onSubscribe,
  currentPlan,
}: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFreePlan = () => {
    onClose();
    // This will trigger the API key modal
  };

  const handlePremiumPlan = async () => {
    setIsLoading(true);
    // Simulate subscription process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    onSubscribe({
      type: "premium",
      expiresAt,
    });
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-center">
            Get started with AI chat - bring your own key or let us handle
            everything
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  BYOK Plan
                </CardTitle>
                <Badge variant="outline">Free</Badge>
              </div>
              <CardDescription>
                Perfect for developers and power users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                $0
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Bring your own API keys
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Access to all AI models
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  No monthly limits
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30"></span>
                  No chat history
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30"></span>
                  No cloud sync
                </li>
              </ul>

              <Button
                onClick={handleFreePlan}
                variant="outline"
                className="w-full"
              >
                Continue with BYOK
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-primary">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Premium Plan
                </CardTitle>
                <Badge>Best Value</Badge>
              </div>
              <CardDescription>
                Everything included, no setup required
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                $5
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  All API costs included
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Access to all AI models
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Unlimited chat history
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Cloud sync across devices
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">No setup required</span>
                </li>
              </ul>

              <Button
                onClick={handlePremiumPlan}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Start Premium Trial"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-4">
          You can switch between plans anytime. No long-term commitments.
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import type React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, PenTool, Lightbulb, DollarSign, Zap, Brain } from "lucide-react";

interface ModelRecommendation {
  id: string;
  provider: string;
  name: string;
  description: string;
  useCase: string;
  icon: React.ComponentType<any>;
  badge: string;
  badgeColor: string;
  strengths: string[];
}

const recommendations: ModelRecommendation[] = [
  {
    id: "gpt-4o",
    provider: "openai",
    name: "GPT-4o",
    description: "Latest and most capable model from OpenAI",
    useCase: "Complex reasoning, analysis, and creative tasks",
    icon: Brain,
    badge: "Most Capable",
    badgeColor: "bg-blue-500",
    strengths: [
      "Complex reasoning",
      "Code generation",
      "Creative writing",
      "Analysis",
    ],
  },
  {
    id: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    name: "Claude 3.5 Sonnet",
    description: "Anthropic's most balanced model for most tasks",
    useCase: "Writing, analysis, and general conversation",
    icon: PenTool,
    badge: "Best Overall",
    badgeColor: "bg-green-500",
    strengths: ["Writing quality", "Safety", "Reasoning", "Code review"],
  },
  {
    id: "deepseek-chat",
    provider: "deepseek",
    name: "DeepSeek Chat",
    description: "Excellent performance at a fraction of the cost",
    useCase: "Cost-effective solution for most tasks",
    icon: DollarSign,
    badge: "Best Value",
    badgeColor: "bg-yellow-500",
    strengths: ["Cost effective", "Good reasoning", "Fast responses", "Coding"],
  },
  {
    id: "gpt-4o-mini",
    provider: "openai",
    name: "GPT-4o Mini",
    description: "Fast and efficient for everyday tasks",
    useCase: "Quick questions and simple tasks",
    icon: Zap,
    badge: "Fastest",
    badgeColor: "bg-purple-500",
    strengths: [
      "Speed",
      "Low cost",
      "Good for simple tasks",
      "Quick responses",
    ],
  },
  {
    id: "gemini-1.5-pro",
    provider: "google",
    name: "Gemini 1.5 Pro",
    description: "Google's flagship model with large context",
    useCase: "Long documents and complex analysis",
    icon: Lightbulb,
    badge: "Large Context",
    badgeColor: "bg-orange-500",
    strengths: [
      "Large context window",
      "Document analysis",
      "Multimodal",
      "Research",
    ],
  },
  {
    id: "claude-3-haiku-20240307",
    provider: "anthropic",
    name: "Claude 3 Haiku",
    description: "Fast and cost-effective for simple tasks",
    useCase: "Quick questions and basic assistance",
    icon: Code,
    badge: "Budget Friendly",
    badgeColor: "bg-teal-500",
    strengths: ["Low cost", "Fast", "Good for coding", "Simple tasks"],
  },
];

interface ModelRecommendationsProps {
  onSelectModel: (provider: string, model: string) => void;
}

export function ModelRecommendations({
  onSelectModel,
}: ModelRecommendationsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose the Right AI Model</h2>
        <p className="text-muted-foreground">
          Not sure which model to use? Here are our recommendations for
          different use cases.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((model) => (
          <Card
            key={model.id}
            className="relative hover:shadow-lg transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <model.icon className="h-5 w-5" />
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                </div>
                <Badge className={`${model.badgeColor} text-white text-xs`}>
                  {model.badge}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {model.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Best for:</p>
                <p className="text-sm text-muted-foreground">{model.useCase}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Strengths:</p>
                <div className="flex flex-wrap gap-1">
                  {model.strengths.map((strength, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => onSelectModel(model.provider, model.id)}
                className="w-full mt-4"
                size="sm"
              >
                Use {model.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

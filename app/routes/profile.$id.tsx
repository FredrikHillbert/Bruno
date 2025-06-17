import React, { useState, useEffect } from "react";

import {
  User,
  Brain,
  Activity,
  MessageSquare,
  Share2,
  Trophy,
  Calendar,
  BarChart3,
  GitFork,
  Sparkles,
  Cpu,
  BookOpen,
  Code,
  Download,
  ArrowUpRight,
  Clock,
  Flame,
  ChevronLeft,
  Edit,
  X,
  Check,
  Plus,
  Pin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getModelNameFromId, providers } from "@/models";
import {
  useLoaderData,
  useNavigate,
  useSubmit,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { prisma } from "@/db.server";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/auth";
function getDisplayNameFromModelId(modelId: string): string {
  // Map common model IDs to friendly names
  const modelNameMap: Record<string, string> = {
    "gpt-4o": "GPT-4o",
    "gpt-4-turbo": "GPT-4 Turbo",
    "gpt-3.5-turbo": "GPT-3.5 Turbo",
    "claude-3-opus-20240229": "Claude 3 Opus",
    "claude-3-sonnet-20240229": "Claude 3 Sonnet",
    "claude-3-haiku-20240307": "Claude 3 Haiku",
    "llama3-70b-8192": "Llama 3 70B",
    "anthropic/claude-3-opus": "Claude 3 Opus",
    "openai/gpt-4o": "GPT-4o",
  };

  return modelNameMap[modelId] || modelId;
}
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  // Get the actual user data from the database
  const userId = params.id;

  try {
    // Fetch basic user data from the database
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
        isSubscribed: true,
        // Include the achievements relation
        achievements: {
          select: {
            name: true,
            icon: true,
            description: true,
            earnedAt: true,
          },
          orderBy: {
            earnedAt: "desc",
          },
        },
        // Include the favorite models relation
        favoriteModels: {
          select: {
            modelId: true,
            modelName: true,
            provider: true,
          },
          orderBy: {
            pinnedAt: "desc",
          },
          take: 3,
        },
        // Get the user's recent threads
        threads: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            messages: {
              select: {
                id: true,
                provider: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        },
      },
    });

    if (!userData) {
      throw new Response("User not found", { status: 404 });
    }

    // Get the user's model usage statistics
    const modelUsageStats = await prisma.userModelUsage.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        requestCount: "desc",
      },
    });

    // Process model usage for display
    const modelUsage: Record<string, number> = {};
    let totalRequests = 0;

    modelUsageStats.forEach((stat) => {
      // Extract display name from model ID for better readability
      const displayName = getDisplayNameFromModelId(stat.modelId);
      modelUsage[displayName] = stat.requestCount;
      totalRequests += stat.requestCount;
    });


    // Create a username from the email
    const username =
      userData.email?.split("@")[0] ||
      userData.name?.toLowerCase().replace(/\s+/g, "") ||
      "user";

    // Process favorite models or use defaults if none exist
    const favoriteModels =
      userData.favoriteModels.length > 0
        ? userData.favoriteModels.map((model) => model.modelName)
        : [];

    // Process achievements or use defaults if none exist
    const badges =
      userData.achievements.length > 0
        ? userData.achievements.map((achievement) => ({
            name: achievement.name,
            icon: achievement.icon,
            description: achievement.description,
          }))
        : [
            {
              name: "Early Adopter",
              icon: "Trophy",
              description: "Joined during beta",
            },
            {
              name: "Power User",
              icon: "Zap",
              description: "Over 1000 messages",
            },
            {
              name: "Explorer",
              icon: "Compass",
              description: "Used 5+ different models",
            },
          ];

    // Return the combined real and mock data
    return {
      user: {
        id: userData.id,
        name: userData.name,
        username: username,
        bio: userData.bio || "No bio yet",
        image: userData.image,
        isSubscribed: userData.isSubscribed,
        joinedAt: userData.createdAt.toISOString(),
        lastActive: new Date().toISOString(),
        stats: {
          chats: userData.threads.length || 0,
          messages: totalRequests,
          modelUsage: modelUsage,
          favoriteModels: favoriteModels,
          badges: badges,
          // Keep some mock data for now
          aiStrengths: [
            { name: "Coding", score: 92 },
            { name: "Research", score: 87 },
            { name: "Creative Writing", score: 76 },
            { name: "Data Analysis", score: 63 },
          ],
          recentTopics: [
            "React state management",
            "TypeScript best practices",
            "AI embeddings",
            "Vector databases",
            "UI animations",
          ],
        },
        // Format shared chats from the user's real threads
        sharedChats: userData.threads.map((thread) => {
          // Find the most used provider in this thread
          const providerCounts: Record<string, number> = {};
          thread.messages.forEach((msg) => {
            if (msg.provider) {
              providerCounts[msg.provider] =
                (providerCounts[msg.provider] || 0) + 1;
            }
          });

          const mostUsedProvider =
            Object.entries(providerCounts).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0] || "Unknown";

          return {
            id: thread.id,
            title: thread.title,
            modelUsed: mostUsedProvider,
            date: thread.createdAt.toISOString(),
            messageCount: thread.messages.length,
            reactions: Math.floor(Math.random() * 20),
          };
        }),
        // Add rate limits info
        rateLimits: {
          total: totalRequests,
          remaining: 10000 - totalRequests, // Assuming a 10k limit
          resetDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days from now
        },
      },
    };
  } catch (error) {
    // Handle errors
    if (error instanceof Response) throw error;
    console.error("Error loading profile data:", error);
    throw new Response("Error loading profile data", { status: 500 });
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const session = await auth.api.getSession(request);
  const userId = session?.user.id;

  if (!userId) {
    return { success: false, message: "Unauthorized", status: 401 };
  }

  try {
    // Handle bio update
    if (intent === "update-bio") {
      const bio = formData.get("bio") as string;

      await prisma.user.update({
        where: { id: userId },
        data: { bio },
      });

      return { success: true, message: "Bio updated successfully" };
    }

    // Handle favorite model pinning
    if (intent === "pin-model") {
      const modelId = formData.get("modelId") as string;
      const modelName = formData.get("modelName") as string;
      const provider = formData.get("provider") as string;

      await prisma.userFavoriteModel.create({
        data: {
          userId: userId,
          modelId,
          modelName,
          provider,
        },
      });

      return { success: true, message: "Model pinned successfully" };
    }

    // Handle favorite model unpinning
    if (intent === "unpin-model") {
      const modelId = formData.get("modelId") as string;

      await prisma.userFavoriteModel.deleteMany({
        where: {
          userId: userId,
          modelId,
        },
      });

      return { success: true, message: "Model unpinned successfully" };
    }

    return { success: false, message: "Unknown action", status: 400 };
  } catch (error) {
    console.error("Error handling action:", error);
    return { success: false, message: "Error processing request", status: 500 };
  }
};

export default function ProfilePage() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ai-usage");
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [timeActive, setTimeActive] = useState("");
  const submit = useSubmit();

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user.bio);

  const [showModelSelector, setShowModelSelector] = useState(false);

  // Function to check if a model is already pinned
  const isModelPinned = (modelId: string) => {
    return user.stats.favoriteModels.some((model) =>
      model.includes(getModelNameFromId(modelId))
    );
  };

  // Function to handle bio save
  const handleSaveBio = () => {
    const formData = new FormData();
    formData.append("intent", "update-bio");
    formData.append("bio", bioText);

    submit(formData, { method: "post" });
    setIsEditingBio(false);
    toast.success("Bio updated successfully");
  };

  // Function to handle model pinning
  const handlePinModel = (
    modelId: string,
    modelName: string,
    providerId: string
  ) => {
    const formData = new FormData();
    formData.append("intent", "pin-model");
    formData.append("modelId", modelId);
    formData.append("modelName", modelName);
    formData.append("provider", providerId);

    submit(formData, { method: "post" });
    setShowModelSelector(false);
    toast.success(`${modelName} pinned to favorites`);
  };

  // Function to handle model unpinning
  const handleUnpinModel = (modelId: string, modelName: string) => {
    const formData = new FormData();
    formData.append("intent", "unpin-model");
    formData.append("modelId", modelId);

    submit(formData, { method: "post" });
    toast.success(`${modelName} removed from favorites`);
   
  };

  // Calculate time since joined
  useEffect(() => {
    const calculateTimeActive = () => {
      const joinDate = new Date(user.joinedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - joinDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        setTimeActive(`${diffDays} days`);
      } else if (diffDays < 365) {
        setTimeActive(`${Math.floor(diffDays / 30)} months`);
      } else {
        setTimeActive(
          `${Math.floor(diffDays / 365)} years, ${Math.floor(
            (diffDays % 365) / 30
          )} months`
        );
      }
    };

    calculateTimeActive();
  }, [user.joinedAt]);

  // Generate AI insights
  const generateInsights = () => {
    setIsGeneratingInsights(true);
    setShowAiInsights(true);

    // Simulate AI generating insights
    setTimeout(() => {
      setInsights(`
## AI Usage Pattern Analysis

Based on your chat history, I've noticed some interesting patterns in how you use AI:

* You tend to use **Claude 3 Opus** for deeper research and complex explanations
* **GPT-4o** is your go-to for coding assistance and technical challenges
* You've been exploring **Llama 3** models more in recent weeks

Your most productive AI sessions happen in the evenings, particularly between 8-10pm. The quality of your prompts has improved significantly over time, with more structured and detailed requests leading to better responses.

## Skill Development Opportunities

Your interaction history suggests you might benefit from exploring:

1. **Prompt engineering techniques** for more efficient problem-solving
2. **Data visualization** capabilities of newer AI models
3. **Collaborative AI workflows** to enhance your projects

I've noticed you rarely use the code execution features available in some models - this could be a valuable addition to your workflow.
      `);
      setIsGeneratingInsights(false);
    }, 2500);
  };

  // Function to copy profile link
  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard");
  };

  // Function to go back to previous page
  const goBack = () => {
    navigate(-1);
  };

  // Get icon component by name (simple version)
  const getIconByName = (name: string) => {
    switch (name) {
      case "Trophy":
        return <Trophy className="h-4 w-4" />;
      case "Zap":
        return <Flame className="h-4 w-4" />;
      case "Compass":
        return <Activity className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          onClick={goBack}
          variant="outline"
          size="sm"
          className="bg-zinc-800/70 text-zinc-200 border-zinc-700 hover:bg-zinc-700 backdrop-blur"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      {/* Hero Banner */}
      <div className="relative h-64 bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-800 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-900 to-transparent"></div>
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="rounded-full border-4 border-zinc-900 overflow-hidden shadow-xl"
          >
            <Avatar className="h-36 w-36">
              <AvatarImage
                src={user.image ? user.image : ""}
                alt={"profile-pic"}
              />
              <AvatarFallback className="bg-zinc-800 text-3xl">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : null}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <div className="flex items-center gap-2 text-zinc-400">
                  <span>@{user.username}</span>
                  {user.isSubscribed ? (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600">
                      PRO
                    </Badge>
                  ) : (
                    <Badge className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200">
                      FREE
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={copyProfileLink}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => generateInsights()}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI Insights
                </Button>
              </div>
            </div>

            {/* Bio section with edit functionality */}
            <div className="mt-4 relative">
              {isEditingBio ? (
                <div className="space-y-2">
                  <Textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    className="min-h-[80px] bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Write something about yourself..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBioText(user.bio);
                        setIsEditingBio(false);
                      }}
                      className="h-8 px-2 text-xs border-zinc-700"
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveBio}
                      className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="h-3 w-3 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <p className="text-zinc-300">{user.bio}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingBio(true)}
                    className="absolute -right-2 -top-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 hover:bg-zinc-700 rounded-full"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-6 mt-6">
              <div className="flex items-center gap-1 text-zinc-400">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined{" "}
                  {new Date(user.joinedAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <Clock className="h-4 w-4" />
                <span>{timeActive} active</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <MessageSquare className="h-4 w-4" />
                <span>{user.stats.messages.toLocaleString()} messages</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <GitFork className="h-4 w-4" />
                <span>{user.stats.chats} conversations</span>
              </div>
            </div>
          </div>
        </div>
        {/* Profile Tabs */}
        <Tabs
          defaultValue="overview"
          className="mt-12"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-zinc-800/50 border border-zinc-700">
            <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
            <TabsTrigger value="overview">
              Insights (mock - coming soon)
            </TabsTrigger>
            <TabsTrigger value="shared-chats">
              Shared Chats (mock - coming soon)
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Stats */}
              <Card className="bg-zinc-800/50 border-zinc-700 col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Activity Overview
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Summary of AI interactions and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Model Usage Distribution */}
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">
                      Model Usage Distribution
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(user.stats.modelUsage).map(
                        ([model, count]) => {
                          const percentage = Math.round(
                            (count / user.stats.chats) * 100
                          );
                          return (
                            <div key={model} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-zinc-400">{model}</span>
                                <span className="text-zinc-300">
                                  {percentage}%
                                </span>
                              </div>
                              <Progress
                                value={percentage}
                                className="h-2 bg-zinc-700"
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* AI Strengths */}
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">
                      AI Strengths & Usage Areas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {user.stats.aiStrengths.map((strength) => (
                        <div
                          key={strength.name}
                          className="bg-zinc-800 rounded-lg p-3 border border-zinc-700"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-zinc-300 font-medium">
                              {strength.name}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {strength.score}
                            </span>
                          </div>
                          <Progress
                            value={strength.score}
                            className="h-1.5 bg-zinc-700"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Topics */}
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">
                      Recent Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.stats.recentTopics.map((topic) => (
                        <Badge
                          key={topic}
                          className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badges & Achievements */}
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    Badges & Achievements
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Recognition for AI usage patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.stats.badges.map((badge) => (
                      <motion.div
                        key={badge.name}
                        whileHover={{ scale: 1.03 }}
                        className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 bg-zinc-800"
                      >
                        <div className="rounded-full p-2 bg-amber-950/50 border border-amber-900/50">
                          {getIconByName(badge.icon)}
                        </div>
                        <div>
                          <h4 className="font-medium text-zinc-200">
                            {badge.name}
                          </h4>
                          <p className="text-xs text-zinc-400">
                            {badge.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-zinc-700 pt-4">
                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                  >
                    View All Achievements
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* AI Usage Tab */}
          <TabsContent value="ai-usage" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-zinc-800/50 border-zinc-700 col-span-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    Usage Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Rate Limit Info */}
                  {user.rateLimits && (
                    <div className="mt-4 bg-zinc-800/50 rounded-md border border-zinc-700 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-300">
                          API Usage
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs border-zinc-600"
                        >
                          {Math.floor((user.rateLimits.total / 10000) * 100)}%
                          Used
                        </Badge>
                      </div>
                      <Progress
                        value={(user.rateLimits.total / 10000) * 100}
                        className="h-2 bg-zinc-700"
                      />
                      <div className="flex justify-between text-xs text-zinc-400 mt-1">
                        <span>
                          {user.rateLimits.total.toLocaleString()} requests used
                        </span>
                        <span>
                          {user.rateLimits.remaining.toLocaleString()} remaining
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Favorite Models */}
              <Card className="bg-zinc-800/50 border-zinc-700 col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-purple-400" />
                      Favorite AI Models
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Your pinned favorite models
                    </CardDescription>
                  </div>

                  {/* Add model button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    onClick={() => setShowModelSelector(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Pin Model
                  </Button>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {user.stats.favoriteModels.length > 0 ? (
                      user.stats.favoriteModels.map((model) => {
                        // Find provider for this model
                        const provider = providers.find((p) =>
                          p.models.some((m) =>
                            m.name.includes(model.split(" ")[0])
                          )
                        );

                        // Find the model from the provider
                        const modelObj = provider?.models.find((m) =>
                          m.name.includes(model.split(" ")[0])
                        );

                        return (
                          <motion.div
                            key={model}
                            whileHover={{ y: -4 }}
                            className="flex flex-col items-center p-6 rounded-xl border border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-900 group relative"
                          >
                            {/* Unpin button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                modelObj && handleUnpinModel(modelObj.id, model)
                              }
                              className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800/60 hover:bg-zinc-700 rounded-full"
                            >
                              <X className="h-3.5 w-3.5 text-zinc-400" />
                            </Button>

                            <div
                              className={`rounded-full p-3 mb-3 ${
                                model.includes("Claude")
                                  ? "bg-purple-900/30 text-purple-400"
                                  : model.includes("GPT")
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-blue-900/30 text-blue-400"
                              }`}
                            >
                              {provider ? (
                                React.createElement(provider.icon, {
                                  size: 24,
                                })
                              ) : (
                                <Cpu size={24} />
                              )}
                            </div>
                            <h3 className="text-lg font-medium text-white">
                              {model}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">
                              {model.includes("Claude")
                                ? "Anthropic"
                                : model.includes("GPT")
                                ? "OpenAI"
                                : "Meta"}
                            </p>
                            <div className="mt-4 text-center">
                              <Badge
                                variant="outline"
                                className="bg-zinc-800 border-zinc-700"
                              >
                                <Pin className="h-3 w-3 mr-1 text-zinc-400" />{" "}
                                Pinned
                              </Badge>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="col-span-3 p-8 text-center border border-dashed border-zinc-700 rounded-xl">
                        <Cpu className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                        <h3 className="text-zinc-400 font-medium mb-2">
                          No favorite models pinned yet
                        </h3>
                        <p className="text-zinc-500 text-sm mb-4">
                          Pin your favorite models to quickly access them
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          onClick={() => setShowModelSelector(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Pin Your First Model
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Shared Chats Tab */}
          <TabsContent value="shared-chats" className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {user.sharedChats.map((chat) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-zinc-200">
                          {chat.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <MessageSquare className="h-3 w-3" />
                            <span>{chat.messageCount} messages</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(chat.date).toLocaleDateString()}
                            </span>
                          </div>
                          <Badge className="bg-zinc-700 text-zinc-300">
                            {chat.modelUsed}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>

                    <div className="mt-3 p-3 bg-zinc-900 rounded text-xs text-zinc-400 border border-zinc-800">
                      <p className="line-clamp-2">
                        {chat.title === "Understanding Embeddings in AI"
                          ? "I'm trying to understand how embeddings work in AI. Can you explain the concept in simple terms and how they're used in practice?"
                          : chat.title === "Optimizing React Performance"
                          ? "My React app is getting slow with larger data sets. Can you help me optimize it? I'm using useState and useEffect for data fetching."
                          : "I want to build a realtime chat application with React and Firebase. What's the best way to structure this project?"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <Button
                variant="outline"
                className="mt-2 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              >
                View All Shared Conversations
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Insights Dialog */}
      <Dialog open={showAiInsights} onOpenChange={setShowAiInsights}>
        <DialogContent className="sm:max-w-2xl bg-zinc-900 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              AI-Generated Insights
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Personalized analysis of your AI usage patterns and opportunities
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {isGeneratingInsights ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Brain className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
                <p className="mt-4 text-zinc-400">
                  Analyzing your usage patterns...
                </p>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: insights || "" }} />
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between pt-4 border-t border-zinc-800 mt-4">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              onClick={() => setShowAiInsights(false)}
            >
              Close
            </Button>

            <Button
              className="bg-purple-700 hover:bg-purple-600 text-white"
              disabled={isGeneratingInsights}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Insights
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Model Selector Dialog */}
      <Dialog open={showModelSelector} onOpenChange={setShowModelSelector}>
        <DialogContent className="sm:max-w-lg bg-zinc-900 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-400" />
              Pin Favorite Models
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Choose models to pin to your profile
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.id} className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    {React.createElement(provider.icon, {
                      className: "h-4 w-4 text-zinc-400",
                    })}
                    {provider.name}
                  </h3>
                  <div className="space-y-1">
                    {provider.models.map((model) => {
                      const isPinned = isModelPinned(model.id);

                      return (
                        <div
                          key={model.id}
                          className={`flex items-center justify-between p-2.5 rounded-md border ${
                            isPinned
                              ? "border-purple-700 bg-purple-950/20"
                              : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
                          }`}
                        >
                          <div>
                            <div className="font-medium text-zinc-200">
                              {model.name}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {model.description}
                            </div>
                          </div>

                          {isPinned ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleUnpinModel(model.id, model.name)
                              }
                              className="h-8 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300"
                            >
                              <Pin className="h-3.5 w-3.5 mr-1 fill-current" />{" "}
                              Pinned
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handlePinModel(
                                  model.id,
                                  model.name,
                                  provider.id
                                )
                              }
                              className="h-8 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                            >
                              <Pin className="h-3.5 w-3.5 mr-1" /> Pin
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end pt-4 border-t border-zinc-800 mt-4">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              onClick={() => setShowModelSelector(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { CheckCircle2, Clock } from "lucide-react";

function CheckCircle2Icon({ className }: { className?: string }) {
  return <CheckCircle2 className={className} />;
}

function ClockIcon({ className }: { className?: string }) {
  return <Clock className={className} />;
}

interface PollOption {
  _id: Id<"pollOptions">;
  text: string;
  voteCount: number;
  order: number;
}

interface PollCardProps {
  poll: {
    _id: Id<"polls">;
    question: string;
    totalVotes: number;
    expiresAt?: number;
    isExpired: boolean;
    options: PollOption[];
    userVote: Id<"pollOptions"> | null;
    createdAt: string;
  };
}

export default function PollCard({ poll }: PollCardProps) {
  const vote = useMutation(api.polls.vote);

  const handleVote = async (optionId: Id<"pollOptions">) => {
    if (poll.isExpired) {
      toast.error("Bu anket süresi doldu");
      return;
    }

    try {
      await vote({ pollId: poll._id, optionId });
      toast.success("Oyunuz kaydedildi");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const hasVoted = poll.userVote !== null;
  const showResults = hasVoted || poll.isExpired;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{poll.question}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{poll.totalVotes} oy</span>
          {poll.expiresAt && (
            <>
              <span>•</span>
              {poll.isExpired ? (
                <span className="flex items-center gap-1 text-destructive">
                  <ClockIcon className="h-3 w-3" />
                  Süresi doldu
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {formatDistanceToNow(new Date(poll.expiresAt), {
                    addSuffix: true,
                    locale: tr,
                  })}
                  {" "}sona erecek
                </span>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {poll.options.map((option) => {
          const percentage =
            poll.totalVotes > 0
              ? Math.round((option.voteCount / poll.totalVotes) * 100)
              : 0;
          const isUserChoice = poll.userVote === option._id;

          if (showResults) {
            return (
              <div key={option._id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {option.text}
                    {isUserChoice && (
                      <CheckCircle2Icon className="h-4 w-4 text-primary" />
                    )}
                  </span>
                  <span className="font-semibold">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          }

          return (
            <Button
              key={option._id}
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => handleVote(option._id)}
            >
              {option.text}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

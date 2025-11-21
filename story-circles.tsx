import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";

interface StoryCirclesProps {
  onStoryClick: (userId: string, storyIndex: number) => void;
  onCreateClick: () => void;
}

// Icon wrapper component
function PlusIcon({ className }: { className?: string }) {
  return <Plus className={className} />;
}

export default function StoryCircles({
  onStoryClick,
  onCreateClick,
}: StoryCirclesProps) {
  const stories = useQuery(api.stories.getActiveStories, {});
  const currentUser = useQuery(api.users.getCurrentUser);

  if (stories === undefined || currentUser === undefined) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4 px-4 scrollbar-hide">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-[72px]">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Check if current user has stories
  const currentUserStory = stories.find((s) => s.userId === currentUser._id);
  const otherStories = stories.filter((s) => s.userId !== currentUser._id);

  return (
    <div className="flex gap-4 overflow-x-auto py-4 px-4 scrollbar-hide bg-card">
      {/* Current user's story / Create story button */}
      <div className="flex flex-col items-center gap-2 min-w-[70px]">
        <div className="relative group">
          <button
            onClick={
              currentUserStory
                ? () => onStoryClick(currentUser._id, 0)
                : onCreateClick
            }
            className="block"
          >
            {currentUserStory ? (
              // User has active story - show gradient ring
              <div className="relative h-[68px] w-[68px] rounded-full p-[2.5px] flex items-center justify-center group-hover:scale-110 transition-all bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-lg shadow-pink-500/40">
                <div className="h-full w-full rounded-full bg-background p-[2.5px] flex items-center justify-center">
                  <Avatar className="h-full w-full ring-0">
                    <AvatarImage
                      src={currentUser.profilePictureUrl || undefined}
                      alt={currentUser.name || ""}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                      {currentUser.name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {/* Plus button for adding another story */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateClick();
                  }}
                  className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-blue-500 border-[3px] border-background flex items-center justify-center p-0 shadow-md hover:scale-105 transition-transform active:scale-95"
                  style={{ minWidth: '24px', minHeight: '24px', maxWidth: '24px', maxHeight: '24px' }}
                >
                  <Plus className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              // No active story - show normal profile picture with plus
              <div className="relative h-[68px] w-[68px] rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                <Avatar className="h-full w-full ring-0 border-[2.5px] border-gradient-to-r from-purple-300 to-pink-300 dark:from-purple-700 dark:to-pink-700">
                  <AvatarImage
                    src={currentUser.profilePictureUrl || undefined}
                    alt={currentUser.name || ""}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                    {currentUser.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                {/* Plus button overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateClick();
                  }}
                  className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-blue-500 border-[3px] border-background flex items-center justify-center p-0 shadow-md hover:scale-105 transition-transform active:scale-95"
                  style={{ minWidth: '24px', minHeight: '24px', maxWidth: '24px', maxHeight: '24px' }}
                >
                  <Plus className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </button>


        </div>
        <span className="text-[11px] font-medium truncate max-w-[70px] text-muted-foreground">
          Hikaye Ekle
        </span>
      </div>

      {/* Other users' story circles */}
      {otherStories.map((userStory) => (
        <button
          key={userStory.userId}
          onClick={() => onStoryClick(userStory.userId, 0)}
          className="flex flex-col items-center gap-2 min-w-[70px] group"
        >
          <div className="relative">
            <div
              className={`h-[68px] w-[68px] rounded-full p-[2.5px] flex items-center justify-center group-hover:scale-110 transition-all ${
                userStory.hasUnviewed
                  ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-lg shadow-pink-500/40"
                  : "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600"
              }`}
            >
              <div className="h-full w-full rounded-full bg-background p-[2.5px] flex items-center justify-center">
                <Avatar className="h-full w-full ring-0">
                  <AvatarImage
                    src={userStory.profilePictureUrl || undefined}
                    alt={userStory.username}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                    {userStory.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold truncate max-w-[70px] px-2 py-0.5 border border-border rounded-full bg-muted/50">
            {userStory.username}
          </span>
        </button>
      ))}
    </div>
  );
}

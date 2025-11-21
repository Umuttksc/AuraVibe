import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api.js";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "../ui/spinner";
import { UsernameSetupDialog } from "../username-setup-dialog";

// This will automatically run and store the user
function useUpdateCurrentUserEffect() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useAuth();
  const sub = user?.profile.sub;
  const updateCurrentUser = useMutation(api.users.updateCurrentUser);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userCreated, setUserCreated] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setUserCreated(false);
      return;
    }
    async function createUser() {
      setIsCreatingUser(true);
      try {
        await updateCurrentUser();
        setUserCreated(true);
      } finally {
        setIsCreatingUser(false);
      }
    }
    createUser();
  }, [isAuthenticated, updateCurrentUser, sub]);

  return { isCreatingUser, userCreated };
}

function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-[100svh]">
      <Spinner className="size-8" />
    </div>
  );
}

// Component that automatically stores the user when authenticated
export function UpdateCurrentUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const { isCreatingUser, userCreated } = useUpdateCurrentUserEffect();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated && userCreated ? {} : "skip"
  );

  // State 1: User unauthenticated - render children
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // State 2: User authenticated but not in DB yet - show loading
  if (isAuthenticated && (!userCreated || isCreatingUser)) {
    return <LoadingPage />;
  }

  // State 3: User authenticated and exists in DB but no username - show setup dialog
  if (currentUser && !currentUser.username) {
    return (
      <>
        <UsernameSetupDialog open={true} currentUser={currentUser} />
        {children}
      </>
    );
  }

  // State 4: User authenticated, exists in DB, and has username - render children
  return <>{children}</>;
}

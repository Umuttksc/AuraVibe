import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { useState, useEffect, Suspense } from "react";
import SplashScreen from "./components/splash-screen.tsx";
import LanguageWrapper from "./components/providers/language-wrapper.tsx";
import { SAVED_OR_DEFAULT_LANGUAGE, setLanguageInPath } from "./i18n";
import "./i18n";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import HomePage from "./pages/home/page.tsx";
import ProfilePage from "./pages/profile/page.tsx";
import SearchPage from "./pages/search/page.tsx";
import MessagesPage from "./pages/messages/page.tsx";
import SettingsPage from "./pages/settings/page.tsx";
import HealthPage from "./pages/health/page.tsx";
import WeatherPage from "./pages/weather/page.tsx";
import SpiritualPage from "./pages/spiritual/page.tsx";
import WellnessPage from "./pages/wellness/page.tsx";
import ChatbotPage from "./pages/chatbot/page.tsx";
import AdminPage from "./pages/admin/page.tsx";
import AdminSetup from "./pages/admin/setup.tsx";
import SavedPostsPage from "./pages/saved-posts/page.tsx";
import HashtagPage from "./pages/hashtag/page.tsx";
import CommunitiesPage from "./pages/communities/page.tsx";
import CommunityDetailPage from "./pages/communities/detail.tsx";
import PollsPage from "./pages/polls/page.tsx";
import BlockedUsersPage from "./pages/blocked-users/page.tsx";
import AdminReportsPage from "./pages/admin/reports.tsx";
import NotificationPreferencesPage from "./pages/notifications/page.tsx";
import VerificationRequestPage from "./pages/verification-request/page.tsx";
import AdminVerificationPage from "./pages/admin/verification.tsx";
import AdminSettingsPage from "./pages/admin/settings.tsx";
import AdminFortunePricingPage from "./pages/admin/fortune-pricing/page.tsx";
import AdminFortuneSettingsPage from "./pages/admin/fortune-settings.tsx";
import AdminPremiumSettingsPage from "./pages/admin/premium-settings/page.tsx";
import AdminGiftsPage from "./pages/admin/gifts/page.tsx";
import AdminGiftSettingsPage from "./pages/admin/gift-settings/page.tsx";
import AdminWalletSettingsPage from "./pages/admin/wallet-settings/page.tsx";
import AdminPermissionsPage from "./pages/admin/permissions/page.tsx";
import AdminTokenSettingsPage from "./pages/admin/token-settings/page.tsx";
import AdminContentModerationPage from "./pages/admin/content-moderation/page.tsx";
import AdminFortuneAnalyticsPage from "./pages/admin/fortune-analytics.tsx";
import IslamicChatPage from "./pages/islamic-chat/page.tsx";
import AnalyticsPage from "./pages/analytics/page.tsx";
import AchievementsPage from "./pages/achievements/page.tsx";
import WellnessTrackingPage from "./pages/wellness-tracking/page.tsx";
import MoodTrackingPage from "./pages/wellness-tracking/mood/page.tsx";
import WalletPage from "./pages/wallet/page.tsx";
import SocialPlayPage from "./pages/social-play/page.tsx";
import TicTacToePage from "./pages/games/tictactoe/page.tsx";
import MemoryGamePage from "./pages/games/memory/page.tsx";
import ConnectFourGamePage from "./pages/games/connect-four/page.tsx";
import SudokuGamePage from "./pages/games/sudoku/page.tsx";
import WordGuessGamePage from "./pages/games/word-guess/page.tsx";
import QuizGamePage from "./pages/games/quiz/page.tsx";
import MinesweeperGamePage from "./pages/games/minesweeper/page.tsx";
import CheckersGamePage from "./pages/games/checkers/page.tsx";
import ChessLobbyPage from "./pages/games/chess-lobby/page.tsx";
import ChessGamePage from "./pages/games/chess/page.tsx";
import QuickDrawLobbyPage from "./pages/games/quick-draw-lobby/page.tsx";
import QuickDrawGamePage from "./pages/games/quick-draw/page.tsx";
import PuzzleLobbyPage from "./pages/games/puzzle-lobby/page.tsx";
import PuzzleGamePage from "./pages/games/puzzle/page.tsx";
import EditPostPage from "./pages/edit-post/page.tsx";
import PrivacyPage from "./pages/privacy/page.tsx";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownSplash, setHasShownSplash] = useState(false);

  useEffect(() => {
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) {
      setShowSplash(false);
      setHasShownSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
    setHasShownSplash(true);
  };

  return (
    <DefaultProviders>
      {showSplash && !hasShownSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      <BrowserRouter>
        <Suspense fallback={<div></div>}>
          <Routes>
            {/* Root: redirect to saved/default language */}
            <Route
              path="/"
              element={
                <Navigate
                  to={setLanguageInPath(SAVED_OR_DEFAULT_LANGUAGE, "/")}
                  replace
                />
              }
            />

            {/* Non-localized routes (auth callbacks, webhooks, etc.) */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* All localized routes under /:lng */}
            <Route
              path="/:lng"
              element={
                <LanguageWrapper>
                  <Outlet />
                </LanguageWrapper>
              }
            >
              <Route index element={<Index />} />
              <Route path="home" element={<HomePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="notifications" element={<NotificationPreferencesPage />} />
              <Route path="verification-request" element={<VerificationRequestPage />} />
              <Route path="health" element={<HealthPage />} />
              <Route path="weather" element={<WeatherPage />} />
              <Route path="spiritual" element={<SpiritualPage />} />
              <Route path="wellness" element={<WellnessPage />} />
              <Route path="islamic-chat" element={<IslamicChatPage />} />
              <Route path="chatbot" element={<ChatbotPage />} />
              <Route path="saved" element={<SavedPostsPage />} />
              <Route path="hashtag/:tag" element={<HashtagPage />} />
              <Route path="communities" element={<CommunitiesPage />} />
              <Route path="communities/:id" element={<CommunityDetailPage />} />
              <Route path="polls" element={<PollsPage />} />
              <Route path="blocked-users" element={<BlockedUsersPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="wellness-tracking" element={<WellnessTrackingPage />} />
              <Route path="wellness-tracking/mood" element={<MoodTrackingPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="social-play" element={<SocialPlayPage />} />
              <Route path="games/tictactoe" element={<TicTacToePage />} />
              <Route path="games/memory" element={<MemoryGamePage />} />
              <Route path="games/connect-four" element={<ConnectFourGamePage />} />
              <Route path="games/sudoku" element={<SudokuGamePage />} />
              <Route path="games/word-guess" element={<WordGuessGamePage />} />
              <Route path="games/quiz" element={<QuizGamePage />} />
              <Route path="games/minesweeper" element={<MinesweeperGamePage />} />
              <Route path="games/checkers" element={<CheckersGamePage />} />
              <Route path="games/chess-lobby" element={<ChessLobbyPage />} />
              <Route path="games/chess/:gameId" element={<ChessGamePage />} />
              <Route path="games/quick-draw-lobby" element={<QuickDrawLobbyPage />} />
              <Route path="games/quick-draw/:gameId" element={<QuickDrawGamePage />} />
              <Route path="games/puzzle-lobby" element={<PuzzleLobbyPage />} />
              <Route path="games/puzzle/:gameId" element={<PuzzleGamePage />} />
              <Route path="edit-post/:postId" element={<EditPostPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="admin/reports" element={<AdminReportsPage />} />
              <Route path="admin/setup" element={<AdminSetup />} />
              <Route path="admin/verification" element={<AdminVerificationPage />} />
              <Route path="admin/settings" element={<AdminSettingsPage />} />
              <Route path="admin/fortune-pricing" element={<AdminFortunePricingPage />} />
              <Route path="admin/fortune-settings" element={<AdminFortuneSettingsPage />} />
              <Route path="admin/premium-settings" element={<AdminPremiumSettingsPage />} />
              <Route path="admin/gifts" element={<AdminGiftsPage />} />
              <Route path="admin/gift-settings" element={<AdminGiftSettingsPage />} />
              <Route path="admin/wallet-settings" element={<AdminWalletSettingsPage />} />
              <Route path="admin/token-settings" element={<AdminTokenSettingsPage />} />
              <Route path="admin/permissions" element={<AdminPermissionsPage />} />
              <Route path="admin/content-moderation" element={<AdminContentModerationPage />} />
              <Route path="admin/fortune-analytics" element={<AdminFortuneAnalyticsPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DefaultProviders>
  );
}

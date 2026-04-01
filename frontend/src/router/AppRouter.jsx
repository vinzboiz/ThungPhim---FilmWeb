import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ProfileSelectPage from '../pages/ProfileSelectPage.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';
import { useAuth } from '../hooks/useAuth.js';

const ContentDetailPage = lazy(() => import('../pages/ContentDetailPage.jsx'));
const PersonDetailPage = lazy(() => import('../pages/PersonDetailPage.jsx'));
const MyListPage = lazy(() => import('../pages/MyListPage.jsx'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage.jsx'));
const SearchPage = lazy(() => import('../pages/SearchPage.jsx'));
const GenresPage = lazy(() => import('../pages/GenresPage.jsx'));
const WatchEpisodePage = lazy(() => import('../pages/WatchEpisodePage.jsx'));
const WatchMoviePage = lazy(() => import('../pages/WatchMoviePage.jsx'));
const WatchHistoryPage = lazy(() => import('../pages/WatchHistoryPage.jsx'));
const AccountPage = lazy(() => import('../pages/AccountPage.jsx'));

const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage.jsx'));
const AdminMoviesPage = lazy(() => import('../pages/AdminMoviesPage.jsx'));
const AdminAddMoviePage = lazy(() => import('../pages/AdminAddMoviePage.jsx'));
const AdminEditMoviePage = lazy(() => import('../pages/AdminEditMoviePage.jsx'));
const AdminGenresPage = lazy(() => import('../pages/AdminGenresPage.jsx'));
const AdminPersonsPage = lazy(() => import('../pages/AdminPersonsPage.jsx'));
const AdminSeriesListPage = lazy(() => import('../pages/AdminSeriesListPage.jsx'));
const AdminAddSeriesPage = lazy(() => import('../pages/AdminAddSeriesPage.jsx'));
const AdminSeriesDetailPage = lazy(() => import('../pages/AdminSeriesDetailPage.jsx'));
const AdminEditSeriesPage = lazy(() => import('../pages/AdminEditSeriesPage.jsx'));
const AdminEditEpisodePage = lazy(() => import('../pages/AdminEditEpisodePage.jsx'));
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage.jsx'));

const adminSuspenseFallback = (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.75)' }}>Đang tải trang quản trị…</div>
);

const pageSuspenseFallback = (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.75)' }}>Đang tải…</div>
);

function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function UserRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={(
            <MainLayout>
              <HomePage />
            </MainLayout>
          )}
        />
        <Route
          path="/series"
          element={(
            <MainLayout>
              <HomePage />
            </MainLayout>
          )}
        />
        <Route
          path="/movies"
          element={(
            <MainLayout>
              <HomePage />
            </MainLayout>
          )}
        />
        <Route
          path="/browse/new"
          element={(
            <MainLayout>
              <HomePage />
            </MainLayout>
          )}
        />
        <Route
          path="/login"
          element={(
            <MainLayout>
              <LoginPage />
            </MainLayout>
          )}
        />
        <Route
          path="/register"
          element={(
            <MainLayout>
              <RegisterPage />
            </MainLayout>
          )}
        />
        <Route
          path="/profiles"
          element={(
            <MainLayout>
              <ProfileSelectPage />
            </MainLayout>
          )}
        />
        <Route
          path="/movies/:id"
          element={(
            <MainLayout>
              <Suspense fallback={pageSuspenseFallback}>
                <ContentDetailPage />
              </Suspense>
            </MainLayout>
          )}
        />
        <Route
          path="/series/:id"
          element={(
            <MainLayout>
              <Suspense fallback={pageSuspenseFallback}>
                <ContentDetailPage />
              </Suspense>
            </MainLayout>
          )}
        />
        <Route
          path="/persons/:id"
          element={(
            <MainLayout>
              <Suspense fallback={pageSuspenseFallback}>
                <PersonDetailPage />
              </Suspense>
            </MainLayout>
          )}
        />
        <Route
          path="/my-list"
          element={(
            <UserRoute>
              <MainLayout>
                <Suspense fallback={pageSuspenseFallback}>
                  <MyListPage />
                </Suspense>
              </MainLayout>
            </UserRoute>
          )}
        />
        <Route
          path="/favorites"
          element={(
            <UserRoute>
              <MainLayout>
                <Suspense fallback={pageSuspenseFallback}>
                  <FavoritesPage />
                </Suspense>
              </MainLayout>
            </UserRoute>
          )}
        />
        <Route
          path="/search"
          element={(
            <MainLayout>
              <Suspense fallback={pageSuspenseFallback}>
                <SearchPage />
              </Suspense>
            </MainLayout>
          )}
        />
        <Route
          path="/browse/:type"
          element={(
            <MainLayout>
              <HomePage />
            </MainLayout>
          )}
        />
        <Route
          path="/genres"
          element={(
            <MainLayout>
              <Suspense fallback={pageSuspenseFallback}>
                <GenresPage />
              </Suspense>
            </MainLayout>
          )}
        />
        <Route
          path="/watch/movie/:id"
          element={(
            <UserRoute>
              <MainLayout>
                <Suspense fallback={pageSuspenseFallback}>
                  <WatchMoviePage />
                </Suspense>
              </MainLayout>
            </UserRoute>
          )}
        />
        <Route
          path="/watch/episode/:episodeId"
          element={(
            <UserRoute>
              <MainLayout>
                <Suspense fallback={pageSuspenseFallback}>
                  <WatchEpisodePage />
                </Suspense>
              </MainLayout>
            </UserRoute>
          )}
        />
        <Route
          path="/history"
          element={(
            <UserRoute>
              <MainLayout>
                <Suspense fallback={pageSuspenseFallback}>
                  <WatchHistoryPage />
                </Suspense>
              </MainLayout>
            </UserRoute>
          )}
        />
        <Route
          path="/account"
          element={(
            <MainLayout>
              <Suspense fallback={pageSuspenseFallback}>
                <AccountPage />
              </Suspense>
            </MainLayout>
          )}
        />
        <Route
          path="/admin"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminDashboardPage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/movies"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminMoviesPage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/movies/new"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminAddMoviePage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/movies/:id/edit"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminEditMoviePage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/series"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminSeriesListPage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/series/new"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminAddSeriesPage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/series/:id/edit"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminEditSeriesPage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/series/:id/episode/:episodeId/edit"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminEditEpisodePage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/series/:id"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminSeriesDetailPage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/genres"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminGenresPage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/persons"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminPersonsPage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/users"
          element={(
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={adminSuspenseFallback}>
                  <AdminUsersPage />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;

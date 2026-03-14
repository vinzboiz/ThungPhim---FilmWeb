import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ProfileSelectPage from '../pages/ProfileSelectPage.jsx';
import MovieDetailPage from '../pages/MovieDetailPage.jsx';
import SeriesDetailPage from '../pages/SeriesDetailPage.jsx';
import PersonDetailPage from '../pages/PersonDetailPage.jsx';
import MyListPage from '../pages/MyListPage.jsx';
import FavoritesPage from '../pages/FavoritesPage.jsx';
import AdminAddMoviePage from '../pages/AdminAddMoviePage.jsx';
import AdminMoviesPage from '../pages/AdminMoviesPage.jsx';
import AdminEditMoviePage from '../pages/AdminEditMoviePage.jsx';
import AdminGenresPage from '../pages/AdminGenresPage.jsx';
import AdminPersonsPage from '../pages/AdminPersonsPage.jsx';
import AdminSeriesListPage from '../pages/AdminSeriesListPage.jsx';
import AdminSeriesDetailPage from '../pages/AdminSeriesDetailPage.jsx';
import AdminEditSeriesPage from '../pages/AdminEditSeriesPage.jsx';
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx';
import SearchPage from '../pages/SearchPage.jsx';
import WatchEpisodePage from '../pages/WatchEpisodePage.jsx';
import WatchHistoryPage from '../pages/WatchHistoryPage.jsx';
import AccountPage from '../pages/AccountPage.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';

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
              <MovieDetailPage />
            </MainLayout>
          )}
        />
        <Route
          path="/series/:id"
          element={(
            <MainLayout>
              <SeriesDetailPage />
            </MainLayout>
          )}
        />
        <Route
          path="/persons/:id"
          element={(
            <MainLayout>
              <PersonDetailPage />
            </MainLayout>
          )}
        />
        <Route
          path="/my-list"
          element={(
            <MainLayout>
              <MyListPage />
            </MainLayout>
          )}
        />
        <Route
          path="/favorites"
          element={(
            <MainLayout>
              <FavoritesPage />
            </MainLayout>
          )}
        />
        <Route
          path="/search"
          element={(
            <MainLayout>
              <SearchPage />
            </MainLayout>
          )}
        />
        <Route
          path="/watch/episode/:episodeId"
          element={(
            <MainLayout>
              <WatchEpisodePage />
            </MainLayout>
          )}
        />
        <Route
          path="/history"
          element={(
            <MainLayout>
              <WatchHistoryPage />
            </MainLayout>
          )}
        />
        <Route
          path="/account"
          element={(
            <MainLayout>
              <AccountPage />
            </MainLayout>
          )}
        />
        <Route
          path="/admin"
          element={(
            <MainLayout>
              <AdminDashboardPage />
            </MainLayout>
          )}
        />
        <Route
          path="/admin/movies"
          element={(
            <MainLayout>
              <AdminMoviesPage />
            </MainLayout>
          )}
        />
        <Route
          path="/admin/movies/new"
          element={(
            <MainLayout>
              <AdminAddMoviePage />
            </MainLayout>
          )}
        />
        <Route
          path="/admin/movies/:id/edit"
          element={(
            <MainLayout>
              <AdminEditMoviePage />
            </MainLayout>
          )}
        />
        <Route
          path="/admin/series"
          element={(
            <MainLayout>
              <AdminSeriesListPage />
            </MainLayout>
          )}
        />
        <Route
          path="/admin/series/:id/edit"
          element={(
            <MainLayout>
              <AdminEditSeriesPage />
            </MainLayout>
          )}
        />
        <Route
          path="/admin/series/:id"
          element={(
            <MainLayout>
              <AdminSeriesDetailPage />
            </MainLayout>
          )}
        />
        <Route
          path="/admin/genres"
          element={(
            <MainLayout>
              <AdminGenresPage />
            </MainLayout>
          )}
        />
        <Route
          path="/admin/persons"
          element={(
            <MainLayout>
              <AdminPersonsPage />
            </MainLayout>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;



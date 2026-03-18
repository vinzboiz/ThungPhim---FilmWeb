const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const profilesRoutes = require('./routes/profiles.routes');
const moviesRoutes = require('./routes/movies.routes');
const seriesRoutes = require('./routes/series.routes');
const episodesRoutes = require('./routes/episodes.routes');
const watchRoutes = require('./routes/watch.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const personsRoutes = require('./routes/persons.routes');
const uploadRoutes = require('./routes/upload.routes');
const genresRoutes = require('./routes/genres.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const adminRoutes = require('./routes/admin.routes');
const countriesRoutes = require('./routes/countries.routes');
const heroRoutes = require('./routes/hero.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files for uploaded videos/thumbnails
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Test DB connection on startup (non-blocking)
testConnection();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/episodes', episodesRoutes);
app.use('/api/watch', watchRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/persons', personsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/genres', genresRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/hero', heroRoutes);

module.exports = app;


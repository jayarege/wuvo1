import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../Screens/Home';
import TopRatedScreen from '../Screens/TopRated';
import WatchlistScreen from '../Screens/Watchlist';
import AddMovieScreen from '../Screens/AddMovie';
import WildcardScreen from '../Screens/Wildcard';

const Tab = createBottomTabNavigator();

function TabNavigator({
  seen,
  unseen,
  setSeen,
  setUnseen,
  genres,
  isDarkMode,
  toggleTheme,
  skippedMovies = [],
  addToSkippedMovies = () => {},
  removeFromSkippedMovies = () => {},
  newReleases = []
}) {
  // Upsert into seen, remove from unseen/skipped
  const handleAddToSeen = newMovie => {
    setSeen(prev => {
      const exists = prev.some(m => m.id === newMovie.id);
      if (exists) {
        return prev.map(m => (m.id === newMovie.id ? newMovie : m));
      }
      return [...prev, newMovie];
    });
    if (unseen.some(m => m.id === newMovie.id)) {
      setUnseen(prev => prev.filter(m => m.id !== newMovie.id));
    }
    if (skippedMovies.includes(newMovie.id)) {
      removeFromSkippedMovies(newMovie.id);
    }
  };

  // Append to unseen (no overwrite), remove from skipped
  const handleAddToUnseen = newMovie => {
    setUnseen(prev => {
      const exists = prev.some(m => m.id === newMovie.id);
      return exists ? prev : [...prev, newMovie];
    });
    if (skippedMovies.includes(newMovie.id)) {
      removeFromSkippedMovies(newMovie.id);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'TopRated':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Watchlist':
              iconName = focused ? 'eye-off' : 'eye-off-outline';
              break;
            case 'AddMovie':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Wildcard':
              iconName = focused ? 'star' : 'star-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isDarkMode ? '#FFD700' : '#4B0082',
        tabBarInactiveTintColor: isDarkMode ? '#D3D3D3' : '#A9A9A9',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#4B0082' : '#E0E0E0',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" options={{ title: 'Home' }}>
        {props => (
          <HomeScreen
            {...props}
            seen={seen}
            unseen={unseen}
            onAddToSeen={handleAddToSeen}
            onAddToUnseen={handleAddToUnseen}
            genres={genres}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            newReleases={newReleases}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="TopRated" options={{ title: 'Top 10' }}>
        {props => (
          <TopRatedScreen
            {...props}
            movies={seen}
            genres={genres || {}}
            onUpdateRating={(movieId, newRating) => {
              const movie = seen.find(m => m.id === movieId);
              if (movie) {
                handleAddToSeen({
                  ...movie,
                  userRating: newRating,
                  eloRating: newRating * 100,
                });
              }
            }}
            isDarkMode={isDarkMode}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Watchlist" options={{ title: 'Watchlist' }}>
        {props => (
          <WatchlistScreen
            {...props}
            movies={unseen}
            genres={genres}
            isDarkMode={isDarkMode}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="AddMovie" options={{ title: 'Add Movie' }}>
        {props => (
          <AddMovieScreen
            {...props}
            seen={seen}
            unseen={unseen}
            onAddToSeen={handleAddToSeen}
            onAddToUnseen={handleAddToUnseen}
            genres={genres}
            isDarkMode={isDarkMode}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Wildcard"
        options={{ title: 'Wildcard', unmountOnBlur: true }}
      >
        {props => (
          <WildcardScreen
            {...props}
            seen={seen}
            unseen={unseen}
            onAddToSeen={handleAddToSeen}
            onAddToUnseen={handleAddToUnseen}
            genres={genres}
            isDarkMode={isDarkMode}
            skippedMovies={skippedMovies}
            addToSkippedMovies={addToSkippedMovies}
            removeFromSkippedMovies={removeFromSkippedMovies}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default TabNavigator;

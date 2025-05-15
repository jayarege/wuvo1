import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screen components
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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TopRated') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Watchlist') {
            iconName = focused ? 'eye-off' : 'eye-off-outline';
          } else if (route.name === 'AddMovie') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Wildcard') {
            iconName = focused ? 'star' : 'star-outline';
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
            onAddToSeen={(newMovie) => {
              console.log("Adding to seen from Home:", newMovie.title);
              // Check for duplicates
              if (!seen.some(movie => movie.id === newMovie.id)) {
                setSeen([...seen, newMovie]);
              }
            }}
            onAddToUnseen={(newMovie) => {
              console.log("Adding to watchlist from Home:", newMovie.title);
              // Check for duplicates
              if (!unseen.some(movie => movie.id === newMovie.id)) {
                setUnseen([...unseen, newMovie]);
              }
            }}
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
        const updatedSeen = seen.map(m =>
          m.id === movieId
            ? { ...m, userRating: newRating, eloRating: newRating * 100 }
            : m
        );
        setSeen(updatedSeen);
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
            onAddToSeen={(newMovie) => {
              console.log("Adding to seen:", newMovie.title);
              // Check if it's an array (for batch updates)
              if (Array.isArray(newMovie)) {
                setSeen(newMovie);
                return;
              }
              
              // Check if it's an update to an existing movie
              if (seen.some(movie => movie.id === newMovie.id)) {
                // Update the movie
                const updatedSeen = seen.map(movie => 
                  movie.id === newMovie.id ? newMovie : movie
                );
                setSeen(updatedSeen);
              } else {
                // Add new movie
                setSeen([...seen, newMovie]);
              }
              
              // If it was in watchlist, remove it
              if (unseen.some(movie => movie.id === newMovie.id)) {
                const filteredUnseen = unseen.filter(m => m.id !== newMovie.id);
                setUnseen(filteredUnseen);
              }
              
              // Remove from skipped if it was skipped before
              if (skippedMovies.includes(newMovie.id)) {
                removeFromSkippedMovies(newMovie.id);
              }
            }}
            onAddToUnseen={(newMovie) => {
              console.log("Adding to watchlist:", newMovie.title);
              // Check if it's an array (for batch updates)
              if (Array.isArray(newMovie)) {
                setUnseen(newMovie);
                return;
              }
              
              // Don't add if already in seen list
              if (seen.some(movie => movie.id === newMovie.id)) {
                return;
              }
              
              // Check for duplicates
              if (!unseen.some(movie => movie.id === newMovie.id)) {
                setUnseen([...unseen, newMovie]);
              }
              
              // Remove from skipped if it was skipped before
              if (skippedMovies.includes(newMovie.id)) {
                removeFromSkippedMovies(newMovie.id);
              }
            }}
            genres={genres}
            isDarkMode={isDarkMode}
          />
        )}
      </Tab.Screen>
      
      <Tab.Screen name="Wildcard" options={{ title: 'Wildcard', unmountOnBlur: true }}>
        {props => (
          <WildcardScreen
            {...props}
            seen={seen}
            setSeen={setSeen}
            unseen={unseen}
            onAddToSeen={newMovie => {
              console.log("Adding to seen from wildcard:", newMovie.title);
              // Check for duplicates
              if (!seen.some(movie => movie.id === newMovie.id)) {
                setSeen([...seen, newMovie]);
                // Remove from skipped if it was skipped before
                if (skippedMovies.includes(newMovie.id)) {
                  removeFromSkippedMovies(newMovie.id);
                }
              }
            }}
            onAddToUnseen={newMovie => {
              console.log("Adding to watchlist from wildcard:", newMovie.title);
              // Check for duplicates
              if (!unseen.some(movie => movie.id === newMovie.id)) {
                setUnseen([...unseen, newMovie]);
                // Remove from skipped if it was skipped before
                if (skippedMovies.includes(newMovie.id)) {
                  removeFromSkippedMovies(newMovie.id);
                }
              }
            }}
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
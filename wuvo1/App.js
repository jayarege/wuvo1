import React, { useState, useCallback, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Import screens
import LoadingScreen from './src/Screens/LoadingScreen';
import AuthScreen from './src/Screens/AuthScreen';
import TabNavigator from './src/Navigation/TabNavigator';
import OnboardingScreen from './src/Screens/OnboardingScreen';

// Import constants from WildcardScreen to ensure consistency
import { 
  STORAGE_KEY, 
  BASELINE_COMPLETE_KEY, 
  COMPARISON_COUNT_KEY, 
  COMPARISON_PATTERN_KEY, 
  SKIPPED_MOVIES_KEY 
} from './src/Screens/Wildcard';

const Stack = createStackNavigator();

// Storage keys
const USER_SESSION_KEY = 'wuvo_user_session';
const USER_DATA_KEY = 'wuvo_user_data';
const USER_SEEN_MOVIES_KEY = 'wuvo_user_seen_movies';
const USER_UNSEEN_MOVIES_KEY = 'wuvo_user_unseen_movies';
const USER_PREFERENCES_KEY = 'wuvo_user_preferences';
const ONBOARDING_COMPLETE_KEY = 'wuvo_onboarding_complete';

// Sample data for initial state
const initialGenres = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Main App Component
export default function App() {
  // App state
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [userInfo, setUserInfo] = useState(null);
  
  // Movie data state
  const [seen, setSeen] = useState([]);
  const [unseen, setUnseen] = useState([]);
  const [genres, setGenres] = useState(initialGenres);
  
  // Track if app is ready and first load is complete
  const [appReady, setAppReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Onboarding state
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Reset wildcard state function (can be called in case of emergency)
  const resetWildcardState = useCallback(async () => {
    try {
      console.log("Resetting wildcard state...");
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(BASELINE_COMPLETE_KEY);
      await AsyncStorage.removeItem(COMPARISON_COUNT_KEY);
      await AsyncStorage.removeItem(COMPARISON_PATTERN_KEY);
      await AsyncStorage.removeItem(SKIPPED_MOVIES_KEY);
      console.log("Wildcard state reset successfully");
      
      // Show confirmation
      Alert.alert(
        "Reset Complete",
        "Movie comparison data has been reset successfully.",
        [{ text: "OK" }]
      );
    } catch (e) {
      console.error('Failed to reset wildcard state', e);
      Alert.alert(
        "Reset Failed",
        "There was a problem resetting comparison data.",
        [{ text: "OK" }]
      );
    }
  }, []);

  // Reset all user data (for debugging and testing)
  const resetAllUserData = useCallback(async () => {
    try {
      // Reset comparison data
      await resetWildcardState();
      
      // Reset user movie data
      if (userInfo?.id) {
        const userId = userInfo.id;
        await AsyncStorage.removeItem(`${USER_SEEN_MOVIES_KEY}_${userId}`);
        await AsyncStorage.removeItem(`${USER_UNSEEN_MOVIES_KEY}_${userId}`);
        await AsyncStorage.removeItem(`${USER_PREFERENCES_KEY}_${userId}`);
        await AsyncStorage.removeItem(`${USER_DATA_KEY}_${userId}`);
        await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
      }
      
      // Reset movie lists in memory
      setSeen([]);
      setUnseen([]);
      setOnboardingComplete(false);
      
      console.log("All user data has been reset");
      Alert.alert(
        "Reset Complete",
        "All user data has been reset successfully.",
        [{ text: "OK" }]
      );
    } catch (e) {
      console.error('Failed to reset all user data:', e);
      Alert.alert(
        "Reset Failed",
        "There was a problem resetting user data.",
        [{ text: "OK" }]
      );
    }
  }, [resetWildcardState, userInfo]);

  // Save all user data to AsyncStorage
  const saveUserData = useCallback(async () => {
    if (!isAuthenticated || !userInfo?.id) return;
    
    try {
      const userId = userInfo.id;
      console.log(`Saving data for user ${userId}...`);
      
      // Save seen movies
      if (seen.length > 0) {
        await AsyncStorage.setItem(`${USER_SEEN_MOVIES_KEY}_${userId}`, JSON.stringify(seen));
        console.log(`Saved ${seen.length} seen movies`);
      }
      
      // Save unseen movies (watchlist)
      if (unseen.length > 0) {
        await AsyncStorage.setItem(`${USER_UNSEEN_MOVIES_KEY}_${userId}`, JSON.stringify(unseen));
        console.log(`Saved ${unseen.length} unseen movies`);
      }
      
      // Save preferences
      const preferences = {
        isDarkMode,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(`${USER_PREFERENCES_KEY}_${userId}`, JSON.stringify(preferences));
      
      // Save complete data snapshot for backup
      const completeData = {
        seen,
        unseen,
        preferences,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(`${USER_DATA_KEY}_${userId}`, JSON.stringify(completeData));
      
      // Save onboarding status
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, onboardingComplete.toString());
      
      console.log("All user data saved successfully");
    } catch (e) {
      console.error('Failed to save user data:', e);
    }
  }, [seen, unseen, isDarkMode, isAuthenticated, userInfo, onboardingComplete]);

  // Load all user data from AsyncStorage
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || !userInfo?.id) return;
    
    try {
      const userId = userInfo.id;
      console.log(`Loading data for user ${userId}...`);
      
      // Load seen movies
      const seenData = await AsyncStorage.getItem(`${USER_SEEN_MOVIES_KEY}_${userId}`);
      if (seenData) {
        const parsedSeen = JSON.parse(seenData);
        if (Array.isArray(parsedSeen) && parsedSeen.length > 0) {
          setSeen(parsedSeen);
          console.log(`Loaded ${parsedSeen.length} seen movies`);
        }
      }
      
      // Load unseen movies (watchlist)
      const unseenData = await AsyncStorage.getItem(`${USER_UNSEEN_MOVIES_KEY}_${userId}`);
      if (unseenData) {
        const parsedUnseen = JSON.parse(unseenData);
        if (Array.isArray(parsedUnseen) && parsedUnseen.length > 0) {
          setUnseen(parsedUnseen);
          console.log(`Loaded ${parsedUnseen.length} unseen movies`);
        }
      }
      
      // Load preferences
      const preferencesData = await AsyncStorage.getItem(`${USER_PREFERENCES_KEY}_${userId}`);
      if (preferencesData) {
        const parsedPreferences = JSON.parse(preferencesData);
        if (parsedPreferences.isDarkMode !== undefined) {
          setIsDarkMode(parsedPreferences.isDarkMode);
          console.log(`Loaded theme preference: ${parsedPreferences.isDarkMode ? 'dark' : 'light'}`);
        }
      }
      
      // If individual data pieces failed, try the complete backup
      if (!seenData && !unseenData) {
        const completeData = await AsyncStorage.getItem(`${USER_DATA_KEY}_${userId}`);
        if (completeData) {
          const parsedCompleteData = JSON.parse(completeData);
          
          if (parsedCompleteData.seen && Array.isArray(parsedCompleteData.seen)) {
            setSeen(parsedCompleteData.seen);
            console.log(`Loaded ${parsedCompleteData.seen.length} seen movies from backup`);
          }
          
          if (parsedCompleteData.unseen && Array.isArray(parsedCompleteData.unseen)) {
            setUnseen(parsedCompleteData.unseen);
            console.log(`Loaded ${parsedCompleteData.unseen.length} unseen movies from backup`);
          }
          
          if (parsedCompleteData.preferences && parsedCompleteData.preferences.isDarkMode !== undefined) {
            setIsDarkMode(parsedCompleteData.preferences.isDarkMode);
            console.log(`Loaded theme preference from backup: ${parsedCompleteData.preferences.isDarkMode ? 'dark' : 'light'}`);
          }
        }
      }
      
      // Load onboarding status
      const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      if (onboardingStatus === 'true') {
        setOnboardingComplete(true);
        console.log('Onboarding already completed');
      } else {
        setOnboardingComplete(false);
        console.log('Onboarding not completed yet');
      }
      
      // Mark data as loaded to prevent overwriting
      setDataLoaded(true);
      console.log("User data loaded successfully");
    } catch (e) {
      console.error('Failed to load user data:', e);
      // Mark data as loaded anyway to allow fresh start
      setDataLoaded(true);
    } finally {
      setCheckingOnboarding(false);
    }
  }, [isAuthenticated, userInfo]);

  // Check for existing session on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("Initializing app...");
        
        // First check for user session
        const userSession = await AsyncStorage.getItem(USER_SESSION_KEY);
        
        if (userSession) {
          // User is logged in
          const userData = JSON.parse(userSession);
          setUserInfo(userData);
          setIsAuthenticated(true);
          console.log("User authenticated:", userData.name);
        } else {
          console.log("No active session found");
          setCheckingOnboarding(false);
        }
        
        // Wait a bit for the splash screen effect (can be adjusted)
        setTimeout(() => {
          setIsLoading(false);
          setAppReady(true);
        }, 2000);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
        setAppReady(true);
        setCheckingOnboarding(false);
      }
    };
    
    initializeApp();
  }, []);

  // Effect to load user data when authenticated
  useEffect(() => {
    if (appReady && isAuthenticated && userInfo && !dataLoaded) {
      loadUserData();
    }
  }, [appReady, isAuthenticated, userInfo, dataLoaded, loadUserData]);

  // Effect to save user data when it changes
  useEffect(() => {
    // Only save if app is ready, user is authenticated, and data was already loaded
    if (appReady && isAuthenticated && dataLoaded) {
      // Debounce the save to avoid too many writes
      const saveTimer = setTimeout(() => {
        saveUserData();
      }, 500);
      
      return () => clearTimeout(saveTimer);
    }
  }, [appReady, isAuthenticated, dataLoaded, seen, unseen, isDarkMode, onboardingComplete, saveUserData]);

  // Function to handle loading screen completion
  const handleFinishLoading = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // Function to handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    setOnboardingComplete(true);
  }, []);

  // Function to handle successful authentication
  const handleAuthentication = useCallback(async (userData = {}) => {
    console.log("Authentication successful, navigating to main app");
    
    // Save minimal user data
    const userSession = {
      id: userData.id || 'user-' + Math.random().toString(36).substring(2, 9),
      email: userData.email || 'user@example.com',
      name: userData.name || 'User',
      authenticated: true,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(userSession));
      
      // Update state
      setUserInfo(userSession);
      setIsAuthenticated(true);
      
      // Reset data loaded flag to trigger loading user data
      setDataLoaded(false);
      
      // Check onboarding status
      const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      if (onboardingStatus === 'true') {
        setOnboardingComplete(true);
      } else {
        setOnboardingComplete(false);
      }
      setCheckingOnboarding(false);
    } catch (error) {
      console.error('Failed to save user session:', error);
      // Still authenticate for demo purposes
      setUserInfo(userSession);
      setIsAuthenticated(true);
      setDataLoaded(false);
      setCheckingOnboarding(false);
    }
  }, []);

  // Function to handle logout
  const handleLogout = useCallback(async () => {
    // Save data before logging out
    if (isAuthenticated && userInfo) {
      await saveUserData();
    }
    
    try {
      // Clear session from storage
      await AsyncStorage.removeItem(USER_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear user session:', error);
    } finally {
      // Update state regardless of AsyncStorage success
      setUserInfo(null);
      setIsAuthenticated(false);
      setSeen([]);
      setUnseen([]);
      setDataLoaded(false);
      setCheckingOnboarding(true);
    }
  }, [isAuthenticated, userInfo, saveUserData]);

  // Function to toggle theme
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);
  
  // Enhanced function for adding to seen movies
  const handleAddToSeen = useCallback((newMovie) => {
    console.log("Adding to seen:", newMovie.title);
    
    // Check if movie is already in the seen list
    const existingIndex = seen.findIndex(m => m.id === newMovie.id);
    
    if (existingIndex >= 0) {
      // Movie already exists - update it
      const updatedSeen = [...seen];
      updatedSeen[existingIndex] = {
        ...updatedSeen[existingIndex],
        ...newMovie
      };
      setSeen(updatedSeen);
      console.log("Updated existing movie in seen list");
    } else {
      // New movie - add it
      setSeen(prev => [...prev, newMovie]);
      
      // Remove from unseen list if it was there
      if (unseen.some(m => m.id === newMovie.id)) {
        setUnseen(prev => prev.filter(m => m.id !== newMovie.id));
        console.log("Removed movie from unseen list");
      }
    }
  }, [seen, unseen]);
  
  // Enhanced function for adding to unseen movies
  const handleAddToUnseen = useCallback((newMovie) => {
    console.log("Adding to watchlist:", newMovie.title);
    
    // If it's an array, it's a replacement operation
    if (Array.isArray(newMovie)) {
      setUnseen(newMovie);
      return;
    }
    
    // Check if movie is already in the unseen list
    if (unseen.some(m => m.id === newMovie.id)) {
      console.log("Movie already in watchlist");
      return;
    }
    
    // Add to unseen list
    setUnseen(prev => [...prev, newMovie]);
  }, [unseen]);

  // First show loading screen
  if (isLoading) {
    return (
      <LoadingScreen 
        onFinishLoading={handleFinishLoading}
        isDarkMode={isDarkMode}
      />
    );
  }

  // After loading, navigate to Auth or Main based on authentication state
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            // Auth flow
            <Stack.Screen name="Auth">
              {props => (
                <AuthScreen 
                  {...props} 
                  isDarkMode={isDarkMode} 
                  onAuthenticate={handleAuthentication}
                />
              )}
            </Stack.Screen>
          ) : checkingOnboarding ? (
            // Loading screen while checking onboarding status
            <Stack.Screen name="CheckingOnboarding">
              {props => (
                <LoadingScreen 
                  onFinishLoading={() => {}} // No-op since we're waiting for onboarding check
                  isDarkMode={isDarkMode}
                />
              )}
            </Stack.Screen>
          ) : !onboardingComplete ? (
            // Onboarding flow
            <Stack.Screen name="Onboarding">
              {props => (
                <OnboardingScreen 
                  {...props}
                  isDarkMode={isDarkMode}
                  onComplete={handleOnboardingComplete}
                  onAddToSeen={handleAddToSeen}
                />
              )}
            </Stack.Screen>
          ) : (
            // Main app flow
            <Stack.Screen name="Main">
              {props => (
                <TabNavigator 
                  {...props}
                  seen={seen}
                  unseen={unseen}
                  setSeen={setSeen}
                  setUnseen={setUnseen}
                  genres={genres}
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  onLogout={handleLogout}
                  userInfo={userInfo}
                  // Pass the enhanced handlers
                  onAddToSeen={handleAddToSeen}
                  onAddToUnseen={handleAddToUnseen}
                  // Pass reset functions
                  resetWildcardState={resetWildcardState}
                  resetAllUserData={resetAllUserData}
                  // Pass data persistence functions
                  saveUserData={saveUserData}
                  loadUserData={loadUserData}
                  // Pass newReleases data - we'll simulate with recent highly-rated movies
                  newReleases={seen.length > 5 ? seen.slice(0, 10).map(m => ({
                    ...m,
                    vote_count: Math.floor(Math.random() * 5000) + 500,
                    release_date: m.release_date || new Date().toISOString().split('T')[0]
                  })) : unseen.slice(0, 10).map(m => ({
                    ...m,
                    vote_count: Math.floor(Math.random() * 5000) + 500,
                    release_date: m.release_date || new Date().toISOString().split('T')[0]
                  }))}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
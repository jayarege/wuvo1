import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  Modal,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all the styling modules
import layoutStyles from '../../Styles/layoutStyles';
import headerStyles from '../../Styles/headerStyles';
import compareStyles from '../../Styles/compareStyles';
import stateStyles from '../../Styles/StateStyles';
import movieCardStyles from '../../Styles/movieCardStyles';
import buttonStyles from '../../Styles/buttonStyles';
import modalStyles from '../../Styles/modalStyles';

// Constants for API and filtering
const API_KEY = 'b401be0ea16515055d8d0bde16f80069'; // TMDB API key for fetching movie data
const MIN_VOTE_COUNT = 500; // Minimum number of votes for a movie to be considered
const MIN_SCORE = 7.0; // Minimum TMDB score for recommended movies
const STORAGE_KEY = 'wuvo_compared_movies'; // Key to store which movies have been compared
const BASELINE_COMPLETE_KEY = 'wuvo_baseline_complete'; // Key to track if baseline ratings are done
const COMPARISON_COUNT_KEY = 'wuvo_comparison_count'; // Key to track total comparisons made
const COMPARISON_PATTERN_KEY = 'wuvo_comparison_pattern'; // Key to track comparison pattern (0-4 cycle)
const SKIPPED_MOVIES_KEY = 'wuvo_skipped_movies'; // Key to store skipped movies

// List of high-quality movies for initial baseline comparisons
// These are popular, well-regarded films to help establish user preferences
const baselineMovies = [
  { id: 238, title: "The Godfather" },
  { id: 155, title: "The Dark Knight" },
  { id: 120, title: "The Lord of the Rings: The Fellowship of the Ring" },
  { id: 121, title: "The Lord of the Rings: The Two Towers" },
  { id: 122, title: "The Lord of the Rings: The Return of the King" },
  { id: 27205, title: "Inception" },
  { id: 157336, title: "Interstellar" },
  // ... (continuing with the full list from original)
  { id: 98, title: "Gladiator" },
  { id: 37165, title: "The Departed" },
  { id: 244786, title: "Whiplash" },
  { id: 1124, title: "The Prestige" },
  { id: 68718, title: "Django Unchained" },
  { id: 438631, title: "Dune: Part Two" },
  { id: 10681, title: "WALL·E" },
  { id: 77, title: "Memento" },
  { id: 299536, title: "Avengers: Infinity War" },
  { id: 324857, title: "Spider-Man: Into the Spider-Verse" },
  { id: 569094, title: "Spider-Man: Across the Spider-Verse" },
  { id: 16869, title: "Inglourious Basterds" },
  { id: 49026, title: "The Dark Knight Rises" },
  { id: 354912, title: "Coco" },
  { id: 299534, title: "Avengers: Endgame" },
  { id: 475557, title: "Joker" },
  { id: 641, title: "Requiem for a Dream" },
  { id: 10193, title: "Toy Story 3" },
  { id: 301528, title: "Toy Story 4" },
  { id: 38, title: "Eternal Sunshine of the Spotless Mind" },
  { id: 14160, title: "Up" },
  { id: 872585, title: "Oppenheimer" },
  { id: 107, title: "Snatch" },
  { id: 530915, title: "1917" },
  { id: 106646, title: "The Wolf of Wall Street" },
  { id: 556574, title: "Hamilton" },
  { id: 490132, title: "Green Book" },
  { id: 272, title: "Batman Begins" },
  { id: 11324, title: "Shutter Island" },
  { id: 601434, title: "The Father" },
  { id: 7491, title: "There Will Be Blood" },
  { id: 361743, title: "Top Gun: Maverick" },
  { id: 359724, title: "Ford v Ferrari" },
  { id: 6977, title: "No Country for Old Men" },
  { id: 453, title: "A Beautiful Mind" },
  { id: 24, title: "Kill Bill: Vol. 1" },
  { id: 146233, title: "Prisoners" },
  { id: 12, title: "Finding Nemo" },
  { id: 508439, title: "Klaus" },
  { id: 752, title: "V for Vendetta" },
  { id: 150540, title: "Inside Out" },
  { id: 359940, title: "Three Billboards Outside Ebbing, Missouri" },
  { id: 640, title: "Catch Me If You Can" },
  { id: 59440, title: "Warrior" },
  { id: 12444, title: "Harry Potter and the Deathly Hallows: Part 2" },
  { id: 2649, title: "Gran Torino" },
  { id: 70, title: "Million Dollar Baby" },
  { id: 76341, title: "Mad Max: Fury Road" },
  { id: 634649, title: "Spider-Man: No Way Home" },
  { id: 76203, title: "12 Years a Slave" },
  { id: 120467, title: "The Grand Budapest Hotel" },
  { id: 324786, title: "Hacksaw Ridge" },
  { id: 210577, title: "Gone Girl" },
  { id: 2062, title: "Ratatouille" },
  { id: 585, title: "Monsters, Inc." },
  { id: 10191, title: "How to Train Your Dragon" },
  { id: 263115, title: "Logan" },
  { id: 227306, title: "Spotlight" },
  { id: 22, title: "Pirates of the Caribbean: The Curse of the Black Pearl" },
  { id: 264644, title: "Room" },
  { id: 4800, title: "Hotel Rwanda" },
  { id: 80, title: "Before Sunset" },
  { id: 9806, title: "The Incredibles" },
  { id: 28178, title: "Hachi: A Dog's Tale" },
  { id: 96721, title: "Rush" },
  { id: 5915, title: "Into the Wild" },
  { id: 50014, title: "The Help" },
  { id: 9522, title: "Wedding Crashers" },
  { id: 289, title: "Casablanca" },
  { id: 872, title: "Singin' in the Rain" },
  { id: 496243, title: "Parasite" },
  { id: 637, title: "Life Is Beautiful" },
  { id: 603, title: "The Matrix" },
  { id: 550, title: "Fight Club" },
  { id: 769, title: "Goodfellas" },
  { id: 680, title: "Pulp Fiction" },
  { id: 278, title: "The Shawshank Redemption" },
  { id: 13, title: "Forrest Gump" },
  { id: 857, title: "Saving Private Ryan" },
  { id: 597, title: "Titanic" },
  { id: 497, title: "The Green Mile" },
  { id: 14, title: "American Beauty" },
  { id: 745, title: "The Sixth Sense" },
  { id: 807, title: "L.A. Confidential" },
  { id: 4995, title: "Boogie Nights" },
  { id: 627, title: "Trainspotting" },
  { id: 629, title: "The Usual Suspects" },
  { id: 500, title: "Reservoir Dogs" },
  { id: 621, title: "Heat" },
  { id: 197, title: "Braveheart" },
  { id: 105, title: "Back to the Future" },
  { id: 78, title: "Blade Runner" },
  { id: 679, title: "Aliens" },
  { id: 562, title: "Die Hard" },
  { id: 9377, title: "Ferris Bueller's Day Off" },
  { id: 2108, title: "The Breakfast Club" },
  { id: 218, title: "The Terminator" },
  { id: 694, title: "The Shining" },
  { id: 85, title: "Raiders of the Lost Ark" },
  { id: 1891, title: "Star Wars: The Empire Strikes Back" },
  { id: 601, title: "E.T. the Extra-Terrestrial" },
  { id: 620, title: "Ghostbusters" },
  { id: 744, title: "Top Gun" },
  { id: 111, title: "Scarface" },
  { id: 106, title: "Predator" },
  { id: 9340, title: "The Goonies" },
  { id: 235, title: "Stand by Me" },
  { id: 600, title: "Full Metal Jacket" },
  { id: 793, title: "Blue Velvet" },
  { id: 1578, title: "Raging Bull" },
  { id: 2493, title: "The Princess Bride" }
];

// Remove any duplicate movies from the baseline list based on ID
const uniqueBaselineMovies = Array.from(new Set(baselineMovies.map(m => m.id)))
  .map(id => {
    return baselineMovies.find(m => m.id === id); // Find the first occurrence of each unique ID
  });

/**
 * WildcardScreen - Main component for movie comparison functionality
 * Props:
 * - seen: Array of movies user has already rated
 * - setSeen: Function to update the seen movies list
 * - unseen: Array of movies in user's watchlist
 * - onAddToSeen: Function to add a movie to the seen list
 * - onAddToUnseen: Function to add a movie to the watchlist
 * - genres: Object mapping genre IDs to genre names
 * - isDarkMode: Boolean indicating if dark mode is enabled
 */
function WildcardScreen({
  seen = [], // List of movies user has rated - defaults to empty array
  setSeen, // Function to update the rated movies list
  unseen = [], // List of movies in watchlist - defaults to empty array
  onAddToSeen, // Function to add movie to rated list
  onAddToUnseen, // Function to add movie to watchlist
  genres = {}, // Object mapping genre IDs to names - defaults to empty object
  isDarkMode // Boolean for dark/light theme
}) {

  // State variables for component functionality
  const [seenMovie, setSeenMovie] = useState(null); // Currently displayed movie user has rated
  const [newMovie, setNewMovie] = useState(null); // Currently displayed new movie for comparison
  const [loading, setLoading] = useState(true); // Whether component is currently loading data
  const [error, setError] = useState(null); // Error message to display, if any
  const [lastAction, setLastAction] = useState(null); // Data about the last action (for undo functionality)
  const [comparedMovies, setComparedMovies] = useState([]); // List of movie IDs that have been compared
  const [skippedMovies, setSkippedMovies] = useState([]); // List of movie IDs that were skipped
  const [baselineComplete, setBaselineComplete] = useState(false); // Whether baseline ratings phase is complete
  const [showBaselineCompleteModal, setShowBaselineCompleteModal] = useState(false); // Whether to show completion modal
  const [filterModalVisible, setFilterModalVisible] = useState(false); // Whether filter modal is visible
  const [selectedGenre, setSelectedGenre] = useState(null); // Currently selected genre filter (ID)
  const [tempGenre, setTempGenre] = useState(null); // Temporary genre selection (while modal is open)
  const [comparisonCount, setComparisonCount] = useState(0); // Total number of comparisons made
  const [comparisonPattern, setComparisonPattern] = useState(0); // Current position in comparison pattern (0-4)
  
  // Refs to prevent race conditions and track component state
  const isLoadingRef = useRef(false); // Prevents multiple simultaneous API calls
  const appReady = useRef(false); // Tracks if component has finished initial setup

  /**
   * Reset function - clears all comparison data but keeps user ratings
   * Shows confirmation dialog before resetting
   */
  const handleReset = useCallback(async () => {
    Alert.alert(
      "Reset Wildcard", // Title of alert
      "Are you sure you want to reset the wildcard screen? This will clear all comparison data but keep your movie ratings.", // Message
      [
        { text: "Cancel", style: "cancel" }, // Cancel button
        { 
          text: "Reset", 
          style: "destructive", // Makes button red to indicate destructive action
          onPress: async () => { // Function to run when reset is confirmed
            try {
              setLoading(true); // Show loading indicator
              
              // Clear all stored comparison data from device storage
              await AsyncStorage.removeItem(STORAGE_KEY); // Remove compared movies list
              await AsyncStorage.removeItem(BASELINE_COMPLETE_KEY); // Remove baseline completion status
              await AsyncStorage.removeItem(COMPARISON_COUNT_KEY); // Remove comparison count
              await AsyncStorage.removeItem(COMPARISON_PATTERN_KEY); // Remove pattern position
              await AsyncStorage.removeItem(SKIPPED_MOVIES_KEY); // Remove skipped movies list
              
              // Reset all state variables to initial values
              setComparedMovies([]); // Clear compared movies array
              setSkippedMovies([]); // Clear skipped movies array
              setBaselineComplete(false); // Reset baseline completion status
              setComparisonCount(0); // Reset comparison counter
              setComparisonPattern(0); // Reset pattern to beginning
              setLastAction(null); // Clear undo data
              setSeenMovie(null); // Clear currently displayed movies
              setNewMovie(null);
              setError(null); // Clear any error messages
              
              // Reset the loading flag to allow new API calls
              isLoadingRef.current = false;
              
              // Fetch a new movie comparison after a short delay
              setTimeout(() => {
                fetchRandomMovie(); // Get new movies to compare
              }, 300);
              
              console.log("Wildcard state reset successfully"); // Log success
            } catch (e) {
              console.error('Failed to reset wildcard state', e); // Log error
              setError('Failed to reset. Please try again.'); // Show error to user
              setLoading(false); // Hide loading indicator
            }
          }
        }
      ]
    );
  }, [fetchRandomMovie]); // Dependency: fetchRandomMovie function

  /**
   * Load saved state from device storage when component first mounts
   * Retrieves comparison history, baseline status, and other persistent data
   */
  useEffect(() => {
    const loadStoredState = async () => {
      try {
        // Load list of movies that have been compared
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) { // If data exists in storage
          setComparedMovies(JSON.parse(jsonValue)); // Parse and set compared movies
        }
        
        // Load list of movies that were skipped
        const skippedValue = await AsyncStorage.getItem(SKIPPED_MOVIES_KEY);
        if (skippedValue != null) { // If skip data exists
          setSkippedMovies(JSON.parse(skippedValue)); // Parse and set skipped movies
        }
        
        // Load whether baseline phase is complete
        const baselineCompleteValue = await AsyncStorage.getItem(BASELINE_COMPLETE_KEY);
        const isBaselineComplete = baselineCompleteValue === 'true'; // Convert string to boolean
        setBaselineComplete(isBaselineComplete);
        
        // Load total comparison count
        const countValue = await AsyncStorage.getItem(COMPARISON_COUNT_KEY);
        if (countValue != null) { // If count data exists
          setComparisonCount(parseInt(countValue, 10)); // Convert string to integer
        }
        
        // Load current position in comparison pattern
        const patternValue = await AsyncStorage.getItem(COMPARISON_PATTERN_KEY);
        if (patternValue != null) { // If pattern data exists
          setComparisonPattern(parseInt(patternValue, 10)); // Convert string to integer
        }
        
        // Log loaded data for debugging
        console.log(`Loaded ${JSON.parse(jsonValue || '[]').length} compared movies`);
        console.log(`Loaded ${JSON.parse(skippedValue || '[]').length} skipped movies`);
        console.log(`Baseline complete: ${isBaselineComplete}`);
        console.log(`Comparison count: ${countValue}`);
        console.log(`Comparison pattern: ${patternValue}`);
        
        // Mark component as ready for use
        appReady.current = true;
      } catch (e) {
        console.error('Failed to load stored state', e); // Log any errors
        appReady.current = true; // Still mark as ready even if loading failed
      }
    };
    
    loadStoredState(); // Execute the loading function
  }, []); // Empty dependency array = run only once on mount

  /**
   * Monitor component state and handle stuck or error conditions
   * Runs when seen/unseen arrays change or component mounts
   */
  useEffect(() => {
    // Only run if component is ready and not currently loading
    if (appReady.current && !loading && isLoadingRef.current === false) {
      // Check if component is in a stuck state (error or no movies loaded)
      if (error || (!seenMovie && !newMovie && !loading)) {
        console.log("Detected a stuck state or error - resetting wildcard");
        setError(null); // Clear any existing error
        setLoading(true); // Show loading indicator
        // Reset and fetch new movies after delay
        setTimeout(() => {
          isLoadingRef.current = false; // Allow new API calls
          fetchRandomMovie(); // Fetch new comparison
        }, 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, unseen]); // Run when user's movie lists change

  /**
   * Save compared movies list to device storage whenever it changes
   * Ensures data persists between app sessions
   */
  useEffect(() => {
    const saveComparedMovies = async () => {
      try {
        const jsonValue = JSON.stringify(comparedMovies); // Convert array to JSON string
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue); // Save to device storage
      } catch (e) {
        console.error('Failed to save compared movies', e); // Log save errors
      }
    };
    
    // Only save if there are movies to save
    if (comparedMovies.length > 0) {
      saveComparedMovies();
    }
  }, [comparedMovies]); // Run whenever comparedMovies array changes

  /**
   * Save baseline completion status to device storage
   */
  useEffect(() => {
    const saveBaselineComplete = async () => {
      try {
        // Convert boolean to string for storage
        await AsyncStorage.setItem(BASELINE_COMPLETE_KEY, baselineComplete.toString());
      } catch (e) {
        console.error('Failed to save baseline complete status', e);
      }
    };
    
    saveBaselineComplete(); // Save whenever status changes
  }, [baselineComplete]);

  /**
   * Save comparison count to device storage
   */
  useEffect(() => {
    const saveComparisonCount = async () => {
      try {
        // Convert number to string for storage
        await AsyncStorage.setItem(COMPARISON_COUNT_KEY, comparisonCount.toString());
      } catch (e) {
        console.error('Failed to save comparison count', e);
      }
    };
    
    saveComparisonCount(); // Save whenever count changes
  }, [comparisonCount]);

  /**
   * Save comparison pattern position to device storage
   */
  useEffect(() => {
    const saveComparisonPattern = async () => {
      try {
        // Convert number to string for storage
        await AsyncStorage.setItem(COMPARISON_PATTERN_KEY, comparisonPattern.toString());
      } catch (e) {
        console.error('Failed to save comparison pattern', e);
      }
    };
    
    saveComparisonPattern(); // Save whenever pattern changes
  }, [comparisonPattern]);

  /**
   * Save skipped movies list to device storage whenever it changes
   */
  useEffect(() => {
    const saveSkippedMovies = async () => {
      try {
        const jsonValue = JSON.stringify(skippedMovies); // Convert array to JSON string
        await AsyncStorage.setItem(SKIPPED_MOVIES_KEY, jsonValue); // Save to storage
      } catch (e) {
        console.error('Failed to save skipped movies', e);
      }
    };
    
    // Only save if there are movies to save
    if (skippedMovies.length > 0) {
      saveSkippedMovies();
    }
  }, [skippedMovies]);

  /**
   * UNIVERSAL MOVIE UPDATE FUNCTION
   * Updates any movie's rating regardless of where it came from
   * This function is completely blind to movie origins (onboarding, baseline, manual, etc.)
   */
  const updateMovieRating = useCallback((movieToUpdate, newRating) => {
    // Create updated movie object with new rating
    const updatedMovie = {
      ...movieToUpdate,
      userRating: newRating,
      eloRating: newRating * 10,
      gamesPlayed: (movieToUpdate.gamesPlayed || 0) + 1
    };
    
    console.log(`Updating movie: ${updatedMovie.title} from ${movieToUpdate.userRating} to ${newRating}`);
    
    // Find and update this movie in the seen list, regardless of how it got there
    setSeen(currentSeen => {
      const movieExists = currentSeen.some(m => m.id === movieToUpdate.id);
      
      if (movieExists) {
        // Movie exists in seen list - update it
        const updatedSeen = currentSeen.map(m => 
          m.id === movieToUpdate.id ? updatedMovie : m
        );
        console.log(`Updated existing movie in seen list: ${updatedMovie.title}`);
        return updatedSeen;
      } else {
        // Movie doesn't exist in seen list - add it
        console.log(`Adding new movie to seen list: ${updatedMovie.title}`);
        return [...currentSeen, updatedMovie];
      }
    });
    
    // Also call the parent callback to ensure compatibility
    // This ensures the parent component gets notified of the update
    onAddToSeen(updatedMovie);
    
    return updatedMovie;
  }, [setSeen, onAddToSeen]);

  /**
   * Get the next baseline movie that hasn't been compared yet
   * Used during the initial baseline rating phase
   * Returns null if all baseline movies have been compared
   */
  const getNextBaselineMovie = useCallback(() => {
    // Filter baseline movies to find ones not yet compared or rated
    const remainingBaselineMovies = uniqueBaselineMovies.filter(
      m => !comparedMovies.includes(m.id) && // Movie hasn't been compared yet
           !seen.some(sm => sm.id === m.id) // Movie isn't already in user's rated list
    );
    
    // If no movies remaining, mark baseline as complete
    if (remainingBaselineMovies.length === 0) {
      if (!baselineComplete) { // Only set if not already complete
        setBaselineComplete(true); // Mark baseline phase as finished
        setShowBaselineCompleteModal(true); // Show completion notification
        
        // Reset comparison pattern to start fresh after baseline
        // This ensures next comparison will be unknown vs known (pattern 0)
        setComparisonPattern(0);
      }
      return null; // No more baseline movies available
    }
    
    // Return a random movie from remaining baseline movies
    return remainingBaselineMovies[Math.floor(Math.random() * remainingBaselineMovies.length)];
  }, [comparedMovies, baselineComplete, seen]);

  /**
   * Mark a movie as having been compared and update tracking counters
   * Updates comparison count and advances the comparison pattern
   */
  const markMovieAsCompared = useCallback((movieId) => {
    // Add movie to compared list if not already there
    if (!comparedMovies.includes(movieId)) {
      setComparedMovies(prev => [...prev, movieId]); // Add to end of array
    }
    
    // Increment total comparison counter
    setComparisonCount(prev => prev + 1);
    
    // Advance comparison pattern (0,1,2,3,4,0,1,2,3,4,...)
    // Pattern determines what type of comparison to show next:
    // 0-3: Known movie vs Unknown movie
    // 4: Known movie vs Known movie
    setComparisonPattern(prev => (prev + 1) % 5);
  }, [comparedMovies]);

  /**
   * Fetch detailed movie information from TMDB API
   * Takes a movie ID and returns formatted movie object
   */
  const getMovieDetails = useCallback(async (movieId) => {
    try {
      // Make API request to TMDB for movie details
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`
      );
      
      // Check if request was successful
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      
      const data = await response.json(); // Parse JSON response
      
      // Return formatted movie object with all needed properties
      return {
        id: data.id, // TMDB movie ID
        title: data.title, // Movie title
        score: data.vote_average, // TMDB average rating
        voteCount: data.vote_count, // Number of TMDB votes
        poster: data.poster_path, // Poster image path
        overview: data.overview, // Movie description
        release_date: data.release_date || 'Unknown', // Release date
        genre_ids: data.genres.map(g => g.id).slice(0, 3), // First 3 genre IDs
        release_year: new Date(data.release_date).getFullYear(), // Extract year
        eloRating: data.vote_average * 10, // Convert to 0-100 scale
        userRating: data.vote_average // Initial user rating = TMDB score
      };
    } catch (error) {
      console.error(`Error fetching details for movie ${movieId}:`, error);
      throw error; // Re-throw error for caller to handle
    }
  }, []);

  /**
   * Find movies similar to user's favorites using TMDB API
   * Analyzes user's top-rated movies to determine preferences
   * Returns a movie recommendation based on those preferences
   */
  const getSimilarMovie = useCallback(async () => {
    // Check if user has rated enough movies for recommendations
    if (seen.length === 0) {
      throw new Error('Not enough rated movies to generate recommendations');
    }
    
    // Get user's top 10 highest-rated movies (or all if less than 10)
    const topMovies = [...seen]
      .sort((a, b) => b.userRating - a.userRating) // Sort by rating descending
      .slice(0, Math.min(10, seen.length)); // Take top 10 or all if less
    
    // Analyze favorite genres and preferred time periods
    const favoriteGenres = {}; // Object to store genre preference scores
    let totalYears = 0; // Sum of release years weighted by rating
    
    // Analyze each top movie to extract preferences
    topMovies.forEach(movie => {
      // Count genre preferences (weighted by user rating)
      if (movie.genre_ids) {
        movie.genre_ids.forEach(genreId => {
          // Add user's rating to this genre's score
          favoriteGenres[genreId] = (favoriteGenres[genreId] || 0) + movie.userRating;
        });
      }
      
      // Calculate preferred time period (weighted by rating)
      if (movie.release_date) {
        const year = new Date(movie.release_date).getFullYear();
        if (!isNaN(year)) {
          // Add year weighted by how much user liked the movie
          totalYears += year * (movie.userRating / 10);
        }
      }
    });
    
    // Calculate average preferred release year
    const totalRatings = topMovies.reduce((sum, movie) => sum + movie.userRating, 0);
    const avgYear = Math.round(totalYears / totalRatings);
    
    // Find the user's most preferred genre
    let preferredGenreId = null;
    let highestGenreScore = 0;
    
    Object.entries(favoriteGenres).forEach(([genreId, score]) => {
      if (score > highestGenreScore) {
        highestGenreScore = score;
        preferredGenreId = genreId; // Genre with highest total rating
      }
    });
    
    // Build TMDB discovery API URL based on user preferences
    let apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=vote_average.desc&vote_count.gte=${MIN_VOTE_COUNT}`;
    
    // Add year filter if we have enough data
    if (!isNaN(avgYear)) {
      // Search within 10 years of user's preferred period
      const startYear = Math.max(1900, avgYear - 10);
      const endYear = Math.min(new Date().getFullYear(), avgYear + 10);
      apiUrl += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`;
    }
    
    // Add genre filter if we found preferences and it matches any active filter
    if (preferredGenreId && (!selectedGenre || selectedGenre === preferredGenreId)) {
      apiUrl += `&with_genres=${preferredGenreId}`;
    } else if (selectedGenre) {
      // Use selected genre filter if no natural preference matches
      apiUrl += `&with_genres=${selectedGenre}`;
    }
    
    // Occasionally use different sorting to add variety
    const sortOptions = [
      'vote_average.desc', // Best rated first
      'popularity.desc', // Most popular first
      'primary_release_date.desc' // Most recent first
    ];
    const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
    apiUrl = apiUrl.replace('vote_average.desc', randomSort);

    // First request to get total page count
    const initialResponse = await fetch(apiUrl);
    if (!initialResponse.ok) {
      throw new Error('Failed to fetch similar movies');
    }
    const initialData = await initialResponse.json();
    const maxPage = Math.min(initialData.total_pages || 1, 20); // Limit to 20 pages

    // Fetch from a random page to get variety (if multiple pages exist)
    const page = maxPage > 1 ? Math.floor(Math.random() * maxPage) + 1 : 1;
    apiUrl += `&page=${page}`;
    
    // Fetch the actual movies
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch similar movies');
    }
    
    const data = await response.json();
    
    // Validate response has movies
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      throw new Error('No similar movies found');
    }
    
    // Create set of all movie IDs to exclude from recommendations
    const excludedIds = new Set();
    
    // Exclude movies user has already seen/rated
    seen.forEach(movie => excludedIds.add(movie.id));
    
    // Exclude movies in user's watchlist
    unseen.forEach(movie => excludedIds.add(movie.id));
    
    // Exclude movies already compared in this session
    comparedMovies.forEach(id => excludedIds.add(id));
    
    // Exclude movies that were skipped
    skippedMovies.forEach(id => excludedIds.add(id));
    
    // Filter movies based on quality criteria and exclusions
    const filteredResults = data.results.filter(
      m =>
        m.poster_path && // Must have a poster image
        m.vote_average >= MIN_SCORE && // Must meet minimum rating
        !excludedIds.has(m.id) // Must not be in excluded list
    );
    
    // If no suitable movies found, try popular movies as fallback
    if (filteredResults.length === 0) {
      const popularApiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${Math.floor(Math.random() * 20) + 1}`;
      
      const popularResponse = await fetch(popularApiUrl);
      
      if (!popularResponse.ok) {
        throw new Error('Failed to fetch popular movies');
      }
      
      const popularData = await popularResponse.json();
      
      // Filter popular movies with same criteria
      const popularFiltered = popularData.results.filter(
        m =>
          m.poster_path && // Must have poster
          !excludedIds.has(m.id) // Must not be excluded
      );
      
      // If still no movies found, throw error
      if (popularFiltered.length === 0) {
        throw new Error('No new movies found to compare. Try rating more movies first.');
      }
      
      // Pick random movie from popular results
      const randomMovie = popularFiltered[Math.floor(Math.random() * popularFiltered.length)];
      
      // Format and return the movie data
      return {
        id: randomMovie.id,
        title: randomMovie.title,
        score: randomMovie.vote_average,
        voteCount: randomMovie.vote_count,
        poster: randomMovie.poster_path,
        overview: randomMovie.overview,
        release_date: randomMovie.release_date || 'Unknown',
        genre_ids: randomMovie.genre_ids.slice(0, 3), // Take first 3 genres
        release_year: new Date(randomMovie.release_date).getFullYear(),
        eloRating: randomMovie.vote_average * 10, // Convert to 0-100 scale
        userRating: randomMovie.vote_average // Initial rating = TMDB score
      };
    }
    
    // Shuffle filtered results to avoid always picking the same ones
    const shuffledResults = [...filteredResults].sort(() => 0.5 - Math.random());

    // Pick the first movie after shuffling
    const randomMovie = shuffledResults[0];
    
    // Format and return the selected movie
    return {
      id: randomMovie.id,
      title: randomMovie.title,
      score: randomMovie.vote_average,
      voteCount: randomMovie.vote_count,
      poster: randomMovie.poster_path,
      overview: randomMovie.overview,
      release_date: randomMovie.release_date || 'Unknown',
      genre_ids: randomMovie.genre_ids.slice(0, 3),
      release_year: new Date(randomMovie.release_date).getFullYear(),
      eloRating: randomMovie.vote_average * 10,
      userRating: randomMovie.vote_average
    };
  }, [seen, unseen, selectedGenre, comparedMovies, skippedMovies]);

  /**
   * Get two different movies from user's rated list for comparison
   * Used for "known vs known" comparisons (pattern 4)
   * Returns objects with both movies for comparison
   */
  const getKnownVsKnownPair = useCallback(async () => {
    // Check if user has enough rated movies
    if (seen.length < 5) {
      throw new Error('Not enough rated movies for known vs known comparison');
    }
    
    // Apply genre filter if specified
    let eligibleMovies = seen;
    if (selectedGenre) {
      // Filter to only movies in selected genre
      eligibleMovies = seen.filter(m => 
        m.genre_ids && m.genre_ids.includes(parseInt(selectedGenre))
      );
      
      // Check if enough movies in this genre
      if (eligibleMovies.length < 5) {
        throw new Error('Not enough movies in this genre');
      }
    }
    
    // Shuffle the eligible movies randomly
    const shuffled = [...eligibleMovies].sort(() => 0.5 - Math.random());
    
    // Make sure we have at least 2 different movies
    if (shuffled.length >= 2) {
      // Return two different movies for comparison
      return {
        seenMovie: shuffled[0], // First movie
        newSeenMovie: shuffled[1] // Second movie (different from first)
      };
    } else {
      throw new Error('Not enough different movies for comparison');
    }
  }, [seen, selectedGenre]);

  /**
   * Main function to fetch movies for comparison
   * Determines what type of comparison to show based on the current pattern
   * Handles both baseline and recommendation phases
   */
  const fetchRandomMovie = useCallback(async () => {
    // Prevent multiple simultaneous API calls
    if (isLoadingRef.current) {
      console.log('Already loading, skipping new fetch');
      return;
    }
    
    // Set loading flag to prevent race conditions
    isLoadingRef.current = true;
    setLoading(true); // Show loading indicator to user
    
    // Check if user has rated enough movies to use this feature
    if (seen.length < 3) {
      setError('You must have at least 3 movies ranked to use Wildcard mode.');
      setLoading(false);
      isLoadingRef.current = false;
      return;
    }

    try {
      // Determine type of comparison based on pattern:
      // Pattern 0-3: Show known vs unknown movie
      // Pattern 4: Show known vs known movie (if enough movies rated)
      const isKnownVsKnown = comparisonPattern === 4;
      
      // Handle known vs known comparisons
      if (isKnownVsKnown && seen.length >= 5) {
        // Get two different movies from user's rated list
        const { seenMovie: movieA, newSeenMovie: movieB } = await getKnownVsKnownPair();
        
        // Safety check to ensure movies are different
        if (movieA.id === movieB.id) {
          throw new Error('Cannot compare a movie with itself');
        }
        
        // Set both movies for display
        setSeenMovie(movieA);
        setNewMovie(movieB);
        setLoading(false); // Hide loading indicator
        isLoadingRef.current = false; // Allow future API calls
        return;
      }
      
      // Handle known vs unknown comparisons:
      
      // Select random movie from user's rated list
      let eligibleSeenMovies = seen;
      
      // Apply genre filter if active
      if (selectedGenre) {
        eligibleSeenMovies = seen.filter(movie => 
          movie.genre_ids && movie.genre_ids.includes(parseInt(selectedGenre))
        );
        
        // Check if enough movies in selected genre
        if (eligibleSeenMovies.length < 2) {
          setError(`Not enough movies in the "${genres[selectedGenre]}" genre. Please rate more movies in this genre or select a different genre.`);
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
      }
      
      // Pick random movie from eligible seen movies
      const randomSeenMovie = eligibleSeenMovies[Math.floor(Math.random() * eligibleSeenMovies.length)];
      setSeenMovie(randomSeenMovie); // Set as the "known" movie
      
      let newMovieData = null; // Will hold the "unknown" movie data

      // Decide whether to use baseline or recommendation algorithm
      if (!baselineComplete) {
        // Still in baseline phase - try to get next baseline movie
        const nextBaselineMovie = getNextBaselineMovie();
        
        if (nextBaselineMovie) {
          console.log('Using baseline movie:', nextBaselineMovie.title);
          
          // Make sure we're not comparing the same movie with itself
          if (nextBaselineMovie.id === randomSeenMovie.id) {
            // Try to get a different baseline movie
            const remainingBaselineMovies = uniqueBaselineMovies.filter(
              m => !comparedMovies.includes(m.id) && 
                   !seen.some(sm => sm.id === m.id) && 
                   m.id !== randomSeenMovie.id // Exclude the currently selected movie
            );
            
            if (remainingBaselineMovies.length > 0) {
              // Pick another baseline movie
              const alternativeMovie = remainingBaselineMovies[Math.floor(Math.random() * remainingBaselineMovies.length)];
              newMovieData = await getMovieDetails(alternativeMovie.id);
            } else {
              // No more suitable baseline movies, switch to recommendations
              newMovieData = await getSimilarMovie();
            }
          } else {
            // Use the selected baseline movie
            newMovieData = await getMovieDetails(nextBaselineMovie.id);
          }
          
          // Check if we're near the end of baseline movies
          const remainingCount = uniqueBaselineMovies.filter(m => 
            !comparedMovies.includes(m.id) && !seen.some(sm => sm.id === m.id)
          ).length;
          
          // Mark baseline complete when 85% or more movies are rated
          if (remainingCount <= Math.floor(uniqueBaselineMovies.length * 0.15)) {
            // Schedule baseline completion notice
            setTimeout(() => {
              setBaselineComplete(true);
              setShowBaselineCompleteModal(true);
            }, 1000);
          }
        } else {
          // No more baseline movies available, switch to recommendations
          console.log('All baseline movies compared, switching to recommendations');
          setBaselineComplete(true);
          newMovieData = await getSimilarMovie();
        }
      } else {
        // Baseline already complete, use recommendation algorithm
        console.log('Using recommendation algorithm');
        newMovieData = await getSimilarMovie();
      }
      
      // Final safety check - make sure movies are different
      if (newMovieData && newMovieData.id === randomSeenMovie.id) {
        throw new Error('Cannot compare a movie with itself');
      }
      
      // Set the new movie for display
      setNewMovie(newMovieData);
      setLoading(false); // Hide loading indicator
      isLoadingRef.current = false; // Allow future API calls
    } catch (err) {
      // Handle any errors that occurred during fetching
      console.error('Error fetching movie:', err);
      setError(`Failed to load movie: ${err.message}`); // Show error to user
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [
    seen, 
    selectedGenre, 
    genres, 
    baselineComplete,
    comparedMovies,
    comparisonPattern,
    getNextBaselineMovie,
    getMovieDetails, 
    getSimilarMovie,
    getKnownVsKnownPair
  ]);

  /**
   * Fetch initial movie comparison when component first loads
   * Only runs once when component mounts
   */
  useEffect(() => {
    try {
      fetchRandomMovie(); // Get first movie comparison
    } catch (err) {
      console.error('Error in initial movie fetch:', err);
      setError('Something went wrong while loading. Please try again.');
      setLoading(false);
      isLoadingRef.current = false;
    }
    
    // Cleanup function to prevent lingering API calls
    return () => {
      // Prevent any ongoing fetches from completing after component unmounts
      isLoadingRef.current = true;
    };
  }, [fetchRandomMovie]);

  /**
   * Open filter modal and initialize temporary settings
   * Saves current filter state to temporary variables for editing
   */
  const openFilterModal = useCallback(() => {
    // Initialize temp values with current filter settings
    setTempGenre(selectedGenre);
    setFilterModalVisible(true); // Show the filter modal
  }, [selectedGenre]);

  /**
   * Apply filter changes and reload movies if settings changed
   * Compares temp settings with current settings to avoid unnecessary reloads
   */
  const applyFilters = useCallback(() => {
    // Hide the modal first
    setFilterModalVisible(false);
    
    // Check if any settings actually changed
    const settingsChanged = selectedGenre !== tempGenre;
    
    // Apply temporary values to actual state
    setSelectedGenre(tempGenre);
    
    // Only fetch new movies if settings changed
    if (settingsChanged) {
      // Use timeout to ensure modal is completely hidden before updating UI
      setTimeout(() => {
        setNewMovie(null); // Clear current movies
        setSeenMovie(null);
        setLoading(true); // Show loading
        try {
          fetchRandomMovie(); // Get new movies with updated filter
        } catch (err) {
          console.error('Error after filter change:', err);
          setError('Something went wrong while loading. Please try again.');
          setLoading(false);
          isLoadingRef.current = false;
        }
      }, 300);
    }
  }, [selectedGenre, tempGenre, fetchRandomMovie]);

  /**
   * Cancel filter changes without applying them
   * Simply closes the modal and discards temporary values
   */
  const cancelFilters = useCallback(() => {
    // Just close modal without applying any changes
    setFilterModalVisible(false);
  }, []);

  /**
   * Calculate dynamic K-factor for Elo rating system
   * Movies with fewer comparisons get higher K-factors (faster rating changes)
   * Movies with many comparisons get lower K-factors (more stable ratings)
   */
  const calculateKFactor = useCallback((gamesPlayed) => {
    // Use higher K-factor for movies with fewer comparisons (faster learning)
    if (gamesPlayed < 5) return 20;      // Very new movies
    if (gamesPlayed < 10) return 15;     // Newer movies
    if (gamesPlayed < 20) return 10;     // Somewhat established movies
    return 5;                           // Well-established ratings (stable)
  }, []);

  /**
   * Adjust movie ratings using enhanced Elo system
   * Updates both winner and loser ratings based on expected vs actual outcome
   * Returns updated movie objects with new ratings
   */
  const adjustRating = useCallback((winner, loser, winnerIsSeenMovie) => {
    // Get current ratings for both movies
    const winnerRating = winner.userRating;
    const loserRating = loser.userRating;
    
    // Calculate expected win probability using Elo formula
    // We divide by 4 instead of 400 because our scale is 1-10, not 0-3000
    const expectedWinProbability = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 4));
    
    // Get dynamic K-factors based on how many times each movie has been compared
    const winnerK = calculateKFactor(winner.gamesPlayed || 0);
    const loserK = calculateKFactor(loser.gamesPlayed || 0);
    
    // Calculate rating changes based on surprise factor
    // (1 - expectedWinProbability) = how unexpected was this outcome?
    // If winner was expected to win, change will be small
    // If winner was underdog, change will be larger
    const winnerIncrease = Math.max(0.1, winnerK * (1 - expectedWinProbability));
    const loserDecrease = Math.max(0.1, loserK * (1 - expectedWinProbability));
    
    // Apply bonus adjustment for upsets (lower-rated beats higher-rated)
    let adjustedWinnerIncrease = winnerIncrease;
    let adjustedLoserDecrease = loserDecrease;
    if (winnerRating < loserRating) {
      // This is an upset - boost the rating change by 20%
      adjustedWinnerIncrease *= 1.2;
    }
    
    // Cap adjustments to prevent wild rating swings
    const MAX_RATING_CHANGE = 0.7;
    adjustedWinnerIncrease = Math.min(MAX_RATING_CHANGE, adjustedWinnerIncrease);
    adjustedLoserDecrease = Math.min(MAX_RATING_CHANGE, adjustedLoserDecrease);
    
    // Calculate new ratings
    let newWinnerRating = winnerRating + adjustedWinnerIncrease;
    let newLoserRating = loserRating - adjustedLoserDecrease;
    
    // Clamp ratings between 1-10 and round to nearest tenth
    newWinnerRating = Math.round(Math.min(10, Math.max(1, newWinnerRating)) * 10) / 10;
    newLoserRating = Math.round(Math.min(10, Math.max(1, newLoserRating)) * 10) / 10;
    
    // Create updated movie objects with new ratings and incremented play counts
    const updatedWinner = {
      ...winner,
      userRating: newWinnerRating,
      eloRating: newWinnerRating * 10, // Convert to 0-100 scale for storage
      gamesPlayed: (winner.gamesPlayed || 0) + 1 // Increment comparison count
    };
    
    const updatedLoser = {
      ...loser,
      userRating: newLoserRating,
      eloRating: newLoserRating * 10,
      gamesPlayed: (loser.gamesPlayed || 0) + 1
    };
    
    // Return objects in the correct positions based on which movie was the seen one
    return winnerIsSeenMovie 
      ? { updatedSeenMovie: updatedWinner, updatedNewMovie: updatedLoser } 
      : { updatedSeenMovie: updatedLoser, updatedNewMovie: updatedWinner };
  }, [calculateKFactor]);

  /**
   * Handle user choosing the seen movie as better
   * Updates ratings and fetches next comparison
   */
  /**
   * Handle user choosing the seen movie as better
   * Now uses the universal update function
   */
  const handleSeenWin = useCallback(() => {
    // Prevent action during loading or if movies aren't loaded
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    console.log('=== SEEN MOVIE WIN ===');
    console.log('Before rating adjustment:');
    console.log('Seen movie:', seenMovie.title, 'Rating:', seenMovie.userRating);
    console.log('New movie:', newMovie.title, 'Rating:', newMovie.userRating || newMovie.score);
    
    // Check if this is a known vs known comparison
    const isKnownVsKnown = seen.some(m => m.id === newMovie.id);
    
    // Always calculate new ratings using the Elo algorithm
    const { updatedSeenMovie, updatedNewMovie } = adjustRating(seenMovie, newMovie, true);
    
    console.log('After rating adjustment:');
    console.log('Updated seen movie:', updatedSeenMovie.title, 'New rating:', updatedSeenMovie.userRating);
    console.log('Updated new movie:', updatedNewMovie.title, 'New rating:', updatedNewMovie.userRating);
    
    // Update both movies universally - doesn't matter where they came from
    updateMovieRating(seenMovie, updatedSeenMovie.userRating);
    updateMovieRating(newMovie, updatedNewMovie.userRating);
    
    // Track this comparison for non-known movies
    if (!isKnownVsKnown) {
      markMovieAsCompared(newMovie.id);
    }
    
    // Save action for undo
    setLastAction({
      type: isKnownVsKnown ? 'known_comparison' : 'comparison',
      seenMovie: {...seenMovie},
      newMovie: {...newMovie},
      winnerIsSeenMovie: true
    });
    
    console.log('=== END SEEN MOVIE WIN ===');
    
    // Clear current movies and fetch next comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [seenMovie, newMovie, seen, adjustRating, updateMovieRating, fetchRandomMovie, markMovieAsCompared]);

  /**
   * Handle user choosing the new movie as better
   * Updates ratings and fetches next comparison
   */
  /**
   * Handle user choosing the new movie as better
   * Now uses the universal update function
   */
  const handleNewWin = useCallback(() => {
    // Prevent action during loading or if movies aren't loaded
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    console.log('=== NEW MOVIE WIN ===');
    console.log('Before rating adjustment:');
    console.log('Seen movie:', seenMovie.title, 'Rating:', seenMovie.userRating);
    console.log('New movie:', newMovie.title, 'Rating:', newMovie.userRating || newMovie.score);
    
    // Check if this is a known vs known comparison
    const isKnownVsKnown = seen.some(m => m.id === newMovie.id);
    
    // Always calculate new ratings using the Elo algorithm (newMovie wins)
    const { updatedSeenMovie, updatedNewMovie } = adjustRating(newMovie, seenMovie, false);
    
    console.log('After rating adjustment:');
    console.log('Updated seen movie:', updatedSeenMovie.title, 'New rating:', updatedSeenMovie.userRating);
    console.log('Updated new movie:', updatedNewMovie.title, 'New rating:', updatedNewMovie.userRating);
    
    // Update both movies universally - doesn't matter where they came from
    updateMovieRating(seenMovie, updatedSeenMovie.userRating);
    updateMovieRating(newMovie, updatedNewMovie.userRating);
    
    // Track this comparison for non-known movies
    if (!isKnownVsKnown) {
      markMovieAsCompared(newMovie.id);
    }
    
    // Save action for undo
    setLastAction({
      type: isKnownVsKnown ? 'known_comparison' : 'comparison',
      seenMovie: {...seenMovie},
      newMovie: {...newMovie},
      winnerIsSeenMovie: false
    });
    
    console.log('=== END NEW MOVIE WIN ===');
    
    // Fetch next comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [seenMovie, newMovie, seen, adjustRating, updateMovieRating, fetchRandomMovie, markMovieAsCompared]);

  /**
   * Handle user adding new movie to watchlist (haven't seen it)
   * Only available for unknown movies, not known vs known comparisons
   */
  const handleUnseen = useCallback(() => {
    // Prevent action during loading or if movies aren't loaded
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    // Check if this is a known vs known comparison
    const isKnownVsKnown = seen.some(m => m.id === newMovie.id);
    
    if (isKnownVsKnown) {
      // Cannot add already-rated movie to watchlist
      Alert.alert(
        'Already Rated',
        'This movie is already in your rated list. You can\'t add it to watchlist.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Mark movie as compared and add to watchlist
    markMovieAsCompared(newMovie.id);
    onAddToUnseen(newMovie);
    
    // Save action for undo
    setLastAction({
      type: 'unseen',
      movie: {...newMovie}
    });
    
    // Fetch next comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [newMovie, onAddToUnseen, fetchRandomMovie, markMovieAsCompared, seenMovie, seen]);

  /**
   * Handle user skipping this comparison
   * Marks movies as compared but doesn't rate them
   */
  const handleSkip = useCallback(() => {
    // Prevent action during loading
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    // Mark unknown movie as compared (even in known vs known mode)
    if (comparisonPattern !== 4 || !seen.some(m => m.id === newMovie.id)) {
      markMovieAsCompared(newMovie.id);
    }
    
    // Save action for undo
    setLastAction({
      type: 'skip',
      seenMovie: {...seenMovie},
      newMovie: {...newMovie},
      isKnownVsKnown: comparisonPattern === 4 && seen.some(m => m.id === newMovie.id)
    });
    
    // Fetch next comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [seenMovie, newMovie, fetchRandomMovie, markMovieAsCompared, comparisonPattern, seen]);

  /**
   * Handle tough choice - when user can't decide between movies
   * Rates movies similarly with small differences to keep them distinct
   */
  /**
   * Handle tough choice - when user can't decide between movies
   * Now uses the universal update function
   */
  const handleToughChoice = useCallback(() => {
    // Prevent action during loading
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    console.log('=== TOUGH CHOICE ===');
    console.log('Before rating adjustment:');
    console.log('Seen movie:', seenMovie.title, 'Rating:', seenMovie.userRating);
    console.log('New movie:', newMovie.title, 'Rating:', newMovie.userRating || newMovie.score);
    
    // Check if this is known vs known comparison
    const isKnownVsKnown = seen.some(m => m.id === newMovie.id);
    
    let newSeenRating, newMovieRating;
    
    if (isKnownVsKnown) {
      // For known vs known, average the ratings with slight difference
      const avgRating = (seenMovie.userRating + newMovie.userRating) / 2;
      
      // Give seen movie slightly higher rating to keep them distinct
      newSeenRating = Math.min(10, Math.max(1, avgRating + 0.05));
      newMovieRating = Math.min(10, Math.max(1, avgRating - 0.05));
    } else {
      // For known vs unknown, rate them close to each other
      markMovieAsCompared(newMovie.id);
      
      // Calculate average of current ratings
      const averageRating = (seenMovie.userRating + (newMovie.userRating || newMovie.score)) / 2;
      
      // Determine which movie gets slight boost (lower-rated one gets help)
      const seenRating = seenMovie.userRating;
      const newRating = newMovie.userRating || newMovie.score;
      
      if (seenRating <= newRating) {
        // Seen movie gets small boost
        newSeenRating = Math.min(10, Math.max(1, averageRating + 0.1));
        newMovieRating = Math.max(1, Math.min(10, averageRating - 0.1));
      } else {
        // New movie gets boost
        newMovieRating = Math.min(10, Math.max(1, averageRating + 0.1));
        newSeenRating = Math.max(1, Math.min(10, averageRating - 0.1));
      }
    }
    
    console.log('After rating adjustment:');
    console.log('New seen movie rating:', newSeenRating);
    console.log('New movie rating:', newMovieRating);
    
    // Update both movies universally - doesn't matter where they came from
    updateMovieRating(seenMovie, newSeenRating);
    updateMovieRating(newMovie, newMovieRating);
    
    // Save action for undo
    setLastAction({
      type: isKnownVsKnown ? 'tough_known' : 'tough',
      seenMovie: {...seenMovie},
      newMovie: {...newMovie}
    });
    
    console.log('=== END TOUGH CHOICE ===');
    
    // Fetch next comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [seenMovie, newMovie, seen, updateMovieRating, fetchRandomMovie, markMovieAsCompared]);

  /**
   * Handle undo last action
   * Reverses the most recent comparison and restores previous state
   */
  const handleUndo = () => {
    // Only proceed if there's an action to undo and not currently loading
    if (!lastAction || isLoadingRef.current) return;
    
    let filteredSeen, restoredSeen, filteredUnseen;
    
    // Handle different types of actions
    switch (lastAction.type) {
      case 'comparison':
        // Undo a regular movie comparison
        
        // Remove the new movie from seen list
        filteredSeen = seen.filter(m => m.id !== lastAction.newMovie.id);
        
        // Restore original rating of the seen movie
        restoredSeen = filteredSeen.map(m => 
          m.id === lastAction.seenMovie.id ? lastAction.seenMovie : m
        );
        
        setSeen(restoredSeen); // Update seen movies list
        
        // Remove from compared movies tracking
        setComparedMovies(prev => prev.filter(id => id !== lastAction.newMovie.id));
        
        // Decrement comparison count
        setComparisonCount(prev => Math.max(0, prev - 1));
        
        // Roll back comparison pattern (reverse the increment)
        setComparisonPattern(prev => (prev - 1 + 5) % 5); // 4,3,2,1,0,4,3,...
        
        // Restore movies for new comparison
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false); // Hide loading indicator
        break;
        
      case 'known_comparison':
        // Undo a known vs known comparison
        
        // Restore both movie ratings to their original values
        restoredSeen = seen.map(m => {
          if (m.id === lastAction.seenMovie.id) return lastAction.seenMovie;
          if (m.id === lastAction.newMovie.id) return lastAction.newMovie;
          return m; // Keep other movies unchanged
        });
        
        setSeen(restoredSeen); // Update seen movies list
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        
        // Restore movies for comparison
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'unseen':
        // Undo adding movie to watchlist
        
        // Remove movie from watchlist (this is handled by parent component)
        // We need to filter the unseen array and update it
        filteredUnseen = unseen.filter(m => m.id !== lastAction.movie.id);
        onAddToUnseen(filteredUnseen); // Update watchlist
        
        // Remove from compared movies tracking
        setComparedMovies(prev => prev.filter(id => id !== lastAction.movie.id));
        
        // Decrement comparison count
        setComparisonCount(prev => Math.max(0, prev - 1));
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        
        // Restore movie for comparison (we need to get the seen movie from somewhere)
        // Since we only saved the new movie, we'll need to fetch a new comparison
        setNewMovie(lastAction.movie);
        setLoading(false);
        break;
        
      case 'skip':
        // Undo skipping a comparison
        
        if (!lastAction.isKnownVsKnown) {
          // Remove from compared movies if it was an unknown movie
          setComparedMovies(prev => prev.filter(id => id !== lastAction.newMovie.id));
          
          // Decrement comparison count
          setComparisonCount(prev => Math.max(0, prev - 1));
        }
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        
        // Restore both movies for comparison
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'tough':
        // Undo a tough choice for unknown movie
        
        // Remove the new movie from seen list
        filteredSeen = seen.filter(m => m.id !== lastAction.newMovie.id);
        
        // Restore original rating of the seen movie
        restoredSeen = filteredSeen.map(m => 
          m.id === lastAction.seenMovie.id ? lastAction.seenMovie : m
        );
        
        setSeen(restoredSeen);
        
        // Remove from compared movies
        setComparedMovies(prev => prev.filter(id => id !== lastAction.newMovie.id));
        
        // Decrement comparison count
        setComparisonCount(prev => Math.max(0, prev - 1));
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        
        // Restore movies for comparison
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'tough_known':
        // Undo a tough choice for known vs known
        
        // Restore both movie ratings
        restoredSeen = seen.map(m => {
          if (m.id === lastAction.seenMovie.id) return lastAction.seenMovie;
          if (m.id === lastAction.newMovie.id) return lastAction.newMovie;
          return m;
        });
        
        setSeen(restoredSeen);
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        
        // Restore movies for comparison
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
      
      default:
        // Unknown action type, do nothing
        break;
    }
    
    // Clear the last action since it's been undone
    setLastAction(null);
  };

  /**
   * Handle retry after error
   * Clears error state and attempts to fetch movies again
   */
  const handleRetry = useCallback(() => {
    setError(null); // Clear error message
    setLoading(true); // Show loading indicator
    setNewMovie(null); // Clear current movies
    setSeenMovie(null);
    isLoadingRef.current = false; // Reset loading flag
    fetchRandomMovie(); // Try fetching again
  }, [fetchRandomMovie]);
  
  /**
   * Handle baseline completion acknowledgment
   * Closes the baseline complete modal
   */
  const handleBaselineCompleteAcknowledge = useCallback(() => {
    setShowBaselineCompleteModal(false);
  }, []);

  /**
   * Safely build poster URL from TMDB image path
   * Falls back to placeholder if no path provided
   */
  const getPosterUrl = path =>
    path
      ? `https://image.tmdb.org/t/p/w342${path}` // TMDB image URL with medium width
      : `https://image.tmdb.org/t/p/w342`; // Placeholder URL if no path

  // Loading state UI
  if (loading) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={stateStyles.loadingContainer}>
          {/* Loading spinner */}
          <ActivityIndicator size="large" color={isDarkMode ? '#FFD700' : '#4B0082'} />
          {/* Loading message based on current phase */}
          <Text style={[stateStyles.loadingText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
            {baselineComplete ? 'Finding movies tailored to your taste...' : 'Loading movies for comparison...'}
          </Text>
          {/* Progress indicator */}
          <Text style={[styles.progressText, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
            {!baselineComplete ? 
              `Progress: ${Math.min(comparedMovies.length, uniqueBaselineMovies.length)}/${uniqueBaselineMovies.length} movies` :
              'Custom recommendations enabled'
            }
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state UI
  if (error) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={[stateStyles.errorContainer, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5' }]}>
          {/* Error icon */}
          <Ionicons name="information-circle-outline" size={48} color={isDarkMode ? '#FFD700' : '#4B0082'} />
          {/* Error message */}
          <Text style={[stateStyles.errorText, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
            {error}
          </Text>
          {/* Additional help text */}
          <Text style={[stateStyles.errorSubText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
            {seen.length < 3 ? 'Go to the Add Movie tab to rate more movies.' : 'This may be temporary. Try again or select a different genre.'}
          </Text>
          {/* Retry button */}
          <TouchableOpacity
            style={[stateStyles.retryButton, { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }]}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <Text style={[stateStyles.retryButtonText, { color: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Return early if movies aren't loaded yet
  if (!seenMovie || !newMovie) return null;

  // Check if this is a known vs known comparison for UI display
  const isKnownVsKnown = seen.some(m => m.id === newMovie.id);

  // Main UI
  return (
    <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
      {/* Header section */}
      <View
        style={[
          headerStyles.screenHeader,
          { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderBottomColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' },
        ]}
      >
        {/* Title changes based on comparison type and phase */}
        <Text style={[headerStyles.screenTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
          {isKnownVsKnown ? 'Compare Your Ratings' : 
            baselineComplete ? 'Movie Recommendations' : 'Movie Ratings'}
        </Text>
        {/* Action buttons row */}
        <View style={styles.actionRow}>
          {/* Progress badge (only during baseline phase for unknown movies) */}
          {!baselineComplete && !isKnownVsKnown && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                {Math.min(comparedMovies.length, uniqueBaselineMovies.length)}/{uniqueBaselineMovies.length}
              </Text>
            </View>
          )}
          {/* Undo button (only if there's an action to undo) */}
          {lastAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUndo}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo" size={24} color={isDarkMode ? '#FFD700' : '#4B0082'} />
            </TouchableOpacity>
          )}
          {/* Filter button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openFilterModal}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={24} color={isDarkMode ? '#FFD700' : '#4B0082'} />
            {/* Filter active indicator */}
            {selectedGenre && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
          {/* Reset button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color={isDarkMode ? '#FFD700' : '#4B0082'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main comparison content */}
      <View style={[compareStyles.compareContainer, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={compareStyles.compareContent}>
          {/* Question text changes based on comparison type */}
          <Text style={[compareStyles.compareTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            {isKnownVsKnown ? 'Which movie do you prefer?' : 'Which movie was better?'}
          </Text>
          
          {/* Movie comparison UI - two movies side by side */}
          <View style={compareStyles.compareMovies}>
            {/* Left side: Known movie (user has rated this) */}
            <TouchableOpacity
              style={[compareStyles.posterContainer, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5' }]}
              onPress={handleSeenWin} // User chooses this movie as better
              activeOpacity={0.7}
            >
              {/* Movie poster image */}
              <Image
                source={{ uri: getPosterUrl(seenMovie.poster || seenMovie.poster_path) }}
                style={compareStyles.poster}
                resizeMode="cover"
              />
              {/* Movie info overlay */}
              <View style={compareStyles.posterOverlay}>
                {/* Movie title */}
                <Text
                  style={[movieCardStyles.movieTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}
                  numberOfLines={2}
                >
                  {seenMovie.title}
                </Text>
                {/* User's rating */}
                <Text style={[compareStyles.ratingTag, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                  Your rating: {seenMovie.userRating.toFixed(1)}
                </Text>
                {/* Movie genres */}
                <Text style={[movieCardStyles.genresText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                  {(seenMovie.genre_ids || seenMovie.genreIds || []).map(id => genres[id] || 'Unknown').join(', ')}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Center VS divider */}
            <View style={compareStyles.vsContainer}>
              <Text style={[compareStyles.vsText, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                VS
              </Text>
            </View>
            
            {/* Right side: New movie (unknown or second known movie) */}
            <TouchableOpacity
              style={[compareStyles.posterContainer, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5' }]}
              onPress={handleNewWin} // User chooses this movie as better
              activeOpacity={0.7}
            >
              {/* Movie poster image */}
              <Image
                source={{ uri: getPosterUrl(newMovie.poster || newMovie.poster_path) }}
                style={compareStyles.poster}
                resizeMode="cover"
              />
              {/* Movie info overlay */}
              <View style={compareStyles.posterOverlay}>
                {/* Movie title */}
                <Text
                  style={[movieCardStyles.movieTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}
                  numberOfLines={2}
                >
                  {newMovie.title}
                </Text>
                {/* Rating display - changes based on whether user has rated this */}
                {isKnownVsKnown || seen.some(m => m.id === newMovie.id) ? (
                  <Text style={[compareStyles.ratingTag, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                    Your rating: {newMovie.userRating.toFixed(1)}
                  </Text>
                ) : (
                  <Text style={[compareStyles.ratingTag, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                    TMDb: {newMovie.score.toFixed(1)} ({newMovie.voteCount} votes)
                  </Text>
                )}
                {/* Movie genres */}
                <Text style={[movieCardStyles.genresText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                  {(newMovie.genre_ids || newMovie.genreIds || []).map(id => genres[id] || 'Unknown').join(', ')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Action buttons below the movies */}
          <View style={compareStyles.actionButtons}>
            {/* Tough choice button - when user can't decide */}
            <TouchableOpacity
              style={[compareStyles.toughButton, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}
              onPress={handleToughChoice}
              activeOpacity={0.7}
            >
              <Text style={[compareStyles.toughButtonText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                Too tough to decide
              </Text>
            </TouchableOpacity>
            
            {/* Add to watchlist button - only for unknown movies */}
            {!isKnownVsKnown && !seen.some(m => m.id === newMovie.id) && (
              <TouchableOpacity
                style={[compareStyles.unseenButton, { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}
                onPress={handleUnseen}
                activeOpacity={0.7}
              >
                <Text style={[compareStyles.unseenButtonText, { color: isDarkMode ? '#F5F5F5' : '#FFFFFF' }]}>
                  Add to watchlist
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Skip button */}
            <TouchableOpacity
              style={[buttonStyles.skipButton, { borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={[buttonStyles.skipButtonText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelFilters} // Android back button handling
      >
        {/* Semi-transparent overlay */}
        <View style={[modalStyles.modalOverlay, styles.modalOverlay]}>
          {/* Modal content container */}
          <View style={[
            modalStyles.modalContent,
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#4B0082' : '#FFFFFF' }
          ]}>
            {/* Modal title */}
            <Text style={[
              modalStyles.modalTitle,
              { color: isDarkMode ? '#F5F5F5' : '#333' }
            ]}>
              Filter Movies
            </Text>
            
            {/* Genre filter section */}
            <View style={styles.filterSection}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? '#F5F5F5' : '#333' }
              ]}>
                Filter by Genre
              </Text>
              
              {/* All genres button */}
              <TouchableOpacity
                style={[
                  styles.genreButton,
                  { 
                    backgroundColor: tempGenre === null 
                      ? (isDarkMode ? '#8A2BE2' : '#4B0082') 
                      : 'transparent',
                    borderColor: isDarkMode ? '#8A2BE2' : '#4B0082'
                  }
                ]}
                onPress={() => setTempGenre(null)} // Clear genre filter
              >
                <Text style={[
                  styles.genreButtonText,
                  { 
                    color: tempGenre === null 
                      ? '#FFFFFF' 
                      : (isDarkMode ? '#D3D3D3' : '#666')
                  }
                ]}>
                  All Genres
                </Text>
              </TouchableOpacity>
              
              {/* Scrollable list of genre buttons */}
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genreScrollContent}
              >
                {Object.entries(genres)
                  .filter(([id, name]) => name) // Only include genres with names
                  .map(([id, name]) => (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.genreButton,
                        { 
                          backgroundColor: tempGenre === id 
                            ? (isDarkMode ? '#8A2BE2' : '#4B0082') 
                            : 'transparent',
                          borderColor: isDarkMode ? '#8A2BE2' : '#4B0082'
                        }
                      ]}
                      onPress={() => setTempGenre(id)} // Select this genre
                    >
                      <Text style={[
                        styles.genreButtonText,
                        { 
                          color: tempGenre === id 
                            ? '#FFFFFF' 
                            : (isDarkMode ? '#D3D3D3' : '#666')
                        }
                      ]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))
                }
              </ScrollView>
            </View>
            
            {/* Modal action buttons */}
            <View style={styles.modalButtons}>
              {/* Apply filters button */}
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
                ]}
                onPress={applyFilters}
              >
                <Text style={[
                  styles.applyButtonText,
                  { color: isDarkMode ? '#4B0082' : '#FFFFFF' }
                ]}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
              {/* Cancel button */}
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }
                ]}
                onPress={cancelFilters}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { color: isDarkMode ? '#D3D3D3' : '#666' }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Baseline Complete Modal */}
      <Modal
        visible={showBaselineCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleBaselineCompleteAcknowledge}
      >
        {/* Semi-transparent overlay */}
        <View style={[modalStyles.modalOverlay, styles.modalOverlay]}>
          {/* Modal content */}
          <View style={[
            modalStyles.modalContent,
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#4B0082' : '#FFFFFF' }
          ]}>
            {/* Success icon */}
            <Ionicons 
              name="checkmark-circle" 
              size={64} 
              color={isDarkMode ? '#FFD700' : '#4B0082'} 
              style={styles.successIcon}
            />
            
            {/* Modal title */}
            <Text style={[
              modalStyles.modalTitle,
              { color: isDarkMode ? '#FFD700' : '#4B0082', fontSize: 24 }
            ]}>
              Baseline Complete!
            </Text>
            
            {/* Congratulations message */}
            <Text style={[
              styles.completionText,
              { color: isDarkMode ? '#F5F5F5' : '#333' }
            ]}>
              You've completed the baseline movie ratings. Congratulations!
            </Text>
            
            {/* Explanation of what happens next */}
            <Text style={[
              styles.completionSubtext,
              { color: isDarkMode ? '#D3D3D3' : '#666' }
            ]}>
              From now on, movies will be recommended based on your personal preferences. The more movies you rate, the better your recommendations will become.
            </Text>
            
            {/* Continue button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
              ]}
              onPress={handleBaselineCompleteAcknowledge}
            >
              <Text style={[
                styles.continueButtonText,
                { color: isDarkMode ? '#4B0082' : '#FFFFFF' }
              ]}>
                Continue to Recommendations
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Component styles
const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row', // Arrange buttons horizontally
    alignItems: 'center', // Center vertically
  },
  actionButton: {
    marginLeft: 16, // Space between buttons
    padding: 4, // Touchable area
    position: 'relative', // For badge positioning
  },
  filterBadge: {
    position: 'absolute', // Position over the filter icon
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4, // Make it circular
    backgroundColor: '#FF9500', // Orange color to indicate active filter
  },
  modalOverlay: {
    justifyContent: 'center', // Center modal vertically
    alignItems: 'center', // Center modal horizontally
    zIndex: 1000, // Ensure modal appears above other content
  },
  modalContent: {
    width: '90%', // Take up most of screen width
    maxHeight: '80%', // Limit height to prevent overflow
    elevation: 10, // Android shadow
    shadowOpacity: 0.5, // iOS shadow
    zIndex: 1001, // Ensure content appears above overlay
  },
  filterSection: {
    marginBottom: 20, // Space below this section
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600', // Semi-bold text
    marginBottom: 12, // Space below title
  },
  genreScrollContent: {
    flexDirection: 'row', // Arrange genre buttons horizontally
    paddingVertical: 8, // Vertical padding for touch area
  },
  genreButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16, // Rounded corners
    borderWidth: 1, // Border around button
    marginRight: 8, // Space between buttons
    minWidth: 80, // Minimum button width
    alignItems: 'center', // Center text
  },
  genreButtonText: {
    fontSize: 14,
    fontWeight: '500', // Medium font weight
  },
  modalButtons: {
    flexDirection: 'row', // Arrange buttons side by side
    justifyContent: 'space-between', // Spread buttons apart
    marginTop: 16, // Space above buttons
  },
  applyButton: {
    flex: 1, // Take up half the space
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center', // Center text
    marginRight: 8, // Space between buttons
  },
  applyButtonText: {
    fontWeight: '600', // Bold text
    fontSize: 16,
  },
  cancelButton: {
    flex: 1, // Take up half the space
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1, // Border instead of background
    alignItems: 'center',
    marginLeft: 8, // Space between buttons
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  progressText: {
    marginTop: 12, // Space above text
    fontSize: 14,
    fontWeight: '500',
  },
  progressBadge: {
    backgroundColor: '#FFD700', // Gold background
    borderRadius: 12, // Rounded corners
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 10, // Space before other buttons
  },
  progressBadgeText: {
    color: '#4B0082', // Purple text
    fontWeight: 'bold',
    fontSize: 12,
  },
  successIcon: {
    alignSelf: 'center', // Center the icon
    marginBottom: 16, // Space below icon
  },
  completionText: {
    fontSize: 18,
    textAlign: 'center', // Center text
    marginBottom: 16,
  },
  completionSubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22, // Line spacing for readability
    marginBottom: 24,
  },
  continueButton: {
    width: '100%', // Full width
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    fontWeight: '600',
    fontSize: 16,
  }
});

// Default props to prevent errors if parent doesn't provide them
WildcardScreen.defaultProps = {
  seen: [],
  unseen: [],
  genres: {}
};

export default WildcardScreen;
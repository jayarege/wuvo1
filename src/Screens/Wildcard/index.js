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
import layoutStyles from '../../Styles/layoutStyles';
import headerStyles from '../../Styles/headerStyles';
import compareStyles from '../../Styles/compareStyles';
import stateStyles from '../../Styles/StateStyles';
import movieCardStyles from '../../Styles/movieCardStyles';
import buttonStyles from '../../Styles/buttonStyles';
import modalStyles from '../../Styles/modalStyles';

const API_KEY = 'b401be0ea16515055d8d0bde16f80069';
const MIN_VOTE_COUNT = 500;
const MIN_SCORE = 7.0;
const STORAGE_KEY = 'wuvo_compared_movies';
const BASELINE_COMPLETE_KEY = 'wuvo_baseline_complete';
const COMPARISON_COUNT_KEY = 'wuvo_comparison_count';
const COMPARISON_PATTERN_KEY = 'wuvo_comparison_pattern';

// Enhanced movie baseline with top movies
const baselineMovies = [
  { id: 238, title: "The Godfather" },
  { id: 389, title: "12 Angry Men" },
  { id: 240, title: "The Godfather: Part II" },
  { id: 278, title: "The Shawshank Redemption" },
  { id: 346, title: "Seven Samurai" },
  { id: 424, title: "Schindler's List" },
  { id: 680, title: "Pulp Fiction" },
  { id: 429, title: "The Good, the Bad and the Ugly" },
  { id: 901, title: "City Lights" },
  { id: 14537, title: "Harakiri" },
  { id: 510, title: "One Flew Over the Cuckoo's Nest" },
  { id: 539, title: "Psycho" },
  { id: 5915, title: "Modern Times" },
  { id: 122, title: "The Lord of the Rings: The Return of the King" },
  { id: 769, title: "GoodFellas" },
  { id: 567, title: "Rear Window" },
  { id: 155, title: "The Dark Knight" },
  { id: 637, title: "It's a Wonderful Life" },
  { id: 496243, title: "Parasite" },
  { id: 25793, title: "Children of Paradise" },
  { id: 28, title: "Apocalypse Now" },
  { id: 950, title: "Sunset Boulevard" },
  { id: 289, title: "Casablanca" },
  { id: 18148, title: "Tokyo Story" },
  { id: 872, title: "Singin' in the Rain" },
  { id: 32487, title: "Sherlock Jr." },
  { id: 935, title: "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb" },
  { id: 975, title: "Paths of Glory" },
  { id: 1891, title: "Star Wars: The Empire Strikes Back" },
  { id: 12493, title: "High and Low" },
  { id: 705, title: "All About Eve" },
  { id: 595, title: "Metropolis" },
  { id: 120, title: "The Lord of the Rings: The Fellowship of the Ring" },
  { id: 25051, title: "Le Trou" },
  { id: 914, title: "The Great Dictator" },
  { id: 335, title: "Once Upon a Time in the West" },
  { id: 274, title: "The Silence of the Lambs" },
  { id: 426, title: "Vertigo" },
  { id: 311, title: "Once Upon a Time in America" },
  { id: 548, title: "Rashomon" },
  { id: 1544, title: "Ran" },
  { id: 30594, title: "Woman in the Dunes" },
  { id: 25237, title: "Come and See" },
  { id: 996, title: "Double Indemnity" },
  { id: 121, title: "The Lord of the Rings: The Two Towers" },
  { id: 15, title: "Citizen Kane" },
  { id: 12154, title: "Fanny and Alexander" },
  { id: 598, title: "City of God" },
  { id: 349, title: "The Apartment" },
  { id: 38, title: "Alien" },
  { id: 423, title: "The Pianist" },
  { id: 807, title: "Se7en" },
  { id: 77338, title: "The Intouchables" },
  { id: 37165, title: "The Departed" }, 
  { id: 87827, title: "Life of Pi" },
  { id: 8587, title: "The Lion King" },
  { id: 1892, title: "Star Wars" },
  { id: 603, title: "The Matrix" },
  { id: 98, title: "Gladiator" },
  { id: 857, title: "Saving Private Ryan" },
  { id: 745, title: "The Sixth Sense" },
  { id: 299534, title: "Avengers: Endgame" },
  { id: 19995, title: "Avatar" },
  { id: 634649, title: "Spider-Man: No Way Home" },
  { id: 140607, title: "Star Wars: The Force Awakens" },
  { id: 299536, title: "Avengers: Infinity War" },
  { id: 24428, title: "The Avengers" },
  { id: 10138, title: "Iron Man" },
  { id: 27205, title: "Inception" },
  { id: 157336, title: "Interstellar" },
  { id: 324857, title: "Spider-Man: Into the Spider-Verse" },
  { id: 374463, title: "Wonder Woman" },
  { id: 284052, title: "Doctor Strange" },
  { id: 12477, title: "Grave of the Fireflies" },
  { id: 453395, title: "Doctor Strange in the Multiverse of Madness" },
  { id: 361743, title: "Top Gun: Maverick" },
  { id: 505642, title: "Black Panther: Wakanda Forever" },
  { id: 496243, title: "Parasite" },
  { id: 13, title: "Forrest Gump" },
  { id: 497, title: "The Green Mile" },
  { id: 637, title: "Life Is Beautiful" },
  { id: 27205, title: "Inception" },
  { id: 11216, title: "The Pianist" },
  { id: 718789, title: "Nomadland" },
  { id: 615457, title: "Nobody" },
  { id: 530915, title: "1917" },
  { id: 585245, title: "Dune" },
  { id: 335977, title: "Indiana Jones and the Dial of Destiny" },
  { id: 335984, title: "Blade Runner 2049" },
  { id: 438631, title: "Dune: Part Two" }
];

// Remove duplicates from baseline movies
const uniqueBaselineMovies = Array.from(new Set(baselineMovies.map(m => m.id)))
  .map(id => {
    return baselineMovies.find(m => m.id === id);
  });

// Storage keys for skipped and permanently hidden movies
const SKIPPED_MOVIES_KEY = 'wuvo_skipped_movies';

function WildcardScreen({ seen, setSeen, unseen, onAddToSeen, onAddToUnseen, genres, isDarkMode }) {
  const [seenMovie, setSeenMovie] = useState(null);
  const [newMovie, setNewMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [comparedMovies, setComparedMovies] = useState([]);
  const [skippedMovies, setSkippedMovies] = useState([]); // Movies user has skipped (never show again)
  const [baselineComplete, setBaselineComplete] = useState(false);
  const [showBaselineCompleteModal, setShowBaselineCompleteModal] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [tempGenre, setTempGenre] = useState(null);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [comparisonPattern, setComparisonPattern] = useState(0); // 0-4: tracks where we are in the pattern
  const isLoadingRef = useRef(false);

  // Load compared movies and other state from storage on initial load
  useEffect(() => {
    const loadStoredState = async () => {
      try {
        // Load compared movies
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          setComparedMovies(JSON.parse(jsonValue));
        }
        
        // Load skipped movies
        const skippedValue = await AsyncStorage.getItem(SKIPPED_MOVIES_KEY);
        if (skippedValue != null) {
          setSkippedMovies(JSON.parse(skippedValue));
        }
        
        // Load baseline complete status
        const baselineCompleteValue = await AsyncStorage.getItem(BASELINE_COMPLETE_KEY);
        const isBaselineComplete = baselineCompleteValue === 'true';
        setBaselineComplete(isBaselineComplete);
        
        // Load comparison count
        const countValue = await AsyncStorage.getItem(COMPARISON_COUNT_KEY);
        if (countValue != null) {
          setComparisonCount(parseInt(countValue, 10));
        }
        
        // Load comparison pattern position
        const patternValue = await AsyncStorage.getItem(COMPARISON_PATTERN_KEY);
        if (patternValue != null) {
          setComparisonPattern(parseInt(patternValue, 10));
        }
        
        console.log(`Loaded ${JSON.parse(jsonValue || '[]').length} compared movies`);
        console.log(`Loaded ${JSON.parse(skippedValue || '[]').length} skipped movies`);
        console.log(`Baseline complete: ${isBaselineComplete}`);
        console.log(`Comparison count: ${countValue}`);
        console.log(`Comparison pattern: ${patternValue}`);
      } catch (e) {
        console.error('Failed to load stored state', e);
      }
    };
    
    loadStoredState();
  }, []);

  // Save compared movies to storage whenever they change
  useEffect(() => {
    const saveComparedMovies = async () => {
      try {
        const jsonValue = JSON.stringify(comparedMovies);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      } catch (e) {
        console.error('Failed to save compared movies', e);
      }
    };
    
    if (comparedMovies.length > 0) {
      saveComparedMovies();
    }
  }, [comparedMovies]);

  // Save baseline complete status
  useEffect(() => {
    const saveBaselineComplete = async () => {
      try {
        await AsyncStorage.setItem(BASELINE_COMPLETE_KEY, baselineComplete.toString());
      } catch (e) {
        console.error('Failed to save baseline complete status', e);
      }
    };
    
    saveBaselineComplete();
  }, [baselineComplete]);

  // Save comparison count
  useEffect(() => {
    const saveComparisonCount = async () => {
      try {
        await AsyncStorage.setItem(COMPARISON_COUNT_KEY, comparisonCount.toString());
      } catch (e) {
        console.error('Failed to save comparison count', e);
      }
    };
    
    saveComparisonCount();
  }, [comparisonCount]);

  // Save comparison pattern
  useEffect(() => {
    const saveComparisonPattern = async () => {
      try {
        await AsyncStorage.setItem(COMPARISON_PATTERN_KEY, comparisonPattern.toString());
      } catch (e) {
        console.error('Failed to save comparison pattern', e);
      }
    };
    
    saveComparisonPattern();
  }, [comparisonPattern]);

  // Get next baseline movie to compare
  const getNextBaselineMovie = useCallback(() => {
    // Find remaining baseline movies (not yet compared)
    const remainingBaselineMovies = uniqueBaselineMovies.filter(
      m => !comparedMovies.includes(m.id) && !seen.some(sm => sm.id === m.id)
    );
    
    if (remainingBaselineMovies.length === 0) {
  // No more baseline movies, set baseline complete
  if (!baselineComplete) {
    setBaselineComplete(true);
    setShowBaselineCompleteModal(true);
    
    // Important: Reset the comparison pattern when completing the baseline
    // This ensures we'll start with an unknown movie (pattern 0) after completion
    setComparisonPattern(0);
  }
  return null;
}
    
    // Get a random movie from the remaining ones
    return remainingBaselineMovies[Math.floor(Math.random() * remainingBaselineMovies.length)];
  }, [comparedMovies, baselineComplete, seen]);

  // Add a movie to the compared list
  const markMovieAsCompared = useCallback((movieId) => {
    if (!comparedMovies.includes(movieId)) {
      setComparedMovies(prev => [...prev, movieId]);
    }
    
    // Increment comparison count
    setComparisonCount(prev => prev + 1);
    
    // Update comparison pattern
    setComparisonPattern(prev => (prev + 1) % 5); // 0,1,2,3,4,0,1,2,3,4,...
  }, [comparedMovies]);

  // Get movie details from TMDB API
  const getMovieDetails = useCallback(async (movieId) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        title: data.title,
        score: data.vote_average,
        voteCount: data.vote_count,
        poster: data.poster_path,
        overview: data.overview,
        release_date: data.release_date || 'Unknown',
        genre_ids: data.genres.map(g => g.id).slice(0, 3),
        release_year: new Date(data.release_date).getFullYear(),
        // Use TMDB score directly as the starting rating
        eloRating: data.vote_average * 10, // Convert to 0-100 scale
        userRating: data.vote_average
      };
    } catch (error) {
      console.error(`Error fetching details for movie ${movieId}:`, error);
      throw error;
    }
  }, []);

  // Get similar movies based on user's top rated movies
  const getSimilarMovie = useCallback(async () => {
    if (seen.length === 0) {
      throw new Error('Not enough rated movies to generate recommendations');
    }
    
    // Get user's top 10 movies (or fewer if they haven't rated 10 yet)
    const topMovies = [...seen]
      .sort((a, b) => b.userRating - a.userRating)
      .slice(0, Math.min(10, seen.length));
    
    // Extract relevant features from top movies
    const favoriteGenres = {};
    let totalYears = 0;
    
    topMovies.forEach(movie => {
      // Collect genre preferences
      if (movie.genre_ids) {
        movie.genre_ids.forEach(genreId => {
          favoriteGenres[genreId] = (favoriteGenres[genreId] || 0) + movie.userRating;
        });
      }
      
      // Collect year preferences if available
      if (movie.release_date) {
        const year = new Date(movie.release_date).getFullYear();
        if (!isNaN(year)) {
          totalYears += year * (movie.userRating / 10); // Weight by rating
        }
      }
    });
    
    // Calculate average preferred year (weighted by rating)
    const totalRatings = topMovies.reduce((sum, movie) => sum + movie.userRating, 0);
    const avgYear = Math.round(totalYears / totalRatings);
    
    // Find preferred genre (highest total rating)
    let preferredGenreId = null;
    let highestGenreScore = 0;
    
    Object.entries(favoriteGenres).forEach(([genreId, score]) => {
      if (score > highestGenreScore) {
        highestGenreScore = score;
        preferredGenreId = genreId;
      }
    });
    
    // Build API query based on user preferences
    let apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=vote_average.desc&vote_count.gte=${MIN_VOTE_COUNT}`;
    
    // Add year filter if we have year data
    if (!isNaN(avgYear)) {
      // Create a window of +/- 10 years around the average preferred year
      const startYear = Math.max(1900, avgYear - 10);
      const endYear = Math.min(new Date().getFullYear(), avgYear + 10);
      apiUrl += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`;
    }
    
    // Add genre filter if we have genre preference and it matches the selected filter
    if (preferredGenreId && (!selectedGenre || selectedGenre === preferredGenreId)) {
      apiUrl += `&with_genres=${preferredGenreId}`;
    } else if (selectedGenre) {
      apiUrl += `&with_genres=${selectedGenre}`;
    }
    
    // Add random page (1-10) to get more variety
// Occasionally use different sort orders to get variety
const sortOptions = [
  'vote_average.desc', 
  'popularity.desc',
  'primary_release_date.desc'
];
const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
apiUrl = apiUrl.replace('vote_average.desc', randomSort);

// Fetch first to get total page count
const initialResponse = await fetch(apiUrl);
if (!initialResponse.ok) {
  throw new Error('Failed to fetch similar movies');
}
const initialData = await initialResponse.json();
const maxPage = Math.min(initialData.total_pages || 1, 20);

// Only fetch another page if we have multiple pages
const page = maxPage > 1 ? Math.floor(Math.random() * maxPage) + 1 : 1;
apiUrl += `&page=${page}`;
    
    // Fetch similar movies
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch similar movies');
    }
    
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      throw new Error('No similar movies found');
    }
    
    // Create a set of all IDs we want to exclude
    const excludedIds = new Set();
    
    // Add all movies we've already seen
    seen.forEach(movie => excludedIds.add(movie.id));
    
    // Add all movies in the watchlist
    unseen.forEach(movie => excludedIds.add(movie.id));
    
    // Add all movies we've already compared
    comparedMovies.forEach(id => excludedIds.add(id));
    
    // Filter out movies already seen, in watchlist, already compared, or without posters
    const filteredResults = data.results.filter(
      m =>
        m.poster_path &&
        m.vote_average >= MIN_SCORE &&
        !excludedIds.has(m.id)
    );
    
    if (filteredResults.length === 0) {
      // If no movies found, try a different approach - search for popular movies
      const popularApiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${Math.floor(Math.random() * 20) + 1}`;
      
      const popularResponse = await fetch(popularApiUrl);
      
      if (!popularResponse.ok) {
        throw new Error('Failed to fetch popular movies');
      }
      
      const popularData = await popularResponse.json();
      
      // Filter again
      const popularFiltered = popularData.results.filter(
        m =>
          m.poster_path &&
          !excludedIds.has(m.id)
      );
      
      if (popularFiltered.length === 0) {
        throw new Error('No new movies found to compare. Try rating more movies first.');
      }
      
      // Pick a random movie from the filtered popular results
      const randomMovie = popularFiltered[Math.floor(Math.random() * popularFiltered.length)];
      
      // Format the movie data
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
    }
    
    // Pick a random movie from the filtered results
  // Shuffle the filtered results to avoid always picking the same ones
const shuffledResults = [...filteredResults].sort(() => 0.5 - Math.random());

// Pick the first one after shuffling
const randomMovie = shuffledResults[0];
    
    // Format the movie data
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
  }, [seen, unseen, selectedGenre, comparedMovies]);

  // Get a pair of known movies for comparison (occasionally)
  const getKnownVsKnownPair = useCallback(async () => {
    if (seen.length < 5) {
      throw new Error('Not enough rated movies for known vs known comparison');
    }
    
    // Filter by genre if specified
    let eligibleMovies = seen;
    if (selectedGenre) {
      eligibleMovies = seen.filter(m => 
        m.genre_ids && m.genre_ids.includes(parseInt(selectedGenre))
      );
      
      if (eligibleMovies.length < 5) {
        throw new Error('Not enough movies in this genre');
      }
    }
    
    // Get two different random movies from user's seen list
    const shuffled = [...eligibleMovies].sort(() => 0.5 - Math.random());
    
    // Make sure we're not comparing a movie with itself
    if (shuffled.length >= 2) {
      // Return two different movies
      return {
        seenMovie: shuffled[0],
        newSeenMovie: shuffled[1]
      };
    } else {
      throw new Error('Not enough different movies for comparison');
    }
  }, [seen, selectedGenre]);

  // Fetch random movie from baseline or recommendations
  const fetchRandomMovie = useCallback(async () => {
    // Guard against concurrent API calls
    if (isLoadingRef.current) {
      console.log('Already loading, skipping new fetch');
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    
    // Check if we have enough rated movies
    if (seen.length < 3) {
      setError('You must have at least 3 movies ranked to use Wildcard mode.');
      setLoading(false);
      isLoadingRef.current = false;
      return;
    }

    try {
      // Determine what type of comparison to show based on the pattern:
      // 0,1,2,3: Known vs Unknown
      // 4: Known vs Known
      const isKnownVsKnown = comparisonPattern === 4;
      
      if (isKnownVsKnown && seen.length >= 5) {
        // Get a comparison between two already-seen movies
        const { seenMovie: movieA, newSeenMovie: movieB } = await getKnownVsKnownPair();
        
        // Ensure we have two different movies
        if (movieA.id === movieB.id) {
          throw new Error('Cannot compare a movie with itself');
        }
        
        setSeenMovie(movieA);
        setNewMovie(movieB);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }
      
      // For known vs unknown comparisons:
      
      // Select a random movie from those you've seen
      // If genre filter is active, only select from movies in that genre
      let eligibleSeenMovies = seen;
      
      if (selectedGenre) {
        eligibleSeenMovies = seen.filter(movie => 
          movie.genre_ids && movie.genre_ids.includes(parseInt(selectedGenre))
        );
        
        if (eligibleSeenMovies.length < 2) {
          setError(`Not enough movies in the "${genres[selectedGenre]}" genre. Please rate more movies in this genre or select a different genre.`);
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
      }
      
      const randomSeenMovie = eligibleSeenMovies[Math.floor(Math.random() * eligibleSeenMovies.length)];
      setSeenMovie(randomSeenMovie);
      
      let newMovieData = null;

      // Determine whether to use baseline or recommendation algorithm
      if (!baselineComplete) {
        // Try to get next baseline movie first
        const nextBaselineMovie = getNextBaselineMovie();
        
        if (nextBaselineMovie) {
          console.log('Using baseline movie:', nextBaselineMovie.title);
          
          // Ensure we're not comparing the same movie from the baseline
          if (nextBaselineMovie.id === randomSeenMovie.id) {
            // Try to get another baseline movie
            const remainingBaselineMovies = uniqueBaselineMovies.filter(
              m => !comparedMovies.includes(m.id) && !seen.some(sm => sm.id === m.id) && m.id !== randomSeenMovie.id
            );
            
            if (remainingBaselineMovies.length > 0) {
              const alternativeMovie = remainingBaselineMovies[Math.floor(Math.random() * remainingBaselineMovies.length)];
              newMovieData = await getMovieDetails(alternativeMovie.id);
            } else {
              // Fall back to recommendation algorithm
              newMovieData = await getSimilarMovie();
            }
          } else {
            newMovieData = await getMovieDetails(nextBaselineMovie.id);
          }
          
          // Check baseline completion - only after majority of baseline movies
          const remainingCount = uniqueBaselineMovies.filter(m => 
            !comparedMovies.includes(m.id) && !seen.some(sm => sm.id === m.id)
          ).length;
          
          // Only mark baseline complete when 85% or more are rated
          if (remainingCount <= Math.floor(uniqueBaselineMovies.length * 0.15)) {
            // This is near the end of baseline movies, prepare to show completion notice
            setTimeout(() => {
              setBaselineComplete(true);
              setShowBaselineCompleteModal(true);
            }, 1000);
          }
        } else {
          // No more baseline movies, switch to recommendations
          console.log('All baseline movies compared, switching to recommendations');
          setBaselineComplete(true);
          newMovieData = await getSimilarMovie();
        }
      } else {
        // Already completed baseline, use recommendation algorithm
        console.log('Using recommendation algorithm');
        newMovieData = await getSimilarMovie();
      }
      
      // Make sure we didn't end up with the same movie somehow
      if (newMovieData && newMovieData.id === randomSeenMovie.id) {
        throw new Error('Cannot compare a movie with itself');
      }
      
      setNewMovie(newMovieData);
      setLoading(false);
      isLoadingRef.current = false;
    } catch (err) {
      console.error('Error fetching movie:', err);
      setError(`Failed to load movie: ${err.message}`);
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [
    seen, 
    unseen, 
    selectedGenre, 
    genres, 
    baselineComplete,
    comparedMovies,
    comparisonPattern,
    getNextBaselineMovie,
    getMovieDetails, 
    getSimilarMovie,
    getKnownVsKnownPair,
    uniqueBaselineMovies
  ]);

  // Initial fetch on component mount
  useEffect(() => {
    try {
      fetchRandomMovie();
    } catch (err) {
      console.error('Error in initial movie fetch:', err);
      setError('Something went wrong while loading. Please try again.');
      setLoading(false);
      isLoadingRef.current = false;
    }
    
    // Cleanup function
    return () => {
      // Set flag to prevent any ongoing fetches from completing
      isLoadingRef.current = true;
    };
  }, [fetchRandomMovie]);

  // Save current filter settings before showing modal
  const openFilterModal = useCallback(() => {
    // Initialize temp values with current settings
    setTempGenre(selectedGenre);
    setFilterModalVisible(true);
  }, [selectedGenre]);

  // Apply filter changes and fetch new movies
  const applyFilters = useCallback(() => {
    // First hide the modal
    setFilterModalVisible(false);
    
    // Only reload if settings changed
    const settingsChanged = selectedGenre !== tempGenre;
    
    // Apply temp values to actual state
    setSelectedGenre(tempGenre);
    
          // Only fetch new movie if settings actually changed
    if (settingsChanged) {
      // Use setTimeout to ensure the modal is completely gone before changing UI state
      setTimeout(() => {
        setNewMovie(null);
        setSeenMovie(null);
        setLoading(true);
        try {
          fetchRandomMovie();
        } catch (err) {
          console.error('Error after filter change:', err);
          setError('Something went wrong while loading. Please try again.');
          setLoading(false);
          isLoadingRef.current = false;
        }
      }, 300);
    }
  }, [selectedGenre, tempGenre, fetchRandomMovie]);

  // Cancel filter changes
  const cancelFilters = useCallback(() => {
    // Just close modal without applying changes
    setFilterModalVisible(false);
  }, []);

  // Enhanced ELO-based rating adjustment function
const adjustRating = useCallback((winner, loser, winnerIsSeenMovie) => {
  // Calculate ratings with existing data
  const winnerRating = winner.userRating;
  const loserRating = loser.userRating;
  
  // Calculate expected win probability using modified Elo formula
  // We divide by 4 instead of 400 because our scale is 1-10 not 0-3000
  const expectedWinProbability = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 4));
  
  // Dynamic K-factor: higher for movies with fewer comparisons
  const winnerK = calculateKFactor(winner.gamesPlayed || 0);
  const loserK = calculateKFactor(loser.gamesPlayed || 0);
  
  // Calculate rating changes
  // The (1 - expectedWinProbability) is the "surprise factor" - how unexpected was this win?
  // If the winner was already expected to win, the change will be small
  const winnerIncrease = Math.max(0.1, winnerK * (1 - expectedWinProbability));
  const loserDecrease = Math.max(0.1, loserK * (1 - expectedWinProbability));
  
  // Apply bigger adjustment for upsets (low rated beats high rated)
  let adjustedWinnerIncrease = winnerIncrease;
  let adjustedLoserDecrease = loserDecrease;
  if (winnerRating < loserRating) {
    // This is an upset - boost the adjustment
    adjustedWinnerIncrease *= 1.2; // 20% boost for upset victory
  }
  
  // Cap adjustments to prevent wild swings
  const MAX_RATING_CHANGE = 0.7;
  adjustedWinnerIncrease = Math.min(MAX_RATING_CHANGE, adjustedWinnerIncrease);
  adjustedLoserDecrease = Math.min(MAX_RATING_CHANGE, adjustedLoserDecrease);
  
  // Calculate new ratings
  let newWinnerRating = winnerRating + adjustedWinnerIncrease;
  let newLoserRating = loserRating - adjustedLoserDecrease;
  
  // Clamp between 1-10 and round to nearest tenth
  newWinnerRating = Math.round(Math.min(10, Math.max(1, newWinnerRating)) * 10) / 10;
  newLoserRating = Math.round(Math.min(10, Math.max(1, newLoserRating)) * 10) / 10;
  
  // Create updated movie objects
  const updatedWinner = {
    ...winner,
    userRating: newWinnerRating,
    eloRating: newWinnerRating * 10,
    gamesPlayed: (winner.gamesPlayed || 0) + 1
  };
  
  const updatedLoser = {
    ...loser,
    userRating: newLoserRating,
    eloRating: newLoserRating * 10,
    gamesPlayed: (loser.gamesPlayed || 0) + 1
  };
  
  // Return objects formatted for the appropriate positions
  return winnerIsSeenMovie 
    ? { updatedSeenMovie: updatedWinner, updatedNewMovie: updatedLoser } 
    : { updatedSeenMovie: updatedLoser, updatedNewMovie: updatedWinner };
}, []);

  // Helper function to calculate dynamic K-factor based on experience
  const calculateKFactor = useCallback((gamesPlayed) => {
    // Use higher K for movies with fewer comparisons
    if (gamesPlayed < 5) return 40;      // Very new movies (fast learning)
    if (gamesPlayed < 10) return 30;     // Newer movies
    if (gamesPlayed < 20) return 20;     // Somewhat established
    return 10;                           // Well-established ratings (more stable)
  }, []);

  // Handle user choosing the seen movie as better
  const handleSeenWin = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    // Check if this is a known vs known comparison
    const isKnownVsKnown = comparisonPattern === 4 && seen.some(m => m.id === newMovie.id);
    
    if (isKnownVsKnown) {
      // For known vs known, just adjust the ratings directly in the seen list
      // Calculate rating adjustment
      const { updatedSeenMovie, updatedNewMovie } = adjustRating(seenMovie, newMovie, true);
      
      // Update both movies in the seen list
      const updatedSeen = seen.map(m => {
        if (m.id === seenMovie.id) return updatedSeenMovie;
        if (m.id === newMovie.id) return updatedNewMovie;
        return m;
      });
      
      // Save action for undo
      setLastAction({
        type: 'known_comparison',
        seenMovie: {...seenMovie},
        newMovie: {...newMovie},
        winnerIsSeenMovie: true
      });
      
      setSeen(updatedSeen);
    } else {
      // Mark the movie as compared
      markMovieAsCompared(newMovie.id);
      
      // Update ratings
      const { updatedSeenMovie, updatedNewMovie } = adjustRating(seenMovie, newMovie, true);
      
      // Update existing movie rating
      const updatedSeen = seen.map(m => 
        m.id === seenMovie.id ? updatedSeenMovie : m
      );
      
      // Add new movie to seen list
      if (!seen.some(m => m.id === updatedNewMovie.id)) {
  onAddToSeen(updatedNewMovie);
}

      
      // Save the action for potential undo
      setLastAction({
        type: 'comparison',
        seenMovie: {...seenMovie},
        newMovie: {...newMovie},
        winnerIsSeenMovie: true
      });
    }
    
    // Fetch the next comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [seenMovie, newMovie, seen, setSeen, adjustRating, fetchRandomMovie, markMovieAsCompared, comparisonPattern, onAddToSeen]);

  // Handle user choosing the new movie as better
  const handleNewWin = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    // Check if this is a known vs known comparison
    const isKnownVsKnown = comparisonPattern === 4 && seen.some(m => m.id === newMovie.id);
    
    if (isKnownVsKnown) {
      // For known vs known, just adjust the ratings directly in the seen list
      // Calculate rating adjustment
      const { updatedSeenMovie, updatedNewMovie } = adjustRating(newMovie, seenMovie, false);
      
      // Update both movies in the seen list
      const updatedSeen = seen.map(m => {
        if (m.id === seenMovie.id) return updatedSeenMovie;
        if (m.id === newMovie.id) return updatedNewMovie;
        return m;
      });
      
      // Save action for undo
      setLastAction({
        type: 'known_comparison',
        seenMovie: {...seenMovie},
        newMovie: {...newMovie},
        winnerIsSeenMovie: false
      });
      
      setSeen(updatedSeen);
    } else {
      // Mark the movie as compared
      markMovieAsCompared(newMovie.id);
      
      // Update ratings
      const { updatedSeenMovie, updatedNewMovie } = adjustRating(newMovie, seenMovie, false);
      
      // Update existing movie rating
      const updatedSeen = seen.map(m => 
        m.id === seenMovie.id ? updatedSeenMovie : m
      );
      
      // Add new movie to seen list
      if (!seen.some(m => m.id === updatedNewMovie.id)) {
  onAddToSeen(updatedNewMovie);
}

      
      // Save the action for potential undo
      setLastAction({
        type: 'comparison',
        seenMovie: {...seenMovie},
        newMovie: {...newMovie},
        winnerIsSeenMovie: false
      });
    }
    
    // Fetch the next comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [seenMovie, newMovie, seen, setSeen, adjustRating, fetchRandomMovie, markMovieAsCompared, comparisonPattern, onAddToSeen]);

  // Handle user hasn't seen the new movie
  const handleUnseen = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    // Check if this is a known vs known comparison
    const isKnownVsKnown = comparisonPattern === 4 && seen.some(m => m.id === newMovie.id);
    
    if (isKnownVsKnown) {
      // Cannot mark a known movie as unseen, show an alert
      Alert.alert(
        'Already Rated',
        'This movie is already in your rated list. You can\'t add it to watchlist.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Mark the movie as compared
    markMovieAsCompared(newMovie.id);
    
    // Add to watchlist
    onAddToUnseen(newMovie);
    
    // Save action for undo
    setLastAction({
      type: 'unseen',
      movie: {...newMovie}
    });
    
    // Fetch the next comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [newMovie, onAddToUnseen, fetchRandomMovie, markMovieAsCompared, seenMovie, comparisonPattern, seen]);

  // Handle user skipping this comparison
  const handleSkip = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    // Always mark the unknown movie as compared, even in Known vs Known mode
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
    
    // Just fetch a new comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [seenMovie, newMovie, fetchRandomMovie, markMovieAsCompared, comparisonPattern, seen]);

  // Handle tough choice
  const handleToughChoice = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    // Check if this is a known vs known comparison
    const isKnownVsKnown = comparisonPattern === 4 && seen.some(m => m.id === newMovie.id);
    
    if (isKnownVsKnown) {
      // For known vs known, calculate the average rating and apply to both
      const avgRating = (seenMovie.userRating + newMovie.userRating) / 2;
      
      // Slight difference to keep them distinct
      const updatedSeenMovie = {
        ...seenMovie,
        userRating: Math.min(10, Math.max(1, avgRating + 0.05)),
        eloRating: Math.min(1000, Math.max(100, (avgRating + 0.05) * 10))
      };
      
      const updatedNewMovie = {
        ...newMovie,
        userRating: Math.min(10, Math.max(1, avgRating - 0.05)),
        eloRating: Math.min(1000, Math.max(100, (avgRating - 0.05) * 10))
      };
      
      // Update both movies in the seen list
      const updatedSeen = seen.map(m => {
        if (m.id === seenMovie.id) return updatedSeenMovie;
        if (m.id === newMovie.id) return updatedNewMovie;
        return m;
      });
      
      // Save action for undo
      setLastAction({
        type: 'tough_known',
        seenMovie: {...seenMovie},
        newMovie: {...newMovie}
      });
      
      setSeen(updatedSeen);
    } else {
      // Mark the movie as compared
      markMovieAsCompared(newMovie.id);
      
      // Determine which movie has the lower rating
      const lowerRatedMovie = seenMovie.userRating <= newMovie.score ? seenMovie : newMovie;
      const higherRatedMovie = lowerRatedMovie === seenMovie ? newMovie : seenMovie;
      
      // Small boost for the lower-rated movie
      const averageRating = (seenMovie.userRating + newMovie.score) / 2;
      
      let updatedSeenMovie, updatedNewMovie;
      
      if (lowerRatedMovie === seenMovie) {
        // Seen movie gets a small boost as the lower-rated one
        const newSeenRating = Math.min(10, Math.max(1, averageRating + 0.1));
        
        updatedSeenMovie = {
          ...seenMovie,
          userRating: newSeenRating,
          eloRating: newSeenRating * 10
        };
        
        // New movie gets added with a rating just below the seen movie's adjusted rating
        const newRating = Math.max(1, Math.min(10, averageRating - 0.1));
        
        updatedNewMovie = {
          ...newMovie,
          userRating: newRating,
          eloRating: newRating * 10
        };
      } else {
        // New movie is lower-rated, rate it slightly higher than its original score
        const newMovieRating = Math.min(10, Math.max(1, averageRating + 0.1));
        
        updatedNewMovie = {
          ...newMovie,
          userRating: newMovieRating,
          eloRating: newMovieRating * 10
        };
        
        // Seen movie gets rated slightly lower
        const seenMovieRating = Math.max(1, Math.min(10, averageRating - 0.1));
        
        updatedSeenMovie = {
          ...seenMovie,
          userRating: seenMovieRating,
          eloRating: seenMovieRating * 10
        };
      }
      
      // Save action for undo
      setLastAction({
        type: 'tough',
        seenMovie: {...seenMovie},
        newMovie: {...newMovie}
      });
      
      // Update seen movie in the list
      const updatedSeen = seen.map(m => 
        m.id === seenMovie.id ? updatedSeenMovie : m
      );
      
      // Add new movie to seen list
      onAddToSeen(updatedNewMovie);
    }
    
    // Fetch the next comparison
    setNewMovie(null);
    setSeenMovie(null);
    setLoading(true);
    fetchRandomMovie();
  }, [seenMovie, newMovie, seen, setSeen, fetchRandomMovie, markMovieAsCompared, comparisonPattern, onAddToSeen]);

  // Handle undo last action
  const handleUndo = useCallback(() => {
    if (!lastAction || isLoadingRef.current) return;
    
    let filteredSeen;
    let restoredSeen;
    let filteredUnseen;
    
    switch (lastAction.type) {
      case 'comparison':
        // Remove the new movie from the seen list
        filteredSeen = seen.filter(m => m.id !== lastAction.newMovie.id);
        
        // Restore the rating of the seen movie
        restoredSeen = filteredSeen.map(m => 
          m.id === lastAction.seenMovie.id ? lastAction.seenMovie : m
        );
        
        setSeen(restoredSeen);
        
        // Remove from compared movies
        setComparedMovies(prev => prev.filter(id => id !== lastAction.newMovie.id));
        
        // Decrement comparison count
        setComparisonCount(prev => Math.max(0, prev - 1));
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5); // 4,3,2,1,0,4,3,...
        
        // Restore the movies for a new comparison
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'known_comparison':
        // For known vs known, restore both ratings
        restoredSeen = seen.map(m => {
          if (m.id === lastAction.seenMovie.id) return lastAction.seenMovie;
          if (m.id === lastAction.newMovie.id) return lastAction.newMovie;
          return m;
        });
        
        setSeen(restoredSeen);
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5); // 4,3,2,1,0,4,3,...
        
        // Restore the movies for a new comparison
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'unseen':
        // Remove the movie from unseen/watchlist
        filteredUnseen = unseen.filter(m => m.id !== lastAction.movie.id);
        onAddToUnseen(filteredUnseen);
        
        // Remove from compared movies
        setComparedMovies(prev => prev.filter(id => id !== lastAction.movie.id));
        
        // Decrement comparison count
        setComparisonCount(prev => Math.max(0, prev - 1));
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5); // 4,3,2,1,0,4,3,...
        
        // Restore the movie for comparison
        setNewMovie(lastAction.movie);
        setLoading(false);
        break;
        
      case 'skip':
        if (!lastAction.isKnownVsKnown) {
          // Remove from compared movies
          setComparedMovies(prev => prev.filter(id => id !== lastAction.newMovie.id));
          
          // Decrement comparison count
          setComparisonCount(prev => Math.max(0, prev - 1));
        }
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5); // 4,3,2,1,0,4,3,...
        
        // Restore the movies for comparison
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'tough':
      case 'tough_known':
        if (lastAction.type === 'tough') {
          // Remove the new movie from seen
          filteredSeen = seen.filter(m => m.id !== lastAction.newMovie.id);
          
          // Restore the rating of the seen movie
          restoredSeen = filteredSeen.map(m => 
            m.id === lastAction.seenMovie.id ? lastAction.seenMovie : m
          );
          
          setSeen(restoredSeen);
          
          // Remove from compared movies
          setComparedMovies(prev => prev.filter(id => id !== lastAction.newMovie.id));
          
          // Decrement comparison count
          setComparisonCount(prev => Math.max(0, prev - 1));
        } else {
          // For tough_known, restore both ratings
          restoredSeen = seen.map(m => {
            if (m.id === lastAction.seenMovie.id) return lastAction.seenMovie;
            if (m.id === lastAction.newMovie.id) return lastAction.newMovie;
            return m;
          });
          
          setSeen(restoredSeen);
        }
        
        // Roll back comparison pattern
        setComparisonPattern(prev => (prev - 1 + 5) % 5); // 4,3,2,1,0,4,3,...
        
        // Restore the movies for comparison
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
      
      default:
        break;
    }
    
    // Clear the last action
    setLastAction(null);
  }, [lastAction, seen, unseen, setSeen, onAddToUnseen]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setNewMovie(null);
    setSeenMovie(null);
    isLoadingRef.current = false;
    fetchRandomMovie();
  }, [fetchRandomMovie]);
  
  // Handle baseline complete acknowledgment
  const handleBaselineCompleteAcknowledge = useCallback(() => {
    setShowBaselineCompleteModal(false);
  }, []);

  const getPosterUrl = path => `https://image.tmdb.org/t/p/w342${path}`;

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={stateStyles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#FFD700' : '#4B0082'} />
          <Text style={[stateStyles.loadingText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
            {baselineComplete ? 'Finding movies tailored to your taste...' : 'Loading movies for comparison...'}
          </Text>
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

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={[stateStyles.errorContainer, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5' }]}>
          <Ionicons name="information-circle-outline" size={48} color={isDarkMode ? '#FFD700' : '#4B0082'} />
          <Text style={[stateStyles.errorText, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
            {error}
          </Text>
          <Text style={[stateStyles.errorSubText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
            {seen.length < 3 ? 'Go to the Add Movie tab to rate more movies.' : 'This may be temporary. Try again or select a different genre.'}
          </Text>
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

  if (!seenMovie || !newMovie) return null;

  // Check if this is a known vs known comparison
  const isKnownVsKnown = comparisonPattern === 4 && seen.some(m => m.id === newMovie.id);

  // Main UI
  return (
    <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
      <View
        style={[
          headerStyles.screenHeader,
          { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderBottomColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' },
        ]}
      >
        <Text style={[headerStyles.screenTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
          {isKnownVsKnown ? 'Compare Your Ratings' : 
            baselineComplete ? 'Movie Recommendations' : 'Movie Ratings'}
        </Text>
        <View style={styles.actionRow}>
          {!baselineComplete && !isKnownVsKnown && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                {Math.min(comparedMovies.length, uniqueBaselineMovies.length)}/{uniqueBaselineMovies.length}
              </Text>
            </View>
          )}
          {lastAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUndo}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo" size={24} color={isDarkMode ? '#FFD700' : '#4B0082'} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openFilterModal}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={24} color={isDarkMode ? '#FFD700' : '#4B0082'} />
            {selectedGenre && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={[compareStyles.compareContainer, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={compareStyles.compareContent}>
          <Text style={[compareStyles.compareTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            {isKnownVsKnown ? 'Which movie do you prefer?' : 'Which movie was better?'}
          </Text>
          
          {/* Movie comparison UI - properly showing two side-by-side movies */}
          <View style={compareStyles.compareMovies}>
            {/* Left side: Known movie (the one user has already rated) */}
            <TouchableOpacity
              style={[compareStyles.posterContainer, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5' }]}
              onPress={handleSeenWin}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: getPosterUrl(seenMovie.poster) }}
                style={compareStyles.poster}
                resizeMode="cover"
              />
              <View style={compareStyles.posterOverlay}>
                <Text
                  style={[movieCardStyles.movieTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}
                  numberOfLines={2}
                >
                  {seenMovie.title}
                </Text>
                <Text style={[compareStyles.ratingTag, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                  Your rating: {seenMovie.userRating.toFixed(1)}
                </Text>
                <Text style={[movieCardStyles.genresText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                  {seenMovie.genre_ids.map(id => genres[id] || 'Unknown').join(', ')}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Middle VS divider */}
            <View style={compareStyles.vsContainer}>
              <Text style={[compareStyles.vsText, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                VS
              </Text>
            </View>
            
            {/* Right side: New movie (or second known movie in "known vs known" comparisons) */}
            <TouchableOpacity
              style={[compareStyles.posterContainer, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5' }]}
              onPress={handleNewWin}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: getPosterUrl(newMovie.poster) }}
                style={compareStyles.poster}
                resizeMode="cover"
              />
              <View style={compareStyles.posterOverlay}>
                <Text
                  style={[movieCardStyles.movieTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}
                  numberOfLines={2}
                >
                  {newMovie.title}
                </Text>
                <Text style={[compareStyles.ratingTag, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                  {isKnownVsKnown ? 
                    `Your rating: ${newMovie.userRating.toFixed(1)}` : 
                    `TMDb: ${newMovie.score.toFixed(1)} (${newMovie.voteCount} votes)`
                  }
                </Text>
                <Text style={[movieCardStyles.genresText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                  {newMovie.genre_ids.map(id => genres[id] || 'Unknown').join(', ')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={compareStyles.actionButtons}>
            <TouchableOpacity
              style={[compareStyles.toughButton, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}
              onPress={handleToughChoice}
              activeOpacity={0.7}
            >
              <Text style={[compareStyles.toughButtonText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                Too tough to decide
              </Text>
            </TouchableOpacity>
            
            {/* Only show "Add to watchlist" if this isn't a Known vs Known comparison */}
            {!isKnownVsKnown && (
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
        onRequestClose={cancelFilters}
      >
        <View style={[modalStyles.modalOverlay, styles.modalOverlay]}>
          <View style={[
            modalStyles.modalContent,
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#4B0082' : '#FFFFFF' }
          ]}>
            <Text style={[
              modalStyles.modalTitle,
              { color: isDarkMode ? '#F5F5F5' : '#333' }
            ]}>
              Filter Movies
            </Text>
            
            {/* Genre Filter */}
            <View style={styles.filterSection}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? '#F5F5F5' : '#333' }
              ]}>
                Filter by Genre
              </Text>
              
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
                onPress={() => setTempGenre(null)}
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
              
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genreScrollContent}
              >
                {Object.entries(genres)
                  .filter(([id, name]) => name) // Filter out undefined genres
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
                      onPress={() => setTempGenre(id)}
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
            
            {/* Action Buttons */}
            <View style={styles.modalButtons}>
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
        <View style={[modalStyles.modalOverlay, styles.modalOverlay]}>
          <View style={[
            modalStyles.modalContent,
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#4B0082' : '#FFFFFF' }
          ]}>
            <Ionicons 
              name="checkmark-circle" 
              size={64} 
              color={isDarkMode ? '#FFD700' : '#4B0082'} 
              style={styles.successIcon}
            />
            
            <Text style={[
              modalStyles.modalTitle,
              { color: isDarkMode ? '#FFD700' : '#4B0082', fontSize: 24 }
            ]}>
              Baseline Complete!
            </Text>
            
            <Text style={[
              styles.completionText,
              { color: isDarkMode ? '#F5F5F5' : '#333' }
            ]}>
              You've completed the baseline movie ratings. Congratulations!
            </Text>
            
            <Text style={[
              styles.completionSubtext,
              { color: isDarkMode ? '#D3D3D3' : '#666' }
            ]}>
              From now on, movies will be recommended based on your personal preferences. The more movies you rate, the better your recommendations will become.
            </Text>
            
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

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
    padding: 4,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9500',
  },
  modalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowOpacity: 0.5,
    zIndex: 1001,
  },
  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: 14,
    lineHeight: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  genreScrollContent: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  genreButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  genreButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  applyButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  progressText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  progressBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 10,
  },
  progressBadgeText: {
    color: '#4B0082',
    fontWeight: 'bold',
    fontSize: 12,
  },
  successIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  completionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  completionSubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  continueButton: {
    width: '100%',
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

export default WildcardScreen;
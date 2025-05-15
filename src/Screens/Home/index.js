import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import layoutStyles from '../../Styles/layoutStyles';
import headerStyles from '../../Styles/headerStyles';
import homeStyles from '../../Styles/homeStyles';
import ratingStyles from '../../Styles/ratingStyles';
import modalStyles from '../../Styles/modalStyles';

const { width } = Dimensions.get('window');
const MOVIE_CARD_WIDTH = (width - 48) / 2.5; // Wider cards for better visibility
const CAROUSEL_ITEM_WIDTH = MOVIE_CARD_WIDTH + 20; // Include margin
const API_KEY = 'b401be0ea16515055d8d0bde16f80069'; // TMDB API key

function HomeScreen({ seen, unseen, genres, newReleases, isDarkMode, toggleTheme, onAddToSeen }) {
  // State variables
    const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('new');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingInput, setRatingInput] = useState('');
  const [recentReleases, setRecentReleases] = useState([]);
    // ─── Popular Movies State ───────────────────────────────────────────────────
  const [popularMovies, setPopularMovies] = useState([]);
  // ─── Fetch top‐10 popular movies (excludes seen & watchlist) ────────────────
const fetchPopularMovies = useCallback(async () => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${Math.floor(Math.random()*5)+1}`
    );
    const { results } = await res.json();
    const filtered = results
      .filter(m => !seen.some(s => s.id === m.id) && !unseen.some(u => u.id === m.id))
      .slice(0, 10);
    setPopularMovies(filtered);
  } catch (err) {
    console.warn('Failed fetching popular movies', err);
  }
}, [seen, unseen]);

  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
    // ─── Popular Movies Carousel Setup ──────────────────────────────────────────
  const popularScrollX   = useRef(new Animated.Value(0)).current;
  const popularScrollRef = useRef(null);
  const [popularIndex, setPopularIndex] = useState(0);
  const autoScrollPopular = useRef(null);

  const startPopularAutoScroll = useCallback(() => {
    if (autoScrollPopular.current) clearInterval(autoScrollPopular.current);
    autoScrollPopular.current = setInterval(() => {
      const next = (popularIndex + 1) % 10; // cycle through 10 items
      +   // custom snappy but controllable animation:
   Animated.timing(popularScrollX,
   {toValue: next * CAROUSEL_ITEM_WIDTH,
    duration: 800,       // ← control “fly” time here (ms)
     useNativeDriver: true
   }).start();
      setPopularIndex(next);
    }, 1000); // every 5s
  }, [popularIndex, popularMovies.length]);

   // ─── Start auto-scroll once we have popularMovies ────────────────────────
  useEffect(() => {
    if (popularMovies.length > 0 && activeTab === 'new') {
      startPopularAutoScroll();
    }
    return () => clearInterval(autoScrollPopular.current);
  }, [popularMovies, activeTab, startPopularAutoScroll]);
  // ─── End auto-scroll trigger ──────────────────────────────────────────────

  // Animation values


  // Animation values
  const scrollX = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll animation
  const autoScrollAnimation = useRef(null);
  
  // Get today's date
  const today = useMemo(() => new Date(), []);
  
  // Format date for display
  const formatDate = useCallback((date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }, []);
  
  // Get date from 7 days ago
  const oneWeekAgo = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 7);
    return date;
  }, [today]);
  
  // Format date for API
  const formatDateForAPI = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);
  
  // Format release date for display
  const formatReleaseDate = useCallback((dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);
  
  // Fetch recent movie releases (movies released within the last week)
  const fetchRecentReleases = useCallback(async () => {
    try {
      setIsLoadingRecent(true);
      
      const todayFormatted = formatDateForAPI(today);
      const oneWeekAgoFormatted = formatDateForAPI(oneWeekAgo);
      
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=primary_release_date.desc&include_adult=false&include_video=false&page=1&primary_release_date.gte=${oneWeekAgoFormatted}&primary_release_date.lte=${todayFormatted}&vote_count.gte=5`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent releases');
      }
      
      const data = await response.json();
      
      // Process the results
      const recentMovies = data.results
        .filter(movie => movie.poster_path) // Only include movies with posters
        .map(movie => ({
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path,
          score: movie.vote_average,
          voteCount: movie.vote_count,
          release_date: movie.release_date,
          genre_ids: movie.genre_ids,
          overview: movie.overview || "",
          // Check if already seen or in watchlist
          alreadySeen: seen.some(m => m.id === movie.id),
          inWatchlist: unseen.some(m => m.id === movie.id),
          // If seen, use user rating, otherwise use TMDB score
          userRating: seen.find(m => m.id === movie.id)?.userRating
        }));
      
      setRecentReleases(recentMovies);
      setIsLoadingRecent(false);
    } catch (error) {
      console.error('Error fetching recent releases:', error);
      setIsLoadingRecent(false);
    }
  }, [today, oneWeekAgo, seen, unseen, formatDateForAPI]);
  
  // Fetch recent releases on component mount
  useEffect(() => {
    fetchRecentReleases();
  }, [fetchRecentReleases]);
    // ─── Ensure we load popular immediately on screen mount ───────────────────
  useEffect(() => {
    fetchPopularMovies();
  }, [fetchPopularMovies]);
  // ─── End immediate fetch ─────────────────────────────────────────────────

  // ─── Ensure we load popular immediately on screen mount ───────────────────
  useEffect(() => {
    fetchPopularMovies();
  }, [fetchPopularMovies]);
  // ─── End immediate fetch ─────────────────────────────────────────────────

    // ─── Load popular movies whenever we return to the "New Releases" tab ───────
  useEffect(() => {
    if (activeTab === 'new') {
      fetchPopularMovies();
    }
  }, [activeTab, fetchPopularMovies]);

  
  // Start auto-scrolling animation (wrapped in useCallback)
  const startAutoScroll = useCallback(() => {
    if (autoScrollAnimation.current) {
      autoScrollAnimation.current.stop();
    }
    
    autoScrollAnimation.current = Animated.loop(
      Animated.timing(position.x, {
        toValue: -CAROUSEL_ITEM_WIDTH * 3, // Scroll through 3 items
        duration: 15000, // 15 seconds for the loop
        useNativeDriver: true,
      })
    );
    
    autoScrollAnimation.current.start();
  }, [position.x]);
  
  // Setup auto-scrolling for recommendations
  useEffect(() => {
    if (activeTab === 'recommendations' && recommendations.length > 0) {
      startAutoScroll();
    }
    
    return () => {
      if (autoScrollAnimation.current) {
        autoScrollAnimation.current.stop();
      }
    };
  }, [activeTab, recommendations, startAutoScroll]);
  
  // Pan responder for manual scrolling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Stop auto-scroll when user touches
        if (autoScrollAnimation.current) {
          autoScrollAnimation.current.stop();
        }
        
        position.setOffset({
          x: position.x._value,
          y: position.y._value,
        });
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, { dx, vx }) => {
        position.flattenOffset();
        
        // Determine if we should snap to the next item
        const newIndex = Math.max(
          0,
          Math.min(
            recommendations.length - 1,
            currentIndex - Math.sign(dx)
          )
        );
        
        setCurrentIndex(newIndex);
        
        Animated.spring(position, {
          toValue: { x: -newIndex * CAROUSEL_ITEM_WIDTH, y: 0 },
          useNativeDriver: true,
        }).start(() => {
          // Restart auto-scroll after a delay
          setTimeout(startAutoScroll, 3000);
        });
      },
    })
  ).current;

  // Enhanced recommendation algorithm to ensure images
  const recommendations = useMemo(() => {
    if (seen.length === 0) return [];
    
    // Calculate genre scores based on user ratings
    const genreScores = {};
    let totalVotes = 0;
    
    seen.forEach(movie => {
      if (movie.genre_ids) {
        const rating = movie.userRating || movie.eloRating / 100;
        totalVotes += rating;
        
        movie.genre_ids.forEach(genreId => {
          if (!genreScores[genreId]) genreScores[genreId] = 0;
          genreScores[genreId] += rating;
        });
      }
    });

    // Calculate average release year preference
    let totalYears = 0;
    let totalRatings = 0;
    
    seen.forEach(movie => {
      if (movie.release_date) {
        const year = new Date(movie.release_date).getFullYear();
        if (!isNaN(year)) {
          totalYears += year * (movie.userRating || movie.eloRating / 100);
          totalRatings += (movie.userRating || movie.eloRating / 100);
        }
      }
    });
    
    const avgPreferredYear = totalRatings > 0 ? Math.round(totalYears / totalRatings) : new Date().getFullYear() - 10;
    
    // Filter unseen movies that HAVE posters and are not in seen list
    // Also prioritize movies within user's preferred time period
    const suggestions = [...unseen]
      .filter(movie => movie.poster && movie.poster_path) // Ensure it has a poster
      .map(movie => {
        // Calculate year proximity score (0-1, higher is closer to preferred year)
        let yearProximity = 0;
        if (movie.release_date) {
          const movieYear = new Date(movie.release_date).getFullYear();
          const yearDiff = Math.abs(movieYear - avgPreferredYear);
          yearProximity = Math.max(0, 1 - (yearDiff / 50)); // Max 50 years difference
        }
        
        // Calculate genre match score
        const genreMatchScore = movie.genre_ids
          ? movie.genre_ids.reduce((sum, genreId) => sum + (genreScores[genreId] || 0), 0)
          : 0;
            
        return {
          ...movie,
          recommendationScore: (genreMatchScore * 0.7) + (yearProximity * 0.3), // Weighted score
          hasBeenSeen: false
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 20); // Get more recommendations for carousel

    return suggestions;
  }, [seen, unseen]);

  // Calculate top genres by average rating - improved to use actual user data
  const topGenres = useMemo(() => {
    if (seen.length === 0) return [];
    
    const genreScores = {};
    const genreVotes = {};
    
    // Count all genres
    seen.forEach(movie => {
      if (movie.genre_ids) {
        const rating = movie.userRating || movie.eloRating / 100;
        
        movie.genre_ids.forEach(genreId => {
          if (!genreScores[genreId]) {
            genreScores[genreId] = 0;
            genreVotes[genreId] = 0;
          }
          genreScores[genreId] += rating;
          genreVotes[genreId] += 1;
        });
      }
    });

    // Calculate average score and create sorted list
    return Object.entries(genreScores)
      .map(([genreId, totalScore]) => ({
        id: genreId,
        name: genres[genreId] || 'Unknown',
        averageScore: totalScore / genreVotes[genreId],
        movieCount: genreVotes[genreId]
      }))
      .filter(genre => genre.movieCount >= 2) // Only include genres with at least 2 movies
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5); // Top 5 genres
  }, [seen, genres]);

  // Handle selection to rate a movie
  const handleMovieSelect = useCallback((movie) => {
    setSelectedMovie(movie);
    setRatingInput('');
    setRatingModalVisible(true);
  }, []);
  
  // Handle rating submission
  const submitRating = useCallback(() => {
    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 1 || rating > 10) {
      alert('Please enter a valid rating between 1 and 10');
      return;
    }
    
    // Add to seen list with the rating
    const ratedMovie = {
      ...selectedMovie,
      userRating: rating,
      eloRating: rating * 100,
      comparisonHistory: [],
      comparisonWins: 0,
    };
    
    onAddToSeen(ratedMovie);
    
    // Update local state for recent releases
    if (recentReleases.some(m => m.id === selectedMovie.id)) {
      setRecentReleases(prev => 
        prev.map(m => 
          m.id === selectedMovie.id 
            ? { ...m, alreadySeen: true, userRating: rating } 
            : m
        )
      );
    }
    
    // Close modal
    setRatingModalVisible(false);
    setSelectedMovie(null);
  }, [ratingInput, selectedMovie, onAddToSeen, recentReleases]);

  // Determine card scale based on position
  const getCardScale = useCallback((index) => {
    const inputRange = [
      (index - 1) * CAROUSEL_ITEM_WIDTH,
      index * CAROUSEL_ITEM_WIDTH,
      (index + 1) * CAROUSEL_ITEM_WIDTH,
    ];
    
    // Scale decreases as cards move away from center
    return scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });
  }, [scrollX]);
  
  // Determine card rotation for diagonal effect
  const getCardRotation = useCallback((index) => {
    const inputRange = [
      (index - 1) * CAROUSEL_ITEM_WIDTH,
      index * CAROUSEL_ITEM_WIDTH,
      (index + 1) * CAROUSEL_ITEM_WIDTH,
    ];
    
    // Rotation creates diagonal flow
    return scrollX.interpolate({
      inputRange,
      outputRange: ['5deg', '0deg', '-5deg'],
      extrapolate: 'clamp',
    });
  }, [scrollX]);

  // Calculate match percentage based on genre overlap with top genres
  const calculateMatchPercentage = useCallback((movie) => {
    if (!movie.genre_ids || topGenres.length === 0) return null;
    
    // Create a set of user's top genre IDs
    const topGenreIds = topGenres.map(g => parseInt(g.id));
    
    // Count how many of the movie's genres match the user's top genres
    const matchingGenres = movie.genre_ids.filter(id => 
      topGenreIds.includes(parseInt(id))
    ).length;
    
    // Calculate percentage
    if (matchingGenres === 0) return null;
    
    const maxPossibleMatches = Math.min(movie.genre_ids.length, topGenreIds.length);
    const matchPercentage = Math.round((matchingGenres / maxPossibleMatches) * 100);
    
    return matchPercentage;
  }, [topGenres]);

  // Render a movie card with animation for carousel
  const renderCarouselItem = useCallback(({ item, index }) => {
    // Combine animation values
    const cardScale = getCardScale(index);
    const cardRotation = getCardRotation(index);
    
    const matchPercentage = calculateMatchPercentage(item);
    
    return (
      <Animated.View
        style={[
          styles.carouselItem,
          {
            transform: [
              { scale: cardScale },
              { rotate: cardRotation },
              { translateX: position.x },
              { translateY: Animated.multiply(position.x, 0.1) }, // Diagonal movement
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.movieCard, 
            { backgroundColor: isDarkMode ? '#2A3132' : '#F5F5F5' }
          ]}
          activeOpacity={0.7}
          onPress={() => handleMovieSelect(item)}
        >
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} 
            style={styles.moviePoster}
            resizeMode="cover"
          />
          {matchPercentage && (
            <View style={[
              styles.matchBadge,
              { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
            ]}>
              <Text style={[
                styles.matchText,
                { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
              ]}>
                {matchPercentage}% Match
              </Text>
            </View>
          )}
          <View style={styles.cardContent}>
            <Text 
              style={[
                styles.movieTitle, 
                { color: isDarkMode ? '#FFFFFF' : '#333333' }
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
            <Text 
              style={[
                styles.movieInfo,
                { color: isDarkMode ? '#D3D3D3' : '#666666' }
              ]}
            >
              {item.release_date ? new Date(item.release_date).getFullYear() : 'Unknown'} • {
                item.genre_ids?.map(id => genres[id] || '').filter(Boolean).join(', ')
              }
            </Text>
            <TouchableOpacity
              style={[
                styles.rateButton,
                { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' }
              ]}
              onPress={() => handleMovieSelect(item)}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>Rate This</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [getCardScale, getCardRotation, calculateMatchPercentage, position.x, isDarkMode, handleMovieSelect, genres]);

  // Render a movie card for regular sections
  const renderMovieCard = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[
        styles.movieCard, 
        { backgroundColor: isDarkMode ? '#2A3132' : '#F5F5F5' }
      ]}
      activeOpacity={0.7}
      onPress={() => handleMovieSelect(item)}
    >
      <Image 
        source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} 
        style={styles.moviePoster}
        resizeMode="cover"
      />
      <Text 
        style={[
          styles.movieTitle, 
          { color: isDarkMode ? '#FFFFFF' : '#333333' }
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {item.title}
      </Text>
      <TouchableOpacity
        style={[
          styles.quickRateButton,
          { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' }
        ]}
        onPress={() => handleMovieSelect(item)}
      >
        <Ionicons name="star" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [isDarkMode, handleMovieSelect]);

  // Render a recent release card with release date
  const renderRecentReleaseCard = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[
        styles.recentCard, 
        { backgroundColor: isDarkMode ? '#2A3132' : '#F5F5F5' }
      ]}
      activeOpacity={0.7}
      onPress={() => handleMovieSelect(item)}
    >
      <Image 
        source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster}` }} 
        style={styles.recentPoster}
        resizeMode="cover"
      />
      <View style={styles.recentInfo}>
        <Text 
          style={[
            styles.movieTitle, 
            { color: isDarkMode ? '#FFFFFF' : '#333333' }
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <View style={styles.releaseDateContainer}>
          <Text style={[styles.releaseDate, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
            Released: {formatReleaseDate(item.release_date)}
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color={isDarkMode ? '#FFD700' : '#FFA000'} />
          <Text style={{ color: isDarkMode ? '#FFD700' : '#FFA000', marginLeft: 4 }}>
            {item.alreadySeen ? `Your Rating: ${item.userRating.toFixed(1)}` : `TMDb: ${item.score.toFixed(1)}`}
          </Text>
        </View>
        {!item.alreadySeen && (
          <TouchableOpacity
            style={[
              styles.rateRecentButton,
              { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' }
            ]}
            onPress={() => handleMovieSelect(item)}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>Rate This Movie</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  ), [isDarkMode, formatReleaseDate, handleMovieSelect]);

  // Render a specific section for What's Out Now
  const renderWhatsOutNowSection = useCallback(() => {
    return (
      <View style={styles.whatsOutNowSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            What's Out Now
          </Text>
          <Text style={[styles.todayDate, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
            {formatDate(today)}
          </Text>
        </View>
        
        {isLoadingRecent ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666' }}>
              Loading recent releases...
            </Text>
          </View>
        ) : recentReleases.length === 0 ? (
          <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', marginTop: 10, textAlign: 'center' }}>
            No new releases found this week
          </Text>
        ) : (
          <FlatList
            data={recentReleases}
            renderItem={renderRecentReleaseCard}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentReleasesContainer}
          />
        )}
      </View>
    );
  }, [isDarkMode, formatDate, today, isLoadingRecent, recentReleases, renderRecentReleaseCard]);

  // Render the favorite genres section with more detailed information
  const renderFavoriteGenresSection = useCallback(() => {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
          Your Favorite Genres
        </Text>
        {topGenres.length > 0 ? (
          <View style={styles.genresContainer}>
{seen.map((movie, index) => (
  <TouchableOpacity
    key={movie.id}
    style={[
      styles.genreItem,
      {
        backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5',
        borderColor:     isDarkMode ? '#8A2BE2' : '#E0E0E0'
      }
    ]}
    onPress={() =>
      navigation.navigate('MovieDetail', {
        movieId:    movie.id,
        movieTitle: movie.title
      })
    }
  >
    <View style={styles.genreInfo}>
      <Text style={[styles.genreName, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
        {movie.title}
      </Text>
      <Text style={[styles.genreCount, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
        Your Rating: {movie.userRating.toFixed(1)}
      </Text>
    </View>
    <View style={styles.genreScoreContainer}>
      <Text style={[styles.genreScore, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
        {movie.userRating.toFixed(1)}
      </Text>
      <Text style={[styles.genreRankText, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
        #{index + 1}
      </Text>
    </View>
  </TouchableOpacity>
))}


          </View>
        ) : (
          <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', marginTop: 10 }}>
            Rate more movies to see your favorite genres
          </Text>
        )}
      </View>
    );
  }, [isDarkMode, topGenres, navigation, seen]);

  // Render recommendations carousel with header and footer
  const renderRecommendationsCarousel = useCallback(() => {
    return (
      <View style={styles.carouselContainer} {...panResponder.panHandlers}>
        <View style={styles.recommendationHeader}>
          <Text style={[styles.recommendationSubtitle, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
            Based on your taste profile
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              // Reset position and refresh recommendations
              position.setValue({ x: 0, y: 0 });
              setCurrentIndex(0);
              // Restart auto-scroll animation
              if (autoScrollAnimation.current) {
                autoScrollAnimation.current.stop();
              }
              startAutoScroll();
            }}
          >
            <Ionicons 
              name="refresh" 
              size={18} 
              color={isDarkMode ? '#D3D3D3' : '#666666'} 
            />
          </TouchableOpacity>
        </View>
        
        <Animated.FlatList
          ref={scrollRef}
          data={recommendations}
          renderItem={renderCarouselItem}
          keyExtractor={item => item.id.toString()}
          horizontal
          contentContainerStyle={styles.carousel}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CAROUSEL_ITEM_WIDTH}
          decelerationRate="fast"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
        
        <View style={styles.recommendationFooter}>
          <Text style={[styles.swipeInstruction, { color: isDarkMode ? '#A0A0A0' : '#666666' }]}>
            Swipe to explore more recommendations
          </Text>
          <View style={styles.dotIndicatorContainer}>
            {recommendations.slice(0, 5).map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dotIndicator, 
                  currentIndex === index 
                    ? { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082', width: 16 } 
                    : { backgroundColor: isDarkMode ? '#444444' : '#CCCCCC' }
                ]} 
              />
            ))}
          </View>
        </View>
      </View>
    );
  }, [
    panResponder.panHandlers, 
    isDarkMode, 
    position, 
    setCurrentIndex, 
    autoScrollAnimation, 
    startAutoScroll,
    scrollRef,
    recommendations,
    renderCarouselItem,
    scrollX,
    currentIndex
  ]);

  // Render popular movies section
  const renderPopularMoviesSection = useCallback(() => {
  return (
    <View style={styles.popularSection}>
      <Text
        style={[
          styles.sectionTitle,
          { color: isDarkMode ? '#F5F5F5' : '#333' }
        ]}
      >
        Popular Movies
      </Text>
      <Animated.FlatList
        ref={popularScrollRef}
        data={popularMovies}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.popularScrollContent}
        keyExtractor={item => item.id.toString()}
        // snap exactly to your card width + margin
        snapToInterval={MOVIE_CARD_WIDTH + 12}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.movieCard,
              {
                backgroundColor: isDarkMode ? '#2A3132' : '#F5F5F5',
                marginRight: 12
              }
            ]}
            activeOpacity={0.7}
            onPress={() => handleMovieSelect(item)}
          >
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`
              }}
              style={styles.moviePoster}
              resizeMode="cover"
            />
            <Text
              style={[
                styles.movieTitle,
                { color: isDarkMode ? '#FFFFFF' : '#333333' }
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
            <View style={styles.popularScoreContainer}>
              <Ionicons
                name="star"
                size={12}
                color={isDarkMode ? '#FFD700' : '#FFA000'}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: isDarkMode ? '#FFD700' : '#FFA000',
                  marginLeft: 4
                }}
              >
                {item.vote_average
                  ? item.vote_average.toFixed(1)
                  : '?'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: popularScrollX } } }],
          { useNativeDriver: true }
        )}
        onTouchStart={() =>
          clearInterval(autoScrollPopular.current)
        }
        onTouchEnd={startPopularAutoScroll}
      />
    </View>
  );
}, [
  isDarkMode,
  popularMovies,
  handleMovieSelect,
  popularScrollX,
  popularScrollRef,
  startPopularAutoScroll,
  autoScrollPopular
]);



  // Render stats section
  const renderStatsSection = useCallback(() => {
    return (
      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
          Your Stats
        </Text>
        <View style={styles.statsContent}>
          <View style={styles.statItem}>
            <Ionicons 
              name="star-outline" 
              size={24} 
              color={isDarkMode ? '#FFD700' : '#4B0082'} 
              style={styles.statIcon}
            />
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                {seen.length}
              </Text>
              <Text style={[styles.statLabel, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                Movies Rated
              </Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons 
              name="eye-off-outline" 
              size={24} 
              color={isDarkMode ? '#FFD700' : '#4B0082'} 
              style={styles.statIcon}
            />
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                {unseen.length}
              </Text>
              <Text style={[styles.statLabel, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                Watchlist Size
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }, [isDarkMode, seen.length, unseen.length]);

  // Main render
  return (
    <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
      {/* Header */}
      <View
        style={[
          headerStyles.screenHeader,
          { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderBottomColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' },
        ]}
      >
        <Text style={[headerStyles.screenTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
          Movie Ranker
        </Text>
        <TouchableOpacity
          style={headerStyles.themeToggle}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDarkMode ? 'sunny' : 'moon'}
            size={24}
            color={isDarkMode ? '#FFD700' : '#4B0082'}
          />
        </TouchableOpacity>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'new' ? 
              { borderBottomColor: isDarkMode ? '#8A2BE2' : '#4B0082', borderBottomWidth: 2 } : 
              {}
          ]}
          onPress={() => setActiveTab('new')}
        >
          <Text 
            style={[
              styles.tabText, 
              { 
                color: activeTab === 'new' ? 
                  (isDarkMode ? '#8A2BE2' : '#4B0082') : 
                  (isDarkMode ? '#A0A0A0' : '#666666')
              }
            ]}
          >
            New Releases
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'recommendations' ? 
              { borderBottomColor: isDarkMode ? '#8A2BE2' : '#4B0082', borderBottomWidth: 2 } : 
              {}
          ]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Text 
            style={[
              styles.tabText, 
              { 
                color: activeTab === 'recommendations' ? 
                  (isDarkMode ? '#8A2BE2' : '#4B0082') : 
                  (isDarkMode ? '#A0A0A0' : '#666666')
              }
            ]}
          >
            Movies For You
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* New Releases Tab */}
      {activeTab === 'new' && (
        <ScrollView style={homeStyles.homeContainer}>
          {/* What's Out Now Section - new feature */}
          {renderWhatsOutNowSection()}
          
          {/* Popular Movies Section */}
          {renderPopularMoviesSection()}
        </ScrollView>
      )}
      
      {/* Movies For You Tab */}
      {activeTab === 'recommendations' && (
        <ScrollView style={homeStyles.homeContainer}>
          {/* Favorite Genres Section */}
          {renderFavoriteGenresSection()}
          
          {/* Recommendations Section */}
          <View style={styles.recommendationsSection}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
              Recommended For You
            </Text>
            
            {recommendations.length > 0 ? (
              renderRecommendationsCarousel()
            ) : (
              <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', marginTop: 10, paddingHorizontal: 16 }}>
                Rate more movies to get personalized recommendations
              </Text>
            )}
          </View>
          
          {/* Stats Section */}
          {renderStatsSection()}
        </ScrollView>
      )}
      
      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} animationType="slide" transparent>
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, justifyContent: 'flex-end' }}
    >
      <View style={[modalStyles.modalContainer, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <Text style={modalStyles.modalTitle}>{selectedMovie?.title}</Text>
        <TextInput
          style={modalStyles.modalInput}
          placeholder="Rate 1–10"
          keyboardType="numeric"
          value={ratingInput}
          onChangeText={setRatingInput}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={modalStyles.modalButton}
          onPress={() => {
            onAddToSeen({
              ...selectedMovie,
              userRating: parseFloat(ratingInput),
              eloRating: parseFloat(ratingInput) * 100,
              comparisonWins: 0,
              gamesPlayed: 0,
              comparisonHistory: [],
            });
            setRatingModalVisible(false);
            setRatingInput('');
          }}
        >
          <Text style={modalStyles.modalButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </TouchableWithoutFeedback>
</Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  popularSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  whatsOutNowSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayDate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  recommendationsSection: {
    marginVertical: 16,
  },
  statsSection: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: '40%',
  },
  statIcon: {
    marginRight: 12,
  },
  statInfo: {
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  popularScrollContent: {
    paddingVertical: 8,
  },
  movieCard: {
    width: MOVIE_CARD_WIDTH,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  moviePoster: {
    width: '100%',
    height: MOVIE_CARD_WIDTH * 1.5, // 3:2 aspect ratio
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: '600',
    padding: 8,
    textAlign: 'center',
  },
  popularScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  genresContainer: {
    marginTop: 8,
  },
  genreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  genreInfo: {
    flex: 1,
  },
  genreName: {
    fontSize: 16,
    fontWeight: '500',
  },
  genreCount: {
    fontSize: 12,
    marginTop: 2,
  },
  genreScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreScore: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  genreRankText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Carousel styles
  carouselContainer: {
    height: MOVIE_CARD_WIDTH * 1.8,
    marginBottom: 16,
  },
  carousel: {
    paddingLeft: 16,
    paddingRight: width - CAROUSEL_ITEM_WIDTH,
    alignItems: 'center',
  },
  carouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    zIndex: 1,
  },
  matchText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 8,
  },
  movieInfo: {
    fontSize: 12,
    marginBottom: 8,
  },
  rateButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  quickRateButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  swipeInstruction: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Recent releases styles
  recentReleasesContainer: {
    paddingVertical: 8,
  },
  recentCard: {
    width: 300,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentPoster: {
    width: 100,
    height: 150,
  },
  recentInfo: {
    flex: 1,
    padding: 12,
  },
  releaseDateContainer: {
    marginVertical: 6,
  },
  releaseDate: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rateRecentButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  loadingContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Recommendation styling
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recommendationSubtitle: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  refreshButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  recommendationFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  dotIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dotIndicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default HomeScreen;
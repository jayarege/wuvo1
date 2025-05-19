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
const MOVIE_CARD_WIDTH = (width - 48) / 2.5;
const CAROUSEL_ITEM_WIDTH = MOVIE_CARD_WIDTH + 20;
const API_KEY = 'b401be0ea16515055d8d0bde16f80069';

function HomeScreen({ seen, unseen, genres, newReleases, isDarkMode, toggleTheme, onAddToSeen }) {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('new');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingInput, setRatingInput] = useState('');
  const [recentReleases, setRecentReleases] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  
  const slideAnim = useRef(new Animated.Value(300)).current;
  const popularScrollX = useRef(new Animated.Value(0)).current;
  const popularScrollRef = useRef(null);
  const [popularIndex, setPopularIndex] = useState(0);
  const autoScrollPopular = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollAnimation = useRef(null);
  
  const today = useMemo(() => new Date(), []);
  const oneWeekAgo = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 7);
    return date;
  }, [today]);
  
  const formatDate = useCallback((date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }, []);
  
  const formatDateForAPI = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);
  
  const formatReleaseDate = useCallback((dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

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
      
      const recentMovies = data.results
        .filter(movie => movie.poster_path)
        .map(movie => ({
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path,
          score: movie.vote_average,
          voteCount: movie.vote_count,
          release_date: movie.release_date,
          genre_ids: movie.genre_ids,
          overview: movie.overview || "",
          alreadySeen: seen.some(m => m.id === movie.id),
          inWatchlist: unseen.some(m => m.id === movie.id),
          userRating: seen.find(m => m.id === movie.id)?.userRating
        }));
      
      setRecentReleases(recentMovies);
      setIsLoadingRecent(false);
    } catch (error) {
      console.error('Error fetching recent releases:', error);
      setIsLoadingRecent(false);
    }
  }, [today, oneWeekAgo, seen, unseen, formatDateForAPI]);

  const startPopularAutoScroll = useCallback(() => {
    if (autoScrollPopular.current) clearInterval(autoScrollPopular.current);
    autoScrollPopular.current = setInterval(() => {
      const next = (popularIndex + 1) % 10;
      Animated.timing(popularScrollX, {
        toValue: next * CAROUSEL_ITEM_WIDTH,
        duration: 800,
        useNativeDriver: true
      }).start();
      setPopularIndex(next);
    }, 5000);
  }, [popularIndex, popularScrollX]);

  const startAutoScroll = useCallback(() => {
    if (autoScrollAnimation.current) {
      autoScrollAnimation.current.stop();
    }
    
    autoScrollAnimation.current = Animated.loop(
      Animated.timing(position.x, {
        toValue: -CAROUSEL_ITEM_WIDTH * 3,
        duration: 15000,
        useNativeDriver: true,
      })
    );
    
    autoScrollAnimation.current.start();
  }, [position.x]);

  useEffect(() => {
    fetchRecentReleases();
    fetchPopularMovies();
  }, [fetchRecentReleases, fetchPopularMovies]);

  useEffect(() => {
    if (popularMovies.length > 0 && activeTab === 'new') {
      startPopularAutoScroll();
    }
    return () => clearInterval(autoScrollPopular.current);
  }, [popularMovies, activeTab, startPopularAutoScroll]);

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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
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
          setTimeout(startAutoScroll, 3000);
        });
      },
    })
  ).current;

  const recommendations = useMemo(() => {
    if (seen.length === 0) return [];
    
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
    
    const suggestions = [...unseen]
      .filter(movie => movie.poster && movie.poster_path)
      .map(movie => {
        let yearProximity = 0;
        if (movie.release_date) {
          const movieYear = new Date(movie.release_date).getFullYear();
          const yearDiff = Math.abs(movieYear - avgPreferredYear);
          yearProximity = Math.max(0, 1 - (yearDiff / 50));
        }
        
        const genreMatchScore = movie.genre_ids
          ? movie.genre_ids.reduce((sum, genreId) => sum + (genreScores[genreId] || 0), 0)
          : 0;
            
        return {
          ...movie,
          recommendationScore: (genreMatchScore * 0.7) + (yearProximity * 0.3),
          hasBeenSeen: false
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 20);

    return suggestions;
  }, [seen, unseen]);

  const topGenres = useMemo(() => {
    if (seen.length === 0) return [];
    
    const genreScores = {};
    const genreVotes = {};
    
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

    return Object.entries(genreScores)
      .map(([genreId, totalScore]) => ({
        id: genreId,
        name: genres[genreId] || 'Unknown',
        averageScore: totalScore / genreVotes[genreId],
        movieCount: genreVotes[genreId]
      }))
      .filter(genre => genre.movieCount >= 2)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);
  }, [seen, genres]);

  const openRatingModal = useCallback((movie) => {
    setSelectedMovie(movie);
    setRatingInput('');
    setRatingModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeRatingModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setRatingModalVisible(false);
      setSelectedMovie(null);
      setRatingInput('');
    });
  }, [slideAnim]);

  const handleMovieSelect = useCallback((movie) => {
    openRatingModal(movie);
  }, [openRatingModal]);
  
  const submitRating = useCallback(() => {
    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 1 || rating > 10) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      return;
    }
    
    const ratedMovie = {
      ...selectedMovie,
      userRating: rating,
      eloRating: rating * 100,
      comparisonHistory: [],
      comparisonWins: 0,
    };
    
    onAddToSeen(ratedMovie);
    
    if (recentReleases.some(m => m.id === selectedMovie.id)) {
      setRecentReleases(prev => 
        prev.map(m => 
          m.id === selectedMovie.id 
            ? { ...m, alreadySeen: true, userRating: rating } 
            : m
        )
      );
    }
    
    closeRatingModal();
  }, [ratingInput, selectedMovie, onAddToSeen, recentReleases, closeRatingModal, slideAnim]);

  const getCardScale = useCallback((index) => {
    const inputRange = [
      (index - 1) * CAROUSEL_ITEM_WIDTH,
      index * CAROUSEL_ITEM_WIDTH,
      (index + 1) * CAROUSEL_ITEM_WIDTH,
    ];
    
    return scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });
  }, [scrollX]);
  
  const getCardRotation = useCallback((index) => {
    const inputRange = [
      (index - 1) * CAROUSEL_ITEM_WIDTH,
      index * CAROUSEL_ITEM_WIDTH,
      (index + 1) * CAROUSEL_ITEM_WIDTH,
    ];
    
    return scrollX.interpolate({
      inputRange,
      outputRange: ['5deg', '0deg', '-5deg'],
      extrapolate: 'clamp',
    });
  }, [scrollX]);

  const calculateMatchPercentage = useCallback((movie) => {
    if (!movie.genre_ids || topGenres.length === 0) return null;
    
    const topGenreIds = topGenres.map(g => parseInt(g.id));
    const matchingGenres = movie.genre_ids.filter(id => 
      topGenreIds.includes(parseInt(id))
    ).length;
    
    if (matchingGenres === 0) return null;
    
    const maxPossibleMatches = Math.min(movie.genre_ids.length, topGenreIds.length);
    const matchPercentage = Math.round((matchingGenres / maxPossibleMatches) * 100);
    
    return matchPercentage;
  }, [topGenres]);

  const renderCarouselItem = useCallback(({ item, index }) => {
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
              { translateY: Animated.multiply(position.x, 0.1) },
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

  const renderFavoriteGenresSection = useCallback(() => {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
          Your Favorite Genres
        </Text>
        {topGenres.length > 0 ? (
          <View style={styles.genresContainer}>
            {topGenres.map((genre, index) => (
              <View
                key={genre.id}
                style={[
                  styles.genreItem,
                  {
                    backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5',
                    borderColor: isDarkMode ? '#8A2BE2' : '#E0E0E0'
                  }
                ]}
              >
                <View style={styles.genreInfo}>
                  <Text style={[styles.genreName, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                    {genre.name}
                  </Text>
                  <Text style={[styles.genreCount, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                    {genre.movieCount} movies
                  </Text>
                </View>
                <View style={styles.genreScoreContainer}>
                  <Text style={[styles.genreScore, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                    {genre.averageScore.toFixed(1)}
                  </Text>
                  <Text style={[styles.genreRankText, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                    #{index + 1}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', marginTop: 10 }}>
            Rate more movies to see your favorite genres
          </Text>
        )}
      </View>
    );
  }, [isDarkMode, topGenres]);

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
              position.setValue({ x: 0, y: 0 });
              setCurrentIndex(0);
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

  return (
    <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
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
      
      {activeTab === 'new' && (
        <ScrollView style={homeStyles.homeContainer}>
          {renderWhatsOutNowSection()}
          {renderPopularMoviesSection()}
        </ScrollView>
      )}
      
      {activeTab === 'recommendations' && (
        <ScrollView style={homeStyles.homeContainer}>
          {renderFavoriteGenresSection()}
          
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
          
          {renderStatsSection()}
        </ScrollView>
      )}
      
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRatingModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent, 
                { 
                  transform: [{ translateY: slideAnim }], 
                  backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5',
                }
              ]}
            >
              <Text style={[modalStyles.modalTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                Rate {selectedMovie?.title}
              </Text>
              <TextInput
                style={[
                  styles.ratingInput,
                  {
                    backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF',
                    borderColor: isDarkMode ? '#8A2BE2' : '#4B0082',
                    color: isDarkMode ? '#F5F5F5' : '#333',
                  },
                ]}
                value={ratingInput}
                onChangeText={setRatingInput}
                keyboardType="decimal-pad"
                placeholder="7.5"
                maxLength={3}
                returnKeyType="done"
                placeholderTextColor={isDarkMode ? '#aaa' : '#999'}
                autoFocus={true}
              />
              <View style={modalStyles.modalButtons}>
                <TouchableOpacity
                  style={[modalStyles.modalButton, { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }]}
                  onPress={submitRating}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: isDarkMode ? '#1C2526' : '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                    Save
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.modalButton, modalStyles.cancelButton, { borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}
                  onPress={closeRatingModal}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', fontSize: 16, fontWeight: '600' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

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
    height: MOVIE_CARD_WIDTH * 1.5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 16,
    width: '85%',
    maxHeight: '40%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  ratingInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    width: '100%',
    marginVertical: 16,
    textAlign: 'center',
  },
});

export default HomeScreen;
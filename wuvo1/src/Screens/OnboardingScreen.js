import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const { width, height } = Dimensions.get('window');
const ONBOARDING_COMPLETE_KEY = 'wuvo_onboarding_complete';
const API_KEY = 'b401be0ea16515055d8d0bde16f80069';
const POPULAR_MOVIES_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`;

const OnboardingScreen = ({ isDarkMode, onComplete, onAddToSeen }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [randomMovies, setRandomMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [moviesReady, setMoviesReady] = useState(false);
  const flatListRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Fetch popular movies to rate
  useEffect(() => {
    const fetchPopularMovies = async () => {
      try {
        setLoadingMovies(true);
        const response = await fetch(POPULAR_MOVIES_URL);
        
        if (!response.ok) {
          throw new Error('Failed to fetch popular movies');
        }
        
        const data = await response.json();
        
        // Filter movies with posters and good vote counts
        const validMovies = data.results.filter(
          movie => movie.poster_path && movie.vote_count > 100
        );
        
        // Shuffle array and take 5 random movies
        const shuffled = [...validMovies].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5).map(movie => ({
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path,
          score: movie.vote_average,
          voteCount: movie.vote_count,
          release_date: movie.release_date || 'Unknown',
          genre_ids: movie.genre_ids || [],
          overview: movie.overview || '',
          userRating: null // Will be set when user rates
        }));
        
        setRandomMovies(selected);
        setMoviesReady(true);
      } catch (error) {
        console.error('Error fetching popular movies:', error);
        // Fallback to some hardcoded popular movies in case of error
        setRandomMovies([
          { id: 238, title: "The Godfather", poster: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", score: 8.7, userRating: null },
          { id: 278, title: "The Shawshank Redemption", poster: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", score: 8.7, userRating: null },
          { id: 550, title: "Fight Club", poster: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", score: 8.4, userRating: null },
          { id: 155, title: "The Dark Knight", poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", score: 8.5, userRating: null },
          { id: 680, title: "Pulp Fiction", poster: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", score: 8.5, userRating: null }
        ]);
        setMoviesReady(true);
      } finally {
        setLoadingMovies(false);
      }
    };
    
    fetchPopularMovies();
  }, []);
  
  // Mark onboarding as complete in AsyncStorage
  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  };
  
  // Handle rating a movie
  const handleRateMovie = (movie, rating) => {
    // Update the movie with the user's rating
    const ratedMovie = {
      ...movie,
      userRating: rating,
      eloRating: rating * 10 // Convert to 0-100 scale for consistency
    };
    
    // Add to rated movies list
    setRatedMovies(prev => [...prev, ratedMovie]);
    
    // Update the randomMovies array to show the movie as rated
    setRandomMovies(prev => 
      prev.map(m => m.id === movie.id ? { ...m, userRating: rating } : m)
    );
  };
  
  // Handle completing the onboarding process
  const handleComplete = () => {
    // Add rated movies to the app's seen list
    ratedMovies.forEach(movie => {
      onAddToSeen(movie);
    });
    
    // Mark onboarding as complete
    markOnboardingComplete();
    
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      // Call the onComplete handler from props
      onComplete();
    });
  };
  
  // Handle going to next screen
  const goToNextScreen = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      });
    }
  };

  // Check if all 5 movies have been rated
  const allMoviesRated = randomMovies.every(movie => movie.userRating !== null);
  
  // Onboarding data for the carousel
  const onboardingData = [
    {
      id: '1',
      title: 'Welcome to Wuvo',
      description: 'Your personal movie ranking app that learns what you like and helps you discover the films you will love.',
      icon: 'film-outline'
    },
    {
      id: '2',
      title: 'Rate Movies',
      description: 'Tap on the stars or use the slider to rate movies you have seen. The more you rate, the better we understand your taste.',
      icon: 'star-outline'
    },
    {
      id: '3',
      title: 'Compare Films',
      description: 'In the Wildcard section, you will be shown pairs of movies to compare. This helps us fine-tune your preferences.',
      icon: 'git-compare-outline'
    },
    {
      id: '4',
      title: 'Discover New Films',
      description: 'The more you rate and compare, the more personalized your recommendations become. Your perfect next movie is waiting.',
      icon: 'search-outline'
    },
    {
      id: '5',
      title: 'Let\'s Get Started',
      description: 'Rate these 5 popular movies to jump-start your recommendations. Tap a rating from 1-10 for each film.',
      icon: 'rocket-outline',
      showMovies: true
    }
  ];
  
  // Render each onboarding screen
  const renderItem = ({ item }) => {
    return (
      <View style={[
        styles.slide, 
        { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }
      ]}>
        <View style={styles.slideContent}>
          <View style={[
            styles.iconContainer, 
            { backgroundColor: isDarkMode ? '#4B0082' : '#F0F0F0' }
          ]}>
            <Ionicons
              name={item.icon}
              size={80}
              color={isDarkMode ? '#FFD700' : '#4B0082'}
            />
          </View>
          
          <Text style={[
            styles.title, 
            { color: isDarkMode ? '#FFFFFF' : '#333333' }
          ]}>
            {item.title}
          </Text>
          
          <Text style={[
            styles.description, 
            { color: isDarkMode ? '#D3D3D3' : '#666666' }
          ]}>
            {item.description}
          </Text>
          
          {/* Show movie rating UI on the last screen */}
          {item.showMovies && (
            <View style={styles.moviesContainer}>
              {loadingMovies ? (
                <ActivityIndicator size="large" color={isDarkMode ? '#FFD700' : '#4B0082'} />
              ) : (
                <>
                  {randomMovies.map((movie) => (
                    <View key={movie.id} style={styles.movieCard}>
                      <View style={styles.movieInfo}>
                        <Image
                          source={{ uri: `https://image.tmdb.org/t/p/w185${movie.poster}` }}
                          style={styles.moviePoster}
                          resizeMode="cover"
                        />
                        <View style={styles.movieDetails}>
                          <Text style={[
                            styles.movieTitle,
                            { color: isDarkMode ? '#FFFFFF' : '#333333' }
                          ]} numberOfLines={2}>
                            {movie.title}
                          </Text>
                          <Text style={[
                            styles.movieScore,
                            { color: isDarkMode ? '#FFD700' : '#4B0082' }
                          ]}>
                            TMDb: {movie.score.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Rating buttons */}
                      <View style={styles.ratingButtons}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                          <TouchableOpacity
                            key={rating}
                            style={[
                              styles.ratingButton,
                              movie.userRating === rating && styles.selectedRating,
                              movie.userRating === rating ? 
                                { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' } : 
                                { backgroundColor: isDarkMode ? '#4B0082' : '#F0F0F0' }
                            ]}
                            onPress={() => handleRateMovie(movie, rating)}
                          >
                            <Text style={[
                              styles.ratingText,
                              movie.userRating === rating ? 
                                { color: isDarkMode ? '#1C2526' : '#FFFFFF' } : 
                                { color: isDarkMode ? '#FFFFFF' : '#4B0082' }
                            ]}>
                              {rating}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                  
                  {/* Complete button */}
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      allMoviesRated ? 
                        { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082', opacity: 1 } : 
                        { backgroundColor: isDarkMode ? '#333333' : '#CCCCCC', opacity: 0.7 }
                    ]}
                    onPress={handleComplete}
                    disabled={!allMoviesRated}
                  >
                    <Text style={[
                      styles.completeButtonText,
                      { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
                    ]}>
                      {allMoviesRated ? 'Let\'s Go!' : 'Rate All 5 Movies to Continue'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };
  
  // Progress indicators (dots) at the bottom
  const renderPagination = () => {
    // Hide on the last screen
    if (currentIndex === onboardingData.length - 1) return null;
    
    return (
      <View style={styles.pagination}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex ? 
                { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082', width: 20 } : 
                { backgroundColor: isDarkMode ? '#444444' : '#CCCCCC', width: 10 }
            ]}
          />
        ))}
      </View>
    );
  };
  
  // Next or Skip button
  const renderButton = () => {
    // Hide on the last screen
    if (currentIndex === onboardingData.length - 1) return null;
    
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
          ]}
          onPress={goToNextScreen}
        >
          <Text style={[
            styles.buttonText,
            { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
          ]}>
            Next
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={isDarkMode ? '#1C2526' : '#FFFFFF'}
            style={{ marginLeft: 5 }}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleComplete}
        >
          <Text style={[
            styles.skipButtonText,
            { color: isDarkMode ? '#D3D3D3' : '#666666' }
          ]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={event => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
        />
        
        {renderPagination()}
        {renderButton()}
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContent: {
    width: '85%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    fontSize: 16,
  },
  moviesContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  movieCard: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    padding: 10,
  },
  movieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  moviePoster: {
    width: 60,
    height: 90,
    borderRadius: 5,
  },
  movieDetails: {
    flex: 1,
    marginLeft: 15,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  movieScore: {
    fontSize: 14,
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ratingButton: {
    width: '9%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 5,
  },
  selectedRating: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  completeButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
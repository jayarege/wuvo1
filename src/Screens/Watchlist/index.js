import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import layoutStyles from '../../Styles/layoutStyles';
import headerStyles from '../../Styles/headerStyles';
import listStyles from '../../Styles/listStyles';
import scoreDisplayStyles from '../../Styles/scoreDisplayStyles';
import stateStyles from '../../Styles/StateStyles';
import movieCardStyles from '../../Styles/movieCardStyles';
import modalStyles from '../../Styles/modalStyles';

function WatchlistScreen({ movies, genres, isDarkMode, onAddToSeen }) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingInput, setRatingInput] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState(null);

  const getPosterUrl = path => `https://image.tmdb.org/t/p/w342${path}`;
  const sortedMovies = [...movies].sort((a, b) => b.score - a.score);

  const filteredMovies = selectedGenreId
    ? sortedMovies.filter(movie => movie.genre_ids?.includes(selectedGenreId))
    : sortedMovies;

  const uniqueGenreIds = Array.from(new Set(movies.flatMap(m => m.genre_ids || [])));

  if (sortedMovies.length === 0) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={stateStyles.emptyStateContainer}>
          <Ionicons name="eye-off-outline" size={64} color={isDarkMode ? '#D3D3D3' : '#A9A9A9'} />
          <Text style={[stateStyles.emptyStateText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>Your watchlist is empty.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
      <View style={[headerStyles.screenHeader, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderBottomColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' }]}>
        <Text style={[headerStyles.screenTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>Top Rated You Haven't Seen</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginVertical: 10 }}>
        {uniqueGenreIds.map(id => (
          <TouchableOpacity
            key={id}
            onPress={() => setSelectedGenreId(id === selectedGenreId ? null : id)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              marginRight: 10,
              borderRadius: 20,
              backgroundColor: selectedGenreId === id ? (isDarkMode ? '#FFD700' : '#4B0082') : (isDarkMode ? '#333' : '#DDD')
            }}
          >
            <Text style={{ color: isDarkMode ? '#FFF' : '#000', fontWeight: '600' }}>{genres[id] || 'Unknown'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={listStyles.rankingsList}>
        {filteredMovies.map((movie, index) => (
          <View key={movie.id} style={{ backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderRadius: 12, marginBottom: 12, overflow: 'hidden', marginHorizontal: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              <Image source={{ uri: getPosterUrl(movie.poster) }} style={{ width: 100, height: 150 }} resizeMode="cover" />
              <View style={{ flex: 1, padding: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#F5F5F5' : '#333' }}>{movie.title}</Text>
                <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', marginTop: 4 }}>TMDb: {movie.score.toFixed(1)}</Text>
                <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', marginBottom: 4 }}>{new Date(movie.release_date).getFullYear()}</Text>
                <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666' }}>Genres: {movie.genre_ids.map(id => genres[id] || 'Unknown').join(', ')}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMovie(movie);
                    setRatingModalVisible(true);
                    setRatingInput('');
                  }}
                  style={{ marginTop: 10, paddingVertical: 10, borderRadius: 6, alignItems: 'center', backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }}
                >
                  <Text style={{ color: isDarkMode ? '#1C2526' : '#FFFFFF', fontWeight: '600' }}>Rate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={ratingModalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={[modalStyles.modalContainer, { backgroundColor: isDarkMode ? '#1C2526' : '#FFF' }]}>
              <Text style={modalStyles.modalTitle}>{selectedMovie?.title}</Text>
              <TextInput
                style={modalStyles.modalInput}
                placeholder="Enter rating (1–10)"
                keyboardType="numeric"
                value={ratingInput}
                onChangeText={setRatingInput}
              />
              <TouchableOpacity
                style={modalStyles.modalButton}
                onPress={() => {
                  const rating = parseFloat(ratingInput);
                  if (!isNaN(rating) && rating >= 1 && rating <= 10) {
                    onAddToSeen({
                      ...selectedMovie,
                      userRating: rating,
                      eloRating: rating * 100,
                      comparisonWins: 0,
                      gamesPlayed: 0,
                      comparisonHistory: [],
                    });
                    setRatingModalVisible(false);
                    setRatingInput('');
                  }
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

export default WatchlistScreen;

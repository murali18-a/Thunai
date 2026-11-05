import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import NewCitizenScreen from './src/screens/NewCitizenScreen';
import MatchResultsScreen from './src/screens/MatchResultsScreen';
import SchemeDetailScreen from './src/screens/SchemeDetailScreen';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [profile, setProfile] = useState(null);

  const handleLogin = (phone) => {
    setUser(phone);
    setScreen('newCitizen');
  };

  const handleMatches = (matchedSchemes, citizenProfile) => {
    setMatches(matchedSchemes);
    setProfile(citizenProfile);
    setScreen('matchResults');
  };

  const handleSelectScheme = (scheme) => {
    setSelectedScheme(scheme);
    setScreen('schemeDetail');
  };

  const handleBack = () => {
    if (screen === 'schemeDetail') setScreen('matchResults');
    else if (screen === 'matchResults') setScreen('newCitizen');
    else if (screen === 'newCitizen') setScreen('login');
  };

  const handleNewCitizen = () => {
    setMatches([]);
    setSelectedScheme(null);
    setProfile(null);
    setScreen('newCitizen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff7ed" />
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'newCitizen' && (
        <NewCitizenScreen onMatches={handleMatches} onLogout={() => setScreen('login')} />
      )}
      {screen === 'matchResults' && (
        <MatchResultsScreen
          matches={matches}
          profile={profile}
          onSelect={handleSelectScheme}
          onBack={handleBack}
          onNewCitizen={handleNewCitizen}
        />
      )}
      {screen === 'schemeDetail' && (
        <SchemeDetailScreen scheme={selectedScheme} onBack={handleBack} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
  },
});


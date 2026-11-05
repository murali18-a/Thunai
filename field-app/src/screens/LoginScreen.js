import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

export default function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    if (phone.length !== 10) {
      Alert.alert('பிழை', 'சரியான 10 இலக்க எண்ணை உள்ளிடவும்');
      return;
    }
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      // Mock: any 6-digit OTP works
      onLogin(phone);
    } else {
      Alert.alert('பிழை', '6 இலக்க OTP உள்ளிடவும்');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        {/* App Title */}
        <Text style={styles.logo}>துணை</Text>
        <Text style={styles.subtitle}>THUNAI</Text>
        <Text style={styles.tagline}>களப்பணியாளர் செயலி</Text>

        {/* Phone Input */}
        <Text style={styles.label}>கைபேசி எண்</Text>
        <TextInput
          style={styles.input}
          placeholder="9876543210"
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
        />

        {!otpSent ? (
          <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
            <Text style={styles.buttonText}>OTP அனுப்பு</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={[styles.label, { marginTop: 16 }]}>OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
              <Text style={styles.buttonText}>உள்நுழைக</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f97316',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#78716c',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#a8a29e',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#44403c',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1c1917',
    backgroundColor: '#fafaf9',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

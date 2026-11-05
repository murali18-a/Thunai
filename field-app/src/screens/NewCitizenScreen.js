import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Platform,
} from 'react-native';
import { matchSchemes } from '../engine/matcher';

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar',
];

const GENDERS = [
  { label: 'ஆண் (Male)', value: 'M' },
  { label: 'பெண் (Female)', value: 'F' },
  { label: 'பிற (Other)', value: 'O' },
];

const MARITAL_STATUS = [
  { label: 'திருமணமானவர் (Married)', value: 'married' },
  { label: 'திருமணமாகாதவர் (Unmarried)', value: 'unmarried' },
  { label: 'விதவை (Widow)', value: 'widow' },
  { label: 'விவாகரத்து (Divorced)', value: 'divorced' },
];

const OCCUPATIONS = [
  { label: 'விவசாயி (Farmer)', value: 'farmer' },
  { label: 'கூலி (Labourer)', value: 'labourer' },
  { label: 'மாணவர் (Student)', value: 'student' },
  { label: 'இல்லத்தரசி (Housewife)', value: 'housewife' },
  { label: 'மீனவர் (Fisher)', value: 'fisher' },
  { label: 'நெசவாளர் (Weaver)', value: 'weaver' },
  { label: 'ஓட்டுநர் (Driver)', value: 'driver' },
  { label: 'சுயதொழில் (Self-employed)', value: 'self_employed' },
  { label: 'வேலையில்லாதவர் (Unemployed)', value: 'unemployed' },
];

const SOCIAL_CATEGORIES = [
  { label: 'SC', value: 'SC' },
  { label: 'ST', value: 'ST' },
  { label: 'OBC', value: 'OBC' },
  { label: 'MBC', value: 'MBC' },
  { label: 'General', value: 'General' },
];

function Picker({ label, options, selected, onSelect }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.chip,
              selected === opt.value && styles.chipActive,
            ]}
          >
            <Text style={[
              styles.chipText,
              selected === opt.value && styles.chipTextActive,
            ]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function NewCitizenScreen({ onMatches, onLogout }) {
  const [form, setForm] = useState({
    age: '',
    gender: 'F',
    marital_status: 'married',
    district: 'Salem',
    occupation: 'housewife',
    annual_income: '',
    social_category: 'OBC',
    is_disabled: false,
    is_pregnant: false,
    land_hectares: '',
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    const profile = {
      ...form,
      age: parseInt(form.age, 10) || 0,
      annual_income: parseInt(form.annual_income, 10) || 0,
      land_hectares: parseFloat(form.land_hectares) || 0,
    };
    const results = matchSchemes(profile);
    onMatches(results, profile);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>புதிய குடிமகன்</Text>
        <Text style={styles.subtitleText}>New Citizen Profile</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>வெளியேறு ↩</Text>
        </TouchableOpacity>
      </View>

      {/* Age */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>வயது (Age)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={3}
          placeholder="எ.கா. 65"
          placeholderTextColor="#aaa"
          value={form.age}
          onChangeText={v => update('age', v)}
        />
      </View>

      <Picker label="பாலினம் (Gender)" options={GENDERS} selected={form.gender} onSelect={v => update('gender', v)} />
      <Picker label="திருமண நிலை (Marital Status)" options={MARITAL_STATUS} selected={form.marital_status} onSelect={v => update('marital_status', v)} />

      {/* District */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>மாவட்டம் (District)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
          {TN_DISTRICTS.map(d => (
            <TouchableOpacity
              key={d}
              onPress={() => update('district', d)}
              style={[styles.chip, form.district === d && styles.chipActive]}
            >
              <Text style={[styles.chipText, form.district === d && styles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Picker label="தொழில் (Occupation)" options={OCCUPATIONS} selected={form.occupation} onSelect={v => update('occupation', v)} />

      {/* Income */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>ஆண்டு வருமானம் (Annual Income ₹)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="எ.கா. 50000"
          placeholderTextColor="#aaa"
          value={form.annual_income}
          onChangeText={v => update('annual_income', v)}
        />
      </View>

      <Picker label="சமூக வகை (Social Category)" options={SOCIAL_CATEGORIES} selected={form.social_category} onSelect={v => update('social_category', v)} />

      {/* Land */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>நிலம் (Land in hectares)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="எ.கா. 2.5"
          placeholderTextColor="#aaa"
          value={form.land_hectares}
          onChangeText={v => update('land_hectares', v)}
        />
      </View>

      {/* Toggles */}
      <View style={styles.toggleRow}>
        <Text style={styles.label}>ஊனமுற்றவர் (Disabled)</Text>
        <Switch
          value={form.is_disabled}
          onValueChange={v => update('is_disabled', v)}
          trackColor={{ true: '#f97316' }}
          thumbColor={form.is_disabled ? '#fff' : '#d6d3d1'}
        />
      </View>

      {form.gender === 'F' && (
        <View style={styles.toggleRow}>
          <Text style={styles.label}>கர்ப்பிணி (Pregnant)</Text>
          <Switch
            value={form.is_pregnant}
            onValueChange={v => update('is_pregnant', v)}
            trackColor={{ true: '#f97316' }}
            thumbColor={form.is_pregnant ? '#fff' : '#d6d3d1'}
          />
        </View>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>திட்டங்களைக் காட்டு →</Text>
        <Text style={styles.submitSubText}>Show matching schemes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f97316' },
  subtitleText: { fontSize: 13, color: '#78716c' },
  logoutBtn: { position: 'absolute', right: 0, top: 0, padding: 8 },
  logoutText: { color: '#f97316', fontSize: 13, fontWeight: '600' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#44403c', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#d6d3d1', borderRadius: 10,
    padding: 12, fontSize: 16, color: '#1c1917', backgroundColor: '#fafaf9',
  },
  pickerRow: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#d6d3d1', marginRight: 8, backgroundColor: '#fafaf9',
  },
  chipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  chipText: { fontSize: 13, color: '#44403c' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingVertical: 4,
  },
  submitBtn: {
    backgroundColor: '#f97316', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 12,
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  submitSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
});

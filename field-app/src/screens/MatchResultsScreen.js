import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';

function benefitText(benefit) {
  if (!benefit) return '';
  if (benefit.kind === 'monthly') return `₹${benefit.amount}/மாதம்`;
  if (benefit.kind === 'onetime') return `₹${benefit.amount} (ஒருமுறை)`;
  if (benefit.kind === 'insurance_cover') return `₹${benefit.amount} காப்பீடு`;
  return benefit.description_ta || '';
}

export default function MatchResultsScreen({ matches, profile, onSelect, onBack, onNewCitizen }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← திரும்பு</Text>
        </TouchableOpacity>
        <Text style={styles.title}>பொருத்தமான திட்டங்கள்</Text>
        <Text style={styles.subtitle}>
          {matches.length} திட்டங்கள் கிடைத்தன · {matches.length} schemes found
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {matches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>😔</Text>
            <Text style={styles.emptyText}>
              பொருத்தமான திட்டங்கள் இல்லை{'\n'}No matching schemes found
            </Text>
          </View>
        ) : (
          matches.map((scheme, idx) => (
            <TouchableOpacity
              key={scheme.scheme_id}
              style={styles.card}
              onPress={() => onSelect(scheme)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.rank}>
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                </View>
                <View style={styles.cardTitles}>
                  <Text style={styles.schemeTamil}>{scheme.name_ta}</Text>
                  <Text style={styles.schemeEnglish}>{scheme.name_en}</Text>
                </View>
              </View>

              <View style={styles.benefitRow}>
                <Text style={styles.benefitLabel}>பலன்:</Text>
                <Text style={styles.benefitValue}>{benefitText(scheme.benefit)}</Text>
              </View>

              {scheme.eligibility_plain_ta && (
                <Text style={styles.eligibility} numberOfLines={2}>
                  {scheme.eligibility_plain_ta}
                </Text>
              )}

              <View style={styles.tagRow}>
                <View style={[styles.tag, styles.tagLevel]}>
                  <Text style={styles.tagText}>{scheme.level === 'state' ? 'மாநிலம்' : 'மத்திய'}</Text>
                </View>
                <View style={[styles.tag, styles.tagCategory]}>
                  <Text style={styles.tagText}>{scheme.category}</Text>
                </View>
              </View>

              <Text style={styles.tapHint}>விவரம் காண தட்டவும் →</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.newBtn} onPress={onNewCitizen}>
          <Text style={styles.newBtnText}>+ புதிய குடிமகன்</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  header: { padding: 20, paddingBottom: 10 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#f97316', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1c1917' },
  subtitle: { fontSize: 13, color: '#78716c', marginTop: 2 },
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 4 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 32,
    alignItems: 'center', elevation: 2,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#78716c', textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  rank: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#f97316',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rankText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  cardTitles: { flex: 1 },
  schemeTamil: { fontSize: 16, fontWeight: 'bold', color: '#1c1917', lineHeight: 22 },
  schemeEnglish: { fontSize: 12, color: '#78716c', marginTop: 2 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  benefitLabel: { fontSize: 13, color: '#78716c', marginRight: 6 },
  benefitValue: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  eligibility: { fontSize: 12, color: '#a8a29e', lineHeight: 18, marginBottom: 8 },
  tagRow: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  tagLevel: { backgroundColor: '#fef3c7' },
  tagCategory: { backgroundColor: '#e0f2fe' },
  tagText: { fontSize: 11, color: '#44403c' },
  tapHint: { fontSize: 11, color: '#f97316', marginTop: 8, textAlign: 'right' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e7e5e4' },
  newBtn: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  newBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});


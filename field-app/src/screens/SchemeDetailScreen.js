import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking,
} from 'react-native';

function benefitText(benefit) {
  if (!benefit) return '';
  if (benefit.kind === 'monthly') return `₹${benefit.amount}/மாதம்`;
  if (benefit.kind === 'onetime') return `₹${benefit.amount} (ஒருமுறை)`;
  if (benefit.kind === 'insurance_cover') return `₹${benefit.amount} காப்பீடு`;
  return benefit.description_ta || '';
}

export default function SchemeDetailScreen({ scheme, onBack }) {
  if (!scheme) return null;

  const handleCallHelpline = () => {
    if (scheme.helpline) {
      Linking.openURL(`tel:${scheme.helpline}`);
    }
  };

  const handleOpenUrl = () => {
    if (scheme.source_url) {
      Linking.openURL(scheme.source_url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← திரும்பு</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{scheme.name_ta}</Text>
        <Text style={styles.subtitle}>{scheme.name_en}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
            <Text style={styles.badgeText}>{scheme.level === 'state' ? 'மாநிலம்' : 'மத்திய'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#e0f2fe' }]}>
            <Text style={styles.badgeText}>{scheme.category}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
            <Text style={styles.badgeText}>{scheme.ministry}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        {/* Benefit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 பலன் (Benefit)</Text>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitAmount}>{benefitText(scheme.benefit)}</Text>
          </View>
        </View>

        {/* Eligibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ தகுதி (Eligibility)</Text>
          <Text style={styles.bodyText}>{scheme.eligibility_plain_ta}</Text>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 தேவையான ஆவணங்கள் (Documents)</Text>
          {(scheme.documents_required || []).map((doc, i) => (
            <View key={i} style={styles.checkItem}>
              <Text style={styles.checkBox}>☐</Text>
              <Text style={styles.checkText}>{doc}</Text>
            </View>
          ))}
        </View>

        {/* How to apply */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 விண்ணப்பிக்கும் முறை (How to Apply)</Text>
          {(scheme.how_to_apply_steps || []).map((step, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Where to apply */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 எங்கு விண்ணப்பிப்பது (Where)</Text>
          <Text style={styles.bodyText}>{scheme.where_to_apply}</Text>
        </View>

        {/* Helpline */}
        {scheme.helpline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>☎️ உதவி எண் (Helpline)</Text>
            <TouchableOpacity style={styles.helplineBtn} onPress={handleCallHelpline}>
              <Text style={styles.helplineText}>📞 {scheme.helpline}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Source URL */}
        {scheme.source_url && (
          <View style={styles.section}>
            <TouchableOpacity onPress={handleOpenUrl}>
              <Text style={styles.linkText}>🔗 அரசு இணையதளம் பார்க்க</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QR Code placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 QR குறியீடு</Text>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>[ QR: Thunai Dial-in ]{'\n'}துணை இலவச அழைப்பு எண்</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  header: { padding: 20, paddingBottom: 12, backgroundColor: '#fff', elevation: 2 },
  backBtn: { marginBottom: 10 },
  backText: { color: '#f97316', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1c1917', lineHeight: 28 },
  subtitle: { fontSize: 13, color: '#78716c', marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, color: '#44403c', fontWeight: '500' },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1c1917', marginBottom: 8 },
  bodyText: { fontSize: 14, color: '#44403c', lineHeight: 22 },
  benefitCard: {
    backgroundColor: '#dcfce7', borderRadius: 10, padding: 16, alignItems: 'center',
  },
  benefitAmount: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  checkBox: { fontSize: 16, marginRight: 8, color: '#f97316' },
  checkText: { fontSize: 14, color: '#44403c', flex: 1, lineHeight: 20 },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#f97316',
    justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 1,
  },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  stepText: { fontSize: 14, color: '#44403c', flex: 1, lineHeight: 20 },
  helplineBtn: {
    backgroundColor: '#dbeafe', borderRadius: 10, padding: 14, alignItems: 'center',
  },
  helplineText: { fontSize: 16, fontWeight: '600', color: '#1e40af' },
  linkText: { color: '#2563eb', fontSize: 14, textDecorationLine: 'underline' },
  qrPlaceholder: {
    borderWidth: 2, borderColor: '#d6d3d1', borderStyle: 'dashed',
    borderRadius: 12, padding: 24, alignItems: 'center',
  },
  qrText: { fontSize: 14, color: '#78716c', textAlign: 'center', lineHeight: 22 },
});

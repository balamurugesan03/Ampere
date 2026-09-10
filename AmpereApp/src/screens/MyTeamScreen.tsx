import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useAuth } from '../context/AuthContext';
import { useMyDownline } from '../api/hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'MyTeam'>;

export default function MyTeamScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { data, isLoading } = useMyDownline();

  const onShare = () => {
    if (!user?.referralCode) return;
    Share.share({
      message: `Join Ampere with my referral code: ${user.referralCode}`,
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Profile')}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>My Team</Text>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Text style={styles.codeValue}>{user?.referralCode}</Text>
          <Pressable
            style={({ pressed }) => [styles.shareBtnWrap, pressed && styles.pressedScale]}
            onPress={onShare}
          >
            <LinearGradient
              colors={colors.greenGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shareBtn}
            >
              <Text style={styles.shareBtnText}>Share Code</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Direct Referrals</Text>
          <Text style={styles.sectionCount}>{data?.directReferralsCount ?? 0}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.green} style={{ marginTop: 20 }} />
        ) : (data?.directReferrals.length ?? 0) === 0 ? (
          <Text style={styles.emptyText}>No referrals yet. Share your code to start building your team.</Text>
        ) : (
          data?.directReferrals.map((member) => (
            <View style={styles.memberCard} key={member._id}>
              <View style={styles.memberLeft}>
                <LinearGradient
                  colors={colors.greenGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.memberAvatar}
                >
                  <Text style={styles.memberAvatarText}>
                    {member.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                </LinearGradient>
                <View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberMeta}>{member.referralCode}</Text>
                </View>
              </View>
              <Text style={styles.memberDate}>{new Date(member.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  phone: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: 20 },
  contentInner: { paddingTop: 6, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 6 },
  backBtn: { alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.text },
  pressedScale: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  codeCard: {
    marginTop: 16,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    ...shadows.card,
  },
  codeLabel: { color: colors.muted, fontSize: 12, fontFamily: fonts.regular, marginBottom: 6 },
  codeValue: { color: colors.green, fontSize: 22, fontFamily: fonts.extraBold, letterSpacing: 2, marginBottom: 12 },
  shareBtnWrap: {
    borderRadius: 999,
    ...shadows.buttonGlow,
  },
  shareBtn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  shareBtnText: { color: '#08150c', fontSize: 12.5, fontFamily: fonts.bold },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: { color: colors.text, fontSize: 14.5, fontFamily: fonts.bold },
  sectionCount: { color: colors.green, fontSize: 14.5, fontFamily: fonts.extraBold },
  emptyText: { color: colors.muted, fontSize: 12.5, fontFamily: fonts.regular, marginTop: 10 },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    ...shadows.card,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: '#08150c',
    fontSize: 12,
    fontFamily: fonts.extraBold,
  },
  memberName: { color: colors.text, fontSize: 13, fontFamily: fonts.bold },
  memberMeta: { color: colors.muted, fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
  memberDate: { color: colors.muted, fontSize: 11, fontFamily: fonts.regular },
});

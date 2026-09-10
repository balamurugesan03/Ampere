import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useMyWallet, useMyWalletTransactions, useRanks } from '../api/hooks';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'MyEarnings'>;

const TYPE_LABEL: Record<string, string> = {
  self_purchase: 'Self Purchase Income',
  team_level: 'Team Development Income',
  bonus_pool: 'Bonus Pool Income',
  payout_debit: 'Payout',
  manual_adjustment: 'Adjustment',
  reversal: 'Reversal',
};

export default function MyEarningsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { data: balance, isLoading: loadingBalance } = useMyWallet();
  const { data: transactions = [], isLoading: loadingTx } = useMyWalletTransactions();
  const { data: ranks = [] } = useRanks();

  const teamPV = user?.cumulativeTeamPV ?? 0;
  const sortedRanks = [...ranks].sort((a, b) => a.sortOrder - b.sortOrder);
  const nextRank = sortedRanks.find((r) => r.sortOrder > (user?.currentRankSortOrder ?? 0));
  const progress = nextRank
    ? Math.min(1, teamPV / Math.max(nextRank.criteria.minCumulativeTeamPV, 1))
    : 1;

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Profile')}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>My Earnings</Text>
        </View>

        <LinearGradient
          colors={colors.greenGradientDeep}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          {loadingBalance ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.balanceValue}>{'₹'}{balance ?? 0}</Text>
          )}
        </LinearGradient>

        <View style={styles.rankCard}>
          <View style={styles.rankRow}>
            <Text style={styles.rankLabel}>Current Rank</Text>
            <Text style={styles.rankValue}>{user?.currentRank ?? 'Unranked'}</Text>
          </View>
          {nextRank && (
            <>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {teamPV} / {nextRank.criteria.minCumulativeTeamPV} team PV toward {nextRank.name}
              </Text>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Transaction History</Text>

        {loadingTx ? (
          <ActivityIndicator color={colors.green} style={{ marginTop: 20 }} />
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>No income yet. Earnings appear here after your orders are confirmed as paid.</Text>
        ) : (
          transactions.map((tx) => (
            <View style={styles.txCard} key={tx._id}>
              <View style={[styles.txDot, tx.amount < 0 ? styles.txDotNegative : styles.txDotPositive]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.txType}>
                  {TYPE_LABEL[tx.type] ?? tx.type}
                  {tx.level ? ` (L${tx.level})` : ''}
                </Text>
                <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.txAmount, tx.amount < 0 && styles.txAmountNegative]}>
                {tx.amount < 0 ? '-' : '+'}
                {'₹'}
                {Math.abs(tx.amount)}
              </Text>
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
  balanceCard: {
    marginTop: 16,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    ...shadows.raised,
  },
  balanceLabel: { color: '#bfe9cc', fontSize: 12.5, fontFamily: fonts.regular, marginBottom: 6 },
  balanceValue: { color: '#fff', fontSize: 28, fontFamily: fonts.extraBold },
  rankCard: {
    marginTop: 14,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    ...shadows.card,
  },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rankLabel: { color: colors.muted, fontSize: 12.5, fontFamily: fonts.regular },
  rankValue: { color: colors.green, fontSize: 15, fontFamily: fonts.extraBold },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2a302b',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  progressText: {
    color: colors.muted,
    fontSize: 10.5,
    fontFamily: fonts.regular,
    marginTop: 6,
  },
  sectionTitle: { color: colors.text, fontSize: 14.5, fontFamily: fonts.bold, marginTop: 22, marginBottom: 10 },
  emptyText: { color: colors.muted, fontSize: 12.5, fontFamily: fonts.regular },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    ...shadows.card,
  },
  txDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  txDotPositive: {
    backgroundColor: colors.green,
  },
  txDotNegative: {
    backgroundColor: colors.red,
  },
  txType: { color: colors.text, fontSize: 12.5, fontFamily: fonts.bold },
  txDate: { color: colors.muted, fontSize: 10.5, fontFamily: fonts.regular, marginTop: 2 },
  txAmount: { color: colors.green, fontSize: 13.5, fontFamily: fonts.extraBold },
  txAmountNegative: { color: colors.red },
});

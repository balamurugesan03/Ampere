import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

// Keep in sync with the published web version (privacy-policy.html).
export const PRIVACY_LAST_UPDATED = '18 November 2026';
export const SUPPORT_EMAIL = '[SUPPORT EMAIL]';
export const BUSINESS_ADDRESS = '[BUSINESS ADDRESS]';

type Block = { type: 'p'; text: string } | { type: 'list'; items: [string, string][] } | { type: 'sub'; text: string };

interface Section {
  title: string;
  blocks: Block[];
}

const SECTIONS: Section[] = [
  {
    title: 'Information we collect',
    blocks: [
      { type: 'sub', text: 'Information you give us' },
      {
        type: 'list',
        items: [
          ['Account details', 'Name, email address, mobile number and password (stored only in hashed form).'],
          ['Delivery addresses', 'Contact name, phone number, address line, city, state and PIN code.'],
          ['Orders', 'Products purchased, quantities, prices, coupons, delivery slot, order status and history.'],
          [
            'Payment information',
            'Your chosen method (UPI QR or Cash on Delivery), payment status and any transaction reference. We never collect card numbers, UPI PIN or bank login details.',
          ],
          [
            'Referral & rewards',
            'Referral code, sponsor, team/network details, PV, rank, rewards points, wallet balance, commissions and payout records.',
          ],
          ['Preferences', 'Wishlist, cart contents and notification settings.'],
        ],
      },
      { type: 'sub', text: 'Collected automatically' },
      {
        type: 'list',
        items: [
          ['Technical data', 'IP address, device type and request logs, used for security and troubleshooting.'],
          ['Login token', 'Stored on your device so you stay signed in.'],
        ],
      },
      { type: 'p', text: 'We do not access your contacts, photos, camera, microphone or precise location.' },
    ],
  },
  {
    title: 'How we use your information',
    blocks: [
      {
        type: 'list',
        items: [
          ['Account', 'To create and manage your account and sign you in.'],
          ['Orders', 'To process, deliver and support your orders, including verifying payments.'],
          ['Rewards', 'To calculate PV, ranks, commissions, wallet balances and payouts.'],
          ['Notifications', 'To send order updates, rewards and offers – you can turn these off in Settings.'],
          ['Safety', 'To prevent fraud and misuse, and to meet legal, tax and accounting obligations.'],
        ],
      },
    ],
  },
  {
    title: 'How we share your information',
    blocks: [
      { type: 'p', text: 'We do not sell your personal information. We share it only:' },
      {
        type: 'list',
        items: [
          ['Your network', 'Limited details (name, referral code, rank, PV) may be visible to your sponsor/upline and team.'],
          ['Service providers', 'Hosting, database and delivery partners, only as needed and under confidentiality.'],
          ['Legal reasons', 'When required by law, court order or a government authority.'],
          ['Business transfer', 'If Ampere is merged, acquired or sells its assets.'],
        ],
      },
    ],
  },
  {
    title: 'Data storage & security',
    blocks: [
      {
        type: 'p',
        text: 'Your data is stored on secure servers. Passwords are hashed, the app uses authentication tokens, and admin access is limited to authorised staff. No system is 100% secure, but we take reasonable measures to protect your information.',
      },
    ],
  },
  {
    title: 'Data retention',
    blocks: [
      {
        type: 'p',
        text: 'We keep your information while your account is active. Order, payment, commission and payout records may be kept longer where required for legal, tax or accounting purposes.',
      },
    ],
  },
  {
    title: 'Your rights & choices',
    blocks: [
      {
        type: 'list',
        items: [
          ['Access & correction', 'View and update your profile and addresses in the app.'],
          ['Notifications', 'Turn notifications on or off in Settings.'],
          ['Account deletion', 'Contact us to delete your account and data, except records we must keep by law.'],
          ['Grievances', 'Raise any concern with us under the Digital Personal Data Protection Act, 2023.'],
        ],
      },
    ],
  },
  {
    title: "Children's privacy",
    blocks: [
      {
        type: 'p',
        text: 'Ampere is not intended for anyone under 18. We do not knowingly collect data from children; if you believe a child has shared data with us, contact us and we will delete it.',
      },
    ],
  },
  {
    title: 'Third-party apps',
    blocks: [
      {
        type: 'p',
        text: "When you pay through a UPI app or open external links, that third party's own privacy policy applies.",
      },
    ],
  },
  {
    title: 'Changes to this policy',
    blocks: [
      {
        type: 'p',
        text: 'We may update this policy from time to time. The latest version is always available here, with the "Last updated" date shown above.',
      },
    ],
  },
];

const ShieldIcon = ({ size = 26, color = '#08150c' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M12 3l7 3v5c0 4.5-3 8.4-7 10-4-1.6-7-5.5-7-10V6l7-3z" />
    <Path d="M9 12l2 2 4-4" />
  </Svg>
);

export default function PrivacyPolicyScreen({ navigation }: Props) {
  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Welcome'));

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={goBack} hitSlop={10}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
            <Path d="M15 5l-7 7 7 7" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#123a22', '#0a1e12']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={styles.hero}
        >
          <LinearGradient colors={colors.greenGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroIcon}>
            <ShieldIcon />
          </LinearGradient>
          <Text style={styles.heroTitle}>Your privacy matters</Text>
          <Text style={styles.heroText}>
            How Ampere collects, uses and protects your personal information.
          </Text>
          <View style={styles.updatedPill}>
            <Text style={styles.updatedText}>Last updated: {PRIVACY_LAST_UPDATED}</Text>
          </View>
        </LinearGradient>

        {SECTIONS.map((section, i) => (
          <View key={section.title} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.num}>
                <Text style={styles.numText}>{i + 1}</Text>
              </View>
              <Text style={styles.cardTitle}>{section.title}</Text>
            </View>
            {section.blocks.map((b, j) => {
              if (b.type === 'sub') {
                return (
                  <Text key={j} style={styles.sub}>
                    {b.text}
                  </Text>
                );
              }
              if (b.type === 'p') {
                return (
                  <Text key={j} style={styles.para}>
                    {b.text}
                  </Text>
                );
              }
              return (
                <View key={j} style={styles.list}>
                  {b.items.map(([label, text]) => (
                    <View key={label} style={styles.li}>
                      <View style={styles.dot} />
                      <Text style={styles.liText}>
                        <Text style={styles.liLabel}>{label}: </Text>
                        {text}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ))}

        <View style={[styles.card, styles.contactCard]}>
          <View style={styles.cardHead}>
            <View style={styles.num}>
              <Text style={styles.numText}>{SECTIONS.length + 1}</Text>
            </View>
            <Text style={styles.cardTitle}>Contact us</Text>
          </View>
          <Text style={styles.para}>For questions, data requests or complaints, contact our Grievance / Privacy Officer:</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue} selectable>
              {SUPPORT_EMAIL}
            </Text>
          </View>
          <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.contactLabel}>Address</Text>
            <Text style={styles.contactValue} selectable>
              {BUSINESS_ADDRESS}
            </Text>
          </View>
        </View>

        <Text style={styles.copy}>© 2026 Ampere. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  phone: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: { alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontFamily: fonts.extraBold, color: colors.text },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30, gap: 12 },

  hero: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1c4a2c',
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 4,
    ...shadows.card,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...shadows.buttonGlow,
  },
  heroTitle: { color: colors.text, fontSize: 17, fontFamily: fonts.extraBold },
  heroText: {
    color: '#bfe9cc',
    fontSize: 12.5,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
  },
  updatedPill: {
    marginTop: 12,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(62,207,91,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(62,207,91,0.3)',
  },
  updatedText: { color: colors.green, fontSize: 11, fontFamily: fonts.semiBold },

  card: {
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    ...shadows.card,
  },
  contactCard: { borderColor: '#1c4a2c' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  num: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(62,207,91,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: colors.green, fontSize: 11.5, fontFamily: fonts.bold },
  cardTitle: { flex: 1, color: colors.text, fontSize: 14.5, fontFamily: fonts.bold },
  sub: { color: colors.green, fontSize: 12, fontFamily: fonts.semiBold, marginTop: 6, marginBottom: 2 },
  para: { color: colors.muted, fontSize: 12.5, fontFamily: fonts.regular, lineHeight: 20, marginTop: 4 },
  list: { gap: 8, marginTop: 4 },
  li: { flexDirection: 'row', gap: 10 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green, marginTop: 8 },
  liText: { flex: 1, color: colors.muted, fontSize: 12.5, fontFamily: fonts.regular, lineHeight: 20 },
  liLabel: { color: colors.text, fontFamily: fonts.semiBold },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.settingsBorder,
    marginTop: 4,
  },
  contactLabel: { color: colors.muted, fontSize: 12.5, fontFamily: fonts.medium },
  contactValue: { flex: 1, textAlign: 'right', color: colors.text, fontSize: 12.5, fontFamily: fonts.semiBold },
  copy: { textAlign: 'center', color: '#4d534e', fontSize: 11, fontFamily: fonts.regular, marginTop: 8 },
});

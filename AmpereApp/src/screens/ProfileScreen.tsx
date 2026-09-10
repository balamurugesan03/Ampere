import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const Chevron = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.2}>
    <Path d="M9 6l6 6-6 6" />
  </Svg>
);

interface MenuDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  logout?: boolean;
  onPress?: () => void;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const iconColor = (logout?: boolean) => (logout ? colors.red : colors.text);

  const menuItems: MenuDef[] = [
    {
      key: 'orders',
      label: 'My Orders',
      onPress: () => navigation.navigate('Orders'),
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor()} strokeWidth={1.8}>
          <Rect x={3} y={7} width={18} height={13} rx={2} />
          <Path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        </Svg>
      ),
    },
    {
      key: 'wishlist',
      label: 'My Wishlist',
      onPress: () => navigation.navigate('Wishlist'),
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor()} strokeWidth={1.8}>
          <Path d="M12 21s-7.5-4.6-10-9.1C.5 8 2.4 4.5 6 4a5 5 0 016 2 5 5 0 016-2c3.6.5 5.5 4 4 7.9C19.5 16.4 12 21 12 21z" />
        </Svg>
      ),
    },
    {
      key: 'myTeam',
      label: 'My Team',
      onPress: () => navigation.navigate('MyTeam'),
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor()} strokeWidth={1.8}>
          <Circle cx={9} cy={7} r={3} />
          <Path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
          <Circle cx={18} cy={8} r={2.4} />
          <Path d="M22 21v-1.5a3.5 3.5 0 00-2.5-3.35" />
        </Svg>
      ),
    },
    {
      key: 'myEarnings',
      label: 'My Earnings',
      onPress: () => navigation.navigate('MyEarnings'),
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor()} strokeWidth={1.8}>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M9 15.5s1 1.2 3 1.2 3-.9 3-2c0-3-6-1.5-6-4.4 0-1.1 1-2 3-2s3 1.2 3 1.2" />
          <Path d="M12 6.5v1.2M12 16.7v1.3" />
        </Svg>
      ),
    },
    {
      key: 'addresses',
      label: 'Addresses',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor()} strokeWidth={1.8}>
          <Path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
          <Circle cx={12} cy={10} r={2.5} />
        </Svg>
      ),
    },
    {
      key: 'rewards',
      label: 'Rewards',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor()} strokeWidth={1.8}>
          <Path d="M12 2l2.2 4.7 5.1.7-3.7 3.6.9 5.1L12 13.7l-4.5 2.4.9-5.1-3.7-3.6 5.1-.7z" />
        </Svg>
      ),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor()} strokeWidth={1.8}>
          <Path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9z" />
          <Path d="M13.7 21a2 2 0 01-3.4 0" />
        </Svg>
      ),
    },
    {
      key: 'help',
      label: 'Help & Support',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor()} strokeWidth={1.8}>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2 1.5-2 3.5" />
          <Circle cx={12} cy={16.5} r={0.6} fill={iconColor()} stroke="none" />
        </Svg>
      ),
    },
    {
      key: 'logout',
      label: 'Logout',
      logout: true,
      onPress: async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
      },
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.8}>
          <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <Path d="M16 17l5-5-5-5" />
          <Path d="M21 12H9" />
        </Svg>
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.8}>
              <Path d="M12 12a3 3 0 100-6 3 3 0 000 6z" />
              <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </Svg>
          </Pressable>
        </View>

        <View style={styles.profileRow}>
          <LinearGradient colors={['#3ecf5b', '#1c7a3a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? '')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()}
            </Text>
          </LinearGradient>
          <View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profilePhone}>{user?.phone || user?.email}</Text>
            {!!user?.referralCode && <Text style={styles.profileReferral}>Referral Code: {user.referralCode}</Text>}
            {!!user?.currentRank && <Text style={styles.profileRank}>{user.currentRank}</Text>}
          </View>
        </View>

        <LinearGradient colors={['#123a22', '#0a1e12']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.58 }} style={styles.rewardsCard}>
          <View>
            <Text style={styles.rName}>Ampere Rewards</Text>
            <Text style={styles.rPoints}>{user?.rewardsPoints ?? 0} Points</Text>
          </View>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
            <Path d="M8 4h8v4a4 4 0 01-8 0V4z" fill="#f2c14e" />
            <Path d="M6 5H4a2 2 0 002 4M18 5h2a2 2 0 01-2 4" stroke="#f2c14e" strokeWidth={1.5} fill="none" />
            <Rect x={10} y={15} width={4} height={4} fill="#e0a83e" />
            <Rect x={7} y={19} width={10} height={2.5} rx={1} fill="#f2c14e" />
          </Svg>
        </LinearGradient>

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.menuItem, pressed && item.onPress && styles.pressedFade]}
              onPress={item.onPress}
              disabled={!item.onPress}
            >
              <View style={[styles.menuIcon, item.logout && styles.menuIconLogout]}>{item.icon}</View>
              <Text style={[styles.menuLabel, item.logout && { color: colors.red }]}>{item.label}</Text>
              <Chevron />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="Profile" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  phone: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentInner: {
    paddingTop: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  pressedFade: {
    opacity: 0.7,
  },
  settingsBtn: {
    position: 'absolute',
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 22,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2a332c',
    ...shadows.buttonGlow,
  },
  avatarText: {
    color: '#08150c',
    fontSize: 20,
    fontFamily: fonts.extraBold,
  },
  profileName: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  profilePhone: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  profileReferral: {
    color: colors.green,
    fontSize: 11,
    fontFamily: fonts.semiBold,
    marginTop: 3,
  },
  profileRank: {
    color: colors.muted,
    fontSize: 10.5,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  rewardsCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#1c4a2c',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.card,
  },
  rName: {
    color: '#bfe9cc',
    fontSize: 12.5,
    fontFamily: fonts.bold,
    marginBottom: 3,
  },
  rPoints: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.extraBold,
  },
  menu: {
    marginTop: 18,
    flexDirection: 'column',
    gap: 9,
    paddingBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.fieldAlpha,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconLogout: {
    backgroundColor: 'rgba(229,56,77,0.1)',
  },
  menuLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
});

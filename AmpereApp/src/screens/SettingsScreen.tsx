import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const Chevron = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.2}>
    <Path d="M9 6l6 6-6 6" />
  </Svg>
);

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.toggle, on && styles.toggleOn]} onPress={onPress}>
      <View style={styles.toggleKnob} />
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [biometric, setBiometric] = useState(true);

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Profile')}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.listCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Dark Mode</Text>
              <Toggle on={darkMode} onPress={() => setDarkMode((v) => !v)} />
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Language</Text>
              <View style={styles.rowRight}>
                <Text style={styles.rowRightText}>English</Text>
                <Chevron />
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Toggle
                on={!!user?.notificationsEnabled}
                onPress={() => updateUser({ notificationsEnabled: !user?.notificationsEnabled })}
              />
            </View>

            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.rowLabel}>Biometric Login</Text>
              <Toggle on={biometric} onPress={() => setBiometric((v) => !v)} />
            </View>
          </View>

          <View style={[styles.listCard, { marginTop: 14 }]}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Privacy Policy</Text>
              <Chevron />
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Terms & Conditions</Text>
              <Chevron />
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>About Ampere</Text>
              <Chevron />
            </View>

            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.rowLabel}>Help & Support</Text>
              <Chevron />
            </View>
          </View>
        </ScrollView>

        <Text style={styles.footer}>App Version 1.0.0</Text>
      </View>
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
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontFamily: fonts.extraBold,
    color: colors.text,
  },
  list: {
    marginTop: 20,
  },
  listCard: {
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.settingsBorder,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 13.5,
    fontFamily: fonts.medium,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowRightText: {
    color: colors.muted,
    fontSize: 12.5,
    fontFamily: fonts.regular,
  },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#2a302b',
    justifyContent: 'center',
    padding: 3,
  },
  toggleOn: {
    backgroundColor: colors.green,
    alignItems: 'flex-end',
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    ...shadows.card,
  },
  footer: {
    textAlign: 'center',
    color: '#4d534e',
    fontSize: 11,
    paddingVertical: 20,
    fontFamily: fonts.regular,
  },
});

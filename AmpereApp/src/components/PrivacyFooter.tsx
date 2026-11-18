import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

interface Props {
  onPress: () => void;
  showVersion?: boolean;
}

// Small footer with a "Privacy Policy" pill button, shown at the bottom of screens.
export default function PrivacyFooter({ onPress, showVersion = false }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="link"
        accessibilityLabel="Privacy Policy"
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2.2}>
          <Path d="M12 3l7 3v5c0 4.5-3 8.4-7 10-4-1.6-7-5.5-7-10V6l7-3z" />
          <Path d="M9 12l2 2 4-4" />
        </Svg>
        <Text style={styles.btnText}>Privacy Policy</Text>
      </Pressable>
      {showVersion && <Text style={styles.version}>Ampere · App Version 1.0.0</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 14, gap: 8 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(62,207,91,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(62,207,91,0.25)',
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  btnText: { color: colors.green, fontSize: 12, fontFamily: fonts.semiBold },
  version: { color: '#4d534e', fontSize: 10.5, fontFamily: fonts.regular },
});

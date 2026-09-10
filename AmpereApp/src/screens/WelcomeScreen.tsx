import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/logo-full.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.nextBtnWrap, pressed && styles.pressedScale]}
        onPress={() => navigation.replace('SignIn')}
      >
        <ExpoLinearGradient
          colors={colors.greenGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nextBtn}
        >
          <Text style={styles.nextBtnText}>Next</Text>
        </ExpoLinearGradient>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '80%',
    height: 220,
  },
  nextBtnWrap: {
    borderRadius: 14,
    ...shadows.buttonGlow,
  },
  pressedScale: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  nextBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#08150c',
    fontSize: 16,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.2,
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Ellipse, G, Line, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err: any) {
      if (err?.response) {
        setError(err.response.data?.message || 'Invalid email or password');
      } else {
        setError('Cannot reach server. Check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <View style={styles.backRow}>
        <View style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'‹'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Please sign in to continue</Text>

        <Svg style={styles.illustration} viewBox="0 0 340 175" width="100%" height="140">
          <Defs>
            <LinearGradient id="greenBottle" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#3a7a54" />
              <Stop offset="55%" stopColor="#123423" />
              <Stop offset="100%" stopColor="#081813" />
            </LinearGradient>
            <LinearGradient id="orangeBottle" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#e8974a" />
              <Stop offset="60%" stopColor="#9a5a1e" />
              <Stop offset="100%" stopColor="#5c350f" />
            </LinearGradient>
            <LinearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#4be072" />
              <Stop offset="100%" stopColor="#0f3b1f" />
            </LinearGradient>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#3ecf5b" stopOpacity={0.28} />
              <Stop offset="100%" stopColor="#3ecf5b" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Circle cx={205} cy={80} r={95} fill="url(#glow)" />
          <Ellipse cx={195} cy={150} rx={120} ry={10} fill="#000" opacity={0.4} />

          {/* leaves top right */}
          <Path d="M298 30c14-16 34-18 48-8-6 16-24 26-42 24-5-1-8-9-6-16z" fill="#3ecf5b" opacity={0.9} />
          <Path d="M290 18c8-12 22-16 32-11-1 12-13 22-27 21-3-1-6-6-5-10z" fill="#2ea34a" opacity={0.85} />

          {/* orange bottle, behind-left */}
          <G>
            <Rect x={55} y={85} width={50} height={62} rx={9} fill="url(#orangeBottle)" />
            <Rect x={68} y={70} width={24} height={18} rx={3} fill="#4a2a10" />
            <Rect x={72} y={58} width={16} height={14} rx={2} fill="#2e1a09" />
            <Rect x={61} y={103} width={38} height={26} rx={4} fill="#f6ecd9" opacity={0.92} />
            <Rect x={65} y={109} width={30} height={3} rx={1.5} fill="#c9a877" opacity={0.8} />
            <Rect x={65} y={115} width={22} height={3} rx={1.5} fill="#c9a877" opacity={0.6} />
          </G>

          {/* main green bottle, center */}
          <G>
            <Rect x={140} y={42} width={72} height={112} rx={12} fill="url(#greenBottle)" />
            <Rect x={158} y={24} width={36} height={20} rx={4} fill="#0a1f14" />
            <Rect x={164} y={10} width={24} height={16} rx={2} fill="#06140d" />
            <Circle cx={176} cy={95} r={19} fill="#0c2317" stroke="#3ecf5b" strokeWidth={1.5} opacity={0.9} />
            <Rect x={172} y={86} width={8} height={18} rx={2} fill="#eafff0" />
            <Rect x={167} y={91} width={18} height={8} rx={2} fill="#eafff0" />
            <Rect x={150} y={120} width={52} height={26} rx={4} fill="#dff2e4" opacity={0.14} />
          </G>

          {/* shield, right */}
          <G>
            <Path d="M262 45l28-11 28 11v26c0 23-13 40-28 47-15-7-28-24-28-47V45z" fill="url(#shieldGrad)" />
            <Rect x={284} y={56} width={6} height={24} rx={2} fill="#eafff0" />
            <Rect x={278} y={65} width={18} height={6} rx={2} fill="#eafff0" />
          </G>

          {/* scattered pills bottom */}
          <Ellipse cx={95} cy={150} rx={9} ry={5.5} fill="#f6ecd9" />
          <Ellipse cx={112} cy={158} rx={9} ry={5.5} fill="#e0c9a3" transform="rotate(20 112 158)" />
          <Ellipse cx={225} cy={156} rx={8} ry={5} fill="#f6ecd9" transform="rotate(-10 225 156)" />
          <Ellipse cx={245} cy={148} rx={8} ry={5} fill="#e0c9a3" transform="rotate(15 245 148)" />
          <Circle cx={130} cy={150} r={5} fill="#3ecf5b" opacity={0.85} />
          <Circle cx={260} cy={130} r={4} fill="#3ecf5b" opacity={0.6} />
        </Svg>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.eye} onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.8}>
              <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              <Circle cx={12} cy={12} r={3} />
              {!showPassword && <Line x1={3} y1={21} x2={21} y2={3} stroke={colors.muted} strokeWidth={1.8} />}
            </Svg>
          </Pressable>
        </View>

        <View style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.signinBtnWrap, pressed && styles.pressedScale]}
          onPress={onSubmit}
          disabled={loading}
        >
          <ExpoLinearGradient
            colors={colors.greenGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.signinBtn}
          >
            {loading ? <ActivityIndicator color="#08150c" /> : <Text style={styles.signinBtnText}>Sign In</Text>}
          </ExpoLinearGradient>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socials}>
          <View style={styles.socialBtn}>
            <Svg width={17} height={17} viewBox="0 0 48 48">
              <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
              <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.5 0-14 4.2-17.7 10.7z" />
              <Path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4C29.4 34.7 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.9 39.7 16.4 44 24 44z" />
              <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.5 5.4C39.7 37.1 44 31 44 24c0-1.3-.1-2.7-.4-3.5z" />
            </Svg>
            <Text style={styles.socialBtnText}>Google</Text>
          </View>
          <View style={styles.socialBtn}>
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="#fff">
              <Path d="M16.365 1.43c0 1.14-.42 2.06-1.26 2.86-.9.87-2.02 1.36-3.02 1.28-.13-1.09.44-2.2 1.25-2.98.85-.82 2.16-1.42 3.03-1.16zM20.55 17.16c-.5 1.15-1.09 2.15-1.83 3.15-.86 1.15-1.86 2.57-3.2 2.6-1.19.03-1.55-.76-3.22-.76-1.68 0-2.08.74-3.22.79-1.31.05-2.31-1.24-3.18-2.38-1.9-2.51-3.35-7.1-1.4-10.2 1-1.55 2.61-2.55 4.29-2.58 1.24-.02 2.36.83 3.16.83.79 0 2.24-1.03 3.77-.88.64.03 2.46.26 3.63 1.94-.09.06-2.17 1.27-2.15 3.79.03 3.02 2.64 4.02 2.65 4.7z" />
            </Svg>
            <Text style={styles.socialBtnText}>Apple</Text>
          </View>
          <View style={styles.socialBtn}>
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="#3ecf5b">
              <Path d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.6c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.7.1.3 0 .7-.2 1L6.6 10.8z" />
            </Svg>
            <Text style={styles.socialBtnText}>Phone</Text>
          </View>
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>
            Don't have an account?{' '}
            <Text style={styles.signupLink} onPress={() => navigation.navigate('SignUp')}>
              Sign Up
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  phone: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#fff',
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 14,
  },
  title: {
    fontSize: 25,
    fontFamily: fonts.extraBold,
    marginTop: 10,
    marginBottom: 5,
    color: colors.text,
    letterSpacing: 0.1,
  },
  subtitle: {
    marginBottom: 4,
    color: colors.muted,
    fontSize: 13.5,
    fontFamily: fonts.regular,
  },
  errorText: {
    color: colors.red,
    fontSize: 12.5,
    fontFamily: fonts.medium,
    marginTop: 8,
  },
  illustration: {
    marginTop: 2,
    marginBottom: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    marginTop: 10,
    marginBottom: 6,
  },
  field: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.regular,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    ...shadows.card,
  },
  eye: {
    position: 'absolute',
    right: 14,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    color: colors.green,
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  signinBtnWrap: {
    marginTop: 14,
    borderRadius: 14,
    ...shadows.buttonGlow,
  },
  pressedScale: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  signinBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signinBtnText: {
    color: '#08150c',
    fontSize: 16,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.muted,
    fontSize: 12.5,
    fontFamily: fonts.regular,
  },
  socials: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 6,
    ...shadows.card,
  },
  socialBtnText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  signupRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 13.5,
    color: colors.muted,
    fontFamily: fonts.regular,
  },
  signupLink: {
    color: colors.green,
    fontFamily: fonts.bold,
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useAuth } from '../context/AuthContext';
import { useValidateReferralCode } from '../api/hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: referralCheck, isFetching: checkingReferral } = useValidateReferralCode(referralCode);

  const onSubmit = async () => {
    if (!name || !email || !password || !referralCode) {
      setError('Name, email, password and a valid referral code are required');
      return;
    }
    if (referralCheck && !referralCheck.valid) {
      setError('Please enter a valid referral code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password, referralCode.trim().toUpperCase(), phone);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err: any) {
      if (err?.response) {
        setError(err.response.data?.message || 'Could not create account. Please try again.');
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
        <Pressable style={styles.backBtn} onPress={() => navigation.navigate('SignIn')}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
            <Path d="M15 5l-7 7 7 7" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to start shopping with Ampere</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>Full Name</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={setName}
          />
        </View>

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

        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <Text style={styles.label}>Referral Code</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Enter sponsor's referral code"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="characters"
            value={referralCode}
            onChangeText={setReferralCode}
          />
        </View>
        {checkingReferral && <Text style={styles.referralHint}>Checking code...</Text>}
        {!checkingReferral && referralCheck?.valid && (
          <Text style={styles.referralHintValid}>Sponsor: {referralCheck.sponsorName}</Text>
        )}
        {!checkingReferral && referralCheck && !referralCheck.valid && (
          <Text style={styles.referralHintInvalid}>Invalid referral code</Text>
        )}

        <Text style={styles.label}>Password</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
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

        <Pressable
          style={({ pressed }) => [styles.signinBtnWrap, pressed && styles.pressedScale]}
          onPress={onSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={colors.greenGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.signinBtn}
          >
            {loading ? <ActivityIndicator color="#08150c" /> : <Text style={styles.signinBtnText}>Sign Up</Text>}
          </LinearGradient>
        </Pressable>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>
            Already have an account?{' '}
            <Text style={styles.signupLink} onPress={() => navigation.navigate('SignIn')}>
              Sign In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  phone: { flex: 1, backgroundColor: colors.bg },
  backRow: { paddingHorizontal: 20, paddingTop: 8 },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 24 },
  contentInner: { paddingTop: 10, paddingBottom: 24 },
  title: {
    fontSize: 25,
    fontFamily: fonts.extraBold,
    marginBottom: 5,
    color: colors.text,
  },
  subtitle: {
    marginBottom: 16,
    color: colors.muted,
    fontSize: 13.5,
    fontFamily: fonts.regular,
  },
  error: {
    color: colors.red,
    fontSize: 12.5,
    fontFamily: fonts.medium,
    marginBottom: 10,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    marginTop: 10,
    marginBottom: 6,
  },
  field: { position: 'relative', justifyContent: 'center' },
  eye: { position: 'absolute', right: 14 },
  referralHint: {
    color: colors.muted,
    fontSize: 11.5,
    fontFamily: fonts.regular,
    marginTop: 6,
  },
  referralHintValid: {
    color: colors.green,
    fontSize: 11.5,
    fontFamily: fonts.medium,
    marginTop: 6,
  },
  referralHintInvalid: {
    color: colors.red,
    fontSize: 11.5,
    fontFamily: fonts.medium,
    marginTop: 6,
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
  signinBtnWrap: {
    marginTop: 20,
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
  signupRow: { alignItems: 'center', marginTop: 16 },
  signupText: { fontSize: 13.5, color: colors.muted, fontFamily: fonts.regular },
  signupLink: { color: colors.green, fontFamily: fonts.bold },
});

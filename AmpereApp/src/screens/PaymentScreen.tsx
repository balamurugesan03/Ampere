import React, { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useCart, useCreateOrder, usePaymentSettings } from '../api/hooks';
import { resolveMediaUrl } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;
type PaymentMethod = 'UPI_QR' | 'COD';

export default function PaymentScreen({ navigation, route }: Props) {
  const { addressId, deliverySlot } = route.params;
  const { data: cart = [] } = useCart();
  const { data: paymentSettings } = usePaymentSettings();
  const createOrder = useCreateOrder();
  const [method, setMethod] = useState<PaymentMethod>('UPI_QR');

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = subtotal >= 1000 ? 0 : subtotal > 0 ? 40 : 0;
  const total = subtotal + deliveryCharge;
  const qrImageUri = resolveMediaUrl(paymentSettings?.qrImageUrl);

  const placeOrder = async () => {
    await createOrder.mutateAsync({ addressId, deliverySlot, paymentMethod: method });
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Checkout')}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>Payment</Text>
        </View>

        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepNum, styles.stepNumDone]}>
              <Text style={styles.stepNumDoneText}>{'✓'}</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelDone]}>Address</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepNum, styles.stepNumDone]}>
              <Text style={styles.stepNumDoneText}>{'✓'}</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelDone]}>Delivery</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepNum, styles.stepNumActive]}>
              <Text style={styles.stepNumActiveText}>3</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Payment</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Methods</Text>

          <Pressable
            style={({ pressed }) => [styles.payOption, styles.payOptionFirst, pressed && styles.pressedFade]}
            onPress={() => setMethod('UPI_QR')}
          >
            <View style={[styles.radio, method === 'UPI_QR' && styles.radioChecked]}>
              {method === 'UPI_QR' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.payInfo}>
              <Text style={styles.payName}>UPI (Scan QR)</Text>
              <Text style={styles.paySub}>Pay using any UPI app, we confirm manually</Text>
            </View>
            <View style={styles.payLogo}>
              <Svg width={34} height={16} viewBox="0 0 34 16">
                <SvgText x={0} y={12} fontFamily="Poppins_800ExtraBold" fontSize={12} fontWeight="800" fill="#f2994a">
                  UPI
                </SvgText>
              </Svg>
            </View>
          </Pressable>

          {method === 'UPI_QR' && (
            <View style={styles.qrBox}>
              {qrImageUri ? (
                <Image source={{ uri: qrImageUri }} style={styles.qrImage} resizeMode="contain" />
              ) : (
                <Text style={styles.qrPending}>QR code not set up yet — contact support</Text>
              )}
              {!!paymentSettings?.upiId && <Text style={styles.qrUpiId}>{paymentSettings.upiId}</Text>}
              {!!paymentSettings?.payeeName && <Text style={styles.qrPayee}>{paymentSettings.payeeName}</Text>}
            </View>
          )}

          <View style={[styles.payOption, styles.payOptionDisabled]}>
            <View style={styles.radio} />
            <View style={styles.payInfo}>
              <Text style={styles.payName}>Credit / Debit Card</Text>
              <Text style={styles.paySub}>Coming soon</Text>
            </View>
            <View style={styles.payLogo}>
              <Svg width={22} height={16} viewBox="0 0 22 16">
                <Circle cx={7} cy={8} r={6} fill="#eb001b" opacity={0.9} />
                <Circle cx={14} cy={8} r={6} fill="#f79e1b" opacity={0.8} />
              </Svg>
              <Svg width={26} height={14} viewBox="0 0 26 14">
                <SvgText x={0} y={11} fontFamily="Poppins_800ExtraBold" fontSize={11} fontWeight="800" fontStyle="italic" fill="#2a5ada">
                  VISA
                </SvgText>
              </Svg>
            </View>
          </View>

          <View style={[styles.payOption, styles.payOptionDisabled]}>
            <View style={styles.radio} />
            <View style={styles.payInfo}>
              <Text style={styles.payName}>Wallets</Text>
              <Text style={styles.paySub}>Coming soon</Text>
            </View>
            <View style={styles.payLogo}>
              <Svg width={20} height={18} viewBox="0 0 20 18">
                <Rect x={1} y={4} width={18} height={12} rx={3} fill="#2f8fd6" />
                <Circle cx={15} cy={10} r={2} fill="#fff" />
              </Svg>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.payOption, styles.payOptionLast, pressed && styles.pressedFade]}
            onPress={() => setMethod('COD')}
          >
            <View style={[styles.radio, method === 'COD' && styles.radioChecked]}>
              {method === 'COD' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.payInfo}>
              <Text style={styles.payName}>Cash on Delivery</Text>
              <Text style={styles.paySub}>Pay when you receive</Text>
            </View>
            <View style={styles.payLogo}>
              <Svg width={22} height={16} viewBox="0 0 22 16">
                <Rect x={1} y={2} width={20} height={12} rx={2} fill="#3ecf5b" />
                <Circle cx={11} cy={8} r={3.2} fill="#0c2a17" />
              </Svg>
            </View>
          </Pressable>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalCardLabel}>Total Amount</Text>
          <Text style={styles.totalCardAmount}>{'₹'}{total}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.placeBtnWrap, pressed && styles.pressedScale]}
          onPress={placeOrder}
          disabled={createOrder.isPending || cart.length === 0}
        >
          <LinearGradient
            colors={colors.greenGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.placeBtn}
          >
            {createOrder.isPending ? (
              <ActivityIndicator color="#08150c" />
            ) : (
              <>
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#08150c" strokeWidth={2.2}>
                  <Rect x={4} y={11} width={16} height={9} rx={2} />
                  <Path d="M8 11V7a4 4 0 018 0v4" />
                </Svg>
                <Text style={styles.placeBtnText}>Place Order</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <View style={styles.secureNote}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill={colors.green}>
            <Path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
          </Svg>
          <Text style={styles.secureNoteText}>
            {method === 'UPI_QR' ? 'Payment confirmed manually after we verify your transfer' : 'Your payment is 100% secure'}
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
    gap: 14,
    marginTop: 8,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.extraBold,
    color: colors.text,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumActive: {
    backgroundColor: colors.green,
  },
  stepNumActiveText: {
    color: '#08150c',
    fontSize: 10.5,
    fontFamily: fonts.extraBold,
  },
  stepNumDone: {
    backgroundColor: colors.green,
  },
  stepNumDoneText: {
    color: '#08150c',
    fontSize: 10.5,
    fontFamily: fonts.extraBold,
  },
  stepLabel: {
    fontSize: 11.5,
    fontFamily: fonts.semiBold,
  },
  stepLabelActive: {
    color: colors.green,
  },
  stepLabelDone: {
    color: colors.muted,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  pressedFade: {
    opacity: 0.75,
  },
  pressedScale: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  card: {
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  payOptionFirst: {
    paddingTop: 2,
  },
  payOptionLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  payOptionDisabled: {
    opacity: 0.4,
  },
  qrBox: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  qrImage: {
    width: 160,
    height: 160,
    borderRadius: 10,
    backgroundColor: '#fff',
    ...shadows.card,
  },
  qrPending: {
    color: colors.muted,
    fontSize: 11.5,
    fontFamily: fonts.regular,
    textAlign: 'center',
    paddingVertical: 20,
  },
  qrUpiId: {
    color: colors.text,
    fontSize: 12.5,
    fontFamily: fonts.bold,
    marginTop: 8,
  },
  qrPayee: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: '#454d47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChecked: {
    borderColor: colors.green,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  payInfo: {
    flex: 1,
  },
  payName: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    marginBottom: 2,
  },
  paySub: {
    color: colors.muted,
    fontSize: 10.5,
    fontFamily: fonts.regular,
  },
  payLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    ...shadows.card,
  },
  totalCardLabel: {
    color: colors.muted,
    fontSize: 12.5,
    fontFamily: fonts.regular,
  },
  totalCardAmount: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.extraBold,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: colors.bg,
  },
  placeBtnWrap: {
    width: '100%',
    borderRadius: 16,
    ...shadows.buttonGlow,
  },
  placeBtn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeBtnText: {
    color: '#08150c',
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingBottom: 6,
  },
  secureNoteText: {
    color: colors.muted,
    fontSize: 10.5,
    fontFamily: fonts.regular,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useAddAddress, useAddresses, useCart } from '../api/hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const DELIVERY_CHARGE = 40;
const FREE_DELIVERY_THRESHOLD = 1000;
const SLOTS = [
  { day: 'Tomorrow, 10 May', time: '9:00 AM - 1:00 PM' },
  { day: 'Sunday, 11 May', time: '9:00 AM - 1:00 PM' },
];

export default function CheckoutScreen({ navigation }: Props) {
  const { data: cart = [] } = useCart();
  const { data: addresses = [], isLoading: loadingAddresses } = useAddresses();
  const addAddress = useAddAddress();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slotIndex, setSlotIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ contactName: '', phone: '', line: '', city: '', state: '', pincode: '' });

  useEffect(() => {
    if (selectedIndex >= addresses.length) setSelectedIndex(0);
  }, [addresses.length, selectedIndex]);

  const selectedAddress = addresses[selectedIndex];
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = subtotal + deliveryCharge;

  const submitAddress = async () => {
    if (!form.contactName || !form.phone || !form.line || !form.city || !form.state || !form.pincode) return;
    await addAddress.mutateAsync({ ...form, label: 'Home', isDefault: addresses.length === 0 });
    setForm({ contactName: '', phone: '', line: '', city: '', state: '', pincode: '' });
    setShowAddForm(false);
  };

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Cart')}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepNum, styles.stepNumActive]}>
              <Text style={styles.stepNumActiveText}>1</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Address</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepNum, styles.stepNumInactive]}>
              <Text style={styles.stepNumInactiveText}>2</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelInactive]}>Delivery</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepNum, styles.stepNumInactive]}>
              <Text style={styles.stepNumInactiveText}>3</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelInactive]}>Payment</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardHeadTitle}>Delivery Address</Text>
            {addresses.length > 1 && (
              <Pressable onPress={() => setSelectedIndex((i) => (i + 1) % addresses.length)}>
                <Text style={styles.cardHeadLink}>Change</Text>
              </Pressable>
            )}
          </View>

          {loadingAddresses ? (
            <ActivityIndicator color={colors.green} />
          ) : selectedAddress ? (
            <View style={styles.addrRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2} style={styles.addrIcon}>
                <Path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
                <Circle cx={12} cy={10} r={2.5} />
              </Svg>
              <View style={{ flex: 1 }}>
                <Text style={styles.addrName}>{selectedAddress.contactName}</Text>
                <Text style={styles.addrText}>
                  {selectedAddress.line}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                </Text>
              </View>
            </View>
          ) : showAddForm ? (
            <View style={{ gap: 8 }}>
              <TextInput
                style={styles.addrInput}
                placeholder="Full name"
                placeholderTextColor={colors.placeholder}
                value={form.contactName}
                onChangeText={(v) => setForm((f) => ({ ...f, contactName: v }))}
              />
              <TextInput
                style={styles.addrInput}
                placeholder="Phone number"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              <TextInput
                style={styles.addrInput}
                placeholder="Address line"
                placeholderTextColor={colors.placeholder}
                value={form.line}
                onChangeText={(v) => setForm((f) => ({ ...f, line: v }))}
              />
              <TextInput
                style={styles.addrInput}
                placeholder="City"
                placeholderTextColor={colors.placeholder}
                value={form.city}
                onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
              />
              <TextInput
                style={styles.addrInput}
                placeholder="State"
                placeholderTextColor={colors.placeholder}
                value={form.state}
                onChangeText={(v) => setForm((f) => ({ ...f, state: v }))}
              />
              <TextInput
                style={styles.addrInput}
                placeholder="Pincode"
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
                value={form.pincode}
                onChangeText={(v) => setForm((f) => ({ ...f, pincode: v }))}
              />
              <Pressable
                style={({ pressed }) => [styles.saveAddrBtn, pressed && styles.pressedScale]}
                onPress={submitAddress}
                disabled={addAddress.isPending}
              >
                <Text style={styles.saveAddrBtnText}>{addAddress.isPending ? 'Saving...' : 'Save Address'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setShowAddForm(true)}>
              <Text style={styles.addrText}>No saved address yet. Tap to add one.</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionTitle}>Delivery Slot</Text>

        {SLOTS.map((slot, index) => (
          <Pressable
            key={slot.day}
            style={({ pressed }) => [
              styles.slotOption,
              slotIndex === index && styles.slotOptionSelected,
              pressed && styles.pressedFade,
            ]}
            onPress={() => setSlotIndex(index)}
          >
            <View>
              <Text style={styles.slotDay}>{slot.day}</Text>
              <Text style={styles.slotTime}>{slot.time}</Text>
            </View>
            <View style={[styles.radio, slotIndex === index && styles.radioChecked]}>
              {slotIndex === index && <View style={styles.radioDot} />}
            </View>
          </Pressable>
        ))}

        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Order Summary</Text>
        <View style={[styles.card, { marginTop: 10 }]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({cart.length})</Text>
            <Text style={styles.summaryValue}>{'₹'}{subtotal}</Text>
          </View>
          <View style={[styles.summaryRow, { marginBottom: 0 }]}>
            <Text style={styles.summaryLabel}>Delivery Charges</Text>
            <Text style={styles.summaryValue}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{'₹'}{total}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [
            styles.payBtnWrap,
            !selectedAddress && styles.payBtnDisabled,
            pressed && styles.pressedScale,
          ]}
          disabled={!selectedAddress}
          onPress={() =>
            selectedAddress &&
            navigation.navigate('Payment', {
              addressId: selectedAddress._id,
              deliverySlot: `${SLOTS[slotIndex].day}, ${SLOTS[slotIndex].time}`,
            })
          }
        >
          <LinearGradient
            colors={colors.greenGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.payBtn}
          >
            <Text style={styles.payBtnText}>Continue to Payment</Text>
          </LinearGradient>
        </Pressable>
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
  stepNumInactive: {
    backgroundColor: colors.fieldAlpha,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNumInactiveText: {
    color: colors.muted,
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
  stepLabelInactive: {
    color: colors.muted,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
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
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeadTitle: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  cardHeadLink: {
    color: colors.green,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  addrRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addrIcon: {
    marginTop: 3,
  },
  addrName: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  addrText: {
    color: colors.muted,
    fontSize: 11.5,
    lineHeight: 17.25,
    fontFamily: fonts.regular,
  },
  addrInput: {
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.regular,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    ...shadows.card,
  },
  pressedScale: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  pressedFade: {
    opacity: 0.75,
  },
  saveAddrBtn: {
    backgroundColor: colors.green,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
    ...shadows.buttonGlow,
  },
  saveAddrBtnText: {
    color: '#08150c',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 18,
    marginBottom: 10,
  },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...shadows.card,
  },
  slotOptionSelected: {
    borderColor: colors.green,
    backgroundColor: 'rgba(62,207,91,0.06)',
  },
  slotDay: {
    color: colors.text,
    fontSize: 12.5,
    fontFamily: fonts.bold,
    marginBottom: 3,
  },
  slotTime: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  summaryLabel: {
    fontSize: 12.5,
    color: colors.muted,
    fontFamily: fonts.regular,
  },
  summaryValue: {
    fontSize: 12.5,
    color: colors.text,
    fontFamily: fonts.semiBold,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 9,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: fonts.extraBold,
    color: colors.text,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: fonts.extraBold,
    color: colors.green,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: colors.bg,
  },
  payBtnWrap: {
    width: '100%',
    borderRadius: 16,
    ...shadows.buttonGlow,
  },
  payBtn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    color: '#08150c',
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
  payBtnDisabled: {
    opacity: 0.5,
  },
});

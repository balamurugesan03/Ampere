import React from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../api/hooks';
import { resolveMediaUrl } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

const DELIVERY_CHARGE = 40;
const FREE_DELIVERY_THRESHOLD = 1000;

export default function CartScreen({ navigation }: Props) {
  const { data: cart = [] } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = cart.length === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = subtotal + deliveryCharge;
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const changeQty = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem.mutate(productId);
    } else {
      updateItem.mutate({ productId, quantity });
    }
  };

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
                <Path d="M15 5l-7 7 7 7" />
              </Svg>
            </Pressable>
            <Text style={styles.headerTitle}>My Cart ({cart.length})</Text>
          </View>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your cart is empty.</Text>
            <Pressable
              style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressedScale]}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.emptyBtnText}>Continue Shopping</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {cart.map((item) => {
              const imageUri = resolveMediaUrl(item.product.images?.[0]);
              return (
                <View style={styles.itemCard} key={item.product._id}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.itemImg} />
                  ) : (
                    <View style={[styles.itemImg, styles.itemImgPlaceholder]} />
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product.name}</Text>
                    <Text style={styles.itemSub}>{item.product.subtitle}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemPrice}>{'₹'}{item.product.price}</Text>
                    <View style={styles.qtyStepper}>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => changeQty(item.product._id, item.quantity - 1)}
                      >
                        <Text style={styles.qtyBtnText}>{'−'}</Text>
                      </Pressable>
                      <Text style={styles.qtyValue}>{item.quantity}</Text>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => changeQty(item.product._id, item.quantity + 1)}
                      >
                        <Text style={styles.qtyBtnText}>{'+'}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}

            {remainingForFreeDelivery > 0 && (
              <View style={styles.promoBanner}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2}>
                  <Rect x={1} y={7} width={14} height={9} rx={1.5} />
                  <Path d="M15 10h4l3 3v3h-7z" />
                  <Circle cx={6} cy={18} r={1.8} />
                  <Circle cx={17} cy={18} r={1.8} />
                </Svg>
                <Text style={styles.promoText}>
                  Add {'₹'}{remainingForFreeDelivery} more to get FREE delivery
                </Text>
              </View>
            )}
          </>
        )}

        <View style={styles.couponRow}>
          <View style={styles.couponLeft}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={1.8}>
              <Path d="M20 12l-8 8-9-9V4h7z" />
              <Circle cx={7.5} cy={7.5} r={1.2} fill={colors.green} stroke="none" />
            </Svg>
            <Text style={styles.couponText}>Apply Coupon</Text>
          </View>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2.2}>
            <Path d="M9 6l6 6-6 6" />
          </Svg>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
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

      {cart.length > 0 && (
        <View style={styles.bottomBar}>
          <Pressable
            style={({ pressed }) => [styles.checkoutBtnWrap, pressed && styles.pressedScale]}
            onPress={() => navigation.navigate('Checkout')}
          >
            <LinearGradient
              colors={colors.greenGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkoutBtn}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
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
    justifyContent: 'space-between',
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.extraBold,
    color: colors.text,
  },
  editLink: {
    color: colors.green,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    ...shadows.card,
  },
  itemImg: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  itemImgPlaceholder: {
    backgroundColor: colors.fieldAlpha,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  pressedScale: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  emptyBtn: {
    backgroundColor: colors.green,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    ...shadows.buttonGlow,
  },
  emptyBtnText: {
    color: '#08150c',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2,
  },
  itemName: {
    color: colors.text,
    fontSize: 12.5,
    fontFamily: fonts.bold,
  },
  itemSub: {
    color: colors.muted,
    fontSize: 10.5,
    fontFamily: fonts.regular,
  },
  itemRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  itemPrice: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.extraBold,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(62,207,91,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(62,207,91,0.35)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  qtyBtn: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: colors.green,
    fontSize: 13,
    fontFamily: fonts.extraBold,
  },
  qtyValue: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(62,207,91,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(62,207,91,0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  promoText: {
    color: '#bfe9cc',
    fontSize: 11.5,
    fontFamily: fonts.semiBold,
    flexShrink: 1,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 8,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponText: {
    color: colors.text,
    fontSize: 12.5,
    fontFamily: fonts.semiBold,
  },
  summary: {
    marginTop: 14,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    ...shadows.card,
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
    marginTop: 6,
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: colors.bg,
  },
  checkoutBtnWrap: {
    width: '100%',
    borderRadius: 14,
    ...shadows.buttonGlow,
  },
  checkoutBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#08150c',
    fontSize: 14.5,
    fontFamily: fonts.bold,
  },
});

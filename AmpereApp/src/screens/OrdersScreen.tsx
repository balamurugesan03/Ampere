import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useOrders } from '../api/hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersScreen({ navigation }: Props) {
  const { data: orders = [], isLoading } = useOrders();

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Profile')}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.green} style={{ marginTop: 30 }} />
        ) : orders.length === 0 ? (
          <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
        ) : (
          orders.map((order) => (
            <View style={styles.orderCard} key={order._id}>
              <View style={styles.orderHead}>
                <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.orderStatus}>{STATUS_LABEL[order.orderStatus] ?? order.orderStatus}</Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
              {order.items.map((item) => (
                <Text style={styles.orderItem} key={item.product}>
                  {item.name} × {item.qty}
                </Text>
              ))}
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>{'₹'}{order.total}</Text>
                <View
                  style={[
                    styles.paymentPill,
                    order.paymentStatus === 'paid' ? styles.paymentPillPaid : styles.paymentPillPending,
                  ]}
                >
                  <Text style={styles.orderPayment}>
                    {order.paymentMethod === 'UPI_QR' ? 'UPI' : 'COD'} ·{' '}
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  phone: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: 20 },
  contentInner: { paddingTop: 6, paddingBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 6 },
  backBtn: { alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.text },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 40,
  },
  orderCard: {
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    gap: 4,
    ...shadows.card,
  },
  orderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: colors.text, fontSize: 13, fontFamily: fonts.bold },
  statusPill: {
    backgroundColor: colors.glowGreen,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  orderStatus: { color: colors.green, fontSize: 10.5, fontFamily: fonts.bold },
  orderDate: { color: colors.muted, fontSize: 11, fontFamily: fonts.regular, marginBottom: 6 },
  orderItem: { color: colors.text, fontSize: 12, fontFamily: fonts.regular },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderTotal: { color: colors.text, fontSize: 14, fontFamily: fonts.extraBold },
  paymentPill: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  paymentPillPaid: {
    backgroundColor: colors.glowGreen,
  },
  paymentPillPending: {
    backgroundColor: 'rgba(242,193,78,0.18)',
  },
  orderPayment: { color: colors.muted, fontSize: 10.5, fontFamily: fonts.medium },
});

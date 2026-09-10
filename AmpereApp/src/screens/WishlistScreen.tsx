import React from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import BottomNav from '../components/BottomNav';
import { useAddToCart, useRemoveFromWishlist, useWishlist } from '../api/hooks';
import { resolveMediaUrl } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Wishlist'>;

export default function WishlistScreen({ navigation }: Props) {
  const { data: wishlist = [], isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.green} style={{ marginTop: 30 }} />
        ) : wishlist.length === 0 ? (
          <Text style={styles.emptyText}>Your wishlist is empty.</Text>
        ) : (
          wishlist.map((product) => {
            const imageUri = resolveMediaUrl(product.images?.[0]);
            return (
              <View style={styles.itemCard} key={product._id}>
                <Pressable
                  style={styles.itemMain}
                  onPress={() => navigation.navigate('Product', { productId: product._id })}
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.itemImg} />
                  ) : (
                    <View style={[styles.itemImg, styles.itemImgPlaceholder]} />
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{product.name}</Text>
                    <Text style={styles.itemSub}>{product.subtitle}</Text>
                    <Text style={styles.itemPrice}>{'₹'}{product.price}</Text>
                  </View>
                </Pressable>
                <View style={styles.itemActions}>
                  <Pressable
                    style={({ pressed }) => [styles.addCartBtn, pressed && styles.pressedFade]}
                    onPress={() => addToCart.mutate({ productId: product._id })}
                  >
                    <Text style={styles.addCartBtnText}>Add to Cart</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => pressed && styles.pressedFade}
                    onPress={() => removeFromWishlist.mutate(product._id)}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={2}>
                      <Path d="M18 6L6 18M6 6l12 12" />
                    </Svg>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <BottomNav active="Wishlist" navigation={navigation} />
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
  pressedFade: {
    opacity: 0.7,
  },
  itemCard: {
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    gap: 10,
    ...shadows.card,
  },
  itemMain: { flexDirection: 'row', gap: 12 },
  itemImg: { width: 56, height: 56, borderRadius: 10 },
  itemImgPlaceholder: { backgroundColor: colors.fieldAlpha },
  itemInfo: { flex: 1, justifyContent: 'center', gap: 2 },
  itemName: { color: colors.text, fontSize: 12.5, fontFamily: fonts.bold },
  itemSub: { color: colors.muted, fontSize: 10.5, fontFamily: fonts.regular },
  itemPrice: { color: colors.green, fontSize: 13, fontFamily: fonts.extraBold, marginTop: 2 },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  addCartBtn: {
    flex: 1,
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: colors.green,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 8,
  },
  addCartBtnText: { color: colors.green, fontSize: 12, fontFamily: fonts.extraBold },
});

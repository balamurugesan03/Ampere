import React from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Ellipse, G, Line, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useProduct, useAddToCart } from '../api/hooks';
import { resolveMediaUrl } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Product'>;

export default function ProductScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const { data: product, isLoading } = useProduct(productId);
  const addToCart = useAddToCart();

  const handleAddToCart = async () => {
    await addToCart.mutateAsync({ productId });
  };

  if (isLoading || !product) {
    return (
      <SafeAreaView style={[styles.phone, styles.loadingWrap]} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.green} />
      </SafeAreaView>
    );
  }

  const imageUri = resolveMediaUrl(product.images?.[0]);

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Home')}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <View style={styles.headerRight}>
            <View style={styles.iconBtn}>
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
                <Path d="M12 21s-7.5-4.6-10-9.1C.5 8 2.4 4.5 6 4a5 5 0 016 2 5 5 0 016-2c3.6.5 5.5 4 4 7.9C19.5 16.4 12 21 12 21z" />
              </Svg>
            </View>
            <View style={styles.iconBtn}>
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
                <Circle cx={6} cy={12} r={2.5} />
                <Circle cx={18} cy={6} r={2.5} />
                <Circle cx={18} cy={18} r={2.5} />
                <Line x1={8.2} y1={10.8} x2={15.8} y2={7.2} stroke="#fff" strokeWidth={1.8} />
                <Line x1={8.2} y1={13.2} x2={15.8} y2={16.8} stroke="#fff" strokeWidth={1.8} />
              </Svg>
            </View>
          </View>
        </View>

        <View style={styles.hero}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="contain" />
          ) : (
          <Svg width={170} height={185} viewBox="0 0 170 185">
            <Defs>
              <LinearGradient id="pbottle" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#2f8a55" />
                <Stop offset="45%" stopColor="#0f3a24" />
                <Stop offset="100%" stopColor="#061c12" />
              </LinearGradient>
              <LinearGradient id="pcap" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#1c4a30" />
                <Stop offset="100%" stopColor="#0a2416" />
              </LinearGradient>
              <RadialGradient id="heroGlow" cx="50%" cy="45%" r="55%">
                <Stop offset="0%" stopColor="#2f8a55" stopOpacity={0.35} />
                <Stop offset="100%" stopColor="#2f8a55" stopOpacity={0} />
              </RadialGradient>
            </Defs>

            <Circle cx={85} cy={90} r={80} fill="url(#heroGlow)" />
            <Ellipse cx={85} cy={172} rx={60} ry={8} fill="#000" opacity={0.4} />

            {/* twisted roots bottom-left */}
            <G stroke="#b98a55" strokeWidth={8} strokeLinecap="round">
              <Path d="M8 148c10-6 18-4 26-10" fill="none" />
              <Path d="M6 162c14-4 24-2 34-10" fill="none" />
              <Path d="M14 172c12-2 20 0 28-6" fill="none" />
            </G>
            <G stroke="#8a6538" strokeWidth={2.5} fill="none" opacity={0.6}>
              <Path d="M8 148c10-6 18-4 26-10" />
              <Path d="M6 162c14-4 24-2 34-10" />
            </G>

            {/* leaves right, behind bottle */}
            <Path d="M120 118c16-2 28 8 32 22-14 4-28-2-34-14-2-4-1-7 2-8z" fill="#3ecf5b" />
            <Path d="M110 130c12 0 20 8 22 18-10 2-20-2-24-12-1-3 0-5 2-6z" fill="#4caf6d" opacity={0.9} />

            {/* bottle body */}
            <Rect x={48} y={38} width={74} height={118} rx={12} fill="url(#pbottle)" />

            {/* neck + cap */}
            <Rect x={63} y={20} width={44} height={20} rx={4} fill="url(#pcap)" />
            <Rect x={68} y={6} width={34} height={16} rx={3} fill="#082014" />
            <Rect x={63} y={38} width={44} height={5} fill="#050f0a" opacity={0.5} />

            {/* label */}
            <Rect x={55} y={63} width={60} height={66} rx={5} fill="#f5f2e8" />
            <Rect x={55} y={63} width={60} height={16} rx={5} fill="#c0392b" />
            <Rect x={61} y={69} width={30} height={6} rx={1.5} fill="#f5f2e8" opacity={0.9} />
            <Rect x={60} y={85} width={48} height={8} rx={1.5} fill="#245c33" />
            <Rect x={60} y={97} width={40} height={4.5} rx={1} fill="#9a9a8e" />
            <Rect x={60} y={105} width={34} height={4.5} rx={1} fill="#9a9a8e" />
            <Rect x={60} y={117} width={30} height={4} rx={1} fill="#b8b8ac" />
          </Svg>
          )}
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>1/{Math.max(product.images?.length ?? 0, 1)}</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productSub}>{product.subtitle}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingScore}>{product.rating.toFixed(1)}</Text>
            <Text style={styles.ratingStars}>{'★★★★★'}</Text>
            <Text style={styles.ratingCount}>({product.numReviews.toLocaleString()} reviews)</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceNow}>{'₹'}{product.price}</Text>
            {product.mrp > product.price && <Text style={styles.priceOld}>{'₹'}{product.mrp}</Text>}
            {product.discountPercent > 0 && (
              <Text style={styles.priceOff}>{product.discountPercent}% OFF</Text>
            )}
          </View>
          <Text style={styles.desc}>{product.description}</Text>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.8}>
                <Path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
              </Svg>
              <Text style={styles.trustText}>100% Original</Text>
            </View>
            <View style={styles.trustItem}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.8}>
                <Rect x={3} y={8} width={18} height={12} rx={2} />
                <Path d="M7 8V6a5 5 0 0110 0v2" />
              </Svg>
              <Text style={styles.trustText}>Secure Payment</Text>
            </View>
            <View style={styles.trustItem}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.8}>
                <Path d="M4 4v5h5" />
                <Path d="M20 20v-5h-5" />
                <Path d="M4.5 15a8 8 0 0013.9 3.3M19.5 9A8 8 0 005.6 5.7" />
              </Svg>
              <Text style={styles.trustText}>Easy Return</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <View style={styles.cartIconBtn}>
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
              <Circle cx={9} cy={21} r={1.4} fill="#fff" stroke="none" />
              <Circle cx={18} cy={21} r={1.4} fill="#fff" stroke="none" />
              <Path d="M2 3h2l2.4 12.2a2 2 0 002 1.8h8.4a2 2 0 002-1.6L21 8H6" />
            </Svg>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addCartBtn, pressed && styles.pressedFade]}
            onPress={async () => {
              await handleAddToCart();
              navigation.navigate('Cart');
            }}
          >
            <Text style={styles.addCartBtnText}>Add to Cart</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.buyNowBtnWrap, pressed && styles.pressedScale]}
            onPress={async () => {
              await handleAddToCart();
              navigation.navigate('Checkout');
            }}
          >
            <ExpoLinearGradient
              colors={colors.greenGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buyNowBtn}
            >
              <Text style={styles.buyNowBtnText}>Buy Now</Text>
            </ExpoLinearGradient>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingBottom: 14,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  hero: {
    position: 'relative',
    marginTop: 8,
    height: 175,
    borderRadius: 16,
    backgroundColor: '#0c1610',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 20,
  },
  pageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  info: {
    marginTop: 10,
  },
  productName: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.extraBold,
    marginBottom: 3,
  },
  productSub: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 6,
    fontFamily: fonts.regular,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ratingScore: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 11.5,
  },
  ratingStars: {
    color: '#f2c14e',
    letterSpacing: 1,
    fontSize: 12,
  },
  ratingCount: {
    color: colors.muted,
    fontSize: 11.5,
    fontFamily: fonts.regular,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  priceNow: {
    color: colors.text,
    fontSize: 19,
    fontFamily: fonts.extraBold,
  },
  priceOld: {
    color: colors.strike,
    fontSize: 13,
    textDecorationLine: 'line-through',
    fontFamily: fonts.regular,
  },
  priceOff: {
    backgroundColor: 'rgba(62,207,91,0.15)',
    color: colors.green,
    fontSize: 10.5,
    fontFamily: fonts.extraBold,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  desc: {
    color: colors.muted,
    fontSize: 11.5,
    lineHeight: 16.7,
    marginBottom: 10,
    fontFamily: fonts.regular,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    marginBottom: 12,
  },
  trustItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  trustText: {
    color: colors.muted,
    fontSize: 9.5,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  actionRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 6,
    paddingTop: 10,
  },
  pressedFade: {
    opacity: 0.7,
  },
  pressedScale: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cartIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.fieldAlpha,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  addCartBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.green,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCartBtnText: {
    color: colors.green,
    fontSize: 13.5,
    fontFamily: fonts.extraBold,
  },
  buyNowBtnWrap: {
    flex: 1,
    borderRadius: 999,
    ...shadows.buttonGlow,
  },
  buyNowBtn: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowBtnText: {
    color: '#08150c',
    fontSize: 13.5,
    fontFamily: fonts.extraBold,
  },
});

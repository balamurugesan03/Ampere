import React from 'react';
import { View, Text, TextInput, Image, Pressable, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Ellipse, Line } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useBanners, useCart, useCategories, useProducts } from '../api/hooks';
import { resolveMediaUrl } from '../api/client';
import { getCategoryIcon } from '../theme/categoryIcons';
import type { Banner } from '../api/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const BANNER_WIDTH = Dimensions.get('window').width - 44;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { data: cart = [] } = useCart();
  const { data: categories = [] } = useCategories();
  const { data: deals = [] } = useProducts({ trending: true });
  const { data: banners = [] } = useBanners();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const onBannerShopNow = (banner: Banner) => {
    if (banner.linkType === 'product' && banner.linkId) {
      navigation.navigate('Product', { productId: banner.linkId });
    } else if (banner.linkType === 'category' && banner.linkId) {
      navigation.navigate('Search', { categoryId: banner.linkId });
    } else if (deals[0]) {
      navigation.navigate('Product', { productId: deals[0]._id });
    }
  };

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Hello, {firstName} {'👋'}</Text>
            <Text style={styles.headerSub}>Find trusted healthcare products</Text>
          </View>
          <View style={styles.headerIcons}>
            <View style={styles.iconBtn}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
                <Path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9z" />
                <Path d="M13.7 21a2 2 0 01-3.4 0" />
              </Svg>
            </View>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
                <Circle cx={9} cy={21} r={1.4} fill="#fff" stroke="none" />
                <Circle cx={18} cy={21} r={1.4} fill="#fff" stroke="none" />
                <Path d="M2 3h2l2.4 12.2a2 2 0 002 1.8h8.4a2 2 0 002-1.6L21 8H6" />
              </Svg>
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.searchRow} onPress={() => navigation.navigate('Search')}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2}>
            <Circle cx={11} cy={11} r={7} />
            <Line x1={21} y1={21} x2={16.65} y2={16.65} stroke={colors.muted} strokeWidth={2} />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for medicines, products..."
            placeholderTextColor={colors.placeholder}
            editable={false}
            pointerEvents="none"
          />
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2}>
            <Circle cx={11} cy={11} r={7} />
            <Line x1={21} y1={21} x2={16.65} y2={16.65} stroke={colors.muted} strokeWidth={2} />
          </Svg>
        </Pressable>

        {banners.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerScroll}
            contentContainerStyle={{ gap: 0 }}
          >
            {banners.map((banner) => (
              <View key={banner._id} style={[styles.bannerShadowWrap, { width: BANNER_WIDTH }]}>
                <Pressable
                  style={({ pressed }) => [styles.banner, pressed && styles.pressedFade]}
                  onPress={() => onBannerShopNow(banner)}
                >
                  <Image style={styles.bannerImg} source={{ uri: resolveMediaUrl(banner.imageUrl) }} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.categories}>
          {categories.slice(0, 4).map((cat) => (
            <Pressable
              key={cat._id}
              style={({ pressed }) => [styles.catItem, pressed && styles.pressedFade]}
              onPress={() => navigation.navigate('Search', { categoryId: cat._id, categoryName: cat.name })}
            >
              <View style={styles.catCircle}>{getCategoryIcon(cat.name, 24)}</View>
              <Text style={styles.catLabel}>{cat.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Today's Deals</Text>
          <Pressable onPress={() => navigation.navigate('Search')}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.deals}>
          {deals.slice(0, 2).map((product) => {
            const imageUri = resolveMediaUrl(product.images?.[0]);
            return (
              <Pressable
                key={product._id}
                style={({ pressed }) => [styles.dealCard, pressed && styles.pressedFade]}
                onPress={() => navigation.navigate('Product', { productId: product._id })}
              >
                {product.discountPercent > 0 && (
                  <View style={styles.dealBadge}>
                    <Text style={styles.dealBadgeText}>-{product.discountPercent}%</Text>
                  </View>
                )}
                {imageUri ? (
                  <Image style={styles.dealImg} source={{ uri: imageUri }} />
                ) : (
                  <View style={[styles.dealImg, styles.dealImgPlaceholder]} />
                )}
                <Text style={styles.dealName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.dealSub}>{product.subtitle}</Text>
                <Text style={styles.dealPrice}>{'₹'}{product.price}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <BottomNav active="Home" navigation={navigation} />
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
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  headerTitle: {
    fontSize: 21,
    fontFamily: fonts.extraBold,
    color: colors.text,
    marginBottom: 3,
  },
  headerSub: {
    color: colors.muted,
    fontSize: 12.5,
    fontFamily: fonts.regular,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  pressedFade: {
    opacity: 0.7,
  },
  iconBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.green,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: {
    color: '#08150c',
    fontSize: 9,
    fontFamily: fonts.extraBold,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 16,
    ...shadows.card,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13.5,
    fontFamily: fonts.regular,
    padding: 0,
  },
  bannerScroll: {
    marginTop: 16,
  },
  bannerShadowWrap: {
    borderRadius: 18,
    ...shadows.raised,
  },
  banner: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    height: 150,
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15.5,
    fontFamily: fonts.extraBold,
  },
  sectionLink: {
    color: colors.green,
    fontSize: 12.5,
    fontFamily: fonts.bold,
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  catItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  catCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  catLabel: {
    color: colors.text,
    fontSize: 11,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  deals: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  dealCard: {
    flex: 1,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
    position: 'relative',
    ...shadows.card,
  },
  dealBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.red,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    zIndex: 2,
  },
  dealBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: fonts.extraBold,
  },
  dealImg: {
    width: '100%',
    height: 72,
    borderRadius: 8,
  },
  dealImgPlaceholder: {
    backgroundColor: colors.fieldAlpha,
  },
  dealName: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.bold,
    marginTop: 8,
    marginBottom: 1,
  },
  dealSub: {
    color: colors.muted,
    fontSize: 10.5,
    fontFamily: fonts.regular,
  },
  dealPrice: {
    color: colors.green,
    fontFamily: fonts.extraBold,
    fontSize: 13,
    marginTop: 4,
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useProducts } from '../api/hooks';
import { resolveMediaUrl } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const POPULAR = ['Paracetamol', 'Vitamin D3', 'Omega 3', 'Accu-Chek Strips', 'Protein Powder', 'Ashwagandha'];

const RECENT = ['Ashwagandha', 'Accu-Chek Strips', 'Whey Protein'];

export default function SearchScreen({ navigation, route }: Props) {
  const categoryId = route.params?.categoryId;
  const categoryName = route.params?.categoryName;
  const [query, setQuery] = useState('');

  const showingResults = query.trim().length >= 2 || !!categoryId;
  const { data: results = [], isFetching: searching } = useProducts(
    showingResults ? { search: query.trim() || undefined, category: categoryId } : {}
  );
  const { data: trending = [] } = useProducts({ trending: true });

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>{categoryName || 'Search'}</Text>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchRow}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2}>
              <Circle cx={11} cy={11} r={7} />
              <Line x1={21} y1={21} x2={16.65} y2={16.65} stroke={colors.muted} strokeWidth={2} />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for medicines, products..."
              placeholderTextColor={colors.placeholder}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <View style={styles.filterBtn}>
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
              <Line x1={4} y1={6} x2={20} y2={6} />
              <Line x1={4} y1={12} x2={20} y2={12} />
              <Line x1={4} y1={18} x2={20} y2={18} />
              <Circle cx={9} cy={6} r={1.8} fill="#fff" stroke="none" />
              <Circle cx={16} cy={12} r={1.8} fill="#fff" stroke="none" />
              <Circle cx={11} cy={18} r={1.8} fill="#fff" stroke="none" />
            </Svg>
          </View>
        </View>

        {showingResults ? (
          <>
            <View style={[styles.sectionTitle, { marginBottom: 10 }]}>
              <Text style={styles.sectionTitleText}>
                {categoryName ? `${categoryName} Products` : 'Results'}
              </Text>
            </View>
            {searching ? (
              <ActivityIndicator color={colors.green} style={{ marginTop: 20 }} />
            ) : results.length === 0 ? (
              <Text style={styles.emptyText}>No products found.</Text>
            ) : (
              <View style={styles.resultsGrid}>
                {results.map((product) => {
                  const imageUri = resolveMediaUrl(product.images?.[0]);
                  return (
                    <Pressable
                      key={product._id}
                      style={({ pressed }) => [styles.resultCard, pressed && styles.pressedFade]}
                      onPress={() => navigation.navigate('Product', { productId: product._id })}
                    >
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.resultImg} />
                      ) : (
                        <View style={[styles.resultImg, styles.resultImgPlaceholder]} />
                      )}
                      <Text style={styles.trendName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={styles.trendSub}>{product.subtitle}</Text>
                      <Text style={styles.trendPrice}>{'₹'}{product.price}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={[styles.sectionTitle, { marginBottom: 10 }]}>
              <Text style={styles.sectionTitleText}>Popular Searches</Text>
            </View>
            <View style={styles.tagWrap}>
              {POPULAR.map((t) => (
                <Pressable
                  style={({ pressed }) => [styles.tag, pressed && styles.pressedFade]}
                  key={t}
                  onPress={() => setQuery(t)}
                >
                  <Text style={styles.tagText}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Trending Products</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendRow}>
              {trending.map((product) => {
                const imageUri = resolveMediaUrl(product.images?.[0]);
                return (
                  <Pressable
                    style={({ pressed }) => [styles.trendCard, pressed && styles.pressedFade]}
                    key={product._id}
                    onPress={() => navigation.navigate('Product', { productId: product._id })}
                  >
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.trendImg} />
                    ) : (
                      <View style={[styles.trendImg, styles.resultImgPlaceholder]} />
                    )}
                    <Text style={styles.trendName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.trendSub} />
                    <Text style={styles.trendPrice}>{'₹'}{product.price}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Recent Searches</Text>
            </View>
            <View style={styles.recentList}>
              {RECENT.map((r) => (
                <Pressable style={styles.recentItem} key={r} onPress={() => setQuery(r)}>
                  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.8}>
                    <Circle cx={12} cy={12} r={9} />
                    <Path d="M12 7v5l3 3" />
                  </Svg>
                  <Text style={styles.recentTxt}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
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
    paddingBottom: 20,
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
    fontSize: 17,
    fontFamily: fonts.extraBold,
    color: colors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  pressedFade: {
    opacity: 0.7,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.regular,
    padding: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    ...shadows.card,
  },
  sectionTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  sectionTitleLink: {
    color: colors.green,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  tag: {
    backgroundColor: colors.cardAlpha,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tagText: {
    color: colors.text,
    fontSize: 11.5,
    fontFamily: fonts.semiBold,
  },
  trendRow: {
    flexDirection: 'row',
  },
  trendCard: {
    width: 92,
    marginRight: 10,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 8,
    ...shadows.card,
  },
  trendName: {
    color: colors.text,
    fontSize: 10.5,
    fontFamily: fonts.bold,
    marginTop: 7,
    marginBottom: 2,
  },
  trendSub: {
    fontSize: 9,
    height: 11,
    marginBottom: 4,
  },
  trendPrice: {
    color: colors.green,
    fontSize: 11,
    fontFamily: fonts.extraBold,
  },
  recentList: {
    flexDirection: 'column',
    gap: 2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 2,
  },
  recentTxt: {
    flex: 1,
    color: colors.text,
    fontSize: 12.5,
    fontFamily: fonts.medium,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12.5,
    fontFamily: fonts.regular,
    marginTop: 10,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  resultCard: {
    width: '48%',
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 8,
    ...shadows.card,
  },
  resultImg: {
    width: '100%',
    height: 90,
    borderRadius: 8,
  },
  resultImgPlaceholder: {
    backgroundColor: colors.fieldAlpha,
  },
  trendImg: {
    width: '100%',
    height: 60,
    borderRadius: 8,
  },
});

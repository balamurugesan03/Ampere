import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import BottomNav from '../components/BottomNav';
import { useCategories } from '../api/hooks';
import { getCategoryIcon } from '../theme/categoryIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'Categories'>;


export default function CategoriesScreen({ navigation }: Props) {
  const { data: categories = [] } = useCategories();

  return (
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
                <Path d="M15 5l-7 7 7 7" />
              </Svg>
            </Pressable>
            <Text style={styles.headerTitle}>Categories</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Search')}>
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
              <Circle cx={11} cy={11} r={7} />
              <Line x1={21} y1={21} x2={16.65} y2={16.65} stroke="#fff" strokeWidth={2} />
            </Svg>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {categories.map((c) => (
            <Pressable
              style={({ pressed }) => [styles.catCard, pressed && styles.pressedFade]}
              key={c._id}
              onPress={() => navigation.navigate('Search', { categoryId: c._id, categoryName: c.name })}
            >
              <View style={styles.catIcon}>{getCategoryIcon(c.name)}</View>
              <Text style={styles.catName}>{c.name}</Text>
              <Text style={styles.catSub}>{c.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <BottomNav active="Categories" navigation={navigation} />
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
    paddingTop: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontFamily: fonts.extraBold,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 11,
    marginTop: 18,
  },
  pressedFade: {
    opacity: 0.7,
  },
  catCard: {
    width: '48%',
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'column',
    gap: 9,
    ...shadows.card,
  },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  catName: {
    color: colors.text,
    fontSize: 12.5,
    fontFamily: fonts.bold,
  },
  catSub: {
    color: colors.muted,
    fontSize: 10,
    marginTop: -6,
    fontFamily: fonts.regular,
  },
});

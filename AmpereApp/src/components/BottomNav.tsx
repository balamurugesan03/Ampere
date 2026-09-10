import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useCart } from '../api/hooks';

type Nav = NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList>;

type ActiveTab = 'Home' | 'Categories' | 'Wishlist' | 'Cart' | 'Profile';

interface Props {
  active: ActiveTab;
  navigation: Nav;
}

export default function BottomNav({ active, navigation }: Props) {
  const { data: cart = [] } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const color = (tab: ActiveTab) => (tab === active ? colors.green : colors.muted);
  const iconWrapStyle = (tab: ActiveTab) => [styles.iconWrap, tab === active && styles.iconWrapActive];
  const pressableStyle = ({ pressed }: { pressed: boolean }) => [
    styles.navItem,
    pressed && styles.navItemPressed,
  ];

  return (
    <View style={styles.bottomNav}>
      <Pressable style={pressableStyle} onPress={() => navigation.navigate('Home')}>
        <View style={iconWrapStyle('Home')}>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill={color('Home')}>
            <Path d="M12 2L2 10h3v10h6v-6h2v6h6V10h3z" />
          </Svg>
        </View>
        <Text style={[styles.navLabel, { color: color('Home') }]}>Home</Text>
      </Pressable>

      <Pressable style={pressableStyle} onPress={() => navigation.navigate('Categories')}>
        <View style={iconWrapStyle('Categories')}>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color('Categories')} strokeWidth={1.8}>
            <Rect x={3} y={3} width={8} height={8} rx={1.5} />
            <Rect x={13} y={3} width={8} height={8} rx={1.5} />
            <Rect x={3} y={13} width={8} height={8} rx={1.5} />
            <Rect x={13} y={13} width={8} height={8} rx={1.5} />
          </Svg>
        </View>
        <Text style={[styles.navLabel, { color: color('Categories') }]}>Categories</Text>
      </Pressable>

      <Pressable style={pressableStyle} onPress={() => navigation.navigate('Wishlist')}>
        <View style={iconWrapStyle('Wishlist')}>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color('Wishlist')} strokeWidth={1.8}>
            <Path d="M12 21s-7.5-4.6-10-9.1C.5 8 2.4 4.5 6 4a5 5 0 016 2 5 5 0 016-2c3.6.5 5.5 4 4 7.9C19.5 16.4 12 21 12 21z" />
          </Svg>
        </View>
        <Text style={[styles.navLabel, { color: color('Wishlist') }]}>Wishlist</Text>
      </Pressable>

      <Pressable style={pressableStyle} onPress={() => navigation.navigate('Cart')}>
        <View style={[iconWrapStyle('Cart'), styles.navItemRelative]}>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color('Cart')} strokeWidth={1.8}>
            <Circle cx={9} cy={21} r={1.4} fill={color('Cart')} stroke="none" />
            <Circle cx={18} cy={21} r={1.4} fill={color('Cart')} stroke="none" />
            <Path d="M2 3h2l2.4 12.2a2 2 0 002 1.8h8.4a2 2 0 002-1.6L21 8H6" />
          </Svg>
          {cartCount > 0 && (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.navLabel, { color: color('Cart') }]}>Cart</Text>
      </Pressable>

      <Pressable style={pressableStyle} onPress={() => navigation.navigate('Profile')}>
        <View style={iconWrapStyle('Profile')}>
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color('Profile')} strokeWidth={1.8}>
            <Circle cx={12} cy={8} r={4} />
            <Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
          </Svg>
        </View>
        <Text style={[styles.navLabel, { color: color('Profile') }]}>Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    ...shadows.raised,
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingVertical: 2,
    borderRadius: 14,
  },
  navItemPressed: {
    opacity: 0.6,
  },
  navItemRelative: {
    position: 'relative',
  },
  iconWrap: {
    width: 34,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.glowGreen,
  },
  navLabel: {
    fontSize: 9.5,
    fontFamily: fonts.semiBold,
  },
  navBadge: {
    position: 'absolute',
    top: -2,
    right: 2,
    backgroundColor: colors.green,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  navBadgeText: {
    color: '#08150c',
    fontSize: 8,
    fontFamily: fonts.extraBold,
  },
});

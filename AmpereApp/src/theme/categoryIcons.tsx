import React from 'react';
import Svg, { Path, Rect, Circle, Ellipse, G, Line } from 'react-native-svg';

const ICONS: Record<string, (size: number) => React.ReactNode> = {
  Medicines: (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <G transform="rotate(-35 15 15)">
        <Rect x={8} y={6} width={14} height={18} rx={7} fill="#f2a13a" />
        <Rect x={8} y={15} width={14} height={9} rx={7} fill="#f5f0e6" />
      </G>
    </Svg>
  ),
  Ayurveda: (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Ellipse cx={14} cy={19} rx={9} ry={5} fill="#8fc9a0" />
      <Path d="M9 19c0-5 2-9 5-9s5 4 5 9" fill="none" stroke="#5a9a70" strokeWidth={1.6} />
      <Rect x={19} y={4} width={2.4} height={12} rx={1.2} fill="#6b7a5c" transform="rotate(20 20 10)" />
      <Circle cx={24} cy={6} r={2} fill="#7fbf8f" />
    </Svg>
  ),
  Nutrition: (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Rect x={7} y={9} width={16} height={16} rx={3} fill="#2f6b3f" />
      <Rect x={7} y={9} width={16} height={6} fill="#3fae5c" />
      <Rect x={11} y={4} width={8} height={6} rx={1.5} fill="#1f4a2c" />
      <Rect x={10} y={17} width={10} height={2} rx={1} fill="#e8f4ea" opacity={0.85} />
    </Svg>
  ),
  'Personal Care': (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Rect x={10} y={9} width={10} height={17} rx={4} fill="#e05a86" />
      <Rect x={12} y={4} width={6} height={6} rx={1.5} fill="#b34068" />
      <Ellipse cx={15} cy={20} rx={3} ry={4} fill="#f5a8bf" opacity={0.7} />
    </Svg>
  ),
  'Heart Care': (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Path d="M15 25s-9-5.5-9-12a5.5 5.5 0 019-4 5.5 5.5 0 019 4c0 6.5-9 12-9 12z" fill="#e5384d" />
    </Svg>
  ),
  'Bone Health': (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Path
        d="M9 7c-2 0-3 2-2 4 0 1-1 2-1 3.5 0 1.8 1.5 3 1.5 4.5 0 1.5-1 2.5 0 4s3 1.5 4 0c1-1.2 2.5-1.2 4-1.2s3 0 4 1.2c1 1.5 3 1.5 4 0s0-2.5 0-4c0-1.5 1.5-2.7 1.5-4.5 0-1.5-1-2.5-1-3.5 1-2 0-4-2-4-1.5 0-2.5 1-3 2.2-.8 1.8-3.2 1.8-4 0-.5-1.2-1.5-2.2-3-2.2-1.5 0-2.5 1-3 2.2-.8 1.8-3.2 1.8-4 0-.5-1.2-1-2.2-2-2.2z"
        fill="#d9b98a"
      />
    </Svg>
  ),
  'Baby Care': (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Rect x={10} y={10} width={9} height={15} rx={4} fill="#f2f2ee" />
      <Rect x={12} y={6} width={5} height={6} rx={1.5} fill="#c7c7bf" />
      <Circle cx={20} cy={8} r={2.4} fill="#e8b84a" />
      <Rect x={11} y={15} width={7} height={2} fill="#9fd4c0" opacity={0.8} />
    </Svg>
  ),
  'Medical Devices': (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Rect x={8} y={7} width={14} height={18} rx={3} fill="#2f8fd6" />
      <Rect x={10.5} y={10} width={9} height={7} rx={1} fill="#eaf5fc" />
      <Rect x={11} y={19} width={3} height={3} rx={0.8} fill="#eaf5fc" />
      <Rect x={16} y={19} width={3} height={3} rx={0.8} fill="#eaf5fc" />
    </Svg>
  ),
  'Diabetes Care': (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Rect x={7} y={9} width={14} height={14} rx={3} fill="#2f8fd6" />
      <Rect x={9.5} y={11.5} width={9} height={6} rx={1} fill="#eaf5fc" />
      <Rect x={21} y={15} width={4} height={2} fill="#2f8fd6" />
      <Rect x={24} y={13.5} width={2} height={5} rx={1} fill="#2f8fd6" />
    </Svg>
  ),
  Fitness: (size) => (
    <Svg width={size} height={size} viewBox="0 0 30 30" stroke="#e8e8e2" strokeWidth={2} fill="none" strokeLinecap="round">
      <Line x1={4} y1={15} x2={26} y2={15} />
      <Rect x={2} y={11} width={4} height={8} rx={1.5} fill="#e8e8e2" stroke="none" />
      <Rect x={24} y={11} width={4} height={8} rx={1.5} fill="#e8e8e2" stroke="none" />
      <Rect x={7} y={13} width={3} height={4} fill="#e8e8e2" stroke="none" />
      <Rect x={20} y={13} width={3} height={4} fill="#e8e8e2" stroke="none" />
    </Svg>
  ),
};

const FALLBACK = (size: number) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    <Circle cx={15} cy={15} r={11} fill="#3a3f3a" />
    <Rect x={13} y={9} width={4} height={12} rx={2} fill="#c7ccc8" />
    <Rect x={9} y={13} width={12} height={4} rx={2} fill="#c7ccc8" />
  </Svg>
);

export function getCategoryIcon(name: string, size = 30) {
  return (ICONS[name] ?? FALLBACK)(size);
}

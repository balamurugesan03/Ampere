// Maps the CSS font-weight values used throughout the prototype
// (400/500/600/700/800 on the "Poppins" family) to the concrete
// Poppins font-family names exposed by @expo-google-fonts/poppins.
export const fonts = {
  regular: 'Poppins_400Regular', // 400
  medium: 'Poppins_500Medium', // 500
  semiBold: 'Poppins_600SemiBold', // 600
  bold: 'Poppins_700Bold', // 700
  extraBold: 'Poppins_800ExtraBold', // 800
} as const;

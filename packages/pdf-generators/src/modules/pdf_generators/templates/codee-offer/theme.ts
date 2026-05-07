import { Font } from '@react-pdf/renderer'
import InterRegular from '../shared/fonts/Inter-Regular.generated'
import InterMedium from '../shared/fonts/Inter-Medium.generated'
import InterSemiBold from '../shared/fonts/Inter-SemiBold.generated'

Font.register({
  family: 'Inter',
  fonts: [
    { src: InterRegular, fontWeight: 400 },
    { src: InterMedium, fontWeight: 500 },
    { src: InterSemiBold, fontWeight: 600 },
  ],
})

Font.registerHyphenationCallback((word) => [word])

export const colors = {
  dark: '#0d1117',
  blue: '#1c36bf',
  white: '#FFFFFF',
  lightBg: '#F5F5F3',
  text: '#1a1a1a',
  textMuted: '#666666',
  border: '#E5E5E5',
}

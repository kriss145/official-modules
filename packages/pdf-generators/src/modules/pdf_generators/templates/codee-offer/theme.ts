import { Font } from '@react-pdf/renderer'

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

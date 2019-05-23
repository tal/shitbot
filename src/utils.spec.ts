import { normalizeEmoji } from './utils'

describe('normalizeEmoji', () => {
  describe('inline emoji', () => {
    it('should work with skin tone', () => {
      const { emoji, skinTone } = normalizeEmoji(':wave::skin-tone-4:')
      expect(emoji).toBe('wave')
      expect(skinTone).toBe('skin-tone-4')
    })

    it('should work without skin tone', () => {
      const { emoji, skinTone } = normalizeEmoji(':wave:')
      expect(emoji).toBe('wave')
      expect(skinTone).toBeUndefined()
    })
  })

  describe('reaction emoji', () => {
    it('should work with skin tone', () => {
      const { emoji, skinTone } = normalizeEmoji('wave::skin-tone-4')
      expect(emoji).toBe('wave')
      expect(skinTone).toBe('skin-tone-4')
    })

    it('should work without skin tone', () => {
      const { emoji, skinTone } = normalizeEmoji('wave')
      expect(emoji).toBe('wave')
      expect(skinTone).toBeUndefined()
    })
  })
})

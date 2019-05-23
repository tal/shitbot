import { normalizeEmoji, allSlackURLs } from './utils'

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

describe('allSlackURLs', () => {
  describe('one url with display', () => {
    it('Should return one', () => {
      const [url] = allSlackURLs(
        'Hi, <http://twitter.com/post/1234|twitter.com/post/1234>',
      )

      expect(url).toBeDefined()
      expect(url[0]).toBe(
        '<http://twitter.com/post/1234|twitter.com/post/1234>',
      )
      expect(url[1]).toBe('http://twitter.com/post/1234')
      expect(url[2]).toBe('twitter.com/post/1234')
    })

    it('Should return one witout a defined display', () => {
      const [url] = allSlackURLs('Hi, <http://twitter.com/post/1234>')

      expect(url).toBeDefined()
      expect(url[0]).toBe('<http://twitter.com/post/1234>')
      expect(url[1]).toBe('http://twitter.com/post/1234')
      expect(url[2]).toBeUndefined()
    })
  })

  describe('multiple urls', () => {
    let urls: RegExpExecArray[] = []
    let source: string =
      'Hi, <http://twitter.com/post/123|twitter.com/post/123> hi 2 <http://twitter.com/post/1234|twitter.com/post/1234>'

    beforeEach(() => {
      urls = allSlackURLs(source)
    })

    it('Should return both', () => {
      expect(urls).toHaveLength(2)
    })

    it('should have accurate match', () => {
      const [url1, url2] = urls
      expect(url1[0]).toBe('<http://twitter.com/post/123|twitter.com/post/123>')
      expect(url2[0]).toBe(
        '<http://twitter.com/post/1234|twitter.com/post/1234>',
      )
    })
  })
})

import {safely} from './wa'

describe('safeAnalytics()', () => {
  test('runs successful function without reaching catch', () => {
    const aGoodFunction = jest.fn((x) => x)
    safely(aGoodFunction, 'good function', 'test')
    expect(aGoodFunction).toHaveBeenCalledWith('test')
  })

  test('a failing functiion', () => {
    const aBadFunction = jest.fn(() => {
      throw new Error('Internal analytics error')
    })
    const spy = jest.spyOn(console, 'error').mockImplementation()
    safely(aBadFunction, 'bad function', 'test')
    expect(spy).toHaveBeenCalledWith(new Error('Internal analytics error'))
  })

  test('a non function passed in causes a graceful logging that the function is not there', () => {
    const aBadFunction = "I'm not a function"
    const spy = jest.spyOn(console, 'error').mockImplementation()
    safely(aBadFunction, 'test function', 'test')
    expect(spy).toHaveBeenCalledWith('test function', 'not available')
  })
})

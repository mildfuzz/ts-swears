import _map from 'lodash/map'
import _clone from 'lodash/clone'
import _forEach from 'lodash/forEach'

import values from './values.json'
import * as utils from './utils'

describe('@analytics > utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('page name formatting', () => {
    describe('getDdlText()', () => {
      test('returns trimmed and lowercase text', () => {
        _forEach(
          [
            {text: ' ', expected: ''},
            {text: 0, expected: ''},
            {text: null, expected: ''},
            {text: false, expected: ''},
            {text: undefined, expected: ''},
            {text: 1, expected: '1'},
            {text: ' Foo ', expected: 'foo'},
            {text: 'FOO ', expected: 'foo'},
            {text: ' fOo', expected: 'foo'},
            {text: ' foo Bar ', expected: 'foo bar'},
          ],
          ({text, expected}) => {
            expect(utils.getDdlText(text)).toEqual(expected)
          },
        )
      })
    })

    describe('toDdlName()', () => {
      test('returns lowercase & trimmed delimited string from array', () => {
        _forEach(
          [
            {text: ' ', expected: ''},
            {
              text: ['', ' ', 0, 1, '0', null, false, undefined],
              expected: '1:0',
            },
            {text: [' FOO '], expected: 'foo'},
            {text: [' Foo ', 'baR'], expected: 'foo:bar'},
            {text: [' FOO ', '   ', ' BAR '], expected: 'foo:bar'},
          ],
          ({text, expected}) => {
            expect(utils.toDdlName(text)).toEqual(expected)
          },
        )
      })
    })

    describe('getPageNameSections()', () => {
      test('returns page name sections array with category prefixes', () => {
        expect(
          _map(
            [0, null, false, undefined, '', [0, 1, '0', 'foo', 'bar']],
            utils.getPageNameSections,
          ),
        ).toMatchSnapshot()
      })
    })

    describe('getPageName()', () => {
      test('returns lowercase & trimmed page name string', () => {
        expect(
          _map(
            [0, null, false, undefined, '', [0, 1, '0', 'foo', 'bar']],
            utils.getPageName,
          ),
        ).toMatchSnapshot()
      })
    })
  })

  describe('page categories', () => {
    describe('getPageCategories()', () => {
      test('returns correctly constructed object', () => {
        expect(
          _map(['', 'foo 1', ['bar 1', 'bar 2']], utils.getPageCategories),
        ).toMatchSnapshot()
      })
    })
  })

  describe('ddl property', () => {
    describe('getPropertyRegion()', () => {
      test('return property region name for known property', () => {
        _forEach(values.regionProperties, (properties, region) => {
          _forEach(properties, (property) => {
            expect(utils.getPropertyRegion(property)).toEqual(region)
          })
        })
      })

      test('return undefined for unknown property', () => {
        expect(utils.getPropertyRegion('unknown')).toEqual()
      })
    })

    describe('isContextProperty()', () => {
      test('return true only if provided property belongs to the context region', () => {
        _forEach(values.regionProperties.context, (property) => {
          expect(utils.isContextProperty(property)).toBe(true)
        })

        _forEach(values.regionProperties.view, (property) => {
          expect(utils.isContextProperty(property)).toBe(false)
        })

        expect(utils.isContextProperty('unknown')).toBe(false)
      })
    })

    describe('isActionProperty()', () => {
      test('return true only if provided property belongs to the action region', () => {
        _forEach(values.regionProperties.action, (property) => {
          expect(utils.isActionProperty(property)).toBe(true)
        })

        _forEach(values.regionProperties.context, (property) => {
          expect(utils.isActionProperty(property)).toBe(false)
        })

        expect(utils.isActionProperty('unknown')).toBe(false)
      })
    })

    describe('getItemPropertyKey()', () => {
      test('return the ddl property item key from items key forEach if available', () => {
        _forEach(values.itemsKeyMap, (items, item) => {
          _forEach(items, (propertyKey, property) => {
            expect(utils.getItemPropertyKey(item, property)).toBe(
              propertyKey || property,
            )
          })
        })
      })
    })
  })

  describe('load time measuring', () => {
    const mockDateTime = 111
    const mockPerfTime = 222

    const getUtils = () => require('./utils') // eslint-disable-line global-require

    beforeEach(() => {
      jest.resetModules()
    })

    jest.spyOn(global.Date, 'now').mockReturnValue(mockDateTime)

    test('initial load start time', () => {
      global.initialLoadStart = 101
      expect(getUtils().pageLoadTimes).toMatchSnapshot()
    })

    describe('loadStart()', () => {
      test('sets & returns page load start time', () => {
        global.performance.now = jest.fn().mockReturnValue(mockPerfTime)
        const {loadStart, pageLoadTimes} = getUtils()
        expect(loadStart('foo')).toEqual(mockPerfTime)

        global.performance.now = null
        expect(loadStart('bar')).toEqual(mockDateTime)

        expect(pageLoadTimes).toMatchSnapshot()
      })
    })

    describe('loadEnd()', () => {
      test('sets & returns page load duration', () => {
        global.performance.now = jest.fn().mockReturnValue(mockPerfTime)
        const {loadStart, loadEnd, pageLoadTimes} = getUtils()
        const loadTimes = {}

        loadStart('foo')
        loadTimes.withPerf = {start: _clone(pageLoadTimes)}

        global.performance.now = jest.fn().mockReturnValue(mockPerfTime + 10)
        expect(loadEnd('foo')).toEqual(10)
        loadTimes.withPerf.end = _clone(pageLoadTimes)

        global.performance.now = null
        loadStart('bar')
        loadTimes.withDate = {start: _clone(pageLoadTimes)}

        global.Date.now.mockReturnValue(mockDateTime + 10)
        expect(loadEnd('bar')).toEqual(10)
        loadTimes.withDate.end = _clone(pageLoadTimes)

        expect(loadTimes).toMatchSnapshot()
      })
    })
  })

  describe('getServiceData()', () => {
    test('returns service properties with mapped environment name', () => {
      expect(
        _map(['local', 'dev', 'live', 'unknown'], utils.getServiceData),
      ).toMatchSnapshot()
    })
  })

  describe('getDeviceData()', () => {
    test('returns device data with orientation & responsive state', () => {
      expect(
        _map(
          [
            {width: 1, height: 1}, // square ratio
            {width: 300, height: 300}, // square small resolution

            {width: 3, height: 4}, // portrait (tablet) ratio
            {width: 768, height: 1024}, // portrait (tablet) medium resolution

            {width: 9, height: 16}, // portrait (mobile) ratio
            {width: 720, height: 1280}, // portrait (mobile) medium resolution

            {width: 5, height: 4}, // landscape ratio
            {width: 1280, height: 1024}, // landscape large resolution

            {width: 8, height: 5}, // landscape (monitor)
            {width: 1680, height: 1050}, // landscape (monitor) large resolution

            {width: 16, height: 9}, // landscape (widescreen) ratio
            {width: 1920, height: 1080}, // landscape (widescreen) large resolution
          ],
          ({width, height}) => [
            `${width}x${height}`,
            utils.getDeviceData({width, height}),
          ],
        ),
      ).toMatchSnapshot()
    })
  })

  describe('getEntryRoute()', () => {
    const referrers = [
      'http://nationwide.co.uk/abc-123',
      'http://www.nationwide.co.uk/abc-123?xyz=123',
      'https://nationwide.co.uk?abc-123',
      'https://www.nationwide.co.uk/abc-123',
      'http://onlinebanking.nationwide.co.uk?GSSToken=abc-123',
      'https://onlinebanking.nationwide.co.uk/abc-123/?GSSToken=abc-123',
      'https://google.co.uk/search',
      '',
      undefined,
    ]
    const search = [
      'JId=123',
      'Jid=123',
      'JId=123&abc=456',
      'Jid=123&abc=456',
      'abc=123&JId=456',
      'abc=123&Jid=456',
      'abc=123&aJid=456',
      'abc=JId',
      '',
    ]

    test('with matched/unmatched referrers', () => {
      expect(
        _map(referrers, (referrer) => {
          global.document.referrer = referrer

          return utils.getEntryRoute()
        }),
      ).toMatchSnapshot()
    })

    test('with blank referrer and matched/unmatched URL param(s)', () => {
      global.document.referrer = ''

      expect(
        _map(search, (qs) => {
          global.history.replaceState({}, null, `/test.html?${qs}`)

          return utils.getEntryRoute()
        }),
      ).toMatchSnapshot()
    })
  })

  describe('formatFormikErrors', () => {
    const formikErrors = {
      loanAmount: 'Enter a loan amount.',
      mortgageLength: {
        months: 'Length of mortgage must include a month.',
        years: 'Length of mortgage must include a year.',
      },
      propertyValue: 'Enter a property value.',
      transactionType: 'Choose an option.',
      dependents: [{age: 'Enter an age'}, {age: 'Enter an age'}],
    }

    const analyticsErrors = [
      {cause: 'loanAmount', message: 'Enter a loan amount.'},
      {
        cause: 'mortgageLength.months',
        message: 'Length of mortgage must include a month.',
      },
      {
        cause: 'mortgageLength.years',
        message: 'Length of mortgage must include a year.',
      },
      {cause: 'propertyValue', message: 'Enter a property value.'},
      {cause: 'transactionType', message: 'Choose an option.'},
      {cause: 'dependents.0.age', message: 'Enter an age'},
      {cause: 'dependents.1.age', message: 'Enter an age'},
    ]

    it('should format formik errors object for the analytics message', () => {
      expect(utils.formatFormikErrors(formikErrors)).toMatchSnapshot()
      expect(utils.formatFormikErrors(formikErrors)).toEqual(analyticsErrors)
    })
  })
})

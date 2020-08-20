import _pick from 'lodash/pick'
import _forEach from 'lodash/forEach'

import * as utils from './utils'
import values from './values.json'
import ddl from './ddl'

describe('@analytics > ddl', () => {
  jest.spyOn(global.Date, 'now').mockReturnValue(0)
  jest.spyOn(global, 'wa_view').mockImplementation()

  const tagPage = (desc) => {
    global.Date.now.mockReturnValue(0)
    utils.loadStart(utils.getPageName(desc))
    global.Date.now.mockReturnValue(5000) // 5 second page load
    ddl.setPage(desc)
  }

  beforeEach(() => jest.clearAllMocks())

  describe('getSource()', () => {
    test('getSource returns context data if called with a context property', () => {
      expect(ddl.getSource('nbs_user')).toMatchSnapshot()
    })

    test('getSource returns global digital if called with an action property', () => {
      expect(ddl.getSource('nbs_user_input')).toMatchSnapshot()
    })

    test('getSource returns global digital if called with the page property', () => {
      expect(ddl.getSource('page')).toMatchSnapshot()
    })

    test('getSource returns initial view data otherwise', () => {
      expect(ddl.getSource('other_property')).toMatchSnapshot()
    })
  })

  describe('updatePageName()', () => {
    test('update page name directly in digitalData object', () => {
      const getData = () =>
        _pick(global.digitalData, ['page.pageInfo.pageName', 'page.category'])
      const result = {before: null, after: null}

      tagPage('foo')
      result.before = getData()

      ddl.updatePageName(['bar 1', 'bar 2'])
      result.after = getData()

      expect(result).toMatchSnapshot()
    })
  })

  describe('setUserApplicationRoute()', () => {
    test('updates ddl with user route', () => {
      ddl.setUserApplicationRoute({
        applicationRoute: 'banking app',
      })

      tagPage()

      expect(
        _pick(global.digitalData, ['nbs_user_application_route']),
      ).toMatchSnapshot()
    })
  })

  describe('addMessage()', () => {
    test('adds contextual message item', () => {
      _forEach(values.types.message, (messageType) => {
        ddl.addMessage(
          messageType,
          `message for ${messageType}`,
          `cause for ${messageType}`,
        )
      })
      expect(_pick(global.digitalData, 'nbs_message')).toMatchSnapshot()
    })
  })

  describe('replceMessage()', () => {
    test('adds contextual message item', () => {
      _forEach(values.types.message, (messageType) => {
        ddl.replaceMessage(
          messageType,
          `message for ${messageType}`,
          `cause for ${messageType}`,
        )
      })

      expect(_pick(global.digitalData, 'nbs_message')).toMatchSnapshot()
    })
  })

  describe('addUserInput()', () => {
    test('adds contextual user input item with optional message, validation status, and apply defaults flag', () => {
      tagPage()
      ddl.addUserInput('foo input 1')
      ddl.addUserInput('foo input 2', 'foo input 2 success')
      ddl.addUserInput('foo input 3', null, true)
      ddl.addUserInput('foo input 4', 'foo input 4 passed', true)
      ddl.addUserInput('foo input 5', 'foo input 5 error', false)
      ddl.addUserInput('foo input 6', null, true, false)
      ddl.addUserInput('foo input 7', null, true, true)

      expect(_pick(global.digitalData, 'nbs_user_input')).toMatchSnapshot()
    })
  })

  describe('addInteraction()', () => {
    test('adds contextual interaction item', () => {
      tagPage()
      _forEach(values.types.interaction, (interactionType) => {
        ddl.addInteraction(interactionType, `label for ${interactionType}`)
      })

      expect(
        _pick(global.digitalData, 'nbs_element_interaction'),
      ).toMatchSnapshot()
    })
  })

  describe('updateMortgageObject()', () => {
    test('creates an array of names & values', () => {
      const analyticsValues = {
        customerType: 'New mortgage customer',
        transactionType: 'First time buyer',
      }
      ddl.updateMortgageObject(analyticsValues)

      expect(_pick(global.digitalData, 'page')).toEqual({
        page: {
          category: '',
          nbs_environment: 'dev',
          nbs_server: 'http://localhost',
          pageInfo: {
            nbs_page_load_time: 0,
            nbs_page_responsive_orientation: 'landscape',
            nbs_page_responsive_state: 'large',
            pageName: 'nbs-aws:application:overpayment',
          },
        },
      })
    })
  })

  describe('refresh()', () => {
    test('merges contextual data with ddl', () => {
      ddl.addUserInput('name', 'message', true)
      ddl.refresh()

      expect(_pick(global.digitalData, 'nbs_user_input')).toMatchSnapshot()
    })
  })
})

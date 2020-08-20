import _pick from 'lodash/pick'
import _forEach from 'lodash/forEach'
import _camelCase from 'lodash/camelCase'

import values from './values.json'
import ddl from './ddl'
import tags, {createViewTags} from './tags'
import wa from './wa'

jest.mock('./ddl')

describe('@analytics > tags', () => {
  jest.useFakeTimers()

  jest.spyOn(wa, 'view').mockImplementation()
  jest.spyOn(wa, 'ddlBackup').mockImplementation()
  jest.spyOn(wa, 'ddlRestore').mockImplementation()
  jest.spyOn(wa, 'action').mockImplementation()

  beforeEach(() => jest.clearAllMocks())

  describe('tagging scenarios', () => {
    test('api', () => {
      expect(tags).toMatchSnapshot()
    })

    describe('view tagging', () => {
      _forEach(
        [
          {tagType: 'pageView', providedName: ['foo', 'bar']},
          {
            tagType: 'loaderOpen',
            providedName: ['foo', 'bar'],
            expectedName: ['foo', 'bar'],
          },
          {
            tagType: 'overlayOpen',
            providedName: ['foo', 'bar'],
            expectedName: ['foo', 'bar'],
          },
          {
            tagType: 'modalOpen',
            providedName: ['foo', 'bar'],
            expectedName: ['foo', 'bar'],
          },
        ],
        ({tagType, providedName, expectedName = providedName}) => {
          describe(`${tagType}()`, () => {
            test('call ddl set page with initial page description', () => {
              tags[tagType]({name: providedName})
              jest.runOnlyPendingTimers()
              expect(ddl.setPage).toHaveBeenCalledTimes(1)
              expect(ddl.setPage).toHaveBeenCalledWith(expectedName)
            })

            test('calls web analytics view', () => {
              tags[tagType]({name: providedName})
              jest.runOnlyPendingTimers()
              expect(wa.view).toHaveBeenCalledTimes(1)
            })
          })
        },
      )

      describe('pageNameUpdateView()', () => {
        const updatedPageName = ['bar 1', 'bar 2']

        test('call ddl update page name with page description', () => {
          tags.pageNameUpdateView(updatedPageName)

          expect(ddl.updatePageName).toHaveBeenCalledTimes(1)
          expect(ddl.updatePageName).toHaveBeenCalledWith(updatedPageName)
        })

        test('calls web analytics view', () => {
          tags.pageNameUpdateView(updatedPageName)

          expect(wa.view).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('overlay / modal tagging', () => {
      _forEach(['overlay', 'modal', 'loader', 'slider'], (tagType) => {
        describe(`${tagType}Open()`, () => {
          test('calls web analytics ddl backup and view', () => {
            tags[`${tagType}Open`]({})
            jest.runOnlyPendingTimers()
            expect(wa.ddlBackup).toHaveBeenCalledTimes(1)
            expect(wa.view).toHaveBeenCalledTimes(1)
          })
        })

        describe(`${tagType}Close()`, () => {
          test('calls web analytics ddl restore', () => {
            const closeTag = tags[`${tagType}Close`]
            closeTag()
            jest.runOnlyPendingTimers()
            expect(wa.ddlRestore).toHaveBeenCalledTimes(1)
          })

          if (tagType !== 'loader') {
            test('calls refresh and only call web analytics view if returning to page', () => {
              const closeTag = tags[`${tagType}Close`]

              closeTag()
              jest.runOnlyPendingTimers()
              closeTag({isReturning: true})
              jest.runOnlyPendingTimers()
              closeTag({isReturning: false})
              jest.runOnlyPendingTimers()

              expect(ddl.refresh).toHaveBeenCalledTimes(3)
              expect(wa.view).toHaveBeenCalledTimes(2)
            })
          }
        })
      })
    })

    describe('message tagging', () => {
      _forEach(values.types.message, (messageType) => {
        describe(`${_camelCase(messageType)}Message()`, () => {
          test('calls ddl add message', () => {
            const message = `${messageType} type message`
            const cause = `${messageType} type cause`

            tags[`${_camelCase(messageType)}Message`](message, cause)
            jest.runOnlyPendingTimers()
            expect(ddl.addMessage).toHaveBeenCalledTimes(1)
            expect(ddl.addMessage).toHaveBeenCalledWith(
              messageType,
              message,
              cause,
            )
          })
        })
      })
    })

    describe('action tagging', () => {
      describe('userInput()', () => {
        test('calls ddl add user input', () => {
          const label = 'input label'
          const message = 'input validation message'
          const isValid = null
          const applyDefaults = false

          tags.userInput({label, message, isValid})
          jest.runOnlyPendingTimers()
          expect(ddl.addUserInput).toHaveBeenCalledTimes(1)
          expect(ddl.addUserInput).toHaveBeenCalledWith(
            label,
            message,
            isValid,
            applyDefaults,
          )
        })

        test('calls web analytics action with event', () => {
          tags.userInput({})
          jest.runOnlyPendingTimers()
          expect(wa.action).toHaveBeenCalledTimes(1)
          expect(wa.action).toHaveBeenCalledWith(values.types.action.INPUT)
        })
      })
    })

    describe('interaction tagging', () => {
      _forEach(values.types.interaction, (interactionType, interactionName) => {
        describe(`${_camelCase(interactionName)}Interaction()`, () => {
          const tagInteraction =
            tags[`${_camelCase(interactionName)}Interaction`]

          test('calls ddl add interaction', () => {
            const label = `${interactionType} type label`

            tagInteraction(label)
            jest.runOnlyPendingTimers()
            expect(ddl.addInteraction).toHaveBeenCalledTimes(1)
            expect(ddl.addInteraction).toHaveBeenCalledWith(
              interactionType,
              label,
            )
          })

          test('calls web analytics action with event', () => {
            tagInteraction()
            jest.runOnlyPendingTimers()
            expect(wa.action).toHaveBeenCalledTimes(1)
            expect(wa.action).toHaveBeenCalledWith(
              values.types.action[interactionName] ||
                values.types.action.DEFAULT,
            )
          })

          if (interactionName === 'HELP') {
            test('only tag first help interaction', () => {
              tagInteraction('a')
              tagInteraction('b')
              tagInteraction('a')
              tagInteraction('a')
              tagInteraction('b')
              tagInteraction('b')
              jest.runOnlyPendingTimers()
              expect(ddl.addInteraction).toHaveBeenCalledTimes(2)
              expect(wa.action).toHaveBeenCalledTimes(2)
            })
          }

          if (interactionName === 'REVEAL') {
            test('only tag reveal interaction on reveal', () => {
              tagInteraction('a', false)
              tagInteraction('b', false)
              tagInteraction('a', true)
              tagInteraction('b', true)
              jest.runOnlyPendingTimers()
              expect(ddl.addInteraction).toHaveBeenCalledTimes(2)
              expect(wa.action).toHaveBeenCalledTimes(2)
            })
          }
        })
      })
    })

    describe('submitInteractionWithValidation()', () => {
      const label = 'submit button'
      test('calls ddl add interaction with submit tyoe and label', () => {
        tags.submitInteractionWithValidation({label})
        jest.runOnlyPendingTimers()
        expect(ddl.addInteraction).toHaveBeenCalledTimes(1)
        expect(ddl.addInteraction).toHaveBeenCalledWith(
          values.types.action.SUBMIT,
          label,
        )
      })

      test('calls wa_action after adding ddl interaction', () => {
        tags.submitInteractionWithValidation({label})
        jest.runOnlyPendingTimers()
        expect(wa.action).toHaveBeenCalledTimes(1)
        expect(wa.action).toHaveBeenCalledWith('form_submission')
        expect(wa.view).not.toHaveBeenCalled()
      })

      test('adds messages if present and defaults to invalid with messages', () => {
        const messages = [
          {cause: 'firstName', message: 'This is a required field'},
          {cause: 'email', message: 'This is not a valid email'},
        ]
        tags.submitInteractionWithValidation({label, messages})
        jest.runOnlyPendingTimers()
        expect(ddl.replaceMessage).toHaveBeenCalledTimes(2)
        expect(ddl.replaceMessage).toHaveBeenCalledWith(
          values.types.message.USER,
          'This is a required field',
          'firstName',
        )
        expect(ddl.replaceMessage).toHaveBeenCalledWith(
          values.types.message.USER,
          'This is not a valid email',
          'email',
        )
        expect(wa.view).toHaveBeenCalledTimes(1)
      })

      test('adds messages if present and accepts also a valid argument which prevents wa_view being called if true', () => {
        const messages = [
          {cause: 'firstName', message: 'This is a required field'},
          {cause: 'email', message: 'This is not a valid email'},
        ]
        tags.submitInteractionWithValidation({label, messages, valid: true})
        jest.runOnlyPendingTimers()
        expect(ddl.replaceMessage).toHaveBeenCalledTimes(2)
        expect(ddl.replaceMessage).toHaveBeenCalledWith(
          values.types.message.USER,
          'This is a required field',
          'firstName',
        )
        expect(ddl.replaceMessage).toHaveBeenCalledWith(
          values.types.message.USER,
          'This is not a valid email',
          'email',
        )
        expect(wa.view).toHaveBeenCalledTimes(0)
      })

      test('will also send values to adobe if an analytics object is passed in', () => {
        const analyticsValues = {
          mortgageLength: {
            years: 20,
            months: 6,
          },
          ltv: 66.66,
          purchasePrice: 300000,
          loanAmount: 200000,
        }
        tags.submitInteractionWithValidation({
          label,
          analyticsValues,
          valid: true,
        })
        jest.runOnlyPendingTimers()
        expect(wa.action).toHaveBeenCalledTimes(1)
        expect(wa.action).toHaveBeenCalledWith('form_submission')
        expect(wa.view).not.toHaveBeenCalled()
        expect(wa.view).toHaveBeenCalledTimes(0)

        expect(_pick(global.digitalData, 'nbs_app_mortgage')).toMatchSnapshot()
      })

      test('should call updateMortgageObject', () => {
        const analyticsValues = {
          mortgageLength: {
            years: 20,
            months: 6,
          },
          ltv: 66.66,
          purchasePrice: 300000,
          loanAmount: 200000,
        }
        tags.submitInteractionWithValidation({
          label,
          analyticsValues,
          valid: true,
        })

        expect(ddl.updateMortgageObject).toHaveBeenCalled()
      })
    })

    describe('sendValuesToAdobe()', () => {
      test('adds values to the ddl that matches the array of passed in strings', () => {
        const vals = {
          mortgageLength: {
            years: 20,
            months: 6,
          },
          ltv: 66.66,
          purchasePrice: 300000,
          loanAmount: 200000,
        }

        tags.sendValuesToAdobe(vals)

        expect(_pick(global.digitalData, 'nbs_app_mortgage')).toMatchSnapshot()
      })
    })
  })

  describe('createViewTagHandler()', () => {
    const tagScenarios = {
      foo: {
        type: jest.fn(),
        name: 'foo',
        optionA: [true, false],
        optionB: {foo: true},
      },
      bar: {type: jest.fn(), name: 'bar'},
      baz: {type: jest.fn(), name: 'baz'},
      quz: {type: jest.fn(), name: 'quz'},
    }
    const viewTags = createViewTags(tagScenarios)

    test('creates view tag handler functions from provided tag scenarios', () => {
      expect(viewTags).toMatchSnapshot()
    })

    describe('view tag', () => {
      test('exposes tag options', () => {
        _forEach(tagScenarios, ({type, ...opts}) => {
          expect(viewTags[opts.name].tagOptions).toMatchSnapshot()
        })
      })

      test('handler function calls tag type with tag options', () => {
        _forEach(tagScenarios, ({type, ...tagOptions}) => {
          const options = {ownOption: true}
          viewTags[tagOptions.name](options)
          expect(type).toHaveBeenCalledTimes(1)
          expect(type).toHaveBeenCalledWith({
            ...tagOptions,
            ...options,
          })
        })
      })
    })
  })
})

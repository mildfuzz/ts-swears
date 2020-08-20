import _size from 'lodash/size'
import _reduce from 'lodash/reduce'
import _flatten from 'lodash/flatten'
import _isEmpty from 'lodash/isEmpty'
import _memoize from 'lodash/memoize'
import _mapKeys from 'lodash/mapKeys'
import _snakeCase from 'lodash/snakeCase'
import _replace from 'lodash/replace'
import _defaults from 'lodash/defaults'
import _camelCase from 'lodash/camelCase'
import _isUndefined from 'lodash/isUndefined'

import values from './values.json'
import ddl from './ddl'

import wa from './wa'

/**
 * Web Analytic Scenarios
 */
export const tags = {
  /**
   * Spec: 5.1.2 & 5.1.3 - Standard / Dynamic Page View
   */
  pageView: ({name}) => {
    ddl.setPage(name)
    wa.view()
  },

  pageNameUpdateView: (desc) => {
    ddl.updatePageName(desc)
    wa.view()
  },

  /**
   * Spec: 5.1.4 - Overlay Page View (Trigger)
   */
  overlayOpen: ({name, ...opts}) => {
    wa.ddlBackup()

    tags.pageView({
      ...opts,
      name: _flatten([name]),
    })
  },

  modalOpen: (opts) => tags.overlayOpen(opts),
  loaderOpen: (opts) => tags.overlayOpen(opts),
  sliderOpen: (opts) => tags.overlayOpen(opts),

  /**
   * Spec: 5.1.5 - Overlay Page View (Close)
   */
  overlayClose: ({isReturning = true} = {}) => {
    wa.ddlRestore()

    setTimeout(() => {
      // set timeout enables support for ddl updates before refresh & page view
      ddl.refresh()

      if (isReturning === true) {
        wa.view()
      }
    })
  },

  modalClose: (opts) => tags.overlayClose(opts),
  loaderClose: (opts) => tags.overlayClose({...opts, isReturning: false}),
  sliderClose: (opts) => tags.overlayClose(opts),
  /**
   * Spec: 5.1.6.5 - Error & Notification Messages
   */
  ..._reduce(
    values.types.message,
    (messageTags, type) => ({
      ...messageTags,
      [_camelCase(`${type} message`)]: (message, cause) =>
        ddl.addMessage(type, message, cause),
    }),
    {},
  ),

  /**
   * Spec: 5.2.1.1 - User Input
   */
  userInput: ({label, message, isValid}) => {
    ddl.addUserInput(label, message, isValid, false)
    wa.action(values.types.action.INPUT)
  },

  /**
   * Spec: 5.2 - Page Interactions
   */
  ..._reduce(
    values.types.interaction,
    (interactionTags, type, interaction) => ({
      ...interactionTags,
      [_camelCase(`${interaction} interaction`)]: (label) => {
        ddl.addInteraction(type, label)
        wa.action(
          values.types.action[interaction] || values.types.action.DEFAULT,
        )
      },
    }),
    {},
  ),

  /**
   * This submit interaction handles NEL standard behaviour
   * If there are form validation messages then these will be added as user error messages
   * In addition, if the submit is invalid, as controlled by the valid argument, which defaults to
   * the presence of error messages, then wa_view will again be called so that analytics is aware
   * that it is on the same view and has not progressed to the next view
   *
   * the cause would likely be the field name
   */
  submitInteractionWithValidation: ({
    label,
    messages = [],
    valid,
    analyticsValues,
  }) => {
    // add basic submit interaction
    ddl.addInteraction(values.types.action.SUBMIT, label)

    if (!_isEmpty(analyticsValues)) {
      tags.sendValuesToAdobe(analyticsValues)
    }

    const hasMessages = !!_size(messages)

    //  add any validation messages

    messages.forEach(({message, cause}) => {
      ddl.replaceMessage(values.types.message.USER, message, cause)
    })

    wa.action('form_submission')

    // determine whether should fire wa_view, normally because submit operation failed
    const shouldRefreshView = _isUndefined(valid) ? hasMessages : !valid

    if (shouldRefreshView) {
      wa.view()
    }
  },

  /**
   * If field values are to be added for the analytics then use this function
   * @param {object} vals the values to be added to the ddl object
   * @param {string[]} accessors the fields to be added to the ddl object. They use `_get` for accessing nested properties
   *
   * @example
   * sendValuesToAdobe({
   *  mortgageLength: { years: 10, months: 5 },
   *  ltv: 70,
   *  loanAmount: 150000
   *  })
   */
  sendValuesToAdobe: (vals) => {
    const tagVals = _mapKeys(
      vals,
      (_, key) => _snakeCase(_replace(key, /\./g, ' ')),
      {},
    )

    ddl.updateMortgageObject(tagVals)
  },
}

/**
 * Spec: 5.2.4.1 - Condition 1 (only tag first interaction)
 */
tags.helpInteraction = _memoize(tags.helpInteraction)

/**
 * Spec: 5.2.3.1 - Fig. 7 (only tag reveal)
 */
const {revealInteraction} = tags
tags.revealInteraction = (label, isHiding) =>
  !isHiding && revealInteraction(label)

/**
 * Create view tag handler
 * @param {function} type
 * @param {object} opts
 */
const createViewTagHandler = (scenarioTag, tagOptions) => {
  const tagHandler = (opts) => {
    scenarioTag(_defaults(opts, tagOptions))
  }

  tagHandler.tagOptions = tagOptions

  return tagHandler
}

/**
 * Create view tags handler functions from scenario tags
 * @param {object} tagScenarios
 * @returns {object} tags
 */
export const createViewTags = (tagScenarios) =>
  _reduce(
    tagScenarios,
    (viewTags, {type, ...opts}, name) => ({
      ...viewTags,
      [name]: createViewTagHandler(type, opts),
    }),
    {},
  )

/**
 * Wrapper got link interaction, workaround for TS checking
 * as TS can't infer type from dynamically interactions
 * @param {string} message
 */

export const handleLinkInteraction = (message) => {
  tags.linkInteraction(message)
}

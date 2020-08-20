import {useRef, useEffect, useMemo} from 'react'

import _assign from 'lodash/assign'
import _includes from 'lodash/includes'

import {loadStart, getPageName, getEntryRoute} from '@analytics/utils'

import tags, {createViewTags} from '@analytics/tags'
import ddl from '@analytics/ddl'
import {
  useDidMount,
  useWillMount,
  useWillUnmount,
  useDidUpdate,
} from './generic'

/**
 * @description
 * Hook to generate businessErrorMessage analytics tag event if the passed in listener
 * changes to a truthy value. The listener can only be a single boolean value
 *
 * @param {{listener: boolean, message: string, cause: string}} param0
 */
export const useBusinessErrorMessage = ({listener, message, cause}) => {
  const didMountRef = useRef(false)

  useEffect(() => {
    if (didMountRef.current && listener) {
      tags.businessErrorMessage(message, cause)
    } else {
      didMountRef.current = true
    }
  }, [listener])
}

/**
 * @description
 * Hook to tag the page views on did mount, including a loading time measurement -
 * this generic component should be able handle all cases
 *
 * How it works
 * ------------
 * `createViewTags` is called when the component is instantiated, but the `useMemo` prevents it being called on following
 * renders - we couldn't use `componentWillMount` in this because it doesn't return a value, and we need the returned tag for
 * the `useDidMount` phase
 *
 * `useWillMount` is a generic hook that does the same thing, but will not return a value, so is used to start the timing
 *
 * `useDidMount` happens a bit later in the cycle (on the `componentDidMount` phase) and is used to call the analytics event
 * and compare the time with the time started in in the `useWillMount`
 *
 * `useWillUnmount` is called as the component is unmounted - not for views, but for overlays and modals this is
 * important
 *
 * @param {{analyticsTag: string, type: string, toggle?: boolean, bailout: boolean}} param0
 * analyticsTag - string value to appear as analytics label
 * type - pageView | modal | overlay
 * toggle if the component should also have a close event
 * bailout prop passed in to abort any analytics activity
 */

export const useAnalytics = ({analyticsTag, type, toggle, bailout = false}) => {
  const closeable = _includes(['modal', 'overlay', 'slider'], type)
  const controllableByToggle = _includes(['slider'], type)

  const tag = useMemo(
    () =>
      createViewTags({
        open: {
          type: tags[closeable ? `${type}Open` : type],
          name: [analyticsTag],
        },

        ...(closeable && {
          close: {
            type: tags[`${type}Close`],
            name: [analyticsTag],
          },
        }),
      }),
    [analyticsTag],
  )

  useWillMount(() => {
    if (!bailout) {
      loadStart(getPageName(tag.open.tagOptions.name))
    }
  })

  useDidMount(() => {
    if (!bailout && !controllableByToggle) {
      tag.open()
    }
  })

  useDidUpdate(() => {
    if (bailout || !controllableByToggle) return

    if (toggle) {
      tag.open()
    } else {
      tag.close()
    }
  }, [toggle])

  useWillUnmount(() => {
    if (!bailout && closeable && !controllableByToggle) {
      tag.close()
    }
  })
}

export const useJourneyData = (caseId, partyId, loginCase, accountCount) => {
  ddl.update('nbs_user', {
    nbs_journey_id: caseId,
    nbs_user_customer_number: partyId,
  })

  ddl.update('nbs_app_mortgage', {
    application_id: loginCase,
    existing_mortgage_valid_overpayment_count: accountCount,
  })
}

/**
 * Analytics hook for page views - accepts the string value
 * @param {string} analyticsTag
 * @param {boolean} [bailout]
 */
export const usePageViewAnalytics = (analyticsTag, bailout) =>
  useAnalytics({analyticsTag, type: 'pageView', bailout})

/**
 * Use this hook for adding  overlay analytics
 * @param {string} analyticsTag
 * @param {boolean} bailout
 */
export const useOverlayAnalytics = (analyticsTag, bailout) => {
  useAnalytics({analyticsTag, type: 'overlay', bailout})
}

/**
 * Use this hook for adding  overlay analytics
 * @param {string} analyticsTag
 * @param {boolean} toggle
 * @param {boolean} bailout
 */
export const useSliderAnalytics = (analyticsTag, toggle, bailout) => {
  useAnalytics({analyticsTag, type: 'slider', toggle, bailout})
}

/**
 * Use this hook for adding  modal analytics
 * @param {string} analyticsTag
 * @param {boolean} bailout
 */
export const useModalAnalytics = (analyticsTag, bailout) =>
  useAnalytics({analyticsTag, type: 'modal', bailout})

/**
 * Sets the application route analytics state on the ddl object
 */
export const useInitialiseAnalytics = () => {
  useDidMount(() => {
    const applicationRoute = getEntryRoute()
    ddl.setUserApplicationRoute({applicationRoute})
  })
}

// Non hook based utility functions

/**
 *
 * @param {{label: string, noTag: boolean, error: string, tag?: {label: string, isValid: boolean, message: string}}} param0
 */
export const tagUserInteraction = ({label, noTag, error, tag}) => {
  if (!noTag) {
    const message = error || ''
    tags.userInput(_assign({label, message, isValid: !error}, tag))
  }
}

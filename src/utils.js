import _get from 'lodash/get'
import _map from 'lodash/map'
import _join from 'lodash/join'
import _trim from 'lodash/trim'
import _take from 'lodash/take'
import _find from 'lodash/find'
import _round from 'lodash/round'
import _concat from 'lodash/concat'
import _reduce from 'lodash/reduce'
import _compact from 'lodash/compact'
import _findKey from 'lodash/findKey'
import _toLower from 'lodash/toLower'
import _includes from 'lodash/includes'
import _isObject from 'lodash/isObject'
import _isUndefined from 'lodash/isUndefined'

import values from './values.json'

/**
 * Page name formatting
 * Tagging: Spec - 4.5.1.3
 */
export const getDdlText = (text) => _trim(_toLower(text || ''))

/**
 * Returns page name string from name sections array
 * Tagging: Spec - 4.5.1.3
 *
 * @param {array} sections
 * @returns {string} lowercase concatenated name sections
 */
export const toDdlName = (sections) =>
  _join(_compact(_map(sections, getDdlText)), ':')

/**
 * Returns page name sections using global and page specific sections
 * Tagging: Spec - 4.5.1.3
 *
 * @param {string|array} desc
 * @returns {array} page name sections
 */
export const getPageNameSections = (desc) => {
  const {PREFIX, TYPE, APP_NAME, APP_SUBNAME} = values.page
  return _concat(_compact([PREFIX, TYPE, APP_NAME, APP_SUBNAME]), desc)
}

export const getPageName = (desc) => toDdlName(getPageNameSections(desc))

export const getPageCategories = (desc) => {
  const pageNameSections = getPageNameSections(desc)

  return {
    nbs_sub_category_1: toDdlName(_take(pageNameSections, 2)),
    nbs_sub_category_2: toDdlName(_take(pageNameSections, 3)),
    nbs_sub_category_3: toDdlName(_take(pageNameSections, 4)),
  }
}

/**
 * Returns the region for ddl property
 * @param {string} property
 * @returns {string} region
 */
export const getPropertyRegion = (property) =>
  _findKey(
    values.regionProperties,
    (properties, region) => _includes(properties, property) && region,
  )

/**
 * Checks if property is context specific
 * @param {string} property
 * @return {bool}
 */
export const isContextProperty = (property) =>
  getPropertyRegion(property) === 'context'

/**
 * Checks if property is action specific
 * @param {string} property
 * @return {bool}
 */
export const isActionProperty = (property) =>
  getPropertyRegion(property) === 'action'

/**
 * Returns the key for a DDL item, if item or key not found returns key provided
 * @param {string} property
 * @param {string} item
 * @returns {string} DDL item property key
 */
export const getItemPropertyKey = (item, property) =>
  _get(values.itemsKeyMap, [item, property], property) || property

/**
 * Load time measuring
 * Tagging: Spec - 5.1.6.1, Req. - 1.2
 */
export const pageLoadTimes = {
  [getPageName(values.page.INITIAL)]: global.initialLoadStart,
}

const timeNow = () =>
  global?.performance?.now ? global?.performance?.now() : Date?.now()

export const loadStart = (pageName) => {
  const loadTime = timeNow()
  pageLoadTimes[pageName] = loadTime
  return loadTime
}

export const loadEnd = (pageName) => {
  const loadTime = _round(Math.abs(timeNow() - pageLoadTimes[pageName]))
  pageLoadTimes[pageName] = loadTime
  return loadTime
}

export const getEntryRoute = () => {
  const {
    referrer,
    location: {search},
  } = global.document
  const {referrers, urlParams} = values.valueMaps.routes
  const defaultRoute = referrers['^$']
  let entryRoute = _find(referrers, (_, pattern) =>
    new RegExp(pattern).test(referrer),
  )

  if (!entryRoute || entryRoute === defaultRoute) {
    entryRoute =
      _find(urlParams, (_, pattern) =>
        new RegExp(`[\\?&]${pattern}=`, 'i').test(search),
      ) || entryRoute
  }

  return entryRoute || defaultRoute
}

/**
 * Technical service data
 * Tagging: Spec - 5.1.6.1, Req. - 1.2
 */
export const getServiceData = (env) => ({
  nbs_environment: env,
  nbs_server: global.location.origin,
})

/**
 * Device data
 * Tagging: Spec - 5.1.6.1, Req. - 1.3
 */
export const getDeviceData = ({width, height}) => {
  const {orientations, sizes} = values.page

  let orientation
  let state

  switch (width % height) {
    case 0:
      orientation = orientations.SQUARE
      break
    case width:
      orientation = orientations.PORTRAIT
      break
    default:
      orientation = orientations.LANDSCAPE
      break
  }

  if (width <= 480) state = sizes.SMALL
  else if (width <= 768) state = sizes.MEDIUM
  else state = sizes.LARGE

  return {
    nbs_page_responsive_orientation: orientation,
    nbs_page_responsive_state: state,
  }
}

/**
 * converts formik error data structure to analytics message structure
 */
export const formatFormikErrors = (formikErrors) => {
  const getMappedErrors = (err, curPath) =>
    _reduce(
      err,
      (acc, val, key) => {
        const path = !_isUndefined(curPath) ? `${curPath}.${key}` : key

        if (_isObject(val)) {
          return {...acc, ...getMappedErrors(val, path)}
        }

        return {
          ...acc,
          [path]: val,
        }
      },
      {},
    )

  const errors = getMappedErrors(formikErrors)

  return _map(errors, (message, cause) => ({message, cause}))
}

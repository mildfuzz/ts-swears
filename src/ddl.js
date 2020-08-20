import _get from 'lodash/get'
import _set from 'lodash/set'
import _pick from 'lodash/pick'
import _mapKeys from 'lodash/mapKeys'
import _cloneDeep from 'lodash/cloneDeep'
import _defaultsDeep from 'lodash/defaultsDeep'
import _uniqBy from 'lodash/uniqBy'

import * as utils from './utils'
import values from './values.json'

const {valueMaps, regionProperties} = values
const getInitialViewData = () =>
  _defaultsDeep(
    {},
    _pick(values.ddl, regionProperties.view, regionProperties.action),
  )

const contextData = _defaultsDeep(
  {},
  _pick(values.ddl, regionProperties.context),
)
let viewData = getInitialViewData()

/**
 * Internal API
 */
const ddl = {
  /**
   * Get property data source
   * @param {string} property
   */
  getSource: (property) => {
    if (utils.isContextProperty(property)) return contextData
    if (utils.isActionProperty(property) || property === 'page')
      return global.digitalData
    return viewData
  },

  /**
   * Get data from ddl
   * @param {string} property
   */
  get: (property) => _get(ddl.getSource(property), property),

  /**
   * Create new ddl
   * @param {object} data
   */
  create: (data) => {
    global.digitalData = _cloneDeep(
      _defaultsDeep(data, _cloneDeep(contextData), viewData),
    )
    viewData = getInitialViewData()
  },

  /**
   * Merge contextual data with ddl
   */
  refresh: () => {
    global.digitalData = _defaultsDeep(
      {},
      _cloneDeep(contextData),
      global.digitalData,
    )
  },

  /**
   * Update existing ddl data
   * @param {string} property
   * @param {*} data
   */
  update: (property, newData, applyDefaults = true) => {
    const source = ddl.getSource(property)
    const data = applyDefaults
      ? _defaultsDeep(_cloneDeep(newData), ddl.get(property))
      : _cloneDeep(newData)
    _set(source, property, data)
  },

  /**
   * Add ddl item to a ddl array - new items are always at head
   * @param {string} itemProperty
   * @param {*} item
   */
  add: (itemProperty, item, applyDefaults = true) => {
    const ddlItems = ddl.get(itemProperty) || []
    const ddlItem = _mapKeys(item, (_, property) =>
      utils.getItemPropertyKey(itemProperty, property),
    )

    ddl.update(itemProperty, [ddlItem, ...ddlItems], applyDefaults)
  },

  /**
   * Add ddl item to a ddl array - new items are always at head
   * @param {string} itemProperty
   * @param {*} item
   */
  replace: (itemProperty, item, applyDefaults = true) => {
    const ddlItems = ddl.get(itemProperty) || []
    const ddlItem = _mapKeys(item, (_, property) =>
      utils.getItemPropertyKey(itemProperty, property),
    )

    const messages = _uniqBy([ddlItem, ...ddlItems], 'cause')

    ddl.update(itemProperty, messages, applyDefaults)
  },
}

export default {
  /**
   * spec - 5.1.6.1
   * @param {string|array} desc
   */
  ...ddl,

  setPage: (desc, isProd = false) => {
    const {getPageName} = utils
    const pageName = getPageName(desc)
    const category = ''

    ddl.create({
      page: {
        pageInfo: {
          pageName,
          nbs_page_load_time: utils.loadEnd(pageName),
          ...utils.getDeviceData({
            width: global.innerWidth,
            height: global.innerHeight,
          }),
        },
        category,
        ...utils.getServiceData(isProd ? 'live' : 'dev'),
      },
    })
  },

  updatePageName: (desc) => {
    const {getPageName} = utils
    const pageName = getPageName(desc)
    const category = ''

    ddl.update('page', {
      pageInfo: {
        pageName,
      },
      category,
    })

    ddl.refresh()
  },

  setUserApplicationRoute: ({applicationRoute}) => {
    ddl.update('nbs_user', {
      nbs_user_application_route: utils.getDdlText(applicationRoute),
    })
  },

  /**
   * Spec: 5.1.6.5
   */
  addMessage: (category, text, cause) => {
    ddl.add('nbs_message', {
      category: utils.getDdlText(category),
      text: utils.getDdlText(text),
      cause: utils.getDdlText(cause),
    })
  },

  replaceMessage: (category, text, cause) => {
    ddl.replace('nbs_message', {
      category: utils.getDdlText(category),
      text: utils.getDdlText(text),
      cause: utils.getDdlText(cause),
    })
  },

  /**
   * Spec: 5.2.1.2
   */
  addUserInput: (name, message, isValid = null, applyDefaults = true) => {
    ddl.add(
      'nbs_user_input',
      {
        name: utils.getDdlText(name),
        message: utils.getDdlText(message),
        status: valueMaps.inputValidity[isValid],
      },
      applyDefaults,
    )
  },

  /**
   * Spec: 5.2.X.3
   */
  addInteraction: (type, label) => {
    ddl.add('nbs_element_interaction', {
      type: utils.getDdlText(type),
      label: utils.getDdlText(label),
    })
  },

  updateMortgageObject: (analyticsValues) =>
    ddl.update('nbs_app_mortgage', analyticsValues),
  /**
   * Additional utilities
   */
  refresh: () => ddl.refresh(),
}

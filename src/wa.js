/* eslint-disable no-console */
import _cloneDeep from 'lodash/cloneDeep'
import _isFunction from 'lodash/isFunction'
/**
 * Web Analytic Functions
 */
export const safely = (fn, name, ...args) => {
  if (_isFunction(fn)) {
    try {
      fn(...args)
      console.log(name, ...args)
    } catch (err) {
      console.error(err)
    }
  } else {
    console.error(name, 'not available')
  }
}
const wa = {
  view: null,
  action: null,
  restore: null,
  backup: null,
}
const isDev = process.env.NODE_ENV === 'development'

// const isDev = false
if (isDev) {
  let ddlBackup = null
  wa.view = () => console.info('wa_view', _cloneDeep(global.digitalData))
  wa.action = (...args) => {
    console.info('wa_action', _cloneDeep(global.digitalData), ...args)
  }
  wa.ddlRestore = () => {
    global.digitalData = ddlBackup
    ddlBackup = null
    console.info('ddl_restore', _cloneDeep(global.digitalData))
  }
  wa.ddlBackup = () => {
    ddlBackup = _cloneDeep(global.digitalData)
    console.info('ddl_backup', ddlBackup)
  }
  global.digitalData = {}
  console.log('DDL created', !!global.digitalData)
} else {
  wa.view = (...args) => safely(global.wa_view, 'wa_view', ...args)
  wa.action = (...args) => safely(global.wa_action, 'wa_action', ...args)
  wa.ddlBackup = (...args) => safely(global.ddl_backup, 'ddl_backup', ...args)
  wa.ddlRestore = (...args) =>
    safely(global.ddl_restore, 'ddl_restore', ...args)

  global.digitalData = {}
}
export default wa

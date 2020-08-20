// eslint-disable-next-line import/no-extraneous-dependencies
import {AnyFunction} from 'tsdef'

type TagScenario = {
  type: () => void
  options: {type: string; name: string}
}

type DefaultOptions = Record<string, unknown>

export declare const tags: {
  pageView: (props: {name: string}) => void
  pageNameUpdateView: (description: string) => void
  overlayOpen: (props: {name: string} & DefaultOptions) => void
  modalOpen: (options?: DefaultOptions) => void
  modalClose: (options?: DefaultOptions) => void
  loaderOpen: (options?: DefaultOptions) => void
  sliderOpen: (options?: DefaultOptions) => void
  userInput: (args: {label: string; message: string; isValid: boolean}) => void
  sendValuesToAdobe: (vals: Record<string, unknown>) => void
  submitInteractionWithValidation: (props: {
    label: string
    messages?: {message: string; cause: string}[]
    valid?: boolean
    analyticsValues?: Record<string, unknown>
  }) => void
  revealInteraction: (label: string) => void
  externalLinkInteraction: (label: string) => void
  submitInteraction: (label: string) => void
  helpIconInteraction: (label: string) => void
  printInteraction: (label: string) => void
  savePdfInteraction: (label: string) => void
  callInteraction: (label: string) => void
  backInteraction: (label: string) => void
  miscInteraction: (label: string) => void
  businessErrorMessage: (message: string, cause: string) => void
  systemErrorMessage: (message: string, cause: string) => void
  userErrorMessage: (message: string, cause: string) => void
  notificationMessage: (message: string, cause: string) => void
}
export function createViewTags<
  T extends Record<string, TagScenario>,
  U extends {[key in keyof T]: AnyFunction}
>(tagScenarios: T): U

export function handleLinkInteraction(message: string): void

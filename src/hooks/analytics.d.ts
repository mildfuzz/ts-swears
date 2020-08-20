type AnalyticsType = 'pageView' | 'slider' | 'modal' | 'overlay'



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
 * @param {{analyticsTag: string, type: string, closeable?: boolean, bailout: boolean}} param0
 * analyticsTag - string value to appear as analytics label
 * type - pageView | modal | overlay | slider
 * bailout prop passed in to abort any analytics activity, when you wish to prevent a tag from firing too frequently
 */
export function useAnalytics(props:  {analyticsTag: string, type: AnalyticsType, toggle: boolean, bailout?: boolean}): void


export function usePageViewAnalytics(analyticsTag: string, bailout?:boolean): void
export function useOverlayAnalytics(analyticsTag: string, bailout?:boolean): void
export function useSliderAnalytics(analyticsTag: string, bailout?:boolean): void

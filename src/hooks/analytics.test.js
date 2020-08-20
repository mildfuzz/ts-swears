import {renderHook} from '@testing-library/react-hooks'
import {act, cleanup} from '@testing-library/react'

import * as utils from '@analytics/utils'

import tags from '@analytics/tags'
import ddl from '@analytics/ddl'
import {
  useBusinessErrorMessage,
  useAnalytics,
  usePageViewAnalytics,
  useModalAnalytics,
  useOverlayAnalytics,
  useInitialiseAnalytics,
  useSliderAnalytics,
  tagUserInteraction,
} from './analytics'

beforeEach(jest.clearAllMocks)

describe('useBusinessErrorMessage', () => {
  jest.spyOn(tags, 'businessErrorMessage').mockImplementation()

  afterEach(cleanup)

  const initialProps = {
    listener: false,
    message: 'there has been a business error',
    cause: 'caused by negligence',
  }

  test('it should not do an anything on the first call', () => {
    renderHook(() => useBusinessErrorMessage(initialProps))
    expect(tags.businessErrorMessage).not.toHaveBeenCalled()
  })

  test('it should not do an anything on the first call even if truthy listener', () => {
    renderHook(() => useBusinessErrorMessage({...initialProps, listener: true}))
    expect(tags.businessErrorMessage).not.toHaveBeenCalled()
  })

  test('it should not call tag if the second call listener is falsy', () => {
    renderHook(() => useBusinessErrorMessage(initialProps))
    const {rerender} = renderHook((props) => useBusinessErrorMessage(props), {
      initialProps,
    })

    rerender({
      ...initialProps,
      listener: false,
    })

    expect(tags.businessErrorMessage).not.toHaveBeenCalled()
  })

  test('it should not call tag if the second call listener is falsy even though previously it was truthy', () => {
    renderHook(() => useBusinessErrorMessage(initialProps))
    const {rerender} = renderHook((props) => useBusinessErrorMessage(props), {
      initialProps: {...initialProps, listener: true},
    })

    rerender({
      ...initialProps,
      listener: false,
    })

    expect(tags.businessErrorMessage).not.toHaveBeenCalled()
  })

  test('it should call tag businessErrorMessage if the second call listener is truthy', () => {
    renderHook(() => useBusinessErrorMessage(initialProps))
    const {rerender} = renderHook((props) => useBusinessErrorMessage(props), {
      initialProps,
    })

    rerender({
      ...initialProps,
      listener: true,
    })

    expect(tags.businessErrorMessage).toHaveBeenCalledWith(
      'there has been a business error',
      'caused by negligence',
    )
  })
})

describe('useAnalytics', () => {
  afterEach(jest.clearAllMocks)

  test('it should call the generated tag load start on mount', () => {
    const {rerender} = renderHook(() =>
      useAnalytics({analyticsTag: 'test details', type: 'pageView'}),
    )

    act(() => rerender())

    expect(utils.loadStart).toHaveBeenCalledWith(
      'nbs-aws:application:overpayment:test details',
    )
    expect(utils.loadStart).toHaveBeenCalledTimes(1)
  })

  afterEach(jest.clearAllMocks)

  test('it should call the generated close tag on unmount if of closeable type', () => {
    const {rerender, unmount} = renderHook(() =>
      useAnalytics({analyticsTag: 'test modal tag', type: 'modal'}),
    )

    act(() => rerender())

    expect(utils.loadStart).toHaveBeenCalledWith(
      'nbs-aws:application:overpayment:test modal tag',
    )
    expect(utils.loadStart).toHaveBeenCalledTimes(1)

    expect(tags.modalOpen).toHaveBeenCalledWith({name: ['test modal tag']})
    act(() => unmount())

    expect(tags.modalClose).toHaveBeenCalledWith({name: ['test modal tag']})
  })

  test('it should call the correct tag on mount, but there should be no corresponding unmount command for unmounting a non closeable view', () => {
    jest.spyOn(tags, 'pageView')
    const {rerender, unmount} = renderHook(() =>
      useAnalytics({analyticsTag: 'test page view', type: 'pageView'}),
    )

    act(() => rerender())

    expect(utils.loadStart).toHaveBeenCalledWith(
      'nbs-aws:application:overpayment:test page view',
    )
    expect(utils.loadStart).toHaveBeenCalledTimes(1)

    expect(tags.pageView).toHaveBeenCalledWith({name: ['test page view']})
    act(() => unmount())

    expect(tags.pageViewClose).toBe(undefined)
  })

  test('it should call open and close when the toggle changes if it is a controllableByToggle type of analytics event', () => {
    jest.spyOn(tags, 'sliderOpen')
    jest.spyOn(tags, 'sliderClose')
    const {rerender} = renderHook((props) => useAnalytics(props), {
      initialProps: {
        analyticsTag: 'test slider view',
        type: 'slider',
        toggle: false,
      },
    })

    expect(tags.sliderOpen).not.toHaveBeenCalled()
    expect(tags.sliderClose).not.toHaveBeenCalled()
    act(() =>
      rerender({
        analyticsTag: 'test slider view',
        type: 'slider',
        toggle: true,
      }),
    )

    expect(tags.sliderOpen).toHaveBeenCalledTimes(1)
    expect(tags.sliderClose).not.toHaveBeenCalled()

    act(() =>
      rerender({
        analyticsTag: 'test slider view',
        type: 'slider',
        toggle: false,
      }),
    )
    expect(tags.sliderOpen).toHaveBeenCalledTimes(1)
    expect(tags.sliderClose).toHaveBeenCalledTimes(1)
  })

  test('it should not respond to didUpdate of not controllableByToggle', () => {
    jest.spyOn(tags, 'modalOpen')
    jest.spyOn(tags, 'modalClose')
    const {rerender, unmount} = renderHook((props) => useAnalytics(props), {
      initialProps: {
        analyticsTag: 'test modal view',
        type: 'modal',
        toggle: false,
      },
    })

    expect(tags.modalOpen).toHaveBeenCalledTimes(1)
    expect(tags.modalClose).not.toHaveBeenCalled()
    act(() =>
      rerender({analyticsTag: 'test slider view', type: 'modal', toggle: true}),
    )

    expect(tags.modalOpen).toHaveBeenCalledTimes(1)
    expect(tags.modalClose).not.toHaveBeenCalled()

    act(() =>
      rerender({
        analyticsTag: 'test slider view',
        type: 'modal',
        toggle: false,
      }),
    )
    expect(tags.modalOpen).toHaveBeenCalledTimes(1)
    expect(tags.modalClose).not.toHaveBeenCalled()

    act(() => unmount())
    expect(tags.modalOpen).toHaveBeenCalledTimes(1)
    expect(tags.modalClose).toHaveBeenCalledTimes(1)
  })

  test('it should not do any analytics events if the bailout property is truee', () => {
    jest.spyOn(tags, 'modalOpen')
    jest.spyOn(tags, 'modalClose')
    const {rerender, unmount} = renderHook((props) => useAnalytics(props), {
      initialProps: {
        analyticsTag: 'test modal view',
        type: 'modal',
        toggle: false,
        bailout: true,
      },
    })

    expect(tags.modalOpen).toHaveBeenCalledTimes(0)
    expect(tags.modalClose).not.toHaveBeenCalled()
    act(() =>
      rerender({
        analyticsTag: 'test slider view',
        type: 'modal',
        toggle: true,
        bailout: true,
      }),
    )

    expect(tags.modalOpen).toHaveBeenCalledTimes(0)
    expect(tags.modalClose).not.toHaveBeenCalled()

    act(() =>
      rerender({
        analyticsTag: 'test slider view',
        type: 'modal',
        toggle: false,
        bailout: true,
      }),
    )
    expect(tags.modalOpen).toHaveBeenCalledTimes(0)
    expect(tags.modalClose).not.toHaveBeenCalled()

    act(() => unmount())
    expect(tags.modalOpen).toHaveBeenCalledTimes(0)
    expect(tags.modalClose).toHaveBeenCalledTimes(0)
  })
})

describe('usePageViewAnalytics', () => {
  jest.spyOn(utils, 'loadStart')

  afterEach(jest.clearAllMocks)

  test('it should call the generate load start tag on mount', () => {
    const {rerender} = renderHook(() =>
      usePageViewAnalytics('test details view'),
    )

    act(() => rerender())

    expect(utils.loadStart).toHaveBeenCalledWith(
      'nbs-aws:application:overpayment:test details view',
    )
    expect(utils.loadStart).toHaveBeenCalledTimes(1)
    expect(tags.pageView).toHaveBeenCalledWith({name: ['test details view']})
  })
})

describe('useModalAnalytics', () => {
  jest.spyOn(tags, 'modalOpen')
  jest.spyOn(tags, 'modalClose')

  afterEach(jest.clearAllMocks)

  test('should call the modalOpen tag on mount and close on unmount', () => {
    const {rerender, unmount} = renderHook(() =>
      useModalAnalytics('test modal tag'),
    )

    act(() => rerender())

    expect(tags.modalOpen).toHaveBeenCalledWith({name: ['test modal tag']})

    act(() => unmount())

    expect(tags.modalClose).toHaveBeenCalledWith({name: ['test modal tag']})
  })
})

describe('useOverlayAnalytics', () => {
  jest.spyOn(tags, 'overlayOpen')
  jest.spyOn(tags, 'overlayClose')

  afterEach(jest.clearAllMocks)

  test('should call the overlayOpen tag on mount and overlayClose on unmount', () => {
    const {rerender, unmount} = renderHook(() =>
      useOverlayAnalytics('test overlay tag'),
    )

    act(() => rerender())

    expect(tags.overlayOpen).toHaveBeenCalledWith({name: ['test overlay tag']})

    act(() => unmount())

    expect(tags.overlayClose).toHaveBeenCalledWith({name: ['test overlay tag']})
  })
})

describe('useSliderAnalytics', () => {
  jest.spyOn(tags, 'sliderOpen')
  jest.spyOn(tags, 'sliderClose')

  afterEach(jest.clearAllMocks)

  test('should call the sliderOpen when the toggle is true (after initial render) and sliderClose when toggle is closd', () => {
    let toggle = false
    const {rerender} = renderHook(() =>
      useSliderAnalytics('slider component tag', toggle),
    )

    toggle = true

    act(() => rerender())

    expect(tags.sliderOpen).toHaveBeenCalledWith({
      name: ['slider component tag'],
    })
    expect(tags.sliderOpen).toHaveBeenCalledTimes(1)
    expect(tags.sliderClose).toHaveBeenCalledTimes(0)
    toggle = false

    act(() => rerender())

    expect(tags.sliderClose).toHaveBeenCalledWith({
      name: ['slider component tag'],
    })
    expect(tags.sliderOpen).toHaveBeenCalledTimes(1)
    expect(tags.sliderClose).toHaveBeenCalledTimes(1)
  })
})

describe('useInitialiseAnalytics', () => {
  jest.spyOn(utils, 'getEntryRoute').mockReturnValue('external')
  jest.spyOn(ddl, 'setUserApplicationRoute')

  test('should call setUserApplicationRoute on didMount and only then', () => {
    const {rerender} = renderHook(() => useInitialiseAnalytics())

    act(() => rerender())

    expect(ddl.setUserApplicationRoute).toHaveBeenCalledWith({
      applicationRoute: 'external',
    })
    expect(ddl.setUserApplicationRoute).toHaveBeenCalledTimes(1)
  })
})

describe('tagUserInteraction', () => {
  jest.spyOn(tags, 'userInput').mockImplementation()

  test('calls tags.userInput with correct arguments if noTag is falsy', () => {
    tagUserInteraction({label: 'test input', noTag: false, error: 'an error'})
    expect(tags.userInput.mock.calls).toMatchSnapshot()
  })

  test('calls tags.userInput with error defaulted to empty string', () => {
    tagUserInteraction({label: 'test input', noTag: false})
    expect(tags.userInput.mock.calls).toMatchSnapshot()
  })

  test('should not call tags.userInput if noTag is truthy', () => {
    tagUserInteraction({label: 'test input', noTag: true, error: 'an error'})
    expect(tags.userInput).not.toHaveBeenCalled()
  })
})

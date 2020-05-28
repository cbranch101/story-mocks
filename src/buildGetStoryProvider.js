import React, {useMemo} from 'react'

const buildGetStoryProvider = (applyMock, context) => (
  baseWrappers,
  mockOptions,
) => {
  const {Provider} = context
  const Api = ({api: mockedApi, children}) => {
    const api = useMemo(() => applyMock(mockedApi, mockOptions), [mockedApi])
    return <Provider value={api}>{children}</Provider>
  }
  const wrappers = [
    ...baseWrappers,
    {
      component: Api,
      shouldWrap: props => !!props.api,
    },
  ]
  return props => {
    const {children, ...remainingProps} = props
    return wrappers.reduceRight((memo, mock) => {
      const {component: Component, shouldWrap} = mock
      if (!shouldWrap(remainingProps)) {
        return memo
      }
      return <Component {...remainingProps} children={memo} />
    }, children)
  }
}

export default buildGetStoryProvider

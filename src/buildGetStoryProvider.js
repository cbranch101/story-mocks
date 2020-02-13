import React, {useMemo} from 'react'

const buildGetStoryProvider = applyMock => (baseWrappers, mockOptions) => {
  const Api = ({api: mockedApi, children}) => {
    useMemo(() => {
      applyMock(mockedApi, mockOptions)
    }, [mockedApi])
    return children
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
        return children
      }
      return <Component {...remainingProps} children={memo} />
    }, children)
  }
}

export default buildGetStoryProvider

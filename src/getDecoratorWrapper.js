import React from 'react'

const getDecoratorWrapper = ({StoryProvider}) => {
  return (storyFn, context) => {
    const {parameters = {}} = context
    const {mocks} = parameters
    return <StoryProvider {...mocks}>{storyFn(context)}</StoryProvider>
  }
}

export default getDecoratorWrapper

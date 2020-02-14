import React from 'react'
import {getMocksFromStoryContext} from './helpers'

const getDecoratorWrapper = ({StoryProvider}) => {
  return (storyFn, context) => {
    const mocks = getMocksFromStoryContext(context)
    return <StoryProvider {...mocks}>{storyFn(context)}</StoryProvider>
  }
}

export default getDecoratorWrapper

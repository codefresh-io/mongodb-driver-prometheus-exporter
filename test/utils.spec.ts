import { describe, expect, test } from '@jest/globals'

import { ConsoleLogger, mergeLabelNamesWithStandardLabels, mergeLabelsWithStandardLabels } from '../src/utils'

describe('ConsoleLogger', () => {
  let consoleLogger: ConsoleLogger

  beforeEach(() => {
    consoleLogger = new ConsoleLogger()
    jest.spyOn(console, 'log')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should log an info message', () => {
    consoleLogger.info('Info message')
    expect(console.log).toHaveBeenCalledWith('Info message')
  })

  test('should log a warning message', () => {
    consoleLogger.warn('Warning message')
    expect(console.log).toHaveBeenCalledWith('Warning message')
  })

  test('should log an error message', () => {
    consoleLogger.error('Error message')
    expect(console.log).toHaveBeenCalledWith('Error message')
  })
})

describe('tests mergeLabelNamesWithStandardLabels', () => {
  const defaultLabels = { foo: 'bar', alice: 3 }
  const labels = ['label1', 'label2']
  const emptylabels = []

  test('test mergeLabelNamesWithStandardLabels with no default labels', () => {
    expect(mergeLabelNamesWithStandardLabels(labels)).toStrictEqual(labels)
  })

  test('test mergeLabelNamesWithStandardLabels with empty labels and no default labels', () => {
    expect(mergeLabelNamesWithStandardLabels(emptylabels)).toStrictEqual([])
  })

  test('test mergeLabelNamesWithStandardLabels with default labels', () => {
    expect(mergeLabelNamesWithStandardLabels(labels, defaultLabels)).toStrictEqual(['label1', 'label2', 'foo', 'alice'])
  })

  test('test mergeLabelNamesWithStandardLabels with empty labels and default labels', () => {
    expect(mergeLabelNamesWithStandardLabels(emptylabels, defaultLabels)).toStrictEqual(['foo', 'alice'])
  })
})

describe('tests mergeLabelsWithStandardLabels', () => {
  const defaultLabels = { foo: 'bar', alice: 3 }
  const labels = { label1: 'value1', label2: 2, label3: undefined }
  const emptyLabels = {}

  test('test mergeLabelsWithStandardLabels with labels and no default labels', () => {
    expect(mergeLabelsWithStandardLabels(labels)).toStrictEqual({ label1: 'value1', label2: 2 })
  })

  test('test mergeLabelsWithStandardLabels with empty labels and no default labels', () => {
    expect(mergeLabelsWithStandardLabels(emptyLabels)).toStrictEqual(emptyLabels)
  })

  test('test mergeLabelsWithStandardLabels with labels and default labels', () => {
    expect(mergeLabelsWithStandardLabels(labels, defaultLabels)).toStrictEqual({ label1: 'value1', label2: 2, foo: 'bar', alice: 3 })
  })

  test('test mergeLabelsWithStandardLabels with empty labels and default labels', () => {
    expect(mergeLabelsWithStandardLabels(emptyLabels, defaultLabels)).toStrictEqual(defaultLabels)
  })
})

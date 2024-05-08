import { beforeEach, describe, expect, test } from '@jest/globals'
import { MongoClient } from 'mongodb'
import { Registry } from 'prom-client'

import { MongoDBDriverExporter } from '../src/mongoDBDriverExporter'

const poolMetrics: string[] = [
  'mongodb_driver_pool_size', 'mongodb_driver_pool_min', 'mongodb_driver_pool_max',
  'mongodb_driver_pool_checkedout', 'mongodb_driver_pool_waitqueuesize'
]

const commandMetrics: string[] = [
  'mongodb_driver_commands_seconds'
]

const allMetrics: string[] = poolMetrics.concat(commandMetrics)

const connectionEvents: string[] = [
  'connectionPoolCreated', 'connectionPoolClosed', 'connectionCreated', 'connectionClosed', 'connectionCheckOutStarted',
  'connectionCheckedOut', 'connectionCheckOutFailed', 'connectionCheckedIn'
]

const commandEvents: string[] = [
  'commandSucceeded', 'commandFailed'
]

const allEvents: string[] = connectionEvents.concat(commandEvents)

describe('tests mongoDBDriverExporter with real mongo client', () => {
  let register: Registry

  beforeEach(() => {
    register = new Registry()
  })

  test('connection and commands metrics are registered in registry', () => {
    const mongoClient = new MongoClient('mongodb://localhost:27017', { monitorCommands: true })
    // eslint-disable-next-line no-new
    new MongoDBDriverExporter(mongoClient, register)
    expect(register.getMetricsAsArray()).toHaveLength(6)
    expect(register.getSingleMetric('mongodb_driver_pool_size')).toBeDefined()
    expect(register.getSingleMetric('mongodb_driver_pool_min')).toBeDefined()
    expect(register.getSingleMetric('mongodb_driver_pool_max')).toBeDefined()
    expect(register.getSingleMetric('mongodb_driver_pool_checkedout')).toBeDefined()
    expect(register.getSingleMetric('mongodb_driver_pool_waitqueuesize')).toBeDefined()
    expect(register.getSingleMetric('mongodb_driver_commands_seconds')).toBeDefined()
  })

  test('connection and commands metrics are registered in registry with optional configurations', () => {
    const mongoClient = new MongoClient('mongodb://localhost:27017', { monitorCommands: true })
    const options = {
      mongodbDriverCommandsSecondsHistogramBuckets: [0.001, 0.005, 0.010, 0.020, 0.030, 0.040, 0.050, 0.100, 0.200, 0.500, 1.0, 2.0, 5.0, 20],
      defaultLabels: { foo: 'bar', alice: 2 }
    }
    // eslint-disable-next-line no-new
    new MongoDBDriverExporter(mongoClient, register, options)
    expect(register.getMetricsAsArray()).toHaveLength(allMetrics.length)
    allMetrics.forEach(metric => {
      expect(register.getSingleMetric(metric)).toBeDefined()
    })
  })

  test('only connection metrics are registered in registry', () => {
    const mongoClient = new MongoClient('mongodb://localhost:27017', { monitorCommands: false })
    const exporter = new MongoDBDriverExporter(mongoClient, register)
    exporter.enableMetrics()
    expect(register.getMetricsAsArray()).toHaveLength(poolMetrics.length)
    poolMetrics.forEach(metric => {
      expect(register.getSingleMetric(metric)).toBeDefined()
    })
  })

  test('event connection and command listeners are registered for mongo client events', () => {
    const mongoClient = new MongoClient('mongodb://localhost:27017', { monitorCommands: true })
    const exporter = new MongoDBDriverExporter(mongoClient, register)
    exporter.enableMetrics()
    expect(mongoClient.eventNames()).toHaveLength(allEvents.length)
    expect(mongoClient.eventNames()).toEqual(expect.arrayContaining(allEvents))
    allEvents.forEach(event => {
      expect(mongoClient.listeners(event)).toHaveLength(1)
      expect(mongoClient.listeners(event).at(0)).toBeInstanceOf(Function)
    })
  })

  test('only event connection listeners are registered for mongo client events', () => {
    const mongoClient = new MongoClient('mongodb://localhost:27017', { monitorCommands: false })
    const exporter = new MongoDBDriverExporter(mongoClient, register)
    exporter.enableMetrics()
    expect(mongoClient.eventNames()).toHaveLength(connectionEvents.length)
    expect(mongoClient.eventNames()).toEqual(expect.arrayContaining(connectionEvents))
    connectionEvents.forEach(event => {
      expect(mongoClient.listeners(event)).toHaveLength(1)
      expect(mongoClient.listeners(event).at(0)).toBeInstanceOf(Function)
    })
  })

  test('registered metrics are taken from the registry', () => {
    const mongoClient = new MongoClient('mongodb://localhost:27017', { monitorCommands: true })
    // eslint-disable-next-line no-new
    new MongoDBDriverExporter(mongoClient, register)
    // eslint-disable-next-line no-new
    new MongoDBDriverExporter(mongoClient, register)

    expect(register.getMetricsAsArray()).toHaveLength(allMetrics.length)
    allMetrics.forEach((metric) => {
      expect(register.getSingleMetric(metric)).toBeDefined()
    })
  })
})

describe('enableMetrics attach event listeners', () => {
  let mockMongoClient
  let mockOptions
  let register: Registry
  let exporter: MongoDBDriverExporter

  beforeEach(() => {
    jest.clearAllMocks()
    mockOptions = {
      logger: {
        info: jest.fn()
      }
    }
    register = new Registry()
  })

  test('attach event listeners for connection metrics and log success message', () => {
    mockMongoClient = {
      on: jest.fn(),
      options: {
        monitorCommands: false
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    exporter = new MongoDBDriverExporter(mockMongoClient, register, mockOptions)
    exporter.enableMetrics()
    connectionEvents.forEach(event => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockMongoClient.on).toHaveBeenCalledTimes(connectionEvents.length)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockMongoClient.on).toHaveBeenCalledWith(event, expect.any(Function))
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockOptions.logger.info).toHaveBeenCalledWith('Successfully enabled connection pool metrics for the MongoDB Node.js driver.')
  })

  test('attach event listeners for connection and command metrics and log success message', () => {
    mockMongoClient = {
      on: jest.fn(),
      options: {
        monitorCommands: true
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    exporter = new MongoDBDriverExporter(mockMongoClient, register, mockOptions)
    exporter.enableMetrics()

    allEvents.forEach(event => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockMongoClient.on).toHaveBeenCalledTimes(allEvents.length)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockMongoClient.on).toHaveBeenCalledWith(event, expect.any(Function))
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockOptions.logger.info).toHaveBeenCalledWith('Successfully enabled connection pool metrics for the MongoDB Node.js driver.')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockOptions.logger.info).toHaveBeenCalledWith('Successfully enabled command metrics for the MongoDB Node.js driver.')
  })
})

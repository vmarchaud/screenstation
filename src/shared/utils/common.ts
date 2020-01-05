
import assert from 'assert'
import WebSocket from 'ws'

export const pick = (object, properties) => {
  assert(typeof object === 'object')
  assert(properties instanceof Array)
  return Object.entries(object).filter(([key, value]) => {
    return properties.includes(key)
  }).reduce((newObject, [key, value]) => {
    newObject[key] = value
    return newObject
  }, {})
}

/**
 * Group an array by value of a given key
 */
export const groupBy = (array, key) => {
  return array.reduce((objectsByKeyValue, obj) => {
    const value = obj[key]
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj)
    return objectsByKeyValue
  }, {})
}

/**
 * Generate a random string
 */
export const randomString = (length) => {
  var chars = '0123456789abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  var len = length || 8
  var randomstring = ''
  for (var i = 0; i < len; i++) {
    var rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum, rnum + 1)
  }
  return randomstring
}

export type CallBackMap<T, R> = (
  value: T,
  index?: number,
  collection?: T[]
) => Promise<R>;

export const mapAsync = async <T, R>(
  elements: T[],
  cb: CallBackMap<T, R>
): Promise<R[]> => {
  const mappedResults: R[] = [];
  for (const [index, element] of elements.entries()) {
    const mappedResult = await cb(element, index, elements);
    mappedResults.push(mappedResult);
  }

  return mappedResults;
}


export const waitWebsocket = (ws: WebSocket | WebSocket.Server, successEvent: string) => {
  return new Promise((resolve, reject) => {
    const onError = (err: Error) => reject(err)
    ws.once('error', onError)
    ws.on(successEvent, () => {
      ws.removeListener('error', onError)
      return resolve()
    })
  })
}
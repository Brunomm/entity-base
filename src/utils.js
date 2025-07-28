function isObject( check ) {
  return( typeof check === 'object' && String(check) === '[object Object]' && !Array.isArray(check) )
}

function isBlank(value){
  if (value === null || value === undefined || value === false) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim() === ''
  }

  if (typeof value === 'number') {
    return isNaN(value)
  }

  if (Array.isArray(value)) {
    return value.length === 0 || value.every(item => isBlank(item))
  }

  if (value instanceof Date) {
    return false
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size === 0
  }

  if (value instanceof Object) {
    return Object.keys(value).length === 0
  }

  return false
}

const isPresent = (value) => !isBlank(value)

function intersectionArray(arr1, arr2) {
  let a = new Set(arr1)
  let b = new Set(arr2)

  return Array.from(
    new Set([...a].filter( x =>
      b.has(x)
    ))
  )
}

function humanizeString(str = '') {
  return String(str)
    .replace(/[_\-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
}

const S4 = () =>
  (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

const createUUID = () =>
  `${S4()}${S4()}-${S4()}-4${S4().substr(0, 3)}-${S4()}-${S4()}${S4()}${S4()}`.toLowerCase()

function isString(v){
  return (typeof v === 'string' || v instanceof String)
}


export { isObject, isBlank, isPresent, intersectionArray ,humanizeString, createUUID, isString }

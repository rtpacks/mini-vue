export function isObject(target) {
  return typeof target === 'object' && 
    target !== null 
}

export function isFunction(getter) {
  return typeof getter === 'function'
}

export function isString(target) {
  return typeof target === 'string'
}

export function isArray(target) {
  return Array.isArray(target)
}

export function hasChanged(origin, current) {
  return origin !== current && (!Number.isNaN(origin) && !Number.isNaN(current))
}
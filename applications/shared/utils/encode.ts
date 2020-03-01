import * as t from 'io-ts'

export async function encodeIO<T, O, I>(
  validator: t.Type<T, O, I>,
  input: T
): Promise<O> {
  return validator.encode(input)
}
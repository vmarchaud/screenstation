import * as t from 'io-ts';
import { chain } from 'fp-ts/lib/Either'

export const DateIO = new t.Type<Date, string, unknown>(
  'Date',
  (u): u is Date => u instanceof Date,
  (u, c) =>
    chain<t.Errors, string, Date>((o) => {
      // @ts-ignore
      return new Date(o) !== 'Invalid Date' ? t.success(new Date(o)) : t.failure(u, c)
    })(t.string.validate(u, c)),
  (a) => a.toString()
)


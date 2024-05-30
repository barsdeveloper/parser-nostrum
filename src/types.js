// @ts-nocheck

/**
 * @template T
 * @typedef {import("./Parsernostrum.js").default<T>} Parsernostrum
 */

/**
 * @typedef {{
 *     current: Parser,
 *     parent: PathNode?,
 *     index: Number,
 * }} PathNode
 */

/**
 * @template T
 * @typedef {{
 *     status: Boolean,
 *     value: T?,
 *     position: Number,
 *     bestParser: PathNode,
 *     bestPosition: Number,
 * }} Result
 */

/**
 * @typedef {{
 *     parsernostrum: Parsernostrum,
 *     input: String,
 *     highlighted: Parser | PathNode,
 * }} Context
 */

/**
 * @template T
 * @typedef {T extends [infer A] ? A
 *     : T extends [infer A, ...infer B] ? (A | UnionFromArray<B>)
 *     : any
 * } UnionFromArray
 **/

/**
 * @template T
 * @typedef {T extends import("./parser/Parser.js").default<infer R> ? R
 *     : T extends import("./parser/MapParser.js").default<any, infer R> ? R
 *     : T extends import("./parser/ChainedParser.js").default<any, infer R> ? R
 *     : T extends import("./Parsernostrum.js").default<infer R> ? R
 *     : T extends [infer A] ? [ParserValue<A>]
 *     : T extends [infer A, ...infer B] ? [ParserValue<A>, ...ParserValue<B>]
 *     : any
 * } ParserValue
 */

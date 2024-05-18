// @ts-nocheck

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

/** @typedef {import("./parser/Parser.js").default} Parser */

/**
 * @template T
 * @typedef {new (...args: any) => T} ConstructorType
 */

/**
 * @template T
 * @typedef {import("./Parsernostrum.js").Parsernostrum<T>} Parsernostrum
 */

/**
 * @typedef {typeof import("./Parsernostrum.js").Parsernostrum} ParsernostrumClass
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
 * @typedef {T extends [] ? []
 *     : T extends [infer First, ...infer Rest] ? [ParserValue<First>, ...ParserValue<Rest>]
 *     : T extends import("./parser/AlternativeParser.js").default<infer P> ? UnionFromArray<ParserValue<P>>
 *     : T extends import("./parser/ChainedParser.js").default<any, infer C> ? ParserValue<UnwrapParser<ReturnType<C>>>
 *     : T extends import("./parser/LazyParser.js").default<infer P> ? ParserValue<P>
 *     : T extends import("./parser/Lookahead.js").default ? ""
 *     : T extends import("./parser/MapParser.js").default<any, infer P> ? P
 *     : T extends import("./parser/RegExpParser.js").default<infer V> ? V
 *     : T extends import("./parser/SequenceParser.js").default<infer P> ? ParserValue<P>
 *     : T extends import("./parser/StringParser.js").default<infer S> ? S
 *     : T extends import("./parser/TimesParser.js").default<infer P> ? ParserValue<P>[]
 *     : never
 * } ParserValue
 */

/**
 * @template T
 * @typedef {T extends [] ? []
 *     : T extends [infer P] ? [UnwrapParser<P>]
 *     : T extends [infer P, ...infer Rest] ? [UnwrapParser<P>, ...UnwrapParser<Rest>]
 *     : T extends import("./Parsernostrum.js").default<infer P> ? P
 *     : Parser
 * } UnwrapParser
 */

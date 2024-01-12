// @ts-nocheck

/**
 * @template T
 * @typedef {{
 *     status: Boolean,
 *     value: T?,
 *     position: Number,
 *     bestParser: Parser<any>,
 *     bestPosition: Number,
 * }} Result
 */

/**
 * @typedef {{
 *     parsernostrum: Parsernostrum,
 *     input: String,
 *     visited: Map<Parser<any>, any>,
 * }} Context
 */

/**
 * @template T
 * @typedef {import("./parser/Parser.js").default<T>} Parser
 */

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
 *     : T extends import("./parser/RegExpParser.js").default<-1> ? RegExpExecArray
 *     : T extends import("./parser/SequenceParser.js").default<infer P> ? ParserValue<P>
 *     : T extends import("./parser/StringParser.js").default<infer S> ? S
 *     : T extends import("./parser/MapParser.js").default<any, infer P> ? P
 *     : T extends import("./parser/AlternativeParser.js").default<infer P> ? UnionFromArray<ParserValue<P>>
 *     : T extends import("./parser/LazyParser.js").default<infer P> ? ParserValue<P>
 *     : T extends import("./parser/RegExpParser.js").default<any> ? String
 *     : T extends import("./parser/TimesParser.js").default<infer P> ? ParserValue<P>[]
 *     : T extends import("./parser/Parser.js").default<infer V> ? V
 *     : T extends import("./parser/Lookahead.js/index.js").Lookahead ? ""
 *     : never
 * } ParserValue
 */

/**
 * @template T
 * @typedef {T extends [] ? []
 *     : T extends [infer P] ? [UnwrapParser<P>]
 *     : T extends [infer P, ...infer Rest] ? [UnwrapParser<P>, ...UnwrapParser<Rest>]
 *     : T extends import("./Parsernostrum.js").Parsernostrum<infer P> ? P
 *     : Parser<any>
 * } UnwrapParser
 */

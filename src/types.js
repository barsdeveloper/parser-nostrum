// @ts-nocheck

/**
 * @template Value
 * @typedef {import("./Reply.js").Result<Value>} Result
 */

/**
 * @template T
 * @typedef {import("./utility/PairMap.js").default<T>} PairMap
 */

/**
 * @template V
 * @typedef {import("./parser/Parser.js").default<V>} Parser
 */

/**
 * @template T
 * @typedef {new (...args: any) => T} ConstructorType
 */

/**
 * @template T
 * @typedef {import("./Regexer.js").default<T>} Regexer
 */

/**
 * @typedef {typeof import("./Regexer.js").default} RegexerClass
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
 * @typedef {T extends [infer A] ? [ConstructorType<A>]
 *     : T extends [infer A, ...infer B] ? [ConstructorType<A>, ...ConstructorsFromArrayTypes<B>]
 *     : T extends [] ? []
 *     : any
 * } ConstructorsFromArrayTypes
 **/

/**
 *
 */

/**
 * @typedef {{
 *     regexer: Regexer,
 *     input: String,
 *     equals: PairMap<Boolean>,
 *     visited: Map<Parser<any>, any>,
 * }} Context
 */

/**
 * @template T
 * @typedef {T extends [] ? []
 *     : T extends [infer First, ...infer Rest] ? [ParserValue<First>, ...ParserValue<Rest>]
 *     : T extends import("./parser/RegExpParser.js").default<-1> ? RegExpExecArray
 *     : T extends import("./parser/SequenceParser.js").default<infer P> ? ParserValue<P>
 *     : T extends import("./parser/StringParser.js").default<infer S> ? S
 *     : T extends import("./parser/MapParser.js").default<any, infer R> ? R
 *     : T extends import("./parser/AlternativeParser.js").default<infer P> ? UnionFromArray<ParserValue<P>>
 *     : T extends import("./parser/LazyParser.js").default<infer P> ? ParserValue<P>
 *     : T extends import("./parser/RegExpParser.js").default<any> ? String
 *     : T extends import("./parser/TimesParser.js").default<infer P> ? ParserValue<P>[]
 *     : T extends import("./parser/Parser.js").default<infer V> ? V
 *     : T extends import("./parser/LookaroundParser.js/index.js").LookaroundParser ? ""
 *     : never
 * } ParserValue
 */

/**
 * @template T
 * @typedef {T extends [] ? []
 *     : T extends [infer R] ? [UnwrapParser<R>]
 *     : T extends [infer R, ...infer Rest] ? [UnwrapParser<R>, ...UnwrapParser<Rest>]
 *     : T extends import("./Regexer.js").default<infer P> ? P
 *     : Parser<any>
 * } UnwrapParser
 */

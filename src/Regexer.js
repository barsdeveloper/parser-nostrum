import AlternativeParser from "./parser/AlternativeParser.js"
import ChainedParser from "./parser/ChainedParser.js"
import FailureParser from "./parser/FailureParser.js"
import LazyParser from "./parser/LazyParser.js"
import LookaroundParser from "./parser/LookaroundParser.js"
import MapParser from "./parser/MapParser.js"
import Parser from "./parser/Parser.js"
import RegExpParser from "./parser/RegExpParser.js"
import Reply from "./Reply.js"
import SequenceParser from "./parser/SequenceParser.js"
import StringParser from "./parser/StringParser.js"
import SuccessParser from "./parser/SuccessParser.js"
import TimesParser from "./parser/TimesParser.js"
import OptionalParser from "./parser/OptionalParser.js"

/** @template {Parser<any>} T */
export default class Regexer {

    #parser
    #optimized
    #groups = new Map()
    /** @type {(new (parser: Parser<any>) => Regexer<typeof parser>) & typeof Regexer} */
    Self

    static #numberMapper = v => Number(v)
    /** @param {[any, ...any]|RegExpExecArray} param0 */
    static #firstElementGetter = ([v, _]) => v
    /** @param {[any, any, ...any]|RegExpExecArray} param0 */
    static #secondElementGetter = ([_, v]) => v
    static #arrayFlatter = ([first, rest]) => [first, ...rest]
    /** @param {any} v */
    static #joiner = v =>
        v instanceof Array
            ? v.join("")
            : v
    static #createEscapeable = character => String.raw`[^${character}\\]*(?:\\.[^${character}\\]*)*`
    static #numberRegex = /[-\+]?(?:\d*\.)?\d+/

    // Prefedined parsers

    /** Parser accepting any valid decimal, possibly signed number */
    static number = this.regexp(new RegExp(this.#numberRegex.source + String.raw`(?!\.)`))
        .map(this.#numberMapper)

    /** Parser accepting any digits only number */
    static numberNatural = this.regexp(/\d+/).map(this.#numberMapper)

    /** Parser accepting any valid decimal, possibly signed, possibly in the exponential form number */
    static numberExponential = this.regexp(new RegExp(
        this.#numberRegex.source + String.raw`(?:[eE][\+\-]?\d+)?(?!\.)`)
    ).map(this.#numberMapper)

    /** Parser accepting any valid decimal number between 0 and 1 */
    static numberUnit = this.regexp(/\+?(?:0(?:\.\d+)?|1(?:\.0+)?)(?![\.\d])/)
        .map(this.#numberMapper)

    /** Parser accepting whitespace */
    static whitespace = this.regexp(/\s+/)

    /** Parser accepting whitespace that spans on a single line */
    static whitespaceInline = this.regexp(/[^\S\n]+/)

    /** Parser accepting whitespace that contains a list a newline */
    static whitespaceMultiline = this.regexp(/\s*?\n\s*/)

    /** Parser accepting whitespace */
    static optWhitespace = this.regexp(/\s*/)

    /** Parser accepting a double quoted string and returns the content */
    static doubleQuotedString = this.regexpGroups(new RegExp(`"(${this.#createEscapeable('"')})"`))
        .map(this.#secondElementGetter)

    /** Parser accepting a single quoted string and returns the content */
    static singleQuotedString = this.regexpGroups(new RegExp(`'(${this.#createEscapeable("'")})'`))
        .map(this.#secondElementGetter)

    /** Parser accepting a backtick quoted string and returns the content */
    static backtickQuotedString = this.regexpGroups(new RegExp(`\`(${this.#createEscapeable("`")})\``))
        .map(this.#secondElementGetter)

    /** @param {T} parser */
    constructor(parser, optimized = false) {
        // @ts-expect-error
        this.Self = this.constructor
        this.#parser = parser
        this.#optimized = optimized
    }

    /**
     * @template {Parser<any>} T
     * @param {T} parser
     */
    static optimize(parser) {

    }

    /**
     * @param {Regexer<Parser<any>> | Parser<any>} lhs
     * @param {Regexer<Parser<any>> | Parser<any>} rhs
     */
    static equals(lhs, rhs, strict = false) {
        const a = lhs instanceof Regexer ? lhs.getParser() : lhs
        const b = rhs instanceof Regexer ? rhs.getParser() : rhs
        return a.equals(
            Reply.makeContext(lhs instanceof Regexer ? lhs : rhs instanceof Regexer ? rhs : null),
            b,
            strict
        )
    }

    getParser() {
        return this.#parser
    }

    /**
     * @param {String} input
     * @returns {Result<ParserValue<T>>}
     */
    run(input) {
        const result = this.#parser.parse(Reply.makeContext(this, input), 0)
        return result.status && result.position === input.length ? result : Reply.makeFailure(result.position)
    }

    /** @param {String} input */
    parse(input) {
        const result = this.run(input)
        if (!result.status) {
            throw new Error("Parsing error")
        }
        return result.value
    }

    // Parsers

    /**
     * @template {String} S
     * @param {S} value
     */
    static str(value) {
        return new this(new StringParser(value))
    }

    /** @param {RegExp} value */
    static regexp(value, group = 0) {
        return new this(new RegExpParser(value, group))
    }

    /** @param {RegExp} value */
    static regexpGroups(value) {
        return new this(new RegExpParser(value, -1))
    }

    static success() {
        return new this(SuccessParser.instance)
    }

    static failure() {
        return new this(FailureParser.instance)
    }

    // Combinators

    /**
     * @template {[Regexer<any>, Regexer<any>, ...Regexer<any>[]]} P
     * @param {P} parsers
     * @returns {Regexer<SequenceParser<UnwrapParser<P>>>}
     */
    static seq(...parsers) {
        const results = new this(new SequenceParser(...parsers.map(p => p.getParser())))
        // @ts-expect-error
        return results
    }

    /**
     * @template {[Regexer<any>, Regexer<any>, ...Regexer<any>[]]} P
     * @param {P} parsers
     * @returns {Regexer<AlternativeParser<UnwrapParser<P>>>}
     */
    static alt(...parsers) {
        // @ts-expect-error
        return new this(new AlternativeParser(...parsers.map(p => p.getParser())))
    }

    /**
     * @template {Regexer<any>} P
     * @param {P} parser
     */
    static lookahead(parser) {
        return new this(new LookaroundParser(parser.getParser(), LookaroundParser.Type.POSITIVE_AHEAD))
    }

    /**
     * @template {Regexer<any>} P
     * @param {() => P} parser
     * @returns {Regexer<LazyParser<UnwrapParser<P>>>}
     */
    static lazy(parser) {
        return new this(new LazyParser(parser))
    }

    /**
     * @param {Number} min
     * @returns {Regexer<TimesParser<T>>}
     */
    times(min, max = min) {
        // @ts-expect-error
        return new this.Self(new TimesParser(this.#parser, min, max))
    }

    many() {
        return this.times(0, Number.POSITIVE_INFINITY)
    }

    /** @param {Number} n */
    atLeast(n) {
        return this.times(n, Number.POSITIVE_INFINITY)
    }

    /** @param {Number} n */
    atMost(n) {
        return this.times(0, n)
    }

    /** @returns {Regexer<T?>} */
    opt() {
        // @ts-expect-error
        return new this.Self(new OptionalParser(this.#parser))
    }

    /**
     * @template {Regexer<Parser<any>>} P
     * @param {P} separator
     */
    sepBy(separator, allowTrailing = false) {
        const results = this.Self.seq(
            this,
            this.Self.seq(separator, this).map(Regexer.#secondElementGetter).many()
        )
            .map(Regexer.#arrayFlatter)
        return results
    }

    skipSpace() {
        return this.Self.seq(this, this.Self.optWhitespace).map(Regexer.#firstElementGetter)
    }

    /**
     * @template R
     * @param {(v: ParserValue<T>) => R} fn
     * @returns {Regexer<MapParser<T, R>>}
     */
    map(fn) {
        return new this.Self(new MapParser(this.#parser, fn))
    }

    /**
     * @template {Regexer<any>} R
     * @param {(v: ParserValue<T>, input: String, position: Number) => R} fn
     */
    chain(fn) {
        return new this.Self(new ChainedParser(this.#parser, fn))
    }

    /**
     * @param {(v: ParserValue<T>, input: String, position: Number) => boolean} fn
     * @return {Regexer<T>}
     */
    assert(fn) {
        return /** @type {Regexer<T>} */(this.chain((v, input, position) => fn(v, input, position)
            ? this.Self.success().map(() => v)
            : this.Self.failure()
        ))
    }

    join(value = "") {
        return this.map(Regexer.#joiner)
    }

    toString(indent = 0, newline = false) {
        return (newline ? "\n" + Parser.indentation.repeat(indent) : "")
            + this.#parser.toString(Reply.makeContext(this, ""), indent)
    }
}

import AlternativeParser from "./parser/AlternativeParser.js"
import ChainedParser from "./parser/ChainedParser.js"
import FailureParser from "./parser/FailureParser.js"
import LazyParser from "./parser/LazyParser.js"
import Lookahead from "./parser/Lookahead.js"
import MapParser from "./parser/MapParser.js"
import Parser from "./parser/Parser.js"
import RegExpParser from "./parser/RegExpParser.js"
import Reply from "./Reply.js"
import SequenceParser from "./parser/SequenceParser.js"
import StringParser from "./parser/StringParser.js"
import SuccessParser from "./parser/SuccessParser.js"
import TimesParser from "./parser/TimesParser.js"

/** @template {Parser<any>} T */
export default class Parsernostrum {

    #parser

    /** @type {(new (parser: Parser<any>) => Parsernostrum<typeof parser>) & typeof Parsernostrum} */
    Self

    static lineColumnFromOffset(string, offset) {
        const lines = string.substring(0, offset).split('\n')
        const line = lines.length
        const column = lines[lines.length - 1].length + 1
        return { line, column }
    }
    /** @param {[any, ...any]|RegExpExecArray} param0 */
    static #firstElementGetter = ([v, _]) => v
    /** @param {[any, any, ...any]|RegExpExecArray} param0 */
    static #secondElementGetter = ([_, v]) => v
    static #arrayFlatter = ([first, rest]) => [first, ...rest]
    static #joiner = v => v instanceof Array ? v.join("") : v
    static #createEscapeable = character => String.raw`[^${character}\\]*(?:\\.[^${character}\\]*)*`
    static #numberRegex = /[-\+]?(?:\d*\.)?\d+/

    // Prefedined parsers

    /** Parser accepting any valid decimal, possibly signed number */
    static number = this.reg(new RegExp(this.#numberRegex.source + String.raw`(?!\.)`))
        .map(Number)

    /** Parser accepting any digits only number */
    static numberInteger = this.reg(/[\-\+]?\d+(?!\.\d)/).map(Number)

    /** Parser accepting any digits only number and returns a BigInt */
    static numberBigInteger = this.reg(this.numberInteger.getParser().parser.regexp).map(BigInt)

    /** Parser accepting any digits only number */
    static numberNatural = this.reg(/\d+/).map(Number)

    /** Parser accepting any valid decimal, possibly signed, possibly in the exponential form number */
    static numberExponential = this.reg(new RegExp(this.#numberRegex.source + String.raw`(?:[eE][\+\-]?\d+)?(?!\.)`))
        .map(Number)

    /** Parser accepting any valid decimal number between 0 and 1 */
    static numberUnit = this.reg(/\+?(?:0(?:\.\d+)?|1(?:\.0+)?)(?![\.\d])/)
        .map(Number)

    /** Parser accepting any integer between 0 and 255 */
    static numberByte = this.reg(/0*(?:25[0-5]|2[0-4]\d|1?\d?\d)(?!\d|\.)/)
        .map(Number)

    /** Parser accepting whitespace */
    static whitespace = this.reg(/\s+/)

    /** Parser accepting whitespace */
    static whitespaceOpt = this.reg(/\s*/)

    /** Parser accepting whitespace that spans on a single line */
    static whitespaceInline = this.reg(/[^\S\n]+/)

    /** Parser accepting whitespace that spans on a single line */
    static whitespaceInlineOpt = this.reg(/[^\S\n]+/)

    /** Parser accepting whitespace that contains a list a newline */
    static whitespaceMultiline = this.reg(/\s*?\n\s*/)

    /** Parser accepting a double quoted string and returns the content */
    static doubleQuotedString = this.regArray(new RegExp(`"(${this.#createEscapeable('"')})"`))
        .map(this.#secondElementGetter)

    /** Parser accepting a single quoted string and returns the content */
    static singleQuotedString = this.regArray(new RegExp(`'(${this.#createEscapeable("'")})'`))
        .map(this.#secondElementGetter)

    /** Parser accepting a backtick quoted string and returns the content */
    static backtickQuotedString = this.regArray(new RegExp(`\`(${this.#createEscapeable("`")})\``))
        .map(this.#secondElementGetter)

    /** @param {T} parser */
    constructor(parser, optimized = false) {
        // @ts-expect-error
        this.Self = this.constructor
        this.#parser = parser
    }

    getParser() {
        return this.#parser
    }

    /**
     * @param {String} input
     * @returns {Result<ParserValue<T>>}
     */
    run(input) {
        // @ts-expect-error
        return this.#parser.parse(Reply.makeContext(this, input), 0)
    }

    /**
     * @param {String} input
     * @throws when the parser fails to match
     */
    parse(input) {
        const result = this.run(input)
        if (!result.status) {
            const chunkLength = 20
            const string = (input.length > chunkLength ? input.substring(0, chunkLength - 3) + "..." : input).replaceAll('"', '\\"')
            let segment = input.substring(result.position - chunkLength / 2, result.position + chunkLength / 2)
            let offset = result.position
            if (result.position > chunkLength / 2) {
                segment = "..." + segment
                offset = chunkLength / 2 + 3
            }
            if (result.position < input.length - chunkLength / 2) {
                segment = segment + "..."
            }
            const position = Parsernostrum.lineColumnFromOffset(input, result.position + 1)
            throw new Error(
                `Could not parse "${string}"\n\n`
                + `Input: ${segment}\n`
                + "       "
                + " ".repeat(offset)
                + `^ From here (line: ${position.line}, column: ${position.column}, offset: ${result.position})\n\n`
                + `Last valid parser matched:`
                + this.toString(1, true, result.value)
                + "\n"
            )
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
    static reg(value, group = 0) {
        return new this(new RegExpParser(value, group))
    }

    /** @param {RegExp} value */
    static regArray(value) {
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
     * @template {[Parsernostrum<any>, Parsernostrum<any>, ...Parsernostrum<any>[]]} P
     * @param {P} parsers
     * @returns {Parsernostrum<SequenceParser<UnwrapParser<P>>>}
     */
    static seq(...parsers) {
        const results = new this(new SequenceParser(...parsers.map(p => p.getParser())))
        // @ts-expect-error
        return results
    }

    /**
     * @template {[Parsernostrum<any>, Parsernostrum<any>, ...Parsernostrum<any>[]]} P
     * @param {P} parsers
     * @returns {Parsernostrum<AlternativeParser<UnwrapParser<P>>>}
     */
    static alt(...parsers) {
        // @ts-expect-error
        return new this(new AlternativeParser(...parsers.map(p => p.getParser())))
    }

    /**
     * @template {Parsernostrum<any>} P
     * @param {P} parser
     */
    static lookahead(parser) {
        return new this(new Lookahead(parser.getParser(), Lookahead.Type.POSITIVE_AHEAD))
    }

    /**
     * @template {Parsernostrum<any>} P
     * @param {() => P} parser
     * @returns {Parsernostrum<LazyParser<UnwrapParser<P>>>}
     */
    static lazy(parser) {
        return new this(new LazyParser(parser))
    }

    /**
     * @param {Number} min
     * @returns {Parsernostrum<TimesParser<T>>}
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

    /** @returns {Parsernostrum<T?>} */
    opt() {
        // @ts-expect-error
        return this.Self.alt(this, this.Self.success())
    }

    /**
     * @template {Parsernostrum<Parser<any>>} P
     * @param {P} separator
     */
    sepBy(separator, allowTrailing = false) {
        const results = this.Self.seq(
            this,
            this.Self.seq(separator, this).map(Parsernostrum.#secondElementGetter).many()
        )
            .map(Parsernostrum.#arrayFlatter)
        return results
    }

    skipSpace() {
        return this.Self.seq(this, this.Self.whitespaceOpt).map(Parsernostrum.#firstElementGetter)
    }

    /**
     * @template P
     * @param {(v: ParserValue<T>) => P} fn
     * @returns {Parsernostrum<MapParser<T, P>>}
     */
    map(fn) {
        // @ts-expect-error
        return new this.Self(new MapParser(this.#parser, fn))
    }

    /**
     * @template {Parsernostrum<any>} P
     * @param {(v: ParserValue<T>, input: String, position: Number) => P} fn
     */
    chain(fn) {
        return new this.Self(new ChainedParser(this.#parser, fn))
    }

    /**
     * @param {(v: ParserValue<T>, input: String, position: Number) => boolean} fn
     * @return {Parsernostrum<T>}
     */
    assert(fn) {
        // @ts-expect-error
        return this.chain((v, input, position) => fn(v, input, position)
            ? this.Self.success().map(() => v)
            : this.Self.failure()
        )
    }

    join(value = "") {
        return this.map(Parsernostrum.#joiner)
    }

    /** @param {Parsernostrum<Parser<any>> | Parser<any>} highlight */
    toString(indent = 0, newline = false, highlight = null) {
        if (highlight instanceof Parsernostrum) {
            highlight = highlight.getParser()
        }
        return (newline ? "\n" + Parser.indentation.repeat(indent) : "")
            + this.#parser.toString(Reply.makeContext(this, ""), indent, highlight)
    }
}

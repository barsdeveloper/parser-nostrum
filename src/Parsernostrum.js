import Reply from "./Reply.js"
import AlternativeParser from "./parser/AlternativeParser.js"
import ChainedParser from "./parser/ChainedParser.js"
import FailureParser from "./parser/FailureParser.js"
import Label from "./parser/Label.js"
import LazyParser from "./parser/LazyParser.js"
import Lookahead from "./parser/Lookahead.js"
import MapParser from "./parser/MapParser.js"
import Parser from "./parser/Parser.js"
import RegExpArrayParser from "./parser/RegExpArrayParser.js"
import RegExpParser from "./parser/RegExpParser.js"
import RegExpValueParser from "./parser/RegExpValueParser.js"
import SequenceParser from "./parser/SequenceParser.js"
import StringParser from "./parser/StringParser.js"
import SuccessParser from "./parser/SuccessParser.js"
import TimesParser from "./parser/TimesParser.js"

/** @template {Parser} T */
export default class Parsernostrum {

    #parser

    /** @type {(new (parser: Parser) => Parsernostrum<typeof parser>) & typeof Parsernostrum} */
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
    /**
     * @template T
     * @param {T} v
     * @returns {T extends Array ? String : T}
     */
    // @ts-expect-error
    static #joiner = v => v instanceof Array ? v.join("") : v

    // Prefedined parsers

    /** Parser accepting any valid decimal, possibly signed number */
    static number = this.reg(RegExpParser.common.number).map(Number)

    /** Parser accepting any digits only number */
    static numberInteger = this.reg(RegExpParser.common.numberInteger).map(Number)

    /** Parser accepting any digits only number and returns a BigInt */
    static numberBigInteger = this.reg(this.numberInteger.getParser().parser.regexp).map(BigInt)

    /** Parser accepting any digits only number */
    static numberNatural = this.reg(RegExpParser.common.numberNatural).map(Number)

    /** Parser accepting any valid decimal, possibly signed, possibly in the exponential form number */
    static numberExponential = this.reg(RegExpParser.common.numberExponential).map(Number)

    /** Parser accepting any valid decimal number between 0 and 1 */
    static numberUnit = this.reg(RegExpParser.common.numberUnit).map(Number)

    /** Parser accepting any integer between 0 and 255 */
    static numberByte = this.reg(RegExpParser.common.numberByte).map(Number)

    /** Parser accepting whitespace */
    static whitespace = this.reg(RegExpParser.common.whitespace)

    /** Parser accepting whitespace */
    static whitespaceOpt = this.reg(RegExpParser.common.whitespaceOpt)

    /** Parser accepting whitespace that spans on a single line */
    static whitespaceInline = this.reg(RegExpParser.common.whitespaceInline)

    /** Parser accepting whitespace that spans on a single line */
    static whitespaceInlineOpt = this.reg(RegExpParser.common.whitespaceInlineOpt)

    /** Parser accepting whitespace that contains a list a newline */
    static whitespaceMultiline = this.reg(RegExpParser.common.whitespaceMultiline)

    /** Parser accepting a double quoted string and returns the content */
    static doubleQuotedString = this.reg(RegExpParser.common.doubleQuotedString, 1)

    /** Parser accepting a single quoted string and returns the content */
    static singleQuotedString = this.reg(RegExpParser.common.singleQuotedString, 1)

    /** Parser accepting a backtick quoted string and returns the content */
    static backtickQuotedString = this.reg(RegExpParser.common.backtickQuotedString, 1)

    /** @param {T} parser */
    constructor(parser, optimized = false) {
        this.#parser = parser
    }

    /** @param {PathNode} path */
    static #simplifyPath(path) {
        /** @type {PathNode[]} */
        const array = []
        while (path) {
            array.push(path)
            path = path.parent
        }
        array.reverse()
        /** @type {Map<Parser, Number>} */
        let visited = new Map()
        for (let i = 1; i < array.length; ++i) {
            const existing = visited.get(array[i].current)
            if (existing !== undefined) {
                if (array[i + 1]) {
                    array[i + 1].parent = array[existing]
                }
                visited = new Map([...visited.entries()].filter(([parser, index]) => index <= existing || index > i))
                visited.set(array[i].current, existing)
                array.splice(existing + 1, i - existing)
                i = existing
            } else {
                visited.set(array[i].current, i)
            }
        }
        return array[array.length - 1]
    }

    getParser() {
        return this.#parser
    }

    /**
     * @param {String} input
     * @returns {Result<ParserValue<T>>}
     */
    run(input) {
        const result = this.#parser.parse(Reply.makeContext(this, input), 0, Reply.makePathNode(), 0)
        if (result.position !== input.length) {
            result.status = false
        }
        // @ts-expect-error
        return result
    }

    /**
     * @param {String} input
     * @throws {Error} when the parser fails to match
     */
    parse(input, printParser = true) {
        const result = this.run(input)
        if (result.status) {
            return result.value
        }
        const chunkLength = 60
        const chunkRange = /** @type {[Number, Number]} */(
            [Math.ceil(chunkLength / 2), Math.floor(chunkLength / 2)]
        )
        const position = Parsernostrum.lineColumnFromOffset(input, result.bestPosition)
        let bestPosition = result.bestPosition
        const inlineInput = input.replaceAll(
            /^(\s)+|\s{6,}|\s*?\n\s*/g,
            (m, startingSpace, offset) => {
                let replaced = startingSpace ? "..." : " ... "
                if (offset <= result.bestPosition) {
                    if (result.bestPosition < offset + m.length) {
                        bestPosition -= result.bestPosition - offset
                    } else {
                        bestPosition -= m.length - replaced.length
                    }
                }
                return replaced
            }
        )
        const string = inlineInput.substring(0, chunkLength).trimEnd()
        const leadingWhitespaceLength = Math.min(
            input.substring(result.bestPosition - chunkRange[0]).match(/^\s*/)[0].length,
            chunkRange[0] - 1,
        )
        let offset = Math.min(bestPosition, chunkRange[0] - leadingWhitespaceLength)
        chunkRange[0] = Math.max(0, bestPosition - chunkRange[0]) + leadingWhitespaceLength
        chunkRange[1] = Math.min(input.length, chunkRange[0] + chunkLength)
        let segment = inlineInput.substring(...chunkRange)
        if (chunkRange[0] > 0) {
            segment = "..." + segment
            offset += 3
        }
        if (chunkRange[1] < inlineInput.length - 1) {
            segment = segment + "..."
        }
        const bestParser = this.toString(Parser.indentation, true, Parsernostrum.#simplifyPath(result.bestParser))
        throw new Error(
            `Could not parse: ${string}\n\n`
            + `Input: ${segment}\n`
            + "       " + " ".repeat(offset)
            + `^ From here (line: ${position.line}, `
            + `column: ${position.column}, `
            + `offset: ${result.bestPosition})${result.bestPosition === input.length ? ", end of string" : ""}\n`
            + (printParser
                ? "\n"
                + (result.bestParser ? "Last valid parser matched:" : "No parser matched:")
                + bestParser
                + "\n"
                : ""
            )
        )
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
        return new this(new RegExpValueParser(value, group))
    }

    /** @param {RegExp} value */
    static regArray(value) {
        return new this(new RegExpArrayParser(value))
    }

    static success() {
        return new this(SuccessParser.instance)
    }

    static failure() {
        return new this(FailureParser.instance)
    }

    // Combinators

    /**
     * @template {Parsernostrum<any>[]} P
     * @param {P} parsers
     * @returns {Parsernostrum<SequenceParser<UnwrapParser<P>>>}
     */
    static seq(...parsers) {
        const results = new this(new SequenceParser(...parsers.map(p => p.getParser())))
        // @ts-expect-error
        return results
    }

    /**
     * @template {Parsernostrum<any>[]} P
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

    /** @param {Number} min */
    times(min, max = min) {
        return new Parsernostrum(new TimesParser(this.#parser, min, max))
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
        return Parsernostrum.alt(this, Parsernostrum.success())
    }

    /**
     * @template {Parsernostrum<Parser>} P
     * @param {P} separator
     */
    sepBy(separator, allowTrailing = false) {
        const results = Parsernostrum.seq(
            this,
            Parsernostrum.seq(separator, this).map(Parsernostrum.#secondElementGetter).many()
        )
            .map(Parsernostrum.#arrayFlatter)
        return results
    }

    skipSpace() {
        return Parsernostrum.seq(this, Parsernostrum.whitespaceOpt).map(Parsernostrum.#firstElementGetter)
    }

    /**
     * @template P
     * @param {(v: ParserValue<T>) => P} fn
     * @returns {Parsernostrum<MapParser<T, P>>}
     */
    map(fn) {
        // @ts-expect-error
        return new Parsernostrum(new MapParser(this.#parser, fn))
    }

    /**
     * @template {Parsernostrum<Parser>} P
     * @param {(v: ParserValue<T>, input: String, position: Number) => P} fn
     */
    chain(fn) {
        return new Parsernostrum(new ChainedParser(this.#parser, fn))
    }

    /**
     * @param {(v: ParserValue<T>, input: String, position: Number) => boolean} fn
     * @return {Parsernostrum<T>}
     */
    assert(fn) {
        // @ts-expect-error
        return this.chain((v, input, position) => fn(v, input, position)
            ? Parsernostrum.success().map(() => v)
            : Parsernostrum.failure()
        )
    }

    join(value = "") {
        return this.map(Parsernostrum.#joiner)
    }

    label(value = "") {
        return new Parsernostrum(new Label(this.#parser, value))
    }

    /** @param {Parsernostrum<Parser> | Parser | PathNode} highlight */
    toString(indentation = "", newline = false, highlight = null) {
        if (highlight instanceof Parsernostrum) {
            highlight = highlight.getParser()
        }
        const context = Reply.makeContext(this, "")
        context.highlighted = highlight
        const path = Reply.makePathNode()
        return (newline ? "\n" + indentation : "") + this.#parser.toString(context, indentation, path)
    }
}

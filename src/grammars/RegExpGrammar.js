import AlternativeParser from "../parser/AlternativeParser.js"
import AnchorParser, { AnchorType } from "../parser/AnchorParser.js"
import AnyCharParser from "../parser/AnyCharParser.js"
import AtomicGroupParser from "../parser/AtomicGroupParser.js"
import CapturingGroupParser from "../parser/CapturingGroupParser.js"
import ClassParser from "../parser/ClassParser.js"
import ClassShorthandParser, { ClassMetacharacter } from "../parser/ClassShorthandParser.js"
import EscapedCharParser from "../parser/EscapedCharParser.js"
import LookaroundParser from "../parser/LookaroundParser.js"
import NonCapturingGroupParser from "../parser/NonCapturingGroupParser.js"
import Parser from "../parser/Parser.js"
import RangeParser from "../parser/RangeParser.js"
import Regexer from "../Regexer.js"
import StringParser from "../parser/StringParser.js"
import TimesParser from "../parser/TimesParser.js"

export const R = class extends Regexer {

    /**
     * @template {[Regexer<any>, Regexer<any>, ...Regexer<any>[]]} P
     * @param {P} parsers
     * @returns {Regexer<AlternativeParser<UnwrapParser<P>>>}
     */
    static alt(...parsers) {
        return new this(super.alt(...parsers).getParser().asBacktracking())
    }

    /**
     * @template {String} S
     * @param {S} char
     */
    static escapedChar(char, type = EscapedCharParser.Type.NORMAL) {
        return new this(new EscapedCharParser(char, type))
    }

    /** @param {keyof typeof ClassMetacharacter} type */
    static classShorthand(type) {
        return new this(new ClassShorthandParser(type))
    }

    /**
     * @template {Regexer<any>[]} P
     * @param {P} parsers
     * @returns {Regexer<ClassParser<UnwrapParser<P>>>}
     */
    static class(...parsers) {
        return new this(
            (new ClassParser(false, ...parsers.map(p => p.getParser()))).asBacktracking()
        )
    }

    /**
     * @template {Regexer<any>[]} P
     * @param {P} parsers
     * @returns {Regexer<ClassParser<UnwrapParser<P>>>}
     */
    static negClass(...parsers) {
        return new this(new ClassParser(true, ...parsers.map(p => p.getParser())))
    }

    /**
     * @template {Regexer<Parser<any>>} P
     * @param {P} parser
     */
    static lookaround(parser, type = LookaroundParser.Type.POSITIVE_AHEAD) {
        return new this(new LookaroundParser(parser.getParser(), type))
    }

    /**
     * @template {Regexer<Parser<any>>} T
     * @param {T} parser
     * @param {String | Symbol} id
     * @returns {Regexer<CapturingGroupParser<UnwrapParser<T>>>}
     */
    static grp(parser, id = "") {
        return new this(new CapturingGroupParser(parser.getParser(), id))
    }

    /**
     * @template {Regexer<Parser<any>>} T
     * @param {T} parser
     */
    static nonGrp(parser) {
        return new this(new NonCapturingGroupParser(parser.getParser()))
    }

    /**
     * @template {Regexer<Parser<any>>} T
     * @param {T} parser
     */
    static atomicGrp(parser) {
        return new this(new AtomicGroupParser(parser.getParser()))
    }

    static lineStart() {
        return new this(new AnchorParser(AnchorType.LINE_START))
    }

    static lineEnd() {
        return new this(new AnchorParser(AnchorType.LINE_END))
    }

    static wordBoundary() {
        return new this(new AnchorParser(AnchorType.WORD_BOUNDARY))
    }

    static anyChar(dotAll = false) {
        return new this(new AnyCharParser(dotAll))
    }

    /**
     * @template {String} A
     * @template {String} B
     * @param {Regexer<StringParser<A>>} from
     * @param {Regexer<StringParser<B>>} to
     */
    static range(from, to) {
        return new this(new RangeParser(from.getParser(), to.getParser()))
    }

    /** @param {Number} min */
    times(min, max = min) {
        const result = new TimesParser(this.getParser(), min, max)
        return new this.Self(result.asBacktracking())
    }
}

/**
 * Grammar used to parse a regular expression.
 * Many thanks to Robert Elder: https://blog.robertelder.org/regular-expression-parser-grammar/
 */
export default class RegExpGrammar {

    static #decimalNumber = R.regexp(/\d+/)

    static #hexDigit = R.regexp(/[0-9A-Fa-f]/)

    static #anchor = R.alt(
        R.str("^").map(() => R.lineStart()),
        R.str("$").map(() => R.lineEnd()),
        R.str("\\b").map(() => R.wordBoundary()),
    )

    static #escapedHexChar = R.seq(
        R.str("\\"),
        R.alt(
            R.seq(R.str("x").map(() => EscapedCharParser.Type.HEX), this.#hexDigit.times(2)),
            R.seq(R.str("u").map(() => EscapedCharParser.Type.UNICODE), this.#hexDigit.times(4)),
            R.seq(R.str("u{").map(() => EscapedCharParser.Type.UNICODE_FULL), this.#hexDigit.times(4, 5), R.str("}")),
        )
    ).map(([_0, [type, hexValues, _3]]) =>
        R.escapedChar(String.fromCodePoint(Number(`0x${hexValues.join("")}`)), type)
    )

    static #escapedCharLiteral = R.seq(R.str("\\"), R.regexp(/./).assert(v => v != 'x')).map(([_, c]) =>
        ClassMetacharacter[c]
            // @ts-expect-error
            ? R.classShorthand(c)
            : R.escapedChar(EscapedCharParser.specialEscapedCharacters[c] ?? c)
    )

    static #nonClassEscapedChar = R.alt(this.#escapedHexChar, this.#escapedCharLiteral)

    static #classCharLiteral = R.regexp(/./)
        .assert(c => !["]", "\\"].includes(c))
        .map(c => R.str(c))

    static #nonClassCharLiteral = R.regexp(/./)
        .assert(c => !["^", "$", "*", "+", "?", ".", "(", ")", "[", "\\", "|"].includes(c))
        .map(c => R.str(c))

    static #nonClassCharacter = R.alt(
        R.str(".").map(() => R.anyChar()),
        this.#nonClassCharLiteral,
        this.#nonClassEscapedChar,
    )

    static #classChar = R.alt(
        this.#classCharLiteral,
        this.#escapedHexChar,
        this.#escapedCharLiteral,
    )

    static #rangeEndpoint = R.alt(
        this.#classCharLiteral,
        this.#escapedHexChar,
        this.#escapedCharLiteral.assert(v => !(v.getParser() instanceof ClassShorthandParser)),
    )

    static #range = R.seq(this.#rangeEndpoint, R.str("-"), this.#rangeEndpoint)
        .map(([from, _, to]) => R.range(from, to))

    static #class = R.seq(
        R.str("["),
        R.str("^").opt(),
        R.alt(this.#range, this.#classChar).atLeast(1),
        R.str("]")
    ).map(([l, invert, values, r]) =>
        invert ? R.negClass(...values) : R.class(...values)
    )


    static #quantifier = R.alt(
        R.seq(
            R.str("{"),
            this.#decimalNumber.map(v => Number(v)),
            R.seq(R.str(","), this.#decimalNumber.map(v => Number(v)).opt()).opt(),
            R.str("}"),
        ).map(([lp, from, maxTimes, rp]) => /** @param {Regexer<Parser<any>>} p */ p => p.times(
            from,
            maxTimes
                ? maxTimes[1] ? maxTimes[1] : Number.POSITIVE_INFINITY
                : from
        )),
        R.str("+").map(() => /** @param {Regexer<Parser<any>>} p */ p => p.atLeast(1)),
        R.str("?").map(() => /** @param {Regexer<Parser<any>>} p */ p => p.opt()),
        R.str("*").map(() => /** @param {Regexer<Parser<any>>} p */ p => p.many()),
    )

    static #subExpression = R.alt(
        // Capturing group
        R.seq(R.str("("), R.lazy(() => this.regexp), R.str(")"))
            .map(([l, value, r]) => R.grp(value)),
        // Non capturing group
        R.seq(R.str("(?:"), R.lazy(() => this.regexp), R.str(")"))
            .map(([l, value, r]) => R.nonGrp(value)),
        // Named capturing group
        R.seq(R.str("(?<"), R.regexp(/\w+/), R.str(">"), R.lazy(() => this.regexp), R.str(")"))
            .map(([l, name, _, value, r]) => R.grp(value, name)),
        // Positive lookahead
        R.seq(R.str("(?="), R.lazy(() => this.regexp), R.str(")"))
            .map(([l, value, r]) => R.lookaround(value, LookaroundParser.Type.POSITIVE_AHEAD)),
        // Negative lookahead
        R.seq(R.str("(?!"), R.lazy(() => this.regexp), R.str(")"))
            .map(([l, value, r]) => R.lookaround(value, LookaroundParser.Type.NEGATIVE_AHEAD)),
        // Positive lookbehind
        R.seq(R.str("(?<="), R.lazy(() => this.regexp), R.str(")"))
            .map(([l, value, r]) => R.lookaround(value, LookaroundParser.Type.POSITIVE_BEHIND)),
        // Negative lookbehind
        R.seq(R.str("(?<!"), R.lazy(() => this.regexp), R.str(")"))
            .map(([l, value, r]) => R.lookaround(value, LookaroundParser.Type.NEGATIVE_BEHIND)),
        // Atomic group
        // R.seq(R.str("(?>"), R.lazy(() => this.regexp), R.str(")"))
        //     .map(([l, value, r]) => R.atomicGrp(value)),
    )

    static #expression = R.alt(
        this.#anchor,
        R.seq(
            R.alt(this.#subExpression, this.#class, this.#nonClassCharacter),
            this.#quantifier.opt(),
        ).map(([value, quantifier]) => quantifier ? quantifier(value) : value),
    )

    static #sequence = this.#expression.many().map(v => {
        v = v.reduce(
            (acc, cur) => {
                const last = acc[acc.length - 1]?.getParser()
                const current = cur.getParser()
                if (last?.constructor === StringParser && current?.constructor === StringParser) {
                    // @ts-expect-error
                    acc[acc.length - 1] = R.str(last.value + current.value)
                } else {
                    acc.push(cur)
                }
                return acc
            },
            /** @type {Regexer<Parser<any>>[]} */([]),
        )
        if (v.length === 0) {
            return R.success()
        }
        if (v.length === 1) {
            return v[0]
        }
        // @ts-expect-error
        return R.seq(...v)
    })

    static #alternation = R.seq(
        this.#sequence,
        R.seq(R.str("|"), this.#sequence).map(([pipe, seq]) => seq).many()

    )
        //@ts-expect-error
        .map(([first, rest]) => rest.length === 0 ? first : R.alt(first, ...rest))

    /** @type {Regexer<Parser<Regexer<Parser<any>>>>} */
    static regexp = this.#alternation
}

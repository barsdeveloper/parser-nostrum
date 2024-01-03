/**
 * @template Value
 * @typedef {{
 *     status: Boolean,
 *     value: Value,
 *     position: Number,
 * }} Result
 */

class Reply {

    /**
     * @template Value
     * @param {Number} position
     * @param {Value} value
     */
    static makeSuccess(position, value) {
        return /** @type {Result<Value>} */({
            status: true,
            value: value,
            position: position,
        })
    }

    /**
     * @template Value
     * @param {Number} position
     */
    static makeFailure(position) {
        return /** @type {Result<Value>} */({
            status: false,
            value: null,
            position: position,
        })
    }

    /** @param {Parsernostrum<Parser<any>>} parsernostrum */
    static makeContext(parsernostrum = null, input = "") {
        return /** @type {Context} */({
            parsernostrum: parsernostrum,
            input: input,
            visited: new Map(),
        })
    }
}

/** @template T */
class Parser {

    static indentation = "    "

    /** @protected */
    predicate = v => this === v || v instanceof Function && this instanceof v

    /** @type {(new (...args: any) => Parser) & typeof Parser} */
    Self

    /**
     * @param {Result<any>} a
     * @param {Result<any>} b
     */
    static mergeResults(a, b) {
        if (!b) {
            return a
        }
        return /** @type {typeof a} */({
            status: a.status,
            position: a.position,
            value: a.value,
        })
    }

    constructor() {
        // @ts-expect-error
        this.Self = this.constructor;
    }


    unwrap() {
        return /** @type {Parser<T>[]} */([])
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     * @returns {Parser<any>}
     */
    wrap(...parsers) {
        return null
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @returns {Result<T>}
     */
    parse(context, position) {
        return null
    }

    toString(context = Reply.makeContext(null, ""), indent = 0) {
        if (context.visited.has(this)) {
            return "<...>" // Recursive parser
        }
        context.visited.set(this, null);
        return this.doToString(context, indent)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return `${this.constructor.name} does not implement toString()`
    }
}

/**
 * @template {String} T
 * @extends {Parser<T>}
 */
class StringParser extends Parser {

    static successParserInstance

    #value
    get value() {
        return this.#value
    }

    /** @param {T} value */
    constructor(value) {
        super();
        this.#value = value;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const end = position + this.#value.length;
        const value = context.input.substring(position, end);
        return this.#value === value
            ? Reply.makeSuccess(end, this.#value)
            : /** @type {Result<T>} */(Reply.makeFailure(position))
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        const inlined = this.value.replaceAll("\n", "\\n");
        return this.value.length !== 1 || this.value.trim() !== this.value
            ? `"${inlined.replaceAll('"', '\\"')}"`
            : inlined
    }
}

/** @extends StringParser<""> */
class SuccessParser extends StringParser {

    static instance = new SuccessParser()

    static {
        StringParser.successParserInstance = this.instance;
    }

    constructor() {
        super("");
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "<SUCCESS>"
    }
}

/**
 * @template {Parser<any>[]} T
 * @extends Parser<ParserValue<T>>
 */
class AlternativeParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {T} parsers */
    constructor(...parsers) {
        super();
        this.#parsers = parsers;
    }

    unwrap() {
        return [...this.#parsers]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     * @returns {AlternativeParser<T>}
     */
    wrap(...parsers) {
        // @ts-expect-error
        const result = /** @type {AlternativeParser<T>} */(new this.Self(...parsers));
        return result
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let result;
        for (let i = 0; i < this.#parsers.length; ++i) {
            result = this.#parsers[i].parse(context, position);
            if (result.status) {
                return result
            }
        }
        return Reply.makeFailure(position)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        const indentation = Parser.indentation.repeat(indent);
        const deeperIndentation = Parser.indentation.repeat(indent + 1);
        if (this.#parsers.length === 2 && this.#parsers[1] instanceof SuccessParser) {
            let result = this.#parsers[0].toString(context, indent);
            if (!(this.#parsers[0] instanceof StringParser) && !context.visited.has(this.#parsers[0])) {
                result = "<" + result + ">";
            }
            result += "?";
            return result
        }
        return "ALT<\n"
            + deeperIndentation + this.#parsers
                .map(p => p.toString(context, indent + 1))
                .join("\n" + deeperIndentation + "| ")
            + "\n" + indentation + ">"
    }
}

/**
 * @template {Parser<any>} T
 * @template {(v: ParserValue<T>, input: String, position: Number) => Parsernostrum<Parser<any>>} C
 * @extends Parser<ReturnType<C>>
 */
class ChainedParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #fn

    /**
     * @param {T} parser
     * @param {C} chained
     */
    constructor(parser, chained) {
        super();
        this.#parser = parser;
        this.#fn = chained;
    }

    unwrap() {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     */
    wrap(...parsers) {
        return new ChainedParser(parsers[0], this.#fn)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let result = this.#parser.parse(context, position);
        if (!result.status) {
            return result
        }
        result = this.#fn(result.value, context.input, result.position)?.getParser().parse(context, result.position)
            ?? Reply.makeFailure(result.position);
        return result
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return this.#parser.toString(context, indent) + " => chained<f()>"
    }
}

/** @extends Parser<String> */
class FailureParser extends Parser {

    static instance = new FailureParser()

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        return Reply.makeFailure(position)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "<FAILURE>"
    }
}

/**
 * @template {Parser<any>} T
 * @extends Parser<ParserValue<T>>
 */
class LazyParser extends Parser {

    #parser

    /** @type {T} */
    #resolvedPraser

    /** @param {() => Parsernostrum<T>} parser */
    constructor(parser) {
        super();
        this.#parser = parser;
    }

    resolve() {
        if (!this.#resolvedPraser) {
            this.#resolvedPraser = this.#parser().getParser();
        }
        return this.#resolvedPraser
    }

    unwrap() {
        return [this.resolve()]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        const parsernostrumConstructor = /** @type {ConstructorType<Parsernostrum<typeof parsers[0]>>} */(
            this.#parser().constructor
        );
        return new LazyParser(() => new parsernostrumConstructor(parsers[0]))
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        this.resolve();
        return this.#resolvedPraser.parse(context, position)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return this.resolve().toString(context, indent)
    }
}

/** @template {Parser<any>} T */
class Lookahead extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #type
    get type() {
        return this.#type
    }

    /**
     * @readonly
     * @enum {String}
     */
    static Type = {
        NEGATIVE_AHEAD: "?!",
        NEGATIVE_BEHIND: "?<!",
        POSITIVE_AHEAD: "?=",
        POSITIVE_BEHIND: "?<=",
    }

    /**
     * @param {T} parser
     * @param {Type} type
     */
    constructor(parser, type) {
        super();
        this.#parser = parser;
        this.#type = type;
    }

    unwrap() {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        return new Lookahead(parsers[0], this.#type)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        if (
            this.#type === Lookahead.Type.NEGATIVE_BEHIND
            || this.#type === Lookahead.Type.POSITIVE_BEHIND
        ) {
            throw new Error("Lookbehind is not implemented yet")
        } else {
            const result = this.#parser.parse(context, position);
            return result.status == (this.#type === Lookahead.Type.POSITIVE_AHEAD)
                ? Reply.makeSuccess(position, "")
                : Reply.makeFailure(position)
        }
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "(" + this.#type + this.#parser.toString(context, indent) + ")"
    }
}

/**
 * @template {Parser<any>} T
 * @template P
 * @extends Parser<P>
 */
class MapParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #mapper
    get mapper() {
        return this.#mapper
    }

    /**
     * @param {T} parser
     * @param {(v: ParserValue<P>) => P} mapper
     */
    constructor(parser, mapper) {
        super();
        this.#parser = parser;
        this.#mapper = mapper;
    }

    unwrap() {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     */
    wrap(...parsers) {
        return new MapParser(parsers[0], this.#mapper)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @returns {Result<P>}
     */
    parse(context, position) {
        const result = this.#parser.parse(context, position);
        if (result.status) {
            result.value = this.#mapper(result.value);
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        let serializedMapper = this.#mapper.toString();
        if (serializedMapper.length > 60 || serializedMapper.includes("\n")) {
            serializedMapper = "(...) => { ... }";
        }
        return this.#parser.toString(context, indent) + ` -> map<${serializedMapper}>`
    }
}

/**
 * @template {Number} Group
 * @extends {Parser<Group extends -1 ? RegExpExecArray : String>}
 */
class RegExpParser extends Parser {

    /** @type {RegExp} */
    #regexp
    get regexp() {
        return this.#regexp
    }
    /** @type {RegExp} */
    #anchoredRegexp
    #group


    /**
     * @param {RegExp | RegExpParser} regexp
     * @param {Group} group
     */
    constructor(regexp, group) {
        super();
        if (regexp instanceof RegExp) {
            this.#regexp = regexp;
            this.#anchoredRegexp = new RegExp(`^(?:${regexp.source})`, regexp.flags);
        } else if (regexp instanceof RegExpParser) {
            this.#regexp = regexp.#regexp;
            this.#anchoredRegexp = regexp.#anchoredRegexp;
        }
        this.#group = group;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const match = this.#anchoredRegexp.exec(context.input.substring(position));
        return match
            ? Reply.makeSuccess(position + match[0].length, this.#group >= 0 ? match[this.#group] : match)
            : Reply.makeFailure(position)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "/" + this.#regexp.source + "/"
    }
}

/**
 * @template {Parser<any>[]} T
 * @extends Parser<ParserValue<T>>
 */
class SequenceParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param  {T} parsers */
    constructor(...parsers) {
        super();
        this.#parsers = parsers;
    }

    unwrap() {
        return [...this.#parsers]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        return new SequenceParser(...parsers)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const value = new Array(this.#parsers.length);
        const result = /** @type {Result<ParserValue<T>>} */(Reply.makeSuccess(position, value));
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, result.position);
            if (!outcome.status) {
                return outcome
            }
            result.value[i] = outcome.value;
            result.position = outcome.position;
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        const indentation = Parser.indentation.repeat(indent);
        const deeperIndentation = Parser.indentation.repeat(indent + 1);
        return "SEQ<\n"
            + this.#parsers
                .map(p => deeperIndentation + p.toString(context, indent + 1))
                .join("\n")
            + "\n" + indentation + ">"
    }
}

/**
 * @template {Parser<any>} T
 * @extends {Parser<ParserValue<T>[]>}
 */
class TimesParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #min
    get min() {
        return this.#min
    }

    #max
    get max() {
        return this.#max
    }

    /** @param {T} parser */
    constructor(parser, min = 0, max = Number.POSITIVE_INFINITY) {
        super();
        if (min > max) {
            throw new Error("Min is greater than max")
        }
        this.#parser = parser;
        this.#min = min;
        this.#max = max;
    }

    unwrap() {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        const result = /** @type {TimesParser<typeof parsers[0]>} */(new TimesParser(parsers[0], this.#min, this.#max));
        return result
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const value = [];
        const result = /** @type {Result<ParserValue<T>[]>} */(
            Reply.makeSuccess(position, value)
        );
        for (let i = 0; i < this.#max; ++i) {
            const outcome = this.#parser.parse(context, result.position);
            if (!outcome.status) {
                return i >= this.#min ? result : outcome
            }
            result.value.push(outcome.value);
            result.position = outcome.position;
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return this.parser.toString(context, indent)
            + (
                this.#min === 0 && this.#max === 1 ? "?"
                    : this.#min === 0 && this.#max === Number.POSITIVE_INFINITY ? "*"
                        : this.#min === 1 && this.#max === Number.POSITIVE_INFINITY ? "+"
                            : "{"
                            + this.#min
                            + (this.#min !== this.#max ? "," + this.#max : "")
                            + "}"
            )
    }
}

/** @template {Parser<any>} T */
class Parsernostrum {

    #parser

    /** @type {(new (parser: Parser<any>) => Parsernostrum<typeof parser>) & typeof Parsernostrum} */
    Self

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
        this.Self = this.constructor;
        this.#parser = parser;
    }

    getParser() {
        return this.#parser
    }

    /**
     * @param {String} input
     * @returns {Result<ParserValue<T>>}
     */
    run(input) {
        const result = this.#parser.parse(Reply.makeContext(this, input), 0);
        return result.status && result.position === input.length ? result : Reply.makeFailure(result.position)
    }

    /**
     * @param {String} input
     * @throws when the parser fails to match
     */
    parse(input) {
        const result = this.run(input);
        if (!result.status) {
            throw new Error(`Could not parse "${input.length > 20 ? input.substring(0, 17) + "..." : input}"`)
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
        const results = new this(new SequenceParser(...parsers.map(p => p.getParser())));
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
            .map(Parsernostrum.#arrayFlatter);
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
        return /** @type {Parsernostrum<T>} */(this.chain((v, input, position) => fn(v, input, position)
            ? this.Self.success().map(() => v)
            : this.Self.failure()
        ))
    }

    join(value = "") {
        return this.map(Parsernostrum.#joiner)
    }

    toString(indent = 0, newline = false) {
        return (newline ? "\n" + Parser.indentation.repeat(indent) : "")
            + this.#parser.toString(Reply.makeContext(this, ""), indent)
    }
}

export { Parsernostrum as default };

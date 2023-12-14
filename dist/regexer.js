/** @template T */
class PairMap {

    /** @type {Map<Parser<any>, Map<Parser<any>, T>>} */
    #map = new Map()

    /**
     * @param {Parser<any>} first
     * @param {Parser<any>} second
     */
    get(first, second) {
        return this.#map.get(first)?.get(second)
    }

    /**
     * @param {Parser<any>} first
     * @param {Parser<any>} second
     * @param {T} value
     */
    set(first, second, value) {
        let map = this.#map.get(first);
        if (!map) {
            map = new Map();
            this.#map.set(first, map);
        }
        map.set(second, value);
        return this
    }

    /**
     * @param {Parser<any>} first
     * @param {Parser<any>} second
     * @param {T} value
     */
    setGet(first, second, value) {
        this.set(first, second, value);
        return value
    }
}

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

    /** @param {Regexer<Parser<any>>} regexer */
    static makeContext(regexer = null, input = "") {
        return /** @type {Context} */({
            regexer: regexer,
            input: input,
            equals: new PairMap(),
            visited: new Map(),
        })
    }
}

/** @template T */
class Parser {

    static indentation = "    "

    /** @protected */
    predicate = v => this === v || v instanceof Function && this instanceof v

    /** Calling parse() can make it change the overall parsing outcome */
    isActualParser = true

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


    unwrap(target = /** @type {Parser<any>} */(null)) {
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

    /**
     * @param {ConstructorType<Parser<any>>[]} traverse List of types to ignore and traverse even though they have isActualParser = true
     * @param {ConstructorType<Parser<any>>[]} opaque List of types to consider actual parser even though they have isActualParser = false
     * @returns {Parser<any>}
     */
    actualParser(traverse = [], opaque = []) {
        let isTraversable = (!this.isActualParser || traverse.some(this.predicate)) && !opaque.some(this.predicate);
        let unwrapped = isTraversable ? this.unwrap() : undefined;
        isTraversable &&= unwrapped?.length === 1;
        return isTraversable ? unwrapped[0].actualParser(traverse, opaque) : this
    }

    /**
     * @param {Parser<any>?} other
     * @param {(Parser<any> | ConstructorType<Parser<any>>)[]} traverse List of types to ignore and traverse even though they have isActualParser = true
     * @param {(Parser<any> | ConstructorType<Parser<any>>)[]} opaque List of types to consider actual parser even though they have isActualParser = false
     * @returns {Parser<any>}
     */
    withActualParser(other, traverse = [], opaque = []) {
        let isTraversable = (!this.isActualParser || traverse.some(this.predicate)) && !opaque.some(this.predicate);
        let unwrapped = isTraversable ? this.unwrap() : undefined;
        isTraversable &&= unwrapped?.length === 1;
        return isTraversable ? this.wrap(unwrapped[0].withActualParser(other, traverse, opaque)) : other
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} rhs
     * @param {Boolean} strict
     */
    equals(context, rhs, strict) {
        let lhs = /** @type {Parser<any>} */(this);
        if (lhs === rhs) {
            return true
        }
        if (!strict) {
            lhs = this.actualParser();
            rhs = rhs.actualParser();
        }
        if (
            rhs instanceof lhs.constructor && !(lhs instanceof rhs.constructor)
            // @ts-expect-error
            || rhs.resolve && !lhs.resolve
        ) {
            // Take advantage of polymorphism or compare a lazy against a non lazy (not the other way around)
            const temp = lhs;
            lhs = rhs;
            rhs = temp;
        }
        let memoized = context.equals.get(lhs, rhs);
        if (memoized !== undefined) {
            return memoized
        } else if (memoized === undefined) {
            context.equals.set(lhs, rhs, true);
            memoized = lhs.doEquals(context, rhs, strict);
            context.equals.set(lhs, rhs, memoized);
        }
        return memoized
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return false
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof StringParser && this.#value === other.#value
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return strict ? other instanceof SuccessParser : super.doEquals(context, other, false)
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

    #backtracking = false
    get backtracking() {
        return this.#backtracking
    }

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {T} parsers */
    constructor(...parsers) {
        super();
        this.#parsers = parsers;
        if (this.#parsers.length === 1) {
            this.isActualParser = false;
        }
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
        result.#backtracking = this.#backtracking;
        return result
    }

    asBacktracking() {
        const result = this.wrap(...this.#parsers);
        result.#backtracking = true;
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        if (
            !(other instanceof AlternativeParser)
            || this.#parsers.length != other.#parsers.length
            || this.#backtracking !== other.#backtracking
        ) {
            return false
        }
        for (let i = 0; i < this.#parsers.length; ++i) {
            if (!this.#parsers[i].equals(context, other.#parsers[i], strict)) {
                return false
            }
        }
        return true
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
 * @template {(v: ParserValue<T>, input: String, position: Number) => Regexer<Parser<any>>} C
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

    unwrap(target = /** @type {Parser<any>} */(null)) {
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof ChainedParser
            && this.#fn === other.#fn
            && this.#parser.equals(context, other.parser, strict)
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof FailureParser
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
    isActualParser = false

    /** @type {T} */
    #resolvedPraser

    /** @param {() => Regexer<T>} parser */
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

    unwrap(target = /** @type {Parser<any>} */(null)) {
        return [this.resolve()]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        const regexerConstructor = /** @type {ConstructorType<Regexer<typeof parsers[0]>>} */(
            this.#parser().constructor
        );
        return new LazyParser(() => new regexerConstructor(parsers[0]))
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        if (other instanceof LazyParser) {
            if (this.#parser === other.#parser) {
                return true
            }
            other = other.resolve();
        } else if (strict) {
            return false
        }
        this.resolve();
        return this.#resolvedPraser.equals(context, other, strict)
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
class LookaroundParser extends Parser {

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

    unwrap(target = /** @type {Parser<any>} */(null)) {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        return new LookaroundParser(parsers[0], this.#type)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        if (
            this.#type === LookaroundParser.Type.NEGATIVE_BEHIND
            || this.#type === LookaroundParser.Type.POSITIVE_BEHIND
        ) {
            throw new Error("Lookbehind is not implemented yet")
        } else {
            const result = this.#parser.parse(context, position);
            return result.status == (this.#type === LookaroundParser.Type.POSITIVE_AHEAD)
                ? Reply.makeSuccess(position, "")
                : Reply.makeFailure(position)
        }
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return this === other
            || other instanceof LookaroundParser
            && this.#type === other.#type
            && this.#parser.equals(context, other.#parser, strict)
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
 * @template {Parser<any>} P
 * @template R
 * @extends Parser<R>
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

    isActualParser = false

    /**
     * @param {P} parser
     * @param {(v: ParserValue<P>) => R} mapper
     */
    constructor(parser, mapper) {
        super();
        this.#parser = parser;
        this.#mapper = mapper;
    }

    unwrap(target = /** @type {Parser<any>} */(null)) {
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
     * @returns {Result<R>}
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof MapParser
            && this.#mapper === other.#mapper
            && this.#parser.equals(context, other.#parser, strict)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        let serializedMapper = this.#mapper.toString();
        if (serializedMapper.length > 80 || serializedMapper.includes("\n")) {
            serializedMapper = "( ... ) => { ... }";
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof RegExpParser
            && (!strict || this.#group === other.#group)
            && this.#regexp.source === other.#regexp.source
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
        if (this.#parsers.length === 1) {
            this.isActualParser = false;
        }
    }

    unwrap(target = /** @type {Parser<any>} */(null)) {
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        if (!(other instanceof SequenceParser) || this.#parsers.length != other.#parsers.length) {
            return false
        }
        for (let i = 0; i < this.#parsers.length; ++i) {
            if (!this.#parsers[i].equals(context, other.#parsers[i], strict)) {
                return false
            }
        }
        return true
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

    #backtracking = false
    get backtracking() {
        return this.#backtracking
    }

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

    unwrap(target = /** @type {Parser<any>} */(null)) {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        const result = /** @type {TimesParser<typeof parsers[0]>} */(new TimesParser(parsers[0], this.#min, this.#max));
        if (this.#backtracking) {
            result.#backtracking = true;
        }
        return result
    }

    asBacktracking() {
        const result = new TimesParser(this.#parser, this.#min, this.#max);
        result.#backtracking = true;
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof TimesParser
            && this.#backtracking === other.#backtracking
            && this.#min === other.#min
            && this.#max === other.#max
            && this.#parser.equals(context, other.#parser, strict)
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
                            + (this.#min !== this.#max ? "," : this.#max !== Number.POSITIVE_INFINITY ? this.#max : "")
                            + "}"
            )
    }
}

/**
 * @template {Parser<any>} T
 * @extends {AlternativeParser<[ParserValue<T>, SuccessParser]>}
 */
class OptionalParser extends AlternativeParser {

    /** @param {T} parser */
    constructor(parser) {
        super(parser, SuccessParser.instance);
    }

    unwrap(target = /** @type {Parser<any>} */(null)) {
        return [this.parsers[0]]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     * @returns {OptionalParser<T>}
     */
    wrap(...parsers) {
        // @ts-expect-error
        return super.wrap(...parsers, SuccessParser.instance)
    }
}

/** @template {Parser<any>} T */
class Regexer {

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
        this.Self = this.constructor;
        this.#parser = parser;
        this.#optimized = optimized;
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
        const a = lhs instanceof Regexer ? lhs.getParser() : lhs;
        const b = rhs instanceof Regexer ? rhs.getParser() : rhs;
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
        const result = this.#parser.parse(Reply.makeContext(this, input), 0);
        return result.status && result.position === input.length ? result : Reply.makeFailure(result.position)
    }

    /** @param {String} input */
    parse(input) {
        const result = this.run(input);
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
        const results = new this(new SequenceParser(...parsers.map(p => p.getParser())));
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
            .map(Regexer.#arrayFlatter);
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

export { Regexer as default };

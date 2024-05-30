class Reply {

    /**
     * @template T
     * @param {Number} position
     * @param {T} value
     * @param {PathNode} bestPath
     * @returns {Result<T>}
     */
    static makeSuccess(position, value, bestPath = null, bestPosition = 0) {
        return {
            status: true,
            value: value,
            position: position,
            bestParser: bestPath,
            bestPosition: bestPosition,
        }
    }

    /**
     * @param {PathNode} bestPath
     * @returns {Result<null>}
     */
    static makeFailure(position = 0, bestPath = null, bestPosition = 0) {
        return {
            status: false,
            value: null,
            position,
            bestParser: bestPath,
            bestPosition: bestPosition,
        }
    }

    /** @param {Parsernostrum<any>} parsernostrum */
    static makeContext(parsernostrum = null, input = "") {
        return /** @type {Context} */({
            parsernostrum,
            input,
            highlighted: null,
        })
    }

    static makePathNode(parser, index = 0, previous = null) {
        return /** @type {PathNode} */({
            parent: previous,
            current: parser,
            index,
        })
    }
}

/** @template T */
class Parser {

    static indentation = "    "
    static highlight = "Last valid parser"

    /** @type {(new (...args: any) => Parser) & typeof Parser} */
    Self

    /** @param {String} value */
    static frame(value, label = "", indentation = "") {
        label = value ? "[ " + label + " ]" : "";
        let rows = value.split("\n");
        const width = Math.max(...rows.map(r => r.length));
        const rightPadding = width < label.length ? " ".repeat(label.length - width) : "";
        for (let i = 0; i < rows.length; ++i) {
            rows[i] =
                indentation
                + "| "
                + rows[i]
                + " ".repeat(width - rows[i].length)
                + rightPadding
                + " |";
        }
        if (label.length < width) {
            label = label + "─".repeat(width - label.length);
        }
        const rowA = "┌─" + label + "─┐";
        const rowB = indentation + "└─" + "─".repeat(label.length) + "─┘";
        rows = [rowA, ...rows, rowB];
        return rows.join("\n")
    }

    /**
     * @param {PathNode} path
     * @param {Number} index
     * @returns {PathNode}
     */
    makePath(path, index) {
        return { current: this, parent: path, index }
    }

    /**
     * @param {Context} context
     * @param {PathNode} path
     */
    isHighlighted(context, path) {
        if (context.highlighted instanceof Parser) {
            return context.highlighted === this
        }
        if (!context.highlighted || !path?.current) {
            return false
        }
        let a, b;
        for (
            a = path,
            b = /** @type {PathNode} */(context.highlighted);
            a.current && b.current;
            a = a.parent,
            b = b.parent
        ) {
            if (a.current !== b.current || a.index !== b.index) {
                return false
            }
        }
        return !a.current && !b.current
    }

    /** @param {PathNode?} path */
    isVisited(path) {
        if (!path) {
            return false
        }
        for (path = path.parent; path != null; path = path.parent) {
            if (path.current === this) {
                return true
            }
        }
        return false
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T>}
     */
    parse(context, position, path, index) {
        return null
    }

    /** @param {PathNode} path */
    toString(context = Reply.makeContext(null, ""), indentation = "", path = null, index = 0) {
        path = this.makePath(path, index);
        if (this.isVisited(path)) {
            return "<...>"
        }
        const isVisited = this.isVisited(path);
        const isHighlighted = this.isHighlighted(context, path);
        let result = isVisited ? "<...>" : this.doToString(context, isHighlighted ? "" : indentation, path, index);
        if (isHighlighted) {
            /** @type {String[]} */
            result = Parser.frame(result, Parser.highlight, indentation);
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        return `${this.constructor.name} does not implement toString()`
    }
}

/** @template {String} T */
class StringParser extends Parser {

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
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<String>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index);
        const end = position + this.#value.length;
        const value = context.input.substring(position, end);
        const result = this.#value === value
            ? Reply.makeSuccess(end, this.#value, path, end)
            : Reply.makeFailure();
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        return `"${this.value.replaceAll("\n", "\\n").replaceAll('"', '\\"')}"`
    }
}

/** @extends Parser<""> */
class SuccessParser extends Parser {

    static instance = new SuccessParser()

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<"">}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index);
        return Reply.makeSuccess(position, "", path, 0)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        return "<SUCCESS>"
    }
}

/**
 * @template {any[]} T
 * @typedef {T extends [infer A] ? A
 *     : T extends [infer A, ...infer B] ? A | Union<B>
 *     : never
 * } Union
 */

/**
 * @template {any[]} T
 * @extends Parser<Union<T>>
 */
class AlternativeParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {Parser[]} parsers */
    constructor(...parsers) {
        super();
        this.#parsers = parsers;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index);
        const result = /** @type {Result<Union<T>>} */(Reply.makeSuccess(0, ""));
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, position, path, i);
            if (outcome.bestPosition > result.bestPosition) {
                result.bestParser = outcome.bestParser;
                result.bestPosition = outcome.bestPosition;
            }
            if (outcome.status) {
                result.value = outcome.value;
                result.position = outcome.position;
                return result
            }
        }
        result.status = false;
        result.value = null;
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        // Short syntax for optional parser
        if (this.#parsers.length === 2 && this.#parsers[1] instanceof SuccessParser) {
            let result = this.#parsers[0].toString(context, indentation, path, 0);
            if (!(this.#parsers[0] instanceof StringParser)) {
                result = "<" + result + ">";
            }
            result += "?";
            return result
        }
        const deeperIndentation = indentation + Parser.indentation;
        let result = "ALT<\n"
            + deeperIndentation
            + this.#parsers
                .map((parser, i) => parser.toString(
                    context,
                    deeperIndentation + " ".repeat(i === 0 ? 0 : Parser.indentation.length - 2),
                    path,
                    i,
                ))
                .join("\n" + deeperIndentation + "| ")
            + "\n" + indentation + ">";
        return result
    }
}

/**
 * @template S
 * @template T
 * @extends Parser<T>
 */
class ChainedParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #fn

    /**
     * @param {Parser<S>} parser
     * @param {(v: S, input: String, position: Number) => Parsernostrum<T>} chained
     */
    constructor(parser, chained) {
        super();
        this.#parser = parser;
        this.#fn = chained;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index);
        const outcome = this.#parser.parse(context, position, path, 0);
        if (!outcome.status) {
            // @ts-expect-error
            return outcome
        }
        const result = this.#fn(outcome.value, context.input, outcome.position)
            .getParser()
            .parse(context, outcome.position, path, 0);
        if (outcome.bestPosition > result.bestPosition) {
            result.bestParser = outcome.bestParser;
            result.bestPosition = outcome.bestPosition;
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        const result = this.#parser.toString(context, indentation, path, 0) + " => chained<f()>";
        return result
    }
}

/** @extends Parser<null> */
class FailureParser extends Parser {

    static instance = new FailureParser()

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     */
    parse(context, position, path, index) {
        return Reply.makeFailure()
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        return "<FAILURE>"
    }
}

/**
 * @template T
 * @extends Parser<T>
 */
class Label extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #label = ""

    /**
     * @param {Parser<T>} parser
     * @param {String} label
     */
    constructor(parser, label) {
        super();
        this.#parser = parser;
        this.#label = label;
    }

    /**
     * @param {PathNode} path
     * @param {Number} index
     */
    makePath(path, index) {
        return path // Label does not alter the path
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     */
    parse(context, position, path, index) {
        this.parse = this.#parser.parse.bind(this.#parser);
        return this.parse(context, position, path, index)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        let result = this.#parser.toString(context, "", path, index);
        result = Parser.frame(result, this.#label, indentation);
        return result
    }
}

/**
 * @template T
 * @extends Parser<T>
 */
class LazyParser extends Parser {

    #parser

    /** @type {Parser<T>} */
    #resolvedPraser

    /** @param {() => Parsernostrum<T>} parser */
    constructor(parser) {
        super();
        this.#parser = parser;
    }

    /**
     * @param {PathNode} path
     * @param {Number} index
     */
    makePath(path, index) {
        return path
    }

    /**
     * @param {Context} context
     * @param {PathNode} path
     */
    isHighlighted(context, path) {
        if (super.isHighlighted(context, path)) {
            // If LazyParser is highlighted, then highlight its child
            const childrenPath = { parent: path, parser: this.#resolvedPraser, index: 0 };
            context.highlighted = context.highlighted instanceof Parser ? this.#resolvedPraser : childrenPath;
        }
        return false
    }

    resolve() {
        if (!this.#resolvedPraser) {
            this.#resolvedPraser = this.#parser().getParser();
        }
        return this.#resolvedPraser
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T>}
     */
    parse(context, position, path, index) {
        this.resolve();
        this.parse = this.#resolvedPraser.parse.bind(this.#resolvedPraser);
        return this.parse(context, position, path, index)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        this.resolve();
        this.doToString = this.#resolvedPraser.toString.bind(this.#resolvedPraser);
        return this.doToString(context, indentation, path, index)
    }
}

/** @extends Parser<""> */
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
     * @param {Parser} parser
     * @param {Type} type
     */
    constructor(parser, type) {
        super();
        this.#parser = parser;
        this.#type = type;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<"">}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index);
        let result = this.#parser.parse(context, position, path, 0);
        result = result.status == (this.#type === Lookahead.Type.POSITIVE_AHEAD)
            ? Reply.makeSuccess(position, "", path, position)
            : Reply.makeFailure();
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        return "(" + this.#type + this.#parser.toString(context, indentation, path, 0) + ")"
    }
}

/**
 * @template T
 * @extends Parser<T>
 */
class RegExpParser extends Parser {

    /** @type {RegExp} */
    #regexp
    get regexp() {
        return this.#regexp
    }
    /** @type {RegExp} */
    #anchoredRegexp
    #matchMapper

    static #createEscapeable = character => String.raw`[^${character}\\]*(?:\\.[^${character}\\]*)*`
    static #numberRegex = /[-\+]?(?:\d*\.)?\d+/
    static common = {
        number: new RegExp(this.#numberRegex.source + String.raw`(?!\.)`),
        numberInteger: /[\-\+]?\d+(?!\.\d)/,
        numberNatural: /\d+/,
        numberExponential: new RegExp(this.#numberRegex.source + String.raw`(?:[eE][\+\-]?\d+)?(?!\.)`),
        numberUnit: /\+?(?:0(?:\.\d+)?|1(?:\.0+)?)(?![\.\d])/,
        numberByte: /0*(?:25[0-5]|2[0-4]\d|1?\d?\d)(?!\d|\.)/,
        whitespace: /\s+/,
        whitespaceOpt: /\s*/,
        whitespaceInline: /[^\S\n]+/,
        whitespaceInlineOpt: /[^\S\n]*/,
        whitespaceMultiline: /\s*?\n\s*/,
        doubleQuotedString: new RegExp(`"(${this.#createEscapeable('"')})"`),
        singleQuotedString: new RegExp(`'(${this.#createEscapeable("'")})'`),
        backtickQuotedString: new RegExp("`(" + this.#createEscapeable("`") + ")`"),
    }

    /**
     * @param {RegExp} regexp
     * @param {(match: RegExpExecArray) => T} matchMapper
     */
    constructor(regexp, matchMapper) {
        super();
        this.#regexp = regexp;
        this.#anchoredRegexp = new RegExp(`^(?:${regexp.source})`, regexp.flags);
        this.#matchMapper = matchMapper;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index);
        const match = this.#anchoredRegexp.exec(context.input.substring(position));
        if (match) {
            position += match[0].length;
        }
        const result = match
            ? Reply.makeSuccess(position, this.#matchMapper(match), path, position)
            : Reply.makeFailure();
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        let result = "/" + this.#regexp.source + "/";
        const shortname = Object.entries(RegExpParser.common).find(([k, v]) => v.source === this.#regexp.source)?.[0];
        if (shortname) {
            result = "P." + shortname;
        }
        return result
    }
}

/**
 * @template S
 * @template T
 * @extends Parser<T>
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
     * @param {Parser<S>} parser
     * @param {(v: S) => T} mapper
     */
    constructor(parser, mapper) {
        super();
        this.#parser = parser;
        this.#mapper = mapper;
    }

    /**
     * @param {Context} context
     * @param {PathNode} path
     */
    isHighlighted(context, path) {
        if (super.isHighlighted(context, path)) {
            // If MapParser is highlighted, then highlight its child
            const childrenPath = { parent: path, parser: this.#parser, index: 0 };
            context.highlighted = context.highlighted instanceof Parser ? this.#parser : childrenPath;
        }
        return false
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index);
        // @ts-expect-error
        const result = /** @type {Result<T>} */(this.#parser.parse(context, position, path, 0));
        if (result.status) {
            // @ts-expect-error
            result.value = this.#mapper(result.value);
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        let result = this.#parser.toString(context, indentation, path, 0);
        if (this.#parser instanceof RegExpParser) {
            if (Object.values(RegExpParser.common).includes(this.#parser.regexp)) {
                if (
                    this.#parser.regexp === RegExpParser.common.numberInteger
                    && this.#mapper === /** @type {(v: any) => BigInt} */(BigInt)
                ) {
                    return "P.numberBigInteger"
                }
                return result
            }
        }
        let serializedMapper = this.#mapper.toString();
        if (serializedMapper.length > 60 || serializedMapper.includes("\n")) {
            serializedMapper = "(...) => { ... }";
        }
        result += ` -> map<${serializedMapper}>`;
        return result
    }
}

/** @extends {RegExpParser<RegExpExecArray>} */
class RegExpArrayParser extends RegExpParser {

    /** @param {RegExpExecArray} match */
    static #mapper = match => match

    /** @param {RegExp} regexp */
    constructor(regexp) {
        super(regexp, RegExpArrayParser.#mapper);
    }
}

/** @extends {RegExpParser<String>} */
class RegExpValueParser extends RegExpParser {

    /** @param {RegExp} regexp */
    constructor(regexp, group = 0) {
        super(regexp, match => match[group]);
    }
}

/**
 * @template {any[]} T
 * @extends Parser<T>
 */
class SequenceParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {Parser[]} parsers */
    constructor(...parsers) {
        super();
        this.#parsers = parsers;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index);
        const value = /** @type {ParserValue<T>} */(new Array(this.#parsers.length));
        const result = Reply.makeSuccess(position, value);
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, result.position, path, i);
            if (outcome.bestPosition > result.bestPosition) {
                result.bestParser = outcome.bestParser;
                result.bestPosition = outcome.bestPosition;
            }
            if (!outcome.status) {
                result.status = false;
                result.value = null;
                break
            }
            result.value[i] = outcome.value;
            result.position = outcome.position;
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        const deeperIndentation = indentation + Parser.indentation;
        const result = "SEQ<\n"
            + deeperIndentation
            + this.#parsers
                .map((parser, index) => parser.toString(context, deeperIndentation, path, index))
                .join("\n" + deeperIndentation)
            + "\n" + indentation + ">";
        return result
    }
}

/**
 * @template T
 * @extends Parser<T[]>
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

    /** @param {Parser<T>} parser */
    constructor(parser, min = 0, max = Number.POSITIVE_INFINITY) {
        super();
        if (min > max) {
            throw new Error("Min is greater than max")
        }
        this.#parser = parser;
        this.#min = min;
        this.#max = max;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T[]>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index);
        const value = /** @type {ParserValue<T>[]} */([]);
        const result = Reply.makeSuccess(position, value, path);
        for (let i = 0; i < this.#max; ++i) {
            const outcome = this.#parser.parse(context, result.position, path, 0);
            if (outcome.bestPosition > result.bestPosition) {
                result.bestParser = outcome.bestParser;
                result.bestPosition = outcome.bestPosition;
            }
            if (!outcome.status) {
                if (i < this.#min) {
                    result.status = false;
                    result.value = null;
                }
                break
            }
            // @ts-expect-error
            result.value.push(outcome.value);
            result.position = outcome.position;
        }
        // @ts-expect-error
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        let result = this.parser.toString(context, indentation, path, 0);
        const serialized =
            this.#min === 0 && this.#max === 1 ? "?"
                : this.#min === 0 && this.#max === Number.POSITIVE_INFINITY ? "*"
                    : this.#min === 1 && this.#max === Number.POSITIVE_INFINITY ? "+"
                        : "{"
                        + this.#min
                        + (this.#min !== this.#max ? "," + this.#max : "")
                        + "}";
        result += serialized;
        return result
    }
}

/** @template T */
class Parsernostrum {

    #parser

    /** @type {(new (parser: Parser) => Parsernostrum<T>) & typeof Parsernostrum} */
    Self

    static lineColumnFromOffset(string, offset) {
        const lines = string.substring(0, offset).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return { line, column }
    }
    /** @param {[any, ...any] | RegExpExecArray} param0 */
    static #firstElementGetter = ([v, _]) => v
    /** @param {[any, any, ...any] | RegExpExecArray} param0 */
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
    // @ts-expect-error
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

    /** @param {Parser<T>} parser */
    constructor(parser, optimized = false) {
        this.#parser = parser;
    }

    /** @param {PathNode} path */
    static #simplifyPath(path) {
        /** @type {PathNode[]} */
        const array = [];
        while (path) {
            array.push(path);
            path = path.parent;
        }
        array.reverse();
        /** @type {Map<Parser, Number>} */
        let visited = new Map();
        for (let i = 1; i < array.length; ++i) {
            const existing = visited.get(array[i].current);
            if (existing !== undefined) {
                if (array[i + 1]) {
                    array[i + 1].parent = array[existing];
                }
                visited = new Map([...visited.entries()].filter(([parser, index]) => index <= existing || index > i));
                visited.set(array[i].current, existing);
                array.splice(existing + 1, i - existing);
                i = existing;
            } else {
                visited.set(array[i].current, i);
            }
        }
        return array[array.length - 1]
    }

    getParser() {
        return this.#parser
    }

    /** @param {String} input */
    run(input) {
        const result = this.#parser.parse(Reply.makeContext(this, input), 0, Reply.makePathNode(), 0);
        if (result.position !== input.length) {
            result.status = false;
        }
        return /** @type {Result<T>} */(result)
    }

    /**
     * @param {String} input
     * @throws {Error} when the parser fails to match
     */
    parse(input, printParser = true) {
        const result = this.run(input);
        if (result.status) {
            return result.value
        }
        const chunkLength = 60;
        const chunkRange = /** @type {[Number, Number]} */(
            [Math.ceil(chunkLength / 2), Math.floor(chunkLength / 2)]
        );
        const position = Parsernostrum.lineColumnFromOffset(input, result.bestPosition);
        let bestPosition = result.bestPosition;
        const inlineInput = input.replaceAll(
            /^(\s)+|\s{6,}|\s*?\n\s*/g,
            (m, startingSpace, offset) => {
                let replaced = startingSpace ? "..." : " ... ";
                if (offset <= result.bestPosition) {
                    if (result.bestPosition < offset + m.length) {
                        bestPosition -= result.bestPosition - offset;
                    } else {
                        bestPosition -= m.length - replaced.length;
                    }
                }
                return replaced
            }
        );
        const string = inlineInput.substring(0, chunkLength).trimEnd();
        const leadingWhitespaceLength = Math.min(
            input.substring(result.bestPosition - chunkRange[0]).match(/^\s*/)[0].length,
            chunkRange[0] - 1,
        );
        let offset = Math.min(bestPosition, chunkRange[0] - leadingWhitespaceLength);
        chunkRange[0] = Math.max(0, bestPosition - chunkRange[0]) + leadingWhitespaceLength;
        chunkRange[1] = Math.min(input.length, chunkRange[0] + chunkLength);
        let segment = inlineInput.substring(...chunkRange);
        if (chunkRange[0] > 0) {
            segment = "..." + segment;
            offset += 3;
        }
        if (chunkRange[1] < inlineInput.length - 1) {
            segment = segment + "...";
        }
        const bestParser = this.toString(Parser.indentation, true, Parsernostrum.#simplifyPath(result.bestParser));
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
     * @template {Parsernostrum[]} P
     * @param {P} parsers
     * @returns {Parsernostrum<ParserValue<P>>}
     */
    static seq(...parsers) {
        return new this(new SequenceParser(...parsers.map(p => p.getParser())))
    }

    /**
     * @template {Parsernostrum[]} P
     * @param {P} parsers
     * @returns {Parsernostrum<UnionFromArray<ParserValue<P>>>}
     */
    static alt(...parsers) {
        return new this(new AlternativeParser(...parsers.map(p => p.getParser())))
    }

    /**
     * @template {Parsernostrum} P
     * @param {P} parser
     */
    static lookahead(parser) {
        return new this(new Lookahead(parser.getParser(), Lookahead.Type.POSITIVE_AHEAD))
    }

    /**
     * @template {Parsernostrum} P
     * @param {() => P} parser
     * @returns {Parsernostrum<ParserValue<P>>}
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
     * @template {Parsernostrum} P
     * @param {P} separator
     */
    sepBy(separator, allowTrailing = false) {
        const results = Parsernostrum.seq(
            this,
            Parsernostrum.seq(separator, this).map(Parsernostrum.#secondElementGetter).many()
        )
            .map(Parsernostrum.#arrayFlatter);
        return results
    }

    skipSpace() {
        return Parsernostrum.seq(this, Parsernostrum.whitespaceOpt).map(Parsernostrum.#firstElementGetter)
    }

    /**
     * @template R
     * @param {(v: T) => R} fn
     * @returns {Parsernostrum<R>}
     */
    map(fn) {
        return new Parsernostrum(new MapParser(this.#parser, fn))
    }

    /**
     * @template {Parsernostrum} P
     * @param {(v: T, input: String, position: Number) => P} fn
     * @returns {P}
     */
    chain(fn) {
        // @ts-expect-error
        return new Parsernostrum(new ChainedParser(this.#parser, fn))
    }

    /**
     * @param {(v: T, input: String, position: Number) => boolean} fn
     * @return {Parsernostrum<T>}
     */
    assert(fn) {
        return this.chain((v, input, position) => fn(v, input, position)
            ? Parsernostrum.success().map(() => v)
            : Parsernostrum.failure()
        )
    }

    join(value = "") {
        return this.map(Parsernostrum.#joiner)
    }

    /** @return {Parsernostrum<T>} */
    label(value = "") {
        return new Parsernostrum(new Label(this.#parser, value))
    }

    /** @param {Parsernostrum | Parser | PathNode} highlight */
    toString(indentation = "", newline = false, highlight = null) {
        if (highlight instanceof Parsernostrum) {
            highlight = highlight.getParser();
        }
        const context = Reply.makeContext(this, "");
        context.highlighted = highlight;
        const path = Reply.makePathNode();
        return (newline ? "\n" + indentation : "") + this.#parser.toString(context, indentation, path)
    }
}

export { Parsernostrum as default };

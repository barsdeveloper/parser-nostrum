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

    /** @param {Parsernostrum<Parser<any>>} parsernostrum */
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
            parser,
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

    /**
     * @param {String} target
     * @param {String} value
     */
    static appendBeforeHighlight(target, value) {
        if (target.endsWith(Parser.highlight)) {
            target = target.replace(/(?=(?:\n|^).+$)/, value);
        } else {
            target += value;
        }
        return target
    }

    /** @param {String} value */
    static lastRowLength(value, firstRowPadding = 0) {
        // This regex always matches and group 2 (content of the last row) is always there
        const match = value.match(/(?:\n|(^))([^\n]*)$/);
        // Group 1 tells wheter or not it matched the first row (last row is also first row)
        const additional = match[1] !== undefined ? firstRowPadding : 0;
        return match[2].length + additional
    }

    /**
     * @param {Context} context
     * @param {PathNode} path
     */
    isHighlighted(context, path) {
        if (context.highlighted instanceof Parser) {
            return context.highlighted === this
        }
        if (!context.highlighted || !path) {
            return false
        }
        let a, prevA, b, prevB;
        loop:
        for (
            a = path,
            b = /** @type {PathNode} */(context.highlighted);
            a && b;
            prevA = a, a = a.parent,
            prevB = b, b = b.parent
        ) {
            if (a.parser !== b.parser || a.index !== b.index) {
                if (!prevA || !prevB) {
                    return false // Starting nodes did not match
                }
                // Try to speculatevely walk the path in reverse to find matching nodes
                let nextA;
                let nextB;
                for (
                    nextA = a, nextB = b;
                    nextA || nextB;
                    nextA = nextA?.parent, nextB = nextB?.parent
                ) {
                    const aMatches = nextA?.parser === prevA.parser;
                    const bMatches = nextB?.parser === prevB.parser;
                    if (aMatches || bMatches) {
                        if (aMatches) {
                            prevA = nextA;
                        }
                        if (bMatches) {
                            prevB = nextB;
                        }
                        a = prevA;
                        b = prevB;
                        continue loop
                    }
                }
                return false
            }
        }
        return true
    }

    /** @param {PathNode?} path */
    isVisited(path) {
        if (!path) {
            return false
        }
        for (path = path.parent; path != null; path = path.parent) {
            if (path.parser === this) {
                return true
            }
        }
        return false
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @returns {Result<T>}
     */
    parse(context, position, path) {
        return null
    }

    /** @param {PathNode} path */
    toString(context = Reply.makeContext(null, ""), indent = 0, path = null) {
        if (this.isVisited(path)) {
            return "<...>" // Recursive parser
        }
        const result = this.doToString(context, indent, path);
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        return `${this.constructor.name} does not implement toString()`
    }
}

/**
 * @template {String} T
 * @extends {Parser<T>}
 */
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
     */
    parse(context, position, path) {
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
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const inlined = this.value.replaceAll("\n", "\\n");
        let result = !this.value.match(/^[a-zA-Z]$/)
            ? `"${inlined.replaceAll('"', '\\"')}"`
            : inlined;
        if (this.isHighlighted(context, path)) {
            result += "\n" + Parser.indentation.repeat(indent) + "^".repeat(result.length) + " " + Parser.highlight;
        }
        return result
    }
}

/** @extends Parser<String> */
class SuccessParser extends Parser {

    static instance = new SuccessParser()

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        return Reply.makeSuccess(position, "", path, 0)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        return "<SUCCESS>"
            + (this.isHighlighted(context, path)
                ? `\n${Parser.indentation.repeat(indent)}^^^^^^^^^ ${Parser.highlight}`
                : ""
            )
    }
}

/**
 * @template {Parser<any>[]} T
 * @extends Parser<ParserValue<T>>
 */
class AlternativeParser extends Parser {

    static highlightRegexp = new RegExp(
        // Matches the beginning of a row containing Parser.highlight only when after the first row of an alternative
        String.raw`(?<=[^\S\n]*\| .*\n)^(?=[^\S\n]*\^+ ${Parser.highlight}(?:\n|$))`,
        "m"
    )

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {T} parsers */
    constructor(...parsers) {
        super();
        this.#parsers = parsers;
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        const result = Reply.makeSuccess(0, /** @type {ParserValue<T>} */(""));
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(
                context,
                position,
                { parent: path, parser: this.#parsers[i], index: i }
            );
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
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const indentation = Parser.indentation.repeat(indent);
        const deeperIndentation = Parser.indentation.repeat(indent + 1);
        if (this.#parsers.length === 2 && this.#parsers[1] instanceof SuccessParser) {
            let result = this.#parsers[0].toString(
                context,
                indent,
                { parent: path, parser: this.#parsers[0], index: 0 }
            );
            if (!(this.#parsers[0] instanceof StringParser)) {
                result = "<" + result + ">";
            }
            result += "?";
            return result
        }
        let serialized = this.#parsers
            .map((parser, index) => parser.toString(context, indent + 1, { parent: path, parser, index }))
            .join("\n" + deeperIndentation + "| ");
        if (context.highlighted) {
            serialized = serialized.replace(AlternativeParser.highlightRegexp, "  ");
        }
        let result = "ALT<\n"
            + (this.isHighlighted(context, path) ? `${indentation}^^^ ${Parser.highlight}\n` : "")
            + deeperIndentation + serialized
            + "\n" + indentation + ">";
        return result
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

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        const outcome = this.#parser.parse(context, position, { parent: path, parser: this.#parser, index: 0 });
        if (!outcome.status) {
            return outcome
        }
        const result = this.#fn(outcome.value, context.input, outcome.position)
            .getParser()
            .parse(context, outcome.position);
        if (outcome.bestPosition > result.bestPosition) {
            result.bestParser = outcome.bestParser;
            result.bestPosition = outcome.bestPosition;
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const serialized = "chained<f()>";
        let result = this.#parser.toString(context, indent, { parent: path, parser: this.#parser, index: 0 });
        if (this.isHighlighted(context, path)) {
            result +=
                " => "
                + serialized
                + "\n"
                // Group 1 is the portion between the last newline and end or the whole text
                + Parser.indentation.repeat(indent)
                + " ".repeat(result.match(/(?:\n|^)([^\n]+)$/)?.[1].length + 4)
                + "^".repeat(serialized.length)
                + " "
                + Parser.highlight;
        } else {
            result = Parser.appendBeforeHighlight(result, " => " + serialized);
        }
        return result
    }
}

/** @extends Parser<any> */
class FailureParser extends Parser {

    static instance = new FailureParser()

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        return Reply.makeFailure()
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const result = "<FAILURE>" + (
            this.isHighlighted(context, path)
                ? `\n${Parser.indentation.repeat(indent)}^^^^^^^^^ ${Parser.highlight}`
                : ""
        );
        return result
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

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        this.resolve();
        return this.#resolvedPraser.parse(context, position, { parent: path, parser: this.#resolvedPraser, index: 0 })
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const childrenPath = { parent: path, parser: this.#resolvedPraser, index: 0 };
        if (this.isHighlighted(context, path)) {
            context.highlighted = context.highlighted instanceof Parser ? this.#resolvedPraser : childrenPath;
        }
        return this.resolve().toString(context, indent, childrenPath)
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

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        let result = this.#parser.parse(context, position, { parent: path, parser: this.#parser, index: 0 });
        result = result.status == (this.#type === Lookahead.Type.POSITIVE_AHEAD)
            ? Reply.makeSuccess(position, "", path, position)
            : Reply.makeFailure();
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        let result = "("
            + this.#type
            + this.#parser.toString(context, indent, { parent: path, parser: this.#parser, index: 0 })
            + ")";
        if (this.isHighlighted(context, path)) {
            result = result.replace(
                /(\n)|$/,
                "\n"
                + Parser.indentation.repeat(indent)
                + "^".repeat(this.#type.length + 1)
                + " "
                + Parser.highlight
                + "$1"
            );
        }
        return result
    }
}

/**
 * @template T
 * @extends {Parser<T>}
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
    static commonParser = {
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
     */
    parse(context, position, path) {
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
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        let result = "/" + this.#regexp.source + "/";
        const shortname = Object
            .entries(RegExpParser.commonParser)
            .find(([k, v]) => v.source === this.#regexp.source)?.[0];
        if (shortname) {
            result = "P." + shortname;
        }
        if (this.isHighlighted(context, path)) {
            result += "\n" + Parser.indentation.repeat(indent) + "^".repeat(result.length) + " " + Parser.highlight;
        }
        return result
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

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @returns {Result<P>}
     */
    parse(context, position, path) {
        const result = this.#parser.parse(context, position, { parent: path, parser: this.#parser, index: 0 });
        if (result.status) {
            result.value = this.#mapper(result.value);
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const childrenPath = { parent: path, parser: this.#parser, index: 0 };
        if (this.isHighlighted(context, path)) {
            context.highlighted = context.highlighted instanceof Parser ? this.#parser : childrenPath;
        }
        let result = this.#parser.toString(context, indent, childrenPath);
        if (this.#parser instanceof RegExpParser) {
            if (Object.values(RegExpParser.commonParser).includes(this.#parser.regexp)) {
                if (this.#parser.regexp === RegExpParser.commonParser.numberInteger && this.#mapper === BigInt) {
                    return "P.numberBigInteger"
                }
                return result
            }
        }
        let serializedMapper = this.#mapper.toString();
        if (serializedMapper.length > 60 || serializedMapper.includes("\n")) {
            serializedMapper = "(...) => { ... }";
        }
        serializedMapper = ` -> map<${serializedMapper}>`;
        result = Parser.appendBeforeHighlight(result, serializedMapper);
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
        super(
            regexp,
            /** @param {RegExpExecArray} match */
            match => match[group]
        );
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

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        const value = /** @type {ParserValue<T>} */(new Array(this.#parsers.length));
        const result = Reply.makeSuccess(position, value);
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(
                context,
                result.position,
                { parent: path, parser: this.#parsers[i], index: i }
            );
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
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const indentation = Parser.indentation.repeat(indent);
        const deeperIndentation = Parser.indentation.repeat(indent + 1);
        const result = "SEQ<\n"
            + (this.isHighlighted(context, path) ? `${indentation}^^^ ${Parser.highlight}\n` : "")
            + this.#parsers
                .map((parser, index) => deeperIndentation + parser.toString(context, indent + 1, { parent: path, parser, index }))
                .join("\n")
            + "\n" + indentation + ">";
        return result
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

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        const value = /** @type {ParserValue<T>[]} */([]);
        const result = Reply.makeSuccess(position, value, path);
        for (let i = 0; i < this.#max; ++i) {
            const outcome = this.#parser.parse(
                context,
                result.position,
                { parent: path, parser: this.#parser, index: 0 }
            );
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
            result.value.push(outcome.value);
            result.position = outcome.position;
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        let result = this.parser.toString(context, indent, { parent: path, parser: this.parser, index: 0 });
        const serialized =
            this.#min === 0 && this.#max === 1 ? "?"
                : this.#min === 0 && this.#max === Number.POSITIVE_INFINITY ? "*"
                    : this.#min === 1 && this.#max === Number.POSITIVE_INFINITY ? "+"
                        : "{"
                        + this.#min
                        + (this.#min !== this.#max ? "," + this.#max : "")
                        + "}";
        if (this.isHighlighted(context, path)) {
            result +=
                serialized
                + "\n"
                + " ".repeat(Parser.lastRowLength(result, Parser.indentation.length * indent))
                + "^".repeat(serialized.length)
                + " "
                + Parser.highlight;
        } else {
            result = Parser.appendBeforeHighlight(result, serialized);
        }
        return result
    }
}

/** @template {Parser<any>} T */
class Parsernostrum {

    #parser

    /** @type {(new (parser: Parser<any>) => Parsernostrum<typeof parser>) & typeof Parsernostrum} */
    Self

    static lineColumnFromOffset(string, offset) {
        const lines = string.substring(0, offset).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
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
    static #createEscapeable = character => String.raw`[^${character}\\]*(?:\\.[^${character}\\]*)*`

    // Prefedined parsers

    /** Parser accepting any valid decimal, possibly signed number */
    static number = this.reg(RegExpParser.commonParser.number).map(Number)

    /** Parser accepting any digits only number */
    static numberInteger = this.reg(RegExpParser.commonParser.numberInteger).map(Number)

    /** Parser accepting any digits only number and returns a BigInt */
    static numberBigInteger = this.reg(this.numberInteger.getParser().parser.regexp).map(BigInt)

    /** Parser accepting any digits only number */
    static numberNatural = this.reg(RegExpParser.commonParser.numberNatural).map(Number)

    /** Parser accepting any valid decimal, possibly signed, possibly in the exponential form number */
    static numberExponential = this.reg(RegExpParser.commonParser.numberExponential).map(Number)

    /** Parser accepting any valid decimal number between 0 and 1 */
    static numberUnit = this.reg(RegExpParser.commonParser.numberUnit).map(Number)

    /** Parser accepting any integer between 0 and 255 */
    static numberByte = this.reg(RegExpParser.commonParser.numberByte).map(Number)

    /** Parser accepting whitespace */
    static whitespace = this.reg(RegExpParser.commonParser.whitespace)

    /** Parser accepting whitespace */
    static whitespaceOpt = this.reg(RegExpParser.commonParser.whitespaceOpt)

    /** Parser accepting whitespace that spans on a single line */
    static whitespaceInline = this.reg(RegExpParser.commonParser.whitespaceInline)

    /** Parser accepting whitespace that spans on a single line */
    static whitespaceInlineOpt = this.reg(RegExpParser.commonParser.whitespaceInlineOpt)

    /** Parser accepting whitespace that contains a list a newline */
    static whitespaceMultiline = this.reg(RegExpParser.commonParser.whitespaceMultiline)

    /** Parser accepting a double quoted string and returns the content */
    static doubleQuotedString = this.reg(RegExpParser.commonParser.doubleQuotedString, 1)

    /** Parser accepting a single quoted string and returns the content */
    static singleQuotedString = this.reg(RegExpParser.commonParser.singleQuotedString, 1)

    /** Parser accepting a backtick quoted string and returns the content */
    static backtickQuotedString = this.reg(RegExpParser.commonParser.backtickQuotedString, 1)

    /** @param {T} parser */
    constructor(parser, optimized = false) {
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
        const result = this.#parser.parse(Reply.makeContext(this, input), 0, Reply.makePathNode(this.#parser));
        if (result.position !== input.length) {
            result.status = false;
        }
        return result
    }

    /**
     * @param {String} input
     * @throws {Error} when the parser fails to match
     */
    parse(input) {
        const result = this.run(input);
        if (!result.status) {
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
            throw new Error(
                `Could not parse: ${string}\n\n`
                + `Input: ${segment}\n`
                + "       " + " ".repeat(offset)
                + `^ From here (line: ${position.line}, column: ${position.column}, offset: ${result.bestPosition})${result.bestPosition === input.length ? ", end of string" : ""}\n\n`
                + (result.bestParser ? "Last valid parser matched:" : "No parser matched:")
                + this.toString(1, true, result.bestParser)
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
     * @template {Parsernostrum<Parser<any>>} P
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
     * @template P
     * @param {(v: ParserValue<T>) => P} fn
     * @returns {Parsernostrum<MapParser<T, P>>}
     */
    map(fn) {
        // @ts-expect-error
        return new Parsernostrum(new MapParser(this.#parser, fn))
    }

    /**
     * @template {Parsernostrum<any>} P
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

    /** @param {Parsernostrum<Parser<any>> | Parser<any> | PathNode} highlight */
    toString(indent = 0, newline = false, highlight = null) {
        if (highlight instanceof Parsernostrum) {
            highlight = highlight.getParser();
        }
        const context = Reply.makeContext(this, "");
        context.highlighted = highlight;
        return (newline ? "\n" + Parser.indentation.repeat(indent) : "")
            + this.#parser.toString(context, indent, Reply.makePathNode(this.#parser))
    }
}

export { Parsernostrum as default };

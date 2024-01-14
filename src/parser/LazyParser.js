import Parser from "./Parser.js"

/**
 * @template {Parser<any>} T
 * @extends Parser<ParserValue<T>>
 */
export default class LazyParser extends Parser {

    #parser

    /** @type {T} */
    #resolvedPraser

    /** @param {() => Parsernostrum<T>} parser */
    constructor(parser) {
        super()
        this.#parser = parser
    }

    resolve() {
        if (!this.#resolvedPraser) {
            this.#resolvedPraser = this.#parser().getParser()
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
        )
        return new LazyParser(() => new parsernostrumConstructor(parsers[0]))
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        context.path.push(this)
        this.resolve()
        const result = this.#resolvedPraser.parse(context, position)
        context.path.pop()
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     */
    doToString(context, indent) {
        if (this.isHighlighted(context)) {
            if (context.highlightedPath.length > 0) {
                context.highlightedPath.push(this.#resolvedPraser)
            } else {
                context.highlightedParser = this.#resolvedPraser
            }
        }
        return this.resolve().toString(context, indent)
    }
}

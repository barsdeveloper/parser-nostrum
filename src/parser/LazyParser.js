import Parser from "./Parser.js"

/** @template {Parser} T */
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

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        this.resolve()
        return this.#resolvedPraser.parse(context, position, { parent: path, parser: this.#resolvedPraser, index: 0 })
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const childrenPath = { parent: path, parser: this.#resolvedPraser, index: 0 }
        if (this.isHighlighted(context, path)) {
            context.highlighted = context.highlighted instanceof Parser ? this.#resolvedPraser : childrenPath
        }
        return this.resolve().toString(context, indent, childrenPath)
    }
}

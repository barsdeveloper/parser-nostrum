import Reply from "../Reply.js"

/** @template T */
export default class Parser {

    static indentation = "    "
    static highlight = "Last valid parser"

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

    /**
     * @param {String} target
     * @param {String} value
     */
    static appendBeforeHighlight(target, value) {
        if (target.endsWith(Parser.highlight)) {
            target = target.replace(/(?=(?:\n|^).+$)/, value)
        } else {
            target += value
        }
        return target
    }

    /** @param {String} value */
    static lastRowLength(value, firstRowPadding = 0) {
        // This regex always matches and group 2 (content of the last row) is always there
        const match = value.match(/(?:\n|(^))([^\n]*)$/)
        // Group 1 tells wheter or not it matched the first row (last row is also first row)
        const additional = match[1] !== undefined ? firstRowPadding : 0
        return match[2].length + additional
    }

    constructor() {
        // @ts-expect-error
        this.Self = this.constructor
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
     * @returns {Result<T> | Result<Parser>}
     */
    parse(context, position) {
        return null
    }

    /** @param {Parser<any>} highlight */
    toString(context = Reply.makeContext(null, ""), indent = 0, highlight = null) {
        if (context.visited.has(this)) {
            return "<...>" // Recursive parser
        }
        context.visited.set(this, null)
        return this.doToString(context, indent, highlight)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} highlight
     */
    doToString(context, indent, highlight) {
        return `${this.constructor.name} does not implement toString()`
    }
}

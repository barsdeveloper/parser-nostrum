import Reply from "../Reply.js"

/** @template T */
export default class Parser {

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

    /** @param {Context} context */
    isHighlighted(context) {
        if (context.highlightedPath.length === 0) {
            return context.highlightedParser === this
        }
        let i
        let j
        loop:
        for (
            i = context.path.length - 1,
            j = context.highlightedPath.length - 1;
            i >= 0 && j >= 0;
            --i,
            --j
        ) {
            if (context.path[i] !== context.highlightedPath[j]) {
                if (j > i) {
                    const initial = context.highlightedPath[++j]
                    while (--j >= 0) {
                        if (context.highlightedPath[j] === initial) {
                            // Retry with the same i
                            ++i
                            continue loop
                        }
                    }
                }
                return false
            }
        }
        return true
    }

    /** @param {Context} context */
    isVisited(context) {
        return context.path.includes(this)
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
        if (this.isVisited(context)) {
            return "<...>" // Recursive parser
        }
        context.path.push(this)
        const result = this.doToString(context, indent)
        context.path.pop()
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     */
    doToString(context, indent) {
        return `${this.constructor.name} does not implement toString()`
    }
}

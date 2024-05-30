import Reply from "../Reply.js"

/** @template T */
export default class Parser {

    static indentation = "    "
    static highlight = "Last valid parser"

    /** @type {(new (...args: any) => Parser) & typeof Parser} */
    Self

    /** @param {String} value */
    static frame(value, label = "", indentation = "") {
        label = value ? "[ " + label + " ]" : ""
        let rows = value.split("\n")
        const width = Math.max(...rows.map(r => r.length))
        const rightPadding = width < label.length ? " ".repeat(label.length - width) : ""
        for (let i = 0; i < rows.length; ++i) {
            rows[i] =
                indentation
                + "| "
                + rows[i]
                + " ".repeat(width - rows[i].length)
                + rightPadding
                + " |"
        }
        if (label.length < width) {
            label = label + "─".repeat(width - label.length)
        }
        const rowA = "┌─" + label + "─┐"
        const rowB = indentation + "└─" + "─".repeat(label.length) + "─┘"
        rows = [rowA, ...rows, rowB]
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
        let a, prevA, b, prevB
        loop:
        for (
            a = path,
            b = /** @type {PathNode} */(context.highlighted);
            a.current && b.current;
            prevA = a, a = a.parent,
            prevB = b, b = b.parent
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
        path = this.makePath(path, index)
        if (this.isVisited(path)) {
            return "<...>"
        }
        const isVisited = this.isVisited(path)
        const isHighlighted = this.isHighlighted(context, path)
        let result = isVisited ? "<...>" : this.doToString(context, isHighlighted ? "" : indentation, path, index)
        if (isHighlighted) {
            /** @type {String[]} */
            result = Parser.frame(result, Parser.highlight, indentation)
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

import Reply from "../Reply.js"

export default class Parser {

    static indentation = "    "
    static highlight = "Last valid parser"

    /** @type {(new (...args: any) => Parser) & typeof Parser} */
    Self

    /** @param {String} value */
    static lastRowLength(value, firstRowPadding = 0) {
        // This regex always matches and group 2 (content of the last row) is always there
        const match = value.match(/(?:\n|(^))([^\n]*)$/)
        // Group 1 tells wheter or not it matched the first row (last row is also first row)
        const additional = match[1] !== undefined ? firstRowPadding : 0
        return match[2].length + additional
    }

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

    /** @returns {Parser} */
    getConcreteParser() {
        return this
    }

    /**
     * @param {PathNode} path
     * @param {Number} index
     * @returns {PathNode}
     */
    makePath(path, index) {
        return { parent: path, parser: this, index }
    }

    /**
     * @param {Context} context
     * @param {PathNode} path
     */
    isHighlighted(context, path) {
        if (context.highlighted instanceof Parser) {
            return context.highlighted === this
        }
        if (!context.highlighted || !path?.parser) {
            return false
        }
        let a, prevA, b, prevB
        loop:
        for (
            a = path,
            b = /** @type {PathNode} */(context.highlighted);
            a.parser && b.parser;
            prevA = a, a = a.parent,
            prevB = b, b = b.parent
        ) {
            if (a.parser !== b.parser || a.index !== b.index) {
                if (!prevA?.parser || !prevB?.parser) {
                    return false // Starting nodes did not match
                }
                // Try to speculatevely walk the path in reverse to find matching nodes
                let nextA
                let nextB
                for (
                    nextA = a, nextB = b;
                    nextA?.parser || nextB?.parser;
                    nextA = nextA?.parent, nextB = nextB?.parent
                ) {
                    const aMatches = nextA?.parser === prevA.parser
                    const bMatches = nextB?.parser === prevB.parser
                    if (aMatches || bMatches) {
                        if (aMatches) {
                            prevA = nextA
                        }
                        if (bMatches) {
                            prevB = nextB
                        }
                        a = prevA
                        b = prevB
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
     * @param {Number} index
     * @returns {Result<ParserValue<any>>}
     */
    parse(context, position, path, index) {
        return null
    }

    /** @param {PathNode} path */
    toString(context = Reply.makeContext(null, ""), indentation = "", path = null, index = 0) {
        path = this.makePath(path, index)
        const isHighlighted = this.isHighlighted(context, path)
        let result = this.isVisited(path)
            ? "<...>" // Recursive parser
            : this.doToString(context, isHighlighted ? "" : indentation, path, index)
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

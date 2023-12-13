import Regexer from "../Regexer.js"

const R = Regexer

export default class MathGrammar {

    static #evaluate = entries => {
        const numbers = []
        const operators = []
        const evaluateTop = () => {
            const b = numbers.pop()
            const a = numbers.pop()
            const op = operators.pop().function
            numbers.push(op(a, b))
        }
        for (const entry of entries) {
            if (entry.constructor === Number) {
                numbers.push(entry)
            } else if (entry.constructor === Object) {
                while (
                    operators.length && (
                        operators[operators.length - 1].precedence > entry.precedence
                        || operators[operators.length - 1].precedence == entry.precedence && !entry.rightAssociative
                    )
                ) {
                    evaluateTop()
                }
                operators.push(entry)
            }
        }
        while (operators.length) {
            evaluateTop()
        }
        return numbers.pop()
    }

    static #number = R.number.map(v => Number(v))

    static #opFragment = R.lazy(() =>
        R.seq(
            R.optWhitespace,
            R.alt(
                R.str("^").map(() => ({
                    precedence: 20,
                    rightAssociative: true,
                    function: (a, b) => Math.pow(a, b),
                })),
                R.str("*").map(() => ({
                    precedence: 10,
                    rightAssociative: false,
                    function: (a, b) => a * b,
                })),
                R.str("/").map(() => ({
                    precedence: 10,
                    rightAssociative: false,
                    function: (a, b) => a / b,
                })),
                R.str("+").map(() => ({
                    precedence: 0,
                    rightAssociative: false,
                    function: (a, b) => a + b,
                })),
                R.str("-").map(() => ({
                    precedence: 0,
                    rightAssociative: false,
                    function: (a, b) => a - b,
                })),
            ).map(v => v),
            R.optWhitespace,
            MathGrammar.expressionFragment,
        )
            .map(([_0, operator, _2, expressionFragment]) => [operator, ...expressionFragment])
            .atLeast(1)
            .map(values => values.flatMap(v => v)),
    )

    static #termFragment = R.lazy(() =>
        R.alt(
            MathGrammar.#number.map(v => [v]),
            R.seq(
                R.str("("),
                R.optWhitespace,
                R.lazy(() => MathGrammar.expressionFragment),
                R.optWhitespace,
                R.str(")"),
            ).map(([_0, _1, entries]) => [this.#evaluate(entries)])
        ))

    static expressionFragment = R.alt(
        R.seq(
            MathGrammar.#termFragment,
            MathGrammar.#opFragment
        ).map(([term, fragment]) => [...term, ...fragment]),
        MathGrammar.#number.map(v => [v]),
    )

    static expression = MathGrammar.expressionFragment.map(v => this.#evaluate(v))
}

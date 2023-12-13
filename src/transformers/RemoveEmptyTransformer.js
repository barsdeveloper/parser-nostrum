import AlternativeParser from "../parser/AlternativeParser.js"
import Parser from "../parser/Parser.js"
import Transformer from "./Transformer.js"

export default class RemoveEmptyTransformer extends Transformer {

    /**
     * @protected
     * @template {Parser<any>} T
     * @param {Context} context
     * @param {T} parser
     * @return {T}
     */
    doTransform(context, parser) {
        if (parser.matchesEmpty()) {
            const children = parser.unwrap()
            let result = /** @type {T} */(
                parser.wrap(...children.map(v => this.transform(context, v)).filter(v => v != null))
            )
            if (result instanceof AlternativeParser && result.parsers.length === 1) {
                result = result.parsers[0]
            }
            return result
        }
        return parser
    }
}

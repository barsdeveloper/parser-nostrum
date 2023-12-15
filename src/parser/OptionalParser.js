import AlternativeParser from "./AlternativeParser.js"
import SuccessParser from "./SuccessParser.js"
/**
 * @template {Parser<any>} T
 * @extends {AlternativeParser<[ParserValue<T>, SuccessParser]>}
 */
export default class OptionalParser extends AlternativeParser {

    /** @param {T} parser */
    constructor(parser) {
        super(parser, SuccessParser.instance)
    }

    unwrap() {
        return [this.parsers[0]]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     * @returns {OptionalParser<T>}
     */
    wrap(...parsers) {
        // @ts-expect-error
        return super.wrap(...parsers, SuccessParser.instance)
    }
}

import AlternativeParser from "../parser/AlternativeParser.js"
import CapturingGroupParser from "../parser/CapturingGroupParser.js"
import FailureParser from "../parser/FailureParser.js"
import NonCapturingGroupParser from "../parser/NonCapturingGroupParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"
import SequenceParser from "../parser/SequenceParser.js"
import SuccessParser from "../parser/SuccessParser.js"
import TimesParser from "../parser/TimesParser.js"

/** @extends {ParentChildTransformer<[AlternativeParser, SequenceParser, TimesParser, CapturingGroupParser, NonCapturingGroupParser], [SuccessParser, FailureParser]>} */
export default class RemoveTrivialParsersTransformer extends ParentChildTransformer {

    static #arrayMapper = v => [v]

    constructor() {
        super(
            [
                AlternativeParser,
                SequenceParser,
                TimesParser,
                CapturingGroupParser,
                NonCapturingGroupParser
            ],
            [
                SuccessParser,
                FailureParser
            ]
        )
    }

    /**
     * @protected
     * @param {Context} context
     * @param {AlternativeParser<Parser<any>[]>
     *     | SequenceParser<Parser<any>[]>
     *     | TimesParser<Parser<any>>
     *     | CapturingGroupParser
     *     | NonCapturingGroupParser
     * } parent
     * @param {SuccessParser | FailureParser} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>?}
     */
    doTransformParent(context, parent, child, index, previousChild) {
        if (parent instanceof AlternativeParser && child instanceof SuccessParser) {
            return parent.wrap(...parent.parsers.slice(0, index))
        }
        if (
            parent instanceof SequenceParser && child instanceof FailureParser
            || parent instanceof TimesParser
            || parent instanceof CapturingGroupParser
            || parent instanceof NonCapturingGroupParser
        ) {
            return child
        }
    }

    /**
     * @protected
     * @param {Context} context
     * @param {AlternativeParser<Parser<any>[]>
     *     | SequenceParser<Parser<any>[]>
     *     | TimesParser<Parser<any>>
     *     | CapturingGroupParser
     *     | NonCapturingGroupParser
     * } parent
     * @param {SuccessParser | FailureParser} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>[]}
     */
    doTransformChild(context, parent, child, index, previousChild) {
        if (
            parent instanceof AlternativeParser && child instanceof FailureParser
            || parent instanceof SequenceParser && child instanceof SuccessParser
        ) {
            return [] // Remove the child from the list
        }
    }

}

import ParentChildTransformer from "./ParentChildTransformer.js"
import SequenceParser from "../parser/SequenceParser.js"
import StringParser from "../parser/StringParser.js"

/** @extends {ParentChildTransformer<[SequenceParser], [StringParser]>} */
export default class MergeStringsTransformer extends ParentChildTransformer {

    static replaceBothChildren = true

    constructor() {
        super([SequenceParser], [StringParser])
    }

    /**
     * @protected
     * @param {Context} context
     * @param {SequenceParser<Parser<any>[]>} parent
     * @param {Parser<any>} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>[]?}
     */
    doTransformChild(context, parent, child, index, previousChild) {
        if (previousChild instanceof StringParser && child instanceof StringParser) {
            const result = [new StringParser(previousChild.value + child.value)]
            if (previousChild != parent.parsers[index - 1]) {

            }
            return result
        }
    }
}

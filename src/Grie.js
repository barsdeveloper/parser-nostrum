/**
 * @typedef {{
 *     from: Number?,
 *     to: Number?,
 *     fragment: Parser<any>,
 * }} Range
 */

export default class Grie {

    /** @param {Range[]} ranges */
    static splitIntervals(ranges) {
        const fromOrderedRanges = ranges.toSorted((a, b) => {
            if (a.from == null) {
                a.from = Number.NEGATIVE_INFINITY
            }
            if (b.from == null) {
                b.from = Number.NEGATIVE_INFINITY
            }
            return a.from - b.from
        })
        const toOrderedRanges = ranges.toSorted((a, b) => {
            if (a.to == null) {
                a.to = Number.POSITIVE_INFINITY
            }
            if (b.to == null) {
                b.to = Number.POSITIVE_INFINITY
            }
            return a.to - b.to
        })
        let i = 0
        let x = 0
        let y = 0
        let current = fromOrderedRanges[x++]
        const result = [current]
        if (fromOrderedRanges[x].from < toOrderedRanges[y].to) {
            result[i].to = fromOrderedRanges[x].from - 1
            result.splice(++i, 0, {
                from: fromOrderedRanges[x].from,
                to: 0,
                fragment: null,
            })
        }

    }
}

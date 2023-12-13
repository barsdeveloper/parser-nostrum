class TrieNode {
    key
    parent = null
    children = {}
    end = false
    constructor(key) {
        this.key = key
    }

    getWord() {
        var output = []
        var node = this
        while (node) {
            output.unshift(node.key)
            node = node.parent
        }
        return output.join('')
    }
}

export default class Trie {
    root = new TrieNode(null)

    insert(word) {
        let node = this.root
        for (let i = 0; i < word.length; i++) {
            if (!node.children[word[i]]) {
                node.children[word[i]] = new TrieNode(word[i])
                node.children[word[i]].parent = node
            }
            node = node.children[word[i]]
            if (i == word.length - 1) {
                node.end = true
            }
        }
    }

    contains(word) {
        let node = this.root
        for (let i = 0; i < word.length; i++) {
            if (node.children[word[i]]) {
                node = node.children[word[i]]
            } else {
                return false
            }
        }
        return node.end
    }

    findAllWords(node, arr) {
        if (node.end) {
            arr.push(node.getWord())
        }
        for (let child in node.children) {
            this.findAllWords(node.children[child], arr)
        }
    }

    find(prefix) {
        let node = this.root
        const output = []
        for (const c of prefix) {
            if (node.children[c]) {
                node = node.children[c]
            } else {
                return output
            }
        }
        this.findAllWords(node, output)
        return output
    }
}

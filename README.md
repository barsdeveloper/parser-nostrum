# Parsernostrum

Parsernostrum is a small non backtracking LL parsing combinator library for JavaScript, designed to be very simple leveraging modern JavaScript features and keeping code size to a minimum. It is particularly suitable in frontend contexts. It offers a set of tools to create robust and maintainable parsers with very little code.

## Getting started

```sh
npm install parsernostrum
```

Import Parsernostrum and use it to create custom parsers tailored to your specific parsing needs. Then use the following methods to parse a astring.

```JavaScript
import P from "parsernostrum"

// Create a parser
/** @type {P<any>} */
const palindromeParser = P.alt(
    P.reg(/[a-z]/).chain(c =>
        P.seq(
            P.lazy(() => palindromeParser).opt(),
            P.str(c)
        ).map(([recursion, _]) => c + recursion + c)
    ),
    P.reg(/([a-z])\1?/)
).opt()

// Use the parsing methods to check the text
try {
    // This method throws in case it doesn't parse correctly
    palindromeParser.parse("Not a palindrome!")
} catch (e) {
    console.log(e.message) // Could not parse "Not a palindrome!"
}
// This method returns an object with status (can be used as a boolean to check if success) and value keys
let result = palindromeParser.run("Also not a palindrome")
console.log(result.value) // null
console.log(palindromeParser.parse("asantalivedasadevilatnasa")) // asantalivedasadevilatnasa
```

## Documentation

### `str(value)`
Parses exact string literals.
```JavaScript
P.str("A string!")
```

### `reg(value, group)`
Parses a regular expression and possibly returns a captured group.
```JavaScript
P.reg(/\d+/)
```

### `regArray(value)`
Parses a regular expression and returns all its captured groups array exactly as returned by the `RegExp.exec()` method.
```JavaScript
P.regArray(/begin\s*(\w*)\s*(\w*)\s*end/)
```

### `seq(...parsers)`
Combines parsers sequentially.
```JavaScript
P.seq(P.str("hello"), P.str("world"))
```

### `alt(...parsers)`
Offers alternative parsers succeeds if any parser matches.
```JavaScript
P.alt(P.str("yes"), P.str("no"))
```

### `lookahead(parser)`
Checks what's ahead in the string without consuming it.
```JavaScript
P.lookahead(P.str("hello"))
```

### `lazy(parser)`
Delays parser evaluation, useful for recursive parsers.
```JavaScript
const matcheParentheses = P.seq(
    P.str("("),
    P.alt(
        P.lazy(() => matcheParentheses),
        P.reg(/\w*/),
    ),
    P.str(")"),
)
```
>[!WARNING]
>LL parsers do not generally support left recursion. It is therefore important that your recursive parsers always have an actual parser as the first element (in this case `P.str("("))`). Otherwise the code will result in a runtime infinite recursion exception.
>In general it is always possible to rewrite a grammar to remove left recursion.

### `.times(min, max)`
Matches a parser a specified number of times.
```JavaScript
myParser.times(3) // expect to have exactly three occurrences
myParser.times(1, 2) // expect to have one or two occurrences
```

### `.many()`
Matches a parser zero or more times.
```JavaScript
myParser.many()
```

### `.atLeast(n)`
Ensures a parser matches at least `n` times.
```JavaScript
myParser.atLeast(2)
```

### `.atMost(n)`
Limits a parser match to at most `n` times.
```JavaScript
myParser.atMost(5)
```

### `.opt()`
Makes a parser optional.
```JavaScript
myParser.opt()
```

### `.sepBy(separator)`
Parses a list of elements separated by a given separator.
```JavaScript
myParser.sepBy(P.reg(/\s*,\s*/))
```

### `.skipSpace()`
Consumes whitespace following the match of myParser and returns what myParser produced.
```JavaScript
myParser.skipSpace()
```

### `.map(fn)`
Applies a function to transform the parser's result.
```JavaScript
myParser.map(n => `Number: ${n}`)
```

### `.chain(fn)`
Chains the output of one parser to another.
```JavaScript
const p = P.reg(/[([{]/).chain(v => (
    {
        "(": P.str(")"),
        "[": P.str("]"),
        "{": P.str("}"),
    }[v].map(closingParenthesis => v + closingParenthesis)
))
```

### `.assert(fn)`
Asserts a condition on the parsed result. If the method returns false, the parser is considered failed even though the actual parser matched the input.
```JavaScript
P.numberNatural.assert(n => n % 2 == 0) // Will even numbers only
```

### `.join(value)`
Joins the results of a parser into a single string.
```JavaScript
myParser.join(", ")
```

### Predefined parsers
Some usefull parsers that can be reused and combined with other parsers.
- `number`: the most common numbers, possibly fractional and signed
- `numberInteger`: possibly signed integer
- `numberBigInteger`: same as numberInteger but returns a BigInt JavaScript object
- `numberBigInteger`: just digits
- `numberExponential`: a number written possibly in the exponential form (e.g.: 1E-5)
- `numberUnit`: a number between 0 and 1
- `numberByte`: a integer between 0 and 255
- `whitespace`: any whitespace (/\s+/)
- `whitespaceOpt`: any optional whitespace (/\s*/)
- `whitespaceInline`: whitespace on a single line
- `whitespaceInlineOpt`: optional whitespace on a single line
- `whitespaceMultiline`: whitespace that containes at least a newline
- `doubleQuotedString`: escape-aware string delimited by `"`, returns the content
- `singleQuotedString`: escape-aware string delimited by `'`, returns the content
- `backtickQuotedString`: escape-aware string delimited by `` ` ``, returns the content

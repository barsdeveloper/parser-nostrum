import terser from "@rollup/plugin-terser"

export default [
    {
        input: 'src/Regexer.js',
        output: {
            file: 'dist/regexer.js',
            format: 'es'
        }
    },
    {
        input: 'src/Regexer.js',
        output: {
            file: 'dist/regexer.min.js',
            format: 'es'
        },
        plugins: [
            terser()
        ]
    }
]

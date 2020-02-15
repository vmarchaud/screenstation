module.exports = {
    "presets": [
        [
            // Mehr: https://babeljs.io/docs/en/babel-preset-env
            "@babel/preset-env",
            {
                "targets": {
                    // When specifying this option, the browsers field will be ignored.
                    // "esmodules": true,

                    "node": "current",
                    "browsers": [
                        "last 2 Chrome versions",
                        "last 1 Safari versions",
                        "last 1 Firefox versions"
                    ]

                },
                // Enable transformation of ES6 module syntax to another module type.
                // Setting this to false will not transform modules.
                //
                // Muss auf "auto" stehen sonst funktioniert JEST nicht!
                "modules": "auto"
            }
        ],
        "@babel/typescript"
    ],
    // "env": {
    //     // BABEL_ENV=test <command (e.g. yarn test:unit)>
    //     "test": {
    //         "plugins": ["@babel/plugin-transform-modules-commonjs"]
    //     }
    // },
};

module.exports = {
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current",
          "browsers": [
            "last 2 Chrome versions",
            "last 1 Safari versions",
            "last 1 Firefox versions"
          ]

        },
        "modules": "auto"
      }
    ],
    "@babel/typescript"
  ],
};

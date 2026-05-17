const { ESLint } = require("eslint");

(async function main() {
  const eslint = new ESLint({
    overrideConfig: {
      env: {
        "react-native/react-native": true,
        "es2021": true
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 12,
        sourceType: "module"
      },
      plugins: ["react", "react-native"],
      rules: {
        "no-undef": "error",
        "react/jsx-no-undef": "error"
      }
    }
  });

  const results = await eslint.lintFiles(["../src/**/*.js"]);
  const formatter = await eslint.loadFormatter("stylish");
  const resultText = formatter.format(results);
  console.log(resultText);
})().catch((error) => {
  console.error(error);
});

module.exports = {
  root: true,
  extends: ['universe/native', 'plugin:prettier/recommended'],
  rules: {
    // custom rules can go here
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

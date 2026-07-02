import rootConfig from '../../../../../eslint.config.js';

export default [
	...rootConfig,
	{
		files: ['**/*.ts'],
		rules: {
			'@bitrix24/bitrix24-rules/no-typeof': 'off',
			'@bitrix24/bitrix24-rules/no-native-events-binding': 'off',
			'@bitrix24/bitrix24-rules/no-classlist': 'off',
			'@bitrix24/bitrix24-rules/no-style': 'off',
			'@bitrix24/bitrix24-rules/no-native-dom-methods': 'off',
			'@bitrix24/bitrix24-rules/no-bx-message': 'off',
			'import/no-default-export': 'off',
			'no-prototype-builtins': 'off',
			'no-param-reassign': 'off',
			'no-console': 'off',
		},
	},
];

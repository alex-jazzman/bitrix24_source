/**
 * @module im/messenger/const/block
 */
jn.define('im/messenger/const/block', (require, exports, module) => {
	const { ButtonDesignType } = require('im/messenger/const/button');

	const BlockElementType = Object.freeze({
		text: 'text',
		title: 'title',
		lineDivider: 'lineDivider',
		spaceDivider: 'spaceDivider',
		map: 'map',
		unorderedList: 'unorderedList',
		orderedList: 'orderedList',
		gallery: 'gallery',
		table: 'table',
		card: 'card',
		aiAssistantSearch: 'aiAssistantSearch',
	});

	const BlockButtonType = Object.freeze({
		eventButton: 'eventButton',
		requestButton: 'requestButton',
		linkButton: 'linkButton',
	});

	const BlockButtonDesignMap = Object.freeze({
		FILLED: ButtonDesignType.filled,
		TINTED: ButtonDesignType.tinted,
		OUTLINE: ButtonDesignType.outline,
		OUTLINE_ACCENT_1: ButtonDesignType.outlineAccent1,
		OUTLINE_ACCENT_2: ButtonDesignType.outlineAccent2,
		OUTLINE_NO_ACCENT: ButtonDesignType.outlineNoAccent,
		PLAIN: ButtonDesignType.plain,
		PLAIN_ACCENT: ButtonDesignType.plainAccent,
		PLAIN_NO_ACCENT: ButtonDesignType.plainNoAccent,
	});

	module.exports = {
		BlockElementType,
		BlockButtonType,
		BlockButtonDesignMap,
	};
});

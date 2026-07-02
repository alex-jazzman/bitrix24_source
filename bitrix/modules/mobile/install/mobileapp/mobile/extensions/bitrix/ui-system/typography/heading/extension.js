/**
 * @module ui-system/typography/heading
 */
jn.define('ui-system/typography/heading', (require, exports, module) => {
	const { Text } = require('ui-system/typography/text');

	/** @param {TypographyHeadingProps} props */
	const HeadingText = (props) => Text({ header: true, ...props });

	module.exports = {
		/** @param {TypographyHeadingProps} props */
		H1: (props) => HeadingText({ ...props, size: 1, header: true }),
		/** @param {TypographyHeadingProps} props */
		H2: (props) => HeadingText({ ...props, size: 2, header: true }),
		/** @param {TypographyHeadingProps} props */
		H3: (props) => HeadingText({ ...props, size: 3, header: true }),
		/** @param {TypographyHeadingProps} props */
		H4: (props) => HeadingText({ ...props, size: 4, header: true }),
		/** @param {TypographyHeadingProps} props */
		H5: (props) => HeadingText({ ...props, size: 5, header: true }),
	};
});

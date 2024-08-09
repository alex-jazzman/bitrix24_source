/**
 * @module ui-system/typography/text
 */
jn.define('ui-system/typography/text', (require, exports, module) => {
	const { TextBase } = require('ui-system/typography/text-base');
	const { Typography } = require('tokens');

	const DefaultTextSize = 4;

	const BodyText = (props) => TextBase({
		nativeElement: Text,
		header: false,
		...props,
	});

	const CustomText = (props = {}) => {
		const { size, ...restProps } = props;
		const textSize = size >= 1 && size <= 6 ? size : DefaultTextSize;

		return TextBase({
			nativeElement: Text,
			size: textSize,
			...restProps,
		});
	};

	module.exports = {
		Text: CustomText,
		Text1: (props) => BodyText({ ...props, size: 1 }),
		Text2: (props) => BodyText({ ...props, size: 2 }),
		Text3: (props) => BodyText({ ...props, size: 3 }),
		Text4: (props) => BodyText({ ...props, size: 4 }),
		Text5: (props) => BodyText({ ...props, size: 5 }),
		Text6: (props) => BodyText({ ...props, size: 6 }),
		Text7: (props) => BodyText({ ...props, size: 7 }),
		Capital: (props) => BodyText({ ...props, typography: Typography.textCapital }),
	};
});

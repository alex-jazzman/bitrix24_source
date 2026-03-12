/**
 * @module ui-system/typography/bbcodetext
 */
jn.define('ui-system/typography/bbcodetext', (require, exports, module) => {
	const { TextBase } = require('ui-system/typography/text-base');

	module.exports = {
		BBCodeText: (props) => {
			const { value: propsValue, text: propsText, ...restProps } = props;

			restProps.value = propsValue;

			if (propsText !== undefined && propsValue === undefined)
			{
				restProps.value = propsText;
			}

			return TextBase({ nativeElement: BBCodeText, ...restProps });
		},
	};
});

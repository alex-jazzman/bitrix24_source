/**
 * @module layout/ui/fields/client/elements/title
 */
jn.define('layout/ui/fields/client/elements/title', (require, exports, module) => {

	/**
	 * @function ClientItemTitle
	 */
	function ClientItemTitle(props)
	{
		const { title = '', type, hidden, onClick } = props;

		return View({
				style: {
					flexDirection: 'row',
					alignItems: 'flex-start',
					justifyContent: 'flex-start',
					flexShrink: 2,
				},
			},
			View(
				{
					style: {
						flexShrink: 2,
						marginRight: 8,
					},
					onClick,
				},
				Text({
						style: {
							color: hidden ? '#333333' : '#0b66c3',
							fontSize: 18,
						},
						numberOfLines: 1,
						ellipsize: 'end',
						text: title,
					},
				),
			),
			!hidden && View(
				{
					style: {
						flexShrink: 0,
						height: 16,
						borderColor: '#2fc6f6',
						borderRadius: 12,
						borderWidth: 1,
						paddingHorizontal: 9,
						marginTop: 3,
						justifyContent: 'center',
					},
					onClick,
				},
				Text({
						style: {
							fontSize: 10,
							marginBottom: 2,
						},
						text: BX.message(`FIELDS_${type.toUpperCase()}_TITLE`),
					},
				),
			),
		);
	}

	module.exports = { ClientItemTitle };
});
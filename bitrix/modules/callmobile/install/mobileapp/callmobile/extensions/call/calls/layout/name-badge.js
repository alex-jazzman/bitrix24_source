/**
 * @module call/calls/layout/name-badge
 */
jn.define('call/calls/layout/name-badge', (require, exports, module) => {
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Color } = require('tokens');

	const styles = {
		nameBadge: {
			backgroundColor: '#7F000000',
			borderRadius: 6,
			fontWeight: 400,
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
		},
	};

	class NameBadge extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);
		}

		render()
		{
			const { name, microphoneState } = this.props;

			return View(
				{
					style: {
						position: 'absolute',
						bottom: 8,
						left: 8,
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						width: '100%',
						zIndex: 20,
					},
				},
				View(
					{
						style: {
							...styles.nameBadge,
							paddingLeft: 5,
							paddingRight: 5,
							maxWidth: '90%',
						},
					},
					!microphoneState && IconView({
						size: 20,
						color: Color.baseWhiteFixed,
						icon: Icon.MICROPHONE_OFF,
					}),
					Text({
						style: {
							fontSize: 13,
							color: '#fff',
							paddingVertical: 2,
							flexShrink: 1,
						},
						numberOfLines: 1,
						ellipsize: 'end',
						text: name,
					}),
				)
			)
		}
	}

	module.exports = {
		NameBadge,
	};
});

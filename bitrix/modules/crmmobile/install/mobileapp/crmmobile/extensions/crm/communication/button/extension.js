/**
 * @module crm/communication/button
 */

jn.define('crm/communication/button', (require, exports, module) => {

	const { connections, isExistContacts } = require('communication/connection');
	const { CommunicationMenu } = require('communication/menu');
	const { isEmpty, merge } = require('utils/object');
	const communicationIcons = require('assets/communication');
	const ICON_SIZE = 28;
	const ICON_COLOR = {
		ENABLED: '#378EE7',
		DISABLED: '#D5D7DB',
	};

	class CommunicationButton extends LayoutComponent
	{
		render()
		{
			const { ref, testId } = this.props;

			this.availableConnections = this.getExistConnections();
			const { main, wrapper } = this.styles();

			return View(
				{
					ref,
					testId,
					safeArea: {
						bottom: true,
						top: true,
						left: true,
						right: true,
					},
					style: main,
					onClick: this.showMenu.bind(this),
				},
				View(
					{
						style: wrapper,
					},
					...this.getCommunicationIcons(),
				),
			);
		}

		getCommunicationIcons()
		{
			const { icon: iconStyle } = this.styles();

			return connections.map((connectionType) => {
				const icon = communicationIcons[connectionType];
				const iconColor = this.availableConnections[connectionType]
					? ICON_COLOR.ENABLED
					: ICON_COLOR.DISABLED;

				return View(
					{
						style: iconStyle,
					},
					Image({
						style: {
							flex: 1,
						},
						svg: {
							content: icon(iconColor),
						},
					}),
				);
			});
		}

		getExistConnections()
		{
			const { value } = this.props;

			return connections.reduce((acc, connectionType) => ({
				...acc,
				[connectionType]: isExistContacts(value, connectionType),
			}), {});
		}

		showMenu()
		{
			const { value, ownerInfo } = this.props;

			if (!this.hasConnections() || isEmpty(value))
			{
				return null;
			}

			const communicationMenu = new CommunicationMenu({
				value,
				ownerInfo,
				connections,
			});

			communicationMenu.show(connections);
		}

		hasConnections()
		{
			return Object.values(this.availableConnections).some(Boolean);
		}

		styles()
		{
			const { horizontal = true, styles } = this.props;
			const width = horizontal ? 100 : 36;
			const height = horizontal ? 36 : 100;

			const defaultStyles = {
				main: {
					display: 'flex',
					width,
					justifyContent: 'center',
					alignItems: 'center',
				},
				wrapper: {
					height,
					width,
					paddingHorizontal: horizontal ? 6 : 4,
					paddingVertical: horizontal ? 4 : 6,
					borderRadius: height,
					backgroundColor: this.hasConnections() ? '#E5F9FF' : '#F8FAFB',
					flexShrink: 2,
					justifyContent: 'space-evenly',
					flexDirection: horizontal ? 'row' : 'column',
					alignItems: 'center',
					...this.getBorder(),
				},
				icon: {
					width: ICON_SIZE,
					height: ICON_SIZE,
				},
			};

			return merge(defaultStyles, styles);
		}

		getBorder()
		{
			const { border } = this.props;

			if (!border)
			{
				return {};
			}

			return {
				borderColor: this.hasConnections() ? '#7FDEFC' : ICON_COLOR.DISABLED,
				borderWidth: 1,
			};
		}
	}

	module.exports = { CommunicationButton };
});
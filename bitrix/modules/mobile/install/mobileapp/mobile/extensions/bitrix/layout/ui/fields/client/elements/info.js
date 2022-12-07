/**
 * @module layout/ui/fields/client/elements/info
 */
jn.define('layout/ui/fields/client/elements/info', (require, exports, module) => {

	const { AddressView } = require('layout/ui/address');

	/**
	 * @function ClientItemInfo
	 */
	function ClientItemInfo(props)
	{
		const { subtitle, phone, email, addresses = [] } = props;
		const emailValue = email && email.value;
		const phoneValue = phone && phone.value;
		const connectionInfo = [phoneValue, emailValue].filter(Boolean).join(', ');
		return View(
			{
				style: {
					flexShrink: 2,
				},
			},
			Boolean(subtitle) && Text({
				style: style.text,
				text: subtitle,
			}),
			Boolean(connectionInfo) && Text({
				style: style.text,
				text: connectionInfo,
			}),
			...addresses.map((address) => AddressView({ address, clickable: true })),
		);
	}

	const style = {
		text: {
			color: '#a8adb4',
			fontSize: 14,
			marginTop: 4,
			flexShrink: 2,
		},
	};

	module.exports = { ClientItemInfo };
});
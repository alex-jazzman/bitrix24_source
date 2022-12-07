/**
 * @module layout/ui/address
 */
jn.define('layout/ui/address', (require, exports, module) => {

	const { location } = require('assets/common');
	const { MapOpener } = require('layout/ui/map-opener');
	const { stringify } = require('utils/string');

	/**
	 * @function AddressView
	 *
	 * @param {{address, clickable, parentWidget}} props
	 *
	 * @returns {null|*}
	 */
	const AddressView = (props) => {
		const { coords, clickable = true, parentWidget } = props;
		let { address } = props;

		address = stringify(address);
		if (address === '')
		{
			return null;
		}

		return View(
			{
				style: {
					flexDirection: 'row',
					marginTop: 4,
				},
				onClick: clickable && (() => {
					const mapOpener = new MapOpener(parentWidget);
					mapOpener.open({ address, coords });
				}),
			},
			Image({
				style: {
					marginRight: 2,
					height: 17,
					width: 17,
				},
				svg: {
					content: location,
				},
			}),
			Text({
				style: {
					flex: 1,
					fontSize: 14,
					color: '#828b95',
					textDecorationLine: clickable && 'underline',
				},
				text: address,
			}),
		);
	};

	module.exports = { AddressView };

});

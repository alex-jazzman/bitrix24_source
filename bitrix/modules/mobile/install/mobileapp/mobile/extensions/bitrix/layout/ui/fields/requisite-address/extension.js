/**
 * @module layout/ui/fields/requisite-address
 */
jn.define('layout/ui/fields/requisite-address', (require, exports, module) => {

	const { AddressView } = require('layout/ui/address');
	const { BaseField } = require('layout/ui/fields/base');

	/**
	 * @class RequisiteAddressField
	 */
	class RequisiteAddressField extends BaseField
	{
		isReadOnly()
		{
			return true;
		}

		isDisabled()
		{
			return true;
		}

		getAddresses()
		{
			return this.getValue().filter((address) => address && address.formattedLocation);
		}

		renderEditableContent()
		{
			return this.renderReadOnlyContent();
		}

		renderReadOnlyContent()
		{
			if (this.isEmpty())
			{
				return this.renderEmptyContent();
			}

			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'column',
					},
				},
				...this.getAddresses().map((location) => this.renderAddress(location)),
			);
		}

		renderAddress(location)
		{
			const { formattedLocation: address, longitude: lng, latitude: lat } = location;
			const coords = { lng, lat };
			const parentWidget = this.getParentWidget();

			return AddressView({ address, coords, parentWidget });
		}
	}

	module.exports = {
		RequisiteAddressType: 'requisite_address',
		RequisiteAddressField: (props) => new RequisiteAddressField(props),
	};

});

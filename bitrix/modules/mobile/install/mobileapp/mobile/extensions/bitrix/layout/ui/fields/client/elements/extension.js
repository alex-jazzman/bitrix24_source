/**
 * @module layout/ui/fields/client/elements
 */
jn.define('layout/ui/fields/client/elements', (require, exports, module) => {

	const { ClientItemTitle } = require('layout/ui/fields/client/elements/title');
	const { ClientItemInfo } = require('layout/ui/fields/client/elements/info');
	const { pen } = require('assets/common');

	/**
	 * @function ClientItem
	 */
	function ClientItem(props)
	{
		const {
			id,
			title,
			subtitle,
			phone,
			email,
			type,
			addresses,
			onEdit,
			readOnly,
			onOpenBackDrop,
			showClientInfo,
			hidden,
		} = props;

		const handleOnEdit = () => {
			onEdit(type);
		};

		const onClick = () => {
			if (!id || hidden)
			{
				return;
			}
			onOpenBackDrop({
				type,
				title,
				entityId: id,
			});
		};

		return View({
				style: {
					flexDirection: 'row',
					marginBottom: 10,
					justifyContent: 'space-between',
				},
			},
			View({
					style: {
						flexDirection: 'column',
						flex: 1,
					},
				},
				ClientItemTitle({ title, type, showClientInfo, hidden, onClick }),
				showClientInfo && ClientItemInfo({ subtitle, phone, email, addresses }),
			),
			showClientInfo && View(
				{
					style: {
						width: !readOnly ? 38 : 0,
						alignItems: 'flex-end',
					},
					onClick: !readOnly && handleOnEdit,
				},
				!readOnly && View(
					{
						style: {
							width: 28,
							height: 28,
							justifyContent: 'center',
							alignItems: 'center',
						},
					},
					Image({
						style: {
							height: 15,
							width: 15,
						},
						svg: {
							content: pen,
						},
					}),
				),
			),
		);
	}

	module.exports = { ClientItem };

});
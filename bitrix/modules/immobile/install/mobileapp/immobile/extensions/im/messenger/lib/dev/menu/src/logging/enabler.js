/**
 * @module im/messenger/lib/dev/menu/logging/enabler
 */
jn.define('im/messenger/lib/dev/menu/logging/enabler', (require, exports, module) => {

	class Enabler extends LayoutComponent
	{
		render()
		{
			const { onClick, checked } = this.props;

			return View(
				{
					clickable: true,
					style: this.getStyle(),
					onClick: () => {
						if (onClick)
						{
							onClick();
						}
					},
				},
				checked
					? Image({
						resizeMode: 'contain',
						style: {
							width: 12,
							height: 9,
							opacity: 1,
						},
						tintColor: '#FFFFFF',
						svg: {
							content: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="9" viewBox="0 0 12 9" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.95219 8.3198C4.56385 8.69826 3.94464 8.69826 3.5563 8.31979L0.763658 5.59814C0.345119 5.19024 0.345119 4.51755 0.763658 4.10965C1.16723 3.71633 1.81074 3.71633 2.21431 4.10965L4.25425 6.09772L9.78568 0.706892C10.1893 0.313577 10.8328 0.313576 11.2363 0.706891C11.6549 1.11479 11.6549 1.78748 11.2363 2.19538L4.95219 8.3198Z" fill="white"/></svg>',
						},
					})
					: null,
			);
		}

		getStyle()
		{
			const { checked } = this.props;
			const style = {
				alignItems: 'center',
				justifyContent: 'center',
				alignContent: 'center',
				width: 26,
				height: 26,
				borderRadius: 13,
				margin: 15,
				marginRight: 25,
			};

			if (checked)
			{
				style.backgroundColor = '#569464';
			}
			else
			{
				style.borderWidth = 1.6;
				style.borderColor = '#2f2f34';
			}

			return style;
		}
	}

	module.exports = {
		Enabler,
	};
});

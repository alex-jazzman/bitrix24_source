/**
 * @module mail/message/elements/contact/list
 */
jn.define('mail/message/elements/contact/list', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { ContactCard } = require('mail/message/elements/contact/card');
	const { PureComponent } = require('layout/pure-component');

	class ContactList extends PureComponent
	{
		render()
		{
			let titleFiled = null;
			const {
				maxWidthTextFiled,
				title,
				format,
				list,
				testId = 'contact-list',
			} = this.props;

			if (!Array.isArray(list) || list.length === 0)
			{
				return null;
			}

			if (title)
			{
				titleFiled = Text({
					style: {
						paddingRight: 3,
						fontWeight: '400',
						fontSize: 13,
						color: AppTheme.colors.base4,
					},
					text: title,
				});
			}

			return View(
				{
					testId,
					style: {
						flexDirection: 'row',
						width: '100%',
						flexWrap: 'wrap',
						display: 'flex',
					},
				},
				titleFiled,
				...list.map((item) => {
					return new ContactCard({ maxWidthTextFiled, format, ...item });
				}),
			);
		}
	}

	module.exports = { ContactList };
});

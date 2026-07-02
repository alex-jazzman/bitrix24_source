/**
 * @module im/messenger/lib/dev/menu/dialog/dialog-snippets
 */
jn.define('im/messenger/lib/dev/menu/dialog/dialog-snippets', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { BannerButton } = require('layout/ui/banners/banner-button');
	const { SendMessage } = require('im/messenger/lib/dev/menu/dialog/send-message');
	const { BuilderMessage } = require('im/messenger/lib/dev/menu/dialog/builder-message');

	class DialogSnippets extends LayoutComponent
	{
		render()
		{
			return ScrollView(
				{
					style: {
						padding: 16,
						backgroundColor: AppTheme.colors.bgContentPrimary,
					},
				},
				this.renderSection([
					this.renderBanner({
						title: 'Send Message',
						description: 'Spam/DoS messages',
						ComponentClass: SendMessage,
					}),
					this.renderBanner({
						title: 'Builder Message',
						description: 'Message builder',
						ComponentClass: BuilderMessage,
					}),
				]),
			);
		}

		renderSection(banners)
		{
			return View(
				{
					style: {
						backgroundColor: AppTheme.colors.accentSoftBlue1,
						borderRadius: 12,
						padding: 16,
						marginBottom: 16,
						marginTop: 8,
					},
				},
				...banners.map((banner, index) => {
					return View(
						{
							style: {
								marginBottom: index < banners.length - 1 ? 12 : 0,
							},
						},
						banner,
					);
				}),
			);
		}

		renderBanner({ title, description, ComponentClass })
		{
			return BannerButton({
				title,
				description,
				backgroundColor: AppTheme.colors.accentSoftBlue2,
				onClick: () => {
					PageManager.openWidget(
						'layout',
						{
							title,
							onReady: (layoutWidget) => {
								layoutWidget.showComponent(new ComponentClass({}));
							},
						},
					);
				},
			});
		}
	}

	module.exports = { DialogSnippets };
});

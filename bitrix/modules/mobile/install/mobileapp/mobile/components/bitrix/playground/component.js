(() => {
	const require = (ext) => jn.require(ext);
	const { ContextMenu, Icon, ImageAfterTypes, BadgeCounterDesign } = require('layout/ui/context-menu');

	class PlaygroundComponent extends LayoutComponent
	{
		onClick = () => {
			const contextMenu = new ContextMenu({
				titlesBySectionCode: {
					one: 'Заголовок первой секции',
					two: 'Заголовок второй секции',
				},
				params: {
					title: 'Заголовок',
					shouldResizeContent: true,
					showCancelButton: true,
					showActionLoader: false,
					showPartiallyHidden: true,
					mediumPositionPercent: 60,
				},
				actions: [
					{
						sectionCode: 'one',
						title: 'Email',
						subtitle: 'Send Email',
						id: 'email',
						selected: true,
						icon: Icon.MAIL,
						showArrow: true,
						onClickCallback: () => {
							console.log('onClickCallback');
						},
					},
					{
						sectionCode: 'one',
						title: 'Phone',
						id: 'phone',
						icon: Icon.PHONE_UP,
						destructive: true,
						iconAfter: ImageAfterTypes.WEB,
					},
					{
						sectionCode: 'two',
						id: 'counter',
						title: 'Show counter',
						counter: '10',
						showArrow: true,
					},
					{
						sectionCode: 'two',
						title: 'New item',
						counter: 1,
						counterDesign: BadgeCounterDesign.PRIMARY,
						showArrow: true,
						badgeNew: true,
					},
					{
						sectionCode: 'two',
						title: 'Click to run loader',
						id: 'loader',
						showActionLoader: true,
						icon: Icon.LOCK,
						onClickCallback: () => {
							return new Promise((resolve) => {
								setTimeout(() => {
									console.log('loader');
									resolve();
								}, 5000);
							});
						},
					},
				],
			});

			contextMenu.show();
		};

		render()
		{
			return View(
				{
					style: {
						width: '100%',
						height: '100%',
						alignItems: 'center',
						justifyContent: 'center',
					},
					onClick: this.onClick,
				},
				Text(
					{
						text: 'open context menu',
					},
				),
			);
		}
	}

	layout.showComponent(new PlaygroundComponent());
})();

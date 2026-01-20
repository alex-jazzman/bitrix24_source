(() => {
	BX.onViewLoaded(() => {
		const require = (ext) => jn.require(ext);
		const { InviteComponent } = require('intranet/invite-opener-new');

		const inviteSettings = BX.componentParameters.get('inviteSettings', {});

		layout.showComponent(
			InviteComponent.open({
				layout,
				...inviteSettings,
			}),
		);

		layout.on('onViewHidden', () => {
			inviteSettings?.onHidden?.();
		});
	});
})();

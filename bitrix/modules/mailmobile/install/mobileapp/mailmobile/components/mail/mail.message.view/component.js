(() => {
	const { mailsAddedFromServer } = jn.require('mail/statemanager/redux/slices/messages');
	const { foldersAdded } = jn.require('mail/statemanager/redux/slices/folders');
	const {
		buildMessageChainParams,
		readMessageScreenParams,
		requestMessageChain,
	} = jn.require('mail/message/tools/screen-params');
	const { getThemeRequestParams } = jn.require('mail/message/theme-request');
	const { MessageChain } = jn.require('mail/chain');
	const { MailDialog } = jn.require('mail/dialog');

	const store = jn.require('statemanager/redux/store');
	const { AnalyticsEvent } = jn.require('analytics');
	const { dispatch } = store;

	layout.setTitle({ text: BX.message('MESSAGE_VIEW_TITLE') });

	const params = readMessageScreenParams(BX.componentParameters);

	requestMessageChain(params, getThemeRequestParams()).then((response) => {
		if ((response?.data?.list?.length ?? 0) === 0)
		{
			MailDialog.show({
				type: MailDialog.MAIL_TYPE_LOST_MESSAGE_TYPE,
				needsToCloseLayout: false,
				layoutWidget: this.layout,
			});
		}
		else
		{
			BX.onViewLoaded(() => {
				const messageChainParams = buildMessageChainParams(params, response.data, this.layout);

				dispatch(mailsAddedFromServer(response.data.list));
				if (!params.isCrmMessage)
				{
					dispatch(foldersAdded(response.data.properties.dirs));
				}

				new AnalyticsEvent({
					tool: 'mail',
					category: 'mail_general_ops',
					event: 'mail_view',
					c_section: params.isCrmMessage ? 'crm' : params.source,
					c_sub_section: params.folder,
				}).send();

				layout.showComponent(new MessageChain(messageChainParams));
			});
		}
	}).catch(() => {
		MailDialog.show({
			type: MailDialog.MAIL_TYPE_LOST_MESSAGE_TYPE,
			needsToCloseLayout: false,
			layoutWidget: this.layout,
		});
	});
})();

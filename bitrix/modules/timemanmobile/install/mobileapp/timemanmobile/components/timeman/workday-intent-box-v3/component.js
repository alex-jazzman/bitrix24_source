(async () => {
	const require = (extension) => jn.require(extension);
	const { requireLazy } = require('require-lazy');

	const { WorkdayIntentBox } = await requireLazy(
		'timeman:layout/workday-intent-box-v3',
		false,
	);
	if (WorkdayIntentBox)
	{
		const { WorkdayIntentId } = require('timeman/workday-intent/workday-intent-id');

		layout.on('onViewRemoved', () => BX.postComponentEvent('workday-intent-box.onViewRemoved'));
		layout.showComponent(
			new WorkdayIntentBox({
				intentList: BX.componentParameters.get('intentList', {}),
				shifts: BX.componentParameters.get('shifts', []),
				preselectedIntentId: BX.componentParameters.get('preselectedIntentId', WorkdayIntentId.WORKDAY),
				chatIdWithAiAdvice: BX.componentParameters.get('chatIdWithAiAdvice', 0),
				isDayStartCheckInEnabled: BX.componentParameters.get('isDayStartCheckInEnabled', false),
				parentWidget: layout,
			}),
		);
	}
})();

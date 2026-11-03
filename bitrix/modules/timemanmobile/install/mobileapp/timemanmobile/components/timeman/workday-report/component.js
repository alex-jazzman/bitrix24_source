(async () => {
	const require = (extension) => jn.require(extension);
	const { StatusBox } = require('timeman/layout/status-box');
	const { DailyReportBox } = require('timeman/work-reports/submit/daily');

	const recordId = BX.componentParameters.get('recordId', null);
	const layoutResult = await DailyReportBox.openLayout({ parentWidget: layout, recordId }).catch(console.error);
	if (!layoutResult)
	{
		layout.close();

		return;
	}

	const { component: dailyReportComponent, data } = layoutResult;
	const height = StatusBox.getContentHeight({
		hasAutoReport: data.hasAutoReport,
		hasGpt: data.hasGpt,
		hasTitle: true,
	});

	layout.setBottomSheetParams({
		mediumPositionHeight: height,
	});
	layout.setBottomSheetHeight(height);

	layout.showComponent(dailyReportComponent(layout));
})();

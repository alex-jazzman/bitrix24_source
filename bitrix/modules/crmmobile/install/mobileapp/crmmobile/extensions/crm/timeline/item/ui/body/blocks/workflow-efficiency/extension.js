/**
 * @module crm/timeline/item/ui/body/blocks/workflow-efficiency
 */
jn.define('crm/timeline/item/ui/body/blocks/workflow-efficiency', (require, exports, module) => {
	const { TimelineItemBodyBlock } = require('crm/timeline/item/ui/body/blocks/base');
	const { Indent, Corner } = require('tokens');
	const { Duration } = require('utils/date/duration');
	const { Type } = require('type');
	const AppTheme = require('apptheme');
	const { Loc } = require('loc');
	const { roundSeconds } = require('bizproc/helper/duration');
	const flag = () => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.9889 6.40529C18.9935 6.44246 18.9975 6.47545 18.9975 6.50845C18.9977 6.67523 18.9982 6.842 18.9987 7.00878C19 7.50924 19.0014 8.00971 18.997 8.51017C18.9874 9.69312 18.9744 10.8761 18.9581 12.059C18.9494 12.6676 18.934 13.2761 18.9114 13.8842C18.909 13.9491 18.8542 14.0453 18.7984 14.0703C18.1055 14.3821 17.3717 14.5173 16.6173 14.473C15.7887 14.4244 15.0001 14.1872 14.2409 13.8548C13.9364 13.7216 13.6336 13.584 13.3307 13.4463C12.7675 13.1903 12.2043 12.9343 11.6298 12.7065C10.4945 12.2562 9.37073 12.2365 8.34987 13.0216C8.10727 13.2082 7.88389 13.4201 7.65429 13.6379C7.54712 13.7396 7.43859 13.8425 7.32612 13.9448V12.2914C7.32622 11.9037 7.32637 11.5161 7.32653 11.1285C7.32714 9.5784 7.32776 8.02836 7.32468 6.47863C7.3242 6.33238 7.35834 6.22751 7.46701 6.12648C8.21042 5.43615 9.08125 5.0412 10.1007 5.06766C10.8628 5.08786 11.6024 5.27548 12.3155 5.54728C12.7105 5.69779 13.1037 5.85316 13.4969 6.00855C14.02 6.21523 14.543 6.42192 15.0703 6.61717C15.6849 6.84424 16.322 7.00876 16.9827 7.02368C17.6477 7.03907 18.2666 6.87406 18.8071 6.46564C18.8421 6.43871 18.8782 6.4132 18.9215 6.38268C18.9401 6.36957 18.96 6.35554 18.9816 6.34008C18.9838 6.36351 18.9865 6.38502 18.9889 6.40529ZM6.29928 18.9998H5V5.4542H6.29928V18.9998Z" fill="#9DCF00"/></svg>';
	const { SafeImage } = require('layout/ui/safe-image');
	const { inAppUrl } = require('in-app-url');
	const { throttle } = require('utils/function');
	const { openNativeViewer } = require('utils/file');
	const { get } = require('utils/object');
	const USER_RESULT = 2;
	const NO_RIGHTS_RESULT = 3;

	/**
	 * @class TimelineItemBodyWorkflowEfficiency
	 */
	class TimelineItemBodyWorkflowEfficiency extends TimelineItemBodyBlock
	{
		render()
		{
			const hasBizprocConstant = get(
				jnExtensionData.get('crm:timeline/item/ui/body/blocks/workflow-efficiency'),
				'hasBizprocConstant',
				false,
			);
			if (hasBizprocConstant)
			{
				return View(
					{
						style: {
							borderStyle: 'solid',
							borderWidth: 1,
							borderColor: AppTheme.colors.base6,
							borderRadius: Corner.M.toNumber(),
							padding: Indent.XL.toNumber(),
						},
					},
					this.renderResult(),
					this.renderEfficiency(),
				);
			}

			return View();
		}

		isUserResult()
		{
			if (!this.props.workflowResult)
			{
				return true;
			}

			return Boolean(this.props.workflowResult.status === USER_RESULT);
		}

		renderResult()
		{
			if (!this.isUserResult())
			{
				return View(
					{},
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'center',
								marginBottom: 4,
							},
						},
						SafeImage({
							style: {
								width: 30,
								height: 30,
								paddingRight: 2,
							},
							resizeMode: 'contain',
							placeholder: {
								content: flag(),
							},
						}),
						Text({
							text: Loc.getMessage('M_CRM_TIMELINE_ITEM_WORKFLOW_EFFICIENCY_WORKFLOW_RESULT') ?? '',
							numberOfLines: 1,
							ellipsize: 'end',
							style: {
								color: AppTheme.colors.base1,
								fontSize: 14,
								fontWeight: '400',
							},
						}),
					),
					View(
						{},
						BBCodeText({
							testId: 'WorkflowResultText',
							style: {
								fontSize: 14,
								color: this.props.workflowResult.status === NO_RIGHTS_RESULT
									? AppTheme.colors.base3
									: AppTheme.colors.base1,
							},
							linksUnderline: false,
							value: this.props.workflowResult.text,
							onLinkClick: ({ url }) => {
								if (this.props.workflowResult?.files && this.props.workflowResult.files[url])
								{
									const file = this.props.workflowResult.files[url];
									const openViewer = throttle(openNativeViewer, 500);
									openViewer({
										fileType: UI.File.getType(UI.File.getFileMimeType(file.type, file.name)),
										url: file.url,
										name: file.name,
									});

									return;
								}

								inAppUrl.open(url);
							},
						}),
					),
				);
			}

			let userLink = this.props.workflowResult?.text;
			if (!this.props.workflowResult && this.props.author)
			{
				userLink = `[URL=${this.props.author?.link}]${this.props.author?.fullName}[/URL]`;
				userLink = Loc.getMessage(
					'M_CRM_TIMELINE_ITEM_WORKFLOW_EFFICIENCY_WORKFLOW_USER_RESULT',
					{ '#USER_NAME#': userLink },
				) ?? '';
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						marginBottom: 4,
					},
				},
				View(
					{},
					SafeImage({
						style: {
							width: 30,
							height: 30,
							paddingRight: 2,
						},
						resizeMode: 'contain',
						placeholder: {
							content: flag(),
						},
					}),
				),
				View(
					{
						style: {
							paddingTop: 6,
							flexShrink: 1,
						},
					},
					BBCodeText({
						style: {
							fontSize: 14,
							color: AppTheme.colors.base1,
						},
						value: userLink,
						linksUnderline: false,
						onLinkClick: ({ url }) => inAppUrl.open(url),
					}),
				),
			);
		}

		renderEfficiency()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: 4,
						borderTopWidth: 1,
						borderTopColor: AppTheme.colors.base6,
						paddingTop: Indent.XL.toNumber(),
						marginTop: Indent.XL.toNumber(),
					},
				},
				Text({
					text: Loc.getMessage('M_CRM_TIMELINE_ITEM_WORKFLOW_EFFICIENCY_EXECUTION_TIME') ?? '',
					style: {
						fontSize: 13,
						flexDirection: 'row',
						alignItems: 'center',
						color: AppTheme.colors.base3,
						marginRight: 4,
					},
				}),
				Text({
					text: this.formatDuration(this.props.executionTime) ?? '',
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				}),
			);
		}

		formatDuration(time)
		{
			if (!Type.isInteger(time))
			{
				return null;
			}

			if (time === 0)
			{
				return Loc.getMessage('M_CRM_TIMELINE_ITEM_WORKFLOW_EFFICIENCY_EXECUTION_TIME_ZERO') ?? '';
			}

			return Duration.createFromSeconds(time >= 60 ? roundSeconds(time) : time).format();
		}
	}

	module.exports = { TimelineItemBodyWorkflowEfficiency };
});

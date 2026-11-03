/**
 * @module timeman/work-reports/review/detail
 */
jn.define('timeman/work-reports/review/detail', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { showErrorToast } = require('toast');
	const { Color, Component, Corner, Indent } = require('tokens');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { Text4, Text5, BBCodeText, H5 } = require('ui-system/typography');
	const { Moment } = require('utils/date');
	const { dayMonth, shortTime } = require('utils/date/formats');
	const { createTestIdGenerator } = require('utils/test');
	const { openDiscussChat } = require('timeman/work-reports/actions');
	const { WorkReportsApi } = require('timeman/work-reports/api');
	const { formatPeriod, derivePeriod, openReportLink } = require('timeman/work-reports/utils');
	const { AutoReportTitleEnum } = require('timeman/work-reports/enum');
	const { Loc } = require('timeman/work-reports/loc');
	const { ApproveButton } = require('timeman/work-reports/ui/approve-button');
	const { AvatarPair } = require('timeman/work-reports/ui/avatar-pair');
	const { GptReportCard } = require('timeman/work-reports/ui/gpt-report-card');
	const { MarkEnum } = require('timeman/work-reports/enum');
	const { WorkReportsAnalytics } = require('timeman/work-reports/analytics');

	const api = new WorkReportsApi();

	const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

	/**
	 * @extends {PureComponent<WorkReportDetailProps, WorkReportDetailState>}
	 */
	class WorkReportDetail extends PureComponent
	{
		/** @param {WorkReportDetailOpenOptions} options */
		static open({ item, settings, onMarkChange, parentWidget = PageManager })
		{
			const periodLabel = formatPeriod(item.dateFrom, item.dateTo);
			const title = Loc.getMessage('M_TIMEMAN_WORK_REPORTS_DETAIL_TITLE', { '#PERIOD#': periodLabel });

			parentWidget
				.openWidget('layout', {
					titleParams: { text: title },
					backgroundColor: Color.bgContentSecondary.toHex(),
				})
				.then((layout) => {
					layout.showComponent(new WorkReportDetail({ item, settings, onMarkChange }));
				})
				.catch(console.error);
		}

		static #formatSubmittedAt(reportDate)
		{
			if (!reportDate)
			{
				return '';
			}

			const moment = Moment.createFromTimestamp(reportDate);

			return Loc.getMessage('M_TIMEMAN_WORK_REPORTS_DETAIL_SUBMITTED', {
				'#DATE#': moment.format(dayMonth()),
				'#TIME#': moment.format(shortTime()),
			});
		}

		/** @param {WorkReportDetailProps} props */
		constructor(props)
		{
			super(props);

			this.state = {
				markState: MarkEnum.toState(props.item?.mark),
				discussionUrl: null,
				isAiReportsSchemeOn: WorkReportDetail.#readAiReportsScheme(props.settings),
			};

			this.getTestId = createTestIdGenerator({ prefix: 'work-report-detail', context: this });
		}

		#isClosed = false;

		// The mark menu stands at its icon, and the icon reports its ref once, at mount: the holder outlives
		// the rerenders that ApproveButton goes through.
		#markMenuTarget = { current: null };

		/**
		 * The mode the settings name, and nothing when they name none: a missing setting is not the layer
		 * being off, so it is left unknown until the server is asked about it.
		 *
		 * @param {ReportSettings|null|undefined} settings
		 * @returns {boolean|null}
		 */
		static #readAiReportsScheme(settings)
		{
			const isAiReportsSchemeOn = settings?.isAiReportsSchemeOn;

			return isAiReportsSchemeOn === true || isAiReportsSchemeOn === false ? isAiReportsSchemeOn : null;
		}

		componentDidMount()
		{
			this.#loadDiscussion().catch(console.error);
		}

		componentWillUnmount()
		{
			this.#isClosed = true;
		}

		/**
		 * The layer the card is read in: true, false, or nothing while it is still unknown.
		 *
		 * @returns {boolean|null}
		 */
		get #isAiReportsSchemeOn()
		{
			return this.state.isAiReportsSchemeOn;
		}

		/**
		 * The AI reports layer discusses a report in a chat, so there is no livefeed entry to address; the
		 * old scheme has one. A card that does not know its layer yet asks the server for it first instead
		 * of reading the missing settings as one of the two answers.
		 */
		async #loadDiscussion()
		{
			const isAiReportsSchemeOn = await this.#resolveAiReportsScheme();

			if (isAiReportsSchemeOn === false)
			{
				await this.#loadDiscussionUrl();
			}
		}

		/**
		 * The settings are asked for once, and their answer is what the card reads its layer from
		 * afterwards. An answer that names no layer either leaves the card without one: nothing is guessed
		 * here, the same way the transport guesses nothing before a write.
		 *
		 * @returns {Promise<boolean|null>}
		 */
		async #resolveAiReportsScheme()
		{
			if (this.#isAiReportsSchemeOn !== null)
			{
				return this.#isAiReportsSchemeOn;
			}

			const isAiReportsSchemeOn = WorkReportDetail.#readAiReportsScheme(await api.getReportSettings());

			// A card closed while the settings were on their way has no layer to read and nothing to load.
			if (this.#isClosed || isAiReportsSchemeOn === null)
			{
				return null;
			}

			this.setState({ isAiReportsSchemeOn });

			return isAiReportsSchemeOn;
		}

		get reportItem()
		{
			return this.props.item;
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId('box'),
					withScroll: true,
					footer: this.#renderFooter(),
				},
				this.#renderHeader(),
				View(
					{
						style: {
							paddingHorizontal: Component.paddingLr.toNumber(),
							paddingBottom: Indent.XL3.toNumber(),
						},
					},
					this.#renderGptReport(),
					this.#renderReport(),
				),
			);
		}

		#renderHeader()
		{
			const { dateFrom, dateTo, reportDate } = this.reportItem;

			return View(
				{
					testId: this.getTestId('header'),
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
						borderRadius: Corner.L.toNumber(),
						padding: Component.paddingLr.toNumber(),
						marginBottom: Indent.XL3.toNumber(),
					},
				},
				Text4({
					testId: this.getTestId('period'),
					text: formatPeriod(dateFrom, dateTo),
					accent: true,
					color: Color.base1,
				}),
				Text5({
					testId: this.getTestId('submitted'),
					text: WorkReportDetail.#formatSubmittedAt(reportDate),
					color: Color.base4,
					style: {
						marginTop: Indent.XS.toNumber(),
					},
				}),
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginTop: Indent.XL2.toNumber(),
						},
					},
					this.#renderAvatars(),
					this.#renderApproveButton(),
				),
			);
		}

		#renderAvatars()
		{
			return AvatarPair({
				fromUser: this.reportItem.fromUser,
				toUser: this.#getToUser(),
				getTestId: this.getTestId,
			});
		}

		#renderApproveButton()
		{
			const { markState } = this.state;

			return ApproveButton({
				state: markState,
				testId: this.getTestId('approve-button'),
				userId: this.reportItem.userId,
				onChange: this.#handleMarkChange,
				markMenuTarget: this.#markMenuTarget,
			});
		}

		/**
		 * @param {MarkStateValue} nextState
		 */
		#handleMarkChange = async (nextState) => {
			const reportId = this.reportItem?.id;
			// A tap while the write of this report is in flight is dropped silently: there is no error to report.
			if (!reportId || api.isMarkWriteInFlight(reportId))
			{
				return;
			}

			const prevState = this.state.markState;

			try
			{
				this.setState({ markState: nextState });

				await api.saveMarkState(reportId, nextState);

				this.props.onMarkChange?.(reportId, nextState);

				// The legacy decision publishes the entry when it finds none, so a report sent before the entry
				// existed gets one on its first decision: an absent url is worth asking for again.
				if (this.#isAiReportsSchemeOn === false && !this.state.discussionUrl)
				{
					this.#loadDiscussionUrl().catch(console.error);
				}
			}
			catch (error)
			{
				this.setState({ markState: prevState });
				showErrorToast();
				console.error(error);
			}
		};

		#renderGptReport()
		{
			const { dateFrom, dateTo, reportType, gptReport, hasGpt, hasAutoReport } = this.reportItem;
			const period = derivePeriod({ dateFrom, dateTo, reportType })?.type;

			return new GptReportCard({
				testId: this.getTestId('report-gpt'),
				report: gptReport,
				period,
				title: AutoReportTitleEnum.fromReportType(period).getText({ isRobot: !hasGpt }),
				hasAutoReport,
				hasGpt,
			});
		}

		#renderReport()
		{
			const { report } = this.reportItem;

			if (!report)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('report'),
					style: {
						marginTop: Indent.XL4.toNumber(),
					},
				},
				H5({
					testId: this.getTestId('report-title'),
					text: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_DETAIL_REPORT_TITLE'),
					color: Color.base0,
					style: {
						marginBottom: Indent.XL3.toNumber(),
					},
				}),
				BBCodeText({
					testId: this.getTestId('report-text'),
					text: report,
					size: 4,
					onLinkClick: openReportLink,
				}),
			);
		}

		#renderFooter()
		{
			if (!this.#shouldRenderDiscussButton())
			{
				return null;
			}

			return BoxFooter(
				{
					testId: this.getTestId('footer'),
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				Button({
					testId: this.getTestId('discuss-button'),
					text: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_DETAIL_DISCUSS'),
					design: ButtonDesign.FILLED,
					size: ButtonSize.XL,
					stretched: true,
					withStateDecorator: true,
					ref: (ref) => {
						this.discussButtonRef = ref;
					},
					onClick: this.#handleDiscussClick,
				}),
			);
		}

		#handleDiscussClick = async () => {
			const { discussionUrl, isAiReportsSchemeOn } = this.state;
			if (isAiReportsSchemeOn !== true && !discussionUrl)
			{
				return;
			}

			WorkReportsAnalytics.sendReportDiscuss();
			this.discussButtonRef?.setLoading(true);

			try
			{
				await (isAiReportsSchemeOn
					? openDiscussChat({ reportId: this.reportItem.id })
					: openReportLink({ url: discussionUrl }));
			}
			catch (error)
			{
				showErrorToast();
				console.error(error);
			}
			finally
			{
				this.discussButtonRef?.setLoading(false);
			}
		};

		async #loadDiscussionUrl()
		{
			const reportId = this.reportItem?.id;
			if (!reportId)
			{
				return;
			}

			const discussionUrl = await this.#requestDiscussionUrl(reportId);

			if (this.#isClosed)
			{
				return;
			}

			// The entry is created once and is never removed, so an empty answer only means this request went out
			// before it existed: applying it would erase the address another request has already brought.
			if (!discussionUrl)
			{
				return;
			}

			this.setState({ discussionUrl });
		}

		/**
		 * A refused request is not an empty answer, and the only refusal with a chance of answering
		 * differently is the one of a request that never reached the server, so that is the one asked again.
		 * The action refuses the same way every time it is asked, and the card is left without an address:
		 * it reads that the way it reads an entry that does not exist yet. Every refusal reaches the log
		 * and none of them the user.
		 *
		 * @param {number} reportId
		 * @returns {Promise<string|null>}
		 */
		async #requestDiscussionUrl(reportId)
		{
			try
			{
				return await api.getDiscussionUrl(reportId);
			}
			catch (error)
			{
				console.error(error);

				if (!WorkReportDetail.#isNetworkFailure(error))
				{
					return null;
				}
			}

			try
			{
				return await api.getDiscussionUrl(reportId);
			}
			catch (error)
			{
				console.error(error);

				return null;
			}
		}

		/**
		 * A request that never reached the server is refused by the transport itself, under a code of its
		 * own; a refusal of the action carries the codes the action answers with.
		 *
		 * @param {unknown} refusal
		 * @returns {boolean}
		 */
		static #isNetworkFailure(refusal)
		{
			const errors = refusal?.errors;

			return Array.isArray(errors) && errors.some((error) => error?.code === NETWORK_ERROR_CODE);
		}

		/**
		 * Each layer has its own reason to hide the button: the chat needs a recipient other than the author,
		 * the livefeed entry needs to exist and to be readable by the viewer. A card that does not know its
		 * layer yet claims neither of them and shows no button at all.
		 */
		#shouldRenderDiscussButton()
		{
			if (this.#isAiReportsSchemeOn === null)
			{
				return false;
			}

			if (!this.#isAiReportsSchemeOn)
			{
				return Boolean(this.state.discussionUrl);
			}

			const { fromUser } = this.reportItem;
			const toUser = this.#getToUser();

			return Boolean(fromUser && toUser && fromUser.id !== toUser.id);
		}

		#getToUser()
		{
			const { toUsers } = this.reportItem;

			return Array.isArray(toUsers) && toUsers.length > 0 ? toUsers[0] : null;
		}
	}

	module.exports = { WorkReportDetail };
});

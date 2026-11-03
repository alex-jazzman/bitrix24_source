/**
 * @module timeman/work-days/ui/list/item
 */
jn.define('timeman/work-days/ui/list/item', (require, exports, module) => {
	const { Color, Indent, Corner } = require('tokens');
	const { Loc } = require('loc');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');
	const { Moment } = require('utils/date');
	const { DAY_TYPES } = require('timeman/work-days/enums');
	const {
		ChipButton,
		ChipButtonMode,
		ChipButtonDesign,
		ChipButtonSize,
	} = require('ui-system/blocks/chips/chip-button');
	const { DailyReportBox } = require('timeman/work-reports/submit/daily');
	const { RecordReportTypeEnum } = require('timeman/work-reports/enum');
	const { getReportCardFlags } = require('timeman/work-reports/presentation');

	/**
	 * @class WorkDayItem
	 */
	class WorkDayItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: `item-${props.item.id}`, context: this });
		}

		#getDayMeta()
		{
			const { item } = this.props;
			const {
				reports = [],
				timestamp,
				typeId,
				dayColor,
			} = item;

			const reportsByRecordId = new Map();
			reports.forEach((report) => {
				if (report?.recordId)
				{
					reportsByRecordId.set(report.recordId, report);
				}
			});

			return {
				dateText: new Moment(timestamp).format('d MMMM'),
				typeId,
				dayColor,
				reportsByRecordId,
			};
		}

		render()
		{
			const { item, showBorder } = this.props;
			const { records = [] } = item;
			const dayMeta = this.#getDayMeta();

			if (records.length > 1)
			{
				return this.#renderMultipleRecords({ records, showBorder, dayMeta });
			}

			const record = records[0] ?? null;

			return this.#renderRow({
				showBorder,
				dayMeta,
				record,
				content: record
					? this.#renderWorkTime(record, 0)
					: this.#renderDayType(item),
			});
		}

		#renderRow({ showBorder, content, dayMeta, record = null, isPrimaryRow = true })
		{
			const {
				dateText,
				typeId,
				dayColor,
				reportsByRecordId,
			} = dayMeta;

			const report = record ? reportsByRecordId.get(record.id) : null;

			return View(
				{
					style: {
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop: Indent.XS.toNumber(),
						width: '100%',
					},
				},
				View(
					{
						style: {
							minHeight: 42,
							alignItems: 'center',
							flexDirection: 'row',
							paddingTop: Indent.M.toNumber(),
							paddingBottom: Indent.XL2.toNumber(),
							borderBottomWidth: 1,
							borderBottomColor: showBorder && Color.bgSeparatorSecondary.toHex(),
						},
					},
					View(
						{
							style: {
								width: Corner.XS.toNumber() * 2,
								height: Corner.XS.toNumber() * 2,
								borderRadius: Corner.XS.toNumber(),
								marginRight: Indent.S.toNumber(),
								backgroundColor: isPrimaryRow ? dayColor : null,
							},
						},
					),
					Text3({
						testId: this.getTestId('date'),
						text: dateText,
						accent: true,
						color: typeId === DAY_TYPES.WORK.id ? Color.base1 : Color.base3,
						style: {
							marginRight: Indent.XL.toNumber(),
							opacity: isPrimaryRow ? 1 : 0,
							flexShrink: 2,
						},
						ellipsize: 'end',
						numberOfLines: 1,
					}),
					content,
					View(
						{
							style: {
								flex: 1,
								alignItems: 'flex-end',
							},
						},
						(report?.reportPlain || report?.reportExtended) ? this.#renderReportChip(report) : null,
					),
				),
			);
		}

		#renderReportChip(report)
		{
			const recordType = RecordReportTypeEnum.fromValue(report?.type, RecordReportTypeEnum.REPORT);
			const reportFlags = getReportCardFlags(recordType);
			const { hasGpt } = reportFlags;

			return ChipButton({
				testId: this.getTestId(`report-chip-${report.recordId}`),
				design: hasGpt ? ChipButtonDesign.BITRIX_GPT : ChipButtonDesign.PRIMARY,
				mode: hasGpt ? ChipButtonMode.SOLID : ChipButtonMode.OUTLINE,
				size: ChipButtonSize.S,
				text: Loc.getMessage('M_TIMEMAN_WORK_DAYS_REPORT'),
				onClick: () => this.#openReport(report.recordId, reportFlags),
			});
		}

		/**
		 * The sheet is opened before the report is asked for, so it is sized by the cards this row
		 * already knows the report carries.
		 *
		 * @param {number} recordId
		 * @param {RecordReportPresentationFlags} reportFlags
		 */
		#openReport(recordId, reportFlags)
		{
			const { parentWidget, userId } = this.props;

			DailyReportBox.openReport({
				parentWidget,
				userId,
				recordId,
				reportFlags,
				viewOptions: {
					readOnly: true,
				},
			}).catch(console.error);
		}

		#renderMultipleRecords({ records, showBorder, dayMeta })
		{
			return View(
				{
					style: {
						flexDirection: 'column',
						borderBottomWidth: showBorder ? 1 : 0,
						borderBottomColor: showBorder ? Color.bgSeparatorSecondary.toHex() : null,
					},
				},
				...records.map((record, index) => this.#renderRow({
					showBorder: false,
					isPrimaryRow: index === 0,
					dayMeta,
					record,
					content: this.#renderWorkTime(record, index),
				})),
			);
		}

		#renderDayType(item)
		{
			const dayType = Object.values(DAY_TYPES).find((type) => type.id === item.typeId);

			return dayType?.messageKey && Text5({
				testId: this.getTestId('day-type'),
				text: Loc.getMessage(dayType.messageKey),
				color: Color.base3,
			});
		}

		#renderWorkTime(record, index = 0)
		{
			const startText = this.#formatTime(record.startTime);
			const endText = record.endTime ? this.#formatTime(record.endTime) : Loc.getMessage('M_TIMEMAN_WORK_DAYS_IN_PROGRESS');
			const durationText = record.duration ? this.#formatDuration(record.duration) : null;

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Text5({
					testId: this.getTestId(`time-${index}`),
					text: `${startText}–${endText}`,
					color: Color.base3,
				}),
				durationText && View(
					{
						style: {
							width: 2,
							height: 2,
							borderRadius: 1,
							backgroundColor: Color.base5.toHex(),

							marginHorizontal: Indent.S.toNumber(),
						},
					},
				),
				durationText && Text5({
					testId: this.getTestId(`duration-${index}`),
					text: durationText,
					color: Color.base3,
				}),
			);
		}

		#formatTime(value)
		{
			return Moment.createFromTimestamp(value).format('HH:mm');
		}

		#formatDuration(seconds)
		{
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);

			if (hours > 0 && minutes > 0)
			{
				return `${hours}${Loc.getMessage('M_TIMEMAN_WORK_DAYS_HOUR_SHORT')} ${minutes}${Loc.getMessage('M_TIMEMAN_WORK_DAYS_MIN_SHORT')}`;
			}

			if (hours > 0)
			{
				return `${hours}${Loc.getMessage('M_TIMEMAN_WORK_DAYS_HOUR_SHORT')}`;
			}

			return `${minutes}${Loc.getMessage('M_TIMEMAN_WORK_DAYS_MIN_SHORT')}`;
		}
	}

	module.exports = { WorkDayItem };
});

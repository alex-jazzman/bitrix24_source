/**
 * @module crm/simple-list/items/crm-entity-compact
 */
jn.define('crm/simple-list/items/crm-entity-compact', (require, exports, module) => {
	const { EmailType, PhoneType } = require('communication/connection');
	const { CommunicationButton } = require('crm/communication/button');
	const { CrmEntity } = require('crm/simple-list/items/crm-entity');
	const { CompactStageChip } = require('crm/simple-list/items/crm-entity-compact/src/stage-chip');
	const { ClientType } = require('layout/ui/fields');
	const { Loc } = require('loc');
	const { Money } = require('money');
	const { Color, Indent } = require('tokens');
	const { FriendlyDate } = require('layout/ui/friendly-date');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { BadgeCounter, BadgeCounterDesign, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { Text3, Text4 } = require('ui-system/typography/text');
	const { Type } = require('type');
	const { UserProfile } = require('user-profile');
	const { withPressed } = require('utils/color');
	const { Moment, Formats } = require('utils/date');
	const { mergeImmutable } = require('utils/object');

	const has = Object.prototype.hasOwnProperty;

	const RESPONSIBLE_FIELD_NAME = 'ASSIGNED_BY_ID';
	const CREATED_TIME_FIELD_NAME = 'CREATED_TIME';

	// entity date shown in the subtitle line when the server leaves subTitleText empty
	const SUBTITLE_DATE_FIELDS = {
		ACTUAL_DATE: 'M_CRM_LIST_ITEM_COMPACT_ACTUAL_DATE',
		CLOSEDATE: 'M_CRM_LIST_ITEM_COMPACT_CLOSE_DATE',
	};

	const CLIENT_COMMUNICATION_TYPES = [PhoneType, EmailType];
	const SEPARATOR_HEIGHT = 0.5;

	const ERROR_COUNTER_ID = 'error';
	const RESPONSIBLE_AVATAR_SIZE = 24;

	// the connection pill hugs the three outline icons of CommunicationButton instead of its default fixed width
	const CONNECTION_ICON_SIZE = 20;
	const CONNECTION_ICON_COUNT = 3;
	const CONNECTION_PILL_PADDING = Indent.XS.toNumber();
	const CONNECTION_PILL_WIDTH = CONNECTION_ICON_COUNT * CONNECTION_ICON_SIZE
		+ (CONNECTION_ICON_COUNT - 1) * Indent.S.toNumber()
		+ 2 * CONNECTION_PILL_PADDING;

	/**
	 * @class CrmEntityCompact
	 */
	class CrmEntityCompact extends CrmEntity
	{
		getStyles()
		{
			return mergeImmutable(super.getStyles(), {
				wrapper: {
					paddingBottom: 0,
					backgroundColor: Color.bgContentPrimary.toHex(),
				},
				item: {
					borderRadius: 0,
					// gives the long tap a visible response, the compact card has no other pressed state
					backgroundColor: withPressed(Color.bgContentPrimary.toHex()),
				},
				itemContent: {
					marginHorizontal: Indent.XL3.toNumber(),
					paddingTop: Indent.XL.toNumber(),
					paddingBottom: Indent.XL.toNumber(),
					borderBottomWidth: SEPARATOR_HEIGHT,
					borderBottomColor: Color.bgSeparatorSecondary.toHex(),
				},
				header: {
					flexDirection: 'row',
					alignItems: 'flex-start',
					marginLeft: 0,
					marginRight: 0,
					marginBottom: Indent.M.toNumber(),
				},
			});
		}

		renderItemContent()
		{
			return View(
				{
					style: this.styles.itemContent,
					testId: `${this.testId}_COMPACT`,
					// the compact card has no menu icon, so the item menu is anchored to the card itself
					ref: this.props.menuViewRef,
				},
				this.renderHeader(),
				this.renderBody(),
			);
		}

		renderHeader()
		{
			const { data } = this.props.item;

			return View(
				{
					testId: `${this.testId}_SECTION`,
					style: this.styles.header,
				},
				View(
					{
						style: {
							flexDirection: 'column',
							flex: 1,
						},
					},
					Text3({
						testId: `${this.testId}_SECTION_TITLE`,
						text: String(data.name || data.id),
						accent: true,
						color: Color.base1,
						numberOfLines: 2,
						ellipsize: 'end',
						style: {
							marginRight: Indent.L.toNumber(),
							marginBottom: Indent.XS.toNumber(),
						},
					}),
					this.renderSummaryRow(),
					this.renderClientCommunications(),
				),
				View(
					{
						style: {
							flexDirection: 'column',
							alignItems: 'flex-end',
						},
					},
					this.renderDate(),
					(this.blockManager.can('useCountersBlock') && this.renderCounterComponent()),
				),
			);
		}

		renderBody()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
					},
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'column',
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
								paddingTop: Indent.XS.toNumber(),
							},
						},
						(this.renderCrmStageField() || this.renderResponsible()),
						this.blockManager.can('useConnectsBlock') && this.renderConnectionComponent(),
					),
				),
			);
		}

		renderSummaryRow()
		{
			const money = this.renderMoney();
			const subTitleText = this.renderSubTitleText();

			if (!money && !subTitleText)
			{
				return null;
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				money,
				subTitleText,
			);
		}

		renderMoney()
		{
			const { money } = this.props.item.data;

			if (!money || !Type.isNumber(money.amount))
			{
				return null;
			}

			return Text4({
				testId: `${this.testId}_COMPACT_MONEY`,
				text: Money.create(money).formatted,
				color: Color.base0,
				numberOfLines: 1,
				ellipsize: 'end',
			});
		}

		renderSubTitleText()
		{
			const text = this.getSubTitleText();

			if (!Type.isStringFilled(text))
			{
				return null;
			}

			return Text4({
				testId: `${this.testId}_COMPACT_SUB_TITLE`,
				text,
				color: Color.base4,
				numberOfLines: 1,
				ellipsize: 'end',
				style: {
					flexShrink: 2,
					marginLeft: Indent.S.toNumber(),
				},
			});
		}

		/**
		 * @return {string}
		 */
		getSubTitleText()
		{
			const { subTitleText } = this.props.item.data;

			if (Type.isStringFilled(subTitleText))
			{
				return subTitleText;
			}

			return this.getSubTitleDateText();
		}

		/**
		 * @return {string}
		 */
		getSubTitleDateText()
		{
			const { fields } = this.props.item.data;

			if (!Type.isArrayFilled(fields))
			{
				return '';
			}

			const field = fields.find(({ name }) => has.call(SUBTITLE_DATE_FIELDS, name));
			const timestamp = Number(field && field.value);

			if (!Number.isFinite(timestamp) || timestamp <= 0)
			{
				return '';
			}

			return Loc.getMessage(SUBTITLE_DATE_FIELDS[field.name], {
				'#DATE#': Moment.createFromTimestamp(timestamp).format(Formats.longDate),
			});
		}

		renderClientCommunications()
		{
			const text = this.getClientCommunicationsText();

			if (!Type.isStringFilled(text))
			{
				return null;
			}

			return View(
				{
					testId: `${this.testId}_COMPACT_CLIENT_COMMUNICATIONS_BLOCK`,
					onClick: this.showCommunicationButton,
				},
				Text4({
					testId: `${this.testId}_COMPACT_CLIENT_COMMUNICATIONS`,
					text,
					color: Color.base2,
					numberOfLines: 1,
					ellipsize: 'end',
				}),
			);
		}

		/**
		 * Own phones and emails of a contact or a company
		 *
		 * @return {string}
		 */
		getClientCommunicationsText()
		{
			const { entityTypeName } = this.params;
			const client = this.props.item.data[ClientType];

			if (!client || !Type.isStringFilled(entityTypeName))
			{
				return '';
			}

			const entries = client[entityTypeName.toLowerCase()];

			if (!Type.isArrayFilled(entries))
			{
				return '';
			}

			return entries
				.flatMap((entry) => CLIENT_COMMUNICATION_TYPES.flatMap(
					(type) => (Type.isArrayFilled(entry[type]) ? entry[type] : []),
				))
				.map(({ value }) => value)
				.filter(Boolean)
				.join(', ');
		}

		renderCrmStageField()
		{
			const { data } = this.props.item;
			const { entityTypeId, categoryId } = this.params;

			if (!Type.isStringFilled(data.columnId))
			{
				return null;
			}

			const permissions = BX.prop.getObject(data, 'permissions', {});

			return CompactStageChip({
				testId: `${this.testId}_COMPACT_STAGE`,
				entityTypeId,
				categoryId,
				columnCode: data.columnId,
				itemId: data.id,
				readOnly: !permissions.write,
				parentWidget: this.layout,
				onStageSelect: this.onChangeStageHandler,
			});
		}

		/**
		 * The responsible is shown whenever the server sends the field, its set is decided by CompactFieldSet
		 */
		renderResponsible()
		{
			const field = this.getFieldByName(RESPONSIBLE_FIELD_NAME);

			if (!field)
			{
				return null;
			}

			const entityList = (field.config && field.config.entityList);
			const user = (Type.isArrayFilled(entityList) ? entityList[0] : null);
			const userId = Number(user ? user.id : field.value);

			if (!Number.isInteger(userId) || userId <= 0)
			{
				return null;
			}

			return Avatar({
				testId: `${this.testId}_COMPACT_RESPONSIBLE`,
				id: userId,
				name: (user ? user.title : null),
				uri: (user ? user.imageUrl : null),
				size: RESPONSIBLE_AVATAR_SIZE,
				style: {
					marginTop: Indent.XS.toNumber(),
				},
				onClick: () => {
					void UserProfile.open({
						ownerId: userId,
						parentWidget: this.layout,
						analyticsSection: 'crm-compact-list',
					});
				},
			});
		}

		/**
		 * Dynamic types keep no creation date in the item data, so it is taken from the compact field set
		 */
		renderDate()
		{
			const { data } = this.props.item;

			if (data.date > 0)
			{
				return super.renderDate();
			}

			const field = this.getFieldByName(CREATED_TIME_FIELD_NAME);
			const timestamp = Number(field && field.value);

			if (!Number.isFinite(timestamp) || timestamp <= 0)
			{
				return null;
			}

			const moment = Moment.createFromTimestamp(timestamp);

			return new FriendlyDate({
				style: this.styles.date,
				moment,
				defaultFormat: (moment.inThisYear ? Formats.dayMonth() : Formats.longDate()),
				showTime: true,
				useTimeAgo: true,
			});
		}

		/**
		 * @param {string} name
		 * @return {?object}
		 */
		getFieldByName(name)
		{
			const { fields } = this.props.item.data;

			if (!Type.isArrayFilled(fields))
			{
				return null;
			}

			return (fields.find((field) => field.name === name) || null);
		}

		renderCounterComponent()
		{
			const { item } = this.props;
			const { counters = [], activityCounterTotal = 0 } = (item.data.counters || {});

			const hasError = counters.some((counter) => counter.id === ERROR_COUNTER_ID);
			let design = hasError ? BadgeCounterDesign.ALERT : BadgeCounterDesign.SUCCESS;
			if (activityCounterTotal <= 0)
			{
				design = BadgeCounterDesign.LIGHT_GREY;
			}

			return BadgeCounter({
				design,
				testId: `${this.testId}_COMPACT_COUNTER`,
				value: activityCounterTotal,
				size: BadgeCounterSize.M,
				style: {
					marginTop: Indent.XS.toNumber(),
				},
			});
		}

		renderConnectionComponent()
		{
			const { item } = this.props;
			const { isClientEnabled, entityTypeName: ownerTypeName } = this.params;

			if (Type.isBoolean(isClientEnabled) && !isClientEnabled)
			{
				return null;
			}

			return View(
				{
					style: {
						flexDirection: 'row',
					},
					ref: (ref) => {
						if (ref)
						{
							this.communicationBlockRef = ref;
						}
					},
					testId: 'CrmCompactListItemCommunicationButton',
					onClick: this.showCommunicationButton,
				},
				new CommunicationButton({
					ref: (ref) => {
						this.communicationButtonRef = ref;
					},
					horizontal: true,
					useOutlineIcons: true,
					styles: {
						main: {
							width: CONNECTION_PILL_WIDTH,
						},
						wrapper: {
							height: 24,
							width: CONNECTION_PILL_WIDTH,
							paddingHorizontal: CONNECTION_PILL_PADDING,
							justifyContent: 'space-between',
							backgroundColor: Color.bgContentPrimary.toHex(),
							borderColor: Color.bgSeparatorPrimary.toHex(),
							borderWidth: 1,
						},
					},
					showTelegramConnection: !this.telegramConnection,
					value: item.data[ClientType],
					permissions: {
						openLinesAccess: this.openLinesAccess,
					},
					ownerInfo: {
						ownerId: item.id,
						ownerTypeName,
					},
				}),
			);
		}
	}

	module.exports = { CrmEntityCompact };
});

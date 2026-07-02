import { Type, Dom, Event, Loc, Runtime, Tag, Text } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { AddingPopup } from 'crm.activity.adding-popup';
import { Restriction } from 'crm.kanban.restriction';
import { Badge } from 'crm.badge';
import { Popup, PopupManager, Menu, MenuManager } from 'main.popup';
import { Loader } from 'main.loader';
import { SidePanel } from 'main.sidepanel';
import { Label, LabelStyle } from 'ui.system.label';
import 'ui.hint';
import 'crm_activity_planner';
import 'main.kanban';
import { ViewMode } from './viewmode';

/**
 *
 * @param options
 * @extends {BX.Kanban.Item}
 */
export class Item extends BX.Kanban.Item
{
	static messages = {};

	/** @var {BX.CRM.Kanban.Grid} */
	grid = null;
	container = null;
	timer = null;
	popupTooltip = null;
	plannerCurrent = null;
	fieldsWrapper = null;
	badgesWrapper = null;
	footerWrapper = null;
	clientName = null;
	clientNameItems = [];
	useAnimation = false;
	isAnimationInProgress = false;
	changedInPullRequest = false;
	columnChangedInPullRequest = false;
	notChangeTotal = false;
	activityAddingPopup = null;
	ufTooltipNodes = [];
	lastPosition = {
		columnId: null,
		targetId: null,
	};
	checked = false;

	constructor(options)
	{
		super(options);
	}

	setOptions(options)
	{
		if (!options)
		{
			return;
		}

		super.setOptions(options);

		this.useAnimation = Type.isBoolean(options.useAnimation) ? options.useAnimation : false;
	}

	setDataKey(key, val)
	{
		const data = this.getData();
		data[key] = val;
		this.setData(data);
	}

	getDataKey(key)
	{
		const data = this.getData();

		return data[key];
	}

	switchClass(el, className, mode)
	{
		if (mode)
		{
			Dom.addClass(el, className);
		}
		else
		{
			Dom.removeClass(el, className);
		}
	}

	switchVisible(element, mode)
	{
		if (mode)
		{
			Dom.style(element, { display: '' });
		}
		else
		{
			Dom.style(element, { display: 'none' });
		}
	}

	getLastPosition()
	{
		return this.lastPosition;
	}

	setLastPosition()
	{
		const column = this.getColumn();
		const sibling = column.getNextItemSibling(this);

		this.lastPosition = {
			columnId: column.getId(),
			targetId: sibling ? sibling.getId() : 0,
		};
	}

	getBodyContainer()
	{
		if (!this.layout.bodyContainer)
		{
			this.layout.bodyContainer = Tag.render`<div class="main-kanban-item-wrapper"></div>`;
		}

		return this.layout.bodyContainer;
	}

	/**
	 * @returns {HTMLElement}
	 */
	render()
	{
		const data = this.getData();
		const specialType = data.special_type ?? null;

		if (specialType === 'import')
		{
			return this.getPreparedStartLayout();
		}

		if (specialType === 'rest')
		{
			return this.getPreparedIndustrySolutionsLayout();
		}

		if (!this.container)
		{
			this.createLayout();
		}

		if (this.isLayoutFooterEveryRender())
		{
			this.layoutFooter();
		}

		this.setBorderColor();
		this.setLink();
		this.setPriceFormattedHtml();

		this.date.textContent = data.date;

		this.setClientName();

		if (this.planner)
		{
			this.switchPlanner();
		}

		this.prepareContactTypeElements();
		this.appendLastActivity(data);

		if (this.needRenderFields())
		{
			this.fieldsWrapper.innerHTML = null;
			this.layoutFields();
		}

		this.layoutBadges();

		return this.container;
	}

	getPreparedStartLayout()
	{
		const layout = this.getStartLayout();
		this.emitOnSpecialItemDraw(layout);

		this.grid.ccItem = this;

		Dom.style(this.getBodyContainer(), { background: 'none' });

		return layout;
	}

	/**
	 * Gets demo block for contact center.
	 * @returns {HTMLElement}
	 */
	getStartLayout()
	{
		this.getCloseStartLayout();

		const gridData = this.getGridData();

		const mainTitle = Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_TITLE');
		const secondTitle = Loc.getMessage(`CRM_KANBAN_EMPTY_CARD_CT_TEXT${gridData.entityType}`);
		const cardImportNode = (
			gridData.rights.canImport
				? Tag.render`
					<div>
						<div class="crm-kanban-item-contact-center-title crm-kanban-item-contact-center-title-import">
							${Loc.getMessage('CRM_KANBAN_EMPTY_CARD_IMPORT_MSGVER_1')}
						</div>
					</div>
				`
				: null
		);

		return Tag.render`
			<div class="crm-kanban-item-contact-center">
				<div class="crm-kanban-sidepanel" data-url="contact_center">
					${this.getCloseStartLayout()}
					<div class="crm-kanban-item-contact-center-title">
						<div class="crm-kanban-item-contact-center-title-item">${mainTitle}</div>
						<div class="crm-kanban-item-contact-center-title-item">${secondTitle}</div>
					</div>
					<div class="crm-kanban-item-contact-center-action">
						<div class="crm-kanban-item-contact-center-action-section">
							<a
								href="#"
								data-url="ol_chat"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-chat"
							>
								${Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_CHAT')}
							</a>
							<a
								href="#"
								data-url="ol_forms"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-crm-forms"
							>
								${Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_FORMS')}
							</a>
							<a
								href="#"
								data-url="ol_viber"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-viber"
							>
								Viber
							</a>
						</div>
						<div class="crm-kanban-item-contact-center-action-section">
							<a
								href="#"
								data-url="telephony"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-call"
							>
								${Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_PHONES')}
							</a>
							<a
								href="#"
								data-url="email"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-mail"
							>
								${Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_EMAIL')}
							</a>
							<a
								href="#"
								data-url="ol_telegram"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-telegram"
							>
								Telegram
							</a>
						</div>
					</div>
				</div>
				${cardImportNode}
			</div>
		`;
	}

	getPreparedIndustrySolutionsLayout()
	{
		const layout = this.getIndustrySolutionsLayout();
		this.emitOnSpecialItemDraw(layout);

		this.grid.restItem = this;

		return layout;
	}

	/**
	 * Gets REST block.
	 * @returns {Element}
	 */
	getIndustrySolutionsLayout()
	{
		const importList = [
			'CRM_KANBAN_REST_DEMO_FILE_IMPORT',
			'CRM_KANBAN_REST_DEMO_FILE_EXPORT',
			'CRM_KANBAN_REST_DEMO_CRM_MIGRATION',
			'CRM_KANBAN_REST_DEMO_MARKET_2_MSGVER_1',
			'CRM_KANBAN_REST_DEMO_PUBLICATION_2_MSGVER_1',
		];

		const importListNode = document.createDocumentFragment();
		importList.forEach((code, index) => {
			const className = `crm-kanban-item-industry-list-item crm-kanban-item-industry-list-item-${(index + 1)}`;
			const text = Loc.getMessage(code);
			const element = Tag.render`
				<div class="${className}">
					<div class="crm-kanban-item-industry-list-item-img"></div>
					<div class="crm-kanban-item-industry-list-item-text">${text}</div>
				</div>
			`;
			Dom.append(element, importListNode);
		});

		return Tag.render`
			<div class="crm-kanban-item-industry">
				<div class="crm-kanban-item-industry-title">
					${Loc.getMessage('CRM_KANBAN_REST_DEMO_MARKET_SECTOR')}
				</div>
				<div class="crm-kanban-item-industry-list">
					${importListNode}
				</div>
				<span class="ui-btn ui-btn-sm ui-btn-primary ui-btn-round crm-kanban-sidepanel" data-url="rest_demo">
					${Loc.getMessage('CRM_KANBAN_REST_DEMO_SETUP')}
				</span>
				<div class="crm-kanban-item-industry-close" onclick="${this.onIndustryCloseButtonClick.bind(this)}"></div>
			</div>
		`;
	}

	onIndustryCloseButtonClick(event)
	{
		event.stopPropagation(event);

		this.getGrid().toggleRest();

		this.getGrid().registerAnalyticsSpecialItemCloseEvent(
			this,
			BX.Crm.Integration.Analytics.Dictionary.SUB_SECTION_KANBAN,
			BX.Crm.Integration.Analytics.Dictionary.ELEMENT_CLOSE_BUTTON,
			BX.Crm.Integration.Analytics.Dictionary.TYPE_ITEM_INDUSTRY,
		);
	}

	emitOnSpecialItemDraw(layout)
	{
		BX.onCustomEvent('Crm.Kanban.Grid:onSpecialItemDraw', [this, layout]);
	}

	setBorderColor()
	{
		const color = this.getColumn().getColor();
		const rgb = BX.util.hex2rgb(color);
		const rgba = `rgba(${rgb.r},${rgb.g},${rgb.b},.7)`;

		Dom.style(this.container, { '--crm-kanban-item-color': rgba });
	}

	setLink()
	{
		const data = this.getData();

		let linkHtml = this.clipTitle(data.name);
		if (data.isAutomationDebugItem)
		{
			const debugTitle = Loc.getMessage('CRM_KANBAN_ITEM_DEBUG_TITLE_MSGVER_1');
			linkHtml = `<span class="crm-kanban-debug-item-label">${debugTitle}</span> ${linkHtml}`;
		}

		this.link.innerHTML = linkHtml;

		Dom.attr(this.link, { href: data.link });
	}

	setPriceFormattedHtml()
	{
		const data = this.getData();

		if (this.totalPrice)
		{
			this.totalPrice.innerHTML = data.price_formatted;
		}
	}

	/**
	 * Add <span> for last word in title.
	 * @param {String} fullTitle
	 * @returns {String}
	 */
	clipTitle(fullTitle)
	{
		const separator = ' ';
		const arrTitle = fullTitle.split(separator);
		const lastWordIndex = arrTitle.length - 1;
		const lastWord = `<span>${arrTitle[lastWordIndex]}</span>`;

		arrTitle.splice(lastWordIndex);

		return `${arrTitle.join(separator)}${separator}${lastWord}`;
	}

	setClientName()
	{
		const data = this.getData();
		const gridData = this.getGridData();

		this.clientNameItems = [];
		if (
			this.getContactId()
			&& data.contactName
			&& gridData.customFields.includes('CLIENT')
		)
		{
			this.clientNameItems.push(data.contactTooltip);
		}

		if (
			this.getCompanyId()
			&& data.companyName
			&& gridData.customFields.includes('CLIENT')
		)
		{
			this.clientNameItems.push(data.companyTooltip);
		}

		if (Type.isArrayFilled(this.clientNameItems))
		{
			this.clientName.innerHTML = '';
			this.clientNameItems.forEach((clientNameItem) => {
				if (!clientNameItem.includes('data-mini-card="true"'))
				{
					return;
				}

				const element = Tag.render`${clientNameItem}`;

				const entityTypeId = Number(element.dataset.entityTypeId);
				const entityId = Number(element.dataset.entityId);

				Runtime
					.loadExtension('crm.mini-card')
					.then(({ EntityMiniCard }) => {
						new BX.Crm.EntityMiniCard({
							bindElement: element,
							entityTypeId,
							entityId,
						});
					})
				;

				Dom.append(element, this.clientName);
			});

			this.switchVisible(this.clientName, true);
		}
		else
		{
			this.switchVisible(this.clientName, false);
		}
	}

	prepareContactTypeElements()
	{
		const data = this.getData();

		const contactTypes = [
			'Phone',
			'Email',
			'Im',
		];

		contactTypes.forEach((type) => {
			const contactType = `contact${type}`;
			Event.unbindAll(this[contactType]);

			const disabledClass = `crm-kanban-item-contact-${type.toLowerCase()}-disabled`;

			if (data[type.toLowerCase()])
			{
				Event.bind(this[contactType], 'click', (event) => {
					this.clickContact(type.toLowerCase(), event.target);
				});
				this.switchClass(this[contactType], disabledClass, false);

				return;
			}

			Event.bind(
				this[contactType],
				'mouseover',
				({ target }) => {
					const dataType = Dom.attr(target, 'data-type');
					this.showTooltip(Loc.getMessage(`CRM_KANBAN_NO_${dataType.toUpperCase()}`), target);
				},
			);
			Event.bind(this[contactType], 'mouseout', this.hideTooltip.bind(this));

			this.switchClass(this[contactType], disabledClass, true);
		});
	}

	appendLastActivity(data)
	{
		if (!this.isShowLastActivityTime() && !this.isShowLastActivityUser())
		{
			return;
		}

		if (this.isShowLastActivityTime())
		{
			Dom.clean(this.lastActivityTime);
		}
		else
		{
			Dom.remove(this.lastActivityTime);
		}

		if (this.isShowLastActivityUser())
		{
			Dom.clean(this.lastActivityBy);
		}
		else
		{
			Dom.remove(this.lastActivityBy);
		}

		const lastActivity = data.lastActivity;
		if (
			!Type.isPlainObject(lastActivity)
			|| !Restriction.Instance.isLastActivityInfoInKanbanItemAvailable()
		)
		{
			return;
		}

		if (this.isShowLastActivityTime())
		{
			this.appendLastActivityTime(lastActivity);
		}

		if (this.isShowLastActivityUser())
		{
			this.appendLastActivityUser(lastActivity);
		}
	}

	appendLastActivityTime(lastActivity)
	{
		// server converts timezone to user before send
		const timestampInUserTimezone = Text.toInteger(lastActivity.timestamp);
		if (timestampInUserTimezone <= 0)
		{
			return;
		}

		const utcTimestamp = timestampInUserTimezone - BX.Main.Timezone.Offset.USER_TO_SERVER;

		const timeInUserTimezone = BX.Main.Timezone.UserTime.getDate(utcTimestamp);
		const userNow = BX.Main.Timezone.UserTime.getDate();

		const secondsAgo = (userNow.getTime() - timeInUserTimezone.getTime()) / 1000;

		const ago = (
			secondsAgo <= 60
				? Text.encode(Loc.getMessage('CRM_KANBAN_JUST_NOW'))
				: this.getFormattedLastActiveDateTime(timeInUserTimezone, userNow)
		);

		const timeAgo = Tag.render`
			<span class="crm-kanban-item-last-activity-time-ago">${ago}</span>
		`;

		Dom.append(timeAgo, this.lastActivityTime);
	}

	appendLastActivityUser(lastActivity)
	{
		const lastActivityBy = this.getUserConfigById(lastActivity?.user?.id) ?? lastActivity.user;
		if (!Type.isPlainObject(lastActivityBy))
		{
			return;
		}

		let pictureStyle = '';
		if (Type.isStringFilled(lastActivityBy.picture))
		{
			const pictureUrl = new BX.Uri(lastActivityBy.picture);
			const backgroundUrl = encodeURI(Text.encode(pictureUrl.toString()));

			pictureStyle = `style="background-image: url('${backgroundUrl}')"`;
		}

		const hasLink = (
			Type.isStringFilled(lastActivityBy.link)
			&& lastActivityBy.link.startsWith('/')
		);
		const href = (hasLink ? lastActivityBy.link : '#');

		const userPic = Tag.render`
			<a
				class="crm-kanban-item-last-activity-by-userpic"
				href="${Text.encode(href)}"
			 	bx-tooltip-user-id="${Text.toInteger(lastActivityBy.id)}"
			 	bx-tooltip-context="b24"
				${pictureStyle}
			></a>
		`;

		Dom.append(userPic, this.lastActivityBy);
	}

	isShowLastActivityTime()
	{
		return Boolean(this.grid.data.itemsConfig?.showLastActivityTime ?? true);
	}

	isShowLastActivityUser()
	{
		return Boolean(this.grid.data.itemsConfig?.showLastActivityUserAvatar ?? true);
	}

	getUserConfigById(id)
	{
		const gridData = this.getGridData();

		if (!Type.isArrayFilled(gridData.itemsConfig?.users))
		{
			return null;
		}

		return gridData.itemsConfig?.users.find((user) => {
			return Number(user.id) === Number(id);
		}) ?? null;
	}

	getFormattedLastActiveDateTime(lastActivityTimeInUserTimezone, userNow)
	{
		const isCurrentYear = lastActivityTimeInUserTimezone.getFullYear() === (new Date()).getFullYear();
		const defaultFormat = (
			isCurrentYear
				? DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT')
				: DateTimeFormat.getFormat('MEDIUM_DATE_FORMAT')
		);

		let shortTimeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
		shortTimeFormat = shortTimeFormat.replace(/\b(a)\b/, 'A'); // for uppercase AM/PM markers: h:i a => h:i A

		const formattedDateTime = DateTimeFormat.format(
			[
				['i', 'idiff'],
				['yesterday', `yesterday, ${shortTimeFormat}`],
				['today', `today ${shortTimeFormat}`],
				['-', defaultFormat],
			],
			lastActivityTimeInUserTimezone,
			userNow,
		);

		return formattedDateTime
			.replaceAll('\\', '')
			.replaceAll(/(^|\s)(.)/g, (firstLetter) => firstLetter.toLocaleUpperCase())
		;
	}

	needRenderFields()
	{
		const wrapperCreated = Boolean(this.fieldsWrapper);
		const itemHasFields = Boolean(this.getData().fields);

		return Boolean(wrapperCreated && itemHasFields);
	}

	getItemFields()
	{
		if (!this.fieldsWrapper)
		{
			this.fieldsWrapper = BX.create('div', {
				props: {
					className: 'crm-kanban-item-fields',
				},
			});

			if (this.getGrid().getTypeInfoParam('useRequiredVisibleFields'))
			{
				this.switchVisible(this.link, true);
				this.switchVisible(this.date, true);
				this.switchVisible(this.clientName, true);
				if (this.total)
				{
					this.switchVisible(this.total, true);
				}

				return this.fieldsWrapper;
			}
			this.layoutFields();
		}

		return this.fieldsWrapper;
	}

	layoutFields()
	{
		if (!this.fieldsWrapper)
		{
			return;
		}

		this.data.fields.forEach((field) => {
			this.layoutField(field);
		});
	}

	layoutField(field)
	{
		const code = field.code;

		if (code === 'TITLE')
		{
			this.switchVisible(this.link, true);

			return;
		}

		if (code === 'DATE_CREATE')
		{
			this.switchVisible(this.date, true);

			return;
		}

		if (code === 'CLIENT')
		{
			this.switchVisible(this.clientName, true);

			return;
		}

		if (code === 'OPPORTUNITY' || code === 'PRICE')
		{
			if (this.total)
			{
				this.switchVisible(this.total, true);
			}

			return;
		}

		const fieldConfig = this.getFieldConfig(field);
		if (!fieldConfig)
		{
			return;
		}

		let titleIcon = null;
		if (Type.isObject(fieldConfig.icon) && Type.isStringFilled(fieldConfig.icon.url))
		{
			titleIcon = Tag.render`
				<div class="crm-kanban-item-fields-item-title-icon">
					<img 
						src="${encodeURI(fieldConfig.icon.url)}"
						title="${Text.encode(fieldConfig.icon.title ?? '')}"
						alt=""
					>
				</div>
			`;
		}

		const titleText = Tag.render`<div class="crm-kanban-item-fields-item-title-text"></div>`;
		titleText.innerHTML = fieldConfig.title;

		let titleTooltip = null;
		const tooltipText = fieldConfig?.helpMessage ?? '';
		if (tooltipText && this.getGrid().shouldShowTooltips())
		{
			titleTooltip = Tag.render`
				<span
					class="crm-kanban-item-fields-item-title-tooltip --hidden">
				</span>
			`;

			titleTooltip.dataset.hint = tooltipText;

			this.ufTooltipNodes.push(titleTooltip);
		}

		const titleTextWrapper = Tag.render`
			<div class="crm-kanban-item-fields-item-title-wrapper">
				${titleIcon}
				${titleText}
				${titleTooltip}
			</div>
		`;

		const fieldParamsData = { ...field, ...fieldConfig };
		if (Type.isBoolean(field.html))
		{
			fieldParamsData.html = field.html;
		}

		const fieldsElement = Dom.create('div', this.getFieldParams(fieldParamsData));

		if (fieldConfig.type === 'text' || fieldConfig.type === 'string')
		{
			this.addTextExpander(fieldsElement);
		}

		if (code === 'COMMENTS' && BX.Type.isStringFilled(this.getGrid().getData().copilotName))
		{
			const copilot = `${this.getGrid().getData().copilotName}`;
			const escapedCopilot =
				BX.Type.isFunction(RegExp.escape)
					? RegExp.escape(copilot)
					: copilot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			;
			const regex = new RegExp(`(^|<br>)${escapedCopilot}`, 'gim');

			const valueElements = fieldsElement.querySelectorAll('p');

			valueElements.forEach(valueElement => {
				valueElement.innerHTML = valueElement.innerHTML.replaceAll(
					regex,
					match => match.replace(copilot, `<span class="crm-kanban-bitrix-gpt-gradient">${copilot}</span>`),
				);
			});
		}

		const fieldsItem = Tag.render`
			<div class="crm-kanban-item-fields-item">
				<div class="crm-kanban-item-fields-item-title">
					${titleTextWrapper}
				</div>
				${fieldsElement}
			</div>
		`;

		Dom.append(fieldsItem, this.fieldsWrapper);
		BX.UI.Hint.init(BX(this.fieldsWrapper));
	}

	addTextExpander(fieldElement)
	{
		if (!BX.Type.isDomNode(fieldElement))
		{
			return;
		}

		BX.Dom.addClass(fieldElement, '--text');

		const toggleHandler = (event) => {
			if (event)
			{
				event.stopPropagation();
			}

			BX.Dom.toggleClass(fieldElement, '--text-expanded');

			const isExpanded = BX.Dom.hasClass(fieldElement, '--text-expanded');
			fieldElement.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
		};

		BX.Event.bind(fieldElement, 'click', toggleHandler);
	}

	/**
	 * for kanban api v2
	 * @param {Object} field
	 * @returns {Object}
	 */
	getFieldConfig(field)
	{
		const config = this.getFieldsConfig().find((item) => {
			return field.code === item.code;
		}) ?? field;

		if (config.type === 'user')
		{
			config.value = this.getUserConfigById(field.value) ?? field.value;
		}

		return config;
	}

	/**
	 * for kanban api v2
	 * @returns {Array<Object>}
	 */
	getFieldsConfig()
	{
		return this.getItemsConfigData().fields ?? [];
	}

	/**
	 * for kanban api v2
	 * @returns {Object}
	 */
	getItemsConfigData()
	{
		return this.getGridData().itemsConfig ?? {};
	}

	/**
	 * @param field
	 * @property {string} code
	 * @property {boolean} html
	 * @property {string} icon
	 * @property {boolean} isMultiple
	 * @property {string} title
	 * @property {string} type
	 * @property {Object} value
	 * @property {string | null} valueDelimiter
	 * @returns {Object}
	 */
	getFieldParams(field)
	{
		const type = field.type ?? 'string';

		let params = {
			props: {
				className: 'crm-kanban-item-fields-item-value',
			},
		};

		if (type === 'user')
		{
			params = {
				...params,
				...this.getUserTypeFieldParams(field),
			};
		}
		else if (
			field.value.includes('data-mini-card="true"')
			|| (
				Type.isArray(field.value)
				&& field.value.every((fieldValue) => fieldValue.includes('data-mini-card="true"'))
			)
		)
		{
			const fieldValues = Type.isArray(field.value)
				? field.value
				: [field.value];

			const miniCardListContainer = Tag.render`<div class="crm-mini-card-list-container"></div>`;

			fieldValues.forEach((fieldValue) => {
				const element = Tag.render`${fieldValue}`;

				const entityTypeId = Number(element.dataset.entityTypeId);
				const entityId = Number(element.dataset.entityId);

				void Runtime
					.loadExtension('crm.mini-card')
					.then(({ EntityMiniCard }) => {
						new EntityMiniCard({
							bindElement: element,
							entityTypeId,
							entityId,
						});
					})
				;

				Dom.append(element, miniCardListContainer);
			});

			params.children = [
				miniCardListContainer,
			];
		}
		else if (field.type === 'money' || field.html === true)
		{
			const delimiter = field.valueDelimiter ?? '<br>';
			params.html = Type.isArray(field.value) ? field.value.join(delimiter) : field.value;

			if (params.html.includes('<b>'))
			{
				params.props.className = `${params.props.className} --normal-weight`;
			}
		}
		else
		{
			params.text = Type.isArray(field.value) ? field.value.join(', ') : field.value;
		}

		return params;
	}

	getUserTypeFieldParams(field)
	{
		const params = {};

		// for api v2
		if (!Type.isPlainObject(field.value) || Type.isArray(field.value))
		{
			if (Type.isArray(field.value))
			{
				const results = [];
				field.value.forEach((userId) => {
					const userTypeFieldConfigData = (this.getItemsConfigData().users?.find((user) => user.id === Number(userId)) ?? null);
					if (Type.isPlainObject(userTypeFieldConfigData))
					{
						const info = this.getInfoFromUserTypeFieldValue(userTypeFieldConfigData);
						results.push(info.balloon);
					}
				});

				params.html = results.join(', ');

				return params;
			}

			const userTypeFieldConfigData = this.getItemsConfigData().users?.find((user) => user.id === Number(field.value)) ?? null;
			const info = this.getInfoFromUserTypeFieldValue(userTypeFieldConfigData);

			params.html = info.balloon;
		}

		if (field.html !== true)
		{
			params.text = this.getMessage('noname');

			return params;
		}

		if (Type.isPlainObject(field.value))
		{
			const info = this.getInfoFromUserTypeFieldValue(field.value);

			if (field.code === 'ASSIGNED_BY_ID')
			{
				params.html = `
					<div class="crm-kanban-item-fields-item-value-user">
						${info.picture}
						${info.name}
					</div>
				`;
			}
			else
			{
				const html = info.balloon ?? `${info.picture}\n${info.name}`;
				params.html = `
					<div class="crm-kanban-item-fields-item-value-user">
						${html}
					</div>
				`;
			}
		}
		else
		{
			params.html = Type.isArray(field.value) ? field.value.join(', ') : field.value;
		}

		return params;
	}

	getInfoFromUserTypeFieldValue(value)
	{
		if (!Type.isPlainObject(value))
		{
			return {};
		}

		let itemUserPic = '';
		let itemUserName = '';
		if (value.link === '')
		{
			itemUserPic = '<span class="crm-kanban-item-fields-item-value-userpic"></span>';
			itemUserName = `<span class="crm-kanban-item-fields-item-value-name">${value.title}</span>`;
		}
		else
		{
			let userPic = '';
			if (value.picture)
			{
				userPic = ` style="background-image: url('${encodeURI(Text.encode(value.picture))}')"`;
			}

			const tooltip = (
				value.id
					? `bx-tooltip-user-id="${Text.toInteger(value.id)}" bx-tooltip-context="b24"`
					: null
			);

			itemUserPic = `<a class="crm-kanban-item-fields-item-value-userpic" ${tooltip} href="${value.link}"${userPic}></a>`;
			itemUserName = `<a class="crm-kanban-item-fields-item-value-name" ${tooltip} href="${value.link}">${value.title}</a>`;
		}

		return {
			picture: itemUserPic,
			name: itemUserName,
			balloon: value.balloon,
		};
	}

	layoutBadges()
	{
		Dom.clean(this.badgesWrapper);

		const badges = this.getBadges();
		for (let i = 0; i < badges.length; i++)
		{
			const badgeData = badges[i];

			const badgeValueClass = 'crm-kanban-item-badges-item-value crm-kanban-item-badges-status';
			const badgeValueStyle = `
				background-color: ${badgeData.backgroundColor};
				border-color: ${badgeData.backgroundColor};
				color: ${badgeData.textColor};
			`;

			const badgeTextItem = Tag.render`
				<div class="${badgeValueClass}" style="${badgeValueStyle}">${badgeData.textValue}</div>
			`;

			const item = Tag.render`
				<div class="crm-kanban-item-badges-item">
					<div class="crm-kanban-item-badges-item-title">
						<div class="crm-kanban-item-badges-item-title-text">${badgeData.fieldName}</div>
					</div>
					${badgeTextItem}
				</div>
			`;

			Dom.append(item, this.badgesWrapper);

			if (Type.isStringFilled(badgeData?.hint))
			{
				const badge = new Badge(badgeTextItem);
				badge.init({
					hint: badgeData.hint,
				});
			}
		}
	}

	layoutFooter()
	{
		Dom.clean(this.footerWrapper);

		const elements = [{
			id: 'planner',
			node: this.createPlanner(),
		}];

		if (this.isShowLastActivityTime() || this.isShowLastActivityUser())
		{
			elements.push({
				id: 'activityBlock',
				node: this.createLastActivityBlock(),
			});
		}

		const data = {
			elements,
			item: this,
		};

		BX.Event.EventEmitter.emit('BX.Crm.Kanban.Item::onBeforeFooterCreate', data);

		data.elements.forEach((element) => {
			Dom.append(element.node, this.footerWrapper);
		});
	}

	/**
	 * Get close icon for demo-block.
	 * @return {Element}
	 */
	getCloseStartLayout()
	{
		return BX.create('div', {
			props: {
				className: 'crm-kanban-item-contact-center-close',
			},
			events: {
				click: function(e)
				{
					this.grid.toggleCC();
					e.stopPropagation(e);
				}.bind(this),
			},
		});
	}

	selectItem()
	{
		this.checked = true;
		// BX.onCustomEvent("BX.CRM.Kanban.Item.select", [this]);
		Dom.addClass(this.checkedButton, 'crm-kanban-item-checkbox-checked');
		Dom.addClass(this.container, 'crm-kanban-item-selected');
	}

	unSelectItem()
	{
		this.checked = false;
		// BX.onCustomEvent("BX.CRM.Kanban.Item.unSelect", [this]);
		Dom.removeClass(this.checkedButton, 'crm-kanban-item-checkbox-checked');
		Dom.removeClass(this.container, 'crm-kanban-item-selected');
	}

	createLayout()
	{
		const container = this.createContainer();

		const elements = [
			this.createTitleLink(),
			this.createLine(),
			this.createRepeated(),
			this.createTotalPrice(),
			this.createClientName(),
			this.createDate(),
			this.createCheckedButton(),
			this.hasFields() ? this.getItemFields() : null,
			this.createBadgesWrapper(),
			this.createAside(),
			this.createFooterWrapper(),
			this.createShadow(),
		];

		if (!this.isLayoutFooterEveryRender())
		{
			this.layoutFooter();
		}

		elements.forEach((element) => {
			Dom.append(element, container);
		});
	}

	isLayoutFooterEveryRender()
	{
		return Boolean(this.getPerformanceSettings().layoutFooterEveryItemRender === 'Y');
	}

	getPerformanceSettings()
	{
		return this.getGrid().getData().performance;
	}

	createContainer()
	{
		let containerClassname = this.getGrid().getTypeInfoParam('kanbanItemClassName');
		if (this.useAnimation)
		{
			containerClassname += ` ${containerClassname}-new`;
		}

		this.container = Tag.render`
			<div
				class="${containerClassname} --ui-context-content-light"
				onclick="${this.onContainerClick.bind(this)}"
				ondblclick="${this.onContainerDblClick.bind(this)}"
				onmouseenter="${this.onContainerMouseEnter.bind(this)}"
				onmouseleave="${this.onContainerMouseLeave.bind(this)}"
			></div>
		`;

		Event.bind(this.container, 'animationend', () => {
			Dom.removeClass(this.layout.container, 'main-kanban-item-new');
		});

		return this.container;
	}

	onContainerClick(event)
	{
		const target = event.target;

		const classNames = this.container.className.replaceAll(' ', '.');
		const parent = target.closest(`.${classNames}`);

		if (
			(target !== this.container && !parent)
			|| (parent && target.tagName === 'A')
			|| (
				parent
				&& target.tagName === 'SPAN'
				&& !Dom.hasClass(target, 'crm-kanban-item-contact')
			)
			|| (parent && target.closest('.crm-kanban-item-activity'))
		)
		{
			return;
		}

		const grid = this.getGrid();

		if (this.checked)
		{
			grid.unCheckItem(this);

			if (!Type.isArrayFilled(grid.getChecked()))
			{
				grid.resetMultiSelectMode();
				grid.stopActionPanel();
			}
		}
		else
		{
			const openColumn = grid.getColumnWithOpenEditor();
			const editorClosePromise = openColumn
				? openColumn.closeQuickFormEditor()
				: Promise.resolve(true);

			editorClosePromise.then((closed) => {
				if (!closed)
				{
					return;
				}

				// Defer to next tick: confirmation dialog's click event bubbles and resets selected items
				setTimeout(() => {
					grid.checkItem(this);
					grid.onMultiSelectMode();
					grid.startActionPanel();
					grid.calculateTotalCheckItems();
				}, 0);
			});

			return;
		}

		grid.calculateTotalCheckItems();
	}

	onContainerDblClick()
	{
		this.link.click();
	}

	onContainerMouseLeave()
	{
		this.hideUfTooltips();
		this.removeHoverClass(this.container);
	}

	onContainerMouseEnter()
	{
		this.showUfTooltips();
	}

	hideUfTooltips()
	{
		this.ufTooltipNodes.forEach((node, idx) => {
			this.ufTooltipNodes[idx].classList.add('--hidden');
		});
	}

	showUfTooltips()
	{
		this.ufTooltipNodes.forEach((node, idx) => {
			this.ufTooltipNodes[idx].classList.remove('--hidden');
		});
	}

	createTitleLink()
	{
		this.link = Tag.render`<a class="crm-kanban-item-title" style="${this.getBlockStyleBasedOnFields()}"></a>`;

		return this.link;
	}

	createLine()
	{
		return Tag.render`<div class="crm-kanban-item-line"></div>`;
	}

	createRepeated()
	{
		const optionsData = this.options.data;

		if (!optionsData.return && !optionsData.returnApproach)
		{
			return null;
		}

		const entityType = this.getGridData().entityType;
		const text = optionsData.returnApproach
			? Loc.getMessage(`CRM_KANBAN_REPEATED_APPROACH_${entityType}`)
			: Loc.getMessage(`CRM_KANBAN_REPEATED_${entityType}`)
		;

		return Tag.render`<div class="crm-kanban-item-repeated">${text}</div>`;
	}

	createTotalPrice()
	{
		this.totalPrice = Tag.render`<div class="crm-kanban-item-total-price"></div>`;
		this.total = Tag.render`
			<div class="crm-kanban-item-total" style="${this.getBlockStyleBasedOnFields()}">${this.totalPrice}</div>
		`;

		return this.total;
	}

	createClientName()
	{
		this.clientName = Tag.render`<span class="crm-kanban-item-contact"></span>`;

		return this.clientName;
	}

	createDate()
	{
		this.date = Tag.render`
			<div class="crm-kanban-item-date" style="${this.getBlockStyleBasedOnFields()}"></div>
		`;

		return this.date;
	}

	getBlockStyleBasedOnFields()
	{
		return this.hasFields() ? 'display: none' : '';
	}

	hasFields()
	{
		return Type.isArrayFilled(this.data.fields);
	}

	createCheckedButton()
	{
		this.checkedButton = Tag.render`
			<div class="crm-kanban-item-checkbox" onclick="${this.onCheckedButtonClick.bind(this)}"></div>
		`;

		return this.checkedButton;
	}

	onCheckedButtonClick()
	{
		this.checked = !this.checked;

		const className = 'crm-kanban-item-checkbox-checked';
		if (this.checked)
		{
			Dom.addClass(this.checkedButton, className);
		}
		else
		{
			Dom.removeClass(this.checkedButton, className);
		}
	}

	createBadgesWrapper()
	{
		this.badgesWrapper = Tag.render`<div class="crm-kanban-item-badges"></div>`;

		return this.badgesWrapper;
	}

	// runs only once and is not subsequently redrawn
	// BX.Crm.Kanban.Item::onBeforeAsideCreate is sent only once when the item is created
	createAside()
	{
		const limitExceededIcon = (
			this.isActivityLimitIsExceeded()
				? Tag.render`<span class="crm-kanban-item-activity">${this.getActivityCounterHtml()}</span>`
				: null
		);

		const elements = [{
			id: 'limitExceededIcon',
			node: limitExceededIcon,
		}];

		if (this.isShowActivity())
		{
			this.activityExist = Tag.render`
				<span class="crm-kanban-item-activity" onclick="${this.showCurrentPlan.bind(this)}"></span>
			`;

			elements.push({
				id: 'activityExist',
				node: this.activityExist,
			});

			this.activityEmpty = Tag.render`
				<span class="crm-kanban-item-activity" onclick="${this.onActivityEmptyClick.bind(this)}"></span>
			`;

			elements.push({
				id: 'activityEmpty',
				node: this.activityEmpty,
			});
		}

		this.contactPhone = this.createContactItemNode('phone');
		elements.push({
			id: 'contactPhone',
			node: this.contactPhone,
		});

		this.contactEmail = this.createContactItemNode('email');
		elements.push({
			id: 'contactEmail',
			node: this.contactEmail,
		});

		this.contactIm = this.createContactItemNode('im');
		elements.push({
			id: 'contactIm',
			node: this.contactIm,
		});

		const data = {
			elements,
			item: this,
		};

		BX.Event.EventEmitter.emit('BX.Crm.Kanban.Item::onBeforeAsideCreate', data);

		const aside = Tag.render`<div class="crm-kanban-item-aside"></div>`;

		data.elements.forEach((element) => {
			Dom.append(element.node, aside);
		});

		return aside;
	}

	createContactItemNode(type)
	{
		return Tag.render`
			<span
				class="crm-kanban-item-contact-${type} crm-kanban-item-contact-${type}-disabled"
				data-type="${type}"
			></span>
		`;
	}

	onActivityEmptyClick(event)
	{
		const activityMessage = this.getActivityMessage(this.getGridData().entityType);
		this.showTooltip(activityMessage, event.target, true);
	}

	createFooterWrapper()
	{
		this.footerWrapper = Tag.render`<div class="crm-kanban-item-footer"></div>`;

		return this.footerWrapper;
	}

	createPlanner()
	{
		if (!this.isShowActivity())
		{
			return null;
		}

		this.activityPlan = Tag.render`
			<span class="crm-kanban-item-plan" onclick="${this.showPlannerMenu.bind(this)}">
				+ ${Loc.getMessage('CRM_KANBAN_ACTIVITY_TO_PLAN2')}
			</span>
		`;

		this.planner = Tag.render`<div class="crm-kanban-item-planner">${this.activityPlan}</div>`;

		return this.planner;
	}

	isShowActivity()
	{
		return this.getGridData().showActivity;
	}

	createLastActivityBlock()
	{
		this.lastActivityTime = Tag.render`<div class="crm-kanban-item-last-activity-time"></div>`;
		this.lastActivityBy = Tag.render`<div class="crm-kanban-item-last-activity-by"></div>`;

		this.lastActivityBlock = Tag.render`
			<div class="crm-kanban-item-last-activity">${this.lastActivityTime}${this.lastActivityBy}</div>
		`;

		return this.lastActivityBlock;
	}

	/**
	 * @returns {Boolean}
	 */
	isChecked()
	{
		return this.checked;
	}

	isHiddenPrice()
	{
		return this.getColumn()?.isHiddenTotalSum();
	}

	/**
	 * Get message for activity popup.
	 * @param {String} type of entity.
	 * @returns {String}
	 */
	getActivityMessage(type)
	{
		const content = BX.create('span');
		const typeTranslateCode = /DYNAMIC_(\d+)/.test(type) ? 'DYNAMIC' : type;
		content.innerHTML = Loc.getMessage(`CRM_KANBAN_ACTIVITY_CHANGE_${typeTranslateCode}_MSGVER_1`)
			|| Loc.getMessage(`CRM_KANBAN_ACTIVITY_CHANGE_${typeTranslateCode}_MSGVER_2`);

		const eventLink = content.querySelector('.crm-kanban-item-activity-link');
		BX.bind(eventLink, 'click', () => {
			this.showPlannerMenu(this.activityPlan);
			this.popupTooltip.destroy();
		});

		return content;
	}

	/**
	 * Get preloader for popup.
	 * @returns {String}
	 */
	getPreloader()
	{
		// eslint-disable-next-line no-multi-str
		return '\
			<div class="crm-kanban-preloader-wrapper">\n\
				<div class="crm-kanban-preloader">\n\
					<svg class="crm-kanban-circular" viewBox="25 25 50 50">\n\
						<circle class="crm-kanban-path" cx="50" cy="50" r="20" fill="none" stroke-width="1" stroke-miterlimit="10"/>\n\
					</svg>\n\
				</div>\n\
			</div>\
		';
	}

	loadCurrentPlan()
	{
		this.getGrid().ajax(
			{
				action: 'activities',
				entity_id: this.getId(),
			},
			(data) => {
				this.plannerCurrent.setContent(data);
				this.plannerCurrent.adjustPosition();
			},
			(error) => {
				BX.Kanban.Utils.showErrorDialog(`Error: ${error}`, true);
			},
			'html',
		);
	}

	showCurrentPlan(event)
	{
		this.plannerCurrent = PopupManager.create(
			'kanban_planner_current',
			event.target,
			{
				closeIcon: false,
				autoHide: true,
				className: 'crm-kanban-popup-plan',
				closeByEsc: true,
				contentColor: 'white',
				angle: true,
				offsetLeft: 15,
				overlay: {
					backgroundColor: 'transparent',
					opacity: '0',
				},
				events: {
					onAfterPopupShow: this.loadCurrentPlan.bind(this),
					onPopupClose: () => {
						this.plannerCurrent.destroy();
						Dom.removeClass(this.container, 'crm-kanban-item-hover');
						Event.unbind(window, 'scroll', this.adjustPopup);
					},
				},
			},
		);
		this.plannerCurrent.setContent(this.getPreloader());
		this.plannerCurrent.show();

		Event.bind(window, 'scroll', this.adjustPopup.bind(this));
	}

	clickContact(type, bindElement)
	{
		const contactInfo = this.getContactInfo(type);

		let totalContactsCount = 0;
		if (Type.isObject(contactInfo))
		{
			if (Type.isArray(contactInfo))
			{
				totalContactsCount = contactInfo.length;
			}
			else
			{
				totalContactsCount = Object
					.values(contactInfo)
					.reduce(
						(count, item) => {
							return count + (Type.isArray(item) ? item.length : 0);
						},
						0,
					)
				;
			}
		}

		if (totalContactsCount > 1)
		{
			this.showManyContacts(contactInfo, type, bindElement);
		}
		else
		{
			this.showSingleContact(contactInfo, type);
		}
	}

	clickContactItem(item)
	{
		const data = this.getData();

		// eslint-disable-next-line no-undef
		if (item.type === 'phone' && !Type.isUndefined(BXIM))
		{
			// eslint-disable-next-line no-undef
			BXIM.phoneTo(item.value, {
				ENTITY_TYPE: (item.clientType === undefined ? this.getContactType() : item.clientType),
				ENTITY_ID: (item.clientId === undefined ? this.getContactId() : item.clientId),
			});
		}
		// eslint-disable-next-line no-undef
		else if (item.type === 'im' && !Type.isUndefined(BXIM))
		{
			// eslint-disable-next-line no-undef
			BXIM.openMessengerSlider(item.value, { RECENT: 'N', MENU: 'N' });
		}
		else if (item.type === 'email')
		{
			const hasActivityEditor = BX.CrmActivityEditor && BX.CrmActivityEditor.items.kanban_activity_editor;
			const hasSlider = top.BX.SidePanel && top.BX.SidePanel.Instance;
			if (hasActivityEditor && BX.CrmActivityProvider && hasSlider)
			{
				const gridData = this.getGridData();

				// @TODO: fix communication entity
				BX.CrmActivityEditor.items.kanban_activity_editor.addEmail({
					ownerType: gridData.entityType,
					ownerID: data.id,
					communications: [{
						type: 'EMAIL',
						value: item.value,
						entityId: data.id,
						entityType: gridData.entityType,
						entityTitle: data.name,
					}],
					communicationsLoaded: true,
				});
			}
			else
			{
				// @tmp
				top.location.href = `mailto:${item.value}`;
			}
		}
	}

	showManyContacts(contactCategories, type, bindElement)
	{
		const menuItems = [];

		// converting the entity's own contact data into an object for correct use
		if (Array.isArray(contactCategories))
		{
			// eslint-disable-next-line no-param-reassign
			contactCategories = { 0: contactCategories };
		}

		Object.keys(contactCategories).forEach((category) => {
			if (category === 'company' || category === 'contact')
			{
				menuItems.push({
					delimiter: true,
					text: this.getMessage(category),
				});
			}

			const fields = contactCategories[category];
			fields.forEach((field) => {
				let clientType = '';
				let clientId = '';

				if (category === 'company')
				{
					clientType = 'CRM_COMPANY';
					clientId = this.getCompanyId();
				}
				else if (category === 'contact')
				{
					clientType = 'CRM_CONTACT';
					clientId = this.getContactId();
				}

				menuItems.push({
					value: field.value,
					type,
					clientType,
					clientId,
					text: `${field.value} (${field.title})`,
					onclick: this.clickContactItem.bind(this, {
						value: field.value,
						type,
					}),
				});
			});
		});

		const menu = new Menu(
			`kanban_contact_menu_${type}${this.getId()}`,
			bindElement,
			menuItems,
			{
				autoHide: true,
				zIndex: 1200,
				offsetLeft: 20,
				angle: true,
				closeByEsc: true,
				events: {
					onPopupClose: () => {
						Dom.removeClass(this.container, 'crm-kanban-item-hover');
						BX.unbind(window, 'scroll', BX.proxy(this.adjustPopup, this));
					},
				},
			},
		);

		menu.show();

		BX.bind(window, 'scroll', BX.proxy(this.adjustPopup, this));
	}

	showSingleContact(contactInfo, type)
	{
		let fields = this.getSingleContactCategory(contactInfo);

		if (!Array.isArray(fields))
		{
			fields = [fields];
		}

		this.clickContactItem({
			value: (Type.isUndefined(fields[0].value)) ? fields[0] : fields[0].value,
			type,
		});
	}

	getSingleContactCategory(contactInfo)
	{
		return (Type.isObjectLike(contactInfo) ? contactInfo[Object.keys(contactInfo)[0]] : contactInfo);
	}

	/**
	 * @param {string} title
	 * @returns {string}
	 */
	getMessage(title)
	{
		return (Item.messages[title] || '');
	}

	/**
	 * Click one the item of plan menu
	 * @param {Integer} i
	 * @param {Object} item
	 * @returns {void}
	 */
	selectPlannerMenu(i, item)
	{
		BX.onCustomEvent('Crm.Kanban:selectPlannerMenu');
		const gridData = this.getGridData();

		switch (item.type)
		{
			case 'meeting':
			case 'call': {
				(new BX.Crm.Activity.Planner()).showEdit({
					TYPE_ID: BX.CrmActivityType[item.type],
					OWNER_TYPE: gridData.entityType,
					OWNER_ID: this.getId(),
				});

				break;
			}

			case 'task': {
				const taskData = {
					UF_CRM_TASK: [`${BX.CrmOwnerTypeAbbr.resolve(gridData.entityType)}_${this.getId()}`],
					TITLE: 'CRM: ',
					TAGS: 'crm',
				};

				let taskCreatePath = Loc.getMessage('CRM_TASK_CREATION_PATH');
				taskCreatePath = taskCreatePath.replace('#user_id#', Loc.getMessage('USER_ID'));
				taskCreatePath = BX.util.add_url_param(
					taskCreatePath,
					taskData,
				);

				if (SidePanel)
				{
					SidePanel.Instance.open(taskCreatePath);
				}
				else
				{
					window.top.location.href = taskCreatePath;
				}

				break;
			}

			case 'visit': {
				const visitParams = gridData.visitParams;
				visitParams.OWNER_TYPE = gridData.entityType;
				visitParams.OWNER_ID = this.getId();
				BX.CrmActivityVisit.create(visitParams).showEdit();

				break;
			}

			default: // Do nothing
		}

		const menu = MenuManager.getCurrentMenu();
		if (menu)
		{
			menu.close();
		}
	}

	/**
	 * Get menu for planner.
	 * @returns {Object}
	 */
	getPlannerMenu()
	{
		const gridData = this.getGrid().getData();

		return [
			{
				type: 'call',
				text: Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_CALL'),
				onclick: this.selectPlannerMenu.bind(this),
			},
			{
				type: 'meeting',
				text: Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_MEETING'),
				onclick: this.selectPlannerMenu.bind(this),
			},
			gridData.rights.canUseVisit ? (
				BX.getClass('BX.Crm.Restriction.Bitrix24') && BX.Crm.Restriction.Bitrix24.isRestricted('visit')
					? {
						type: 'visit',
						text: Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_VISIT'),
						className: 'crm-tariff-lock-behind',
						onclick: BX.Crm.Restriction.Bitrix24.getHandler('visit'),
					} : {
						type: 'visit',
						text: Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_VISIT'),
						onclick: this.selectPlannerMenu.bind(this),
					}
			) : null,
			{
				type: 'task',
				text: Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_TASK'),
				onclick: this.selectPlannerMenu.bind(this),
			},
		];
	}

	showPlannerMenu(node, mode = BX.Crm.Activity.TodoEditorMode.ADD, disableItem = false)
	{
		if (Restriction.Instance.isTodoActivityCreateAvailable())
		{
			this.prepareAndShowActivityAddingPopup(node, mode, disableItem);
		}
		else if (mode === BX.Crm.Activity.TodoEditorMode.ADD)
		{
			this.prepareAndShowPlannerPopup(node);
		}
	}

	prepareAndShowActivityAddingPopup(node, mode, disableItem)
	{
		const id = this.getId();

		if (disableItem)
		{
			this.disabledItem();
		}

		const data = this.getData();
		const gridData = this.getGridData();

		const pingSettings = data.pingSettings || gridData.itemsConfig?.pingSettings;
		const colorSettings = data.colorSettings || gridData.itemsConfig?.colorSettings;
		const calendarSettings = data.calendarSettings || gridData.itemsConfig?.calendarSettings;

		const settings = {
			pingSettings,
			colorSettings,
			calendarSettings,
		};

		const params = {
			context: this.getToDoEditorContext(),
			events: {
				onSave: () => {
					void this.animate({
						duration: this.grid.animationDuration,
						draw: (progress) => {
							Dom.style(this.layout.container, 'opacity', `${100 - progress * 50}%`);
						},
						useAnimation: (Dom.style(this.layout.container, 'opacity') === '1'),
					}).then(() => {
						void this.animate({
							duration: this.grid.animationDuration,
							draw: (progress) => {
								Dom.style(this.layout.container, 'opacity', `${progress * 100}%`);
							},
							useAnimation: true,
						});
					});
				},
			},
		};

		if (!this.activityAddingPopup)
		{
			this.activityAddingPopup = new AddingPopup(
				this.getGridData().entityTypeInt,
				id,
				this.getCurrentUser(),
				settings,
				params,
			);
		}

		this.activityAddingPopup.show(mode);
		if (disableItem)
		{
			this.unDisabledItem();
		}
	}

	getToDoEditorContext()
	{
		return {
			analytics: this.grid.getData().analytics,
		};
	}

	prepareAndShowPlannerPopup(node)
	{
		const id = this.getId();
		const popupId = `kanban_planner_menu_${id}`;
		const bindElement = node.isNode ? node : this.activityPlan;

		const popupMenu = new Menu(
			popupId,
			bindElement,
			this.getPlannerMenu(),
			{
				className: 'crm-kanban-planner-popup-window',
				autoHide: true,
				offsetLeft: 50,
				angle: true,
				overlay: {
					backgroundColor: 'transparent',
					opacity: '0',
				},
				events: {
					onPopupClose: () => {
						Dom.removeClass(this.container, 'crm-kanban-item-hover');
						Event.unbind(window, 'scroll', this.adjustPopup);
						popupMenu.destroy();
					},
				},
			},
		);

		BX.addCustomEvent(window, 'Crm.Kanban:selectPlannerMenu', () => {
			popupMenu.destroy();
		});

		popupMenu.show();
		Event.bind(window, 'scroll', this.adjustPopup.bind(this));
	}

	switchPlanner()
	{
		const data = this.getData();
		const column = this.getColumn();
		const columnData = column.getData();

		if (this.getActivityProgress() > 0)
		{
			this.switchVisible(this.activityExist, true);
			this.switchVisible(this.activityEmpty, false);
			this.setActivityExistInnerHtml();
		}
		else
		{
			const gridData = this.getGrid().getData();
			this.switchVisible(this.activityExist, false);
			this.switchVisible(this.activityPlan, true);
			this.switchVisible(this.activityEmpty, true);

			let activityEmptyHtml = '';
			if (gridData.reckonActivitylessItems && gridData.userId === parseInt(data.assignedBy, 10))
			{
				activityEmptyHtml = (columnData.type === 'PROGRESS' ? this.getActivityCounterHtml(1, BX.UI.CounterStyle.FILLED_ALERT) : '');
			}
			else
			{
				activityEmptyHtml = this.getActivityCounterHtml();
			}

			this.activityEmpty.innerHTML = activityEmptyHtml;
		}
	}

	/**
	 * Description what the counter fields mean you can see
	 * at crm/lib/kanban/entityactivitycounter.php::appendToEntityItems
	 */
	setActivityExistInnerHtml()
	{
		if (Type.isUndefined(this.activityExist))
		{
			return;
		}

		Dom.removeClass(this.activityExist, ...this.activityExist.classList);
		Dom.addClass(this.activityExist, 'crm-kanban-item-activity');

		const gridData = this.getGrid().getData();
		const errorCounterByActivityResponsible = gridData.showErrorCounterByActivityResponsible || false;
		const userId = gridData.userId;

		const html = errorCounterByActivityResponsible
			? this.makeCounterHtmlByActivityResponsible(userId)
			: this.makeCounterHtmlByEntityResponsible(userId)
		;

		if (Type.isStringFilled(html))
		{
			this.activityExist.innerHTML = html;
		}
	}

	makeCounterHtmlByActivityResponsible(userId)
	{
		const userActStat = this.getActivitiesByUser()[userId] || {};

		const userActivityError = userActStat.activityError || 0;
		const userActivityIncoming = userActStat.incoming || 0;
		const userActivityProgress = userActStat.activityProgress || 0;
		const userActivityCounterTotal = userActStat.activityCounterTotal || 0;

		let html = '';
		if (userActivityIncoming > 0 && userActivityError > 0)
		{
			html = this.getActivityCounterHtml(
				userActivityCounterTotal,
				BX.UI.CounterStyle.FILLED_ALERT,
				true
			);
		}
		else if (userActivityError > 0)
		{
			html = this.getActivityCounterHtml(
				userActivityError,
				BX.UI.CounterStyle.FILLED_ALERT
			);
		}
		else if (userActivityIncoming > 0)
		{
			html = this.getActivityCounterHtml(
				userActivityIncoming,
				BX.UI.CounterStyle.FILLED_SUCCESS,
			);
		}
		else if (userActivityProgress > 0)
		{
			html = this.getActivityCounterHtml(0);
			html += '<span class="crm-kanban-item-activity-indicator"></span>';
		}
		else
		{
			if (this.getActivityCounterTotal() > 0)
			{
				html = this.getActivityCounterHtml(this.getActivityCounterTotal());
			}
			else
			{
				html = this.getActivityCounterHtml(0);
				html += '<span class="crm-kanban-item-activity-indicator crm-kanban-item-activity-indicator--grey"></span>';
			}
		}

		return html;
	}

	makeCounterHtmlByEntityResponsible(userId)
	{
		const isCurrentUserResponsibleToElement = userId === BX.prop.getNumber(this.data, 'assignedBy', 0);

		const activityProgress = this.getActivityProgress();
		const activityError = this.getActivityError();
		const activityIncomingTotal = this.getActivityIncomingTotal();
		const activityCounterTotal = this.getActivityCounterTotal();

		let html = '';
		if (isCurrentUserResponsibleToElement)
		{
			if (activityIncomingTotal > 0 && activityError > 0)
			{
				html = this.getActivityCounterHtml(
					activityCounterTotal,
					BX.UI.CounterStyle.FILLED_ALERT,
					true
				);
			}
			else if (activityError > 0)
			{
				html = this.getActivityCounterHtml(
					activityError,
					BX.UI.CounterStyle.FILLED_ALERT
				);
			}
			else if (activityIncomingTotal > 0)
			{
				html = this.getActivityCounterHtml(
					activityIncomingTotal,
					BX.UI.CounterStyle.FILLED_SUCCESS,
				);
			}
			else if (activityProgress > 0)
			{
				html = this.getActivityCounterHtml(0);
				html += '<span class="crm-kanban-item-activity-indicator"></span>';
			}
			else
			{
				html = this.getActivityCounterHtml(0);
			}

			return html;
		}

		if (activityCounterTotal > 0)
		{
			html = this.getActivityCounterHtml(this.getActivityCounterTotal());
		}
		else if (activityProgress > 0)
		{
			html = this.getActivityCounterHtml(0);
			html += '<span class="crm-kanban-item-activity-indicator crm-kanban-item-activity-indicator--grey"></span>';
		}
		else
		{
			html = this.getActivityCounterHtml(0);
		}

		return html;
	}

	getActivityCounterHtml(value = 0, style = BX.UI.CounterStyle.FILLED_NO_ACCENT, isDouble = false)
	{
		if (this.isActivityLimitIsExceeded())
		{
			const label = (new Label({
				value: `?`,
				style: LabelStyle.FILLED_NO_ACCENT,
			})).render();
			label.setAttribute('title', Loc.getMessage('CRM_KANBAN_ITEM_COUNTER_LIMIT_IS_EXCEEDED'));

			return label.outerHTML;
		}

		if (value === 0)
		{
			style = BX.UI.CounterStyle.FILLED_NO_ACCENT;
		}

		return (new BX.UI.Counter({
			value: value,
			maxValue: 99,
			useAirDesign: true,
			style,
			isDouble,
		}).render()).outerHTML;
	}

	isActivityLimitIsExceeded()
	{
		return this.getGridData().isActivityLimitIsExceeded;
	}

	showTooltip(content, target, white)
	{
		this.hideTooltip();

		const blackOverlay = {
			background: 'black',
			opacity: 0,
		};
		const overlay = white ? blackOverlay : null;
		const className = `crm-kanban-without-tooltip ${white ? 'crm-kanban-without-tooltip-white' : 'crm-kanban-tooltip-animate'}`;

		this.popupTooltip = new Popup(
			`kanban_tooltip_${this.id}`,
			target,
			{
				className,
				content,
				overlay,
				focusTrap: false,
				offsetLeft: 14,
				darkMode: !white,
				closeByEsc: true,
				angle: true,
				autoHide: true,
				events: {
					onPopupClose: () => {
						Event.unbind(window, 'scroll', this.adjustPopup.bind(this));
					},
				},
			},
		);

		this.popupTooltip.show();

		Event.bind(window, 'scroll', this.adjustPopup.bind(this));
	}

	hideTooltip()
	{
		this.popupTooltip?.destroy();
	}

	createShadow()
	{
		return Tag.render`<div class="crm-kanban-item-shadow"></div>`;
	}

	removeHoverClass(itemBlock)
	{
		Dom.removeClass(itemBlock, 'crm-kanban-item-event');
		Dom.removeClass(itemBlock, 'crm-kanban-item-hover');
	}

	adjustPopup()
	{
		const popup = PopupManager.getCurrentPopup();

		if (popup && popup.isShown())
		{
			popup.adjustPosition();
		}
	}

	onDragDrop(itemNode)
	{
		this.dropChangedInPullRequest();
		this.dropColumnChangedInPullRequest();
		this.hideDragTarget();

		const draggableItem = this.getGrid().getItemByElement(itemNode);
		draggableItem.dropChangedInPullRequest();
		draggableItem.dropColumnChangedInPullRequest();

		const event = new BX.Kanban.DragEvent();
		event.setItem(draggableItem);
		event.setTargetColumn(this.getColumn());
		event.setTargetItem(this);

		BX.onCustomEvent(this.getGrid(), 'Kanban.Grid:onBeforeItemMoved', [event]);
		if (!event.isActionAllowed())
		{
			return;
		}

		void this.getGrid()
			.moveItem(draggableItem, this.getColumn(), this, true)
			.then((result) => {
				if (draggableItem.getColumn().getId() === this.getColumn().getId())
				{
					this.getGrid().resetMultiSelectMode();
					this.getGrid().cleanSelectedItems();
				}
			})
		;
	}

	onDragStart()
	{
		// this.grid.resetMultiSelectMode();

		if (this.dragElement)
		{
			return;
		}

		const openColumn = this.getGrid().getColumnWithOpenEditor();
		if (openColumn && openColumn.editor && openColumn.editor.hasChangedControls())
		{
			openColumn.closeQuickFormEditor();

			return;
		}

		if (!this.checked || this.grid.getChecked().length === 1)
		{
			this.grid.resetMultiSelectMode();
		}

		if (this.grid.getChecked().length > 1)
		{
			const moveItems = this.grid.getChecked().reverse();

			this.dragElement = BX.create('div', {
				props: {
					className: 'main-kanban-item-drag-multi',
				},
			});

			for (let i = 0; i < moveItems.length; i++)
			{
				BX.onCustomEvent(this.getGrid(), 'Kanban.Grid:onItemDragStart', [moveItems[i]]);

				const itemNode = moveItems[i].getContainer().cloneNode(true);
				Dom.style(itemNode, 'width', `${moveItems[i].getContainer().offsetWidth}px`);
				this.getContainer().maxHeight = `${moveItems[0].getContainer().offsetHeight}px`;
				Dom.append(itemNode, this.dragElement);
			}

			for (const moveItem of moveItems)
			{
				Dom.addClass(moveItem.getContainer(), 'main-kanban-item-disabled');
			}

			Dom.append(this.dragElement, document.body);

			return;
		}

		BX.onCustomEvent(this.getGrid(), 'Kanban.Grid:onItemDragStart', [this]);

		const container = this.getContainer();
		Dom.addClass(container, 'main-kanban-item-disabled');

		this.dragElement = container.cloneNode(true);

		Dom.style(this.dragElement, {
			position: 'absolute',
			width: `${this.getBodyContainer().offsetWidth}px`,
		});
		Dom.addClass(this.dragElement, 'main-kanban-item main-kanban-item-drag');

		Dom.append(this.dragElement, document.body);
	}

	makeDroppable()
	{
		if (!this.isDroppable())
		{
			return;
		}

		const itemContainer = this.getContainer();

		itemContainer.onbxdestdraghover = this.onDragEnter.bind(this);
		itemContainer.onbxdestdraghout = this.onDragLeave.bind(this);
		itemContainer.onbxdestdragfinish = this.onDragDrop.bind(this);
		itemContainer.onbxdestdragstop = this.onItemDragEnd.bind(this);

		jsDD.registerDest(itemContainer, 5);

		if (this.getGrid().getDragMode() !== BX.Kanban.DragMode.ITEM)
		{
			// when we load new items in drag mode
			this.disableDropping();
		}
	}

	getContactInfo(type)
	{
		const data = this.getData();

		return data[type];
	}

	getStageId()
	{
		return this.getData().stageId;
	}

	animate(params)
	{
		const duration = params.duration;
		const draw = params.draw;

		// linear function by default, you can set non-linear animation function in timing key
		const timing = (params.timing || function(timeFraction) {
			return timeFraction;
		});

		const useAnimation = ((params.useAnimation && !this.isAnimationInProgress) || false);

		const start = performance.now();

		return new Promise(
			(resolve) => {
				if (!useAnimation)
				{
					this.isAnimationInProgress = false;

					resolve();

					return;
				}

				// eslint-disable-next-line unicorn/no-this-assignment
				const item = this;
				item.isAnimationInProgress = true;

				requestAnimationFrame(function animate(time)
				{
					let timeFraction = (time - start) / duration;
					if (timeFraction > 1)
					{
						timeFraction = 1;
					}

					const progress = timing(timeFraction);
					draw(progress);

					if (timeFraction < 1)
					{
						requestAnimationFrame(animate);
					}

					if (progress === 1)
					{
						item.isAnimationInProgress = false;
						resolve();
					}
				});
			},
		);
	}

	setChangedInPullRequest()
	{
		this.changedInPullRequest = true;
	}

	dropChangedInPullRequest()
	{
		this.changedInPullRequest = false;
	}

	isChangedInPullRequest()
	{
		return (this.changedInPullRequest === true);
	}

	setColumnChangedInPullRequest()
	{
		this.columnChangedInPullRequest = true;
	}

	dropColumnChangedInPullRequest()
	{
		this.columnChangedInPullRequest = false;
	}

	isColumnChangedInPullRequest()
	{
		return (this.columnChangedInPullRequest === true);
	}

	/**
	 * @returns {boolean}
	 */
	isItemMoveDisabled()
	{
		const grid = this.getGrid();

		if (!grid.options.canChangeItemStage)
		{
			return true;
		}

		if (
			grid.getData().viewMode === ViewMode.MODE_ACTIVITIES
			&& this.getActivityIncomingTotal() > 0
		)
		{
			return true;
		}

		const itemColumnData = this.getColumn().getData();

		return (grid.getTypeInfoParam('disableMoveToWin') && itemColumnData.type === 'WIN');
	}

	/**
	 * @returns {boolean}
	 */
	isCountable()
	{
		return (this.countable ?? true);
	}

	/**
	 * @returns {boolean}
	 */
	isDraggable()
	{
		return ((this.draggable ?? true) && this.getGrid().canSortItems());
	}

	/**
	 * @returns {boolean}
	 */
	isDroppable()
	{
		return (this.droppable ?? true);
	}

	/**
	 * @returns {{PHONE: (boolean), EMAIL: (boolean), IM: (boolean), WEB: (boolean)}}
	 */
	getRequiredFm()
	{
		return {
			PHONE: this.isRequiredFmField('PHONE'),
			EMAIL: this.isRequiredFmField('EMAIL'),
			IM: this.isRequiredFmField('IM'),
			WEB: this.isRequiredFmField('WEB'),
		};
	}

	/**
	 * @param {string} fieldName
	 * @returns {boolean}
	 */
	isRequiredFmField(fieldName)
	{
		const data = this.getData();

		if (fieldName === 'PHONE')
		{
			return data.required_fm?.PHONE ?? true;
		}

		if (fieldName === 'EMAIL')
		{
			return data.required_fm?.EMAIL ?? true;
		}

		if (fieldName === 'IM')
		{
			return data.required_fm?.IM ?? true;
		}

		if (fieldName === 'WEB')
		{
			return data.required_fm?.WEB ?? true;
		}

		return false;
	}

	isValidFmFieldName(fieldName)
	{
		const fieldNames = ['PHONE', 'EMAIL', 'IM', 'WEB'];

		return fieldNames.includes(fieldName);
	}

	getCurrentUser()
	{
		const userId = this.getGrid().getData().userId;
		const currentUser = this.getGridData().currentUser;
		if (Type.isObject(currentUser) && userId > 0)
		{
			currentUser.userId = userId;
		}

		return currentUser;
	}

	/**
	 * @returns {number}
	 */
	getActivityIncomingTotal()
	{
		return this.getData().activityIncomingTotal ?? 0;
	}

	/**
	 * @returns {number}
	 */
	getActivityCounterTotal()
	{
		return this.getData().activityCounterTotal ?? 0;
	}

	/**
	 * @returns {number}
	 */
	getActivityErrorTotal()
	{
		return this.getData().activityErrorTotal ?? 0;
	}

	/**
	 * @returns {number}
	 */
	getActivityProgress()
	{
		return this.getData().activityProgress ?? 0;
	}

	/**
	 * @returns {number}
	 */
	getActivityError()
	{
		return this.getData().activityError ?? 0;
	}

	/**
	 * @returns {Object}
	 */
	getActivitiesByUser()
	{
		return this.getData().activitiesByUser ?? {};
	}

	/**
	 * @returns {Object[]}
	 */
	getBadges()
	{
		return this.getData().badges ?? [];
	}

	/**
	 * @returns {string}
	 */
	getContactId()
	{
		return this.getData().contactId ?? '';
	}

	/**
	 * @returns {string}
	 */
	getCompanyId()
	{
		return this.getData().companyId ?? '';
	}

	/**
	 * @returns {string}
	 */
	getContactType()
	{
		return this.getData().contactType ?? '';
	}

	/**
	 * @returns {BX.CRM.Kanban.Grid}
	 */
	getGrid()
	{
		return super.getGrid();
	}

	/**
	 * @returns {Object}
	 * @property {Object[]} activitiesByUser
	 * @property {number} activityCounterTotal
	 * @property {number} activityError
	 * @property {number} activityIncomingTotal
	 * @property {number} activityProgress
	 * @property {number} activityErrorTotal
	 * @property {string} activityStageId
	 * @property {string} assignedBy
	 * @property {Object[]} badges
	 * @property {Object} calendarSettings
	 * @property {Object} colorSettings
	 * @property {string} columnId
	 * @property {string} companyId
	 * @property {string} contactId
	 * @property {string} contactType
	 * @property {string} currency
	 * @property {string} date
	 * @property {string} dateCreate
	 * @property {boolean} draggable
	 * @property {string} entity_currency
	 * @property {string} entity_price
	 * @property {Object[]} fields
	 * @property {string} id
	 * @property {boolean} isAutomationDebugItem
	 * @property {Object} lastActivity
	 * @property {string} link
	 * @property {string} modifyById
	 * @property {string} name
	 * @property {number} page
	 * @property {string} pingSettings
	 * @property {number} price
	 * @property {string} price_formatted
	 * @property {Object[]} required
	 * @property {Object[]} required_fm
	 * @property {boolean} return
	 * @property {boolean} returnApproach
	 * @property {Object} sort
	 * @property {string | null} special_type
	 * @property {string | null} contactTooltip
	 * @property {string | null} companyTooltip
	 */
	getData()
	{
		return super.getData();
	}
}

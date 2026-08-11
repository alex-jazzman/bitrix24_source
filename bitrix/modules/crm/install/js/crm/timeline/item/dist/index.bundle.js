/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_timeline_tools, main_core, ui_vue3, main_loader, ui_iconSet_api_vue, main_date, rest_client, ui_analytics, ui_notification, ui_infoHelper, ui_system_menu, ui_buttons, ui_vue3_directives_hint, main_popup, ui_iconSet_api_core, ui_vue3_components_button, crm_field_colorSelector, main_core_events, ui_designTokens, ui_system_label, ui_cnt, crm_router, ui_dialogs_messagebox, ui_entitySelector, crm_common, ui_imageStackSteps, ui_iconSet_main, main_sidepanel, calendar_sharing_interface, calendar_util, crm_ai_call, ui_feedback_form, crm_ai_nameService, ui_system_chip_vue, location_core, location_widget, ui_system_typography_vue, crm_timeline_editors_commentEditor, ui_bbcode_formatter_htmlFormatter, ui_textEditor, ui_lottie, main_lazyload, ui_progressround, ui_avatar, crm_activity_fileUploaderPopup, ui_icons_generator, crm_audioPlayer, ui_iconSet_actions, ui_designTokens_air, crm_field_itemSelector, currency_currencyCore, ui_alerts, crm_field_pingSelector, bizproc_types, ui_hint, crm_entityEditor, pull_client, crm_entityEditor_field_paymentDocuments, ui_sidepanel, crm_integration_analytics) {
	'use strict';

	const StreamType = {
		history: 0,
		scheduled: 1,
		pinned: 2
	};

	class SystemMenu {
		#menu = null;
		#vueComponent;
		#onAction;
		constructor(vueComponent, menu, menuOptions, onAction) {
			this.#vueComponent = vueComponent;
			this.#onAction = onAction;
			const {
				items: mappedItems,
				sections: mappedSections
			} = this.#normalizeMenu(menu.items ?? [], menu.sections ?? []);
			this.#menu = new ui_system_menu.Menu({
				...menuOptions,
				items: mappedItems,
				sections: mappedSections,
				animation: menuOptions?.animation ?? 'fading-slide',
				autoHide: menuOptions?.autoHide ?? true,
				cacheable: menuOptions?.cacheable ?? false
			});
		}
		show() {
			this.#menu?.show();
		}
		isShown() {
			return this.#menu?.getPopup()?.isShown() ?? false;
		}
		destroy() {
			this.#menu?.destroy();
			this.#menu = null;
		}
		static showMenu(vueComponent, menu, menuOptions, onAction) {
			const instance = new SystemMenu(vueComponent, menu, menuOptions, onAction);
			instance.show();
			return instance;
		}
		#normalizeMenu(items, sections) {
			if (main_core.Type.isArrayFilled(sections)) {
				return {
					items: items.filter(item => !item.delimiter).map(item => this.#createMenuItem(item)),
					sections: sections
				};
			}
			return this.#normalizeWithDelimiters(items);
		}
		#createMenuItem(item) {
			const menuItem = {
				title: item.title ?? ''
			};
			if (main_core.Type.isStringFilled(item.subtitle)) {
				menuItem.subtitle = item.subtitle;
			}
			if (main_core.Type.isStringFilled(item.icon)) {
				menuItem.icon = item.icon;
			}
			if (main_core.Type.isStringFilled(item.design)) {
				menuItem.design = item.design;
			}
			if (main_core.Type.isBoolean(item.isSelected)) {
				menuItem.isSelected = item.isSelected;
			}
			if (main_core.Type.isBoolean(item.isLocked)) {
				menuItem.isLocked = item.isLocked;
			}
			if (main_core.Type.isObject(item.badgeText)) {
				menuItem.badgeText = item.badgeText;
			}
			if (main_core.Type.isStringFilled(item.sectionCode)) {
				menuItem.sectionCode = item.sectionCode;
			}
			if (main_core.Type.isObject(item.action) && main_core.Type.isFunction(this.#onAction)) {
				menuItem.onClick = () => {
					this.#menu?.close();
					this.#onAction(item.action);
				};
			}
			if (main_core.Type.isObject(item.menu)) {
				const {
					items: subItems,
					sections: subSections
				} = this.#normalizeMenu(Object.values(item.menu.items ?? {}), item.menu.sections ?? []);
				menuItem.subMenu = {
					items: subItems
				};
				if (main_core.Type.isArrayFilled(subSections)) {
					menuItem.subMenu.sections = subSections;
				}
			}
			return menuItem;
		}
		#normalizeWithDelimiters(items) {
			const groups = [[]];
			const sectionTitles = [null];
			for (const item of items) {
				if (item.delimiter) {
					groups.push([]);
					sectionTitles.push(item.title || null);
					continue;
				}
				groups[groups.length - 1].push(item);
			}
			if (groups.length === 1) {
				return {
					items: groups[0].map(item => this.#createMenuItem(item)),
					sections: []
				};
			}
			const sections = [];
			const mappedItems = [];
			groups.forEach((group, index) => {
				if (group.length === 0) {
					return;
				}
				const code = `generated-section-${index}`;
				const section = {
					code
				};
				if (sectionTitles[index]) {
					section.title = sectionTitles[index];
				}
				sections.push(section);
				for (const item of group) {
					const mapped = this.#createMenuItem(item);
					mapped.sectionCode = code;
					mappedItems.push(mapped);
				}
			});
			return {
				items: mappedItems,
				sections
			};
		}
	}

	const AnimationTarget = {
		block: 'block',
		item: 'item'
	};
	const AnimationType = {
		disable: 'disable',
		loader: 'loader'
	};
	const ActionType = {
		JS_EVENT: 'jsEvent',
		AJAX_ACTION: {
			STARTED: 'ajaxActionStarted',
			FINISHED: 'ajaxActionFinished',
			FAILED: 'ajaxActionFailed'
		},
		isJsEvent(type) {
			return type === this.JS_EVENT;
		},
		isAjaxAction(type) {
			return type === this.AJAX_ACTION.STARTED || type === this.AJAX_ACTION.FINISHED || type === this.AJAX_ACTION.FAILED;
		}
	};
	Object.freeze(ActionType.AJAX_ACTION);
	Object.freeze(ActionType);
	class Action {
		#type = null;
		#value = null;
		#actionParams = null;
		#animation = null;
		#analytics = null;
		constructor(params) {
			this.#type = params.type;
			this.#value = params.value;
			this.#actionParams = params.actionParams;
			this.#animation = main_core.Type.isPlainObject(params.animation) ? params.animation : null;
			this.#analytics = main_core.Type.isPlainObject(params.analytics) ? params.analytics : null;
		}
		execute(vueComponent) {
			return new Promise((resolve, reject) => {
				if (this.isJsEvent()) {
					vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
						action: this.#value,
						actionType: ActionType.JS_EVENT,
						actionData: this.#actionParams,
						animationCallbacks: {
							onStart: this.#startAnimation.bind(this, vueComponent),
							onStop: this.#stopAnimation.bind(this, vueComponent)
						}
					});
					this.#sendAnalytics();
					resolve(true);
				} else if (this.isJsCode()) {
					this.#startAnimation(vueComponent);

					// eslint-disable-next-line no-eval -- intentional: executes jsCode action type from server-side timeline layout
					eval(this.#value);
					this.#stopAnimation(vueComponent);
					this.#sendAnalytics();
					resolve(true);
				} else if (this.isAjaxAction() || this.isAjaxJsonAction()) {
					this.#startAnimation(vueComponent);
					vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
						action: this.#value,
						actionType: ActionType.AJAX_ACTION.STARTED,
						actionData: this.#actionParams
					});
					const ajaxConfig = {
						[this.isAjaxJsonAction() ? 'json' : 'data']: this.#prepareRunActionParams(this.#actionParams)
					};
					if (this.#analytics) {
						ajaxConfig.analytics = this.#analytics;
					}
					main_core.ajax.runAction(this.#value, ajaxConfig).then(response => {
						this.#stopAnimation(vueComponent);
						vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
							action: this.#value,
							actionType: ActionType.AJAX_ACTION.FINISHED,
							actionData: this.#actionParams,
							response
						});
						resolve(response);
					}, response => {
						this.#stopAnimation(vueComponent, true);
						ui_notification.UI.Notification.Center.notify({
							content: response.errors[0].message,
							autoHideDelay: 5000
						});
						vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
							action: this.#value,
							actionType: ActionType.AJAX_ACTION.FAILED,
							actionParams: this.#actionParams,
							response
						});
						resolve(response);
					});
				} else if (this.isCallRestBatch()) {
					this.#startAnimation(vueComponent);
					vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
						action: this.#value,
						actionType: 'ajaxActionStarted',
						actionData: this.#actionParams
					});
					rest_client.rest.callBatch(this.#prepareCallBatchParams(this.#actionParams), restResult => {
						for (const result in restResult) {
							const response = restResult[result].answer;
							if (response.error) {
								this.#stopAnimation(vueComponent);
								ui_notification.UI.Notification.Center.notify({
									content: response.error.error_description,
									autoHideDelay: 5000
								});
								vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
									action: this.#value,
									actionType: 'ajaxActionFailed',
									actionParams: this.#actionParams
								});
								reject(restResult);
								return;
							}
						}
						this.#stopAnimation(vueComponent);
						vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
							action: this.#value,
							actionType: 'ajaxActionFinished',
							actionData: this.#actionParams
						});
						resolve(restResult);
					}, true);
				} else if (this.isRedirect()) {
					this.#startAnimation(vueComponent);
					const linkAttrs = {
						href: this.#value
					};
					if (this.#actionParams && this.#actionParams.target) {
						linkAttrs.target = this.#actionParams.target;
					}
					// this magic allows auto opening internal links in slider if possible:
					const link = main_core.Dom.create('a', {
						attrs: linkAttrs,
						text: '',
						style: {
							display: 'none'
						}
					});
					main_core.Dom.append(link, document.body);
					link.click();
					setTimeout(() => main_core.Dom.remove(link), 10);
					this.#sendAnalytics();
					resolve(this.#value);
				} else if (this.isShowMenu()) {
					SystemMenu.showMenu(vueComponent, {
						items: this.#prepareMenuItems(this.#value.items ?? [], vueComponent),
						sections: this.#value.sections ?? []
					}, {
						bindElement: vueComponent.$el,
						minWidth: vueComponent.$el.offsetWidth,
						cacheable: false
					}, actionData => {
						const action = new Action(actionData);
						void action.execute(vueComponent);
					});
					this.#sendAnalytics();
					resolve(true);
				} else if (this.isShowInfoHelper()) {
					BX.UI.InfoHelper?.show(this.#value);
					this.#sendAnalytics();
					resolve(true);
				} else {
					reject(false);
				}
			});
		}
		isJsEvent() {
			return this.#type === 'jsEvent';
		}
		isJsCode() {
			return this.#type === 'jsCode';
		}
		isAjaxAction() {
			return this.#type === 'runAjaxAction';
		}
		isAjaxJsonAction() {
			return this.#type === 'runAjaxJsonAction';
		}
		isCallRestBatch() {
			return this.#type === 'callRestBatch';
		}
		isRedirect() {
			return this.#type === 'redirect';
		}
		isShowInfoHelper() {
			return this.#type === 'showInfoHelper';
		}
		isShowMenu() {
			return this.#type === 'showMenu';
		}
		getValue() {
			return this.#value;
		}
		getActionParam(param) {
			return this.#actionParams && this.#actionParams.hasOwnProperty(param) ? this.#actionParams[param] : null;
		}
		#prepareRunActionParams(params) {
			const result = {};
			if (main_core.Type.isUndefined(params)) {
				return result;
			}
			for (const paramName in params) {
				const paramValue = params[paramName];
				if (main_core.Type.isDate(paramValue)) {
					result[paramName] = main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat(), paramValue);
				} else if (main_core.Type.isPlainObject(paramValue)) {
					result[paramName] = this.#prepareRunActionParams(paramValue);
				} else {
					result[paramName] = paramValue;
				}
			}
			return result;
		}
		#prepareCallBatchParams(params) {
			const result = {};
			if (main_core.Type.isUndefined(params)) {
				return result;
			}
			for (const paramName in params) {
				result[paramName] = {
					method: params[paramName].method,
					params: this.#prepareRunActionParams(params[paramName].params)
				};
			}
			return result;
		}
		#prepareMenuItems(items, vueComponent) {
			return Object.values(items).filter(item => item.state !== 'hidden' && item.scope !== 'mobile' && (!vueComponent.isReadOnly || !item.hideIfReadonly)).sort((a, b) => a.sort - b.sort);
		}
		#startAnimation(vueComponent) {
			if (!this.#isAnimationValid()) {
				return;
			}
			if (this.#animation.target === AnimationTarget.item) {
				if (this.#animation.type === AnimationType.disable) {
					vueComponent.$root.setFaded(true);
				}
				if (this.#animation.type === AnimationType.loader) {
					vueComponent.$root.showLoader(true);
				}
			}
			if (this.#animation.target === AnimationTarget.block) {
				if (this.#animation.type === AnimationType.disable) {
					if (main_core.Type.isFunction(vueComponent.setDisabled)) {
						vueComponent.setDisabled(true);
					}
				}
				if (this.#animation.type === AnimationType.loader) {
					if (main_core.Type.isFunction(vueComponent.setLoading)) {
						vueComponent.setLoading(true);
					}
				}
			}
		}
		#stopAnimation(vueComponent, force = false) {
			if (!this.#isAnimationValid()) {
				return;
			}
			if (this.#animation.forever && !force) {
				return; // should not be stopped
			}
			if (this.#animation.target === AnimationTarget.item) {
				if (this.#animation.type === AnimationType.disable) {
					vueComponent.$root.setFaded(false);
				}
				if (this.#animation.type === AnimationType.loader) {
					vueComponent.$root.showLoader(false);
				}
			}
			if (this.#animation.target === AnimationTarget.block) {
				if (this.#animation.type === AnimationType.disable) {
					if (main_core.Type.isFunction(vueComponent.setDisabled)) {
						vueComponent.setDisabled(false);
					}
				}
				if (this.#animation.type === AnimationType.loader) {
					if (main_core.Type.isFunction(vueComponent.setLoading)) {
						vueComponent.setLoading(false);
					}
				}
			}
		}
		#isAnimationValid() {
			if (!this.#animation) {
				return false;
			}
			if (!AnimationTarget.hasOwnProperty(this.#animation.target)) {
				return false;
			}
			return AnimationType.hasOwnProperty(this.#animation.type);
		}
		#sendAnalytics() {
			if (this.#analytics && this.#analytics.hit) {
				const clonedAnalytics = {
					...this.#analytics
				};
				delete clonedAnalytics.hit;
				ui_analytics.sendData(clonedAnalytics);
			}
		}
	}

	const ICON_TO_BICON_MAP$1 = Object.freeze({
		'call': ui_iconSet_api_vue.Outline.PHONE_UP,
		'call-default': ui_iconSet_api_vue.Outline.PHONE_UP,
		'call-incoming': ui_iconSet_api_vue.Outline.PHONE_IN,
		'call-outgoing': ui_iconSet_api_vue.Outline.PHONE_OUT,
		'mail-income-unread': ui_iconSet_api_vue.Outline.MAIL,
		'mail-income-read': ui_iconSet_api_vue.Outline.MAIL_OPEN,
		'mail-outcome': ui_iconSet_api_vue.Outline.MAIL_SEND,
		'email': ui_iconSet_api_vue.Outline.MAIL,
		'document': ui_iconSet_api_vue.Outline.FILE,
		'document-signed': ui_iconSet_api_vue.Outline.DOCUMENT_SIGN,
		'document-print': ui_iconSet_api_vue.Outline.DOCUMENT_PRINT,
		'document-addition': ui_iconSet_api_vue.Outline.FORM,
		'document-draft': ui_iconSet_api_vue.Outline.FILE,
		'shop': ui_iconSet_api_vue.Outline.PACKAGE,
		'shop-eye': ui_iconSet_api_vue.Outline.SEEN_ITEMS,
		'list-check': ui_iconSet_api_vue.Outline.CHECK_LIST,
		'check': ui_iconSet_api_vue.Outline.SEEN_ITEMS,
		'sms': ui_iconSet_api_vue.Outline.SMS,
		'comment': ui_iconSet_api_vue.Outline.MESSAGE,
		'openline': ui_iconSet_api_vue.Outline.MESSAGES,
		'channel-chat': ui_iconSet_api_vue.Outline.OPEN_CHANNELS,
		'channel-whatsapp': ui_iconSet_api_vue.Outline.WHATSAPP,
		'channel-web-form': ui_iconSet_api_vue.Outline.CRM_FORM,
		'task-activity': ui_iconSet_api_vue.Outline.TASK,
		'unread-comment': ui_iconSet_api_vue.Outline.NEW_MESSAGE,
		'bank-card': ui_iconSet_api_vue.Outline.BANK_CARD,
		'calendar-share': ui_iconSet_api_vue.Outline.CALENDAR_SHARE,
		'delivery': ui_iconSet_api_vue.Outline.DELIVERY,
		'notification': ui_iconSet_api_vue.Outline.NOTIFICATION,
		'repeat-sale': ui_iconSet_api_vue.Outline.REPEAT_SALES,
		'bizproc': ui_iconSet_api_vue.Outline.BUSINES_PROCESS_STAGES,
		'bizproc-task': ui_iconSet_api_vue.Outline.BUSINES_PROCESS_STAGES
	});
	const Logo = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			type: String,
			addIcon: String,
			addIconType: String,
			icon: String,
			iconType: String,
			backgroundUrl: String,
			backgroundSize: Number,
			inCircle: {
				type: Boolean,
				required: false,
				default: false
			},
			action: Object
		},
		data() {
			return {
				currentIcon: this.icon
			};
		},
		computed: {
			className() {
				return ['crm-timeline__card-logo', `--${this.type}`, {
					'--clickable': this.action
				}];
			},
			iconClassname() {
				return ['crm-timeline__card-logo_icon', `--${this.currentIcon}`, {
					'--in-circle': this.inCircle,
					[`--type-${this.iconType}`]: !!this.iconType && !this.backgroundUrl,
					'--custom-bg': !!this.backgroundUrl
				}];
			},
			addIconClassname() {
				return ['crm-timeline__card-logo_add-icon', `--type-${this.addIconType}`, `--icon-${this.addIcon}`];
			},
			iconInteriorStyle() {
				const result = {};
				if (this.backgroundUrl) {
					result.backgroundImage = 'url(' + encodeURI(main_core.Text.encode(this.backgroundUrl)) + ')';
				}
				if (this.backgroundSize) {
					result.backgroundSize = parseInt(this.backgroundSize) + 'px';
				}
				return result;
			},
			useBIcon() {
				return ICON_TO_BICON_MAP$1.hasOwnProperty(this.currentIcon) && !this.backgroundUrl;
			},
			bIconName() {
				return ICON_TO_BICON_MAP$1[this.currentIcon] || '';
			},
			bIconColor() {
				if (this.iconType === 'failure') {
					return 'var(--ui-color-accent-main-alert)';
				}
				if (this.iconType === 'secondary') {
					return 'var(--ui-color-background-secondary)';
				}
				return 'var(--ui-color-accent-main-primary-alt-2)';
			}
		},
		watch: {
			icon(newIcon) {
				this.currentIcon = newIcon;
			}
		},
		methods: {
			executeAction() {
				if (!this.action) {
					return;
				}
				const action = new Action(this.action);
				action.execute(this);
			},
			setIcon(icon) {
				this.currentIcon = icon;
			}
		},
		template: `
		<div :class="className" @click="executeAction">
			<div class="crm-timeline__card-logo_content">
				<div :class="iconClassname">
					<BIcon
						v-if="useBIcon"
						:name="bIconName"
						:size="48"
						:color="bIconColor"
					/>
					<i v-else :style="iconInteriorStyle"></i>
				</div>
				<div :class="addIconClassname" v-if="addIcon">
					<i></i>
				</div>
			</div>
		</div>
	`
	};

	const CalendarIcon = {
		props: {
			timestamp: {
				type: Number,
				required: true,
				default: 0
			},
			calendarEventId: {
				type: Number,
				required: false,
				default: null
			}
		},
		computed: {
			date() {
				return this.formatUserTime('d');
			},
			month() {
				return this.formatUserTime('F');
			},
			dayWeek() {
				const dayShortName = this.formatUserTime('D');
				if (this.time.length > 5)
					// "12:34".length === 5, if +" PM" than > 5
					{
						return dayShortName.slice(0, 2);
					}
				return dayShortName;
			},
			time() {
				return this.getDateTimeConverter().toTimeString();
			},
			userTime() {
				return this.getDateTimeConverter().getValue();
			},
			hasCalendarEventId() {
				return this.calendarEventId > 0;
			}
		},
		methods: {
			getDateTimeConverter() {
				return crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.timestamp).toUserTime();
			},
			formatUserTime(format) {
				return main_date.DateTimeFormat.format(format, this.userTime);
			}
		},
		template: `
		<div class="crm-timeline__calendar-icon-container">
			<div v-if="hasCalendarEventId" class="crm-timeline__calendar-icon_event_icon"></div>
			<div class="crm-timeline__calendar-icon">
				<header class="crm-timeline__calendar-icon_top">
					<div class="crm-timeline__calendar-icon_bullets">
						<div class="crm-timeline__calendar-icon_bullet"></div>
						<div class="crm-timeline__calendar-icon_bullet"></div>
					</div>
				</header>
				<main class="crm-timeline__calendar-icon_content">
					<div class="crm-timeline__calendar-icon_day">{{ date }}</div>
					<div class="crm-timeline__calendar-icon_month">{{ month }}</div>
					<div class="crm-timeline__calendar-icon_date">
						<span class="crm-timeline__calendar-icon_day-week">{{ dayWeek }}</span>
						<span class="crm-timeline__calendar-icon_time">{{ time }}</span>
					</div>
				</main>
			</div>
		</div>
	`
	};

	const LogoCalendar = ui_vue3.BitrixVue.cloneComponent(Logo, {
		components: {
			CalendarIcon
		},
		props: {
			timestamp: {
				type: Number,
				required: false,
				default: 0
			},
			addIcon: String,
			addIconType: String,
			calendarEventId: {
				type: Number,
				required: false,
				default: null
			},
			backgroundColor: {
				type: String,
				required: false,
				default: null
			}
		},
		computed: {
			addIconClassname() {
				return ['crm-timeline__card-logo_add-icon', `--type-${this.addIconType}`, `--icon-${this.addIcon}`];
			},
			logoStyle() {
				if (main_core.Type.isStringFilled(this.backgroundColor)) {
					return {
						'--crm-timeline__logo-background': main_core.Text.encode(this.backgroundColor)
					};
				}
				return {};
			}
		},
		template: `
		<div 
			:class="className"
			:style="logoStyle"
			@click="executeAction"
		>
			<div class="crm-timeline__card-logo_content">
				<CalendarIcon :timestamp="timestamp" :calendar-event-id="calendarEventId" />
				<div :class="addIconClassname" v-if="addIcon">
					<i></i>
				</div>
			</div>
		</div>
	`
	});

	const Body = {
		components: {
			Logo,
			LogoCalendar
		},
		props: {
			logo: Object,
			blocks: Object
		},
		data() {
			return {
				blockRefs: {}
			};
		},
		mounted() {
			const blocks = this.$refs.blocks;
			if (!blocks || !this.visibleBlocks) {
				return;
			}
			this.visibleBlocks.forEach((block, index) => {
				if (main_core.Type.isDomNode(blocks[index].$el)) {
					blocks[index].$el.setAttribute('data-id', block.id);
				} else {
					throw new Error('Vue component "' + block.rendererName + '" was not found');
				}
			});
		},
		beforeUpdate() {
			this.blockRefs = {};
		},
		computed: {
			visibleBlocks() {
				if (!main_core.Type.isPlainObject(this.blocks)) {
					return [];
				}
				return Object.keys(this.blocks).map(id => ({
					id,
					...this.blocks[id]
				})).filter(item => item.scope !== 'mobile').sort((a, b) => {
					let aSort = a.sort === undefined ? 0 : a.sort;
					let bSort = b.sort === undefined ? 0 : b.sort;
					if (aSort < bSort) {
						return -1;
					}
					if (aSort > bSort) {
						return 1;
					}
					return 0;
				});
			},
			contentContainerClassname() {
				return ['crm-timeline__card-container', {
					'--without-logo': !this.logo
				}];
			}
		},
		methods: {
			getContentBlockById(blockId) {
				return this.blockRefs[blockId] ?? null;
			},
			getLogo() {
				return this.$refs.logo;
			},
			saveRef(ref, id) {
				this.blockRefs[id] = ref;
			}
		},
		template: `
		<div class="crm-timeline__card-body">
			<div v-if="logo" class="crm-timeline__card-logo_container">
				<LogoCalendar v-if="logo.icon === 'calendar'" v-bind="logo"></LogoCalendar>
				<Logo v-else v-bind="logo" ref="logo"></Logo>
			</div>
			<div :class="contentContainerClassname">
				<div
					v-for="block in visibleBlocks"
					:key="block.id"
					class="crm-timeline__card-container_block"
				>
					<component
						:is="block.rendererName"
						v-bind="block.properties"
						:ref="(el) => this.saveRef(el, block.id)"
					/>
				</div>
			</div>
		</div>
	`
	};

	class ButtonScope {
		static MOBILE = 'mobile';
	}

	class ButtonState {
		static DEFAULT = '';
		static LOADING = 'loading';
		static DISABLED = 'disabled';
		static HIDDEN = 'hidden';
		static LOCKED = 'locked';
		static AI_LOADING = 'ai-loading';
		static AI_SUCCESS = 'ai-success';
	}

	class ButtonType {
		static ICON = 'icon';
		static PRIMARY = 'primary';
		static SECONDARY = 'secondary';
		static LIGHT = 'light';
		static AI = 'ai';
	}

	const BaseButton = {
		props: {
			id: {
				type: String,
				required: false,
				default: ''
			},
			title: {
				type: String,
				required: false,
				default: ''
			},
			tooltip: {
				type: String,
				required: false,
				default: ''
			},
			state: {
				type: String,
				required: false,
				default: ButtonState.DEFAULT
			},
			props: Object,
			action: Object
		},
		data() {
			return {
				currentState: this.state
			};
		},
		computed: {
			itemStateToButtonStateDict() {
				return {
					[ButtonState.LOADING]: ui_buttons.Button.State.WAITING,
					[ButtonState.DISABLED]: ui_buttons.Button.State.DISABLED,
					[ButtonState.AI_LOADING]: ui_buttons.Button.State.AI_WAITING
				};
			}
		},
		methods: {
			setDisabled(disabled) {
				if (disabled) {
					this.setButtonState(ButtonState.DISABLED);
				} else {
					this.setButtonState(ButtonState.DEFAULT);
				}
			},
			setLoading(loading) {
				if (loading) {
					this.setButtonState(ButtonState.LOADING);
				} else {
					this.setButtonState(ButtonState.DEFAULT);
				}
			},
			setButtonState(state) {
				if (this.currentState !== state) {
					this.currentState = state;
				}
			},
			onLayoutUpdated() {
				this.setButtonState(this.state);
			},
			executeAction() {
				if (this.action && this.currentState !== ButtonState.DISABLED && this.currentState !== ButtonState.LOADING && this.currentState !== ButtonState.AI_LOADING) {
					const action = new Action(this.action);
					action.execute(this);
				}
			}
		},
		created() {
			this.$Bitrix.eventEmitter.subscribe('layout:updated', this.onLayoutUpdated);
		},
		beforeUnmount() {
			this.$Bitrix.eventEmitter.unsubscribe('layout:updated', this.onLayoutUpdated);
		},
		template: `<button></button>`
	};

	let Menu$1 = class Menu {
		#menuOptions = {};
		#vueComponent = {};
		constructor(vueComponent, menuItems, menuOptions) {
			this.#vueComponent = vueComponent;
			this.#menuOptions = menuOptions || {};
			this.#menuOptions = {
				angle: false,
				cacheable: false,
				...this.#menuOptions
			};
			this.#menuOptions.items = [];
			for (const item of menuItems) {
				this.#menuOptions.items.push(this.createMenuItem(item));
			}
		}
		getMenuItems() {
			return this.#menuOptions.items;
		}
		show() {
			main_popup.MenuManager.show(this.#menuOptions);
		}
		createMenuItem(item) {
			if (Object.prototype.hasOwnProperty.call(item, 'delimiter') && item.delimiter) {
				return {
					text: item.title || '',
					delimiter: true
				};
			}
			const result = {
				text: item.title,
				value: item.title
			};
			if (item.icon) {
				result.className = `menu-popup-item-${item.icon}`;
			}
			if (item.menu) {
				result.items = [];
				for (const subItem of Object.values(item.menu.items || {})) {
					result.items.push(this.createMenuItem(subItem));
				}
			} else if (item.action) {
				if (item.action.type === 'redirect') {
					result.href = item.action.value;
				} else if (item.action.type === 'jsCode') {
					result.onclick = item.action.value;
				} else {
					result.onclick = () => {
						void this.onMenuItemClick(item);
					};
				}
			}
			return result;
		}
		onMenuItemClick(item) {
			const menu = main_popup.MenuManager.getCurrentMenu();
			if (menu) {
				menu.close();
			}
			const action = new Action(item.action);
			void action.execute(this.#vueComponent);
		}
		static showMenu(vueComponent, menuItems, menuOptions) {
			const menu = new Menu(vueComponent, menuItems, menuOptions);
			menu.show();
		}
	};

	class ButtonMenu extends Menu$1 {
		constructor(vueComponent, menuItems, menuOptions) {
			super(vueComponent, menuItems, menuOptions);
			this.#applyMenuItems();
		}

		/**
		 * @override
		 */
		createMenuItem(item) {
			const result = {
				text: item.title,
				value: item.title
			};
			if (main_core.Type.isStringFilled(item.state)) {
				switch (item.state) {
					case ButtonState.AI_LOADING:
						result.className = 'menu-popup-item-ai-loading menu-popup-item-disabled';
						break;
					case ButtonState.AI_SUCCESS:
						result.className = 'menu-popup-item-accept menu-popup-item-disabled';
						break;
					case ButtonState.DISABLED:
						result.className = 'menu-popup-no-icon menu-popup-item-disabled';
						break;
					case ButtonState.LOCKED:
						result.className = 'menu-popup-item-locked';
						break;
					default:
						result.className = '';
				}
			}
			if (main_core.Type.isObject(item.action)) {
				if (item.action.type === 'redirect') {
					result.href = item.action.value;
				} else if (item.action.type === 'jsCode') {
					result.onclick = item.action.value;
				} else {
					result.onclick = () => {
						void this.onMenuItemClick(item);
					};
				}
			}
			return result;
		}
		#applyMenuItems() {
			const items = this.getMenuItems();
			if (!items) {
				return;
			}
			const emptyClassItems = items.filter(item => item.className === '');
			if (emptyClassItems.length === items.length) {
				return;
			}
			items.forEach(item => {
				if (item.className === '') {
					// eslint-disable-next-line no-param-reassign
					item.className = 'menu-popup-empty-icon';
				}
			});
		}
		static showMenu(vueComponent, menuItems, menuOptions) {
			const menu = new ButtonMenu(vueComponent, menuItems, menuOptions);
			menu.show();
		}
	}

	const Button = ui_vue3.BitrixVue.cloneComponent(BaseButton, {
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			type: {
				type: String,
				required: false,
				default: ButtonType.SECONDARY
			},
			iconName: {
				type: String,
				required: false,
				default: ''
			},
			size: {
				type: String,
				required: false,
				default: 'medium'
			},
			menuItems: {
				type: Object,
				required: false,
				default: null
			}
		},
		data() {
			return {
				timerSecondsRemaining: 0,
				currentState: this.state,
				hintText: main_core.Type.isStringFilled(this.tooltip) ? this.tooltip : ''
			};
		},
		computed: {
			itemTypeToButtonStyleDict() {
				return {
					[ButtonType.PRIMARY]: ui_buttons.Button.AirStyle.FILLED,
					[ButtonType.SECONDARY]: ui_buttons.Button.AirStyle.OUTLINE,
					[ButtonType.LIGHT]: ui_buttons.Button.AirStyle.PLAIN,
					[ButtonType.ICON]: ui_buttons.Button.AirStyle.PLAIN_NO_ACCENT,
					[ButtonType.AI]: ui_buttons.Button.AirStyle.FILLED_BITRIX_GPT
				};
			},
			buttonContainerRef() {
				return this.$refs.buttonContainer;
			},
			containerClasses() {
				return [this.$attrs.class, {
					'--has-ai-icon': this.iconName?.toLowerCase() === 'ai',
					'--has-icon-only': this.type === ButtonType.ICON
				}];
			},
			hintOptions() {
				if (!main_core.Type.isStringFilled(this.hintText)) {
					return null;
				}
				return {
					text: main_core.Text.encode(this.hintText),
					popupOptions: {
						offsetTop: 5
					}
				};
			}
		},
		methods: {
			getButtonOptions() {
				const upperCaseIconName = main_core.Type.isString(this.iconName) ? this.iconName.toUpperCase() : '';
				const upperCaseButtonSize = main_core.Type.isString(this.size) ? this.size.toUpperCase() : 'extra_small';
				const btnStyle = this.itemTypeToButtonStyleDict[this.type] || ui_buttons.Button.AirStyle.OUTLINE;
				const titleText = this.type === ButtonType.ICON ? '' : this.title;
				return {
					id: this.id,
					useAirDesign: true,
					round: true,
					size: ui_buttons.Button.Size[upperCaseButtonSize],
					text: titleText,
					style: btnStyle,
					state: this.itemStateToButtonStateDict[this.currentState],
					icon: ui_buttons.Button.Icon[upperCaseIconName],
					props: main_core.Type.isPlainObject(this.props) ? this.props : {}
				};
			},
			getUiButton() {
				return this.uiButton;
			},
			disableWithTimer(sec) {
				this.setButtonState(ButtonState.DISABLED);
				const btn = this.getUiButton();
				let remainingSeconds = sec;
				btn.setText(this.formatSeconds(remainingSeconds));
				const timer = setInterval(() => {
					if (remainingSeconds < 1) {
						clearInterval(timer);
						btn.setText(this.title);
						this.setButtonState(ButtonState.DEFAULT);
						return;
					}
					remainingSeconds--;
					btn.setText(this.formatSeconds(remainingSeconds));
				}, 1000);
			},
			formatSeconds(sec) {
				const minutes = Math.floor(sec / 60);
				const seconds = sec % 60;
				const formatMinutes = this.formatNumber(minutes);
				const formatSeconds = this.formatNumber(seconds);
				return `${formatMinutes}:${formatSeconds}`;
			},
			formatNumber(num) {
				return num < 10 ? `0${num}` : num;
			},
			setButtonState(state) {
				this.parentSetButtonState(state);
				this.getUiButton()?.setState(this.itemStateToButtonStateDict[this.currentState] ?? null);
			},
			createSplitButton() {
				const menuItems = Object.keys(this.menuItems).map(key => this.menuItems[key]);
				const options = this.getButtonOptions();
				const showMenu = () => {
					ButtonMenu.showMenu(this, menuItems, {
						id: `split-button-menu-${this.id}`,
						className: 'crm-timeline__split-button-menu',
						width: 250,
						angle: true,
						cacheable: false,
						offsetLeft: 13,
						bindElement: this.$el.querySelector('.ui-btn-menu')
					});
				};
				options.menuButton = {
					onclick: (element, event) => {
						event.stopPropagation();
						showMenu();
					}
				};
				if (options.state === ui_buttons.ButtonState.DISABLED) {
					options.mainButton = {
						onclick: (element, event) => {
							event.stopPropagation();
							showMenu();
						}
					};
				}
				return new ui_buttons.SplitButton(options);
			},
			renderButton() {
				if (!this.buttonContainerRef) {
					return;
				}
				this.buttonContainerRef.innerHTML = '';
				const button = this.menuItems ? this.createSplitButton() : new ui_buttons.Button(this.getButtonOptions());
				button.renderTo(this.buttonContainerRef);
				this.uiButton = button;
			},
			setTooltip(tooltip) {
				this.hintText = tooltip;
			},
			isInViewport() {
				const rect = this.$el.getBoundingClientRect();
				return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
			},
			isPropEqual(propName, value) {
				return this.getButtonOptions().props[propName] === value;
			}
		},
		watch: {
			state(newValue) {
				this.setButtonState(newValue);
			},
			tooltip(newValue) {
				this.hintText = main_core.Type.isStringFilled(newValue) ? newValue : '';
			}
		},
		mounted() {
			this.renderButton();
		},
		updated() {
			this.renderButton();
		},
		template: `
		<div
			:class="containerClasses"
			v-hint="hintOptions"
			ref="buttonContainer"
			@click="executeAction"
		>
		</div>
	`
	});

	const AdditionalButtonIcon = Object.freeze({
		NOTE: 'note',
		PRINT: 'print',
		SCRIPT: 'script',
		QR_CODE: 'qr-code',
		VIDEOCONFERENCE: 'videoconference',
		DOTS: 'dots'
	});
	const AdditionalButtonColor = Object.freeze({
		DEFAULT: 'default',
		PRIMARY: 'primary'
	});
	const ICON_MAP = Object.freeze({
		[AdditionalButtonIcon.NOTE]: ui_iconSet_api_core.Outline.NOTE,
		[AdditionalButtonIcon.PRINT]: ui_iconSet_api_core.Outline.PRINTER,
		[AdditionalButtonIcon.SCRIPT]: ui_iconSet_api_core.Outline.TRANSCRIPTION,
		[AdditionalButtonIcon.QR_CODE]: ui_iconSet_api_core.Outline.QR_CODE,
		[AdditionalButtonIcon.VIDEOCONFERENCE]: ui_iconSet_api_core.Outline.RECORD_VIDEO,
		[AdditionalButtonIcon.DOTS]: ui_iconSet_api_core.Outline.MORE_L
	});
	const STYLE_MAP = Object.freeze({
		[AdditionalButtonColor.DEFAULT]: ui_vue3_components_button.AirButtonStyle.PLAIN_NO_ACCENT,
		[AdditionalButtonColor.PRIMARY]: ui_vue3_components_button.AirButtonStyle.PLAIN_ACCENT
	});
	const UI_BUTTON_STATE_MAP = Object.freeze({
		[ButtonState.LOADING]: ui_vue3_components_button.ButtonState.WAITING,
		[ButtonState.AI_LOADING]: ui_vue3_components_button.ButtonState.AI_WAITING
	});
	const AdditionalButton = {
		name: 'AdditionalButton',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		inheritAttrs: false,
		props: {
			id: {
				type: String,
				required: false,
				default: ''
			},
			title: {
				type: String,
				required: false,
				default: ''
			},
			iconName: {
				type: String,
				required: false,
				default: '',
				validator(value) {
					return Object.values(AdditionalButtonIcon).indexOf(value) > -1;
				}
			},
			color: {
				type: String,
				required: false,
				default: AdditionalButtonColor.DEFAULT,
				validator(value) {
					return Object.values(AdditionalButtonColor).indexOf(value) > -1;
				}
			},
			state: {
				type: String,
				required: false,
				default: ButtonState.DEFAULT
			},
			action: Object
		},
		setup() {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				currentState: this.state
			};
		},
		watch: {
			state(value) {
				this.setButtonState(value);
			}
		},
		computed: {
			mappedIcon() {
				return ICON_MAP[this.iconName] || null;
			},
			mappedStyle() {
				return STYLE_MAP[this.color] || ui_vue3_components_button.AirButtonStyle.PLAIN_NO_ACCENT;
			},
			buttonDataset() {
				return this.iconName ? {
					testid: `crm-timeline-additional-button-${this.iconName}`
				} : {};
			},
			isHidden() {
				return this.currentState === ButtonState.HIDDEN;
			},
			isDisabled() {
				return this.currentState === ButtonState.DISABLED;
			},
			isLoading() {
				return this.uiButtonState === ui_vue3_components_button.ButtonState.WAITING;
			},
			uiButtonState() {
				return UI_BUTTON_STATE_MAP[this.currentState] || null;
			}
		},
		created() {
			this.$Bitrix.eventEmitter.subscribe('layout:updated', this.onLayoutUpdated);
		},
		beforeUnmount() {
			this.$Bitrix.eventEmitter.unsubscribe('layout:updated', this.onLayoutUpdated);
		},
		methods: {
			setButtonState(value) {
				if (this.currentState !== value) {
					this.currentState = value;
				}
			},
			setDisabled(disabled) {
				this.setButtonState(disabled ? ButtonState.DISABLED : ButtonState.DEFAULT);
			},
			setLoading(loading) {
				this.setButtonState(loading ? ButtonState.LOADING : ButtonState.DEFAULT);
			},
			onLayoutUpdated() {
				this.setButtonState(this.state);
			},
			executeAction() {
				if (this.isDisabled || this.uiButtonState) {
					return;
				}
				if (this.action) {
					const action = new Action(this.action);
					action.execute(this);
				}
			}
		},
		// language=Vue
		template: `
		<div
			v-if="!isHidden"
			:title="title"
			class="crm-timeline__additional-button"
		>
			<UiButton
				:text="title"
				:leftIcon="mappedIcon"
				:size="ButtonSize.LARGE"
				:style="mappedStyle"
				:state="uiButtonState"
				:disabled="isDisabled"
				:loading="isLoading"
				:dataset="buttonDataset"
				collapsed
				@click="executeAction"
			/>
		</div>
	`
	};

	const Buttons = {
		components: {
			Button
		},
		props: {
			items: {
				type: Array,
				required: false,
				default: () => []
			}
		},
		methods: {
			getButtonById(buttonId) {
				const buttons = this.$refs.buttons;
				return this.items.reduce((found, button, index) => {
					if (found) {
						return found;
					}
					if (button.id === buttonId) {
						return buttons[index];
					}
					return null;
				}, null);
			}
		},
		template: `
			<div class="crm-timeline__card-action_buttons">
				<Button class="crm-timeline__card-action-btn" v-for="item in items" v-bind="item" ref="buttons" />
			</div>
		`
	};

	const DEFAULT_MENU_WIDTH = 250;

	// @vue/component
	const Menu = {
		components: {
			AdditionalButton
		},
		props: {
			buttons: Array,
			// buttons that didn't fit into footer
			items: Object,
			// real menu items
			sections: {
				type: Array,
				default: () => []
			}
		},
		inject: ['isReadOnly'],
		computed: {
			isMenuFilled() {
				const menuItems = this.menuItems;
				return menuItems.length > 0;
			},
			itemsArray() {
				if (!this.items) {
					return [];
				}
				return Object.values(this.items).filter(item => item.state !== 'hidden' && item.scope !== 'mobile' && (!this.isReadOnly || !item.hideIfReadonly)).sort((a, b) => a.sort - b.sort);
			},
			menuItems() {
				let result = this.buttons;
				if (this.buttons.length && this.itemsArray.length) {
					result.push({
						delimiter: true
					});
				}
				result = [...result, ...this.itemsArray];
				return result;
			},
			buttonProps() {
				return {
					color: AdditionalButtonColor.DEFAULT,
					icon: AdditionalButtonIcon.DOTS
				};
			}
		},
		beforeUnmount() {
			this.menuInstance?.destroy();
			this.menuInstance = null;
		},
		methods: {
			showMenu() {
				if (this.menuInstance?.isShown()) {
					this.menuInstance.destroy();
					this.menuInstance = null;
					return;
				}
				this.menuInstance?.destroy();
				const bindElement = this.$el;
				this.menuInstance = SystemMenu.showMenu(this, {
					items: this.menuItems,
					sections: this.sections ?? []
				}, {
					className: 'crm-timeline__card_more-menu',
					bindElement,
					width: DEFAULT_MENU_WIDTH,
					angle: false,
					cacheable: false,
					autoHideHandler: event => !bindElement.contains(event.target)
				}, actionData => {
					const action = new Action(actionData);
					void action.execute(this);
				});
			}
		},
		// language=Vue
		template: `
		<div 
			v-if="isMenuFilled" 
			class="crm-timeline__card-action_menu-item" 
			@click="showMenu"
		>
			<AdditionalButton iconName="dots" color="default"></AdditionalButton>
		</div>
	`
	};

	const Footer = {
		components: {
			Buttons,
			Menu,
			Button,
			AdditionalButton
		},
		props: {
			buttons: Object,
			menu: Object,
			additionalButtons: {
				type: Object,
				required: false,
				default: () => ({})
			},
			maxBaseButtonsCount: {
				type: Number,
				required: false,
				default: 3
			}
		},
		inject: ['isReadOnly'],
		computed: {
			containerClassname() {
				return ['crm-timeline__card-action', {
					'--no-margin-top': this.baseButtons.length < 1
				}];
			},
			baseButtons() {
				return this.visibleAndSortedButtons.slice(0, this.maxBaseButtonsCount);
			},
			moreButtons() {
				return this.visibleAndSortedButtons.slice(this.maxBaseButtonsCount);
			},
			visibleAndSortedButtons() {
				return this.visibleButtons.sort(this.buttonsSorter);
			},
			visibleAndSortedAdditionalButtons() {
				return this.visibleAdditionalButtons.sort(this.buttonsSorter);
			},
			visibleButtons() {
				if (!main_core.Type.isPlainObject(this.buttons)) {
					return [];
				}
				return this.buttons ? Object.keys(this.buttons).map(id => ({
					id,
					...this.buttons[id]
				})).filter(this.visibleButtonsFilter) : [];
			},
			visibleAdditionalButtons() {
				return this.additionalButtonsArray ? Object.values(this.additionalButtonsArray).filter(this.visibleButtonsFilter) : [];
			},
			additionalButtonsArray() {
				return Object.entries(this.additionalButtons).map(([id, button]) => {
					return {
						id,
						type: ButtonType.ICON,
						...button
					};
				});
			},
			hasMenu() {
				return this.moreButtons.length || main_core.Type.isPlainObject(this.menu) && Object.keys(this.menu).length;
			}
		},
		methods: {
			visibleButtonsFilter(buttonItem) {
				return buttonItem.state !== ButtonState.HIDDEN && buttonItem.scope !== ButtonScope.MOBILE && (!this.isReadOnly || !buttonItem.hideIfReadonly);
			},
			buttonsSorter(buttonA, buttonB) {
				return buttonA?.sort - buttonB?.sort;
			},
			getButtonById(buttonId) {
				if (this.$refs.buttons) {
					const foundButton = this.$refs.buttons.getButtonById(buttonId);
					if (foundButton) {
						return foundButton;
					}
				}
				if (this.$refs.additionalButtons) {
					return this.visibleAndSortedAdditionalButtons.reduce((found, button, index) => {
						if (found) {
							return found;
						}
						if (button.id === buttonId) {
							return buttons[index];
						}
						return null;
					}, null);
				}
				return null;
			},
			getMenu() {
				if (this.$refs.menu) {
					return this.$refs.menu;
				}
				return null;
			}
		},
		template: `
		<div :class="containerClassname">
			<div class="crm-timeline__card-action_menu">
				<div
					v-for="button in visibleAndSortedAdditionalButtons"
					:key="button.id"
					class="crm-timeline__card-action_menu-item"
				>
					<additional-button
						v-bind="button"
					>
					</additional-button>
				</div>
				<Menu v-if="hasMenu" :buttons="moreButtons" v-bind="menu" ref="menu"/>
			</div>
			<Buttons ref="buttons" :items="baseButtons" />
		</div>
	`
	};

	const ChangeStreamButton = {
		props: {
			disableIfReadonly: Boolean,
			type: String,
			title: String,
			action: Object
		},
		data() {
			return {
				isReadonlyMode: false,
				isComplete: false
			};
		},
		inject: ['isReadOnly'],
		mounted() {
			this.isReadonlyMode = this.isReadOnly;
		},
		computed: {
			isShowPinButton() {
				return this.type === 'pin' && !this.isReadonlyMode;
			},
			isShowUnpinButton() {
				return this.type === 'unpin' && !this.isReadonlyMode;
			}
		},
		methods: {
			executeAction() {
				if (!this.action) {
					return;
				}
				this.isComplete = true;
				const action = new Action(this.action);
				action.execute(this).then(() => {}).catch(() => {
					this.isComplete = false;
				});
			},
			onClick() {
				if (this.action) {
					const action = new Action(this.action);
					action.execute(this);
				}
			},
			setDisabled(disabled) {
				if (!this.isReadonly && !disabled) {
					this.isReadonlyMode = false;
				}
				if (disabled) {
					this.isReadonlyMode = true;
				}
			},
			markCheckboxUnchecked() {
				this.isComplete = false;
			}
		},
		template: `
		<div class="crm-timeline__card-top_controller">
			<input
				v-if="type === 'complete'"
				@click="executeAction"
				type="checkbox"
				:disabled="isReadonlyMode"
				:checked="isComplete"
				class="crm-timeline__card-top_checkbox"
			/>
			<div
				v-else-if="isShowPinButton"
				:title="title"
				@click="executeAction"
				class="crm-timeline__card-top_icon --pin"
			></div>
			<div
				v-else-if="isShowUnpinButton"
				:title="title"
				@click="executeAction"
				class="crm-timeline__card-top_icon --unpin"
			></div>
		</div>
	`
	};

	const ColorSelector = {
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			valuesList: {
				type: Object,
				required: true
			},
			selectedValueId: {
				type: String,
				default: 'default'
			},
			readOnlyMode: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		data() {
			return {
				currentValueId: this.selectedValueId
			};
		},
		methods: {
			getValue() {
				return this.currentValueId;
			},
			setValue(value) {
				this.currentValueId = value;
				if (this.itemSelector) {
					this.itemSelector.setValue(value);
				}
			},
			onItemSelectorValueChange({
				data
			}) {
				const valueId = data.value;
				if (this.currentValueId !== valueId) {
					this.currentValueId = valueId;
					this.emitEvent('ColorSelector:Change', {
						colorId: valueId
					});
				}
			},
			emitEvent(eventName, actionParams) {
				const action = new Action({
					type: 'jsEvent',
					value: eventName,
					actionParams
				});
				action.execute(this);
			}
		},
		mounted() {
			void this.$nextTick(() => {
				this.itemSelector = new crm_field_colorSelector.ColorSelector({
					target: this.$refs.itemSelectorRef,
					colorList: this.valuesList,
					selectedColorId: this.currentValueId,
					readOnlyMode: this.readOnlyMode
				});
				if (!this.readOnlyMode) {
					main_core_events.EventEmitter.subscribe(this.itemSelector, crm_field_colorSelector.ColorSelectorEvents.EVENT_COLORSELECTOR_VALUE_CHANGE, this.onItemSelectorValueChange);
				}
			});
		},
		computed: {
			hint() {
				if (this.readOnlyMode) {
					return null;
				}
				return {
					text: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_COLOR_SELECTOR_HINT'),
					popupOptions: {
						angle: {
							offset: 30,
							position: 'top'
						},
						offsetTop: 2
					}
				};
			}
		},
		template: `
		<div class="crm-activity__todo-editor-v2_color-selector">
			<div ref="itemSelectorRef" v-hint="hint"></div>
		</div>
	`
	};

	const FormatDate = {
		name: 'FormatDate',
		props: {
			timestamp: {
				type: Number,
				required: true,
				default: 0
			},
			datePlaceholder: {
				type: String,
				required: false,
				default: ''
			},
			useShortTimeFormat: {
				type: Boolean,
				required: false,
				default: false
			},
			class: {
				type: [Array, Object, String],
				required: false,
				default: ''
			}
		},
		computed: {
			formattedDate() {
				if (!this.timestamp) {
					return this.datePlaceholder;
				}
				const converter = crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.timestamp).toUserTime();
				return this.useShortTimeFormat ? converter.toTimeString() : converter.toDatetimeString({
					delimiter: ', '
				});
			}
		},
		template: `
		<div :class="$props.class">{{ formattedDate }}</div>
	`
	};

	const Hint = {
		data() {
			return {
				isMouseOnHintArea: false,
				hintPopup: null
			};
		},
		props: {
			icon: {
				type: String,
				required: false,
				default: ''
			},
			textBlocks: {
				type: Array,
				required: false,
				default: []
			}
		},
		computed: {
			hintContentIcon() {
				if (this.icon === '') {
					return null;
				}
				const icon = new ui_iconSet_api_core.Icon({
					icon: this.icon,
					size: 24,
					color: 'var(--ui-color-palette-white-base)'
				});
				return main_core.Tag.render`
				<i class="crm-timeline__hint_popup-content-icon">
					${icon.render()}
				</i>
			`;
			},
			hintContentText() {
				return main_core.Dom.create('div', {
					attrs: {
						classname: 'crm-timeline__hint_popup-content-text'
					},
					children: this.hintContentTextBlocks
				});
			},
			hintContentTextBlocks() {
				return this.textBlocks.map(this.getContentBlockNode);
			},
			hintIconClassname() {
				return ['ui-hint', 'crm-timeline__header-hint', {
					'--active': this.hintPopup
				}];
			},
			hasContent() {
				return this.textBlocks.length > 0;
			}
		},
		methods: {
			getHintContent() {
				return main_core.Dom.create('div', {
					attrs: {
						classname: 'crm-timeline__hint_popup-content'
					},
					style: {
						display: 'flex'
					},
					children: [this.hintContentIcon, this.hintContentText]
				});
			},
			getPopupOptions() {
				return {
					darkMode: true,
					autoHide: false,
					content: this.getHintContent(),
					maxWidth: 400,
					bindOptions: {
						position: 'top'
					},
					animation: 'fading-slide'
				};
			},
			getPopupPosition() {
				const hintElem = this.$refs.hint;
				const defaultAngleLeftOffset = main_popup.Popup.getOption('angleLeftOffset');
				const {
					width: hintWidth,
					left: hintLeftOffset,
					top: hintTopOffset
				} = main_core.Dom.getPosition(hintElem);
				const {
					width: popupWidth
				} = main_core.Dom.getPosition(this.hintPopup?.getPopupContainer());
				return {
					left: hintLeftOffset + defaultAngleLeftOffset - (popupWidth - hintWidth) / 2,
					top: hintTopOffset + 15
				};
			},
			getPopupAngleOffset(popupContainer) {
				const angleWidth = 33;
				const {
					width: popupWidth
				} = main_core.Dom.getPosition(popupContainer);
				return (popupWidth - angleWidth) / 2;
			},
			onMouseEnterToPopup() {
				this.isMouseOnHintArea = true;
			},
			onHintAreaMouseLeave() {
				this.isMouseOnHintArea = false;
				setTimeout(() => {
					if (!this.isMouseOnHintArea) {
						this.hideHintPopup();
					}
				}, 400);
			},
			onMouseEnterToHint() {
				this.isMouseOnHintArea = true;
				this.showHintPopupWithDebounce();
			},
			showHintPopup() {
				if (!this.isMouseOnHintArea || this.hintPopup && this.hintPopup.isShown()) {
					return;
				}
				this.hintPopup = ui_vue3.markRaw(new main_popup.Popup(this.getPopupOptions()));
				const popupContainer = this.hintPopup.getPopupContainer();
				main_core.Event.bind(popupContainer, 'mouseenter', this.onMouseEnterToPopup);
				main_core.Event.bind(popupContainer, 'mouseleave', this.onHintAreaMouseLeave);
				this.hintPopup.show();
				this.hintPopup.setBindElement(this.getPopupPosition());
				this.hintPopup.setAngle(false);
				this.hintPopup.setAngle({
					offset: this.getPopupAngleOffset(popupContainer, this.$refs.hint)
				});
				this.hintPopup.adjustPosition();
				this.hintPopup.show();
			},
			showHintPopupWithDebounce() {
				main_core.Runtime.debounce(this.showHintPopup, 300, this)();
			},
			hideHintPopupWithDebounce() {
				return main_core.Runtime.debounce(this.hideHintPopup, 300, this);
			},
			hideHintPopup() {
				if (!this.hintPopup) {
					return;
				}
				this.hintPopup.close();
				const popupContainer = this.hintPopup.getPopupContainer();
				main_core.Event.unbind(popupContainer, 'mouseenter', this.onMouseEnterToPopup);
				main_core.Event.unbind(popupContainer, 'mouseleave', this.onHintAreaMouseLeave);
				this.hintPopup.destroy();
				this.hintPopup = null;
			},
			getContentBlockNode(contentBlock) {
				if (contentBlock.type === 'text') {
					return this.getTextNode(contentBlock.options);
				} else if (contentBlock.type === 'link') {
					return this.getLinkNode(contentBlock.options);
				}
				return null;
			},
			getTextNode(textOptions = {}) {
				return main_core.Dom.create('span', {
					text: textOptions.text
				});
			},
			getLinkNode(linkOptions = {}) {
				const link = main_core.Dom.create('span', {
					text: linkOptions.text
				});
				main_core.Dom.addClass(link, 'crm-timeline__hint_popup-content-link');
				link.onclick = () => {
					this.executeAction(linkOptions.action);
				};
				return link;
			},
			executeAction(actionObj) {
				if (actionObj) {
					const action = new Action(actionObj);
					action.execute(this);
				}
			}
		},
		template: `
			<span
				ref="hint"
				@click.stop.prevent
				@mouseenter="onMouseEnterToHint"
				@mouseleave="onHintAreaMouseLeave"
				v-if="hasContent"
				:class="hintIconClassname"
			>
				<span class="ui-hint-icon ui-icon-set --help"></span>
			</span>
		`
	};

	class TagType {
		static PRIMARY = 'primary';
		static SECONDARY = 'secondary';
		static SUCCESS = 'success';
		static WARNING = 'warning';
		static FAILURE = 'failure';
		static LAVENDER = 'lavender';
		static AI = 'ai';
	}

	const Tag = {
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			title: {
				type: String,
				required: false,
				default: ''
			},
			hint: {
				type: String,
				required: false,
				default: ''
			},
			action: {
				type: Object,
				required: false,
				default: null
			},
			type: {
				type: String,
				required: false,
				default: TagType.SECONDARY
			},
			state: String,
			tagId: {
				type: String,
				required: false,
				default: ''
			}
		},
		computed: {
			className() {
				return {
					'crm-timeline__card-status': true,
					'--clickable': Boolean(this.action),
					'--hint': Boolean(this.hint)
				};
			},
			tagTypeToLabelStyleDict() {
				return {
					[TagType.PRIMARY]: ui_system_label.LabelStyle.TINTED,
					[TagType.SECONDARY]: ui_system_label.LabelStyle.TINTED_NO_ACCENT,
					[TagType.LAVENDER]: ui_system_label.LabelStyle.TINTED_VIOLET,
					[TagType.AI]: ui_system_label.LabelStyle.TINTED_BITRIX_GPT,
					[TagType.SUCCESS]: ui_system_label.LabelStyle.TINTED_SUCCESS,
					[TagType.WARNING]: ui_system_label.LabelStyle.TINTED_WARNING,
					[TagType.FAILURE]: ui_system_label.LabelStyle.TINTED_ALERT
				};
			},
			tagContainerRef() {
				return this.$refs.tag;
			},
			hintOptions() {
				if (!main_core.Type.isStringFilled(this.hint)) {
					return null;
				}
				return {
					text: main_core.Text.encode(this.hint),
					popupOptions: {
						offsetTop: 5
					}
				};
			}
		},
		methods: {
			getLabelStyleFromTagType(tagType) {
				const lowerCaseTagType = tagType ? tagType.toLowerCase() : '';
				return this.tagTypeToLabelStyleDict[lowerCaseTagType] || ui_system_label.LabelStyle.TINTED_NO_ACCENT;
			},
			// eslint-disable-next-line consistent-return
			renderTag(tagOptions) {
				if (!tagOptions || !this.tagContainerRef) {
					return null;
				}
				const {
					title,
					type
				} = tagOptions;
				const labelText = title && main_core.Type.isString(title) ? title : '';
				const label = new ui_system_label.Label({
					value: labelText,
					style: this.getLabelStyleFromTagType(type),
					size: ui_system_label.LabelSize.MD
				});
				main_core.Dom.clean(this.tagContainerRef);
				main_core.Dom.append(label.render(), this.tagContainerRef);
			},
			executeAction() {
				if (!this.action) {
					return;
				}
				const action = new Action(this.action);
				action.execute(this);
			}
		},
		mounted() {
			this.renderTag({
				title: this.title,
				type: this.type
			});
		},
		updated() {
			this.renderTag({
				title: this.title,
				type: this.type
			});
		},
		template: `
		<div
			:class="className"
			v-hint="hintOptions"
			ref="tag"
			@click="executeAction"
			:data-tag-id="tagId"
			data-hint-interactivity
		></div>
	`
	};

	const Title = {
		props: {
			title: String,
			action: Object
		},
		inject: ['isLogMessage'],
		computed: {
			className() {
				return ['crm-timeline__card-title', {
					'--light': this.isLogMessage,
					'--action': !!this.action
				}];
			},
			href() {
				if (!this.action) {
					return null;
				}
				const action = new Action(this.action);
				if (action.isRedirect()) {
					return action.getValue();
				}
				return null;
			}
		},
		methods: {
			executeAction() {
				if (!this.action) {
					return;
				}
				const action = new Action(this.action);
				action.execute(this);
			}
		},
		template: `
		<a
			v-if="href"
			:href="href"
			:class="className"
			tabindex="0"
			:title="title"
		>
			{{title}}
		</a>
		<span
			v-else
			@click="executeAction"
			:class="className"
			tabindex="0"
			:title="title"
		>
			{{title}}
		</span>`
	};

	const User = {
		props: {
			title: String,
			detailUrl: String,
			imageUrl: String
		},
		inject: ['isLogMessage'],
		computed: {
			styles() {
				if (!this.imageUrl) {
					return {};
				}
				return {
					backgroundImage: "url('" + encodeURI(main_core.Text.encode(this.imageUrl)) + "')",
					backgroundSize: '21px'
				};
			},
			className() {
				return ['ui-icon', 'ui-icon-common-user', 'crm-timeline__user-icon', {
					'--muted': this.isLogMessage
				}];
			}
		},
		// language=Vue
		template: `<a :class="className" :href="detailUrl"
					target="_blank" :title="title"><i :style="styles"></i></a>`
	};

	const Header = {
		components: {
			ColorSelector,
			ChangeStreamButton,
			Title,
			Tag,
			User,
			FormatDate,
			Hint
		},
		props: {
			title: String,
			titleAction: Object,
			date: Number,
			datePlaceholder: String,
			useShortTimeFormat: Boolean,
			changeStreamButton: Object | null,
			tags: Object,
			user: Object,
			infoHelper: Object,
			colorSettings: {
				type: Object,
				required: false,
				default: null
			}
		},
		inject: ['isReadOnly', 'isLogMessage'],
		computed: {
			visibleTags() {
				if (!main_core.Type.isPlainObject(this.tags)) {
					return [];
				}
				return this.tags ? Object.values(this.tags).filter(element => this.isVisibleTagFilter(element)) : [];
			},
			visibleAndAscSortedTags() {
				const tagsCopy = main_core.Runtime.clone(this.visibleTags);
				return tagsCopy.sort(this.tagsAscSorter);
			},
			isShowDate() {
				return this.date || this.datePlaceholder;
			},
			className() {
				return ['crm-timeline__card-top', {
					'--log-message': this.isReadOnly || this.isLogMessage
				}];
			}
		},
		methods: {
			isVisibleTagFilter(tag) {
				return tag.state !== 'hidden' && tag.scope !== 'mobile' && (!this.isReadOnly || !tag.hideIfReadonly);
			},
			tagsAscSorter(tagA, tagB) {
				return tagA.sort - tagB.sort;
			},
			getChangeStreamButton() {
				return this.$refs.changeStreamButton;
			}
		},
		created() {
			this.$watch('colorSettings', newColorSettings => {
				this.$refs.colorSelector.setValue(newColorSettings.selectedValueId);
			}, {
				deep: true
			});
		},
		template: `
		<div :class="className">
			<div class="crm-timeline__card-top_info">
				<div class="crm-timeline__card-top_info_left">
					<ChangeStreamButton 
						v-if="changeStreamButton" 
						v-bind="changeStreamButton" 
						ref="changeStreamButton"
					/>
					<Title :title="title" :action="titleAction"></Title>
					<Hint v-if="infoHelper" v-bind="infoHelper"></Hint>
				</div>
				<div ref="tags" class="crm-timeline__card-top_info_right">
					<Tag
						v-for="(tag, index) in visibleAndAscSortedTags"
						:key="index"
						v-bind="tag"
					/>
					<FormatDate
						v-if="isShowDate"
						:timestamp="date"
						:use-short-time-format="useShortTimeFormat"
						:date-placeholder="datePlaceholder"
						class="crm-timeline__card-time"
					/>
				</div>
			</div>
			<div class="crm-timeline__card-top_components-container">
				<ColorSelector
					v-if="colorSettings"
					ref="colorSelector"
					:valuesList="colorSettings.valuesList"
					:selectedValueId="colorSettings.selectedValueId"
					:readOnlyMode="colorSettings.readOnlyMode"
				/>
				<User v-bind="user"></User>
			</div>
		</div>
	`
	};

	class IconBackgroundColor {
		static PRIMARY = 'primary';
		static PRIMARY_ALT = 'primary_alt';
		static FAILURE = 'failure';
	}

	const ICON_TO_BICON_MAP = Object.freeze({
		'email': ui_iconSet_api_core.Outline.MAIL,
		'mail-income': ui_iconSet_api_core.Outline.MAIL,
		'mail-outcome': ui_iconSet_api_core.Outline.MAIL_SEND,
		'IM': ui_iconSet_api_core.Outline.MESSAGES,
		'call': ui_iconSet_api_core.Outline.PHONE_UP,
		'call-completed': ui_iconSet_api_core.Outline.PHONE_DOWN,
		'call-incoming': ui_iconSet_api_core.Outline.PHONE_IN,
		'call-incoming-missed': ui_iconSet_api_core.Outline.PHONE_BROKEN,
		'call-outcoming': ui_iconSet_api_core.Outline.PHONE_OUT,
		'crmForm': ui_iconSet_api_core.Outline.CRM_FORM,
		'store': ui_iconSet_api_core.Outline.PACKAGE,
		'task': ui_iconSet_api_core.Outline.TASK,
		'store-document': ui_iconSet_api_core.Outline.TASK,
		'meeting': ui_iconSet_api_core.Outline.MEETING_POINT,
		'visit': ui_iconSet_api_core.Outline.USER_PROFILE,
		'bp': ui_iconSet_api_core.Outline.BUSINES_PROCESS_STAGES,
		'info': ui_iconSet_api_core.Outline.INFO_CIRCLE,
		'comment': ui_iconSet_api_core.Outline.MESSAGE,
		'complete': ui_iconSet_api_core.Outline.CIRCLE_CHECK,
		'convert': ui_iconSet_api_core.Outline.REFRESH,
		'link': ui_iconSet_api_core.Outline.LINK,
		'unlink': ui_iconSet_api_core.Outline.UNLINK,
		'bank-card': ui_iconSet_api_core.Outline.BANK_CARD,
		'wallet': ui_iconSet_api_core.Outline.WALLET,
		'robot': ui_iconSet_api_core.Outline.ROBOT,
		'rest': ui_iconSet_api_core.Outline.DEVELOPER_RESOURCES,
		'taxi': ui_iconSet_api_core.Outline.DELIVERY,
		'terminal': ui_iconSet_api_core.Outline.PAYMENT_TERMINAL,
		'restApp': ui_iconSet_api_core.Outline.APPS,
		'sms': ui_iconSet_api_core.Outline.SMS,
		'new': ui_iconSet_api_core.Outline.EMPTY_MESSAGE,
		'whatsapp': ui_iconSet_api_core.Outline.WHATSAPP,
		'telegram': ui_iconSet_api_core.Outline.TELEGRAM,
		'check': ui_iconSet_api_core.Outline.RECEIPT,
		'document': ui_iconSet_api_core.Outline.FILE,
		'stage-change': ui_iconSet_api_core.Outline.STAGE,
		'relation': ui_iconSet_api_core.Outline.CONNECTION,
		'sum': ui_iconSet_api_core.Outline.SIGMA_SUMM,
		'circle-check': ui_iconSet_api_core.Outline.CIRCLE_CHECK,
		'clock': ui_iconSet_api_core.Outline.CLOCK,
		'view': ui_iconSet_api_core.Outline.SEEN_ITEMS,
		'pipeline': ui_iconSet_api_core.Outline.FILTER_FUNNEL,
		'attention': ui_iconSet_api_core.Outline.ALERT,
		'restoration': ui_iconSet_api_core.Outline.CLOCK_BACK,
		'arrow-up': ui_iconSet_api_core.Outline.ARROW_TOP_M,
		'arrow-down': ui_iconSet_api_core.Outline.ARROW_DOWN_M,
		'task-ping': ui_iconSet_api_core.Outline.PING,
		'task-new-comment': ui_iconSet_api_core.Outline.NEW_MESSAGE,
		'task-viewed-comment': ui_iconSet_api_core.Outline.MESSAGE,
		'task-activity': ui_iconSet_api_core.Outline.TASK,
		'ai-copilot': ui_iconSet_api_core.Outline.COPILOT,
		'ai-process': ui_iconSet_api_core.Outline.AI_PROCESS,
		'cycle-equal': ui_iconSet_api_core.Outline.REPEAT_CYCLE,
		'message-with-point': ui_iconSet_api_core.Outline.NEW_MESSAGE,
		'bizproc': ui_iconSet_api_core.Outline.BUSINES_PROCESS_STAGES,
		'booking': ui_iconSet_api_core.Outline.ONLINE_BOOKING,
		'repeat-sale': ui_iconSet_api_core.Outline.REPEAT_SALES,
		'conversion': ui_iconSet_api_core.Outline.DUPLICATE,
		'camera': ui_iconSet_api_core.Outline.CAMERA,
		'calendar': ui_iconSet_api_core.Outline.CALENDAR,
		'circle-crossed': ui_iconSet_api_core.Outline.CIRCLE_CROSS,
		'cross-air': ui_iconSet_api_core.Outline.CIRCLE_CROSS
	});

	const Icon = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			code: {
				type: String,
				required: false,
				default: 'none'
			},
			counterType: {
				type: String,
				required: false,
				default: ''
			},
			backgroundColorToken: {
				type: String,
				required: false,
				default: IconBackgroundColor.PRIMARY
			},
			backgroundUri: String,
			backgroundColor: {
				type: String,
				required: false,
				default: null
			}
		},
		inject: ['isLogMessage'],
		computed: {
			className() {
				return {
					'crm-timeline__card_icon': true,
					[`--bg-${this.backgroundColorToken}`]: Boolean(this.backgroundColorToken),
					[`--code-${this.code}`]: Boolean(this.code) && !this.backgroundUri,
					'--custom-bg': Boolean(this.backgroundUri),
					'--muted': this.isLogMessage
				};
			},
			counterNodeContainer() {
				return this.$refs.counter;
			},
			styles() {
				if (!this.backgroundUri) {
					return {};
				}
				return {
					backgroundImage: `url('${encodeURI(main_core.Text.encode(this.backgroundUri))}')`
				};
			},
			useBIcon() {
				return ICON_TO_BICON_MAP.hasOwnProperty(this.code) && !this.backgroundUri;
			},
			bIconName() {
				return ICON_TO_BICON_MAP[this.code] || '';
			},
			bIconColor() {
				if (this.isLogMessage) {
					return 'var(--ui-color-base-40)';
				}
				return 'var(--ui-color-background-primary)';
			},
			iconStyle() {
				if (main_core.Type.isStringFilled(this.backgroundColor)) {
					return {
						'--crm-timeline-card-icon-background': main_core.Text.encode(this.backgroundColor)
					};
				}
				return {};
			}
		},
		methods: {
			renderCounter() {
				if (!this.counterType) {
					return;
				}
				const styleMap = {
					danger: ui_cnt.CounterStyle.FILLED_ALERT,
					success: ui_cnt.CounterStyle.FILLED_SUCCESS
				};
				const style = styleMap[this.counterType];
				if (!style) {
					return;
				}
				main_core.Dom.clean(this.counterNodeContainer);
				const counter = new ui_cnt.Counter({
					value: 1,
					useAirDesign: true,
					border: true,
					style
				});
				counter.renderTo(this.counterNodeContainer);
			}
		},
		mounted() {
			this.renderCounter();
		},
		watch: {
			counterType(newCounterType)
			// update if counter state changed
			{
				void this.$nextTick(() => {
					this.renderCounter();
				});
			}
		},
		template: `
		<div :class="className" :style="iconStyle">
			<BIcon
				v-if="useBIcon"
				:name="bIconName"
				:size="24"
				:color="bIconColor"
			/>
			<i v-else :style="styles"></i>
			<div ref="counter" v-show="!!counterType" class="crm-timeline__card_icon_counter"></div>
		</div>
	`
	};

	const MarketPanel = {
		props: {
			text: String,
			detailsText: String,
			detailsTextAction: Object
		},
		computed: {
			needShowDetailsText() {
				return main_core.Type.isStringFilled(this.detailsText);
			},
			href() {
				if (!this.detailsTextAction) {
					return null;
				}
				const action = new Action(this.detailsTextAction);
				if (action.isRedirect()) {
					return action.getValue();
				}
				return null;
			}
		},
		methods: {
			executeAction() {
				if (this.detailsTextAction) {
					const action = new Action(this.detailsTextAction);
					action.execute(this);
				}
			}
		},
		template: `
		<div class="crm-timeline__card-bottom">
		<div class="crm-timeline__card-market">
			<div class="crm-timeline__card-market_container">
				<span class="crm-timeline__card-market_logo"></span>
				<span class="crm-timeline__card-market_text">{{ text }}</span>
				<a
					v-if="href && needShowDetailsText"
					:href="href"
					class="crm-timeline__card-market_more"
				>
					{{detailsText}}
				</a>
				<span
					v-if="!href && needShowDetailsText"
					@click="executeAction"
					class="crm-timeline__card-market_more"
				>
				{{detailsText}}
				</span>
			</div>
			<div class="crm-timeline__card-market_cross"><i></i></div>
		</div>
		</div>
	`
	};

	const UserPick = {
		template: `
		<div class="ui-icon ui-icon-common-user crm-timeline__card-top_user-icon">
			<i></i>
		</div>
	`
	};

	const Item$1 = {
		components: {
			Icon,
			Header,
			Body,
			Footer,
			MarketPanel,
			UserPick
		},
		props: {
			initialLayout: Object,
			id: String,
			useShortTimeFormat: Boolean,
			isLogMessage: Boolean,
			isReadOnly: Boolean,
			currentUser: Object | null,
			onAction: Function,
			initialColor: {
				type: Object,
				required: false,
				default: null
			},
			streamType: {
				type: Number,
				required: false,
				default: StreamType.history
			}
		},
		data() {
			return {
				layout: this.initialLayout,
				color: this.initialColor,
				isFaded: false
			};
		},
		provide() {
			return {
				isLogMessage: Boolean(this.initialLayout?.isLogMessage),
				isReadOnly: this.isReadOnly,
				currentUser: this.currentUser
			};
		},
		created() {
			this.$Bitrix.eventEmitter.subscribe('crm:timeline:item:action', this.onActionEvent);
		},
		beforeUnmount() {
			this.$Bitrix.eventEmitter.unsubscribe('crm:timeline:item:action', this.onActionEvent);
		},
		methods: {
			onActionEvent(event) {
				const eventData = event.getData();
				this.onAction(main_core.Runtime.clone(eventData));
			},
			setLayout(newLayout) {
				this.layout = newLayout;
				this.isFaded = false;
				this.$Bitrix.eventEmitter.emit('layout:updated');
			},
			setColor(newColor) {
				this.color = newColor;
			},
			setFaded(faded) {
				this.isFaded = faded;
			},
			showLoader(showLoader) {
				if (showLoader) {
					this.setFaded(true);
					if (!this.loader) {
						this.loader = new main_loader.Loader();
					}
					this.loader.show(this.$el.parentNode);
				} else {
					if (this.loader) {
						this.loader.hide();
					}
					this.setFaded(false);
				}
			},
			getContentBlockById(blockId) {
				if (!this.$refs.body) {
					return null;
				}
				return this.$refs.body.getContentBlockById(blockId);
			},
			getLogo() {
				if (!this.$refs.body) {
					return null;
				}
				return this.$refs.body.getLogo();
			},
			getHeaderChangeStreamButton() {
				if (!this.$refs.header) {
					return null;
				}
				return this.$refs.header.getChangeStreamButton();
			},
			getFooterButtonById(buttonId) {
				if (!this.$refs.footer) {
					return null;
				}
				return this.$refs.footer.getButtonById(buttonId);
			},
			getFooterMenu() {
				if (!this.$refs.footer) {
					return null;
				}
				return this.$refs.footer.getMenu();
			},
			highlightContentBlockById(blockId, isHighlighted) {
				if (!isHighlighted) {
					this.isFaded = false;
				}
				const block = this.getContentBlockById(blockId);
				if (!block) {
					return;
				}
				if (isHighlighted) {
					this.isFaded = true;
					main_core.Dom.addClass(block.$el, '--highlighted');
				} else {
					this.isFaded = false;
					main_core.Dom.removeClass(block.$el, '--highlighted');
				}
			}
		},
		computed: {
			timelineCardClassname() {
				return {
					'crm-timeline__card': true,
					'crm-timeline__card-scope': true,
					'--stream-type-history': this.streamType === StreamType.history,
					'--stream-type-scheduled': this.streamType === StreamType.scheduled,
					'--stream-type-pinned': this.streamType === StreamType.pinned,
					'--log-message': this.isLogMessage
				};
			},
			timelineCardStyle() {
				if (main_core.Type.isPlainObject(this.color) && this.streamType === StreamType.scheduled) {
					return {
						'--crm-timeline__card-color-background': main_core.Text.encode(this.color.itemBackground)
					};
				}
				return {};
			}
		},
		template: `
			<div class="crm-timeline__card-wrapper">
			<div class="crm-timeline__card_icon_container">
				<Icon v-bind="layout.icon"></Icon>
			</div>
			<div 
				:data-id="id" 
				ref="timelineCard" 
				:class="timelineCardClassname"
				:style="timelineCardStyle"
			>
				<div class="crm-timeline__card_fade" v-if="isFaded"></div>
				<Header 
					v-if="layout.header"
					v-bind="layout.header"
					:use-short-time-format="useShortTimeFormat"
					ref="header"
				/>
				<Body v-if="layout.body" v-bind="layout.body" ref="body"></Body>
				<Footer v-if="layout.footer" v-bind="layout.footer" ref="footer"></Footer>
				<MarketPanel v-if="layout.marketPanel" v-bind="layout.marketPanel"></MarketPanel>
			</div>
		</div>
	`
	};

	class ControllerManager {
		#id = null;
		constructor(id) {
			this.#id = id;
		}
		getItemControllers(item) {
			const foundControllers = [];
			for (const controller of ControllerManager.getRegisteredControllers()) {
				if (controller.isItemSupported(item)) {
					const controllerInstance = new controller();
					controllerInstance.onInitialize(item);
					foundControllers.push(controllerInstance);
				}
			}
			return foundControllers;
		}
		static getInstance(timelineId) {
			if (!this.#instances.hasOwnProperty(timelineId)) {
				this.#instances[timelineId] = new ControllerManager(timelineId);
			}
			return this.#instances[timelineId];
		}
		static registerController(controller) {
			this.#availableControllers.push(controller);
		}
		static getRegisteredControllers() {
			return this.#availableControllers;
		}
		static #instances = {};
		static #availableControllers = [];
	}

	class Base {
		getDeleteActionMethod() {
			return '';
		}
		getDeleteActionCfg(recordId, ownerTypeId, ownerId) {
			return {
				data: {
					recordId,
					ownerTypeId,
					ownerId
				}
			};
		}
		onInitialize(item) {}
		onItemAction(item, actionParams) {}
		getContentBlockComponents(item) {
			return {};
		}
		onAfterItemRefreshLayout(item) {}
		onAfterItemLayout(item, options) {}

		/**
		 * Will be executed before item node deleted from DOM
		 * @param item
		 */
		onBeforeItemClearLayout(item) {}

		/**
		 * Delete timeline record action
		 *
		 * @param recordId Timeline record ID
		 * @param ownerTypeId Owner type ID
		 * @param ownerId Owner type ID
		 * @param animationCallbacks
		 *
		 * @returns {Promise}
		 *
		 * @protected
		 */
		runDeleteAction(recordId, ownerTypeId, ownerId, animationCallbacks) {
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			return main_core.ajax.runAction(this.getDeleteActionMethod(), this.getDeleteActionCfg(recordId, ownerTypeId, ownerId)).then(() => {
				if (animationCallbacks.onStop) {
					animationCallbacks.onStop();
				}
				return true;
			}, response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000
				});
				if (animationCallbacks.onStop) {
					animationCallbacks.onStop();
				}
				return true;
			});
		}

		/**
		 * Schedule TODO activity action
		 *
		 * @param activityId Activity ID
		 * @param scheduleDate Date to use in editor
		 * @param description Default description to use in editor
		 *
		 * @protected
		 */
		runScheduleAction(activityId, scheduleDate, description = '') {
			const menuBar = BX.Crm?.Timeline?.MenuBar?.getDefault();
			if (menuBar) {
				menuBar.setActiveItemById('todo');
				menuBar.scrollIntoView();
				setTimeout(() => {
					const todoEditor = menuBar.getItemById('todo');
					todoEditor.focus();
					todoEditor.setParentActivityId(activityId);
					todoEditor.setDeadLine(scheduleDate);
					if (main_core.Type.isStringFilled(description)) {
						todoEditor.setDescription(description);
						todoEditor.focus();
					}
				}, 250);
			}
		}
		static isItemSupported(item) {
			return false;
		}
	}

	class Item {
		constructor() {
			this._id = '';
			this._isTerminated = false;
			this._wrapper = null;
		}
		getId() {
			return this._id;
		}
		_setId(id) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
		}

		/**
		 * @abstract
		 */
		setData(data) {
			throw new Error('Item.setData() must be overridden');
		}

		/**
		 * @abstract
		 */
		layout(options) {
			throw new Error('Item.layout() must be overridden');
		}
		refreshLayout() {
			const anchor = this._wrapper.previousSibling;
			this.clearLayout();
			this.layout({
				anchor: anchor
			});
		}
		clearLayout() {
			main_core.Dom.remove(this._wrapper);
			this._wrapper = undefined;
		}
		destroy() {
			this.clearLayout();
		}
		getWrapper() {
			return this._wrapper;
		}
		setWrapper(wrapper) {
			this._wrapper = wrapper;
		}
		addWrapperClass(className, timeout) {
			if (!this._wrapper) {
				return;
			}
			main_core.Dom.addClass(this._wrapper, className);
			if (main_core.Type.isNumber(timeout) && timeout >= 0) {
				window.setTimeout(this.removeWrapperClass.bind(this, className), timeout);
			}
		}
		removeWrapperClass(className, timeout) {
			if (!this._wrapper) {
				return;
			}
			main_core.Dom.removeClass(this._wrapper, className);
			if (main_core.Type.isNumber(timeout) && timeout >= 0) {
				window.setTimeout(this.addWrapperClass.bind(this, className), timeout);
			}
		}
		isTerminated() {
			return this._isTerminated;
		}
		markAsTerminated(terminated) {
			terminated = !!terminated;
			if (this._isTerminated === terminated) {
				return;
			}
			this._isTerminated = terminated;
			if (!this._wrapper) {
				return;
			}
			if (terminated) {
				main_core.Dom.addClass(this._wrapper, 'crm-entity-stream-section-last');
			} else {
				main_core.Dom.removeClass(this._wrapper, 'crm-entity-stream-section-last');
			}
		}
		getAssociatedEntityTypeId() {
			return null;
		}
		getAssociatedEntityId() {
			return null;
		}
	}

	class Layout {
		#layout = null;
		constructor(layout) {
			this.#layout = layout;
		}
		asPlainObject() {
			return main_core.Runtime.clone(this.#layout);
		}
		getFooterMenuItemById(id) {
			const items = this.#layout?.footer?.menu?.items ?? {};
			return items.hasOwnProperty(id) ? items.id : null;
		}
		addFooterMenuItem(menuItem) {
			this.#layout.footer = this.#layout.footer || {};
			this.#layout.footer.menu = this.#layout.footer.menu || {};
			this.#layout.footer.menu.items = this.#layout.footer.menu.items || {};
			this.#layout.footer.menu.items[menuItem.id] = menuItem;
		}
	}

	class ConfigurableItem extends Item {
		#container = null;
		#itemClassName = null;
		#type = null;
		#dataPayload = null;
		#timelineId = null;
		#timestamp = null;
		#sort = null;
		#useShortTimeFormat = false;
		#isReadOnly = false;
		#currentUser = null;
		#ownerTypeId = null;
		#ownerId = null;
		#controllers = null;
		#layoutComponent = null;
		#layoutApp = null;
		#layout = null;
		#streamType = null;
		#color = null;
		initialize(id, settings) {
			this._setId(id);
			settings = settings || {};
			this.#timelineId = settings.timelineId || '';
			this.setContainer(settings.container || null);
			this.#itemClassName = settings.itemClassName || '';
			if (main_core.Type.isPlainObject(settings.data)) {
				this.setData(settings.data);
				this.#useShortTimeFormat = settings.useShortTimeFormat || false;
				this.#isReadOnly = settings.isReadOnly || false;
				this.#currentUser = settings.currentUser || null;
				this.#ownerTypeId = settings.ownerTypeId;
				this.#ownerId = settings.ownerId;
				this.#streamType = settings.streamType || StreamType.history;
			}
			this.#controllers = ControllerManager.getInstance(this.#timelineId).getItemControllers(this);
		}
		setData(data) {
			this.#type = data.type || null;
			this.#timestamp = data.timestamp || null;
			this.#sort = data.sort || [];
			this.#layout = new Layout(data.layout || {});
			this.#dataPayload = data.payload || {};
			this.#color = data.color ?? null;
		}
		getColor() {
			return this.#color;
		}
		getLayout() {
			return this.#layout;
		}
		getType() {
			return this.#type;
		}
		getDataPayload() {
			return this.#dataPayload;
		}
		layout(options) {
			this.setWrapper(main_core.Dom.create({
				tag: 'div',
				attrs: {
					className: this.#itemClassName
				}
			}));
			this.initLayoutApp(options);
		}
		initWrapper() {
			this.setWrapper(main_core.Dom.create({
				tag: 'div',
				attrs: {
					className: this.#itemClassName
				}
			}));
			return this._wrapper;
		}
		initLayoutApp(options) {
			this.#initLayoutApp();
			if (this.needBindToContainer(options)) {
				const bindTo = this.getBindToNode(options);
				if (bindTo && !this.#useAnchorNextSibling(options)) {
					main_core.Dom.insertBefore(this.getWrapper(), bindTo);
				} else if (bindTo && bindTo.nextSibling) {
					main_core.Dom.insertBefore(this.getWrapper(), bindTo.nextSibling);
				} else {
					main_core.Dom.append(this.getWrapper(), this.#container);
				}
			}
			for (const controller of this.#controllers) {
				controller.onAfterItemLayout(this, options);
			}
		}
		needBindToContainer(options) {
			if (main_core.Type.isPlainObject(options)) {
				return BX.prop.getBoolean(options, 'add', true);
			}
			return true;
		}
		getBindToNode(options) {
			if (main_core.Type.isPlainObject(options)) {
				return main_core.Type.isElementNode(options['anchor']) ? options['anchor'] : null;
			}
			return null;
		}
		#useAnchorNextSibling(options) {
			if (main_core.Type.isPlainObject(options)) {
				return main_core.Type.isBoolean(options['useAnchorNextSibling']) ? options['useAnchorNextSibling'] : true;
			}
			return true;
		}
		refreshLayout() {
			// try to refresh layout via vue reactivity, if possible:
			if (this.#layoutComponent) {
				this.#layoutComponent.setColor(this.getColor());
				this.#layoutComponent.setLayout(this.getLayout().asPlainObject());
				for (const controller of this.#controllers) {
					controller.onAfterItemRefreshLayout(this);
				}
				this.#layoutComponent.showLoader(false);
			} else {
				super.refreshLayout();
			}
		}
		getLayoutComponent() {
			return this.#layoutComponent;
		}
		forceRefreshLayout() {
			const bindTo = this.getWrapper()?.nextSibling;
			this.clearLayout();
			this.layout({
				anchor: bindTo,
				useAnchorNextSibling: false
			});
		}
		getLayoutContentBlockById(id) {
			return this.#layoutComponent?.getContentBlockById(id);
		}
		getLogo() {
			return this.#layoutComponent?.getLogo();
		}
		getLayoutFooterButtonById(id) {
			return this.#layoutComponent?.getFooterButtonById(id);
		}
		getLayoutFooterMenu() {
			return this.#layoutComponent?.getFooterMenu();
		}
		getLayoutHeaderChangeStreamButton() {
			return this.#layoutComponent?.getHeaderChangeStreamButton();
		}
		highlightContentBlockById(blockId, isHighlighted) {
			this.#layoutComponent?.highlightContentBlockById(blockId, isHighlighted);
		}
		clearLayout() {
			for (const controller of this.#controllers) {
				controller.onBeforeItemClearLayout(this);
			}
			this.#layoutApp.unmount();
			this.#layoutApp = null;
			this.#layoutComponent = null;
			super.clearLayout();
		}
		getCreatedDate() {
			const timestamp = this.#timestamp ? this.#timestamp : Date.now() / 1000;
			return BX.prop.extractDate(crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(timestamp).toUserTime().getValue());
		}
		getSourceId() {
			let id = this.getId();
			if (!main_core.Type.isInteger(id)) {
				// id is like ACTIVITY_12
				id = main_core.Text.toInteger(id.replace(/^\D+/g, ''));
			}
			return id;
		}
		#initLayoutApp() {
			if (!this.#layoutApp) {
				this.#layoutApp = ui_vue3.BitrixVue.createApp(Item$1, this.#getLayoutAppProps());
				const contentBlockComponents = this.#getContentBlockComponents();
				for (const componentName in contentBlockComponents) {
					this.#layoutApp.component(componentName, contentBlockComponents[componentName]);
				}
				this.#layoutComponent = this.#layoutApp.mount(this.getWrapper());
			}
		}
		#getLayoutAppProps() {
			return {
				initialLayout: this.getLayout().asPlainObject(),
				initialColor: this.#streamType === StreamType.scheduled ? this.#color : null,
				id: String(this.getId()),
				useShortTimeFormat: this.#useShortTimeFormat,
				isReadOnly: this.isReadOnly(),
				currentUser: this.getCurrentUser(),
				streamType: this.#streamType,
				onAction: this.#onLayoutAppAction.bind(this)
			};
		}
		#onLayoutAppAction(eventData) {
			for (const controller of this.#controllers) {
				controller.onItemAction(this, eventData);
			}
		}
		#getContentBlockComponents() {
			let components = {};
			for (const controller of this.#controllers) {
				components = Object.assign(components, controller.getContentBlockComponents(this));
			}
			return components;
		}
		setContainer(container) {
			this.#container = container;
		}
		getContainer() {
			return this.#container;
		}
		getDeadline() {
			if (!this.#timestamp) {
				return null;
			}
			return crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.#timestamp).toUserTime().getValue();
		}
		getSort() {
			return this.#sort;
		}
		isReadOnly() {
			return this.#isReadOnly;
		}
		getCurrentUser() {
			return this.#currentUser;
		}
		getOwnerTypeId() {
			return this.#ownerTypeId;
		}
		clone() {
			return ConfigurableItem.create(this.getId(), {
				timelineId: this.#timelineId,
				container: this.getContainer(),
				itemClassName: this.#itemClassName,
				useShortTimeFormat: this.#useShortTimeFormat,
				isReadOnly: this.#isReadOnly,
				currentUser: this.#currentUser,
				streamType: this.#streamType,
				data: {
					type: this.#type,
					timestamp: this.#timestamp,
					sort: this.#sort,
					layout: this.getLayout().asPlainObject()
				}
			});
		}
		reloadFromServer(forceRefreshLayout = false) {
			const data = {
				ownerTypeId: this.#ownerTypeId,
				ownerId: this.#ownerId
			};
			if (this.#streamType === StreamType.history || this.#streamType === StreamType.pinned) {
				data.historyIds = [this.getId()];
			} else if (this.#streamType === StreamType.scheduled) {
				data.activityIds = [this.getId()];
			} else {
				throw new Error('Wrong stream type');
			}
			return main_core.ajax.runAction('crm.timeline.item.load', {
				data
			}).then(response => {
				Object.values(response.data).forEach(item => {
					if (item.id === this.getId()) {
						this.setData(item);
						if (forceRefreshLayout) {
							this.forceRefreshLayout();
						} else {
							this.refreshLayout();
						}
					}
				});
				return true;
			}).catch(err => {
				console.error(err);
				return true;
			});
		}
		static create(id, settings) {
			const self = new ConfigurableItem();
			self.initialize(id, settings);
			return self;
		}
	}

	const ALLOWED_MOVE_TO_ITEM_TYPES = ['Activity:Call', 'Activity:Email', 'Activity:OpenLine'];
	class Activity extends Base {
		#moveToSelectorDialog = null;
		getDeleteActionMethod() {
			return 'crm.timeline.activity.delete';
		}
		getMoveActionMethod() {
			return 'crm.activity.binding.move';
		}
		getDeleteTagActionMethod() {
			return 'crm.timeline.activity.deleteTag';
		}
		getDeleteActionCfg(recordId, ownerTypeId, ownerId) {
			return {
				data: {
					activityId: recordId,
					ownerTypeId,
					ownerId
				}
			};
		}
		runDeleteTagAction(recordId, ownerTypeId, ownerId) {
			const deleteTagActionCfg = {
				data: {
					activityId: recordId,
					ownerTypeId,
					ownerId
				}
			};
			return main_core.ajax.runAction(this.getDeleteTagActionMethod(), deleteTagActionCfg).then(() => {
				return true;
			}, response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000
				});
				return true;
			});
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Activity:Edit' && actionData && actionData.activityId) {
				this.#editActivity(actionData.activityId);
			}
			if (action === 'Activity:MoveTo' && main_core.Type.isPlainObject(actionData)) {
				this.#showMoveToSelectorDialog(item, actionData);
			}
			if (action === 'Activity:View' && actionData && actionData.activityId) {
				this.#viewActivity(actionData.activityId);
			}
			if (action === 'Activity:Delete' && actionData && actionData.activityId) {
				const confirmationText = actionData.confirmationText ?? '';
				if (confirmationText) {
					ui_dialogs_messagebox.MessageBox.show({
						message: main_core.Text.encode(confirmationText),
						modal: true,
						buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
						onYes: () => {
							return this.runDeleteAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId, animationCallbacks);
						},
						onNo: messageBox => {
							messageBox.close();
						}
					});
				} else {
					this.runDeleteAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId);
				}
			}
			if (action === 'Activity:DeleteTag' && actionData && actionData.activityId) {
				const confirmationText = actionData.confirmationText ?? '';
				if (confirmationText) {
					ui_dialogs_messagebox.MessageBox.show({
						message: main_core.Text.encode(confirmationText),
						modal: true,
						buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
						yesCaption: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_TODO_DELETE_TAG_CONFIRM_YES_CAPTION'),
						onYes: () => {
							return this.runDeleteTagAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId);
						},
						onCancel: messageBox => {
							messageBox.close();
						}
					});
				} else {
					this.runDeleteTagAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId);
				}
			}
			if (action === 'Activity:FilterRelated' && main_core.Type.isPlainObject(actionData)) {
				this.#filterRelated(actionData);
			}
		}
		#viewActivity(id) {
			const editor = this.#getActivityEditor();
			if (editor && id) {
				editor.viewActivity(id);
			}
		}
		#editActivity(id) {
			const editor = this.#getActivityEditor();
			if (editor && id) {
				editor.editActivity(id);
			}
		}
		#showMoveToSelectorDialog(itemElement, actionData) {
			if (!ALLOWED_MOVE_TO_ITEM_TYPES.includes(itemElement.getType())) {
				// eslint-disable-next-line no-console
				console.warn('Move to action provided only for following item types:', ALLOWED_MOVE_TO_ITEM_TYPES);
				return;
			}
			const isValidParams = main_core.Type.isNumber(actionData.activityId) && main_core.Type.isNumber(actionData.ownerId) && main_core.Type.isNumber(actionData.ownerTypeId);
			if (!isValidParams) {
				throw new TypeError('Invalid actionData parameters');
			}
			const element = itemElement.getLayoutFooterMenu().$el;
			if (!main_core.Type.isDomNode(element)) {
				throw new ReferenceError('Selector dialog target element must be a DOM node');
			}
			if (!this.#moveToSelectorDialog) {
				this.#createSelectorDialog(element, actionData);
			}
			this.#moveToSelectorDialog.show();
		}
		onBeforeItemClearLayout(item) {
			this.#moveToSelectorDialog?.hide();
		}
		#getActivityEditor() {
			return BX.CrmActivityEditor.getDefault();
		}
		#createSelectorDialog(dialogTargetElement, actionData) {
			let dialogEntityId = BX.CrmEntityType.resolveName(actionData.ownerTypeId);
			if (BX.CrmEntityType.isDynamicTypeByTypeId(actionData.ownerTypeId)) {
				dialogEntityId = BX.CrmEntityType.names.dynamic;
			}
			const applyButton = new ui_buttons.ApplyButton({
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED,
				size: ui_buttons.ButtonSize.MEDIUM,
				color: null,
				round: true,
				onclick: () => {
					this.#runMoveAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId, targetItem);
					this.#moveToSelectorDialog.hide();
				}
			});
			const cancelButton = new ui_buttons.CancelButton({
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.MEDIUM,
				round: true,
				color: null,
				onclick: () => {
					targetItem = null;
					this.#moveToSelectorDialog.deselectAll();
					this.#moveToSelectorDialog.hide();
				}
			});
			const createAndApplyButton = actionData.canAddItems ? this.#getCreateAndApplyButton(actionData, dialogEntityId) : null;
			let targetItem = null;
			this.#moveToSelectorDialog = new ui_entitySelector.Dialog({
				targetNode: dialogTargetElement,
				enableSearch: true,
				context: `CRM-TIMELINE-MOVE-ACTIVITY-ENTITY-SELECTOR-${actionData.ownerTypeId}`,
				tagSelectorOptions: {
					textBoxWidth: '50%'
				},
				entities: [{
					id: dialogEntityId,
					dynamicLoad: true,
					dynamicSearch: true,
					options: {
						ownerId: actionData.ownerId,
						categoryId: actionData.categoryId,
						showEntityTypeNameInHeader: true,
						hideClosedItems: true,
						excludeMyCompany: true,
						entityTypeId: actionData.ownerTypeId // for 'dynamic' types
					}
				}],
				events: {
					'Item:onBeforeSelect': event => {
						const {
							item
						} = event.getData();
						if (item) {
							if (item.getId() === actionData.ownerId) {
								event.preventDefault();
								return;
							}
							targetItem = item;
							this.#moveToSelectorDialog.getSelectedItems().forEach(row => {
								if (row.getEntityId() === targetItem.getEntityId() && main_core.Text.toInteger(row.getId()) !== main_core.Text.toInteger(targetItem.getId())) {
									row.deselect();
								}
							});
							applyButton.setDisabled(false);
							createAndApplyButton?.setDisabled(true);
						}
					},
					'Item:onDeselect': () => {
						applyButton.setDisabled(true);
						createAndApplyButton?.setDisabled(false);
					}
				},
				footer: [applyButton.setDisabled(true).render(), cancelButton.render(), createAndApplyButton?.render()],
				footerOptions: {
					containerStyles: {
						display: 'flex',
						'justify-content': 'center',
						gap: '12px',
						background: 'white',
						height: 'auto',
						padding: '18px 0'
					}
				}
			});
		}
		#getCreateAndApplyButton(actionData, dialogEntityId) {
			const newItemUrl = crm_router.Router.Instance.getItemDetailUrl(actionData.ownerTypeId, 0, actionData.categoryId);
			return new ui_buttons.CreateButton({
				style: ui_buttons.AirButtonStyle.PLAIN,
				useAirDesign: true,
				size: ui_buttons.ButtonSize.MEDIUM,
				round: true,
				disabled: newItemUrl === null,
				color: null,
				onclick: () => {
					if (newItemUrl === null) {
						return;
					}
					this.#openItemCreateSlider(String(newItemUrl), actionData, dialogEntityId);
				}
			});
		}
		#openItemCreateSlider(newItemUrl, actionData, dialogEntityId) {
			let runMoveActionForNewItem = null;
			BX.Crm.Page.openSlider(String(newItemUrl), {
				events: {
					onOpen: ({
						slider
					}) => {
						runMoveActionForNewItem = this.#getRunMoveActionForNewItemCallback(slider, actionData, dialogEntityId);
						BX.Crm.EntityEvent.subscribe(runMoveActionForNewItem);
					},
					onClose: () => {
						BX.Crm.EntityEvent.unsubscribe(runMoveActionForNewItem);
					}
				}
			});
		}
		#getRunMoveActionForNewItemCallback(slider, actionData, dialogEntityId) {
			const runMoveActionForNewItem = (eventName, eventData) => {
				if (eventName !== 'onCrmEntityCreate' || eventData.entityTypeId !== actionData.ownerTypeId) {
					return;
				}
				const newItemEntityEditor = slider.getWindow().BX?.Crm?.EntityEditor?.getDefault();
				if (main_core.Type.isNil(newItemEntityEditor)) {
					return;
				}
				const isItemCreatedInCurrentSlider = newItemEntityEditor.getEntityId() === eventData.entityId;
				if (!isItemCreatedInCurrentSlider) {
					return;
				}
				const item = new ui_entitySelector.Item({
					id: eventData.entityId,
					entityId: dialogEntityId
				});
				this.#runMoveAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId, item);
				this.#moveToSelectorDialog.hide();
				BX.Crm.EntityEvent.unsubscribe(runMoveActionForNewItem);
			};
			return runMoveActionForNewItem;
		}
		#runMoveAction(activityId, sourceEntityTypeId, sourceEntityId, targetItem) {
			if (!targetItem) {
				throw new ReferenceError('Target item is not defined');
			}
			const targetEntityTypeId = BX.CrmEntityType.resolveId(targetItem.getEntityId());
			const targetEntityId = targetItem.getId();
			if (targetEntityTypeId <= 0 || targetEntityId <= 0) {
				throw new Error('Target entity in not valid');
			}
			if (main_core.Text.toInteger(targetEntityTypeId) !== main_core.Text.toInteger(sourceEntityTypeId)) {
				throw new Error('Source and target entity types are not equal');
			}
			const data = {
				activityId,
				sourceEntityTypeId,
				sourceEntityId,
				targetEntityTypeId,
				targetEntityId
			};
			main_core.ajax.runAction(this.getMoveActionMethod(), {
				data
			}).catch(response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000
				});
				throw response;
			});
		}
		static isItemSupported(item) {
			const itemType = item.getType();
			return itemType.indexOf('Activity:') === 0 // for items with type started from `Activity:`
			|| itemType === 'TodoCreated' // TodoCreated can contain link to activity
	;
		}
		#filterRelated(actionData) {
			if (!(main_core.Type.isNumber(actionData.activityId) && main_core.Type.isStringFilled(actionData.activityLabel) && main_core.Type.isStringFilled(actionData.filterId))) {
				return;
			}
			const filterManager = BX.Main.filterManager.getById(actionData.filterId);
			if (!filterManager) {
				return;
			}
			const filterApi = filterManager.getApi();
			const fields = {
				ACTIVITY: actionData.activityId,
				ACTIVITY_label: actionData.activityLabel
			};
			filterApi.extendFilter(fields, true);
			BX.CrmTimelineManager.getDefault().getHistory().showFilter();
		}
	}

	class CallScoringResult extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'CallScoringResult:Open' && actionData) {
				this.#open(actionData);
			}
			if (action === 'CallScoringResult:EditPrompt') {
				this.#editPrompt(item, actionData);
			}
		}
		async #open(actionData) {
			if (!main_core.Type.isInteger(actionData.activityId) || !main_core.Type.isInteger(actionData.ownerTypeId) || !main_core.Type.isInteger(actionData.ownerId)) {
				return;
			}
			await top.BX.Runtime.loadExtension('crm.ai.call');
			const callQualityDlg = new top.BX.Crm.AI.Call.CallQuality({
				activityId: actionData.activityId,
				activityCreated: actionData.activityCreated ?? null,
				ownerTypeId: actionData.ownerTypeId,
				ownerId: actionData.ownerId,
				clientDetailUrl: actionData.clientDetailUrl ?? null,
				clientFullName: actionData.clientFullName ?? null,
				userPhotoUrl: actionData.userPhotoUrl ?? null,
				jobId: actionData.jobId ?? null
			});
			callQualityDlg.open();
		}
		#editPrompt(item, actionData) {
			if (!main_core.Type.isInteger(actionData.assessmentSettingId)) {
				return;
			}
			crm_router.Router.openSlider(`/crm/copilot-call-assessment/details/${actionData.assessmentSettingId}/`, {
				width: 700,
				cacheable: false
			});
		}
		static isItemSupported(item) {
			const type = item.getType();
			return type === 'AI:CallScoringResult' || type === 'CallScoringEmptyResult';
		}
	}

	class CallTranscriptResult extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'CallTranscriptResult:Open' && actionData) {
				this.#open(actionData);
			}
		}
		async #open(actionData) {
			if (!main_core.Type.isInteger(actionData.activityId) || !main_core.Type.isInteger(actionData.ownerTypeId) || !main_core.Type.isInteger(actionData.ownerId)) {
				return;
			}
			await top.BX.Runtime.loadExtension('crm.ai.call');
			const transcription = new top.BX.Crm.AI.Call.Transcription({
				activityId: actionData.activityId,
				ownerTypeId: actionData.ownerTypeId,
				ownerId: actionData.ownerId,
				languageTitle: actionData.languageTitle
			});
			transcription.open();
		}
		static isItemSupported(item) {
			return item.getType() === 'AI:CallTranscriptResult';
		}
	}

	class EntityFieldsFillingResult extends Base {
		async onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent' || !actionData) {
				return;
			}
			switch (action) {
				case 'EntityFieldsFillingResult:OpenAiFormFill':
					this.#openAiFormFillAction(actionData);
					break;
				case 'EntityFieldsFillingResult:OpenSendFeedbackPopup':
					this.#openSendFeedbackPopup(actionData, animationCallbacks);
					break;
			}
		}
		async #openAiFormFillAction(actionData) {
			const operationStatus = await this.#fetchOperationStatus(actionData.mergeUuid);
			switch (operationStatus) {
				case 'APPLIED':
					this.#openAiDoneSlider();
					break;
				case 'CONFLICT':
					this.#openAiFormFill(actionData);
					break;
				default:
					throw new Error(`Invalid operation status: ${operationStatus}`);
			}
		}
		#openAiFormFill(actionData) {
			const mergeUuid = parseInt(actionData.mergeUuid, 10);
			if (!main_core.Type.isInteger(mergeUuid) || mergeUuid <= 0) {
				return;
			}
			top.BX.Runtime.loadExtension('crm.ai.form-fill').then(exports => {
				const {
					createAiFormFillApplicationInsideSlider
				} = exports;
				createAiFormFillApplicationInsideSlider({
					...actionData,
					mergeUuid
				});
			}).catch(() => {
				throw new Error('Cant load createAiFormFillApplicationInsideSlider extension');
			});
		}
		#openAiDoneSlider() {
			top.BX.Runtime.loadExtension('crm.ai.done').then(exports => {
				const {
					Done
				} = exports;
				new Done().start();
			}).catch(() => {
				throw new Error('Cant load crm.ai.done extension');
			});
		}
		async #fetchOperationStatus(mergeId) {
			const response = await main_core.ajax.runAction('crm.timeline.ai.fieldsFillingStatus', {
				data: {
					mergeId
				}
			});
			if (response.status !== 'success') {
				return null;
			}
			return response?.data?.operationStatus;
		}
		#openSendFeedbackPopup(actionData, animationCallbacks) {
			const mergeUuid = parseInt(actionData.mergeUuid, 10);
			if (!main_core.Type.isInteger(mergeUuid) || mergeUuid <= 0) {
				return;
			}
			const activityId = main_core.Text.toInteger(actionData.activityId) > 0 ? main_core.Text.toInteger(actionData.activityId) : 0;
			animationCallbacks?.onStart?.();
			main_core.Runtime.loadExtension('crm.ai.feedback').then(exports => {
				const {
					showSendFeedbackPopup
				} = exports;

				/** @see BX.Crm.AI.Feedback.showSendFeedbackPopup */
				showSendFeedbackPopup(mergeUuid, actionData.ownerTypeId, activityId, actionData.activityDirection);
			}).catch(() => {
				console.error('Cant load showSendFeedbackPopup extension');
			}).finally(() => animationCallbacks?.onStop?.());
		}
		static isItemSupported(item) {
			return item.getType() === 'AI:EntityFieldsFillingResult' || item.getType() === 'Activity:OpenLine' || item.getType() === 'Activity:Call';
		}
	}

	class TranscriptSummaryResult extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'TranscriptSummaryResult:Open' && actionData) {
				this.#open(actionData);
			}
		}
		async #open(actionData) {
			if (!main_core.Type.isInteger(actionData.activityId) || !main_core.Type.isInteger(actionData.ownerTypeId) || !main_core.Type.isInteger(actionData.ownerId)) {
				return;
			}
			await top.BX.Runtime.loadExtension('crm.ai.call');
			const summary = new top.BX.Crm.AI.Call.Summary({
				activityId: actionData.activityId,
				ownerTypeId: actionData.ownerTypeId,
				ownerId: actionData.ownerId,
				languageTitle: actionData.languageTitle,
				activityProvider: actionData.activityProvider,
				jobId: actionData.jobId
			});
			summary.open();
		}
		static isItemSupported(item) {
			return item.getType() === 'AI:TranscriptSummaryResult';
		}
	}

	const ICON_COLORS = Object.freeze({
		lightGrey: 'var(--crm-timeline-avatars-stack-steps-icon-color-light-gray)',
		blue: 'var(--crm-timeline-avatars-stack-steps-icon-color-blue)',
		lightGreen: 'var(--crm-timeline-avatars-stack-steps-icon-color-light-green)'
	});
	var AvatarsStackSteps = {
		props: {
			steps: {
				type: Array,
				required: true,
				validator: value => {
					return main_core.Type.isArrayFilled(value);
				}
			},
			styles: {
				type: Object,
				required: false
			}
		},
		mounted() {
			if (this.$refs.controlWrapper) {
				this.stack = new ui_imageStackSteps.ImageStackSteps({
					steps: this.convertIconColors(this.steps)
				});
				this.stack.renderTo(this.$refs.controlWrapper);
			}
		},
		updated() {
			if (this.stack) {
				this.convertIconColors(this.steps).forEach(step => {
					this.stack.updateStep(step, step.id);
				});
			}
		},
		unmounted() {
			if (this.stack) {
				this.stack.destroy();
			}
		},
		computed: {
			getStyles() {
				const styles = {};
				if (this.styles?.minWidth) {
					styles['min-width'] = `${main_core.Text.toInteger(this.styles.minWidth)}px`;
				}
				return styles;
			}
		},
		methods: {
			convertIconColors(steps) {
				const colors = Object.keys(ICON_COLORS);
				steps.forEach(step => {
					const images = step.stack.images;
					if (main_core.Type.isArrayFilled(images)) {
						images.forEach(image => {
							if (image.type === ui_imageStackSteps.imageTypeEnum.ICON) {
								const color = image.data?.color;
								if (colors.includes(color)) {
									// eslint-disable-next-line no-param-reassign
									image.data.color = ICON_COLORS[color];
								}
							}
						});
					}
				});
				return steps;
			}
		},
		template: `
		<div class="crm-timeline__avatars-stack-steps" ref="controlWrapper" :style="getStyles"></div>
	`
	};

	const TaskUserStatus = Object.freeze({
		WAITING: 0,
		YES: 1,
		NO: 2,
		OK: 3,
		CANCEL: 4
	});

	class Bizproc extends Base {
		static isItemSupported(item) {
			const supportedItemTypes = ['BizprocWorkflowStarted', 'BizprocWorkflowCompleted', 'BizprocWorkflowTerminated', 'BizprocTaskCreation', 'BizprocTaskCompleted', 'BizprocCommentAdded', 'BizprocCommentRead', 'BizprocTaskDelegated', 'Activity:BizprocWorkflowCompleted', 'Activity:BizprocCommentAdded', 'Activity:BizprocTask'];
			return supportedItemTypes.includes(item.getType());
		}
		getContentBlockComponents(item) {
			return {
				AvatarsStackSteps
			};
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			const actionHandlers = {
				'Bizproc:Task:Open': () => this.#openWorkflowTaskSlider(actionData),
				'Bizproc:Task:Do': () => this.#handleTaskAction(actionData, item),
				'Bizproc:Workflow:Timeline:Open': () => this.#openTimeline(actionData),
				'Bizproc:Workflow:Open': () => this.#openWorkflowSlider(actionData),
				'Bizproc:Workflow:Terminate': () => this.#terminateWorkflow(actionData),
				'Bizproc:Workflow:Log': () => this.#openWorkflowLogSlider(actionData)
			};
			const handler = actionHandlers[action];
			if (handler) {
				handler();
			}
		}
		#handleTaskAction(actionData, item) {
			const responsibleId = main_core.Text.toInteger(actionData?.responsibleId);
			if (responsibleId > 0 && main_core.Text.toInteger(item.getCurrentUser()?.userId) === responsibleId) {
				this.#doTask(actionData, item);
				return;
			}
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Text.encode(main_core.Loc.getMessage('CRM_TIMELINE_ITEM_BIZPROC_TASK_DO_ACTION_ACCESS_DENIED')),
				autoHideDelay: 5000
			});
		}
		#openWorkflowLogSlider(actionData) {
			this.#openSlider(actionData, (Router, {
				workflowId
			}) => {
				if (Router && workflowId) {
					Router.openWorkflowLog(workflowId);
				}
			});
		}
		#openWorkflowSlider(actionData) {
			this.#openSlider(actionData, (Router, {
				workflowId
			}) => {
				if (Router && workflowId) {
					Router.openWorkflow(workflowId);
				}
			});
		}
		#openWorkflowTaskSlider(actionData) {
			this.#openSlider(actionData, (Router, {
				taskId,
				userId
			}) => {
				if (Router && taskId) {
					Router.openWorkflowTask(main_core.Text.toInteger(taskId), main_core.Text.toInteger(userId));
				}
			});
		}
		async #openSlider(actionData, callback) {
			if (!actionData) {
				return;
			}
			try {
				const {
					Router
				} = await main_core.Runtime.loadExtension('bizproc.router');
				callback(Router, actionData);
			} catch (e) {
				console.error(e);
			}
		}
		#openTimeline(actionData) {
			const workflowId = actionData?.workflowId;
			if (!workflowId) {
				return;
			}
			main_core.Runtime.loadExtension('bizproc.workflow.timeline').then(() => {
				BX.Bizproc.Workflow.Timeline.open({
					workflowId
				});
			}).catch(response => console.error(response.errors));
		}
		#terminateWorkflow(actionData) {
			const workflowId = actionData?.workflowId;
			if (!workflowId) {
				return;
			}
			main_core.ajax.runAction('bizproc.workflow.terminate', {
				data: {
					workflowId
				}
			}).catch(response => {
				response.errors.forEach(error => {
					ui_notification.UI.Notification.Center.notify({
						content: error.message,
						autoHideDelay: 5000
					});
				});
			});
		}
		#doTask(actionData, item) {
			const taskId = actionData?.taskId;
			if (!taskId) {
				return;
			}
			const value = actionData?.value;
			const name = actionData?.name;
			if (main_core.Type.isStringFilled(name) && main_core.Type.isStringFilled(value)) {
				const buttons = Object.values(TaskUserStatus).map(status => {
					return item.getLayoutFooterButtonById(`status_${status}`);
				}).filter(button => button);
				buttons.forEach(button => {
					button.setButtonState(ButtonState.DISABLED);
				});
				const data = {
					taskId,
					taskRequest: {
						[name]: value
					}
				};
				main_core.ajax.runAction('bizproc.task.do', {
					data
				}).then(() => {}) // waiting push
				.catch(response => {
					response.errors.forEach(error => {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Text.encode(error.message),
							autoHideDelay: 5000
						});
					});
					buttons.forEach(button => {
						button.setButtonState(ButtonState.DEFAULT);
					});
				});
			}
		}
		onAfterItemLayout(item, options) {
			main_core_events.EventEmitter.emit('BX.Crm.Timeline.Items.Bizproc:onAfterItemLayout', {
				target: item.getWrapper(),
				id: item.getId(),
				type: item.getType(),
				options
			});
		}
	}

	function showCyclePopup(status) {
		void main_core.Runtime.loadExtension('booking.component.cycle-popup').then(CyclePopup => {
			const scrollToCard = {
				not_confirmed: CyclePopup.CardId.Unconfirmed,
				confirmed: CyclePopup.CardId.Confirmed,
				success: CyclePopup.CardId.Confirmed,
				late: CyclePopup.CardId.Late,
				failed: CyclePopup.CardId.Late,
				waitlist: CyclePopup.CardId.Waitlist,
				overbooking: CyclePopup.CardId.Overbooking
			}[status];
			CyclePopup.cyclePopupOpener.show({
				context: 'crm',
				scrollToCard
			});
		});
	}

	class Booking extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === `${item.getType()}:ShowBooking`) {
				const url = `/booking/?editingBookingId=${actionData.id}`;
				BX.SidePanel.Instance.open(url, {
					customLeftBoundary: 0
				});
			}
			if (action === `${item.getType()}:ShowSku`) {
				BX.SidePanel.Instance.open(actionData.url);
			}
			if (action === `${item.getType()}:ShowCyclePopup`) {
				showCyclePopup(actionData.status);
			}
			if (action === `${item.getType()}:ShowInfoHelper`) {
				BX.UI?.InfoHelper?.show(actionData.code);
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:Booking';
		}
	}

	class WaitListItem extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === `${item.getType()}:ShowWaitListItem`) {
				const url = `/booking/?editingWaitListItemId=${actionData.id}`;
				BX.SidePanel.Instance.open(url, {
					customLeftBoundary: 0
				});
			}
			if (action === `${item.getType()}:ShowCyclePopup`) {
				showCyclePopup(actionData.status);
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:WaitListItem';
		}
	}

	var SharingSlotsList = {
		data() {
			return {
				moreLinkRef: null
			};
		},
		props: {
			listItems: {
				type: Array,
				required: true,
				default: []
			}
		},
		mounted() {
			const moreLink = this.$el.querySelector('[data-anchor="more-link"]');
			if (!moreLink) {
				return;
			}
			this.moreLinkRef = moreLink;
			main_core.Event.bind(this.moreLinkRef, 'click', () => this.openPopup());
			main_core.Dom.append(main_core.Tag.render`<i/>`, this.moreLinkRef);
		},
		computed: {
			items() {
				return this.listItems.map(item => item.properties);
			},
			formattedRules() {
				return this.items.map(item => this.createItemText(item));
			},
			firstFormattedRule() {
				if (this.doShowMoreLink) {
					return main_core.Loc.getMessage('CRM_TIMELINE_ITEM_CALENDAR_SHARING_SLOTS_RANGE_WITH_MORE', {
						'#RANGE#': this.formattedRules[0],
						'#MORE_LINK_CLASS#': 'crm-timeline-calendar-sharing-slots-more',
						'#AMOUNT#': this.items.length - 1
					});
				}
				return this.formattedRules[0] ?? '';
			},
			formattedDuration() {
				return main_core.Loc.getMessage('CRM_TIMELINE_ITEM_CALENDAR_SHARING_SLOTS_DURATION', {
					'#DURATION#': this.items[0].durationFormatted
				});
			},
			doShowMoreLink() {
				return this.items.length > 1;
			}
		},
		methods: {
			createItemText(item) {
				return main_core.Loc.getMessage('CRM_TIMELINE_ITEM_CALENDAR_SHARING_SLOTS_RANGE_V3', {
					'#WEEKDAYS#': main_core.Text.encode(item.weekdaysFormatted),
					'#FROM_TIME#': this.formatMinutes(item.rule.from),
					'#TO_TIME#': this.formatMinutes(item.rule.to)
				});
			},
			formatMinutes(minutes) {
				const date = new Date(calendar_util.Util.parseDate('01.01.2000').getTime() + minutes * 60 * 1000);
				return calendar_util.Util.formatTime(date);
			},
			openPopup() {
				if (!this.moreLinkRef || this.popup?.isShown()) {
					return;
				}
				this.popup = new main_popup.Popup(this.getPopupOptions());
				this.popup.show();
			},
			getPopupOptions() {
				return {
					content: this.getPopupContent(),
					autoHide: true,
					cacheable: false,
					animation: 'fading-slide',
					bindElement: this.moreLinkRef,
					closeByEsc: true
				};
			},
			getPopupContent() {
				const root = main_core.Tag.render`<div></div>`;
				this.formattedRules.forEach(item => {
					main_core.Dom.append(main_core.Tag.render`<div class="crm-timeline-calendar-sharing-slots-more-popup-item">${item}</div>`, root);
				});
				return root;
			}
		},
		template: `
		<div class="crm-timeline-calendar-sharing-slots">
			<div class="crm-timeline-calendar-sharing-slots-block" v-html="firstFormattedRule"/>
			<div class="crm-timeline-calendar-sharing-slots-block">
				{{formattedDuration}}
			</div>
		</div>
	`
	};

	class Sharing extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'CalendarSharingInvitationSent:ShowMembers' || action === 'Activity:CalendarSharing:ShowMembers') {
				this.#openMembersPopup(item, Object.values(actionData.members));
			}
			if (action === 'Activity:CalendarSharing:OpenCalendarEvent') {
				this.#openCalendarEvent(item, actionData);
			}
			if (action === 'Activity:CalendarSharing:StartVideoconference') {
				this.#startVideoconference(item, actionData);
			}
			if (action === 'CalendarSharingLinkCopied:OpenPublicPageInNewTab') {
				window.open(actionData.url);
			}
			if (action === 'CalendarSharingInvitationSent:ShowQr') {
				const dialogQr = new calendar_sharing_interface.DialogQr({
					sharingUrl: actionData.url,
					context: 'crm'
				});
				dialogQr.show();
			}
			if (action === 'Activity:CalendarSharing:CopyLink') {
				const isSuccess = BX.clipboard.copy(actionData.url);
				if (isSuccess) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_LINK_IS_COPIED_SHORT'),
						autoHideDelay: 5000
					});
				}
			}
		}
		#openCalendarEvent(item, actionData) {
			return crm_router.Router.Instance.openCalendarEventSlider(actionData.eventId, actionData.isSharing);
		}
		async #startVideoconference(item, actionData) {
			let response = null;
			try {
				response = await main_core.ajax.runAction('crm.timeline.calendar.sharing.getConferenceChatId', {
					data: {
						eventId: actionData.eventId,
						ownerId: actionData.ownerId,
						ownerTypeId: actionData.ownerTypeId
					}
				});
			} catch (responseWithError) {
				console.error(responseWithError);
				return;
			}
			const chatId = response.data.chatId;
			if (top.window.BXIM && chatId) {
				top.window.BXIM.openMessenger(`chat${parseInt(chatId, 10)}`);
			}
		}
		getContentBlockComponents(Item) {
			return {
				SharingSlotsList
			};
		}
		static isItemSupported(item) {
			return item.getType() === 'CalendarSharingInvitationSent' || item.getType() === 'CalendarSharing' || item.getType() === 'Activity:CalendarSharing' || item.getType() === 'CalendarSharingLinkCopied';
		}
		#openMembersPopup(item, members) {
			const moreButton = item.getContainer().querySelector('[data-id="sharing_member_more_button"]');
			if (!moreButton) {
				return;
			}
			const existingPopup = main_popup.PopupManager.getPopupById(`sharing_members_popup_${item.getId()}`);
			if (existingPopup) {
				return;
			}
			const menu = main_popup.MenuManager.create({
				id: `sharing_members_popup_${item.getId()}`,
				bindElement: moreButton,
				cacheable: false,
				className: 'crm-timeline-sharing-members-popup',
				maxHeight: 500,
				maxWidth: 300,
				animation: 'fading-slide',
				closeByEsc: true,
				items: members.map(member => ({
					html: this.#renderMemberMenuItem(member),
					onclick: () => menu.close()
				}))
			});
			menu.show();
		}
		#renderMemberMenuItem(member) {
			const {
				root,
				icon
			} = main_core.Tag.render`
			<a class="crm-timeline-sharing-members-popup-item" href="${member.SHOW_URL}" target="_blank">
				<div class="ui-icon ui-icon-common-user crm-timeline-sharing-members-popup-item-image">
					<i ref="icon"></i>
				</div>
				<span class="crm-timeline-sharing-members-popup-item-title">
					${main_core.Text.encode(member.FORMATTED_NAME)}
				</span>
			</a>
		`;
			if (main_core.Type.isStringFilled(member.PHOTO_URL)) {
				main_core.Dom.style(icon, 'background-image', `url('${encodeURI(main_core.Text.encode(member.PHOTO_URL))}')`);
			}
			return root;
		}
	}

	const COPILOT_BUTTON_DISABLE_DELAY = 5000;
	const COPILOT_HELPDESK_CODE$1 = 18_799_442;
	class CopilotBase extends Base {
		#copilotConfig;
		constructor() {
			super();
			this.#copilotConfig = this.getCopilotConfig();
		}

		// region Methods to override
		getCopilotConfig() {
			throw new Error('Method "getCopilotConfig" must be overridden');
		}
		useInfoHelper() {
			return false;
		}
		// endregion

		async handleCopilotLaunch(item, actionData) {
			const isCopilotAgreementNeedShow = actionData.isCopilotAgreementNeedShow || false;
			if (isCopilotAgreementNeedShow) {
				await this.#showCopilotAgreement(item, actionData);
			} else {
				await this.#launchCopilot(item, actionData);
			}
		}
		async openCopilotSummaryPopup(actionData, activityProvider, jobId = null) {
			main_core.Runtime.loadExtension('crm.ai.call').then(exports => {
				const summary = new exports.Call.Summary({
					activityId: actionData.activityId,
					ownerTypeId: actionData.ownerTypeId,
					ownerId: actionData.ownerId,
					languageTitle: actionData.languageTitle,
					activityProvider,
					jobId
				});
				summary.open();
			}).catch(exception => {
				console.error('Error loading "crm.ai.call":', exception);
			});
		}
		getFooterCopilotButton(item, scenario = null) {
			const buttonId = main_core.Type.isStringFilled(scenario) && scenario === 'call_scoring' ? 'aiSecondaryScenarioButton' : 'aiPrimaryScenarioButton';
			let copilotBtn = item.getLayoutFooterButtonById(buttonId);
			if (copilotBtn === null) {
				copilotBtn = item.getLayoutFooterButtonById('aiPrimaryScenarioButton');
			}
			return copilotBtn;
		}
		async #showCopilotAgreement(item, actionData) {
			try {
				const {
					CopilotAgreement
				} = await main_core.Runtime.loadExtension('ai.copilot-agreement');
				const copilotAgreementPopup = new CopilotAgreement({
					moduleId: 'crm',
					contextId: this.#copilotConfig.agreementContext,
					events: {
						onAccept: () => this.#launchCopilot(item, actionData)
					}
				});
				const isAgreementAccepted = await copilotAgreementPopup.checkAgreement();
				if (isAgreementAccepted) {
					await this.#launchCopilot(item, actionData);
				}
			} catch {
				await console.error('Cant load "ai.copilot-agreement" extension');
			}
		}
		async #launchCopilot(item, actionData) {
			if (!this.#validateCopilotParams(actionData)) {
				throw new Error('Invalid "actionData" parameters');
			}
			const aiCopilotBtn = this.getFooterCopilotButton(item, actionData.scenario);
			const aiCopilotBtnUI = aiCopilotBtn?.getUiButton();
			if (aiCopilotBtnUI?.getState() === ui_buttons.ButtonState.AI_WAITING) {
				return;
			}
			this.#copilotConfig.onPreLaunch?.(item, actionData);
			const previousButtonState = aiCopilotBtnUI?.getState();
			aiCopilotBtnUI?.setState(ui_buttons.ButtonState.AI_WAITING);
			try {
				const response = await this.#executeCopilotRequest(actionData);
				this.#copilotConfig.onPostLaunch?.(item, actionData, response);
			} catch (response) {
				this.#handleCopilotError(item, actionData, response, aiCopilotBtnUI, previousButtonState);
			}
		}
		#validateCopilotParams(actionData) {
			return main_core.Type.isNumber(actionData.activityId) && main_core.Type.isNumber(actionData.ownerId) && main_core.Type.isNumber(actionData.ownerTypeId) && this.#copilotConfig.validEntityTypes.includes(parseInt(actionData.ownerTypeId, 10));
		}
		#executeCopilotRequest(actionData) {
			const settings = main_core.Extension.getSettings('crm.timeline.item');
			const scenarioList = settings.aiScenarioList ?? [];
			const isValidScenario = main_core.Type.isStringFilled(actionData.scenario) && scenarioList.includes(actionData.scenario);
			return main_core.ajax.runAction(this.#copilotConfig.actionEndpoint, {
				data: {
					activityId: actionData.activityId,
					ownerTypeId: actionData.ownerTypeId,
					ownerId: actionData.ownerId,
					scenario: isValidScenario ? actionData.scenario : null
				}
			});
		}
		#handleCopilotError(item, actionData, response, btnUI, previousButtonState) {
			const customData = response?.errors?.[0]?.customData;
			if (customData) {
				this.#showAdditionalInfo(customData, item);
				this.#restoreButtonState(btnUI, previousButtonState);
			} else {
				this.#showGenericError(response, btnUI, previousButtonState);
			}
			this.#copilotConfig.onError?.(item, actionData, response);
		}
		#restoreButtonState(btnUI, previousButtonState) {
			btnUI?.setState(main_core.Type.isStringFilled(previousButtonState) ? previousButtonState : ui_buttons.ButtonState.ACTIVE);
		}
		#showGenericError(response, btnUI, previousButtonState) {
			btnUI?.setState(ui_buttons.ButtonState.DISABLED);
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Text.encode(response?.errors?.[0]?.message ?? main_core.Loc.getMessage('CRM_COMMON_ERROR')),
				autoHideDelay: COPILOT_BUTTON_DISABLE_DELAY
			});
			setTimeout(() => {
				this.#restoreButtonState(btnUI, previousButtonState);
			}, COPILOT_BUTTON_DISABLE_DELAY);
		}
		#showAdditionalInfo(data, item) {
			if (this.#isSliderCodeExist(data)) {
				this.#showInfoSlider(data.sliderCode);
			} else if (this.#isAiMarketplaceAppsExist(data)) {
				this.#showMarketMessageBox();
			} else if (data.code === 'blocked_provider') {
				if (main_core.Type.isStringFilled(data.sliderCode)) {
					this.#showInfoSlider(data.sliderCode);
					return;
				}
				let msg = '';
				if (main_core.Type.isStringFilled(data.msgPlainText)) {
					msg = data.msgPlainText;
				}
				if (main_core.Type.isStringFilled(data.msgHtml)) {
					msg = data.msgHtml;
				}
				ui_notification.UI.Notification.Center.notify({
					content: msg,
					autoHideDelay: COPILOT_BUTTON_DISABLE_DELAY
				});
			} else {
				this.#showFeedbackMessageBox();
			}
		}
		#showInfoSlider(sliderCode) {
			if (sliderCode?.includes('redirect=detail&code')) {
				top.BX.Helper.show(sliderCode);
			} else if (this.useInfoHelper()) {
				BX?.UI?.InfoHelper.show(sliderCode);
			} else {
				ui_infoHelper.FeaturePromotersRegistry.getPromoter({
					code: sliderCode
				}).show();
			}
		}
		#showFeedbackMessageBox() {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_NO_AI_PROVIDER_POPUP_TITLE', crm_ai_nameService.NameService.copilotNameReplacement()),
				message: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_NO_AI_PROVIDER_POPUP_TEXT', crm_ai_nameService.NameService.copilotNameReplacement()),
				modal: true,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_NO_AI_PROVIDER_POPUP_OK_TEXT', crm_ai_nameService.NameService.copilotNameReplacement()),
				onOk: messageBox => {
					messageBox.close();
					this.#openFeedbackForm();
				},
				onCancel: messageBox => messageBox.close()
			});
		}
		#openFeedbackForm() {
			BX.UI.Feedback.Form.open({
				id: 'b24_ai_provider_partner_crm_feedback',
				forms: [{
					zones: ['cn'],
					id: 678,
					lang: 'cn',
					sec: 'wyufoe'
				}, {
					zones: ['vn'],
					id: 680,
					lang: 'vn',
					sec: '2v97xr'
				}, {
					zones: ['en'],
					id: 682,
					lang: 'en',
					sec: '3sd3le'
				}]
			});
		}
		#showMarketMessageBox() {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_AI_PROVIDER_POPUP_TITLE', crm_ai_nameService.NameService.copilotNameReplacement()),
				message: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_AI_PROVIDER_POPUP_TEXT', {
					'[helpdesklink]': `<br><br><a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${COPILOT_HELPDESK_CODE$1}');">`,
					'[/helpdesklink]': '</a>',
					'#COPILOT_NAME#': crm_ai_nameService.NameService.copilotName()
				}),
				modal: true,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_AI_PROVIDER_POPUP_OK_TEXT'),
				onOk: () => crm_router.Router.openSlider(main_core.Loc.getMessage('AI_APP_COLLECTION_MARKET_LINK')),
				onCancel: messageBox => messageBox.close()
			});
		}
		#isSliderCodeExist(data) {
			return Object.hasOwn(data, 'sliderCode') && main_core.Type.isStringFilled(data.sliderCode);
		}
		#isAiMarketplaceAppsExist(data) {
			return Object.hasOwn(data, 'isAiMarketplaceAppsExist') && main_core.Type.isBoolean(data.isAiMarketplaceAppsExist) && data.isAiMarketplaceAppsExist;
		}
	}

	const COPILOT_BUTTON_NUMBER_OF_MANUAL_STARTS_WITH_BOOST_LIMIT = 5;
	class Call extends CopilotBase {
		#currentTranscriptionState = 'empty';
		#isCopilotWelcomeTourShown = false;
		#isTranscriptEventBound = false;

		// region Base overridden methods
		onInitialize(item) {
			this.#showCopilotWelcomeTour(item);
			this.#bindAdditionalCopilotActions(item);
		}

		// eslint-disable-next-line sonarjs/cognitive-complexity
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Call:MakeCall' && actionData) {
				this.#makeCall(actionData);
			}
			if (action === 'Call:Schedule' && actionData) {
				this.runScheduleAction(actionData.activityId, actionData.scheduleDate);
			}
			if (action === 'Call:OpenTranscript' && actionData && actionData.callId) {
				this.#openTranscript(actionData.callId);
			}
			if (action === 'Call:ChangePlayerState' && actionData && actionData.recordId) {
				this.#changePlayerState(item, actionData.recordId);
			}
			if (action === 'Call:DownloadRecord' && actionData && actionData.url) {
				this.#downloadRecord(actionData.url);
			}
			if (action === 'Call:LaunchCopilot' && actionData) {
				void this.handleCopilotLaunch(item, actionData);
			}
			if (action === 'Call:OpenCallScoringResult' && actionData) {
				this.#openCallScoringResult(actionData);
			}
			if (action === 'Call:ShowCopilotSummary' && actionData) {
				void this.#showCopilotSummary(item, actionData);
			}
		}
		// endregion

		// region CopilotBase overridden methods
		getCopilotConfig() {
			return {
				actionEndpoint: 'crm.timeline.ai.launchCopilot',
				validEntityTypes: [BX.CrmEntityType.enumeration.lead, BX.CrmEntityType.enumeration.deal],
				agreementContext: 'audio',
				onPreLaunch: (...args) => this.#handlePreLaunch(...args),
				onPostLaunch: (...args) => this.#handlePostLaunch(...args),
				onError: (...args) => this.#handleError(...args)
			};
		}
		useInfoHelper() {
			return true;
		}
		// endregion

		// region jsEvent action handlers
		#handlePreLaunch(item, actionData) {
			const player = this.#getAudioPlayer(item);
			if (!player) {
				return;
			}
			this.#currentTranscriptionState = player.getTranscriptionState();
			if (this.#currentTranscriptionState === 'empty') {
				player.setTranscriptionState('pending');
			}
		}
		#handleError(item, actionData, response) {
			const player = this.#getAudioPlayer(item);
			if (player) {
				player.setTranscriptionState(this.#currentTranscriptionState);
			}
		}
		#handlePostLaunch(item, actionData, response) {
			if (response?.status !== 'success') {
				return;
			}
			const numberOfManualStarts = response?.data?.numberOfManualStarts;
			const aiCopilotBtnUI = this.getFooterCopilotButton(item)?.getUiButton();
			if (aiCopilotBtnUI && numberOfManualStarts >= COPILOT_BUTTON_NUMBER_OF_MANUAL_STARTS_WITH_BOOST_LIMIT) {
				this.#emitTimelineCopilotTourEvent(aiCopilotBtnUI.getContainer(), 'BX.Crm.Timeline.Call:onShowTourWhenManualStartTooMuch', 'copilot-in-call-automatically', 500);
			}
		}
		#makeCall(actionData) {
			if (!main_core.Type.isStringFilled(actionData.phone)) {
				return;
			}
			const params = {
				ENTITY_TYPE_NAME: BX.CrmEntityType.resolveName(actionData.entityTypeId),
				ENTITY_ID: actionData.entityId,
				AUTO_FOLD: true
			};
			if (actionData.ownerTypeId !== actionData.entityTypeId || actionData.ownerId !== actionData.entityId) {
				params.BINDINGS = {
					OWNER_TYPE_NAME: BX.CrmEntityType.resolveName(actionData.ownerTypeId),
					OWNER_ID: actionData.ownerId
				};
			}
			if (actionData.activityId > 0) {
				params.SRC_ACTIVITY_ID = actionData.activityId;
			}
			main_core.Runtime.loadExtension('im.public').then(exports => {
				exports.Messenger.startPhoneCall(actionData.phone, params);
			}).catch(exception => {
				console.error('Error loading "im.public":', exception);
			});
		}
		#openTranscript(callId) {
			if (BX.Voximplant && BX.Voximplant.Transcript) {
				BX.Voximplant.Transcript.create({
					callId
				}).show();
			}
		}
		#changePlayerState(item, recordId) {
			const player = this.#getAudioPlayer(item);
			if (!player) {
				return;
			}
			if (recordId !== player.id) {
				return;
			}
			if (player.state === 'play') {
				player.pause();
			} else {
				player.play();
			}
		}
		#downloadRecord(url) {
			location.href = url;
		}
		async #openCallScoringResult(actionData) {
			if (!main_core.Type.isInteger(actionData.activityId) || !main_core.Type.isInteger(actionData.ownerTypeId) || !main_core.Type.isInteger(actionData.ownerId)) {
				return;
			}

			// Runtime.loadExtension not work in this case (see http://jabber.bx/view.php?id=241940)
			await top.BX.Runtime.loadExtension('crm.ai.call');
			const callQualityDlg = new top.BX.Crm.AI.Call.CallQuality({
				activityId: actionData.activityId,
				ownerTypeId: actionData.ownerTypeId,
				ownerId: actionData.ownerId,
				activityCreated: actionData.activityCreated ?? null,
				clientDetailUrl: actionData.clientDetailUrl ?? null,
				clientFullName: actionData.clientFullName ?? null,
				userPhotoUrl: actionData.userPhotoUrl ?? null,
				jobId: actionData.jobId ?? null,
				assessmentSettingsId: actionData.assessmentSettingsId ?? null
			});
			callQualityDlg.open();
		}
		async #openTranscriptResult(payload = null) {
			if (!main_core.Type.isInteger(payload?.activityId) || !main_core.Type.isInteger(payload?.ownerTypeId) || !main_core.Type.isInteger(payload?.ownerId)) {
				return;
			}
			main_core.Runtime.loadExtension('crm.ai.call').then(exports => {
				const transcription = new exports.Call.Transcription({
					activityId: payload?.activityId,
					ownerTypeId: payload?.ownerTypeId,
					ownerId: payload?.ownerId,
					languageTitle: payload?.languageTitle
				});
				transcription.open();
			}).catch(exception => {
				console.error('Error loading "crm.ai.call":', exception);
			});
		}
		#showCopilotSummary(item, actionData) {
			void this.openCopilotSummaryPopup(actionData, crm_ai_call.ActivityProvider.call);
		}
		// endregion

		// eslint-disable-next-line sonarjs/cognitive-complexity
		#showCopilotWelcomeTour(item) {
			if (!item) {
				return;
			}
			if (this.#isCopilotWelcomeTourShown) {
				return;
			}
			setTimeout(() => {
				const aiCopilotBtn = this.getFooterCopilotButton(item);
				const aiCopilotUIBtn = aiCopilotBtn?.getUiButton();
				if (!aiCopilotUIBtn || aiCopilotUIBtn.getState() === ui_buttons.ButtonState.DISABLED) {
					return;
				}
				if (aiCopilotBtn?.isInViewport()) {
					this.#emitTimelineCopilotTourEvents(aiCopilotUIBtn.getContainer(), 1500, item.getDataPayload());
					return;
				}
				const showCopilotTourOnScroll = () => {
					if (aiCopilotBtn?.isInViewport()) {
						this.#emitTimelineCopilotTourEvents(aiCopilotUIBtn.getContainer(), 1500, item.getDataPayload());
						this.#isCopilotWelcomeTourShown = true;
						main_core.Event.unbind(window, 'scroll', showCopilotTourOnScroll);
					}
				};
				main_core.Event.bind(window, 'scroll', showCopilotTourOnScroll);
			}, 50);
		}
		#bindAdditionalCopilotActions(item) {
			if (!item || this.#isTranscriptEventBound) {
				return;
			}
			this.#isTranscriptEventBound = true;
			main_core_events.EventEmitter.subscribe('ui:audioplayer:pause', event => {
				const {
					initiator
				} = event.getData();
				const aiCopilotBtn = this.getFooterCopilotButton(item);
				const aiCopilotUIBtn = aiCopilotBtn?.getUiButton();
				if (!aiCopilotUIBtn || aiCopilotUIBtn.getState() === ui_buttons.ButtonState.DISABLED || !aiCopilotBtn?.isPropEqual('data-activity-id', initiator)) {
					return;
				}
				this.#emitTimelineCopilotTourEvents(aiCopilotUIBtn.getContainer(), 500);
			});
			main_core_events.EventEmitter.subscribe('crm:audioplayer:transcript', event => {
				const {
					initiator,
					action
				} = event.getData();
				const activityId = item.getDataPayload()?.activityId;
				if (!main_core.Type.isInteger(activityId) || activityId !== initiator) {
					return;
				}
				if (action === 'open') {
					this.#openTranscriptResult(item.getDataPayload());
				} else if (action === 'transcribe') {
					void this.handleCopilotLaunch(item, {
						activityId: item.getDataPayload()?.activityId,
						ownerTypeId: item.getDataPayload()?.ownerTypeId,
						ownerId: item.getDataPayload()?.ownerId,
						scenario: 'transcribe_record'
					});
				}
			});
		}
		#emitTimelineCopilotTourEvents(target, delay = 1500, payload = null) {
			const isWelcomeTourEnabled = payload?.isWelcomeTourEnabled ?? true;
			const isWelcomeTourAutomaticallyEnabled = payload?.isWelcomeTourAutomaticallyEnabled ?? true;
			const isWelcomeTourManuallyEnabled = payload?.isWelcomeTourManuallyEnabled ?? true;
			if (isWelcomeTourEnabled) {
				this.#emitTimelineCopilotTourEvent(target, 'BX.Crm.Timeline.Call:onShowCopilotTour', 'copilot-button-in-call', delay);
			}
			if (isWelcomeTourAutomaticallyEnabled) {
				this.#emitTimelineCopilotTourEvent(target, 'BX.Crm.Timeline.Call:onShowTourWhenCopilotAutomaticallyStart', 'copilot-button-in-call-automatically', delay);
			}
			if (isWelcomeTourManuallyEnabled) {
				this.#emitTimelineCopilotTourEvent(target, 'BX.Crm.Timeline.Call:onShowTourWhenCopilotManuallyStart', 'copilot-button-in-call-manually', delay);
			}
		}
		#emitTimelineCopilotTourEvent(target, eventName, stepId, delay = 1500) {
			main_core_events.EventEmitter.emit(this, eventName, {
				target,
				stepId,
				delay
			});
		}
		#getAudioPlayer(item) {
			return item?.getLayoutContentBlockById('callGroupOfBlocks')?.getBlockById('audio');
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:Call';
		}
	}

	class Comment extends Base {
		getDeleteActionMethod() {
			return 'crm.timeline.comment.delete';
		}
		getDeleteActionCfg(recordId, ownerTypeId, ownerId) {
			return {
				data: {
					id: recordId,
					ownerTypeId: ownerTypeId,
					ownerId: ownerId
				}
			};
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Comment:Edit' || action === 'Comment:AddFile') {
				this.#showEditor(item);
			}
			if (action === 'Comment:Delete' && actionData) {
				this.#onCommentDelete(actionData, animationCallbacks);
			}
			if (action === 'Comment:StartEdit') {
				item.highlightContentBlockById('commentContentWeb', true);
			}
			if (action === 'Comment:FinishEdit') {
				item.highlightContentBlockById('commentContentWeb', false);
			}
		}
		#showEditor(item) {
			const commentBlock = item.getLayoutContentBlockById('commentContentWeb');
			if (commentBlock) {
				commentBlock.startEditing();
			} else {
				throw new Error('Vue component "CommentContent" was not found');
			}
		}
		#onCommentDelete(actionData, animationCallbacks) {
			if (!this.#isValidParams(actionData)) {
				return;
			}
			const confirmationText = main_core.Type.isStringFilled(actionData.confirmationText) ? actionData.confirmationText : '';
			if (confirmationText) {
				ui_dialogs_messagebox.MessageBox.show({
					message: confirmationText,
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
					onYes: () => {
						return this.runDeleteAction(actionData.commentId, actionData.ownerTypeId, actionData.ownerId, animationCallbacks);
					},
					onNo: messageBox => {
						messageBox.close();
					}
				});
			} else {
				this.runDeleteAction(actionData.commentId, actionData.ownerTypeId, actionData.ownerId);
			}
		}
		#isValidParams(params) {
			return main_core.Type.isNumber(params.commentId) && main_core.Type.isNumber(params.ownerId) && main_core.Type.isNumber(params.ownerTypeId);
		}
		static isItemSupported(item) {
			return item.getType() === 'Comment';
		}
	}

	// @vue/component
	var ActionBar = {
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		props: {
			title: {
				type: String,
				default: ''
			},
			items: {
				type: Object,
				required: true
			}
		},
		computed: {
			titleClassName() {
				return ['crm-timeline__action-bar-title', {
					'--hidden': !main_core.Type.isStringFilled(this.title)
				}];
			}
		},
		methods: {
			getContainer() {
				return this.$refs.actionBarContainer;
			},
			getIconByDesign(design) {
				if (design === ui_system_chip_vue.ChipDesign.OutlineBitrixGpt) {
					return ui_iconSet_api_vue.Outline.COPILOT;
				}
				return null;
			},
			executeAction(actionData) {
				if (main_core.Type.isObject(actionData)) {
					void new Action(actionData).execute(this);
				}
			}
		},
		// language=Vue
		template: `
		<div 
			class="crm-timeline__action-bar-container"
			ref="actionBarContainer"
		>
			<div :class="titleClassName">{{ title }}</div>
			<div 
				class="crm-timeline__action-bar-item"
				v-for="(item, index) in items"
				:key="index"
			>
				<Chip
					:size="item.size"
					:design="item.design"
					:text="item.text"
					:rounded="item.rounded"
					:dropdown="item.dropdown"
					:lock="item.lock"
					:icon="getIconByDesign(item.design)"
					@click="executeAction(item.action)"
				/>
			</div>
		</div>
	`
	};

	var AddressBlock = {
		props: {
			addressFormatted: String
		},
		mounted() {
			void this.$nextTick(() => {
				this.renderAddressWidget();
			});
		},
		methods: {
			renderAddressWidget() {
				const settings = main_core.Extension.getSettings('crm.timeline.item');
				if (!settings.hasLocationModule) {
					return;
				}
				const widgetFactory = new location_widget.Factory();
				const format = new location_core.Format(JSON.parse(main_core.Loc.getMessage('CRM_ACTIVITY_TODO_ADDRESS_FORMAT')));
				const address = new location_core.Address({
					languageId: format.languageId
				});
				address.setFieldValue(format.fieldForUnRecognized, this.addressFormatted);
				const addressWidget = widgetFactory.createAddressWidget({
					address,
					mode: location_core.ControlMode.view
				});
				const addressWidgetParams = {
					mode: location_core.ControlMode.view,
					mapBindElement: this.$refs.mapBindElement,
					controlWrapper: this.$refs.controlWrapper
				};
				addressWidget.render(addressWidgetParams);
			}
		},
		template: `
		<div class="crm-timeline__text-block crm-timeline__address-block">
			<div ref="mapBindElement">
				<div ref="controlWrapper" class="crm-timeline__address-block-address-wrapper">
					<span 
						:title="addressFormatted"
						class="ui-link ui-link-dark ui-link-dotted"
					>
						{{addressFormatted}}
					</span>
				</div>
			</div>
		</div>
	`
	};

	const CommunicationType = Object.freeze({
		PHONE: 'PHONE',
		EMAIL: 'EMAIL',
		IM: 'IM'
	});

	// @vue/component
	var ClientCommunication = {
		props: {
			communications: {
				type: Object,
				required: true
			},
			ownerTypeId: {
				type: Number,
				required: true
			},
			ownerId: {
				type: Number,
				required: true
			},
			entityTypeId: {
				type: Number,
				required: true
			},
			entityId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				// check data and deep clone to trigger reactivity on changes
				currentCommunications: JSON.parse(JSON.stringify(this.communications))
			};
		},
		computed: {
			hasPhone() {
				return this.hasCommunicationType(CommunicationType.PHONE);
			},
			hasEmail() {
				return this.hasCommunicationType(CommunicationType.EMAIL);
			},
			hasIM() {
				return this.hasCommunicationType(CommunicationType.IM);
			},
			phoneItems() {
				return this.getCommunicationItems(CommunicationType.PHONE);
			},
			emailItems() {
				return this.getCommunicationItems(CommunicationType.EMAIL);
			},
			imItems() {
				return this.getCommunicationItems(CommunicationType.IM);
			},
			phoneClassName() {
				return this.getButtonClassName(CommunicationType.PHONE, this.hasPhone);
			},
			emailClassName() {
				return this.getButtonClassName(CommunicationType.EMAIL, this.hasEmail);
			},
			imClassName() {
				return this.getButtonClassName(CommunicationType.IM, this.hasIM);
			}
		},
		watch: {
			communications: {
				handler(newValue) {
					this.currentCommunications = JSON.parse(JSON.stringify(newValue));
				},
				deep: true
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', this.onCommunicationChanged);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', this.onCommunicationChanged);
		},
		methods: {
			onCommunicationChanged(event) {
				const {
					item,
					current
				} = event.getData();
				if (this.entityTypeId !== item?.entityTypeId || this.entityId !== item?.entityId || !main_core.Type.isArray(current)) {
					return;
				}
				const data = current.map(receiver => ({
					id: receiver.address?.id,
					value: receiver.address?.value,
					valueFormatted: receiver.address?.valueFormatted,
					complexName: receiver.address?.valueTypeCaption ?? '',
					title: receiver.valueTypeCaption?.title ?? '',
					typeId: receiver.address?.typeId
				}));
				this.currentCommunications[CommunicationType.PHONE] = data.filter(comm => comm.typeId === CommunicationType.PHONE);
				this.currentCommunications[CommunicationType.EMAIL] = data.filter(comm => comm.typeId === CommunicationType.EMAIL);
				this.currentCommunications[CommunicationType.IM] = data.filter(comm => comm.typeId === CommunicationType.IM);
			},
			hasCommunicationType(type) {
				const items = this.currentCommunications[type];
				return main_core.Type.isArray(items) && items.length > 0;
			},
			getCommunicationItems(type) {
				const items = this.currentCommunications[type];
				return main_core.Type.isArray(items) ? items : [];
			},
			getButtonClassName(type, isAvailable) {
				const baseClass = `crm-timeline__client-communication --${type}`.toLowerCase();
				return isAvailable ? `${baseClass} crm-timeline__client-communication-available` : baseClass;
			},
			onPhoneClick(event) {
				if (!this.hasPhone) {
					return;
				}
				if (this.phoneItems.length === 1) {
					this.makeCall(this.phoneItems[0].value);
					return;
				}
				this.showCommunicationMenu(event.target, this.phoneItems, CommunicationType.PHONE);
			},
			onEmailClick(event) {
				if (!this.hasEmail) {
					return;
				}
				if (this.emailItems.length === 1) {
					this.createEmail(this.emailItems[0].value);
					return;
				}
				this.showCommunicationMenu(event.target, this.emailItems, CommunicationType.EMAIL);
			},
			onChatClick(event) {
				if (!this.hasIM) {
					return;
				}
				if (this.imItems.length === 1) {
					this.openChat(this.imItems[0].value);
					return;
				}
				this.showCommunicationMenu(event.target, this.imItems, CommunicationType.IM);
			},
			showCommunicationMenu(anchor, items, type) {
				let menu = null;
				const iconMap = {
					PHONE: ui_iconSet_api_core.Outline.CALL_BACK,
					EMAIL: ui_iconSet_api_core.Outline.MAIL,
					IM: ui_iconSet_api_core.Outline.CHATS
				};
				const menuItems = items.map(item => {
					const value = item.valueFormatted || item.value;
					return {
						title: value,
						subtitle: item.complexName || '',
						design: 'accent-1',
						icon: iconMap[type],
						onClick: () => {
							menu.close();
							this.handleMenuItemClick(item.value, type);
						}
					};
				});
				const createMenu = (communicationType, communicationItems) => {
					return new ui_system_menu.Menu({
						id: `crm-timeline-client-communication-menu-${communicationType}-${Math.random().toString()}`,
						animation: 'fading-slide',
						bindElement: anchor,
						autoHide: true,
						angle: true,
						cacheable: false,
						offsetTop: 5,
						offsetLeft: 10,
						items: communicationItems
					});
				};
				if (Object.values(CommunicationType).includes(type)) {
					menu = createMenu(type, menuItems);
				}
				menu?.show();
			},
			handleMenuItemClick(value, type) {
				const handlers = {
					[CommunicationType.PHONE]: v => this.makeCall(v),
					[CommunicationType.EMAIL]: v => this.createEmail(v),
					[CommunicationType.IM]: v => this.openChat(v)
				};
				handlers[type]?.(value);
			},
			makeCall(phone) {
				const params = {
					ENTITY_TYPE_NAME: this.getEntityTypeName(this.entityTypeId),
					ENTITY_ID: this.entityId,
					AUTO_FOLD: true
				};
				if (this.ownerTypeId !== this.entityTypeId || this.ownerId !== this.entityId) {
					params.BINDINGS = [{
						OWNER_TYPE_NAME: this.getEntityTypeName(this.ownerTypeId),
						OWNER_ID: this.ownerId
					}];
				}
				main_core.Runtime.loadExtension('im.public').then(exports => {
					exports.Messenger.startPhoneCall(phone, params);
				}).catch(exception => {
					console.error('Error loading "im.public":', exception);
				});
			},
			createEmail(email) {
				BX.CrmActivityEditor.addEmail({
					ownerID: this.ownerId,
					ownerType: this.getEntityTypeName(this.ownerTypeId),
					communicationsLoaded: true,
					communications: [{
						type: 'EMAIL',
						entityType: this.getEntityTypeName(this.entityTypeId),
						entityId: this.entityId,
						value: email
					}]
				});
			},
			openChat(messengerValue) {
				main_core.Runtime.loadExtension('im.public.iframe').then(exports => {
					exports.Messenger.openLines(messengerValue);
				}).catch(exception => {
					console.error('Error loading "im.public.iframe":', exception);
				});
			},
			getEntityTypeName(typeId) {
				return BX.CrmEntityType.resolveName(typeId);
			}
		},
		// language=Vue
		template: `
		<span class="crm-timeline__client-communication-wrapper">
			<a 
				:class="phoneClassName"
				@click="onPhoneClick"
				title="Phone"
			></a>
			<a 
				:class="emailClassName"
				@click="onEmailClick"
				title="Email"
			></a>
			<a 
				:class="imClassName"
				@click="onChatClick"
				title="Messenger"
			></a>
		</span>
	`
	};

	let ClientMark$1 = class ClientMark {
		static POSITIVE = 'positive';
		static NEUTRAL = 'neutral';
		static NEGATIVE = 'negative';
	};

	// @vue/component
	const ClientMark = {
		components: {
			BText: ui_system_typography_vue.Text
		},
		props: {
			mark: {
				type: String,
				default: ClientMark$1.POSITIVE,
				validator: value => Object.values(ClientMark$1).includes(value)
			},
			text: {
				type: String,
				default: ''
			}
		},
		computed: {
			clientMarkStyle() {
				const map = {
					[ClientMark$1.POSITIVE]: 'crm-timeline__content_color-tinted-success',
					[ClientMark$1.NEUTRAL]: 'crm-timeline__content_color-tinted-warning',
					[ClientMark$1.NEGATIVE]: 'crm-timeline__content_color-tinted-alert'
				};
				return map[this.mark] || '';
			}
		},
		// language=Vue
		template: `
		<BText
			size="xs"
			tag="div"
			:className="clientMarkStyle"
		><span v-html="text"></span></BText>
	`
	};

	class EditableDescriptionAiStatus {
		static NONE = '';
		static SUCCESS = 'success';
		static IN_PROGRESS = 'in_progress';
	}

	const Loader = {
		mounted() {
			this.renderLottieAnimation();
		},
		methods: {
			renderLottieAnimation() {
				const mainAnimation = ui_lottie.Lottie.loadAnimation({
					path: this.getAnimationPath(),
					container: this.$refs.lottie,
					renderer: 'svg',
					loop: true,
					autoplay: true
				});
				mainAnimation.setSpeed(0.75);
				return this.$refs.lottie.root;
			},
			getAnimationPath() {
				return '/bitrix/js/crm/timeline/item/src/components/content-blocks/internal/copilot/lottie/loader.json';
			}
		},
		template: `
		<div ref="lottie" class="crm-timeline-block-internal-copilot-loader__lottie"></div>
	`
	};

	var CopilotHeader = {
		components: {
			Loader
		},
		props: {
			status: {
				type: String,
				required: true,
				validator: value => {
					return [EditableDescriptionAiStatus.NONE, EditableDescriptionAiStatus.SUCCESS, EditableDescriptionAiStatus.IN_PROGRESS].includes(value);
				}
			}
		},
		computed: {
			text() {
				if (this.status === EditableDescriptionAiStatus.IN_PROGRESS) {
					return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_EDITABLE_DESCRIPTION_COPILOT_HEADER_PENDING', crm_ai_nameService.NameService.copilotNameReplacement());
				}
				if (this.status === EditableDescriptionAiStatus.SUCCESS) {
					return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_EDITABLE_DESCRIPTION_COPILOT_HEADER', crm_ai_nameService.NameService.copilotNameReplacement());
				}
				return '';
			},
			isAnimated() {
				return this.status === EditableDescriptionAiStatus.IN_PROGRESS;
			},
			className() {
				return ['crm-timeline-block-internal-copilot-header', {
					'--animated': this.status === EditableDescriptionAiStatus.IN_PROGRESS
				}];
			}
		},
		template: `
		<div :class="className">
			<div class="crm-timeline-block-internal-copilot-header-icon">
				<Loader v-if="isAnimated"></Loader>
			</div>
			<div class="crm-timeline-block-internal-copilot-header_text">{{ text }}</div>
			<div
				v-if="isAnimated"
				class="crm-timeline-block-internal-copilot-header_stage"
			>
				<div class="crm-timeline-block-internal-copilot-header_dot-flashing"></div>
			</div>
		</div>
	`
	};

	class EditableDescriptionBackgroundColor {
		static YELLOW = 'yellow';
		static WHITE = 'white';
	}

	class EditableDescriptionHeight {
		static SHORT = 'short';
		static LONG = 'long';
	}

	const EditableDescription = {
		components: {
			Button,
			CopilotHeader,
			TextEditorComponent: ui_textEditor.TextEditorComponent,
			HtmlFormatterComponent: ui_bbcode_formatter_htmlFormatter.HtmlFormatterComponent
		},
		props: {
			headerText: {
				type: String,
				default: ''
			},
			text: {
				type: String,
				default: ''
			},
			saveAction: {
				type: Object,
				default: null
			},
			editable: {
				type: Boolean,
				default: true
			},
			copied: {
				type: Boolean,
				default: false
			},
			height: {
				type: String,
				default: EditableDescriptionHeight.SHORT
			},
			backgroundColor: {
				type: String,
				default: ''
			},
			copilotStatus: {
				type: String,
				default: EditableDescriptionAiStatus.NONE
			},
			copilotSettings: {
				type: Object,
				default: []
			}
		},
		beforeCreate() {
			this.textEditor = null;
		},
		data() {
			return {
				isEdit: false,
				isSaving: false,
				isLongText: false,
				isCollapsed: false,
				bbcode: this.text,
				isContentEmpty: main_core.Type.isString(this.text) && this.text.trim() === '',
				currentCopilotStatus: this.copilotStatus,
				currentHeaderText: this.headerText
			};
		},
		inject: ['isReadOnly', 'isLogMessage'],
		computed: {
			className() {
				return ['crm-timeline__editable-text', [String(this.heightClassnameModifier), String(this.bgColorClassnameModifier)], {
					'--is-read-only': this.isLogMessage,
					'--is-edit': this.isEdit,
					'--is-long': this.isLongText,
					'--is-expanded': this.isCollapsed || !this.isLongText,
					'--copiloted': !this.isEdit && this.currentCopilotStatus !== EditableDescriptionAiStatus.NONE
				}];
			},
			textClassName() {
				return ['crm-timeline__editable-text_text', {
					'--hidden': this.currentCopilotStatus === EditableDescriptionAiStatus.IN_PROGRESS
				}];
			},
			heightClassnameModifier() {
				switch (this.height) {
					case EditableDescriptionHeight.LONG:
						return '--height-long';
					case EditableDescriptionHeight.SHORT:
						return '--height-short';
					default:
						return '--height-short';
				}
			},
			bgColorClassnameModifier() {
				switch (this.backgroundColor) {
					case EditableDescriptionBackgroundColor.YELLOW:
						return '--bg-color-yellow';
					case EditableDescriptionBackgroundColor.WHITE:
						return '--bg-color-white';
					default:
						return '';
				}
			},
			isEditable() {
				return this.editable && this.saveAction && !this.isReadOnly;
			},
			isCopied() {
				return !this.isEdit && this.copied;
			},
			saveTextButtonProps() {
				return {
					state: this.saveTextButtonState,
					type: ButtonType.PRIMARY,
					title: this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_EDITABLE_DESCRIPTION_SAVE')
				};
			},
			cancelEditingButtonProps() {
				return {
					type: ButtonType.LIGHT,
					title: this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_EDITABLE_DESCRIPTION_CANCEL'),
					state: this.isSaving ? ButtonState.DISABLED : ButtonState.DEFAULT
				};
			},
			saveTextButtonState() {
				if (this.isContentEmpty) {
					return ButtonState.DISABLED;
				}
				if (this.isSaving) {
					return ButtonState.DISABLED;
				}
				return ButtonState.DEFAULT;
			},
			expandButtonText() {
				return this.isCollapsed ? this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_EDITABLE_DESCRIPTION_HIDE_MSGVER_1') : this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_EDITABLE_DESCRIPTION_SHOW_MSGVER_1');
			},
			isEditButtonVisible() {
				return !(this.isReadOnly || this.isEdit);
			}
		},
		methods: {
			startEditing() {
				this.isEdit = true;
				this.isCollapsed = true;
				this.$nextTick(() => {
					this.getTextEditor().focus(null, {
						defaultSelection: 'rootEnd'
					});
				});
				this.emitEvent('EditableDescription:StartEdit');
			},
			emitEvent(eventName) {
				const action = new Action({
					type: 'jsEvent',
					value: eventName
				});
				void action.execute(this);
			},
			adjustHeight(elem) {
				main_core.Dom.style(elem, 'height', 0);
				main_core.Dom.style(elem, 'height', `${elem.scrollHeight}px`);
			},
			saveText() {
				if (this.saveTextButtonState === ButtonState.DISABLED || this.saveTextButtonState === ButtonState.LOADING || !this.isEdit) {
					return;
				}
				const encodedTrimText = this.getTextEditor().getText().trim();
				if (encodedTrimText === this.bbcode) {
					this.isEdit = false;
					this.emitEvent('EditableDescription:FinishEdit');
					return;
				}
				this.isSaving = true;

				// eslint-disable-next-line promise/catch-or-return
				this.executeSaveAction(encodedTrimText).then(() => {
					this.isEdit = false;
					this.bbcode = encodedTrimText;
					this.$nextTick(() => {
						this.isLongText = this.checkIsLongText();
					});
					this.emitEvent('EditableDescription:FinishEdit');
				}).finally(() => {
					this.isSaving = false;
				});
			},
			executeSaveAction(text) {
				if (!this.saveAction) {
					return;
				}

				// to avoid unintended props mutation
				const actionDescription = main_core.Runtime.clone(this.saveAction);
				actionDescription.actionParams ??= {};
				actionDescription.actionParams.value = text;
				const action = new Action(actionDescription);

				// eslint-disable-next-line consistent-return
				return action.execute(this);
			},
			cancelEditing() {
				if (!this.isEdit || this.isSaving) {
					return;
				}
				this.isEdit = false;
				this.emitEvent('EditableDescription:FinishEdit');
			},
			clearText() {
				if (this.isSaving) {
					return;
				}
				this.getTextEditor().clear();
				this.getTextEditor().focus(null, {
					defaultSelection: 'rootEnd'
				});
			},
			copyText() {
				const selection = window.getSelection();
				selection.removeAllRanges();
				const range = document.createRange();
				const referenceNode = this.$refs.text;
				range.selectNodeContents(referenceNode);
				selection.addRange(range);
				let isSuccess = false;
				try {
					isSuccess = document.execCommand('copy');
				} catch {
					// just in case
				}
				selection.removeAllRanges();
				if (isSuccess) {
					new main_popup.Popup({
						id: `copyTextHint_${main_core.Text.getRandom(8)}`,
						content: this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_TEXT_IS_COPIED'),
						bindElement: this.$refs.copyTextBtn,
						darkMode: true,
						autoHide: true,
						events: {
							onAfterPopupShow() {
								setTimeout(() => {
									this.close();
								}, 2000);
							}
						}
					}).show();
				}
			},
			toggleIsCollapsed() {
				this.isCollapsed = !this.isCollapsed;
			},
			checkIsLongText() {
				const textBlock = this.$refs.text;
				if (!textBlock) {
					return false;
				}
				const textBlockMaxHeightStyle = window.getComputedStyle(textBlock).getPropertyValue('--crm-timeline__editable-text_max-height');
				const textBlockMaxHeight = parseFloat(textBlockMaxHeightStyle.slice(0, -2));
				const parentComputedStyles = this.$refs.rootElement ? window.getComputedStyle(this.$refs.rootElement) : {};

				// eslint-disable-next-line no-unsafe-optional-chaining
				const parentHeight = this.$refs.rootElement?.offsetHeight - parseFloat(parentComputedStyles.paddingTop) - parseFloat(parentComputedStyles.paddingBottom);
				return parentHeight > textBlockMaxHeight;
			},
			isInViewport() {
				const rect = this.$el.getBoundingClientRect();
				return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
			},
			getTextEditor() {
				if (this.textEditor !== null) {
					return this.textEditor;
				}
				this.textEditor = new ui_textEditor.BasicEditor({
					removePlugins: ['BlockToolbar'],
					maxHeight: 600,
					content: this.bbcode,
					paragraphPlaceholder: this.$Bitrix.Loc.getMessage(main_core.Type.isPlainObject(this.copilotSettings) ? 'CRM_TIMELINE_ITEM_EDITABLE_DESCRIPTION_PLACEHOLDER_WITH_COPILOT' : null, crm_ai_nameService.NameService.copilotNameReplacement()),
					toolbar: [],
					floatingToolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'link', 'copilot'],
					visualOptions: {
						colorBackground: 'transparent',
						borderWidth: '0px',
						blockSpaceInline: '0px',
						blockSpaceStack: '0px'
					},
					copilot: {
						copilotOptions: main_core.Type.isPlainObject(this.copilotSettings) ? this.copilotSettings : null,
						triggerBySpace: true
					},
					events: {
						onMetaEnter: () => {
							this.saveText();
						},
						onEscape: () => {
							this.cancelEditing();
						},
						onEmptyContentToggle: event => {
							this.isContentEmpty = event.getData().isEmpty;
						}
					}
				});
				return this.textEditor;
			},
			getHeaderText() {
				return this.currentHeaderText;
			},
			setHeaderText(headerText) {
				this.currentHeaderText = headerText;
				void this.$nextTick(() => {
					this.isLongText = this.checkIsLongText();
				});
			},
			setCopilotStatus(status) {
				this.currentCopilotStatus = status;
				void this.$nextTick(() => {
					this.isLongText = this.checkIsLongText();
				});
			}
		},
		watch: {
			text(newTextValue) {
				this.bbcode = newTextValue;
				void this.$nextTick(() => {
					this.isLongText = this.checkIsLongText();
				});
			},
			copilotStatus(newStatus) {
				this.currentCopilotStatus = newStatus;
			},
			headerText(newHeaderText) {
				this.currentHeaderText = newHeaderText;
			},
			isCollapsed(isCollapsed) {
				if (isCollapsed === false && this.isInViewport() === false) {
					requestAnimationFrame(() => {
						this.$el.scrollIntoView({
							behavior: 'smooth',
							block: 'center'
						});
					});
				}
			},
			isSaving(value) {
				if (this.textEditor !== null)
					// CommentContent uses this method as well
					{
						this.getTextEditor().setEditable(!value);
					}
			},
			isEdit(value) {
				if (value === false && this.textEditor !== null) {
					this.textEditor.destroy();
					this.textEditor = null;
				}
			}
		},
		mounted() {
			void this.$nextTick(() => {
				this.isLongText = this.checkIsLongText();
			});
		},
		template: `
		<div class="crm-timeline__editable-text_wrapper">
			<div ref="rootElement" :class="className">
				<button
					v-if="this.isCopied"
					ref="copyTextBtn"
					@click="copyText"
					class="crm-timeline__text_copy-btn"
				>
					<i class="crm-timeline__editable-text_fixed-icon --copy"></i>
				</button>
				<button
					v-if="isEdit && isEditable"
					:disabled="isSaving"
					@click="clearText"
					class="crm-timeline__editable-text_clear-btn"
				>
					<i class="crm-timeline__editable-text_fixed-icon --clear"></i>
				</button>
				<button
					v-if="!isEdit && isEditable && isEditButtonVisible"
					:disabled="isSaving"
					@click="startEditing"
					class="crm-timeline__editable-text_edit-btn"
				>
					<i class="crm-timeline__editable-text_edit-icon"></i>
				</button>
				<div class="crm-timeline__editable-text_inner">
					<div
						v-if="!isEditable && currentHeaderText !== ''"
						v-html="currentHeaderText"
						class="crm-timeline__editable-text_header-text"
					>
					</div>
					<CopilotHeader 
						ref="copilotHeader"
						v-if="currentCopilotStatus !== ''"
						:status="currentCopilotStatus"
						class="crm-timeline__editable-text-copilot-header"
					></CopilotHeader>
					<div class="crm-timeline__editable-text_content">
						<TextEditorComponent
							v-if="isEdit"
							:editor-instance="this.getTextEditor()"
						/>
						<span
							v-else
							ref="text"
							:class="textClassName"
						>
							<HtmlFormatterComponent :bbcode="bbcode" />
						</span>
					</div>
					<div
						v-if="isEdit"
						class="crm-timeline__editable-text_actions"
					>
						<div class="crm-timeline__editable-text_action">
							<Button
								v-bind="saveTextButtonProps"
								@click="saveText"
							/>
						</div>
						<div class="crm-timeline__editable-text_action">
							<Button
								v-bind="cancelEditingButtonProps"
								@click="cancelEditing"
							/>
						</div>
					</div>
				</div>
				<button
					v-if="isLongText && !isEdit"
					@click="toggleIsCollapsed"
					class="crm-timeline__editable-text_collapse-btn"
				>
					{{ expandButtonText }}
				</button>
			</div>
		</div>
	`
	};

	const TYPE_LOAD_FILES_BLOCK = 1;
	const TYPE_LOAD_TEXT_CONTENT = 2;

	/**
	 * @extends EditableDescription
	 */
	var CommentContent = ui_vue3.BitrixVue.cloneComponent(EditableDescription, {
		props: {
			filesCount: {
				type: Number,
				required: false,
				default: 0
			},
			hasInlineFiles: {
				type: Boolean,
				required: false,
				default: false
			},
			loadAction: {
				type: Object,
				required: false,
				default: () => ({})
			}
		},
		data() {
			return {
				...this.parentData(),
				value: this.text,
				oldValue: this.text,
				isTextLoaded: false,
				isTextChanged: false,
				isMoving: false,
				isFilesBlockDisplayed: this.filesCount > 0,
				filesHtmlBlock: null
			};
		},
		computed: {
			textWrapperClassName() {
				return ['crm-timeline__editable-text_content', {
					'--is-editor-loaded': this.isEdit
				}];
			}
		},
		methods: {
			startEditing() {
				this.isEdit = true;
				this.isCollapsed = true;
				this.$nextTick(() => {
					this.editor.show(this.$refs.editor);
				});
				this.emitEvent('Comment:StartEdit');
			},
			cancelEditing() {
				if (!this.isEdit || this.isSaving) {
					return;
				}
				this.value = this.oldValue;
				this.isEdit = false;
				if (this.filesHtmlBlock) {
					void main_core.Runtime.html(this.$refs.files, this.filesHtmlBlock).then(() => {
						this.registerImages(this.$refs.files);
						BX.LazyLoad.showImages();
						this.emitEvent('Comment:FinishEdit');
					});
				} else {
					this.emitEvent('Comment:FinishEdit');
				}
			},
			toggleIsCollapsed() {
				this.parentToggleIsCollapsed();
				if (!this.isTextLoaded) {
					this.executeLoadAction(TYPE_LOAD_TEXT_CONTENT, this.$refs.text);
				}
			},
			checkIsLongText() {
				const textBlock = this.$refs.text;
				if (!textBlock) {
					return false;
				}
				const textBlockMaxHeightStyle = window.getComputedStyle(textBlock).getPropertyValue('--crm-timeline__editable-text_max-height');
				const textBlockMaxHeight = parseFloat(textBlockMaxHeightStyle.slice(0, -2));
				const root = this.filesCount > 0 ? this.$refs.rootElement : this.$refs.rootWrapperElement;
				const parentComputedStyles = window.getComputedStyle(root);
				const parentHeight = root.offsetHeight - parseFloat(parentComputedStyles.paddingTop) - parseFloat(parentComputedStyles.paddingBottom);
				const isLongText = parentHeight > textBlockMaxHeight;
				return isLongText || this.hasInlineFiles;
			},
			saveContent() {
				const isSaveDisabled = this.saveTextButtonState === ButtonState.LOADING || !this.isEdit || !this.saveAction;
				if (isSaveDisabled) {
					return;
				}
				const content = this.editor.getContent();
				if (!main_core.Type.isStringFilled(content)) {
					return;
				}
				const htmlContent = this.editor.getHtmlContent();
				const attachmentList = this.editor.getAttachments();
				const attachmentAllowEditOptions = this.editor.getAttachmentsAllowEditOptions(attachmentList);
				this.isSaving = true;
				void this.executeSaveAction(content, attachmentList, attachmentAllowEditOptions).then(() => {
					this.isEdit = false;
					if (!this.isTextChanged) {
						this.oldValue = htmlContent;
						this.value = htmlContent;
					}
					this.$nextTick(() => {
						this.isLongText = this.checkIsLongText();
						this.executeLoadAction(TYPE_LOAD_FILES_BLOCK, this.$refs.files);
					});
					this.emitEvent('Comment:FinishEdit');
				}).finally(() => {
					this.isSaving = false;
				});
			},
			executeSaveAction(content, attachmentList, attachmentAllowEditOptions) {
				// to avoid unintended props mutation
				const actionDescription = main_core.Runtime.clone(this.saveAction);
				actionDescription.actionParams ??= {};
				actionDescription.actionParams.id = actionDescription.actionParams.commentId;
				actionDescription.actionParams.fields = {
					COMMENT: content,
					ATTACHMENTS: attachmentList
				};
				if (Object.keys(attachmentAllowEditOptions).length > 0) {
					actionDescription.actionParams.CRM_TIMELINE_DISK_ATTACHED_OBJECT_ALLOW_EDIT = attachmentAllowEditOptions;
				}
				const action = new Action(actionDescription);
				return action.execute(this);
			},
			executeLoadAction(type, node) {
				if (this.filesCount === 0) {
					this.filesHtmlBlock = null;
					return;
				}
				if (!main_core.Type.isDomNode(node) || !this.loadAction) {
					return;
				}
				const actionDescription = main_core.Runtime.clone(this.loadAction);
				actionDescription.actionParams ??= {};
				actionDescription.actionParams.options = type;
				const action = new Action(actionDescription);
				this.showLoader(true);
				action.execute(this).then(response => {
					if (type === TYPE_LOAD_FILES_BLOCK) {
						this.filesHtmlBlock = response.data.html;
					} else if (type === TYPE_LOAD_TEXT_CONTENT) {
						this.isTextLoaded = true;
					}
					void main_core.Runtime.html(node, response.data.html).then(() => {
						this.registerImages(node);
						BX.LazyLoad.showImages();
						this.showLoader(false);
					});
				}).catch(() => {
					if (type === TYPE_LOAD_FILES_BLOCK) {
						this.filesHtmlBlock = null;
					} else if (type === TYPE_LOAD_TEXT_CONTENT) {
						this.isTextLoaded = false;
					}
					this.showLoader(false);
				});
			},
			registerImages(node) {
				if (!main_core.Type.isDomNode(node)) {
					return;
				}
				const idsList = [];
				const commentImages = node.querySelectorAll('[data-viewer-type="image"]');
				const commentImagesLength = commentImages.length;
				if (commentImagesLength > 0) {
					for (let i = 0; i < commentImagesLength; ++i) {
						if (main_core.Type.isDomNode(commentImages[i])) {
							commentImages[i].id += BX.util.getRandomString(4);
							idsList.push(commentImages[i].id);
						}
					}
					if (idsList.length > 0) {
						BX.LazyLoad.registerImages(idsList, null, {
							dataSrcName: 'thumbSrc'
						});
					}
				}
				BX.LazyLoad.registerImages(idsList, null, {
					dataSrcName: 'thumbSrc'
				});
			},
			showLoader(showLoader) {
				if (showLoader) {
					if (!this.loader) {
						this.loader = new main_loader.Loader({
							size: 20,
							mode: 'inline'
						});
					}
					this.loader.show(this.$refs.files);
				} else if (this.loader) {
					this.loader.hide();
				}
			},
			createEditor() {
				this.editor = new crm_timeline_editors_commentEditor.CommentEditor(this.loadAction.actionParams.commentId);
			},
			setIsMoving(flag = true) {
				this.isMoving = flag;
			},
			setIsFilesBlockDisplayed(flag = true) {
				this.isFilesBlockDisplayed = flag;
				if (this.filesHtmlBlock) {
					void main_core.Runtime.html(this.$refs.files, this.filesHtmlBlock).then(() => {
						this.registerImages(this.$refs.files);
						BX.LazyLoad.showImages();
					});
				}
			}
		},
		watch: {
			text(newValue) {
				this.value = newValue;
				this.oldValue = newValue;
				this.isTextChanged = true;
				this.$nextTick(() => {
					this.isLongText = this.checkIsLongText();
					this.executeLoadAction(TYPE_LOAD_FILES_BLOCK, this.$refs.files);
				});
			},
			value(newValue) {
				if (!this.isEdit) {
					return;
				}
				this.value = newValue;
				this.oldValue = newValue;
			},
			filesCount(newValue) {
				if (this.isMoving) {
					return;
				}
				this.isFilesBlockDisplayed = newValue > 0;
				this.$nextTick(() => {
					this.executeLoadAction(TYPE_LOAD_FILES_BLOCK, this.$refs.files);
				});
			}
		},
		mounted() {
			this.createEditor();
			this.$nextTick(() => {
				this.isLongText = this.checkIsLongText();
				this.executeLoadAction(TYPE_LOAD_FILES_BLOCK, this.$refs.files);
			});
		},
		updated() {
			this.createEditor();
		},
		template: `
		<div ref="rootWrapperElement" class="crm-timeline__editable-text_wrapper --comment">
			<div ref="rootElement" :class="className">
				<button
					v-if="isLongText && !isEdit && isEditable && isEditButtonVisible"
					:disabled="isSaving"
					@click="startEditing"
					class="crm-timeline__editable-text_edit-btn"
				>
					<i class="crm-timeline__editable-text_edit-icon"></i>
				</button>
				<div class="crm-timeline__editable-text_inner">
					<div :class="textWrapperClassName">
						<div
							v-if="isEdit"
							ref="editor"
							:disabled="!isEdit || isSaving"
							class="crm-timeline__editable-text_editor"
						></div>
						<span 
							v-else
							ref="text"
							class="crm-timeline__editable-text_text"
							v-html="value"
						>
						</span>
						<span
							v-if="!isEdit && !isLongText && isEditable && isEditButtonVisible"
							@click="startEditing"
							class="crm-timeline__editable-text_text-edit-icon"
						>
							<span class="crm-timeline__editable-text_edit-icon"></span>
						</span>
					</div>
					<div
						v-if="isEdit"
						class="crm-timeline__editable-text_actions"
					>
						<div class="crm-timeline__editable-text_action">
							<Button
								v-bind="saveTextButtonProps"
								@click="saveContent"
							/>
						</div>
						<div class="crm-timeline__editable-text_action">
							<Button
								v-bind="cancelEditingButtonProps"
								@click="cancelEditing"
							/>
						</div>
					</div>
				</div>
				<button
					v-if="isLongText && !isEdit"
					@click="toggleIsCollapsed"
					class="crm-timeline__editable-text_collapse-btn"
				>
					{{ expandButtonText }}
				</button>
			</div>
			<div
				v-if="!isEdit && isFilesBlockDisplayed"
				ref="files"
				class="crm-timeline__comment_files_wrapper"
				:class="{'--long-comment': isLongText}"
				v-html="filesHtmlBlock"
			>
			</div>
		</div>
	`
	});

	const STATE_LOADING = 'loading';
	const STATE_PROCESSED = 'processed';
	const STATE_UNPROCESSED = 'unprocessed';
	const CallScoringPill = {
		props: {
			title: {
				type: String,
				required: false,
				default: ''
			},
			value: {
				type: String,
				required: false,
				default: ''
			},
			state: {
				type: String,
				required: false,
				default: STATE_UNPROCESSED
			},
			action: Object | null
		},
		inject: ['isReadOnly'],
		computed: {
			className() {
				return ['crm-timeline__call-scoring-pill', {
					'--readonly': this.isPillReadonly
				}];
			},
			renderValue() {
				switch (this.state) {
					case STATE_LOADING:
						return '<span class="loader"></span>';
					case STATE_PROCESSED:
						return main_core.Text.encode(this.value);
					case STATE_UNPROCESSED:
					default:
						return '<span class="arrow">&nbsp;</span>';
				}
			},
			isPillReadonly() {
				return this.isReadOnly || !this.action;
			}
		},
		methods: {
			executeAction() {
				if (this.isPillReadonly) {
					return;
				}
				const action = new Action(this.action);
				void action.execute(this);
			}
		},
		template: `
		<div
			:class='className'
			@click='executeAction'
		>
			<div class='crm-timeline__call-scoring-pill-left'>{{ this.title }}</div>
			<div class='crm-timeline__call-scoring-pill-separator'></div>
			<div class='crm-timeline__call-scoring-pill-right' v-html='renderValue'></div>
		</div>
	`
	};

	const CHART_WIDTH = 65;
	const CHART_LINE_SIZE = 9;

	// @vue/component
	const CallScoringV2 = {
		props: {
			scriptTitle: {
				type: String,
				required: true
			},
			score: {
				type: Number,
				required: true
			},
			scoreDescription: {
				type: String,
				required: true
			},
			scoreLowBorder: {
				type: Number,
				required: true
			},
			scoreHighBorder: {
				type: Number,
				required: true
			},
			action: {
				type: [Object, null],
				default: null
			}
		},
		chart: null,
		computed: {
			integerScore() {
				return main_core.Text.toInteger(this.score);
			},
			chartColor() {
				const highBorder = main_core.Text.toInteger(this.scoreHighBorder);
				if (this.integerScore >= highBorder) {
					return ui_progressround.ProgressRound.Color.SUCCESS;
				}
				const lowBorder = main_core.Text.toInteger(this.scoreLowBorder);
				if (this.integerScore <= lowBorder) {
					return ui_progressround.ProgressRound.Color.DANGER;
				}
				return ui_progressround.ProgressRound.Color.PRIMARY;
			}
		},
		watch: {
			score() {
				this.updateChart();
			}
		},
		mounted() {
			this.createChart();
		},
		beforeUnmount() {
			if (this.chart) {
				this.chart.destroy();
			}
		},
		methods: {
			createChart() {
				this.chart = new ui_progressround.ProgressRound({
					width: CHART_WIDTH,
					lineSize: CHART_LINE_SIZE,
					statusType: ui_progressround.ProgressRound.Status.INCIRCLE,
					value: this.integerScore,
					color: this.chartColor
				});
				this.chart.renderTo(this.$refs.chartContainer);
			},
			updateChart() {
				if (!this.chart) {
					this.createChart();
					return;
				}
				this.chart.setColor(this.chartColor);
				this.chart.update(this.integerScore);
			},
			editScript() {
				const assessmentSettingsId = this.action?.actionParams?.assessmentSettingsId;
				if (!main_core.Type.isInteger(assessmentSettingsId)) {
					return;
				}
				crm_router.Router.openSlider(`/crm/copilot-call-assessment/details/${assessmentSettingsId}/`, {
					width: 700,
					cacheable: false
				});
			},
			showDetails() {
				if (main_core.Type.isObject(this.action)) {
					void new Action(this.action).execute(this);
				}
			}
		},
		// language=Vue
		template: `
		<div class="crm-timeline__call-scoring-v2">
			<div 
				class="crm-timeline__call-scoring-v2-chart"
				ref="chartContainer"
			></div>
			<div class="crm-timeline__call-scoring-v2-content">
				<div class="body">
					<div class="script-layout">
						<div class="script-layout-header">
							{{ $Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_CALL_SCORING_SCRIPT_TITLE') }}
						</div>
						<div 
							class="script-layout-title"
							@click.prevent="editScript"
						>{{ scriptTitle }}</div>
					</div>
					<div>
						<span class="summary-text">{{ scoreDescription }}</span>
						<span
							class="details-link"
							@click.prevent="showDetails"
						>
							{{ $Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_CALL_SCORING_DETAILS') }}
						</span>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const CallScoring = {
		props: {
			userName: String,
			userAvatarUrl: String,
			scoringData: Object | null,
			action: Object | null
		},
		inject: ['isReadOnly'],
		computed: {
			className() {
				const assessment = main_core.Text.toInteger(this.scoringData?.ASSESSMENT);
				const highBorder = main_core.Text.toInteger(this.scoringData?.HIGH_BORDER);
				const lowBorder = main_core.Text.toInteger(this.scoringData?.LOW_BORDER);
				return {
					'crm-timeline__call-scoring': true,
					'--success': assessment >= highBorder,
					'--failed': assessment <= lowBorder
				};
			},
			assessmentScriptClassName() {
				return ['crm-timeline__call-scoring-assessment-script', {
					'--readonly': this.isContentReadonly
				}];
			},
			assessmentPillClassName() {
				return ['crm-timeline__call-scoring-assessment-pill', {
					'--readonly': this.isContentReadonly
				}];
			},
			isContentReadonly() {
				return this.isReadOnly || !this.action;
			},
			renderUserAvatarElement() {
				return new ui_avatar.AvatarRoundGuest({
					size: 26,
					userName: this.userName,
					userpicPath: this.userAvatarUrl,
					baseColor: '#7fdefc',
					borderColor: '#9dcf00'
				}).getContainer().outerHTML;
			}
		},
		methods: {
			executeAction() {
				if (this.isContentReadonly) {
					return;
				}
				const action = new Action(this.action);
				void action.execute(this);
			}
		},
		template: `
		<div :class='className'>
			<div class='crm-timeline__call-scoring-wrapper'>
				<div class='crm-timeline__call-scoring-responsible'>
					<div class='crm-timeline__call-scoring-title'>
						{{ this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_CALL_SCORING_RESPONSIBLE_TITLE') }}
					</div>
					<div class='crm-timeline__call-scoring-responsible-content'>
						<div class='responsible-user-avatar' v-html="renderUserAvatarElement"></div>
						<div class='responsible-user-name'>{{ this.userName }}</div>
					</div>
				</div>
				<div class='crm-timeline__line-div'></div>
				<div class='crm-timeline__call-scoring-assessment'>
					<div class='crm-timeline__call-scoring-assessment-wrapper'>
						<!--
						<img 
							class='copilot-avatar' 
							src='/bitrix/js/crm/timeline/item/src/images/crm-timelime__copilot-avatar.svg' 
							alt='copilot-avatar'
						>
						-->
						<div
							:class='assessmentPillClassName'
							@click='executeAction'
						>
							<span class="value">{{ this.scoringData?.ASSESSMENT }}</span>
							<div class="percent"></div>
						</div>
						<div class='script-layout'>
							<div class='crm-timeline__call-scoring-title'>
								{{ this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_CALL_SCORING_SCRIPT_TITLE') }}
							</div>
							<div 
								:class='assessmentScriptClassName'
								@click='executeAction'
							>
								{{ this.scoringData?.TITLE }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	class TextColor {
		static GREEN = 'green';
		static PURPLE = 'purple';
		static BASE_0 = 'base-0';
		static BASE_50 = 'base-50';
		static BASE_60 = 'base-60';
		static BASE_70 = 'base-70';
		static BASE_90 = 'base-90';
	}

	class TextWeight {
		static NORMAL = 'normal';
		static MEDIUM = 'medium';
		static BOLD = 'bold';
	}

	class TextSize {
		static XS = 'xs';
		static SM = 'sm';
		static MD = 'md';
	}

	class TextDecoration {
		static NONE = 'none';
		static UNDERLINE = 'underline';
		static DOTTED = 'dotted';
		static DASHED = 'dashed';
	}

	var Text = {
		props: {
			value: String | Number,
			title: {
				type: String,
				required: false,
				default: ''
			},
			color: {
				type: String,
				required: false,
				default: ''
			},
			weight: {
				type: String,
				required: false,
				default: 'normal'
			},
			size: {
				type: String,
				required: false,
				default: 'md'
			},
			multiline: {
				type: Boolean,
				required: false,
				default: false
			},
			decoration: {
				type: String,
				required: false,
				default: ''
			}
		},
		computed: {
			className() {
				return ['crm-timeline__text-block', this.colorClassname, this.weightClassname, this.sizeClassname, this.decorationClassname];
			},
			colorClassname() {
				const upperCaseColorProp = this.color ? this.color.toUpperCase() : '';
				const color = TextColor[upperCaseColorProp] ?? '';
				return `--color-${color}`;
			},
			weightClassname() {
				const upperCaseWeightProp = this.weight ? this.weight.toUpperCase() : '';
				const weight = TextWeight[upperCaseWeightProp] ?? TextWeight.NORMAL;
				return `--weight-${weight}`;
			},
			sizeClassname() {
				const upperCaseSizeProp = this.size ? this.size.toUpperCase() : '';
				const size = TextSize[upperCaseSizeProp] ?? TextSize.SM;
				return `--size-${size}`;
			},
			decorationClassname() {
				const upperCaseDecorationProp = this.decoration ? this.decoration.toUpperCase() : '';
				if (!upperCaseDecorationProp) {
					return '';
				}
				const decoration = TextDecoration[upperCaseDecorationProp] ?? TextDecoration.NONE;
				return `--decoration-${decoration}`;
			},
			encodedText() {
				let text = main_core.Text.encode(this.value);
				if (this.multiline) {
					text = text.replace(/\n/g, '<br />');
				}
				return text;
			}
		},
		template: `
		<span
			:title="title"
			:class="className"
			v-html="encodedText"
		></span>
	`
	};

	var DateBlock = {
		props: {
			withTime: {
				type: Boolean,
				required: false,
				default: true
			},
			format: {
				type: String,
				required: false,
				default: null
			},
			duration: {
				type: Number,
				required: false,
				default: null
			}
		},
		extends: Text,
		methods: {
			getFormattedDate(datetimeConverter) {
				if (this.format) {
					return datetimeConverter.toFormatString(this.format);
				}
				const options = {
					delimiter: ', ',
					withDayOfWeek: true,
					withFullMonth: true
				};
				return this.withTime ? datetimeConverter.toDatetimeString(options) : datetimeConverter.toDateString();
			},
			getDatetimeConverter() {
				return crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.value).toUserTime();
			},
			getDatetimeConverterWithDuration() {
				return crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.value + this.duration).toUserTime();
			}
		},
		computed: {
			encodedText() {
				const converter = this.getDatetimeConverter();
				const dateFrom = this.getFormattedDate(converter);
				if (!main_core.Type.isNumber(this.duration) || this.duration < 0) {
					return main_core.Text.encode(dateFrom);
				}
				const converterWithDuration = this.getDatetimeConverterWithDuration();
				const isSameDay = converter.toDateString() === converterWithDuration.toDateString();
				if (isSameDay) {
					return main_core.Text.encode(dateFrom);
				}
				const dateTo = isSameDay ? converterWithDuration.toTimeString() : this.getFormattedDate(converterWithDuration);
				return main_core.Text.encode(`${dateFrom} - ${dateTo}`);
			}
		},
		template: Text.template
	};

	const DatePillColor = Object.freeze({
		DEFAULT: 'default',
		WARNING: 'warning',
		NONE: 'none'
	});
	const PillStyle = Object.freeze({
		DEFAULT: 'pill',
		INLINE_GROUP: 'pill-inline-group'
	});
	var DatePill = {
		props: {
			value: Number,
			withTime: Boolean,
			duration: {
				type: Number,
				required: false,
				default: null
			},
			backgroundColor: {
				type: String,
				required: false,
				default: DatePillColor.DEFAULT,
				validator(value) {
					return Object.values(DatePillColor).includes(value);
				}
			},
			action: Object | null,
			styleValue: String
		},
		inject: ['isReadOnly'],
		data() {
			return {
				currentTimestamp: this.value,
				initialTimestamp: this.value
			};
		},
		computed: {
			className() {
				return ['crm-timeline__date-pill', `--color-${this.backgroundColor}`, {
					'--readonly': this.isPillReadonly
				}, {
					'--inline-group': this.styleValue === PillStyle.INLINE_GROUP
				}];
			},
			formattedDate() {
				if (!this.currentTimestamp) {
					return null;
				}
				const converterOptions = {
					delimiter: ', ',
					withDayOfWeek: true,
					withFullMonth: true
				};
				const converter = this.getDatetimeConverter();
				const dateFrom = converter.toDatetimeString(converterOptions);
				if (!main_core.Type.isNumber(this.duration) || this.duration <= 0) {
					return dateFrom;
				}
				const converterWithDuration = this.getDatetimeConverterWithDuration();
				const isSameDay = converter.toDateString() === converterWithDuration.toDateString();
				const dateTo = isSameDay ? converterWithDuration.toTimeString() : converterWithDuration.toDatetimeString(converterOptions);
				return `${dateFrom} - ${dateTo}`;
			},
			currentDateInSiteFormat() {
				return main_date.DateTimeFormat.format(this.withTime ? crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat() : crm_timeline_tools.DatetimeConverter.getSiteDateFormat(), this.getDatetimeConverter().getValue());
			},
			calendarParams() {
				return {
					value: this.currentDateInSiteFormat,
					bTime: this.withTime,
					bHideTime: !this.withTime,
					bSetFocus: false
				};
			},
			isPillReadonly() {
				return this.isReadOnly || !this.action;
			}
		},
		watch: {
			value(newDate)
			// update date from push
			{
				this.initialTimestamp = newDate;
				this.currentTimestamp = newDate;
			}
		},
		methods: {
			openCalendar(event) {
				if (this.isPillReadonly) {
					return;
				}

				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
				BX.calendar({
					node: event.target,
					callback_after: newDate => {
						// we assume that user selected time in his timezone
						this.currentTimestamp = main_date.Timezone.UserTime.toUTCTimestamp(newDate);
						this.executeAction();
					},
					...this.calendarParams
				});
			},
			executeAction() {
				if (!this.action) {
					return;
				}
				if (this.currentTimestamp === this.initialTimestamp) {
					return;
				}

				// to avoid unintended props mutation
				const actionDescription = main_core.Runtime.clone(this.action);
				actionDescription.actionParams ??= {};
				actionDescription.actionParams.value = this.currentDateInSiteFormat;
				actionDescription.actionParams.valueTs = this.currentTimestamp;
				const action = new Action(actionDescription);
				action.execute(this);
				this.initialTimestamp = this.currentTimestamp;
				this.$emit('onChange', this.initialTimestamp);
			},
			getDatetimeConverter() {
				return crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.currentTimestamp).toUserTime();
			},
			getDatetimeConverterWithDuration() {
				return crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.currentTimestamp + this.duration).toUserTime();
			}
		},
		template: `
		<span
			:class="className"
			@click="openCalendar"
		>
			<span>
				{{ formattedDate }}
			</span>
			<span class="crm-timeline__date-pill_caret"></span>
		</span>`
	};

	var Link = {
		props: {
			text: String,
			action: Object,
			title: {
				type: String,
				default: ''
			},
			color: {
				type: String,
				default: ''
			},
			bold: {
				type: Boolean,
				default: false
			},
			size: {
				type: String,
				default: 'md'
			},
			decoration: {
				type: String,
				default: ''
			},
			icon: {
				type: String,
				default: ''
			},
			rowLimit: {
				type: Number,
				default: 0
			}
		},
		computed: {
			href() {
				if (!this.action) {
					return null;
				}
				const action = new Action(this.action);
				if (action.isRedirect()) {
					return action.getValue();
				}
				return null;
			},
			linkAttrs() {
				if (!this.action) {
					return {};
				}
				const action = new Action(this.action);
				if (!action.isRedirect()) {
					return {};
				}
				const attrs = {
					href: action.getValue()
				};
				const target = action.getActionParam('target');
				if (target) {
					attrs.target = target;
				}
				return attrs;
			},
			className() {
				return ['crm-timeline__card_link', this.colorClassName, this.boldClassName, this.sizeClassname, this.decorationClassName, this.rowLimitClassName];
			},
			colorClassName() {
				const upperCaseColorProp = this.color ? this.color.toUpperCase() : '';
				const color = TextColor[upperCaseColorProp] ?? '';
				return `--color-${color}`;
			},
			boldClassName() {
				return this.bold ? '--bold' : '';
			},
			sizeClassname() {
				const upperCaseSizeProp = this.size ? this.size.toUpperCase() : '';
				const size = TextSize[upperCaseSizeProp] ?? TextSize.SM;
				return `--size-${size}`;
			},
			decorationClassName() {
				const upperCaseDecorationProp = this.decoration ? this.decoration.toUpperCase() : '';
				if (!upperCaseDecorationProp) {
					return '';
				}
				const decoration = TextDecoration[upperCaseDecorationProp] ?? TextDecoration.NONE;
				return `--decoration-${decoration}`;
			},
			iconClassName() {
				if (!this.icon) {
					return [];
				}
				return ['crm-timeline__card_link_icon', `--code-${this.icon}`];
			},
			rowLimitClassName() {
				return this.rowLimit ? '--limit' : '';
			},
			rowLimitStyle() {
				if (this.rowLimit && this.rowLimit > 0) {
					return {
						'-webkit-line-clamp': this.rowLimit
					};
				}
				return {};
			}
		},
		methods: {
			executeAction() {
				if (this.action) {
					const action = new Action(this.action);
					action.execute(this);
				}
			}
		},
		template: `<a
			v-if="href"
			v-bind="linkAttrs"
			:class="className"
			:title="title"
			:style="rowLimitStyle"
		>{{text}}<span v-if="icon" :class="iconClassName"></span>
		</a>
		<span
			v-else
			@click="executeAction"
			:class="className"
			:title="title"
			:style="rowLimitStyle"
		>{{text}}<span v-if="icon" :class="iconClassName"></span>
		</span>`
	};

	var EditableDate = {
		components: {
			Link
		},
		props: {
			value: Number,
			withTime: Boolean,
			action: Object
		},
		data() {
			return {
				currentDate: this.value,
				initialDate: this.value,
				actionTimeoutId: null
			};
		},
		computed: {
			currentDateObject() {
				return this.currentDate ? new Date(this.currentDate * 1000) : null;
			},
			currentDateInSiteFormat() {
				if (!this.currentDateObject) {
					return null;
				}
				return main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateFormat(), this.currentDateObject);
			},
			textProps() {
				return {
					text: this.currentDateInSiteFormat
				};
			}
		},
		methods: {
			openCalendar(event) {
				this.cancelScheduledActionExecution();

				// eslint-disable-next-line bitrix-rules/no-bx
				BX.calendar({
					node: event.target,
					value: this.currentDateInSiteFormat,
					bTime: this.withTime,
					bHideTime: !this.withTime,
					bSetFocus: false,
					callback_after: newDate => {
						this.currentDate = Math.round(newDate.getTime() / 1000);
						this.scheduleActionExecution();
					}
				});
			},
			scheduleActionExecution() {
				this.cancelScheduledActionExecution();
				this.actionTimeoutId = setTimeout(this.executeAction.bind(this), 3 * 1000);
			},
			cancelScheduledActionExecution() {
				if (this.actionTimeoutId) {
					clearTimeout(this.actionTimeoutId);
					this.actionTimeoutId = null;
				}
			},
			executeAction() {
				if (!this.action) {
					return;
				}
				if (this.currentDate === this.initialDate) {
					return;
				}

				// to avoid unintended props mutation
				const actionDescription = main_core.Runtime.clone(this.action);
				actionDescription.actionParams ??= {};
				actionDescription.actionParams.value = this.currentDateObject;
				const action = new Action(actionDescription);
				action.execute(this);
				this.initialDate = this.currentDate;
			}
		},
		template: `<Link @click="openCalendar" v-bind="textProps"></Link>`
	};

	var EditableText = ui_vue3.BitrixVue.cloneComponent(Text, {
		components: {
			Text
		},
		props: {
			action: Object
		},
		data() {
			return {
				isEdit: false,
				currentValue: this.value,
				initialValue: this.value,
				actionTimeoutId: null
			};
		},
		computed: {
			textProps() {
				return {
					...this.$props,
					value: this.currentValue
				};
			}
		},
		methods: {
			enableEdit() {
				this.cancelScheduledActionExecution();
				this.isEdit = true;
				this.$nextTick(() => {
					this.$refs.input.focus();
				});
			},
			disableEdit() {
				this.isEdit = false;
				this.scheduleActionExecution();
			},
			scheduleActionExecution() {
				this.cancelScheduledActionExecution();
				this.actionTimeoutId = setTimeout(this.executeAction.bind(this), 3 * 1000);
			},
			cancelScheduledActionExecution() {
				if (this.actionTimeoutId) {
					clearTimeout(this.actionTimeoutId);
					this.actionTimeoutId = null;
				}
			},
			executeAction() {
				if (!this.action || this.currentValue === this.initialValue) {
					return;
				}

				// to avoid unintended props mutation
				const actionDescription = main_core.Runtime.clone(this.action);
				actionDescription.actionParams ??= {};
				actionDescription.actionParams.value = this.currentValue;
				const action = new Action(actionDescription);
				action.execute(this);
				this.initialValue = this.currentValue;
			}
		},
		template: `
			<input
				v-if="isEdit"
				ref="input"
				type="text"
				v-model.trim="currentValue"
				@focusout="disableEdit"
			>
			<Text
				v-else
				v-bind="textProps"
				@click="enableEdit"
			/>
		`
	});

	class ErrorType {
		static AI = 'ai';
	}

	const ErrorBlock = {
		props: {
			title: {
				type: String,
				required: true,
				default: ''
			},
			description: {
				type: String,
				required: true,
				default: ''
			},
			closable: {
				type: Boolean,
				required: true,
				default: false
			},
			type: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				isClosable: this.closable
			};
		},
		computed: {
			iconClassname() {
				return {
					'crm-timeline__error-block__header-icon': true,
					'--ai': this.type === ErrorType.AI
				};
			},
			encodedTitle() {
				return main_core.Text.encode(this.title);
			},
			encodedDescription() {
				return main_core.Text.encode(this.description);
			}
		},
		methods: {
			closeBlock() {
				const blockEl = this.$refs.rootElement;
				if (main_core.Type.isDomNode(blockEl)) {
					main_core.Dom.addClass(blockEl, '--hidden');
					setTimeout(() => {
						main_core.Dom.remove(blockEl);
					}, 700);
				}
			}
		},
		template: `
		<div ref="rootElement" class="crm-timeline__error-block_wrapper">
			<div class="crm-timeline__error-block">
				<div class="crm-timeline__error-block__header">
					<div :class="iconClassname"></div>
					<div
						class="crm-timeline__error-block__header-title"
						v-html="encodedTitle"
					></div>
					<button
						v-if="isClosable"
						@click="closeBlock"
						class="crm-timeline__error-block_close-btn"
					></button>
				</div>
				<div
					class="crm-timeline__error-block__description"
					v-html="encodedDescription"
				></div>
			</div>
		</div>
	`
	};

	class LogoType {
		static CALL_AUDIO_PLAY = 'call-play-record';
		static CALL_AUDIO_PAUSE = 'call-pause-record';
	}

	// @vue/component
	const TimelineAudio = crm_audioPlayer.AudioPlayer.getComponent({
		methods: {
			changeLogoIcon(icon) {
				if (!this.$root || !this.$root.getLogo) {
					return;
				}
				const logo = this.$root.getLogo();
				if (!logo) {
					return;
				}
				logo.setIcon(icon);
			},
			audioEventRouterWrapper(eventName, event) {
				this.audioEventRouter(eventName, event);
				if (eventName === 'play') {
					this.changeLogoIcon(LogoType.CALL_AUDIO_PAUSE);
				}
				if (eventName === 'pause') {
					this.changeLogoIcon(LogoType.CALL_AUDIO_PLAY);
				}
			}
		}
	});

	var File = {
		components: {
			TimelineAudio
		},
		props: {
			id: Number,
			text: String,
			href: String,
			size: Number,
			attributes: Object,
			hasAudioPlayer: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		computed: {
			fileExtension() {
				return this.text.split('.').slice(-1)[0] || '';
			},
			titleFirstPart() {
				return this.text.slice(0, -this.titleLastPartSize);
			},
			titleLastPart() {
				return this.text.slice(-this.titleLastPartSize);
			},
			titleLastPartSize() {
				return 10;
			}
		},
		mounted() {
			const fileIcon = new ui_icons_generator.FileIcon({
				name: this.fileExtension
			});
			fileIcon.renderTo(this.$refs.icon);
		},
		template: `
		<div class="crm-timeline__file">
			<div ref="icon" class="crm-timeline__file_icon"></div>
			<a
				target="_blank"
				class="crm-timeline__file_title crm-timeline__card_link"
				v-if="href"
				:title="text"
				:href="href"
				v-bind="attributes"
				ref="title"
			>
				<span>{{ titleFirstPart }}</span>
				<span>{{ titleLastPart }}</span>
			</a>
			<div class="crm-timeline__file_audio-player" v-if="this.hasAudioPlayer">
				<TimelineAudio :id="id" :mini="true" :src="href"></TimelineAudio>
			</div>
		</div>
		`
	};

	const FileList = {
		components: {
			File,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			title: {
				type: String,
				required: false,
				default: ''
			},
			numberOfFiles: {
				type: Number,
				required: false,
				default: 0
			},
			files: {
				type: Array,
				required: true,
				default: []
			},
			updateParams: {
				type: Object,
				required: false,
				default: {}
			},
			visibleFilesNumber: {
				type: Number,
				required: false,
				default: 5
			}
		},
		inject: ['isReadOnly'],
		data() {
			return {
				visibleFilesAmount: this.visibleFilesNumber
			};
		},
		computed: {
			isEditable() {
				return Object.keys(this.updateParams).length > 0 && !this.isReadOnly;
			},
			visibleFiles() {
				return this.files.slice(0, this.visibleFilesAmount);
			},
			editFilesBtnClassname() {
				return ['crm-timeline__file-list-btn', {
					'--disabled': !this.isEditable
				}];
			},
			expandFileListBtnTitle() {
				return this.isAllFilesVisible ? this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_FILE_LIST_COLLAPSE') : this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_FILE_LIST_EXPAND');
			},
			editFilesBtnIcon() {
				return ui_iconSet_api_vue.Set.PENCIL_40;
			},
			addVisibleFilesBtnIcon() {
				return ui_iconSet_api_vue.Set.CHEVRON_DOWN;
			},
			isAllFilesVisible() {
				return this.visibleFilesAmount === this.numberOfFiles;
			},
			isShowExpandFileListBtn() {
				return this.numberOfFiles > this.visibleFilesNumber;
			},
			expandBtnIconClassname() {
				return ['crm-timeline__file-list-btn-icon', {
					'--upended': this.isAllFilesVisible
				}];
			}
		},
		methods: {
			fileProps(file) {
				return {
					id: file.id,
					text: file.name,
					href: file.viewUrl,
					size: file.size,
					attributes: file.attributes,
					hasAudioPlayer: file.hasAudioPlayer
				};
			},
			showFileUploaderPopup() {
				if (!this.isEditable) {
					return;
				}
				const popup = new crm_activity_fileUploaderPopup.FileUploaderPopup(this.updateParams);
				popup.show();
			},
			handleShowFilesBtnClick() {
				if (this.isAllFilesVisible) {
					this.collapseFileList();
				} else {
					this.expandFileList();
				}
			},
			expandFileList() {
				this.visibleFilesAmount = this.numberOfFiles;
			},
			collapseFileList() {
				this.visibleFilesAmount = this.visibleFilesNumber;
			}
		},
		template: `
			<div class="crm-timeline__file-list-wrapper">
				<div class="crm-timeline__file-list-container">
					<div
						class="crm-timeline__file-container"
						v-for="file in visibleFiles"
					>
						<File :key="file.id" v-bind="fileProps(file)"></File>
					</div>
				</div>
				<footer class="crm-timeline__file-list-footer">
					<div
						v-if="isShowExpandFileListBtn"
						class="crm-timeline__file-list-btn-container"
					>
						<button
							class="crm-timeline__file-list-btn"
							@click="handleShowFilesBtnClick"
						>
							<span class="crm-timeline__file-list-btn-text">{{expandFileListBtnTitle}}</span>
							<i :class="expandBtnIconClassname">
								<BIcon :name="addVisibleFilesBtnIcon" :size="18"></BIcon>
							</i>
						</button>
					</div>
					<div
						v-if="isEditable"
						class="crm-timeline__file-list-btn-container"
					>
						<button
							v-if="title !== '' || numberOfFiles > 0"
							@click="showFileUploaderPopup"
							:class="editFilesBtnClassname"
						>
							<span class="crm-timeline__file-list-btn-text">{{ title }}</span>
							<i class="crm-timeline__file-list-btn-icon">
								<BIcon :name="editFilesBtnIcon" :size="18"></BIcon>
							</i>
							<i ref="edit-icon" class="crm-timeline__file-list-btn-icon"></i>
					</button>
					</div>
				</footer>
			</div>
		`
	};

	// @vue/component
	var GroupBlocks = {
		props: {
			borderType: {
				type: String,
				required: true
			},
			blocks: {
				type: Object,
				required: true,
				validator: value => main_core.Type.isObject(value) && Object.values(value).every(block => main_core.Type.isObject(block))
			}
		},
		computed: {
			className() {
				let borderClassname = '';
				if (this.borderType === 'warning') {
					borderClassname = '--border-warning';
				}
				return ['crm-timeline__group-blocks', borderClassname];
			},
			visibleBlocks() {
				if (!main_core.Type.isObject(this.blocks)) {
					return [];
				}
				return Object.keys(this.blocks).map(id => ({
					id,
					...this.blocks[id]
				})).filter(item => item.scope !== 'mobile');
			}
		},
		mounted() {
			const blocks = this.$refs.blocks;
			this.visibleBlocks.forEach((block, index) => {
				if (main_core.Type.isDomNode(blocks[index].$el)) {
					blocks[index].$el.setAttribute('data-id', block.id);
				} else {
					throw new Error(`Vue component "${block.rendererName}" was not found`);
				}
			});
		},
		methods: {
			/**
			 * Finds and returns block component instance by its identifier
			 *
			 * @param {string} blockId - block identifier
			 *
			 * @return {Object|null} - block component instance or null if not found
			 *
			 * @public
			 */
			getBlockById(blockId) {
				const blockIndex = this.visibleBlocks.findIndex(block => block.id === blockId);
				if (blockIndex === -1) {
					return null;
				}
				return this.$refs.blocks[blockIndex] || null;
			}
		},
		// language=Vue
		template: `
		<div :class="className">
			<div
				v-for="(block) in visibleBlocks"
				:key="block.id"
			>
				<component 
					:is="block.rendererName"
					v-bind="block.properties"
					ref="blocks"
				/>
			</div>
		</div>
	`
	};

	const InfoGroup = {
		props: {
			blocks: {
				type: Object,
				required: false,
				default: () => ({})
			}
		},
		template: `
		<table class="crm-timeline__info-group">
			<tbody>
				<tr
					v-for="({title, block}, id) in blocks"
					:key="id"
					class="crm-timeline__info-group_block"
				>
					<td
						:title="title"
						class="crm-timeline__info-group_block-title"
					>
						{{title}}
					</td>
					<td class="crm-timeline__info-group_block-content">
						<component
							:is="block.rendererName"
							v-bind="block.properties"
						/>
					</td>
				</tr>
			</tbody>
		</table>
	`
	};

	const SAVE_OFFSETS_REQUEST_DELAY$1 = 1000;
	var ItemSelector = {
		props: {
			valuesList: {
				type: Array,
				required: true,
				default: []
			},
			value: {
				type: Array,
				default: []
			},
			saveAction: {
				type: Object,
				required: true
			},
			compactMode: {
				type: Boolean,
				default: false
			},
			icon: {
				type: String,
				default: null,
				required: false
			}
		},
		methods: {
			onItemSelectorValueChange(event) {
				main_core.Runtime.debounce(() => {
					const data = event.getData();
					if (data) {
						this.executeSaveAction(data.value);
					}
				}, SAVE_OFFSETS_REQUEST_DELAY$1, this)();
			},
			executeSaveAction(items) {
				if (!this.saveAction) {
					return;
				}
				if (this.value.sort().toString() === items.sort().toString()) {
					return;
				}

				// to avoid unintended props mutation
				const actionDescription = main_core.Runtime.clone(this.saveAction);
				actionDescription.actionParams ??= {};
				actionDescription.actionParams.value = items;
				const action = new Action(actionDescription);
				void action.execute(this);
			}
		},
		mounted() {
			this.itemSelector = new crm_field_itemSelector.ItemSelector({
				target: this.$el,
				valuesList: this.valuesList,
				selectedValues: this.value,
				compactMode: this.compactMode ?? false,
				icon: main_core.Type.isStringFilled(this.icon) ? this.icon : null
			});
			main_core_events.EventEmitter.subscribe(this.itemSelector, crm_field_itemSelector.Events.EVENT_ITEMSELECTOR_VALUE_CHANGE, this.onItemSelectorValueChange);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(this.itemSelector, crm_field_itemSelector.Events.EVENT_ITEMSELECTOR_VALUE_CHANGE, this.onItemSelectorValueChange);
		},
		computed: {
			styles() {
				if (this.compactMode) {
					return {};
				}
				return {
					width: '100%'
				};
			}
		},
		template: '<div :style="styles"></div>'
	};

	var LineOfTextBlocks = {
		props: {
			blocks: Object,
			delimiter: String,
			button: Object
		},
		mounted() {
			const blocks = this.$refs.blocks;
			this.visibleBlocks.forEach((block, index) => {
				if (main_core.Type.isDomNode(blocks[index].$el)) {
					blocks[index].$el.setAttribute('data-id', block.id);
				} else {
					throw new Error(`Vue component "${block.rendererName}" was not found`);
				}
			});
		},
		methods: {
			isShowDelimiter(index, length) {
				return main_core.Type.isString(this.delimiter) && !this.isLastElement(index, length);
			},
			isLastElement(index, length) {
				return index === length - 1;
			},
			getLastElement() {
				const lastKey = Object.keys(this.blocks)[Object.keys(this.blocks).length - 1];
				return this.blocks[lastKey] ?? null;
			}
		},
		computed: {
			visibleBlocks() {
				if (!main_core.Type.isObject(this.blocks)) {
					return [];
				}
				const blocks = Object.keys(this.blocks).map(id => ({
					id,
					...this.blocks[id]
				})).filter(item => item.scope !== 'mobile');
				if (main_core.Type.isObject(this.button)) {
					blocks.push({
						id: 'button',
						...this.button
					});
				}
				return blocks;
			},
			formattedDelimiter() {
				return main_core.Text.encode(this.delimiter).replace(' ', '&nbsp;');
			}
		},
		// language=Vue
		template: `
		<span class="crm-timeline-block-line-of-texts">
			<span
				v-for="(block, index) in visibleBlocks"
				:key="block.id"
			>
				<component 
					:is="block.rendererName"
					v-bind="block.properties"
					ref="blocks"
				/>
				<span v-if="isShowDelimiter(index, visibleBlocks.length)" v-html="formattedDelimiter"></span>
				<span v-else-if="!isLastElement(index, visibleBlocks.length)">&nbsp;</span>
			</span>
		</span>
	`
	};

	var LineOfTextBlocksButton = {
		props: {
			action: Object,
			icon: {
				type: String,
				required: false,
				default: ''
			},
			title: String
		},
		computed: {
			href() {
				if (!this.action) {
					return null;
				}
				const action = new Action(this.action);
				if (action.isRedirect()) {
					return action.getValue();
				}
				return null;
			},
			linkAttrs() {
				if (!this.action) {
					return {};
				}
				const action = new Action(this.action);
				if (!action.isRedirect()) {
					return {};
				}
				const attrs = {
					href: action.getValue()
				};
				const target = action.getActionParam('target');
				if (target) {
					attrs.target = target;
				}
				return attrs;
			},
			className() {
				return ['crm-timeline__line_of_text_blocks_button'];
			},
			iconClassName() {
				if (!this.icon) {
					return [];
				}
				return ['crm-timeline__line_of_text_blocks_button_icon', `--code-${this.icon}`];
			}
		},
		methods: {
			executeAction() {
				if (this.action) {
					const action = new Action(this.action);
					action.execute(this);
				}
			},
			addAlignRightClass() {
				this.$el.parentElement.classList.add('right-fixed-button');
			}
		},
		mounted() {
			this.addAlignRightClass();
		},
		template: `
			<a
				v-if="href"
				v-bind="linkAttrs"
				:class="className"
				:title="title"
			>{{text}}<span v-if="icon" :class="iconClassName"></span>
			</a>
			<span
				v-else
				@click="executeAction"
				:class="className"
				:title="title"
			>{{text}}<span v-if="icon" :class="iconClassName"></span>
			</span>
		`
	};

	var Money = {
		props: {
			opportunity: Number,
			currencyId: String
		},
		computed: {
			encodedText() {
				if (!main_core.Type.isNumber(this.opportunity) || !main_core.Type.isStringFilled(this.currencyId)) {
					return null;
				}
				return currency_currencyCore.CurrencyCore.currencyFormat(this.opportunity, this.currencyId, true);
			}
		},
		extends: Text,
		template: `
		<span
			v-if="encodedText"
			:class="className"
			v-html="encodedText"
		></span>`
	};

	const MoneyPill = {
		props: {
			opportunity: Number,
			currencyId: String
		},
		computed: {
			moneyHtml() {
				if (!main_core.Type.isNumber(this.opportunity) || !main_core.Type.isStringFilled(this.currencyId)) {
					return null;
				}
				return currency_currencyCore.CurrencyCore.currencyFormat(this.opportunity, this.currencyId, true);
			}
		},
		template: `
		<div class="crm-timeline-card__money-pill">
			<span class="crm-timeline-card__money-pill_amount">
				<span v-if="moneyHtml" v-html="moneyHtml"></span>
			</span>
		</div>
	`
	};

	const Note = {
		components: {
			User,
			Button
		},
		props: {
			id: {
				type: Number,
				required: false
			},
			text: {
				type: String,
				required: false,
				default: ''
			},
			deleteConfirmationText: {
				type: String,
				required: false,
				default: ''
			},
			saveNoteAction: {
				type: Object
			},
			deleteNoteAction: {
				type: Object
			},
			updatedBy: {
				type: Object,
				required: false
			}
		},
		data() {
			return {
				note: this.text,
				oldNote: this.text,
				isEdit: false,
				isExist: !!this.id,
				isSaving: false,
				isDeleting: false,
				isCollapsed: true,
				shortNoteLength: 113
			};
		},
		inject: ['isReadOnly', 'currentUser'],
		computed: {
			noteText() {
				if (this.isCollapsed) {
					return this.shortNote;
				}
				return this.note;
			},
			shortNote() {
				if (this.note.length > this.shortNoteLength) {
					return `${this.note.slice(0, this.shortNoteLength)}...`;
				} else if (this.getNoteLineBreaksCount() > 2) {
					let currentLineBreakerCount = 0;
					for (let letterIndex = 0; letterIndex < this.note.length; letterIndex++) {
						const letter = this.note[letterIndex];
						if (letter !== '\n') {
							continue;
						}
						currentLineBreakerCount++;
						if (currentLineBreakerCount === this.maxLineBreakerCount) {
							return `${this.note.slice(0, letterIndex)}...`;
						}
					}
				}
				return this.note;
			},
			maxLineBreakerCount() {
				return 3;
			},
			expandNoteBtnText() {
				if (this.isCollapsed) {
					return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_NOTE_SHOW');
				} else {
					return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_NOTE_HIDE');
				}
			},
			ButtonType() {
				return ButtonType;
			},
			isDeleteButtonVisible() {
				return !this.isReadOnly;
			},
			isEditButtonVisible() {
				return !(this.isReadOnly || this.isEdit);
			},
			saveButtonState() {
				if (this.isSaving) {
					return ButtonState.DISABLED;
				}
				if (this.note.trim().length > 0) {
					return ButtonState.DEFAULT;
				}
				return ButtonState.DISABLED;
			},
			cancelButtonState() {
				if (this.isSaving) {
					return ButtonState.DISABLED;
				}
				return ButtonState.DEFAULT;
			},
			isNoteVisible() {
				return this.isExist || this.isEdit;
			},
			user() {
				if (this.updatedBy) {
					return this.updatedBy;
				}
				if (this.currentUser) {
					return this.currentUser;
				}
				return {
					title: '',
					detailUrl: '',
					imageUrl: ''
				};
			},
			isShowExpandBtn() {
				return !this.isEdit && (this.note.length > this.shortNoteLength || this.getNoteLineBreaksCount() > 2);
			}
		},
		methods: {
			toggleNoteLength() {
				this.isCollapsed = !this.isCollapsed;
			},
			startEditing() {
				this.isEdit = true;
				this.$nextTick(() => {
					this.isCollapsed = false;
					const textarea = this.$refs.noteText;
					this.adjustHeight(textarea);
					textarea.focus();
				});
				this.executeAction({
					type: 'jsEvent',
					value: 'Note:StartEdit'
				});
			},
			adjustHeight(elem) {
				elem.style.height = 0;
				elem.style.height = elem.scrollHeight + "px";
			},
			setEditMode(editMode) {
				const isEdit = editMode ? !this.isReadOnly : false;
				if (isEdit !== this.isEdit) {
					if (isEdit) {
						this.startEditing();
					} else {
						this.isEdit = false;
						this.executeAction({
							type: 'jsEvent',
							value: 'Note:FinishEdit'
						});
					}
				}
			},
			onEnterHandle(event) {
				if (event.ctrlKey === true || main_core.Browser.isMac() && (event.metaKey === true || event.altKey === true)) {
					this.saveNote();
				}
			},
			cancelEditing() {
				this.note = this.oldNote;
				this.isEdit = false;
				this.executeAction({
					type: 'jsEvent',
					value: 'Note:FinishEdit'
				});
			},
			deleteNote() {
				if (this.isSaving) {
					return;
				}
				if (!this.isExist) {
					this.cancelEditing();
					return;
				}
				if (this.deleteConfirmationText && this.deleteConfirmationText.length) {
					ui_dialogs_messagebox.MessageBox.show({
						message: this.deleteConfirmationText,
						modal: true,
						buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
						onYes: messageBox => {
							messageBox.close();
							this.executeDeleteAction();
						},
						onNo: messageBox => {
							messageBox.close();
						}
					});
				} else {
					this.executeDeleteAction();
				}
			},
			saveNote() {
				if (this.saveButtonState === ButtonState.DISABLED || this.isSaving || this.isDeleting) {
					return;
				}
				if (this.note === this.text) {
					this.cancelEditing();
					return;
				}
				this.isSaving = true;
				const action = main_core.Runtime.clone(this.saveNoteAction);
				action.actionParams.text = this.note;
				this.executeAction(action).then(({
					status
				}) => {
					if (status === 'success') {
						this.oldNote = this.$refs.noteText.value.trim();
						this.isExist = true;
						this.cancelEditing();
					}
				}).finally(() => {
					this.isSaving = false;
				});
			},
			executeDeleteAction() {
				if (this.isSaving) {
					return;
				}
				this.isDeleting = true;
				this.executeAction(this.deleteNoteAction).then(({
					status
				}) => {
					if (status === 'success') {
						this.oldNote = '';
						this.isExist = false;
						this.cancelEditing();
					}
				}).finally(() => {
					this.isDeleting = false;
				});
			},
			executeAction(actionObject) {
				if (!actionObject) {
					console.error('No action object to execute');
					return;
				}
				const action = new Action(actionObject);
				return action.execute(this);
			},
			handleWindowResize() {
				const windowWidth = window.innerWidth;
				if (windowWidth > 1400) {
					this.shortNoteLength = 250;
				} else {
					this.shortNoteLength = 113;
				}
			},
			getNoteLineBreaksCount() {
				return this.note.split('').reduce((counter, elem) => {
					return counter + (elem === '\n' ? 1 : 0);
				}, 0);
			}
		},
		watch: {
			id(id) {
				this.isExist = !!id;
			},
			text(text) {
				this.note = text;
				this.oldNote = text;
			},
			note() {
				if (!this.isEdit) {
					return;
				}
				this.$nextTick(() => {
					this.adjustHeight(this.$refs.noteText);
				});
			},
			isEdit(value) {
				if (value) {
					this.$nextTick(() => this.$refs.noteText.focus());
				}
			}
		},
		created() {
			this.handleWindowResize();
			main_core.Event.bind(window, 'resize', this.handleWindowResize);
		},
		destroyed() {
			main_core.Event.unbind(window, 'resize', this.handleWindowResize);
		},
		template: `
		<div
			v-show="isNoteVisible"
			class="crm-timeline__card-note"
		>
			<div class="crm-timeline__card-note_user">
				<User v-bind="user"></User>
			</div>
			<div class="crm-timeline__card-note_area">
				<div class="crm-timeline__card-note_value">
						<textarea
							v-if="isEdit"
							v-model="note"
							@keydown.esc.stop="cancelEditing"
							@keydown.enter="onEnterHandle"
							:disabled="!isEdit || isSaving"
							:placeholder="$Bitrix.Loc.getMessage('CRM_TIMELINE_USER_NOTE_PLACEHOLDER')"
							ref="noteText"
							class="crm-timeline__card-note_text"
						></textarea>
						<span
							v-else
							ref="noteText"
							class="crm-timeline__card-note_text"
						>
							{{noteText}}
						</span>
	
					<span
						v-if="isEditButtonVisible"
						class="crm-timeline__card-note_edit"
						@click.prevent.stop="startEditing"
					>
							<i></i>
						</span>
				</div>
				<div v-if="isEdit" class="crm-timeline__card-note__controls">
					<div class="crm-timeline__card-note__control --save">
						<Button
							@click="saveNote"
							:state="saveButtonState" :type="ButtonType.PRIMARY"
							:title="$Bitrix.Loc.getMessage('CRM_TIMELINE_USER_NOTE_SAVE')"
						/>
					</div>
					<div class="crm-timeline__card-note__control --cancel">
						<Button @click="cancelEditing"
								:type="ButtonType.LIGHT"
								:state="cancelButtonState"
								:title="$Bitrix.Loc.getMessage('CRM_TIMELINE_USER_NOTE_CANCEL')"
						/>
					</div>
				</div>
			</div>
			<div v-if="isDeleteButtonVisible" class="crm-timeline__card-note_cross" @click="deleteNote">
				<i></i>
			</div>
			<div v-if="isDeleting" class="crm-timeline__card-note_dimmer"></div>
			<div
				v-show="isShowExpandBtn"
				@click="toggleNoteLength"
				class="crm-timeline__card-note_expand-note-btn"
			>
				{{ expandNoteBtnText }}
			</div>
		</div>
	`
	};

	const PlayerAlert = {
		components: {
			LineOfTextBlocks
		},
		props: {
			blocks: {
				type: Object,
				required: false,
				default: () => ({})
			},
			color: {
				type: String,
				required: false,
				default: ui_alerts.AlertColor.DEFAULT
			},
			icon: {
				type: String,
				required: false,
				default: ui_alerts.AlertIcon.NONE
			}
		},
		computed: {
			containerClassname() {
				return ['crm-timeline__player-alert', 'ui-alert', 'ui-alert-xs', 'ui-alert-text-center', this.color, this.icon];
			}
		},
		template: `
		<div :class="containerClassname">
			<div class="ui-alert-message">
				<LineOfTextBlocks :blocks="blocks"></LineOfTextBlocks>
			</div>
		</div>
	`
	};

	const RestAppLayoutBlocks = {
		props: {
			itemTypeId: {
				type: Number
			},
			itemId: {
				type: Number
			},
			restAppInfo: {
				title: String,
				clientId: String
			},
			contentBlocks: {
				type: Object
			}
		},
		computed: {
			restAppTitle() {
				return main_core.Text.encode(this.restAppInfo.title);
			},
			clientId() {
				return main_core.Text.encode(this.restAppInfo.clientId);
			}
		},
		template: `
		<div class="crm_timeline__rest_app_layout_blocks" :data-app-name="restAppTitle" :data-rest-client-id="clientId">
			<div class="crm-timeline__card-container_block" v-for="contentBlock in contentBlocks">
				<component :is="contentBlock.rendererName" v-bind="contentBlock.properties" ref="contentBlocks" />
			</div>
		</div>
	`
	};

	const SmsMessage = {
		props: {
			text: {
				type: String,
				required: false,
				default: ''
			}
		},
		computed: {
			messageHtml() {
				return BX.util.htmlspecialchars(this.text).replace(/\r\n|\r|\n/g, '<br/>');
			}
		},
		template: `
		<div
			class="crm-timeline__item_sms-message">
			<span v-if="messageHtml" v-html="messageHtml"></span>
		</div>
	`
	};

	class DeadlineAndPingSelectorBackgroundColor {
		static ORANGE = 'orange';
		static GRAY = 'gray';
	}

	var DeadlineAndPingSelector = {
		props: {
			isScheduled: Boolean,
			deadlineBlock: Object,
			pingSelectorBlock: Object,
			deadlineBlockTitle: String,
			backgroundToken: String,
			backgroundColor: {
				type: String,
				required: false,
				default: null
			}
		},
		data() {
			return {
				deadlineBlockData: this.deadlineBlock,
				pingSelectorBlockData: this.pingSelectorBlock
			};
		},
		computed: {
			className() {
				return {
					'crm-timeline__card-container_info': true,
					'--inline': true,
					'crm-timeline-block-deadline-and-ping-selector-deadline-wrapper': true,
					'--orange': this.backgroundToken === DeadlineAndPingSelectorBackgroundColor.ORANGE,
					'--gray': this.backgroundToken === DeadlineAndPingSelectorBackgroundColor.GRAY
				};
			},
			deadlineBlockStyle() {
				if (this.isScheduled && main_core.Type.isStringFilled(this.backgroundColor)) {
					return {
						'--crm-timeline-block-deadline-and-ping-selector-deadline_bg-color': main_core.Text.encode(this.backgroundColor)
					};
				}
				return {};
			}
		},
		methods: {
			onDeadlineChange(deadline) {
				this.deadlineBlockData.properties.value = deadline;
				this.pingSelectorBlockData.properties.deadline = deadline;
				this.$refs.pingSelectorBlock.setDeadline(deadline);
			}
		},
		created() {
			this.$watch('deadlineBlock', deadlineBlock => {
				this.deadlineBlockData = deadlineBlock;
			}, {
				deep: true
			});
			this.$watch('pingSelectorBlock', pingSelectorBlock => {
				this.pingSelectorBlockData = pingSelectorBlock;
			}, {
				deep: true
			});
		},
		// language=Vue
		template: `
		<span class="crm-timeline-block-deadline-and-ping-selector">
			<div 
				:class="className" 
				ref="deadlineBlock" 
				v-if="deadlineBlock"
				:style="deadlineBlockStyle"
			>
				<div class="crm-timeline__card-container_info-title" v-if="deadlineBlockTitle">
					{{deadlineBlockTitle}}&nbsp;
				</div>
				<component
					:is="deadlineBlock.rendererName"
					v-bind="deadlineBlockData.properties"
					@onChange="onDeadlineChange"
				/>
			</div>
	
			<component
				v-if="pingSelectorBlock"
				:is="pingSelectorBlock.rendererName"
				v-bind="pingSelectorBlockData.properties"
				ref="pingSelectorBlock"
			/>
		</span>	
	`
	};

	const SAVE_OFFSETS_REQUEST_DELAY = 1000;
	var PingSelector = {
		props: {
			valuesList: {
				type: Array,
				required: true,
				default: []
			},
			value: {
				type: Array,
				default: []
			},
			deadline: {
				type: Number
			},
			saveAction: {
				type: Object,
				required: true
			},
			icon: {
				type: String,
				default: null,
				required: false
			}
		},
		data() {
			return {
				deadlineData: this.deadline
			};
		},
		watch: {
			deadline(deadline) {
				this.deadlineData = deadline;
			}
		},
		mounted() {
			this.initPingSelector();
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(this.pingSelector, crm_field_pingSelector.PingSelectorEvents.EVENT_PINGSELECTOR_VALUE_CHANGE, this.onItemSelectorValueChange);
		},
		methods: {
			onItemSelectorValueChange(event) {
				main_core.Runtime.debounce(() => {
					const data = event.getData();
					if (data) {
						this.executeSaveAction(data.value);
					}
				}, SAVE_OFFSETS_REQUEST_DELAY, this)();
			},
			executeSaveAction(items) {
				if (!this.saveAction) {
					return;
				}
				if (this.value.sort().toString() === items.sort().toString()) {
					return;
				}

				// to avoid unintended props mutation
				const actionDescription = main_core.Runtime.clone(this.saveAction);
				actionDescription.actionParams ??= {};
				actionDescription.actionParams.value = items;
				const action = new Action(actionDescription);
				void action.execute(this);
			},
			initPingSelector() {
				const deadlineDate = this.createDateFromDeadline();
				const deadlineTime = deadlineDate?.getTime();
				const currentTime = Date.now();
				const deadline = deadlineTime > currentTime ? deadlineDate : new Date();
				this.pingSelector = new crm_field_pingSelector.PingSelector({
					target: this.$el,
					valuesList: this.valuesList,
					selectedValues: this.value,
					icon: main_core.Type.isStringFilled(this.icon) ? this.icon : null,
					deadline
				});
				main_core_events.EventEmitter.subscribe(this.pingSelector, crm_field_pingSelector.PingSelectorEvents.EVENT_PINGSELECTOR_VALUE_CHANGE, this.onItemSelectorValueChange);
			},
			createDateFromDeadline() {
				if (!main_core.Type.isNumber(this.deadlineData)) {
					return null;
				}
				return crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.deadlineData).getValue();
			},
			setDeadline(deadline) {
				const date = main_date.Timezone.UserTime.getDate(deadline);
				this.deadlineData = date.getTime() / 1000;
				this.pingSelector.setDeadline(date);
			}
		},
		template: '<div></div>'
	};

	var WithTitle = {
		props: {
			title: String,
			inline: Boolean,
			wordWrap: Boolean,
			fixedWidth: Boolean,
			titleBottomPadding: {
				type: Number,
				required: false,
				default: 0
			},
			contentBlock: Object
		},
		computed: {
			className() {
				return {
					'crm-timeline__card-container_info': true,
					'--inline': this.inline,
					'--word-wrap': this.wordWrap,
					'--fixed-width': this.fixedWidth
				};
			},
			valueClassName() {
				return {
					'crm-timeline__card-container_info-value': true
				};
			}
		},
		methods: {
			isTitleCropped() {
				const titleElem = this.$refs.title;
				return titleElem.scrollWidth > titleElem.clientWidth;
			}
		},
		mounted() {
			void this.$nextTick(() => {
				if (!this.$refs.title) {
					return;
				}
				if (this.isTitleCropped()) {
					main_core.Dom.attr(this.$refs.title, 'title', this.title);
				}
				if (this.titleBottomPadding > 0) {
					main_core.Dom.style(this.$refs.title, 'padding-bottom', `${this.titleBottomPadding}px`);
				}
			});
		},
		template: `
		<div
			:class="className"
		>
			<div
				ref="title" 
				class="crm-timeline__card-container_info-title"
			>
				{{ title }}
			</div>
			<div 
				:class="valueClassName"
			>
				<component 
					:is="contentBlock.rendererName"
					v-bind="contentBlock.properties"
				/>
			</div>
		</div>
	`
	};

	var WorkflowEfficiency = {
		data() {
			return {
				formattedAverageDuration: '',
				formattedExecutionTime: ''
			};
		},
		props: {
			averageDuration: Number,
			efficiency: String,
			executionTime: Number,
			processTimeText: String,
			workflowResult: Object,
			author: Object
		},
		computed: {
			itemClassName() {
				return `bizproc-workflow-timeline-eff-icon --${this.efficiency}`;
			},
			efficiencyCaption() {
				let notice = this.efficiency === 'fast' ? 'QUICKLY' : 'SLOWLY';
				if (this.efficiency === 'stopped') {
					notice = 'NO_PROGRESS';
				}
				return main_core.Loc.getMessage(`BIZPROC_WORKFLOW_TIMELINE_SLIDER_PERFORMED_${notice}`);
			},
			hasResult() {
				return this.workflowResult !== undefined;
			},
			workflowResultHtml() {
				if (this.workflowResult && this.workflowResult.status === bizproc_types.WorkflowResultStatus.NO_RIGHTS_RESULT) {
					this.workflowResult.text = main_core.Loc.getMessage('CRM_TIMELINE_WORKFLOW_RESULT_NO_RIGHTS_VIEW');
				}
				return this.workflowResult?.text ?? null;
			},
			averageDurationText() {
				return main_core.Loc.getMessage('CRM_TIMELINE_WORKFLOW_EFFICIENCY_AVERAGE_PROCESS_TIME');
			},
			resultCaption() {
				if (!this.userResult) {
					return main_core.Loc.getMessage('CRM_TIMELINE_WORKFLOW_RESULT_TITLE');
				}
				return '';
			},
			userResult() {
				if (!this.hasResult) {
					const userLink = main_core.Tag.render`<a href="${this.href}"></a>`;
					userLink.textContent = this.author?.fullName;
					return main_core.Loc.getMessage('CRM_TIMELINE_WORKFLOW_NO_RESULT', {
						'#USER#': userLink.outerHTML
					});
				}
				if (this.workflowResult && this.workflowResult.status === bizproc_types.WorkflowResultStatus.USER_RESULT) {
					if (this.author) {
						return main_core.Loc.getMessage('CRM_TIMELINE_WORKFLOW_NO_RESULT', {
							'#USER#': this.workflowResult.text ?? ''
						});
					}
					return this.workflowResult.text ?? '';
				}
				return null;
			}
		},
		mounted() {
			if (this.workflowResult && this.workflowResult.status === bizproc_types.WorkflowResultStatus.NO_RIGHTS_RESULT) {
				this.showHint();
			}
			main_core.Runtime.loadExtension('bizproc.workflow.timeline').then(({
				DurationFormatter
			}) => {
				this.formattedAverageDuration = DurationFormatter.formatTimeInterval(this.averageDuration);
				this.formattedExecutionTime = DurationFormatter.formatTimeInterval(this.executionTime);
			}).catch(e => {
				console.error('Error loading DurationFormatter:', e);
			});
		},
		methods: {
			showHint() {
				const resultBlock = this.$refs.resultBlock;
				if (resultBlock) {
					const hintAnchor = main_core.Tag.render`<span data-hint="${main_core.Loc.getMessage('CRM_TIMELINE_WORKFLOW_RESULT_NO_RIGHTS_TOOLTIP')}"></span>`;
					main_core.Dom.append(hintAnchor, resultBlock);
					BX.UI.Hint.init(resultBlock);
				}
			}
		},
		template: `
		<div class="crm-timeline__text-block crm-timeline__workflow-efficiency-block">
			<div class="bizproc-workflow-timeline-item --result">
				<div class="">
					<div class="bizproc-workflow-timeline-content">
						<div v-if="!userResult" class="bp-result">
							<div class="bizproc-workflow-timeline-caption">{{ resultCaption }}</div>
							<div class="bizproc-workflow-timeline-result" ref="resultBlock" v-html="workflowResultHtml"></div>
						</div>
						<div v-if="userResult" class="bp-result" v-html="userResult"></div>
					</div>
				</div>
			</div>
			<div class="bizproc-workflow-timeline-item --efficiency">
				<div class="bizproc-workflow-timeline-item-wrapper">
					<div class="bizproc-workflow-timeline-content">
						<div class="bizproc-workflow-timeline-content-inner">
							<div class="bizproc-workflow-timeline-caption">{{ efficiencyCaption }}</div>
							<div class="bizproc-workflow-timeline-notice">
								<div class="bizproc-workflow-timeline-subject">{{ processTimeText }}</div>
								<span class="bizproc-workflow-timeline-text">{{ formattedExecutionTime }}</span>
							</div>
							<div class="bizproc-workflow-timeline-notice">
								<div class="bizproc-workflow-timeline-subject">{{ averageDurationText }}</div>
								<span class="bizproc-workflow-timeline-text">{{ formattedAverageDuration }}</span>
							</div>
						</div>
						<div :class="itemClassName"></div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	class CommonContentBlocks extends Base {
		getContentBlockComponents(Item) {
			return {
				ActionBar,
				AddressBlock,
				TextBlock: Text,
				LinkBlock: Link,
				LineOfTextBlocksButton,
				DateBlock,
				WithTitle,
				LineOfTextBlocks,
				TimelineAudio,
				ClientCommunication,
				ClientMark,
				Money,
				EditableText,
				EditableDescription,
				EditableDate,
				PlayerAlert,
				RestAppLayoutBlocks,
				DatePill,
				Note,
				FileList,
				InfoGroup,
				MoneyPill,
				SmsMessage,
				CommentContent,
				ItemSelector,
				PingSelector,
				DeadlineAndPingSelector,
				WorkflowEfficiency,
				CallScoringPill,
				CallScoring,
				CallScoringV2,
				ErrorBlock,
				GroupBlocks
			};
		}

		/**
		 * Process common events that aren't bound to specific item type
		 */
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Item:OpenEntityDetailTab' && main_core.Type.isStringFilled(actionData?.tabId)) {
				this.#openEntityDetailTab(actionData.tabId);
			}
			if (action === 'Note:StartEdit') {
				this.#editNote(item);
			}
			if (action === 'Note:FinishEdit') {
				this.#cancelEditNote(item);
			}
		}
		#openEntityDetailTab(tabId) {
			// the event is handled by compatible code, it's a pain to use EventEmitter in this case
			// eslint-disable-next-line bitrix-rules/no-bx
			BX.onCustomEvent(window, 'OpenEntityDetailTab', [tabId]);
		}
		#editNote(item) {
			item.getLayoutContentBlockById('note')?.setEditMode(true);
			item.highlightContentBlockById('note', true);
		}
		#cancelEditNote(item) {
			item.getLayoutContentBlockById('note')?.setEditMode(false);
			item.highlightContentBlockById('note', false);
		}
		static isItemSupported(item) {
			return true; // common blocks can be used anywhere
		}
	}

	var ListItemButton = {
		props: {
			text: {
				type: String,
				required: true
			},
			action: Object
		},
		methods: {
			executeAction() {
				if (this.action) {
					const action = new Action(this.action);
					action.execute(this);
				}
			}
		},
		// language=Vue
		template: `
		<div class="crm-entity-stream-advice-list-btn-box">
			<button
				@click="executeAction"
				class="crm-entity-stream-advice-list-btn"
			>
				{{text}}
			</button>
		</div>
	`
	};

	var ListItem = {
		props: {
			title: {
				type: String,
				required: true
			},
			titleAction: Object,
			isSelected: {
				type: Boolean,
				required: false,
				default: false
			},
			image: String,
			showDummyImage: {
				type: Boolean,
				required: false,
				default: true
			},
			bottomBlock: Object,
			button: Object
		},
		components: {
			Text,
			Link,
			ListItemButton
		},
		computed: {
			imageStyle() {
				if (!this.image) {
					return {};
				}
				return {
					backgroundImage: 'url(' + this.image + ')'
				};
			}
		},
		// language=Vue
		template: `
		<li
			:class="{'crm-entity-stream-advice-list-item--active': isSelected}"
			class="crm-entity-stream-advice-list-item"
		>
			<div class="crm-entity-stream-advice-list-content">
				<div
					v-if="image || showDummyImage"
					:style="imageStyle"
					class="crm-entity-stream-advice-list-icon"
				>
				</div>
				<div class="crm-entity-stream-advice-list-inner">
					<Link v-if="titleAction" :action="titleAction" :text="title"></Link>
					<Text v-else :value="title"></Text>
					<div v-if="bottomBlock" class="crm-entity-stream-advice-list-desc-box">
						<LineOfTextBlocks v-bind="bottomBlock.properties"></LineOfTextBlocks>
					</div>
				</div>
			</div>
			<ListItemButton v-if="button" v-bind="button.properties"></ListItemButton>
		</li>
	`
	};

	var ExpandableList = {
		props: {
			listItems: {
				type: Array,
				required: true,
				default: []
			},
			title: {
				type: String,
				required: false,
				default: ''
			},
			showMoreEnabled: {
				type: Boolean,
				required: true
			},
			showMoreCnt: {
				type: Number,
				required: false
			},
			showMoreText: {
				type: String,
				required: false
			}
		},
		data() {
			return {
				isShortList: this.showMoreEnabled,
				shortListItemsCnt: this.showMoreCnt
			};
		},
		components: {
			ListItem
		},
		methods: {
			showMore() {
				this.isShortList = false;
			},
			isItemVisible(index) {
				return !this.isShortList || index < this.showMoreCnt;
			}
		},
		computed: {
			isShowMoreVisible() {
				return this.isShortList && this.listItems.length > this.shortListItemsCnt;
			}
		},
		// language=Vue
		template: `
		<div>
			<div v-if="title" class="crm-entity-stream-advice-title">
				{{title}}
			</div>
			<transition-group class="crm-entity-stream-advice-list" name="list" tag="ul">
				<ListItem
					v-for="(item, index) in listItems"
					v-show="isItemVisible(index)"
					:key="item.id"
					v-bind="item.properties"
				></ListItem>
			</transition-group>
			<a
				v-if="isShowMoreVisible"
				@click.prevent="showMore"
				class="crm-entity-stream-advice-link"
				href="#"
			>
				{{showMoreText}}
			</a>
		</div>
	`
	};

	class DealProductList extends Base {
		#item = null;
		#productsGrid = null;
		getContentBlockComponents(Item) {
			return {
				ExpandableList
			};
		}
		onInitialize(item) {
			this.#item = item;
			main_core_events.EventEmitter.subscribe('onCrmEntityUpdate', () => {
				this.#item.reloadFromServer();
			});

			/**
			 * For cases when timeline block controller initialization runs after product grid initialization
			 */
			BX.Crm.EntityEditor.getDefault().tapController('PRODUCT_LIST', controller => {
				this.#productsGrid = controller.getProductList();
			});

			/**
			 * For cases when timeline block controller initialization runs before product grid initialization
			 */
			main_core_events.EventEmitter.subscribe('EntityProductListController', event => {
				this.#productsGrid = event.getData()[0];
			});
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'ProductList:AddToDeal') {
				this.#addProductToDeal(actionData, animationCallbacks);
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'ProductCompilation:SentToClient' || item.getType() === 'Order:EncourageBuyProducts';
		}
		#addProductToDeal(actionData, animationCallbacks) {
			if (!(actionData && actionData.productId)) {
				return;
			}
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			BX.onCustomEvent('onAddViewedProductToDeal', [actionData.productId]);
			setTimeout(() => {
				BX.onCustomEvent('OpenEntityDetailTab', ['tab_products']);
			}, 500);
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CRM_TIMELINE_ENCOURAGE_BUY_PRODUCTS_PRODUCTS_ADDED_TO_DEAL'),
				autoHideDelay: 5000
			});
			if (animationCallbacks.onStop) {
				animationCallbacks.onStop();
			}
		}
	}

	class Delivery extends Base {
		#needCheckRequestStatus = null;
		#checkRequestStatusTimeout = null;
		#isPullSubscribed = false;
		static isItemSupported(item) {
			return item.getType() === 'Activity:Delivery';
		}
		onInitialize(item) {
			this.#updateCheckRequestStatus(item);
			this.#subscribePullEvents(item);
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Delivery:MakeCall' && actionData) {
				this.#makeCall(actionData);
			}
		}
		onAfterItemRefreshLayout(item) {
			this.#updateCheckRequestStatus(item);
		}
		#makeCall(actionData) {
			if (!main_core.Type.isStringFilled(actionData.phoneNumber) || !main_core.Type.isBoolean(actionData.canUserPerformCalls)) {
				return;
			}
			if (!main_core.Type.isUndefined(window.top['BXIM']) && actionData.canUserPerformCalls !== false) {
				window.top['BXIM'].phoneTo(actionData.phoneNumber);
			} else {
				window.open('tel:' + actionData.phoneNumber, '_self');
			}
		}
		#subscribePullEvents(item) {
			if (this.#isPullSubscribed) {
				return;
			}
			this.#subscribeShipmentEvents(item);
			this.#subscribeDeliveryServiceEvents(item);
			this.#subscribeDeliveryRequestEvents(item);
			this.#isPullSubscribed = true;
		}
		#subscribeShipmentEvents(item) {
			const shipmentIds = this.#getShipmentIds(item);
			pull_client.PULL.subscribe({
				moduleId: 'crm',
				command: 'onOrderShipmentSave',
				callback: params => {
					if (shipmentIds.some(id => id == params.FIELDS.ID)) {
						item.reloadFromServer();
					}
				}
			});
			pull_client.PULL.extendWatch('CRM_ENTITY_ORDER_SHIPMENT');
		}
		#subscribeDeliveryServiceEvents(item) {
			const deliveryServiceIds = this.#getDeliveryServiceIds(item);
			pull_client.PULL.subscribe({
				moduleId: 'sale',
				command: 'onDeliveryServiceSave',
				callback: params => {
					if (deliveryServiceIds.some(id => id == params.ID)) {
						item.reloadFromServer();
					}
				}
			});
			pull_client.PULL.extendWatch('SALE_DELIVERY_SERVICE');
		}
		#subscribeDeliveryRequestEvents(item) {
			const deliveryRequest = this.#getDeliveryRequest(item);
			pull_client.PULL.subscribe({
				moduleId: 'sale',
				command: 'onDeliveryRequestUpdate',
				callback: params => {
					if (deliveryRequest && deliveryRequest.id == params.ID) {
						item.reloadFromServer();
					}
				}
			});
			pull_client.PULL.subscribe({
				moduleId: 'sale',
				command: 'onDeliveryRequestDelete',
				callback: params => {
					if (deliveryRequest && deliveryRequest.id == params.ID) {
						item.reloadFromServer();
					}
				}
			});
			pull_client.PULL.extendWatch('SALE_DELIVERY_REQUEST');
		}
		#checkRequestStatus() {
			main_core.ajax.runAction('crm.timeline.deliveryactivity.checkrequeststatus');
		}
		#updateCheckRequestStatus(item) {
			const deliveryRequest = this.#getDeliveryRequest(item);
			const needCheckRequestStatus = deliveryRequest && deliveryRequest.isProcessed === false;
			if (needCheckRequestStatus && !this.#needCheckRequestStatus) {
				clearTimeout(this.#checkRequestStatusTimeout);
				this.#checkRequestStatusTimeout = setInterval(() => this.#checkRequestStatus(), 30 * 1000);
			} else if (!needCheckRequestStatus && this.#needCheckRequestStatus) {
				clearTimeout(this.#checkRequestStatusTimeout);
			}
			this.#needCheckRequestStatus = needCheckRequestStatus;
		}
		#getDeliveryRequest(item) {
			const dataPayload = item.getDataPayload();
			if (!main_core.Type.isObject(dataPayload.deliveryRequest)) {
				return null;
			}
			return dataPayload.deliveryRequest;
		}
		#getDeliveryServiceIds(item) {
			const dataPayload = item.getDataPayload();
			if (!main_core.Type.isArray(dataPayload.deliveryServiceIds)) {
				return [];
			}
			return dataPayload.deliveryServiceIds;
		}
		#getShipmentIds(item) {
			const dataPayload = item.getDataPayload();
			if (!main_core.Type.isArray(dataPayload.shipmentIds)) {
				return [];
			}
			return dataPayload.shipmentIds;
		}
	}

	const ACTION_NAMESPACE = 'Document:';
	class Document extends Base {
		static #toPrintAfterRefresh = [];
		#popupConfirm;
		static isItemSupported(item) {
			return item.getType() === 'Document' || item.getType() === 'DocumentViewed' || item.getType() === 'Activity:Document';
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				response,
				animationCallbacks
			} = actionParams;
			if (ActionType.isJsEvent(actionType)) {
				this.#onJsEvent(action, actionData, animationCallbacks, item);
			} else if (ActionType.isAjaxAction(actionType)) {
				this.#onAjaxAction(action, actionType, actionData, response);
			}
		}
		#onJsEvent(action, actionData, animationCallbacks, item) {
			const documentId = main_core.Text.toInteger(actionData?.documentId);
			// if (documentId <= 0)
			// {
			// 	return;
			// }
			if (action === ACTION_NAMESPACE + 'Open') {
				this.#openDocument(documentId);
			} else if (action === ACTION_NAMESPACE + 'CopyPublicLink') {
				// todo block button while loading
				this.#copyPublicLink(documentId, actionData?.publicUrl);
			} else if (action === ACTION_NAMESPACE + 'Print') {
				this.#printDocument(actionData?.printUrl, animationCallbacks, item);
			} else if (action === ACTION_NAMESPACE + 'DownloadPdf') {
				this.#downloadPdf(actionData?.pdfUrl);
			} else if (action === ACTION_NAMESPACE + 'DownloadDocx') {
				this.#downloadDocx(actionData?.docxUrl);
			} else if (action === ACTION_NAMESPACE + 'UpdateTitle') {
				this.#updateTitle(documentId, actionData?.value);
			} else if (action === ACTION_NAMESPACE + 'UpdateCreateDate') {
				this.#updateCreateDate(documentId, actionData?.value);
			} else if (action === ACTION_NAMESPACE + 'ConvertDeal') {
				this.#convertDeal(documentId, animationCallbacks);
			} else if (action === ACTION_NAMESPACE + 'ShowInfoHelperSlider') {
				this.#showInfoHelperSlider(actionData?.infoHelperCode);
			} else if (action === ACTION_NAMESPACE + 'Delete') {
				const confirmationText = actionData.confirmationText ?? '';
				if (confirmationText) {
					ui_dialogs_messagebox.MessageBox.show({
						message: confirmationText,
						modal: true,
						buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
						onYes: () => {
							return this.#deleteDocument(actionData.id, actionData.ownerTypeId, actionData.ownerId, animationCallbacks);
						},
						onNo: messageBox => {
							messageBox.close();
						}
					});
				} else {
					this.#deleteDocument(actionData.id, actionData.ownerTypeId, actionData.ownerId, animationCallbacks);
				}
			} else {
				console.info(`Unknown action ${action} in ${item.getType()}`);
			}
		}
		#openDocument(documentId) {
			crm_router.Router.Instance.openDocumentSlider(documentId);
		}
		async #copyPublicLink(documentId, publicUrl) {
			if (!main_core.Type.isStringFilled(publicUrl)) {
				try {
					publicUrl = await this.#createPublicUrl(documentId);
				} catch (error) {
					ui_dialogs_messagebox.MessageBox.alert(error.message);
					return;
				}
			}
			const isSuccess = BX.clipboard.copy(publicUrl);
			if (isSuccess) {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_LINK_IS_COPIED'),
					autoHideDelay: 5000
				});
			} else {
				ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_DOCUMENT_COPY_PUBLIC_LINK_ERROR'));
			}
		}
		async #createPublicUrl(documentId) {
			let response;
			try {
				response = await main_core.ajax.runAction('crm.documentgenerator.document.enablePublicUrl', {
					analyticsLabel: 'enablePublicUrl',
					data: {
						status: 1,
						id: documentId
					}
				});
			} catch (responseWithError) {
				console.error(responseWithError);
				throw new Error(main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_DOCUMENT_CREATE_PUBLIC_LINK_ERROR'));
			}
			const publicUrl = response.data.publicUrl;
			if (!main_core.Type.isStringFilled(publicUrl)) {
				throw new Error(main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_DOCUMENT_CREATE_PUBLIC_LINK_ERROR'));
			}
			return publicUrl;
		}
		#printDocument(printUrl, animationCallbacks, item) {
			if (main_core.Type.isStringFilled(printUrl)) {
				window.open(printUrl, '_blank');
				return;
			}

			// there is no pdf yet. wait till document is transformed and update push comes in
			Document.#toPrintAfterRefresh.push(item);
			const onStart = animationCallbacks?.onStart;
			if (main_core.Type.isFunction(onStart)) {
				onStart();
			}
		}
		#downloadPdf(pdfUrl) {
			if (main_core.Type.isStringFilled(pdfUrl)) {
				window.open(pdfUrl, '_blank');
			} else {
				ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_DOCUMENT_PDF_NOT_READY'));
			}
		}
		#downloadDocx(docxUrl) {
			if (main_core.Type.isStringFilled(docxUrl)) {
				window.open(docxUrl, '_blank');
			} else {
				console.error('Docx download url is not found. This should be an impossible case, something went wrong');
			}
		}
		async #updateTitle(documentId, value) {
			let response;
			try {
				response = await main_core.ajax.runAction('crm.documentgenerator.document.update', {
					data: {
						id: documentId,
						values: {
							DocumentTitle: value
						}
					}
				});
			} catch (responseWithError) {
				console.error(responseWithError);
				ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_DOCUMENT_UPDATE_DOCUMENT_ERROR'));
				return;
			}
			const newTitle = response.data.document?.values?.DocumentTitle;
			if (newTitle !== value) {
				console.error("Updated document title without errors, but for some reason title from the backend doesn't match sent value");
			}
		}
		async #updateCreateDate(documentId, value) {
			const valueInSiteFormat = main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateFormat(), value);
			let response;
			try {
				response = await main_core.ajax.runAction('crm.documentgenerator.document.update', {
					data: {
						id: documentId,
						values: {
							DocumentCreateTime: valueInSiteFormat
						}
					}
				});
			} catch (responseWithError) {
				console.error(responseWithError);
				ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_DOCUMENT_UPDATE_DOCUMENT_ERROR'));
				return;
			}
			const newCreateDate = response.data.document?.values?.DocumentCreateTime;
			if (valueInSiteFormat !== newCreateDate) {
				console.error("Updated document create date without errors, but for some reason date from the backend doesn't match sent value");
			}
		}
		#deleteDocument(id, ownerTypeId, ownerId, animationCallbacks) {
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			return main_core.ajax.runAction('crm.timeline.document.delete', {
				data: {
					id,
					ownerTypeId,
					ownerId
				}
			}).then(() => {
				if (animationCallbacks.onStop) {
					animationCallbacks.onStop();
				}
				return true;
			}, response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000
				});
				if (animationCallbacks.onStop) {
					animationCallbacks.onStop();
				}
				return true;
			});
		}
		#onAjaxAction(action, actionType, actionData, response) {
			if (action === 'crm.api.integration.sign.convertDeal') {
				if (actionType === ActionType.AJAX_ACTION.FINISHED && !main_core.Type.isNil(response?.data?.SMART_DOCUMENT)) {
					//todo extract it to router?
					const wizardUri = new main_core.Uri('/sign/doc/0/');
					wizardUri.setQueryParams({
						docId: response.data.SMART_DOCUMENT,
						stepId: 'changePartner',
						noRedirect: 'Y'
					});
					BX.SidePanel.Instance.open(wizardUri.toString());
				}
			}
		}
		onAfterItemRefreshLayout(item) {
			const itemsToPrint = Document.#toPrintAfterRefresh.filter(candidate => candidate.getId() === item.getId());
			if (itemsToPrint.length <= 0) {
				return;
			}
			const action = item.getLayout().asPlainObject().footer?.additionalButtons?.extra?.action;
			const isPrintEvent = main_core.Type.isPlainObject(action) && ActionType.isJsEvent(action.type) && action.value === ACTION_NAMESPACE + 'Print';
			if (!isPrintEvent) {
				return;
			}
			const printUrl = action.actionParams?.printUrl;
			if (!main_core.Type.isStringFilled(printUrl)) {
				return;
			}
			this.#printDocument(printUrl, null, item);
			Document.#toPrintAfterRefresh = Document.#toPrintAfterRefresh.filter(remainingItem => !itemsToPrint.includes(remainingItem));
		}
		#convertDeal(id, animationCallbacks) {
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			const convertDealAndStartSign = usePrevious => {
				main_core.ajax.runAction('crm.api.integration.sign.convertDeal', {
					data: {
						documentId: id,
						usePrevious: !usePrevious ? 0 : 1
					}
				}).then(response => {
					if (response?.data?.SMART_DOCUMENT) {
						const wizardUri = new main_core.Uri('/sign/doc/0/');
						wizardUri.setQueryParams({
							docId: response.data.SMART_DOCUMENT,
							stepId: 'changePartner',
							noRedirect: 'Y'
						});
						BX.SidePanel.Instance.open(wizardUri.toString());
					}
					if (animationCallbacks.onStop) {
						animationCallbacks.onStop();
					}
				}, response => {
					if (response.errors[0].message) {
						ui_notification.UI.Notification.Center.notify({
							content: response.errors[0].message,
							autoHideDelay: 5000
						});
					}
					if (animationCallbacks.onStop) {
						animationCallbacks.onStop();
					}
				}).catch(response => {
					if (response.errors[0].message) {
						ui_notification.UI.Notification.Center.notify({
							content: response.errors[0].message,
							autoHideDelay: 5000
						});
					}
					if (animationCallbacks.onStop) {
						animationCallbacks.onStop();
					}
				});
			};
			main_core.ajax.runAction('crm.api.integration.sign.getLinkedBlank', {
				data: {
					documentId: id
				}
			}).then(response => {
				if (response?.data?.ID > 0) {
					this.#showMessage(main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_DO_USE_PREVIOUS_MSGVER_3', {
						'%TITLE%': '<b>' + BX.util.htmlspecialchars(response.data.TITLE || '') + '</b>',
						'%INITIATOR%': '<b>' + BX.util.htmlspecialchars(response.data.INITIATOR || '') + '</b>'
					}), [new BX.UI.Button({
						text: BX.message('CRM_TIMELINE_ITEM_ACTIVITY_OLD_BUTTON_MSGVER_2'),
						className: "ui-btn ui-btn-md ui-btn-primary",
						events: {
							click: () => {
								convertDealAndStartSign(true);
								this.#popupConfirm.destroy();
							}
						}
					}), new BX.UI.Button({
						text: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_NEW_BUTTON_MSGVER_3'),
						className: "ui-btn ui-btn-md ui-btn-info",
						events: {
							click: () => {
								convertDealAndStartSign(false);
								this.#popupConfirm.destroy();
							}
						}
					})], main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_POPUP_TITLE_MSGVER_2'));
				} else {
					convertDealAndStartSign(false);
				}
			});
		}
		#showInfoHelperSlider(code) {
			BX.UI.InfoHelper.show(code);
		}
		#showMessage(content, buttons, title) {
			this.#popupConfirm = new BX.PopupWindow('bx-popup-document-activity-popup', null, {
				zIndex: 200,
				autoHide: true,
				closeByEsc: true,
				buttons: buttons,
				closeIcon: true,
				overlay: true,
				events: {
					onPopupClose: () => {
						this.#popupConfirm.destroy();
					}
				},
				content: main_core.Tag.render`<div class="bx-popup-document-activity-popup-content-text">${content}</div>`,
				titleBar: title,
				className: 'bx-popup-document-activity-popup',
				maxWidth: 510
			});
			this.#popupConfirm.show();
		}
	}

	var ContactList = {
		props: {
			contactBlocks: Array
		},
		template: `
			<div class="crm-timeline-block-mail-contacts-wrapper">
			<div class="crm-timeline-block-mail-contact" v-for="(block, index) in contactBlocks">
				<component :is="block.rendererName" v-bind="block.properties"></component>
			</div>
		</div>
	`
	};

	class Email extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Email::OpenMessage' && actionData) {
				this.#openMessage(actionData);
			}
			if (action === 'Email::Schedule' && actionData) {
				this.runScheduleAction(actionData.activityId, actionData.scheduleDate);
			}
		}
		#viewActivity(id) {
			const editor = this.#getActivityEditor();
			if (editor && id) {
				const emailActivity = BX.CrmActivityEmail.create({
					ID: id
				}, editor, {});
				emailActivity.openDialog(BX.CrmDialogMode.view);
			}
		}
		#getActivityEditor() {
			return BX.CrmActivityEditor.getDefault();
		}
		#openMessage(actionData) {
			if (!main_core.Type.isNumber(actionData.threadId)) {
				return;
			}
			this.#viewActivity(actionData.threadId);
		}
		getContentBlockComponents(Item) {
			return {
				ContactList
			};
		}
		static isItemSupported(item) {
			const supportedItemTypes = ['ContactList', 'Activity:Email', 'EmailActivitySuccessfullyDelivered', 'EmailActivityNonDelivered', 'EmailLogIncomingMessage'];
			return supportedItemTypes.includes(item.getType());
		}
	}

	const CONFIRM_DLG_WIDTH = 515;
	const COPILOT_HELPDESK_CODE = 26_164_810;
	class EntityExclusion extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Activity:EntityExclusion:Exclude' && main_core.Type.isObject(actionData)) {
				this.#exclude(actionData);
			}
		}
		#exclude(actionData) {
			if (main_core.Type.isNumber(actionData.activityId) && main_core.Type.isNumber(actionData.ownerTypeId) && main_core.Type.isNumber(actionData.ownerId)) {
				main_core.Runtime.loadExtension('ui.system.dialog').then(exports => {
					const {
						Dialog
					} = exports;
					const helpdesklink = main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_ENTITY_EXCLUSION_CONFIRM_DLG_HELP', {
						'[helpdesklink]': `<a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${COPILOT_HELPDESK_CODE}');">`,
						'[/helpdesklink]': '</a>'
					});
					const content = main_core.Dom.create('div', {
						attrs: {
							className: 'crm-timeline__entity-exclusion-confirm-dlg-content'
						},
						html: helpdesklink
					});
					const popupTitle = actionData.ownerTypeId === BX.CrmEntityType.enumeration.deal ? main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_ENTITY_EXCLUSION_CONFIRM_DLG_TITLE_DEAL') : main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_ENTITY_EXCLUSION_CONFIRM_DLG_TITLE_LEAD');
					this.confirmPopup = new Dialog({
						title: popupTitle,
						hasOverlay: true,
						disableScrolling: false,
						content,
						width: CONFIRM_DLG_WIDTH,
						centerButtons: [this.#createContinueButton(actionData), new ui_buttons.CancelButton({
							text: main_core.Loc.getMessage('CRM_COMMON_ACTION_CANCEL'),
							size: ui_buttons.ButtonSize.LARGE,
							style: ui_buttons.AirButtonStyle.OUTLINE,
							useAirDesign: true,
							onclick: () => this.confirmPopup.hide()
						})]
					});
					this.confirmPopup.show();
				}).catch(exception => {
					console.error('Error loading "ui.system.dialog":', exception);
				});
			} else {
				console.error('Invalid "actionData" parameters');
			}
		}
		#createContinueButton(actionData) {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_COMMON_CONTINUE'),
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: button => {
					button.setWaiting();
					main_core.ajax.runAction('crm.timeline.activity.excludeEntity', {
						data: {
							activityId: actionData.activityId,
							ownerTypeId: actionData.ownerTypeId,
							ownerId: actionData.ownerId
						}
					}).then(() => {
						setTimeout(() => {
							const currentSlider = top.BX.SidePanel.Instance.getSliderByWindow(window);
							if (currentSlider && main_core.Reflection.getClass('BX.Crm.EntityEvent')) {
								BX.Crm.EntityEvent.fireUpdate(actionData.ownerTypeId, actionData.ownerId, '', {
									sliderUrl: currentSlider.getUrl()
								});
								currentSlider.close();
							}
						}, 10);
					}, response => {
						if (response.errors && response.errors.length > 0) {
							ui_notification.UI.Notification.Center.notify({
								content: response?.errors[0]?.message ?? main_core.Loc.getMessage('CRM_COMMON_ERROR'),
								autoHideDelay: 5000
							});
						}
						button.setWaiting(false);
						this.confirmPopup.hide();
					}).catch(exception => {
						console.error('Unexpected error in "crm.timeline.activity.excludeEntity" flow:', exception);
					});
				}
			});
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:EntityExclusion';
		}
	}

	const EcommerceDocumentsList = {
		props: {
			ownerId: {
				type: Number,
				required: true
			},
			ownerTypeId: {
				type: Number,
				required: true
			},
			isWithOrdersMode: {
				type: Boolean,
				required: true
			},
			summaryOptions: {
				type: Object,
				required: true
			}
		},
		mounted() {
			const timelineSummaryDocuments = new crm_entityEditor_field_paymentDocuments.TimelineSummaryDocuments({
				'OWNER_ID': this.ownerId,
				'OWNER_TYPE_ID': this.ownerTypeId,
				'PARENT_CONTEXT': this,
				'CONTEXT': BX.CrmEntityType.resolveName(this.ownerTypeId).toLowerCase(),
				'IS_WITH_ORDERS_MODE': this.isWithOrdersMode
			});
			timelineSummaryDocuments.setOptions(this.summaryOptions);
			this.$el.appendChild(timelineSummaryDocuments.render());
		},
		methods: {
			startSalescenterApplication(orderId, options) {
				if (options === undefined) {
					return;
				}
				BX.loadExt('salescenter.manager').then(() => {
					BX.Salescenter.Manager.openApplication(options);
				});
			}
		},
		template: `<div></div>`
	};

	class FinalSummary extends Base {
		onAfterItemLayout(item, options) {
			if (item.needBindToContainer()) {
				main_core_events.EventEmitter.emit('BX.Crm.Timeline.Items.FinalSummaryDocuments:onHistoryNodeAdded', [item.getWrapper()]);
			}
		}
		getContentBlockComponents(Item) {
			return {
				EcommerceDocumentsList
			};
		}
		static isItemSupported(item) {
			return item.getType() === 'FinalSummary';
		}
	}

	class Helpdesk extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionData
			} = actionParams;
			if (action === 'Helpdesk:Open' && actionData && actionData.articleCode) {
				this.#openHelpdesk(actionData.articleCode);
			}
		}
		#openHelpdesk(articleCode) {
			if (top.BX && top.BX.Helper) {
				top.BX.Helper.show(`redirect=detail&code=${articleCode}`);
			}
		}
		static isItemSupported(item) {
			return true;
		}
	}

	var ValueChange = {
		props: {
			from: Object,
			to: Object
		},
		// language=Vue
		template: `<div class="crm-entity-stream-content-detail-info">
	<component :is="from.rendererName" v-if="from" v-bind="from.properties"></component>
	<span class="crm-entity-stream-content-detail-info-separator-icon" v-if="from"></span>
	<component :is="to.rendererName" v-if="to" v-bind="to.properties"></component>
	</div>`
	};

	var ValueChangeItem = {
		props: {
			iconCode: String,
			text: String,
			pillText: String
		},
		computed: {
			iconClassName() {
				return ['crm-timeline__value-change-item_icon', {
					[`--${this.iconCode}`]: true
				}];
			}
		},
		// language=Vue
		template: `
		<div class="crm-timeline__value-change-item">
			<span v-if="iconCode" :class="iconClassName"></span>
			<span class="crm-timeline__value-change-item_text" v-if="text">{{ text }}</span>
			<span class="crm-entity-stream-content-detain-info-status" v-if="pillText">{{ pillText }}</span>
		</div>
	`
	};

	class Modification extends Base {
		getContentBlockComponents(Item) {
			return {
				ValueChange,
				ValueChangeItem
			};
		}
		static isItemSupported(item) {
			return item.getType() === 'Modification' || item.getType() === 'TasksTaskModification' || item.getType() === 'RestartAutomation';
		}
	}

	var ChatMessage = {
		props: {
			messageHtml: String,
			isIncoming: Boolean
		},
		computed: {
			className() {
				return 'crm-entity-stream-content-detail-IM-message-' + (this.isIncoming ? 'incoming' : 'outgoing');
			}
		},
		// language=Vue
		template: `<div class="crm-entity-stream-content-detail-IM"><div :class="[className]" v-html="messageHtml"></div></div>`
	};

	class OpenLines extends CopilotBase {
		#copilotSummaryMenu = null;

		// region Base overridden methods
		onInitialize(item) {
			if (item) {
				this.#showCopilotWelcomeTour(item);
			}
		}
		getContentBlockComponents(Item) {
			return {
				ChatMessage
			};
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Openline:OpenChat' && actionData && actionData.dialogId) {
				this.#openChat(actionData.dialogId);
			}
			if (action === 'Openline:Complete' && actionData && actionData.activityId) {
				this.#onComplete(item, actionData, animationCallbacks);
			}
			if (action === 'Openline:ShowCopilotSummary' && actionData) {
				void this.#showCopilotSummary(item, actionData);
			}
			if (action === 'Openline:LaunchCopilot' && actionData) {
				void this.handleCopilotLaunch(item, actionData);
			}
		}
		// endregion

		// region CopilotBase overridden methods
		getCopilotConfig() {
			return {
				actionEndpoint: 'crm.timeline.ai.launchCopilot',
				validEntityTypes: [BX.CrmEntityType.enumeration.lead, BX.CrmEntityType.enumeration.deal],
				agreementContext: 'audio' // @todo!
			};
		}
		// endregion

		// region jsEvent action handlers
		#openChat(dialogId) {
			main_core.Runtime.loadExtension('im.public.iframe').then(exports => {
				exports.Messenger.openLines(dialogId);
			}).catch(exception => {
				console.error('Error loading "im.public.iframe":', exception);
			});
		}
		#onComplete(item, actionData, animationCallbacks) {
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_COMPLETE_CONF_TITLE'),
				message: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_COMPLETE_CONF'),
				modal: true,
				okCaption: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_COMPLETE_CONF_OK_TEXT'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				onOk: () => {
					return this.#runCompleteAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId, animationCallbacks);
				},
				onCancel: messageBox => {
					const changeStreamButton = item.getLayoutHeaderChangeStreamButton();
					if (changeStreamButton) {
						changeStreamButton.markCheckboxUnchecked();
					}
					messageBox.close();
				}
			});
		}
		#showCopilotSummary(item, actionData) {
			const activityId = actionData.activityId;
			const items = actionData.summarizeTranscriptionList;
			if (activityId <= 0 || !items) {
				return;
			}
			if (Object.keys(items).length === 1) {
				void this.openCopilotSummaryPopup(actionData, crm_ai_call.ActivityProvider.openLine, Object.keys(items)[0]);
				return;
			}
			if (this.#copilotSummaryMenu === null) {
				const barTarget = item.getLayoutContentBlockById('aiActionBar').getContainer();
				const elementTarget = barTarget?.querySelector('.ui-icon-set.--o-copilot');
				const menuTarget = elementTarget || barTarget;
				const menuItems = Object.entries(items).reverse().map(([jobId, timestamp]) => {
					const converter = crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(timestamp).toUserTime();
					return {
						title: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_SUMMARIZE_TRANSCRIPTION_MENU', {
							'#DATE#': converter.toDatetimeString({
								delimiter: ', '
							})
						}),
						design: 'copilot',
						icon: ui_iconSet_api_vue.Outline.TEXT,
						onClick: () => {
							this.#copilotSummaryMenu.close();
							this.openCopilotSummaryPopup(actionData, crm_ai_call.ActivityProvider.openLine, jobId);
						}
					};
				});
				this.#copilotSummaryMenu = new ui_system_menu.Menu({
					id: `crm-timeline-activity-openline-copilot-summary-${activityId}-${main_core.Text.getRandom()}`,
					animation: 'fading-slide',
					bindElement: menuTarget,
					autoHide: true,
					closeByEsc: false,
					offsetTop: 5,
					items: menuItems
				});
			}
			this.#copilotSummaryMenu.show();
		}
		#runCompleteAction(activityId, ownerTypeId, ownerId, animationCallbacks) {
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			return main_core.ajax.runAction('crm.timeline.activity.complete', {
				data: {
					activityId,
					ownerTypeId,
					ownerId
				}
			}).then(() => {
				if (animationCallbacks.onStop) {
					animationCallbacks.onStop();
				}
				return true;
			}, response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000
				});
				if (animationCallbacks.onStop) {
					animationCallbacks.onStop();
				}
				return true;
			});
		}
		#showCopilotWelcomeTour(item) {
			setTimeout(() => {
				const aiCopilotBtn = this.getFooterCopilotButton(item);
				const aiCopilotUIBtn = aiCopilotBtn?.getUiButton();
				if (!aiCopilotUIBtn || aiCopilotUIBtn.getState() === ui_buttons.ButtonState.DISABLED) {
					return;
				}
				if (aiCopilotBtn?.isInViewport()) {
					main_core_events.EventEmitter.emit(this, 'BX.Crm.Timeline.Openline:onShowCopilotTour', {
						target: aiCopilotUIBtn.getContainer(),
						stepId: 'copilot-in-open-line',
						delay: 1500
					});
					return;
				}
				const showCopilotTourOnScroll = () => {
					if (aiCopilotBtn?.isInViewport()) {
						main_core_events.EventEmitter.emit(this, 'BX.Crm.Timeline.Openline:onShowCopilotTour', {
							target: aiCopilotUIBtn.getContainer(),
							stepId: 'copilot-in-open-line',
							delay: 1000
						});
						main_core.Event.unbind(window, 'scroll', showCopilotTourOnScroll);
					}
				};
				main_core.Event.bind(window, 'scroll', showCopilotTourOnScroll);
			}, 50);
		}
		// endregion

		static isItemSupported(item) {
			return item.getType() === 'Activity:OpenLine';
		}
	}

	class OrderCheck extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'OrderCheck:OpenCheck' && actionData && actionData.checkUrl) {
				crm_router.Router.openSlider(actionData.checkUrl, {
					width: 500,
					cacheable: false
				});
			} else if (action === 'OrderCheck:ReprintCheck' && actionData && actionData.checkId) {
				main_core.ajax.runAction('crm.ordercheck.reprint', {
					data: {
						checkId: actionData.checkId
					}
				}).catch(response => {
					ui_notification.UI.Notification.Center.notify({
						content: response.errors[0].message,
						autoHideDelay: 5000
					});
				});
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'OrderCheckPrinted' || item.getType() === 'OrderCheckNotPrinted' || item.getType() === 'OrderCheckSent' || item.getType() === 'OrderCheckPrinting';
		}
	}

	class Payment extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Payment:OpenRealization' && actionData?.paymentId) {
				this.#openRealization(actionData.paymentId);
			}
		}
		#openRealization(paymentId) {
			const control = BX.Crm.EntityEditor.getDefault().getControlByIdRecursive('OPPORTUNITY_WITH_CURRENCY');
			if (!control) {
				return;
			}
			const paymentDocumentsControl = control.getPaymentDocumentsControl();
			if (!paymentDocumentsControl) {
				return;
			}
			paymentDocumentsControl._createRealizationSlider({
				paymentId
			});
		}
		static isItemSupported(item) {
			return item.getType() === 'Payment' || item.getType() === 'Activity:Payment';
		}
	}

	class RepeatSale extends CopilotBase {
		#prevHeaderText;

		// region Base overridden methods
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Activity:RepeatSale:ShowRestrictionSlider') {
				this.#showRestrictionSlider();
			}
			if (!main_core.Type.isObject(actionData)) {
				return;
			}
			if (action === 'Activity:RepeatSale:Schedule') {
				this.runScheduleAction(actionData.activityId, actionData.scheduleDate, actionData.description);
			}
			if (action === 'Activity:RepeatSale:LaunchCopilot') {
				void this.handleCopilotLaunch(item, actionData);
			}
			if (action === 'Activity:RepeatSale:OpenSegment') {
				this.#openSegment(actionData.activityId, actionData.segmentId);
			}
		}
		// endregion

		// region CopilotBase overridden methods
		getCopilotConfig() {
			return {
				actionEndpoint: 'crm.timeline.repeatsale.launchCopilot',
				validEntityTypes: [BX.CrmEntityType.enumeration.deal],
				agreementContext: 'audio',
				// @todo!
				onPreLaunch: (...args) => this.#handlePreLaunch(...args),
				onError: (...args) => this.#handleError(...args)
			};
		}
		// endregion

		// region jsEvent action handlers
		#handlePreLaunch(item, actionData) {
			const descriptionBlock = item.getLayoutContentBlockById('description');
			const errorBlock = item.getLayoutContentBlockById('error');
			this.#prevHeaderText = descriptionBlock?.getHeaderText();
			descriptionBlock?.setHeaderText('');
			descriptionBlock?.setCopilotStatus(EditableDescriptionAiStatus.IN_PROGRESS);
			errorBlock?.closeBlock();
		}
		#handleError(item, actionData, response) {
			const descriptionBlock = item.getLayoutContentBlockById('description');
			descriptionBlock?.setHeaderText(this.#prevHeaderText);
			descriptionBlock?.setCopilotStatus(EditableDescriptionAiStatus.NONE);
		}
		#showRestrictionSlider() {
			ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				featureId: 'limit_v2_crm_repeat_sale'
			}).show();
		}
		#openSegment(item, segmentId) {
			if (!main_core.Type.isInteger(segmentId)) {
				return;
			}
			void crm_router.Router.Instance.openRepeatSaleSegmentSlider(segmentId, true, {
				section: 'deal_section'
			});
		}
		// endregion

		static isItemSupported(item) {
			return item.getType() === 'Activity:RepeatSale' || item.getType() === 'RepeatSaleCreated' || item.getType() === 'LaunchError';
		}
	}

	class RestApp extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (!ActionType.isJsEvent(actionType)) {
				return;
			}
			if (action === 'Activity:ConfigurableRestApp:OpenApp') {
				this.#openRestAppSlider(actionData);
			}
		}
		#openRestAppSlider(params) {
			const openAppParams = {
				...params
			};
			const appId = openAppParams.restAppId;
			delete openAppParams.restAppId;
			if (BX.rest && BX.rest.AppLayout) {
				if (main_core.Type.isStringFilled(openAppParams.bx24_label)) {
					openAppParams.bx24_label = JSON.parse(openAppParams.bx24_label);
				}
				BX.rest.AppLayout.openApplication(appId, openAppParams);
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:ConfigurableRestApp';
		}
	}

	class SalescenterApp extends Base {
		static isItemSupported(item) {
			const supportedItemTypes = ['Activity:Sms', 'Activity:Notification', 'Activity:Payment', 'PaymentViewed', 'PaymentNotViewed', 'PaymentSent', 'PaymentPaid', 'PaymentNotPaid', 'PaymentError', 'PaymentSentToTerminal', 'Activity:Delivery', 'CustomerSelectedPaymentMethod'];
			return supportedItemTypes.includes(item.getType());
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'SalescenterApp:Start' && actionData) {
				this.#startSalescenterApp(actionData);
			}
		}
		#startSalescenterApp(actionData) {
			if (!(main_core.Type.isInteger(actionData.ownerTypeId) && main_core.Type.isInteger(actionData.ownerId) && main_core.Type.isInteger(actionData.orderId) && main_core.Type.isStringFilled(actionData.mode))) {
				return;
			}
			BX.loadExt('salescenter.manager').then(() => {
				const params = {
					ownerTypeId: actionData.ownerTypeId,
					ownerId: actionData.ownerId,
					orderId: actionData.orderId,
					mode: actionData.mode,
					disableSendButton: '',
					context: 'deal',
					templateMode: 'view'
				};
				if (main_core.Type.isInteger(actionData.paymentId)) {
					params.paymentId = actionData.paymentId;
				}
				if (main_core.Type.isInteger(actionData.shipmentId)) {
					params.shipmentId = actionData.shipmentId;
				}
				if (main_core.Type.isStringFilled(actionData.analyticsLabel)) {
					params.analyticsLabel = actionData.analyticsLabel;
				}
				BX.Salescenter.Manager.openApplication(params);
			});
		}
	}

	let featureResolver = null;
	let api = null;
	main_core.Runtime.loadExtension(['sign.v2.api', 'sign.feature-resolver']).then(async exports => {
		if (exports?.Api && exports?.FeatureResolver) {
			featureResolver = exports?.FeatureResolver.instance();
			api = new exports.Api();
		}
	}).catch(errors => {
		ui_notification.UI.Notification.Center.notify({
			content: errors[0].message,
			autoHideDelay: 5000
		});
	});
	class SignB2eDocument extends Base {
		#isCancellationInProgress = false;
		static isItemSupported(item) {
			return item.getType() === 'SignB2eDocument' || item.getType() === 'Activity:SignB2eDocument';
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			const documentId = main_core.Text.toInteger(actionData?.documentId);
			const processUri = actionData?.processUri;
			const documentHash = actionData?.documentHash || '';
			if (action === 'Activity:SignB2eDocument:ShowSigningCancel') {
				this.#cancelWithConfirm(actionData?.documentUid);
			} else if ((action === 'SignB2eDocument:ShowSigningProcess' || action === 'Activity:SignB2eDocument:ShowSigningProcess') && processUri.length > 0) {
				this.#showSigningProcess(processUri);
			} else if ((action === 'SignB2eDocument:Preview' || action === 'Activity:SignB2eDocument:Preview') && documentId > 0) {
				this.#previewDocument(actionData);
			} else if ((action === 'SignB2eDocument:CreateDocumentChat' || action === 'Activity:SignB2eDocument:CreateDocumentChat') && documentId > 0) {
				if (featureResolver && featureResolver.released('createDocumentChat')) {
					this.#createDocumentChat(actionData);
				}
			} else if ((action === 'SignB2eDocument:Modify' || action === 'Activity:SignB2eDocument:Modify') && documentId > 0) {
				this.#modifyDocument(actionData);
			} else if (action === 'SignB2eDocument:Resend' && documentId > 0 && actionData?.recipientHash) {
				// eslint-disable-next-line promise/catch-or-return
				this.#resendDocument(actionData, animationCallbacks).then(() => {
					if (actionData.buttonId) {
						const btn = item.getLayoutFooterButtonById(actionData.buttonId);
						btn.disableWithTimer(60);
					}
				});
			} else if (action === 'SignB2eDocument:TouchSigner' && documentId > 0) {
				this.#touchSigner(actionData);
			} else if (action === 'SignB2eDocument:Download' && documentHash) {
				this.#download(actionData, animationCallbacks);
			} else if (action === 'SignB2eDocumentEntry:Delete' && actionData?.entryId) {
				ui_dialogs_messagebox.MessageBox.show({
					message: actionData?.confirmationText || '',
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
					onYes: () => {
						return this.#deleteEntry(actionData.entryId);
					},
					onNo: messageBox => {
						messageBox.close();
					}
				});
			} else if (action === 'SignB2eDocument:ModifyDateSignUntil') {
				this.#modifyDateSignUntil(item, actionData, animationCallbacks);
			}
		}
		#cancelWithConfirm(documentUid) {
			if (this.#isCancellationInProgress) {
				return;
			}
			const signingCancelationDialog = new ui_dialogs_messagebox.MessageBox({
				title: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_DIALOG_TITLE'),
				message: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_DIALOG_TEXT'),
				modal: true
			});
			signingCancelationDialog.setButtons([new BX.UI.Button({
				text: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_DIALOG_YES_BUTTON_TEXT'),
				color: BX.UI.Button.Color.DANGER,
				onclick: () => {
					this.#isCancellationInProgress = true;
					signingCancelationDialog.close();
					this.#cancelSigningProcess(documentUid).finally(() => {
						this.#isCancellationInProgress = false;
					});
				}
			}), new BX.UI.Button({
				text: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_DIALOG_NO_BUTTON_TEXT'),
				color: BX.UI.Button.Color.LIGHT_BORDER,
				onclick: () => {
					signingCancelationDialog.close();
				}
			})]);
			signingCancelationDialog.show();
		}
		#cancelSigningProcess(documentUid) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('sign.api_v1.document.signing.stop', {
					data: {
						uid: documentUid
					},
					preparePost: false,
					headers: [{
						name: 'Content-Type',
						value: 'application/json'
					}]
				}).then(response => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_SIGNING_CANCEL_SUCCESS'),
						autoHideDelay: 5000
					});
					resolve(response);
				}, response => {
					response.errors.forEach(error => {
						ui_notification.UI.Notification.Center.notify({
							content: error.message,
							autoHideDelay: 5000
						});
					});
					reject(response.errors);
				}).catch(() => {
					reject();
				});
			});
		}
		#deleteEntry(entryId) {
			console.log(`delete entry${entryId}`);
		}
		#showSigningProcess(processUri) {
			return crm_router.Router.openSlider(processUri);
		}
		#modifyDocument({
			documentId
		}) {
			return crm_router.Router.openSlider(`/sign/b2e/doc/0/?docId=${documentId}&stepId=changePartner&noRedirect=Y`, {
				width: 1250
			});
		}
		#previewDocument({
			documentId
		}) {
			return crm_router.Router.openSlider(`/sign/b2e/preview/0/?docId=${documentId}&noRedirect=Y`);
		}
		async #createDocumentChat({
			chatType,
			documentId
		}) {
			if (api && featureResolver && featureResolver.released('createDocumentChat')) {
				const chatId = (await api.createDocumentChat(chatType, documentId, false)).chatId;
				main_core.Runtime.loadExtension('im.public.iframe').then(exports => {
					exports.Messenger.openChat(`chat${chatId}`);
				}).catch(exception => {
					console.error('Error loading "im.public.iframe":', exception);
				});
			}
		}
		#resendDocument({
			documentId,
			recipientHash
		}, animationCallbacks) {
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('sign.internal.document.resendFile', {
					data: {
						memberHash: recipientHash,
						documentId
					}
				}).then(() => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_SIGN_DOCUMENT_RESEND_SUCCESS'),
						autoHideDelay: 5000
					});
					if (animationCallbacks.onStop) {
						animationCallbacks.onStop();
					}
					resolve();
				}, response => {
					ui_notification.UI.Notification.Center.notify({
						content: response.errors[0].message,
						autoHideDelay: 5000
					});
					if (animationCallbacks.onStop) {
						animationCallbacks.onStop();
					}
					reject();
				});
				console.log(`resend document ${documentId} for ${recipientHash}`);
			});
		}
		#touchSigner({
			documentId
		}) {
			console.log(`touch signer document ${documentId}`);
		}
		#download({
			filename,
			downloadLink
		}, animationCallbacks) {
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			const link = document.createElement('a');
			link.href = downloadLink;
			link.setAttribute('download', filename || '');
			main_core.Dom.document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			if (animationCallbacks.onStop) {
				animationCallbacks.onStop();
			}
		}
		async #modifyDateSignUntil(item, actionData, animationCallbacks) {
			if (!actionData.uid || !actionData.valueTs) {
				return;
			}
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			const {
				uid,
				valueTs
			} = actionData;
			try {
				await api.modifyDateSignUntil(uid, valueTs);
			} catch {
				item.forceRefreshLayout();
			}
			if (animationCallbacks.onStop) {
				animationCallbacks.onStop();
			}
		}
	}

	class SignDocument extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			const documentId = main_core.Text.toInteger(actionData?.documentId);
			const documentHash = actionData?.documentHash || '';
			const activityId = main_core.Text.toInteger(actionData?.activityId);
			if ((action === 'SignDocument:Open' || action === 'Activity:SignDocument:Open') && documentId > 0) {
				this.#openDocument(actionData);
			} else if ((action === 'SignDocument:Modify' || action === 'Activity:SignDocument:Modify') && documentId > 0) {
				this.#modifyDocument(actionData);
			} else if ((action === 'SignDocument:UpdateActivityDeadline' || action === 'Activity:SignDocument:UpdateActivityDeadline') && activityId > 0) {
				this.#updateActivityDeadline(activityId, actionData?.value);
			} else if (action === 'SignDocument:Resend' && documentId > 0 && actionData?.recipientHash) {
				this.#resendDocument(actionData, animationCallbacks).then(() => {
					if (actionData.buttonId) {
						const btn = item.getLayoutFooterButtonById(actionData.buttonId);
						btn.disableWithTimer(60);
					}
				});
			} else if (action === 'SignDocument:TouchSigner' && documentId > 0) {
				this.#touchSigner(actionData);
			} else if (action === 'SignDocument:Download' && documentHash) {
				this.#download(actionData, animationCallbacks);
			} else if (action === 'SignDocumentEntry:Delete' && actionData?.entryId) {
				ui_dialogs_messagebox.MessageBox.show({
					message: actionData?.confirmationText || '',
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
					onYes: () => {
						return this.#deleteEntry(actionData.entryId);
					},
					onNo: messageBox => {
						messageBox.close();
					}
				});
			}
		}
		#deleteEntry(entryId) {
			console.log('delete entry' + entryId);
		}
		#openDocument({
			documentId,
			memberHash
		}) {
			return crm_router.Router.Instance.openSignDocumentSlider(documentId, memberHash);
		}
		#modifyDocument({
			documentId
		}) {
			return crm_router.Router.Instance.openSignDocumentModifySlider(documentId);
		}
		async #updateActivityDeadline(activityId, value) {
			const valueInSiteFormat = main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateFormat(), value);
			let response;
			try {
				response = await main_core.ajax.runAction('crm.timeline.signdocument.updateActivityDeadline', {
					data: {
						activityId: activityId,
						activityDeadline: valueInSiteFormat
					}
				});
			} catch (responseWithError) {
				console.error(responseWithError);
				return;
			}
			const newCreateDate = response.data.document?.activityDeadline;
			if (valueInSiteFormat !== newCreateDate) {
				console.error("Updated document create date without errors, but for some reason date from the backend doesn't match sent value");
			}
		}
		#resendDocument({
			documentId,
			recipientHash
		}, animationCallbacks) {
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('sign.internal.document.resendFile', {
					data: {
						memberHash: recipientHash,
						documentId: documentId
					}
				}).then(() => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_SIGN_DOCUMENT_RESEND_SUCCESS'),
						autoHideDelay: 5000
					});
					if (animationCallbacks.onStop) {
						animationCallbacks.onStop();
					}
					resolve();
				}, response => {
					ui_notification.UI.Notification.Center.notify({
						content: response.errors[0].message,
						autoHideDelay: 5000
					});
					if (animationCallbacks.onStop) {
						animationCallbacks.onStop();
					}
					reject();
				});
				console.log('resend document ' + documentId + ' for ' + recipientHash);
			});
		}
		#touchSigner({
			documentId
		}) {
			console.log('touch signer document ' + documentId);
		}
		#download({
			filename,
			downloadLink
		}, animationCallbacks) {
			if (animationCallbacks.onStart) {
				animationCallbacks.onStart();
			}
			const link = document.createElement('a');
			/*link.href = '/bitrix/services/main/ajax.php?action=sign.document.getFileForSrc' +
				'&memberHash=' + memberHash +
				'&documentHash=' + documentHash;*/
			link.href = downloadLink;
			link.setAttribute('download', filename || '');
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			if (animationCallbacks.onStop) {
				animationCallbacks.onStop();
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'SignDocument' || item.getType() === 'Activity:SignDocument';
		}
	}

	async function tryToResendWithMessage(params) {
		const menuBar = BX.Crm?.Timeline?.MenuBar?.getDefault();
		if (!menuBar) {
			return false;
		}
		const messageItem = menuBar.getItemById('message');
		if (!messageItem) {
			return false;
		}
		if (await messageItem.shouldConfirmStateChange(params)) {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
			const {
				isCancelled
			} = await confirmStateChange();
			if (isCancelled) {
				return true;
			}
		}
		menuBar.scrollIntoView();
		menuBar.setActiveItemById('message');
		void messageItem.tryToResend(params);
		return true;
	}
	function confirmStateChange() {
		return new Promise(resolve => {
			ui_dialogs_messagebox.MessageBox.show({
				modal: true,
				title: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_MESSAGE_RESEND_CONFIRM_DIALOG_TITLE'),
				message: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_MESSAGE_RESEND_CONFIRM_DIALOG_MESSAGE'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_OK_BTN'),
				onOk: messageBox => {
					messageBox.close();
					resolve({
						isCancelled: false
					});
				},
				onCancel: messageBox => {
					messageBox.close();
					resolve({
						isCancelled: true
					});
				}
			});
		});
	}

	class Sms extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Activity:Sms:Resend' && main_core.Type.isPlainObject(actionData.params)) {
				void this.#resendSms(actionData.params);
			}
		}
		async #resendSms(params) {
			const messageParams = {
				backend: {
					senderCode: params.senderCode,
					id: params.senderId
				},
				fromId: params.from,
				client: params.client,
				text: params.text
			};
			if (await tryToResendWithMessage(messageParams)) {
				return;
			}
			const menuBar = BX.Crm?.Timeline?.MenuBar?.getDefault();
			if (!menuBar) {
				throw new Error('"BX.Crm?.Timeline.MenuBar" component not found');
			}
			const smsItem = menuBar.getItemById('sms');
			if (!smsItem) {
				throw new Error('"BX.Crm.Timeline.MenuBar.Sms" component not found');
			}
			const goToEditor = () => {
				menuBar.scrollIntoView();
				menuBar.setActiveItemById('sms');
				smsItem.tryToResend(params.senderId, params.from, params.client, params.text);
			};
			const {
				text,
				templateId
			} = smsItem.getSendData();
			if (main_core.Type.isStringFilled(text) || templateId !== null) {
				ui_dialogs_messagebox.MessageBox.show({
					modal: true,
					title: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_TITLE'),
					message: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_MESSAGE'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					okCaption: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_OK_BTN'),
					onOk: messageBox => {
						messageBox.close();
						goToEditor();
					},
					onCancel: messageBox => messageBox.close()
				});
			} else {
				goToEditor();
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:Sms';
		}
	}

	class Task extends Base {
		static isItemSupported(item) {
			return item.getType() === 'Activity:TasksTask' || item.getType() === 'TasksTaskCreation' || item.getType() === 'TasksTaskModification' || item.getType() === 'Activity:TasksTaskComment';
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData,
				animationCallbacks
			} = actionParams;
			if (!actionData) {
				return;
			}
			const taskId = actionData.taskId ?? null;
			if (!taskId) {
				return;
			}
			if (actionType !== 'jsEvent') {
				return;
			}
			switch (action) {
				case 'Task:Ping':
					this.ping(actionData);
					break;
				case 'Task:ChangeDeadline':
					this.changeDeadline(item, actionData);
					break;
				case 'Task:View':
					this.view(actionData);
					break;
				case 'Task:Edit':
					this.edit(actionData);
					break;
				case 'Task:Delete':
					this.delete(item, actionData);
					break;
				case 'Task:ResultView':
					this.viewResult(actionData);
					break;
			}
		}
		ping(actionData) {
			if (!actionData.taskId) {
				return;
			}
			main_core.ajax.runAction('tasks.task.ping', {
				data: {
					taskId: actionData.taskId
				}
			}).then(response => {
				if (response.status === 'success') {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_TASK_PING_SENT'),
						autoHideDelay: 3000
					});
				}
			});
		}
		changeDeadline(item, actionData) {
			if (!actionData.taskId || !actionData.value) {
				return;
			}
			main_core.ajax.runAction('tasks.task.update', {
				data: {
					taskId: actionData.taskId,
					fields: {
						DEADLINE: new Date(actionData.valueTs * 1000).toISOString()
					},
					params: {
						skipTimeZoneOffset: 'DEADLINE'
					}
				}
			}).catch(response => {
				const errors = response.errors ?? null;
				if (errors.length > 0) {
					ui_notification.UI.Notification.Center.notify({
						content: errors[0].message,
						autoHideDelay: 3000
					});
					item.forceRefreshLayout();
				}
			});
		}
		view(actionData) {
			if (!actionData.path) {
				return;
			}
			BX.SidePanel.Instance.open(actionData.path, {
				cacheable: false
			});
		}
		edit(actionData) {
			if (!actionData.path) {
				return;
			}
			BX.SidePanel.Instance.open(actionData.path, {
				cacheable: false
			});
		}
		delete(item, actionData) {
			if (!actionData.taskId) {
				return;
			}
			const entityTypeName = this.#getEntityTypeName(item);
			const messageBox = new ui_dialogs_messagebox.MessageBox({
				message: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_TASK_CONFIRM_DELETE'),
				buttons: BX.UI.Dialogs.MessageBoxButtons.YES_NO,
				onYes: () => {
					main_core.ajax.runAction('tasks.V2.Task.delete', {
						json: {
							taskId: actionData.taskId
						},
						analytics: {
							tool: 'tasks',
							category: 'task_operations',
							event: 'task_delete',
							type: 'task',
							c_section: 'crm',
							c_sub_section: entityTypeName,
							c_element: 'context_menu'
						}
					}).then(() => {
						messageBox.close();
					}).catch(error => {
						ui_notification.UI.Notification.Center.notify({
							content: error.errors[0].message ?? 'Error',
							autoHideDelay: 3000
						});
						messageBox.close();
					});
				},
				onNo: () => {
					messageBox.close();
				}
			});
			messageBox.show();
		}
		#getEntityTypeName(item) {
			const ownerTypeId = item.getOwnerTypeId();
			if (!ownerTypeId) {
				return null;
			}
			const entityTypeName = BX.CrmEntityType.resolveName(ownerTypeId);
			if (!entityTypeName) {
				return null;
			}
			return entityTypeName.toLowerCase();
		}
		viewResult(actionData) {
			if (!actionData.taskId) {
				return;
			}
			if (!actionData.path) {
				return;
			}
			main_core.ajax.runAction('tasks.task.result.getLast', {
				data: {
					taskId: actionData.taskId
				}
			}).then(response => {
				if (response.status === 'success') {
					const resultId = response.data.result;
					BX.SidePanel.Instance.open(actionData.path + '?RID=' + resultId, {
						cacheable: false
					});
				}
			});
		}
	}

	class Telegram extends Base {
		getDeleteActionMethod() {
			return 'crm.timeline.activity.delete';
		}
		getDeleteActionCfg(recordId, ownerTypeId, ownerId) {
			return {
				data: {
					activityId: recordId,
					ownerTypeId,
					ownerId
				}
			};
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Activity:Telegram:Resend' && main_core.Type.isPlainObject(actionData.params)) {
				void this.#resendTelegram(actionData.params);
			}
		}
		async #resendTelegram(params) {
			const messageParams = {
				backend: {
					senderCode: params.senderCode,
					id: params.senderId
				},
				fromId: params.from,
				client: params.client,
				text: params.text
			};
			const wasResendAvailable = await tryToResendWithMessage(messageParams);
			if (!wasResendAvailable) {
				console.error('BX.Crm.Timeline.Item.Controllers.Telegram: could not resend message via message menubar item');
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:Telegram';
		}
	}

	class ToDo extends Base {
		#responsibleUserSelectorDialog = null;
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'ColorSelector:Change' && actionData) {
				this.#runUpdateColorAction(item, actionData);
			}
			if (action === 'EditableDescription:StartEdit') {
				item.highlightContentBlockById('description', true);
			}
			if (action === 'EditableDescription:FinishEdit') {
				item.highlightContentBlockById('description', false);
			}
			if (action === 'Activity:ToDo:AddFile' && actionData) {
				this.#showFileUploaderPopup(item, actionData);
			}
			if (action === 'Activity:ToDo:ChangeResponsible' && actionData) {
				this.#showResponsibleUserSelector(item, actionData);
			}
			if (action === 'Activity:ToDo:Repeat' && actionData) {
				this.#emitRepeatTodo(item, actionData);
			}
			if (action === 'Activity:ToDo:Update' && actionData) {
				this.#emitUpdateTodo(item, actionData);
			}
			if (action === 'Activity:ToDo:ShowCalendar' && actionData) {
				this.#showCalendar(item, actionData);
			}
			if (action === 'Activity:ToDo:Client:Click' && actionData) {
				this.#openClient(actionData.entityId, actionData.entityTypeId);
			}
			if (action === 'Activity:ToDo:User:Click' && actionData) {
				this.#openUser(actionData.userId);
			}
		}
		#showFileUploaderPopup(item, actionData) {
			const isValidParams = main_core.Type.isNumber(actionData.entityId) && main_core.Type.isNumber(actionData.entityTypeId) && main_core.Type.isNumber(actionData.ownerId) && main_core.Type.isNumber(actionData.ownerTypeId);
			if (!isValidParams) {
				return;
			}
			actionData.files = actionData.files.split(',').filter(id => main_core.Type.isNumber(id));
			const fileList = item.getLayoutContentBlockById('fileList');
			if (fileList) {
				fileList.showFileUploaderPopup(actionData);
			} else {
				const popup = new crm_activity_fileUploaderPopup.FileUploaderPopup(actionData);
				popup.show();
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:ToDo';
		}
		#showResponsibleUserSelector(item, actionData) {
			const isValidParams = main_core.Type.isNumber(actionData.id) && main_core.Type.isNumber(actionData.ownerId) && main_core.Type.isNumber(actionData.ownerTypeId) && main_core.Type.isNumber(actionData.responsibleId);
			if (!isValidParams) {
				return;
			}
			this.#responsibleUserSelectorDialog = new ui_entitySelector.Dialog({
				id: 'responsible-user-selector-dialog-' + actionData.id,
				targetNode: item.getLayoutFooterMenu().$el,
				context: 'CRM_ACTIVITY_TODO_RESPONSIBLE_USER',
				multiple: false,
				dropdownMode: true,
				showAvatars: true,
				enableSearch: true,
				width: 450,
				entities: [{
					id: 'user'
				}],
				preselectedItems: [['user', actionData.responsibleId]],
				undeselectedItems: [['user', actionData.responsibleId]],
				events: {
					'Item:onSelect': event => {
						const selectedItem = event.getData().item.getDialog().getSelectedItems()[0];
						if (selectedItem) {
							this.#runResponsibleUserAction(actionData.id, actionData.ownerId, actionData.ownerTypeId, selectedItem.getId());
						}
					},
					'Item:onDeselect': event => {
						setTimeout(() => {
							const selectedItems = this.#responsibleUserSelectorDialog.getSelectedItems();
							if (selectedItems.length === 0) {
								this.#responsibleUserSelectorDialog.hide();
								this.#runResponsibleUserAction(actionData.id, actionData.ownerId, actionData.ownerTypeId, actionData.responsibleId);
							}
						}, 100);
					}
				}
			});
			this.#responsibleUserSelectorDialog.show();
		}
		#emitRepeatTodo(item, actionData) {
			main_core_events.EventEmitter.emit('crm:timeline:todo:repeat', actionData);
		}
		#emitUpdateTodo(item, actionData) {
			main_core_events.EventEmitter.emit('crm:timeline:todo:update', actionData);
		}
		#runUpdateColorAction(item, actionData) {
			const {
				id,
				ownerTypeId,
				ownerId
			} = item.getDataPayload();
			const {
				colorId
			} = actionData;
			const isValidParams = main_core.Type.isNumber(id) && main_core.Type.isNumber(ownerId) && main_core.Type.isNumber(ownerTypeId) && main_core.Type.isStringFilled(colorId);
			if (!isValidParams) {
				return;
			}
			const data = {
				ownerTypeId,
				ownerId,
				id,
				colorId
			};
			main_core.ajax.runAction('crm.activity.todo.updateColor', {
				data
			}).catch(response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000
				});
				throw response;
			});
		}
		#showCalendar(item, actionData) {
			const {
				calendarEventId,
				entryDateFrom,
				timezoneOffset
			} = actionData;
			if (!window.top.BX.Calendar) {
				// eslint-disable-next-line no-console
				console.warn('BX.Calendar not found');
				return;
			}
			new window.top.BX.Calendar.SliderLoader(calendarEventId, {
				entryDateFrom,
				timezoneOffset,
				calendarContext: null
			}).show();
		}
		#runResponsibleUserAction(id, ownerId, ownerTypeId, responsibleId) {
			const data = {
				ownerTypeId,
				ownerId,
				id,
				responsibleId
			};
			main_core.ajax.runAction('crm.activity.todo.updateResponsibleUser', {
				data
			}).catch(response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000
				});
				throw response;
			});
		}
		#openClient(entityId, entityTypeId) {
			if (ui_sidepanel.SidePanel.Instance) {
				const entityTypeName = BX.CrmEntityType.resolveName(entityTypeId).toLowerCase();
				const path = `/crm/${entityTypeName}/details/${entityId}/`;
				ui_sidepanel.SidePanel.Instance.open(path);
			}
		}
		#openUser(userId) {
			if (ui_sidepanel.SidePanel.Instance) {
				const path = `/company/personal/user/${userId}/`;
				ui_sidepanel.SidePanel.Instance.open(path);
			}
		}
	}

	class Visit extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Activity:Visit:ChangePlayerState' && actionData && actionData.recordId) {
				this.#changePlayerState(item, actionData.recordId);
			}
			if (action === 'Activity:Visit:Schedule' && actionData) {
				this.runScheduleAction(actionData.activityId, actionData.scheduleDate);
			}
		}
		#changePlayerState(item, recordId) {
			const player = item?.getLayoutContentBlockById('visitGroupOfBlocks')?.getBlockById('audio');
			if (!player) {
				return;
			}
			if (recordId !== player.id) {
				return;
			}
			if (player.state === 'play') {
				player.pause();
			} else {
				player.play();
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:Visit';
		}
	}

	class WhatsApp extends Base {
		getDeleteActionMethod() {
			return 'crm.timeline.activity.delete';
		}
		getDeleteActionCfg(recordId, ownerTypeId, ownerId) {
			return {
				data: {
					activityId: recordId,
					ownerTypeId,
					ownerId,
					analytics: this.#buildAnalyticsData()
				}
			};
		}
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent') {
				return;
			}
			if (action === 'Activity:Whatsapp:Resend' && main_core.Type.isPlainObject(actionData.params)) {
				void this.#resendWhatsApp(actionData.params);
			}
		}
		async #resendWhatsApp(params) {
			const messageParams = {
				backend: {
					senderCode: params.senderCode,
					id: params.senderId
				},
				fromId: params.from,
				client: params.client,
				template: params.template
			};
			if (await tryToResendWithMessage(messageParams)) {
				return;
			}
			const menuBar = BX.Crm?.Timeline?.MenuBar?.getDefault();
			if (!menuBar) {
				throw new Error('"BX.Crm?.Timeline.MenuBar" component not found');
			}
			const whatsAppItem = menuBar.getItemById('whatsapp');
			if (!whatsAppItem) {
				throw new Error('"BX.Crm.Timeline.MenuBar.WhatsApp" component not found');
			}
			const goToEditor = () => {
				menuBar.scrollIntoView();
				menuBar.setActiveItemById('whatsapp');
				whatsAppItem.tryToResend(params.template, params.from, params.client);
			};
			const templateId = params.template?.ORIGINAL_ID;
			const filledPlaceholders = params.template?.FILLED_PLACEHOLDERS ?? [];
			const currentTemplateId = whatsAppItem.getTemplate()?.ORIGINAL_ID;
			const currentFilledPlaceholders = whatsAppItem.getTemplate()?.FILLED_PLACEHOLDERS ?? [];
			if (main_core.Type.isNumber(templateId) && templateId > 0 && main_core.Type.isNumber(currentTemplateId) && currentTemplateId > 0 && (templateId !== currentTemplateId || JSON.stringify(filledPlaceholders) !== JSON.stringify(currentFilledPlaceholders))) {
				ui_dialogs_messagebox.MessageBox.show({
					modal: true,
					title: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_WHATSAPP_RESEND_CONFIRM_DIALOG_TITLE'),
					message: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_WHATSAPP_RESEND_CONFIRM_DIALOG_MESSAGE'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					okCaption: main_core.Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_OK_BTN'),
					onOk: messageBox => {
						messageBox.close();
						goToEditor();
					},
					onCancel: messageBox => messageBox.close()
				});
			} else {
				goToEditor();
			}
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:Whatsapp';
		}
		#buildAnalyticsData(ownerTypeId) {
			return crm_integration_analytics.Builder.Communication.DeleteEvent.createDefault(ownerTypeId).setElement(crm_integration_analytics.Dictionary.ELEMENT_WA_MESSAGE_DELETE).buildData();
		}
	}

	const DOWNLOAD_DELAY = 300;
	class Zoom extends Base {
		onItemAction(item, actionParams) {
			const {
				action,
				actionType,
				actionData
			} = actionParams;
			if (actionType !== 'jsEvent' || !actionData) {
				return;
			}
			if (action === 'Activity:Zoom:CopyInviteUrl') {
				this.#copyToClipboard(actionData.url);
			}
			if (action === 'Activity:Zoom:Schedule') {
				this.runScheduleAction(actionData.activityId, actionData.scheduleDate);
			}
			if (action === 'Activity:Zoom:CopyPassword') {
				this.#copyToClipboard(actionData.password);
			}
			if (action === 'Activity:Zoom:DownloadAllRecords' && main_core.Type.isArray(actionData.urlList)) {
				this.#downloadAllRecords(actionData.urlList);
			}
		}
		#copyToClipboard(input) {
			if (main_core.Type.isStringFilled(input)) {
				const isSuccess = BX.clipboard.copy(input);
				if (isSuccess) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_COMMON_ACTION_COPY_TO_CLIPBOARD_SUCCESS'),
						autoHideDelay: 2000
					});
				}
			}
		}
		#downloadAllRecords(urlList) {
			const download = urls => {
				const url = urls.pop();
				const a = document.createElement('a');
				a.setAttribute('href', url);
				if ('download' in a) {
					a.setAttribute('download', `zoom_record_file_${main_core.Text.getRandom(5)}.m4a`);
				}
				a.setAttribute('target', '_blank');
				a.click();
				if (urls.length === 0) {
					clearInterval(interval);
				}
			};
			const interval = setInterval(download, DOWNLOAD_DELAY, urlList);
		}
		static isItemSupported(item) {
			return item.getType() === 'Activity:Zoom';
		}
	}

	ControllerManager.registerController(Activity);
	ControllerManager.registerController(CommonContentBlocks);
	ControllerManager.registerController(OpenLines);
	ControllerManager.registerController(Modification);
	ControllerManager.registerController(SignDocument);
	ControllerManager.registerController(Document);
	ControllerManager.registerController(Call);
	ControllerManager.registerController(ToDo);
	ControllerManager.registerController(Helpdesk);
	ControllerManager.registerController(Payment);
	ControllerManager.registerController(DealProductList);
	ControllerManager.registerController(Email);
	ControllerManager.registerController(OrderCheck);
	ControllerManager.registerController(FinalSummary);
	ControllerManager.registerController(SalescenterApp);
	ControllerManager.registerController(Delivery);
	ControllerManager.registerController(RestApp);
	ControllerManager.registerController(Comment);
	ControllerManager.registerController(Sharing);
	ControllerManager.registerController(Task);
	ControllerManager.registerController(CallTranscriptResult);
	ControllerManager.registerController(TranscriptSummaryResult);
	ControllerManager.registerController(EntityFieldsFillingResult);
	ControllerManager.registerController(CallScoringResult);
	ControllerManager.registerController(SignB2eDocument);
	ControllerManager.registerController(Visit);
	ControllerManager.registerController(Zoom);
	ControllerManager.registerController(Sms);
	ControllerManager.registerController(WhatsApp);
	ControllerManager.registerController(Telegram);
	ControllerManager.registerController(Bizproc);
	ControllerManager.registerController(Booking);
	ControllerManager.registerController(WaitListItem);
	ControllerManager.registerController(RepeatSale);
	ControllerManager.registerController(EntityExclusion);

	exports.BaseController = Base;
	exports.ConfigurableItem = ConfigurableItem;
	exports.ControllerManager = ControllerManager;
	exports.Item = Item;
	exports.StreamType = StreamType;

})(this.BX.Crm.Timeline = this.BX.Crm.Timeline || {}, BX.Crm.Timeline, BX, BX.Vue3, BX, BX.UI.IconSet, BX.Main, BX, BX.UI.Analytics, BX.UI.Notification, BX.UI, BX.UI.System, BX.UI, BX.Vue3.Directives, BX.Main, BX.UI.IconSet, BX.Vue3.Components, BX.Crm.Field, BX.Event, window, BX.UI.System.Label, BX.UI, BX.Crm, BX.UI.Dialogs, BX.UI.EntitySelector, BX, BX.UI, window, BX.SidePanel, BX.Calendar.Sharing, BX.Calendar, BX.Crm.AI, BX.UI.Feedback, BX.Crm.AI, BX.UI.System.Chip.Vue, BX.Location.Core, BX.Location.Widget, BX.UI.System.Typography.Vue, BX.Crm.Timeline.Editors, BX.UI.BBCode.Formatter, BX.UI.TextEditor, BX.UI, BX, BX.UI, BX.UI, BX.Crm.Activity, BX.UI.Icons.Generator, BX.Crm, window, window, BX.Crm.Field, BX.Currency, BX.UI, BX.Crm.Field, BX.Bizproc, BX.UI, BX, BX, BX.Crm, BX, BX.Crm.Integration.Analytics);
//# sourceMappingURL=index.bundle.js.map

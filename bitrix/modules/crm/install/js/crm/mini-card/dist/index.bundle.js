/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_notification, ui_vue3, ui_iconSet_api_vue, ui_iconSet_crm, ui_iconSet_outline, ui_buttons, ui_dialogs_messagebox, ui_iconSet_api_core, main_core_cache) {
	'use strict';

	class Component {
		constructor(options) {
			if (!main_core.Type.isStringFilled(options.componentName)) {
				throw new RangeError('BX.Crm.MiniCard.Component: options.componentName must be a string filled');
			}
			if (!main_core.Type.isPlainObject(options.componentProps)) {
				throw new RangeError('BX.Crm.MiniCard.Component: options.componentProps must be a plain object');
			}
			this.componentName = options.componentName;
			this.componentProps = options.componentProps;
		}
	}

	class MiniCardItem {
		constructor(options) {
			this.id = main_core.Type.isStringFilled(options.id) ? options.id : main_core.Text.getRandom(16);
			if (!main_core.Type.isStringFilled(options.title)) {
				throw new RangeError('BX.Crm.MiniCard.MiniCardItem: options.title must be a string filled');
			}
			this.title = options.title;
			this.avatar = new Component(options.avatar);
			this.controls = [];
			options.controls.forEach(controlOptions => {
				this.controls.push(new Component(controlOptions));
			});
			this.fields = [];
			options.fields.forEach(fieldOptions => {
				this.fields.push(new Component(fieldOptions));
			});
			this.footerNotes = [];
			options.footerNotes.forEach(footerNoteOptions => {
				this.footerNotes.push(new Component(footerNoteOptions));
			});
		}
	}

	const Loader = {
		name: 'Loader',
		template: `
		<div class="crm-mini-card__loader"></div>
	`
	};

	const Avatar = {
		name: 'Avatar',
		template: `
		<div class="crm-mini-card__avatar">
			<slot />
		</div>
	`
	};

	const ImageAvatar = {
		name: 'ImageAvatar',
		components: {
			Avatar
		},
		props: {
			url: {
				type: String,
				required: true
			}
		},
		computed: {
			encodeUri() {
				return encodeURI(this.url);
			}
		},
		template: `
		<Avatar class="--image">
			<img :src="encodeUri" alt=""/>
		</Avatar>
	`
	};

	const IconAvatar = {
		name: 'IconAvatar',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Avatar
		},
		props: {
			iconOptions: {
				type: Object,
				required: true
			},
			bgColor: {
				type: String,
				default: null
			}
		},
		computed: {
			containerStyles() {
				const styleBgColor = this.styleBgColor();
				if (styleBgColor === null) {
					return {};
				}
				return {
					backgroundColor: styleBgColor
				};
			}
		},
		methods: {
			styleBgColor() {
				if (!this.bgColor) {
					return null;
				}
				if (this.bgColor.startsWith('--')) {
					return `var(${this.bgColor})`;
				}
				return this.bgColor;
			}
		},
		template: `
		<Avatar class="--icon" :style="containerStyles">
			<BIcon v-bind="iconOptions" />
		</Avatar>
	`
	};

	const Control = {
		name: 'Control',
		template: `
		<div class="crm-mini-card__control">
			<slot />
		</div>
	`
	};

	const ButtonControl = {
		name: 'ButtonControl',
		components: {
			Control
		},
		props: {
			buttonOptions: {
				type: Object,
				required: true
			}
		},
		mounted() {
			new ui_buttons.Button(this.buttonOptions).renderTo(this.$refs.button.$el);
		},
		template: `
		<Control class="--button" ref="button" />
	`
	};

	const Field = {
		template: `
		<div class="crm-mini-card__field">
			<slot />
		</div>
	`
	};

	const FieldTitle = {
		template: `
		<div class="crm-mini-card__field-title">
			<slot />
		</div>
	`
	};

	const FieldValue = {
		template: `
		<div class="crm-mini-card__field-value">
			<slot />
		</div>
	`
	};

	const FieldValueList = {
		template: `
		<div class="crm-mini-card__field-value-list">
			<slot />
		</div>
	`
	};

	const ValueEllipsis = {
		name: 'ValueEllipsis',
		template: `
		<span class="crm-mini-card__value-ellipsis">
			<slot/>
		</span>
	`
	};

	const CommonField = {
		name: 'CommonField',
		components: {
			Field,
			FieldTitle,
			FieldValueList,
			FieldValue,
			ValueEllipsis
		},
		props: {
			title: {
				type: String,
				required: true
			},
			values: {
				type: Array,
				required: true
			}
		},
		template: `
		<Field class="--common">
			<FieldTitle>{{ title }}</FieldTitle>
			<FieldValueList>
				<FieldValue v-for="value in values">
					<ValueEllipsis :title="value">{{ value }}</ValueEllipsis>
				</FieldValue>
			</FieldValueList>
		</Field>
	`
	};

	class ActivityEditorService {
		#cache;
		constructor() {
			this.#cache = {};
		}
		async loadActivityEditor(ownerTypeId, ownerId, activityEditorContainer) {
			if (this.#cache[ownerTypeId]?.[ownerId]) {
				return this.#cache[ownerTypeId][ownerId];
			}
			const editorId = main_core.Text.getRandom(16);
			try {
				const response = await main_core.ajax.runAction('crm.item.minicard.getActivityEditor', {
					data: {
						ownerTypeId,
						ownerId,
						editorId
					}
				});
				await main_core.Runtime.html(activityEditorContainer, response?.data?.html ?? '');
				this.#cache[ownerTypeId] ??= {};
				this.#cache[ownerTypeId][ownerId] = BX.CrmActivityEditor.items[editorId];
			} catch (error) {
				console.error('BX.Crm.MiniCard.ActivityEditorService: Cannot load activity editor:', error);
				this.#cache[ownerTypeId] ??= {};
				this.#cache[ownerTypeId][ownerId] = BX.CrmActivityEditor.getDefault();
			}
			return this.#cache[ownerTypeId][ownerId];
		}
	}

	class CommunicationService {
		#serviceLocator;
		constructor(serviceLocator) {
			this.#serviceLocator = serviceLocator;
		}
		communicateByPhone(options) {
			if (!window.top.BXIM) {
				ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('CRM_MINI_CARD_COMMUNICATION_PHONE_NOT_SUPPORTS'));
				return;
			}
			const phoneToParams = {
				ENTITY_TYPE_NAME: BX.CrmEntityType.resolveName(options.entityTypeId),
				ENTITY_ID: options.entityId
			};
			if (options.ownerTypeId !== options.entityTypeId && options.ownerId !== options.entityId) {
				phoneToParams.BINDINGS = {
					OWNER_TYPE_NAME: BX.CrmEntityType.resolveName(options.ownerTypeId),
					OWNER_TYPE_ID: options.ownerTypeId
				};
			}
			window.top.BXIM.phoneTo(options.phone, phoneToParams);
		}
		communicateByEmail(options) {
			const error = () => {
				ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('CRM_MINI_CARD_COMMUNICATION_EMAIL_NOT_SUPPORTS'));
			};
			return new Promise((resolve, reject) => {
				this.#serviceLocator.getActivityEditorService().loadActivityEditor(options.ownerTypeId, options.ownerId, options.activityEditorContainer).then(editor => {
					if (!editor) {
						error();
						reject();
					}
					const isEmailAdded = editor.addEmail({
						ownerID: options.ownerId,
						ownerType: BX.CrmEntityType.resolveName(options.ownerTypeId),
						communicationsLoaded: true,
						communications: [{
							type: 'EMAIL',
							entityType: BX.CrmEntityType.resolveName(options.entityTypeId),
							entityId: options.entityId,
							value: options.email
						}]
					});
					if (!isEmailAdded) {
						window.location.href = `mailto:${options.email}`;
					}
					resolve();
				}).catch(() => {
					reject();
				});
			});
		}
		communicateByIM(options) {
			if (!window.top.BXIM) {
				ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('CRM_MINI_CARD_COMMUNICATION_IM_NOT_SUPPORTS'));
				return;
			}
			window.top.BXIM.openMessengerSlider(options.dialogId, {
				RECENT: 'N',
				MENU: 'N'
			});
		}
	}

	const EVENTS = {
		GLOBAL_ON_CLOSE_MAIN_POPUP: 'BX.Crm.MiniCard:OnMainPopupClose',
		GLOBAL_ON_MOUSE_ENTER_CHILD_POPUP: 'BX.Crm.MiniCard:onMouseEnterChildPopup',
		GLOBAL_ON_MOUSE_LEAVE_CHILD_POPUP: 'BX.Crm.MiniCard:onMouseLeaveChildPopup',
		INTERNAL_ON_CLOSE_MAIN_POPUP: 'crm:mini-card:on-close-main-popup',
		INTERNAL_ON_MOUSE_ENTER_CHILD_POPUP: 'crm:mini-card:on-mouse-enter-child-popup',
		INTERNAL_ON_MOUSE_LEAVE_CHILD_POPUP: 'crm:mini-card:on-mouse-leave-child-popup'
	};

	class EventService {
		registerChildPopup(eventEmitter, popup) {
			const popupContainer = popup.getPopupContainer();
			main_core.Event.bind(popupContainer, 'mouseenter', () => {
				eventEmitter.emit(EVENTS.INTERNAL_ON_MOUSE_ENTER_CHILD_POPUP);
			});
			main_core.Event.bind(popupContainer, 'mouseleave', () => {
				eventEmitter.emit(EVENTS.INTERNAL_ON_MOUSE_LEAVE_CHILD_POPUP);
			});
			eventEmitter.subscribe(EVENTS.INTERNAL_ON_CLOSE_MAIN_POPUP, () => {
				popup.close();
			});
		}
	}

	class ServiceLocator {
		static #instance = null;
		#activityEditorService = null;
		#communicationService = null;
		#eventService = null;
		static getInstance() {
			this.#instance = new ServiceLocator();
			return this.#instance;
		}
		getActivityEditorService() {
			this.#activityEditorService ??= new ActivityEditorService();
			return this.#activityEditorService;
		}
		getCommunicationService() {
			this.#communicationService ??= new CommunicationService(this);
			return this.#communicationService;
		}
		getEventService() {
			this.#eventService ??= new EventService();
			return this.#eventService;
		}
	}

	const ShowMore = {
		name: 'ShowMore',
		props: {
			count: {
				type: Number,
				required: true
			}
		},
		computed: {
			showMoreTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_MINI_CARD_SHOW_MORE', {
					'#COUNT#': this.count
				});
			}
		},
		template: `
		<span class="crm-mini-card__show-more">
			{{ showMoreTitle }}
		</span>
	`
	};

	const ShowMoreMenu = {
		name: 'ShowMoreMenu',
		components: {
			ShowMore
		},
		props: {
			items: {
				/** @type MenuOptions[] */
				type: Array,
				required: true
			}
		},
		methods: {
			getMenu() {
				if (!this.menu) {
					this.menu = new main_popup.Menu({
						items: this.items,
						bindElement: this.$refs.showMoreContainer.$el,
						angle: {
							offset: this.$refs.showMoreContainer.$el.offsetWidth / 2
						}
					});
					ServiceLocator.getInstance().getEventService().registerChildPopup(this.$Bitrix.eventEmitter, this.menu.getPopupWindow());
				}
				return this.menu;
			},
			toggleMenu() {
				this.getMenu().toggle();
			}
		},
		template: `
		<ShowMore ref="showMoreContainer" :count="items.length" @click="toggleMenu"/>
	`
	};

	const SHOWABLE_PHONES_LIMIT = 2;
	const PhoneField = {
		name: 'PhoneField',
		components: {
			Field,
			FieldTitle,
			FieldValue,
			FieldValueList,
			ValueEllipsis,
			ShowMoreMenu
		},
		props: {
			title: {
				type: String,
				required: true
			},
			/** @type Phone[] */
			phones: {
				type: Array,
				required: true
			}
		},
		computed: {
			showablePhones() {
				return this.phones.slice(0, SHOWABLE_PHONES_LIMIT);
			},
			hiddenPhones() {
				return this.phones.slice(SHOWABLE_PHONES_LIMIT);
			},
			hiddenPhoneItems() {
				return this.hiddenPhones.map(phone => {
					return {
						text: phone.value,
						href: phone.href,
						onclick: phone.onclick
					};
				});
			}
		},
		template: `
		<Field class="--phone">
			<FieldTitle>{{ title }}</FieldTitle>
			<FieldValueList>
				<FieldValue v-for="phone in showablePhones">
					<a class="--value-link" :href="phone.href" :onclick="phone.onclick">
						<ValueEllipsis :title="phone.value">{{ phone.value }}</ValueEllipsis>
					</a>
				</FieldValue>
				<ShowMoreMenu
					v-if="hiddenPhones.length > 0"
					:items="hiddenPhoneItems" 
				/>
			</FieldValueList>
		</Field>
	`
	};

	const SHOWABLE_EMAILS_LIMIT = 2;
	const EmailField = {
		name: 'EmailField',
		components: {
			Field,
			FieldTitle,
			FieldValue,
			FieldValueList,
			ValueEllipsis,
			ShowMoreMenu
		},
		props: {
			title: {
				type: String,
				required: true
			},
			emails: {
				/** @type Email[] */
				type: Array,
				required: true
			}
		},
		computed: {
			showableEmails() {
				return this.emails.slice(0, SHOWABLE_EMAILS_LIMIT);
			},
			hiddenEmails() {
				return this.emails.slice(SHOWABLE_EMAILS_LIMIT);
			},
			hiddenEmailItems() {
				return this.hiddenEmails.map(email => {
					return {
						text: email.value,
						onclick: () => {
							this.addEmail(email);
						}
					};
				});
			}
		},
		methods: {
			addEmail(email) {
				void ServiceLocator.getInstance().getCommunicationService().communicateByEmail({
					email: email.value,
					ownerTypeId: email.ownerTypeId,
					ownerId: email.ownerId,
					entityTypeId: email.ownerTypeId,
					entityId: email.ownerId,
					activityEditorContainer: this.$refs.activityEditorContainer
				});
			}
		},
		template: `
		<Field class="--email">
			<FieldTitle>{{ title }}</FieldTitle>
			<FieldValueList>
				<FieldValue v-for="email in showableEmails">
					<a class="--value-link" @click="addEmail(email)">
						<ValueEllipsis :title="email.value">{{ email.value }}</ValueEllipsis>
					</a>
				</FieldValue>
				<ShowMoreMenu
					v-if="hiddenEmails.length > 0"
					:items="hiddenEmailItems"
				/>
			</FieldValueList>
			<div ref="activityEditorContainer" hidden></div>
		</Field>
	`
	};

	const SHOWABLE_LINKS_LIMIT = 2;
	const LinkField = {
		name: 'LinkField',
		components: {
			Field,
			FieldTitle,
			FieldValueList,
			FieldValue,
			ValueEllipsis,
			ShowMoreMenu
		},
		props: {
			title: {
				type: String,
				required: true
			},
			links: {
				type: Array,
				required: true
			}
		},
		computed: {
			showableLinks() {
				return this.links.slice(0, SHOWABLE_LINKS_LIMIT);
			},
			hiddenLinks() {
				return this.links.slice(SHOWABLE_LINKS_LIMIT);
			},
			hiddenLinkItems() {
				return this.hiddenLinks.map(link => {
					return {
						text: link.title,
						href: link.href,
						target: link.target
					};
				});
			}
		},
		template: `
		<Field class="--link">
			<FieldTitle>{{ title }}</FieldTitle>
			<FieldValueList>
				<FieldValue v-for="link in showableLinks">
					<a
						class="--value-link"
						:href="link.href"
						:target="link.target"
					>
						<ValueEllipsis :title="link.title">{{ link.title }}</ValueEllipsis>
					</a>
				</FieldValue>
				<ShowMoreMenu
					v-if="hiddenLinks.length > 0"
					:items="hiddenLinkItems"
				/>
			</FieldValueList>
		</Field>
	`
	};

	const MoneyField = {
		name: 'MoneyField',
		components: {
			Field,
			FieldTitle,
			FieldValueList,
			FieldValue,
			ValueEllipsis
		},
		props: {
			title: {
				type: String,
				required: true
			},
			moneyList: {
				type: Array,
				required: true
			}
		},
		template: `
		<Field class="--money">
			<FieldTitle>{{ title }}</FieldTitle>
			<FieldValueList>
				<FieldValue v-for="money in moneyList">
					<ValueEllipsis v-html="money"/>
				</FieldValue>
			</FieldValueList>
		</Field>
	`
	};

	const StageField = {
		name: 'StageField',
		components: {
			Field,
			FieldTitle,
			FieldValue,
			ValueEllipsis
		},
		props: {
			title: {
				type: String,
				required: true
			},
			stage: {
				/** @type StageItem */
				type: Object,
				required: true
			}
		},
		template: `
		<Field class="--stage">
			<FieldTitle>{{ title }}</FieldTitle>
			<FieldValue>
				<div class="crm-mini-card__stage-color" :style="{ backgroundColor: stage.color }"></div>
				<ValueEllipsis :title="stage.name">{{ stage.name }}</ValueEllipsis>
			</FieldValue>
		</Field>
	`
	};

	const CommunicationType = Object.freeze({
		Phone: 'PHONE',
		Email: 'EMAIL',
		Im: 'IM'
	});
	const BUTTON_CONFIGURATION = Object.freeze({
		[CommunicationType.Phone]: {
			icon: ui_iconSet_api_core.Outline.PHONE_UP,
			removeRightCorners: true
		},
		[CommunicationType.Email]: {
			icon: ui_iconSet_api_core.Outline.MAIL,
			removeLeftCorners: true,
			removeRightCorners: true
		},
		[CommunicationType.Im]: {
			icon: ui_iconSet_api_core.Outline.OPEN_CHANNELS,
			removeLeftCorners: true
		}
	});
	const CommunicationControl = {
		name: 'CommunicationControl',
		props: {
			communications: {
				/** @type Communication[] */
				type: Array,
				required: true
			},
			entity: {
				/** @type Entity */
				type: Object,
				required: true
			}
		},
		buttons: null,
		data() {
			return {
				CommunicationType,
				communicationsByType: {
					[CommunicationType.Phone]: this.filterCommunication(CommunicationType.Phone),
					[CommunicationType.Email]: this.filterCommunication(CommunicationType.Email),
					[CommunicationType.Im]: this.filterCommunication(CommunicationType.Im)
				}
			};
		},
		mounted() {
			this.createButton(CommunicationType.Phone);
			this.createButton(CommunicationType.Email);
			this.createButton(CommunicationType.Im);
		},
		methods: {
			createButton(typeId) {
				const communicationButtonOptions = BUTTON_CONFIGURATION[typeId];
				const communicationsByType = this.communicationsByType[typeId];
				const buttonOptions = {
					size: ui_buttons.ButtonSize.EXTRA_SMALL,
					style: ui_buttons.AirButtonStyle.OUTLINE,
					useAirDesign: true,
					dropdown: false,
					...communicationButtonOptions
				};
				if (communicationsByType.length === 1) {
					buttonOptions.onclick = () => {
						this.communicate(communicationsByType[0]);
					};
				}
				if (communicationsByType.length > 1) {
					buttonOptions.menu = {
						items: communicationsByType.map(communication => {
							const itemHtmlContent = this.$Bitrix.Loc.getMessage('CRM_MINI_CARD_FIELD_CLIENT_COMMUNICATION_CONTROL_MENU_ITEM').replace('#VALUE#', main_core.Text.encode(communication.value)).replace('[VALUE_TYPE_TAG]', '<span style="opacity: .5;">').replace('#VALUE_TYPE#', main_core.Text.encode(communication.valueTypeCaption)).replace('[/VALUE_TYPE_TAG]', '</span>');
							return {
								html: `<span>${itemHtmlContent}</span>`,
								onclick: () => {
									this.communicate(communication);
								}
							};
						})
					};
				}
				const button = new ui_buttons.Button(buttonOptions);
				if (communicationsByType.length === 0) {
					button.setDisabled(true);
					button.setState(ui_buttons.Button.State.DISABLED);
				}
				const menuWindow = button.getMenuWindow();
				if (menuWindow) {
					ServiceLocator.getInstance().getEventService().registerChildPopup(this.$Bitrix.eventEmitter, menuWindow.getPopupWindow());
				}
				button.renderTo(this.$refs[typeId]);
				this.buttons ??= {};
				this.buttons[typeId] = button;
			},
			communicate(communication) {
				const communicationService = ServiceLocator.getInstance().getCommunicationService();
				if (communication.typeId === CommunicationType.Phone) {
					communicationService.communicateByPhone({
						phone: communication.value,
						entityTypeId: this.entity.entityTypeId,
						entityId: this.entity.entityId,
						ownerTypeId: this.entity.ownerTypeId,
						ownerId: this.entity.ownerId
					});
					return;
				}
				if (communication.typeId === CommunicationType.Email) {
					this.buttons[CommunicationType.Email].setState(ui_buttons.Button.State.WAITING);
					void communicationService.communicateByEmail({
						email: communication.value,
						ownerTypeId: this.entity.ownerTypeId,
						ownerId: this.entity.ownerId,
						entityTypeId: this.entity.entityTypeId,
						entityId: this.entity.entityId,
						activityEditorContainer: this.$refs.activityEditorContainer
					}).finally(() => {
						this.buttons[CommunicationType.Email].setState(null);
					});
					return;
				}
				if (communication.typeId === CommunicationType.Im) {
					communicationService.communicateByIM({
						dialogId: communication.value
					});
				}
			},
			filterCommunication(typeId) {
				return this.communications.filter(communication => communication.typeId === typeId);
			}
		},
		template: `
		<div class="crm-mini-card__communication-control">
			<div class="crm-mini-card__communication-phone" :ref="CommunicationType.Phone"></div>
			<div class="crm-mini-card__communication-mail" :ref="CommunicationType.Email"></div>
			<div class="crm-mini-card__communication-im" :ref="CommunicationType.Im"></div>
			<div hidden ref="activityEditorContainer"></div>
		</div>
	`
	};

	const ClientField = {
		name: 'ClientField',
		components: {
			Field,
			FieldTitle,
			FieldValue,
			FieldValueList,
			ValueEllipsis,
			CommunicationControl
		},
		props: {
			title: {
				type: String,
				required: true
			},
			clients: {
				/** @type Array<Client> */
				type: Array,
				required: true
			}
		},
		computed: {
			clientsWithOpenUrlFirst() {
				return [...this.clients].sort(client => {
					if (client.openUrl === null) {
						return 1;
					}
					return 0;
				});
			}
		},
		template: `
		<Field class="--client">
			<FieldTitle>{{ title }}</FieldTitle>
			<FieldValueList>
				<FieldValue v-for="client in clientsWithOpenUrlFirst">
					<ValueEllipsis
						v-if="client.openUrl === null"
						:title="client.fullName"
					>
						{{ client.fullName }}
					</ValueEllipsis>
					<a v-else class="--value-link" :href="client.openUrl">
						<ValueEllipsis :title="client.fullName">{{ client.fullName }}</ValueEllipsis>
					</a>

					<CommunicationControl
						v-if="client.entity !== null"
						:communications="client.communications"
						:entity="client.entity"
					/>
				</FieldValue>
			</FieldValueList>
		</Field>
	`
	};

	const ProductField = {
		name: 'ProductField',
		components: {
			Field,
			FieldTitle,
			FieldValue,
			FieldValueList,
			ValueEllipsis,
			ShowMore
		},
		props: {
			title: {
				type: String,
				required: true
			},
			products: {
				/** @type Product[] */
				type: Array,
				required: true
			},
			productsLeftCount: Number,
			productsLeftUrl: String
		},
		computed: {
			isDisplayShowMore() {
				return main_core.Type.isNumber(this.productsLeftCount) && this.productsLeftCount > 0 && main_core.Type.isStringFilled(this.productsLeftUrl);
			}
		},
		template: `
		<Field class="--product">
			<FieldTitle>{{ title }}</FieldTitle>
			<FieldValueList>
				<FieldValue v-for="product in products">
					<a class="--value-link" :href="product.url">
						<ValueEllipsis :title="product.title">{{ product.title }}</ValueEllipsis>
					</a>
				</FieldValue>
				<a
					v-if="isDisplayShowMore"
					:href="productsLeftUrl"
				>
					<ShowMore :count="productsLeftCount" />
				</a>
			</FieldValueList>
		</Field>
	`
	};

	const FooterNote = {
		name: 'FooterNote',
		template: `
		<div class="crm-mini-card-content__footer-note">
			<slot />
		</div>
	`
	};

	const CommonFooterNote = {
		name: 'CommonFooterNote',
		components: {
			FooterNote
		},
		props: {
			content: String
		},
		template: `
		<FooterNote class="--common">
			{{ content }}
		</FooterNote>
	`
	};

	const MiniCardContent = {
		name: 'MiniCardContent',
		components: {
			ImageAvatar,
			IconAvatar,
			ButtonControl,
			CommonField,
			PhoneField,
			EmailField,
			LinkField,
			MoneyField,
			StageField,
			ClientField,
			ProductField,
			CommonFooterNote
		},
		props: {
			miniCard: {
				type: MiniCardItem,
				required: true
			},
			popup: {
				type: Object,
				default: () => null
			}
		},
		mounted() {
			this.adjustPopup();
		},
		methods: {
			adjustPopup() {
				if (!this.popup) {
					return;
				}
				this.popup.adjustPosition();
				this.popup.bindOptions = {
					forceBindPosition: true
				};
			}
		},
		template: `
		<div class="crm-mini-card-content" :id="miniCard.id">
			<div class="crm-mini-card-content__header">
				<div class="crm-mini-card-content__header-info">
					<div class="crm-mini-card-content__header-icon">
						<component :is="miniCard.avatar.componentName" v-bind="miniCard.avatar.componentProps" />
					</div>
					<div class="crm-mini-card-content__header-title">
						{{ miniCard.title }}
					</div>
				</div>
				<div class="crm-mini-card-content__header-control-container">
					<div class="crm-mini-card-content__header-control-list">
						<div class="crm-mini-card-content__header-control-item" v-for="control in miniCard.controls">
							<component :is="control.componentName" v-bind="control.componentProps" />
						</div>
					</div>
				</div>
			</div>
			<div class="crm-mini-card-content__body">
				<div class="crm-mini-card-content__body-field-container">
					<div class="crm-mini-card-content__body-field-list">
						<div class="crm-mini-card-content__body-field-item" v-for="field in miniCard.fields">
							<component :is="field.componentName" v-bind="field.componentProps" />
						</div>
					</div>
				</div>
			</div>
			<div class="crm-mini-card-content__footer">
				<div class="crm-mini-card-content__footer-notes-list">
					<div v-for="footerNote in miniCard.footerNotes" class="crm-mini-card-content__footer-note-item">
						<component :is="footerNote.componentName" v-bind="footerNote.componentProps" />
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const MiniCardComponent = {
		name: 'MiniCardComponent',
		components: {
			MiniCardContent,
			Loader
		},
		props: {
			state: {
				type: Object,
				default: () => {
					return {
						appId: main_core.Text.getRandom(16),
						miniCardItem: null,
						isLoaded: false,
						popup: null
					};
				}
			}
		},
		computed: {
			miniCardItem() {
				return this.state.miniCardItem;
			},
			isLoading() {
				return !this.state.isLoaded;
			}
		},
		mounted() {
			this.subscribeInternalEvents();
		},
		methods: {
			subscribeInternalEvents() {
				this.$Bitrix.eventEmitter.subscribe(EVENTS.INTERNAL_ON_MOUSE_ENTER_CHILD_POPUP, this.onMouseEnterChildPopup.bind(this));
				this.$Bitrix.eventEmitter.subscribe(EVENTS.INTERNAL_ON_MOUSE_LEAVE_CHILD_POPUP, this.onMouseLeaveChildPopup.bind(this));
				main_core.Event.EventEmitter.subscribe(EVENTS.GLOBAL_ON_CLOSE_MAIN_POPUP, this.onCloseMainPopup.bind(this));
			},
			onCloseMainPopup(event) {
				const appId = event.getData().appId;
				if (appId !== this.state.appId) {
					return;
				}
				this.$Bitrix.eventEmitter.emit(EVENTS.INTERNAL_ON_CLOSE_MAIN_POPUP);
			},
			onMouseEnterChildPopup() {
				const event = new main_core_events.BaseEvent({
					data: {
						appId: this.state.appId
					}
				});
				main_core.Event.EventEmitter.emit(EVENTS.GLOBAL_ON_MOUSE_ENTER_CHILD_POPUP, event);
			},
			onMouseLeaveChildPopup() {
				const event = new main_core_events.BaseEvent({
					data: {
						appId: this.state.appId
					}
				});
				main_core.Event.EventEmitter.emit(EVENTS.GLOBAL_ON_MOUSE_LEAVE_CHILD_POPUP, event);
			}
		},
		template: `
		<div class="crm-mini-card">
			<Loader v-if="isLoading" />
			<MiniCardContent v-else-if="miniCardItem !== null" :mini-card="miniCardItem" :popup="state.popup" />
		</div>
	`
	};

	class MiniCard {
		#appId;
		#miniCardResolver;
		#bindElement;
		#application = null;
		#popup = null;
		#container = null;
		#hidePopupTimeout = undefined;
		#showPopupTimeout = undefined;
		#state;
		constructor(options) {
			this.#appId = main_core.Text.getRandom(16);
			this.#setBindElement(options.bindElement);
			this.#setMiniCardResolver(options.miniCardResolver);
			this.#state = ui_vue3.reactive({
				appId: this.#appId,
				miniCardItem: null,
				isLoaded: false,
				popup: null
			});
			this.#initializeSipManager();
			this.#bindEvents();
		}
		#setBindElement(bindElement) {
			if (!main_core.Type.isElementNode(bindElement)) {
				throw new RangeError('BX.Crm.MiniCard: bindElement must be an element node');
			}
			this.#bindElement = bindElement;
		}
		#setMiniCardResolver(miniCardResolver) {
			this.#miniCardResolver = miniCardResolver;
		}
		popup() {
			if (this.#popup !== null) {
				return this.#popup;
			}
			this.#popup = new main_popup.Popup({
				bindElement: this.#bindElement,
				content: this.container(),
				padding: 0,
				closeIcon: true,
				angle: {
					offset: 150
				},
				offsetLeft: this.#bindElement.offsetWidth / 2 - 130,
				animation: 'fading',
				autoHide: true,
				events: {
					onBeforeShow: () => {
						if (this.#miniCardResolver.isLoaded()) {
							this.#state.miniCardItem = this.#miniCardResolver.getMiniCard();
							this.#state.isLoaded = true;
							this.#popup.bindOptions = {
								forceBindPosition: true
							};
						} else {
							this.#popup.bindOptions = {
								forceBindPosition: true,
								forceTop: true
							};
						}
						if (this.#state.isLoaded) {
							return;
						}
						void this.#miniCardResolver.loadMiniCard().then(miniCard => {
							this.#state.miniCardItem = miniCard;
						}).catch(response => {
							console.error('BX.Crm.MiniCard: Error while resolve mini card element', response.errors);
							ui_notification.UI.Notification.Center.notify({
								content: main_core.Text.encode(response.errors[0].message),
								autoHideDelay: 3000
							});
							this.popup().destroy();
						}).finally(() => {
							this.#state.isLoaded = true;
						});
					},
					onClose: () => {
						clearTimeout(this.#showPopupTimeout);
						const event = new main_core_events.BaseEvent({
							data: {
								appId: this.#appId
							}
						});
						main_core.Event.EventEmitter.emit(EVENTS.GLOBAL_ON_CLOSE_MAIN_POPUP, event);
					}
				}
			});
			this.#state.popup = this.#popup;
			main_core.Event.bind(this.#popup.getPopupContainer(), 'mouseenter', this.#startShowPopup.bind(this));
			main_core.Event.bind(this.#popup.getPopupContainer(), 'mouseleave', this.#startHidePopup.bind(this));
			return this.#popup;
		}
		#bindEvents() {
			main_core.Event.bind(this.#bindElement, 'mouseenter', this.#startShowPopup.bind(this));
			main_core.Event.bind(this.#bindElement, 'mouseleave', this.#startHidePopup.bind(this));
			main_core.Event.bind(this.#bindElement, 'click', this.#hidePopup.bind(this));
		}
		#startHidePopup() {
			clearTimeout(this.#showPopupTimeout);
			this.#hidePopupTimeout = setTimeout(() => {
				this.popup().close();
			}, 500);
		}
		#startShowPopup() {
			clearTimeout(this.#hidePopupTimeout);
			this.#showPopupTimeout = setTimeout(() => {
				if (main_core.Type.isDomNode(this.#bindElement) && document.body.contains(this.#bindElement)) {
					this.popup().show();
				}
			}, 1000);
		}
		#hidePopup() {
			clearTimeout(this.#showPopupTimeout);
			if (this.popup().isShown()) {
				this.popup().close();
			}
		}
		container() {
			if (this.#container === null) {
				this.#container = main_core.Tag.render`
				<div class="crm-mini-card-container"></div>
			`;
				this.application().mount(this.#container);
			}
			return this.#container;
		}
		application() {
			if (this.#application === null) {
				this.#application = ui_vue3.BitrixVue.createApp(MiniCardComponent, {
					state: this.#state
				});
				main_core.Event.EventEmitter.subscribe(EVENTS.GLOBAL_ON_MOUSE_ENTER_CHILD_POPUP, event => {
					const data = event.getData();
					if (data.appId !== this.#appId) {
						return;
					}
					this.#startShowPopup();
				});
				main_core.Event.EventEmitter.subscribe(EVENTS.GLOBAL_ON_MOUSE_LEAVE_CHILD_POPUP, event => {
					const data = event.getData();
					if (data.appId !== this.#appId) {
						return;
					}
					this.#startHidePopup();
				});
			}
			return this.#application;
		}
		#initializeSipManager() {
			if (!window.BXIM || !BX.CrmSipManager) {
				return;
			}
			if (!BX.CrmSipManager.messages) {
				BX.CrmSipManager.messages = {
					unknownRecipient: main_core.Loc.getMessage('CRM_SIP_MGR_UNKNOWN_RECIPIENT'),
					makeCall: main_core.Loc.getMessage('CRM_SIP_MGR_MAKE_CALL')
				};
			}
			const sipMgr = BX.CrmSipManager.getCurrent();

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			const sessid = BX.bitrix_sessid();
			sipMgr.setServiceUrl('CRM_LEAD', `/bitrix/components/bitrix/crm.lead.show/ajax.php?sessid=${sessid}`);
			sipMgr.setServiceUrl('CRM_CONTACT', `/bitrix/components/bitrix/crm.contact.show/ajax.php?sessid=${sessid}`);
			sipMgr.setServiceUrl('CRM_COMPANY', `/bitrix/components/bitrix/crm.company.show/ajax.php?sessid=${sessid}`);
		}
	}

	class MiniCardResolver {
		static #cache = new main_core_cache.MemoryCache();
		#cacheId;
		#entityTypeId;
		#entityId;
		constructor(options) {
			this.#entityTypeId = options.entityTypeId;
			this.#entityId = options.entityId;
			this.#cacheId = `${this.#entityTypeId}_${this.#entityId}`;
		}
		async loadMiniCard() {
			const config = {
				data: {
					entityTypeId: this.#entityTypeId,
					entityId: this.#entityId
				}
			};
			const response = await main_core.ajax.runAction('crm.item.minicard.get', config);
			if (response?.data) {
				const item = this.#deepFreeze(new MiniCardItem(response.data));
				MiniCardResolver.#cache.set(this.#cacheId, item);
				return item;
			}
			return null;
		}
		getMiniCard() {
			return MiniCardResolver.#cache.get(this.#cacheId);
		}
		isLoaded() {
			return MiniCardResolver.#cache.has(this.#cacheId);
		}
		#deepFreeze(target) {
			if (main_core.Type.isObject(target)) {
				Object.values(target).forEach(value => {
					this.#deepFreeze(value);
				});
				return Object.freeze(target);
			}
			return target;
		}
	}

	const EntityTypeEnum = BX.CrmEntityType.enumeration;
	const EntityType = BX.CrmEntityType;
	class EntityMiniCard {
		#entityTypeId;
		#entityId;
		#bindElement;
		#miniCard;
		constructor(options) {
			this.#setEntityTypeId(options.entityTypeId);
			this.#setEntityId(options.entityId);
			this.#setBindElement(options.bindElement);
			this.#miniCard = new MiniCard({
				bindElement: this.#bindElement,
				miniCardResolver: new MiniCardResolver({
					entityTypeId: this.#entityTypeId,
					entityId: this.#entityId
				})
			});
		}
		getMiniCard() {
			return this.#miniCard;
		}
		#setEntityTypeId(entityTypeId) {
			const availableEntityTypeIds = [EntityTypeEnum.lead, EntityTypeEnum.deal, EntityTypeEnum.contact, EntityTypeEnum.company, EntityTypeEnum.quote, EntityTypeEnum.order, EntityTypeEnum.smartinvoice];
			const isAvailableEntityType = availableEntityTypeIds.includes(entityTypeId) || EntityType.isDynamicTypeByTypeId(entityTypeId);
			if (!main_core.Type.isNumber(entityTypeId)) {
				throw new RangeError(`BX.Crm.EntityMiniCard: entityTypeId ${entityTypeId} must be number`);
			}
			if (!isAvailableEntityType) {
				throw new RangeError(`BX.Crm.EntityMiniCard: entityTypeId ${entityTypeId} is not supported`);
			}
			this.#entityTypeId = entityTypeId;
		}
		#setEntityId(entityId) {
			if (!main_core.Type.isNumber(entityId) || entityId <= 0) {
				throw new RangeError('BX.Crm.EntityMiniCard: entityId must be a number and greater than 0');
			}
			this.#entityId = entityId;
		}
		#setBindElement(element) {
			if (!main_core.Type.isElementNode(element)) {
				throw new RangeError('BX.Crm.EntityMiniCard: bindElement must be an element node');
			}
			this.#bindElement = element;
		}
	}

	exports.Component = Component;
	exports.EntityMiniCard = EntityMiniCard;
	exports.MiniCard = MiniCard;
	exports.MiniCardComponent = MiniCardComponent;
	exports.MiniCardItem = MiniCardItem;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Event, BX.Main, BX, BX.Vue3, BX.UI.IconSet, window, window, BX.UI, BX.UI.Dialogs, BX.UI.IconSet, BX.Cache);
//# sourceMappingURL=index.bundle.js.map

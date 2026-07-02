/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports, main_core, ui_notification, main_core_events) {
	'use strict';

	class Item {
		#text;
		#active = false;
		#id;
		#href;
		#bindingType;
		#wait = false;
		#node;
		#messageId;
		#messageSimpleId;
		#createHref;
		#waitCSSClassName = 'ui-btn-wait';
		#errorType;
		#phrases = {
			'crm': 'MAIL_BINDING_CRM_',
			'chat': 'MAIL_BINDING_CHAT_',
			'task': 'MAIL_BINDING_TASK_',
			'post': 'MAIL_BINDING_POST_',
			'meeting': 'MAIL_BINDING_MEETING_'
		};
		static #errorPhrases = {
			'crm-install-error': 'MAIL_BINDING_CRM_ERROR',
			'calendar-install-error': 'MAIL_BINDING_MEETING_ERROR_MSGVER_1',
			'tasks-install-error': 'MAIL_BINDING_TASK_ERROR',
			'chat-install-error': 'MAIL_BINDING_CHAT_ERROR_MSGVER_1',
			'socialnetwork-install-error': 'MAIL_BINDING_POST_ERROR_MSGVER_1',
			'crm-install-permission-error': 'MAIL_BINDING_CRM_PERMISSION_SAVE_ERROR',
			'crm-install-permission-open-error': 'MAIL_BINDING_CRM_PERMISSION_OPEN_ERROR',
			'crm-install-permission-working-error': 'MAIL_BINDING_CRM_PERMISSION_WORKING_ERROR'
		};
		#phrasesFull = {
			'crm': 'MAIL_BINDING_CRM_TITLE',
			'chat': 'MAIL_BINDING_CHAT_TITLE',
			'task': 'MAIL_BINDING_TASK_TITLE',
			'post': 'MAIL_BINDING_POST_TITLE',
			'meeting': 'MAIL_BINDING_MEETING_TITLE'
		};
		#classes = {
			'crm': 'mail-binding-crm',
			'chat': 'mail-binding-chat',
			'task': 'mail-binding-task',
			'post': 'mail-binding-post',
			'meeting': 'mail-binding-meeting'
		};
		isError(errorKey) {
			if (Item.#errorPhrases[errorKey] !== undefined) {
				return true;
			}
			return false;
		}
		isActive() {
			return this.#active;
		}
		getId() {
			return this.#id;
		}
		getMessageId(simple = false) {
			if (!simple) {
				return this.#messageId;
			} else {
				return this.#messageSimpleId;
			}
		}
		constructor(config = {}) {
			this.#errorType = config['errorType'];
			this.#messageId = config['messageId'];
			this.#id = config['id'];
			this.#href = config['href'];
			this.#bindingType = config['type'];
			this.#messageSimpleId = config['messageSimpleId'];
			this.#createHref = config['createHref'];
			if (this.#id) {
				this.#active = true;
			}
			if (this.isActive()) {
				this.#text = main_core.Loc.getMessage(this.#phrases[this.#bindingType] + 'ACTIVE');
			} else {
				this.#text = main_core.Loc.getMessage(this.#phrases[this.#bindingType] + 'NOT_ACTIVE' + this.getVersionNotActivePhrase());
			}
		}
		getType() {
			return this.#bindingType;
		}
		static showError(key) {
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage(Item.#errorPhrases[key])
			});
		}
		static isErrorKey(key) {
			return Item.#errorPhrases[key] !== undefined;
		}
		static renderButton(options = {}) {
			const text = main_core.Type.isString(options.text) ? options.text : '';
			const title = main_core.Type.isString(options.title) ? options.title : '';
			const className = main_core.Type.isString(options.className) ? options.className : '';
			const messageSimpleId = options.messageSimpleId;
			const useBindClass = options.useBindClass !== false;
			const data = main_core.Type.isObject(options.data) ? options.data : {};
			const attrs = main_core.Type.isObject(options.attrs) ? options.attrs : {};
			const onClick = main_core.Type.isFunction(options.onClick) ? options.onClick : null;
			const baseClass = 'mail-ui-binding ui-btn-light-border ui-btn ui-btn-xs ui-btn-round ui-btn-no-caps';
			const jsBindClass = useBindClass && (main_core.Type.isNumber(messageSimpleId) || main_core.Type.isStringFilled(messageSimpleId)) ? `js-bind-${messageSimpleId}` : '';
			const item = main_core.Tag.render`
			<a class="${baseClass} ${className} ${jsBindClass}">${text}</a>
		`;
			Item.applyTitle(item, title);
			Item.applyDataset(item, data);
			Item.applyAttributes(item, attrs);
			Item.bindClick(item, onClick);
			main_core.Event.bind(item, 'dblclick', event => {
				event.stopPropagation();
			});
			return item;
		}
		static applyTitle(item, title) {
			if (main_core.Type.isStringFilled(title)) {
				item.setAttribute('title', title);
			}
		}
		static applyDataset(item, data) {
			const dataset = item.dataset;
			Object.entries(data).forEach(([key, value]) => {
				if (value === undefined || value === null) {
					return;
				}
				dataset[key] = String(value);
			});
		}
		static applyAttributes(item, attrs) {
			Object.entries(attrs).forEach(([key, value]) => {
				if (value === undefined || value === null) {
					return;
				}
				item.setAttribute(key, String(value));
			});
		}
		static bindClick(item, onClick) {
			if (onClick) {
				main_core.Event.bind(item, 'click', onClick);
			}
		}
		onClick(event) {
			if (this.isError(this.#errorType)) {
				Item.showError(this.#errorType);
				return;
			}
			if (this.isActive()) {
				switch (this.getType()) {
					//to join the chat if you left it
					case 'chat':
						BX.Mail.Secretary.getInstance(this.getMessageId(true)).openChat();
						break;
				}
			} else if (!this.#wait) {
				switch (this.getType()) {
					case 'crm':
						this.startWait();
						BX.Mail.Client.Message.List["mail-client-list-manager"].onCrmClick(this.getMessageId());
						break;
					case 'chat':
						BX.Mail.Secretary.getInstance(this.getMessageId(true)).openChat();
						break;
					case 'task':
						const uri = BX.Uri.addParam(this.#createHref, {
							ta_sec: 'mail',
							ta_el: 'create_button'
						});
						top.BX.SidePanel.Instance.open(uri);
						break;
					case 'post':
						top.BX.SidePanel.Instance.open(this.#createHref);
						break;
					case 'meeting':
						BX.Mail.Secretary.getInstance(this.getMessageId(true)).openCalendarEvent();
						break;
				}
			}
		}
		getHref() {
			return this.#href;
		}
		setText(text) {
			this.#node.textContent = text;
		}
		getNode() {
			return this.#node;
		}
		startWait() {
			this.#wait = true;
			this.getNode().classList.add(this.#waitCSSClassName);
		}
		stopWait() {
			this.#wait = false;
			this.getNode().classList.remove(this.#waitCSSClassName);
		}
		setActive(href) {
			this.stopWait();
			this.getNode().classList.remove("mail-ui-not-active");
			this.getNode().classList.add("mail-ui-active");
			this.setText(main_core.Loc.getMessage(this.#phrases[this.getType()] + 'ACTIVE'));
			this.getNode().setAttribute("href", href);
			this.#active = true;
			this.updateTitle();
		}
		deactivation() {
			this.stopWait();
			this.getNode().classList.add("mail-ui-not-active");
			this.getNode().classList.remove("mail-ui-active");
			this.setText(main_core.Loc.getMessage(`${this.#phrases[this.getType()]}NOT_ACTIVE${this.getVersionNotActivePhrase()}`));
			this.getNode().removeAttribute("href");
			this.#active = false;
			this.updateTitle();
		}
		getTitle() {
			return main_core.Loc.getMessage(this.#phrasesFull[this.getType()] + (this.isActive() ? '_ACTIVE' : ''));
		}
		updateTitle() {
			this.getNode().removeAttribute("title");
			this.getNode().setAttribute("title", this.getTitle());
		}
		render() {
			const activeClass = this.isActive() ? 'mail-ui-active' : 'mail-ui-not-active';
			const item = Item.renderButton({
				text: this.#text,
				title: '',
				className: `${this.#classes[this.getType()]} ${activeClass}`,
				messageSimpleId: this.getMessageId(true),
				data: {
					entityType: 'binding',
					entityId: this.getType()
				},
				onClick: event => {
					this.onClick(event);
				}
			});
			this.#node = item;
			this.#node.object = this;
			this.updateTitle();
			item.setActive = function (href) {
				this.object.setActive(href);
			};
			item.deactivation = function () {
				this.object.deactivation();
			};
			item.startWait = function () {
				this.object.startWait();
			};
			item.stopWait = function () {
				this.object.stopWait();
			};
			if (this.#errorType === 'crm-install-permission-error' && this.getHref()) {
				this.#errorType = 'crm-install-permission-open-error';
			}
			if (this.isActive() && !this.isError(this.#errorType)) {
				item.setAttribute("href", this.getHref());
			}
			return item;
		}
		getVersionNotActivePhrase() {
			return {
				'meeting': '_MSG_1'
			}[this.getType()] || '';
		}
	}

	const ActionRegistry = {
		discuss_in_chat: {
			className: 'mail-binding-chat mail-ui-not-active mail-discuss-in-chat-btn js-mail-discuss-in-chat',
			textKey: 'MAIL_BINDING_CUSTOM_CHAT_MESSAGE_TEXT',
			titleKey: 'MAIL_BINDING_CUSTOM_CHAT_MESSAGE_TITLE',
			data: config => ({
				messageId: config.messageSimpleId ?? config.messageId,
				entityType: 'action',
				entityId: config.actionId
			}),
			onClick: config => {
				ActionItem.openDiscussInChat(config);
			}
		}
	};
	class ActionItem {
		static initButtons(context = document.body) {
			const elements = [...context.getElementsByClassName('mail-ui-action-data')];
			for (const element of elements) {
				this.replaceElement(element);
			}
		}
		static replaceElement(object) {
			const actionType = object.getAttribute('action-type');
			const actionId = object.getAttribute('action-id');
			const messageId = object.getAttribute('message-id');
			const messageSimpleId = object.getAttribute('message-simple-id');
			const errorType = object.getAttribute('error-type');
			if (actionType !== 'action') {
				return;
			}
			const newObject = this.render({
				actionId,
				messageId,
				messageSimpleId,
				errorType
			});
			if (newObject) {
				main_core.Dom.replace(object, newObject);
			}
		}
		static render(config) {
			const action = this.getActionDescriptor(config);
			if (!action) {
				return null;
			}
			const {
				text,
				title
			} = this.getActionText(action);
			const className = action.className || '';
			const data = this.getActionData(action, config);
			const onClick = this.getActionClickHandler(action, config);
			return Item.renderButton({
				text,
				title,
				className,
				messageSimpleId: config.messageSimpleId,
				useBindClass: false,
				data,
				onClick
			});
		}
		static getActionDescriptor(config) {
			if (!main_core.Type.isObject(config) || !config.actionId) {
				return null;
			}
			return ActionRegistry[config.actionId] || null;
		}
		static getActionText(action) {
			const text = main_core.Loc.getMessage(action.textKey) || '';
			const title = main_core.Loc.getMessage(action.titleKey) || text;
			return {
				text,
				title
			};
		}
		static getActionData(action, config) {
			if (main_core.Type.isFunction(action.data)) {
				return action.data(config);
			}
			if (main_core.Type.isObject(action.data)) {
				return action.data;
			}
			return {};
		}
		static getActionClickHandler(action, config) {
			const hasError = this.hasError(config);
			const hasAction = main_core.Type.isFunction(action.onClick);
			if (!hasError && !hasAction) {
				return null;
			}
			return event => {
				if (this.handleErrorClick(event, config)) {
					return;
				}
				event.preventDefault();
				action.onClick(config, event);
			};
		}
		static hasError(config) {
			return Boolean(config.errorType && Item.isErrorKey(config.errorType));
		}
		static handleErrorClick(event, config) {
			if (!this.hasError(config)) {
				return false;
			}
			event.preventDefault();
			event.stopImmediatePropagation();
			Item.showError(config.errorType);
			return true;
		}
		static openDiscussInChat(config) {
			const messageId = this.getActionMessageId(config);
			if (!messageId) {
				return;
			}
			const discuss = BX?.Mail?.Client?.Action?.DiscussInChat;
			if (discuss && main_core.Type.isFunction(discuss.open)) {
				discuss.open(messageId);
			}
		}
		static getActionMessageId(config) {
			const candidates = [config.messageSimpleId, config.messageId];
			for (const candidate of candidates) {
				if (candidate === undefined || candidate === null) {
					continue;
				}
				const preparedId = parseInt(String(candidate), 10);
				if (main_core.Type.isInteger(preparedId)) {
					return preparedId;
				}
			}
			return null;
		}
	}

	class Binding {
		#mailboxId;
		#selectors = {
			CRM_ACTIVITY: '.mail-binding-crm',
			TASKS_TASK: '.mail-binding-task',
			IM_CHAT: '.mail-binding-chat',
			BLOG_POST: '.mail-binding-post',
			CALENDAR_EVENT: '.mail-binding-meeting'
		};
		getMailbox() {
			return this.#mailboxId;
		}
		constructor(mailboxId) {
			this.#mailboxId = mailboxId;
			this.#subscribeEvent();
			main_core_events.EventEmitter.subscribe('onPullEvent-mail', event => {
				let data = event.getData();
				if (data[0] === "messageBindingCreated" && (data[1]['mailboxId'] === this.getMailbox() || data[1]['mailboxId'] === String(this.getMailbox()))) {
					const binding = data[1];
					const messageSimpleId = binding['messageId'];
					const bindingWrapper = document.querySelector("" + ('.js-bind-' + messageSimpleId) + this.#selectors[binding['entityType']] + "");
					if (bindingWrapper) {
						bindingWrapper.setActive(binding['bindingEntityLink']);
					}
				}
				if (data[0] === "messageBindingDeleted" && (data[1]['mailboxId'] === this.getMailbox() || data[1]['mailboxId'] === String(this.getMailbox()))) {
					const binding = data[1];
					const messageSimpleId = binding['messageId'];
					const bindingWrapper = document.querySelector("" + ('.js-bind-' + messageSimpleId) + this.#selectors[binding['entityType']] + "");
					if (bindingWrapper) {
						bindingWrapper.deactivation();
					}
				}
			});
		}
		static build(config) {
			const item = new Item(config);
			return item.render();
		}
		static replaceElement(object) {
			const parent = object.parentNode;
			let newObject = this.build({
				type: object.getAttribute('bind-type'),
				id: object.getAttribute('bind-id'),
				messageId: object.getAttribute('message-id'),
				messageSimpleId: object.getAttribute('message-simple-id'),
				href: object.getAttribute('bind-href'),
				createHref: object.getAttribute('create-href'),
				errorType: object.getAttribute('error-type')
			});
			parent.replaceChild(newObject, object);
		}
		static initButtons(context = document.body) {
			this.initBindingButtons(context);
			this.initActionButtons(context);
		}
		static initBindingButtons(context) {
			const elements = [...context.getElementsByClassName('mail-ui-binding-data')];
			for (const element of elements) {
				this.replaceElement(element);
			}
		}
		static initActionButtons(context) {
			ActionItem.initButtons(context);
		}
		#subscribeEvent() {
			BX.PULL.subscribe({
				type: BX.PullClient.SubscriptionType.Server,
				moduleId: 'mail',
				command: 'unbindItem',
				callback: data => this.#unbindItem(data)
			});
		}
		#unbindItem(data) {
			const selector = `.js-bind-${data.messageId}.mail-binding-${data.type}.mail-ui-active`;
			const bindingWrapper = document.querySelector(selector);
			if (!bindingWrapper) {
				return;
			}
			bindingWrapper.deactivation();
			this.#updateGridByUnbindFilter();
		}
		#updateGridByUnbindFilter() {
			BX.Mail.Home.Grid.reloadTable();
		}
	}

	exports.ActionItem = ActionItem;
	exports.Binding = Binding;
	exports.Item = Item;

})(this.BX.Mail.Client = this.BX.Mail.Client || {}, BX, BX, BX.Event);
//# sourceMappingURL=binding.bundle.js.map

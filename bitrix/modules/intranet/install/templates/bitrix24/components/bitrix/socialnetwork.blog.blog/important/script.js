/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_loader, main_core_events) {
	'use strict';

	class ImportantMessagesWidget {
		#widgetContainerId;
		#messages = [];
		#options = {};
		#postInfo = {};
		#url = '';
		#pageSettings = {};
		#activeMessageIndex = 0;
		#loader;
		#loaderOverlay;
		#lockButtons = false;
		constructor(options) {
			this.#widgetContainerId = options.widgetContainerId;
			this.#messages = options.messages;
			this.#options = options.options;
			this.#postInfo = options.postInfo;
			this.#url = options.url;
			this.#pageSettings = options.pageSettings;
			this.#postInfo.AJAX_POST = 'Y';
			this.init();
		}
		init() {
			this.#renderMessages();
			main_core.Event.bind(this.#getNextMessageButton(), 'click', () => {
				if (this.#lockButtons) {
					return;
				}
				this.#lockButtons = true;
				this.#handleClickOnNextBtn().then(() => {
					this.#lockButtons = false;
					this.updateNavigation();
				}).catch(() => {
					this.#lockButtons = false;
				});
			});
			main_core.Event.bind(this.#getPrevMessageButton(), 'click', () => {
				if (this.#lockButtons) {
					return;
				}
				this.#lockButtons = true;
				this.#showPrevMessage().then(() => {
					this.#lockButtons = false;
					this.updateNavigation();
				}).catch(() => {
					this.#lockButtons = false;
				});
			});
			main_core.Event.bind(this.#getReadMessageButton(), 'click', () => {
				const activeMessage = this.getActiveMessage();
				this.#readMessage(activeMessage.id);
			});
			main_core_events.EventEmitter.subscribe('onImportantPostRead', event => {
				const [messageId] = event.getData();
				this.#removeMessageFromList(messageId);
			});
			const loadNewMessages = main_core.Runtime.debounce(() => {
				this.#loadNewMessages().then(() => {
					this.updateNavigation();
					this.show();
				}).catch(() => {
					// fail silently
				});
			}, 6000);
			main_core_events.EventEmitter.subscribe('onPullEvent-main', event => {
				if (this.#messages.length > 0) {
					return;
				}
				const [command, params] = event.getCompatData();
				if (command === 'user_counter' && params[main_core.Loc.getMessage('SITE_ID')] && params[main_core.Loc.getMessage('SITE_ID')]['BLOG_POST_IMPORTANT']) {
					loadNewMessages();
				}
			});
			this.updateNavigation();
		}
		show() {
			if (this.#messages.length === 0) {
				return;
			}
			const activeMessage = this.getActiveMessage();
			if (!activeMessage) {
				const message = this.#messages[this.#activeMessageIndex] || null;
				const element = this.#getMessagesListContainer().querySelector(`[data-message-id="${message?.id}"]`);
				if (element) {
					main_core.Dom.addClass(element, '--active');
				}
			}
			main_core.Dom.removeClass(this.#getWidgetContainer(), ['--hidden', '--hiding']);
		}
		hide() {
			main_core.Dom.addClass(this.#getWidgetContainer(), '--hiding');
			main_core.Event.bindOnce(this.#getWidgetContainer(), 'transitionend', () => {
				main_core.Dom.removeClass(this.#getWidgetContainer(), '--hiding');
				main_core.Dom.addClass(this.#getWidgetContainer(), '--hidden');
			});
		}
		#needLoadNewMessages() {
			return this.#pageSettings.bDescPageNumbering === true && this.#pageSettings.NavPageNomer > 1 || this.#messages.length < this.#pageSettings.NavRecordCount;
		}
		async #loadNewMessages() {
			const data = await this.#fetchNewMessages();
			const messages = data.messages;
			this.#setPageSettings(data.pageSettings);
			for (const message of messages) {
				if (this.#getMessageById(message.id)) {
					continue;
				}
				this.#messages.push(message);
				main_core.Dom.append(this.#renderMessageElement(message, false), this.#getMessagesListContainer());
			}
		}
		#fetchNewMessages() {
			return new Promise((resolve, reject) => {
				const request = this.#postInfo;
				if (this.#pageSettings.bDescPageNumbering) {
					this.#pageSettings.iNumPage = this.#pageSettings.NavPageNomer - 1;
				} else {
					this.#pageSettings.iNumPage = this.#pageSettings.NavPageNomer + 1;
				}
				request.page_settings = this.#pageSettings;
				request.sessid = BX.bitrix_sessid();
				main_core.ajax({
					method: 'POST',
					processData: true,
					url: this.#url,
					data: request,
					onsuccess: response => {
						const data = JSON.parse(response);
						resolve({
							messages: data.data,
							pageSettings: data.page_settings
						});
					},
					onfailure: error => {
						reject(error);
					}
				});
			});
		}
		#renderMessages() {
			this.#messages.forEach((message, index) => {
				main_core.Dom.append(this.#renderMessageElement(message, index === 0), this.#getMessagesListContainer());
			});
		}
		#renderMessageElement(messageData, isActive) {
			return main_core.Tag.render`
			<div class="sidebar-imp-mess ${isActive ? '--active' : ''}" data-message-id="${messageData.id}">
				<a href="${messageData.post_url}" class="sidebar-imp-mess-wrap">
					<div class="sidebar-imp-mess-avatar-block">
						<div class="sidebar-imp-mess-author-avatar ui-icon ui-icon-common-user"><i ${messageData.author_avatar}></i></div>
					</div>
					<div class="sidebar-imp-mess-info">
						<div class="sidebar-imp-mess-title">${messageData.author_name}</div>
						<div class="sidebar-imp-mess-text">${messageData.post_text}</div>
					</div>
				</a>
			</div>
		`;
		}
		async #handleClickOnNextBtn() {
			if (!this.#hasNextMessage() && this.#needLoadNewMessages()) {
				this.#showLoader();
				await this.#loadNewMessages();
				this.#hideLoader();
			}
			return this.#showNextMessage().then(() => {
				this.updateNavigation();
			}).catch(() => {});
		}
		async #showNextMessage() {
			if (!this.#hasNextMessage()) {
				return Promise.resolve();
			}
			return new Promise((resolve, reject) => {
				const activeMessage = this.#getMessagesListContainer().querySelector('.sidebar-imp-mess.--active');
				const nextMessage = activeMessage.nextElementSibling || this.#getMessagesListContainer().firstElementChild;
				this.#activeMessageIndex = this.#getNextMessageIndex();
				main_core.Dom.addClass(activeMessage, '--slide-out-left');
				main_core.Dom.addClass(nextMessage, '--active');
				main_core.Dom.addClass(nextMessage, '--slide-in-right');
				main_core.Event.bindOnce(activeMessage, 'animationend', () => {
					main_core.Dom.removeClass(activeMessage, '--active');
					main_core.Dom.removeClass(activeMessage, '--slide-out-left');
					main_core.Dom.removeClass(nextMessage, '--slide-in-right');
					resolve();
				});
			});
		}
		#showPrevMessage() {
			if (!this.#hasPrevMessage()) {
				return Promise.resolve();
			}
			return new Promise((resolve, reject) => {
				const activeMessage = this.#getMessagesListContainer().querySelector('.sidebar-imp-mess.--active');
				const prevMessage = activeMessage.previousElementSibling || this.#getMessagesListContainer().lastElementChild;
				this.#activeMessageIndex = this.#getPrevMessageIndex();
				main_core.Dom.addClass(activeMessage, '--slide-out-right');
				main_core.Dom.addClass(prevMessage, '--active');
				main_core.Dom.addClass(prevMessage, '--slide-in-left');
				main_core.Event.bindOnce(activeMessage, 'animationend', () => {
					main_core.Dom.removeClass(activeMessage, '--active');
					main_core.Dom.removeClass(activeMessage, '--slide-out-right');
					main_core.Dom.removeClass(prevMessage, '--slide-in-left');
					resolve();
				});
			});
		}
		async #readMessage(messageId) {
			const data = this.#getMessageById(messageId);
			const options = [];
			for (const option of this.#options) {
				options.push({
					post_id: data.id,
					name: option.name,
					value: option.value
				});
			}
			let request = this.#postInfo;
			request.options = options;
			request.page_settings = this.#pageSettings;
			request.sessid = BX.bitrix_sessid();
			request = main_core.ajax.prepareData(request);
			this.#showLoader();
			if (!this.#hasNextMessage() && this.#needLoadNewMessages()) {
				await this.#loadNewMessages();
			}
			main_core.ajax({
				method: 'GET',
				url: this.#url + (this.#url.includes('?') ? '&' : '?') + request,
				onsuccess: response => {
					const data = JSON.parse(response);
					this.#removeMessageFromList(messageId, data.page_settings);
					this.#hideLoader();
				},
				onfailure: () => {
					this.#hideLoader();
				}
			});
		}
		#setPageSettings(pageSettings) {
			this.#pageSettings = pageSettings;
		}
		#hasNextMessage() {
			return this.#activeMessageIndex + 1 <= this.#messages.length - 1;
		}
		#getNextMessageIndex() {
			return this.#activeMessageIndex + 1 > this.#messages.length - 1 ? 0 : this.#activeMessageIndex + 1;
		}
		#hasPrevMessage() {
			return this.#activeMessageIndex - 1 >= 0;
		}
		#getPrevMessageIndex() {
			return this.#activeMessageIndex - 1 < 0 ? this.#messages.length - 1 : this.#activeMessageIndex - 1;
		}
		#removeMessageFromList(messageId, pageSettings = null) {
			const finalize = () => {
				const activeMessage = this.getActiveMessage();
				main_core.Dom.remove(messageElement);
				this.#messages = this.#messages.filter(message => message.id !== messageId);
				this.#activeMessageIndex = Math.max(0, this.#messages.findIndex(message => message.id === activeMessage.id));
				if (pageSettings === null) {
					this.#setPageSettings({
						...this.#pageSettings,
						NavRecordCount: Math.max(0, this.#pageSettings.NavRecordCount - 1)
					});
				} else {
					this.#setPageSettings(pageSettings);
				}
				this.updateNavigation();
				if (this.#messages.length === 0) {
					this.hide();
				}
			};
			const messageElement = this.#getMessagesListContainer().querySelector(`[data-message-id="${messageId}"]`);
			const activeMessageElement = this.#getActiveMessageElement();
			if (messageElement === activeMessageElement) {
				if (this.#hasNextMessage()) {
					this.#showNextMessage().then(finalize).catch(() => {});
				} else if (this.#hasPrevMessage()) {
					this.#showPrevMessage().then(finalize).catch(() => {});
				} else {
					finalize();
				}
			} else {
				finalize();
			}
		}
		#getActiveMessageElement() {
			return this.#getMessagesListContainer().querySelector('.--active');
		}
		#getMessageById(messageId) {
			return this.#messages.find(message => message.id === messageId);
		}
		#getMessagesListContainer() {
			return document.getElementById('sidebar-imp-mess-list');
		}
		#getReadMessageButton() {
			return document.getElementById('sidebar-imp-mess-read-button');
		}
		#getWidgetContainer() {
			return document.getElementById(this.#widgetContainerId);
		}
		#updateCurrentMessageNumber() {
			const currentMessageNumberContainer = document.getElementById('sidebar-imp-mess-current-mess-number');
			currentMessageNumberContainer.textContent = this.#activeMessageIndex + 1;
		}
		#updateTotalMessagesNumber() {
			const totalMessagesNumberContainer = this.#getTotalMessagesNumberContainer();
			totalMessagesNumberContainer.textContent = this.#pageSettings.NavRecordCount;
		}
		#getTotalMessagesNumberContainer() {
			return document.getElementById('sidebar-imp-mess-total');
		}
		#getActiveMessageIndex() {
			return [...this.#getMessagesListContainer().children].indexOf(this.#getMessagesListContainer().querySelector('.--active'));
		}
		getActiveMessage() {
			return this.#messages[this.#getActiveMessageIndex()] || null;
		}
		#getPrevMessageButton() {
			return document.getElementById('sidebar-imp-mess-prev');
		}
		#getNextMessageButton() {
			return document.getElementById('sidebar-imp-mess-next');
		}
		#showLoader() {
			this.#loaderOverlay = main_core.Tag.render`
			<div class="sidebar-widget-content-overlay"></div>
		`;
			main_core.Dom.style(this.#loaderOverlay, {
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				background: 'rgba(255, 255, 255, 0.7)'
			});
			main_core.Dom.append(this.#loaderOverlay, this.#getWidgetContainer());
			if (!this.#loader) {
				this.#loader = new main_loader.Loader({
					size: 60,
					target: this.#loaderOverlay,
					color: '#0154C8'
				});
			}
			this.#loader.show();
		}
		#hideLoader() {
			this.#loader?.hide();
			main_core.Dom.remove(this.#loaderOverlay);
		}
		updateNavigation() {
			if (this.#activeMessageIndex >= this.#pageSettings.NavRecordCount - 1) {
				this.#disableNextButton();
			} else if (this.#pageSettings.NavRecordCount > 1) {
				this.#enableNextButton();
			} else {
				this.#disableNextButton();
			}
			if (this.#activeMessageIndex === 0) {
				this.#disablePrevButton();
			} else {
				this.#enablePrevButton();
			}
			this.#updateCurrentMessageNumber();
			this.#updateTotalMessagesNumber();
		}
		#enableNextButton() {
			this.#getNextMessageButton().removeAttribute('disabled');
		}
		#disableNextButton() {
			this.#getNextMessageButton().setAttribute('disabled', true);
		}
		#enablePrevButton() {
			this.#getPrevMessageButton().removeAttribute('disabled');
		}
		#disablePrevButton() {
			this.#getPrevMessageButton().setAttribute('disabled', true);
		}
	}

	exports.ImportantMessagesWidget = ImportantMessagesWidget;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX, BX.Event);
//# sourceMappingURL=script.js.map

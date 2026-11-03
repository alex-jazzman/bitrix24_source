/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_loader, main_core_events) {
	'use strict';

	class ImportantMessagesWidget {
		#widgetContainerId;
		#messages = [];
		#postInfo = {};
		#url = '';
		#pageSettings = {};
		#activeMessageIndex = 0;
		#loader;
		#loaderOverlay;
		#lockButtons = false;
		#removingMessageIds = new Set();
		#messageRemovalQueue = null;
		#pendingMessageRemovalPromises = new Set();
		#pendingReadConfirmationPromises = new Set();
		#processedMessageIds = new Set();
		#readGeneration = 0;
		#pendingUnknownReadMessageIds = new Set();
		#unknownReadSyncRequest = null;
		#navigationTransition = null;
		constructor(options) {
			this.#widgetContainerId = options.widgetContainerId;
			this.#messages = options.messages.map(message => ({
				...message,
				id: String(message.id)
			}));
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
				if (activeMessage) {
					this.#readMessage(activeMessage.id).catch(() => {});
				}
			});
			main_core_events.EventEmitter.subscribe('onImportantPostRead', event => {
				const [messageId] = event.getData();
				const normalizedMessageId = String(messageId);
				if (!this.#acceptRead(normalizedMessageId)) {
					return;
				}
				if (this.#getMessageById(normalizedMessageId)) {
					this.#removeMessageFromList(normalizedMessageId);
				} else {
					this.#pendingUnknownReadMessageIds.add(normalizedMessageId);
					this.#syncUnknownRead();
				}
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
				if (command === 'user_counter' && params[main_core.Loc.getMessage('SITE_ID')] && params[main_core.Loc.getMessage('SITE_ID')].BLOG_POST_IMPORTANT) {
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
			await this.#waitForPendingChanges();
			const readGeneration = this.#readGeneration;
			const requestedPage = this.#getNewMessagesPageNumber();
			const data = await this.#fetchNewMessages(requestedPage);
			await this.#waitForPendingChanges();
			if (readGeneration !== this.#readGeneration) {
				await this.#syncFirstPage();
				return;
			}
			const messages = this.#normalizeMessages(data.messages);
			const hasDuplicates = messages.some(message => this.#getMessageById(message.id));
			this.#setPageSettings(data.pageSettings);
			if (this.#isFirstPage(requestedPage, data.pageSettings)) {
				this.#mergeFirstPage(messages);
				return;
			}
			this.#appendMessages(messages);
			if (hasDuplicates || data.pageSettings.NavPageNomer !== requestedPage) {
				await this.#syncFirstPage();
			}
		}
		#appendMessages(messages) {
			for (const message of messages) {
				if (this.#getMessageById(message.id)) {
					continue;
				}
				this.#messages.push(message);
				main_core.Dom.append(this.#renderMessageElement(message, false), this.#getMessagesListContainer());
			}
		}
		#fetchNewMessages(pageNumber) {
			return new Promise((resolve, reject) => {
				const request = {
					...this.#postInfo,
					page_settings: {
						...this.#pageSettings,
						iNumPage: pageNumber
					},
					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
					sessid: BX.bitrix_sessid()
				};
				main_core.ajax({
					method: 'POST',
					processData: true,
					url: this.#url,
					data: request,
					onsuccess: response => {
						try {
							const data = JSON.parse(response);
							if (!Array.isArray(data?.data) || !main_core.Type.isPlainObject(data?.page_settings)) {
								throw new TypeError('Invalid important messages response.');
							}
							resolve({
								messages: data.data,
								pageSettings: data.page_settings
							});
						} catch (error) {
							reject(error);
						}
					},
					onfailure: error => {
						reject(error);
					}
				});
			});
		}
		#normalizeMessages(messages) {
			return messages.map(message => ({
				...message,
				id: String(message.id)
			})).filter(message => !this.#processedMessageIds.has(message.id));
		}
		async #syncFirstPage() {
			while (true) {
				// eslint-disable-next-line no-await-in-loop
				await this.#waitForPendingChanges();
				const readGeneration = this.#readGeneration;
				const firstPageNumber = this.#pageSettings.bDescPageNumbering ? Math.max(1, this.#pageSettings.NavPageCount) : 1;
				// eslint-disable-next-line no-await-in-loop
				const data = await this.#fetchNewMessages(firstPageNumber);
				// eslint-disable-next-line no-await-in-loop
				await this.#waitForPendingChanges();
				if (readGeneration !== this.#readGeneration) {
					continue;
				}
				this.#setPageSettings(data.pageSettings);
				this.#mergeFirstPage(this.#normalizeMessages(data.messages));
				return readGeneration;
			}
		}
		async #waitForPendingChanges() {
			while (this.#navigationTransition !== null || this.#pendingMessageRemovalPromises.size > 0 || this.#pendingReadConfirmationPromises.size > 0) {
				const pendingPromises = [...(this.#navigationTransition === null ? [] : [this.#navigationTransition]), ...this.#pendingMessageRemovalPromises, ...this.#pendingReadConfirmationPromises];
				// eslint-disable-next-line no-await-in-loop
				await Promise.all(pendingPromises);
			}
		}
		#mergeFirstPage(messages) {
			const activeMessageId = this.getActiveMessage()?.id;
			const firstPageIds = new Set(messages.map(message => message.id));
			const existingMessages = new Map(this.#messages.map(message => [message.id, message]));
			this.#messages = [...messages.map(message => existingMessages.get(message.id) ?? message), ...this.#messages.filter(message => !firstPageIds.has(message.id))].slice(0, this.#pageSettings.NavRecordCount);
			const container = this.#getMessagesListContainer();
			for (let index = messages.length - 1; index >= 0; index--) {
				const message = messages[index];
				const element = container.querySelector(`[data-message-id="${message.id}"]`) ?? this.#renderMessageElement(message, false);
				main_core.Dom.prepend(element, container);
			}
			const retainedIds = new Set(this.#messages.map(message => message.id));
			for (const element of container.querySelectorAll('[data-message-id]')) {
				if (!retainedIds.has(element.dataset.messageId)) {
					main_core.Dom.remove(element);
				}
			}
			const activeMessageIndex = this.#messages.findIndex(message => message.id === activeMessageId);
			this.#activeMessageIndex = Math.max(0, activeMessageIndex);
			if (activeMessageIndex === -1) {
				const activeElement = container.querySelector('.sidebar-imp-mess.--active');
				const firstRetainedElement = container.querySelector('[data-message-id]');
				if (activeElement) {
					main_core.Dom.removeClass(activeElement, '--active');
				}
				if (firstRetainedElement) {
					main_core.Dom.addClass(firstRetainedElement, '--active');
				}
			}
		}
		#isFirstPage(pageNumber, pageSettings) {
			return pageNumber === (pageSettings.bDescPageNumbering ? pageSettings.NavPageCount : 1);
		}
		#getNewMessagesPageNumber() {
			const pageSize = this.#pageSettings.NavPageSize || this.#pageSettings.nPageSize;
			if (pageSize <= 0) {
				return 1;
			}
			if (this.#pageSettings.bDescPageNumbering) {
				return Math.max(1, Math.ceil((this.#pageSettings.NavRecordCount - this.#messages.length) / pageSize));
			}
			return Math.floor(this.#messages.length / pageSize) + 1;
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
			const wasEmptyBeforeLoad = this.#messages.length === 0;
			if (!this.#hasNextMessage() && this.#needLoadNewMessages()) {
				this.#showLoader();
				try {
					await this.#loadNewMessages();
				} finally {
					this.#hideLoader();
				}
			}
			if (wasEmptyBeforeLoad) {
				if (this.#messages.length > 0) {
					this.show();
				} else if (this.#pageSettings.NavRecordCount === 0) {
					this.hide();
				}
				this.updateNavigation();
				return;
			}
			await this.#showNextMessage().then(() => {
				this.updateNavigation();
			}).catch(() => {});
		}
		async #showNextMessage() {
			if (this.#navigationTransition !== null) {
				return this.#navigationTransition;
			}
			if (!this.#hasNextMessage()) {
				return Promise.resolve();
			}
			this.#navigationTransition = new Promise(resolve => {
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
			return this.#navigationTransition.finally(() => {
				this.#navigationTransition = null;
			});
		}
		#showPrevMessage() {
			if (this.#navigationTransition !== null) {
				return this.#navigationTransition;
			}
			if (!this.#hasPrevMessage()) {
				return Promise.resolve();
			}
			this.#navigationTransition = new Promise(resolve => {
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
			return this.#navigationTransition.finally(() => {
				this.#navigationTransition = null;
			});
		}
		async #readMessage(messageId) {
			const normalizedMessageId = String(messageId);
			if (!this.#getMessageById(normalizedMessageId)) {
				return;
			}
			this.#showLoader();
			try {
				if (!this.#hasNextMessage() && this.#needLoadNewMessages()) {
					try {
						await this.#loadNewMessages();
					} catch {
						// Continue with the read request.
					}
				}
				const isRemoved = await this.#confirmRead(normalizedMessageId);
				if (isRemoved && this.#messages.length === 0 && this.#pageSettings.NavRecordCount > 0) {
					try {
						await this.#syncFirstPage();
						this.show();
					} catch {
						// Leave the widget available for a manual retry.
					}
					this.updateNavigation();
				}
			} finally {
				this.#hideLoader();
			}
		}
		#confirmRead(messageId) {
			const confirmationPromise = this.#confirmReadInternal(messageId);
			const settledPromise = confirmationPromise.then(() => {}, () => {});
			this.#pendingReadConfirmationPromises.add(settledPromise);
			confirmationPromise.finally(() => {
				this.#pendingReadConfirmationPromises.delete(settledPromise);
			}).catch(() => {});
			return confirmationPromise;
		}
		async #confirmReadInternal(messageId) {
			const response = await main_core.ajax.runAction('socialnetwork.api.livefeed.blogpost.important.vote', {
				data: {
					params: {
						POST_ID: messageId
					}
				}
			});
			if (response.data?.success !== 'Y' || !this.#acceptRead(messageId)) {
				return false;
			}
			return this.#removeMessageFromList(messageId);
		}
		#syncUnknownRead() {
			if (this.#unknownReadSyncRequest !== null) {
				return;
			}
			let messageIds = [];
			this.#unknownReadSyncRequest = Promise.resolve().then(() => {
				messageIds = [...this.#pendingUnknownReadMessageIds];
				return this.#syncFirstPage();
			}).then(readGeneration => {
				if (readGeneration === this.#readGeneration) {
					this.#pendingUnknownReadMessageIds.clear();
				}
				this.updateNavigation();
				if (this.#messages.length === 0) {
					this.hide();
				} else {
					this.show();
				}
			}).catch(() => {
				for (const messageId of messageIds) {
					this.#processedMessageIds.delete(messageId);
					this.#pendingUnknownReadMessageIds.delete(messageId);
				}
			}).finally(() => {
				this.#unknownReadSyncRequest = null;
				if (this.#pendingUnknownReadMessageIds.size > 0) {
					this.#syncUnknownRead();
				}
			});
		}
		#acceptRead(messageId) {
			if (this.#processedMessageIds.has(messageId)) {
				return false;
			}
			this.#processedMessageIds.add(messageId);
			this.#readGeneration++;
			return true;
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
			const queue = this.#messageRemovalQueue;
			const removalPromise = queue === null ? this.#removeMessageFromListInternal(messageId, pageSettings) : queue.then(() => this.#removeMessageFromListInternal(messageId, pageSettings));
			const nextQueue = removalPromise.then(() => {}, () => {});
			this.#messageRemovalQueue = nextQueue;
			nextQueue.finally(() => {
				if (this.#messageRemovalQueue === nextQueue) {
					this.#messageRemovalQueue = null;
				}
			}).catch(() => {});
			return this.#trackMessageRemoval(removalPromise);
		}
		async #removeMessageFromListInternal(messageId, pageSettings = null) {
			while (this.#navigationTransition !== null) {
				// eslint-disable-next-line no-await-in-loop
				await this.#navigationTransition;
			}
			const normalizedMessageId = String(messageId);
			const messageElement = this.#getMessagesListContainer().querySelector(`[data-message-id="${normalizedMessageId}"]`);
			if (!messageElement || !this.#getMessageById(normalizedMessageId) || this.#removingMessageIds.has(normalizedMessageId)) {
				return Promise.resolve(false);
			}
			this.#removingMessageIds.add(normalizedMessageId);
			return new Promise(resolve => {
				const finalize = () => {
					const activeMessage = this.getActiveMessage();
					main_core.Dom.remove(messageElement);
					this.#messages = this.#messages.filter(message => message.id !== normalizedMessageId);
					this.#activeMessageIndex = Math.max(0, this.#messages.findIndex(message => message.id === activeMessage?.id));
					if (pageSettings === null) {
						this.#setPageSettings({
							...this.#pageSettings,
							NavRecordCount: Math.max(0, this.#pageSettings.NavRecordCount - 1)
						});
					} else {
						this.#setPageSettings(pageSettings);
					}
					this.updateNavigation();
					if (this.#messages.length === 0 && this.#pageSettings.NavRecordCount === 0) {
						this.hide();
					}
					this.#removingMessageIds.delete(normalizedMessageId);
					resolve(true);
				};
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
			});
		}
		#trackMessageRemoval(removalPromise) {
			this.#pendingMessageRemovalPromises.add(removalPromise);
			return removalPromise.finally(() => {
				this.#pendingMessageRemovalPromises.delete(removalPromise);
			});
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
			if (this.#messages.length === 0 && this.#pageSettings.NavRecordCount > 0) {
				this.#enableNextButton();
				this.#disablePrevButton();
				this.#updateCurrentMessageNumber();
				this.#updateTotalMessagesNumber();
				return;
			}
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

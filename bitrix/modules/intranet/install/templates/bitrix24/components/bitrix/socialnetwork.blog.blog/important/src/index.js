import { Dom, ajax, ajax as Ajax, Event, Tag, Loc, Runtime, Type } from 'main.core';
import { Loader } from 'main.loader';
import { EventEmitter, type BaseEvent } from 'main.core.events';

export type ImportantMessagesWidgetOptions = {
	widgetContainerId: string;
	messages: ImportantMessagesWidgetMessage[];
	options: Object;
	postInfo: Object;
	url: string;
	pageSettings: ImportantMessagesWidgetPageSettings;
}

type ImportantMessagesWidgetPageSettings = {
	NavPageCount: number;
	NavPageNomer: number;
	NavPageSize: number;
	NavRecordCount: number;
	bDescPageNumbering: boolean;
	nPageSize: number;
	iNumPage?: number;
}

export type ImportantMessagesWidgetMessage = {
	id: string;
	author_avatar: string;
	author_url: string;
	author_name: string;
	post_url: string;
	post_text: string;
}

type FetchNewMessagesResponse = {
	pageSettings: ImportantMessagesWidgetPageSettings;
	messages: ImportantMessagesWidgetMessage[];
}

export class ImportantMessagesWidget
{
	#widgetContainerId: string;
	#messages: ImportantMessagesWidgetMessage[] = [];
	#postInfo = {};
	#url: string = '';
	#pageSettings: ImportantMessagesWidgetPageSettings = {};
	#activeMessageIndex = 0;
	#loader: Loader;
	#loaderOverlay: HTMLElement;
	#lockButtons: boolean = false;
	#removingMessageIds: Set<string> = new Set();
	#messageRemovalQueue: ?Promise<void> = null;
	#pendingMessageRemovalPromises: Set<Promise<boolean>> = new Set();
	#pendingReadConfirmationPromises: Set<Promise<void>> = new Set();
	#processedMessageIds: Set<string> = new Set();
	#readGeneration = 0;
	#pendingUnknownReadMessageIds: Set<string> = new Set();
	#unknownReadSyncRequest: ?Promise<void> = null;
	#navigationTransition: ?Promise<void> = null;

	constructor(options: ImportantMessagesWidgetOptions)
	{
		this.#widgetContainerId = options.widgetContainerId;
		this.#messages = options.messages.map((message) => ({
			...message,
			id: String(message.id),
		}));
		this.#postInfo = options.postInfo;
		this.#url = options.url;
		this.#pageSettings = options.pageSettings;

		this.#postInfo.AJAX_POST = 'Y';

		this.init();
	}

	init(): void
	{
		this.#renderMessages();

		Event.bind(this.#getNextMessageButton(), 'click', () => {
			if (this.#lockButtons)
			{
				return;
			}

			this.#lockButtons = true;

			this.#handleClickOnNextBtn()
				.then(() => {
					this.#lockButtons = false;
					this.updateNavigation();
				})
				.catch(() => {
					this.#lockButtons = false;
				})
			;
		});

		Event.bind(this.#getPrevMessageButton(), 'click', () => {
			if (this.#lockButtons)
			{
				return;
			}

			this.#lockButtons = true;

			this.#showPrevMessage()
				.then(() => {
					this.#lockButtons = false;
					this.updateNavigation();
				})
				.catch(() => {
					this.#lockButtons = false;
				})
			;
		});

		Event.bind(this.#getReadMessageButton(), 'click', () => {
			const activeMessage = this.getActiveMessage();
			if (activeMessage)
			{
				this.#readMessage(activeMessage.id).catch(() => {});
			}
		});

		EventEmitter.subscribe('onImportantPostRead', (event) => {
			const [messageId] = event.getData();
			const normalizedMessageId = String(messageId);
			if (!this.#acceptRead(normalizedMessageId))
			{
				return;
			}

			if (this.#getMessageById(normalizedMessageId))
			{
				this.#removeMessageFromList(normalizedMessageId);
			}
			else
			{
				this.#pendingUnknownReadMessageIds.add(normalizedMessageId);
				this.#syncUnknownRead();
			}
		});

		const loadNewMessages = Runtime.debounce(() => {
			this.#loadNewMessages()
				.then(() => {
					this.updateNavigation();
					this.show();
				})
				.catch(() => {
					// fail silently
				})
			;
		}, 6000);

		EventEmitter.subscribe('onPullEvent-main', (event: BaseEvent) => {
			if (this.#messages.length > 0)
			{
				return;
			}

			const [command, params] = event.getCompatData();
			if (
				command === 'user_counter'
				&& params[Loc.getMessage('SITE_ID')]
				&& params[Loc.getMessage('SITE_ID')].BLOG_POST_IMPORTANT
			)
			{
				loadNewMessages();
			}
		});

		this.updateNavigation();
	}

	show(): void
	{
		if (this.#messages.length === 0)
		{
			return;
		}

		const activeMessage = this.getActiveMessage();
		if (!activeMessage)
		{
			const message = this.#messages[this.#activeMessageIndex] || null;
			const element = this.#getMessagesListContainer().querySelector(`[data-message-id="${message?.id}"]`);
			if (element)
			{
				Dom.addClass(element, '--active');
			}
		}

		Dom.removeClass(this.#getWidgetContainer(), ['--hidden', '--hiding']);
	}

	hide(): void
	{
		Dom.addClass(this.#getWidgetContainer(), '--hiding');
		Event.bindOnce(this.#getWidgetContainer(), 'transitionend', () => {
			Dom.removeClass(this.#getWidgetContainer(), '--hiding');
			Dom.addClass(this.#getWidgetContainer(), '--hidden');
		});
	}

	#needLoadNewMessages(): boolean
	{
		return (
			(this.#pageSettings.bDescPageNumbering === true && this.#pageSettings.NavPageNomer > 1)
			|| this.#messages.length < this.#pageSettings.NavRecordCount
		);
	}

	async #loadNewMessages(): Promise
	{
		await this.#waitForPendingChanges();

		const readGeneration = this.#readGeneration;
		const requestedPage = this.#getNewMessagesPageNumber();
		const data = await this.#fetchNewMessages(requestedPage);
		await this.#waitForPendingChanges();
		if (readGeneration !== this.#readGeneration)
		{
			await this.#syncFirstPage();

			return;
		}

		const messages = this.#normalizeMessages(data.messages);
		const hasDuplicates = messages.some((message) => this.#getMessageById(message.id));

		this.#setPageSettings(data.pageSettings);
		if (this.#isFirstPage(requestedPage, data.pageSettings))
		{
			this.#mergeFirstPage(messages);

			return;
		}

		this.#appendMessages(messages);
		if (hasDuplicates || data.pageSettings.NavPageNomer !== requestedPage)
		{
			await this.#syncFirstPage();
		}
	}

	#appendMessages(messages: ImportantMessagesWidgetMessage[]): void
	{
		for (const message of messages)
		{
			if (this.#getMessageById(message.id))
			{
				continue;
			}

			this.#messages.push(message);

			Dom.append(
				this.#renderMessageElement(message, false),
				this.#getMessagesListContainer(),
			);
		}
	}

	#fetchNewMessages(pageNumber: number): Promise<FetchNewMessagesResponse>
	{
		return new Promise((resolve, reject) => {
			const request = {
				...this.#postInfo,
				page_settings: {
					...this.#pageSettings,
					iNumPage: pageNumber,
				},
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
				sessid: BX.bitrix_sessid(),
			};

			Ajax({
				method: 'POST',
				processData: true,
				url: this.#url,
				data: request,
				onsuccess: (response: string) => {
					try
					{
						const data = JSON.parse(response);
						if (!Array.isArray(data?.data) || !Type.isPlainObject(data?.page_settings))
						{
							throw new TypeError('Invalid important messages response.');
						}

						resolve({
							messages: data.data,
							pageSettings: data.page_settings,
						});
					}
					catch (error)
					{
						reject(error);
					}
				},
				onfailure: (error) => {
					reject(error);
				},
			});
		});
	}

	#normalizeMessages(messages: ImportantMessagesWidgetMessage[]): ImportantMessagesWidgetMessage[]
	{
		return messages
			.map((message) => ({
				...message,
				id: String(message.id),
			}))
			.filter((message) => !this.#processedMessageIds.has(message.id))
		;
	}

	async #syncFirstPage(): Promise<number>
	{
		while (true)
		{
			// eslint-disable-next-line no-await-in-loop
			await this.#waitForPendingChanges();

			const readGeneration = this.#readGeneration;
			const firstPageNumber = this.#pageSettings.bDescPageNumbering
				? Math.max(1, this.#pageSettings.NavPageCount)
				: 1
			;
			// eslint-disable-next-line no-await-in-loop
			const data = await this.#fetchNewMessages(firstPageNumber);
			// eslint-disable-next-line no-await-in-loop
			await this.#waitForPendingChanges();

			if (readGeneration !== this.#readGeneration)
			{
				continue;
			}

			this.#setPageSettings(data.pageSettings);
			this.#mergeFirstPage(this.#normalizeMessages(data.messages));

			return readGeneration;
		}
	}

	async #waitForPendingChanges(): Promise<void>
	{
		while (
			this.#navigationTransition !== null
			|| this.#pendingMessageRemovalPromises.size > 0
			|| this.#pendingReadConfirmationPromises.size > 0
		)
		{
			const pendingPromises = [
				...(this.#navigationTransition === null ? [] : [this.#navigationTransition]),
				...this.#pendingMessageRemovalPromises,
				...this.#pendingReadConfirmationPromises,
			];
			// eslint-disable-next-line no-await-in-loop
			await Promise.all(pendingPromises);
		}
	}

	#mergeFirstPage(messages: ImportantMessagesWidgetMessage[]): void
	{
		const activeMessageId = this.getActiveMessage()?.id;
		const firstPageIds = new Set(messages.map((message) => message.id));
		const existingMessages = new Map(this.#messages.map((message) => [message.id, message]));
		this.#messages = [
			...messages.map((message) => existingMessages.get(message.id) ?? message),
			...this.#messages.filter((message) => !firstPageIds.has(message.id)),
		].slice(0, this.#pageSettings.NavRecordCount);

		const container = this.#getMessagesListContainer();
		for (let index = messages.length - 1; index >= 0; index--)
		{
			const message = messages[index];
			const element = container.querySelector(`[data-message-id="${message.id}"]`)
				?? this.#renderMessageElement(message, false)
			;
			Dom.prepend(element, container);
		}

		const retainedIds = new Set(this.#messages.map((message) => message.id));
		for (const element of container.querySelectorAll('[data-message-id]'))
		{
			if (!retainedIds.has(element.dataset.messageId))
			{
				Dom.remove(element);
			}
		}

		const activeMessageIndex = this.#messages.findIndex((message) => message.id === activeMessageId);
		this.#activeMessageIndex = Math.max(0, activeMessageIndex);
		if (activeMessageIndex === -1)
		{
			const activeElement = container.querySelector('.sidebar-imp-mess.--active');
			const firstRetainedElement = container.querySelector('[data-message-id]');
			if (activeElement)
			{
				Dom.removeClass(activeElement, '--active');
			}

			if (firstRetainedElement)
			{
				Dom.addClass(firstRetainedElement, '--active');
			}
		}
	}

	#isFirstPage(pageNumber: number, pageSettings: ImportantMessagesWidgetPageSettings): boolean
	{
		return pageNumber === (pageSettings.bDescPageNumbering ? pageSettings.NavPageCount : 1);
	}

	#getNewMessagesPageNumber(): number
	{
		const pageSize = this.#pageSettings.NavPageSize || this.#pageSettings.nPageSize;
		if (pageSize <= 0)
		{
			return 1;
		}

		if (this.#pageSettings.bDescPageNumbering)
		{
			return Math.max(
				1,
				Math.ceil((this.#pageSettings.NavRecordCount - this.#messages.length) / pageSize),
			);
		}

		return Math.floor(this.#messages.length / pageSize) + 1;
	}

	#renderMessages(): void
	{
		this.#messages.forEach((message, index) => {
			Dom.append(
				this.#renderMessageElement(message, index === 0),
				this.#getMessagesListContainer(),
			);
		});
	}

	#renderMessageElement(messageData: ImportantMessagesWidgetMessage, isActive: boolean): HTMLElement
	{
		return Tag.render`
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

	async #handleClickOnNextBtn(): Promise<void>
	{
		const wasEmptyBeforeLoad = this.#messages.length === 0;
		if (!this.#hasNextMessage() && this.#needLoadNewMessages())
		{
			this.#showLoader();
			try
			{
				await this.#loadNewMessages();
			}
			finally
			{
				this.#hideLoader();
			}
		}

		if (wasEmptyBeforeLoad)
		{
			if (this.#messages.length > 0)
			{
				this.show();
			}
			else if (this.#pageSettings.NavRecordCount === 0)
			{
				this.hide();
			}
			this.updateNavigation();

			return;
		}

		await this.#showNextMessage()
			.then(() => {
				this.updateNavigation();
			})
			.catch(() => {})
		;
	}

	async #showNextMessage(): Promise<void>
	{
		if (this.#navigationTransition !== null)
		{
			return this.#navigationTransition;
		}

		if (!this.#hasNextMessage())
		{
			return Promise.resolve();
		}

		this.#navigationTransition = new Promise((resolve) => {
			const activeMessage = this.#getMessagesListContainer().querySelector('.sidebar-imp-mess.--active');
			const nextMessage = activeMessage.nextElementSibling || this.#getMessagesListContainer().firstElementChild;

			this.#activeMessageIndex = this.#getNextMessageIndex();

			Dom.addClass(activeMessage, '--slide-out-left');
			Dom.addClass(nextMessage, '--active');
			Dom.addClass(nextMessage, '--slide-in-right');
			Event.bindOnce(activeMessage, 'animationend', () => {
				Dom.removeClass(activeMessage, '--active');
				Dom.removeClass(activeMessage, '--slide-out-left');
				Dom.removeClass(nextMessage, '--slide-in-right');
				resolve();
			});
		});

		return this.#navigationTransition.finally(() => {
			this.#navigationTransition = null;
		});
	}

	#showPrevMessage(): Promise<void>
	{
		if (this.#navigationTransition !== null)
		{
			return this.#navigationTransition;
		}

		if (!this.#hasPrevMessage())
		{
			return Promise.resolve();
		}

		this.#navigationTransition = new Promise((resolve) => {
			const activeMessage = this.#getMessagesListContainer().querySelector('.sidebar-imp-mess.--active');
			const prevMessage = activeMessage.previousElementSibling || this.#getMessagesListContainer().lastElementChild;

			this.#activeMessageIndex = this.#getPrevMessageIndex();

			Dom.addClass(activeMessage, '--slide-out-right');
			Dom.addClass(prevMessage, '--active');
			Dom.addClass(prevMessage, '--slide-in-left');
			Event.bindOnce(activeMessage, 'animationend', () => {
				Dom.removeClass(activeMessage, '--active');
				Dom.removeClass(activeMessage, '--slide-out-right');
				Dom.removeClass(prevMessage, '--slide-in-left');
				resolve();
			});
		});

		return this.#navigationTransition.finally(() => {
			this.#navigationTransition = null;
		});
	}

	async #readMessage(messageId: string): Promise<void>
	{
		const normalizedMessageId = String(messageId);
		if (!this.#getMessageById(normalizedMessageId))
		{
			return;
		}

		this.#showLoader();
		try
		{
			if (!this.#hasNextMessage() && this.#needLoadNewMessages())
			{
				try
				{
					await this.#loadNewMessages();
				}
				catch
				{
					// Continue with the read request.
				}
			}

			const isRemoved = await this.#confirmRead(normalizedMessageId);
			if (isRemoved && this.#messages.length === 0 && this.#pageSettings.NavRecordCount > 0)
			{
				try
				{
					await this.#syncFirstPage();
					this.show();
				}
				catch
				{
					// Leave the widget available for a manual retry.
				}
				this.updateNavigation();
			}
		}
		finally
		{
			this.#hideLoader();
		}
	}

	#confirmRead(messageId: string): Promise<boolean>
	{
		const confirmationPromise = this.#confirmReadInternal(messageId);
		const settledPromise = confirmationPromise.then(() => {}, () => {});
		this.#pendingReadConfirmationPromises.add(settledPromise);
		confirmationPromise.finally(() => {
			this.#pendingReadConfirmationPromises.delete(settledPromise);
		}).catch(() => {});

		return confirmationPromise;
	}

	async #confirmReadInternal(messageId: string): Promise<boolean>
	{
		const response = await ajax.runAction('socialnetwork.api.livefeed.blogpost.important.vote', {
			data: { params: { POST_ID: messageId } },
		});
		if (response.data?.success !== 'Y' || !this.#acceptRead(messageId))
		{
			return false;
		}

		return this.#removeMessageFromList(messageId);
	}

	#syncUnknownRead(): void
	{
		if (this.#unknownReadSyncRequest !== null)
		{
			return;
		}

		let messageIds = [];
		this.#unknownReadSyncRequest = Promise.resolve()
			.then(() => {
				messageIds = [...this.#pendingUnknownReadMessageIds];

				return this.#syncFirstPage();
			})
			.then((readGeneration) => {
				if (readGeneration === this.#readGeneration)
				{
					this.#pendingUnknownReadMessageIds.clear();
				}

				this.updateNavigation();
				if (this.#messages.length === 0)
				{
					this.hide();
				}
				else
				{
					this.show();
				}
			})
			.catch(() => {
				for (const messageId of messageIds)
				{
					this.#processedMessageIds.delete(messageId);
					this.#pendingUnknownReadMessageIds.delete(messageId);
				}
			})
			.finally(() => {
				this.#unknownReadSyncRequest = null;
				if (this.#pendingUnknownReadMessageIds.size > 0)
				{
					this.#syncUnknownRead();
				}
			})
		;
	}

	#acceptRead(messageId: string): boolean
	{
		if (this.#processedMessageIds.has(messageId))
		{
			return false;
		}

		this.#processedMessageIds.add(messageId);
		this.#readGeneration++;

		return true;
	}

	#setPageSettings(pageSettings: ImportantMessagesWidgetPageSettings): void
	{
		this.#pageSettings = pageSettings;
	}

	#hasNextMessage(): boolean
	{
		return this.#activeMessageIndex + 1 <= this.#messages.length - 1;
	}

	#getNextMessageIndex(): number
	{
		return this.#activeMessageIndex + 1 > this.#messages.length - 1 ? 0 : this.#activeMessageIndex + 1;
	}

	#hasPrevMessage(): boolean
	{
		return this.#activeMessageIndex - 1 >= 0;
	}

	#getPrevMessageIndex(): number
	{
		return this.#activeMessageIndex - 1 < 0 ? this.#messages.length - 1 : this.#activeMessageIndex - 1;
	}

	#removeMessageFromList(messageId: string, pageSettings = null): Promise<boolean>
	{
		const queue = this.#messageRemovalQueue;
		const removalPromise = queue === null
			? this.#removeMessageFromListInternal(messageId, pageSettings)
			: queue.then(() => this.#removeMessageFromListInternal(messageId, pageSettings))
		;
		const nextQueue = removalPromise.then(() => {}, () => {});
		this.#messageRemovalQueue = nextQueue;
		nextQueue.finally(() => {
			if (this.#messageRemovalQueue === nextQueue)
			{
				this.#messageRemovalQueue = null;
			}
		}).catch(() => {});

		return this.#trackMessageRemoval(removalPromise);
	}

	async #removeMessageFromListInternal(messageId: string, pageSettings = null): Promise<boolean>
	{
		while (this.#navigationTransition !== null)
		{
			// eslint-disable-next-line no-await-in-loop
			await this.#navigationTransition;
		}

		const normalizedMessageId = String(messageId);
		const messageElement = this.#getMessagesListContainer().querySelector(`[data-message-id="${normalizedMessageId}"]`);
		if (
			!messageElement
			|| !this.#getMessageById(normalizedMessageId)
			|| this.#removingMessageIds.has(normalizedMessageId)
		)
		{
			return Promise.resolve(false);
		}

		this.#removingMessageIds.add(normalizedMessageId);

		return new Promise((resolve) => {
			const finalize = () => {
				const activeMessage = this.getActiveMessage();
				Dom.remove(messageElement);
				this.#messages = this.#messages.filter((message) => message.id !== normalizedMessageId);

				this.#activeMessageIndex = Math.max(
					0,
					this.#messages.findIndex((message) => message.id === activeMessage?.id),
				);

				if (pageSettings === null)
				{
					this.#setPageSettings({
						...this.#pageSettings,
						NavRecordCount: Math.max(0, this.#pageSettings.NavRecordCount - 1),
					});
				}
				else
				{
					this.#setPageSettings(pageSettings);
				}

				this.updateNavigation();
				if (this.#messages.length === 0 && this.#pageSettings.NavRecordCount === 0)
				{
					this.hide();
				}
				this.#removingMessageIds.delete(normalizedMessageId);
				resolve(true);
			};

			const activeMessageElement = this.#getActiveMessageElement();
			if (messageElement === activeMessageElement)
			{
				if (this.#hasNextMessage())
				{
					this.#showNextMessage().then(finalize).catch(() => {});
				}
				else if (this.#hasPrevMessage())
				{
					this.#showPrevMessage().then(finalize).catch(() => {});
				}
				else
				{
					finalize();
				}
			}
			else
			{
				finalize();
			}
		});
	}

	#trackMessageRemoval(removalPromise: Promise<boolean>): Promise<boolean>
	{
		this.#pendingMessageRemovalPromises.add(removalPromise);

		return removalPromise.finally(() => {
			this.#pendingMessageRemovalPromises.delete(removalPromise);
		});
	}

	#getActiveMessageElement(): HTMLElement
	{
		return this.#getMessagesListContainer().querySelector('.--active');
	}

	#getMessageById(messageId: string): ?ImportantMessagesWidgetMessage
	{
		return this.#messages.find((message) => message.id === messageId);
	}

	#getMessagesListContainer(): HTMLElement
	{
		return document.getElementById('sidebar-imp-mess-list');
	}

	#getReadMessageButton(): HTMLButtonElement
	{
		return document.getElementById('sidebar-imp-mess-read-button');
	}

	#getWidgetContainer(): HTMLElement
	{
		return document.getElementById(this.#widgetContainerId);
	}

	#updateCurrentMessageNumber(): void
	{
		const currentMessageNumberContainer = document.getElementById('sidebar-imp-mess-current-mess-number');

		currentMessageNumberContainer.textContent = this.#activeMessageIndex + 1;
	}

	#updateTotalMessagesNumber(): void
	{
		const totalMessagesNumberContainer = this.#getTotalMessagesNumberContainer();
		totalMessagesNumberContainer.textContent = this.#pageSettings.NavRecordCount;
	}

	#getTotalMessagesNumberContainer(): HTMLElement
	{
		return document.getElementById('sidebar-imp-mess-total');
	}

	#getActiveMessageIndex(): number
	{
		return [...this.#getMessagesListContainer().children]
			.indexOf(this.#getMessagesListContainer().querySelector('.--active'))
		;
	}

	getActiveMessage(): ImportantMessagesWidgetMessage | null
	{
		return this.#messages[this.#getActiveMessageIndex()] || null;
	}

	#getPrevMessageButton(): HTMLButtonElement
	{
		return document.getElementById('sidebar-imp-mess-prev');
	}

	#getNextMessageButton(): HTMLButtonElement
	{
		return document.getElementById('sidebar-imp-mess-next');
	}

	#showLoader(): void
	{
		this.#loaderOverlay = Tag.render`
			<div class="sidebar-widget-content-overlay"></div>
		`;

		Dom.style(this.#loaderOverlay, {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			background: 'rgba(255, 255, 255, 0.7)',
		});

		Dom.append(this.#loaderOverlay, this.#getWidgetContainer());

		if (!this.#loader)
		{
			this.#loader = new Loader({
				size: 60,
				target: this.#loaderOverlay,
				color: '#0154C8',
			});
		}

		this.#loader.show();
	}

	#hideLoader(): void
	{
		this.#loader?.hide();
		Dom.remove(this.#loaderOverlay);
	}

	updateNavigation(): void
	{
		if (this.#messages.length === 0 && this.#pageSettings.NavRecordCount > 0)
		{
			this.#enableNextButton();
			this.#disablePrevButton();
			this.#updateCurrentMessageNumber();
			this.#updateTotalMessagesNumber();

			return;
		}

		if (this.#activeMessageIndex >= this.#pageSettings.NavRecordCount - 1)
		{
			this.#disableNextButton();
		}
		else if (this.#pageSettings.NavRecordCount > 1)
		{
			this.#enableNextButton();
		}
		else
		{
			this.#disableNextButton();
		}

		if (this.#activeMessageIndex === 0)
		{
			this.#disablePrevButton();
		}
		else
		{
			this.#enablePrevButton();
		}

		this.#updateCurrentMessageNumber();
		this.#updateTotalMessagesNumber();
	}

	#enableNextButton()
	{
		this.#getNextMessageButton().removeAttribute('disabled');
	}

	#disableNextButton()
	{
		this.#getNextMessageButton().setAttribute('disabled', true);
	}

	#enablePrevButton()
	{
		this.#getPrevMessageButton().removeAttribute('disabled');
	}

	#disablePrevButton()
	{
		this.#getPrevMessageButton().setAttribute('disabled', true);
	}
}

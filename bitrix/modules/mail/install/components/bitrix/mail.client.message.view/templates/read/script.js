;(function ()
{
	const readSkeleton = '/bitrix/components/bitrix/mail.client/templates/.default/read-skeleton.html';
	const slider = top.BX?.SidePanel?.Instance.getSliderByWindow(window);
	if (slider && slider.skeleton !== readSkeleton)
	{
		slider.skeleton = readSkeleton;
	}
	if (slider?.layout.loader)
	{
		top.BX.addClass(
			slider.layout.loader,
			'side-panel-loader mail-msg-view-read-skeleton-loader',
		);
	}

	if (window.BXMailView)
	{
		return;
	}

	let primaryMessageBodyTitleTemplate = '';

	var BXMailView = function (options)
	{
		const primaryScreen = BX.Mail?.Client?.MessageView?.MessageView?.getScreen(options.messageId);
		const screen = primaryScreen || BX.Mail?.Client?.MessageView?.MessageView?.getScreen();
		const currentView = BXMailView.__currentView;
		if (
			primaryScreen
			&& currentView
			&& !currentView.destroyed
			&& currentView.screen === screen
			&& String(currentView.id) === String(options.messageId)
		)
		{
			return currentView;
		}
		if (primaryScreen)
		{
			currentView?.destroy();
		}

		this.mailboxId = options.mailboxId;
		this.id = options.messageId;
		this.options = options;
		this.screen = screen;
		this.isPrimaryView = Boolean(primaryScreen);
		if (this.isPrimaryView)
		{
			const primaryMessageBody = document.getElementById(options.messageBodyElementId);
			primaryMessageBodyTitleTemplate = primaryMessageBody?.dataset.messageBodyTitleTemplate
				|| primaryMessageBodyTitleTemplate;
		}
		this.destroyed = !screen;
		this.bodyLoader = null;
		this.messageBody = null;
		this.pageSwapper = null;
		this.slider = null;
		this.popup = null;
		this.cleanupActions = [];
		this.timers = new Set();
		this.decoratedThreadItems = new WeakSet();
		this.clickableAttachmentItems = new WeakSet();
		this.boundReadControls = new WeakSet();
		this.boundLegacyEvents = new WeakSet();
		this.boundMailboxAvatarImages = new WeakSet();
		this.normalizedRecipientAvatars = new WeakMap();
		this.readControlsInitialized = false;
		this.decorateReadContent = () => {};
		this.integrationBridge = null;
		this.pendingBodyResponse = null;
		this.pendingAttachmentsResponse = null;
		this.pendingActionRequests = new Set();
		this.unregisterScreenCleanup = null;

		if (!screen)
		{
			return;
		}

		if (this.isPrimaryView)
		{
			BXMailView.__currentView = this;
		}
		this.unregisterScreenCleanup = screen.registerCleanup(() => this.destroy());
		this.init();
		BXMailView.notifyViewReady(this);
	};

	BXMailView.__currentView = null;
	BXMailView.__readySubscribers = new Set();

	BXMailView.subscribeViewReady = function (handler)
	{
		if (typeof handler !== 'function')
		{
			return () => {};
		}

		BXMailView.__readySubscribers.add(handler);
		const currentView = BXMailView.getView();
		if (currentView)
		{
			handler(currentView);
		}

		return () => BXMailView.__readySubscribers.delete(handler);
	};

	BXMailView.notifyViewReady = function (view)
	{
		BXMailView.__readySubscribers.forEach((handler) => handler(view));
	};

	BXMailView.getView = function (id)
	{
		const view = BXMailView.__currentView;
		if (
			!view
			|| view.destroyed
			|| !view.screen?.isAlive()
			|| BX.Mail?.Client?.MessageView?.MessageView?.getScreen(view.id) !== view.screen
			|| (id !== undefined && String(view.id) !== String(id))
		)
		{
			return undefined;
		}

		return view;
	};

	BXMailView.prototype.captureGeneration = function ()
	{
		return this.screen.captureGeneration();
	};

	BXMailView.prototype.guardCompletion = function (capturedGeneration, completion)
	{
		if (
			this.destroyed
			|| (
				this.isPrimaryView
					? BXMailView.__currentView !== this
					: BX.Mail?.Client?.MessageView?.MessageView?.getScreen() !== this.screen
			)
		)
		{
			return false;
		}

		return this.screen.guardCompletion(capturedGeneration, completion);
	};

	BXMailView.prototype.registerCleanup = function (action)
	{
		if (this.destroyed)
		{
			action();

			return;
		}

		this.cleanupActions.push(action);
	};

	BXMailView.prototype.bindDomEvent = function (target, eventName, handler, options)
	{
		const capturedGeneration = this.captureGeneration();
		const guardedHandler = (...args) => this.guardCompletion(
			capturedGeneration,
			() => handler(...args),
		);
		target.addEventListener(eventName, guardedHandler, options);
		this.registerCleanup(() => target.removeEventListener(eventName, guardedHandler, options));
	};

	BXMailView.prototype.bindBxEvent = function (target, eventName, handler)
	{
		const capturedGeneration = this.captureGeneration();
		const guardedHandler = (...args) => this.guardCompletion(
			capturedGeneration,
			() => handler(...args),
		);
		BX.bind(target, eventName, guardedHandler);
		this.registerCleanup(() => BX.unbind(target, eventName, guardedHandler));
	};

	BXMailView.prototype.bindCustomEvent = function (target, eventName, handler)
	{
		if (typeof target === 'string')
		{
			handler = eventName;
		}
		const capturedGeneration = this.captureGeneration();
		const guardedHandler = (...args) => this.guardCompletion(
			capturedGeneration,
			() => handler(...args),
		);
		if (typeof target === 'string')
		{
			BX.addCustomEvent(target, guardedHandler);
			this.registerCleanup(() => BX.removeCustomEvent(target, guardedHandler));

			return;
		}

		BX.addCustomEvent(target, eventName, guardedHandler);
		this.registerCleanup(() => BX.removeCustomEvent(target, eventName, guardedHandler));
	};

	BXMailView.prototype.setGuardedTimeout = function (callback, delay)
	{
		const capturedGeneration = this.captureGeneration();
		const timerId = setTimeout(() =>
		{
			this.timers.delete(timerId);
			this.guardCompletion(capturedGeneration, callback);
		}, delay);
		this.timers.add(timerId);

		return timerId;
	};

	BXMailView.prototype.setIntegrationBridge = function (bridge)
	{
		this.integrationBridge = bridge || null;
		if (this.integrationBridge && this.pendingBodyResponse)
		{
			this.integrationBridge.onBodyResponse?.(this.pendingBodyResponse);
			this.pendingBodyResponse = null;
		}
		if (this.integrationBridge && this.pendingAttachmentsResponse)
		{
			const handled = this.integrationBridge.onAttachmentsResponse?.(this.pendingAttachmentsResponse) === true;
			this.pendingAttachmentsResponse = null;
			if (handled)
			{
				this.finalizeAttachmentsIntegration();
			}
		}
	};

	BXMailView.prototype.notifyBodyResponse = function (response)
	{
		if (!this.integrationBridge)
		{
			this.pendingBodyResponse = response;

			return;
		}

		this.pendingBodyResponse = null;
		this.integrationBridge.onBodyResponse?.(response);
	};

	BXMailView.prototype.openMailComposer = function (email)
	{
		if (typeof email !== 'string' || email === '')
		{
			return;
		}

		const pathNew = this.options.pathNew || BXMailMessageController.options.pathNew;
		top.BX.SidePanel.Instance.open(
			BX.util.add_url_param(pathNew, {
				id: this.mailboxId,
				email,
			}),
			{
				width: this.options.composeSliderWidth,
				cacheable: false,
				loader: 'create-mail-loader',
			},
		);
	};

	BXMailView.prototype.finalizeAttachmentsIntegration = function ()
	{
		const container = document.getElementById(this.options.ajaxAttachmentElementId);
		if (container)
		{
			this.decorateReadContent([container]);
		}
		if (this.options.fileRefreshButtonId)
		{
			this.setRefreshFileButtonAction();
		}
	};

	BXMailView.prototype.init = function ()
	{
		this.initIframe();

		if (this.options.isAjaxBody && this.options.messageBodyElementId)
		{
			this.ajaxLoadMessageBody();
		}
		else
		{
			this.ajaxLoadAttachments();
		}
		if (this.isPrimaryView)
		{
			this.addPageSwapper();
		}

		if (this.options.fileRefreshButtonId)
		{
			this.setRefreshFileButtonAction();
		}

		this.initAnalytics();
		this.bindActions();
		if (this.isPrimaryView)
		{
			this.bindReadControls();
		}
		this.patchMessageActionCallbacks();
	};

	BXMailView.prototype.patchMessageActionCallbacks = function ()
	{
		const message = this.options.bxMailMessage;
		if (!message || typeof message.onMessageActionError !== 'function')
		{
			return;
		}

		const originalError = message.onMessageActionError;
		const patchedError = (response) =>
		{
			this.settleActionRequests(response);
			originalError.call(message, response);
			const controlBlock = document.getElementById(this.options.messageControlElementId);
			controlBlock?.querySelectorAll('.js-msg-view-control-spam, .js-msg-view-control-delete')
				.forEach((button) =>
				{
					button.classList.remove('mail-msg-view-control-disabled', 'mail-msg-view-control-loading');
					button.disabled = false;
					button.removeAttribute('aria-busy');
				});
		};
		message.onMessageActionError = patchedError;
		const originalSuccess = message.onMessageActionSuccess;
		const patchedSuccess = typeof originalSuccess === 'function'
			? (...args) =>
			{
				this.settleActionRequests();

				return originalSuccess.apply(message, args);
			}
			: null
		;
		if (patchedSuccess)
		{
			message.onMessageActionSuccess = patchedSuccess;
		}
		this.registerCleanup(() =>
		{
			if (message.onMessageActionError === patchedError)
			{
				message.onMessageActionError = originalError;
			}
			if (patchedSuccess && message.onMessageActionSuccess === patchedSuccess)
			{
				message.onMessageActionSuccess = originalSuccess;
			}
		});
	};

	BXMailView.prototype.invokeActionForState = function (selector)
	{
		const controlBlock = document.getElementById(this.options.messageControlElementId);
		const control = controlBlock?.querySelector(selector);
		if (!(control instanceof HTMLElement))
		{
			return Promise.reject(new TypeError(`Legacy message action is unavailable: ${selector}`));
		}

		return new Promise((resolve, reject) =>
		{
			const request = {
				started: false,
				resolve,
				reject,
				cleanups: [],
			};
			const handleStart = () =>
			{
				request.started = true;
			};
			BX.addCustomEvent(control, 'MailMessage:actionStart', handleStart);
			request.cleanups.push(() => BX.removeCustomEvent(control, 'MailMessage:actionStart', handleStart));
			this.pendingActionRequests.add(request);

			try
			{
				control.click();
			}
			catch (error)
			{
				this.settleActionRequest(request, true, error);

				return;
			}

			const confirmationPopup = this.options.bxMailMessage?.popupDeleteConfirm;
			if (!request.started && confirmationPopup)
			{
				const handlePopupDestroy = () =>
				{
					if (!request.started)
					{
						this.settleActionRequest(request, false);
					}
				};
				BX.addCustomEvent(confirmationPopup, 'onPopupDestroy', handlePopupDestroy);
				request.cleanups.push(() => {
					BX.removeCustomEvent(confirmationPopup, 'onPopupDestroy', handlePopupDestroy);
				});
			}
			else if (!request.started)
			{
				this.settleActionRequest(request, false);
			}
		});
	};

	BXMailView.prototype.settleActionRequest = function (request, failed, error)
	{
		if (!this.pendingActionRequests.delete(request))
		{
			return;
		}

		request.cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
		if (failed)
		{
			request.reject(error);

			return;
		}

		request.resolve();
	};

	BXMailView.prototype.settleActionRequests = function (error)
	{
		const failed = arguments.length > 0;
		Array.from(this.pendingActionRequests)
			.filter((request) => request.started)
			.forEach((request) => this.settleActionRequest(request, failed, error));
	};

	BXMailView.prototype.initIframe = function()
	{
		const options = this.options;
		const messageBodyElement = document.getElementById(options.messageBodyElementId);
		if (!messageBodyElement)
		{
			return;
		}

		const messageId = parseInt(messageBodyElement.dataset.messageId, 10);
		const useAjax = messageBodyElement.dataset.useAjax === '1';

		if (!useAjax)
		{
			const messageHtml = messageBodyElement.dataset.messageHtml;
			if (messageHtml)
			{
				this.renderMessageBody(messageBodyElement, messageHtml, messageId);
			}
		}
	};

	BXMailView.prototype.renderMessageBody = function(container, html, messageId)
	{
		const sender = container
			.closest('.mail-msg-view-details')
			?.querySelector('.mail-msg-view-sender-name')
			?.textContent
			.trim();
		const titleTemplate = container.dataset.messageBodyTitleTemplate
			|| container
				.closest('.mail-message-view-shell')
				?.querySelector('[data-message-body-title-template]')
				?.dataset.messageBodyTitleTemplate
			|| primaryMessageBodyTitleTemplate;
		const iframeTitle = container.dataset.messageBodyTitle
			|| (sender && titleTemplate ? titleTemplate.replace('#SENDER#', sender) : document.title);

		if (!this.messageBody)
		{
			this.messageBody = new BX.Mail.MessageBody({
				container,
				messageId,
				prefix: 'mail-msg',
			});
		}

		this.messageBody.renderTo(html);
		this.decorateReadContent([container]);
		const iframe = this.messageBody.getIframe();
		if (iframe)
		{
			iframe.title = iframeTitle;
		}
		this.slider = BX.SidePanel.Instance.getTopSlider();
		if (this.isPrimaryView)
		{
			this.screen.setSlider(this.slider);
		}
		const capturedGeneration = this.captureGeneration();
		this.messageBody.bindPrintControl({
			slider: this.slider,
			getHeaderHtml: () =>
			{
				let html = '';
				this.guardCompletion(capturedGeneration, () =>
				{
					html = this.collectPrintHeaderHtml();
				});

				return html;
			},
			getHeaderStyles: () =>
			{
				let styles = '';
				this.guardCompletion(capturedGeneration, () =>
				{
					styles = this.getPrintHeaderStyles();
				});

				return styles;
			},
		});
	};

	BXMailView.prototype.ajaxLoadMessageBody = function ()
	{
		const messageId = this.options.messageId;
		if (!messageId)
		{
			return;
		}

		this.startProgress();
		this.integrationBridge?.onBodyLoading?.();
		this.bindErrorClose();
		const capturedGeneration = this.captureGeneration();

		BX.ajax.runComponentAction('bitrix:mail.client.message.view', 'getHtmlBody', {
			mode: 'class',
			data: {id: messageId},
		}).then((response) =>
		{
			this.guardCompletion(capturedGeneration, () => this.handleSuccessResponse(response.data));
		}, (error) =>
		{
			this.guardCompletion(capturedGeneration, () => this.handleFailedResponse(error));
		});
	}

	BXMailView.prototype.handleSuccessResponse = function (data)
	{
		this.stopProgress();
		if (BX.type.isNotEmptyObject(data) && BX.type.isString(data.messageHtml))
		{
			this.insertBodyText(data.messageHtml);

			if (BX.type.isString(data.quote))
			{
				this.insertQuoteText(data.quote);
			}
		}
		safeHide(this.options.warningWaitElementId);

		this.showControls();
		this.notifyBodyResponse({ status: 'success' });
		this.ajaxLoadAttachments();
	}

	BXMailView.prototype.insertQuoteText = function (quote)
	{
		const options = this.options;
		if (BX.type.isString(quote)
			&& BX.type.isString(options.formId)
			&& BX.type.isString(options.quoteFieldName)
			&& BX.type.isObject(BXMainMailForm)
			&& BX.type.isObject(BXMainMailForm.getForm(options.formId))
			&& BX.type.isArray(BXMainMailForm.getForm(options.formId).fields))
		{
			const fields = BXMainMailForm.getForm(options.formId).fields;
			for (const i in fields)
			{
				if (fields.hasOwnProperty(i))
				{
					if (BX.type.isObject(fields[i]) && fields[i].name === options.quoteFieldName)
					{
						fields[i].value = quote;
						break;
					}
				}
			}
		}
	}

	BXMailView.prototype.insertBodyText = function (html)
	{
		const options = this.options;
		const messageBodyElement = document.getElementById(options.messageBodyElementId);
		if (!messageBodyElement)
		{
			return;
		}

		const iframeUrl = messageBodyElement.dataset.iframeUrl;
		const messageId = parseInt(messageBodyElement.dataset.messageId, 10);

		if (iframeUrl)
		{
			this.createIframe(messageBodyElement, iframeUrl, messageId);
		}
		else
		{
			this.renderMessageBody(messageBodyElement, html, messageId);
		}

		if (BX.type.isObject(options.bxMailMessage))
		{
			BX.onCustomEvent(options.bxMailMessage, 'MailMessage:reInitMessageBody');
		}
	};


	BXMailView.prototype.ajaxLoadAttachments = function (notifyBridge = true)
	{
		const options = this.options;
		if (!options.ajaxAttachmentElementId || !options.messageId)
		{
			return Promise.resolve({
				status: 'success',
				attachmentsHtml: '',
			});
		}

		const ajaxAttachmentElement = document.getElementById(options.ajaxAttachmentElementId);
		if (!ajaxAttachmentElement)
		{
			return Promise.resolve({
				status: 'success',
				attachmentsHtml: '',
			});
		}

		this.attachmentLoader?.hide?.();
		this.attachmentLoader?.destroy?.();
		const ajaxAttachmentLoader = new BX.Loader({
			target: ajaxAttachmentElement,
			mode: 'inline',
			size: 20,
		});
		this.attachmentLoader = ajaxAttachmentLoader;
		ajaxAttachmentLoader.show();
		if (notifyBridge)
		{
			this.integrationBridge?.onAttachmentsLoading?.();
		}
		const capturedGeneration = this.captureGeneration();

		return BX.ajax.runComponentAction('bitrix:mail.client.message.view', 'getAttachments', {
			mode: 'class',
			data: {
				id: options.messageId,
				mail_uf_message_token: options.mailUfMessageToken,
			},
		}).then((response) =>
		{
			const result = {
				status: 'success',
				attachmentsHtml: response?.data?.attachmentsHtml,
			};
			this.guardCompletion(capturedGeneration, () =>
			{
				ajaxAttachmentLoader.hide();
				if (notifyBridge && !this.integrationBridge)
				{
					this.pendingAttachmentsResponse = result;

					return;
				}

				if (notifyBridge && this.integrationBridge?.onAttachmentsResponse?.(result) === true)
				{
					this.finalizeAttachmentsIntegration();

					return;
				}

			});

			return result;
		}, (error) =>
		{
			const result = {
				status: 'network',
				error,
			};
			this.guardCompletion(capturedGeneration, () =>
			{
				ajaxAttachmentLoader.hide();
				if (notifyBridge && !this.integrationBridge)
				{
					this.pendingAttachmentsResponse = result;

					return;
				}

				if (notifyBridge)
				{
					this.integrationBridge?.onAttachmentsResponse?.(result);
				}

			});

			return result;
		});
	}

	BXMailView.prototype.loadAttachmentsForState = function ()
	{
		return this.ajaxLoadAttachments(false);
	};

	BXMailView.prototype.showError = function ()
	{
		safeHide(this.options.warningWaitElementId);
		safeShow(this.options.warningFailElementId);
	}

	BXMailView.prototype.startProgress = function ()
	{
		const options = this.options;
		if (!options.bodyLoaderElementId)
		{
			return;
		}
		const progressContainer = document.getElementById(options.bodyLoaderElementId);
		if (!progressContainer)
		{
			return;
		}
		this.bodyLoader?.hide?.();
		this.bodyLoader?.destroy?.();
		this.bodyLoader = new BX.Loader({
			target: progressContainer,
			mode: 'inline',
			size: 24,
		});
		this.bodyLoader.show();
	}

	BXMailView.prototype.stopProgress = function ()
	{
		if (this.bodyLoader)
		{
			this.bodyLoader.hide();
			this.bodyLoader.destroy?.();
			this.bodyLoader = null;
		}
	}

	BXMailView.prototype.handleFailedResponse = function (error)
	{
		this.stopProgress();
		this.showError();
		this.showControls();
		this.notifyBodyResponse({ status: 'network', error });
		this.ajaxLoadAttachments();
	}

	BXMailView.prototype.showControls = function ()
	{
		safeShow(this.options.messageControlElementId);
		safeShow(this.options.fastReplyElementId);
		this.bindActions();
	}

	BXMailView.prototype.bindActions = function ()
	{
		this.bindDiscussInChat();
	}

	BXMailView.prototype.bindReadControls = function ()
	{
		const root = document.querySelector('[data-testid="mail-message-view-root"]');
		if (!root || this.readControlsInitialized)
		{
			return;
		}

		this.readControlsInitialized = true;
		const messageId = Number(root.dataset.messageId);
		let bindingReloadScheduled = false;
		const scheduleBindingReload = () =>
		{
			if (bindingReloadScheduled)
			{
				return;
			}

			bindingReloadScheduled = true;
			this.setGuardedTimeout(() =>
			{
				const readSlider = top.BX?.SidePanel?.Instance.getSliderByWindow(window);
				if (readSlider)
				{
					readSlider.reload();
				}
				else
				{
					window.location.reload();
				}
			}, 100);
		};
		if (BX.PULL)
		{
			BX.PULL.extendWatch(`mail_mailbox_${this.mailboxId}`);
		}
		this.bindCustomEvent('onPullEvent-mail', (command, params) =>
		{
			if (
				command !== 'messageBindingCreated'
				|| Number(params?.messageId) !== messageId
			)
			{
				return;
			}

			scheduleBindingReload();
		});
		const crmExcludeHandler = (event) =>
		{
			if (Number(event?.getData?.()?.messageId) === messageId)
			{
				this.integrationBridge?.onCrmExcluded?.();
				scheduleBindingReload();
			}
		};
		BX.Event.EventEmitter.subscribe('BXMailMessageActions:CRM_EXCLUDE', crmExcludeHandler);
		this.registerCleanup(() => BX.Event.EventEmitter.unsubscribe(
			'BXMailMessageActions:CRM_EXCLUDE',
			crmExcludeHandler,
		));
		const getInitials = (name) =>
		{
			const words = name
				.trim()
				.split(/\s+/)
				.map((word) => word.match(/\p{L}/gu)?.join('') ?? '')
				.filter(Boolean);
			if (words.length === 0)
			{
				return '';
			}

			const first = Array.from(words[0])[0] ?? '';
			const lastWord = words.length > 1 ? words[words.length - 1] : words[0].split('@')[0];
			const last = Array.from(lastWord)[words.length > 1 ? 0 : 1] ?? '';

			return `${first}${last}`.toLocaleUpperCase();
		};
		const decorateThreadItem = (item) =>
		{
			if (item.parentElement?.closest('.mail-message-view-thread-item'))
			{
				delete item.dataset.testid;
			}
			else
			{
				item.dataset.testid = 'mail-message-view-thread-item';
			}
			if (this.decoratedThreadItems.has(item))
			{
				return;
			}

			const name = item.querySelector('.mail-msg-view-log-item-name');
			const incoming = item.querySelector('.mail-msg-view-log-item-icon-income');
			const icon = incoming ?? item.querySelector('.mail-msg-view-log-item-icon-outcome');
			if (!name || !icon)
			{
				return;
			}

			icon.textContent = getInitials(name.textContent ?? '');
			icon.dataset.testid = 'mail-message-view-thread-avatar';
			const direction = document.createElement('span');
			direction.className = 'mail-msg-view-log-item-direction';
			direction.dataset.testid = 'mail-message-view-thread-direction';
			direction.textContent = incoming ? root.dataset.receivedLabel : root.dataset.sentLabel;
			name.append(direction);
			this.decoratedThreadItems.add(item);
		};
		const normalizeAttachmentPanel = (block) =>
		{
			const markAttachmentList = (item) =>
			{
				const list = item.parentElement;
				if (list && block.contains(list))
				{
					list.classList.add('mail-message-view-attachment-list');
				}
			};
			const makeAttachmentClickable = (item) =>
			{
				const link = item.querySelector('a[href]');
				if (!link || this.clickableAttachmentItems.has(item))
				{
					return;
				}

				item.classList.add('mail-msg-view-file-item-clickable');
				this.bindDomEvent(item, 'click', (event) =>
				{
					if (!event.target.closest('a, button'))
					{
						link.click();
					}
				});
				this.clickableAttachmentItems.add(item);
			};

			block.querySelectorAll('.mail-msg-view-file-item-image').forEach((item) =>
			{
				markAttachmentList(item);
				item.dataset.testid = 'mail-message-view-attachment';
				const preview = item.querySelector('img');
				preview?.setAttribute('data-testid', 'mail-message-view-attachment-preview');
				if (!item.matches('a[href]') && preview?.dataset.src)
				{
					const link = document.createElement('a');
					link.className = item.className;
					link.href = preview.dataset.src;
					link.target = '_blank';
					Array.from(preview.attributes).forEach((attribute) =>
					{
						if (attribute.name.startsWith('data-') && attribute.name !== 'data-testid')
						{
							link.setAttribute(attribute.name, attribute.value);
							preview.removeAttribute(attribute.name);
						}
					});
					link.dataset.testid = 'mail-message-view-attachment';
					item.replaceWith(link);
					while (item.firstChild)
					{
						link.append(item.firstChild);
					}
					item = link;
				}
				makeAttachmentClickable(item);
			});
			block.querySelectorAll('.mail-msg-view-file-item.diskuf-files-entity').forEach((item) =>
			{
				markAttachmentList(item);
				item.dataset.testid = 'mail-message-view-attachment';
				const link = item.querySelector('.mail-msg-view-file-link');
				link?.setAttribute('data-testid', 'mail-message-view-attachment-open');
				makeAttachmentClickable(item);
				if (item.querySelector('.mail-msg-view-file-content'))
				{
					return;
				}

				const legacyIcon = item.querySelector('.feed-com-file-icon');
				const extensionClass = legacyIcon
					? Array.from(legacyIcon.classList).find((className) => className.startsWith('feed-file-icon-'))
					: '';
				const icon = document.createElement('span');
				icon.className = 'mail-msg-view-file-icon';
				icon.setAttribute('aria-hidden', 'true');
				icon.textContent = extensionClass?.replace('feed-file-icon-', '') || 'file';
				legacyIcon?.replaceWith(icon);

				const content = document.createElement('div');
				content.className = 'mail-msg-view-file-content';
				if (link)
				{
					link.before(content);
					content.append(link);
				}
				const info = item.querySelector('.mail-msg-view-file-link-info');
				if (info)
				{
					content.append(info);
				}
			});

			let toolbar = block.querySelector('.mail-msg-view-file-toolbar');
			const refresh = block.querySelector('.mail-msg-refresh-files-button');
			const archive = block.querySelector('.mail-msg-view-file-archive-block');
			if (!toolbar && (refresh || archive))
			{
				toolbar = document.createElement('div');
				toolbar.className = 'mail-msg-view-file-toolbar';
				block.append(toolbar);
			}
			if (toolbar && refresh && !refresh.closest('.mail-msg-view-file-secondary-actions'))
			{
				const secondaryActions = document.createElement('div');
				secondaryActions.className = 'mail-msg-view-file-secondary-actions';
				refresh.classList.remove('mail-msg-view-file-item');
				refresh.dataset.testid = 'mail-message-view-refresh-attachments';
				secondaryActions.append(refresh);
				toolbar.prepend(secondaryActions);
			}
			if (toolbar && archive && archive.parentElement !== toolbar)
			{
				archive.querySelector('a')?.setAttribute('data-testid', 'mail-message-view-download-archive');
				toolbar.append(archive);
			}
		};
		const normalizeRecipientAvatars = (header) =>
		{
			header.querySelector('.mail-msg-view-sender-name')
				?.setAttribute('data-testid', 'mail-message-view-sender-name');
			header.querySelector('.mail-msg-view-sender-email')
				?.setAttribute('data-testid', 'mail-message-view-sender-email');
			header.querySelectorAll('.mail-msg-view-rcpt-block').forEach((recipient) =>
			{
				recipient.dataset.testid = 'mail-message-view-recipient';
				const name = recipient.querySelector('.mail-msg-view-rcpt-link, .mail-msg-view-rcpt');
				if (name?.matches('a'))
				{
					name.dataset.testid = 'mail-message-view-recipient-email';
				}
				const avatar = recipient.querySelector('.mail-contact-avatar');
				const initials = getInitials(name?.textContent ?? '');
				if (
					initials !== ''
					&& avatar
					&& !avatar.querySelector('i, img')
					&& this.normalizedRecipientAvatars.get(avatar) !== initials
				)
				{
					avatar.classList.remove('mail-contact-avatar-default');
					avatar.classList.add('mail-contact-avatar-icon');
					avatar.style.backgroundImage = 'none';
					avatar.style.backgroundColor = 'var(--ui-color-accent-main-success)';
					avatar.textContent = initials;
					this.normalizedRecipientAvatars.set(avatar, initials);
				}
			});
		};
		const bindMailboxAvatarFallback = (image) =>
		{
			if (this.boundMailboxAvatarImages.has(image))
			{
				return;
			}

			const revealFallback = () => image.remove();
			if (image.complete && image.naturalWidth === 0)
			{
				revealFallback();

				return;
			}

			this.boundMailboxAvatarImages.add(image);
			this.bindDomEvent(image, 'error', revealFallback);
		};
		const forEachMatchingElement = (containers, selector, callback) =>
		{
			const elements = new Set();
			containers.forEach((container) =>
			{
				if (container.nodeType === Node.ELEMENT_NODE && container.matches(selector))
				{
					elements.add(container);
				}

				container.querySelectorAll?.(selector).forEach((element) => elements.add(element));
			});
			elements.forEach(callback);
		};
		const forEachAffectedElement = (containers, selector, callback) =>
		{
			const elements = new Set();
			containers.forEach((container) =>
			{
				if (container.nodeType === Node.ELEMENT_NODE)
				{
					const closest = container.closest(selector);
					if (closest && root.contains(closest))
					{
						elements.add(closest);
					}
				}
				container.querySelectorAll?.(selector).forEach((element) => elements.add(element));
			});
			elements.forEach(callback);
		};
		const showControlLoader = (button) =>
		{
			button.classList.add('mail-msg-view-control-loading');
			button.disabled = true;
			button.setAttribute('aria-busy', 'true');
			this.setGuardedTimeout(() =>
			{
				button.classList.remove('mail-msg-view-control-loading');
				button.disabled = false;
				button.removeAttribute('aria-busy');
			}, 10000);
		};
		const closeMoreMenu = (menu, button) =>
		{
			menu.hidden = true;
			button.setAttribute('aria-expanded', 'false');
		};
		this.bindDomEvent(document, 'click', (event) =>
		{
			root.querySelectorAll('.mail-msg-view-control-more-menu:not([hidden])').forEach((menu) =>
			{
				const button = Array.from(root.querySelectorAll('.mail-msg-view-control-more')).find((item) => (
					item.getAttribute('aria-controls') === menu.id
				));
				if (!button || button.contains(event.target) || menu.contains(event.target))
				{
					return;
				}

				closeMoreMenu(menu, button);
			});
		});
		const normalizeActionPanel = (controlBlock) =>
		{
			if (controlBlock.querySelector('.mail-msg-view-control-more'))
			{
				return;
			}

			const secondaryActions = Array.from(controlBlock.children).filter((control) => (
				control.matches('.js-mail-discuss-in-chat, .js-msg-view-control-skip, '
					+ '.js-msg-view-control-spam, .js-msg-view-control-delete')
			));
			const sourceButton = root.querySelector('.mail-msg-view-control-more');
			if (secondaryActions.length === 0 || !sourceButton)
			{
				return;
			}

			const details = controlBlock.closest('[id^="mail-msg-view-details-"]');
			const suffix = details?.id.replace('mail-msg-view-details-', '') ?? Date.now();
			const wrapper = document.createElement('div');
			wrapper.className = 'mail-msg-view-control-more-wrapper';
			const button = sourceButton.cloneNode(true);
			const menu = document.createElement('div');
			const menuId = `mail-message-view-more-menu-${suffix}`;
			button.setAttribute('aria-controls', menuId);
			button.setAttribute('aria-expanded', 'false');
			menu.className = 'mail-msg-view-control-more-menu';
			menu.id = menuId;
			menu.hidden = true;
			secondaryActions.forEach((control) => menu.append(control));
			wrapper.append(button, menu);
			controlBlock.append(wrapper);
		};
		const setReadControlTestId = (button, testId) =>
		{
			if (button.closest('.mail-msg-view-control-wrapper')?.hidden)
			{
				delete button.dataset.testid;

				return;
			}

			button.dataset.testid = testId;
		};
		const bindReadControlElements = (containers) =>
		{
			forEachMatchingElement(containers, '.mail-msg-view-rcpt-more', (button) =>
			{
				setReadControlTestId(button, 'mail-message-view-recipients-toggle');
				const recipientList = button.nextElementSibling;
				if (recipientList?.matches('.mail-msg-view-rcpt-list-hidden'))
				{
					if (!recipientList.id)
					{
						const recipientToggles = button.closest('.mail-msg-view-rcpt-wrapper')
							?.querySelectorAll('.mail-msg-view-rcpt-more');
						const recipientIndex = Array.from(recipientToggles ?? []).indexOf(button);
						recipientList.id = `mail-message-view-recipients-${this.id}-${Math.max(recipientIndex, 0)}`;
					}
					button.setAttribute('aria-controls', recipientList.id);
				}
				if (!button.hasAttribute('aria-expanded'))
				{
					button.setAttribute('aria-expanded', 'false');
				}
				if (this.boundReadControls.has(button))
				{
					return;
				}

				this.boundReadControls.add(button);
				this.bindDomEvent(button, 'click', () =>
				{
					if (recipientList?.matches('.mail-msg-view-rcpt-list-hidden'))
					{
						BX.show(recipientList);
					}
					button.setAttribute('aria-expanded', 'true');
				});
			});
			forEachMatchingElement(containers, '.js-msg-view-control-forward', (button) =>
			{
				setReadControlTestId(button, 'mail-message-view-forward');
				if (this.boundReadControls.has(button))
				{
					return;
				}

				this.boundReadControls.add(button);
				this.bindDomEvent(button, 'click', () =>
				{
					button.classList.add('mail-msg-view-control-forward-loading');
					showControlLoader(button);
				}, true);
			});
			forEachMatchingElement(
				containers,
				'.js-msg-view-control-spam, .js-msg-view-control-delete',
				(button) =>
				{
					setReadControlTestId(button, button.matches('.js-msg-view-control-spam')
						? 'mail-message-view-spam'
						: 'mail-message-view-delete'
					);
					if (this.boundReadControls.has(button))
					{
						return;
					}

					this.boundReadControls.add(button);
					this.bindCustomEvent(button, 'MailMessage:actionStart', () => showControlLoader(button));
				},
			);
			forEachMatchingElement(containers, '.mail-msg-view-control-more', (button) =>
			{
				setReadControlTestId(button, 'mail-message-view-more');
				if (this.boundReadControls.has(button))
				{
					return;
				}

				const menu = document.getElementById(button.getAttribute('aria-controls'));
				if (!menu)
				{
					return;
				}

				this.boundReadControls.add(button);
				this.bindDomEvent(button, 'click', () =>
				{
					const open = menu.hidden;
					menu.hidden = !open;
					button.setAttribute('aria-expanded', open ? 'true' : 'false');
					if (open)
					{
						menu.querySelector('button:not([style*="display: none"])')?.focus();
					}
				});
				this.bindDomEvent(menu, 'keydown', (event) =>
				{
					if (event.key === 'Escape')
					{
						event.preventDefault();
						event.stopPropagation();
						closeMoreMenu(menu, button);
						button.focus();
					}
				});
			});
		};
		this.decorateReadContent = (containers) =>
		{
			forEachMatchingElement(
				containers,
				'img[data-mailbox-avatar-image]',
				bindMailboxAvatarFallback,
			);
			forEachAffectedElement(containers, '.mail-msg-view-control-block', normalizeActionPanel);
			forEachAffectedElement(containers, '.mail-msg-view-log-item', decorateThreadItem);
			forEachMatchingElement(containers, '.mail-msg-view-collapse-btn', (button) =>
			{
				button.dataset.testid = 'mail-message-view-collapse';
			});
			forEachAffectedElement(containers, '.mail-msg-view-header', normalizeRecipientAvatars);
			forEachAffectedElement(containers, '.mail-msg-view-file-block', normalizeAttachmentPanel);
			forEachMatchingElement(containers, 'form[id^="mail_msg_reply_"][id$="_form"]', (form) =>
			{
				form.dataset.testid = 'mail-message-view-quick-reply-form';
			});
			forEachMatchingElement(containers, '.mail-message-alert-warning a[href]', (link) =>
			{
				link.dataset.testid = 'mail-message-view-mailbox-link';
			});
			forEachMatchingElement(containers, '[id^="mail-msg-warning-top-wait-"] a[href]', (link) =>
			{
				link.dataset.testid = 'mail-message-view-html-download-wait';
			});
			forEachMatchingElement(containers, '[id^="mail-msg-warning-top-fail-"] a[href]', (link) =>
			{
				link.dataset.testid = 'mail-message-view-html-download-fail';
			});
			bindReadControlElements(containers);
		};
		this.decorateReadContent([root]);
	}

	BXMailView.prototype.collectPrintHeaderHtml = function ()
	{
		const sliderDocument = this.slider ? this.slider.iframe.contentDocument : document;
		const esc = BX.util.htmlspecialchars;

		let html = '';

		const subject = sliderDocument.querySelector('#pagetitle');
		if (subject)
		{
			html += '<div class="print-subject">' + esc(subject.textContent.trim()) + '</div>';
		}

		html += '<div class="print-meta">';

		const senderName = sliderDocument.querySelector('.mail-msg-view-sender-name');
		const senderEmail = sliderDocument.querySelector('.mail-msg-view-sender-email');
		if (senderName)
		{
			html += '<div class="print-from">';
			html += '<span class="print-from-name">' + esc(senderName.textContent.trim()) + '</span>';
			if (senderEmail)
			{
				html += ' &lt;' + esc(senderEmail.textContent.trim()) + '&gt;';
			}
			html += '</div>';
		}

		const rcptWrapper = sliderDocument.querySelector('.mail-msg-view-rcpt-wrapper');
		if (rcptWrapper)
		{
			const rcptLines = rcptWrapper.querySelectorAll(':scope > span');
			rcptLines.forEach(function (line) {
				const label = line.querySelector('.mail-msg-view-rcpt-list');
				const blocks = line.querySelectorAll('.mail-msg-view-rcpt-block');
				if (label && blocks.length > 0)
				{
					html += '<div class="print-rcpt-line">';
					html += '<span class="print-rcpt-label">' + esc(label.textContent.trim()) + '</span> ';
					const names = [];
					blocks.forEach(function (block) {
						const link = block.querySelector('.mail-msg-view-rcpt-link, .mail-msg-view-rcpt');
						if (link)
						{
							names.push(esc(link.textContent.trim()));
						}
					});
					html += names.join(', ');
					html += '</div>';
				}
			});
		}

		const dateEl = sliderDocument.querySelector('.mail-msg-view-date');
		if (dateEl)
		{
			html += '<div class="print-date">' + esc(dateEl.textContent.trim()) + '</div>';
		}

		html += '</div>';

		return html;
	};

	BXMailView.prototype.getPrintHeaderStyles = function ()
	{
		return '.print-header { display: none; font-family: var(--ui-font-family-primary); font-size: var(--ui-font-size-md); color: var(--ui-color-text-primary); padding: var(--ui-space-inset-sm) var(--ui-space-inset-lg) 0; }'
			+ '.print-subject { font-size: var(--ui-font-size-xl); color: var(--ui-color-text-primary); margin-bottom: var(--ui-space-stack-sm); }'
			+ '.print-meta { margin-bottom: var(--ui-space-stack-md); padding-bottom: var(--ui-space-stack-md); border-bottom: 1px solid var(--ui-color-divider-default); }'
			+ '.print-from { margin-bottom: var(--ui-space-stack-2xs); }'
			+ '.print-from-name { font-size: var(--ui-font-size-lg); color: var(--ui-color-text-primary); }'
			+ '.print-rcpt-line { margin-bottom: var(--ui-space-stack-3xs); color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-sm); }'
			+ '.print-rcpt-label { color: var(--ui-color-text-secondary); }'
			+ '.print-date { margin-top: var(--ui-space-stack-2xs); color: var(--ui-color-text-secondary); font-size: var(--ui-font-size-sm); }'
			+ '@media print { .print-header { display: block; padding: 0 var(--ui-space-inset-lg); } }';
	};

	BXMailView.prototype.bindDiscussInChat = function ()
	{
		const controlBlock = document.getElementById(this.options.messageControlElementId);
		if (!controlBlock)
		{
			return;
		}

		const button = controlBlock.querySelector('.js-mail-discuss-in-chat');
		if (!button || this.boundLegacyEvents.has(button))
		{
			return;
		}

		const messageId = this.id;
		if (!messageId)
		{
			return;
		}

		this.boundLegacyEvents.add(button);
		this.bindBxEvent(button, 'click', (event) => {
			event.preventDefault();
			BX.Mail.Client.Action.DiscussInChat.open(messageId, button);
		});
	}

	BXMailView.prototype.bindErrorClose = function ()
	{
		if (!this.options.warningFailElementId)
		{
			return;
		}

		const errorContainer = document.getElementById(this.options.warningFailElementId);
		if (!errorContainer)
		{
			return;
		}

		const closeElement = errorContainer.querySelector('.ui-alert-close-btn');
		if (!closeElement || this.boundLegacyEvents.has(closeElement))
		{
			return;
		}

		this.boundLegacyEvents.add(closeElement);
		this.bindBxEvent(closeElement, 'click', function ()
		{
			BX.hide(errorContainer);
		});
	}

	BXMailView.prototype.addPageSwapper = function()
	{
		const slider = BX.SidePanel.Instance.getSliderByWindow(window);
		if (!slider)
		{
			return;
		}
		this.slider = slider;
		this.screen.setSlider(slider);

		const container = document.getElementById('header-page-swapper-container');
		if (!container)
		{
			return;
		}

		const pagesHref = slider.getData().get('hrefList');
		if (!BX.UI.SidePanel.PageSwapper || !pagesHref)
		{
			if (!container.firstChild)
			{
				container.remove();
			}

			return;
		}

		if (!container.firstChild)
		{
			this.pageSwapper = new BX.UI.SidePanel.PageSwapper({
				slider,
				container,
				pagesHref,
				pageType: 'mail',
			});
			this.pageSwapper.init();
			this.screen.setPageSwapper(this.pageSwapper);
		}
		else if (!this.pageSwapper)
		{
			return;
		}

		const enableNextPage = slider.getData().get('enableNextPage');
		if (!enableNextPage || this.pageSwapper.hasPagesBeforeEnd(3))
		{
			return;
		}

		const previousSlider = BX.SidePanel.Instance.getPreviousSlider(this.slider);
		if (!previousSlider)
		{
			return;
		}

		const hostIframe = previousSlider.getFrame();
		const hostDocument = hostIframe?.contentDocument;
		if (!hostDocument)
		{
			return;
		}

		const loadMoreButton = hostDocument.querySelector('.main-grid-more-btn');
		if (!loadMoreButton)
		{
			return;
		}

		loadMoreButton.click();
	};

	BXMailView.prototype.setRefreshFileButtonAction = function()
	{
		const button = document.getElementById(this.options.fileRefreshButtonId);
		if (!button || this.boundLegacyEvents.has(button))
		{
			return;
		}

		const icon = button.querySelector('.mail-msg-refresh-files-button-icon');
		if (!icon)
		{
			return;
		}

		const toggleButton = () => {
			const rotateButtonClass = 'mail-msg-refresh-files-button-icon-rotate';
			if (this.refreshFilesInProgress)
			{
				BX.Dom.removeClass(icon, rotateButtonClass);
				button.disabled = false;
				button.removeAttribute('aria-busy');
				this.refreshFilesInProgress = false;

				return;
			}

			BX.Dom.addClass(icon, rotateButtonClass);
			button.disabled = true;
			button.setAttribute('aria-busy', 'true');
			this.refreshFilesInProgress = true;
		};

		this.boundLegacyEvents.add(button);
		this.bindBxEvent(button, 'click', () => {
			if (this.refreshFilesInProgress)
			{
				return;
			}

			toggleButton();
			const capturedGeneration = this.captureGeneration();
			BX.ajax.runAction('mail.syncingattachments.resyncAttachments', {
				data: {
					messageId: this.id,
					mailboxId: this.mailboxId,
				},
			}).then((response) => {
				this.guardCompletion(capturedGeneration, () =>
				{
					if (response.status !== 'success')
					{
						toggleButton();

						return;
					}

					location.reload();
				});
			}, () => {
				this.guardCompletion(capturedGeneration, toggleButton);
			});
		});
	};

	BXMailView.prototype.initAnalytics = function()
	{
		const options = this.options;
		const form = document.getElementById(options.formId);
		let currentCElement = 'fast_reply';

		if (!form)
		{
			return;
		}

		const controlBlock = document.getElementById(options.messageControlElementId);

		if (controlBlock)
		{
			const setCElement = function(type)
			{
				currentCElement = type;
			};

			const replyBtn = controlBlock.querySelector('.js-msg-view-control-reply');
			const replyAllBtn = controlBlock.querySelector('.js-msg-view-control-replyall');

			if (replyBtn)
			{
				this.bindBxEvent(replyBtn, 'click', setCElement.bind(null, 'reply'));
			}

			if (replyAllBtn)
			{
				this.bindBxEvent(replyAllBtn, 'click', setCElement.bind(null, 'reply_all'));
			}
		}

		const sendButton = form.querySelector('.main-mail-form-submit-button');

		if (sendButton)
		{
			const sendAnalytics = function()
			{
				BX.UI.Analytics.sendData({
					tool: 'mail',
					category: 'mail_operations',
					event: 'mail_send',
					type: 'mail',
					c_section: options.analyticsSource || 'mail',
					c_element: currentCElement,
				});
			};

			this.bindBxEvent(sendButton, 'click', sendAnalytics);
		}
	};

	BXMailView.prototype.destroy = function ()
	{
		if (this.destroyed)
		{
			return;
		}

		this.destroyed = true;
		const unregisterScreenCleanup = this.unregisterScreenCleanup;
		this.unregisterScreenCleanup = null;
		unregisterScreenCleanup?.();
		if (BXMailView.__currentView === this)
		{
			BXMailView.__currentView = null;
		}

		this.timers.forEach((timerId) => clearTimeout(timerId));
		this.timers.clear();

		const runCleanup = (cleanup) =>
		{
			try
			{
				cleanup();
			}
			catch (error)
			{
				console.error(error);
			}
		};
		this.cleanupActions.splice(0).reverse().forEach(runCleanup);

		runCleanup(() => this.popup?.hide?.());
		runCleanup(() => this.popup?.destroy?.());
		this.popup = null;

		runCleanup(() => this.bodyLoader?.hide?.());
		runCleanup(() => this.bodyLoader?.destroy?.());
		this.bodyLoader = null;
		runCleanup(() => this.attachmentLoader?.hide?.());
		runCleanup(() => this.attachmentLoader?.destroy?.());
		this.attachmentLoader = null;

		runCleanup(() => this.messageBody?.destroy?.());
		this.messageBody = null;

		runCleanup(() => this.pageSwapper?.hideLoader?.());
		runCleanup(() => this.pageSwapper?.loader?.hide?.());
		runCleanup(() => this.pageSwapper?.loader?.destroy?.());
		const pageSwapperWrapper = this.pageSwapper?.getWrapper?.();
		if (pageSwapperWrapper)
		{
			runCleanup(() => BX.remove(pageSwapperWrapper));
		}
		runCleanup(() => this.pageSwapper?.destroy?.());
		if (this.isPrimaryView && this.screen.pageSwapper === this.pageSwapper)
		{
			this.screen.setPageSwapper(null);
		}
		this.pageSwapper = null;

		if (this.isPrimaryView && this.screen.slider === this.slider)
		{
			this.screen.setSlider(null);
		}
		this.slider = null;
		Array.from(this.pendingActionRequests)
			.forEach((request) => this.settleActionRequest(request, false));
		this.integrationBridge = null;
		this.pendingBodyResponse = null;
		this.pendingAttachmentsResponse = null;
		this.decorateReadContent = () => {};
	};

	function safeHide(elementId)
	{
		if (elementId)
		{
			const element = document.getElementById(elementId);
			if (element)
			{
				BX.hide(element);
			}
		}
	}

	function safeShow(elementId)
	{
		if (elementId)
		{
			const element = document.getElementById(elementId);
			if (element && element.style && element.style.display === 'none')
			{
				element.style.display = '';
			}
		}
	}

	window.BXMailView = BXMailView;

})();

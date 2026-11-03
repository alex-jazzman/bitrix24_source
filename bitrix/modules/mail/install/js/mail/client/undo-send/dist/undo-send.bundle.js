/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, ui_notification, main_core, main_core_events, main_sidepanel, ui_progressround, main_popup, ui_bannerDispatcher) {
	'use strict';

	const UndoSendErrorCode = Object.freeze({
		Unknown: 'unknown',
		FeatureUnavailable: 'feature_unavailable',
		PreferenceDisabled: 'preference_disabled',
		AccessDenied: 'access_denied',
		CancelWindowExpired: 'cancel_window_expired',
		AlreadySending: 'already_sending',
		InvalidDelay: 'invalid_delay'
	});

	const CancelUrl = '/bitrix/services/main/ajax.php?action=mail.undoSend.cancelByToken';
	const cancelRequest = async request => {
		const data = new URLSearchParams();
		data.set('token', request.token);
		const response = await fetch(CancelUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'BX-Ajax': 'true'
			},
			body: data.toString(),
			credentials: 'omit'
		});
		const payload = await response.json();
		if (!response.ok || payload.status !== 'success') {
			throw payload;
		}
		return payload;
	};
	const Action = Object.freeze({
		Create: 'mail.undoSend.create',
		GetPreference: 'mail.undoSend.getPreference',
		SetPreference: 'mail.undoSend.setPreference'
	});
	class UndoSendApi {
		#runAction;
		#cancelRequest;
		#preferencePromise = null;
		constructor(runAction = main_core.ajax.runAction, runCancelRequest = cancelRequest) {
			this.#runAction = runAction;
			this.#cancelRequest = runCancelRequest;
		}
		create(request) {
			return this.#request(Action.Create, {
				...request
			});
		}
		cancel(request) {
			return this.#requestCancellation(request);
		}
		getPreference() {
			this.#preferencePromise ??= this.#request(Action.GetPreference, {}).catch(error => {
				this.#preferencePromise = null;
				throw error;
			});
			return this.#preferencePromise;
		}
		async setPreference(request) {
			const preference = await this.#request(Action.SetPreference, {
				...request
			});
			this.#preferencePromise = Promise.resolve(preference);
			return preference;
		}
		async #request(action, data) {
			try {
				const response = await this.#runAction(action, {
					data
				});
				return response.data;
			} catch (error) {
				throw this.#mapError(error);
			}
		}
		async #requestCancellation(request) {
			try {
				const response = await this.#cancelRequest(request);
				return response.data;
			} catch (error) {
				throw this.#mapError(error);
			}
		}
		#mapError(response) {
			const ajaxError = response;
			const error = ajaxError?.errors?.[0];
			const code = main_core.Type.isStringFilled(error?.code) ? error.code : UndoSendErrorCode.Unknown;
			const message = main_core.Type.isString(error?.message) ? error.message : main_core.Type.isString(ajaxError?.message) ? ajaxError.message : '';
			const retryable = error?.retryable === true || error?.customData?.retryable === true;
			return Object.assign(new Error(message), {
				name: 'UndoSendApiError',
				code,
				retryable
			});
		}
	}
	const undoSendApi = new UndoSendApi();

	const UndoSendEvent = Object.freeze({
		Cancelled: 'Mail.UndoSend:onCancelled',
		Expired: 'Mail.UndoSend:onExpired',
		CancelFailed: 'Mail.UndoSend:onCancelFailed'
	});
	class UndoSendNotification {
		#api;
		#center;
		#now;
		#setInterval;
		#clearInterval;
		#matchMedia;
		#createProgress;
		#getHostNotification;
		#markGuideReady;
		#openRestore;
		#guideReadyRecorded = false;
		#active = null;
		constructor(dependencies = {}) {
			const getSliderManager = () => dependencies.sliderManager ?? main_sidepanel.SidePanel.Instance;
			this.#api = dependencies.api ?? undoSendApi;
			this.#center = dependencies.center ?? null;
			this.#now = dependencies.now ?? Date.now;
			this.#setInterval = dependencies.setInterval ?? globalThis.setInterval.bind(globalThis);
			this.#clearInterval = dependencies.clearInterval ?? globalThis.clearInterval.bind(globalThis);
			this.#matchMedia = dependencies.matchMedia ?? globalThis.matchMedia.bind(globalThis);
			this.#getHostNotification = dependencies.getHostNotification ?? (() => {
				const sliderManager = getSliderManager();
				const currentSlider = sliderManager.getSliderByWindow(window);
				const hostWindow = currentSlider === sliderManager.getTopSlider() ? sliderManager.getPreviousSlider(currentSlider)?.getFrameWindow() ?? main_core.Page.getRootWindow() : window;
				return hostWindow.BX?.Mail?.Client?.UndoSend?.undoSendNotification ?? null;
			});
			this.#markGuideReady = dependencies.markGuideReady ?? (() => {
				BX.userOptions.save('mail.guide', 'undo_send_guide_ready', null, 'Y');
			});
			const openRestore = dependencies.openRestore;
			this.#openRestore = openRestore === undefined ? (url, width) => {
				getSliderManager().open(url, {
					width,
					cacheable: false
				});
			} : url => {
				openRestore(url);
			};
			this.#createProgress = dependencies.createProgress ?? (duration => {
				return new ui_progressround.ProgressRound({
					value: duration,
					maxValue: duration,
					color: ui_progressround.ProgressRound.Color.PRIMARY,
					width: 24,
					textBefore: '',
					textAfter: '',
					colorTrack: '',
					colorBar: '',
					statusType: ui_progressround.ProgressRound.Status.NONE,
					lineSize: 3,
					fill: false,
					finished: false,
					rotation: false,
					useAirDesign: false
				});
			});
		}
		show(operation) {
			const hostNotification = this.#getHostNotification();
			if (hostNotification !== null && hostNotification !== this) {
				hostNotification.show(operation);
				return;
			}
			this.#closeActive();
			const serverNow = Date.parse(operation.serverNow);
			const cancelUntil = Date.parse(operation.cancelUntil);
			const duration = Math.max(0, cancelUntil - serverNow);
			const active = this.#createActive(operation, duration, this.#now() + duration);
			this.#active = active;
			if (duration === 0) {
				this.#expire(active);
				return;
			}
			const content = this.#render(active);
			const center = this.#center ?? BX.UI.Notification.Center;
			active.balloon = center.notify({
				content,
				actions: [{
					id: 'cancel',
					href: '#',
					title: main_core.Loc.getMessage('MAIL_UNDO_SEND_NOTIFICATION_CANCEL') ?? '',
					events: {
						click: event => {
							event.preventDefault();
							this.#cancel(active);
						}
					}
				}],
				position: 'top-right',
				closeButton: false,
				autoHide: false
			}) ?? null;
			active.action = active.balloon?.getAction('cancel')?.getContainer() ?? null;
			if (active.action !== null) {
				main_core.Dom.attr(active.action, {
					'aria-label': main_core.Loc.getMessage('MAIL_UNDO_SEND_NOTIFICATION_CANCEL') ?? '',
					'data-testid': 'mail-undo-send-cancel'
				});
			}
			const reducedMotion = this.#matchMedia('(prefers-reduced-motion: reduce)').matches;
			active.timer = this.#setInterval(() => this.#update(active), reducedMotion ? 1000 : 100);
		}
		destroy() {
			const hostNotification = this.#getHostNotification();
			if (hostNotification !== null && hostNotification !== this) {
				hostNotification.destroy();
				return;
			}
			this.#closeActive();
		}
		#createActive(operation, duration, deadline) {
			const progress = this.#createProgress(duration);
			const message = main_core.Tag.render`
			<span class="mail-undo-send-notification__message" aria-hidden="true"></span>
		`;
			const statusMessage = main_core.Tag.render`<span></span>`;
			const remainingSeconds = this.#getRemainingSeconds(duration);
			const active = {
				operation,
				deadline,
				balloon: null,
				action: null,
				progress,
				message,
				statusMessage,
				remainingSeconds,
				timer: null,
				cancelling: false
			};
			this.#setSendingMessage(active, remainingSeconds);
			return active;
		}
		#render(active) {
			const timer = active.progress.getContainer();
			main_core.Dom.addClass(timer, 'mail-undo-send-notification__timer');
			main_core.Dom.attr(timer, 'aria-hidden', 'true');
			return main_core.Tag.render`
			<div class="mail-undo-send-notification" data-testid="mail-undo-send-notification">
				${timer}
				<div>${active.message}</div>
				<div class="mail-undo-send-notification__status" role="status" aria-live="polite" aria-atomic="true">
					${active.statusMessage}
				</div>
			</div>
		`;
		}
		#update(active) {
			if (this.#active !== active || active.cancelling) {
				return;
			}
			const remaining = Math.max(0, active.deadline - this.#now());
			active.progress.update(remaining);
			if (remaining === 0) {
				this.#expire(active);
				return;
			}
			const remainingSeconds = this.#getRemainingSeconds(remaining);
			if (remainingSeconds !== active.remainingSeconds) {
				this.#setSendingMessage(active, remainingSeconds);
			}
		}
		async #cancel(active) {
			if (active.cancelling || this.#active !== active) {
				return;
			}
			const current = active;
			current.cancelling = true;
			this.#stopTimer(current);
			this.#setActionDisabled(current, true);
			this.#setMessage(current.message, 'MAIL_UNDO_SEND_NOTIFICATION_CANCELLING');
			this.#setMessage(current.statusMessage, 'MAIL_UNDO_SEND_NOTIFICATION_CANCELLING');
			try {
				if (!main_core.Type.isStringFilled(active.operation.cancelToken)) {
					throw Object.assign(new Error('Cancellation token is missing.'), {
						name: 'UndoSendApiError',
						code: UndoSendErrorCode.Unknown,
						retryable: false
					});
				}
				const operation = await this.#api.cancel({
					token: active.operation.cancelToken
				});
				this.#close(active);
				main_core_events.EventEmitter.emit(UndoSendEvent.Cancelled, {
					operation
				});
				if (main_core.Type.isStringFilled(operation.restoreUrl)) {
					this.#openRestore(operation.restoreUrl, operation.restoreSliderWidth);
				}
			} catch (error) {
				const apiError = error;
				if (apiError.code === UndoSendErrorCode.CancelWindowExpired || apiError.code === UndoSendErrorCode.AlreadySending) {
					this.#expire(active);
					return;
				}
				main_core_events.EventEmitter.emit(UndoSendEvent.CancelFailed, {
					operationId: active.operation.operationId,
					code: apiError.code ?? UndoSendErrorCode.Unknown
				});
				if (this.#active !== active) {
					return;
				}
				if (active.deadline > this.#now()) {
					current.cancelling = false;
					this.#setActionDisabled(current, false);
					this.#setSendingMessage(current, this.#getRemainingSeconds(active.deadline - this.#now()));
					const reducedMotion = this.#matchMedia('(prefers-reduced-motion: reduce)').matches;
					current.timer = this.#setInterval(() => this.#update(current), reducedMotion ? 1000 : 100);
				} else {
					this.#expire(active);
				}
			}
		}
		#expire(active) {
			this.#close(active);
			if (!this.#guideReadyRecorded) {
				this.#guideReadyRecorded = true;
				this.#markGuideReady();
			}
			main_core_events.EventEmitter.emit(UndoSendEvent.Expired, {
				operationId: active.operation.operationId
			});
		}
		#closeActive() {
			if (this.#active !== null) {
				this.#close(this.#active);
			}
		}
		#close(active) {
			this.#stopTimer(active);
			active.balloon?.close();
			if (this.#active === active) {
				this.#active = null;
			}
		}
		#stopTimer(active) {
			const current = active;
			if (current.timer !== null) {
				this.#clearInterval(current.timer);
				current.timer = null;
			}
		}
		#setSendingMessage(active, remainingSeconds) {
			const current = active;
			current.remainingSeconds = remainingSeconds;
			this.#setMessage(current.message, 'MAIL_UNDO_SEND_NOTIFICATION_COUNTDOWN', {
				'#SECONDS#': String(remainingSeconds)
			});
			this.#setMessage(current.statusMessage, 'MAIL_UNDO_SEND_NOTIFICATION_SENDING');
		}
		#setMessage(element, messageCode, replacements = {}) {
			main_core.Dom.adjust(element, {
				text: main_core.Loc.getMessage(messageCode, replacements) ?? ''
			});
		}
		#getRemainingSeconds(remaining) {
			return Math.max(1, Math.ceil(remaining / 1000));
		}
		#setActionDisabled(active, disabled) {
			if (active.action !== null) {
				main_core.Dom.attr(active.action, 'aria-disabled', disabled ? 'true' : null);
			}
		}
	}

	const UserOptionCategory = 'mail.guide';
	const QueueItemId = 'mail-undo-send-guide';
	const PopupId = 'mail-undo-send-guide-popup';
	const DefaultBindSelector = '.mail-list-settings-menu-popup-toggle';
	const PopupWidth = 320;
	const DefaultDependencies = {
		enqueue: (callback, options) => ui_bannerDispatcher.BannerDispatcher.normal.toQueue(callback, options),
		unregister: id => BX.UI.AutoLaunch.AutoLauncher.unregister(id),
		createPopup: (bindElement, onDone) => main_popup.PopupManager.create({
			id: PopupId,
			bindElement,
			ariaLabel: main_core.Loc.getMessage('MAIL_UNDO_SEND_GUIDE_TITLE') ?? '',
			closeIcon: true,
			autoHide: true,
			closeByEsc: true,
			width: PopupWidth,
			angle: {
				offset: 24,
				position: 'top'
			},
			content: createContent(),
			events: {
				onClose: onDone
			}
		}),
		save: optionName => {
			BX.userOptions.save(UserOptionCategory, optionName, null, 'Y');
		},
		subscribeExpired: handler => {
			main_core_events.EventEmitter.subscribe(UndoSendEvent.Expired, handler);
			return () => main_core_events.EventEmitter.unsubscribe(UndoSendEvent.Expired, handler);
		}
	};
	function createContent() {
		const content = main_core.Tag.render`<div data-testid="mail-undo-send-guide"></div>`;
		content.textContent = main_core.Loc.getMessage('MAIL_UNDO_SEND_GUIDE_TEXT') ?? '';
		return content;
	}
	class UndoSendGuide {
		#optionName;
		#bindSelector;
		#dependencies;
		#popup = null;
		#queued = false;
		#destroyed = false;
		#ready;
		#unsubscribeExpired = null;
		constructor(options, dependencies = DefaultDependencies) {
			this.#optionName = options.optionName;
			this.#bindSelector = options.bindSelector ?? DefaultBindSelector;
			this.#dependencies = dependencies;
			this.#ready = options.ready === true;
		}
		show() {
			if (this.#queued || this.#destroyed || !main_core.Type.isStringFilled(this.#optionName)) {
				return;
			}
			if (!this.#ready) {
				this.#unsubscribeExpired ??= this.#dependencies.subscribeExpired(() => {
					this.#ready = true;
					this.#unsubscribeExpired?.();
					this.#unsubscribeExpired = null;
					this.show();
				});
				return;
			}
			if (!this.#resolveBindElement()) {
				return;
			}
			this.#queued = true;
			this.#dependencies.enqueue(onDone => {
				const bindElement = this.#resolveBindElement();
				if (this.#destroyed || !bindElement) {
					onDone();
					return;
				}
				this.#popup = this.#dependencies.createPopup(bindElement, onDone);
				this.#popup.show();
				this.#dependencies.save(this.#optionName);
			}, {
				id: QueueItemId
			});
		}
		destroy() {
			this.#destroyed = true;
			this.#popup?.close();
			this.#popup = null;
			this.#unsubscribeExpired?.();
			this.#unsubscribeExpired = null;
			this.#dependencies.unregister(QueueItemId);
		}
		#resolveBindElement() {
			const bindElement = document.querySelector(this.#bindSelector);
			return bindElement instanceof HTMLElement ? bindElement : null;
		}
	}

	const ParentItemId = 'mail-undo-send-preference';
	const DelayItemIdPrefix = 'mail-undo-send-preference-';
	const SelectedClassName = 'menu-popup-item-accept';
	const DelayValues = [0, 5, 10, 20];
	class UndoSendMenu {
		#delaySeconds;
		#api;
		#onSaveError;
		#saveRevision = 0;
		constructor(options) {
			this.#delaySeconds = options.delaySeconds;
			this.#api = options.api ?? undoSendApi;
			this.#onSaveError = options.onSaveError ?? (() => {});
		}
		getItem() {
			return {
				id: ParentItemId,
				text: this.#getParentText(this.#delaySeconds),
				dataset: {
					testid: ParentItemId
				},
				items: DelayValues.map(delaySeconds => this.#getDelayItem(delaySeconds)),
				events: {
					onSubMenuShow: event => {
						const item = event.getTarget();
						this.#updateSelectionState(item.getSubMenu());
					}
				}
			};
		}
		#getDelayItem(delaySeconds) {
			return {
				id: `${DelayItemIdPrefix}${delaySeconds}`,
				text: this.#getDelayText(delaySeconds),
				className: delaySeconds === this.#delaySeconds ? SelectedClassName : '',
				dataset: {
					testid: `${DelayItemIdPrefix}${delaySeconds}`
				},
				onclick: (event, item) => {
					event.preventDefault();
					void this.#save(delaySeconds, item);
				}
			};
		}
		async #save(delaySeconds, selectedItem) {
			if (delaySeconds === this.#delaySeconds) {
				this.#closeRootMenu(selectedItem.getMenuWindow());
				return;
			}
			const revision = ++this.#saveRevision;
			try {
				const preference = await this.#api.setPreference({
					delaySeconds
				});
				if (revision !== this.#saveRevision) {
					return;
				}
				this.#delaySeconds = preference.delaySeconds;
				this.#updateMenu(selectedItem);
				this.#closeRootMenu(selectedItem.getMenuWindow());
			} catch (error) {
				if (revision === this.#saveRevision) {
					this.#onSaveError(error);
				}
			}
		}
		#updateMenu(selectedItem) {
			const subMenu = selectedItem.getMenuWindow();
			subMenu.getParentMenuItem()?.setText(this.#getParentText(this.#delaySeconds));
			this.#updateSelectionState(subMenu);
		}
		#updateSelectionState(menu) {
			menu?.getMenuItems().forEach((item, index) => {
				const isSelected = DelayValues[index] === this.#delaySeconds;
				if (isSelected) {
					main_core.Dom.addClass(item.getContainer(), SelectedClassName);
				} else {
					main_core.Dom.removeClass(item.getContainer(), SelectedClassName);
				}
				main_core.Dom.attr(item.getContainer(), {
					role: 'menuitemradio',
					'aria-checked': isSelected ? 'true' : 'false'
				});
			});
		}
		#closeRootMenu(subMenu) {
			(subMenu.getRootMenuWindow() ?? subMenu).close();
		}
		#getParentText(delaySeconds) {
			return main_core.Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_MENU', {
				'#VALUE#': this.#getInlineDelayText(delaySeconds)
			}) ?? '';
		}
		#getInlineDelayText(delaySeconds) {
			if (delaySeconds === 0) {
				return main_core.Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_DISABLED_INLINE') ?? '';
			}
			return main_core.Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_SECONDS_INLINE', {
				'#SECONDS#': String(delaySeconds)
			}) ?? '';
		}
		#getDelayText(delaySeconds) {
			if (delaySeconds === 0) {
				return main_core.Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_DISABLED') ?? '';
			}
			return main_core.Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_SECONDS', {
				'#SECONDS#': String(delaySeconds)
			}) ?? '';
		}
	}

	const undoSendNotification = new UndoSendNotification();

	exports.UndoSendApi = UndoSendApi;
	exports.UndoSendErrorCode = UndoSendErrorCode;
	exports.UndoSendEvent = UndoSendEvent;
	exports.UndoSendGuide = UndoSendGuide;
	exports.UndoSendMenu = UndoSendMenu;
	exports.UndoSendNotification = UndoSendNotification;
	exports.undoSendApi = undoSendApi;
	exports.undoSendNotification = undoSendNotification;

})(this.BX.Mail.Client.UndoSend = this.BX.Mail.Client.UndoSend || {}, BX.UI.Notification, BX, BX.Event, BX.SidePanel, BX.UI, BX.Main, BX.UI);
//# sourceMappingURL=undo-send.bundle.js.map

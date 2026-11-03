import { Dom, Loc, Page, Tag, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { SidePanel, type SliderManager } from 'main.sidepanel';
import { type Balloon } from 'ui.notification';
import { ProgressRound } from 'ui.progressround';

import { type UndoSendApi, undoSendApi } from '../api';
import { UndoSendErrorCode, type UndoSendApiError, type UndoSendOperationDto } from '../types';

import './undo-send-notification.css';

export const UndoSendEvent = Object.freeze({
	Cancelled: 'Mail.UndoSend:onCancelled',
	Expired: 'Mail.UndoSend:onExpired',
	CancelFailed: 'Mail.UndoSend:onCancelFailed',
} as const);

type TimerId = ReturnType<typeof setInterval>;

type NotificationCenter = {
	notify(options: Record<string, unknown>): Balloon | undefined,
};

type ProgressRoundView = {
	getContainer(): Element,
	update(value: number): void,
};

type NotificationView = {
	show(operation: UndoSendOperationDto): void,
	destroy(): void,
};

type PortalWindow = Window & {
	BX?: {
		Mail?: {
			Client?: {
				UndoSend?: {
					undoSendNotification?: NotificationView,
				},
			},
		},
	},
};

type ActiveNotification = {
	operation: UndoSendOperationDto,
	deadline: number,
	balloon: Balloon | null,
	action: HTMLElement | null,
	progress: ProgressRoundView,
	message: HTMLElement,
	statusMessage: HTMLElement,
	remainingSeconds: number,
	timer: TimerId | null,
	cancelling: boolean,
};

export type UndoSendNotificationDependencies = {
	api?: Pick<UndoSendApi, 'cancel'>,
	center?: NotificationCenter,
	now?: () => number,
	setInterval?: (handler: () => void, timeout: number) => TimerId,
	clearInterval?: (timer: TimerId) => void,
	matchMedia?: (query: string) => MediaQueryList,
	createProgress?: (duration: number) => ProgressRoundView,
	getHostNotification?: () => NotificationView | null,
	sliderManager?: SliderManager,
	markGuideReady?: () => void,
	openRestore?: (url: string) => void,
};

export class UndoSendNotification
{
	#api: Pick<UndoSendApi, 'cancel'>;
	#center: NotificationCenter | null;
	#now: () => number;
	#setInterval: (handler: () => void, timeout: number) => TimerId;
	#clearInterval: (timer: TimerId) => void;
	#matchMedia: (query: string) => MediaQueryList;
	#createProgress: (duration: number) => ProgressRoundView;
	#getHostNotification: () => NotificationView | null;
	#markGuideReady: () => void;
	#openRestore: (url: string, width: number) => void;
	#guideReadyRecorded = false;
	#active: ActiveNotification | null = null;

	constructor(dependencies: UndoSendNotificationDependencies = {})
	{
		const getSliderManager = (): SliderManager => dependencies.sliderManager ?? SidePanel.Instance;
		this.#api = dependencies.api ?? undoSendApi;
		this.#center = dependencies.center ?? null;
		this.#now = dependencies.now ?? Date.now;
		this.#setInterval = dependencies.setInterval ?? globalThis.setInterval.bind(globalThis);
		this.#clearInterval = dependencies.clearInterval ?? globalThis.clearInterval.bind(globalThis);
		this.#matchMedia = dependencies.matchMedia ?? globalThis.matchMedia.bind(globalThis);
		this.#getHostNotification = dependencies.getHostNotification ?? (() => {
			const sliderManager = getSliderManager();
			const currentSlider = sliderManager.getSliderByWindow(window);
			const hostWindow = currentSlider === sliderManager.getTopSlider()
				? sliderManager.getPreviousSlider(currentSlider)?.getFrameWindow()
					?? Page.getRootWindow()
				: window;

			return (hostWindow as PortalWindow).BX?.Mail?.Client?.UndoSend?.undoSendNotification ?? null;
		});
		this.#markGuideReady = dependencies.markGuideReady ?? (() => {
			(BX as unknown as {
				userOptions: {
					save(category: string, name: string, valueName: null, value: string): void,
				},
			}).userOptions.save('mail.guide', 'undo_send_guide_ready', null, 'Y');
		});
		const openRestore = dependencies.openRestore;
		this.#openRestore = openRestore === undefined
			? (url: string, width: number): void => {
				getSliderManager().open(url, { width, cacheable: false });
			}
			: (url: string): void => {
				openRestore(url);
			}
		;
		this.#createProgress = dependencies.createProgress ?? ((duration: number) => {
			return new ProgressRound({
				value: duration,
				maxValue: duration,
				color: ProgressRound.Color.PRIMARY,
				width: 24,
				textBefore: '',
				textAfter: '',
				colorTrack: '',
				colorBar: '',
				statusType: ProgressRound.Status.NONE,
				lineSize: 3,
				fill: false,
				finished: false,
				rotation: false,
				useAirDesign: false,
			});
		});
	}

	show(operation: UndoSendOperationDto): void
	{
		const hostNotification = this.#getHostNotification();
		if (hostNotification !== null && hostNotification !== this)
		{
			hostNotification.show(operation);

			return;
		}

		this.#closeActive();

		const serverNow = Date.parse(operation.serverNow);
		const cancelUntil = Date.parse(operation.cancelUntil);
		const duration = Math.max(0, cancelUntil - serverNow);
		const active = this.#createActive(operation, duration, this.#now() + duration);
		this.#active = active;

		if (duration === 0)
		{
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
				title: Loc.getMessage('MAIL_UNDO_SEND_NOTIFICATION_CANCEL') ?? '',
				events: {
					click: (event: Event): void => {
						event.preventDefault();
						this.#cancel(active);
					},
				},
			}],
			position: 'top-right',
			closeButton: false,
			autoHide: false,
		}) ?? null;
		active.action = active.balloon?.getAction('cancel')?.getContainer() ?? null;
		if (active.action !== null)
		{
			Dom.attr(active.action, {
				'aria-label': Loc.getMessage('MAIL_UNDO_SEND_NOTIFICATION_CANCEL') ?? '',
				'data-testid': 'mail-undo-send-cancel',
			});
		}

		const reducedMotion = this.#matchMedia('(prefers-reduced-motion: reduce)').matches;
		active.timer = this.#setInterval(() => this.#update(active), reducedMotion ? 1000 : 100);
	}

	destroy(): void
	{
		const hostNotification = this.#getHostNotification();
		if (hostNotification !== null && hostNotification !== this)
		{
			hostNotification.destroy();

			return;
		}

		this.#closeActive();
	}

	#createActive(operation: UndoSendOperationDto, duration: number, deadline: number): ActiveNotification
	{
		const progress = this.#createProgress(duration);
		const message = Tag.render`
			<span class="mail-undo-send-notification__message" aria-hidden="true"></span>
		`;
		const statusMessage = Tag.render`<span></span>`;
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
			cancelling: false,
		};
		this.#setSendingMessage(active, remainingSeconds);

		return active;
	}

	#render(active: ActiveNotification): HTMLElement
	{
		const timer = active.progress.getContainer() as HTMLElement;
		Dom.addClass(timer, 'mail-undo-send-notification__timer');
		Dom.attr(timer, 'aria-hidden', 'true');

		return Tag.render`
			<div class="mail-undo-send-notification" data-testid="mail-undo-send-notification">
				${timer}
				<div>${active.message}</div>
				<div class="mail-undo-send-notification__status" role="status" aria-live="polite" aria-atomic="true">
					${active.statusMessage}
				</div>
			</div>
		`;
	}

	#update(active: ActiveNotification): void
	{
		if (this.#active !== active || active.cancelling)
		{
			return;
		}

		const remaining = Math.max(0, active.deadline - this.#now());
		active.progress.update(remaining);

		if (remaining === 0)
		{
			this.#expire(active);

			return;
		}

		const remainingSeconds = this.#getRemainingSeconds(remaining);
		if (remainingSeconds !== active.remainingSeconds)
		{
			this.#setSendingMessage(active, remainingSeconds);
		}
	}

	async #cancel(active: ActiveNotification): Promise<void>
	{
		if (active.cancelling || this.#active !== active)
		{
			return;
		}

		const current = active;
		current.cancelling = true;
		this.#stopTimer(current);
		this.#setActionDisabled(current, true);
		this.#setMessage(current.message, 'MAIL_UNDO_SEND_NOTIFICATION_CANCELLING');
		this.#setMessage(current.statusMessage, 'MAIL_UNDO_SEND_NOTIFICATION_CANCELLING');

		try
		{
			if (!Type.isStringFilled(active.operation.cancelToken))
			{
				throw Object.assign(new Error('Cancellation token is missing.'), {
					name: 'UndoSendApiError',
					code: UndoSendErrorCode.Unknown,
					retryable: false,
				});
			}

			const operation = await this.#api.cancel({
				token: active.operation.cancelToken,
			});
			this.#close(active);
			EventEmitter.emit(UndoSendEvent.Cancelled, { operation });
			if (Type.isStringFilled(operation.restoreUrl))
			{
				this.#openRestore(operation.restoreUrl, operation.restoreSliderWidth);
			}
		}
		catch (error)
		{
			const apiError = error as UndoSendApiError;
			if (
				apiError.code === UndoSendErrorCode.CancelWindowExpired
				|| apiError.code === UndoSendErrorCode.AlreadySending
			)
			{
				this.#expire(active);

				return;
			}

			EventEmitter.emit(UndoSendEvent.CancelFailed, {
				operationId: active.operation.operationId,
				code: apiError.code ?? UndoSendErrorCode.Unknown,
			});

			if (this.#active !== active)
			{
				return;
			}

			if (active.deadline > this.#now())
			{
				current.cancelling = false;
				this.#setActionDisabled(current, false);
				this.#setSendingMessage(
					current,
					this.#getRemainingSeconds(active.deadline - this.#now()),
				);
				const reducedMotion = this.#matchMedia('(prefers-reduced-motion: reduce)').matches;
				current.timer = this.#setInterval(() => this.#update(current), reducedMotion ? 1000 : 100);
			}
			else
			{
				this.#expire(active);
			}
		}
	}

	#expire(active: ActiveNotification): void
	{
		this.#close(active);
		if (!this.#guideReadyRecorded)
		{
			this.#guideReadyRecorded = true;
			this.#markGuideReady();
		}
		EventEmitter.emit(UndoSendEvent.Expired, { operationId: active.operation.operationId });
	}

	#closeActive(): void
	{
		if (this.#active !== null)
		{
			this.#close(this.#active);
		}
	}

	#close(active: ActiveNotification): void
	{
		this.#stopTimer(active);
		active.balloon?.close();

		if (this.#active === active)
		{
			this.#active = null;
		}
	}

	#stopTimer(active: ActiveNotification): void
	{
		const current = active;
		if (current.timer !== null)
		{
			this.#clearInterval(current.timer);
			current.timer = null;
		}
	}

	#setSendingMessage(active: ActiveNotification, remainingSeconds: number): void
	{
		const current = active;
		current.remainingSeconds = remainingSeconds;
		this.#setMessage(current.message, 'MAIL_UNDO_SEND_NOTIFICATION_COUNTDOWN', {
			'#SECONDS#': String(remainingSeconds),
		});
		this.#setMessage(current.statusMessage, 'MAIL_UNDO_SEND_NOTIFICATION_SENDING');
	}

	#setMessage(
		element: HTMLElement,
		messageCode: string,
		replacements: Record<string, string> = {},
	): void
	{
		Dom.adjust(element, { text: Loc.getMessage(messageCode, replacements) ?? '' });
	}

	#getRemainingSeconds(remaining: number): number
	{
		return Math.max(1, Math.ceil(remaining / 1000));
	}

	#setActionDisabled(active: ActiveNotification, disabled: boolean): void
	{
		if (active.action !== null)
		{
			Dom.attr(active.action, 'aria-disabled', disabled ? 'true' : null);
		}
	}
}

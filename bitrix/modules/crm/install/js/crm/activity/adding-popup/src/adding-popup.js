import { TodoEditorMode, TodoEditorV2 } from 'crm.activity.todo-editor-v2';
import { ajax as Ajax, Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { PopupOptions } from 'main.popup';
import { Popup } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';
import { ButtonColor, ButtonSize, CancelButton, SaveButton } from 'ui.buttons';
import { UI } from 'ui.notification';

import './adding-popup.css';

type Context = {
	analytics: Object;
}

/**
 * @event onSave
 * @event onClose
 */
export class AddingPopup
{
	#entityId: Number = null;
	#entityTypeId: Number = null;
	#currentUser: Object = null;
	#pingSettings: Object = null;
	#calendarSettings: Object = null;
	#colorSettings: Object = null;
	#popup: ?Popup = null;
	#popupContainer: HTMLElement = null;
	#popupToDoEditorContainer: HTMLElement = null;
	#todoEditor: TodoEditorV2 | null = null;
	#eventEmitter: EventEmitter = null;
	#context: Context = {};
	#openingQueue: Promise<void> = Promise.resolve();
	#lastOpeningId: Number = 0;

	constructor(entityTypeId: Number, entityId: Number, currentUser: Object, settings: Object, params: Object)
	{
		this.#entityId = Text.toInteger(entityId);
		this.#entityTypeId = Text.toInteger(entityTypeId);
		this.#currentUser = currentUser;

		this.#eventEmitter = new EventEmitter();
		this.#eventEmitter.setEventNamespace('Crm.Activity.AddingPopup');

		if (Type.isObject(settings))
		{
			this.#pingSettings = settings.pingSettings ?? null;
			this.#calendarSettings = settings.calendarSettings ?? null;
			this.#colorSettings = settings.colorSettings ?? null;
		}

		if (!Type.isPlainObject(params))
		{
			// eslint-disable-next-line no-param-reassign
			params = {};
		}

		if (Type.isObject(params.events))
		{
			for (const eventName in params.events)
			{
				if (Type.isFunction(params.events[eventName]))
				{
					this.#eventEmitter.subscribe(eventName, params.events[eventName]);
				}
			}
		}

		if (Type.isPlainObject(params.context))
		{
			this.#context = params.context;
		}
	}

	async show(mode: String = TodoEditorMode.ADD): Promise<void>
	{
		// the kanban card is unlocked as soon as show() is called, so the user can move it once more or
		// ask for a new activity while the update requests are still in flight. openings are serialized
		// to keep two prefills from interleaving, and the last one wins: a superseded opening is
		// dropped at its next await point, before it applies its snapshot or shows the popup, so the
		// form always gets the mode of the last call and data read after the last move
		this.#lastOpeningId += 1;
		const openingId = this.#lastOpeningId;

		const opening = this.#openingQueue.then(() => this.#openIfLastRequested(mode, openingId));
		// the queue tail never rejects, so a broken opening does not block the following ones
		this.#openingQueue = opening.catch(() => {});

		return opening;
	}

	async #openIfLastRequested(mode: String, openingId: Number): Promise<void>
	{
		if (this.#isSuperseded(openingId))
		{
			return;
		}

		await this.#open(mode, openingId);
	}

	#isSuperseded(openingId: Number): boolean
	{
		return openingId !== this.#lastOpeningId;
	}

	async #open(mode: String, openingId: Number): Promise<void>
	{
		const popup = this.#createPopupIfNotExists();

		if (popup.isShown())
		{
			return;
		}

		if (!this.#popupToDoEditorContainer.hasChildNodes())
		{
			await this.#createToDoEditor();
			this.#todoEditor.show();

			popup.setButtons([
				new SaveButton({
					id: 'save',
					color: ButtonColor.PRIMARY,
					size: ButtonSize.EXTRA_SMALL,
					round: true,
					dataset: { testid: this.#getTestId('save') },
					events: {
						click: this.#saveAndClose.bind(this),
					},
				}),
				new CancelButton({
					id: 'cancel',
					size: ButtonSize.EXTRA_SMALL,
					round: true,
					dataset: { testid: this.#getTestId('cancel') },
					events: {
						click: () => {
							this.#todoEditor?.sendAnalyticsCancelEvent(this.#getAnalyticsContext());

							popup.close();
						},
					},
				}),
			]);

			popup.subscribeOnce('onFirstShow', (event) => {
				event.target.getZIndexComponent().setZIndex(1400);
			});
			popup.subscribe('onAfterShow', () => {
				this.#actualizePopupLayout();
				this.#todoEditor.setFocused();
			});
			popup.subscribe('onAfterClose', () => {
				void this.#todoEditor.resetToDefaults().then(() => {
					this.#eventEmitter.emit('onClose');
				});
			});
		}

		await this.#prepareAndShowPopup(popup, mode, openingId);
	}

	async #createToDoEditor(): TodoEditorV2
	{
		// just created, initialize
		const params = {
			container: this.#popupToDoEditorContainer,
			ownerTypeId: this.#entityTypeId,
			ownerId: this.#entityId,
			currentUser: this.#currentUser,
			pingSettings: this.#pingSettings,
			events: {
				onSaveHotkeyPressed: this.#onEditorSaveHotkeyPressed.bind(this),
				onChangeUploaderContainerSize: this.#onChangeUploaderContainerSize.bind(this),
				onFocus: this.#onFocus.bind(this),
			},
			popupMode: true,
		};

		const analytics = this.#getAnalyticsContext();
		const section = analytics.c_section ?? null;
		const subSection = analytics.c_sub_section ?? null;

		params.calendarSettings = this.#calendarSettings;
		params.colorSettings = this.#colorSettings;
		params.defaultDescription = '';
		params.analytics = {
			section,
			subSection,
		};

		this.#todoEditor = new TodoEditorV2(params);
	}

	#getAnalyticsContext(): Object
	{
		return Type.isPlainObject(this.#context?.analytics) ? this.#context.analytics : {};
	}

	// callers keep one popup per entity alive and never destroy it, so several popups share the page
	#getTestId(element: String): String
	{
		return `crm-activity-adding-popup-${element}-${this.#entityTypeId}-${this.#entityId}`;
	}

	async #prepareAndShowPopup(popup: Popup, mode: String, openingId: Number): Promise<void>
	{
		if (mode === TodoEditorMode.ADD)
		{
			popup.show();

			return;
		}

		if (mode !== TodoEditorMode.UPDATE)
		{
			console.error('Wrong TodoEditor mode');

			return;
		}

		// the whole update path is wrapped: show() must not reject, because no caller handles its
		// result, and an unhandled rejection would be the only trace of a broken prefill
		try
		{
			const activity = await this.#fetchNearActivity();
			if (this.#isSuperseded(openingId) || !activity)
			{
				return;
			}

			const settings = await this.#fetchActivitySettings(activity.id);
			if (this.#isSuperseded(openingId) || !settings)
			{
				return;
			}

			const { entityData, blocksData } = settings;
			await this.#todoEditor.setActivityData(entityData, blocksData, TodoEditorMode.UPDATE);
			// a snapshot applied just before being superseded must not be shown: the popup is checked
			// for isShown() on the next opening, so showing it here would freeze the stale data
			if (this.#isSuperseded(openingId))
			{
				return;
			}

			popup.show();
		}
		catch (error)
		{
			console.error('Crm.Activity.AddingPopup: unable to open the update form', error);
		}
	}

	// resolves with null instead of rejecting on a request failure: no caller handles the result of
	// show(), so a rejection would surface as an unhandled rejection on top of the shown notification
	#fetchNearActivity(): Promise<?Object>
	{
		const data = {
			ownerTypeId: this.#entityTypeId,
			ownerId: this.#entityId,
		};

		return new Promise((resolve, reject) => {
			Ajax.runAction('crm.activity.todo.getNearest', { data })
				// the shape is checked instead of being destructured, so that an unexpected response
				// is rejected as a defect and never reaches the request failure handler below
				.then((response) => {
					if (!Type.isPlainObject(response) || !('data' in response))
					{
						reject(new Error('crm.activity.todo.getNearest returned an unexpected response'));

						return;
					}

					// null when the entity has no unfinished activity
					resolve(response.data);
				})
				.catch((response) => {
					this.#notifyFetchError(response);
					resolve(null);
				});
		});
	}

	#fetchActivitySettings(activityId: Number): Promise<?Object>
	{
		const data = {
			id: activityId,
			ownerTypeId: this.#entityTypeId,
			ownerId: this.#entityId,
		};

		return new Promise((resolve, reject) => {
			Ajax.runAction('crm.activity.todo.fetchSettings', { data })
				.then((response) => {
					if (!Type.isPlainObject(response) || !('data' in response))
					{
						reject(new Error('crm.activity.todo.fetchSettings returned an unexpected response'));

						return;
					}

					// null when the activity is gone between the two requests
					resolve(response.data);
				})
				.catch((response) => {
					this.#notifyFetchError(response);
					resolve(null);
				});
		});
	}

	#notifyFetchError(response: ?Object): void
	{
		const message = response?.errors?.[0]?.message;
		if (!message)
		{
			console.error('Crm.Activity.AddingPopup: the request failed without a message to show', response);

			return;
		}

		UI.Notification.Center.notify({
			content: message,
			autoHideDelay: 5000,
		});
		LiveAnnouncer.announce(message, 'assertive');
	}

	#createPopupIfNotExists(): Popup
	{
		if (!this.#popup || this.#popup.isDestroyed())
		{
			this.#popupToDoEditorContainer = Tag.render`<div data-testid="${this.#getTestId('editor')}"></div>`;
			this.#popupContainer = Tag.render`
				<div class="crm-activity-adding-popup-container" data-testid="${this.#getTestId('container')}">
					${this.#getPopupTitle()}
					${this.#popupToDoEditorContainer}
				</div>
			`;

			this.#popup = new Popup(this.#getPopupParams());
		}

		return this.#popup;
	}

	#getPopupTitle(): ?HTMLDivElement
	{
		return Tag.render`
			<div class="crm-activity-adding-popup-title">
				${Loc.getMessage('CRM_ACTIVITY_ADDING_POPUP_TITLE')}
			</div>
		`;
	}

	#getPopupParams(): PopupOptions
	{
		const { innerWidth } = window;

		return {
			id: `kanban_planner_menu_${this.#entityId}`,
			content: this.#popupContainer,
			cacheable: false,
			isScrollBlock: true,
			className: 'crm-activity-adding-popup',
			closeByEsc: true,
			closeIcon: false,
			padding: 16,
			minWidth: 537,
			width: Math.round(innerWidth * 0.45),
			maxWidth: 737,
			minHeight: 150,
			maxHeight: 482,
			overlay: {
				opacity: 50,
			},
		};
	}

	#saveAndClose(): void
	{
		if (this.#popup)
		{
			const saveButton = this.#popup.getButton('save');
			if (saveButton.getState())
			{
				return; // button is disabled
			}
			saveButton?.setWaiting(true);
			this.#todoEditor.save()
				.then(() => {
					this.#popup.close();
					this.#eventEmitter.emit('onSave');
				})
				.catch(() => {})
				.finally(() => saveButton?.setWaiting(false))
			;
		}
	}

	#actualizePopupLayout(description): void
	{
		if (this.#popup && this.#popup.isShown())
		{
			this.#eventEmitter.emit('onActualizePopupLayout', { entityId: this.#entityId });

			this.#popup.adjustPosition({
				forceBindPosition: true,
			});
		}
	}

	#onEditorSaveHotkeyPressed()
	{
		this.#saveAndClose();
	}

	#onChangeUploaderContainerSize()
	{
		if (this.#popup)
		{
			this.#eventEmitter.emit('onActualizePopupLayout', { entityId: this.#entityId });
			this.#popup.adjustPosition();
		}
	}

	#onFocus()
	{
		setTimeout(() => {
			const popup = this.#createPopupIfNotExists();

			popup.adjustPosition({
				forceBindPosition: true,
			});
		}, 0);
	}
}

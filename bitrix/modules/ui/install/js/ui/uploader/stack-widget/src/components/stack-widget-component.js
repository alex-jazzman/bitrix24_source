import { Dom, Text, Loc, Type } from 'main.core';
import { Popup } from 'main.popup';
import { CloseButton } from 'ui.buttons';

import { LiveAnnouncer } from 'ui.a11y';
import { FileStatus, FileOrigin, UploaderStatus } from 'ui.uploader.core';
import { VueUploaderComponent } from 'ui.uploader.vue';
import { TileList, ErrorPopup, DragOverMixin } from 'ui.uploader.tile-widget';

import { StackUpload } from './stack-upload';
import { StackLoad } from './stack-load';
import { StackPreview } from './stack-preview';
import { StackDropArea } from './stack-drop-area';

import type { PopupOptions } from 'main.popup';
import type { BaseEvent } from 'main.core.events';

const isItemLoading = item => item.status === FileStatus.LOADING;

const stackButtonSelector = '.ui-uploader-stack-preview, .ui-uploader-stack-upload, .ui-uploader-stack-load';
const dropAreaInputSelector = '.ui-uploader-stack-drop-input';

/**
 * @memberof BX.UI.Uploader
 */
export const StackWidgetComponent = {
	name: 'StackWidget',
	extends: VueUploaderComponent,
	components: {
		TileList,
		ErrorPopup,
		StackUpload,
		StackLoad,
		StackPreview,
		StackDropArea,
	},
	mixins: [
		DragOverMixin,
	],
	data: () => ({
		popupContentId: null,
		queueItems: [],
		enableAnimation: true,
		dragMode: false,
		isMounted: false,
		errorTextId: `ui-uploader-stack-error-${Text.getRandom().toLowerCase()}`,
		// the user has closed the message and it must not come back on its own; the answer holds until
		// something new goes wrong. Which error it was is deliberately not kept: `error` falls back from
		// the uploader to the files, and an answer remembered by value is lost on that fallback
		errorDismissed: false,
	}),
	computed: {
		containerClasses(): Array
		{
			return [
				{
					'--multiple': this.uploader.isMultiple(),
					'--only-images': this.uploader.shouldAcceptOnlyImages(),
					'--many-items': this.items.length > 1,
				},
				`--${this.widgetOptions.size}`
			];
		},
		currentComponent()
		{
			if (this.items.length === 0 || this.dragOver)
			{
				if (this.dragOver)
				{
					this.dragMode = true;
				}

				return StackDropArea;
			}

			if (this.queueItems.length > 0)
			{
				return StackUpload;
			}

			if (this.items.some(isItemLoading))
			{
				return StackLoad;
			}

			return StackPreview;
		},
		currentComponentProps()
		{
			if (this.currentComponent === StackDropArea)
			{
				return {
					errorId: this.errorId,
				};
			}
			else if (this.currentComponent === StackLoad)
			{
				return {
					isPopupShown: this.isPopupShown,
					errorId: this.errorId,
				};
			}
			else if (this.currentComponent === StackUpload)
			{
				return {
					items: this.items,
					queueItems: this.queueItems,
					isPopupShown: this.isPopupShown,
					errorId: this.errorId,
				};
			}
			else if (this.currentComponent === StackPreview)
			{
				return {
					items: this.items,
					isPopupShown: this.isPopupShown,
					errorId: this.errorId,
				}
			}
		},
		/**
		 * The popup belongs to the root, so the state of the button opening it is resolved here. The
		 * content id is the reactive trace of that popup: it appears with the popup and is dropped when
		 * the popup is destroyed, and a non-cacheable popup is destroyed on every close.
		 */
		isPopupShown(): boolean
		{
			return this.popupContentId !== null;
		},
		addFileLabel(): string
		{
			return Loc.getMessage('STACK_WIDGET_ADD_FILE_LABEL');
		},
		error()
		{
			if (this.uploaderError)
			{
				return this.uploaderError;
			}
			else if (this.errorsCount > 0)
			{
				return Loc.getMessage('STACK_WIDGET_FILE_UPLOAD_ERROR');
			}

			return null;
		},
		/**
		 * The text of the error for a screen reader: the error itself is only drawn in a popup, and the
		 * stack keeps a hidden copy of that text to describe itself while the error lasts.
		 */
		errorText(): ?string
		{
			const error = this.error;
			if (Type.isStringFilled(error))
			{
				return error;
			}

			if (Type.isObject(error))
			{
				return [error.message, error.description].filter(Type.isStringFilled).join(' ');
			}

			return null;
		},
		// the description is tied to the stack only while there is an error: an aria-describedby
		// pointing at nothing is a defect of its own
		errorId(): ?string
		{
			return Type.isStringFilled(this.errorText) ? this.errorTextId : null;
		},
		errorsCount(): number
		{
			return this.items.reduce((errors, item) => {
				if (item.status === FileStatus.LOAD_FAILED || item.status === FileStatus.UPLOAD_FAILED)
				{
					return errors + 1;
				}
				else
				{
					return errors;
				}
			}, 0);
		},
		errorPopupOptions(): PopupOptions
		{
			return {
				bindElement: this.$refs.item,
				bindOptions: {
					position: 'top',
				},
				darkMode: true,
				offsetTop: 3,
				background: '#d2000d',
				contentBackground: 'transparent',
				contentColor: 'white',
				padding: this.uploaderError === null ? 10 : 20,
				closeIcon: this.uploaderError !== null,
				closeByEsc: true,
				// the popup of the error carries no title bar, so its accessible name comes from here
				ariaLabel: Loc.getMessage('STACK_WIDGET_FILE_UPLOAD_ERROR'),
				/**
				 * The error appears on its own, and a message nobody asked for must not take the
				 * focus away from wherever the user is. There is nothing focusable inside this popup
				 * either, so a trap would hold the focus on its container and Tab would stop working
				 * at all. The error reaches a screen reader without the focus: it is announced
				 * assertively and describes the stack through aria-describedby.
				 */
				focusTrap: false,
			};
		},
	},
	watch: {
		currentComponent(newValue, oldValue): void
		{
			if (this.dragOver)
			{
				this.enableAnimation = false;
			}
			else if (oldValue === StackDropArea && this.dragMode)
			{
				this.enableAnimation = false;
			}
			else if (oldValue === StackPreview)
			{
				this.enableAnimation = false;
			}
			else
			{
				this.dragMode = false;
				this.enableAnimation = true;
			}

			/**
			 * The state on screen is about to be replaced, and the element holding the focus goes away with
			 * it: the focus would fall to the body, or `FocusMonitor` would pick it up and carry it to
			 * whatever sits next on the page - outside the widget entirely. The watcher runs before the DOM
			 * is updated, so the leaving state is still there to be asked about, and the focus is handed
			 * over to the state coming in.
			 */
			if (this.isFocusInsideState())
			{
				this.pendingFocus = newValue === StackDropArea ? dropAreaInputSelector : stackButtonSelector;
			}
		},
		items: {
			handler() {
				if (this.items.length === 0 && this.popup)
				{
					this.popup.close();
				}
			},
			deep: true,
		},
		/**
		 * Every failed file carries the same text, so a new one is told apart by the count alone: it is
		 * an error of its own and has to be shown even if the previous one was closed. A count going
		 * down is a failed file leaving - nothing new went wrong, and the answer of the user still holds.
		 */
		errorsCount(newValue, oldValue): void
		{
			if (newValue > oldValue)
			{
				this.errorDismissed = false;
			}
		},
		/**
		 * The uploader has something of its own to say - a rejected selection, a transport that gave up.
		 * It is a new error whichever files are at hand, so it outweighs a message put away earlier.
		 */
		uploaderError(error): void
		{
			if (error !== null)
			{
				this.errorDismissed = false;
			}
		},
	},
	created()
	{
		this.popup = null;
		// selector of the element a focus is waiting for, until its state is on screen
		this.pendingFocus = null;

		this.adapter.subscribe('Uploader:onUploadStart', () => {
			this.items.forEach(item => {
				if (item.origin === FileOrigin.CLIENT && item.queued !== true)
				{
					item.queued = true;
					this.queueItems.push(item);
				}
			})
		});

		this.adapter.subscribe('Uploader:onUploadComplete', () => {
			this.queueItems = [];
		});

		this.adapter.subscribe('Item:onAdd', (event: BaseEvent) => {
			this.uploaderError = null;
			if (this.uploader.getStatus() === UploaderStatus.STARTED)
			{
				const item = event.getData().item;
				item.queued = true;
				this.queueItems.push(event.getData().item);
			}
		});

		this.adapter.subscribe('Item:onRemove', (event: BaseEvent) => {
			this.uploaderError = null;
			const item = event.getData().item;
			const position = this.queueItems.indexOf(item);
			if (position >= 0)
			{
				this.queueItems.splice(position, 1);
			}
		});

		this.adapter.subscribe('Item:onAdd', this.announceItemAdd);
		this.adapter.subscribe('Item:onRemove', this.announceItemRemove);
		this.adapter.subscribe('Item:onError', this.announceItemError);
		this.adapter.subscribe('Uploader:onError', this.announceUploaderError);
	},
	mounted()
	{
		this.uploader.assignBrowse(this.$refs['add-button']);
		this.isMounted = true;
	},
	beforeUnmount()
	{
		this.adapter.unsubscribe('Item:onAdd', this.announceItemAdd);
		this.adapter.unsubscribe('Item:onRemove', this.announceItemRemove);
		this.adapter.unsubscribe('Item:onError', this.announceItemError);
		this.adapter.unsubscribe('Uploader:onError', this.announceUploaderError);
	},
	methods: {
		announceItemAdd(event: BaseEvent): void
		{
			const { item } = event.getData();

			LiveAnnouncer.announce(
				Loc.getMessage('STACK_WIDGET_FILE_ADDED_ANNOUNCE', { '#FILENAME#': item.name }),
			);
		},
		announceItemRemove(event: BaseEvent): void
		{
			const { item } = event.getData();

			LiveAnnouncer.announce(
				Loc.getMessage('STACK_WIDGET_FILE_REMOVED_ANNOUNCE', { '#FILENAME#': item.name }),
			);
		},
		announceItemError(event: BaseEvent): void
		{
			const { item } = event.getData();

			LiveAnnouncer.announce(
				Loc.getMessage('STACK_WIDGET_FILE_ERROR_ANNOUNCE', { '#FILENAME#': item.name }),
				'assertive',
			);
		},
		announceUploaderError(): void
		{
			LiveAnnouncer.announce(Loc.getMessage('STACK_WIDGET_ERROR_ANNOUNCE'), 'assertive');
		},
		showPopup()
		{
			if (!this.popup)
			{
				const id = 'stack-uploader-' + Text.getRandom().toLowerCase();
				this.popup = new Popup({
					width: 750,
					height: 400,
					draggable: true,
					titleBar: Loc.getMessage('STACK_WIDGET_POPUP_TITLE'),
					// the visible title of a popup is not tied to its accessible name by main.popup
					ariaLabel: Loc.getMessage('STACK_WIDGET_POPUP_TITLE'),
					content: `<div id="${id}"></div>`,
					cacheable: false,
					closeIcon: true,
					closeByEsc: true,
					resizable: true,
					minWidth: 450,
					minHeight: 300,
					events: {
						onDestroy: () => {
							this.popup = null;
							this.popupContentId = null;
							void this.returnFocus();
						},
					},
					buttons: [
						new CloseButton({ onclick: () => this.popup.close() }),
					]
				});

				this.popupContentId = `#${id}`;

				// the visible title repeats the name of the dialog word for word, and a screen reader
				// reads both - the name when the dialog opens, the title as the content behind it
				Dom.attr(this.popup.getTitleContainer(), 'aria-hidden', true);
			}

			this.popup.show();

			/**
			 * The focus follows the dialog that has just been opened. `main.popup` moves it through its
			 * focus trap, and the trap is only built while the setting of the portal asks for one: with
			 * it off the focus would stay on the stack, outside the dialog - the next Tab would carry on
			 * along the page, past the list of files, and a screen reader would never be told the context
			 * has changed. The container of the popup carries `tabindex="-1"`, so it takes the focus and
			 * Tab goes on inside the dialog. Where the trap is on, the platform does this itself and is
			 * left alone: a second move would only fight it.
			 */
			if (this.popup.getFocusTrap() === null)
			{
				this.popup.getPopupContainer().focus();
			}
		},
		/**
		 * Where the focus goes when the popup is gone. Normally back to the stack - the button that
		 * opened it - and a focus that has already landed somewhere is left alone: the user closed the
		 * popup by clicking into another control, and the platform focus trap keeps it there too.
		 * An emptied set is the exception, and the field of the drop area takes the focus no matter
		 * where it sits by then: the popup closed on its own once the last file was removed, the button
		 * that removed it died with the popup, and the stack behind it is gone as well.
		 */
		async returnFocus(): Promise<void>
		{
			// the new state of the stack has to be rendered first, or the target is not in the DOM yet
			await this.$nextTick();

			if (this.items.length === 0)
			{
				// the drop area comes in behind the leave transition of the stack, so its field can still
				// be absent by now: then the focus waits for the state to be shown
				this.focusWhenShown(dropAreaInputSelector);

				return;
			}

			const active = document.activeElement;
			if (active !== null && active !== document.body)
			{
				return;
			}

			this.getStackButton()?.focus();
		},
		/** Focuses the target of the current state, or waits for that state to appear with it. */
		focusWhenShown(selector: string): void
		{
			const target = this.$refs.item?.querySelector(selector) ?? null;
			this.pendingFocus = target === null ? selector : null;
			target?.focus();
		},
		handleStateShown(): void
		{
			const selector = this.pendingFocus;
			if (selector === null)
			{
				return;
			}

			this.pendingFocus = null;
			this.$refs.item?.querySelector(selector)?.focus();
		},
		/** Whether the focus sits on the state being replaced - the part of the widget that changes. */
		isFocusInsideState(): boolean
		{
			const active = document.activeElement;

			return active !== null && this.$refs.item?.contains(active) === true;
		},
		getStackButton(): ?HTMLElement
		{
			return this.$refs.item?.querySelector(stackButtonSelector) ?? null;
		},
		abortUpload()
		{
			const items = Array.from(this.queueItems);
			this.queueItems = [];

			items.forEach(item => {
				this.uploader.removeFile(item.id);
			});
		},
		/**
		 * The popup of the error is gone. The focus is not touched here: the popup never took it, so
		 * there is nothing to give back. If the dialog is on the screen, the error is not closed but
		 * waiting behind it - it is kept and shown again once the dialog is gone. Otherwise the user
		 * has closed it, and a message dismissed by hand must not come back on its own: the answer of the
		 * user holds until something new goes wrong.
		 */
		handlePopupDestroy(error)
		{
			if (this.isPopupShown)
			{
				return;
			}

			// an error that has already been replaced by another one was taken down by that change, and
			// nobody dismissed it: only the error still at hand can be the one the user closed
			if (this.error === error)
			{
				this.errorDismissed = true;
			}

			if (this.uploaderError === error)
			{
				this.uploaderError = null;
			}
		}
	},
	// language=Vue
	template: `
		<div class="ui-uploader-stack-widget" :class="containerClasses" v-drop>
			<Teleport v-if="popupContentId !== null" :to="popupContentId">
				<!-- the dialog around the list is already named, and its own name would be read right
					after that one, twice about the same thing -->
				<TileList :items="items" :aria-label="null" />
			</Teleport>
			<div class="ui-uploader-stack-item" ref="item">
				<transition
					:leave-active-class="enableAnimation ? 'ui-uploader-stack-item-leave-active' : ''" 
					:leave-to-class="enableAnimation ? 'ui-uploader-stack-item-leave-to' : ''" 
					mode="out-in"
				>
					<keep-alive>
						<!-- the state reports itself: a focus waiting for the drop area is spent here -->
						<component
							:is="currentComponent"
							v-bind="currentComponentProps"
							@showPopup="showPopup"
							@abortUpload="abortUpload"
							@vue:mounted="handleStateShown"
							@vue:activated="handleStateShown"
						/>
					</keep-alive>
				</transition>
			</div>
			<!--
				The error is drawn in a popup that no screen reader is pointed at, so the same text lives
				here as well and describes the stack for as long as the error lasts.
			-->
			<span
				v-if="errorId !== null"
				:id="errorId"
				class="ui-uploader-stack-visually-hidden"
				data-testid="ui-uploader-stack-error-text"
			>{{ errorText }}</span>
			<!-- explicit tabindex: see StackDropArea (Safari Tab order) -->
			<button
				v-if="uploader.isMultiple()"
				type="button"
				class="ui-uploader-stack-add-btn"
				data-testid="ui-uploader-stack-add-btn"
				tabindex="0"
				:aria-label="addFileLabel"
				ref="add-button"
			></button>
		</div>
		<!--
			While the dialog is open the error is not drawn: its popup would be laid over the dialog
			and would say nothing the dialog does not already show - every failed file carries the
			error on its own tile there. The error is still announced, and it comes back on the screen
			once the dialog is closed.
		-->
		<ErrorPopup
			v-if="error !== null && !errorDismissed && isMounted && !isPopupShown"
			:error="error"
			:popup-options="errorPopupOptions"
			@onDestroy="handlePopupDestroy"
		/>
	`
};
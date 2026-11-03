/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, ui_uploader_vue, main_popup, ui_buttons, ui_a11y, ui_uploader_core, ui_uploader_tileWidget, main_core_events, ui_uploader_stackWidget) {
	'use strict';

	const StackWidgetSize = {
		LARGE: 'large',
		MEDIUM: 'medium',
		SMALL: 'small',
		TINY: 'tiny'
	};

	const progressSizes = {
		[StackWidgetSize.LARGE]: {
			width: 46,
			lineSize: 5
		},
		[StackWidgetSize.MEDIUM]: {
			width: 34,
			lineSize: 4
		},
		[StackWidgetSize.SMALL]: {
			width: 20,
			lineSize: 3
		},
		[StackWidgetSize.TINY]: {
			width: 14,
			lineSize: 2
		}
	};
	const StackUpload = {
		name: 'StackUpload',
		inject: ['widgetOptions'],
		components: {
			UploadLoader: ui_uploader_tileWidget.UploadLoader
		},
		props: {
			items: {
				type: Array,
				required: true
			},
			queueItems: {
				type: Array,
				required: true
			},
			isPopupShown: {
				type: Boolean,
				default: false
			},
			// id of the hidden error text of the widget, null while there is no error
			errorId: {
				type: String,
				default: null
			}
		},
		emits: ['showPopup', 'abortUpload'],
		data: () => ({
			sizeTextId: `ui-uploader-stack-upload-size-${main_core.Text.getRandom().toLowerCase()}`
		}),
		computed: {
			StackWidgetSize: () => StackWidgetSize,
			// the name of the stack must not change while the upload runs: a screen reader announces a new
			// name of the focused element, and the progress goes through aria-valuenow alone
			uploadFileTitle() {
				if (this.queueItems.length > 1) {
					return main_core.Loc.getMessage('STACK_WIDGET_FILES_UPLOADING');
				} else {
					return main_core.Loc.getMessage('STACK_WIDGET_FILE_UPLOADING');
				}
			},
			progress() {
				if (this.queueItems.length === 0) {
					return 0;
				}
				const progress = this.queueItems.reduce((total, item) => {
					return total + item.progress;
				}, 0);
				return Math.floor(progress / this.queueItems.length);
			},
			// the visual minimum of the arc: it must not reach aria-valuenow, or the screen reader would
			// announce 10 % at the very start of an upload that has not moved yet
			progressOptions() {
				const {
					width,
					lineSize
				} = progressSizes[this.widgetOptions.size];
				return {
					width,
					lineSize,
					progress: Math.max(this.progress, 10)
				};
			},
			uploadProgressLabel() {
				return main_core.Loc.getMessage('STACK_WIDGET_UPLOAD_PROGRESS_LABEL');
			},
			// the size is only drawn for a single file, and only where there is room for it
			showUploadSize() {
				return this.queueItems.length === 1 && this.widgetOptions.size === StackWidgetSize.LARGE;
			},
			/**
			 * Everything inside the indicator is presentational, the size of the file along with the
			 * percentage, so the size is tied back to the indicator as its description: a description is
			 * read off the element it points at whatever the tree does with that element, and it does not
			 * touch the name of the indicator the way a text of its own would. Both nodes live outside the
			 * button, so nothing on this path goes through a presentational subtree.
			 */
			uploadSizeId() {
				return this.showUploadSize ? this.sizeTextId : null;
			},
			abortUploadLabel() {
				return main_core.Loc.getMessage('STACK_WIDGET_ABORT_UPLOAD');
			}
		},
		// language=Vue
		template: `
		<!--
			The frame holds everything this state is made of side by side: the stack itself, the progress
			indicator over it and the button aborting the upload. Neither the abort nor the indicator can
			live inside the stack - a button inside a button is a nested interactive element, and a node
			under a button is presentational - and the frame repeats the box of the stack, so both keep
			the place they have always been drawn in.
		-->
		<div class="ui-uploader-stack-upload-frame">
			<!-- explicit tabindex: see StackDropArea (Safari Tab order) -->
			<button
				type="button"
				class="ui-uploader-stack-upload"
				data-testid="ui-uploader-stack-upload-btn"
				tabindex="0"
				:aria-label="uploadFileTitle"
				aria-haspopup="dialog"
				:aria-expanded="isPopupShown ? 'true' : 'false'"
				:aria-describedby="errorId"
				@click="$emit('showPopup')"
			>
				<div class="ui-uploader-stack-upload-box">
					<!-- the icon only repeats what the button already does, so it stays out of the tree -->
					<div
						class="ui-uploader-stack-upload-menu"
						aria-hidden="true"
						:title="$Bitrix.Loc.getMessage('STACK_WIDGET_OPEN_FILE_GALLERY')"
					></div>
				</div>
			</button>
			<!--
				The indicator lies over the button instead of inside it: a button makes its whole subtree
				presentational, and an indicator nested there reaches no screen reader at all, however
				complete its ARIA is. The layer lets the pointer through, so for a click the percentage is
				still a part of the stack.
			-->
			<div class="ui-uploader-stack-upload-layer">
				<div class="ui-uploader-stack-upload-content">
					<div class="ui-uploader-stack-upload-loader">
						<UploadLoader v-bind="progressOptions" aria-hidden="true"/>
					</div>
					<!--
						the progress is announced through aria-valuenow alone, so the arc is decorative and
						the visible percent inside the indicator is not a part of its name
					-->
					<div
						class="ui-uploader-stack-upload-progress"
						data-testid="ui-uploader-stack-upload-progress"
						role="progressbar"
						:aria-label="uploadProgressLabel"
						aria-valuemin="0"
						aria-valuemax="100"
						:aria-valuenow="progress"
						:aria-describedby="uploadSizeId"
					>
						<div
							v-if="widgetOptions.size === StackWidgetSize.LARGE"
							class="ui-uploader-stack-upload-title"
						>{{ uploadFileTitle }}</div>
						<div class="ui-uploader-stack-upload-percent">{{ progress }}%</div>
						<div v-if="showUploadSize" class="ui-uploader-stack-upload-stats">
							<span :id="sizeTextId" class="ui-uploader-stack-upload-total">{{
								queueItems.length ? queueItems[0].sizeFormatted : ''
							}}</span>
						</div>
					</div>
				</div>
			</div>
			<button
				type="button"
				class="ui-uploader-stack-upload-abort"
				data-testid="ui-uploader-stack-upload-abort-btn"
				tabindex="0"
				:aria-label="abortUploadLabel"
				:title="abortUploadLabel"
				@click="$emit('abortUpload')"
			></button>
		</div>
	`
	};

	const StackLoad = {
		name: 'StackLoad',
		props: {
			isPopupShown: {
				type: Boolean,
				default: false
			},
			// id of the hidden error text of the widget, null while there is no error
			errorId: {
				type: String,
				default: null
			}
		},
		emits: ['showPopup'],
		computed: {
			stackLabel() {
				return main_core.Loc.getMessage('STACK_WIDGET_STACK_LABEL_LOADING');
			}
		},
		// language=Vue
		template: `
		<!-- explicit tabindex: see StackDropArea (Safari Tab order) -->
		<button
			type="button"
			class="ui-uploader-stack-load"
			data-testid="ui-uploader-stack-load-btn"
			tabindex="0"
			:aria-label="stackLabel"
			aria-haspopup="dialog"
			:aria-expanded="isPopupShown ? 'true' : 'false'"
			:aria-describedby="errorId"
			@click="$emit('showPopup')"
		>
			<div class="ui-uploader-stack-load-icon" aria-hidden="true"></div>
		</button>
	`
	};

	const fileIconSizes = {
		[StackWidgetSize.LARGE]: 36,
		[StackWidgetSize.MEDIUM]: 27,
		[StackWidgetSize.SMALL]: 19,
		[StackWidgetSize.TINY]: 15
	};
	const StackPreview = {
		name: 'StackPreview',
		inject: ['widgetOptions'],
		components: {
			FileIcon: ui_uploader_tileWidget.FileIcon
		},
		props: {
			items: {
				type: Array,
				required: true
			},
			isPopupShown: {
				type: Boolean,
				default: false
			},
			// id of the hidden error text of the widget, null while there is no error
			errorId: {
				type: String,
				default: null
			}
		},
		emits: ['showPopup'],
		computed: {
			FileStatus: () => ui_uploader_core.FileStatus,
			Sizes: () => StackWidgetSize,
			item() {
				const item = this.items.find(item => {
					return item.status !== ui_uploader_core.FileStatus.LOAD_FAILED && item.status !== ui_uploader_core.FileStatus.UPLOAD_FAILED;
				});

				// nothing whole is left: the stack shows itself through its first file, broken as it is
				return item ?? this.items[0] ?? {};
			},
			// the name of the stack does not depend on the size: the file name is visible in LARGE and
			// MEDIUM only, and the counter is drawn over the preview in the small sizes
			stackLabel() {
				if (this.items.length > 1) {
					return main_core.Loc.getMessage('STACK_WIDGET_STACK_LABEL_MANY', {
						'#COUNT#': this.items.length
					});
				}
				return main_core.Loc.getMessage('STACK_WIDGET_STACK_LABEL_ONE', {
					'#FILENAME#': this.item.name
				});
			},
			fileIconSize() {
				return fileIconSizes[this.widgetOptions.size];
			},
			errorsCount() {
				return this.items.reduce((errors, item) => {
					if (item.status === ui_uploader_core.FileStatus.LOAD_FAILED || item.status === ui_uploader_core.FileStatus.UPLOAD_FAILED) {
						return errors + 1;
					} else {
						return errors;
					}
				}, 0);
			}
		},
		// language=Vue
		template: `
		<!-- explicit tabindex: see StackDropArea (Safari Tab order) -->
		<button
			type="button"
			class="ui-uploader-stack-preview"
			data-testid="ui-uploader-stack-preview-btn"
			tabindex="0"
			:class="{'--image': item.isImage}"
			:aria-label="stackLabel"
			aria-haspopup="dialog"
			:aria-expanded="isPopupShown ? 'true' : 'false'"
			:aria-describedby="errorId"
			@click="$emit('showPopup')"
		>
			<div class="ui-uploader-stack-preview-box">
				<template v-if="item.failed">
					<div class="ui-uploader-stack-preview-error"></div>
				</template>
				<template v-else-if="item.previewUrl">
					<div
						class="ui-uploader-stack-preview-image"
						:class="{ '--default': item.previewUrl === null }"
						:style="{ backgroundImage: item.previewUrl !== null ? 'url(' + item.previewUrl + ')' : '' }">
					</div>
					<div v-if="items.length > 1" class="ui-uploader-stack-preview-stats">
						<span class="ui-uploader-stack-preview-total">{{ items.length }}</span>
					</div>
				</template>
				<template v-else>
					<template v-if="item.name && item.status !== FileStatus.LOADING">
						<div class="ui-uploader-stack-preview-file-icon">
							<FileIcon :name="item.extension" :size="fileIconSize" aria-hidden="true"/>
						</div>
						<div
							v-if="[Sizes.LARGE, Sizes.MEDIUM].includes(widgetOptions.size)"
							:title="item.name"
							class="ui-uploader-stack-preview-file-name"
						>{{
							items.length > 1
							? this.$Bitrix.Loc.getMessage('STACK_WIDGET_FILE_COUNT', { '#count#': items.length })
							: item.name
						}}</div>
						<div 
							v-if="items.length > 1 && [Sizes.SMALL, Sizes.TINY].includes(widgetOptions.size)"
							class="ui-uploader-stack-preview-stats">
							<span class="ui-uploader-stack-preview-total">{{ items.length }}</span>
						</div>
					</template>
					<template v-else>
						<div class="ui-uploader-stack-preview-file-default"></div>
					</template>
				</template>
			</div>
			<!-- the icon only repeats what the button already does, so it stays out of the tree -->
			<div
				class="ui-uploader-stack-upload-menu"
				aria-hidden="true"
				:title="$Bitrix.Loc.getMessage('STACK_WIDGET_OPEN_FILE_GALLERY')"
			></div>
		</button>
	`
	};

	const StackDropArea = {
		name: 'StackDropArea',
		inject: ['uploader', 'widgetOptions'],
		props: {
			// id of the hidden copy of the error text kept by the root, while there is an error
			errorId: {
				type: String,
				default: null
			}
		},
		setup() {
			return {
				inputId: `ui-uploader-stack-drop-input-${main_core.Text.getRandom().toLowerCase()}`,
				keyboardHintId: `ui-uploader-stack-drop-hint-${main_core.Text.getRandom().toLowerCase()}`
			};
		},
		data() {
			return {
				isHovering: false
			};
		},
		computed: {
			StackWidgetSize: () => ui_uploader_stackWidget.StackWidgetSize,
			uploadFileTitle() {
				if (this.uploader.shouldAcceptOnlyImages()) {
					if (this.uploader.isMultiple()) {
						return main_core.Loc.getMessage('STACK_WIDGET_UPLOAD_IMAGES');
					} else {
						return main_core.Loc.getMessage('STACK_WIDGET_UPLOAD_IMAGE');
					}
				} else {
					if (this.uploader.isMultiple()) {
						return main_core.Loc.getMessage('STACK_WIDGET_UPLOAD_FILES');
					} else {
						return main_core.Loc.getMessage('STACK_WIDGET_UPLOAD_FILE');
					}
				}
			},
			// the title is visible in LARGE and MEDIUM only, but the name of the field must not depend
			// on the size, so in the other sizes the label stays in the DOM and is only hidden visually
			labelClass() {
				return [ui_uploader_stackWidget.StackWidgetSize.LARGE, ui_uploader_stackWidget.StackWidgetSize.MEDIUM].includes(this.widgetOptions.size) ? 'ui-uploader-stack-drop-area-title' : 'ui-uploader-stack-visually-hidden';
			},
			dragFileHint() {
				if (this.uploader.isMultiple()) {
					return main_core.Loc.getMessage('STACK_WIDGET_DRAG_FILES_HINT');
				} else {
					return main_core.Loc.getMessage('STACK_WIDGET_DRAG_FILE_HINT');
				}
			},
			keyboardHint() {
				return main_core.Loc.getMessage('STACK_WIDGET_DROP_KEYBOARD_HINT');
			},
			/**
			 * The field is described by everything the widget has to say about it at once: what has just
			 * gone wrong comes first as the answer to the last thing the user did, and the hint on how to
			 * pick a file follows it. Whichever of the two is missing leaves its id out - a reference to
			 * an element that is not rendered is a defect of its own.
			 */
			describedBy() {
				const ids = [this.errorId, this.keyboardHint ? this.keyboardHintId : null];
				const rendered = ids.filter(main_core.Type.isStringFilled);
				return rendered.length > 0 ? rendered.join(' ') : null;
			}
		},
		mounted() {
			this.uploader.assignDropzone(this.$refs.container);
			// a real input given to assignBrowse works natively: Tab stop, Enter and Space open the
			// system dialog, multiple and accept are set by the uploader itself
			this.uploader.assignBrowse(this.$refs.fileInput);
		},
		methods: {
			/**
			 * The uploader announces a browse of its own only for a node it opens the dialog from itself;
			 * for an input it has nothing to announce - the input opens the dialog on its own. The zone is
			 * that input now, so the event belongs to it: it is emitted with the same data the uploader
			 * sends, and a subscriber that answers with `preventDefault()` keeps the dialog closed.
			 */
			handleBrowse(event) {
				const browseEvent = new main_core_events.BaseEvent({
					data: {
						input: this.$refs.fileInput,
						node: this.$refs.container
					}
				});
				this.uploader.emit(ui_uploader_core.UploaderEvent.BEFORE_BROWSE, browseEvent);
				if (browseEvent.isDefaultPrevented()) {
					event.preventDefault();
				}
			}
		},
		// language=Vue
		template: `
		<div
			class="ui-uploader-stack-drop-area"
			data-testid="ui-uploader-stack-drop-area"
			ref="container"
			:class="{ '--hover': isHovering }"
			@mouseenter="isHovering = true"
			@mouseleave="isHovering = false"
			@dragleave="isHovering = false"
		>
			<!--
				tabindex is explicit on purpose: Safari with "Press Tab to highlight each item on a
				webpage" off walks only the elements that carry a tabindex, so without it the field
				drops out of the Tab order and the file cannot be picked from the keyboard. Value 0
				keeps the document order.
			-->
			<input
				type="file"
				class="ui-uploader-stack-drop-input"
				data-testid="ui-uploader-stack-drop-input"
				tabindex="0"
				:id="inputId"
				:aria-describedby="describedBy"
				ref="fileInput"
				@click="handleBrowse"
			/>
			<div class="ui-uploader-stack-drop-area-content">
				<div class="ui-uploader-stack-drop-area-icon"></div>
				<label
					:for="inputId"
					:class="labelClass"
					data-testid="ui-uploader-stack-drop-label"
				>{{ uploadFileTitle }}</label>
				<div
					v-if="widgetOptions.size === StackWidgetSize.LARGE"
					class="ui-uploader-stack-drop-area-hint"
				>{{ dragFileHint }}</div>
				<!--
					the hint is a description, not a part of the accessible name: the label stays the
					only name of the field. A locale without the phrase renders no span, so
					aria-describedby must not point at it either.
				-->
				<span
					v-if="keyboardHint"
					class="ui-uploader-stack-visually-hidden"
					:id="keyboardHintId"
				>{{ keyboardHint }}</span>
			</div>
		</div>
	`
	};

	const isItemLoading = item => item.status === ui_uploader_core.FileStatus.LOADING;
	const stackButtonSelector = '.ui-uploader-stack-preview, .ui-uploader-stack-upload, .ui-uploader-stack-load';
	const dropAreaInputSelector = '.ui-uploader-stack-drop-input';

	/**
	 * @memberof BX.UI.Uploader
	 */
	const StackWidgetComponent = {
		name: 'StackWidget',
		extends: ui_uploader_vue.VueUploaderComponent,
		components: {
			TileList: ui_uploader_tileWidget.TileList,
			ErrorPopup: ui_uploader_tileWidget.ErrorPopup,
			StackUpload,
			StackLoad,
			StackPreview,
			StackDropArea
		},
		mixins: [ui_uploader_tileWidget.DragOverMixin],
		data: () => ({
			popupContentId: null,
			queueItems: [],
			enableAnimation: true,
			dragMode: false,
			isMounted: false,
			errorTextId: `ui-uploader-stack-error-${main_core.Text.getRandom().toLowerCase()}`,
			// the user has closed the message and it must not come back on its own; the answer holds until
			// something new goes wrong. Which error it was is deliberately not kept: `error` falls back from
			// the uploader to the files, and an answer remembered by value is lost on that fallback
			errorDismissed: false
		}),
		computed: {
			containerClasses() {
				return [{
					'--multiple': this.uploader.isMultiple(),
					'--only-images': this.uploader.shouldAcceptOnlyImages(),
					'--many-items': this.items.length > 1
				}, `--${this.widgetOptions.size}`];
			},
			currentComponent() {
				if (this.items.length === 0 || this.dragOver) {
					if (this.dragOver) {
						this.dragMode = true;
					}
					return StackDropArea;
				}
				if (this.queueItems.length > 0) {
					return StackUpload;
				}
				if (this.items.some(isItemLoading)) {
					return StackLoad;
				}
				return StackPreview;
			},
			currentComponentProps() {
				if (this.currentComponent === StackDropArea) {
					return {
						errorId: this.errorId
					};
				} else if (this.currentComponent === StackLoad) {
					return {
						isPopupShown: this.isPopupShown,
						errorId: this.errorId
					};
				} else if (this.currentComponent === StackUpload) {
					return {
						items: this.items,
						queueItems: this.queueItems,
						isPopupShown: this.isPopupShown,
						errorId: this.errorId
					};
				} else if (this.currentComponent === StackPreview) {
					return {
						items: this.items,
						isPopupShown: this.isPopupShown,
						errorId: this.errorId
					};
				}
			},
			/**
			 * The popup belongs to the root, so the state of the button opening it is resolved here. The
			 * content id is the reactive trace of that popup: it appears with the popup and is dropped when
			 * the popup is destroyed, and a non-cacheable popup is destroyed on every close.
			 */
			isPopupShown() {
				return this.popupContentId !== null;
			},
			addFileLabel() {
				return main_core.Loc.getMessage('STACK_WIDGET_ADD_FILE_LABEL');
			},
			error() {
				if (this.uploaderError) {
					return this.uploaderError;
				} else if (this.errorsCount > 0) {
					return main_core.Loc.getMessage('STACK_WIDGET_FILE_UPLOAD_ERROR');
				}
				return null;
			},
			/**
			 * The text of the error for a screen reader: the error itself is only drawn in a popup, and the
			 * stack keeps a hidden copy of that text to describe itself while the error lasts.
			 */
			errorText() {
				const error = this.error;
				if (main_core.Type.isStringFilled(error)) {
					return error;
				}
				if (main_core.Type.isObject(error)) {
					return [error.message, error.description].filter(main_core.Type.isStringFilled).join(' ');
				}
				return null;
			},
			// the description is tied to the stack only while there is an error: an aria-describedby
			// pointing at nothing is a defect of its own
			errorId() {
				return main_core.Type.isStringFilled(this.errorText) ? this.errorTextId : null;
			},
			errorsCount() {
				return this.items.reduce((errors, item) => {
					if (item.status === ui_uploader_core.FileStatus.LOAD_FAILED || item.status === ui_uploader_core.FileStatus.UPLOAD_FAILED) {
						return errors + 1;
					} else {
						return errors;
					}
				}, 0);
			},
			errorPopupOptions() {
				return {
					bindElement: this.$refs.item,
					bindOptions: {
						position: 'top'
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
					ariaLabel: main_core.Loc.getMessage('STACK_WIDGET_FILE_UPLOAD_ERROR'),
					/**
					 * The error appears on its own, and a message nobody asked for must not take the
					 * focus away from wherever the user is. There is nothing focusable inside this popup
					 * either, so a trap would hold the focus on its container and Tab would stop working
					 * at all. The error reaches a screen reader without the focus: it is announced
					 * assertively and describes the stack through aria-describedby.
					 */
					focusTrap: false
				};
			}
		},
		watch: {
			currentComponent(newValue, oldValue) {
				if (this.dragOver) {
					this.enableAnimation = false;
				} else if (oldValue === StackDropArea && this.dragMode) {
					this.enableAnimation = false;
				} else if (oldValue === StackPreview) {
					this.enableAnimation = false;
				} else {
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
				if (this.isFocusInsideState()) {
					this.pendingFocus = newValue === StackDropArea ? dropAreaInputSelector : stackButtonSelector;
				}
			},
			items: {
				handler() {
					if (this.items.length === 0 && this.popup) {
						this.popup.close();
					}
				},
				deep: true
			},
			/**
			 * Every failed file carries the same text, so a new one is told apart by the count alone: it is
			 * an error of its own and has to be shown even if the previous one was closed. A count going
			 * down is a failed file leaving - nothing new went wrong, and the answer of the user still holds.
			 */
			errorsCount(newValue, oldValue) {
				if (newValue > oldValue) {
					this.errorDismissed = false;
				}
			},
			/**
			 * The uploader has something of its own to say - a rejected selection, a transport that gave up.
			 * It is a new error whichever files are at hand, so it outweighs a message put away earlier.
			 */
			uploaderError(error) {
				if (error !== null) {
					this.errorDismissed = false;
				}
			}
		},
		created() {
			this.popup = null;
			// selector of the element a focus is waiting for, until its state is on screen
			this.pendingFocus = null;
			this.adapter.subscribe('Uploader:onUploadStart', () => {
				this.items.forEach(item => {
					if (item.origin === ui_uploader_core.FileOrigin.CLIENT && item.queued !== true) {
						item.queued = true;
						this.queueItems.push(item);
					}
				});
			});
			this.adapter.subscribe('Uploader:onUploadComplete', () => {
				this.queueItems = [];
			});
			this.adapter.subscribe('Item:onAdd', event => {
				this.uploaderError = null;
				if (this.uploader.getStatus() === ui_uploader_core.UploaderStatus.STARTED) {
					const item = event.getData().item;
					item.queued = true;
					this.queueItems.push(event.getData().item);
				}
			});
			this.adapter.subscribe('Item:onRemove', event => {
				this.uploaderError = null;
				const item = event.getData().item;
				const position = this.queueItems.indexOf(item);
				if (position >= 0) {
					this.queueItems.splice(position, 1);
				}
			});
			this.adapter.subscribe('Item:onAdd', this.announceItemAdd);
			this.adapter.subscribe('Item:onRemove', this.announceItemRemove);
			this.adapter.subscribe('Item:onError', this.announceItemError);
			this.adapter.subscribe('Uploader:onError', this.announceUploaderError);
		},
		mounted() {
			this.uploader.assignBrowse(this.$refs['add-button']);
			this.isMounted = true;
		},
		beforeUnmount() {
			this.adapter.unsubscribe('Item:onAdd', this.announceItemAdd);
			this.adapter.unsubscribe('Item:onRemove', this.announceItemRemove);
			this.adapter.unsubscribe('Item:onError', this.announceItemError);
			this.adapter.unsubscribe('Uploader:onError', this.announceUploaderError);
		},
		methods: {
			announceItemAdd(event) {
				const {
					item
				} = event.getData();
				ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('STACK_WIDGET_FILE_ADDED_ANNOUNCE', {
					'#FILENAME#': item.name
				}));
			},
			announceItemRemove(event) {
				const {
					item
				} = event.getData();
				ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('STACK_WIDGET_FILE_REMOVED_ANNOUNCE', {
					'#FILENAME#': item.name
				}));
			},
			announceItemError(event) {
				const {
					item
				} = event.getData();
				ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('STACK_WIDGET_FILE_ERROR_ANNOUNCE', {
					'#FILENAME#': item.name
				}), 'assertive');
			},
			announceUploaderError() {
				ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('STACK_WIDGET_ERROR_ANNOUNCE'), 'assertive');
			},
			showPopup() {
				if (!this.popup) {
					const id = 'stack-uploader-' + main_core.Text.getRandom().toLowerCase();
					this.popup = new main_popup.Popup({
						width: 750,
						height: 400,
						draggable: true,
						titleBar: main_core.Loc.getMessage('STACK_WIDGET_POPUP_TITLE'),
						// the visible title of a popup is not tied to its accessible name by main.popup
						ariaLabel: main_core.Loc.getMessage('STACK_WIDGET_POPUP_TITLE'),
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
							}
						},
						buttons: [new ui_buttons.CloseButton({
							onclick: () => this.popup.close()
						})]
					});
					this.popupContentId = `#${id}`;

					// the visible title repeats the name of the dialog word for word, and a screen reader
					// reads both - the name when the dialog opens, the title as the content behind it
					main_core.Dom.attr(this.popup.getTitleContainer(), 'aria-hidden', true);
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
				if (this.popup.getFocusTrap() === null) {
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
			async returnFocus() {
				// the new state of the stack has to be rendered first, or the target is not in the DOM yet
				await this.$nextTick();
				if (this.items.length === 0) {
					// the drop area comes in behind the leave transition of the stack, so its field can still
					// be absent by now: then the focus waits for the state to be shown
					this.focusWhenShown(dropAreaInputSelector);
					return;
				}
				const active = document.activeElement;
				if (active !== null && active !== document.body) {
					return;
				}
				this.getStackButton()?.focus();
			},
			/** Focuses the target of the current state, or waits for that state to appear with it. */
			focusWhenShown(selector) {
				const target = this.$refs.item?.querySelector(selector) ?? null;
				this.pendingFocus = target === null ? selector : null;
				target?.focus();
			},
			handleStateShown() {
				const selector = this.pendingFocus;
				if (selector === null) {
					return;
				}
				this.pendingFocus = null;
				this.$refs.item?.querySelector(selector)?.focus();
			},
			/** Whether the focus sits on the state being replaced - the part of the widget that changes. */
			isFocusInsideState() {
				const active = document.activeElement;
				return active !== null && this.$refs.item?.contains(active) === true;
			},
			getStackButton() {
				return this.$refs.item?.querySelector(stackButtonSelector) ?? null;
			},
			abortUpload() {
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
			handlePopupDestroy(error) {
				if (this.isPopupShown) {
					return;
				}

				// an error that has already been replaced by another one was taken down by that change, and
				// nobody dismissed it: only the error still at hand can be the one the user closed
				if (this.error === error) {
					this.errorDismissed = true;
				}
				if (this.uploaderError === error) {
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

	/**
	 * @memberof BX.UI.Uploader
	 */
	class StackWidget extends ui_uploader_vue.VueUploaderWidget {
		constructor(uploaderOptions, stackWidgetOptions) {
			const widgetOptions = main_core.Type.isPlainObject(stackWidgetOptions) ? Object.assign({}, stackWidgetOptions) : {};
			super(uploaderOptions, widgetOptions);
		}
		defineComponent() {
			return StackWidgetComponent;
		}
	}

	exports.StackWidget = StackWidget;
	exports.StackWidgetComponent = StackWidgetComponent;
	exports.StackWidgetSize = StackWidgetSize;

})(this.BX.UI.Uploader = this.BX.UI.Uploader || {}, BX, BX.UI.Uploader, BX.Main, BX.UI, BX.UI.Accessibility, BX.UI.Uploader, BX.UI.Uploader, BX.Event, BX.UI.Uploader);
//# sourceMappingURL=ui.uploader.stack-widget.bundle.js.map

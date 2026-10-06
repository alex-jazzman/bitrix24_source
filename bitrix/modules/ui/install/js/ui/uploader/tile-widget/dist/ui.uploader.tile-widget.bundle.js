/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, ui_uploader_vue, ui_a11y, ui_uploader_tileWidget, ui_uploader_core, main_popup, ui_iconSet_api_vue, ui_iconSet_api_core, ui_iconSet_actions, ui_iconSet_outline, ui_icons_generator, ui_progressround) {
	'use strict';

	/**
	 * @memberof BX.UI.Uploader
	 */
	const DragOverMixin = {
		directives: {
			drop: {
				beforeMount(el, binding, vnode) {
					if (binding.value === false) {
						return;
					}
					function addClass() {
						binding.instance.dragOver = true;
						el.classList.add('--drag-over');
					}
					function removeClass() {
						binding.instance.dragOver = false;
						el.classList.remove('--drag-over');
					}
					let lastEnterTarget = null;
					main_core.Event.bind(el, 'dragenter', event => {
						ui_uploader_core.hasDataTransferOnlyFiles(event.dataTransfer, false).then(success => {
							if (success) {
								event.preventDefault();
								event.stopPropagation();
								lastEnterTarget = event.target;
								addClass();
							}
						}).catch(() => {
							// no-op
						});
					});
					main_core.Event.bind(el, 'dragleave', event => {
						event.preventDefault();
						event.stopPropagation();
						if (lastEnterTarget === event.target) {
							removeClass();
						}
					});
					main_core.Event.bind(el, 'drop', event => {
						removeClass();
					});
				},
				unmounted(el, binding, vnode) {
					if (binding.value === false) {
						return;
					}
					binding.instance.dragOver = false;
					main_core.Event.unbindAll(el, 'dragenter');
					main_core.Event.unbindAll(el, 'dragleave');
					main_core.Event.unbindAll(el, 'drop');
				}
			}
		},
		data() {
			return {
				dragOver: false
			};
		}
	};

	const SettingsButton = {
		inject: ['widgetOptions', 'emitter'],
		data: () => ({
			selected: false
		}),
		computed: {
			buttonLabel() {
				return main_core.Loc.getMessage('TILE_UPLOADER_SETTINGS_LABEL');
			}
		},
		methods: {
			handleSettingsClick() {
				this.emitter.emit('SettingsButton:onClick', {
					container: this.$refs['container'],
					button: this
				});
			},
			getContainer() {
				return this.$refs['container'];
			},
			select() {
				this.selected = true;
			},
			deselect() {
				this.selected = false;
			}
		},
		// language=Vue
		template: `
		<button
			type="button"
			class="ui-tile-uploader-settings"
			data-testid="ui-tile-uploader-settings-btn"
			:class="{ '--selected': selected }"
			:aria-label="buttonLabel"
			aria-haspopup="menu"
			:aria-expanded="selected ? 'true' : 'false'"
			@click="handleSettingsClick"
			ref="container"
		></button>
	`
	};

	const DropArea = {
		inject: ['uploader', 'widgetOptions', 'emitter'],
		components: {
			SettingsButton
		},
		setup() {
			return {
				inputId: `ui-tile-uploader-drop-input-${main_core.Text.getRandom().toLowerCase()}`,
				keyboardHintId: `ui-tile-uploader-drop-hint-${main_core.Text.getRandom().toLowerCase()}`
			};
		},
		mounted() {
			// a real input given to assignBrowse works natively: Tab stop, Enter and Space
			// open the system dialog (the button pattern), multiple and accept are set by
			// the uploader itself
			this.uploader.assignBrowse(this.$refs.fileInput);
		},
		computed: {
			dropLabel() {
				return main_core.Loc.getMessage('TILE_UPLOADER_DROP_FILES_HERE');
			},
			keyboardHint() {
				return main_core.Loc.getMessage('TILE_UPLOADER_DROP_KEYBOARD_HINT');
			}
		},
		methods: {
			handleSettingsClick() {
				this.emitter.emit('onSettingsButtonClick', {
					button: this.$refs['ui-tile-uploader-settings']
				});
			}
		},
		// language=Vue
		template: `
		<div class="ui-tile-uploader-drop-area">
			<div class="ui-tile-uploader-drop-box">
				<!--
					tabindex is explicit on purpose: Safari with "Press Tab to highlight each item
					on a webpage" off walks only the elements that carry a tabindex, so without it
					the field drops out of the Tab order and the file cannot be picked from the
					keyboard. Value 0 keeps the document order.
				-->
				<input
					type="file"
					class="ui-tile-uploader-drop-input"
					data-testid="ui-tile-uploader-drop-input"
					tabindex="0"
					:id="inputId"
					:aria-describedby="keyboardHint ? keyboardHintId : null"
					ref="fileInput"
				/>
				<label class="ui-tile-uploader-drop-label" :for="inputId">{{dropLabel}}</label>
				<!--
					the hint is a description, not a part of the accessible name: the label stays the
					only name of the input. A locale without the phrase renders no span, so
					aria-describedby must not point at it either.
				-->
				<span
					v-if="keyboardHint"
					class="ui-tile-uploader-visually-hidden"
					:id="keyboardHintId"
				>{{keyboardHint}}</span>
				<SettingsButton v-if="widgetOptions.showSettingsButton" />
			</div>
		</div>
	`
	};

	/**
	 * @memberof BX.UI.Uploader
	 */
	const ErrorPopup = {
		props: {
			error: {
				type: [Object, String]
			},
			alignArrow: {
				type: Boolean,
				default: true
			},
			popupOptions: {
				type: Object,
				default() {
					return {};
				}
			}
		},
		emits: ['onDestroy'],
		watch: {
			error(newValue) {
				if (this.errorPopup) {
					this.errorPopup.destroy();
				}
				this.errorPopup = this.createPopup(newValue);
				this.errorPopup.show();
			}
		},
		created() {
			this.errorPopup = null;
		},
		mounted() {
			if (this.error) {
				this.errorPopup = this.createPopup(this.error);
				this.errorPopup.show();
			}
		},
		beforeUnmount() {
			if (this.errorPopup) {
				this.errorPopup.destroy();
				this.errorPopup = null;
			}
		},
		methods: {
			createContent(error) {
				if (main_core.Type.isStringFilled(error)) {
					return error;
				} else if (main_core.Type.isObject(error)) {
					return error.message + '<br>' + error.description;
				}
				return '';
			},
			createPopup(error) {
				const content = this.createContent(error);
				let defaultOptions;
				if (this.alignArrow && main_core.Type.isElementNode(this.popupOptions.bindElement)) {
					const targetNode = this.popupOptions.bindElement;
					const targetNodeWidth = targetNode.offsetWidth;
					defaultOptions = {
						cacheable: false,
						animation: 'fading-slide',
						content,
						// minWidth: 300,
						events: {
							onDestroy: () => {
								this.$emit('onDestroy', error);
								this.errorPopup = null;
							},
							onShow: function (event) {
								const popup = event.getTarget();
								popup.getPopupContainer().style.display = 'block';
								const popupWidth = popup.getPopupContainer().offsetWidth;
								const offsetLeft = targetNodeWidth / 2 - popupWidth / 2;
								const angleShift = main_popup.Popup.getOption('angleLeftOffset') - main_popup.Popup.getOption('angleMinTop');
								popup.setAngle({
									offset: popupWidth / 2 - angleShift
								});
								popup.setOffset({
									offsetLeft: offsetLeft + main_popup.Popup.getOption('angleLeftOffset')
								});
							}
						}
					};
				} else {
					defaultOptions = {
						cacheable: false,
						animation: 'fading-slide',
						content,
						events: {
							onDestroy: () => {
								this.$emit('onDestroy', error);
								this.errorPopup = null;
							}
						}
					};
				}
				const options = Object.assign({}, defaultOptions, this.popupOptions);
				return new main_popup.Popup(options);
			}
		},
		template: '<span></span>'
	};

	/**
	 * @memberof BX.UI.Uploader
	 */
	const FileIconComponent = {
		props: {
			name: {
				type: String
			},
			type: {
				type: String
			},
			color: {
				type: String
			},
			size: {
				type: Number,
				default: 36
			},
			align: {
				type: String,
				default: 'center'
			}
		},
		mounted() {
			this.render();
		},
		updated() {
			this.render();
		},
		methods: {
			render() {
				this.$el.innerHTML = '';
				const icon = new ui_icons_generator.FileIcon({
					name: this.name,
					fileType: this.type,
					color: this.color,
					size: this.size,
					align: this.align
				});
				icon.renderTo(this.$el);
			}
		},
		template: '<span></span>'
	};

	// @vue/component
	const InsertIntoTextButton = {
		name: 'InsertIntoTextButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		inject: {
			emitter: {},
			// the tile owns the hidden status and tells whether it was rendered at all
			tileInsertedStatus: {
				default: null
			}
		},
		props: {
			item: {
				type: Object,
				default: () => {}
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_core.Outline
			};
		},
		computed: {
			isInserted() {
				return this.item.customData?.tileSelected === true;
			},
			buttonLabel() {
				return main_core.Loc.getMessage('TILE_UPLOADER_INSERT_INTO_THE_TEXT');
			},
			insertedStatusId() {
				return this.tileInsertedStatus?.getId() ?? null;
			}
		},
		methods: {
			handleClick() {
				this.emitter.emit('onInsertIntoText', {
					item: this.item
				});
				ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('TILE_UPLOADER_FILE_INSERTED_STATUS'));
			},
			handleMouseEnter(event) {
				if (this.hintPopup) {
					return;
				}
				const targetNode = event.currentTarget;
				const targetNodeWidth = targetNode.offsetWidth;
				this.hintPopup = new main_popup.Popup({
					content: this.buttonLabel,
					cacheable: false,
					closeByEsc: true,
					animation: 'fading-slide',
					bindElement: targetNode,
					targetContainer: document.body,
					offsetTop: 0,
					bindOptions: {
						position: 'top',
						forceBindPosition: true
					},
					darkMode: true,
					events: {
						onClose: () => {
							this.hintPopup.destroy();
							this.hintPopup = null;
						},
						onShow: baseEvent => {
							const popup = baseEvent.getTarget();
							const popupWidth = popup.getPopupContainer().offsetWidth;
							const offsetLeft = targetNodeWidth / 2 - popupWidth / 2;
							const angleShift = main_popup.Popup.getOption('angleLeftOffset') - main_popup.Popup.getOption('angleMinTop');
							popup.setAngle({
								offset: popupWidth / 2 - angleShift
							});
							popup.setOffset({
								offsetLeft: offsetLeft + main_popup.Popup.getOption('angleLeftOffset')
							});
						}
					}
				});
				this.hintPopup.show();
			},
			handleMouseLeave() {
				if (this.hintPopup) {
					this.hintPopup.close();
					this.hintPopup = null;
				}
			}
		},
		template: `
		<button
			type="button"
			class="ui-tile-uploader-insert-into-text-button"
			data-testid="ui-tile-uploader-item-insert-btn"
			:class="{ '--inserted': isInserted }"
			:aria-label="buttonLabel"
			:aria-describedby="insertedStatusId"
			@click="handleClick"
			@mouseenter="handleMouseEnter"
			@mouseleave="handleMouseLeave"
		>
			<BIcon :name="Outline.PROMPT_VAR" aria-hidden="true"/>
		</button>
	`
	};

	/**
	 * @memberof BX.UI.Uploader
	 */
	const UploadLoader = {
		props: {
			progress: {
				type: Number,
				default: 0
			},
			width: {
				type: Number,
				default: 45
			},
			lineSize: {
				type: Number,
				default: 3
			},
			colorTrack: {
				type: String,
				default: '#eeeff0'
			},
			colorBar: {
				type: String,
				default: '#2fc6f6'
			},
			rotation: {
				type: Boolean,
				default: true
			}
		},
		mounted() {
			this.createProgressbar();
		},
		watch: {
			progress() {
				this.updateProgressbar();
			}
		},
		methods: {
			createProgressbar() {
				this.loader = new ui_progressround.ProgressRound({
					width: this.width,
					lineSize: this.lineSize,
					colorBar: this.colorBar,
					colorTrack: this.colorTrack,
					rotation: this.rotation,
					value: this.progress,
					color: ui_progressround.ProgressRound.Color.SUCCESS
				});
				this.loader.renderTo(this.$refs.container);
			},
			updateProgressbar() {
				if (!this.loader) {
					this.createProgressbar();
				}
				this.loader.update(this.progress);
			}
		},
		template: '<span ref="container"></span>'
	};

	// @vue/component
	const TileItem = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UploadLoader,
			ErrorPopup,
			FileIconComponent
		},
		inject: {
			uploader: {},
			adapter: {},
			widgetOptions: {},
			emitter: {},
			insideTileList: {
				default: false
			},
			tileZone: {
				default: null
			}
		},
		/**
		 * The hidden status "file is in the text" is rendered here, and the extra action of the tile
		 * refers to it through `aria-describedby`. Only the tile knows both the flag and whether the
		 * highlight is allowed at all, so the id is resolved in one place: a second computation of the
		 * same condition once left the reference pointing at an element that was not rendered.
		 */
		provide() {
			return {
				tileInsertedStatus: {
					getId: () => this.isSelected ? this.insertedStatusId : null
				}
			};
		},
		props: {
			item: {
				type: Object,
				default: () => {}
			},
			readonly: {
				type: Boolean,
				default: false
			},
			viewerGroupBy: {
				type: [String, null],
				default: null
			},
			removeFromServer: {
				type: Boolean,
				default: true
			},
			forceDisableSelection: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				Actions: ui_iconSet_api_core.Actions,
				Outline: ui_iconSet_api_core.Outline,
				FileStatus: ui_uploader_core.FileStatus,
				menuId: `ui-tile-uploader-item-menu-${main_core.Text.getRandom().toLowerCase()}`,
				errorTextId: `ui-tile-uploader-item-error-${main_core.Text.getRandom().toLowerCase()}`
			};
		},
		data() {
			return {
				showError: false,
				isMenuShown: false
			};
		},
		computed: {
			status() {
				if (this.item.status === ui_uploader_core.FileStatus.UPLOADING) {
					return `${this.item.progress}%`;
				}
				if (this.item.status === ui_uploader_core.FileStatus.LOAD_FAILED || this.item.status === ui_uploader_core.FileStatus.UPLOAD_FAILED) {
					return main_core.Loc.getMessage('TILE_UPLOADER_ERROR_STATUS');
				}
				return main_core.Loc.getMessage('TILE_UPLOADER_WAITING_STATUS');
			},
			fileSize() {
				if ([ui_uploader_core.FileStatus.LOADING, ui_uploader_core.FileStatus.LOAD_FAILED].includes(this.item.status) && this.item.origin === ui_uploader_core.FileOrigin.SERVER) {
					return '';
				}
				return this.item.sizeFormatted;
			},
			errorPopupOptions() {
				const targetNode = this.$refs.container;
				const targetNodeWidth = targetNode.offsetWidth;
				return {
					bindElement: targetNode,
					darkMode: true,
					offsetTop: 6,
					minWidth: targetNodeWidth,
					maxWidth: 500,
					closeByEsc: true
				};
			},
			clampedFileName() {
				const nameParts = this.item.name.split('.');
				if (nameParts.length > 1) {
					nameParts.pop();
				}
				const nameWithoutExtension = nameParts.join('.');
				const maxLength = this.widgetOptions.compact ? 22 : 27;
				if (nameWithoutExtension.length > maxLength) {
					return `${nameWithoutExtension.slice(0, maxLength - 10)}...${nameWithoutExtension.slice(-5)}`;
				}
				return nameWithoutExtension;
			},
			showItemMenuButton() {
				if (main_core.Type.isBoolean(this.widgetOptions.showItemMenuButton)) {
					return this.widgetOptions.showItemMenuButton;
				}
				return this.menuItems.length > 0;
			},
			menuItems() {
				const items = [];
				items.push({
					id: 'filesize',
					text: main_core.Loc.getMessage('TILE_UPLOADER_FILE_SIZE', {
						'#filesize#': this.item.sizeFormatted
					}),
					disabled: true
				}, {
					delimiter: true
				});
				if (this.widgetOptions.insertIntoText === true) {
					items.push({
						id: 'insert-into-text',
						text: main_core.Loc.getMessage('TILE_UPLOADER_INSERT_INTO_THE_TEXT'),
						onclick: () => {
							if (this.menu) {
								this.menu.close();
							}
							this.emitter.emit('onInsertIntoText', {
								item: this.item
							});
						}
					});
				}
				if (main_core.Type.isStringFilled(this.item.downloadUrl)) {
					items.push({
						id: 'download',
						text: main_core.Loc.getMessage('TILE_UPLOADER_MENU_DOWNLOAD'),
						href: this.item.downloadUrl,
						onclick: () => this.menu?.close()
					});
				}
				if (!this.readonly) {
					const removeItem = {
						id: 'remove',
						text: main_core.Loc.getMessage('TILE_UPLOADER_MENU_REMOVE'),
						onclick: this.removeFromMenu
					};
					items.push(removeItem);
				}
				return items;
			},
			extraAction() {
				return this.widgetOptions.slots && this.widgetOptions.slots[ui_uploader_tileWidget.TileWidgetSlot.ITEM_EXTRA_ACTION] ? this.widgetOptions.slots[ui_uploader_tileWidget.TileWidgetSlot.ITEM_EXTRA_ACTION] : this.widgetOptions.insertIntoText === true ? InsertIntoTextButton : null;
			},
			isSelected() {
				if (this.forceDisableSelection) {
					return false;
				}
				return this.item.customData.tileSelected === true;
			},
			fileIconSize() {
				return this.widgetOptions.compact ? 24 : 36;
			},
			viewerAttrs() {
				const {
					viewerAttrs,
					previewUrl
				} = this.item;
				if (!viewerAttrs) {
					return {};
				}
				const params = {};
				for (const [key, value] of Object.entries(viewerAttrs)) {
					params[`data-${main_core.Text.toKebabCase(key)}`] = value;
				}
				params['data-viewer'] = true;
				if (previewUrl) {
					params['data-viewer-preview'] = previewUrl;
				}
				if (this.viewerGroupBy && main_core.Type.isUndefined(viewerAttrs.viewerSeparateItem)) {
					params['data-viewer-group-by'] = this.viewerGroupBy;
				}
				return params;
			},
			isUploading() {
				return this.item.status === ui_uploader_core.FileStatus.UPLOADING;
			},
			isViewerAvailable() {
				return Object.keys(this.viewerAttrs).length > 0;
			},
			errorText() {
				const {
					error
				} = this.item;
				if (!error) {
					return '';
				}
				return [error.message, error.description].filter(Boolean).join('. ');
			},
			errorDescribedBy() {
				return this.item.error ? this.errorTextId : null;
			},
			insertedStatusId() {
				return `ui-tile-uploader-item-inserted-status-${this.item.id}`;
			},
			insertedStatusText() {
				return main_core.Loc.getMessage('TILE_UPLOADER_FILE_INSERTED_STATUS');
			},
			removeFileLabel() {
				return main_core.Loc.getMessage('TILE_UPLOADER_REMOVE_FILE_LABEL');
			},
			cancelUploadLabel() {
				return main_core.Loc.getMessage('TILE_UPLOADER_CANCEL_UPLOAD_LABEL');
			},
			itemMenuLabel() {
				return main_core.Loc.getMessage('TILE_UPLOADER_ITEM_MENU_LABEL');
			},
			openFileLabel() {
				return main_core.Loc.getMessage('TILE_UPLOADER_OPEN_FILE_LABEL', {
					'#FILENAME#': this.item.name
				});
			},
			uploadProgressLabel() {
				return main_core.Loc.getMessage('TILE_UPLOADER_UPLOAD_PROGRESS_LABEL');
			}
		},
		created() {
			this.menu = null;
		},
		beforeUnmount() {
			if (this.menu) {
				this.menu.destroy();
				this.menu = null;
			}
		},
		methods: {
			/**
			 * Removal from the menu waits for the menu to close first. The menu keeps a focus trap, and
			 * on close the trap returns the focus to the element it was opened from - the menu button of
			 * this very tile. Removing the file before that put our focus target in place only for the
			 * trap to override it, and the tile then took the focus with it to the body.
			 */
			removeFromMenu() {
				if (!this.menu) {
					this.remove();
					return;
				}
				this.menu.getPopupWindow().subscribeOnce('onAfterClose', () => {
					this.remove();
				});
				this.menu.close();
			},
			remove() {
				if (this.readonly) {
					return;
				}
				const focusTarget = this.getFocusTargetAfterRemove();
				this.uploader.removeFile(this.item.id, {
					removeFromServer: this.removeFromServer
				});
				if (!focusTarget) {
					return;
				}

				// an action of a neighbouring tile belongs to the zone, so it has to learn about the move
				if (this.tileZone && focusTarget.closest('.ui-tile-uploader-items') !== null) {
					this.tileZone.focusAction(focusTarget);
					return;
				}
				if (ui_a11y.InteractivityChecker.isFocusable(focusTarget)) {
					ui_a11y.FocusNavigator.focusTarget(focusTarget, {
						preventScroll: true
					});
				} else {
					// the widget root is the last resort: it gets tabindex="-1" to accept the focus
					ui_a11y.FocusNavigator.focusContainer(focusTarget, {
						preventScroll: true
					});
				}
			},
			/**
			 * The focus is moved while the tile is still in the DOM: the leave animation of
			 * transition-group keeps the node alive, and waiting for it would drop focus to the body.
			 * Order of targets: next tile, previous tile, file input of the drop area.
			 */
			getFocusTargetAfterRemove() {
				const tile = this.$refs.container;
				const activeElement = ui_a11y.FocusNavigator.getActiveElement();
				const focusIsInside = activeElement !== null && tile.contains(activeElement) || this.isMenuShown;
				if (!focusIsInside) {
					return null;
				}
				const target = this.findTargetInNeighbours(tile, 'nextElementSibling') ?? this.findTargetInNeighbours(tile, 'previousElementSibling');
				if (target) {
					return target;
				}
				const widget = tile.closest('.ui-tile-uploader');
				return widget?.querySelector('.ui-tile-uploader-drop-input') ?? widget;
			},
			findTargetInNeighbours(tile, direction) {
				for (let node = tile[direction]; node; node = node[direction]) {
					// tiles being removed stay in the DOM until the leave animation ends,
					// and focusing one of them would drop the focus to the body a moment later
					if (node.className.includes('ui-tile-uploader-item-leave')) {
						continue;
					}
					const target = ui_a11y.FocusNavigator.getFirst(node, {
						tabbableOnly: false
					});
					if (target) {
						return target;
					}
				}
				return null;
			},
			handleMouseEnter(item) {
				if (item.error) {
					this.showError = true;
				}
			},
			handleMouseLeave() {
				this.showError = false;
			},
			hideError() {
				this.showError = false;
			},
			toggleMenu() {
				setTimeout(() => {
					if (this.menu) {
						if (this.menu.getPopupWindow().isShown()) {
							this.menu.close();
							return;
						}
						this.menu.destroy();
					}
					this.menu = main_popup.MenuManager.create({
						id: this.menuId,
						bindElement: this.$refs.menu,
						ariaLabel: this.itemMenuLabel,
						targetContainer: document.body,
						angle: true,
						offsetLeft: 13,
						minWidth: 100,
						cacheable: false,
						items: this.menuItems,
						bindOptions: {
							forceBindPosition: true
						},
						events: {
							onShow: () => {
								this.isMenuShown = true;
								this.adapter.getItem(this.item.id).isMenuShown = true;
							},
							onClose: () => {
								this.isMenuShown = false;
								this.adapter.getItem(this.item.id).isMenuShown = false;
							},
							onDestroy: () => {
								this.menu = null;
							}
						}
					});
					const downloadItem = this.menu.getMenuItem('download');
					if (downloadItem) {
						main_core.Dom.attr(downloadItem.getContainer(), 'download', true);
					}
					this.emitter.emit('TileItem:onMenuCreate', {
						menu: this.menu,
						item: this.item
					});

					// closing the menu returns the focus to this button, and it arrives from the popup, that
					// is from outside the focus zone - the zone has to be told where to land, or it resolves
					// the entry point itself and throws the focus to the first action of the first file
					this.tileZone?.holdEntry(this.$refs.menu);

					// main.popup fires onShow before it positions the popup (popup.js:1708 then :1715), and
					// the menu focuses its first item on onShow with scrolling allowed - the browser then
					// scrolls the page to a popup that still sits at the top of the document. Placing it at
					// the button beforehand keeps the page still; show() positions it precisely afterwards.
					this.menu.getPopupWindow().adjustPosition();
					this.menu.show();
				});
			}
		},
		/**
		 * DOM order inside the tile is the keyboard order: the file itself, then the actions on it in
		 * their visual order - removal on the left, then the extra action, then the menu on the right.
		 * The overlays are positioned absolutely, so the order does not affect the layout: entering the
		 * list does not start on an irreversible action, and the actions are still walked left to right.
		 */
		template: `
		<div
			class="ui-tile-uploader-item"
			data-testid="ui-tile-uploader-item"
			:class="[
				'ui-tile-uploader-item--' + item.status,
				{
					'--image': item.isImage,
					'--selected': (isMenuShown && widgetOptions.compact) || isSelected,
				},
			]"
			:role="insideTileList ? 'group' : null"
			:aria-label="insideTileList ? item.name : null"
			ref="container"
		>
			<ErrorPopup
				v-if="item.error && showError"
				:error="item.error"
				:popup-options="errorPopupOptions"
				@onDestroy="hideError"
			/>
			<span v-if="item.error" class="ui-tile-uploader-visually-hidden" :id="errorTextId">{{errorText}}</span>
			<div
				class="ui-tile-uploader-item-content"
				@mouseenter="handleMouseEnter(item)"
				@mouseleave="handleMouseLeave"
			>
				<component
					:is="isViewerAvailable ? 'button' : 'div'"
					:type="isViewerAvailable ? 'button' : null"
					class="ui-tile-uploader-item-preview-content"
					data-testid="ui-tile-uploader-item-preview"
					:aria-label="isViewerAvailable ? openFileLabel : null"
					:aria-describedby="isViewerAvailable ? errorDescribedBy : null"
					v-bind="viewerAttrs"
				>
					<span class="ui-tile-uploader-item-preview">
						<span
							v-if="item.previewUrl"
							class="ui-tile-uploader-item-image"
							:class="{ 'ui-tile-uploader-item-image-default': item.previewUrl === null }"
							:style="{ backgroundImage: item.previewUrl !== null ? 'url(' + item.previewUrl + ')' : '' }">
						</span>
						<FileIconComponent
							v-else
							:name="item.extension || '...'"
							:size="fileIconSize"
							aria-hidden="true"
						/>
					</span>
					<span
						v-if="item.name"
						class="ui-tile-uploader-item-name-box"
						:title="item.name"
					>
						<span class="ui-tile-uploader-item-name">
							<span class="ui-tile-uploader-item-name-title">{{clampedFileName}}</span>
							<span v-if="item.extension" class="ui-tile-uploader-item-name-extension">.{{item.extension}}</span>
						</span>
					</span>
					<span
						v-if="isSelected"
						class="ui-tile-uploader-visually-hidden"
						:id="insertedStatusId"
					>{{insertedStatusText}}</span>
				</component>
				<div v-if="item.status !== FileStatus.COMPLETE" class="ui-tile-uploader-item-state">
					<div class="ui-tile-uploader-item-loader" v-if="item.status === FileStatus.UPLOADING">
						<UploadLoader
							:progress="item.progress"
							:width="20"
							colorTrack="#73d8f8"
							colorBar="#fff"
							aria-hidden="true"
						/>
					</div>
					<div v-else class="ui-tile-uploader-item-state-icon"></div>
					<div
						class="ui-tile-uploader-item-status"
						:role="isUploading ? 'progressbar' : null"
						:aria-label="isUploading ? uploadProgressLabel : null"
						:aria-valuemin="isUploading ? 0 : null"
						:aria-valuemax="isUploading ? 100 : null"
						:aria-valuenow="isUploading ? item.progress : null"
					>
						<div class="ui-tile-uploader-item-status-name">{{status}}</div>
						<div v-if="fileSize" class="ui-tile-uploader-item-state-desc">{{fileSize}}</div>
					</div>
					<button
						v-if="!readonly"
						type="button"
						class="ui-tile-uploader-item-state-remove"
						data-testid="ui-tile-uploader-item-cancel-btn"
						:aria-label="cancelUploadLabel"
						:aria-describedby="errorDescribedBy"
						@click="remove"
						key="aaa"
					></button>
				</div>
				<template v-else>
					<button
						v-if="!readonly"
						type="button"
						class="ui-tile-uploader-item-remove"
						data-testid="ui-tile-uploader-item-remove-btn"
						:aria-label="removeFileLabel"
						:aria-describedby="errorDescribedBy"
						key="remove"
						@click="remove"
					>
						<BIcon :name="Outline.CROSS_L" aria-hidden="true"/>
					</button>
					<div class="ui-tile-uploader-item-actions" key="actions">
						<div class="ui-tile-uploader-item-actions-pad">
							<div v-if="extraAction" class="ui-tile-uploader-item-extra-actions">
								<component :is="extraAction" :item="item"></component>
							</div>
							<button
								v-if="showItemMenuButton"
								type="button"
								class="ui-tile-uploader-item-menu"
								data-testid="ui-tile-uploader-item-menu-btn"
								:aria-label="itemMenuLabel"
								:aria-describedby="errorDescribedBy"
								aria-haspopup="menu"
								:aria-expanded="isMenuShown ? 'true' : 'false'"
								ref="menu"
								@click="toggleMenu"
							>
								<BIcon :name="Actions.MORE" aria-hidden="true"/>
							</button>
						</div>
					</div>
				</template>
			</div>
		</div>
	`
	};

	// @vue/component
	const TileMoreItem = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		emits: ['onClick'],
		props: {
			hiddenFilesCount: {
				type: Number,
				default: 0
			}
		},
		setup() {
			return {
				Actions: ui_iconSet_api_core.Actions
			};
		},
		computed: {
			moreButtonCaption() {
				return main_core.Loc.getMessage('TILE_UPLOADER_MORE_BUTTON_CAPTION', {
					'#COUNT#': `<span class="ui-tile-uploader-item-more-count">${this.hiddenFilesCount}</span>`
				});
			}
		},
		template: `
		<div class="ui-tile-uploader-item">
			<button
				type="button"
				class="ui-tile-uploader-item-more"
				data-testid="ui-tile-uploader-more-btn"
				aria-expanded="false"
				@click="$emit('onClick')"
			>
				<BIcon class="ui-tile-uploader-item-more-icon" :name="Actions.MORE" aria-hidden="true"/>
				<span class="ui-tile-uploader-item-more-label" v-html="moreButtonCaption"></span>
			</button>
		</div>
	`
	};

	/**
	 * @memberof BX.UI.Uploader
	 */
	const TileList = {
		components: {
			TileItem,
			TileMoreItem
		},
		emits: ['onUnmount'],
		/**
		 * The tiles learn from here that they are inside a managed list: only then do they take a group
		 * role and hand their actions over to the focus zone. TileItem is public, and other modules
		 * render it on their own markup, where neither would be right.
		 */
		provide() {
			return {
				insideTileList: true,
				// the tiles move the focus through the zone, never by focusing a node directly:
				// the zone would otherwise resolve the entry point on its own and land elsewhere
				tileZone: {
					focusAction: action => this.focusAction(action),
					holdEntry: action => this.holdEntryAction(action)
				}
			};
		},
		props: {
			autoCollapse: {
				type: Boolean,
				default: false
			},
			items: {
				type: Array,
				default: []
			},
			readonly: {
				type: Boolean,
				default: false
			},
			removeFromServer: {
				type: Boolean,
				default: true
			},
			forceDisableSelection: {
				type: Boolean,
				default: false
			}
		},
		data: () => ({
			pageSize: 5,
			firstHiddenItem: null,
			lastHiddenItem: null
		}),
		created() {
			this.moreItemBlocked = false;

			// non-reactive on purpose: a FocusZone instance behind a Vue proxy breaks its private fields
			this.focusZone = null;
			this.entryAction = null;
			if (!this.autoCollapse) {
				return;
			}
			if (this.items.length > this.pageSize) {
				this.firstHiddenItem = this.items[this.pageSize];
				this.lastHiddenItem = this.items[this.items.length - 1];
			}
		},
		mounted() {
			// the list is a single Tab stop: the arrows walk every action of every file in one chain,
			// so the last action of a file is followed by the first action of the next one
			this.focusZone = new ui_a11y.FocusZone(this.$refs.list, {
				bindKeys: ui_a11y.FocusKeys.ArrowAll | ui_a11y.FocusKeys.HomeAndEnd,
				focusOutBehavior: 'wrap',
				// an explicit function instead of a strategy name: the zone otherwise decides the entry
				// point from its own history, and a programmatic focus lands on the wrong action
				focusInStrategy: () => this.takeEntryAction(),
				preventScroll: true
			});
			this.focusZone.activate();
		},
		beforeUnmount() {
			this.focusZone?.deactivate();
			this.focusZone = null;
		},
		unmounted() {
			this.$emit('onUnmount');
		},
		computed: {
			visibleItems() {
				if (this.firstHiddenItem === null) {
					return this.items;
				}
				const index = this.items.indexOf(this.firstHiddenItem);
				if (index === -1) {
					this.resetMoreItem();
					return this.items;
				}
				return this.items.slice(0, index);
			},
			realtimeItems() {
				if (this.lastHiddenItem === null) {
					return [];
				}
				const index = this.items.indexOf(this.lastHiddenItem);
				if (index === -1) {
					this.resetMoreItem();
					return [];
				}
				return this.items.slice(index + 1);
			},
			hiddenFilesCount() {
				if (this.lastHiddenItem === null) {
					return 0;
				}
				const firstIndex = this.items.indexOf(this.firstHiddenItem);
				const lastIndex = this.items.indexOf(this.lastHiddenItem);
				if (firstIndex === -1 || lastIndex === -1) {
					this.resetMoreItem();
					return 0;
				}
				return lastIndex - firstIndex + 1;
			},
			groupBy() {
				return main_core.Text.getRandom(16);
			},
			listLabel() {
				return main_core.Loc.getMessage('TILE_UPLOADER_FILE_LIST_LABEL');
			}
		},
		methods: {
			getRenderedTiles() {
				return [...(this.$refs.list?.querySelectorAll('.ui-tile-uploader-item') ?? [])];
			},
			getFirstAction() {
				return this.$refs.list?.querySelector('button') ?? null;
			},
			/**
			 * Moves the focus to an action of this list. The zone resolves the entry point through
			 * `focusInStrategy`, so the target is announced to it first - otherwise a programmatic
			 * focus is redirected to whatever the zone remembers as its last active action.
			 */
			focusAction(action) {
				this.holdEntryAction(action);
				action.focus({
					preventScroll: true
				});
			},
			/**
			 * Announces where the next entry into the zone has to land. A layer opened from inside the
			 * list - the menu of a tile - gives the focus back to its own initiator, and that arrives
			 * from outside the container, so the zone would otherwise resolve the entry point itself and
			 * throw the focus to the first action of the first file.
			 */
			holdEntryAction(action) {
				this.entryAction = action;
			},
			// the announced entry point is spent on the first entry: later ones start from the top again
			takeEntryAction() {
				const action = this.entryAction;
				this.entryAction = null;
				return action ?? this.getFirstAction();
			},
			focusRevealedTile(knownTiles) {
				const revealed = this.getRenderedTiles().find(tile => !knownTiles.has(tile));
				if (!revealed) {
					return;
				}

				// the tile is still running its enter animation from opacity: 0, so it counts as
				// invisible for FocusNavigator - take its first action directly
				const action = revealed.querySelector('button');
				if (action) {
					this.focusAction(action);
					return;
				}

				// a tile without actions (readonly, no menu, no viewer) still has to hold the focus,
				// otherwise it drops to the body together with the "more" item
				ui_a11y.FocusNavigator.focusContainer(revealed, {
					preventScroll: true
				});
			},
			getMore() {
				if (this.moreItemBlocked) {
					return;
				}
				const activeElement = ui_a11y.FocusNavigator.getActiveElement();
				const focusWasOnMoreItem = activeElement !== null && activeElement.closest('.ui-tile-uploader-item-more') !== null;
				const knownTiles = new Set(this.getRenderedTiles());
				this.pageSize = Math.min(this.pageSize + 5, 30);
				const currentFirstIndex = this.items.indexOf(this.firstHiddenItem);
				const lastIndex = this.items.indexOf(this.lastHiddenItem);
				const newFirstIndex = currentFirstIndex + this.pageSize;
				const nextFirstIndex = newFirstIndex > lastIndex ? lastIndex + 1 : newFirstIndex;
				let itemsToShow = nextFirstIndex - currentFirstIndex;
				for (let i = currentFirstIndex, delay = 0; i < nextFirstIndex; i++, delay++) {
					this.moreItemBlocked = true;
					setTimeout(() => {
						if (i === lastIndex) {
							this.resetMoreItem();
						} else {
							this.firstHiddenItem = this.items[i + 1];
						}
						itemsToShow--;
						if (itemsToShow === 0) {
							this.moreItemBlocked = false;
						}

						// the "more" item disappears, so the first revealed tile takes over the focus
						if (focusWasOnMoreItem && delay === 0) {
							this.$nextTick(() => this.focusRevealedTile(knownTiles));
						}
					}, 100 * delay);
				}
			},
			resetMoreItem() {
				this.firstHiddenItem = null;
				this.lastHiddenItem = null;
			}
		},
		// language=Vue
		template: `
		<div
			class="ui-tile-uploader-items"
			data-testid="ui-tile-uploader-list"
			role="toolbar"
			:aria-label="listLabel"
			ref="list"
		>
			<transition-group name="ui-tile-uploader-item" type="animation">
				<TileItem
					v-for="item in visibleItems"
					:key="item.id" :item="item"
					:readonly="readonly"
					:viewerGroupBy="groupBy"
					:removeFromServer="removeFromServer"
					:forceDisableSelection="forceDisableSelection"
				/>
			</transition-group>
			<transition name="ui-tile-uploader-item" type="animation">
				<TileMoreItem
					v-if="hiddenFilesCount > 0"
					:hiddenFilesCount="hiddenFilesCount"
					@onClick="getMore"
				/>
			</transition>
			<transition-group name="ui-tile-uploader-item" type="animation">
				<TileItem
					v-for="item in realtimeItems"
					:key="item.id"
					:item="item"
					:readonly="readonly"
					:viewerGroupBy="groupBy"
					:removeFromServer="removeFromServer"
					:forceDisableSelection="forceDisableSelection"
				/>
			</transition-group>
		</div>
	`
	};

	/**
	 * @memberof BX.UI.Uploader
	 * @vue/component
	 */
	// @vue/component
	const TileWidgetComponent = {
		name: 'TileWidget',
		components: {
			DropArea,
			TileList,
			ErrorPopup
		},
		extends: ui_uploader_vue.VueUploaderComponent,
		mixins: [DragOverMixin],
		data() {
			return {
				isMounted: false,
				autoCollapse: false
			};
		},
		computed: {
			errorPopupOptions() {
				return {
					bindElement: this.$refs.container,
					closeIcon: true,
					padding: 20,
					offsetLeft: 45,
					angle: true,
					darkMode: true,
					bindOptions: {
						position: 'top',
						forceTop: true
					}
				};
			},
			TileWidgetSlot: () => ui_uploader_tileWidget.TileWidgetSlot,
			slots() {
				const slots = main_core.Type.isPlainObject(this.widgetOptions.slots) ? this.widgetOptions.slots : {};
				return {
					[ui_uploader_tileWidget.TileWidgetSlot.BEFORE_TILE_LIST]: slots[ui_uploader_tileWidget.TileWidgetSlot.BEFORE_TILE_LIST],
					[ui_uploader_tileWidget.TileWidgetSlot.AFTER_TILE_LIST]: slots[ui_uploader_tileWidget.TileWidgetSlot.AFTER_TILE_LIST],
					[ui_uploader_tileWidget.TileWidgetSlot.BEFORE_DROP_AREA]: slots[ui_uploader_tileWidget.TileWidgetSlot.BEFORE_DROP_AREA],
					[ui_uploader_tileWidget.TileWidgetSlot.AFTER_DROP_AREA]: slots[ui_uploader_tileWidget.TileWidgetSlot.AFTER_DROP_AREA]
				};
			},
			enableDropzone() {
				return this.widgetOptions.enableDropzone !== false;
			}
		},
		created() {
			this.autoCollapse = main_core.Type.isBoolean(this.widgetOptions.autoCollapse) ? this.widgetOptions.autoCollapse : this.items.length > 0;
			this.adapter.subscribe('Item:onAdd', this.clearError);
			this.adapter.subscribe('Item:onRemove', this.clearError);
			this.adapter.subscribe('Item:onAdd', this.announceItemAdd);
			this.adapter.subscribe('Item:onRemove', this.announceItemRemove);
			this.adapter.subscribe('Item:onError', this.announceItemError);
			this.adapter.subscribe('Uploader:onError', this.announceUploaderError);
		},
		mounted() {
			if (this.enableDropzone) {
				this.uploader.assignDropzone(this.$refs.container);
			}
			this.isMounted = true;
		},
		beforeUnmount() {
			this.adapter.unsubscribe('Item:onAdd', this.clearError);
			this.adapter.unsubscribe('Item:onRemove', this.clearError);
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
				ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('TILE_UPLOADER_FILE_ADDED_ANNOUNCE', {
					'#FILENAME#': item.name
				}));
			},
			announceItemRemove(event) {
				const {
					item
				} = event.getData();
				ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('TILE_UPLOADER_FILE_REMOVED_ANNOUNCE', {
					'#FILENAME#': item.name
				}));
			},
			announceItemError(event) {
				const {
					item
				} = event.getData();
				ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('TILE_UPLOADER_FILE_ERROR_ANNOUNCE', {
					'#FILENAME#': item.name
				}), 'assertive');
			},
			announceUploaderError() {
				ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('TILE_UPLOADER_ERROR_ANNOUNCE'), 'assertive');
			},
			enableAutoCollapse() {
				this.autoCollapse = true;
			},
			disableAutoCollapse() {
				this.autoCollapse = false;
			},
			handlePopupDestroy(error) {
				if (this.uploaderError === error) {
					this.uploaderError = null;
				}
			},
			clearError() {
				this.uploaderError = null;
			}
		},
		template: `
		<div
			class="ui-tile-uploader"
			:class="[
				widgetOptions.contextClass ?? '--ui-context-content-light',
				{
					'--compact': widgetOptions.compact,
				},
			]"
			ref="container"
			v-drop="enableDropzone"
		>
			<component :is="slots[TileWidgetSlot.BEFORE_TILE_LIST]"></component>
			<TileList 
				v-if="items.length !== 0"
				:items="items"
				:autoCollapse="autoCollapse"
				:readonly="widgetOptions.readonly"
				:removeFromServer="widgetOptions.removeFromServer"
				:forceDisableSelection="widgetOptions.forceDisableSelection"
				@onUnmount="autoCollapse = false"
			/>
			<component :is="slots[TileWidgetSlot.AFTER_TILE_LIST]"></component>
			<component :is="slots[TileWidgetSlot.BEFORE_DROP_AREA]"></component>
			<DropArea v-if="!widgetOptions.hideDropArea"/>
			<component :is="slots[TileWidgetSlot.AFTER_DROP_AREA]"></component>
		</div>
		<ErrorPopup
			v-if="uploaderError && isMounted"
			:alignArrow="false"
			:error="uploaderError"
			:popupOptions="errorPopupOptions"
			@onDestroy="handlePopupDestroy"
		/>
	`
	};

	/**
	 * @memberof BX.UI.Uploader
	 */
	class TileWidget extends ui_uploader_vue.VueUploaderWidget {
		constructor(uploaderOptions, tileWidgetOptions) {
			const widgetOptions = main_core.Type.isPlainObject(tileWidgetOptions) ? Object.assign({}, tileWidgetOptions) : {};
			super(uploaderOptions, widgetOptions);
		}
		defineComponent() {
			return TileWidgetComponent;
		}
	}

	const TileWidgetSlot = {
		BEFORE_TILE_LIST: 'beforeTileList',
		AFTER_TILE_LIST: 'afterTileList',
		BEFORE_DROP_AREA: 'beforeDropArea',
		AFTER_DROP_AREA: 'afterDropArea',
		ITEM_EXTRA_ACTION: 'Item:extraAction'
	};

	exports.DragOverMixin = DragOverMixin;
	exports.ErrorPopup = ErrorPopup;
	exports.FileIcon = FileIconComponent;
	exports.TileItem = TileItem;
	exports.TileList = TileList;
	exports.TileWidget = TileWidget;
	exports.TileWidgetComponent = TileWidgetComponent;
	exports.TileWidgetSlot = TileWidgetSlot;
	exports.UploadLoader = UploadLoader;

})(this.BX.UI.Uploader = this.BX.UI.Uploader || {}, BX, BX.UI.Uploader, BX.UI.Accessibility, BX.UI.Uploader, BX.UI.Uploader, BX.Main, BX.UI.IconSet, BX.UI.IconSet, window, window, BX.UI.Icons.Generator, BX.UI);
//# sourceMappingURL=ui.uploader.tile-widget.bundle.js.map

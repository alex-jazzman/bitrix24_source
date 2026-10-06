/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core_events, ui_vue3, ui_dialogs_messagebox, ui_iconSet_api_vue, ui_iconSet_api_core, main_core, ui_system_menu_vue, bizproc_setupTemplate, ui_entitySelector, ui_vue3_components_button, ui_system_typography_vue) {
	'use strict';

	// @vue/component
	const DraggableContainer = {
		name: 'DraggableContainer',
		props: {
			items: {
				type: Array,
				required: true
			},
			blockIndex: {
				type: Number,
				required: true
			}
		},
		emits: ['update:items'],
		data() {
			return {
				isDragging: false,
				dropTargetIndex: null,
				dragState: {
					sourceBlockIndex: null,
					draggedItemIndex: null,
					draggedElement: null,
					ghostElement: null,
					offsetX: 0,
					offsetY: 0,
					lastTargetBlockIndex: null,
					lastTargetItemIndex: null,
					mouseX: 0,
					mouseY: 0
				}
			};
		},
		computed: {
			draggedItemIndex() {
				return this.isDragging ? this.dragState.draggedItemIndex : null;
			}
		},
		created() {
			this.boundHandleDragMove = this.handleDragMove.bind(this);
			this.boundHandleDragEnd = this.handleDragEnd.bind(this);
			main_core_events.EventEmitter.subscribe('Bizproc.NodeSettings:onScroll', this.onScrollContainer);
			main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.onGlobalDragStart);
			main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:dragover', this.onGlobalDragOver);
			main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:end', this.onGlobalDragEnd);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.onGlobalDragStart);
			main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:dragover', this.onGlobalDragOver);
			main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:end', this.onGlobalDragEnd);
			main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:onScroll', this.onScrollContainer);
		},
		methods: {
			onGlobalDragStart(e) {
				const payload = e.getData();
				const {
					sourceItemIndex,
					sourceBlockIndex,
					event,
					element
				} = payload;
				if (sourceBlockIndex !== this.blockIndex) {
					return;
				}
				event.preventDefault();
				this.isDragging = true;
				this.dragState.sourceBlockIndex = this.blockIndex;
				this.dragState.draggedItemIndex = sourceItemIndex;
				this.dragState.draggedElement = element;
				this.dragState.mouseX = event.clientX;
				this.dragState.mouseY = event.clientY;
				this.createGhost(event);
				main_core.Dom.addClass(this.dragState.draggedElement, '--dragging');
				main_core.Dom.addClass(document.body, '--user-dragging');
				main_core.Event.bind(document, 'mousemove', this.boundHandleDragMove);
				main_core.Event.bind(document, 'mouseup', this.boundHandleDragEnd);
			},
			onGlobalDragOver(e) {
				const payload = e.getData();
				if (payload.targetBlockIndex === this.blockIndex) {
					this.dropTargetIndex = payload.targetItemIndex;
				} else {
					this.dropTargetIndex = null;
				}
				if (this.isDragging) {
					this.dragState.lastTargetBlockIndex = payload.targetBlockIndex;
					this.dragState.lastTargetItemIndex = payload.targetItemIndex;
				}
			},
			handleDragMove(event) {
				if (!this.isDragging) {
					return;
				}
				this.dragState.mouseX = event.clientX;
				this.dragState.mouseY = event.clientY;
				this.updateGhostPosition(event);
				main_core_events.EventEmitter.emit('Bizproc.SetupTemplate:Draggable:move', {
					clientY: event.clientY
				});
				const result = {
					targetBlockIndex: null,
					targetItemIndex: null
				};
				const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);
				if (elementUnderCursor) {
					const container = elementUnderCursor.closest('[data-draggable-container]');
					if (container) {
						result.targetBlockIndex = parseInt(container.dataset.blockIndex, 10);
						const allItems = [...container.querySelectorAll('[data-draggable-item]')];
						const closestItem = elementUnderCursor.closest('[data-draggable-item]');
						if (closestItem) {
							const rect = closestItem.getBoundingClientRect();
							const isAfter = event.clientY - rect.top > rect.height / 2;
							const index = allItems.indexOf(closestItem);
							result.targetItemIndex = isAfter ? index + 1 : index;
						} else if (allItems.length === 0) {
							result.targetItemIndex = 0;
						}
					}
				}
				main_core_events.EventEmitter.emit('Bizproc.SetupTemplate:Draggable:dragover', result);
			},
			handleDragEnd() {
				if (!this.isDragging) {
					return;
				}
				main_core_events.EventEmitter.emit('Bizproc.SetupTemplate:Draggable:drop', {
					sourceBlockIndex: this.dragState.sourceBlockIndex,
					sourceItemIndex: this.dragState.draggedItemIndex,
					targetBlockIndex: this.dragState.lastTargetBlockIndex,
					targetItemIndex: this.dragState.lastTargetItemIndex
				});
				main_core_events.EventEmitter.emit('Bizproc.SetupTemplate:Draggable:end');
			},
			onGlobalDragEnd() {
				if (this.isDragging) {
					this.resetDragState();
				}
				this.isDragging = false;
				this.dropTargetIndex = null;
			},
			resetDragState() {
				main_core.Dom.removeClass(document.body, '--user-dragging');
				if (this.dragState.draggedElement) {
					main_core.Dom.removeClass(this.dragState.draggedElement, '--dragging');
				}
				if (this.dragState.ghostElement) {
					main_core.Dom.remove(this.dragState.ghostElement);
				}
				main_core.Event.unbind(document, 'mousemove', this.boundHandleDragMove);
				main_core.Event.unbind(document, 'mouseup', this.boundHandleDragEnd);
				this.dragState = {
					sourceBlockIndex: null,
					draggedItemIndex: null,
					draggedElement: null,
					ghostElement: null,
					offsetX: 0,
					offsetY: 0,
					lastTargetBlockIndex: null,
					lastTargetItemIndex: null,
					mouseX: 0,
					mouseY: 0
				};
			},
			updateGhostPosition(event) {
				if (!this.dragState.ghostElement) {
					return;
				}
				main_core.Dom.style(this.dragState.ghostElement, 'left', `${event.clientX - this.dragState.offsetX}px`);
				main_core.Dom.style(this.dragState.ghostElement, 'top', `${event.clientY - this.dragState.offsetY}px`);
			},
			createGhost(event) {
				const rect = this.dragState.draggedElement.getBoundingClientRect();
				this.dragState.offsetX = event.clientX - rect.left;
				this.dragState.offsetY = event.clientY - rect.top;
				const ghost = this.dragState.draggedElement.cloneNode(true);
				main_core.Dom.addClass(ghost, '--ghost');
				main_core.Dom.style(ghost, 'width', `${rect.width}px`);
				main_core.Dom.append(ghost, document.body);
				this.dragState.ghostElement = ghost;
				this.updateGhostPosition(event);
			},
			onScrollContainer() {
				if (this.isDragging) {
					this.handleDragMove({
						clientX: this.dragState.mouseX,
						clientY: this.dragState.mouseY
					});
				}
			}
		},
		template: `
		<div>
			<slot
				:dropTargetIndex="dropTargetIndex"
				:draggedItemIndex="draggedItemIndex"
			></slot>
		</div>
	`
	};

	// @vue/component
	const BlockComponent = {
		name: 'BlockComponent',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			DraggableContainer
		},
		props: {
			position: {
				type: Number,
				required: true
			},
			/** type Array<Item> */
			items: {
				type: Array,
				required: true
			},
			blockIndex: {
				type: Number,
				required: true
			}
		},
		emits: ['deleteBlock', 'update:items'],
		setup() {
			return {
				Outline: ui_iconSet_api_core.Outline
			};
		},
		computed: {
			title() {
				return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_BLOCK_TITLE', {
					'#POSITION#': this.position
				});
			}
		},
		methods: {
			onItemsUpdate(newItems) {
				this.$emit('update:items', newItems);
			},
			showDropPlaceholder(dnd, itemIndex) {
				return dnd.dropTargetIndex === itemIndex && dnd.dropTargetIndex !== dnd.draggedItemIndex;
			},
			showFinalDropPlaceholder(dnd) {
				return dnd.dropTargetIndex === this.items.length && dnd.draggedItemIndex !== this.items.length;
			}
		},
		template: `
		<div class="bizproc-setuptemplateactivity-block">
			<div class="bizproc-setuptemplateactivity-block__header">
				<div class="bizproc-setuptemplateactivity-block__header-wrap">
					<p class="bizproc-setuptemplateactivity-block__title">
						{{ title }}
					</p>
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-block__delete-icon"
						@click="$emit('deleteBlock')"
					/>
				</div>
			</div>
			<DraggableContainer
				:items="items"
				:blockIndex="blockIndex"
				@update:items="onItemsUpdate"
				v-slot="dnd"
			>
				<div
					:data-block-index="blockIndex"
					class="bizproc-setuptemplateactivity-block__items"
					data-draggable-container="true"
				>
					<template
						v-for="(item, itemIndex) in items"
						:key="item.id"
					>
						<div
							class="bizproc-setuptemplateactivity-draggable-wrapper"
							data-draggable-item="true"
						>
							<div
								v-if="showDropPlaceholder(dnd, itemIndex)"
								class="bizproc-setuptemplateactivity-drop-placeholder"
							></div>
							<slot
								name="item"
								:item="item"
								:itemIndex="itemIndex"
							></slot>
						</div>
						<slot
							name="after-item"
							:item="item"
							:itemIndex="itemIndex"
						></slot>
					</template>
					<div
						v-if="showFinalDropPlaceholder(dnd)"
						class="bizproc-setuptemplateactivity-drop-placeholder"
					></div>
				</div>
			</DraggableContainer>
			<slot name="before-footer"/>
			<div class="bizproc-setuptemplateactivity-block__footer">
				<div class="bizproc-setuptemplateactivity-block__footer-wrap">
					<slot name="footer"/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const AddBlockBtn = {
		name: 'AddBlockBtn',
		template: `
		<button
			class="ui-btn --air --wide --style-outline-no-accent ui-btn-no-caps --with-icon"
			type="button"
		>
			<div class="ui-icon-set --plus-l"/>
			<span class="ui-btn-text">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_BLOCK') }}
			</span>
		</button>
	`
	};

	const ITEM_TYPES = Object.freeze({
		DELIMITER: 'delimiter',
		TITLE: 'title',
		TITLE_WITH_ICON: 'titleWithIcon',
		ICON_TITLE: 'iconTitle',
		DESCRIPTION: 'description',
		CONSTANT: 'constant'
	});
	const CONSTANT_TYPES = Object.freeze({
		STRING: 'string',
		INT: 'int',
		USER: 'user',
		FILE: 'file',
		TEXT: 'text',
		SELECT: 'select',
		ENTITY_SELECTOR: 'entityselector',
		KNOWLEDGE_BASE: 'rag_knowledge_base',
		BOOL: 'bool',
		DATE: 'date',
		DATETIME: 'datetime'
	});
	const DELIMITER_TYPES = Object.freeze({
		LINE: 'line'
	});
	const EDITING_MODES = Object.freeze({
		CREATE: 'create',
		EDIT: 'edit'
	});
	const CONSTANT_ID_PREFIX = 'SetupTemplateActivity_';
	const SETUP_TEMPLATE_ACTIVITY_SOURCE = 'SetupTemplateActivity';
	const PRESET_TITLE_ICONS = {
		IMAGE: 'o-image',
		ATTACH: 'o-attach',
		SETTINGS: 'o-settings',
		STARS: 'o-ai-stars'
	};
	const MENU_SECTIONS = Object.freeze({
		ELEMENTS: 'elements',
		PRESETS: 'presets',
		CUSTOM: 'custom'
	});

	// Order of the entries is the order of the menu items in the "ready-made constants" section.
	const CONSTANT_PRESETS = Object.freeze([{
		code: 'user',
		constantType: CONSTANT_TYPES.USER,
		multiple: true,
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_USER_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_USER_HINT',
		nameKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_USER_NAME'
	}, {
		code: 'knowledgeBase',
		constantType: CONSTANT_TYPES.KNOWLEDGE_BASE,
		multiple: false,
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_KNOWLEDGE_BASE_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_KNOWLEDGE_BASE_HINT',
		nameKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_KNOWLEDGE_BASE_NAME'
	}, {
		code: 'prompt',
		constantType: CONSTANT_TYPES.TEXT,
		multiple: false,
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_PROMPT_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_PROMPT_HINT',
		nameKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_PROMPT_NAME'
	}]);

	function makeEmptyBlock() {
		return {
			id: generateConstantId(),
			items: []
		};
	}
	function makeEmptyDelimiter() {
		return {
			id: generateConstantId(),
			itemType: ITEM_TYPES.DELIMITER,
			delimiterType: DELIMITER_TYPES.LINE
		};
	}
	function makeEmptyTitle() {
		return {
			id: generateConstantId(),
			itemType: ITEM_TYPES.TITLE,
			text: ''
		};
	}
	function makeEmptyTitleWithIcon() {
		return {
			id: generateConstantId(),
			itemType: ITEM_TYPES.TITLE_WITH_ICON,
			text: '',
			icon: 'IMAGE'
		};
	}
	function makeEmptyDescription() {
		return {
			id: generateConstantId(),
			itemType: ITEM_TYPES.DESCRIPTION,
			text: ''
		};
	}
	function makeEmptyConstant(id = null) {
		return {
			itemType: ITEM_TYPES.CONSTANT,
			id: id || generateConstantId(),
			name: '',
			constantType: CONSTANT_TYPES.STRING,
			multiple: false,
			description: '',
			default: '',
			options: [],
			required: false,
			settings: {}
		};
	}
	function makePresetConstant(preset, id = null) {
		return {
			...makeEmptyConstant(id),
			name: main_core.Loc.getMessage(preset.nameKey) ?? '',
			constantType: preset.constantType,
			multiple: preset.multiple
		};
	}
	function convertConstants(constant) {
		return {
			Name: constant.name,
			Description: constant.description,
			Type: constant.constantType,
			Required: 0,
			Multiple: constant.multiple ? 1 : 0,
			Options: main_core.Type.isObject(constant.options) ? constant.options : null,
			Default: constant.default,
			Settings: constant.settings,
			Source: SETUP_TEMPLATE_ACTIVITY_SOURCE
		};
	}
	function generateRandomString(length) {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		const charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
	function generateConstantId() {
		return CONSTANT_ID_PREFIX + generateRandomString(10);
	}

	// main.popup places a bound popup below its bind element and flips it above only when the popup
	// fits there entirely, so the roomier side is the height a popup may take without leaving the window.
	function calculateFreeHeightAround(verticalBounds, viewportHeight, gap) {
		return Math.max(verticalBounds.top, viewportHeight - verticalBounds.bottom) - gap;
	}
	function getScrollParent(node) {
		let parent = node?.parentElement;
		while (parent && parent !== document.body) {
			const style = window.getComputedStyle(parent);
			const overflowY = style.overflowY;
			const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
			if (isScrollable && parent.tagName !== 'FORM') {
				return parent;
			}
			parent = parent.parentElement;
		}
		return null;
	}

	// The popup keeps a fixed width: item subtitles wrap instead of sizing the menu by their length.
	// Exported for the tests, which assert the layout of the menu against these very values.
	const MENU_WIDTH = 380;

	// Keeps the popup off the window edge, borders and shadow included.
	const MENU_VIEWPORT_GAP = 12;

	// A popup applies any non-negative maxHeight, so a smaller free space is left unlimited:
	// a menu a few pixels tall is worse than a menu reaching beyond the window.
	const MENU_MIN_HEIGHT = 200;
	const VISUAL_ELEMENTS = [{
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_HINT',
		make: makeEmptyTitle
	}, {
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ICON_TITLE_ITEM_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ICON_TITLE_ITEM_HINT',
		make: makeEmptyTitleWithIcon
	}, {
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_HINT',
		make: makeEmptyDescription
	}, {
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_HINT',
		make: makeEmptyDelimiter
	}];

	// @vue/component
	const AddElementBtn = {
		name: 'AddElementBtn',
		components: {
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			constantIds: {
				type: Set,
				default: () => new Set()
			},
			/** @type ConstantConfiguration[] */
			constantConfigurationList: {
				type: Array,
				default: () => []
			}
		},
		emits: ['add:element', 'create:constant'],
		data() {
			return {
				isMenuShown: false,
				offsetLeft: 0,
				menuMaxHeight: null
			};
		},
		computed: {
			menuOptions() {
				return {
					bindElement: this.$refs.addElementButton,
					// The popup gets its content as an element, so main.popup has no text to name it with.
					ariaLabel: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_ITEM'),
					offsetLeft: this.offsetLeft,
					width: MENU_WIDTH,
					maxHeight: this.menuMaxHeight,
					fixed: false,
					cacheable: false,
					sections: this.menuSections,
					items: [...this.visualElementItems, ...this.presetItems, this.customConstantItem]
				};
			},
			menuSections() {
				return [{
					code: MENU_SECTIONS.ELEMENTS,
					title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_MENU_SECTION_ELEMENTS')
				}, {
					code: MENU_SECTIONS.PRESETS,
					title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_MENU_SECTION_PRESETS')
				},
				// An empty title renders a bare divider instead of a section heading.
				{
					code: MENU_SECTIONS.CUSTOM,
					title: ''
				}];
			},
			visualElementItems() {
				return VISUAL_ELEMENTS.map(element => ({
					sectionCode: MENU_SECTIONS.ELEMENTS,
					title: this.$Bitrix.Loc.getMessage(element.labelKey),
					subtitle: this.$Bitrix.Loc.getMessage(element.hintKey),
					onClick: () => this.$emit('add:element', element.make())
				}));
			},
			availablePresets() {
				const types = new Set(this.constantConfigurationList.map(configuration => configuration.type));
				return CONSTANT_PRESETS.filter(preset => types.has(preset.constantType));
			},
			presetItems() {
				return this.availablePresets.map(preset => ({
					sectionCode: MENU_SECTIONS.PRESETS,
					title: this.$Bitrix.Loc.getMessage(preset.labelKey),
					subtitle: this.$Bitrix.Loc.getMessage(preset.hintKey),
					onClick: () => {
						this.$emit('create:constant', makePresetConstant(preset, this.generateFriendlyId()));
					}
				}));
			},
			customConstantItem() {
				return {
					sectionCode: MENU_SECTIONS.CUSTOM,
					icon: ui_iconSet_api_core.Outline.PLUS_L,
					title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CUSTOM_CONSTANT_LABEL'),
					subtitle: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CUSTOM_CONSTANT_HINT'),
					onClick: () => {
						this.$emit('create:constant', makeEmptyConstant(this.generateFriendlyId()));
					}
				};
			}
		},
		mounted() {
			main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.closeMenu);
			main_core_events.EventEmitter.subscribe('Bizproc.NodeSettings:onScroll', this.closeMenu);
		},
		unmounted() {
			main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.closeMenu);
			main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:onScroll', this.closeMenu);
		},
		methods: {
			onShowMenu(event) {
				const {
					left = 0,
					top = 0,
					bottom = 0
				} = this.$refs.addElementButton?.getBoundingClientRect() ?? {};

				// A click from Enter/Space carries no click count and no pointer position,
				// so the menu is bound to the button itself instead of the (0, 0) coordinate.
				const isKeyboardActivation = event.detail === 0;
				const freeHeight = calculateFreeHeightAround({
					top,
					bottom
				}, window.innerHeight, MENU_VIEWPORT_GAP);
				this.offsetLeft = isKeyboardActivation ? 0 : Math.abs(event.clientX - left);
				this.menuMaxHeight = freeHeight >= MENU_MIN_HEIGHT ? freeHeight : null;
				this.isMenuShown = true;
			},
			generateFriendlyId() {
				const BASE_NAME = 'Constant';
				let counter = 1;
				let potentialId = `${BASE_NAME}${counter}`;
				while (this.constantIds.has(potentialId)) {
					counter++;
					potentialId = `${BASE_NAME}${counter}`;
				}
				return potentialId;
			},
			// A close often arrives from the very action that has already moved the focus elsewhere:
			// a click into a field of the settings form, a confirmation popup opened from a menu item.
			// Only a focus nobody holds is free to come back to the button.
			isFocusUnclaimed() {
				const {
					activeElement,
					body
				} = document;
				return !activeElement || activeElement === body;
			},
			closeMenu() {
				// Events of the surrounding UI arrive whether the menu is open or not, and every block has
				// its own button: an idle one must not pull the focus away from where the user is.
				if (!this.isMenuShown) {
					return;
				}
				this.isMenuShown = false;

				// While the menu is still on screen the focus belongs to it — a menu item button after
				// Escape or a click. Whether anybody actually wants the focus is only visible once the popup
				// is gone, so the decision waits for the render that removes it: a focus left behind by the
				// popup reads as free, a focus already taken by a field or an editor stays where it is.
				void this.$nextTick(() => {
					if (this.isFocusUnclaimed()) {
						// The air button draws its focus ring on :focus-visible only, so returning the focus
						// stays invisible after a mouse close; preventScroll keeps a scroll-driven close in place.
						this.$refs.addElementButton?.focus({
							preventScroll: true
						});
					}
				});
			}
		},
		template: `
		<button
			ref="addElementButton"
			class="ui-btn --air --wide --style-outline-no-accent ui-btn-no-caps --with-icon bizproc-setuptemplateactivity-add-element-btn"
			type="button"
			data-testid="bizproc-setup-template-add-element-btn"
			aria-haspopup="menu"
			:aria-expanded="isMenuShown"
			@click="onShowMenu"
		>
			<div class="ui-icon-set --plus-l"/>
			<span class="ui-btn-text">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_ITEM') }}
			</span>
			<BMenu
				v-if="isMenuShown"
				:options="menuOptions"
				@close="closeMenu"
			/>
		</button>
	`
	};

	// @vue/component
	const AppHeader = {
		name: 'AppHeader',
		template: `
		<header class="bizproc-setuptemplateactivity-app-header">
			<div class="bizproc-setuptemplateactivity-app-header__title-wrap">
				<h3 class="bizproc-setuptemplateactivity-app-header__title">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_APP_TITLE') }}
				</h3>
				<div class="bizproc-setuptemplateactivity-app-header__preview-btn">
					<slot name="preview-btn"/>
				</div>
			</div>

			<p class="bizproc-setuptemplateactivity-app-header__description">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_HEADER_DESCRIPTION') }}
			</p>
		</header>
	`
	};

	// @vue/component
	const PreviewBtn = {
		name: 'PreviewBtn',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			showPreview: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isFixed: false,
				fixedStyle: {}
			};
		},
		computed: {
			icon() {
				return this.showPreview ? ui_iconSet_api_core.Outline.CROSSED_EYE : ui_iconSet_api_core.Outline.OBSERVER;
			},
			label() {
				return this.showPreview ? this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_HIDE_PREVIEW_BTN_TEXT') : this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_SHOW_PREVIEW_BTN_TEXT');
			}
		},
		mounted() {
			this.scrollContainer = getScrollParent(this.$el);
			if (!this.scrollContainer) {
				return;
			}
			main_core.Dom.style(this.$el, 'minHeight', `${this.$el.offsetHeight}px`);
			main_core.Event.bind(this.scrollContainer, 'scroll', this.handleScroll, {
				passive: true
			});
		},
		beforeUnmount() {
			main_core.Event.unbind(this.scrollContainer, 'scroll', this.handleScroll);
		},
		methods: {
			handleScroll() {
				if (this.isFixed && this.scrollContainer.scrollTop < this.fixScrollTop) {
					this.isFixed = false;
				}
				if (this.isFixed) {
					return;
				}
				const elRect = this.$el.getBoundingClientRect();
				const containerRect = this.scrollContainer.getBoundingClientRect();
				if (elRect.top <= containerRect.top) {
					this.fixScrollTop = this.scrollContainer.scrollTop;
					this.isFixed = true;
					this.fixedStyle = {
						top: `${containerRect.top}px`,
						width: `${this.scrollContainer.offsetWidth}px`
					};
				}
			}
		},
		template: `
		<div class="bizproc-setuptemplateactivity-preview-btn-container">
			<div
				class="bizproc-setuptemplateactivity-preview-btn-wrapper"
				:class="{ '--fixed': isFixed }"
				:style="isFixed ? fixedStyle : {}"
			>
				<button
					class="bizproc-setuptemplateactivity-preview-btn"
					type="button"
				>
					<BIcon
						:name="icon"
						:size="24"
						class="bizproc-setuptemplateactivity-preview-btn__icon"
					/>
					<span class="bizproc-setuptemplateactivity-preview-btn__label">
						{{ label }}
					</span>
				</button>
			</div>
		</div>
	`
	};

	// @vue/component
	const TitleField = {
		name: 'TitleField',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type TitleItem */
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['updateItemProperty', 'delete'],
		setup() {
			return {
				Outline: ui_iconSet_api_core.Outline,
				Main: ui_iconSet_api_core.Main
			};
		},
		methods: {
			onInput(event) {
				const payload = {
					propertyValues: {
						text: event.target.value
					}
				};
				this.$emit('updateItemProperty', payload);
			},
			handleDragStart(event) {
				this.$emit('itemDragStart', {
					event,
					element: this.$el
				});
			}
		},
		template: `
		<div class="bizproc-setuptemplateactivity-field-wrapper">
			<div
				class="bizproc-setuptemplateactivity-field-drag-icon"
				@mousedown.prevent="handleDragStart"
			>
				<BIcon :name="Main.MORE_POINTS" :size="18"/>
			</div>
			<div class="bizproc-setuptemplateactivity-title-field">
				<div class="ui-ctl-container">
					<div class="ui-ctl-top">
						<div class="ui-ctl-title bizproc-setuptemplateactivity-title-field__label">
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL') }}
						</div>
					</div>
					<div class="ui-ctl ui-ctl-w100">
						<input
							:value="item.text"
							class="ui-ctl-element"
							type="text"
							@input="onInput"
						/>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-title-field__controls">
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-title-field__delete-icon"
						@click="$emit('delete')"
					/>
				</div>
			</div>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const DescriptionField = {
		name: 'DescriptionField',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type DescriptionItem */
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['updateItemProperty'],
		setup() {
			return {
				Outline: ui_iconSet_api_core.Outline,
				Main: ui_iconSet_api_core.Main
			};
		},
		methods: {
			onInput(event) {
				const payload = {
					propertyValues: {
						text: event.target.value
					}
				};
				this.$emit('updateItemProperty', payload);
			},
			handleDragStart(event) {
				this.$emit('itemDragStart', {
					event,
					element: this.$el
				});
			}
		},
		template: `
		<div class="bizproc-setuptemplateactivity-field-wrapper">
			<div
				class="bizproc-setuptemplateactivity-field-drag-icon"
				@mousedown.prevent="handleDragStart"
			>
				<BIcon :name="Main.MORE_POINTS" :size="18"/>
			</div>
			<div class="bizproc-setuptemplateactivity-description-feild">
				<div class="ui-ctl-container">
					<div class="ui-ctl-top">
						<div class="ui-ctl-title bizproc-setuptemplateactivity-description-feild__label">
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_LABEL') }}
						</div>
					</div>
					<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
						<textarea
							:value="item.text"
							class="ui-ctl-element"
							rows="4"
							@input="onInput"
						/>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-description-feild__controls">
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-description-feild__delete-icon"
						@click="$emit('delete')"
					/>
				</div>
			</div>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const DelimiterField = {
		name: 'DelimiterField',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type DelimiterItem */
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['updateItemProperty'],
		setup() {
			return {
				Outline: ui_iconSet_api_core.Outline,
				Main: ui_iconSet_api_core.Main
			};
		},
		methods: {
			onSelect(event) {
				const payload = {
					propertyValues: {
						delimiterType: event.target.value
					}
				};
				this.$emit('updateItemProperty', payload);
			},
			handleDragStart(event) {
				this.$emit('itemDragStart', {
					event,
					element: this.$el
				});
			}
		},
		template: `
		<div class="bizproc-setuptemplateactivity-field-wrapper">
			<div
				class="bizproc-setuptemplateactivity-field-drag-icon"
				@mousedown.prevent="handleDragStart"
			>
				<BIcon :name="Main.MORE_POINTS" :size="18"/>
			</div>
			<div class="bizproc-setuptemplateactivity-delimiter-field">
				<div class="ui-ctl-container">
					<div class="ui-ctl-top">
						<div class="ui-ctl-title">
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL') }}
						</div>
					</div>
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select
							:value="item.delimiterType"
							class="ui-ctl-element ui-ctl-w100"
							@change="onSelect"
						>
							<option value="line">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_OPTION_LINE') }}
							</option>
						</select>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-delimiter-field__controls">
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-delimiter-field__delete-icon"
						@click="$emit('delete')"
					/>
				</div>
			</div>
		</div>
	`
	};

	const USER_ENTITY_TYPES = Object.freeze({
		USER: 'user',
		DEPARTMENT: 'structure-node'
	});

	// The editor writes user-constant defaults in bizproc's internal format (`user_5`, `group_hr5` for a
	// flat department, `group_hrr5` for a department subtree). This internal format is accepted by the
	// launch form's value parser and by the backend (CBPHelper::UsersStringToArray). Note that the launch
	// form field itself emits the printable form (`Name[5]`, `Name[HR5]`, `Name[HRR5]`) on user input;
	// the parsers below accept both that printable form and a bare numeric id for backward compatibility.
	const VALUE_PARSERS = [{
		template: /\[hrr(\d+)]$/i,
		format: match => [USER_ENTITY_TYPES.DEPARTMENT, match[1]]
	}, {
		template: /\[hr(\d+)]$/i,
		format: match => [USER_ENTITY_TYPES.DEPARTMENT, `${match[1]}:F`]
	}, {
		template: /\[(\d+)]$/,
		format: match => [USER_ENTITY_TYPES.USER, match[1]]
	}, {
		template: /^group_hrr(\d+)$/i,
		format: match => [USER_ENTITY_TYPES.DEPARTMENT, match[1]]
	}, {
		template: /^group_hr(\d+)$/i,
		format: match => [USER_ENTITY_TYPES.DEPARTMENT, `${match[1]}:F`]
	}, {
		template: /^user_(\d+)$/i,
		format: match => [USER_ENTITY_TYPES.USER, match[1]]
	}, {
		template: /^(\d+)$/,
		format: match => [USER_ENTITY_TYPES.USER, match[1]]
	}];
	function parseUserValue(rawValue) {
		const value = String(rawValue).trim();
		if (!value) {
			return null;
		}
		for (const parser of VALUE_PARSERS) {
			const match = value.match(parser.template);
			if (match) {
				return parser.format(match);
			}
		}

		// Keep an unrecognized legacy value as a user reference instead of dropping it silently.
		return [USER_ENTITY_TYPES.USER, value];
	}
	function normalizeUserValue(modelValue, multiple) {
		if (multiple && main_core.Type.isStringFilled(modelValue)) {
			return modelValue.split(';');
		}
		if (main_core.Type.isArray(modelValue)) {
			return modelValue;
		}
		return modelValue ? [String(modelValue)] : [];
	}
	function buildUserPreselectedItems(modelValue, multiple) {
		return normalizeUserValue(modelValue, multiple).map(element => parseUserValue(element)).filter(Boolean);
	}
	function getUserSelectorEntities() {
		return [{
			id: USER_ENTITY_TYPES.USER,
			options: {
				inviteEmployeeLink: false
			}
		}, {
			id: USER_ENTITY_TYPES.DEPARTMENT,
			options: {
				selectMode: 'usersAndDepartments',
				allowSelectRootDepartment: true,
				allowFlatDepartments: true
			}
		}];
	}

	// Titles resolved so far, keyed by "entityId:id". A miss is cached as null so a value that the
	// provider does not know (deleted user, dropped department) is not re-requested on every redraw.
	const NAME_CACHE = new Map();
	let pendingItems = new Map();
	let pendingWaiters = [];
	let isFlushScheduled = false;
	function getCacheKey(item) {
		const [entityId, id] = item;
		return `${entityId}:${id}`;
	}
	function readFromCache(keys) {
		return keys.map(key => NAME_CACHE.get(key)).filter(Boolean);
	}
	function settleWaiters(waiters) {
		waiters.forEach(({
			keys,
			resolve
		}) => resolve(readFromCache(keys)));
	}
	function createNameDialog(preselectedItems, events) {
		// Headless dialog: never rendered, it only resolves id tokens to titles through the same
		// entity-selector providers the value popup uses. Its constructor starts the load itself.
		return new ui_entitySelector.Dialog({
			context: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_USER_NAMES',
			preselectedItems,
			entities: getUserSelectorEntities(),
			events
		});
	}
	function flushBatch(createDialog) {
		isFlushScheduled = false;
		const items = [...pendingItems.values()];
		const waiters = pendingWaiters;
		pendingItems = new Map();
		pendingWaiters = [];
		if (items.length === 0) {
			settleWaiters(waiters);
			return;
		}
		const dialog = createDialog(items, {
			onLoad: () => {
				items.forEach(item => {
					NAME_CACHE.set(getCacheKey(item), dialog.getItem(item)?.getTitle() ?? null);
				});
				dialog.destroy();
				settleWaiters(waiters);
			},
			onLoadError: () => {
				// Nothing is cached on a failed load, so the next resolve retries instead of
				// freezing an empty title for an id that does exist.
				dialog.destroy();
				settleWaiters(waiters);
			}
		});
	}

	/**
	 * Resolves entity-selector items ([entityId, id] pairs) to human-readable titles.
	 *
	 * Every caller within the same tick shares one dialog load, and already known titles are served
	 * from the cache - so N constant cards cost one request instead of N.
	 *
	 * @param {Array} items preselected items to resolve
	 * @param {Function} [createDialog] dialog factory, overridden in tests
	 * @return {Promise<Array<string>>} titles in the order of the requested items, unknown ones dropped
	 */
	function resolveUserNames(items, createDialog = createNameDialog) {
		const keys = items.map(item => getCacheKey(item));
		if (keys.every(key => NAME_CACHE.has(key))) {
			return Promise.resolve(readFromCache(keys));
		}
		return new Promise(resolve => {
			items.forEach((item, index) => {
				if (!NAME_CACHE.has(keys[index])) {
					pendingItems.set(keys[index], item);
				}
			});
			pendingWaiters.push({
				keys,
				resolve
			});
			if (!isFlushScheduled) {
				isFlushScheduled = true;
				// Microtask: collect every card rendered in the same tick into a single load.
				queueMicrotask(() => flushBatch(createDialog));
			}
		});
	}

	// The label is the only part of a bool value the wizard owns: the value itself and its synonyms
	// live in bizproc.setup-template, so the form of the constant and the launch form never diverge.
	function getBoolValueLabel(value) {
		const key = bizproc_setupTemplate.normalizeBoolValue(value) === bizproc_setupTemplate.BOOL_VALUES.YES ? 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_VALUE_BOOL_YES' : 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_VALUE_BOOL_NO';
		return main_core.Loc.getMessage(key);
	}

	// @vue/component
	const ConstantValueBool = {
		name: 'ConstantValueBool',
		props: {
			modelValue: {
				type: String,
				default: bizproc_setupTemplate.BOOL_VALUES.NO
			}
		},
		emits: ['update:modelValue'],
		setup() {
			return {
				BOOL_VALUES: bizproc_setupTemplate.BOOL_VALUES
			};
		},
		computed: {
			selectedValue() {
				return bizproc_setupTemplate.normalizeBoolValue(this.modelValue);
			}
		},
		methods: {
			handleChange(event) {
				this.$emit('update:modelValue', event.target.value);
			}
		},
		template: `
		<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 ui-ctl-sm">
			<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			<select
				:value="selectedValue"
				class="ui-ctl-element"
				:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE')"
				data-testid="bizproc-setup-template-constant-value-bool"
				@change="handleChange"
			>
				<option :value="BOOL_VALUES.YES">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_VALUE_BOOL_YES') }}
				</option>
				<option :value="BOOL_VALUES.NO">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_VALUE_BOOL_NO') }}
				</option>
			</select>
		</div>
	`
	};

	// @vue/component
	const ConstantField = {
		name: 'ConstantField',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			/** @type ConstantConfiguration[] */
			constantConfigurationList: {
				type: Array,
				required: true
			}
		},
		emits: ['delete', 'updateItemProperty', 'edit', 'itemDragStart'],
		setup() {
			return {
				Outline: ui_iconSet_api_core.Outline,
				Main: ui_iconSet_api_core.Main
			};
		},
		data() {
			return {
				// Human-readable names resolved from the user-constant default tokens (`user_5`, `group_hr3`).
				resolvedUserNames: []
			};
		},
		computed: {
			typeLabel() {
				return this.constantConfigurationList.find(constantConfiguration => constantConfiguration.type === this.item.constantType)?.title ?? this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TYPE_UNSUPPORTED');
			},
			titleWithType() {
				return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TITLE', {
					'#NAME#': this.item.name,
					'#TYPE#': this.typeLabel
				});
			},
			isUserConstant() {
				return this.item.constantType === CONSTANT_TYPES.USER;
			},
			isBoolConstant() {
				return this.item.constantType === CONSTANT_TYPES.BOOL;
			},
			isDateConstant() {
				return [CONSTANT_TYPES.DATE, CONSTANT_TYPES.DATETIME].includes(this.item.constantType);
			},
			/**
			 * User, date and bool values are not plain text: they carry preselected items, a timezone suffix
			 * or the stored Y/N, so the card only shows them and the constant form owns editing. The input is
			 * readonly rather than disabled: the value stays in the Tab order, is read out by a screen reader
			 * and can be selected.
			 */
			isValueReadonly() {
				return this.isUserConstant || this.isDateConstant || this.isBoolConstant;
			},
			displayValue() {
				if (this.isUserConstant) {
					return this.resolvedUserNames.join(', ');
				}
				const value = this.item.default;
				if (this.isBoolConstant) {
					// The stored value stays Y/N, the card shows the human-readable option.
					return main_core.Type.isArray(value) ? value.map(item => getBoolValueLabel(item)).join(', ') : getBoolValueLabel(value);
				}

				// The timezone suffix stays in the stored value, the card shows the date only.
				if (this.isDateConstant) {
					return main_core.Type.isArray(value) ? value.map(item => bizproc_setupTemplate.parseValue(item).text).join(', ') : bizproc_setupTemplate.parseValue(value).text;
				}
				if (main_core.Type.isArray(value)) {
					return value.join(', ');
				}
				return value ?? '';
			}
		},
		watch: {
			'item.default': {
				immediate: true,
				deep: true,
				handler() {
					this.resolveUserNames();
				}
			}
		},
		beforeUnmount() {
			// Invalidate in-flight resolves so a late batch response cannot touch a destroyed component.
			this.resolveGeneration = (this.resolveGeneration ?? 0) + 1;
		},
		methods: {
			async resolveUserNames() {
				// Invalidate any in-flight resolve so a late response cannot overwrite fresh names.
				// The counter is created lazily: the immediate watcher runs before created().
				this.resolveGeneration = (this.resolveGeneration ?? 0) + 1;
				const generation = this.resolveGeneration;
				if (!this.isUserConstant) {
					this.resolvedUserNames = [];
					return;
				}
				const preselectedItems = buildUserPreselectedItems(this.item.default, this.item.multiple);
				if (preselectedItems.length === 0) {
					this.resolvedUserNames = [];
					return;
				}

				// Shared resolver: all cards rendered in the same tick are served by a single dialog load.
				const names = await resolveUserNames(preselectedItems);
				if (generation !== this.resolveGeneration) {
					return;
				}
				this.resolvedUserNames = names;
			},
			onInput(event) {
				const payload = {
					propertyValues: {
						default: event.target.value
					}
				};
				this.$emit('updateItemProperty', payload);
			},
			onEdit() {
				this.$emit('edit');
			},
			handleDragStart(event) {
				this.$emit('itemDragStart', {
					event,
					element: this.$el
				});
			}
		},
		template: `
		<div
			class="bizproc-setuptemplateactivity-field-wrapper"
			:data-testid="'bizproc-setup-template-constant-field-' + item.id"
		>
			<div
				class="bizproc-setuptemplateactivity-field-drag-icon"
				@mousedown.prevent="handleDragStart"
			>
				<BIcon :name="Main.MORE_POINTS" :size="18"/>
			</div>
			<div class="bizproc-setuptemplateactivity-constant-edit">
				<div class="bizproc-setuptemplateactivity-constant-edit__wrap">
					<div class="bizproc-setuptemplateactivity-constant-edit__input-control ui-ctl-container">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">
								{{ titleWithType }}
							</div>
						</div>
						<div class="ui-ctl ui-ctl-w100">
							<input
								:value="displayValue"
								class="ui-ctl-element"
								type="text"
								:readonly="isValueReadonly"
								data-testid="bizproc-setup-template-constant-field-value"
								@input="onInput"
							/>
						</div>
					</div>
					<div class="bizproc-setuptemplateactivity-constant-edit__btn-control">
						<BIcon
							:name="Outline.EDIT_L"
							:size="18"
							class="bizproc-setuptemplateactivity-constant-edit__control-icon"
							data-testid="bizproc-setup-template-constant-field-edit-btn"
							@click="onEdit"
						/>
						<BIcon
							:name="Outline.CROSS_L"
							:size="18"
							class="bizproc-setuptemplateactivity-constant-edit__control-icon"
							data-testid="bizproc-setup-template-constant-field-delete-btn"
							@click="$emit('delete')"
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const TitleIconField = {
		name: 'TitleIconField',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			/** @type TitleWithIconItem */
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['updateItemProperty', 'delete'],
		setup() {
			return {
				Outline: ui_iconSet_api_core.Outline,
				Main: ui_iconSet_api_core.Main
			};
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			currentIconCssClass() {
				return PRESET_TITLE_ICONS[this.item.icon] || PRESET_TITLE_ICONS.IMAGE;
			},
			menuOptions() {
				const menuItems = Object.entries(PRESET_TITLE_ICONS).map(([iconKey, iconClass]) => {
					return {
						icon: iconClass,
						title: ' ',
						onClick: () => this.selectIcon(iconKey)
					};
				});
				return {
					bindElement: this.$refs.iconTrigger,
					cacheable: false,
					angle: true,
					offsetLeft: 25,
					className: 'bizproc-setuptemplateactivity-title-field__icon-menu',
					items: menuItems
				};
			}
		},
		mounted() {
			main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.closeMenu);
			main_core_events.EventEmitter.subscribe('Bizproc.NodeSettings:onScroll', this.closeMenu);
		},
		unmounted() {
			main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.closeMenu);
			main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:onScroll', this.closeMenu);
		},
		methods: {
			onInput(event) {
				const payload = {
					propertyValues: {
						text: event.target.value
					}
				};
				this.$emit('updateItemProperty', payload);
			},
			selectIcon(iconKey) {
				const payload = {
					propertyValues: {
						icon: iconKey
					}
				};
				this.$emit('updateItemProperty', payload);
			},
			handleDragStart(event) {
				this.$emit('itemDragStart', {
					event,
					element: this.$el
				});
			},
			closeMenu() {
				this.isMenuShown = false;
			}
		},
		template: `
		<div class="bizproc-setuptemplateactivity-field-wrapper">
			<div
				class="bizproc-setuptemplateactivity-field-drag-icon"
				@mousedown.prevent="handleDragStart"
			>
				<BIcon :name="Main.MORE_POINTS" :size="18"/>
			</div>
			<div class="bizproc-setuptemplateactivity-title-field">
				<div class="ui-ctl-container">
					<div class="ui-ctl-top">
						<div class="ui-ctl-title bizproc-setuptemplateactivity-title-field__label">
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ICON_TITLE_ITEM_LABEL') }}
						</div>
					</div>
					<div class="bizproc-setuptemplateactivity-title-field__container">
						<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown bizproc-setuptemplateactivity-title-field__icon-selector"
							 @click="isMenuShown = true"
						>
							<div ref="iconTrigger" class="ui-ctl-element">
								<i class="ui-icon-set --custom" :class="'--' + currentIconCssClass"></i>
								<i class="ui-icon-set --chevron-down-m"></i>
							</div>
						</div>
						<div class="ui-ctl ui-ctl-w100">
							<input
								:value="item.text"
								class="ui-ctl-element"
								type="text"
								@input="onInput"
							/>
						</div>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-title-field__controls">
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-title-field__delete-icon"
						@click="$emit('delete')"
					/>
				</div>
				<BMenu
					v-if="isMenuShown"
					:options="menuOptions"
					@close="isMenuShown = false"
				/>
			</div>
		</div>
	`
	};

	/**
	 * Single value the dedicated controls of the constant form work with. The form edits one default
	 * value, while the stored default of a multiple constant may be an array: the wizard never writes
	 * one, but a template built outside it (import, REST, template generator) does, and the array is a
	 * legitimate part of the `default` contract. The first element is taken, the way
	 * Bitrix\Bizproc\BaseType\Date::toSingleValue does it on the server.
	 */
	function toSingleDefaultValue(defaultValue) {
		const value = main_core.Type.isArray(defaultValue) ? defaultValue[0] : defaultValue;
		if (main_core.Type.isString(value)) {
			return value;
		}
		return main_core.Type.isNumber(value) ? String(value) : '';
	}

	const EntitySelectorConstantSettings = {
		name: 'EntitySelectorConstantSettings',
		emits: ['update:modelValue'],
		props: {
			modelValue: {
				type: Object,
				required: true
			},
			/** @type EntitySelectorConstantConfiguration */
			constantConfiguration: {
				type: Object,
				required: true
			}
		},
		computed: {
			selectorId: {
				get() {
					return this.modelValue?.selectorId;
				},
				set(value) {
					const updatedValue = {
						...this.modelValue,
						selectorId: value,
						selector: this.getSelectors().find(selector => selector.id === value)
					};
					this.$emit('update:modelValue', updatedValue);
				}
			}
		},
		methods: {
			getSelectors() {
				return this.constantConfiguration.options.selectors;
			},
			firstSelectorId() {
				return this.getSelectors()[0].id;
			},
			getSelectorIds() {
				return this.getSelectors().map(selector => selector.id);
			}
		},
		mounted() {
			const selectorId = this.modelValue.selectorId;
			if (this.getSelectorIds().includes(selectorId)) {
				return;
			}
			this.selectorId = this.firstSelectorId();
		},
		template: `
		<div class="ui-ctl-container">
			<div class="ui-ctl-top">
				<label class="ui-ctl-title">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_SETTINGS_ENTITY_SELECTOR_PROVIDER') }}
				</label>
			</div>
			<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select
					v-model="selectorId"
					class="ui-ctl-element"
				>
					<option
						v-for="selector in getSelectors()"
						:value="selector.id"
					>
						{{ selector.title }}
					</option>
				</select>
			</div>
		</div>
	`
	};

	// @vue/component
	const ConstantValueUser = {
		name: 'ConstantValueUser',
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			multiple: {
				type: Boolean,
				default: false
			},
			modelValue: {
				type: [String, Array],
				default: ''
			}
		},
		emits: ['update:modelValue'],
		watch: {
			multiple() {
				this.reinitializeSelector();
			}
		},
		mounted() {
			this.initializeSelector();
		},
		beforeUnmount() {
			this.destroySelector();
		},
		methods: {
			syncValue() {
				if (!this.tagSelector) {
					return;
				}
				const newValues = this.tagSelector.getTags().map(tag => {
					const rawId = tag.getId();
					const entityId = tag.getEntityId();
					if (entityId === USER_ENTITY_TYPES.USER) {
						return `user_${rawId}`;
					}
					if (entityId === USER_ENTITY_TYPES.DEPARTMENT) {
						if (main_core.Type.isString(rawId) && rawId.endsWith(':F')) {
							return `group_hr${rawId.replace(':F', '')}`;
						}
						return `group_hrr${rawId}`;
					}
					return null;
				}).filter(Boolean);
				if (this.multiple) {
					// Multiple values are stored as an array - same shape the launch form
					// (ConstantComponent.getCurrentConstantValue) and other multiple constant
					// fields (entity-selector) expect for preselect.
					this.$emit('update:modelValue', newValues);
				} else {
					this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : '');
				}
			},
			getPreselectedItems() {
				return this.normalizeModelValue().map(element => this.parseValue(element)).filter(Boolean);
			},
			normalizeModelValue() {
				return normalizeUserValue(this.modelValue, this.multiple);
			},
			parseValue(rawValue) {
				return parseUserValue(rawValue);
			},
			destroySelector() {
				if (this.tagSelector) {
					this.tagSelector.getDialog().destroy();
					this.tagSelector = null;
				}
			},
			reinitializeSelector() {
				this.destroySelector();
				if (this.$refs.container) {
					this.$refs.container.innerHTML = '';
				}
				this.initializeSelector();
			},
			initializeSelector() {
				this.tagSelector = new ui_entitySelector.TagSelector({
					multiple: this.multiple,
					showCreateButton: false,
					dialogOptions: {
						context: `BIZPROC_SETUP_TEMPLATE_ACTIVITY_USER_SELECTOR_${this.item.id}`,
						preselectedItems: this.getPreselectedItems(),
						popupOptions: {
							className: 'bizproc-setuptemplateactivity-no-tabs-selector-popup'
						},
						width: 500,
						entities: getUserSelectorEntities(),
						multiple: this.multiple,
						showAvatars: true,
						dropdownMode: true,
						compactView: true,
						height: 250
					},
					addButtonCaption: main_core.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_ADD_USER'),
					events: {
						onAfterTagAdd: this.syncValue,
						onAfterTagRemove: this.syncValue
					}
				});
				this.tagSelector.renderTo(this.$refs.container);

				// In dropdownMode the dialog loads lazily on first open, so preselected items stay
				// unresolved (shown as a "hidden" placeholder) until the user opens it. Force the load
				// now so they render as tags immediately, including when a saved constant is reopened.
				if (this.getPreselectedItems().length > 0) {
					this.tagSelector.getDialog()?.load();
				}
			}
		},
		template: `
		<div ref="container" data-testid="bizproc-setup-template-constant-value-user"></div>
	`
	};

	const EXTENSION_NAME = 'bizproc.setup-template-activity';

	// A constant is filled in for the server or for the user, so the module-wide zone list is narrowed
	// to these two and titled with the phrases of the constant form.
	const TIMEZONE_TITLES = new Map([['', 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TIMEZONE_SERVER'], ['current', 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TIMEZONE_USER']]);
	let offeredTimezones = null;

	/**
	 * Narrowing the module-wide zone list gives the same two zones for the whole page, so it is done
	 * once: the constant form is reopened for every constant.
	 */
	function getTimezones() {
		offeredTimezones ??= Object.freeze(main_core.Extension.getSettings(EXTENSION_NAME).get('timezones', []).filter(zone => TIMEZONE_TITLES.has(zone.value)).map(zone => ({
			...zone,
			text: main_core.Loc.getMessage(TIMEZONE_TITLES.get(zone.value))
		})));
		return offeredTimezones;
	}

	// @vue/component
	const ConstantValueDate = {
		name: 'ConstantValueDate',
		props: {
			modelValue: {
				type: String,
				default: ''
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				pickedDate: null
			};
		},
		computed: {
			dateText() {
				return bizproc_setupTemplate.formatDate(this.pickedDate);
			}
		},
		// No `watch modelValue` here, unlike the same control of the launch form: the default value of a
		// constant is replaced only by a change of its type, and that change recreates the control.
		created() {
			this.datePicker = null;
			// A date has no timezone control, but a value saved with one still has to show its date.
			this.pickedDate = bizproc_setupTemplate.createDateFromText(bizproc_setupTemplate.parseValue(this.modelValue).text);
		},
		beforeUnmount() {
			this.datePicker?.destroy();
			this.datePicker = null;
		},
		methods: {
			handleInputKeydown(event) {
				if (bizproc_setupTemplate.isPickerOpenKey(event)) {
					event.preventDefault();
					this.openDatePicker();
				}
			},
			openDatePicker() {
				const input = this.$refs.dateInput;
				if (!input) {
					return;
				}
				if (this.datePicker === null) {
					this.datePicker = bizproc_setupTemplate.createBoundPicker({
						input,
						pickerId: 'day',
						onSelect: this.handleDateSelect,
						pickerOptions: {
							type: 'date',
							selectedDates: this.pickedDate === null ? [] : [this.pickedDate]
						}
					});
				}
				this.datePicker.show();
			},
			handleDateSelect() {
				// The callback is deferred, so by the time it runs the picker may be gone: the form was
				// closed or the value was replaced from outside.
				if (!this.datePicker) {
					return;
				}
				const selectedDate = this.datePicker.getSelectedDate();
				if (!main_core.Type.isDate(selectedDate)) {
					return;
				}
				this.pickedDate = selectedDate;
				this.$emit('update:modelValue', bizproc_setupTemplate.serializeValue(selectedDate));
			}
		},
		template: `
		<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100 ui-ctl-sm">
			<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
			<input
				ref="dateInput"
				:value="dateText"
				type="text"
				class="ui-ctl-element"
				:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE')"
				:placeholder="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DATE_PLACEHOLDER')"
				readonly
				data-testid="bizproc-setup-template-constant-value-date"
				@click="openDatePicker"
				@keydown="handleInputKeydown"
			/>
		</div>
	`
	};

	const TIME_PICKER_OPTIONS = Object.freeze({
		type: 'time',
		timePickerStyle: 'wheel',
		amPmMode: false,
		minuteStep: 5
	});

	// @vue/component
	const ConstantValueDateTime = {
		name: 'ConstantValueDateTime',
		props: {
			modelValue: {
				type: String,
				default: ''
			}
		},
		emits: ['update:modelValue', 'dateMissingChange'],
		data() {
			return {
				pickedDate: null,
				pickedTime: null,
				timezoneValue: '',
				timezones: []
			};
		},
		computed: {
			dateText() {
				return bizproc_setupTemplate.formatDate(this.pickedDate);
			},
			timeText() {
				return bizproc_setupTemplate.formatDate(this.pickedTime, bizproc_setupTemplate.VALUE_FORMATS.TIME);
			},
			timezone() {
				return this.timezones.find(zone => zone.value === this.timezoneValue) ?? null;
			},
			/**
			 * Date and time are picked separately, so they are merged here.
			 * A date without a time means midnight; a time without a date is not a value yet.
			 */
			pickedDateTime() {
				if (!main_core.Type.isDate(this.pickedDate)) {
					return null;
				}
				const dateTime = new Date(this.pickedDate.getTime());
				dateTime.setUTCHours(this.pickedTime?.getUTCHours() ?? 0, this.pickedTime?.getUTCMinutes() ?? 0, 0, 0);
				return dateTime;
			},
			/**
			 * A time picked with no date shows in the field but is not a value yet, so the form of the
			 * constant is told about it and asks for the date when the constant is saved.
			 */
			isDateMissing() {
				return !main_core.Type.isDate(this.pickedDate) && main_core.Type.isDate(this.pickedTime);
			}
		},
		// Unlike the same control of the launch form, `modelValue` is deliberately not watched here: the
		// default value of a constant is replaced only by a change of its type, and that change recreates
		// the control.
		watch: {
			isDateMissing: {
				handler(isDateMissing) {
					this.$emit('dateMissingChange', isDateMissing);
				},
				immediate: true
			}
		},
		created() {
			this.datePicker = null;
			this.timePicker = null;
			this.timezones = getTimezones();
			const {
				text,
				timezone
			} = bizproc_setupTemplate.parseValue(this.modelValue, this.timezones);
			const storedDateTime = bizproc_setupTemplate.createDateFromText(text);
			this.pickedDate = storedDateTime;
			this.pickedTime = storedDateTime;
			this.timezoneValue = timezone?.value ?? '';
		},
		beforeUnmount() {
			this.datePicker?.destroy();
			this.timePicker?.destroy();
			this.datePicker = null;
			this.timePicker = null;
		},
		methods: {
			handleDateInputKeydown(event) {
				if (bizproc_setupTemplate.isPickerOpenKey(event)) {
					event.preventDefault();
					this.openDatePicker();
				}
			},
			handleTimeInputKeydown(event) {
				if (bizproc_setupTemplate.isPickerOpenKey(event)) {
					event.preventDefault();
					this.openTimePicker();
				}
			},
			openDatePicker() {
				if (!this.$refs.dateInput) {
					return;
				}
				if (this.datePicker === null) {
					this.datePicker = bizproc_setupTemplate.createBoundPicker({
						input: this.$refs.dateInput,
						pickerId: 'day',
						onSelect: this.handleDateSelect,
						pickerOptions: {
							type: 'date',
							selectedDates: this.pickedDate === null ? [] : [this.pickedDate]
						}
					});
				}
				this.datePicker.show();
			},
			openTimePicker() {
				if (!this.$refs.timeInput) {
					return;
				}
				if (this.timePicker === null) {
					this.timePicker = bizproc_setupTemplate.createBoundPicker({
						input: this.$refs.timeInput,
						pickerId: 'time',
						onSelect: this.handleTimeSelect,
						pickerOptions: {
							...TIME_PICKER_OPTIONS,
							selectedDates: this.pickedTime === null ? [] : [this.pickedTime]
						}
					});
				}
				this.timePicker.show();
			},
			handleDateSelect() {
				// The callback is deferred, so by the time it runs the picker may be gone: the form was
				// closed or the value was replaced from outside.
				if (!this.datePicker) {
					return;
				}
				const selectedDate = this.datePicker.getSelectedDate();
				if (!main_core.Type.isDate(selectedDate)) {
					return;
				}
				this.pickedDate = selectedDate;
				// A date picked with no time is midnight, and the time control shows it instead of staying empty.
				this.pickedTime ??= this.pickedDateTime;
				this.emitValue();
			},
			handleTimeSelect() {
				if (!this.timePicker) {
					return;
				}
				const selectedTime = this.timePicker.getSelectedDate() ?? this.timePicker.getFocusDate();
				if (!main_core.Type.isDate(selectedTime)) {
					return;
				}
				this.pickedTime = selectedTime;
				this.emitValue();
			},
			handleTimezoneChange(event) {
				this.timezoneValue = event.target.value;
				this.emitValue();
			},
			emitValue() {
				this.$emit('update:modelValue', bizproc_setupTemplate.serializeValue(this.pickedDateTime, {
					timezone: this.timezone,
					isDateTime: true
				}));
			}
		},
		template: `
		<div
			class="bizproc-setuptemplateactivity-constant-value-datetime"
			role="group"
			:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE')"
			data-testid="bizproc-setup-template-constant-value-datetime"
		>
			<div class="bizproc-setuptemplateactivity-constant-value-datetime__pickers">
				<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100 ui-ctl-sm">
					<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
					<input
						ref="dateInput"
						:value="dateText"
						type="text"
						class="ui-ctl-element"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DATE_PLACEHOLDER')"
						readonly
						data-testid="bizproc-setup-template-constant-value-datetime-date"
						@click="openDatePicker"
						@keydown="handleDateInputKeydown"
					/>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100 ui-ctl-sm">
					<div class="ui-ctl-after ui-ctl-icon-clock"></div>
					<input
						ref="timeInput"
						:value="timeText"
						type="text"
						class="ui-ctl-element"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TIME_PLACEHOLDER')"
						readonly
						data-testid="bizproc-setup-template-constant-value-datetime-time"
						@click="openTimePicker"
						@keydown="handleTimeInputKeydown"
					/>
				</div>
			</div>
			<div
				v-if="timezones.length > 0"
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 ui-ctl-sm"
			>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select
					:value="timezoneValue"
					class="ui-ctl-element"
					:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TIMEZONE_LABEL')"
					data-testid="bizproc-setup-template-constant-value-datetime-timezone"
					@change="handleTimezoneChange"
				>
					<option
						v-for="zone in timezones"
						:key="zone.value"
						:value="zone.value"
					>
						{{ zone.text }}
					</option>
				</select>
			</div>
		</div>
	`
	};

	const CONSTANT_SETTINGS_COMPONENT = Object.freeze({
		[CONSTANT_TYPES.ENTITY_SELECTOR]: EntitySelectorConstantSettings
	});

	// Types whose default value is edited by a dedicated control instead of the plain text input.
	const CONSTANT_VALUE_COMPONENT = Object.freeze({
		[CONSTANT_TYPES.BOOL]: ConstantValueBool,
		[CONSTANT_TYPES.DATE]: ConstantValueDate,
		[CONSTANT_TYPES.DATETIME]: ConstantValueDateTime
	});
	// @vue/component
	const EditConstantPopupForm = {
		name: 'EditConstantPopupForm',
		components: {
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			TextXs: ui_system_typography_vue.TextXs,
			EntitySelectorConstantSettings,
			ConstantValueUser
		},
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			/** @type ConstantConfiguration[] */
			constantConfigurationList: {
				type: Array,
				required: true
			},
			isCreation: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:item', 'cancel', 'update:changed'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			const options = this.convertMapToOptionsModelArray(this.item.options);
			return {
				id: this.item.id,
				name: this.item.name,
				constantType: this.item.constantType,
				multiple: this.item.multiple,
				description: this.item.description,
				defaultValue: this.item.default,
				options,
				settings: this.item.settings,
				required: this.item.required,
				initialOptionsSnapshot: JSON.stringify(options),
				isDateMissing: false,
				errors: {
					id: '',
					name: '',
					value: '',
					options: options.map(() => '')
				}
			};
		},
		computed: {
			isSelectType() {
				return this.constantType === CONSTANT_TYPES.SELECT;
			},
			isEntitySelector() {
				return this.constantType === CONSTANT_TYPES.ENTITY_SELECTOR;
			},
			isUserType() {
				return this.constantType === CONSTANT_TYPES.USER;
			},
			submitButtonText() {
				const key = this.isCreation ? 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_ADD' : 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_EDIT';
				return this.$Bitrix.Loc.getMessage(key);
			},
			isChanged() {
				return this.id !== this.item.id || this.name !== this.item.name || this.constantType !== this.item.constantType || this.multiple !== this.item.multiple || this.required !== this.item.required || this.description !== this.item.description || (this.isUserType ? JSON.stringify(normalizeUserValue(this.defaultValue, this.multiple)) !== JSON.stringify(normalizeUserValue(this.item.default, this.item.multiple)) : this.defaultValue !== this.item.default) || JSON.stringify(this.options) !== this.initialOptionsSnapshot;
			},
			errorMessages() {
				return {
					required: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_LABEL_REQUIRED'),
					idFormat: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_FORMAT'),
					idUnique: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_UNIQUE'),
					optionUnique: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_OPTION_UNIQUE'),
					dateRequired: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_DATE_REQUIRED')
				};
			},
			constantValueComponent() {
				return CONSTANT_VALUE_COMPONENT[this.constantType] ?? null;
			},
			/**
			 * The controls above edit a single value, so an array default of a multiple constant is shown
			 * by its first element instead of leaving the control blank; editing replaces the whole
			 * default, the way the plain text input of any other type does.
			 */
			scalarDefaultValue: {
				get() {
					return toSingleDefaultValue(this.defaultValue);
				},
				set(value) {
					this.defaultValue = value;
				}
			},
			constantSettingsComponent() {
				const types = this.constantConfigurationList.map(constant => constant.type);
				if (!types.includes(this.constantType)) {
					return null;
				}
				return CONSTANT_SETTINGS_COMPONENT[this.constantType];
			},
			currentConstantConfiguration() {
				return this.constantConfigurationList.find(constantConfiguration => constantConfiguration.type === this.constantType);
			}
		},
		watch: {
			constantType() {
				this.options = [];
				this.defaultValue = '';
				this.isDateMissing = false;
				this.errors.value = '';
			},
			multiple(value) {
				if (!this.isUserType) {
					return;
				}

				// Keep defaultValue in sync with the multiple flag without discarding the user's choice:
				// scalar -> array on enable, array -> first element (or empty string) on disable. Matches
				// how ConstantValueUser.syncValue emits (single -> string, multiple -> array).
				const normalized = normalizeUserValue(this.defaultValue, value);
				this.defaultValue = value ? normalized : normalized[0] ?? '';
			},
			isChanged(value) {
				this.$emit('update:changed', value);
			}
		},
		mounted() {
			this.resetUnsupportedType();
		},
		methods: {
			onAddOption() {
				const optionLabel = this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_LABEL');
				this.options.push({
					value: '',
					name: `${optionLabel} ${this.options.length + 1}`
				});
				this.errors.options.push('');
			},
			onDeleteOption(index) {
				this.options.splice(index, 1);
				this.errors.options.splice(index, 1);
			},
			validateName() {
				this.errors.name = '';
				if (!main_core.Type.isStringFilled(this.name.trim())) {
					this.errors.name = this.errorMessages.required;
					return false;
				}
				return true;
			},
			validateId() {
				this.errors.id = '';
				const id = this.id.trim();
				if (!main_core.Type.isStringFilled(id)) {
					this.errors.id = this.errorMessages.required;
					return false;
				}
				if (!/^[A-Za-z]\w*$/.test(id)) {
					this.errors.id = this.errorMessages.idFormat;
					return false;
				}
				return true;
			},
			getOptionValue(option) {
				const value = option.value.trim();
				return main_core.Type.isStringFilled(value) ? value : option.name.trim();
			},
			validateOption(index) {
				const name = this.options[index].name.trim();
				this.errors.options[index] = '';
				if (!main_core.Type.isStringFilled(name)) {
					this.errors.options[index] = this.errorMessages.required;
					return false;
				}
				const value = this.getOptionValue(this.options[index]);
				for (const [optionKey, option] of this.options.entries()) {
					if (optionKey !== index && this.getOptionValue(option) === value) {
						this.errors.options[index] = this.errorMessages.optionUnique;
						return false;
					}
				}
				return true;
			},
			validateOptions() {
				if (this.constantType !== CONSTANT_TYPES.SELECT) {
					return true;
				}
				let errorsCount = 0;
				this.errors.options = [];
				this.options.forEach((option, index) => {
					if (this.validateOption(index)) {
						this.errors.options[index] = '';
					} else {
						errorsCount += 1;
					}
				});
				return errorsCount === 0;
			},
			resetErrors() {
				this.errors = {
					id: '',
					name: '',
					value: '',
					options: []
				};
			},
			onDateMissingChange(isDateMissing) {
				this.isDateMissing = isDateMissing;
				if (!isDateMissing) {
					this.errors.value = '';
				}
			},
			/**
			 * A time picked with no date is not a value: the control publishes an empty default, so the
			 * constant would be saved without the time the form still shows. The date is asked for whether
			 * or not the constant is required — the same rule the launch form follows.
			 */
			validateDefaultValue() {
				this.errors.value = '';
				if (this.isDateMissing) {
					this.errors.value = this.errorMessages.dateRequired;
					return false;
				}
				return true;
			},
			onSave() {
				const isValid = [this.validateId(), this.validateName(), this.validateOptions(), this.validateDefaultValue()].every(value => value);
				if (!isValid) {
					return;
				}
				const setUniqueError = () => {
					this.errors.id = this.errorMessages.idUnique;
				};
				this.$emit('update:item', {
					propertyValues: {
						...this.item,
						id: this.id.trim(),
						name: this.name,
						description: this.description,
						constantType: this.constantType,
						multiple: this.multiple,
						options: this.convertOptionModelsToMap(this.options),
						settings: this.settings,
						default: this.defaultValue,
						required: this.required
					},
					setError: setUniqueError
				});
			},
			onCancel() {
				this.$emit('cancel');
			},
			convertMapToOptionsModelArray(options) {
				const models = [];
				Object.entries(options).forEach(([value, name]) => {
					if (main_core.Type.isStringFilled(value)) {
						models.push({
							value,
							name
						});
					}
				});
				return models;
			},
			convertOptionModelsToMap(models) {
				const options = {};
				for (const model of models) {
					const value = this.getOptionValue(model);
					if (main_core.Type.isStringFilled(value)) {
						options[value] = model.name.trim();
					}
				}
				return options;
			},
			resetUnsupportedType() {
				const types = this.constantConfigurationList.map(constant => constant.type);
				if (!types.includes(this.constantType)) {
					this.constantType = types[0];
				}
			}
		},
		template: `
		<div
			class="bizproc-setuptemplateactivity-edit-constant-popup"
			data-testid="bizproc-setup-template-constant-editor"
		>
			<div class="bizproc-setuptemplateactivity-edit-constant-popup__content">
				<div class="bizproc-setuptemplateactivity-edit-constant-popup__block">
					<div class="ui-ctl-container">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_NAME_VALUE') }}
							</div>
						</div>
						<div class="ui-ctl ui-ctl-w100 ui-ctl-sm">
							<input
								v-model="name"
								class="ui-ctl-element"
								:class="{ '--error': errors.name !== '' }"
								type="text"
								data-testid="bizproc-setup-template-constant-edit-name-input"
								@blur="validateName"
							/>
						</div>
						<div
							v-if="errors.name"
							class="ui-ctl-label-text-error">
							{{ errors.name }}
						</div>
					</div>

					<div class="ui-ctl-container">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_ID_LABEL') }}
							</div>
						</div>
						<div class="ui-ctl ui-ctl-w100 ui-ctl-sm">
							<input
								v-model="id"
								class="ui-ctl-element"
								:class="{ '--error': errors.id !== '' }"
								type="text"
								:disabled="!isCreation"
								data-testid="bizproc-setup-template-constant-edit-id-input"
								@blur="validateId"
							/>
						</div>
						<div
							v-if="errors.id"
							class="ui-ctl-label-text-error"
						>
							{{ errors.id }}
						</div>
					</div>
					<div class="ui-ctl-container">
						<div class="ui-ctl-top">
							<label class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TYPE_LABEL') }}
							</label>
						</div>
						<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 ui-ctl-sm">
							<div class="ui-ctl-after ui-ctl-icon-angle"></div>
							<select
								v-model="constantType"
								class="ui-ctl-element"
								data-testid="bizproc-setup-template-constant-edit-type-select"
							>
								<option
									v-for="constantConfiguration in constantConfigurationList"
									:key="constantConfiguration.type"
									:value="constantConfiguration.type"
								>
									{{ constantConfiguration.title }}
								</option>
							</select>
						</div>
					</div>
					<template v-if="constantSettingsComponent">
						<component
							:is="constantSettingsComponent"
							:constantConfiguration="currentConstantConfiguration"
							v-model="settings"
						/>
					</template>
					<div class="ui-ctl-container">
						<label class="ui-ctl ui-ctl-checkbox ui-ctl-xs">
							<input
								v-model="multiple"
								type="checkbox"
								class="ui-ctl-element"
								data-testid="bizproc-setup-template-constant-edit-multiple-checkbox"
							/>
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_LABEL') }}
						</label>
						<label class="ui-ctl ui-ctl-checkbox ui-ctl-xs">
							<input
								v-model="required"
								type="checkbox"
								class="ui-ctl-element"
								data-testid="bizproc-setup-template-constant-edit-required-checkbox"
							/>
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_LABEL') }}
						</label>
					</div>
					<div
						class="ui-ctl-container"
						v-if="!isEntitySelector && !isUserType"
						:data-testid="constantValueComponent ? 'bizproc-setup-template-constant-edit-value-control' : null"
					>
						<div class="ui-ctl-top">
							<label class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE') }}
							</label>
						</div>
						<component
							:is="constantValueComponent"
							v-if="constantValueComponent"
							v-model="scalarDefaultValue"
							@dateMissingChange="onDateMissingChange"
						/>
						<div v-else class="ui-ctl ui-ctl-w100 ui-ctl-sm">
							<input
								v-model="defaultValue"
								class="ui-ctl-element"
								type="text"
								data-testid="bizproc-setup-template-constant-edit-value-input"
							/>
						</div>
						<div
							v-if="errors.value"
							class="ui-ctl-label-text-error"
							role="alert"
							data-testid="bizproc-setup-template-constant-edit-value-error"
						>
							{{ errors.value }}
						</div>
					</div>

					<div
						class="ui-ctl-container"
						v-if="isUserType"
						data-testid="bizproc-setup-template-constant-edit-value-user"
					>
						<div class="ui-ctl-top">
							<label class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE') }}
							</label>
						</div>
						<ConstantValueUser
							:item="item"
							:multiple="multiple"
							v-model="defaultValue"
						/>
					</div>

					<template v-if="isSelectType">
							<div
								v-for="(option, index) in options"
								:key="index"
								class="bizproc-setuptemplateactivity-edit-constant-popup__option"
							>
								<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-fields">
									<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-bracket" aria-hidden="true"></div>
									<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-fields-inner">
										<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-field">
											<TextXs className="bizproc-setuptemplateactivity-edit-constant-popup__option-field-label">
												{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_NAME_LABEL') }}
											</TextXs>
											<div
												class="bizproc-setuptemplateactivity-edit-constant-popup__option-field-control"
												:class="{ '--error': errors.options[index] !== '' }"
											>
												<input
													v-model="option.name"
													class="bizproc-setuptemplateactivity-edit-constant-popup__option-field-input"
													type="text"
													:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_NAME_LABEL')"
													:aria-invalid="errors.options[index] !== ''"
													:aria-describedby="errors.options[index] ? ('bizproc-setuptemplateactivity-option-error-' + index) : null"
													@blur="validateOption(index)"
												/>
											</div>
										</div>
										<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-field">
											<TextXs className="bizproc-setuptemplateactivity-edit-constant-popup__option-field-label">
												{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_VALUE_LABEL') }}
											</TextXs>
											<div class="bizproc-setuptemplateactivity-edit-constant-popup__option-field-control">
												<input
													v-model="option.value"
													class="bizproc-setuptemplateactivity-edit-constant-popup__option-field-input"
													type="text"
													:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_VALUE_LABEL')"
													:aria-invalid="errors.options[index] !== ''"
													:aria-describedby="errors.options[index] ? ('bizproc-setuptemplateactivity-option-error-' + index) : null"
													@blur="validateOption(index)"
												/>
											</div>
										</div>
										<div
											v-if="errors.options[index]"
											:id="'bizproc-setuptemplateactivity-option-error-' + index"
											class="ui-ctl-label-text-error"
											role="alert"
										>
											{{ errors.options[index] }}
										</div>
									</div>
								</div>
								<button
									type="button"
									class="bizproc-setuptemplateactivity-edit-constant-popup__option-delete"
									:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DELETE_OPTION')"
									@click="onDeleteOption(index)"
								>
									<BIcon :name="Outline.CROSS_L" :color="'var(--ui-color-base-4)'" :size="20"/>
								</button>
							</div>
						</template>

					<div
						v-if="isSelectType"
						class="ui-ctl-container"
					>
						<button
							class="ui-btn --air --wide --style-outline-no-accent ui-btn-no-caps"
							type="button"
							@click="onAddOption"
						>
							<div class="ui-icon-set --plus-l"/>
							<span class="ui-btn-text">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_ADD_OPTION_BTN') }}
							</span>
						</button>
					</div>

					<div class="ui-ctl-container">
						<div class="ui-ctl-top">
							<label class="ui-ctl-title">
								{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DESCRIPTION') }}
							</label>
						</div>
						<div class="ui-ctl ui-ctl-textarea ui-ctl-w100 ui-ctl-sm">
							<textarea
								v-model="description"
								class="ui-ctl-element"
								type="text"
								data-testid="bizproc-setup-template-constant-edit-description-input"
							/>
						</div>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-edit-constant-popup__footer">
					<UiButton
						:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_CANCEL')"
						:style="AirButtonStyle.OUTLINE"
						:size="ButtonSize.MEDIUM"
						:dataset="{ testid: 'bizproc-setup-template-constant-edit-cancel-btn' }"
						@click="onCancel"
					/>
					<UiButton
						:text="submitButtonText"
						:size="ButtonSize.MEDIUM"
						:dataset="{ testid: 'bizproc-setup-template-constant-edit-save-btn' }"
						@click="onSave"
					/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const PreviewLayout = {
		name: 'PreviewLayout',
		template: `
		<div class="bizproc-setuptemplateactivity-preview-layout">
			<div class="bizproc-setuptemplateactivity-preview-layout__container">
				<div class="bizproc-setuptemplateactivity-preview-layout__header">
					<slot name="header"/>
				</div>

				<div class="bizproc-setuptemplateactivity-preview-layout__content">
					<slot/>
				</div>
			</div>

			<div class="bizproc-setuptemplateactivity-preview-layout__footer">
				<slot name="footer"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const PreviewHeader = {
		name: 'PreviewHeader',
		template: `
		<header class="bizproc-setuptemplateactivity-preview-header">
			<h3 class="bizproc-setuptemplateactivity-preview-header__title">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PREVIEW_HEADER_TITLE') }}
				<span class="bizproc-setuptemplateactivity-preview-header__tag-preview">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PREVIEW_HEADER_TAG') }}
				</span>
			</h3>
			<div class="bizproc-setuptemplateactivity-preview-header__line"></div>
		</header>
	`
	};

	// @vue/component
	const PreviewBlock = {
		name: 'PreviewBlock',
		props: {
			isEmpty: {
				type: Boolean,
				default: false
			}
		},
		template: `
		<div
			class="bizproc-setuptemplateactivity-preview-block"
			:class="{ '--empty': isEmpty }"
		>
			<slot/>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const PreviewApp = {
		name: 'PreviewApp',
		components: {
			UiButton: ui_vue3_components_button.Button,
			PreviewLayout,
			PreviewHeader,
			PreviewBlock,
			FormElement: bizproc_setupTemplate.FormElement
		},
		props: {
			/** @type Array<Block> */
			blocks: {
				type: Array,
				default: () => []
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
			formData() {
				return this.blocks.reduce((acc, block) => {
					const items = block.items.reduce((accItems, item) => {
						if (item.itemType === ITEM_TYPES.CONSTANT) {
							accItems[item.id] = item.default ?? '';
							return accItems;
						}
						return accItems;
					}, {});
					return {
						...acc,
						...items
					};
				}, {});
			}
		},
		methods: {
			/**
			 * The preview is a picture of the form, not the form itself, but the `disabled` prop below is
			 * not declared by the field chain and only lands on the row element. A date or time field
			 * carries a real picker, so activating its row would open the picker and change the shown
			 * value. Only such a row is caught: everything the other fields do stays in the preview
			 * anyway (`formData` is a computed without a setter), and swallowing their events would take
			 * the space bar out of a text field and the toggling out of a radio.
			 */
			isPickerRow(event) {
				return main_core.Type.isElementNode(event.target) && main_core.Type.isDomNode(event.target.closest(bizproc_setupTemplate.PICKER_ROW_SELECTOR));
			},
			suppressActivation(event) {
				if (!this.isPickerRow(event)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
			},
			suppressKeyActivation(event) {
				if (bizproc_setupTemplate.isPickerOpenKey(event)) {
					this.suppressActivation(event);
				}
			}
		},
		template: `
		<PreviewLayout>
			<template #header>
				<PreviewHeader/>
			</template>

			<template #default>
				<PreviewBlock
					v-for="block in blocks"
					:key="block.id"
					:isEmpty="block.items.length === 0"
				>
					<template #default>
						<FormElement
							v-for="item in block.items"
							:key="item.id"
							:item="item"
							:formData="formData"
							:disabled="true"
							:errors="{}"
							@click.capture="suppressActivation"
							@keydown.capture="suppressKeyActivation"
						/>
					</template>
				</PreviewBlock>
			</template>

			<template #footer>
				<UiButton
					:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PREVIEW_RUN_BTN')"
					:disabled="true"
					:size="ButtonSize.LARGE"
				/>
				<UiButton
					:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PREVIEW_CANCEL_BTN')"
					:disabled="true"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.LARGE"
				/>
			</template>
		</PreviewLayout>
	`
	};

	const ACTIVITY_NAME = 'SetupTemplateActivity';
	const ELEMENT_COMPONENTS = {
		[ITEM_TYPES.TITLE]: TitleField,
		[ITEM_TYPES.TITLE_WITH_ICON]: TitleIconField,
		[ITEM_TYPES.DESCRIPTION]: DescriptionField,
		[ITEM_TYPES.DELIMITER]: DelimiterField,
		[ITEM_TYPES.CONSTANT]: ConstantField
	};
	// @vue/component
	const BlocksAppComponent = {
		name: 'BlocksAppComponent',
		components: {
			BlockComponent,
			AddBlockBtn,
			AddElementBtn,
			AppHeader,
			PreviewBtn,
			TitleField,
			TitleIconField,
			DescriptionField,
			DelimiterField,
			ConstantField,
			PreviewApp,
			EditConstantPopupForm
		},
		props: {
			serializedBlocks: {
				type: [String, null],
				required: true
			},
			/** @type ConstantConfiguration[] */
			constantConfigurationList: {
				type: Array,
				required: true
			},
			globalConstants: {
				type: Object,
				required: false,
				default: () => ({})
			}
		},
		data() {
			return {
				blocks: JSON.parse(this.serializedBlocks) ?? [],
				isShowPreview: false,
				initialConstantIds: new Set(),
				editingConstant: null,
				isEditingFormChanged: false
			};
		},
		computed: {
			formValue() {
				return JSON.stringify(this.blocks);
			},
			preparedBlocks() {
				return this.blocks.map((block, index) => {
					const items = block.items.map(item => {
						if (!item.text && item.itemType === ITEM_TYPES.TITLE) {
							return {
								...item,
								text: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_CONTENT')
							};
						}
						if (!item.text && item.itemType === ITEM_TYPES.DESCRIPTION) {
							return {
								...item,
								text: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_CONTENT')
							};
						}
						return {
							...item
						};
					});
					return {
						...block,
						items
					};
				});
			},
			localConstants() {
				return this.blocks.flatMap(block => block.items || []).filter(item => item?.itemType === ITEM_TYPES.CONSTANT);
			},
			localConstantIds() {
				return this.localConstants.filter(item => item.id).map(item => item.id);
			},
			allConstantIds() {
				const globalIds = Object.keys(this.globalConstants);
				const localIds = this.localConstantIds;
				return new Set([...globalIds, ...localIds]);
			}
		},
		mounted() {
			this.initialConstantIds = new Set(this.localConstantIds);
			main_core_events.EventEmitter.subscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.onNodeSettingsSave);
			main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:drop', this.onItemDrop);
		},
		beforeUnmount() {
			this.isShowPreview = false;
			main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:drop', this.onItemDrop);
		},
		unmounted() {
			main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.onNodeSettingsSave);
		},
		methods: {
			onAddBlock() {
				this.blocks.push(makeEmptyBlock());
			},
			onAddItem(blockIndex, item) {
				this.blocks[blockIndex].items.push(item);
			},
			canSwitchEditingForm() {
				if (this.editingConstant === null || !this.isEditingFormChanged) {
					return Promise.resolve(true);
				}
				return this.showConfirmDiscard();
			},
			async onCreateConstant(blockIndex, item) {
				if (!(await this.canSwitchEditingForm())) {
					return;
				}
				this.isEditingFormChanged = false;
				this.editingConstant = {
					blockIndex,
					itemIndex: null,
					item: {
						...item
					},
					mode: EDITING_MODES.CREATE
				};
			},
			async onEditConstant(blockIndex, itemIndex) {
				if (!(await this.canSwitchEditingForm())) {
					return;
				}
				this.isEditingFormChanged = false;
				this.editingConstant = {
					blockIndex,
					itemIndex,
					item: {
						...this.blocks[blockIndex].items[itemIndex]
					},
					mode: EDITING_MODES.EDIT
				};
			},
			showConfirmDiscard() {
				return new Promise(resolve => {
					const messageBox = new ui_dialogs_messagebox.MessageBox({
						message: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DISCARD_CONFIRM'),
						buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
						okCaption: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DISCARD_OK'),
						cancelCaption: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DISCARD_CANCEL'),
						onOk: () => {
							resolve(true);
							messageBox.close();
						},
						onCancel: () => {
							resolve(false);
							messageBox.close();
						}
					});
					messageBox.show();
				});
			},
			onSaveEditingConstant(payload) {
				if (!this.editingConstant) {
					return;
				}
				const {
					blockIndex,
					itemIndex,
					mode
				} = this.editingConstant;
				const newValues = payload.propertyValues;
				const setError = payload.setError;
				const currentItem = mode === EDITING_MODES.EDIT ? this.blocks[blockIndex].items[itemIndex] : null;
				const newId = newValues.id;
				if (newId && newId !== currentItem?.id && this.allConstantIds.has(newId)) {
					setError();
					return;
				}
				if (mode === EDITING_MODES.CREATE) {
					this.blocks[blockIndex].items.push(newValues);
				} else {
					this.blocks[blockIndex].items[itemIndex] = {
						...currentItem,
						...newValues
					};
				}
				this.editingConstant = null;
			},
			onCancelEditingConstant() {
				this.editingConstant = null;
			},
			onDeleteBlock(blockIndex) {
				if (this.editingConstant?.blockIndex === blockIndex) {
					this.editingConstant = null;
				} else if (this.editingConstant?.blockIndex > blockIndex) {
					this.editingConstant = {
						...this.editingConstant,
						blockIndex: this.editingConstant.blockIndex - 1
					};
				}
				this.blocks.splice(blockIndex, 1);
			},
			onDeleteItem(blockIndex, itemIndex) {
				if (this.editingConstant?.blockIndex === blockIndex && this.editingConstant.itemIndex === itemIndex) {
					this.editingConstant = null;
				} else if (this.editingConstant?.blockIndex === blockIndex && this.editingConstant.itemIndex > itemIndex) {
					this.editingConstant = {
						...this.editingConstant,
						itemIndex: this.editingConstant.itemIndex - 1
					};
				}
				this.blocks[blockIndex].items.splice(itemIndex, 1);
			},
			onUpdateItemProperty(blockIndex, itemIndex, payload) {
				const currentItem = this.blocks[blockIndex].items[itemIndex];
				const newValues = payload.propertyValues;
				this.blocks[blockIndex].items[itemIndex] = {
					...currentItem,
					...newValues
				};
			},
			isCreatingConstantInBlock(blockIndex) {
				return this.editingConstant !== null && this.editingConstant.mode === EDITING_MODES.CREATE && this.editingConstant.blockIndex === blockIndex;
			},
			isEditingConstantUnderItem(blockIndex, itemIndex) {
				return this.editingConstant !== null && this.editingConstant.mode === EDITING_MODES.EDIT && this.editingConstant.blockIndex === blockIndex && this.editingConstant.itemIndex === itemIndex;
			},
			onItemsReorder(blockIndex, newItems) {
				this.blocks[blockIndex].items = newItems;
			},
			getElementComponent(type) {
				return ELEMENT_COMPONENTS[type];
			},
			onToggleShowPreview() {
				this.isShowPreview = !this.isShowPreview;
				main_core_events.EventEmitter.emit('BX.Bizproc:setuptemplateactivity:preview', this.isShowPreview);
			},
			onNodeSettingsSave(event) {
				const {
					formData
				} = event.getData();
				if (formData.activity !== ACTIVITY_NAME) {
					return;
				}
				const currentConstants = this.localConstants;
				const missingIds = new Set(this.initialConstantIds);
				const constantsToUpdate = {};
				for (const constant of currentConstants) {
					if (constant?.id) {
						constantsToUpdate[constant.id] = convertConstants(constant);
						missingIds.delete(constant.id);
					}
				}
				const deletedConstantIds = [...missingIds];
				main_core_events.EventEmitter.emit('Bizproc:onConstantsUpdated', {
					constantsToUpdate,
					deletedConstantIds
				});
				this.initialConstantIds = new Set(this.localConstantIds);
			},
			onItemDragStart(payload, blockIndex, itemIndex) {
				main_core_events.EventEmitter.emit('Bizproc.SetupTemplate:Draggable:start', {
					...payload,
					sourceBlockIndex: blockIndex,
					sourceItemIndex: itemIndex
				});
			},
			onItemDrop(event) {
				const payload = event.getData();
				const {
					sourceBlockIndex,
					sourceItemIndex,
					targetBlockIndex,
					targetItemIndex
				} = payload;
				if (targetBlockIndex === null || targetItemIndex === null) {
					return;
				}
				const newBlocks = JSON.parse(JSON.stringify(this.blocks));
				const [movedItem] = newBlocks[sourceBlockIndex].items.splice(sourceItemIndex, 1);
				if (!movedItem) {
					return;
				}
				let finalTargetIndex = targetItemIndex;
				if (sourceBlockIndex === targetBlockIndex && sourceItemIndex < targetItemIndex) {
					finalTargetIndex--;
				}
				newBlocks[targetBlockIndex].items.splice(finalTargetIndex, 0, movedItem);
				this.blocks = newBlocks;
			}
		},
		template: `
		<div
			class="bizproc-setuptemplateactivity-app"
			id="bizproc-setuptemplateactivity-app"
			ref="setuptemplateactivity"
		>
			<input
				:value="formValue"
				type="hidden"
				id="id_blocks"
				name="blocks"
			/>

			<AppHeader>
				<template #preview-btn>
					<PreviewBtn
						:showPreview="isShowPreview"
						@click="onToggleShowPreview"
					/>
				</template>
			</AppHeader>

			<div class="bizproc-setuptemplateactivity-app__blocks">
				<BlockComponent
					v-for="(block, blockIndex) in blocks"
					:key="block.id"
					:position="blockIndex + 1"
					:items="block.items"
					:blockIndex="blockIndex"
					@deleteBlock="onDeleteBlock(blockIndex)"
					@update:items="onItemsReorder(blockIndex, $event)"
				>
					<template #item="{ item, itemIndex }">
						<component
							:is="getElementComponent(item.itemType)"
							:item="item"
							:constantConfigurationList="constantConfigurationList"
							@delete="onDeleteItem(blockIndex, itemIndex)"
							@updateItemProperty="onUpdateItemProperty(blockIndex, itemIndex, $event)"
							@edit="onEditConstant(blockIndex, itemIndex)"
							@itemDragStart="onItemDragStart($event, blockIndex, itemIndex)"
						/>
					</template>
					<template #after-item="{ itemIndex }">
						<EditConstantPopupForm
							v-if="isEditingConstantUnderItem(blockIndex, itemIndex)"
							:item="editingConstant.item"
							:constantConfigurationList="constantConfigurationList"
							:isCreation="false"
							@update:item="onSaveEditingConstant"
							@update:changed="isEditingFormChanged = $event"
							@cancel="onCancelEditingConstant"
						/>
					</template>
					<template #before-footer>
						<EditConstantPopupForm
							v-if="isCreatingConstantInBlock(blockIndex)"
							:item="editingConstant.item"
							:constantConfigurationList="constantConfigurationList"
							:isCreation="true"
							@update:item="onSaveEditingConstant"
							@update:changed="isEditingFormChanged = $event"
							@cancel="onCancelEditingConstant"
						/>
					</template>
					<template #footer>
						<AddElementBtn
							:constantIds="allConstantIds"
							:constantConfigurationList="constantConfigurationList"
							@add:element="onAddItem(blockIndex, $event)"
							@create:constant="onCreateConstant(blockIndex, $event)"
						/>
					</template>
				</BlockComponent>
				<AddBlockBtn @click="onAddBlock"/>
			</div>
		</div>

		<Teleport
			to="#preview-panel"
			:disabled="!isShowPreview"
		>
			<PreviewApp
				v-if="isShowPreview"
				:blocks="preparedBlocks"
			/>
		</Teleport>
	`
	};

	class SetupTemplateActivity extends main_core_events.EventEmitter {
		#app;
		#currentValues;
		#blocksElement;
		#constantConfigurationList;
		constructor(parameters) {
			super();
			this.setEventNamespace('BX.Bizproc.Activity');
			this.#currentValues = parameters.currentValues;
			this.#blocksElement = document.getElementById(parameters.domElementId);
			this.#constantConfigurationList = parameters.constantConfigurationList;
		}
		#getBlocks() {
			const blocks = JSON.parse(this.#currentValues?.blocks) ?? [];
			blocks.forEach(block => {
				block.id = generateConstantId();
				block.items.forEach(item => {
					if (!item?.id) {
						item.id = generateConstantId();
					}
				});
			});
			return JSON.stringify(blocks);
		}
		unmount() {
			this.#app?.unmount();
		}
		init() {
			this.#app = ui_vue3.BitrixVue.createApp(BlocksAppComponent, {
				serializedBlocks: this.#getBlocks(),
				constantConfigurationList: this.#constantConfigurationList,
				globalConstants: window.arWorkflowConstants || {}
			});
			this.#app.mount(this.#blocksElement);
		}
	}

	exports.SetupTemplateActivity = SetupTemplateActivity;

})(this.BX.Bizproc = this.BX.Bizproc || {}, BX.Event, BX.Vue3, BX.UI.Dialogs, BX.UI.IconSet, BX.UI.IconSet, BX, BX.UI.System.Menu, BX.Bizproc, BX.UI.EntitySelector, BX.Vue3.Components, BX.UI.System.Typography.Vue);
//# sourceMappingURL=setup-template-activity.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_sidepanel,ui_vue3,main_core_events,main_core,ui_iconSet_api_vue,ui_iconSet_api_core,ui_system_menu_vue,ui_vue3_components_button,bizproc_setupTemplate) {
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
	        lastTargetItemIndex: null
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
	    main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.onGlobalDragStart);
	    main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:dragover', this.onGlobalDragOver);
	    main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:end', this.onGlobalDragEnd);
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.onGlobalDragStart);
	    main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:dragover', this.onGlobalDragOver);
	    main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:end', this.onGlobalDragEnd);
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
	      this.updateGhostPosition(event);
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
	        lastTargetItemIndex: null
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
					<div
						v-for="(item, itemIndex) in items"
						:key="item.id"
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
					<div
						v-if="showFinalDropPlaceholder(dnd)"
						class="bizproc-setuptemplateactivity-drop-placeholder"
					></div>
				</div>
			</DraggableContainer>
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
	  SELECT: 'select'
	});
	const DELIMITER_TYPES = Object.freeze({
	  LINE: 'line'
	});
	const CONSTANT_ID_PREFIX = 'SetupTemplateActivity_';
	const PRESET_TITLE_ICONS = {
	  IMAGE: 'o-image',
	  ATTACH: 'o-attach',
	  SETTINGS: 'o-settings',
	  STARS: 'o-ai-stars'
	};

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
	    required: false
	  };
	}
	function convertConstants(constant) {
	  return {
	    Name: constant.name,
	    Description: constant.description,
	    Type: constant.constantType,
	    Required: 0,
	    Multiple: constant.multiple ? 1 : 0,
	    Options: constant.options && constant.options.length > 0 ? constant.options : null,
	    Default: constant.default
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
	    }
	  },
	  emits: ['add:element', 'create:constant'],
	  data() {
	    return {
	      isMenuShown: false,
	      offsetLeft: 0
	    };
	  },
	  computed: {
	    menuOptions() {
	      return {
	        bindElement: this.$refs.addElementButton,
	        offsetLeft: this.offsetLeft,
	        fixed: false,
	        cacheable: false,
	        items: [{
	          title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL'),
	          onClick: () => this.$emit('add:element', makeEmptyTitle())
	        }, {
	          title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ICON_TITLE_ITEM_LABEL'),
	          onClick: () => this.$emit('add:element', makeEmptyTitleWithIcon())
	        }, {
	          title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_LABEL'),
	          onClick: () => this.$emit('add:element', makeEmptyDescription())
	        }, {
	          title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL'),
	          onClick: () => this.$emit('add:element', makeEmptyDelimiter())
	        }, {
	          title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_MENU'),
	          onClick: () => {
	            const id = this.generateFriendlyId();
	            this.$emit('create:constant', makeEmptyConstant(id));
	          }
	        }]
	      };
	    }
	  },
	  methods: {
	    onShowMenu(event) {
	      var _this$$refs$addElemen, _this$$refs$addElemen2;
	      const {
	        left = 0
	      } = (_this$$refs$addElemen = (_this$$refs$addElemen2 = this.$refs.addElementButton) == null ? void 0 : _this$$refs$addElemen2.getBoundingClientRect()) != null ? _this$$refs$addElemen : {};
	      this.offsetLeft = Math.abs(event.clientX - left);
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
	    }
	  },
	  template: `
		<button
			ref="addElementButton"
			class="ui-btn --air --wide --style-outline-no-accent ui-btn-no-caps --with-icon bizproc-setuptemplateactivity-add-element-btn"
			type="button"
			@click="onShowMenu"
		>
			<div class="ui-icon-set --plus-l"/>
			<span class="ui-btn-text">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_ITEM') }}
			</span>
			<BMenu
				v-if="isMenuShown"
				:options="menuOptions"
				@close="isMenuShown = false"
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
	  computed: {
	    icon() {
	      return this.showPreview ? ui_iconSet_api_core.Outline.CROSSED_EYE : ui_iconSet_api_core.Outline.OBSERVER;
	    },
	    label() {
	      return this.showPreview ? this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_HIDE_PREVIEW_BTN_TEXT') : this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_SHOW_PREVIEW_BTN_TEXT');
	    }
	  },
	  template: `
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
		</button
	`
	};

	// eslint-disable-next-line no-unused-vars

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

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const EditConstantPopupForm = {
	  name: 'EditConstantPopupForm',
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  inject: ['editSlider'],
	  props: {
	    /** @type ConstantItem */
	    item: {
	      type: Object,
	      required: true
	    },
	    /** Record<string, string> */
	    fieldTypeNames: {
	      type: Object,
	      required: true
	    },
	    isCreation: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update:item', 'cancel'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  data() {
	    return {
	      id: this.item.id,
	      name: this.item.name,
	      constantType: this.item.constantType,
	      multiple: this.item.multiple,
	      description: this.item.description,
	      defaultValue: this.item.default,
	      options: [...this.item.options],
	      required: this.item.required,
	      errors: {
	        id: '',
	        name: '',
	        options: this.item.options.map(() => '')
	      }
	    };
	  },
	  computed: {
	    isSelectType() {
	      return this.constantType === CONSTANT_TYPES.SELECT;
	    },
	    errorMessages() {
	      return {
	        required: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_LABEL_REQUIRED'),
	        idFormat: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_FORMAT'),
	        idUnique: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ERROR_ID_UNIQUE')
	      };
	    }
	  },
	  watch: {
	    constantType() {
	      this.options = [];
	    }
	  },
	  methods: {
	    onAddOption() {
	      this.options.push({
	        name: ''
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
	    validateOption(index) {
	      const name = this.options[index].name.trim();
	      this.errors.options[index] = '';
	      if (!main_core.Type.isStringFilled(name)) {
	        this.errors.options[index] = this.errorMessages.required;
	        return false;
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
	        if (main_core.Type.isStringFilled(option.name.trim())) {
	          this.errors.options[index] = '';
	        } else {
	          errorsCount += 1;
	          this.errors.options[index] = this.errorMessages.required;
	        }
	      });
	      return errorsCount === 0;
	    },
	    resetErrors() {
	      this.errors = {
	        id: '',
	        name: '',
	        options: []
	      };
	    },
	    onSave() {
	      const isValid = [this.validateId(), this.validateName(), this.validateOptions()].every(value => value);
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
	          options: [...this.options],
	          default: this.defaultValue,
	          required: this.required
	        },
	        setError: setUniqueError
	      });
	    },
	    onCancel() {
	      var _this$editSlider;
	      (_this$editSlider = this.editSlider) == null ? void 0 : _this$editSlider.close();
	      this.$emit('cancel');
	    }
	  },
	  template: `
		<div class="bizproc-setuptemplateactivity-edit-constant-popup">
			<div class="bizproc-setuptemplateactivity-edit-constant-popup__container">
				<div class="bizproc-setuptemplateactivity-edit-constant-popup__header">
					<h1 class="bizproc-setuptemplateactivity-edit-constant-popup__title">
						{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_SLIDER_TITLE') }}
					</h1>
				</div>

				<div class="bizproc-setuptemplateactivity-edit-constant-popup__content">
					<div class="bizproc-setuptemplateactivity-edit-constant-popup__block">
						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<div class="ui-ctl-title">
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_NAME_LABEL') }}
								</div>
							</div>
							<div class="ui-ctl ui-ctl-w100">
								<input
									v-model="name"
									class="ui-ctl-element"
									:class="{ '--error': errors.name !== '' }"
									type="text"
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
							<div class="ui-ctl ui-ctl-w100">
								<input
									v-model="id"
									class="ui-ctl-element"
									:class="{ '--error': errors.id !== '' }"
									type="text"
									:disabled="!isCreation"
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
							<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
								<div class="ui-ctl-after ui-ctl-icon-angle"></div>
								<select
									v-model="constantType"
									class="ui-ctl-element"
								>
									<option
										v-for="[fieldType, fieldText] in Object.entries(fieldTypeNames)"
										:key="fieldType"
										:value="fieldType"
									>
										{{ fieldText }}
									</option>
								</select>
							</div>
						</div>
						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<div class="ui-ctl-title">
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_LABEL') }}
								</div>
							</div>
							<div>
								<label class="ui-ctl ui-ctl-radio ui-ctl-inline">
									<input
										v-model="multiple"
										type="radio"
										class="ui-ctl-element"
										:value="true"
									/>
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_VALUE_YES') }}
								</label>
								<label class="ui-ctl ui-ctl-radio ui-ctl-inline">
									<input
										v-model="multiple"
										type="radio"
										class="ui-ctl-element"
										:value="false"
									/>
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_MULTIPLE_VALUE_NO') }}
								</label>
							</div>
						</div>

						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<div class="ui-ctl-title">
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_LABEL') }}
								</div>
							</div>
							<div>
								<label class="ui-ctl ui-ctl-radio ui-ctl-inline">
									<input
										v-model="required"
										type="radio"
										class="ui-ctl-element"
										:value="true"
									/>
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_VALUE_YES') }}
								</label>
								<label class="ui-ctl ui-ctl-radio ui-ctl-inline">
									<input
										v-model="required"
										type="radio"
										class="ui-ctl-element"
										:value="false"
									/>
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_REQUIRED_VALUE_NO') }}
								</label>
							</div>
						</div>

						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<label class="ui-ctl-title">
									{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE') }}
								</label>
							</div>
							<div class="ui-ctl ui-ctl-w100">
								<input
									v-model="defaultValue"
									class="ui-ctl-element"
									type="text"
								/>
							</div>
						</div>

						<template v-if="isSelectType">
							<div
								v-for="(option, index) in options"
								class="ui-ctl-container"
							>
								<div class="ui-ctl-top">
									<div class="ui-ctl-title">
										{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_OPTION_LABEL')  }} {{ index + 1 }}
									</div>
								</div>
								<div class="ui-ctl ui-ctl-w100">
									<div
										class="ui-ctl-after ui-ctl-icon-clear"
										@click="onDeleteOption(index)"
									>
									</div>
									<input
										v-model="option.name"
										class="ui-ctl-element"
										:class="{ '--error': errors.options[index] !== '' }"
										type="text"
										@blur="validateOption(index)"
									/>
								</div>
								<div
									v-if="errors.options[index]"
									class="ui-ctl-label-text-error">
									{{ errors.options[index] }}
								</div>
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
							<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
								<textarea
									v-model="description"
									class="ui-ctl-element"
									type="text"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="bizproc-setuptemplateactivity-edit-constant-popup__footer">
				<UiButton
					:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_SAVE')"
					:size="ButtonSize.LARGE"
					@click="onSave"
				/>
				<UiButton
					:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_CANCEL')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.LARGE"
					@click="onCancel"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ConstantField = {
	  name: 'ConstantField',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    EditConstantPopupForm
	  },
	  inject: ['editSlider'],
	  props: {
	    /** @type TitleItem */
	    item: {
	      type: Object,
	      required: true
	    },
	    /** Record<string, string> */
	    fieldTypeNames: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['delete', 'updateItemProperty', 'edit'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_core.Outline,
	      Main: ui_iconSet_api_core.Main
	    };
	  },
	  data() {
	    return {
	      isEdit: false
	    };
	  },
	  computed: {
	    typeLabel() {
	      var _this$fieldTypeNames$;
	      return (_this$fieldTypeNames$ = this.fieldTypeNames[this.item.constantType]) != null ? _this$fieldTypeNames$ : this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TYPE_UNSUPPORTED');
	    },
	    titleWithType() {
	      return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TITLE', {
	        '#NAME#': this.item.name,
	        '#TYPE#': this.typeLabel
	      });
	    }
	  },
	  created() {
	    main_core_events.EventEmitter.subscribe('Bitrix24.Slider:onClose', this.handleClosePopup);
	  },
	  unmounted() {
	    main_core_events.EventEmitter.unsubscribe('Bitrix24.Slider:onClose', this.handleClosePopup);
	  },
	  methods: {
	    handleClosePopup() {
	      this.isEdit = false;
	    },
	    onInput(event) {
	      const payload = {
	        propertyValues: {
	          default: event.target.value
	        }
	      };
	      this.$emit('updateItemProperty', payload);
	    },
	    onUpdateItem(payload) {
	      this.$emit('updateItemProperty', payload);
	    },
	    onEdit() {
	      var _this$editSlider;
	      this == null ? void 0 : (_this$editSlider = this.editSlider) == null ? void 0 : _this$editSlider.open();
	      this.$nextTick(() => {
	        this.isEdit = true;
	      });
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
								:value="item.default"
								class="ui-ctl-element"
								type="text"
								@input="onInput"
							/>
						</div>
					</div>
					<div class="bizproc-setuptemplateactivity-constant-edit__btn-control">
						<BIcon
							:name="Outline.EDIT_L"
							:size="18"
							class="bizproc-setuptemplateactivity-constant-edit__control-icon"
							@click="onEdit"
						/>
						<BIcon
							:name="Outline.CROSS_L"
							:size="18"
							class="bizproc-setuptemplateactivity-constant-edit__control-icon"
							@click="$emit('delete')"
						/>
					</div>
				</div>
			</div>
	
			<Teleport
				to="#bizproc-setuptemplateactivity-popup-content"
			>
				<EditConstantPopupForm
					v-if="isEdit"
					:item="item"
					:fieldTypeNames="fieldTypeNames"
					@update:item="onUpdateItem"
					:isCreation="false"
				/>
			</Teleport>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

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
	            var _item$default;
	            accItems[item.id] = (_item$default = item.default) != null ? _item$default : '';
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
	  provide() {
	    return {
	      editSlider: ui_vue3.computed(() => this.sliderInstance)
	    };
	  },
	  props: {
	    serializedBlocks: {
	      type: [String, null],
	      required: true
	    },
	    /** Record<string, string> */
	    fieldTypeNames: {
	      type: Object,
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
	      blocks: [],
	      isShowPreview: false,
	      sliderInstance: null,
	      initialConstantIds: new Set(),
	      currentBlockIndex: null,
	      createdConstant: null
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
	      return this.blocks.flatMap(block => block.items || []).filter(item => (item == null ? void 0 : item.itemType) === ITEM_TYPES.CONSTANT);
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
	    var _JSON$parse;
	    this.initEditSlider();
	    this.blocks = (_JSON$parse = JSON.parse(this.serializedBlocks)) != null ? _JSON$parse : [];
	    this.initialConstantIds = new Set(this.localConstantIds);
	    main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClosing', this.onCancelConstant);
	    main_core_events.EventEmitter.subscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.onNodeSettingsSave);
	    main_core_events.EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:drop', this.onItemDrop);
	  },
	  beforeUnmount() {
	    var _this$sliderInstance;
	    this.isShowPreview = false;
	    main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClosing', this.onCancelConstant);
	    main_core_events.EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:drop', this.onItemDrop);
	    (_this$sliderInstance = this.sliderInstance) == null ? void 0 : _this$sliderInstance.destroy();
	  },
	  unmounted() {
	    main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.onNodeSettingsSave);
	  },
	  methods: {
	    initEditSlider() {
	      this.sliderInstance = ui_vue3.markRaw(new main_sidepanel.Slider('', {
	        contentCallback: () => this.$refs.bizprocSetupTemplateActivityPopup,
	        width: 596,
	        outerBoundary: {
	          right: 8,
	          top: 64
	        },
	        startPosition: 'bottom',
	        overlayClassName: 'bizproc-setuptemplateactivity-app__overlay'
	      }));
	    },
	    onAddBlock() {
	      this.blocks.push(makeEmptyBlock());
	    },
	    onAddItem(blockIndex, item) {
	      this.blocks[blockIndex].items.push(item);
	    },
	    onCreateConstant(blockIndex, item) {
	      var _this$sliderInstance2;
	      this.currentBlockIndex = blockIndex;
	      this.createdConstant = {
	        ...item
	      };
	      (_this$sliderInstance2 = this.sliderInstance) == null ? void 0 : _this$sliderInstance2.open();
	    },
	    onSaveConstant(blockIndex, item) {
	      var _this$sliderInstance3;
	      const newId = item.propertyValues.id;
	      const setError = item.setError;
	      if (this.allConstantIds.has(newId)) {
	        setError();
	        return;
	      }
	      this.blocks[blockIndex].items.push(item.propertyValues);
	      this.currentBlockIndex = null;
	      this.createdConstant = null;
	      (_this$sliderInstance3 = this.sliderInstance) == null ? void 0 : _this$sliderInstance3.close();
	    },
	    onCancelConstant() {
	      this.currentBlockIndex = null;
	      this.createdConstant = null;
	    },
	    onDeleteBlock(blockIndex) {
	      this.blocks.splice(blockIndex, 1);
	    },
	    onDeleteItem(blockIndex, itemIndex) {
	      this.blocks[blockIndex].items.splice(itemIndex, 1);
	    },
	    onUpdateItemProperty(blockIndex, itemIndex, payload) {
	      var _this$sliderInstance4;
	      const currentItem = this.blocks[blockIndex].items[itemIndex];
	      const newValues = payload.propertyValues;
	      const setError = payload.setError;
	      const newId = newValues.id;
	      if (newId && newId !== currentItem.id && this.allConstantIds.has(newId)) {
	        setError();
	        return;
	      }
	      this.blocks[blockIndex].items[itemIndex] = {
	        ...currentItem,
	        ...newValues
	      };
	      if ((_this$sliderInstance4 = this.sliderInstance) != null && _this$sliderInstance4.isOpen()) {
	        this.sliderInstance.close();
	      }
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
	        if (constant != null && constant.id) {
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
							:fieldTypeNames="fieldTypeNames"
							@delete="onDeleteItem(blockIndex, itemIndex)"
							@updateItemProperty="onUpdateItemProperty(blockIndex, itemIndex, $event)"
							@itemDragStart="onItemDragStart($event, blockIndex, itemIndex)"
						/>
					</template>
					<template #footer>
						<AddElementBtn
							:constantIds="allConstantIds"
							@add:element="onAddItem(blockIndex, $event)"
							@create:constant="onCreateConstant(blockIndex, $event)"
						/>
					</template>
				</BlockComponent>
				<AddBlockBtn @click="onAddBlock"/>
			</div>
		</div>

		<div
			class="bizproc-setuptemplateactivity-app__popup"
			ref="bizprocSetupTemplateActivityPopup"
		>
			<div
				id="bizproc-setuptemplateactivity-popup-content"
				class="bizproc-setuptemplateactivity-app__popup-content"
			>
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

		<Teleport
			to="#bizproc-setuptemplateactivity-popup-content"
			:disabled="!createdConstant"
		>
			<EditConstantPopupForm
				v-if="createdConstant !== null"
				:item="createdConstant"
				:fieldTypeNames="fieldTypeNames"
				@update:item="onSaveConstant(currentBlockIndex, $event)"
				@cancel="onCancelConstant"
				:isCreation="true"
			/>
		</Teleport>
	`
	};

	var _app = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("app");
	var _currentValues = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentValues");
	var _blocksElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("blocksElement");
	var _fieldTypeNames = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fieldTypeNames");
	var _getBlocks = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBlocks");
	class SetupTemplateActivity extends main_core_events.EventEmitter {
	  constructor(parameters) {
	    super();
	    Object.defineProperty(this, _getBlocks, {
	      value: _getBlocks2
	    });
	    Object.defineProperty(this, _app, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _currentValues, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _blocksElement, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _fieldTypeNames, {
	      writable: true,
	      value: void 0
	    });
	    this.setEventNamespace('BX.Bizproc.Activity');
	    babelHelpers.classPrivateFieldLooseBase(this, _currentValues)[_currentValues] = parameters.currentValues;
	    babelHelpers.classPrivateFieldLooseBase(this, _blocksElement)[_blocksElement] = document.getElementById(parameters.domElementId);
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldTypeNames)[_fieldTypeNames] = parameters.fieldTypeNames;
	  }
	  unmount() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _app)[_app]) == null ? void 0 : _babelHelpers$classPr.unmount();
	  }
	  init() {
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app] = ui_vue3.BitrixVue.createApp(BlocksAppComponent, {
	      serializedBlocks: babelHelpers.classPrivateFieldLooseBase(this, _getBlocks)[_getBlocks](),
	      fieldTypeNames: babelHelpers.classPrivateFieldLooseBase(this, _fieldTypeNames)[_fieldTypeNames],
	      globalConstants: window.arWorkflowConstants || {}
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app].mount(babelHelpers.classPrivateFieldLooseBase(this, _blocksElement)[_blocksElement]);
	  }
	}
	function _getBlocks2() {
	  var _JSON$parse, _babelHelpers$classPr2;
	  const blocks = (_JSON$parse = JSON.parse((_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _currentValues)[_currentValues]) == null ? void 0 : _babelHelpers$classPr2.blocks)) != null ? _JSON$parse : [];
	  blocks.forEach(block => {
	    block.id = generateConstantId();
	    block.items.forEach(item => {
	      if (!(item != null && item.id)) {
	        item.id = generateConstantId();
	      }
	    });
	  });
	  return JSON.stringify(blocks);
	}

	exports.SetupTemplateActivity = SetupTemplateActivity;

}((this.BX.Bizproc = this.BX.Bizproc || {}),BX.SidePanel,BX.Vue3,BX.Event,BX,BX.UI.IconSet,BX.UI.IconSet,BX.UI.System.Menu,BX.Vue3.Components,BX.Bizproc));
//# sourceMappingURL=setup-template-activity.bundle.js.map

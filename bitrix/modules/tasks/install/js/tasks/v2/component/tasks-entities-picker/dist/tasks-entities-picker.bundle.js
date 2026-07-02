/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_polyfill_intersectionobserver,tasks_v2_component_tasksPopup,ui_iconSet_api_vue,ui_vue3) {
	'use strict';

	const timeOutHovers = 150;
	const ENTITY_VISUAL_TYPES = {
	  IMAGE: 'ENTITY_VISUAL_TYPE_IMAGE',
	  COMPONENT: 'ENTITY_VISUAL_TYPE_COMPONENT',
	  DEFAULT: 'ENTITY_VISUAL_TYPE_DEFAULT'
	};
	// @vue/component
	const TasksEntitiesPicker = {
	  name: 'TasksEntitiesPicker',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TasksPopup: tasks_v2_component_tasksPopup.TasksPopup
	  },
	  props: {
	    options: {
	      /** @type TasksEntitiesPickerOptions */
	      type: Object,
	      default: null
	    }
	  },
	  emits: ['demandEntities', 'clickEntity', 'mouseEnterEntityContent', 'mouseLeaveEntityContent'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      Animated: ui_iconSet_api_vue.Animated
	    };
	  },
	  data() {
	    return {
	      observer: null,
	      isLoaderVisible: false,
	      tooltipContent: '',
	      entityActiveElement: null,
	      isEntityTooltipOpenerHovered: false,
	      isEntityTooltipPopupHovered: false,
	      timeoutIdEntityActiveMouseLeave: null,
	      timeoutIdTooltipPopupMouseLeave: null
	    };
	  },
	  computed: {
	    optionsDefault() {
	      return {
	        isLoadingCount: false,
	        isLoadingList: false,
	        textHead: '',
	        entitiesCount: undefined,
	        entitiesList: [],
	        componentAvatar: null,
	        iconAvatarFallback: ui_iconSet_api_vue.Outline.BOX
	      };
	    },
	    optionsFilled() {
	      return {
	        ...this.optionsDefault,
	        ...this.options
	      };
	    },
	    entitiesList() {
	      return this.optionsFilled.entitiesList || [];
	    },
	    isEntitiesFull() {
	      return Boolean(this.entitiesList.length >= this.optionsFilled.entitiesCount);
	    },
	    isEntityContentHovered() {
	      const isEntityContentHoveredNew = this.isEntityTooltipOpenerHovered || this.isEntityTooltipPopupHovered;
	      return isEntityContentHoveredNew;
	    },
	    isEntityTooltipPopupOpened() {
	      const isInteracted = this.isEntityContentHovered;
	      return isInteracted;
	    },
	    optionsPopupEntityTooltip() {
	      return {
	        className: 'tasks-entities-picker__entity-tooltip',
	        isWithPointer: true,
	        positioning: {
	          isOpenedUp: true,
	          elementAnchor: this.entityActiveElement,
	          offsetVertical: 5,
	          offsetHorizontal: 100
	        }
	      };
	    }
	  },
	  watch: {
	    async entitiesList() {
	      await this.$nextTick();
	      this.initObserver();
	    },
	    isEntityContentHovered(value) {
	      if (value) {
	        this.$emit('mouseEnterEntityContent');
	      } else {
	        this.$emit('mouseLeaveEntityContent');
	      }
	    }
	  },
	  async mounted() {
	    await this.$nextTick();
	    this.initObserver();
	  },
	  beforeUnmount() {
	    this.disconnectObserver();
	  },
	  methods: {
	    getTypeEntityVisual(entity) {
	      let type = ENTITY_VISUAL_TYPES.DEFAULT;
	      if (this.optionsFilled.componentAvatar) {
	        type = ENTITY_VISUAL_TYPES.COMPONENT;
	      } else if (entity.image) {
	        type = ENTITY_VISUAL_TYPES.IMAGE;
	      }
	      return type;
	    },
	    getClassesEntity(entity) {
	      const classSummArr = [];
	      const classBase = 'tasks-entities-picker__entity';
	      classSummArr.push(classBase);
	      if (entity.isEntityClickable) {
	        const classClickable = classBase + '_clickable';
	        classSummArr.push(classClickable);
	      }
	      if (entity.type) {
	        const classType = classBase + '_type_' + entity.type;
	        classSummArr.push(classType);
	      }
	      const classSumm = classSummArr.join(' ');
	      return classSumm;
	    },
	    initObserver() {
	      var _this$$refs$tagScroll, _this$$refs$tagScroll2, _this$$refs$tagScroll3;
	      this.disconnectObserver();
	      if (!this.$refs.tagScrollBottomEntities || this.isEntitiesFull) {
	        return;
	      }
	      const optionsObserver = {
	        root: (_this$$refs$tagScroll = this.$refs.tagScrollBottomEntities) == null ? void 0 : (_this$$refs$tagScroll2 = _this$$refs$tagScroll.parentElement) == null ? void 0 : (_this$$refs$tagScroll3 = _this$$refs$tagScroll2.parentElement) == null ? void 0 : _this$$refs$tagScroll3.parentElement,
	        rootMargin: '0px',
	        threshold: 0.5
	      };
	      this.observer = new IntersectionObserver(entries => {
	        entries.forEach(entry => {
	          if (entry.isIntersecting) {
	            this.handleIntersection();
	          }
	          this.isLoaderVisible = entry.isIntersecting;
	        });
	      }, optionsObserver);
	      this.observer.observe(this.$refs.tagScrollBottomEntities);
	    },
	    disconnectObserver() {
	      if (this.observer) {
	        this.observer.disconnect();
	        this.observer = null;
	      }
	    },
	    handleMouseEnterEntity(tooltip) {
	      if (tooltip) {
	        this.entityActiveElement = event.target;
	        this.tooltipContent = tooltip;
	        clearTimeout(this.timeoutIdEntityActiveMouseLeave);
	        this.isEntityTooltipOpenerHovered = true;
	      }
	    },
	    handleMouseLeaveEntity(tooltip) {
	      if (tooltip) {
	        this.timeoutIdEntityActiveMouseLeave = setTimeout(() => {
	          this.isEntityTooltipOpenerHovered = false;
	        }, timeOutHovers);
	      }
	    },
	    handleClickEntity(entity) {
	      event.stopPropagation();
	      const entityId = entity && entity.id;
	      if (entityId) {
	        this.$emit('clickEntity', entity);
	        if (entity.tooltip) {
	          this.isEntityTooltipOpenerHovered = false;
	        }
	      }
	    },
	    handleMouseEnterTooltipPopup() {
	      clearTimeout(this.timeoutIdTooltipPopupMouseLeave);
	      this.isEntityTooltipPopupHovered = true;
	    },
	    handleMouseLeaveTooltipPopup() {
	      this.timeoutIdTooltipPopupMouseLeave = setTimeout(() => {
	        this.isEntityTooltipPopupHovered = false;
	      }, timeOutHovers);
	    },
	    handleIntersection() {
	      if (this.optionsFilled.isLoadingList || this.isEntitiesFull) {
	        return;
	      }
	      this.$emit('demandEntities');
	    },
	    getEntityVisualElement(entity) {
	      const entityVisualType = this.getTypeEntityVisual(entity);
	      let element = ui_iconSet_api_vue.BIcon;
	      if (entityVisualType === ENTITY_VISUAL_TYPES.IMAGE) {
	        element = ui_vue3.h('img');
	      } else if (entityVisualType === ENTITY_VISUAL_TYPES.COMPONENT) {
	        element = this.optionsFilled.componentAvatar;
	      }
	      return element;
	    },
	    getEntityVisualOptions(entity) {
	      const entityVisualType = this.getTypeEntityVisual(entity);
	      const classBase = 'tasks-entities-picker__entity-vis-item';
	      let options = {
	        class: classBase + ' tasks-entities-picker__entity-vis-item_icon',
	        name: this.optionsFilled.iconAvatarFallback
	      };
	      if (entityVisualType === ENTITY_VISUAL_TYPES.IMAGE) {
	        options = {
	          alt: 'Entity',
	          class: classBase + ' tasks-entities-picker__entity-vis-item_img',
	          src: entity.image
	        };
	      } else if (entityVisualType === ENTITY_VISUAL_TYPES.COMPONENT) {
	        options = {};
	        options.class = classBase + ' tasks-entities-picker__entity-vis-item_comp';
	        options = {
	          ...options,
	          ...entity.optionsAvatar
	        };
	      }
	      return options;
	    }
	  },
	  template: `
		<div class="tasks-entities-picker">
			<div
				v-if="optionsFilled.textHead"
				class="tasks-entities-picker__head"
			>
				<p class="tasks-entities-picker__head-text">{{ optionsFilled.textHead }}</p>
			</div>
			<div class="tasks-entities-picker__list">
				<div class="tasks-entities-picker__list-container">
					<ul
						v-if="entitiesList.length > 0"
						class="tasks-entities-picker__items"
					>
						<li
							v-for="entity in entitiesList"
							:key="entity.id"
							class="tasks-entities-picker__item"
						>
							<button
								:class="getClassesEntity(entity)"
								@mouseenter="() => handleMouseEnterEntity(entity.tooltip)"
								@mouseleave="() => handleMouseLeaveEntity(entity.tooltip)"
								v-on="entity.isEntityClickable ? {click: () => handleClickEntity(entity)} : {}"
							>
								<div class="tasks-entities-picker__entity-vis">
									<component
										:is="getEntityVisualElement(entity)"
										v-bind="getEntityVisualOptions(entity)"
									/>
								</div>
								<p class="tasks-entities-picker__entity-text">
									<span class="tasks-entities-picker__entity-text-name">
										<span
											v-for="nameValue in entity.name"
											class="tasks-entities-picker__entity-text-name-part"
										>{{ nameValue }}</span>
									</span>
								</p>
							</button>
							<p
								v-if="entity.tag"
								class="tasks-entities-picker__item-tag"
							>{{ entity.tag }}</p>
						</li>
					</ul>
					<div
						v-if="!isEntitiesFull"
						class="tasks-entities-picker__loader"
					>
						<div
							class="tasks-entities-picker__loader-observer"
							ref="tagScrollBottomEntities"
						></div>
						<div class="tasks-entities-picker__loader-spinner"></div>
					</div>
				</div>
			</div>
			<TasksPopup
				v-if="isEntityTooltipPopupOpened"
				:key="entityActiveElement"
				:options="optionsPopupEntityTooltip"
				@mouseenter="handleMouseEnterTooltipPopup"
				@mouseleave="handleMouseLeaveTooltipPopup"
			>
				<div class="tasks-entities-picker__entity-tooltip-content">
					<p class="tasks-entities-picker__entity-tooltip-text">{{ tooltipContent }}</p>
				</div>
			</TasksPopup>
		</div>
	`
	};

	exports.TasksEntitiesPicker = TasksEntitiesPicker;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX,BX.Tasks.V2.Component,BX.UI.IconSet,BX.Vue3));
//# sourceMappingURL=tasks-entities-picker.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, main_polyfill_intersectionobserver, ui_iconSet_api_vue, ui_vue3, tasks_v2_component_tasksEntitiesPicker, tasks_v2_component_tasksPopup) {
	'use strict';

	const timeOutHovers = 150;
	// @vue/component
	const TasksEntitiesDemonstrator = {
		name: 'TasksEntitiesDemonstrator',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TasksPopup: tasks_v2_component_tasksPopup.TasksPopup,
			TasksEntitiesPicker: tasks_v2_component_tasksEntitiesPicker.TasksEntitiesPicker
		},
		props: {
			options: {
				/** @type TasksEntitiesDemonstratorOptions */
				type: Object,
				default: null
			}
		},
		emits: ['open', 'close', 'clickPopup', 'demandEntities', 'clickEntity'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				Animated: ui_iconSet_api_vue.Animated
			};
		},
		data() {
			return {
				isShownByClick: false,
				isEntitiesDemonstratorOpenerHovered: false,
				isEntitiesDemonstratorPopupHovered: false,
				timeoutIdEntitiesDemonstratorOpenerLeave: null,
				timeoutIdEntitiesDemonstratorPopupLeave: null,
				isEntityContentHovered: false
			};
		},
		computed: {
			optionsDefault() {
				return {
					isLoadingCount: false,
					isLoadingList: false,
					isOpenedOnClick: true,
					isOpenedOnHover: false,
					componentOpener: null,
					iconOpener: ui_iconSet_api_vue.Outline.BULLETED_LIST,
					textOpener: '',
					classNamePopup: '',
					textHead: '',
					entitiesCount: 0,
					entitiesList: [],
					componentAvatar: null,
					iconAvatarFallback: ui_iconSet_api_vue.Outline.BOX,
					positioning: null
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
			positioning() {
				return this.optionsFilled.positioning || {};
			},
			isGettingFirstValidCount() {
				return this.optionsFilled.isLoadingCount && !this.optionsFilled.entitiesCount;
			},
			isEntityDemonstratorPopupOpened() {
				if (!this.optionsFilled.entitiesCount) {
					return false;
				}
				const isHovered = this.isEntitiesDemonstratorOpenerHovered || this.isEntitiesDemonstratorPopupHovered || this.isEntityContentHovered;
				const isInteracted = this.optionsFilled.isOpenedOnClick && this.isShownByClick || this.optionsFilled.isOpenedOnHover && isHovered;
				return isInteracted;
			},
			componentDemonstratorOpener() {
				return this.optionsFilled.componentOpener || this.getOpener();
			},
			opensPopup() {
				return Boolean(this.optionsFilled.entitiesCount);
			},
			openerAriaLabel() {
				// The opener carries only an icon and a count, so it needs an explicit name;
				// a visible caption names the opener by itself and must not be overridden.
				if (this.optionsFilled.textOpener) {
					return null;
				}
				if (this.optionsFilled.textHead) {
					return this.optionsFilled.textHead;
				}

				// The fallback phrase fits only the opener drawn here; an opener passed by a
				// consumer names itself and must not be renamed to something it never shows.
				if (this.optionsFilled.componentOpener) {
					return null;
				}
				return this.loc('TASKS_V2_ENTITIES_DEMONSTRATOR_VIEWERS_ARIA_LABEL');
			},
			openerAriaAttrs() {
				// The popup belongs to the demonstrator and only it knows whether the popup is
				// open, so an opener passed by a consumer is described the same way as the default
				// one. Attributes with nothing to say are left out rather than passed as null,
				// which would strip what such an opener declares on itself.
				const attrs = {};
				if (this.opensPopup) {
					attrs['aria-haspopup'] = 'dialog';
					attrs['aria-expanded'] = this.isEntityDemonstratorPopupOpened;
				}
				if (this.openerAriaLabel) {
					attrs['aria-label'] = this.openerAriaLabel;
				}
				return attrs;
			},
			classNameEntitiesDemonstratorOpener() {
				let className = 'tasks-entities-demonstrator__opener';
				if (this.isEntityDemonstratorPopupOpened) {
					className += ' tasks-entities-demonstrator__opener_active';
				}
				if (!this.optionsFilled.isOpenedOnClick) {
					className += ' tasks-entities-demonstrator__opener_no-onclick';
				}
				return className;
			},
			optionsPopupEntityDemonstrator() {
				let classNamePopup = 'tasks-entities-demonstrator__popup';
				if (this.optionsFilled.classNamePopup) {
					classNamePopup += ` ${this.optionsFilled.classNamePopup}`;
				}
				const offsetVerticalNew = main_core.Type.isNumber(this.positioning.offsetVertical) ? this.positioning.offsetVertical : 5;
				const opener = this.$refs.entityDemonstratorOpener?.$el || this.$refs.entityDemonstratorOpener;
				return {
					isWithBG: true,
					isTeleportedToContainer: true,
					className: classNamePopup,
					ariaLabel: this.optionsFilled.textHead,
					positioning: {
						isOpenedUp: true,
						isOpenedLeft: true,
						elementAnchor: opener,
						offsetVertical: offsetVerticalNew,
						offsetHorizontal: 0
					}
				};
			},
			optionsEntityPicker() {
				const options = {
					isLoadingCount: this.optionsFilled.isLoadingCount,
					isLoadingList: this.optionsFilled.isLoadingList,
					textHead: this.optionsFilled.textHead,
					entitiesCount: this.optionsFilled.entitiesCount,
					entitiesList: this.entitiesList,
					componentAvatar: this.optionsFilled.componentAvatar,
					iconAvatarFallback: this.optionsFilled.iconAvatarFallback
				};
				return options;
			}
		},
		watch: {
			async isEntityDemonstratorPopupOpened(isOpened) {
				if (isOpened === false) {
					this.$emit('close');
				} else {
					this.$emit('open');
				}
			},
			entitiesList() {
				this.setPopupPosition();
			}
		},
		methods: {
			getRectWithOffset(elem) {
				const rect = elem.getBoundingClientRect();
				return {
					top: rect.top + window.pageYOffset,
					right: rect.right + window.pageXOffset,
					bottom: rect.bottom + window.pageYOffset,
					left: rect.left + window.pageXOffset
				};
			},
			async setPopupPosition() {
				const opener = this.$refs.entityDemonstratorOpener?.$el || this.$refs.entityDemonstratorOpener;
				const coordsInitial = this.getRectWithOffset(opener);
				await this.$nextTick();
				this.$refs.entityDemonstratorPopup?.setCoordsForPopup();
				const coordsResult = this.getRectWithOffset(opener);
				const isSameTop = coordsInitial.top === coordsResult.top;
				const isSameRight = coordsInitial.right === coordsResult.right;
				const isSameBottom = coordsInitial.bottom === coordsResult.bottom;
				const isSameLeft = coordsInitial.left === coordsResult.left;
				const isSameEverything = isSameTop && isSameRight && isSameBottom && isSameLeft;
				// for example, in case if entities-list expanded and caused scrollbar appearance
				// and then moved up, but opener rect has been calculated with scrollbar in the first refresh
				if (!isSameEverything) {
					this.setPopupPosition();
				}
			},
			handleClickOpener() {
				if (this.optionsFilled.isOpenedOnClick) {
					event.stopPropagation();
					this.isShownByClick = !this.isShownByClick;
				}
			},
			handleMouseEnterOpener() {
				if (this.optionsFilled.isOpenedOnHover) {
					clearTimeout(this.timeoutIdEntitiesDemonstratorOpenerLeave);
					this.isEntitiesDemonstratorOpenerHovered = true;
				}
			},
			handleMouseLeaveOpener() {
				if (this.optionsFilled.isOpenedOnHover) {
					this.timeoutIdEntitiesDemonstratorOpenerLeave = setTimeout(() => {
						this.isEntitiesDemonstratorOpenerHovered = false;
					}, timeOutHovers);
				}
			},
			handleMouseEnterDemonstratorPopup() {
				if (this.optionsFilled.isOpenedOnHover) {
					clearTimeout(this.timeoutIdEntitiesDemonstratorPopupLeave);
					this.isEntitiesDemonstratorPopupHovered = true;
				}
			},
			handleMouseLeaveDemonstratorPopup() {
				if (this.optionsFilled.isOpenedOnHover) {
					this.timeoutIdEntitiesDemonstratorPopupLeave = setTimeout(() => {
						this.isEntitiesDemonstratorPopupHovered = false;
					}, timeOutHovers);
				}
			},
			handleClickDemonstratorPopup() {
				this.$emit('clickPopup');
			},
			handleCloseDemonstratorPopup() {
				if (this.optionsFilled.isOpenedOnClick) {
					this.isShownByClick = false;
				}
			},
			handleDemandEntities() {
				this.$emit('demandEntities');
			},
			handleMouseEnterEntityContent() {
				this.isEntityContentHovered = true;
			},
			handleMouseLeaveEntityContent() {
				this.isEntityContentHovered = false;
			},
			handleClickEntity(entity) {
				event.stopPropagation();
				const entityId = entity && entity.id;
				if (entityId) {
					this.$emit('clickEntity', entityId);
					if (this.optionsFilled.isOpenedOnClick) {
						this.isShownByClick = false;
					}
					if (this.optionsFilled.isOpenedOnHover) {
						this.isEntitiesDemonstratorPopupHovered = false;
					}
				}
			},
			getOpener() {
				return ui_vue3.h('button', {
					type: 'button',
					class: 'tasks-entities-demonstrator__opener_native'
				});
			}
		},
		template: `
		<div class="tasks-entities-demonstrator">
			<component
				:is="componentDemonstratorOpener"
				ref="entityDemonstratorOpener"
				data-testid="task-entities-demonstrator-opener"
				:class="classNameEntitiesDemonstratorOpener"
				v-bind="openerAriaAttrs"
				@mouseenter="handleMouseEnterOpener"
				@mouseleave="handleMouseLeaveOpener"
				@click="handleClickOpener"
			>
				<span
					v-if="optionsFilled.textOpener"
					class="tasks-entities-demonstrator__opener-text"
				>{{ optionsFilled.textOpener }}</span>
				<BIcon
					class="tasks-entities-demonstrator__opener-icon"
					:name="optionsFilled.iconOpener"
				/>
				<BIcon
					v-if="isGettingFirstValidCount"
					class="tasks-entities-demonstrator__opener-icon"
					:name="Animated.LOADER_WAIT"
				/>
				<span
					v-else
					class="tasks-entities-demonstrator__opener-count"
				>{{ optionsFilled.entitiesCount || optionsDefault.entitiesCount }}</span>
			</component>
			<TasksPopup
				v-if="isEntityDemonstratorPopupOpened"
				ref="entityDemonstratorPopup"
				:options="optionsPopupEntityDemonstrator"
				@mouseenter="handleMouseEnterDemonstratorPopup"
				@mouseleave="handleMouseLeaveDemonstratorPopup"
				@click="handleClickDemonstratorPopup"
				@close="handleCloseDemonstratorPopup"
			>
				<TasksEntitiesPicker
					:options="optionsEntityPicker"
					@demandEntities="handleDemandEntities"
					@clickEntity="handleClickEntity"
					@mouseEnterEntityContent="handleMouseEnterEntityContent"
					@mouseLeaveEntityContent="handleMouseLeaveEntityContent"
				/>
			</TasksPopup>
		</div>
	`
	};

	exports.TasksEntitiesDemonstrator = TasksEntitiesDemonstrator;

})(this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}, BX, BX, BX.UI.IconSet, BX.Vue3, BX.Tasks.V2.Component, BX.Tasks.V2.Component);
//# sourceMappingURL=tasks-entities-demonstrator.bundle.js.map

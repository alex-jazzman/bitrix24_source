import 'main.polyfill.intersectionobserver';
import { TasksPopup } from 'tasks.v2.component.tasks-popup';
import { BIcon, Outline, Animated } from 'ui.icon-set.api.vue';
import { h } from 'ui.vue3';

import './tasks-entities-picker.css';

const timeOutHovers = 150;
const ENTITY_VISUAL_TYPES = {
	IMAGE: 'ENTITY_VISUAL_TYPE_IMAGE',
	COMPONENT: 'ENTITY_VISUAL_TYPE_COMPONENT',
	DEFAULT: 'ENTITY_VISUAL_TYPE_DEFAULT',
};

type TasksEntitiesPickerOptions = {
	isLoadingCount: boolean,
	isLoadingList: boolean,
	textHead: string,
	entitiesCount: number,
	entitiesList: [],
	componentAvatar: HTMLElement,
	iconAvatarFallback: string,
}

// @vue/component
export const TasksEntitiesPicker = {
	name: 'TasksEntitiesPicker',
	components: {
		BIcon,
		TasksPopup,
	},
	props: {
		options: {
			/** @type TasksEntitiesPickerOptions */
			type: Object,
			default: null,
		},
	},
	emits: [
		'demandEntities',
		'clickEntity',
		'mouseEnterEntityContent',
		'mouseLeaveEntityContent',
	],
	setup(): {}
	{
		return {
			Outline,
			Animated,
		};
	},
	data(): Object
	{
		return {
			observer: null,
			isLoaderVisible: false,
			tooltipContent: '',
			entityActiveElement: null,
			isEntityTooltipOpenerHovered: false,
			isEntityTooltipPopupHovered: false,
			timeoutIdEntityActiveMouseLeave: null,
			timeoutIdTooltipPopupMouseLeave: null,
		};
	},
	computed: {
		optionsDefault(): TasksEntitiesPickerOptions
		{
			return {
				isLoadingCount: false,
				isLoadingList: false,
				textHead: '',
				entitiesCount: undefined,
				entitiesList: [],
				componentAvatar: null,
				iconAvatarFallback: Outline.BOX,
			};
		},
		optionsFilled(): TasksEntitiesPickerOptions
		{
			return { ...this.optionsDefault, ...this.options };
		},
		entitiesList(): boolean
		{
			return this.optionsFilled.entitiesList || [];
		},
		isEntitiesFull(): boolean
		{
			return Boolean(this.entitiesList.length >= this.optionsFilled.entitiesCount);
		},
		isEntityContentHovered(): boolean
		{
			const isEntityContentHoveredNew = this.isEntityTooltipOpenerHovered
				|| this.isEntityTooltipPopupHovered;

			return isEntityContentHoveredNew;
		},
		isEntityTooltipPopupOpened(): boolean
		{
			const isInteracted = this.isEntityContentHovered;

			return isInteracted;
		},
		optionsPopupEntityTooltip(): any
		{
			return {
				className: 'tasks-entities-picker__entity-tooltip',
				isWithPointer: true,
				positioning: {
					isOpenedUp: true,
					elementAnchor: this.entityActiveElement,
					offsetVertical: 5,
					offsetHorizontal: 100,
				},
			};
		},
	},
	watch: {
		async entitiesList() {
			await this.$nextTick();
			this.initObserver();
		},
		isEntityContentHovered(value) {
			if (value)
			{
				this.$emit('mouseEnterEntityContent');
			}
			else
			{
				this.$emit('mouseLeaveEntityContent');
			}
		},
	},
	async mounted(): void
	{
		await this.$nextTick();
		this.initObserver();
	},
	beforeUnmount(): void
	{
		this.disconnectObserver();
	},
	methods: {
		getTypeEntityVisual(entity): any
		{
			let type = ENTITY_VISUAL_TYPES.DEFAULT;

			if (this.optionsFilled.componentAvatar)
			{
				type = ENTITY_VISUAL_TYPES.COMPONENT;
			}
			else if (entity.image)
			{
				type = ENTITY_VISUAL_TYPES.IMAGE;
			}

			return type;
		},
		getClassesEntity(entity): string
		{
			const classSummArr = [];

			const classBase = 'tasks-entities-picker__entity';
			classSummArr.push(classBase);

			if (entity.isEntityClickable)
			{
				const classClickable = classBase + '_clickable';
				classSummArr.push(classClickable);
			}

			if (entity.type)
			{
				const classType = classBase + '_type_' + entity.type;
				classSummArr.push(classType);
			}

			const classSumm = classSummArr.join(' ');

			return classSumm;
		},
		initObserver(): void
		{
			this.disconnectObserver();

			if (!this.$refs.tagScrollBottomEntities || this.isEntitiesFull)
			{
				return;
			}

			const optionsObserver = {
				root: this.$refs.tagScrollBottomEntities?.parentElement?.parentElement?.parentElement,
				rootMargin: '0px',
				threshold: 0.5,
			};

			this.observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting)
					{
						this.handleIntersection();
					}
					this.isLoaderVisible = entry.isIntersecting;
				});
			}, optionsObserver);

			this.observer.observe(this.$refs.tagScrollBottomEntities);
		},
		disconnectObserver(): void
		{
			if (this.observer)
			{
				this.observer.disconnect();
				this.observer = null;
			}
		},
		handleMouseEnterEntity(tooltip): void
		{
			if (tooltip)
			{
				this.entityActiveElement = event.target;
				this.tooltipContent = tooltip;

				clearTimeout(this.timeoutIdEntityActiveMouseLeave);
				this.isEntityTooltipOpenerHovered = true;
			}
		},
		handleMouseLeaveEntity(tooltip): void
		{
			if (tooltip)
			{
				this.timeoutIdEntityActiveMouseLeave = setTimeout(() => {
					this.isEntityTooltipOpenerHovered = false;
				}, timeOutHovers);
			}
		},
		handleClickEntity(entity): void
		{
			event.stopPropagation();
			const entityId = entity && entity.id;

			if (entityId)
			{
				this.$emit('clickEntity', entity);

				if (entity.tooltip)
				{
					this.isEntityTooltipOpenerHovered = false;
				}
			}
		},
		handleMouseEnterTooltipPopup(): void
		{
			clearTimeout(this.timeoutIdTooltipPopupMouseLeave);
			this.isEntityTooltipPopupHovered = true;
		},
		handleMouseLeaveTooltipPopup(): void
		{
			this.timeoutIdTooltipPopupMouseLeave = setTimeout(() => {
				this.isEntityTooltipPopupHovered = false;
			}, timeOutHovers);
		},
		handleIntersection(): void
		{
			if (this.optionsFilled.isLoadingList || this.isEntitiesFull)
			{
				return;
			}

			this.$emit('demandEntities');
		},
		getEntityVisualElement(entity): any
		{
			const entityVisualType = this.getTypeEntityVisual(entity);
			let element = BIcon;

			if (entityVisualType === ENTITY_VISUAL_TYPES.IMAGE)
			{
				element = h('img');
			}
			else if (entityVisualType === ENTITY_VISUAL_TYPES.COMPONENT)
			{
				element = this.optionsFilled.componentAvatar;
			}

			return element;
		},
		getEntityVisualOptions(entity): any
		{
			const entityVisualType = this.getTypeEntityVisual(entity);
			const classBase = 'tasks-entities-picker__entity-vis-item';

			let options = {
				class: (classBase + ' tasks-entities-picker__entity-vis-item_icon'),
				name: this.optionsFilled.iconAvatarFallback,
			};

			if (entityVisualType === ENTITY_VISUAL_TYPES.IMAGE)
			{
				options = {
					alt: 'Entity',
					class: (classBase + ' tasks-entities-picker__entity-vis-item_img'),
					src: entity.image,
				};
			}
			else if (entityVisualType === ENTITY_VISUAL_TYPES.COMPONENT)
			{
				options = {};
				options.class = (classBase + ' tasks-entities-picker__entity-vis-item_comp');
				options = { ...options, ...entity.optionsAvatar };
			}

			return options;
		},
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
	`,
};

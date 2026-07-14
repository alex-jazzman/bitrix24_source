import { Type } from 'main.core';
import 'main.polyfill.intersectionobserver';
import { BIcon, Outline, Animated } from 'ui.icon-set.api.vue';
import { h } from 'ui.vue3';

import { TasksEntitiesPicker } from 'tasks.v2.component.tasks-entities-picker';
import { TasksPopup } from 'tasks.v2.component.tasks-popup';

import './tasks-entities-demonstrator.css';

const timeOutHovers = 150;

type TasksEntitiesDemonstratorOptions = {
	isLoadingCount: boolean,
	isLoadingList: boolean,
	isOpenedOnClick: boolean,
	isOpenedOnHover: boolean,
	componentOpener: HTMLElement,
	iconOpener: string,
	textOpener: string,
	classNamePopup: string,
	textHead: string,
	entitiesCount: number,
	entitiesList: [],
	componentAvatar: HTMLElement,
	iconAvatarFallback: string,
	positioning: any,
}

// @vue/component
export const TasksEntitiesDemonstrator = {
	name: 'TasksEntitiesDemonstrator',
	components: {
		BIcon,
		TasksPopup,
		TasksEntitiesPicker,
	},
	props: {
		options: {
			/** @type TasksEntitiesDemonstratorOptions */
			type: Object,
			default: null,
		},
	},
	emits: [
		'open',
		'close',
		'clickPopup',
		'demandEntities',
		'clickEntity',
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
			isShownByClick: false,
			isEntitiesDemonstratorOpenerHovered: false,
			isEntitiesDemonstratorPopupHovered: false,
			timeoutIdEntitiesDemonstratorOpenerLeave: null,
			timeoutIdEntitiesDemonstratorPopupLeave: null,
			isEntityContentHovered: false,
		};
	},
	computed: {
		optionsDefault(): TasksEntitiesDemonstratorOptions
		{
			return {
				isLoadingCount: false,
				isLoadingList: false,
				isOpenedOnClick: true,
				isOpenedOnHover: false,
				componentOpener: null,
				iconOpener: Outline.BULLETED_LIST,
				textOpener: '',
				classNamePopup: '',
				textHead: '',
				entitiesCount: 0,
				entitiesList: [],
				componentAvatar: null,
				iconAvatarFallback: Outline.BOX,
				positioning: null,
			};
		},
		optionsFilled(): TasksEntitiesDemonstratorOptions
		{
			return { ...this.optionsDefault, ...this.options };
		},
		entitiesList(): boolean
		{
			return this.optionsFilled.entitiesList || [];
		},
		positioning(): boolean
		{
			return this.optionsFilled.positioning || {};
		},
		isGettingFirstValidCount(): boolean
		{
			return this.optionsFilled.isLoadingCount && !this.optionsFilled.entitiesCount;
		},
		isEntityDemonstratorPopupOpened(): boolean
		{
			if (!this.optionsFilled.entitiesCount)
			{
				return false;
			}

			const isHovered = this.isEntitiesDemonstratorOpenerHovered
				|| this.isEntitiesDemonstratorPopupHovered
				|| this.isEntityContentHovered;

			const isInteracted = (this.optionsFilled.isOpenedOnClick && this.isShownByClick)
				|| (this.optionsFilled.isOpenedOnHover && isHovered);

			return isInteracted;
		},
		componentDemonstratorOpener(): any
		{
			return this.optionsFilled.componentOpener || this.getOpener();
		},
		classNameEntitiesDemonstratorOpener(): boolean
		{
			let className = 'tasks-entities-demonstrator__opener';

			if (this.isEntityDemonstratorPopupOpened)
			{
				className += ' tasks-entities-demonstrator__opener_active';
			}

			if (!this.optionsFilled.isOpenedOnClick)
			{
				className += ' tasks-entities-demonstrator__opener_no-onclick';
			}

			return className;
		},
		optionsPopupEntityDemonstrator(): any
		{
			let classNamePopup = 'tasks-entities-demonstrator__popup';

			if (this.optionsFilled.classNamePopup)
			{
				classNamePopup += ` ${this.optionsFilled.classNamePopup}`;
			}

			const offsetVerticalNew = Type.isNumber(this.positioning.offsetVertical)
				? this.positioning.offsetVertical
				: 5;

			const opener = this.$refs.entityDemonstratorOpener?.$el
				|| this.$refs.entityDemonstratorOpener;

			return {
				isWithBG: true,
				className: classNamePopup,
				positioning: {
					isOpenedUp: true,
					isOpenedLeft: true,
					elementAnchor: opener,
					offsetVertical: offsetVerticalNew,
					offsetHorizontal: 0,
				},
			};
		},
		optionsEntityPicker(): any
		{
			const options = {
				isLoadingCount: this.optionsFilled.isLoadingCount,
				isLoadingList: this.optionsFilled.isLoadingList,
				textHead: this.optionsFilled.textHead,
				entitiesCount: this.optionsFilled.entitiesCount,
				entitiesList: this.entitiesList,
				componentAvatar: this.optionsFilled.componentAvatar,
				iconAvatarFallback: this.optionsFilled.iconAvatarFallback,
			};

			return options;
		},
	},
	watch: {
		async isEntityDemonstratorPopupOpened(isOpened): void {
			if (isOpened === false)
			{
				this.$emit('close');
			}
			else
			{
				this.$emit('open');
			}
		},
		entitiesList() {
			this.setPopupPosition();
		},
	},
	methods: {
		getRectWithOffset(elem): any
		{
			const rect = elem.getBoundingClientRect();

			return {
				top: rect.top + window.pageYOffset,
				right: rect.right + window.pageXOffset,
				bottom: rect.bottom + window.pageYOffset,
				left: rect.left + window.pageXOffset,
			};
		},
		async setPopupPosition(): void
		{
			const opener = this.$refs.entityDemonstratorOpener?.$el
				|| this.$refs.entityDemonstratorOpener;

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
			if (!isSameEverything)
			{
				this.setPopupPosition();
			}
		},
		handleClickOpener(): void
		{
			if (this.optionsFilled.isOpenedOnClick)
			{
				event.stopPropagation();
				this.isShownByClick = !this.isShownByClick;
			}
		},
		handleMouseEnterOpener(): void
		{
			if (this.optionsFilled.isOpenedOnHover)
			{
				clearTimeout(this.timeoutIdEntitiesDemonstratorOpenerLeave);
				this.isEntitiesDemonstratorOpenerHovered = true;
			}
		},
		handleMouseLeaveOpener(): void
		{
			if (this.optionsFilled.isOpenedOnHover)
			{
				this.timeoutIdEntitiesDemonstratorOpenerLeave = setTimeout(() => {
					this.isEntitiesDemonstratorOpenerHovered = false;
				}, timeOutHovers);
			}
		},
		handleMouseEnterDemonstratorPopup(): void
		{
			if (this.optionsFilled.isOpenedOnHover)
			{
				clearTimeout(this.timeoutIdEntitiesDemonstratorPopupLeave);
				this.isEntitiesDemonstratorPopupHovered = true;
			}
		},
		handleMouseLeaveDemonstratorPopup(): void
		{
			if (this.optionsFilled.isOpenedOnHover)
			{
				this.timeoutIdEntitiesDemonstratorPopupLeave = setTimeout(() => {
					this.isEntitiesDemonstratorPopupHovered = false;
				}, timeOutHovers);
			}
		},
		handleClickDemonstratorPopup(): void
		{
			this.$emit('clickPopup');
		},
		handleCloseDemonstratorPopup(): void
		{
			if (this.optionsFilled.isOpenedOnClick)
			{
				this.isShownByClick = false;
			}
		},
		handleDemandEntities(): void
		{
			this.$emit('demandEntities');
		},
		handleMouseEnterEntityContent(): void
		{
			this.isEntityContentHovered = true;
		},
		handleMouseLeaveEntityContent(): void
		{
			this.isEntityContentHovered = false;
		},
		handleClickEntity(entity): void
		{
			event.stopPropagation();

			const entityId = entity && entity.id;

			if (entityId)
			{
				this.$emit('clickEntity', entityId);

				if (this.optionsFilled.isOpenedOnClick)
				{
					this.isShownByClick = false;
				}

				if (this.optionsFilled.isOpenedOnHover)
				{
					this.isEntitiesDemonstratorPopupHovered = false;
				}
			}
		},
		getOpener(): any
		{
			return h(
				'button',
				{
					class: 'tasks-entities-demonstrator__opener_native',
				},
			);
		},
	},
	template: `
		<div class="tasks-entities-demonstrator">
			<component
				:is="componentDemonstratorOpener"
				ref="entityDemonstratorOpener"
				:class="classNameEntitiesDemonstratorOpener"
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
	`,
};

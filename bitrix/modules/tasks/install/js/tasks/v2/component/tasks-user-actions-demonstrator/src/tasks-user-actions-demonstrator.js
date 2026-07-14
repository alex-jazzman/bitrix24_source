import { Outline, Animated } from 'ui.icon-set.api.vue';
import { markRaw } from 'ui.vue3';

import { UserAvatar } from 'tasks.v2.component.elements.user-avatar';
import { TasksEntitiesDemonstrator } from 'tasks.v2.component.tasks-entities-demonstrator';
import { userService } from 'tasks.v2.provider.service.user-service';

import './tasks-user-actions-demonstrator.css';

type TasksUserActionsDemonstratorOptions = {
	isLoadingCount: boolean,
	isLoadingList: boolean,
	isOpenedOnClick: boolean,
	isOpenedOnHover: boolean,
	isDateInline: boolean,
	componentOpener: HTMLElement,
	textOpener: string,
	textHead: string,
	userActionsCount: number,
	userActionsList: [],
	positioning: any,
}

// @vue/component
export const TasksUserActionsDemonstrator = {
	name: 'TasksUserActionsDemonstrator',
	components: {
		TasksEntitiesDemonstrator,
		UserAvatar,
	},
	props: {
		options: {
			/** @type TasksUserActionsDemonstratorOptions */
			type: Object,
			default: null,
		},
	},
	emits: [
		'open',
		'close',
		'clickPopup',
		'demandUserActions',
	],
	setup(): {}
	{
		return {
			Outline,
			Animated,
			markRaw,
		};
	},
	computed: {
		optionsDefault(): TasksUserActionsDemonstratorOptions
		{
			return {
				isLoadingCount: false,
				isLoadingList: false,
				isOpenedOnClick: true,
				isOpenedOnHover: false,
				isDateInline: false,
				componentOpener: null,
				textOpener: '',
				textHead: '',
				userActionsCount: undefined,
				userActionsList: [],
				positioning: {},
			};
		},
		optionsFilled(): TasksUserActionsDemonstratorOptions
		{
			return {
				...this.optionsDefault,
				...this.options,
				// double default protection to prevent falsy type object values
				userActionsList: this.options.userActionsList || this.optionsDefault.userActionsList,
				positioning: this.options.positioning || this.optionsDefault.positioning,
			};
		},
		optionsEntitiesDemonstrator(): Object
		{
			const entitiesList = this.optionsFilled.userActionsList.map(userAction => {
				const userActionNew = {
					isEntityClickable: true,
					id: userAction.id,
					name: userAction.name,
					type: userAction.type,
					optionsAvatar: {
						src: userAction.image,
						type: userAction.type,
					},
				};

				if (this.optionsFilled.isDateInline)
				{
					userActionNew.tag = this.formatTs(userAction.ts);
				}
				else
				{
					userActionNew.tooltip = this.formatTs(userAction.ts);
				}

				return userActionNew;
			});

			return {
				isLoadingCount: this.optionsFilled.isLoadingCount,
				isLoadingList: this.optionsFilled.isLoadingList,
				isOpenedOnClick: this.optionsFilled.isOpenedOnClick,
				isOpenedOnHover: this.optionsFilled.isOpenedOnHover,
				componentOpener: this.optionsFilled.componentOpener,
				iconOpener: Outline.OBSERVER,
				textOpener: this.optionsFilled.textOpener,
				classNamePopup: 'tasks-entities-demonstrator__popup_user-actions',
				textHead: this.optionsFilled.textHead,
				entitiesCount: this.optionsFilled.userActionsCount,
				entitiesList,
				componentAvatar: markRaw(UserAvatar),
				positioning: this.optionsFilled.positioning,
			};
		},
	},
	methods: {
		formatTs(ts): string
		{
			const dateObject = new Date(ts * 1000);
			const isCurrentYear = (dateObject.getFullYear() === (new Date()).getFullYear());

			const formatDayDefault = (
				isCurrentYear
					? BX.Main.DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT')
					: BX.Main.DateTimeFormat.getFormat('MEDIUM_DATE_FORMAT')
			);
			const formatsDay = [
				['today', 'today'],
				['yesterday', 'yesterday'],
				['', formatDayDefault],
			];
			const formatTimeOfClock = BX.Main.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');

			const dayFormatted = BX.Main.DateTimeFormat.format(formatsDay, dateObject);
			const timeOfClockFormatted = BX.Main.DateTimeFormat.format(formatTimeOfClock, dateObject);

			return `${dayFormatted} ${timeOfClockFormatted}`;
		},
		handleOpen(): void
		{
			this.$emit('open');
		},
		handleClose(): void
		{
			this.$emit('close');
		},
		handleClickPopup(): void
		{
			this.$emit('clickPopup');
		},
		handleDemandEntities(): void
		{
			this.$emit('demandUserActions');
		},
		handleClickEntity(entityId): void
		{
			BX.SidePanel.Instance.emulateAnchorClick(userService.getUrl(entityId));
		},
	},
	template: `
		<TasksEntitiesDemonstrator
			:options="optionsEntitiesDemonstrator"
			@open="handleOpen"
			@close="handleClose"
			@clickPopup="handleClickPopup"
			@demandEntities="handleDemandEntities"
			@clickEntity="handleClickEntity"
		/>
	`,
};

import { Loc } from 'main.core';
import { TextXs, Text3Xs } from 'ui.system.typography.vue';
import { BMenu } from 'ui.system.menu.vue';

import { resolveMemberAppearance } from '../../utils/member-type';
import {
	ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS,
	ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS_SHORT,
	TASK_WEIGHT,
} from '../consts';

// @vue/component
export const PrivateUserItem = {
	name: 'PrivateUserItem',
	components: { TextXs, Text3Xs, BMenu },
	props: {
		entityId: { type: [String, Number], default: '' },
		title: { type: String, default: '' },
		memberType: { type: String, default: null },
		ownAvatar: { type: String, default: null },
		taskName: { type: String, default: 'disk_access_read' },
		maxTaskName: { type: String, default: 'disk_access_full' },
		readOnly: { type: Boolean, default: false },
	},
	emits: ['changeRight'],
	data()
	{
		return {
			isMenuShown: false,
			selectedAccessId: 'view',
			accessItems: ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS,
			accessItemsShorts: ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS_SHORT,
		};
	},
	computed: {
		appearance()
		{
			return resolveMemberAppearance(this.memberType);
		},
		avatarModifier()
		{
			return `access-private-user__avatar--${this.appearance.imageKey}`;
		},
		rowColor()
		{
			return `var(${this.appearance.nameColor})`;
		},
		memberLabelColor()
		{
			return this.appearance.labelColor ? `var(${this.appearance.labelColor})` : null;
		},
		memberLabel()
		{
			// missing phrase resolves to an empty label: the block must not render at all
			return (this.appearance.labelKey ? Loc.getMessage(this.appearance.labelKey) : '') ?? '';
		},
		accessButtonLabel()
		{
			// missing phrase must not strip the accessible name down to nothing
			return Loc.getMessage('DISK_SHARING_ACCESS_POPUP_MEMBER_ACCESS_LEVEL_FOR', {
				'#LEVEL#': this.selectedAccessLabel,
				'#NAME#': this.title,
			}) ?? this.selectedAccessLabel;
		},
		selectedAccessLabel()
		{
			return this.accessItemsShorts.find((item) => item.id === this.taskName)?.title
				?? this.accessItemsShorts[0]?.title
				?? '';
		},
		availableAccessItems()
		{
			return this.accessItems.filter((item) => {
				return TASK_WEIGHT[this.maxTaskName] >= TASK_WEIGHT[item.id];
			});
		},
	},
	methods: {
		openMenu()
		{
			if (this.readOnly)
			{
				return;
			}

			this.isMenuShown = true;
		},
		getMenuOptions()
		{
			return {
				bindElement: this.$refs.accessButton,
				targetContainer: document.body,
				closeOnItemClick: true,
				items: this.availableAccessItems.map((item) => ({
					title: item.title,
					isSelected: item.id === this.taskName,
					onClick: () => {
						this.$emit('changeRight', item.id);
						this.isMenuShown = false;
					},
				})),
			};
		},
	},
	template: `
		<div
			class="access-private-user__wrapper"
			:data-testid="'disk-sharing-access-private-member-' + entityId"
			role="listitem"
			:style="{ color: rowColor }"
		>
			<img
				v-if="ownAvatar"
				class="access-private-user__avatar"
				data-testid="disk-sharing-member-avatar"
				loading="lazy"
				decoding="async"
				:src="ownAvatar"
				alt=""
			>
			<span
				v-else
				class="access-private-user__avatar"
				data-testid="disk-sharing-member-avatar"
				:class="avatarModifier"
			></span>
			<div class="access-private-user__info-wrapper">
				<Text3Xs
					v-if="memberLabel"
					tag="p"
					wrap="truncate"
					data-testid="disk-sharing-member-label"
					:title="memberLabel"
					:style="{ color: memberLabelColor }"
				>
					{{ memberLabel }}
				</Text3Xs>
				<TextXs
					tag="p"
					wrap="truncate"
					data-testid="disk-sharing-member-name"
					:title="title"
					:style="{ color: 'inherit' }"
				>
					{{ title }}
				</TextXs>
			</div>
			<div class="access-private-user__change-access">
				<button
					ref="accessButton"
					type="button"
					class="access-private-user__access-button"
					:data-testid="'disk-sharing-access-private-member-right-' + entityId"
					:aria-label="accessButtonLabel"
					:disabled="readOnly"
					@click="openMenu"
				>
					{{ selectedAccessLabel }}
				</button>
				<BMenu
					v-if="isMenuShown"
					:options="getMenuOptions()"
					@close="isMenuShown = false"
				/>
			</div>
		</div>
	`,
};

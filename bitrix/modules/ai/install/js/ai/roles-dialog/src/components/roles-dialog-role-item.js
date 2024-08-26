import { Type } from 'main.core';
import { Main } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { mapWritableState } from 'ui.vue3.pinia';
import { type States as StatesType } from 'ui.entity-catalog';
import { RolesDialogRoleItemAvatar } from './roles-dialog-role-item-avatar';
import { RolesDialogLabelNew } from './roles-dialog-label-new';

import '../css/roles-dialog-role-item.css';

import type { RolesDialogItemData } from '../roles-dialog';

// eslint-disable-next-line max-lines-per-function
export function getRolesDialogRoleItemWithStates(States: StatesType): Object
{
	return {
		name: 'RolesDialogRoleItem',
		components: {
			BIcon,
			RolesDialogRoleItemAvatar,
			RolesDialogLabelNew,
		},
		props: ['itemData'],
		computed: {
			...mapWritableState(States.useGlobalState, {
				searching: 'searchApplied',
				searchQuery: 'searchQuery',
			}),
			item(): RolesDialogItemData {
				return this.itemData.itemData;
			},
			subtitle(): string {
				const subtitle = this.item.subtitle;

				if (this.searching && this.searchQuery !== '')
				{
					return subtitle.replaceAll(new RegExp(this.searchQuery, 'gi'), (match) => `<mark>${match}</mark>`);
				}

				return subtitle;
			},
			title(): string {
				const title = this.item.title;

				if (this.searching && this.searchQuery !== '')
				{
					return title.replaceAll(new RegExp(this.searchQuery, 'gi'), (match) => `<mark>${match}</mark>`);
				}

				return title;
			},
			isSelected(): boolean {
				return Boolean(this.item.customData?.selected);
			},
			isNew(): boolean {
				return Boolean(this.item.customData?.isNew);
			},
			isInfoItem(): boolean {
				return Boolean(this.item.customData?.isInfoItem);
			},
			className(): Object {
				return {
					'ai__roles-dialog_role-item': true,
					'--selected': this.isSelected,
				};
			},
			selectedIconData(): { name: string, color: string, size: number } {
				return {
					name: Main.CHECK,
					color: this.getUiTokenValue('--ui-color-copilot-soft') || '#B095DC',
					size: 16,
				};
			},
			infoIcon(): string {
				return Main.INFO;
			},
		},
		methods: {
			selectRole(): void {
				if (Type.isFunction(this.item.button.action))
				{
					this.item.button.action();
				}
			},
			getUiTokenValue(token: string): ?string {
				getComputedStyle(document.body).getPropertyValue(token);
			},
		},
		template: `
			<article @click="selectRole" :class="className">
			  <RolesDialogRoleItemAvatar
			      :avatar="item.customData.avatar"
			      :avatar-alt="item.title"
			      :icon="isInfoItem ? infoIcon : null"
			  />
			  <div class="ai__roles-dialog_role-item-info">
			    <div class="ai__roles-dialog_role-item-title-wrapper">
					<div class="ai__roles-dialog_role-item-title" v-html="title"></div>
					<div class="ai__roles-dialog_role-item-label">
						<RolesDialogLabelNew v-if="isNew" />
					</div>
			    </div>
			    <p class="ai__roles-dialog_role-item-description" v-html="subtitle"></p>
			  </div>
			  <div
			      v-if="isSelected"
			      class="ai__roles-dialog_role-item-select-icon"
			  >
			    <BIcon
			        :name="selectedIconData.name"
			        :size="selectedIconData.size"
			        :color="selectedIconData.color"
			    />
			  </div>
			</article>
		`,
	};
}

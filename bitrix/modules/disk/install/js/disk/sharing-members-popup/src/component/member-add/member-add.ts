import { Loc, Runtime } from 'main.core';
import { Dialog, type Item } from 'ui.entity-selector';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent, markRaw } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { SelectorEntity } from '../../const/selector';
import { addSelectedMember, removeDeselectedMember, type SelectedEntity } from '../../feature/add-members/add-members';
import { getSelectorItemIdByAccessCode, type SelectorItemId } from '../../lib/access-code/access-code';
import { type SharingStore, useSharingStore } from '../../model/sharing/sharing';
import { type SharingMember } from '../../model/sharing/types';

import './member-add.css';

const DialogId = 'disk-sharing-members-popup-selector';
const DialogContext = 'DISK_SHARING_PRIVATE_ACCESS';
const DialogWidth = 420;
const DialogHeight = 360;
const ButtonTestId = Object.freeze({ testid: 'disk-sharing-members-add' });

type DialogEntity = {
	id: string,
	options?: { [option: string]: unknown },
};

type SelectorItemEvent = {
	getData: () => { item: Item },
};

type SetupState = {
	store: SharingStore,
	AirButtonStyle: typeof AirButtonStyle,
	ButtonSize: typeof ButtonSize,
	ButtonTestId: typeof ButtonTestId,
};

/**
 * Adding members through ui.entity-selector. The selector is not the source of the member list:
 * the codes it cannot express (a chat, a project on a portal without the socialnetwork
 * extension) stay in the model and reach the server untouched.
 */
export const MemberAdd = defineComponent({
	name: 'DiskSharingMemberAdd',
	components: {
		TextSm,
		UiButton,
	},
	// the store is taken here, where the injection context of the component gives the pinia of the popup
	setup(): SetupState
	{
		return { store: useSharingStore(), AirButtonStyle, ButtonSize, ButtonTestId };
	},
	data(): { dialog: Dialog | null, isProjectAvailable: boolean }
	{
		return {
			dialog: null,
			isProjectAvailable: false,
		};
	},
	computed: {
		isVisible(): boolean
		{
			return this.store.canAddMembers;
		},
		isSaving(): boolean
		{
			return this.store.isSaving;
		},
		description(): string
		{
			return Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_EMPLOYEES_LABEL') ?? '';
		},
		buttonText(): string
		{
			return Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_EMPLOYEES_BUTTON') ?? '';
		},
	},
	beforeUnmount(): void
	{
		this.destroyDialog();
	},
	methods: {
		getSelectorItems(members: SharingMember[]): SelectorItemId[]
		{
			const items: SelectorItemId[] = [];

			members.forEach((member: SharingMember) => {
				const itemId = getSelectorItemIdByAccessCode(member.entityId);

				if (itemId !== null && (itemId[0] !== SelectorEntity.Project || this.isProjectAvailable))
				{
					items.push(itemId);
				}
			});

			return items;
		},
		getPreselectedItems(): SelectorItemId[]
		{
			return this.getSelectorItems(this.store.members);
		},
		// the appending mode neither changes nor removes the members it has loaded
		getUndeselectedItems(): SelectorItemId[]
		{
			return this.getSelectorItems(
				this.store.members.filter((member: SharingMember) => this.store.isMemberLocked(member.entityId)),
			);
		},
		getDialogEntities(): DialogEntity[]
		{
			const entities: DialogEntity[] = [
				{
					id: SelectorEntity.User,
					options: {
						inviteEmployeeLink: false,
						inviteGuestLink: true,
						selectFields: ['workDepartment'],
					},
				},
				{
					id: SelectorEntity.Department,
					options: {
						selectMode: 'usersAndDepartments',
					},
				},
			];

			if (this.isProjectAvailable)
			{
				entities.push({ id: SelectorEntity.Project });
			}

			return entities;
		},
		// the vue button renders its node through the vanilla one, so the target comes from there
		getTargetNode(): HTMLElement | null
		{
			const button = this.$refs.selectButton as { button?: { getContainer: () => HTMLElement } } | undefined;

			return button?.button?.getContainer() ?? null;
		},
		toSelectedEntity(item: Item): SelectedEntity
		{
			return {
				entity: item.getEntityId(),
				id: item.getId(),
				title: item.getTitle(),
				avatar: item.getAvatar() ?? '',
			};
		},
		destroyDialog(): void
		{
			if (this.dialog === null)
			{
				return;
			}

			this.dialog.destroy();
			this.dialog = null;
			this.store.setSelectorOpen(false);
		},
		// the dialog is built anew on every opening: it takes the current members as its selection
		async handleClick(): Promise<void>
		{
			this.isProjectAvailable = await Runtime.loadExtension('socialnetwork.entity-selector')
				.then(() => true)
				.catch(() => false);

			this.destroyDialog();

			const targetNode = this.getTargetNode();

			if (targetNode === null)
			{
				return;
			}

			const dialog = markRaw(new Dialog({
				id: DialogId,
				context: DialogContext,
				targetNode,
				width: DialogWidth,
				height: DialogHeight,
				multiple: true,
				enableSearch: true,
				compactView: true,
				preselectedItems: this.getPreselectedItems(),
				undeselectedItems: this.getUndeselectedItems(),
				entities: this.getDialogEntities(),
				events: {
					// the popup asks the model whether the selector is on top of it
					onShow: () => this.store.setSelectorOpen(true),
					onHide: () => this.store.setSelectorOpen(false),
					'Item:onSelect': (event: SelectorItemEvent) => {
						addSelectedMember(this.store, this.toSelectedEntity(event.getData().item));
					},
					'Item:onDeselect': (event: SelectorItemEvent) => {
						removeDeselectedMember(this.store, this.toSelectedEntity(event.getData().item));
					},
				},
			}));

			this.dialog = dialog;
			dialog.show();
		},
	},
	template: `
		<div v-if="isVisible" class="disk-sharing-members-popup-add">
			<TextSm class="disk-sharing-members-popup-add__description">{{ description }}</TextSm>
			<UiButton
				ref="selectButton"
				:text="buttonText"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.OUTLINE_ACCENT_2"
				:disabled="isSaving"
				:dataset="ButtonTestId"
				@click="handleClick"
			/>
		</div>
	`,
});

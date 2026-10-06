import { mapWritableState } from 'ui.vue3.pinia';

import '../css/roles-dialog-empty-group-stub.css';
import { type RolesDialogGroupDataEmptyStub } from '../roles-dialog';
import { Loc, Extension } from 'main.core';
import { UI } from 'ui.notification';

const customDescription = Loc.getMessage('AI_COPILOT_ROLES_EMPTY_CUSTOM_GROUP', {
	'#LINK#': '<a @click.prevent="openRolesLibrary" href="#">',
	'#/LINK#': '</a>',
});

export const getRolesDialogEmptyGroupStubWithStates = (States, onOpenRolesLibrary: () => void) => {
	return {
		computed: {
			...mapWritableState(States.useGlobalState, {
				currentGroup: 'currentGroup',
			}),
			emptyStubData(): RolesDialogGroupDataEmptyStub {
				return this.currentGroup.customData.emptyStubData;
			},
			groupCode(): string {
				return this.currentGroup.id;
			},
			title(): string {
				return this.emptyStubData.title;
			},
			description(): string {
				return this.emptyStubData.description;
			},
		},
		methods: {
			openRolesLibrary(): void
			{
				if (!Extension.getSettings('ai.roles-dialog').get('isLibraryVisible'))
				{
					UI.Notification.Center.notify({
						content: Loc.getMessage('AI_COPILOT_ROLES_LIBRARY_COLLABER_ACCESS_DENIED'),
					});

					return;
				}

				onOpenRolesLibrary();
			},
		},
		template: `
			<div class="ai__roles-dialog_empty-group-stub">
				<div class="ai__roles-dialog_empty-group-stub-content">
					<div
						class="ai__roles-dialog_empty-group-stub-image"
						:class="'--' + groupCode"
					></div>
					<h3 class="ai__roles-dialog_empty-group-stub-title">
						{{ title }}
					</h3>
					<div v-if="groupCode !== 'customs'" class="ai__roles-dialog_empty-group-stub-text">
						{{ description }}
					</div>
					<div v-else class="ai__roles-dialog_empty-group-stub-text">
						${customDescription}
					</div>
				</div>
			</div>
		`,
	};
};

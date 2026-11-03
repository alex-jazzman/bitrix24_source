import { Loc } from 'main.core';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { NoteWorkspaceEmptyStateComponent } from 'note.workspace';

export const HomePage = {
	name: 'HomePage',
	components: {
		NoteWorkspaceEmptyStateComponent,
		UiButton,
	},
	inject: {
		sidebarActions: { from: 'noteSidebarActions', default: null },
		sidebarState: { from: 'noteSidebarState', default: null },
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	computed: {
		showEmptyState(): boolean
		{
			const collections = this.sidebarState?.collections;

			return Array.isArray(collections)
				&& collections.length === 0
				&& this.sidebarState.collectionsLoading === false
				&& this.sidebarState.collectionsHasNextPage === false
			;
		},
		canEditCollections(): boolean
		{
			return Boolean(this.sidebarState?.permissions?.canEditCollections);
		},
		emptyStateText(): string
		{
			return Loc.getMessage('NOTE_APP_EMPTY_COLLECTIONS_MSGVER_1') || '';
		},
		createCollectionText(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_PROMPT_COLLECTION_NAME') || '';
		},
		sharedWithMeText(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_SHARED_WITH_ME') || '';
		},
		sharedButtonStyle(): string
		{
			return this.canEditCollections ? AirButtonStyle.PLAIN_ACCENT : AirButtonStyle.FILLED;
		},
	},
	methods: {
		onCreateCollection(): void
		{
			if (!this.canEditCollections)
			{
				return;
			}

			void this.sidebarActions?.createCollection?.();
		},
		onOpenShared(): void
		{
			this.sidebarActions?.navigateToShared?.();
		},
	},
	template: `
		<div class="content-body">
			<NoteWorkspaceEmptyStateComponent v-if="showEmptyState" :text="emptyStateText">
				<div
					v-if="canEditCollections"
					data-testid="note-home-empty-create-collection"
				>
					<UiButton
						:text="createCollectionText"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.FILLED"
						@click="onCreateCollection"
					/>
				</div>
				<div data-testid="note-home-empty-open-shared">
					<UiButton
						:text="sharedWithMeText"
						:size="ButtonSize.LARGE"
						:style="sharedButtonStyle"
						@click="onOpenShared"
					/>
				</div>
			</NoteWorkspaceEmptyStateComponent>
		</div>
	`,
};

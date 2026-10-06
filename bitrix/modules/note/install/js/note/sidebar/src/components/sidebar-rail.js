import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { SidebarCreateButton } from './sidebar-create-button';

// Collapsed state is a 66px rail of top-level entries instead of an empty strip. Every entry
// expands the panel; sections that own a global expansion action are opened along the way,
// the archive and the recycle bin navigate as usual.
export const SidebarRail = {
	name: 'SidebarRail',
	components: {
		BIcon,
		SidebarCreateButton,
	},
	props: {
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
		messages: { type: Object, required: true },
	},
	emits: ['expand'],
	computed: {
		isSharedTreeEnabled(): boolean
		{
			return Boolean(this.state?.sharedTreeEnabled);
		},
		// The entry follows the section it opens: with nothing starred the expanded panel has no
		// favorites block, so the rail has nothing to lead to either.
		hasFavorites(): boolean
		{
			return this.state.favorites.items.length > 0;
		},
	},
	methods: {
		expand(): void
		{
			this.$emit('expand');
		},
		onSearch(): void
		{
			this.$emit('expand', { focusSearch: true });
		},
		onFavorites(): void
		{
			this.expand();
			if (!this.state.favorites.sectionExpanded)
			{
				this.actions.setFavoritesSectionExpanded(true);
			}
		},
		onShared(): void
		{
			this.expand();
			if (this.isSharedTreeEnabled)
			{
				if (!this.state.sharedSectionExpanded)
				{
					void this.actions.toggleSharedSection();
				}

				return;
			}

			this.actions.navigateToShared();
		},
		onCollections(): void
		{
			this.expand();
			if (!this.state.collectionsSectionExpanded)
			{
				this.actions.toggleCollectionsSection();
			}
		},
		onArchive(): void
		{
			this.actions.navigateToArchive();
		},
		onRecycleBin(): void
		{
			this.actions.navigateToRecycleBin();
		},
	},
	template: `
		<div class="sidebar-rail">
			<div class="sidebar-rail__group">
				<button
					type="button"
					class="sidebar-rail__btn"
					:title="messages.search"
					:aria-label="messages.search"
					@click="onSearch"
				>
					<BIcon name="o-search" :size="22" />
				</button>
				<SidebarCreateButton :state="state" :actions="actions" variant="rail" />
			</div>
			<div class="sidebar-rail__divider" aria-hidden="true"></div>
			<div class="sidebar-rail__group sidebar-rail__group--sections">
				<template v-if="hasFavorites">
					<button
						type="button"
						class="sidebar-rail__btn"
						:title="messages.favorites"
						:aria-label="messages.favorites"
						@click="onFavorites"
					>
						<BIcon name="o-favorite" :size="22" />
					</button>
					<div class="sidebar-rail__divider" aria-hidden="true"></div>
				</template>
				<button
					type="button"
					class="sidebar-rail__btn"
					:title="messages.sharedWithMe"
					:aria-label="messages.sharedWithMe"
					@click="onShared"
				>
					<BIcon name="o-forward" :size="22" />
				</button>
				<div class="sidebar-rail__divider" aria-hidden="true"></div>
				<button
					type="button"
					class="sidebar-rail__btn"
					:title="messages.collections"
					:aria-label="messages.collections"
					@click="onCollections"
				>
					<span class="sidebar-rail__glyph-collection note-collection-glyph" aria-hidden="true"></span>
				</button>
			</div>
			<!-- The archive stands with the recycle bin at the foot of the rail, the pair the expanded
				 panel keeps right above its footer. -->
			<div class="sidebar-rail__pinned">
				<button
					type="button"
					class="sidebar-rail__btn"
					:class="{ 'is-active': state.selectedArchiveView }"
					:title="messages.archive"
					:aria-label="messages.archive"
					data-testid="note-sidebar-rail-archive"
					@click="onArchive"
				>
					<BIcon name="o-box-with-lid" :size="22" />
				</button>
				<button
					type="button"
					class="sidebar-rail__btn"
					:class="{ 'is-active': state.selectedRecycleBinView }"
					:title="messages.recycleBin"
					:aria-label="messages.recycleBin"
					data-testid="note-sidebar-rail-recyclebin"
					@click="onRecycleBin"
				>
					<BIcon name="o-trashcan" :size="22" />
				</button>
			</div>
		</div>
	`,
};

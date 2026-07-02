import { Loc } from 'main.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { markRaw } from 'ui.vue3';
import { Loader } from 'note.ui.loader';
import { ActionMenuService } from 'note.ui.action-menu';
import { CollaborationStatus } from '../../collaboration/collaboration-status';

const ANCESTORS_MENU_MODIFIER = 'note-breadcrumb-ancestors-menu';

export const DocumentHeaderComponent = {
	name: 'NoteEditorDocumentHeader',
	components: {
		BIcon,
		Loader,
	},
	props: {
		collectionLabel: {
			type: String,
			required: true,
		},
		collectionId: {
			type: Number,
			default: 0,
		},
		ancestors: {
			type: Array,
			default: () => [],
		},
		headerDocumentTitle: {
			type: String,
			required: true,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
		isArchived: {
			type: Boolean,
			default: false,
		},
		isTrashed: {
			type: Boolean,
			default: false,
		},
		sharedAccess: {
			type: Boolean,
			default: false,
		},
		viewMode: {
			type: String,
			default: 'normal',
		},
		collaborationStatus: {
			type: String,
			default: CollaborationStatus.IDLE,
		},
		participants: {
			type: Array,
			default: () => [],
		},
		messages: {
			type: Object,
			required: true,
		},
	},
	data()
	{
		return {
			ancestorsMenu: null,
		};
	},
	created()
	{
		this.ancestorsMenu = markRaw(new ActionMenuService({ additionalClassName: ANCESTORS_MENU_MODIFIER }));
	},
	beforeUnmount()
	{
		this.ancestorsMenu?.destroy?.();
		this.ancestorsMenu = null;
	},
	computed: {
		effectiveMode(): string
		{
			// Prefer the loaded document's flags when available, otherwise fall back to viewMode
			// (so during loading the breadcrumb root matches the source page — archive/recyclebin/shared).
			if (this.isTrashed)
			{
				return 'recyclebin';
			}

			if (this.isArchived)
			{
				return 'archive';
			}

			if (this.sharedAccess)
			{
				return 'shared';
			}

			const hint = String(this.viewMode || '');
			if (hint === 'archive' || hint === 'recyclebin' || hint === 'shared')
			{
				return hint;
			}

			return 'normal';
		},
		rootLabel(): string
		{
			if (this.effectiveMode === 'recyclebin')
			{
				return Loc.getMessage('NOTE_EDITOR_BREADCRUMB_TRASH');
			}

			if (this.effectiveMode === 'archive')
			{
				return Loc.getMessage('NOTE_EDITOR_BREADCRUMB_ARCHIVE');
			}

			if (this.effectiveMode === 'shared')
			{
				return Loc.getMessage('NOTE_EDITOR_BREADCRUMB_SHARED');
			}

			return Loc.getMessage('NOTE_EDITOR_BREADCRUMB_COLLECTIONS');
		},
		canOpenCollection(): boolean
		{
			return Boolean(this.collectionLabel) && Number(this.collectionId) > 0;
		},
		showCollectionSegment(): boolean
		{
			return this.effectiveMode === 'normal' && Boolean(this.collectionLabel);
		},
		showAncestorsSegment(): boolean
		{
			return this.effectiveMode === 'normal';
		},
		rootRouteName(): string
		{
			if (this.effectiveMode === 'recyclebin')
			{
				return 'recyclebin';
			}

			if (this.effectiveMode === 'archive')
			{
				return 'archive';
			}

			if (this.effectiveMode === 'shared')
			{
				return 'shared';
			}

			return '';
		},
		isRootClickable(): boolean
		{
			return this.rootRouteName !== '';
		},
		rootHref(): string
		{
			return this.isRootClickable ? this.$router.resolve({ name: this.rootRouteName }).href : '';
		},
		collectionHref(): string
		{
			return this.canOpenCollection
				? this.$router.resolve({ name: 'workspace', params: { id: Number(this.collectionId) } }).href
				: '';
		},
		parentHref(): string
		{
			return this.directParent
				? this.$router.resolve({ name: 'document', params: { id: Number(this.directParent.id) } }).href
				: '';
		},
		hasAncestors(): boolean
		{
			return Array.isArray(this.ancestors) && this.ancestors.length > 0;
		},
		directParent(): Object | null
		{
			if (!this.hasAncestors)
			{
				return null;
			}

			return this.ancestors[this.ancestors.length - 1] ?? null;
		},
		middleAncestors(): Array
		{
			if (!this.hasAncestors)
			{
				return [];
			}

			return this.ancestors.slice(0, -1);
		},
		hasMiddleAncestors(): boolean
		{
			return this.middleAncestors.length > 0;
		},
		effectiveCollaborationStatus(): string
		{
			// IDLE is the pre-connect window before the provider mounts; visually equivalent to CONNECTING.
			return this.collaborationStatus === CollaborationStatus.IDLE
				? CollaborationStatus.CONNECTING
				: this.collaborationStatus;
		},
		collaborationStatusLabel(): string
		{
			const labels = {
				[CollaborationStatus.CONNECTING]: Loc.getMessage('NOTE_EDITOR_COLLAB_STATUS_CONNECTING'),
				[CollaborationStatus.CONNECTED]: Loc.getMessage('NOTE_EDITOR_COLLAB_STATUS_CONNECTED'),
				[CollaborationStatus.SYNCED]: Loc.getMessage('NOTE_EDITOR_COLLAB_STATUS_SYNCED'),
				[CollaborationStatus.DISCONNECTED]: Loc.getMessage('NOTE_EDITOR_COLLAB_STATUS_DISCONNECTED'),
				[CollaborationStatus.UNKNOWN]: Loc.getMessage('NOTE_EDITOR_COLLAB_STATUS_UNKNOWN'),
			};

			return labels[this.effectiveCollaborationStatus] || labels[CollaborationStatus.UNKNOWN];
		},
		visibleParticipants(): Array
		{
			return Array.isArray(this.participants) ? this.participants.slice(0, 3) : [];
		},
		extraParticipantsCount(): number
		{
			const total = Array.isArray(this.participants) ? this.participants.length : 0;

			return total > 3 ? total - 3 : 0;
		},
	},
	emits: ['open-collection', 'open-root', 'open-document'],
	methods: {
		handleCollectionClick(): void
		{
			if (this.canOpenCollection)
			{
				this.$emit('open-collection', Number(this.collectionId));
			}
		},
		handleRootClick(): void
		{
			if (this.isRootClickable)
			{
				this.$emit('open-root', this.rootRouteName);
			}
		},
		handleParentClick(): void
		{
			if (this.directParent)
			{
				this.$emit('open-document', Number(this.directParent.id));
			}
		},
		handleMoreClick(): void
		{
			if (!this.hasMiddleAncestors || !this.ancestorsMenu)
			{
				return;
			}

			const target = this.$refs.ancestorsMoreButton;
			if (!target)
			{
				return;
			}

			const items = this.middleAncestors.map((ancestor) => ({
				text: String(ancestor.title || `#${Number(ancestor.id)}`),
				onClick: () => {
					this.$emit('open-document', Number(ancestor.id));
				},
			}));

			this.ancestorsMenu.open(items, target, { key: 'breadcrumb-ancestors' });
		},
	},
	// language=Vue
	template: `
		<div class="note-page-document-header">
			<div class="note-page-document-titles">
				<div class="note-page-breadcrumb">
					<a
						v-if="isRootClickable"
						class="note-page-breadcrumb-link note-page-breadcrumb-root"
						:href="rootHref"
						:title="rootLabel"
						@click.prevent="handleRootClick"
					>{{ rootLabel }}</a>
					<span v-else class="note-page-breadcrumb-root" :title="rootLabel">{{ rootLabel }}</span>
					<template v-if="showCollectionSegment">
						<BIcon class="note-page-breadcrumb-separator" name="chevron-right-s" :size="24" />
						<a
							v-if="canOpenCollection"
							class="note-page-breadcrumb-link"
							:href="collectionHref"
							:title="collectionLabel"
							@click.prevent="handleCollectionClick"
						>{{ collectionLabel }}</a>
						<span v-else class="note-page-breadcrumb-text" :title="collectionLabel">{{ collectionLabel }}</span>
					</template>
					<template v-if="showAncestorsSegment && hasMiddleAncestors">
						<BIcon class="note-page-breadcrumb-separator" name="chevron-right-s" :size="24" />
						<button
							ref="ancestorsMoreButton"
							type="button"
							class="note-page-breadcrumb-more-button"
							@click="handleMoreClick"
						><BIcon class="note-page-breadcrumb-more" name="more-s" :size="24" /></button>
					</template>
					<template v-if="showAncestorsSegment && directParent">
						<BIcon class="note-page-breadcrumb-separator" name="chevron-right-s" :size="24" />
						<a
							class="note-page-breadcrumb-link"
							:href="parentHref"
							:title="directParent.title || ('#' + directParent.id)"
							@click.prevent="handleParentClick"
						>{{ directParent.title || ('#' + directParent.id) }}</a>
					</template>
					<BIcon class="note-page-breadcrumb-separator" name="chevron-right-s" :size="24" />
					<Loader
						v-if="isLoading && !headerDocumentTitle"
						class="note-page-breadcrumb-current-loader"
						:label="messages.loading"
					/>
					<span v-else class="note-page-breadcrumb-current" :title="headerDocumentTitle">{{ headerDocumentTitle }}</span>
				</div>
			</div>
			<div class="note-page-document-header-right">
				<div
					class="note-editor-collaboration-status"
					:data-status="effectiveCollaborationStatus"
					:title="collaborationStatusLabel"
				>
					<span class="note-editor-collaboration-status-dot"></span>
				</div>
				<div
					v-if="visibleParticipants.length > 0 || extraParticipantsCount > 0"
					class="note-page-document-members"
				>
					<span
						v-for="(participant, index) in visibleParticipants"
						:key="participant.id || index"
						class="note-page-document-member"
						:title="participant.name || ''"
						:style="participant.avatar ? { backgroundImage: 'url(' + participant.avatar + ')' } : null"
					></span>
					<span
						v-if="extraParticipantsCount > 0"
						class="note-page-document-member-extra"
					>+{{ extraParticipantsCount }}</span>
				</div>
			</div>
		</div>
	`,
};

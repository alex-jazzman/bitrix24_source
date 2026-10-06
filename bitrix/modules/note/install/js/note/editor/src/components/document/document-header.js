import 'ui.buttons';
import 'ui.icon-set.outline';
import { Loc } from 'main.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { markRaw } from 'ui.vue3';
import { Loader } from 'note.ui.loader';
import { ActionMenuService } from 'note.ui.action-menu';
import { NoteAvatarStack } from 'note.ui.avatar-stack';
import { CollaborationStatus } from '../../collaboration/collaboration-status';

const ANCESTORS_MENU_MODIFIER = 'note-breadcrumb-ancestors-menu';

export const DocumentHeaderComponent = {
	name: 'NoteEditorDocumentHeader',
	components: {
		BIcon,
		Loader,
		NoteAvatarStack,
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
		isEditMode: {
			type: Boolean,
			default: false,
		},
		// [#11 rework] Whether the main editor currently shows a read-only version preview
		// (note.editor's DocumentEditorComponent) — morphs the primary action button from
		// Edit/Done into Restore (mockup's `pvActions="meta"`: editBtn → IC_RESTORE), and shows
		// an explicit "exit preview" affordance alongside it.
		isPreviewing: {
			type: Boolean,
			default: false,
		},
		isRestoringVersion: {
			type: Boolean,
			default: false,
		},
		canEdit: {
			type: Boolean,
			default: false,
		},
		// Why finishing the edit session is unavailable while canEdit is still true, or null when it is
		// available. Editing itself stays open in that state - what is gone is the way back to the
		// server, so it is the Done button this blocks, not the Edit one.
		saveBlockedReason: {
			type: String,
			default: null,
		},
		isSaving: {
			type: Boolean,
			default: false,
		},
		isMobile: {
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
			// Width of the row and the natural widths of its units: what decides whether the root point
			// still has room beside the document (see isRootPointCollapsed).
			availableWidth: 0,
			crumbWidths: {},
			measurePass: false,
		};
	},
	created()
	{
		this.ancestorsMenu = markRaw(new ActionMenuService({ additionalClassName: ANCESTORS_MENU_MODIFIER }));
		this.breadcrumbResizeObserver = null;
	},
	mounted()
	{
		this.scheduleCrumbMeasure();

		if (typeof ResizeObserver === 'function' && this.$refs.breadcrumb)
		{
			this.breadcrumbResizeObserver = new ResizeObserver(() => this.updateAvailableWidth());
			this.breadcrumbResizeObserver.observe(this.$refs.breadcrumb);
		}
	},
	beforeUnmount()
	{
		this.ancestorsMenu?.destroy?.();
		this.ancestorsMenu = null;
		this.breadcrumbResizeObserver?.disconnect?.();
		this.breadcrumbResizeObserver = null;
	},
	watch: {
		crumbSignature(): void
		{
			// Labels changed - the measured widths belong to the previous path, so measure again.
			this.scheduleCrumbMeasure();
		},
	},
	computed: {
		canShowEditButton(): boolean
		{
			return !this.isArchived && !this.isTrashed;
		},
		// [#11 rework] Takes priority over the edit/done branch regardless of isEditMode — a
		// version preview can in principle be opened while mid-edit (the sidebar tiles are always
		// clickable), and Restore is the only sensible primary action for the header at that point.
		showRestoreButton(): boolean
		{
			return this.isPreviewing && this.canShowEditButton;
		},
		restoreButtonDisabled(): boolean
		{
			return this.isLoading || !this.canEdit || this.isRestoringVersion;
		},
		primaryButtonDisabled(): boolean
		{
			if (this.isLoading)
			{
				return true;
			}

			if (this.isEditMode)
			{
				return this.isSaving;
			}

			return this.isSaving || !this.canEdit;
		},
		// Blocked is not the same as disabled. The button keeps its place, its look and its slot in the
		// tab order, but does not finish the session: a native `disabled` would drop it out of the tab
		// order, and the reason - the only thing that explains why the text is not being saved - would be
		// reachable by mouse hover alone. Pressing it says the reason instead (finishEdit answers it).
		isSaveBlocked(): boolean
		{
			return Boolean(this.saveBlockedReason) && !this.primaryButtonDisabled;
		},
		// A11Y (WCAG 2.5.3, label in name): the accessible name has to contain the visible label, so the
		// reason is appended to it rather than replacing it. On the mobile render there is no visible
		// label, and this is what tells the icon apart from its neighbours - so that one always takes the
		// name, while the desktop button takes it only while it carries the reason: with a visible label
		// and nothing to add, an aria-label would only repeat what is written on the button.
		doneButtonAriaLabel(): string
		{
			return this.saveBlockedReason
				? `${this.messages.done}. ${this.saveBlockedReason}`
				: this.messages.done;
		},
		secondaryActionsDisabled(): boolean
		{
			return this.isLoading;
		},
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
			// Shared mode shows the container too - see rootPointCrumb for how it renders there.
			return (this.effectiveMode === 'normal' || this.effectiveMode === 'shared')
				&& Boolean(this.collectionLabel);
		},
		showAncestorsSegment(): boolean
		{
			// In shared mode the server already truncated the chain at the first ancestor the
			// user may not see, so every crumb here is openable.
			return this.effectiveMode === 'normal' || this.effectiveMode === 'shared';
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
		hasAncestors(): boolean
		{
			return Array.isArray(this.ancestors) && this.ancestors.length > 0;
		},
		// The path is four slots at most, whatever the depth of the document: the section, the point the
		// section starts from (the knowledge base), one "…" standing for everything in between, and the
		// document itself. Archive and the recycle bin have no root point and no chain, so there it is
		// the section and the document. The row used to lay every ancestor out and drop them into the
		// "…" only when it ran out of width, so the same document read differently at two window sizes.
		rootPointCrumb(): Object | null
		{
			if (!this.showCollectionSegment || !this.collectionLabel)
			{
				return null;
			}

			return {
				key: 'collection',
				// Shared mode shows the container too, but as plain text: without a collectionId
				// canOpenCollection stays false and the crumb renders non-clickable.
				type: this.canOpenCollection ? 'collection' : 'text',
				id: Number(this.collectionId) || 0,
				title: String(this.collectionLabel),
				href: this.canOpenCollection ? this.collectionHref : '',
			};
		},
		// Every document between the root point and the current one. Always behind the "…", however much
		// room the row has: laid out inline they made the same document read differently at two window
		// sizes, and the chain of a deep document ate the width its own title needed.
		ancestorCrumbs(): Array
		{
			if (!this.showAncestorsSegment || !this.hasAncestors)
			{
				return [];
			}

			return this.ancestors.map((ancestor) => {
				const id = Number(ancestor.id) || 0;

				return {
					key: `anc-${id}`,
					type: 'ancestor',
					id,
					title: String(ancestor.title || `#${id}`),
					href: this.ancestorHref(id),
				};
			});
		},
		crumbSignature(): string
		{
			// Cheap change detector for the path - triggers a width re-measure when the labels change.
			return JSON.stringify({
				mode: this.effectiveMode,
				root: this.rootLabel,
				point: this.rootPointCrumb?.title ?? '',
				current: this.headerDocumentTitle,
				ancestors: this.ancestorCrumbs.length,
			});
		},
		// Too narrow a row drops the root point into the "…" as well, so what is left is the section and
		// the document. Decided on natural widths (measured with nothing shrunk), not on what the flexbox
		// has already squeezed - otherwise the answer would depend on its own previous answer.
		isRootPointCollapsed(): boolean
		{
			if (!this.rootPointCrumb || this.measurePass)
			{
				return false;
			}

			const widths = this.crumbWidths;
			if (this.availableWidth <= 0 || !Number.isFinite(widths.point))
			{
				return false;
			}

			const needed = (widths.root || 0)
				+ widths.point
				+ (this.ancestorCrumbs.length > 0 ? (widths.more || 0) : 0)
				+ (widths.current || 0);

			return needed > this.availableWidth;
		},
		showRootPointInline(): boolean
		{
			return Boolean(this.rootPointCrumb) && !this.isRootPointCollapsed;
		},
		// What the "…" stands for, in path order: the root point when it had to give up its place,
		// then the documents between it and the current one.
		collapsedCrumbs(): Array
		{
			const crumbs = this.isRootPointCollapsed ? [this.rootPointCrumb] : [];

			return [...crumbs, ...this.ancestorCrumbs];
		},
		showMoreButton(): boolean
		{
			return this.collapsedCrumbs.length > 0;
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
	},
	emits: ['open-collection', 'open-root', 'open-document', 'enter-edit-mode', 'finish-edit', 'copy-link', 'open-more', 'scroll-to-participant', 'restore-version', 'exit-preview'],
	methods: {
		handleRootClick(): void
		{
			if (this.isRootClickable)
			{
				this.$emit('open-root', this.rootRouteName);
			}
		},
		handleCrumbClick(crumb: Object): void
		{
			if (crumb?.type === 'collection')
			{
				this.$emit('open-collection', Number(crumb.id));
			}
			else if (crumb?.type === 'ancestor')
			{
				this.$emit('open-document', Number(crumb.id));
			}
		},
		ancestorHref(id: number): string
		{
			const documentId = Number(id) || 0;

			return documentId > 0
				? this.$router.resolve({ name: 'document', params: { id: documentId } }).href
				: '';
		},
		handleMoreClick(): void
		{
			if (!this.ancestorsMenu || this.collapsedCrumbs.length === 0)
			{
				return;
			}

			const target = this.$refs.moreButton;
			if (!target)
			{
				return;
			}

			const items = this.collapsedCrumbs.map((crumb) => ({
				text: crumb.title,
				onClick: () => this.handleCrumbClick(crumb),
			}));

			this.ancestorsMenu.open(items, target, { key: 'breadcrumb-overflow' });
		},
		updateAvailableWidth(): void
		{
			const el = this.$refs.breadcrumb;
			if (el instanceof HTMLElement)
			{
				this.availableWidth = el.clientWidth;
			}
		},
		measureCrumbs(): void
		{
			// Natural width of every unit, each including its leading separator. Read during a measure
			// pass, when nothing shrinks - see the `--measuring` rule in the stylesheet.
			const widths = {};
			const units = { root: 'rootUnit', point: 'rootPointUnit', more: 'moreUnit', current: 'currentUnit' };
			for (const [key, ref] of Object.entries(units))
			{
				const el = this.$refs[ref];
				if (el instanceof HTMLElement && el.offsetWidth > 0)
				{
					widths[key] = el.offsetWidth;
				}
			}

			// The "…" is out of the row whenever there is nothing behind it, and a width of its own is
			// still needed to answer whether the root point fits beside it. Keep the last one read.
			if (!Number.isFinite(widths.more) && Number.isFinite(this.crumbWidths.more))
			{
				widths.more = this.crumbWidths.more;
			}

			this.crumbWidths = widths;
		},
		scheduleCrumbMeasure(): void
		{
			this.measurePass = true;
			this.$nextTick(() => {
				this.measureCrumbs();
				this.updateAvailableWidth();
				this.measurePass = false;
			});
		},
	},
	// language=Vue
	template: `
		<div class="note-page-document-header">
			<div class="note-page-document-titles">
				<div ref="breadcrumb" class="note-page-breadcrumb" :class="{ '--measuring': measurePass }">
					<span ref="rootUnit" class="note-page-breadcrumb-unit --root">
						<a
							v-if="isRootClickable"
							class="note-page-breadcrumb-link note-page-breadcrumb-root"
							:href="rootHref"
							:title="rootLabel"
							@click.prevent="handleRootClick"
						>{{ rootLabel }}</a>
						<span v-else class="note-page-breadcrumb-root" :title="rootLabel">{{ rootLabel }}</span>
					</span>
					<span
						v-if="rootPointCrumb"
						v-show="showRootPointInline || measurePass"
						ref="rootPointUnit"
						class="note-page-breadcrumb-unit"
					>
						<BIcon class="note-page-breadcrumb-separator" name="chevron-right-s" :size="20" />
						<a
							v-if="rootPointCrumb.href"
							class="note-page-breadcrumb-link"
							:href="rootPointCrumb.href"
							:title="rootPointCrumb.title"
							@click.prevent="handleCrumbClick(rootPointCrumb)"
						>{{ rootPointCrumb.title }}</a>
						<span v-else class="note-page-breadcrumb-text" :title="rootPointCrumb.title">{{ rootPointCrumb.title }}</span>
					</span>
					<span
						v-show="showMoreButton || measurePass"
						ref="moreUnit"
						class="note-page-breadcrumb-unit --more"
					>
						<BIcon class="note-page-breadcrumb-separator" name="chevron-right-s" :size="20" />
						<button
							ref="moreButton"
							type="button"
							class="note-page-breadcrumb-more-button"
							:aria-label="messages.more"
							@click="handleMoreClick"
						><BIcon class="note-page-breadcrumb-more" name="more-s" :size="20" /></button>
					</span>
					<span ref="currentUnit" class="note-page-breadcrumb-unit --current">
						<BIcon class="note-page-breadcrumb-separator" name="chevron-right-s" :size="20" />
						<Loader
							v-if="isLoading && !headerDocumentTitle"
							class="note-page-breadcrumb-current-loader"
							:label="messages.loading"
						/>
						<span v-else class="note-page-breadcrumb-current" :title="headerDocumentTitle">{{ headerDocumentTitle }}</span>
					</span>
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
				<NoteAvatarStack
					:participants="participants"
					:compact="isMobile"
					:viewing-label="messages.participantViewing"
					:editing-label="messages.participantEditing"
					:self-label-template="messages.participantSelf"
					:menu-aria-label="messages.participantsTitle"
					@activate="(participant) => $emit('scroll-to-participant', Number(participant.id))"
				/>
				<div class="note-page-document-actions">
					<button
						v-if="isPreviewing"
						type="button"
						class="note-page-document-action-icon"
						:title="messages.exitPreview"
						:aria-label="messages.exitPreview"
						@click="$emit('exit-preview')"
					>
						<div class="ui-icon-set --cross-l"></div>
					</button>
					<template v-if="isMobile">
						<!-- Mobile is view-only for versions: no restore action, and edit/done stay hidden while previewing. -->
						<button
							v-if="!isPreviewing && canShowEditButton && !isEditMode"
							type="button"
							class="note-page-document-action-icon"
							:title="messages.edit"
							:aria-label="messages.edit"
							:disabled="primaryButtonDisabled"
							data-testid="note-doc-edit"
							@click="$emit('enter-edit-mode')"
						>
							<div class="ui-icon-set --edit-l"></div>
						</button>
						<button
							v-else-if="!isPreviewing && canShowEditButton"
							type="button"
							class="note-page-document-action-icon"
							:title="saveBlockedReason ?? messages.done"
							:aria-label="doneButtonAriaLabel"
							:aria-disabled="isSaveBlocked ? 'true' : null"
							:disabled="primaryButtonDisabled"
							data-testid="note-doc-done"
							@click="$emit('finish-edit')"
						>
							<div class="ui-icon-set --check-l"></div>
						</button>
						<button
							type="button"
							class="note-page-document-action-icon"
							:title="messages.more"
							:aria-label="messages.more"
							:disabled="secondaryActionsDisabled"
							data-testid="note-doc-more"
							@click="(e) => $emit('open-more', e.currentTarget)"
						>
							<div class="ui-icon-set --more-l"></div>
						</button>
					</template>
					<template v-else>
						<button
							v-if="showRestoreButton"
							type="button"
							class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps --with-left-icon"
							:disabled="restoreButtonDisabled"
							data-testid="note-doc-restore-version"
							@click="$emit('restore-version')"
						>
							<div class="ui-icon-set --o-undo"></div>
							{{ isRestoringVersion ? messages.restoringVersion : messages.restoreVersion }}
						</button>
						<button
							v-else-if="canShowEditButton && !isEditMode"
							type="button"
							class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps --with-left-icon"
							:disabled="primaryButtonDisabled"
							data-testid="note-doc-edit"
							@click="$emit('enter-edit-mode')"
						>
							<div class="ui-icon-set --edit-l"></div>
							{{ messages.edit }}
						</button>
						<button
							v-else-if="canShowEditButton"
							type="button"
							class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps"
							:class="{ 'ui-btn-disabled': isSaveBlocked }"
							:title="saveBlockedReason"
							:aria-label="saveBlockedReason ? doneButtonAriaLabel : null"
							:aria-disabled="isSaveBlocked ? 'true' : null"
							:disabled="primaryButtonDisabled"
							data-testid="note-doc-done"
							@click="$emit('finish-edit')"
						>
							{{ messages.done }}
						</button>
						<button
							type="button"
							class="note-page-document-action-icon"
							:title="messages.copyLink"
							:aria-label="messages.copyLink"
							:disabled="secondaryActionsDisabled"
							data-testid="note-doc-copy-link"
							@click="$emit('copy-link')"
						>
							<div class="ui-icon-set --o-link"></div>
						</button>
						<button
							type="button"
							class="note-page-document-action-icon"
							:title="messages.more"
							:aria-label="messages.more"
							:disabled="secondaryActionsDisabled"
							data-testid="note-doc-more"
							@click="(e) => $emit('open-more', e.currentTarget)"
						>
							<div class="ui-icon-set --more-l"></div>
						</button>
					</template>
				</div>
			</div>
		</div>
	`,
};

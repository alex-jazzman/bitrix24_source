import { createDocumentFeature } from '../../feature/create-document-feature';
import { createDocumentState } from '../../feature/create-document-state';
import { DocumentActionMenuService } from '../../services/document-action-menu-service';
import { DocumentHeaderComponent } from './document-header';
import { DocumentContentComponent } from './document-content';
import { DocumentChildrenComponent } from './document-children';
import { Type } from 'main.core';
import 'ui.notification';
import { markRaw } from 'ui.vue3';
import { copyTextToClipboard } from '../../utils/clipboard';

export const NoteDocumentPageComponent = {
	name: 'NoteDocumentPage',
	components: {
		DocumentHeaderComponent,
		DocumentContentComponent,
		DocumentChildrenComponent,
	},
	props: {
		documentId: {
			type: Number,
			required: true,
		},
		routeDocumentContext: {
			type: Object,
			required: true,
		},
		children: {
			type: Array,
			default: () => [],
		},
		childrenLoading: {
			type: Boolean,
			default: false,
		},
		childrenHasMore: {
			type: Boolean,
			default: false,
		},
		loadMoreChildren: {
			type: Function,
			default: () => {},
		},
		documentActions: {
			type: Object,
			default: () => ({}),
		},
	},
	data()
	{
		return {
			state: createDocumentState(),
			feature: null,
			actionMenuService: null,
		};
	},
	created()
	{
		this.feature = createDocumentFeature({
			state: this.state,
			getDocumentId: () => this.documentId,
			nextTick: () => this.$nextTick(),
			onOpenInternalLink: (payload) => this.handleOpenInternalLink(payload),
			onHardDelete: ({ mode }) => this.handleRemoteHardDelete(mode),
			onAccessRevoked: () => this.handleAccessRevoked(),
		});
		this.actionMenuService = markRaw(new DocumentActionMenuService(this.feature?.messages ?? {}));
	},
	computed: {
		routeContextSyncKey(): Object
		{
			const context = this.routeDocumentContext ?? {};

			return {
				status: String(context.status || ''),
				docId: Number(context.docId || 0),
				errorMessage: String(context.errorMessage || ''),
				document: Type.isPlainObject(context.document)
					? context.document
					: null,
			};
		},
		messages(): Object
		{
			return this.feature?.messages ?? {};
		},
		isEditMode(): boolean
		{
			return this.feature?.isEditMode?.() ?? false;
		},
		canEdit(): boolean
		{
			return this.feature?.canEdit?.() ?? false;
		},
		canEditCollection(): boolean
		{
			return Boolean(this.state.canEditCollection);
		},
		canManagePermissions(): boolean
		{
			return Boolean(this.state.canManagePermissions);
		},
		collectionId(): number
		{
			return Number(this.state.collectionId || 0);
		},
		sharedAccess(): boolean
		{
			return Boolean(this.state.sharedAccess);
		},
		isArchived(): boolean
		{
			return Boolean(this.state.isArchived);
		},
		isTrashed(): boolean
		{
			return Boolean(this.state.isTrashed);
		},
		trashedAt(): string | null
		{
			return this.state.trashedAt ?? null;
		},
		isOrphan(): boolean
		{
			return Boolean(this.state.isOrphan);
		},
		canRestore(): boolean
		{
			return Boolean(this.state.canRestore);
		},
		canHardDelete(): boolean
		{
			return Boolean(this.state.canHardDelete);
		},
		headerDocumentTitle(): string
		{
			return this.feature?.headerDocumentTitle?.() ?? '';
		},
		collectionLabel(): string
		{
			return this.feature?.collectionLabel?.() ?? '';
		},
		ancestors(): Array
		{
			return Array.isArray(this.state.ancestors) ? this.state.ancestors : [];
		},
		viewMode(): string
		{
			const mode = String(this.routeDocumentContext?.viewMode || '');

			return mode === '' ? 'normal' : mode;
		},
		collaborationParticipants(): Array
		{
			const participants = this.feature?.collaborationParticipants?.();

			return Array.isArray(participants) ? participants : [];
		},
		hasChildrenBlock(): boolean
		{
			return this.children.length > 0;
		},
	},
	watch: {
		routeContextSyncKey: {
			async handler()
			{
				if (!this.feature)
				{
					return;
				}

				await this.feature.applyRouteDocumentContext(this.routeDocumentContext);

				if (String(this.routeDocumentContext?.status || '') === 'ready' && this.$route?.hash)
				{
					void this.feature.scrollToAnchor(this.$route.hash);
				}
			},
			immediate: true,
		},
		'$route.hash'(nextHash)
		{
			if (this.feature && !this.state.isLoading && Type.isStringFilled(nextHash))
			{
				void this.feature.scrollToAnchor(nextHash);
			}
		},
	},
	beforeUnmount()
	{
		this.actionMenuService?.destroy?.();
		this.actionMenuService = null;
		this.feature?.destroy?.();
	},
	methods: {
		enterEditMode(): void
		{
			if (this.feature)
			{
				void this.feature.enterEditMode();
			}
		},
		finishEdit(): void
		{
			if (this.feature)
			{
				void this.feature.finishEdit();
			}
		},
		openChildDocument(child: Object): void
		{
			this.$router.push({ name: 'document', params: { id: child.id } });
		},
		openAncestorDocument(documentId: number): void
		{
			const id = Number(documentId);
			if (!Number.isInteger(id) || id <= 0 || id === Number(this.documentId))
			{
				return;
			}

			this.$router.push({ name: 'document', params: { id } });
		},
		openCollection(collectionId: number): void
		{
			const id = Number(collectionId);
			if (!Number.isInteger(id) || id <= 0)
			{
				return;
			}

			this.$router.push({ name: 'workspace', params: { id } });
		},
		openRoot(routeName: string): void
		{
			if (typeof routeName !== 'string' || routeName === '')
			{
				return;
			}

			this.$router.push({ name: routeName });
		},
		handleRemoteHardDelete(mode: string): void
		{
			const allowedModes = ['recyclebin', 'archive', 'home'];
			const target = allowedModes.includes(mode) ? mode : 'home';
			this.$router.replace({ name: target });
		},
		handleAccessRevoked(): void
		{
			this.$router.replace({ name: 'home' });
		},
		handleOpenInternalLink(payload: Object): void
		{
			if (!payload)
			{
				return;
			}

			if (payload.type === 'anchor')
			{
				const anchorHash = String(payload.hash || '').trim();
				if (anchorHash === '')
				{
					return;
				}

				// When the hash actually changes, the `$route.hash` watcher runs
				// scrollToAnchor — calling it here too would double every jump
				// (two DOM passes, two pinning sessions). Scroll directly only
				// when the hash is unchanged and the watcher won't fire.
				const nextHash = `#${anchorHash}`;
				this.$router.replace({ hash: nextHash }).catch(() => {});
				if (this.$route.hash === nextHash)
				{
					void this.feature?.scrollToAnchor(anchorHash);
				}

				return;
			}

			if (payload.type !== 'document')
			{
				return;
			}

			const id = Number(payload.id);
			if (!Number.isInteger(id) || id <= 0)
			{
				return;
			}

			const hash = String(payload.hash || '').trim();

			if (Number(this.documentId) === id)
			{
				if (hash !== '')
				{
					const nextHash = `#${hash}`;
					this.$router.replace({ hash: nextHash }).catch(() => {});
					if (this.$route.hash === nextHash)
					{
						void this.feature?.scrollToAnchor(hash);
					}
				}

				return;
			}

			const target = { name: 'document', params: { id } };
			if (hash !== '')
			{
				target.hash = `#${hash}`;
			}

			this.$router.push(target);
		},
		buildDocumentLink(): string
		{
			const id = Number(this.documentId);
			if (!Number.isInteger(id) || id <= 0)
			{
				return '';
			}

			const { origin } = window.location;

			return `${origin}/note/document/${id}/`;
		},
		async copyDocumentLink(): Promise<void>
		{
			const url = this.buildDocumentLink();
			if (!url)
			{
				return;
			}

			if (await copyTextToClipboard(url))
			{
				BX.UI.Notification.Center.notify({
					content: this.messages.copyLinkDone,
					position: 'top-right',
				});
			}
		},
		async copyDocumentMarkdown(): Promise<void>
		{
			const markdown = this.feature?.getEditorMarkdown?.();
			if (!Type.isStringFilled(markdown))
			{
				BX.UI.Notification.Center.notify({
					content: this.messages.unavailable,
					position: 'top-right',
				});

				return;
			}

			if (await copyTextToClipboard(markdown))
			{
				BX.UI.Notification.Center.notify({
					content: this.messages.copyMarkdownDone,
					position: 'top-right',
				});
			}
		},
		openMoreMenu(target: HTMLElement): void
		{
			if (!this.actionMenuService || !target)
			{
				return;
			}

			const actions = this.documentActions ?? {};
			this.actionMenuService.open(this.documentId, target, {
				isArchived: this.isArchived,
				isTrashed: this.isTrashed,
				isOrphan: this.isOrphan,
				canRestore: this.canRestore,
				canHardDelete: this.canHardDelete,
				canEditCollection: this.canEditCollection,
				canManagePermissions: this.canManagePermissions,
				documentTitle: this.headerDocumentTitle,
				onCopyMarkdown: () => this.copyDocumentMarkdown(),
				onArchive: typeof actions.archive === 'function' ? () => actions.archive(this.documentId) : null,
				onRestore: typeof actions.restore === 'function' ? () => actions.restore(this.documentId) : null,
				onDelete: typeof actions.delete === 'function' ? () => actions.delete(this.documentId) : null,
				// Editor owns the freshest recycleBinId/isOrphan (synced via getMyAccess after
				// a push-driven mode flip). The app-level handler doesn't share state with the
				// editor, so we hand the values over at click time instead of having it read
				// from a stale routeDocumentContext.document.
				onRestoreFromTrash: typeof actions.restoreFromTrash === 'function'
					? () => actions.restoreFromTrash(this.documentId, {
						recycleBinId: Number(this.state.recycleBinId) || 0,
						isOrphan: this.isOrphan,
					})
					: null,
				onHardDelete: typeof actions.hardDelete === 'function'
					? () => actions.hardDelete(this.documentId, {
						recycleBinId: Number(this.state.recycleBinId) || 0,
					})
					: null,
			});
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-document-shell">
			<teleport to="#note-page-header-slot">
				<DocumentHeaderComponent
					:collection-label="collectionLabel"
					:collection-id="collectionId"
					:ancestors="ancestors"
					:header-document-title="headerDocumentTitle"
					:is-loading="state.isLoading"
					:is-archived="isArchived"
					:is-trashed="isTrashed"
					:shared-access="sharedAccess"
					:view-mode="viewMode"
					:collaboration-status="state.collaborationStatus"
					:participants="collaborationParticipants"
					:messages="messages"
					@open-collection="openCollection"
					@open-root="openRoot"
					@open-document="openAncestorDocument"
				/>
			</teleport>
			<DocumentContentComponent
				:is-loading="state.isLoading"
				:loading-label="messages.loading"
				:editor-mount-id="state.editorMountId"
				:has-children-block="hasChildrenBlock"
				:is-edit-mode="isEditMode"
				:can-edit="canEdit"
				:is-archived="isArchived"
				:is-trashed="isTrashed"
				:trashed-at="trashedAt"
				:is-orphan="isOrphan"
				:can-restore="canRestore"
				:is-saving="state.isSaving"
				:messages="messages"
				@enter-edit-mode="enterEditMode"
				@finish-edit="finishEdit"
				@copy-link="copyDocumentLink"
				@open-more="openMoreMenu"
			>
				<DocumentChildrenComponent
					v-if="!state.isLoading"
					:children="children"
					:children-loading="childrenLoading"
					:children-has-more="childrenHasMore"
					:load-more-children="loadMoreChildren"
					:documents-label="messages.documents"
					@open-child="openChildDocument"
				/>
			</DocumentContentComponent>
		</div>
	`,
};

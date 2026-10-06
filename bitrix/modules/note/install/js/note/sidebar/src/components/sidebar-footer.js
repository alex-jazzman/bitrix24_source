import { Loc, Type } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { ImportDialog } from 'note.import';
import { App as PermissionsApp } from 'note.permissions';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

export const SidebarFooter = {
	name: 'SidebarFooter',
	components: {
		BIcon,
	},
	props: {
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
		themeActions: { type: Object, default: null },
	},
	emits: ['toggle-collapsed'],
	computed: {
		canEditGlobalPermissions(): boolean
		{
			return Boolean(this.state?.permissions?.canEditGlobalPermissions);
		},
		isMobile(): boolean
		{
			return Boolean(this.state?.isMobile);
		},
		canImport(): boolean
		{
			return Boolean(this.state?.permissions?.canImport);
		},
		isCollapsed(): boolean
		{
			return Boolean(this.state?.sidebarCollapsed);
		},
		importLabel(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_IMPORT_COLLECTION_MENU') || '';
		},
		permissionsLabel(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_OPEN_PERMISSIONS') || '';
		},
		toggleLabel(): string
		{
			return Loc.getMessage(
				this.isCollapsed ? 'NOTE_SIDEBAR_TOGGLE_EXPAND' : 'NOTE_SIDEBAR_TOGGLE_COLLAPSE',
			) || '';
		},
		toggleIconName(): string
		{
			return this.isCollapsed ? 'chevron-right-l' : 'chevron-left-l';
		},
		hasThemeToggle(): boolean
		{
			return Type.isPlainObject(this.themeActions) && Type.isFunction(this.themeActions.toggle);
		},
		isDarkTheme(): boolean
		{
			return this.themeActions?.state?.theme === 'dark';
		},
		themeIconName(): string
		{
			return this.isDarkTheme ? 'o-sun' : 'o-moon';
		},
		archiveLabel(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_ARCHIVE') || '';
		},
		recycleBinLabel(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_RECYCLE_BIN') || '';
		},
		themeLabel(): string
		{
			return Loc.getMessage(
				this.isDarkTheme ? 'NOTE_SIDEBAR_THEME_TO_LIGHT' : 'NOTE_SIDEBAR_THEME_TO_DARK',
			) || '';
		},
	},
	methods: {
		openImportDialog(): void
		{
			try
			{
				if (!Type.isFunction(ImportDialog))
				{
					throw new TypeError('note.import extension API is not available');
				}

				const dialog = new ImportDialog({
					wikiImportEnabled: Boolean(this.state?.permissions?.canImportWiki),
					onComplete: async () => {
						if (Type.isFunction(this.actions?.refreshCollections))
						{
							await this.actions.refreshCollections();
						}
					},
				});
				dialog.show();
			}
			catch (error)
			{
				console.error('note.sidebar: failed to open import dialog', error);
			}
		},
		onToggleCollapsed(): void
		{
			this.$emit('toggle-collapsed');
		},
		onToggleTheme(): void
		{
			if (this.hasThemeToggle)
			{
				this.themeActions.toggle();
			}
		},
		async onOpenPermissions(): Promise<void>
		{
			try
			{
				if (Type.isFunction(PermissionsApp?.openGlobalSettings))
				{
					PermissionsApp.openGlobalSettings();

					return;
				}
			}
			catch (error)
			{
				console.error('note.sidebar: failed to open permissions', error);
			}

			const sidePanel = SidePanel?.Instance || null;
			if (sidePanel && Type.isFunction(sidePanel.open))
			{
				sidePanel.open('/note/settings/permissions/', { cacheable: false });
			}
		},
	},
	template: `
		<footer class="sidebar-footer" :class="{ 'is-collapsed': isCollapsed }">
			<!-- On a phone these two are icons down here instead of full-width rows above: two rows of the
			     panel is a lot of a screen that short, and the footer strip carries nothing else there. -->
			<button
				v-if="isMobile"
				type="button"
				class="sidebar-footer__btn"
				:class="{ 'is-active': state.selectedArchiveView }"
				:title="archiveLabel"
				:aria-label="archiveLabel"
				data-testid="note-sidebar-archive"
				@click="actions.navigateToArchive()"
			>
				<BIcon class="sidebar-footer__icon" name="o-box-with-lid" :size="24" />
			</button>
			<button
				v-if="isMobile"
				type="button"
				class="sidebar-footer__btn"
				:class="{ 'is-active': state.selectedRecycleBinView }"
				:title="recycleBinLabel"
				:aria-label="recycleBinLabel"
				data-testid="note-sidebar-recyclebin"
				@click="actions.navigateToRecycleBin()"
			>
				<BIcon class="sidebar-footer__icon" name="o-trashcan" :size="24" />
			</button>
			<button
				v-if="canEditGlobalPermissions && !isMobile"
				type="button"
				class="sidebar-footer__btn"
				:title="permissionsLabel"
				:aria-label="permissionsLabel"
				data-testid="note-sidebar-permissions"
				@click="onOpenPermissions"
			>
				<BIcon class="sidebar-footer__icon" name="o-settings" :size="24" />
			</button>
			<button
				v-if="canImport && !isMobile"
				type="button"
				class="sidebar-footer__btn"
				:title="importLabel"
				:aria-label="importLabel"
				data-testid="note-sidebar-import"
				@click="openImportDialog"
			>
				<BIcon class="sidebar-footer__icon" name="o-download" :size="24" />
			</button>
			<button
				v-if="hasThemeToggle"
				type="button"
				class="sidebar-footer__btn sidebar-footer__btn--theme"
				:title="themeLabel"
				:aria-label="themeLabel"
				:aria-pressed="isDarkTheme.toString()"
				data-testid="note-sidebar-theme"
				@click="onToggleTheme"
			>
				<BIcon class="sidebar-footer__icon" :name="themeIconName" :size="24" />
			</button>
			<button
				v-if="!isMobile"
				type="button"
				class="sidebar-footer__btn sidebar-footer__btn--toggle"
				:title="toggleLabel"
				:aria-label="toggleLabel"
				:aria-pressed="isCollapsed.toString()"
				data-testid="note-sidebar-collapse"
				@click="onToggleCollapsed"
			>
				<BIcon class="sidebar-footer__icon" :name="toggleIconName" :size="24" />
			</button>
		</footer>
	`,
};

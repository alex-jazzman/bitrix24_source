import { Type } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import 'ui.notification';
import 'ui.icon-set.outline';
import { NoteTheme, NoteThemeContext } from 'note.ui.theme-context';
import { PermissionsApi } from './permissions-api';

import { NotePermissionsPopup } from './app-popup';
import {
	createCollectionCreateConfig,
	createCollectionEditConfig,
	createDocumentEditConfig,
} from './popup-config';
import type { PopupConfig } from './type';
import type {
	CollectionPopupOptions,
	CollectionPermissionsPayload,
	CreateCollectionPopupOptions,
	DocumentPopupOptions,
	Member,
	PermissionLevel,
} from './type';
import './styles/permissions.css';

class NotePermissionsApp extends NotePermissionsPopup
{
	api: PermissionsApi;
	popup: Object | null;
	popupBody: HTMLElement | null;
	popupConfig: PopupConfig | null;
	popupTheme: string;
	currentTheme: string;
	popupLoadRequestToken: number;
	canSavePermissions: boolean;
	primaryButton: Object | null;
	byLevel: { [PermissionLevel]: Map<string, Member> };
	popupName: string;
	popupNameInput: HTMLInputElement | null;
	sectionsContainer: HTMLElement | null;
	sectionSelectors: { [PermissionLevel]: Object };
	suppressSelectorSync: boolean;

	constructor()
	{
		super();
		this.api = new PermissionsApi();
		this.popup = null;
		this.popupBody = null;
		this.popupConfig = null;
		this.popupTheme = NoteTheme.LIGHT;
		this.popupLoadRequestToken = 0;
		this.canSavePermissions = false;
		this.primaryButton = null;
		this.byLevel = this.createEmptyByLevel();
		this.popupName = '';
		this.popupNameInput = null;
		this.sectionsContainer = null;
		this.sectionSelectors = {};
		this.suppressSelectorSync = false;
	}

	resolveTheme(option: ?string): string
	{
		if (option === NoteTheme.DARK || option === NoteTheme.LIGHT)
		{
			return option;
		}

		return NoteThemeContext.get();
	}

	resolveDesignContext(theme: ?string): string
	{
		return NoteThemeContext.resolveDesignSystemContext(this.resolveTheme(theme));
	}

	openGlobalSettings(options: { theme?: string } = {}): void
	{
		const sidePanel = this.getSidePanel();
		if (!sidePanel || !Type.isFunction(sidePanel.open))
		{
			return;
		}

		sidePanel.open('/note/settings/permissions/', {
			cacheable: false,
			width: 1200,
			designSystemContext: this.resolveDesignContext(options?.theme),
		});
	}

	async openCollectionPopup(collectionId: number, options: CollectionPopupOptions = {}): Promise<void>
	{
		const normalizedId = Number(collectionId);
		if (!Number.isInteger(normalizedId) || normalizedId <= 0)
		{
			return;
		}

		await this.openPopup(
			createCollectionEditConfig(this.api, normalizedId, options),
			this.resolveTheme(options?.theme),
		);
	}

	async openCollectionCreatePopup(options: CreateCollectionPopupOptions = {}): Promise<void>
	{
		await this.openPopup(
			createCollectionCreateConfig(this.api, options),
			this.resolveTheme(options?.theme),
		);
	}

	async openDocumentPopup(documentId: number, options: DocumentPopupOptions = {}): Promise<void>
	{
		const normalizedId = Number(documentId);
		if (!Number.isInteger(normalizedId) || normalizedId <= 0)
		{
			return;
		}

		await this.openPopup(
			createDocumentEditConfig(this.api, normalizedId, options),
			this.resolveTheme(options?.theme),
		);
	}

	async openPopup(config: PopupConfig, theme: ?string = null): Promise<void>
	{
		this.destroyPopup();
		this.popupConfig = config;
		this.popupTheme = theme === NoteTheme.DARK ? NoteTheme.DARK : NoteTheme.LIGHT;
		this.byLevel = this.createEmptyByLevel();
		this.popupName = String(config?.name?.initialValue || '');
		const requestToken = ++this.popupLoadRequestToken;

		this.createPopup();
		this.renderPopupLoader();

		let payload: CollectionPermissionsPayload = {};
		try
		{
			payload = await config.load();
		}
		catch (error)
		{
			if (requestToken !== this.popupLoadRequestToken || !this.popupBody)
			{
				return;
			}

			console.error('note.permissions: failed to load permissions', error);
			this.renderPopupLoadError();
			this.showNotification(config.loadErrorMessage);

			return;
		}

		if (requestToken !== this.popupLoadRequestToken || !this.popupBody)
		{
			return;
		}

		this.hydrateState(payload);
		await this.renderPopupContent();
	}

	destroy(): void
	{
		this.destroyPopup();
	}

	getSidePanel(): Object | null
	{
		return SidePanel?.Instance || null;
	}

	showNotification(content: string): void
	{
		const normalizedContent = String(content || '');
		if (!normalizedContent)
		{
			return;
		}

		BX.UI.Notification.Center.notify({
			content: normalizedContent,
			position: 'top-right',
			autoHideDelay: 3000,
		});
	}

	destroyPopup(skipPopupDestroy: boolean = false): void
	{
		this.popupLoadRequestToken += 1;
		const popup = this.popup;
		this.popup = null;
		if (popup && !skipPopupDestroy)
		{
			if (Type.isFunction(popup.destroy))
			{
				popup.destroy();
			}
			else if (Type.isFunction(popup.hide))
			{
				popup.hide();
			}
		}

		this.popupBody = null;
		this.popupConfig = null;
		this.canSavePermissions = false;
		this.primaryButton = null;
		this.byLevel = this.createEmptyByLevel();
		this.popupName = '';
		this.popupNameInput = null;
		this.sectionsContainer = null;
		this.sectionSelectors = {};
		this.suppressSelectorSync = false;
	}
}

export { NotePermissionsApp };
export const App = new NotePermissionsApp();

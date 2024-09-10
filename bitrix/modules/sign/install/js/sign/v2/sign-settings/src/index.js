import { Tag, Loc, Dom, Reflection, Text } from 'main.core';
import type { Metadata } from 'ui.wizard';
import { Wizard, type WizardOptions } from 'ui.wizard';
import { type DocumentData } from 'sign.v2.document-setup';
import { Preview } from 'sign.v2.preview';
import type { SignOptions } from './types';
import type { Editor } from 'sign.v2.editor';
import './style.css';

export type { SignOptions };

export class SignSettings
{
	#containerId: string;
	#preview: Preview;
	#type: string;
	documentSetup: DocumentSetup;
	documentSend: DocumentSend;
	wizard: Wizard;
	editor: Editor;
	#previewLayout: ?HTMLElement = null;
	#container: HTMLElement | null = null;
	#overlayContainer: HTMLElement | null = null;
	#currentOverlay: HTMLElement | null = null;

	constructor(containerId: string, signOptions: SignOptions, wizardOptions: WizardOptions)
	{
		this.#containerId = containerId;
		this.#preview = new Preview();
		const { complete, ...rest } = wizardOptions ?? {};
		this.wizard = new Wizard(this.getStepsMetadata(), {
			back: { className: 'ui-btn-light-border' },
			next: { className: 'ui-btn-primary' },
			complete: {
				className: 'ui-btn-primary',
				title: Loc.getMessage('SIGN_SETTINGS_SEND_FOR_SIGN'),
				onComplete: () => this.#onComplete(),
				...complete,
			},
			...rest,
		});
		this.wizard.toggleBtnActiveState('next', true);
		const { type = '', config = {} } = signOptions ?? {};
		this.#type = type;
		const { languages } = config.documentSendConfig ?? {};
		const Editor = Reflection.getClass('top.BX.Sign.V2.Editor');
		this.editor = new Editor(type, { languages });
	}

	#createHead(): HTMLElement
	{
		const headerTitle = Loc.getMessage('SIGN_SETTINGS_TITLE');
		const headerTitleSub = this.#type === 'b2b'
			? Loc.getMessage('SIGN_SETTINGS_B2B_TITLE_SUB')
			: Loc.getMessage('SIGN_SETTINGS_B2E_TITLE_SUB')
		;

		return Tag.render`
			<div class="sign-settings__head">
				<div>
					<p class="sign-settings__head_title">${headerTitle}</p>
					<p class="sign-settings__head_title --sub">
						${headerTitleSub}
					</p>
				</div>
			</div>
		`;
	}

	#getLayout(): HTMLElement
	{
		const className = this.#type === 'b2e' ? 'sign-settings --b2e' : 'sign-settings';

		this.#previewLayout = this.#preview.getLayout();

		this.#container = Tag.render`
			<div class="sign-settings__scope ${className}">
				<div class="sign-settings__sidebar">
					${this.#createHead()}
					${this.wizard.getLayout()}
				</div>
				${this.#previewLayout}
			</div>
		`;

		return this.#container;
	}

	#getOverlayContainer(): HTMLElement
	{
		if (!this.#overlayContainer)
		{
			this.#overlayContainer = Tag.render`<div class="sign-settings__overlay"></div>`;
		}
		Dom.hide(this.#overlayContainer);

		return this.#overlayContainer;
	}

	#showCompleteNotification(): void
	{
		const Notification = Reflection.getClass('top.BX.UI.Notification');
		Notification.Center.notify({
			content: Text.encode(Loc.getMessage('SIGN_SETTINGS_COMPLETE_NOTIFICATION_TEXT')),
			autoHideDelay: 4000,
		});
	}

	#onComplete(showNotification: boolean = true): void
	{
		BX.SidePanel.Instance.close();
		if (showNotification)
		{
			this.#showCompleteNotification();
		}
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		if (!urlParams.has('noRedirect'))
		{
			const { entityTypeId, entityId } = this.documentSetup.setupData;
			const detailsUrl = `/crm/type/${entityTypeId}/details/${entityId}/`;
			BX.SidePanel.Instance.open(detailsUrl);
		}
	}

	#renderPages(blocks: DocumentData['blocks'], preparedPages: boolean = false): void
	{
		this.#preview.ready = false;
		this.#preview.setBlocks(blocks);
		this.wizard.toggleBtnActiveState('back', true);
		const handler = (urls, totalPages): void => {
			this.#preview.ready = true;
			this.#preview.urls = urls;
			this.editor.setUrls(urls, totalPages);
			this.wizard.toggleBtnActiveState('back', false);
		};

		this.documentSetup.waitForPagesList(handler, preparedPages);
	}

	#subscribeOnEditorEvents(): void
	{
		this.editor.subscribe('save', ({ data }) => {
			const blocks = data.blocks;
			this.#preview.setBlocks(blocks);
			this.documentSetup.setupData = {
				...this.documentSetup.setupData,
				blocks,
			};
			this.documentSend.documentData = { ...this.documentSend.documentData };
		});
	}

	subscribeOnEvents(): void
	{
		const settingsEvents = [
			{
				type: 'toggleActivity',
				stage: 'setup',
				method: ({ data }) => {
					const { selected } = data;
					this.wizard.toggleBtnActiveState('next', !selected);
				},
			},
			{
				type: 'addFile',
				stage: 'setup',
				method: ({ data }) => {
					this.wizard.toggleBtnActiveState('next', !data.ready);
				},
			},
			{
				type: 'removeFile',
				stage: 'setup',
				method: ({ data }) => {
					this.wizard.toggleBtnActiveState('next', !data.ready);
				},
			},
			{
				type: 'clearFiles',
				stage: 'setup',
				method: () => this.wizard.toggleBtnActiveState('next', true),
			},
			{
				type: 'showEditor',
				stage: 'send',
				method: () => this.editor.show(),
			},
			{
				type: 'changeTitle',
				stage: 'send',
				method: ({ data }) => {
					this.documentSetup.setupData = {
						...this.documentSetup.setupData,
						title: data.title,
					};
					const { blankTitle } = data;
					if (blankTitle)
					{
						const { blankSelector, setupData } = this.documentSetup;
						blankSelector.modifyBlankTitle(setupData.blankId, blankTitle);
					}
				},
			},
			{
				type: 'close',
				stage: 'send',
				method: () => this.#onComplete(false),
			},
			{
				type: 'hidePreview',
				stage: 'send',
				method: () => Dom.style(this.#previewLayout, 'display', 'none'),
			},
			{
				type: 'showPreview',
				stage: 'send',
				method: () => Dom.style(this.#previewLayout, 'display', 'flex'),
			},
			{
				type: 'appendOverlay',
				stage: 'send',
				method: (event) => this.#appendOverlay(event?.data?.overlay),
			},
			{
				type: 'showOverlay',
				stage: 'send',
				method: () => this.#showOverlay(),
			},
			{
				type: 'hideOverlay',
				stage: 'send',
				method: () => this.#hideOverlay(),
			},
		];
		settingsEvents.forEach(({ type, method, stage }) => {
			const step = stage === 'setup' ? this.documentSetup : this.documentSend;
			step.subscribe(type, method);
		});
		this.#subscribeOnEditorEvents();
	}

	#appendOverlay(overlay: ?HTMLElement): void
	{
		if (!overlay)
		{
			return;
		}

		if (this.#currentOverlay)
		{
			Dom.remove(this.#currentOverlay);
		}

		this.#currentOverlay = overlay;

		Dom.append(this.#currentOverlay, this.#overlayContainer);
	}

	async setupDocument(uid?: string, preparedPages: boolean = false): Promise<DocumentData> | null
	{
		if (this.documentSetup.isSameBlankSelected())
		{
			void await this.documentSetup.setup(uid);

			return this.documentSetup.setupData;
		}

		this.#preview.urls = [];
		this.editor.setUrls([], 0);
		this.#preview.setBlocks();
		await this.documentSetup.setup(uid);
		const { setupData } = this.documentSetup;
		if (!setupData)
		{
			return null;
		}

		const { blocks } = setupData;
		this.#renderPages(blocks, preparedPages);

		return setupData;
	}

	render(): void
	{
		const container = document.getElementById(this.#containerId);
		Dom.append(this.#getOverlayContainer(), container);
		Dom.append(this.#getLayout(), container);
		const step = this.documentSetup.setupData ? 1 : 0;
		this.wizard.moveOnStep(step);
	}

	getStepsMetadata(): Metadata
	{
		return {};
	}

	#showOverlay(): void
	{
		Dom.style(this.#container, 'display', 'none');
		Dom.show(this.#overlayContainer);
	}

	#hideOverlay(): void
	{
		Dom.style(this.#container, 'display', 'flex');
		Dom.hide(this.#overlayContainer);
	}
}

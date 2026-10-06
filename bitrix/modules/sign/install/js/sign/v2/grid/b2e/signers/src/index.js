import { Dom, Event, Loc, Type, Text, Tag, Uri } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { AvatarRound } from 'ui.avatar';
import { MessageBox } from 'ui.dialogs.messagebox';

import { Api, type ControllerError } from 'sign.v2.api';
import { type UserParty } from 'sign.v2.b2e.user-party';

import { CreateListPopup } from './popup/create-list';

const GRID_SIGNERS_LISTS = 'SIGN_B2E_SIGNERS_LIST_GRID';
const GRID_SIGNERS = 'SIGN_B2E_SIGNERS_LIST_GRID_EDIT';
const EXPORT_IFRAME_ID = 'sign-b2e-signers-export-iframe';
const EXPORT_IFRAME_NAME_PREFIX = 'sign-b2e-signers-export-';
const TEMPLATE_SEND_PANEL_WIDTH = 1650;
const FEED_RECIPIENTS_LIMIT_ERROR_CODE = 'FEED_RECIPIENTS_LIMIT_EXCEEDED';
const WIZARD_PANEL_WIDTH = 1250;
const RESPONSIBLE_AVATAR_SIZE = 26;
const ADD_LIST_BUTTON_SELECTOR = '.sign-b2e-signers-list-add-button';

export class Signers
{
	static #instance: ?Signers = null;

	#api = new Api();
	#isSliderCloseSubscribed: boolean = false;

	static getInstance(): Signers
	{
		Signers.#instance ??= new Signers();

		return Signers.#instance;
	}

	static renderResponsibleAvatar(container: HTMLElement, userpicPath: string, userName: string): void
	{
		new AvatarRound({
			size: RESPONSIBLE_AVATAR_SIZE,
			userpicPath,
			userName,
		}).renderTo(container);
	}

	/**
	 * Entry point of the groups screen: the page only calls this, so its markup declares no names and
	 * stays runnable when the section is substituted into a ready document. The subscription belongs to
	 * the instance and survives such a substitution, the nodes of the markup do not.
	 */
	initListsPage(): void
	{
		this.#reloadListsAfterSliderClose();

		Event.ready(() => {
			this.hidePinColumnInSettings();

			const addListButton = document.querySelector(ADD_LIST_BUTTON_SELECTOR);
			if (Type.isDomNode(addListButton))
			{
				Event.bind(addListButton, 'click', () => this.createList());
			}
		});
	}

	/**
	 * Subscribes the instance to the closing of a side panel, once for its whole life: with a single
	 * instance per window a repeated call would double the reload of the grid, so the guard belongs
	 * here and not to whoever calls it.
	 */
	#reloadListsAfterSliderClose(): void
	{
		if (this.#isSliderCloseSubscribed)
		{
			return;
		}

		this.#isSliderCloseSubscribed = true;

		const context = window === top ? window : top;

		context.BX.Event.EventEmitter.subscribe(
			'SidePanel.Slider:onCloseComplete',
			(event) => {
				const sliderUrl = event.getData()[0].getSlider().getUrl();
				const path = new Uri(sliderUrl).getPath();

				if (/^\/sign\/b2e\/signers\/\d+\/$/.test(path))
				{
					this.reloadLists();
				}
			},
		);
	}

	reloadSigners(): void
	{
		const gridManager = this.#getGridManager();

		Event.ready(() => {
			const grid = gridManager?.getById(GRID_SIGNERS)?.instance;
			if (Type.isObject(grid))
			{
				grid.reload();
			}
		});
	}

	reloadLists(): void
	{
		const gridManager = this.#getGridManager();

		Event.ready(() => {
			const grid = gridManager?.getById(GRID_SIGNERS_LISTS)?.instance;
			if (Type.isObject(grid))
			{
				grid.reload();
			}
		});
	}

	hidePinColumnInSettings(): void
	{
		const pinColumnSetting = document.querySelector(
			`#${GRID_SIGNERS_LISTS} .main-grid-settings-window-list-item[data-name="PIN"]`,
		);
		if (Type.isDomNode(pinColumnSetting))
		{
			Dom.style(pinColumnSetting, 'display', 'none');
		}
	}

	async deleteList(listId: number, listTitle: ?string = null): Promise<void>
	{
		const messageContent = Tag.render`
			<div>
				${this.#getDeleteListMessage(listTitle)}
			</div>
		`;
		Dom.style(messageContent, 'margin-top', '5%');
		Dom.style(messageContent, 'color', '#535c69');
		Dom.style(messageContent, 'overflow-wrap', 'anywhere');

		MessageBox.show({
			title: Loc.getMessage('SIGN_SIGNERS_DELETE_CONFIRMATION_TITLE_MSGVER_1'),
			message: messageContent.outerHTML,
			modal: true,
			buttons: [
				new BX.UI.Button({
					text: Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_POPUP_YES'),
					color: BX.UI.Button.Color.PRIMARY,
					onclick: async (button) => {
						button.setDisabled(true);
						button.setState(BX.UI.Button.State.WAITING);

						try
						{
							const api = this.#api;
							const response = await api.signersList.deleteSignersList(listId, false);
							if (response.errors?.length > 0)
							{
								throw new Error(response.errors[0].message);
							}

							window.top.BX.UI.Notification.Center.notify({
								content: Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_HINT_SUCCESS'),
							});
						}
						catch
						{
							window.top.BX.UI.Notification.Center.notify({
								content: Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_HINT_FAIL'),
							});
						}

						await this.reloadLists();
						button.getContext().close();
					},
				}),
				new BX.UI.Button({
					text: Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_POPUP_NO'),
					color: BX.UI.Button.Color.LINK,
					onclick: (button) => {
						button.getContext().close();
					},
				}),
			],
		});
	}

	async copyList(listId: number): Promise<void>
	{
		try
		{
			const response = await this.#api.signersList.copySignersList(listId, false);
			if (response.errors?.length > 0)
			{
				throw new Error(response.errors[0].message);
			}
			await this.reloadLists();
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_SIGNERS_GRID_COPY_HINT_SUCCESS'),
			});
		}
		catch (error)
		{
			console.error('Error copying list:', error);
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_SIGNERS_GRID_COPY_HINT_FAIL'),
			});
		}
	}

	/**
	 * Pin cell action of a list row. Called by main.ui.grid with the list id and the pin
	 * state the row was rendered with, so isPinned is the state to return to on failure.
	 */
	async togglePin(listId: number, isPinned: boolean, event: BaseEvent): Promise<void>
	{
		const button = event?.getData()?.button;
		const shouldBePinned = !isPinned;

		// react to the click immediately, the grid reload below brings the server state
		this.#setPinActive(button, shouldBePinned);

		try
		{
			const response = shouldBePinned
				? await this.#api.signersList.pinList(listId, false)
				: await this.#api.signersList.unpinList(listId, false)
			;
			// the api layer returns a rejection as a value when it is asked not to notify, so the
			// success of the call is the contract of its answer, not the absence of errors in it
			if (response?.errors?.length > 0 || response?.pinned !== shouldBePinned)
			{
				throw new Error(response?.errors?.[0]?.message ?? 'The pin state has not changed');
			}
		}
		catch
		{
			this.#setPinActive(button, isPinned);
			window.top.BX.UI.Notification.Center.notify({
				content: shouldBePinned
					? Loc.getMessage('SIGN_SIGNERS_GRID_PIN_HINT_FAIL')
					: Loc.getMessage('SIGN_SIGNERS_GRID_UNPIN_HINT_FAIL'),
			});

			return;
		}

		await this.reloadLists();
	}

	/**
	 * Opens the existing template send screen for a group. The address, including the group
	 * context, is built on the server: the client does not compose screen addresses.
	 */
	openTemplateSend(url: string): void
	{
		BX.SidePanel.Instance.open(url, {
			width: TEMPLATE_SEND_PANEL_WIDTH,
			cacheable: false,
		});
	}

	/**
	 * Post in the activity stream for a group. The recipients are picked by the server, the
	 * form and the publication belong to the feed: its post form extension is loaded at the
	 * moment of the action, so the groups screens do not depend on it statically.
	 */
	async writeToFeed(listId: number): Promise<void>
	{
		let recipients = [];
		try
		{
			const response = await this.#api.signersList.getFeedRecipients(listId, false);
			if (response?.errors?.length > 0)
			{
				this.#notifyWriteToFeedFailure(this.#getFeedRecipientsRefusal(response.errors));

				return;
			}

			// the api layer returns a rejection as a value when it is asked not to notify, so a
			// missing set is a failed request, not a group nobody of which can read the feed
			if (!Type.isArray(response?.recipients))
			{
				this.#notifyWriteToFeedFailure();

				return;
			}

			// an empty set is a regular outcome: nobody of the group has access to the portal
			recipients = response.recipients;
		}
		catch
		{
			this.#notifyWriteToFeedFailure();

			return;
		}

		try
		{
			const { PostForm } = await top.BX.Runtime.loadExtension('socialnetwork.post-form');
			if (!Type.isFunction(PostForm))
			{
				throw new TypeError('The post form of the activity stream is not available');
			}

			await new PostForm({ preselectedRecipients: recipients }).show();
		}
		catch
		{
			this.#notifyWriteToFeedFailure();
		}
	}

	async deleteSelectedSigners(listId: number): Promise<void>
	{
		const gridManager = this.#getGridManager();
		const grid = gridManager?.getById(GRID_SIGNERS)?.instance;
		if (!grid)
		{
			return;
		}

		const selectedIds = grid.getRows().getSelectedIds();

		if (selectedIds.length === 0)
		{
			return;
		}

		await this.deleteSigners(listId, selectedIds);
	}

	exportToExcel(baseUrl: string, userIds: ?Array<number | string> = null): void
	{
		const grid = this.#getGridManager()?.getById(GRID_SIGNERS)?.instance;
		const selectedIds = Type.isArray(userIds)
			? userIds
			: (grid ? grid.getRows().getSelectedIds() : [])
		;
		const form = Tag.render`
			<form method="post" action="${baseUrl}" target="${this.#getExportTarget()}"></form>
		`;
		const fields = [
			['mode', 'excel'],
			['ncc', '1'],
			...selectedIds.map((userId) => ['exportSelectedIds[]', userId]),
		];

		for (const [name, value] of fields)
		{
			Dom.append(Tag.render`<input type="hidden" name="${name}" value="${value}">`, form);
		}

		Dom.append(form, document.body);
		form.submit();
		setTimeout(() => Dom.remove(form), 0);
	}

	async deleteSigners(listId: number, userIds: number[]): Promise<void>
	{
		BX.UI.Dialogs.MessageBox.show({
			message: Loc.getMessage('SIGN_SIGNERS_SIGNER_DELETE_CONFIRMATION_TITLE'),
			modal: true,
			buttons: [
				new BX.UI.Button({
					text: Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_POPUP_YES'),
					color: BX.UI.Button.Color.PRIMARY,
					onclick: async (button) => {
						button.setDisabled(true);
						button.setState(BX.UI.Button.State.WAITING);

						const isSingle = userIds.length === 1;
						const successMsg = isSingle
							? Loc.getMessage('SIGN_SIGNERS_SIGNER_GRID_DELETE_HINT_SUCCESS')
							: Loc.getMessage('SIGN_SIGNERS_SIGNERS_GRID_DELETE_HINT_SUCCESS');
						const failMsg = isSingle
							? Loc.getMessage('SIGN_SIGNERS_SIGNER_GRID_DELETE_HINT_FAIL')
							: Loc.getMessage('SIGN_SIGNERS_SIGNERS_GRID_DELETE_HINT_FAIL');

						try
						{
							const response = await this.#api.signersList.deleteSignersFromList(listId, userIds, false);
							if (response.errors?.length > 0)
							{
								throw new Error(response.errors[0].message);
							}
							this.#updateCreateChatMenuItem(listId, response.hasSigners);
							window.top.BX.UI.Notification.Center.notify({
								content: successMsg,
							});
						}
						catch
						{
							window.top.BX.UI.Notification.Center.notify({
								content: failMsg,
							});
						}
						await this.reloadSigners();
						button.getContext().close();
					},
				}),
				new BX.UI.Button({
					text: Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_POPUP_NO'),
					color: BX.UI.Button.Color.LINK,
					onclick: (button) => button.getContext().close(),
				}),
			],
		});
	}

	async createList(): void
	{
		try
		{
			const createListPopup = new CreateListPopup();
			const title = await createListPopup.show();
			const response = await this.#api.signersList.createList(title, false);
			if (response.errors?.length > 0)
			{
				throw new Error(response.errors[0].message);
			}
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_SIGNERS_GRID_LIST_CREATE_SUCCESS'),
			});
		}
		catch
		{
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_SIGNERS_GRID_LIST_CREATE_FAIL'),
			});
		}

		await this.reloadLists();
	}

	async renameList(listId: number, title: string): void
	{
		try
		{
			const createListPopup = new CreateListPopup();
			const newTitle = await createListPopup.show(title);
			const response = await this.#api.signersList.renameList(listId, newTitle, false);
			if (response.errors?.length > 0)
			{
				throw new Error(response.errors[0].message);
			}
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_SIGNERS_GRID_LIST_RENAME_SUCCESS'),
			});
		}
		catch
		{
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_SIGNERS_GRID_LIST_RENAME_FAIL'),
			});
		}

		await this.reloadLists();
	}

	async addSigners(listId: number, entities: Array, excludeRejected: boolean = true): void
	{
		const members = entities.map((entity) => ({ ...entity, party: 2 }));
		// Errors are reported by the api layer: it shows the server message and rethrows
		const response = await this.#api.signersList.addSignersToList(listId, members, excludeRejected);

		const sliderManager = window.top.BX.SidePanel.Instance;
		const addingSlider = sliderManager.getSliderByWindow(window);
		const eventEmitter = window.top.BX.Event.EventEmitter;

		const handleCloseCompleted = async (event) => {
			const [sliderEvent] = event.getData();

			if (sliderEvent?.getSlider() !== addingSlider)
			{
				return;
			}

			eventEmitter.unsubscribe(
				'SidePanel.Slider:onCloseComplete',
				handleCloseCompleted,
			);

			this.#updateCreateChatMenuItem(listId, response.hasSigners);
		};

		eventEmitter.subscribe(
			'SidePanel.Slider:onCloseComplete',
			handleCloseCompleted,
		);
		addingSlider.close();
		await this.reloadSigners();
	}

	async createChat(listId: number): void
	{
		const response = await this.#api.signersList.createChat(listId);

		const chatId = response.chatId;
		const warning = response.warning;
		if (warning)
		{
			window.top.BX.UI.Notification.Center.notify({
				content: warning,
			});
		}

		await BX.Runtime.loadExtension('im.public.iframe');
		top.BX.Messenger.Public.openChat(`chat${chatId}`);
	}

	async handleAddSignersButtonClick(listId: number, userParty: UserParty): Promise<void>
	{
		if (!userParty.validate())
		{
			return;
		}

		const listGrid = new BX.Sign.V2.Grid.B2e.Signers();
		try
		{
			await listGrid.addSigners(listId, userParty.getEntities(), userParty.isRejectExcludedEnabled());
		}
		catch
		{
			// The user is already notified; keep the slider open so the selection can be fixed
		}
	}

	/**
	 * The refusal the author can act on comes with a known domain code and a localized message.
	 * Transport failures of the request layer carry technical text, so they get no message here.
	 */
	#getFeedRecipientsRefusal(errors: ControllerError[]): ?string
	{
		const refusal = errors.find((error) => error?.code === FEED_RECIPIENTS_LIMIT_ERROR_CODE);

		return refusal?.message ?? null;
	}

	#notifyWriteToFeedFailure(message: ?string = null): void
	{
		window.top.BX.UI.Notification.Center.notify({
			content: Type.isStringFilled(message)
				? Text.encode(message)
				: Loc.getMessage('SIGN_SIGNERS_GRID_WRITE_TO_FEED_HINT_FAIL'),
		});
	}

	#setPinActive(button: ?HTMLElement, isActive: boolean): void
	{
		Dom.toggleClass(button, BX.Grid.CellActionState.ACTIVE, isActive);
	}

	#getDeleteListMessage(listTitle: ?string): string
	{
		if (!Type.isStringFilled(listTitle))
		{
			return Loc.getMessage('SIGN_SIGNERS_DELETE_CONFIRMATION_MESSAGE');
		}

		// The title comes from the grid row as is (the template only escapes it for the JS string),
		// and the message goes to MessageBox as an HTML string — encode before interpolation.
		return Loc.getMessage('SIGN_SIGNERS_DELETE_CONFIRMATION_MESSAGE_WITH_NAME', {
			'#TITLE#': Text.encode(listTitle),
		});
	}

	#getExportTarget(): string
	{
		const existingIframe = document.getElementById(EXPORT_IFRAME_ID);
		if (Type.isElementNode(existingIframe) && Type.isStringFilled(existingIframe.name))
		{
			return existingIframe.name;
		}

		const iframeName = `${EXPORT_IFRAME_NAME_PREFIX}${Text.getRandom()}`;
		const iframe = Tag.render`
			<iframe
				id="${EXPORT_IFRAME_ID}"
				name="${iframeName}"
				hidden
				tabindex="-1"
				aria-hidden="true"
			></iframe>
		`;
		Dom.append(iframe, document.body);

		return iframeName;
	}

	#getGridManager(): ?Object
	{
		if (BX.Main.gridManager)
		{
			return BX.Main.gridManager;
		}

		const previousSlider = BX.SidePanel.Instance.getPreviousSlider(BX.SidePanel.Instance.getSliderByWindow(window));
		const gridWindow = previousSlider ? previousSlider.getWindow() : window.top;

		return gridWindow?.BX.Main.gridManager;
	}

	#updateCreateChatMenuItem(listId: number, hasSigners: boolean): void
	{
		const sliderWindow = window.top.BX.SidePanel.Instance
			.getTopSlider()
			?.getWindow();
		const toolbarSettingsButtonNode = sliderWindow?.document.querySelector(
			`[data-role="signers-settings-button-${listId}"]`,
		);

		if (!Type.isDomNode(toolbarSettingsButtonNode))
		{
			return;
		}

		const toolbar = sliderWindow?.BX.UI.ToolbarManager?.getDefaultToolbar();
		const toolbarSettingsButton = toolbar?.getButton(toolbarSettingsButtonNode.dataset.btnUniqid);
		const createChatMenuItem = toolbarSettingsButton
			?.getMenuWindow()
			?.getMenuItem(`sign-b2e-signers-create-chat-${listId}`);

		if (!createChatMenuItem)
		{
			return;
		}

		Dom.toggleClass(
			createChatMenuItem.getContainer(),
			'--hidden',
			!hasSigners,
		);
	}
}

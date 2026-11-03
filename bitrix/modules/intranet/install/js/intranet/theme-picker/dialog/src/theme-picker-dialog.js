import { Type, ajax as Ajax, Loc, Tag, Dom, Text, Reflection } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { PopupWindowButton, PopupWindowButtonLink } from 'main.popup';
import { Loader } from 'main.loader';
import { FocusZone, FocusKeys, LiveAnnouncer, type FocusZoneDirection } from 'ui.a11y';

import { CheckboxButton } from './checkbox-button';
import { NewThemeDialog } from './new-theme-dialog';

import { blur } from './blur';

import { type ThemePicker } from 'intranet.theme-picker';

export class ThemePickerDialog
{
	#themePicker: ThemePicker;
	#newThemeDialog: NewThemeDialog = null;
	#checkboxButton: CheckboxButton = null;
	#gridFocusZone: FocusZone = null;
	#focusedCell: ?HTMLElement = null;

	constructor(themePicker: ThemePicker)
	{
		this.#themePicker = themePicker;
	}

	show(): void
	{
		this.#loadThemes();
	}

	close(): void
	{
		this.#destroyGridFocusZone();

		this.#newThemeDialog?.destroy();
		this.#newThemeDialog = null;

		if (!this.#themePicker.needReturnValue())
		{
			this.applyTheme(this.#themePicker.getThemeId());
		}

		this.#themePicker.setThemes([]);
	}

	async makeCustomThemeBlurred(theme, options = {}): Promise<void>
	{
		if (!Type.isStringFilled(theme.bgImageUrlToBlur))
		{
			return Promise.resolve();
		}

		const lsKey = 'custom_themes_errors';
		const localStorage = Reflection.getClass('BX.localStorage');
		if (localStorage && localStorage.get(lsKey)?.includes(theme.id))
		{
			console.log('Skipping blurred image for theme', theme.id);

			return Promise.resolve();
		}

		const saveError = (timeout = 3600) => {
			if (localStorage)
			{
				const errorCustomThemes: string = localStorage.get(lsKey) || '';
				localStorage.set(lsKey, `${errorCustomThemes}|${theme.id}`, timeout);
			}
		};

		let bgImageBlurred = null;
		let color = null;
		try
		{
			const { image } = await this.#loadImage(theme.bgImageUrlToBlur);
			const result = await blur(image, 7);

			bgImageBlurred = result.file;
			color = result.color;
		}
		catch (error)
		{
			saveError();

			return Promise.reject(error);
		}

		const { ignoreErrors = false, applyTheme = false } = options;

		const data = new FormData();
		data.append('action', 'save-blurred-image');
		data.append('themeId', theme.id);
		data.append('bgImageBlurred', bgImageBlurred);
		data.append('bgColor', color);
		data.append('ignoreErrors', ignoreErrors);

		return this.#ajax(data)
			.then((response) => {
				if (response && response.success && response.theme)
				{
					this.#themePicker.updateTheme(response.theme.id, { bgImageUrlToBlur: null });
					this.#themePicker.updateTheme(response.theme.id, response.theme);
					this.preloadTheme(response.theme.id, () => {
						if (applyTheme)
						{
							this.removeThemeAssets(this.#themePicker.getAppliedThemeId());
							this.applyThemeAssets(response.theme);
						}
					});
				}
				else
				{
					console.log('Error while saving blurred image for theme', theme.id);
					saveError();
				}
			})
			.catch((error) => {
				console.error(error);
				saveError();
			})
		;
	}

	#loadImage(src: string): Promise<{ width: number, height: number, image: HTMLImageElement }>
	{
		return new Promise((resolve, reject) => {
			const image: HTMLImageElement = document.createElement('img');
			let url = src;
			if (url.startsWith('http') && !url.startsWith(window.location.origin))
			{
				url = '/bitrix/tools/landing/proxy.php';
				url += `?sessid=${Loc.getMessage('bitrix_sessid')}&url=${encodeURIComponent(this.#urnEncode(src))}`;
			}

			image.src = url;
			image.onerror = (error) => {
				reject(error);
			};

			image.onload = () => {
				resolve({
					width: image.naturalWidth,
					height: image.naturalHeight,
					image,
				});
			};
		});
	}

	#urnEncode(str: string): string
	{
		let result = '';
		const parts = str.split(/(:\/\/|:\d+\/|\/|\?|=|&)/);

		for (const [i, part] of parts.entries())
		{
			result += (i % 2 === 1) ? part : encodeURIComponent(part);
		}

		return result;
	}

	#ajax(data): Promise
	{
		const formData = Type.isFormData(data) ? data : new FormData();
		if (Type.isPlainObject(data))
		{
			for (const [key, value] of Object.entries(data))
			{
				formData.append(key, value);
			}
		}

		formData.append('sessid', Loc.getMessage('bitrix_sessid'));
		formData.append('templateId', this.#themePicker.getTemplateId());
		formData.append('siteId', this.#themePicker.getSiteId());
		formData.append('entityType', this.#themePicker.getEntityType());
		formData.append('entityId', this.#themePicker.getEntityId());

		return new Promise((resolve, reject) => {
			Ajax({
				method: 'POST',
				dataType: 'json',
				preparePost: false,
				url: this.#themePicker.getAjaxHandlerPath(),
				data: formData,
				onsuccess: resolve,
				onfailure: reject,
			});
		});
	}

	#loadThemes(): void
	{
		this.#ajax({ action: 'getlist' })
			.then((data) => {
				if (!data || !data.success || !Type.isArray(data.themes) || data.themes.length === 0)
				{
					this.#showFatalError();

					return;
				}

				this.#hideLoader();
				this.#themePicker.setThemes(data.themes);
				this.#themePicker.setBaseThemes(data.baseThemes);
				this.#setButtons();
				this.#renderLayout();
			})
			.catch(() => {
				this.#showFatalError();
			})
		;
	}

	#setButtons(): void
	{
		const buttons = [];

		if (this.#themePicker.isCurrentUserAdmin() && this.#themePicker.getEntityType() === 'USER')
		{
			buttons.push(this.#getCheckboxButton());
		}

		buttons.push(this.#getSaveButton(), this.#getCancelButton(), this.#getCreateButton());

		this.#themePicker.getDialogPopup().setButtons(buttons);
	}

	#getCheckboxButton(): CheckboxButton
	{
		if (!this.#checkboxButton)
		{
			this.#checkboxButton = new CheckboxButton(this.#themePicker);
		}

		return this.#checkboxButton;
	}

	#showFatalError(): void
	{
		this.#hideLoader();
		this.#themePicker.setDialogBusy(false);

		const message = this.#getMessage('BITRIX24_THEME_UNKNOWN_ERROR');
		const error = Tag.render`
			<div
				class="theme-dialog-error"
				tabindex="-1"
				data-testid="bx-theme-picker-list-error"
			>${Text.encode(message)}</div>
		`;

		this.#themePicker.getDialogPopup().setContent(error);
		this.#themePicker.getDialogPopup().setButtons([this.#getCancelButton()]);

		// The message is the only content left and the reason the dialog is useless: it takes the
		// focus by the policy of the picker and is announced insistently.
		this.#themePicker.focusInDialog(error);
		LiveAnnouncer.announce(message, 'assertive');
	}

	#hideLoader(): void
	{
		this.#themePicker.hideLoader();
	}

	#getSaveButton(): PopupWindowButton
	{
		const button = new PopupWindowButton({
			id: 'save-button',
			text: Loc.getMessage('BITRIX24_THEME_DIALOG_SAVE_BUTTON'),
			className: 'popup-window-button-accept',
			events: {
				click: () => {
					this.#handleSaveButtonClick();
				},
			},
		});

		Dom.attr(button.buttonNode, 'data-testid', 'bx-theme-picker-save');

		return button;
	}

	#handleSaveButtonClick(): void
	{
		if (this.#themePicker.needReturnValue())
		{
			const eventData = {
				theme: this.#themePicker.getTheme(this.#themePicker.getReturnValue()),
			};

			EventEmitter.emit(
				'Intranet.ThemePicker:onSave',
				new BaseEvent({ data: [eventData], compatData: [eventData] }),
			);
		}
		else if (
			this.#themePicker.getThemeId() !== this.#themePicker.getAppliedThemeId()
			|| this.#isCheckboxChecked()
		)
		{
			this.#saveTheme(this.#themePicker.getAppliedThemeId());
		}

		this.#themePicker.closeDialog();
	}

	#isCheckboxChecked(): boolean
	{
		return this.#checkboxButton ? this.#checkboxButton.isChecked() : false;
	}

	#getCancelButton(): PopupWindowButtonLink
	{
		const button = new PopupWindowButtonLink({
			id: 'cancel-button',
			text: Loc.getMessage('BITRIX24_THEME_DIALOG_CANCEL_BUTTON'),
			className: 'popup-window-button-link theme-dialog-button-link',
			events: {
				click: () => {
					this.#themePicker.closeDialog();
				},
			},
		});

		Dom.attr(button.buttonNode, 'data-testid', 'bx-theme-picker-cancel');

		return button;
	}

	#getCreateButton(): PopupWindowButtonLink
	{
		const button = new PopupWindowButtonLink({
			id: 'create-button',
			text: Loc.getMessage('BITRIX24_THEME_DIALOG_NEW_THEME'),
			className: 'popup-window-button-link theme-dialog-button-link theme-dialog-new-theme-btn',
			events: {
				click: () => {
					this.getNewThemeDialog().show();
				},
			},
		});

		Dom.attr(button.buttonNode, { 'data-testid': 'bx-theme-picker-create', 'aria-haspopup': 'dialog' });

		return button;
	}

	#renderLayout(): void
	{
		const container = Tag.render`
			<div class="theme-dialog-content" role="row"></div>
		`;

		this.#themePicker.getThemes().forEach((theme) => {
			const item = this.createItem(theme);
			Dom.append(item, container);
			this.#markGridCell(item, theme);
		});

		// `tabindex="-1"`: the grid is the last place the focus can go when the last theme is removed.
		const grid = Tag.render`
			<div
				class="theme-dialog-container"
				role="grid"
				data-testid="bx-theme-picker-grid"
				tabindex="-1"
				onkeydown="${this.#handleGridKeyDown.bind(this)}"
				onfocusin="${this.#handleGridFocusIn.bind(this)}"
				onfocusout="${this.#handleGridFocusOut.bind(this)}"
			>${container}</div>
		`;
		Dom.attr(grid, 'aria-label', this.#getMessage('BITRIX24_THEME_GRID_LABEL'));

		this.#keepSingleTabStop(container);

		this.#themePicker.getDialogPopup().setContent(grid);
		this.#createGridFocusZone(grid);

		// The grid is ready, so the popup stops being busy and takes over the focus.
		this.#themePicker.setDialogBusy(false);
		this.#themePicker.focusInDialog(this.#getEntryCell());
	}

	addItem(theme): void
	{
		const themes = this.#themePicker.getThemes();
		themes.unshift(theme);
		this.#themePicker.setThemes(themes);
		const newItem = this.createItem(theme);
		Dom.prepend(newItem, this.getContentContainer());
		this.#markGridCell(newItem, theme);
		this.#selectItem(newItem);

		// The new theme is the selected one, so the single Tab stop and the entry point of the grid
		// move on to its cell: the zone resolves both when it activates.
		const grid = this.#getGridContainer();
		if (this.#gridFocusZone && grid)
		{
			this.#createGridFocusZone(grid);
		}
	}

	/**
	 * The grid owns the cell semantics, the tile itself does not: the site theme field renders its
	 * own container of the same class and fills it with `createItem`, and it must stay without any
	 * of these attributes. Hence the check by the actual parent instead of a selector by class.
	 */
	#markGridCell(item: HTMLElement, theme): void
	{
		if (item.parentElement?.getAttribute('role') !== 'row')
		{
			return;
		}

		const isApplied = this.#themePicker.getAppliedThemeId() === theme.id;

		Dom.attr(item, {
			role: 'gridcell',
			tabindex: isApplied ? '0' : '-1',
			'aria-selected': isApplied ? 'true' : 'false',
			'data-testid': 'bx-theme-picker-theme-item',
		});

		this.#nameGridCell(item, theme);
	}

	/**
	 * A screen reader reads the contents of a cell right after its name, and the name is the richer
	 * of the two: it carries the kind of the theme as well. So the visible name and the badges of
	 * the kind are hidden - they would only repeat the name inside the cell they name. The strip
	 * around the visible name stays: the remove button lives in it and has to keep being reachable.
	 */
	#nameGridCell(item: HTMLElement, theme): void
	{
		Dom.attr(item, 'aria-label', this.#getItemLabel(theme));

		item
			.querySelectorAll('.theme-dialog-item-title-text, .theme-dialog-item-default, .theme-dialog-item-new')
			.forEach((duplicate) => {
				Dom.attr(duplicate, 'aria-hidden', 'true');
			})
		;
	}

	#markCellSelected(item: HTMLElement, selected: boolean): void
	{
		if (this.#isGridCell(item))
		{
			Dom.attr(item, 'aria-selected', selected ? 'true' : 'false');
		}
	}

	/**
	 * The cell role is what separates the grid of the dialog from the tiles of the site theme field:
	 * the field renders the same tiles by the same `createItem` and must stay out of the grid states,
	 * the announcements and the focus management.
	 */
	#isGridCell(node: ?HTMLElement): boolean
	{
		return node?.getAttribute('role') === 'gridcell';
	}

	// The grid keeps a single Tab stop even when none of its themes is the applied one.
	#keepSingleTabStop(container: HTMLElement): void
	{
		const cells = container.querySelectorAll('[role="gridcell"]');
		if (cells.length === 0 || container.querySelector('[role="gridcell"][tabindex="0"]'))
		{
			return;
		}

		Dom.attr(cells[0], 'tabindex', '0');
	}

	/**
	 * `inert` on the popup of the list leaves the zone with an empty set: every cell hides behind the
	 * attribute, and the observer of the zone never sees it go - it sits on an ancestor of the grid.
	 * So the set is rebuilt by whoever lifts the isolation, and the arrows have cells to walk again.
	 */
	refreshGrid(): void
	{
		this.#gridFocusZone?.refreshElements();
	}

	#createGridFocusZone(grid: HTMLElement): void
	{
		this.#destroyGridFocusZone();

		this.#gridFocusZone = new FocusZone(grid, {
			bindKeys: FocusKeys.ArrowAll | FocusKeys.HomeAndEnd,
			focusInStrategy: (): ?HTMLElement => this.#getEntryCell(),
			// Cells only. The roving tabindex of the zone is the single Tab stop of the grid, and the
			// remove button of a cell hides behind the strip with the name as soon as the focus leaves
			// the grid: as a member of the set it would carry that stop away into a node nobody can
			// reach any more. The arrows reach the button through `getNextFocusable` instead.
			focusableElementFilter: (element: HTMLElement): boolean => this.#isGridCell(element),
			getNextFocusable: (
				direction: FocusZoneDirection,
				from: ?Element,
				event: KeyboardEvent,
			): ?HTMLElement => this.#getNextCell(direction, from, event),
		});

		this.#gridFocusZone.activate();
	}

	#destroyGridFocusZone(): void
	{
		this.#gridFocusZone?.deactivate();
		this.#gridFocusZone = null;
		this.#setFocusedCell(null);
	}

	/**
	 * The strip with the name of the theme is revealed by the keyboard focus of the cell, and the
	 * remove button lives inside that strip: the cell itself loses `:focus-visible` the moment the
	 * focus moves on to the button, so the class holds the strip open where the pseudo-class stops.
	 */
	#handleGridFocusIn(event: FocusEvent): void
	{
		const cell = event.target.matches(':focus-visible')
			? event.target.closest('[role="gridcell"]')
			: null
		;

		this.#setFocusedCell(cell);
	}

	#handleGridFocusOut(event: FocusEvent): void
	{
		if (!event.currentTarget.contains(event.relatedTarget))
		{
			this.#setFocusedCell(null);
		}
	}

	#setFocusedCell(cell: ?HTMLElement): void
	{
		if (this.#focusedCell === cell)
		{
			return;
		}

		if (this.#focusedCell)
		{
			Dom.removeClass(this.#focusedCell, 'theme-dialog-item-focused');
		}

		this.#focusedCell = cell;

		if (cell)
		{
			Dom.addClass(cell, 'theme-dialog-item-focused');
		}
	}

	// The selected theme on the first entry into the grid, the last visited element afterwards.
	#getEntryCell(): ?HTMLElement
	{
		const cells = this.#getVisibleCells();

		return this.#gridFocusZone?.getCurrentFocusedElement()
			?? cells.find((cell) => cell.getAttribute('aria-selected') === 'true')
			?? cells[0]
			?? null
		;
	}

	/**
	 * Vertical moves and row edges; an empty answer leaves the linear walk of the zone
	 * in place, which is what the left and right arrows need.
	 */
	#getNextCell(direction: FocusZoneDirection, from: ?Element, event: KeyboardEvent): ?HTMLElement
	{
		const cell = from?.closest('[role="gridcell"]');
		if (!cell)
		{
			return null;
		}

		const cells = this.#getVisibleCells();
		const rows = this.#groupCellsByOffsetTop(cells);
		const rowIndex = rows.findIndex((row) => row.includes(cell));
		if (rowIndex === -1)
		{
			return null;
		}

		const row = rows[rowIndex];

		if (event.key === 'ArrowUp' || event.key === 'ArrowDown')
		{
			const targetRow = rows[rowIndex + (event.key === 'ArrowDown' ? 1 : -1)];
			if (!targetRow)
			{
				// Grid edge: the same cell keeps the focus where it is, an empty answer would move it away.
				return cell;
			}

			const colIndex = row.indexOf(cell);

			return targetRow[Math.min(colIndex, targetRow.length - 1)];
		}

		if (event.key === 'Home' || event.key === 'End')
		{
			const scope = (event.ctrlKey || event.metaKey) ? cells : row;

			return direction === 'start' ? scope[0] : scope[scope.length - 1];
		}

		return this.#getNextHorizontal(cell, from, cells, event);
	}

	/**
	 * The remove button of a cell is a stop of the horizontal walk, and no member of the managed set
	 * of the zone, so the steps over it are taken here: right from the cell steps into the button,
	 * right from the button steps on to the next cell, left from the button back into its own cell.
	 * An empty answer leaves the step to the linear walk of the zone, which knows the cells alone.
	 */
	#getNextHorizontal(
		cell: HTMLElement,
		from: Element,
		cells: HTMLElement[],
		event: KeyboardEvent,
	): ?HTMLElement
	{
		// Ctrl or Cmd with an arrow walks the whole zone, and the zone does that walk itself.
		if (event.ctrlKey || event.metaKey)
		{
			return null;
		}

		if (event.key === 'ArrowRight')
		{
			return from === cell
				? this.#getRevealedRemoveButton(cell)
				: (cells[cells.indexOf(cell) + 1] ?? null)
			;
		}

		if (event.key === 'ArrowLeft' && from !== cell)
		{
			return cell;
		}

		return null;
	}

	// The strip with the name, and the remove button in it, are revealed only by the keyboard focus.
	#getRevealedRemoveButton(cell: HTMLElement): ?HTMLElement
	{
		return this.#focusedCell === cell ? cell.querySelector('.theme-dialog-item-remove') : null;
	}

	// Rows live in the layout, not in the markup: tiles wrap, so the row of a cell is read from its position.
	#groupCellsByOffsetTop(cells: HTMLElement[]): HTMLElement[][]
	{
		const rows = [];
		let rowOffsetTop = null;

		cells.forEach((cell) => {
			if (cell.offsetTop !== rowOffsetTop)
			{
				rowOffsetTop = cell.offsetTop;
				rows.push([]);
			}

			rows[rows.length - 1].push(cell);
		});

		return rows;
	}

	#getVisibleCells(): HTMLElement[]
	{
		const cells = this.getContentContainer()?.querySelectorAll('[role="gridcell"]') ?? [];

		return [...cells].filter((cell) => cell.offsetParent !== null);
	}

	/**
	 * The neighbour takes the focus while the cell is still in the document: the next cell,
	 * then the previous one, then the grid itself, so the focus never falls down to the body.
	 */
	#focusCellNeighbour(cell: HTMLElement): void
	{
		if (!this.#isGridCell(cell))
		{
			return;
		}

		const cells = this.#getVisibleCells();
		const cellIndex = cells.indexOf(cell);
		const neighbour = cellIndex === -1 ? null : (cells[cellIndex + 1] ?? cells[cellIndex - 1]);

		(neighbour ?? this.#getGridContainer())?.focus();
	}

	#getGridContainer(): ?HTMLElement
	{
		return this.getContentContainer()?.closest('[role="grid"]');
	}

	/**
	 * Activation only synthesizes a click on the cell: the tile keeps a single action handler, so
	 * unbinding its click disables the keyboard too, as the site theme field expects.
	 */
	#handleGridKeyDown(event: KeyboardEvent): void
	{
		if (event.key !== 'Enter' && event.key !== ' ')
		{
			return;
		}

		if (event.target.closest('.theme-dialog-item-remove'))
		{
			return;
		}

		const cell = event.target.closest('[role="gridcell"]');
		if (!cell)
		{
			return;
		}

		event.preventDefault();
		cell.click();
	}

	/**
	 * Labels of the theme wrap the name one by one, so a theme matching several of them still
	 * reads as a sentence: "Space, default theme, video".
	 */
	#getItemLabel(theme): string
	{
		let label = this.#applyThemeTitle('BITRIX24_THEME_ITEM_LABEL', this.#getThemeTitle(theme));

		if (theme.default === true)
		{
			label = this.#applyThemeTitle('BITRIX24_THEME_ITEM_LABEL_DEFAULT', label);
		}

		if (theme.new === true)
		{
			label = this.#applyThemeTitle('BITRIX24_THEME_ITEM_LABEL_NEW', label);
		}

		if (theme.video)
		{
			label = this.#applyThemeTitle('BITRIX24_THEME_ITEM_LABEL_VIDEO', label);
		}

		return label;
	}

	// Custom themes created before the server started sending a title fall back to a generic name.
	#getThemeTitle(theme): string
	{
		return Type.isStringFilled(theme.title)
			? theme.title
			: this.#getMessage('BITRIX24_THEME_CUSTOM_THEME_FALLBACK')
		;
	}

	#applyThemeTitle(phraseCode: string, title: string): string
	{
		const phrase = this.#getMessage(phraseCode, { '#TITLE#': title });

		return phrase === '' ? title : phrase;
	}

	// Politely and only about the outcome: applying and removing a theme, never the stream of loaders.
	#announceTheme(phraseCode: string, theme, cell: ?HTMLElement): void
	{
		if (!theme || !this.#isGridCell(cell))
		{
			return;
		}

		LiveAnnouncer.announce(this.#getMessage(phraseCode, { '#TITLE#': this.#getThemeTitle(theme) }));
	}

	#getMessage(phraseCode: string, replacements: ?{ [string]: string } = null): string
	{
		const phrase = Loc.getMessage(phraseCode, replacements);

		return Type.isStringFilled(phrase) ? phrase : '';
	}

	createItem(theme): HTMLElement
	{
		let className = 'theme-dialog-item';

		if (theme.video)
		{
			className += ' theme-dialog-item-video';
		}

		if (this.#themePicker.getAppliedThemeId() === theme.id)
		{
			className += ' theme-dialog-item-selected';
		}

		const title = this.#getThemeTitle(theme);

		const div = Tag.render`
			<div
				class="${className}"
				data-theme-id="${theme.id}"
				onclick="${this.handleItemClick.bind(this)}"
			>
				<div class="theme-dialog-item-title">
					<span class="theme-dialog-item-title-text">${Text.encode(title)}</span>
					${theme.removable ? this.#createRemoveButton(theme) : ''}
				</div>
				${theme.default === true ? this.#createDefaultLabel() : ''}
				${theme.new === true ? this.#createNewLabel() : ''}
			</div>
		`;

		if (Type.isStringFilled(theme.previewImage))
		{
			const img = Tag.render`
				<img
					src="${encodeURI(theme.previewImage)}"
					alt=""
					class="theme-dialog-item-preview-img"
					loading="lazy"
				>
			`;

			Dom.append(img, div);
		}

		if (Type.isStringFilled(theme.previewColor))
		{
			Dom.style(div, 'background-color', theme.previewColor);
		}

		return div;
	}

	/**
	 * `tabindex="-1"`: the button is reached inside the cell, not by a Tab stop of its own.
	 *
	 * The name of the button is its `title` and nothing else. A `title` that named an element is not
	 * offered as its description on top of that, while any name beside the `title` leaves the `title`
	 * to be read again right after the name - measured in the tree, and identical strings are not
	 * folded either. So one phrase carries both roles: the tooltip of the mouse and the name.
	 */
	#createRemoveButton(theme): HTMLElement
	{
		return Tag.render`
			<button
				type="button"
				class="theme-dialog-item-remove"
				data-theme-id="${theme.id}"
				data-testid="bx-theme-picker-theme-remove"
				tabindex="-1"
				title="${this.#getMessage('BITRIX24_THEME_REMOVE_THEME')}"
				onclick="${this.handleRemoveBtnClick.bind(this)}"
			></button>
		`;
	}

	getNewThemeDialog(): NewThemeDialog
	{
		if (!this.#newThemeDialog)
		{
			this.#newThemeDialog = new NewThemeDialog(this.#themePicker, this);
			this.#newThemeDialog.subscribe('onDestroy', () => {
				this.#newThemeDialog = null;
			});
		}

		return this.#newThemeDialog;
	}

	handleItemClick(event): void
	{
		this.#selectItem(this.getItemNode(event));
	}

	handleRemoveBtnClick(event): void
	{
		const item = this.getItemNode(event);
		if (!item)
		{
			return;
		}

		const themeId = item.dataset.themeId;
		const theme = this.#themePicker.getTheme(themeId);

		this.#themePicker.removeTheme(themeId);
		this.#focusCellNeighbour(item);
		Dom.remove(item);
		this.#announceTheme('BITRIX24_THEME_ANNOUNCE_REMOVED', theme, item);

		if (this.#themePicker.getAppliedThemeId() === themeId)
		{
			const firstItem = this.getContentContainer().children[0];
			this.#selectItem(firstItem);

			if (this.#themePicker.getThemeId() === themeId && firstItem && firstItem.dataset.themeId)
			{
				this.#saveTheme(firstItem.dataset.themeId);
			}
		}
		else if (this.#themePicker.getThemeId() === themeId)
		{
			this.#saveTheme(this.#themePicker.getAppliedThemeId());
		}

		void this.#ajax({ action: 'remove', themeId });
		event.stopPropagation();
	}

	#saveTheme(themeId): void
	{
		const theme = this.#themePicker.getTheme(themeId);
		const eventData = { theme, themeId, setDefaultTheme: this.#isCheckboxChecked() };

		EventEmitter.emit(
			'Intranet.ThemePicker:onSaveTheme',
			new BaseEvent({ data: eventData, compatData: [eventData] }),
		);

		const data = new FormData();
		data.append('action', 'save');
		data.append('themeId', themeId);
		data.append('setDefaultTheme', this.#isCheckboxChecked());

		void this.#ajax(data);

		this.#themePicker.setThemeId(themeId);
	}

	getItemNode(event): ?HTMLElement
	{
		if (!event || !event.target)
		{
			return null;
		}

		const item = event.target.closest('.theme-dialog-item');

		return Type.isDomNode(item) ? item : null;
	}

	getContentContainer(): HTMLElement
	{
		return this.#themePicker.getDialogPopup().getContentContainer().querySelector('.theme-dialog-content');
	}

	#createDefaultLabel(): HTMLElement
	{
		return Tag.render`
			<div class="theme-dialog-item-default">
				${Loc.getMessage('BITRIX24_THEME_DEFAULT_THEME')}
			</div>
		`;
	}

	#createNewLabel(): HTMLElement
	{
		return Tag.render`
			<div class="theme-dialog-item-new">
				${Loc.getMessage('BITRIX24_THEME_NEW_THEME')}
			</div>
		`;
	}

	#selectItem(item): void
	{
		if (!Type.isDomNode(item) || !Dom.hasClass(item, 'theme-dialog-item'))
		{
			return;
		}

		const themeId = item.dataset.themeId;

		this.getContentContainer()
			.querySelectorAll('div.theme-dialog-item[data-theme-id]')
			.forEach((currentItem) => {
				Dom.removeClass(currentItem, 'theme-dialog-item-selected');
				this.#markCellSelected(currentItem, false);
			})
		;

		Dom.addClass(item, 'theme-dialog-item-selected');
		this.#markCellSelected(item, true);

		if (this.#themePicker.needReturnValue())
		{
			this.#themePicker.setReturnValue(themeId);
		}
		else
		{
			const loader = new Loader({ size: 100 });
			loader.show(item);

			this.preloadTheme(themeId, async () => {
				const theme = this.#themePicker.getTheme(themeId);
				if (Type.isStringFilled(theme.bgImageUrlToBlur))
				{
					try
					{
						await this.makeCustomThemeBlurred(theme);
					}
					catch (ex)
					{
						console.error(ex);
					}
				}

				if (Dom.hasClass(item, 'theme-dialog-item-selected')) // by this time user could select another theme
				{
					loader.hide();
					if (this.applyTheme(themeId))
					{
						this.#announceTheme('BITRIX24_THEME_ANNOUNCE_APPLIED', theme, item);
					}
				}
			});
		}
	}

	/**
	 * Whether the theme became the applied one.
	 *
	 * The answer is what the announcement goes by: a click on the theme that is already applied runs
	 * the whole cycle again and changes nothing, and without the answer it read the same outcome out
	 * a second time.
	 */
	applyTheme(themeId): boolean
	{
		if (!Type.isStringFilled(themeId) || themeId === this.#themePicker.getAppliedThemeId())
		{
			return false;
		}

		const theme = this.#themePicker.getTheme(themeId);
		if (!theme)
		{
			return false;
		}

		const eventData = { id: themeId, theme };
		EventEmitter.emit(
			'BX.Intranet.Bitrix24:ThemePicker:onThemeApply',
			new BaseEvent({ data: eventData, compatData: [eventData] }),
		);
		this.applyThemeAssets(theme);
		this.removeThemeAssets(this.#themePicker.getAppliedThemeId());
		this.#themePicker.setAppliedThemeId(themeId);

		this.appliedTheme = theme;

		EventEmitter.emit('BX.Intranet.Bitrix24:ThemePicker:onThemeAfterApply', { id: themeId, theme });

		return true;
	}

	applyThemeAssets(assets): void
	{
		if (!assets || !Type.isArray(assets.css) || !Type.isStringFilled(assets.id))
		{
			return;
		}

		const head = document.head;
		const themeId = assets.id;

		assets.css.forEach((file) => {
			const link = Tag.render`
				<link type="text/css" rel="stylesheet" href="${file}" data-theme-id="${themeId}">
			`;
			head.appendChild(link);
		});

		if (Type.isStringFilled(assets.style))
		{
			const style = Tag.render`
				<style type="text/css" data-theme-id="${themeId}">
					${assets.style}
				</style>
			`;
			head.appendChild(style);
		}

		if (assets.video && Type.isPlainObject(assets.video.sources))
		{
			const sources = [];
			for (const type in assets.video.sources)
			{
				sources.push(Tag.render`<source type="video/${type}" src="${assets.video.sources[type]}">`);
			}

			const video = Tag.render`
				<div class="theme-video-container" data-theme-id="${themeId}">
					<video
						class="theme-video"
						poster="${assets.video.poster}"
						autoplay
						loop
						muted
						playsinline
						data-theme-id="${themeId}"
					>
						${sources}
					</video>
				</div>
			`;

			document.body.insertBefore(video, document.body.firstElementChild);
		}

		const appliedBaseThemeId = this.#themePicker.getAppliedThemeId().split(':')[0];
		const baseThemeId = themeId.split(':')[0];

		const contexts = {
			light: '--ui-context-edge-dark',
			dark: '--ui-context-edge-light',
			default: '--ui-context-edge-light',
		};

		if (appliedBaseThemeId !== baseThemeId)
		{
			Dom.removeClass(document.body, [`bitrix24-${appliedBaseThemeId}-theme`, contexts[appliedBaseThemeId]]);
			Dom.addClass(document.body, [`bitrix24-${baseThemeId}-theme`, contexts[baseThemeId]]);
		}
	}

	removeThemeAssets(themeId): void
	{
		const styles = document.head.querySelectorAll(`[data-theme-id="${themeId}"]`);
		for (const style of styles)
		{
			Dom.remove(style);
		}

		Dom.remove(document.querySelector(`body > [data-theme-id="${themeId}"]`));
	}

	preloadTheme(themeId, callback: Function): void
	{
		const fn = Type.isFunction(callback) ? callback : () => {};
		const theme = this.#themePicker.getTheme(themeId);

		if (!theme)
		{
			fn();

			return;
		}

		let asyncCount = 2; // preloadImages & preloadCss
		const onload = () => {
			asyncCount--;
			if (asyncCount === 0)
			{
				fn();
			}
		};

		this.preloadImages(theme.prefetchImages, onload);
		this.#preloadCss(theme.css, onload);
	}

	preloadImages(images, callback): void
	{
		const fn = Type.isFunction(callback) ? callback : () => {};

		if (!Type.isArrayFilled(images))
		{
			fn();

			return;
		}

		let loaded = 0;

		images.forEach((imageSrc) => {
			const image = new Image();
			image.src = encodeURI(imageSrc);
			image.onload = image.onerror = () => {
				loaded++;
				if (loaded === images.length)
				{
					fn();
				}
			};
		});
	}

	#preloadCss(css, fn): void
	{
		if (!Type.isArray(css))
		{
			if (Type.isFunction(fn))
			{
				fn();
			}

			return;
		}

		const iframe = Tag.render`<iframe src="javascript:void(0)" style="display: none"></iframe>`;
		document.body.appendChild(iframe);

		const iframeDoc = iframe.contentWindow.document;
		if (!iframeDoc.body)
		{
			// null in IE
			iframeDoc.write('<body></body>');
		}

		// to avoid a conflict between a theme's preload image and a <body>'s image from preload css files
		iframeDoc.body.style.cssText = 'background: #fff !important';

		BX.load(
			css,
			() => {
				Dom.remove(iframe);
				if (Type.isFunction(fn))
				{
					fn();
				}
			},
			iframeDoc,
		);
	}
}

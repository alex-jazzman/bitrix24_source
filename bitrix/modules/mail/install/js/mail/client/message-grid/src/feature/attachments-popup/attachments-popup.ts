import { Dom, Event, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';

import { DataRole, Phrase, TestId } from '../../const';
import { type AttachmentFile } from '../../infrastructure/service/attachment/types';
import { AttachmentApi } from '../../infrastructure/service/attachment/attachment';
import { prepareViewerAttributes } from '../../lib/attachments/attachments';
import { loc } from '../../lib/loc/loc';
import { isArchiveDownloadAvailable } from '../../lib/screen-flags/screen-flags';
import { prefetchViewer } from '../attachment-viewer/attachment-viewer';

/** The archive is offered for a set, not for a single file. */
const ArchiveMinFiles = 2;

const PopupId = 'mail-msg-list-attachments-popup';

// The side panel opens any same-origin link of the page in a slider of its own, the address of an
// attachment included: a file belongs to the viewer and to the download, not to a slider.
const SliderIgnoreAttribute = 'data-slider-ignore-autobinding';

const GridUpdatedEvent = 'Grid::updated';

const StackSelector = `[data-role="${DataRole.AttachmentsStack}"]`;

/**
 * The window of the files behind the "+N" chip. One at a time on the whole screen, so the
 * controller is a single one too. It is built by hand rather than drawn by the application: it
 * belongs to a popup of the platform, which owns its layer, its focus trap and its position.
 */
class AttachmentsPopupController
{
	#popup: Popup | null = null;
	#messageId: string | null = null;
	#reposition: (() => void) | null = null;

	open(stack: HTMLElement): void
	{
		const messageId = stack.getAttribute('data-message-id');
		if (!Type.isStringFilled(messageId))
		{
			return;
		}

		this.destroy();
		this.#messageId = messageId;

		const menu = Tag.render`
			<div class="mail-msg-list-attachments-menu" data-testid="${TestId.AttachmentsMenu}"></div>
		`;
		Dom.append(this.#renderStatus(), menu);
		Event.bind(menu, 'click', (event: MouseEvent): void => {
			if ((event.target as HTMLElement).closest('.mail-msg-list-attachments-menu__download'))
			{
				this.close();
			}
		});

		// The popup aligns its angle with the left edge of the element it is bound to; shift it right
		// by half the width of the chip so the angle points at the middle of it.
		const angleOffsetLeft = Math.round(stack.getBoundingClientRect().width / 2);

		this.#popup = new Popup({
			id: PopupId,
			bindElement: stack,
			content: menu,
			autoHide: true,
			closeByEsc: true,
			cacheable: false,
			angle: true,
			offsetLeft: angleOffsetLeft,
			padding: 0,
			className: 'mail-msg-list-attachments-popup',
			ariaLabel: stack.getAttribute('aria-label') ?? '',
			focusTrap: {
				initialFocus: ['first-tabbable', 'container'],
				restoreFocus: (): HTMLElement | null => this.#getFocusTarget(),
			},
			events: {
				onShow: (): void => {
					this.#setExpanded(true);
					this.#bindReposition();
				},
				onClose: (): void => {
					this.#setExpanded(false);
					this.#unbindReposition();
				},
				onDestroy: (): void => {
					this.#setExpanded(false);
					this.#unbindReposition();
					this.#popup = null;
				},
			},
		});

		EventEmitter.subscribe(GridUpdatedEvent, this.#handleGridUpdated);
		this.#popup.show();
		this.#setStatus(menu, loc(Phrase.AttachmentsListLoading));
		void this.#load(Number(messageId), menu);
	}

	close(): void
	{
		this.#popup?.close();
	}

	/** Takes the window down and gives the focus back to the chip that opened it, if it still holds it. */
	destroy(): void
	{
		EventEmitter.unsubscribe(GridUpdatedEvent, this.#handleGridUpdated);

		const popup = this.#popup;
		if (!popup)
		{
			return;
		}

		const content = popup.getContentContainer() as HTMLElement | null;
		if (content?.contains(document.activeElement))
		{
			this.#getFocusTarget()?.focus({ preventScroll: true });
		}

		popup.destroy();
		this.#popup = null;
	}

	/**
	 * The rows are replaced whole on an update of the grid, so a window bound to the chip of a row
	 * would hang over the list on a detached node.
	 */
	#handleGridUpdated = (): void => {
		this.destroy();
	};

	async #load(messageId: number, menu: HTMLElement): Promise<void>
	{
		try
		{
			// the files of the window lead to the viewer just like the chips of the row do
			const [files] = await Promise.all([AttachmentApi.getFiles(messageId), prefetchViewer()]);
			if (!menu.isConnected)
			{
				return;
			}

			if (files.length === 0)
			{
				this.#setStatus(menu, loc(Phrase.AttachmentsListEmpty));

				return;
			}

			this.#fill(menu, files);
		}
		catch
		{
			if (menu.isConnected)
			{
				this.#setStatus(menu, loc(Phrase.AttachmentsListError), true);
			}
		}
	}

	#fill(menu: HTMLElement, files: AttachmentFile[]): void
	{
		Dom.clean(menu);
		Dom.append(this.#renderList(files), menu);

		if (isArchiveDownloadAvailable() && files.length >= ArchiveMinFiles)
		{
			Dom.append(this.#renderArchiveFooter(), menu);
		}

		this.#popup?.adjustPosition();
		this.#focusFirst();
	}

	#focusFirst(): void
	{
		const focusTrap = this.#popup?.getFocusTrap();
		if (focusTrap?.contains(document.activeElement as HTMLElement))
		{
			focusTrap.focusFirst();
		}
	}

	#renderStatus(): HTMLElement
	{
		return Tag.render`
			<div class="mail-msg-list-attachments-menu__status" role="status" aria-live="polite"
				data-testid="${TestId.AttachmentsMenuStatus}"></div>
		`;
	}

	#setStatus(menu: HTMLElement, text: string, isError: boolean = false): void
	{
		this.#writeStatus(menu, '.mail-msg-list-attachments-menu__status', text, isError);
	}

	#writeStatus(root: HTMLElement | null, selector: string, text: string, isError: boolean): void
	{
		const status = root?.querySelector(selector) as HTMLElement | null;
		if (!status)
		{
			return;
		}

		status.textContent = text;
		if (isError)
		{
			Dom.addClass(status, '--error');
		}
		else
		{
			Dom.removeClass(status, '--error');
		}
	}

	#renderList(files: AttachmentFile[]): HTMLElement
	{
		const downloadLabel = loc(Phrase.AttachmentsDownload);
		const list = Tag.render`
			<div class="mail-msg-list-attachments-menu__list" data-testid="${TestId.AttachmentsMenuList}"></div>
		`;

		files.forEach((file: AttachmentFile): void => {
			const row = Tag.render`<div class="mail-msg-list-attachments-menu__item"></div>`;
			// the icon repeats the extension the name of the file already shows, so it is decorative
			const name = Tag.render`
				<a class="mail-msg-list-attachments-menu__name" data-testid="${TestId.AttachmentsMenuItemView}">
					<span class="mail-msg-list-attachments-menu__icon ui-icon ui-icon-file-${Text.encode(file.icon)}"
						data-testid="${TestId.AttachmentsMenuItemIcon}" aria-hidden="true"><i></i></span>
					<span class="mail-msg-list-attachments__name">${Text.encode(file.name)}</span>
					<span class="mail-msg-list-attachments__size">${Text.encode(file.size)}</span>
				</a>
			`;

			Dom.append(name, row);

			if (file.url !== null)
			{
				Dom.attr(name, 'href', file.url);
				Dom.attr(name, 'target', '_blank');
				Dom.attr(name, SliderIgnoreAttribute, 'true');
				this.#applyViewerAttributes(name, file.viewerAttrs);
				Dom.append(this.#renderDownload(file, downloadLabel), row);
			}

			Dom.append(row, list);
		});

		return list;
	}

	#renderDownload(file: AttachmentFile, downloadLabel: string): HTMLElement
	{
		const fileLabel = file.name === ''
			? downloadLabel
			: loc(Phrase.AttachmentsDownloadFile, { '#NAME#': file.name })
		;
		const download = Tag.render`
			<a class="mail-msg-list-attachments-menu__download"
				data-testid="${TestId.AttachmentsMenuItemDownload}"
				title="${Text.encode(downloadLabel)}" aria-label="${Text.encode(fileLabel)}"></a>
		`;

		Dom.attr(download, 'href', file.url);
		Dom.attr(download, 'download', '');
		Dom.attr(download, SliderIgnoreAttribute, 'true');

		return download;
	}

	#renderArchiveFooter(): HTMLElement
	{
		const footer = Tag.render`<div class="mail-msg-list-attachments-menu__footer"></div>`;
		const button = Tag.render`
			<button type="button" class="mail-msg-list-attachments-menu__archive"
				data-testid="${TestId.AttachmentsMenuArchive}">
				<span class="mail-msg-list-attachments-menu__archive-icon" aria-hidden="true"></span>
				<span class="mail-msg-list-attachments-menu__archive-text">${Text.encode(loc(Phrase.ArchiveDownload))}</span>
			</button>
		`;
		const status = Tag.render`
			<span class="mail-msg-list-attachments-menu__archive-status" role="status" aria-live="polite"
				data-testid="${TestId.AttachmentsMenuArchiveStatus}"></span>
		`;

		Event.bind(button, 'click', (): void => {
			void this.#downloadArchive(button);
		});
		Dom.append(button, footer);
		Dom.append(status, footer);

		return footer;
	}

	async #downloadArchive(button: HTMLElement): Promise<void>
	{
		const messageId = Number(this.#messageId);
		const hasMessageId = messageId > 0;
		if (button.getAttribute('aria-disabled') === 'true' || !hasMessageId)
		{
			return;
		}

		this.#setArchiveLoading(button, true);

		try
		{
			const archive = await AttachmentApi.getArchiveUrl(messageId);
			if (archive.available && archive.archiveUrl !== null)
			{
				this.#startDownload(archive.archiveUrl);
				this.#setArchiveLoading(button, false);

				return;
			}

			this.#hideArchiveButton(button);
		}
		catch
		{
			this.#setArchiveLoading(button, false);
			this.#setArchiveStatus(button, loc(Phrase.ArchiveError), true);
		}
	}

	#setArchiveStatus(button: HTMLElement, text: string, isError: boolean = false): void
	{
		this.#writeStatus(
			button.closest('.mail-msg-list-attachments-menu') as HTMLElement | null,
			'.mail-msg-list-attachments-menu__archive-status',
			text,
			isError,
		);
	}

	#setArchiveLoading(button: HTMLElement, loading: boolean): void
	{
		if (loading)
		{
			Dom.attr(button, 'aria-disabled', 'true');
			Dom.attr(button, 'aria-busy', 'true');
			Dom.addClass(button, '--loading');
			this.#setArchiveStatus(button, loc(Phrase.ArchivePreparing));

			return;
		}

		Dom.attr(button, 'aria-disabled', null);
		Dom.attr(button, 'aria-busy', null);
		Dom.removeClass(button, '--loading');
		this.#setArchiveStatus(button, '');
	}

	/**
	 * The server has nothing to offer, so the footer goes away - and with it the control that holds the
	 * focus, which moves onto the first file of the window.
	 */
	#hideArchiveButton(button: HTMLElement): void
	{
		this.#setArchiveLoading(button, false);

		const footer = (button.closest('.mail-msg-list-attachments-menu__footer') ?? button) as HTMLElement;
		const menu = footer.closest('.mail-msg-list-attachments-menu') as HTMLElement | null;
		const firstFile = menu?.querySelector('.mail-msg-list-attachments-menu__name[href]') as HTMLElement | null;

		Dom.addClass(footer, '--hidden');
		(firstFile ?? this.#getFocusTarget())?.focus({ preventScroll: true });
	}

	#startDownload(url: string): void
	{
		const anchor = Tag.render`<a></a>`;
		Dom.attr(anchor, 'href', url);
		Dom.attr(anchor, 'download', '');
		Dom.style(anchor, 'display', 'none');
		Dom.append(anchor, document.body);
		anchor.click();
		Dom.remove(anchor);
	}

	#applyViewerAttributes(target: HTMLElement, attrs: Record<string, unknown> | null): void
	{
		Object.entries(prepareViewerAttributes(attrs)).forEach(([name, value]: [string, string]): void => {
			Dom.attr(target, name, value);
		});
	}

	#findStack(): HTMLElement | null
	{
		if (this.#messageId === null)
		{
			return null;
		}

		return document.querySelector(`${StackSelector}[data-message-id="${this.#messageId}"]`);
	}

	#setExpanded(expanded: boolean): void
	{
		const stack = this.#findStack();
		if (stack)
		{
			Dom.attr(stack, 'aria-expanded', expanded ? 'true' : 'false');
		}
	}

	#getFocusTarget(): HTMLElement | null
	{
		return this.#findStack() ?? this.#getGridFallback();
	}

	#getGridFallback(): HTMLElement | null
	{
		const container = document.querySelector(`[data-role="${DataRole.GridContainer}"]`) as HTMLElement | null;
		if (container && !container.hasAttribute('tabindex'))
		{
			Dom.attr(container, 'tabindex', '-1');
		}

		return container;
	}

	/**
	 * On its own the window follows only a resize, so a row carried by the horizontal scroll of the
	 * grid leaves it hanging away from its chip. Scroll does not bubble, hence the capturing listener.
	 */
	#bindReposition(): void
	{
		if (this.#reposition)
		{
			return;
		}

		this.#reposition = (): void => {
			this.#popup?.adjustPosition();
		};

		Event.bind(document, 'scroll', this.#reposition, true);
	}

	#unbindReposition(): void
	{
		if (!this.#reposition)
		{
			return;
		}

		Event.unbind(document, 'scroll', this.#reposition, true);
		this.#reposition = null;
	}
}

export const AttachmentsPopup = new AttachmentsPopupController();

import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { Dom, Tag } from 'main.core';
import { normalizeCurrentUser, normalizeUserColor } from '../utils/normalize';
import { createRemoteNodeOutlineExtension } from './remote-node-outline-extension';
import type { CurrentUser } from '../type';

export function createCollaborationExtensions({ provider, user }: { provider: Object, user: CurrentUser }): Object[]
{
	return [
		Collaboration.configure({
			document: provider.document,
			field: 'prosemirror',
		}),
		CollaborationCaret.configure({
			provider,
			user: normalizeCurrentUser(user),
			render: (caretUser) => {
				const caretColor = normalizeUserColor(caretUser.color);
				const el = Tag.render`
					<span class="collaboration-cursor__caret" style="border-color: ${caretColor}; --caret-color: ${caretColor}">
					</span>
				`;

				// Tag the caret so the header participant list can scroll a peer's cursor into view.
				const caretUserId = Number(caretUser.id);
				if (Number.isFinite(caretUserId) && caretUserId > 0)
				{
					el.dataset.userId = String(caretUserId);
				}

				requestAnimationFrame(() => {
					if (!el.isConnected)
					{
						return;
					}

					const prose = el.closest('.ProseMirror.note-editor-prose');
					const parent = el.parentElement;
					const prevBlock = el.previousElementSibling;

					// A remote NodeSelection on a block atom (image/video/file) drops the caret right
					// after the block. Anchor it to the block's top-left corner. Generalised beyond
					// direct children of .ProseMirror so atoms nested in a callout/blockquote work too —
					// we position against the caret's own offsetParent rather than always against prose.
					const ATOM_BLOCK_SELECTOR = '[data-type="imageAttachment"], [data-type="videoAttachment"], [data-type="fileAttachment"]';
					const isBlockAtom = prevBlock instanceof HTMLElement
						&& (parent === prose || prevBlock.matches(ATOM_BLOCK_SELECTOR));

					if (prose && isBlockAtom)
					{
						Dom.style(el, 'position', 'absolute');

						const host = (el.offsetParent instanceof HTMLElement) ? el.offsetParent : prose;
						const blockRect = prevBlock.getBoundingClientRect();
						const hostRect = host.getBoundingClientRect();

						Dom.style(el, 'left', `${blockRect.left - hostRect.left + host.scrollLeft}px`);
						Dom.style(el, 'top', `${blockRect.top - hostRect.top + host.scrollTop}px`);
						Dom.style(el, 'width', '0');
						Dom.style(el, 'height', '0');
						Dom.style(el, 'border-left', 'none');
						Dom.style(el, 'border-right', 'none');
					}
					else if (parent instanceof HTMLElement && (parent.tagName === 'TD' || parent.tagName === 'TH'))
					{
						const cellRect = parent.getBoundingClientRect();
						let caretLeft = 0;
						let caretTop = 0;
						let caretHeight = parseFloat(getComputedStyle(parent).lineHeight) || 18;

						if (prevBlock)
						{
							try
							{
								const range = document.createRange();
								range.selectNodeContents(prevBlock);
								range.collapse(false);

								const rects = range.getClientRects();
								const endRect = rects.length > 0 ? rects[rects.length - 1] : null;

								if (endRect && (endRect.width > 0 || endRect.height > 0))
								{
									caretLeft = endRect.right - cellRect.left;
									caretTop = endRect.top - cellRect.top;
									caretHeight = endRect.height || caretHeight;
								}
								else
								{
									const prevRect = prevBlock.getBoundingClientRect();
									caretLeft = prevRect.left - cellRect.left;
									caretTop = prevRect.top - cellRect.top;
									caretHeight = prevRect.height || caretHeight;
								}
							}
							catch
							{
								const prevRect = prevBlock.getBoundingClientRect();
								caretLeft = prevRect.left - cellRect.left;
								caretTop = prevRect.top - cellRect.top;
								caretHeight = prevRect.height || caretHeight;
							}
						}

						Dom.style(el, 'position', 'absolute');
						Dom.style(el, 'left', `${caretLeft}px`);
						Dom.style(el, 'top', `${caretTop}px`);
						Dom.style(el, 'width', '0');
						Dom.style(el, 'height', `${caretHeight}px`);
					}

					const label = Tag.render`
						<div class="collaboration-cursor__label">
							<span class="collaboration-cursor__label-dot" style="background-color: ${caretColor}"></span>
							${Tag.safe`${caretUser.name}`}
						</div>
					`;

					Dom.append(label, el);

					// Keep the label inside the nearest surface that bounds the editor. The document
					// page wraps it in a shell; embedded surfaces (the collection description) have
					// none, so fall back to the prose area — the label still renders either way.
					const bounds = el.closest('.note-editor-document-shell') ?? prose;
					if (!(bounds instanceof HTMLElement))
					{
						return;
					}

					const labelRect = label.getBoundingClientRect();
					const boundsRect = bounds.getBoundingClientRect();

					if (labelRect.right > boundsRect.right)
					{
						Dom.style(label, 'left', 'auto');
						Dom.style(label, 'right', '0');
					}
					else if (labelRect.left < boundsRect.left)
					{
						Dom.style(label, 'left', '0');
						Dom.style(label, 'right', 'auto');
					}
				});

				return el;
			},
		}),
		createRemoteNodeOutlineExtension({ provider }),
	];
}

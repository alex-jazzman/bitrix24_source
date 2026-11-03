import { Tag, Dom, Text, Loc, ajax, Type, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { type Property, type ManagerOptions, type RenderModeValue } from '../../../const/type';
import { RenderMode, EventName, BackendForm } from '../../../const/const';
import { insertWhereNodeWas } from '../../../lib/node-position/node-position';
import { isSelectionAllowed } from '../../../lib/property/property';
import { isWriteTarget } from '../../../lib/write-target/write-target';
import type { SelectionContext, SelectionProvider } from '../../../model/selection/selection';

/**
 * Value insertion handed in by the application layer: this layer may not import the domain
 * at runtime, so the strategy and the rule saying whether it applies to a property both arrive
 * as parameters. `canApply` is canApplySelectionDecorator() alone, and not the whole of
 * BaseField.decoratesSelection(): the render-mode half of that answer is carried by the markup
 * here, which prints `inline-selector-target` only under $allowSelection.
 */
export type BackendRendererSelection = {
	provider: SelectionProvider,
	canApply: (property: Property) => boolean,
};

type PendingItem = {
	fieldName: string,
	property: Property,
	value: string | string[] | null,
	documentType: string[] | undefined,
	renderMode: RenderModeValue | undefined,
	placeholderNode: HTMLElement,
};

const CHUNK_SIZE = 100;

/**
 * The insert button the server prints beside a control it rendered with selection allowed
 * (Base::renderControlSelectorButton). It carries a data-role like every other node of that
 * markup, so the traversal below would hand it to the provider and stand a second insert button
 * next to the one already there. The server button works on its own - decorating it would give
 * the field a server layer this feature deliberately does not have.
 */
const SERVER_SELECTOR_BUTTON_ROLE = 'bp-selector-button';

/**
 * The role the value node of the field carries in both server and designer markup. It is the one
 * role naming a node an inserted value may be written into: the others - a user selector, a menu,
 * an entity selector, a condition group - mark widgets of their own, whose inner inputs belong to
 * those widgets and hold no value of the field.
 */
const INLINE_SELECTOR_TARGET_ROLE = 'inline-selector-target';

export class BackendRenderer
{
	readonly #options: ManagerOptions;
	readonly #selection: BackendRendererSelection | null;
	#pending: PendingItem[] = [];
	#flushScheduled: boolean = false;

	constructor(options: ManagerOptions, selection?: BackendRendererSelection)
	{
		this.#options = options;
		this.#selection = selection ?? null;
	}

	renderPlaceholder(
		fieldName: string,
		property: Property,
		value: string | string[] | null,
		documentType?: string[],
		renderMode?: RenderModeValue,
	): HTMLElement
	{
		const placeholderNode = Tag.render`
			<div
				class="bizproc-fields-backend-placeholder"
				data-role="field-placeholder"
				data-field-name="${Text.encode(fieldName)}"
				aria-busy="true"
			></div>
		`;

		this.#pending.push({ fieldName, property, value, documentType, renderMode, placeholderNode });

		if (!this.#flushScheduled)
		{
			this.#flushScheduled = true;
			Promise.resolve().then(() => this.#flush());
		}

		return placeholderNode;
	}

	/**
	 * Drops what is queued and the scheduled flush with it. The queue is flushed on a
	 * microtask, so an owner that goes away in between would otherwise still send the
	 * request, fill placeholders detached from the document and emit from a dead owner.
	 */
	cancelPending(): void
	{
		this.#pending = [];
		this.#flushScheduled = false;
	}

	/**
	 * Drops the queued item of one placeholder, leaving the queue of its neighbours as it is -
	 * an owner shared between callers releases a single field without ending the render of the
	 * others. The scheduled flush is left standing on purpose: it runs on an emptied queue and
	 * returns, whereas dropping the schedule here would leave the flag saying a flush is coming.
	 * A placeholder already sent is no longer queued, and cancelling it does nothing.
	 */
	cancelPlaceholder(placeholderNode: HTMLElement): void
	{
		this.#pending = this.#pending.filter((item) => item.placeholderNode !== placeholderNode);
	}

	#flush(): void
	{
		this.#flushScheduled = false;

		const items = this.#pending;
		this.#pending = [];

		if (items.length === 0)
		{
			return;
		}

		this.#sendChunked(items);
	}

	#sendChunked(items: PendingItem[]): void
	{
		// Grouped by documentType alone: it is the only per-request field of the payload, while
		// the render mode travels with every control of it (see #sendChunk), so fields of
		// different modes share a request without one mode reaching another field.
		const groups: Map<string, { documentType: string[], items: PendingItem[] }> = new Map();

		items.forEach((item) =>
		{
			const documentType = this.#options.documentType ?? item.documentType ?? [];
			const key = JSON.stringify(documentType);
			const group = groups.get(key);

			if (Type.isUndefined(group))
			{
				groups.set(key, { documentType, items: [item] });
			}
			else
			{
				group.items.push(item);
			}
		});

		const promises: Promise<void>[] = [];

		groups.forEach((group) =>
		{
			let offset = 0;

			while (offset < group.items.length)
			{
				const chunk = group.items.slice(offset, offset + CHUNK_SIZE);
				promises.push(this.#sendChunk(chunk, group.documentType));
				offset += CHUNK_SIZE;
			}
		});

		Promise.all(promises)
			.catch(() => {})
			.finally(() =>
			{
				EventEmitter.emit(EventName.BackendRenderFinished);
			});
	}

	#sendChunk(chunk: PendingItem[], documentType: string[]): Promise<void>
	{
		const controlsData = chunk.map((item) =>
		{
			const renderMode = this.#resolveRenderMode(item);

			return {
				property: item.property,
				params: {
					Field: { Field: item.fieldName, Form: BackendForm.Sfa },
					Value: (item.value ?? ''),
					Als: Number(isSelectionAllowed(item.property, renderMode)),
					RenderMode: renderMode === RenderMode.Public ? 'public' : 'designer',
				},
			};
		});

		return ajax.runAction(
			'bizproc.fieldtype.renderControlCollection',
			{
				json: {
					context: {},
					documentType,
					controlsData,
				},
			},
		)
			.then((response: { data?: { html?: string[] } }) =>
			{
				const htmlArray = response.data?.html;

				// An answer carrying no control is as unusable as a mismatched one: without this the
				// chunk would stay in aria-busy forever instead of showing the render error.
				if (!Type.isArrayFilled(htmlArray))
				{
					this.#markChunkError(chunk);
					console.error('[bizproc.fields] BackendRenderer: response contains no rendered controls');

					return undefined;
				}

				if ((htmlArray as string[]).length !== chunk.length)
				{
					this.#markChunkError(chunk);
					console.error('[bizproc.fields] BackendRenderer: HTML count does not match requested controls');

					return undefined;
				}

				const renderPromises: Promise<void>[] = [];

				(htmlArray as string[]).forEach((html: string, index: number) =>
				{
					const item = chunk[index];

					if (Type.isUndefined(item))
					{
						return;
					}

					Dom.clean(item.placeholderNode);
					const runtimeResult = Runtime.html(item.placeholderNode, html);
					if (!Type.isString(runtimeResult))
					{
						renderPromises.push(
							runtimeResult
								.then(() =>
								{
									Dom.attr(item.placeholderNode, 'aria-busy', null);
									this.#initSelectors(item, documentType);
								})
								// The placeholder was cleaned before Runtime.html ran, so a script or
								// extension that fails to load leaves it empty: without marking it the
								// field would sit in aria-busy with nothing in it and no error shown.
								.catch((error: unknown) => {
									this.#markChunkError([item]);
									console.error('[bizproc.fields] BackendRenderer: control markup failed to load', error);
								}),
						);
					}
					else
					{
						Dom.attr(item.placeholderNode, 'aria-busy', null);
						this.#initSelectors(item, documentType);
					}
				});

				return Promise.all(renderPromises).then(() => undefined);
			})
			.catch((error: unknown) =>
			{
				this.#markChunkError(chunk);
				console.error('[bizproc.fields] BackendRenderer: ajax render failed', error);
			});
	}

	/**
	 * Render mode of one field, resolved the same way documentType is: a manager option outranks
	 * the field's own parameter, and the default fills the gap. A field rendered here answers the
	 * caller the same as one the registry knows - see FieldManager.renderField.
	 */
	#resolveRenderMode(item: PendingItem): RenderModeValue
	{
		return this.#options.renderMode ?? item.renderMode ?? RenderMode.NewDesigner;
	}

	#markChunkError(items: PendingItem[]): void
	{
		const errorMessage = Loc.getMessage('BIZPROC_FIELDS_BACKEND_RENDER_ERROR') ?? '';

		items.forEach((item) =>
		{
			Dom.attr(item.placeholderNode, 'aria-busy', null);
			Dom.addClass(item.placeholderNode, 'bizproc-fields-backend-placeholder--error');
			Dom.attr(item.placeholderNode, 'data-role', 'field-placeholder-error');
			// A string child of Dom.adjust goes through insertAdjacentHTML - an HTML sink, unlike
			// Dom.attr above, so the phrase must be encoded to land as literal text.
			Dom.adjust(item.placeholderNode, { children: [Text.encode(errorMessage)] });
		});
	}

	/**
	 * One traversal for both render modes. The placeholder itself is never decorated: it is the
	 * node renderCollection() already handed to the caller, and replacing it would leave that
	 * caller holding one detached from the document. The value node inside it carries
	 * `inline-selector-target` in both server and designer markup, so the decoration goes there.
	 *
	 * A property the provider does not take is left alone, the same answer the decorator gives a
	 * registered type: a provider refusing a type here would otherwise be walked past its refusal.
	 *
	 * The node an inserted value may be written into is named per node, as a registered type names
	 * it: the value node of the markup and no other role (see INLINE_SELECTOR_TARGET_ROLE).
	 *
	 * The whole queued item goes in and not the nodes alone: the name the field is rendered under
	 * travels to the provider with every decoration of it, as it does from a registered type. The
	 * document type stays a parameter of its own - it is resolved per request, not per field.
	 */
	#initSelectors(item: PendingItem, documentType: string[]): void
	{
		const selection = this.#selection;
		const { fieldName, property, placeholderNode } = item;

		if (Type.isNull(selection) || !selection.canApply(property))
		{
			return;
		}

		const { provider } = selection;

		const context: SelectionContext = {
			fieldName,
			documentType: documentType.length > 0 ? documentType : undefined,
		};

		placeholderNode.querySelectorAll<HTMLElement>('[data-role]').forEach((node) => {
			// Taken before the provider runs: a provider that wraps the node by moving it leaves
			// nothing at this position to splice the decoration in against afterwards.
			const parent = node.parentElement;
			const next = node.nextElementSibling;

			if (Type.isNull(parent))
			{
				return;
			}

			const role = Dom.attr(node, 'data-role') ?? '';

			if (role === SERVER_SELECTOR_BUTTON_ROLE)
			{
				return;
			}

			const nodeContext = role === INLINE_SELECTOR_TARGET_ROLE && isWriteTarget(node)
				? { ...context, writeTarget: node }
				: context;

			const decorated = provider.decorateByRole(role, node, property, nodeContext);

			if (decorated === node)
			{
				return;
			}

			if (decorated.contains(node))
			{
				insertWhereNodeWas(decorated, parent, next);
			}
			else
			{
				Dom.replace(node, decorated);
			}
		});
	}
}

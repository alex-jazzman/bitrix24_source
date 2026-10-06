import { Tag, Dom, Text, Loc, ajax, Type, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { type Property, type ManagerOptions, type RenderModeValue } from '../../../const/type';
import { RenderMode, EventName, BackendForm } from '../../../const/const';
import { insertWhereNodeWas } from '../../../lib/node-position/node-position';
import { isSelectable } from '../../../lib/property/property';
import type { SelectionContext, SelectionDecorator, SelectionProvider } from '../../../model/selection/selection';

/**
 * Value insertion handed in by the application layer: this layer may not import the domain
 * at runtime, so both the strategy and the decorator arrive as parameters.
 */
export type BackendRendererSelection = {
	provider: SelectionProvider,
	applyDecorator: SelectionDecorator,
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
			const isPublicMode = this.#isPublicMode(item);

			return {
				property: item.property,
				params: {
					Field: { Field: item.fieldName, Form: BackendForm.Sfa },
					Value: (item.value ?? ''),
					Als: Type.isUndefined(item.property.AllowSelection)
						? (isPublicMode ? 0 : 1)
						: Number(isSelectable(item.property)),
					RenderMode: isPublicMode ? 'public' : 'designer',
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
									this.#initSelectors(
										item.placeholderNode,
										item.property,
										documentType,
										this.#isPublicMode(item),
									);
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
						this.#initSelectors(item.placeholderNode, item.property, documentType, this.#isPublicMode(item));
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
	#isPublicMode(item: PendingItem): boolean
	{
		const renderMode = this.#options.renderMode ?? item.renderMode ?? RenderMode.NewDesigner;

		return renderMode === RenderMode.Public;
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

	#initSelectors(
		containerNode: HTMLElement,
		property: Property,
		documentType: string[],
		isPublicMode: boolean,
	): void
	{
		const selection = this.#selection;

		if (Type.isNull(selection) || !selection.provider.isAvailable())
		{
			return;
		}

		const { provider, applyDecorator } = selection;

		const context: SelectionContext = {
			documentType: documentType.length > 0 ? documentType : undefined,
		};

		const childControlNodes = containerNode.querySelectorAll<HTMLElement>('[data-role]');

		if (isPublicMode)
		{
			// The placeholder is the whole control here, so it is both root and value node. The
			// returned pair is not spliced back: the placeholder is the node renderCollection()
			// handed to the caller, and replacing it would leave that caller holding a detached one.
			applyDecorator({root: containerNode, valueNode: containerNode}, property, provider, context);

			return;
		}

		childControlNodes.forEach((node) =>
		{
			// Taken before the provider runs: a provider that wraps the node by moving it leaves
			// nothing at this position to splice the decoration in against afterwards.
			const parent = node.parentElement;
			const next = node.nextElementSibling;

			if (Type.isNull(parent))
			{
				return;
			}

			const role = Dom.attr(node, 'data-role') ?? '';
			const decorated = provider.decorateByRole(role, node, property, context);

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

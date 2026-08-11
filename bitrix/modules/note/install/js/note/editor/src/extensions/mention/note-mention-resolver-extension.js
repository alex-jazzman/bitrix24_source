import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { collectUnresolvedMentions, resolveMentionsBatch } from '../../utils/resolve-mentions';

export const MENTION_RESOLVER_KEY = new PluginKey('noteMentionResolver');

const RESOLVE_DEBOUNCE_MS = 200;
const RESOLVE_MAX_WAIT_MS = 1000;
// Backoff before retrying after a transient request failure (no busy-loop on a down server).
const RESOLVE_RETRY_MS = 3000;
// Must stay in sync with MentionController::MAX_BATCH_SIZE — the backend truncates larger
// batches, so we resolve at most this many per pass and let the next pass pick up the rest.
const RESOLVE_BATCH_LIMIT = 200;

/**
 * TipTap extension that lazily resolves noteMention nodes via a debounced batch request.
 *
 * Mirrors FileNodeResolverExtension but with key differences:
 *   - Unresolved/pasted mentions are NOT deleted on failure — they become unavailable:true.
 *   - Uses its own PluginKey, entirely separate from FileNodeResolverExtension.
 *   - Labels stay out of markdown (single source of truth is the backend).
 */
export const NoteMentionResolverExtension = Extension.create({
	name: 'noteMentionResolver',

	addProseMirrorPlugins()
	{
		const { editor } = this;

		return [
			new Plugin({
				key: MENTION_RESOLVER_KEY,

				view(view)
				{
					// Session-scoped set of "type:id" strings that permanently failed — skip re-requesting.
					const failed = new Set();
					let timer = null;
					let retryTimer = null;
					let running = false;
					let dirty = false;
					let firstScheduleAt = null;

					const run = async () => {
						if (running)
						{
							dirty = true;

							return;
						}
						running = true;
						dirty = false;
						firstScheduleAt = null;

						try
						{
							// Cap per pass: the backend truncates to RESOLVE_BATCH_LIMIT, so anything
							// beyond it must be resolved by a later pass rather than dropped as failed.
							const items = collectUnresolvedMentions(view.state.doc, failed).slice(0, RESOLVE_BATCH_LIMIT);
							if (items.length === 0)
							{
								return;
							}

							const resolvedMap = await resolveMentionsBatch(items);

							// Transient failure (null) — keep nodes unresolved and retry with backoff;
							// do NOT mark healthy chips as permanently failed.
							if (resolvedMap === null)
							{
								scheduleRetry();

								return;
							}

							// Mark items absent from the successful response as permanently failed.
							for (const { type, id } of items)
							{
								const key = `${type}:${id}`;
								if (!resolvedMap.has(key))
								{
									failed.add(key);
								}
							}

							// Apply resolved/unavailable attrs via tr.setNodeMarkup.
							const { tr, doc } = view.state;
							let changed = false;

							doc.descendants((node, pos) => {
								if (node.type.name !== 'noteMention')
								{
									return;
								}

								const { entityType, entityId, available } = node.attrs;
								if (available !== null)
								{
									return; // already resolved
								}

								const key = `${entityType}:${entityId}`;
								const mention = resolvedMap.get(key);

								let newAttrs;
								if (mention)
								{
									newAttrs = {
										...node.attrs,
										label: mention.label ?? null,
										avatar: mention.avatar ?? null,
										url: mention.url ?? null,
										available: Boolean(mention.available),
										isCurrentUser: Boolean(mention.isCurrentUser),
										// When backend reports unavailable, mark the node so NodeView shows grey chip.
										unavailable: !mention.available,
									};
								}
								else if (failed.has(key))
								{
									// Permanently failed — mark unavailable without deleting.
									newAttrs = {
										...node.attrs,
										available: false,
										unavailable: true,
									};
								}
								else
								{
									return;
								}

								tr.setNodeMarkup(pos, undefined, newAttrs);
								changed = true;
							});

							if (changed)
							{
								view.dispatch(tr);
							}
						}
						finally
						{
							running = false;
							if (dirty)
							{
								schedule();
							}
						}
					};

					const schedule = () => {
						if (timer)
						{
							clearTimeout(timer);
						}
						if (firstScheduleAt === null)
						{
							firstScheduleAt = Date.now();
						}
						// Cap the debounce reset: under continuous updates run() must still fire at least every RESOLVE_MAX_WAIT_MS,
						// otherwise chips can stay stuck in skeleton indefinitely.
						const elapsed = Date.now() - firstScheduleAt;
						const delay = Math.min(RESOLVE_DEBOUNCE_MS, Math.max(0, RESOLVE_MAX_WAIT_MS - elapsed));
						timer = setTimeout(run, delay);
					};

					// One-shot backoff retry after a transient failure; coalesced so a burst
					// of failures schedules a single pending retry.
					const scheduleRetry = () => {
						if (retryTimer)
						{
							return;
						}
						retryTimer = setTimeout(() => {
							retryTimer = null;
							run();
						}, RESOLVE_RETRY_MS);
					};

					schedule();

					return {
						update(view, prevState)
						{
							// Only re-scan when the document actually changed; selection-only
							// transactions (caret moves) must not trigger a full doc walk.
							if (view.state.doc !== prevState.doc)
							{
								schedule();
							}
						},
						destroy()
						{
							if (timer)
							{
								clearTimeout(timer);
							}
							if (retryTimer)
							{
								clearTimeout(retryTimer);
							}
						},
					};
				},
			}),
		];
	},
});

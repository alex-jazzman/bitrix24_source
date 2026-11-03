/**
 * The one door to the global namespace for the whole legacy subtree.
 *
 * The layer reads its neighbours out of `window.BX`. Publishing no longer goes through here - the
 * modules export their symbols and the build writes them into `BX` (PUB-01); what is left are the
 * reads, and the two symbols that must still be assigned by hand. The indirection on the reading
 * side is deliberate and normative (ADR 3.4):
 * the groups call each other in rings - `util.objectMerge` calls `BX.mergeEx` while `merge` calls
 * `BX.util.array_merge` - and direct imports between them would resolve to values that are not
 * initialised yet at load time. The modern kernel is reached the same way: it publishes `BX.type`,
 * `BX.Text` and the rest from a tail block that runs before the layer, so the names exist by the
 * time any of these functions is called, but not while the modules are being evaluated.
 *
 * The type is deliberately loose. The surface is described by the generated `core.d.ts` and
 * asserted by `test/old/core/contract.test.ts`; narrowing it here would only force casts at
 * every call site without adding a check.
 *
 * `window.BX` is also a function - `src/internal/bx.ts` defines it as one and copies the namespace
 * onto it - and three places in the layer use that form: `BX(node)` resolves an id or a node in
 * `findFormElements`, `hide_object` and `scrollToNode`. The call signature is exported separately
 * rather than merged into the record type, because a type carrying both makes every property read
 * resolve against the call signature first and turns the loose `any` into a wrong concrete type.
 */
export type LegacyGlobal = Record<string, any>;

export const BX: LegacyGlobal = (window as any).BX;

/**
 * The same object seen as the resolver function. Use it only for the `BX(...)` call form.
 */
export const resolve = BX as unknown as (node?: any) => any;

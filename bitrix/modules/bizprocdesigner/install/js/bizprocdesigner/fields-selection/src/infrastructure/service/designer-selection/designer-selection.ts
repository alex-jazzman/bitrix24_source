import { Dom, Event, Loc, Runtime, Tag, Text, Type } from 'main.core';
import type { BitrixVue, Component } from 'ui.vue3';
import { type Section } from 'bizprocdesigner.expression-builder';
import { isExpressionValue, type Property, type SelectionContext, type SelectionProvider } from 'bizproc.fields';

import 'ui.icon-set.outline';

import {
	type WriteTarget,
	declaresWriteOver,
	insertAtCaret,
	writeOver,
} from '../../../lib/value-write/value-write';

/**
 * What a source collection may answer with: the sections it has, a promise of them, or the staged
 * pair whose `pending` replaces the set once the rest arrives.
 */
export type StagedSections = Section[] | { sections: Section[], pending: Promise<StagedSections> };

/**
 * Collects the source sections on demand, for the field the window was opened over: which sources a
 * field is offered is the host's to decide, and the adapter hands it the field to decide on without
 * filtering anything itself. A host whose set is the same for every field declares the callback
 * without parameters.
 */
export type SourcesProvider = (
	property: Property,
	context: SelectionContext,
) => StagedSections | Promise<StagedSections>;

/**
 * The collection as the value constructor is handed it: bound to the field of the opening, because
 * the constructor calls it with nothing and knows of no field (CONTRACT-01).
 */
export type BoundSourcesProvider = () => StagedSections | Promise<StagedSections>;

export type DesignerSelectionOptions = {
	sourcesProvider: SourcesProvider,
};

/** Everything the value constructor is opened with. */
export type BuilderProps = {
	bindElement: HTMLElement,
	initialValue: string,
	sourcesProvider: BoundSourcesProvider,
	onApply: (value: string) => void,
	onClose: () => void,
};

/**
 * The mounted window: whoever created the application unmounts it, the button it stands over, and
 * the observer watching for that button to leave the document - the window lives exactly as long as
 * its own button does (see showWindow).
 */
type BuilderWindow = {
	app: { unmount: () => void },
	container: HTMLElement,
	bindElement: HTMLElement,
	observer: MutationObserver,
};

/**
 * What the lazy load answers with. `Runtime.loadExtension` is typed as handing back an array of
 * exports and reduces the namespaces of every name it was given into one object before returning
 * it, so the constructor and the Vue that mounts it are read off that one object side by side.
 */
type BuilderExports = {
	ExpressionBuilder: Component,
	BitrixVue: typeof BitrixVue,
};

const WRAPPER_CLASS = 'bizprocdesigner-fields-selection';
const WRAPPER_TESTID = 'bizprocdesigner-fields-selection-wrap';
const INSERT_BUTTON_CLASS = 'bizprocdesigner-fields-selection__insert';
const INSERT_BUTTON_TESTID = 'bizprocdesigner-fields-selection-insert';

/** Fetched on the first opening and not with the page: 200 KB of constructor most fields never ask for. */
const BUILDER_EXTENSION = 'bizprocdesigner.expression-builder';

/**
 * Fetched together with the constructor and for the same reason: 200 KB more of Vue, and the
 * constructor is the only thing here that mounts anything. Declared as a dependency of the adapter
 * it would arrive with the page for every form, opened or not. `Runtime.loadExtension` keeps every
 * name it has loaded, so the pair is fetched once however many buttons the form carries.
 */
const VUE_EXTENSION = 'ui.vue3';

/**
 * A property as the backend normalizes one: `Id` names the field it describes, and every property
 * of a document carries it (FieldType::normalizeProperty). Narrowed here rather than widened on the
 * framework type, which leaves the id out on purpose - the name a host renders a property under is
 * its own to choose.
 */
type IdentifiedProperty = Property & { Id?: string };

/**
 * The field a decoration belongs to: it names the test id of the `...` button, one adapter
 * decorating every field of a page at once. Nothing is matched on the name - an open window follows
 * its own button and not a field (see showWindow).
 *
 * The framework answers first: it runs the field under a name of its own and hands that name over
 * with every decoration of it, which is the one source that holds for every control - the markup
 * answers late (the companion is named `{fieldName}_text` only after the decoration returns) and
 * the dropdown never names the input insertion attaches to at all. The property and the control
 * stay behind it for a host still handing over a context without the name. The `[]` a multiple
 * control adds to the submitted name is dropped so that every row of one field answers to one
 * label.
 *
 * An empty answer means the field could not be named, which now takes a host on the older
 * contract whose property and control name nothing either: the button of such a field carries the
 * bare label of the adapter.
 */
function resolveFieldName(context: SelectionContext, target: WriteTarget | null, property: Property): string
{
	const { fieldName } = context;

	if (Type.isStringFilled(fieldName))
	{
		return fieldName;
	}

	const { Id: id } = property as IdentifiedProperty;

	if (Type.isStringFilled(id))
	{
		return id;
	}

	if (Type.isNull(target))
	{
		return '';
	}

	return target.name.endsWith('[]') ? target.name.slice(0, -2) : target.name;
}

/**
 * What the adapter promises the constructor, in one place: the button the window binds to, the
 * value the field holds at the moment of opening, the source collection of the host already bound
 * to the field of the opening, and where an applied value goes.
 */
export function buildBuilderProps(params: {
	bindElement: HTMLElement,
	target: WriteTarget | null,
	sourcesProvider: BoundSourcesProvider,
	close: () => void,
}): BuilderProps
{
	const { bindElement, target, sourcesProvider, close } = params;

	return {
		bindElement,
		// Read at opening and not at decoration: the field could have been typed in since it was
		// rendered. Only an expression goes in: the window assembles one, and a formatted date or the
		// caption of an option is none to go on building - seeded with such text, the window would
		// open on it and hand back what the field already shows.
		initialValue: !Type.isNull(target) && isExpressionValue(target.value) ? target.value : '',
		sourcesProvider,
		onApply: (value: string): void => {
			// The field is gone when it was re-rendered or released under the open window: writing
			// into a detached node would report success while the value disappears.
			if (!Type.isNull(target) && target.isConnected)
			{
				writeApplied(target, value);
			}

			close();
		},
		onClose: close,
	};
}

/**
 * The control is asked and not the type of the field: only the control knows the shape it has. A
 * date, a file and a dropdown showing the caption of an option carry no text an expression could be
 * appended to, and each of them says so on the node it declared for the write - the type declares,
 * the provider writes.
 */
function writeApplied(target: WriteTarget, value: string): void
{
	if (declaresWriteOver(target))
	{
		writeOver(target, value);

		return;
	}

	insertAtCaret(target, value);
}

/**
 * Value insertion for the fields framework through the value constructor of the designer: the
 * decorated control gets the `...` button, and the button opens the constructor as a popup of its
 * own bound to it.
 *
 * The adapter collects no sources: the host hands in a collection at construction, and it is asked
 * at every opening for the field the window stands over, which is what keeps this file clear of the
 * editor and its diagram.
 */
export class DesignerSelectionProvider implements SelectionProvider
{
	#sourcesProvider: SourcesProvider;
	#window: BuilderWindow | null = null;

	/**
	 * Tells one opening from the next. The extension is loaded on the way to the first window, and a
	 * later click or a release has moved this on, so the load that arrives late mounts nothing.
	 *
	 * A decoration moves it on for no field: one adapter serves the whole form, and a re-render
	 * elsewhere is no answer to the click that is waiting here. The click that is waiting answers
	 * for itself instead - it mounts nothing once its own button has left the document (see
	 * showWindow), which is what a re-render of its own field does to it.
	 */
	#openRequest: number = 0;

	constructor(options: DesignerSelectionOptions)
	{
		this.#sourcesProvider = options.sourcesProvider;
	}

	/**
	 * The constructor travels with this adapter - the extension it mounts is its neighbour, fetched
	 * on the first opening - so a host that got the adapter has the whole entry.
	 */
	isAvailable(): boolean
	{
		return true;
	}

	/**
	 * Every type the framework offers insertion for. The constructor assembles a string and the
	 * field decides what it does with it, exactly as with the automation provider.
	 */
	supports(_property: Property): boolean
	{
		return true;
	}

	/**
	 * Nothing is taken down here, whatever field is being decorated. A re-render of the field an open
	 * window stands over carries the button of that window out of the document
	 * (FieldManager.applyProperty replaces the node of the field it re-rendered), and the window goes
	 * down with it by itself - see showWindow. A re-render anywhere else leaves that button where it
	 * is, and so leaves an expression not applied yet alone, two fields sharing one name included:
	 * the manager addresses fields by id and allows the form to carry such a pair.
	 */
	decorate(controlNode: HTMLElement, property: Property, context: SelectionContext): HTMLElement
	{
		// The node the type declared for the write, handed over by the framework: nothing is looked
		// for in the markup, because only the type knows the shape of its own control.
		const target = context.writeTarget ?? null;
		const fieldName = resolveFieldName(context, target, property);

		if (Type.isNull(target))
		{
			// The type declared no node an inserted value could go into - a control holding no text, a
			// widget decorated by a role of its own - so an applied value would be dropped on the way
			// out (buildBuilderProps.onApply), leaving the field empty after a successful insertion.
			return controlNode;
		}

		const button = this.#renderInsertButton(fieldName);
		const wrapper: HTMLElement = Tag.render`
			<div class="${WRAPPER_CLASS}" data-testid="${WRAPPER_TESTID}"></div>
		`;

		// The node itself, not a copy of it: the core finds it inside the result and goes on
		// reading the value off it (see SelectionProvider.decorate).
		Dom.append(controlNode, wrapper);
		Dom.append(button, wrapper);

		Event.bind(button, 'click', () => {
			// The target of this very decoration, and not a fresh look at the markup: the node moved
			// into the wrapper above instead of being copied, so the reference is still the live one.
			// The property and the context travel with it: they are what the host is asked for its
			// sources with, and they describe this decoration and no later one.
			this.#showWindow(button, target, property, context).catch((error: unknown) => {
				// The window is the whole answer the button gives: a load that never arrived would
				// leave the click silent and say nowhere what went wrong.
				console.error(
					'[bizprocdesigner.fields-selection] the value constructor could not be loaded, '
					+ 'the click opened nothing',
					error,
				);
			});
		});

		return wrapper;
	}

	/**
	 * The role names which selector the automation provider builds; this adapter has the one entry
	 * into the value constructor, so it decorates the same way whatever the role. A role of another
	 * widget arrives without a write target and is left undecorated by that alone (see decorate).
	 */
	decorateByRole(
		_role: string,
		controlNode: HTMLElement,
		property: Property,
		context: SelectionContext,
	): HTMLElement
	{
		return this.decorate(controlNode, property, context);
	}

	/**
	 * Takes the adapter down: the window is a Vue application of its own in `document.body`, and a
	 * host destroyed with one open would leave it standing over whatever comes next. Idempotent, and
	 * the adapter decorates again afterwards as it did before.
	 *
	 * The hook `SelectionProvider` declares for exactly this: FieldManager.destroy calls it once,
	 * after the fields, and a host reusing the adapter for the next manager gets it whole. The
	 * observer of the window goes down with the window, so nothing of this adapter is left watching
	 * the document afterwards.
	 */
	release(): void
	{
		this.#cancelOpening();
		this.#closeWindow();
	}

	async #showWindow(
		bindElement: HTMLElement,
		target: WriteTarget,
		property: Property,
		context: SelectionContext,
	): Promise<void>
	{
		const request = this.#cancelOpening();
		this.#closeWindow();

		const loaded: unknown = await Runtime.loadExtension([BUILDER_EXTENSION, VUE_EXTENSION]);
		const builder = loaded as BuilderExports;

		// Nothing is mounted for a click that no longer stands: a later one took the entry over, the
		// host let the adapter go, or the field left the page while the extension was on its way -
		// a window bound to a button outside the document has nothing to stand over.
		if (request !== this.#openRequest || !bindElement.isConnected)
		{
			return;
		}

		const container = document.createElement('div');
		Dom.append(container, document.body);

		const app = builder.BitrixVue.createApp(builder.ExpressionBuilder, buildBuilderProps({
			bindElement,
			target,
			// Bound to the field of this opening: the constructor asks for the sources with nothing
			// (CONTRACT-01), so the field the host decides on is carried in from here.
			sourcesProvider: () => this.#sourcesProvider(property, context),
			close: () => {
				this.#closeWindow();
			},
		}));

		app.mount(container);

		// The button says whether what it opens stands open now (WCAG 4.1.2).
		Dom.attr(bindElement, 'aria-expanded', 'true');

		// The window lives as long as the button it stands over, so it watches for that button to
		// leave the document. Every way a field can go covers itself that way and none has to be
		// reported: its property re-rendered (FieldManager.applyProperty), the field released or
		// remounted (releaseField, the Vue wrapper around it), the whole host destroyed. Matching a
		// field by name instead cannot do it - the manager addresses fields by id and allows two of
		// one name - and it never hears of a release at all. The cost is one check per mutation of
		// the document, and only while a window stands open.
		const observer = new MutationObserver(() => {
			if (!bindElement.isConnected)
			{
				this.#closeWindow();
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });

		this.#window = { app, container, bindElement, observer };
	}

	/**
	 * Cancels an opening still on its way and answers with the number of the one that takes the entry
	 * over. A click during the load of the extension, and a release, are the two events that do so.
	 */
	#cancelOpening(): number
	{
		this.#openRequest += 1;

		return this.#openRequest;
	}

	/** Idempotent: with no window open there is nothing to take down and nothing left watching. */
	#closeWindow(): void
	{
		if (Type.isNull(this.#window))
		{
			return;
		}

		const { app, container, bindElement, observer } = this.#window;
		this.#window = null;
		// Ahead of the removal below: that removal is a mutation of the document too, and an observer
		// still connected would be called over the window it has just taken down.
		observer.disconnect();
		// Written on a button already out of the document too: no effect there, and no branch here.
		Dom.attr(bindElement, 'aria-expanded', 'false');
		app.unmount();
		Dom.remove(container);
	}

	/**
	 * The entry into the constructor: a button with a role and an accessible name, reachable from
	 * the keyboard (WCAG 2.1.1 and 4.1.2). Mirrors the fallback button of the framework
	 * (BaseField.renderInsertButton), which is not drawn where this adapter decorates the field.
	 */
	#renderInsertButton(fieldName: string): HTMLElement
	{
		const testId = fieldName === '' ? INSERT_BUTTON_TESTID : `${INSERT_BUTTON_TESTID}-${fieldName}`;

		const button: HTMLElement = Tag.render`
			<button
				type="button"
				class="${INSERT_BUTTON_CLASS}"
				aria-label="${Text.encode(Loc.getMessage('BIZPROCDESIGNER_FIELDS_SELECTION_INSERT_VALUE') ?? '')}"
				aria-haspopup="dialog"
				aria-expanded="false"
				data-testid="${Text.encode(testId)}"
			>
				<div class="ui-icon-set --more-l" aria-hidden="true"></div>
			</button>
		`;

		return button;
	}
}

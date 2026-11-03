/* eslint-disable */
type DesignerSelectionOptions = {
	sourcesProvider: SourcesProvider;
};

/**
 * Collects the source sections on demand, for the field the window was opened over: which sources a
 * field is offered is the host's to decide, and the adapter hands it the field to decide on without
 * filtering anything itself. A host whose set is the same for every field declares the callback
 * without parameters.
 */
type SourcesProvider = (property: BX.Bizproc.Fields.Property, context: BX.Bizproc.Fields.SelectionContext) => StagedSections | Promise<StagedSections>;

/**
 * What a source collection may answer with: the sections it has, a promise of them, or the staged
 * pair whose `pending` replaces the set once the rest arrives.
 */
type StagedSections = BX.Bizprocdesigner.Section[] | {
	sections: BX.Bizprocdesigner.Section[];
	pending: Promise<StagedSections>;
};

declare namespace BX.Bizprocdesigner {
	/**
	 * Value insertion for the fields framework through the value constructor of the designer: the
	 * decorated control gets the `...` button, and the button opens the constructor as a popup of its
	 * own bound to it.
	 *
	 * The adapter collects no sources: the host hands in a collection at construction, and it is asked
	 * at every opening for the field the window stands over, which is what keeps this file clear of the
	 * editor and its diagram.
	 */
	class DesignerSelectionProvider implements BX.Bizproc.Fields.SelectionProvider {
		constructor(options: DesignerSelectionOptions);
		/**
		 * The constructor travels with this adapter - the extension it mounts is its neighbour, fetched
		 * on the first opening - so a host that got the adapter has the whole entry.
		 */
		isAvailable(): boolean;
		/**
		 * Every type the framework offers insertion for. The constructor assembles a string and the
		 * field decides what it does with it, exactly as with the automation provider.
		 */
		supports(_property: BX.Bizproc.Fields.Property): boolean;
		/**
		 * Nothing is taken down here, whatever field is being decorated. A re-render of the field an open
		 * window stands over carries the button of that window out of the document
		 * (FieldManager.applyProperty replaces the node of the field it re-rendered), and the window goes
		 * down with it by itself - see showWindow. A re-render anywhere else leaves that button where it
		 * is, and so leaves an expression not applied yet alone, two fields sharing one name included:
		 * the manager addresses fields by id and allows the form to carry such a pair.
		 */
		decorate(controlNode: HTMLElement, property: BX.Bizproc.Fields.Property, context: BX.Bizproc.Fields.SelectionContext): HTMLElement;
		/**
		 * The role names which selector the automation provider builds; this adapter has the one entry
		 * into the value constructor, so it decorates the same way whatever the role. A role of another
		 * widget arrives without a write target and is left undecorated by that alone (see decorate).
		 */
		decorateByRole(_role: string, controlNode: HTMLElement, property: BX.Bizproc.Fields.Property, context: BX.Bizproc.Fields.SelectionContext): HTMLElement;
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
		release(): void;
	}
}

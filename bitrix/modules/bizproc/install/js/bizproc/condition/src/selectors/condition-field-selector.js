import { Runtime, Type } from 'main.core';

// `ui.entity-selector` is 244Kb of JS and 31Kb of CSS wanted by the `new` view alone, so it is kept
// out of the `rel` of the extension: the condition dialogs of the robots, of the activities and of
// the storage fields load `bizproc.condition` too and never build this control. The first open of
// the list is a click of the user - a place where waiting for an extension is allowed.
const ENTITY_SELECTOR_EXTENSION = 'ui.entity-selector';

export class ConditionFieldSelector
{
	#fields: Array<Object>;
	#target: HTMLElement;
	#onSelect: (field: Object) => void;
	#dialog: ?Object = null;
	// A show that is still waiting for the extension is already open as far as the host is concerned:
	// a repeated click has to close it, and the load it started must not open a list behind it.
	#showId: number = 0;
	#isLoading: boolean = false;

	constructor(fields: Array<Object>, target: HTMLElement, onSelect: (field: Object) => void)
	{
		this.#fields = fields;
		this.#target = target;
		this.#onSelect = onSelect;
	}

	isOpen(): boolean
	{
		return this.#dialog !== null || this.#isLoading;
	}

	async show(): Promise<void>
	{
		this.destroy();

		const showId = ++this.#showId;
		this.#isLoading = true;

		let Dialog;
		try
		{
			({ Dialog } = await Runtime.loadExtension(ENTITY_SELECTOR_EXTENSION));
		}
		finally
		{
			if (showId === this.#showId)
			{
				this.#isLoading = false;
			}
		}

		// The row may have been closed, repainted or removed while the extension was loading.
		if (showId !== this.#showId || !this.#target.isConnected)
		{
			return;
		}

		const dialog = new Dialog({
			targetNode: this.#target,
			width: 500,
			height: 300,
			multiple: false,
			dropdownMode: true,
			enableSearch: true,
			showAvatars: false,
			compactView: true,
			cacheable: false,
			// Keep the dialog open on a click on its own target: the host toggles it instead.
			autoHideHandler: (event) => !this.#target.contains(event.target),
			items: this.#fields.map((field) => ({
				// The dialog keys its items by id, and fields of different objects (Document,
				// Variable, Constant) may share an Id - without the object they collapse into one.
				id: `${field.ObjectId ?? ''}:${field.SystemExpression || field.Id}`,
				entityId: 'bp',
				tabs: 'recents',
				title: field.Name || field.Id,
				customData: { field },
			})),
			events: {
				onDestroy: () => {
					if (this.#dialog === dialog)
					{
						this.#dialog = null;
					}
				},
				'Item:onBeforeSelect': (event) => {
					if (this.#dialog !== dialog)
					{
						return;
					}

					event.preventDefault();
					const field = event.getData().item.getCustomData().get('field');
					// A non-cacheable dialog destroys itself on hide, and entity-selector keeps
					// calling it right after select(), so close it off that stack.
					setTimeout(() => this.destroy(), 0);
					this.#onSelect(field);
				},
			},
		});
		this.#dialog = dialog;
		dialog.show();
	}

	destroy()
	{
		this.#showId++;
		this.#isLoading = false;
		const dialog = this.#dialog;
		this.#dialog = null;
		// The dialog may already be destroyed by its own popup, which nulls the instance.
		if (dialog && Type.isFunction(dialog.destroy))
		{
			dialog.destroy();
		}
	}
}

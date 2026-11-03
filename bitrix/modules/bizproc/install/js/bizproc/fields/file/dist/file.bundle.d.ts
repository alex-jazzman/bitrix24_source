/* eslint-disable */
/**
 * `UploaderOptions` narrowed to this type's controller options: the generic declaration calls a
 * controller option a scalar, while the document type must reach the controller as an array.
 */
type FileUploaderOptions = Omit<BX.UI.Uploader.UploaderOptions, 'controllerOptions'> & {
	controllerOptions: UploaderControllerOptions;
};

/**
 * The whole of what the controller is sent. The limits are deliberately absent: the options go into the
 * salt of the upload token signature (`Uploader::getTokenSalt`), and a limit that changes with the
 * property would leave the files already in the dropzone with tokens the server no longer accepts.
 */
type UploaderControllerOptions = {
	documentType?: string[];
};

type FileWidgetOptions = {
	readonly?: boolean;
	hideDropArea?: boolean;
};

/** The mounted widget: no instance type is exported, so it is spelled through the class. */
type UploaderWidget = InstanceType<typeof BX.UI.Uploader.TileWidget>;

declare namespace BX.Bizproc.Fields.File {
	/**
	 * Concrete "file" field type: the control is the tile uploader widget of the `ui` module, mounted
	 * into the field's own markup.
	 *
	 * A dropzone cannot show an expression, so the field is filled either by the dropzone or by the
	 * expression companion the core puts below it, with the core's tabs above the pair. The value of the
	 * field is file identifiers only; the expression travels in the companion under `{fieldName}_text`
	 * and is read back from there by the core (getEffectiveValue) and by `Base::extractValueSingle`.
	 *
	 * Exactly one carrier is submitted, not exactly one filled: the hidden inputs belong to the uploader
	 * and emptying them would delete the user's files, so the container leaves the submit instead - see
	 * #applySubmitState.
	 *
	 * `Property.Settings` values are untrusted - they describe an action parameter - and the limits read out
	 * of them are the browser's alone: they are no part of what the controller is sent, so what bounds an
	 * upload on the server is the server's own settings.
	 *
	 * A programmatic write is no part of what this type answers to. Files reach the uploader only while a
	 * widget is being built, and applyValue() is empty here, so the identifiers setValue() keeps are neither
	 * drawn nor submitted - and FieldManager.applyProperty() reads the value back off the uploader before it
	 * rebuilds, writing over them at the next property change. A consumer filling such a field renders it
	 * over the value instead (FieldManager.renderField).
	 *
	 * The hidden inputs of the seeded files are this type's own, not the uploader's - see
	 * #assignSeededHiddenFields.
	 *
	 * An upload still running when the field is re-rendered is started over rather than lost: the file the
	 * user picked is held across the release and handed to the fresh widget (see #retainFilesInFlight) - the
	 * whole file and not an identifier, because the identifier such an upload may already have names nothing
	 * that can be loaded back. It is no part of the value while it runs (see #belongsToValue), so getValue()
	 * on a single field being filled answers empty rather than that identifier.
	 *
	 * The `change` of this type is announced a microtask past the uploader event that caused it, where a
	 * sibling type answers synchronously: a consumer reading the hidden inputs of the files needs the
	 * uploader to have written them first (see #emitChangeWhenHiddenFieldsSettled).
	 */
	class FileField extends BX.Bizproc.Fields.BaseField {
		/**
		 * Releases the current render's widget, keeping the uploaded files.
		 *
		 * Step order matters: mute removals first (they are not the user dropping a file), then take the
		 * unfinished uploads off the uploader while it still has them - `Uploader#destroy` calls removeFiles()
		 * and empties its file list, so past the destroy there is nothing left to take - then clear the
		 * server-deletion flag, because destroying the adapter deletes its files from the server by default
		 * and those files are what the next render is seeded with. Destroy after unmount - the adapter is
		 * owned from outside, so the component's unmounted() hook leaves it alone; the other order would
		 * throw on a second destroy().
		 *
		 * The interrupted upload leaves its temporary file on the server: the flag above keeps the destroy
		 * from deleting anything, and what a broken-off upload had already sent - whole chunks of it, where the
		 * upload went by chunks - is collected by the daily cleanup of temporary files rather than here.
		 *
		 * Idempotent: called both by render() and by the manager releasing the field.
		 */
		protected release(): void;
		/**
		 * One dropzone whatever `Multiple` says. Declaring the group keeps the core's row machinery off -
		 * otherwise it builds one control per value, and so one uploader per file.
		 */
		rendersGroup(): boolean;
		/**
		 * Declares the companion as both expression node and insert anchor: the `...` button belongs to that
		 * row, and an undeclared anchor would send the decorator to the value node, leaving the uploader
		 * writing into the original the decoration replaced.
		 *
		 * The hidden-inputs container and the widget mount node are siblings, not nested, because Vue empties
		 * the node it mounts into. The container is the value node; the mount node is the named node, since
		 * that is the carrier a user sees - the mode fades it and makes it `inert`.
		 *
		 * The container is a hidden <fieldset>: a fieldset keeps the inputs below it out of a submit whoever
		 * created them and whenever (see #applySubmitState).
		 */
		renderControl(value: string | string[] | null): BX.Bizproc.Fields.RenderedControl;
		/**
		 * Answers unconditionally: whether the field may insert anything is the core's own question, asked
		 * next to this one (isSelectionAllowed).
		 *
		 * Unlike bool, the public render mode is not excluded: the legacy backend of this type also replaces
		 * the control with an expression input there (`BaseType\File::renderControlSingle` under
		 * $allowSelection), and without the pair the decorator would have no anchor and would wrap the value
		 * node.
		 */
		supportsExpressionMode(): boolean;
		/**
		 * The value-mode tab is named after this type's control; the core's default names a toggle. The
		 * other tab keeps the core's wording.
		 */
		getValueModeLabels(): BX.Bizproc.Fields.ValueModeLabels;
		/**
		 * A picked tab reaches the type here: only the submit markup follows the mode. What the dropzone
		 * shows stays on screen whatever the mode.
		 */
		protected onValueModeChanged(mode: BX.Bizproc.Fields.ValueModeValue): void;
		/**
		 * The other way the mode is settled - a programmatic write, a restored state, a render that found a
		 * lone expression. Together with onValueModeChanged this covers every point the core changes it at.
		 */
		protected setValueMode(mode: BX.Bizproc.Fields.ValueModeValue): void;
		/**
		 * The companion carries the requirement: it is the live carrier while an expression fills the field,
		 * and its `textbox` role holds `aria-required`.
		 *
		 * Needed beside the dropzone description, not instead of it: the mode makes the named node `inert`,
		 * and an `inert` subtree leaves the accessibility tree with the dropzone and its description. Measured
		 * over `Accessibility.getFullAXTree`: with the expression tab on, nothing announced the requirement.
		 * WCAG 1.3.1, 3.3.2, 4.1.2.
		 *
		 * Read off the core's tracked companions rather than `root`: the selection decorator replaces the
		 * companion with a copy.
		 */
		protected getGroupRequiredNodes(root: HTMLElement): HTMLElement[];
		/**
		 * A seam of its own: a mounted widget raises a real uploader talking to the controller, so tests
		 * replace this method rather than the widget.
		 *
		 * A widget instance is single-use - renderTo() mounts only while the root component is null and
		 * unmount() does not reset it, so every render builds another. Mounting is synchronous.
		 */
		protected createWidget(uploaderOptions: FileUploaderOptions, widgetOptions: FileWidgetOptions, node: HTMLElement): UploaderWidget;
		protected getWidget(): UploaderWidget | null;
		/**
		 * The value is the identifiers of the files the uploader holds, read off the uploader and never off
		 * the tracked node's `.value` - that node is the hidden-inputs container and carries no value. Which of
		 * those files it is made of is #belongsToValue: the uploads still running are left out whether they
		 * have an identifier yet or not, so a single field being filled answers empty until its upload arrives.
		 *
		 * The expression is no part of this answer; the whole value is the core's reading of the pair
		 * (getEffectiveValue). Files are answered whatever the mode, so a snapshot does not lose them at the
		 * next property change.
		 */
		getValue(): string | string[];
		/**
		 * Intentionally empty, super.applyValue() included: the base would write `.value` of the hidden-inputs
		 * container, which has no such property.
		 *
		 * Nothing takes its place, and a programmatic write therefore does not reach this field at all. The
		 * identifiers stay in the value the core keeps, where nothing draws or submits them, and the first
		 * property change writes over them: FieldManager.applyProperty() takes its snapshot through
		 * getValueState(), which reads getValue(), which reads the uploader. Filling such a field is done by
		 * rendering it over the value.
		 *
		 * The expression needs no writing either: the core puts it into the companion and switches the mode.
		 */
		protected applyValue(value: string | string[]): void;
	}
}

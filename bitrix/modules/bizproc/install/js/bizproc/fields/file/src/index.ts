import 'ui.design-tokens';
import 'ui.icon-set.outline';

import './style.css';

import { Dom, Loc, Tag, Text, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import {
	BaseField,
	FieldRegistry,
	isExpressionValue,
	type Property,
	type RenderedControl,
	ValueMode,
	type ValueModeLabels,
	type ValueModeValue,
} from 'bizproc.fields';
import {
	FileOrigin,
	UploaderEvent,
	type UploaderFile,
	type UploaderFileOptions,
	type UploaderOptions,
} from 'ui.uploader.core';
import { TileWidget } from 'ui.uploader.tile-widget';

const UPLOADER_CONTROLLER: string = 'bizproc.fileUploader.automationFieldUploaderController';

/** The file input of the dropzone - the one control the widget renders. */
const DROP_INPUT_SELECTOR: string = 'input.ui-tile-uploader-drop-input';

/**
 * The whole of what the controller is sent. The limits are deliberately absent: the options go into the
 * salt of the upload token signature (`Uploader::getTokenSalt`), and a limit that changes with the
 * property would leave the files already in the dropzone with tokens the server no longer accepts.
 */
type UploaderControllerOptions = {
	documentType?: string[],
};

/**
 * `UploaderOptions` narrowed to this type's controller options: the generic declaration calls a
 * controller option a scalar, while the document type must reach the controller as an array.
 */
type FileUploaderOptions = Omit<UploaderOptions, 'controllerOptions'> & {
	controllerOptions: UploaderControllerOptions,
};

type FileWidgetOptions = {
	readonly?: boolean,
	hideDropArea?: boolean,
};

/**
 * `Property.Settings` limits in the uploader's vocabulary. An omitted limit stays absent, which
 * keeps the uploader's product default in charge.
 */
type FileLimits = Pick<FileUploaderOptions, 'maxFileSize' | 'acceptedFileTypes' | 'maxFileCount'>;

/**
 * Limits are `unknown` on purpose: `Settings` holds an action parameter written by a consumer, so
 * what arrives is validated in #getLimits.
 */
type FileProperty = Property & {
	Settings?: {
		MaxFileSize?: unknown,
		AcceptedFileTypes?: unknown,
		MaxFileCount?: unknown,
	} & Record<string, unknown>,
};

/**
 * Mutes removal events of one render. release() destroys the uploader, which empties its file list
 * and announces every removal, while the next render is seeded with those same files. The flag lives
 * with the widget whose handler holds it, so a later render still reports the user.
 */
type ReleaseFlag = {
	released: boolean,
};

/** The mounted widget: no instance type is exported, so it is spelled through the class. */
type UploaderWidget = InstanceType<typeof TileWidget>;

/** A value split into the field's two carriers - see #splitValue. */
type FileValueParts = {
	expression: string,
	fileIds: Array<string | number>,
};

/**
 * Both option types the widget declares are stricter than what it accepts: a controller option is
 * declared scalar and `compact` required, though the constructor defaults options to `{}`. Converting
 * once here keeps the call sites type-checked.
 */
const FileTileWidget = TileWidget as unknown as new (
	uploaderOptions: FileUploaderOptions,
	widgetOptions: FileWidgetOptions,
) => UploaderWidget;

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
class FileField extends BaseField
{
	#widget: UploaderWidget | null = null;

	#releaseFlag: ReleaseFlag = { released: false };

	/** Container of the current render's hidden inputs - the node #applySubmitState works on. */
	#hiddenFieldsNode: HTMLElement | null = null;

	/**
	 * The hidden input this type wrote for a seeded file, so that a removal can take it away again (see
	 * #assignSeededHiddenFields). Keyed by the file itself and weakly: the files of a released widget are
	 * dropped by its destroy, so no render has to clear this.
	 */
	#seededHiddenFields: WeakMap<UploaderFile, HTMLInputElement> = new WeakMap();

	/**
	 * The files of the uploads the last release found unfinished, held until the next render hands them
	 * to its widget - see #retainFilesInFlight and #restoreFilesInFlight.
	 */
	#filesInFlight: File[] = [];

	/**
	 * Mutes the removals of a restore. Adding a file to a field that is not multiple replaces the one
	 * file the uploader holds, and a replacement is a removal it announces (`Uploader#addFile` calls
	 * removeFile) - while a render is not the user dropping a file.
	 *
	 * What is replaced there is the seed, the file the render was drawn over, so the value of a single
	 * field can change without a word: it is empty from the replacement on and a consumer learns of it
	 * only when the restored upload finishes - never, if that upload fails.
	 */
	#restoringFilesInFlight: boolean = false;

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
	protected release(): void
	{
		super.release();

		// Before the early return: the render's nodes are gone whether a widget was mounted or not.
		this.#hiddenFieldsNode = null;

		const widget = this.#widget;

		if (Type.isNull(widget))
		{
			return;
		}

		this.#releaseFlag.released = true;

		this.#retainFilesInFlight(widget);

		widget.getAdapter().setRemoveFilesFromServerWhenDestroy(false);

		// Only when mounted: getVueApp() would create an app just to throw it away.
		if (!Type.isNull(widget.getRootComponent()))
		{
			widget.getVueApp().unmount();
		}

		widget.getAdapter().destroy();

		this.#widget = null;
	}

	/**
	 * One dropzone whatever `Multiple` says. Declaring the group keeps the core's row machinery off -
	 * otherwise it builds one control per value, and so one uploader per file.
	 */
	rendersGroup(): boolean
	{
		return true;
	}

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
	renderControl(value: string | string[] | null): RenderedControl
	{
		const { expression, fileIds } = this.#splitValue(value);

		const hiddenFields: HTMLElement = Tag.render`
			<fieldset class="bizproc-fields-file__hidden-fields" hidden></fieldset>
		`;

		const controlNode: HTMLElement = Tag.render`
			<div
				class="bizproc-fields-file__control"
				data-testid="${Text.encode(`bizproc-field-control-${this.getFieldName()}`)}"
			></div>
		`;

		const root: HTMLElement = Tag.render`
			<div class="bizproc-fields-file">
				${hiddenFields}
				${controlNode}
			</div>
		`;

		this.#hiddenFieldsNode = hiddenFields;
		// A re-rendered field keeps the mode it stands in; a render settles it only for a lone
		// expression (BaseField#adoptRenderedValueMode).
		this.#applySubmitState(this.getValueMode());

		this.#releaseFlag = { released: false };
		this.#widget = this.createWidget(
			this.#getUploaderOptions(hiddenFields, fileIds),
			this.#getWidgetOptions(),
			controlNode,
		);
		// Before the restore, which may replace the seed of a field that is not multiple: the removal
		// that replacement announces is what takes the input of the replaced file away again.
		this.#assignSeededHiddenFields();

		// Past the widget, because the files go in through the uploader itself, and past the options,
		// whose limits were settled over the count of these very files.
		this.#restoreFilesInFlight();

		if (this.isRequired())
		{
			this.#describeRequirement(root);
		}

		// writeOver: a file expression names a whole group of files, so an inserted one takes the
		// place of what the companion holds instead of being appended to it.
		const expressionControl = this.renderExpressionControl({ value: expression, writeOver: true });

		if (Type.isNull(expressionControl))
		{
			return { root, valueNode: hiddenFields, namedNode: controlNode };
		}

		Dom.append(expressionControl.node, root);

		return {
			root,
			valueNode: hiddenFields,
			namedNode: controlNode,
			expressionNode: expressionControl.input,
			insertAnchor: expressionControl.input,
		};
	}

	/**
	 * Answers unconditionally: whether the field may insert anything is the core's own question, asked
	 * next to this one (isSelectionAllowed).
	 *
	 * Unlike bool, the public render mode is not excluded: the legacy backend of this type also replaces
	 * the control with an expression input there (`BaseType\File::renderControlSingle` under
	 * $allowSelection), and without the pair the decorator would have no anchor and would wrap the value
	 * node.
	 */
	supportsExpressionMode(): boolean
	{
		return true;
	}

	/**
	 * The value-mode tab is named after this type's control; the core's default names a toggle. The
	 * other tab keeps the core's wording.
	 */
	getValueModeLabels(): ValueModeLabels
	{
		return {
			...super.getValueModeLabels(),
			value: Loc.getMessage('BIZPROC_FIELDS_FILE_VALUE_MODE_FILE') ?? '',
		};
	}

	/**
	 * A picked tab reaches the type here: only the submit markup follows the mode. What the dropzone
	 * shows stays on screen whatever the mode.
	 */
	protected onValueModeChanged(mode: ValueModeValue): void
	{
		this.#applySubmitState(mode);
	}

	/**
	 * The other way the mode is settled - a programmatic write, a restored state, a render that found a
	 * lone expression. Together with onValueModeChanged this covers every point the core changes it at.
	 */
	protected setValueMode(mode: ValueModeValue): void
	{
		super.setValueMode(mode);
		this.#applySubmitState(mode);
	}

	/**
	 * Leaves the submit holding the one carrier the mode names. In expression mode the files are no part
	 * of the value, but their hidden inputs stay in the markup - they are the uploader's, and dropping one
	 * deletes the file from the server - so the container leaves the submit instead. Otherwise a native
	 * submit would send both carriers, and `Base::extractValueSingle` reads `{name}_text` only past an
	 * empty value: the files would win over the typed expression.
	 *
	 * A `disabled` <fieldset> rather than a flag per input: the uploader creates those inputs as uploads
	 * finish, and it creates them past the event this type hears about them by (`Uploader#setHiddenField`
	 * runs after the FILE_COMPLETE emit), so a per-input flag would always be one input behind. The same
	 * order is why the change of the value is announced a microtask late instead - the container needs no
	 * waiting, a consumer reading those inputs does (see #emitChangeWhenHiddenFieldsSettled).
	 */
	#applySubmitState(mode: ValueModeValue): void
	{
		const hiddenFields = this.#hiddenFieldsNode;

		if (Type.isNull(hiddenFields))
		{
			return;
		}

		hiddenFields.toggleAttribute('disabled', mode === ValueMode.Expression);
	}

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
	protected getGroupRequiredNodes(root: HTMLElement): HTMLElement[]
	{
		return this.getExpressionNodes();
	}

	/**
	 * Puts the requirement into the dropzone input's description, not into `aria-required`: Chrome exposes
	 * `input[type=file]` as `role=button`, where ARIA 1.2 supports no `aria-required`. The name is no
	 * carrier either - a group named by its <legend> is left alone by the core. `aria-describedby` is
	 * global, so it holds on any role.
	 *
	 * The attribute is a list of ids and the widget describes that input itself, so this one is appended.
	 * Read-only draws no dropzone and announces nothing.
	 */
	#describeRequirement(root: HTMLElement): void
	{
		const input = root.querySelector<HTMLInputElement>(DROP_INPUT_SELECTOR);
		// An unloaded phrase comes back as '' rather than null; describing with it would look wired
		// up while announcing nothing.
		const phrase = Loc.getMessage('BIZPROC_FIELDS_FILE_REQUIRED_DESCRIPTION');

		if (Type.isNull(input) || !Type.isStringFilled(phrase))
		{
			return;
		}

		const descriptionId = `${this.getControlId()}-required`;

		const note: HTMLElement = Tag.render`<span id="${descriptionId}" hidden>${Text.encode(phrase)}</span>`;

		Dom.attr(note, 'data-testid', `bizproc-field-required-note-${this.getFieldName()}`);
		Dom.append(note, root);

		const describedBy = input.getAttribute('aria-describedby');

		Dom.attr(
			input,
			'aria-describedby',
			Type.isStringFilled(describedBy) ? `${describedBy} ${descriptionId}` : descriptionId,
		);
	}

	/**
	 * A seam of its own: a mounted widget raises a real uploader talking to the controller, so tests
	 * replace this method rather than the widget.
	 *
	 * A widget instance is single-use - renderTo() mounts only while the root component is null and
	 * unmount() does not reset it, so every render builds another. Mounting is synchronous.
	 */
	protected createWidget(
		uploaderOptions: FileUploaderOptions,
		widgetOptions: FileWidgetOptions,
		node: HTMLElement,
	): UploaderWidget
	{
		const widget = new FileTileWidget(uploaderOptions, widgetOptions);

		widget.renderTo(node);

		return widget;
	}

	protected getWidget(): UploaderWidget | null
	{
		return this.#widget;
	}

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
	getValue(): string | string[]
	{
		const fileIds = this.#getFileIds();

		return this.isMultiple() ? fileIds : (fileIds[0] ?? '');
	}

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
	protected applyValue(value: string | string[]): void
	{
	}

	/**
	 * Splits a handed-in value between uploader and companion by the core's rule (`BaseField#splitItems`):
	 * a file identifier among the items wins and the expression is dropped, matching the order the backend
	 * reads the pair in - `Base::extractValueSingle` takes `{name}_text` only past an empty value.
	 *
	 * Items are told apart by `isExpressionValue`: seeding such text to the uploader would ask the
	 * controller for a file that does not exist. Emptiness does not count as a value here, unlike in the
	 * core, so an empty element leaves the expression standing.
	 *
	 * A scalar is not split on commas: the type renders its own multiple and the core hands it the string
	 * whole.
	 */
	#splitValue(value: string | string[] | null): FileValueParts
	{
		const items: Array<string | number> = Type.isArray<string | number>(value) ? value : [value ?? ''];
		const fileIds = items.filter(
			(item) => item !== '' && !Type.isNil(item) && !isExpressionValue(item),
		);

		if (fileIds.length > 0)
		{
			return { expression: '', fileIds };
		}

		return { expression: items.find((item): item is string => isExpressionValue(item)) ?? '', fileIds };
	}

	/**
	 * The identifiers of the files the value is made of (#belongsToValue), answered as strings whatever type
	 * the uploader gave them: the core carries a value across a property change by string tests
	 * (`FieldManager#adaptValue`), so the numeric id of a permanent file would be dropped there. The server
	 * still tells the two apart - `UploaderHelper::splitFiles` reads `'42'` through `is_numeric`, the same
	 * as `42`.
	 *
	 * A file of that half with no identifier is left out all the same, though neither side of the half
	 * produces one: a seed is built around its identifier (`UploaderFile` reads it in its constructor) and a
	 * finished upload is given one with its status (setServerFileId off the upload response). A guard rather
	 * than a case - String() must not be handed a null.
	 */
	#getFileIds(): string[]
	{
		const uploader = this.getWidget()?.getUploader();

		if (!uploader)
		{
			return [];
		}

		const ids: Array<string | number | null> = uploader
			.getFiles()
			.filter((file: UploaderFile) => FileField.#belongsToValue(file))
			.map((file: UploaderFile) => file.getServerFileId())
		;

		return ids
			.filter((id) => Type.isStringFilled(id) || Type.isNumber(id))
			.map((id) => String(id))
		;
	}

	/**
	 * The half of the uploader's file list that IS the value: the seed, and the uploads of the user that
	 * finished. The other half is the uploads still running, held over the release instead, and
	 * #isUploadInFlight is spelled as the negation of this - so between them the list is covered. No file is
	 * carried in the value and held as a file at once, and the only one both halves leave behind is a failed
	 * upload: nothing to resume, and no identifier worth saving.
	 *
	 * Completeness alone would not do, and getting this wrong loses files. A seeded file is not COMPLETE
	 * while it loads its metadata (`UploaderFile#load` sets LOADING, and only the answer of the load
	 * controller turns it PENDING or COMPLETE), yet its identifier stands from its constructor on and IS the
	 * value the render was drawn over: weighing the seed by isComplete() would make a snapshot taken
	 * meanwhile answer empty, and the next save would write that emptiness over the stored files. Origin
	 * answers for the seed instead - `UploaderFile` assigns SERVER to a file given by identifier and never
	 * flips it, the same test a seeded completion is told by (#handleFileComplete).
	 *
	 * An upload of the user is left out until it finishes even where it has an identifier, which it has from
	 * its first accepted chunk on: the upload controllers call setServerFileId with the token of that
	 * chunk's response while the status stays UPLOADING. That token names a temporary file the server has
	 * not accepted - `Uploader::loadTempFile` looks for `'=UPLOADED' => true` and answers UNKNOWN_TOKEN for
	 * a partial one - so a value carrying it would save a dead identifier over the file still being
	 * uploaded, and the next render would draw it as a failed tile.
	 */
	static #belongsToValue(file: UploaderFile): boolean
	{
		return file.getOrigin() === FileOrigin.SERVER || file.isComplete();
	}

	/**
	 * Keeps the files of the uploads that have not finished, so that the next render can start them over.
	 * Such a file is no part of the value (#isUploadInFlight, the negation of #belongsToValue) and the seed
	 * of the next widget cannot carry it - the seed is identifiers, and the identifier such an upload may
	 * already have names a temporary file the server refuses to load - while every release destroys the
	 * uploader, which breaks the upload off. Without this the user's file would be gone from the dropzone at
	 * the next property change, and gone silently.
	 *
	 * A file with no binary is dropped, there being nothing to restore it from. `UploaderFile` holds one for
	 * everything the user picked, so this too is a guard rather than a case.
	 *
	 * Called from release() before the destroy, the only point the files are still reachable at.
	 */
	#retainFilesInFlight(widget: UploaderWidget): void
	{
		const files: UploaderFile[] = widget.getUploader()?.getFiles() ?? [];

		this.#filesInFlight = files
			.filter((file) => FileField.#isUploadInFlight(file))
			.map((file) => file.getBinary())
			.filter((binary): binary is File => !Type.isNull(binary))
		;
	}

	/**
	 * An upload of the user that has not finished - the half of the file list the value leaves out, spelled
	 * as the negation of #belongsToValue so that the two halves cannot drift apart. A file that travels in
	 * the value is answered no: it comes back through `files`, so holding it here as well would make two
	 * files out of one. A failed upload is answered no too - it is no part of the value either, and there is
	 * nothing left to resume.
	 *
	 * The identifier is not weighed. An upload past its first chunk has one and is still running (see
	 * #belongsToValue), so weighing it would leave a multi-chunk upload in neither half: dropped from the
	 * dropzone, while its dead token stayed in the value.
	 */
	static #isUploadInFlight(file: UploaderFile): boolean
	{
		return !FileField.#belongsToValue(file) && !file.isFailed();
	}

	/**
	 * Hands the retained files to the widget of the fresh render, and lets go of them in the same breath:
	 * kept, they would be added again by every render after this one.
	 *
	 * `addFiles` is the way in because the declared seed does not carry the file: `UploaderFileOptions`,
	 * the shape of a `files` item, declares an identifier, metadata and a client preview - never the file
	 * itself. Handing the file over raw is what is left, and it is the same call the dropzone's own input
	 * makes. (A raw file does reach an uploader through `files` in fact - the constructor passes that
	 * option to this very `addFiles`, which wraps any item in a `UploaderFile` - but the seed of this type
	 * is built to the declared contract, a list of identifiers, see #toFileList.) The upload therefore
	 * starts from the beginning again, which is the accepted price: the alternative is the file the user
	 * picked disappearing without a word.
	 *
	 * A field that is not multiple is handed the first file and no more, the rule the seed is cut by
	 * (#toSeedIds). The uploader weighs a handed-over list as a whole and takes none of it:
	 * `#exceedsMaxFileCount` answers true for a second file where the uploader is not multiple, and
	 * `addFiles` then returns nothing - a refusal decided on that count alone, before the branch that
	 * emits MAX_FILE_COUNT_EXCEEDED and ERROR, so nothing is announced about it either. Handing both
	 * files over would therefore lose both, and silently. `Multiple` turning false while two uploads run
	 * is the one way two files reach such a widget: an uploader that is not multiple never holds a second
	 * upload of its own.
	 *
	 * A render announces nothing of this. Adding a file emits no completion - `Uploader` emits
	 * FILE_COMPLETE off a finished load or upload, both of which are later than this call - and the
	 * removal of a replacement is muted (see #restoringFilesInFlight). The completion of a restored
	 * upload is announced when it arrives, as any other: the value has an identifier by then.
	 */
	#restoreFilesInFlight(): void
	{
		const files = this.isMultiple() ? this.#filesInFlight : this.#filesInFlight.slice(0, 1);

		this.#filesInFlight = [];

		if (files.length === 0)
		{
			return;
		}

		this.#restoringFilesInFlight = true;

		try
		{
			this.getWidget()?.getUploader()?.addFiles(files);
		}
		finally
		{
			this.#restoringFilesInFlight = false;
		}
	}

	/**
	 * `hiddenFieldName` is the plain field name, NOT getControlName(): the latter already carries the `[]`
	 * of a multiple field while the uploader appends its own suffix, together naming the input `field[][]`.
	 * `assignServerFile` is off, because the uploader writes the hidden input of a seeded file too late to
	 * be the value: `Uploader#setHiddenField` runs off LOAD_COMPLETE, that is past the load of the file's
	 * metadata, and off LOAD_ERROR it never runs at all. A native submit before that answer - and every
	 * submit after a failed one - would save emptiness over identifiers the field is showing. This type
	 * writes those inputs itself and synchronously (see #assignSeededHiddenFields); the uploads of the
	 * user stay the uploader's, where there is nothing worth submitting before they finish.
	 *
	 * An upload fires no native form event, while consumers listen for `change` above the field - hence
	 * the two handlers, each with the case it must stay silent about.
	 *
	 * Seed and limits are settled against each other before either is handed over (see #toSeedIds,
	 * #toSeedLimits). The retained uploads count towards the limits as well: they are no part of the seed,
	 * yet they reach the same uploader right after it is built (see #restoreFilesInFlight), and a ceiling
	 * cut to the seed alone would refuse them.
	 */
	#getUploaderOptions(hiddenFieldsContainer: HTMLElement, fileIds: Array<string | number>): FileUploaderOptions
	{
		const seedIds = this.#toSeedIds(fileIds);
		const limits = FileField.#toSeedLimits(this.#getLimits(), seedIds.length + this.#filesInFlight.length);
		const releaseFlag = this.#releaseFlag;

		return {
			controller: UPLOADER_CONTROLLER,
			controllerOptions: this.#getControllerOptions(),
			multiple: this.isMultiple(),
			autoUpload: true,
			assignServerFile: false,
			hiddenFieldsContainer,
			hiddenFieldName: this.getFieldName(),
			files: FileField.#toFileList(seedIds),
			...limits,
			events: {
				[UploaderEvent.FILE_COMPLETE]: (event: BaseEvent): void => this.#handleFileComplete(event, releaseFlag),
				[UploaderEvent.FILE_REMOVE]: (event: BaseEvent): void => this.#handleFileRemove(event, releaseFlag),
			},
		};
	}

	/** Read-only hides adding and removing; tiles of uploaded files stay visible. */
	#getWidgetOptions(): FileWidgetOptions
	{
		const readOnly = this.isReadOnly();

		return {
			readonly: readOnly,
			hideDropArea: readOnly,
		};
	}

	/**
	 * A finished upload is a change of the value, except for seeded files: the uploader loads every file
	 * of the `files` option and announces each as complete, while those files ARE the value the field was
	 * rendered over. Announcing them would echo the render back at a consumer that re-renders on `change`.
	 *
	 * `origin` tells them apart: `UploaderFile` assigns it in its constructor and never flips it. An event
	 * without a file is treated as an upload. A seeded file is answered before anything is scheduled, so
	 * deferring the announcement (#emitChangeWhenHiddenFieldsSettled) leaves that silence untouched.
	 */
	#handleFileComplete(event: BaseEvent, releaseFlag: ReleaseFlag): void
	{
		const file: UploaderFile | undefined = event.getData()?.file;

		if (file?.getOrigin() === FileOrigin.SERVER)
		{
			return;
		}

		this.#emitChangeWhenHiddenFieldsSettled(releaseFlag);
	}

	/**
	 * A removal is a change of the value, except at the two points of a re-render where it is this type's
	 * own doing: the destroy emptying a widget whose files the next render gets back (see ReleaseFlag),
	 * and the restore replacing the one file of a field that is not multiple - the seed, which leaves that
	 * silence a change of the value nobody is told about (see #restoringFilesInFlight).
	 *
	 * The release flag is weighed twice, on two different questions: here it answers whether this removal
	 * is the user's at all, and again where the deferred announcement runs, on whether a render is still
	 * there to report to (#emitChangeWhenHiddenFieldsSettled).
	 *
	 * The input of a seeded file goes before either question is asked: it is this type's own, so it has to
	 * follow the file whoever dropped it, the two silent removals included. Left behind, it would submit
	 * an identifier the field no longer holds.
	 */
	#handleFileRemove(event: BaseEvent, releaseFlag: ReleaseFlag): void
	{
		const file: UploaderFile | undefined = event.getData()?.file;

		if (!Type.isUndefined(file))
		{
			this.#dropSeededHiddenField(file);
		}

		if (releaseFlag.released || this.#restoringFilesInFlight)
		{
			return;
		}

		this.#emitChangeWhenHiddenFieldsSettled(releaseFlag);
	}

	/**
	 * Writes the hidden input of every seeded file the widget took in, so that a native submit carries the
	 * stored identifiers from the render on rather than from the load of their metadata on (see
	 * #getUploaderOptions, where the uploader is told to leave these inputs alone).
	 *
	 * Read off the uploader rather than off the seed handed to it: a seed the uploader refused is no part
	 * of the value either, and reading the list keeps this answer and getValue() built from the same one.
	 * Origin is the test, the same one the value is assembled by (#belongsToValue) - a file of the user
	 * gets its input from the uploader when the upload finishes. An identifier is weighed by the rule
	 * #getFileIds weighs it by, so that what the form submits and what getValue() answers cannot part
	 * ways over a file the uploader holds under an identifier of no substance.
	 *
	 * The name is the one the uploader would have used: the plain field name, with the `[]` of a multiple
	 * appended. `#syncInputPositions` re-appends the uploader's own inputs and leaves foreign ones where
	 * they are, so the seed submits ahead of the uploads of the user - the order getValue() reads them in.
	 */
	#assignSeededHiddenFields(): void
	{
		const container = this.#hiddenFieldsNode;

		if (Type.isNull(container))
		{
			return;
		}

		const files: UploaderFile[] = this.getWidget()?.getUploader()?.getFiles() ?? [];
		const name = this.getFieldName() + (this.isMultiple() ? '[]' : '');

		files.forEach((file) => {
			if (file.getOrigin() !== FileOrigin.SERVER)
			{
				return;
			}

			const fileId = file.getServerFileId();

			if (!Type.isStringFilled(fileId) && !Type.isNumber(fileId))
			{
				return;
			}

			const input = Tag.render<HTMLInputElement>`<input type="hidden">`;

			// Through properties rather than through the template: a field name is text a consumer of
			// the framework wrote, and an identifier is text a consumer saved.
			input.name = name;
			input.value = String(fileId);

			Dom.append(input, container);
			this.#seededHiddenFields.set(file, input);
		});
	}

	/** Takes back what #assignSeededHiddenFields wrote for one file. Silent about a file it never wrote. */
	#dropSeededHiddenField(file: UploaderFile): void
	{
		const input = this.#seededHiddenFields.get(file);

		if (Type.isUndefined(input))
		{
			return;
		}

		this.#seededHiddenFields.delete(file);
		Dom.remove(input);
	}

	/**
	 * Announces the change a microtask late, because the uploader writes the hidden input of the file
	 * right AFTER the emit that brought us here: `Uploader#setHiddenField` follows the FILE_COMPLETE emit
	 * and `Uploader#resetHiddenField` follows FILE_REMOVE, each synchronously in the same method. A
	 * consumer submitting the form from its `change` handler would otherwise collect the carriers before
	 * that input exists (or after a removal, while it still does) and send the previous value; one that
	 * calls applyProperty() there is worse - the re-render destroys this uploader mid-emit, and
	 * `Uploader#destroy` nulls its own prototype before it returns, so the remainder of the uploader's
	 * own method then throws on its public getters. A microtask suffices exactly because that remainder is
	 * synchronous: no await stands between the emit and the hidden field.
	 *
	 * The flag is read when the microtask runs, not when it is scheduled: a release in between leaves no
	 * render to report about, while emitChange() announces on the node of the LAST render
	 * (BaseField#emitChange keeps it), which would blame markup the user never touched.
	 */
	#emitChangeWhenHiddenFieldsSettled(releaseFlag: ReleaseFlag): void
	{
		void Promise.resolve().then((): void =>
		{
			if (releaseFlag.released)
			{
				return;
			}

			this.emitChange();
		});
	}

	/**
	 * The limits the property declares. An unsaid limit produces no option, leaving the uploader's product
	 * default in charge.
	 *
	 * All three are UX rather than protection: they are no part of what the controller is sent, and the
	 * browser is the only place they meet a value the field trusts.
	 */
	#getLimits(): FileLimits
	{
		const settings = (this.getProperty() as FileProperty).Settings ?? {};
		const limits: FileLimits = {};

		const maxFileSize = FileField.#toLimitNumber(settings.MaxFileSize);
		if (!Type.isNull(maxFileSize))
		{
			limits.maxFileSize = maxFileSize;
		}

		const acceptedFileTypes = FileField.#toFileTypeList(settings.AcceptedFileTypes);
		if (!Type.isNull(acceptedFileTypes))
		{
			limits.acceptedFileTypes = acceptedFileTypes;
		}

		const maxFileCount = FileField.#toLimitNumber(settings.MaxFileCount);
		if (!Type.isNull(maxFileCount))
		{
			limits.maxFileCount = maxFileCount;
		}

		return limits;
	}

	/**
	 * A number spelled as text counts as said: `Settings` holds an action parameter, where numbers
	 * routinely arrive as strings. Whole numbers only, and the whole number is what is weighed: a
	 * fraction below one truncates to zero, and `FileSizeFilter#setMaxFileSize` keeps a zero as a real
	 * ceiling (it accepts every `value >= 0`), after which the filter refuses every file that has a
	 * size at all. Nothing above zero is left to limit by, so such a setting is no limit.
	 */
	static #toLimitNumber(value: unknown): number | null
	{
		const number = Type.isStringFilled(value) ? Number(value.trim()) : value;

		if (!Type.isNumber(number) || !Number.isFinite(number))
		{
			return null;
		}

		const limit = Math.trunc(number);

		return limit > 0 ? limit : null;
	}

	/**
	 * A list left with nothing is no limit: without this a list of blanks would make the browser refuse
	 * every file while the server still accepted any.
	 */
	static #toFileTypeList(value: unknown): string[] | null
	{
		if (!Type.isArray<unknown>(value))
		{
			return null;
		}

		const fileTypes = value.filter((fileType) => Type.isStringFilled(fileType) && fileType.trim() !== '');

		return fileTypes.length > 0 ? (fileTypes as string[]) : null;
	}

	/**
	 * A consumer that names no document type gets no option, and the controller then refuses every upload -
	 * the intended answer, since a default document type would let files be uploaded on behalf of a
	 * document nobody asked for. Observable as a working dropzone whose first upload fails.
	 *
	 * The limits stay out of here - see UploaderControllerOptions.
	 */
	#getControllerOptions(): UploaderControllerOptions
	{
		const { documentType } = this.getSelectionContext();

		return Type.isArrayFilled<string>(documentType) ? { documentType } : {};
	}

	/**
	 * The identifiers a widget is seeded with: a single field takes the first and nothing else.
	 *
	 * The uploader weighs such a list as a whole and refuses all of it - `#exceedsMaxFileCount` answers
	 * true for a second file where the field is not multiple, and `addFiles` then returns nothing, before
	 * any error is emitted. A value the property no longer fits would otherwise leave the dropzone empty
	 * and the next save would write that emptiness over the file that was there.
	 *
	 * The first item is kept because that is the item read as the value of a single field everywhere else
	 * (`FieldManager#adaptValue`, getValue()).
	 */
	#toSeedIds(fileIds: Array<string | number>): Array<string | number>
	{
		return this.isMultiple() ? fileIds : fileIds.slice(0, 1);
	}

	/**
	 * The limits as the widget is told them, with the file count widened to fit the files the render puts
	 * into the uploader - the seed and the retained uploads together. The uploader weighs a list against
	 * the limit as a whole and refuses all of it, so a limit lowered after the value was saved would empty
	 * the field of every file instead of the excess ones.
	 *
	 * The cost: the render's ceiling becomes the count of those files, so a removed file frees room that
	 * can be filled again up to that count. Both alternatives are worse - cutting the seed loses files at
	 * the next save, dropping the count limit lets the field grow unbounded. It is cheap because the limit
	 * is UX rather than protection (see #getLimits) and the controller has no count limit of its own.
	 *
	 * A single field is bounded by the uploader whatever it is told here: `#exceedsMaxFileCount` weighs a
	 * field that is not multiple against one file or lets a replacement in, and never against this option.
	 */
	static #toSeedLimits(limits: FileLimits, startingCount: number): FileLimits
	{
		if (!Type.isNumber(limits.maxFileCount) || limits.maxFileCount >= startingCount)
		{
			return limits;
		}

		return { ...limits, maxFileCount: startingCount };
	}

	/**
	 * The seed of the widget. Identifiers go in as they came: a number and a string are alike to
	 * the uploader (`UploaderFile`) and to the server it loads them through (`Uploader::splitIds` reads
	 * both by `is_numeric`), so a value a consumer wrote is not reshaped on its way to the dropzone.
	 */
	static #toFileList(fileIds: Array<string | number>): UploaderFileOptions[]
	{
		return fileIds.map((id) => ({ serverFileId: id }));
	}
}

FieldRegistry.register('file', FileField);

export { FileField };

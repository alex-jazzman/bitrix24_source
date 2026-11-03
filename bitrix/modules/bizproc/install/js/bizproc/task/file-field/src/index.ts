import { Dom, Loc, Tag, Text, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import 'ui.design-tokens';
import {
	FileOrigin,
	UploaderEvent,
	type UploaderFile,
	type UploaderFileOptions,
	type UploaderOptions,
} from 'ui.uploader.core';
import { TileWidget } from 'ui.uploader.tile-widget';

import './style.css';

/**
 * The file input of the dropzone. An internal class of `ui.uploader.tile-widget` that no contract of that
 * module declares, spelled the same way in the card (`bizproc.workflow.info`, template `slider`).
 */
const DROP_INPUT_SELECTOR: string = 'input.ui-tile-uploader-drop-input';

/** The mounted widget: no instance type is exported, so it is spelled through the class. */
type UploaderWidget = InstanceType<typeof TileWidget>;

/**
 * What the controller is sent (DTO-02), taken from the container as the server wrote it. The set goes into
 * the salt of the token signature (`Uploader::getTokenSalt`) whole, so a key added here would leave the
 * files already in the dropzone with tokens the server no longer accepts.
 */
type TaskUploaderControllerOptions = {
	[key: string]: string | number,
};

/** The contract of the container the server draws (TPL-01), as far as this control reads it. */
export type TaskFileConfig = {
	controller: string,
	controllerOptions: TaskUploaderControllerOptions,
	/** The name of the form control (`bpriact_<code>`), NOT the code of the field. */
	hiddenFieldName: string,
	multiple: boolean,
	required: boolean,
	files: UploaderFileOptions[],
};

/**
 * Widget options this control is responsible for. The declared type calls `hideDropArea` and `readonly`
 * required too, while the constructor defaults its options to `{}` - so they are left out here.
 */
type TaskFileWidgetOptions = {
	autoCollapse: boolean,
	compact: boolean,
	removeFromServer: boolean,
};

export type TaskFileControlOptions = {
	/** The value changed: an upload of the person finished, or a tile was taken away. */
	onChange?: () => void,
	/** An upload started or ended. While it is on, the task has no value to decide on yet. */
	onUploadingChange?: (uploading: boolean) => void,
};

/**
 * Both option types the widget declares are stricter than what it accepts, so the cast is done once here
 * and the call site stays type-checked, the way `bizproc.fields.file` does it.
 */
const TaskFileTileWidget = TileWidget as unknown as new (
	uploaderOptions: UploaderOptions,
	widgetOptions: TaskFileWidgetOptions,
) => UploaderWidget;

/**
 * The file field of a task card: the tile uploader widget of `ui` mounted into the container the server
 * draws (TPL-01), with the value carried by hidden inputs of its own fieldset. The rules of the value
 * below follow `bizproc/install/js/bizproc/fields/file/src/index.ts`; only what differs is spelled out.
 *
 * The card owns the lifetime: it mounts a control per container when it draws a task and destroys them
 * before the form is re-drawn, because Vue empties the node it mounts into and a widget instance is
 * single-use (renderTo() mounts only while the root component is null).
 *
 * Nothing of the task is read out of the surroundings: its identifier travels in the configuration of the
 * container, inside the controller options the salt of the token is counted over.
 */
export class TaskFileControl
{
	readonly #node: HTMLElement;

	readonly #config: TaskFileConfig;

	readonly #options: TaskFileControlOptions;

	/** Container of the hidden inputs - a fieldset, so that the value can be left out of a submit. */
	readonly #hiddenFields: HTMLElement;

	/** The node the widget is mounted into: a sibling of the fieldset, since Vue empties it. */
	readonly #controlNode: HTMLElement;

	/**
	 * The hidden input this control wrote for a file it was seeded with, so that a removal can take it
	 * away again (see #assignSeededHiddenFields). Keyed weakly by the file itself.
	 */
	readonly #seededHiddenFields: WeakMap<UploaderFile, HTMLInputElement> = new WeakMap();

	#widget: UploaderWidget | null = null;

	/** The hidden note of the requirement (#describeRequirement); the destroy takes it away again. */
	#requirementNote: HTMLElement | null = null;

	/** Mutes the events of the destroy: it empties the file list and announces every removal. */
	#released: boolean = false;

	#uploading: boolean = false;

	constructor(node: HTMLElement, config: TaskFileConfig, options: TaskFileControlOptions = {})
	{
		this.#node = node;
		this.#config = config;
		this.#options = options;

		this.#hiddenFields = Tag.render`
			<fieldset
				class="bizproc-task-file-field__hidden-fields"
				data-testid="task-file-field-values"
				hidden
			></fieldset>
		`;
		this.#controlNode = Tag.render`<div class="bizproc-task-file-field__control"></div>`;

		Dom.append(this.#hiddenFields, node);
		Dom.append(this.#controlNode, node);

		this.#widget = this.createWidget(
			this.#getUploaderOptions(),
			// compact: the card is narrow, and a list longer than a page collapses behind a counting tile
			{ autoCollapse: true, compact: true, removeFromServer: false },
			this.#controlNode,
		);

		// past the widget: the hidden inputs of the seeded files are this control's own to write
		this.#assignSeededHiddenFields();
		this.#uploading = this.isUploading();

		if (config.required)
		{
			this.#describeRequirement();
		}
	}

	/** A seam: a mounted widget raises a real uploader, so tests replace this method, not the widget. */
	protected createWidget(
		uploaderOptions: UploaderOptions,
		widgetOptions: TaskFileWidgetOptions,
		node: HTMLElement,
	): UploaderWidget
	{
		const widget = new TaskFileTileWidget(uploaderOptions, widgetOptions);

		widget.renderTo(node);

		return widget;
	}

	/**
	 * The identifiers the value is made of, read off the uploader and never off the DOM: the hidden inputs
	 * are written after the event that announces the file, so the markup is one file behind.
	 */
	getValue(): string[]
	{
		return this.#getFiles()
			.filter((file: UploaderFile) => TaskFileControl.#belongsToValue(file))
			.map((file: UploaderFile) => file.getServerFileId())
			.filter((id: string | number | null) => TaskFileControl.#isFileIdentifier(id))
			.map((id: string | number) => String(id))
		;
	}

	/** An upload of the person is still running, so the field has no value to decide on yet. */
	isUploading(): boolean
	{
		return this.#getFiles().some((file: UploaderFile) => TaskFileControl.#isUploadInFlight(file));
	}

	/**
	 * Takes the control off the container, keeping every file it holds on the server. Idempotent.
	 *
	 * Step order is the order of `FileField#release`: mute the events first, then clear the
	 * server-deletion flag, because destroying the adapter deletes its files from the server by default.
	 * Destroy after unmount: the adapter is owned from outside, so unmounted() leaves it alone.
	 */
	destroy(): void
	{
		const widget = this.#widget;

		if (Type.isNull(widget))
		{
			return;
		}

		this.#released = true;
		this.#widget = null;

		widget.getAdapter().setRemoveFilesFromServerWhenDestroy(false);

		// only when mounted: getVueApp() would create an app just to throw it away
		if (!Type.isNull(widget.getRootComponent()))
		{
			widget.getVueApp().unmount();
		}

		widget.getAdapter().destroy();

		Dom.remove(this.#controlNode);
		Dom.remove(this.#hiddenFields);
		Dom.remove(this.#requirementNote);
		this.#requirementNote = null;
	}

	#getFiles(): UploaderFile[]
	{
		return this.#widget?.getUploader()?.getFiles() ?? [];
	}

	/**
	 * `hiddenFieldName` is the name of the form control the server counted, and the uploader appends the
	 * `[]` of a multiple field itself. `assignServerFile` is off because a seeded file gets its hidden
	 * input from the uploader too late to be the value: `Uploader#setHiddenField` runs off LOAD_COMPLETE
	 * and not at all off LOAD_ERROR, so a submit before that answer - and every submit after a failed
	 * one - would save emptiness over the identifiers the field is showing (see
	 * #assignSeededHiddenFields).
	 *
	 * Removal from the server is off in both places it can happen - the destroy above and the tile below:
	 * the uploader does not remove a permanent file and the task controller grants no right to remove, so
	 * the attempt would only draw an error on the tile.
	 */
	#getUploaderOptions(): UploaderOptions
	{
		return {
			controller: this.#config.controller,
			controllerOptions: this.#config.controllerOptions,
			multiple: this.#config.multiple,
			autoUpload: true,
			assignServerFile: false,
			hiddenFieldsContainer: this.#hiddenFields,
			hiddenFieldName: this.#config.hiddenFieldName,
			files: this.#getSeedFiles(),
			events: {
				[UploaderEvent.FILE_COMPLETE]: this.#handleFileComplete,
				[UploaderEvent.FILE_REMOVE]: this.#handleFileRemove,
				[UploaderEvent.FILE_STATUS_CHANGE]: this.#handleFileStatusChange,
			},
		};
	}

	/**
	 * The metadata of the files already attached (DTO-01), the empty elements left out. An empty one is a
	 * value with no living record behind it - a deleted file, an expression - and it would reach the
	 * uploader as a file without a name, that is as a file to load from the server; the load of a permanent
	 * file of a task field is refused, so the tile would come out an error where there is nothing to show.
	 *
	 * A field that is not multiple is seeded with the first file only: the uploader weighs a list as a
	 * whole and takes none of it where a second file exceeds the count, which would leave the field
	 * showing nothing and submit emptiness over what it holds.
	 */
	#getSeedFiles(): UploaderFileOptions[]
	{
		const seeded = this.#config.files.filter((file: UploaderFileOptions) => {
			return Type.isPlainObject(file) && TaskFileControl.#isFileIdentifier(file.serverFileId);
		});

		return this.#config.multiple ? seeded : seeded.slice(0, 1);
	}

	/**
	 * Writes the hidden input of every seeded file, so that a submit carries the stored identifiers from
	 * the mount on and not from the load of their metadata on (see #getUploaderOptions).
	 *
	 * Read off the uploader and not off the seed handed to it: a seed the uploader refused is no part of
	 * the value either, and reading the list keeps this answer and getValue() built from the same one.
	 * The uploader appends its own inputs after these, so the seeded files travel ahead of the uploads.
	 */
	#assignSeededHiddenFields(): void
	{
		const name = this.#config.hiddenFieldName + (this.#config.multiple ? '[]' : '');

		this.#getFiles().forEach((file: UploaderFile) => {
			const fileId = file.getServerFileId();

			if (file.getOrigin() !== FileOrigin.SERVER || !TaskFileControl.#isFileIdentifier(fileId))
			{
				return;
			}

			const input = Tag.render<HTMLInputElement>`<input type="hidden">`;

			// through properties and not through the template: both are text from outside
			input.name = name;
			input.value = String(fileId);

			Dom.append(input, this.#hiddenFields);
			this.#seededHiddenFields.set(file, input);
		});
	}

	/** Takes back what #assignSeededHiddenFields wrote for one file. Silent about any other file. */
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
	 * A finished upload is a change of the value, except for seeded files: the uploader announces each of
	 * them as complete, while those files are the value the control was mounted over.
	 */
	#handleFileComplete = (event: BaseEvent): void => {
		const file: UploaderFile | undefined = event.getData()?.file;

		this.#syncUploading();

		if (file?.getOrigin() === FileOrigin.SERVER)
		{
			return;
		}

		this.#scheduleChange();
	};

	/**
	 * A removal is a change of the value, except where it is this control's own doing - the destroy
	 * emptying the uploader. The input of a seeded file goes before that question is asked: left behind,
	 * it would submit an identifier the field no longer holds.
	 */
	#handleFileRemove = (event: BaseEvent): void => {
		const file: UploaderFile | undefined = event.getData()?.file;

		if (!Type.isUndefined(file))
		{
			this.#dropSeededHiddenField(file);
		}

		this.#syncUploading();

		if (this.#released)
		{
			return;
		}

		this.#scheduleChange();
	};

	/** Every step of an upload passes through a status, which is what the busy state is read off. */
	#handleFileStatusChange = (): void => {
		this.#syncUploading();
	};

	/**
	 * Announces the change a microtask late: the uploader writes the hidden input right after the emit
	 * that brought us here (`Uploader#setHiddenField` follows FILE_COMPLETE, `Uploader#resetHiddenField`
	 * follows FILE_REMOVE, both synchronously), so a consumer collecting the form from its handler would
	 * otherwise send the previous value. The flag is read when the microtask runs, not when it is
	 * scheduled: a destroy in between leaves no control to report about.
	 */
	#scheduleChange(): void
	{
		void Promise.resolve().then((): void => {
			if (this.#released)
			{
				return;
			}

			this.#options.onChange?.();
		});
	}

	#syncUploading(): void
	{
		if (this.#released)
		{
			return;
		}

		const uploading = this.isUploading();

		if (uploading === this.#uploading)
		{
			return;
		}

		this.#uploading = uploading;
		this.#options.onUploadingChange?.(uploading);
	}

	/**
	 * Puts the requirement into the description of the dropzone input and not into `aria-required`: Chrome
	 * exposes `input[type=file]` as `role=button`, where ARIA 1.2 supports no `aria-required`. The
	 * attribute is a list of ids and the widget describes that input itself, so this one is appended.
	 */
	#describeRequirement(): void
	{
		const input = this.#node.querySelector<HTMLInputElement>(DROP_INPUT_SELECTOR);

		if (Type.isNull(input))
		{
			console.error(
				`bizproc.task.file-field: no ${DROP_INPUT_SELECTOR} to describe as required`,
				this.#node,
			);

			return;
		}

		// an unloaded phrase comes back as '', and describing with it would announce nothing
		const phrase = Loc.getMessage('BIZPROC_TASK_FILE_FIELD_REQUIRED');

		if (!Type.isStringFilled(phrase))
		{
			return;
		}

		const noteId = `bizproc-task-file-required-${Text.getRandom().toLowerCase()}`;
		const note: HTMLElement = Tag.render`<span id="${noteId}" hidden>${Text.encode(phrase)}</span>`;

		Dom.append(note, this.#node);
		this.#requirementNote = note;

		const describedBy = input.getAttribute('aria-describedby');

		Dom.attr(
			input,
			'aria-describedby',
			Type.isStringFilled(describedBy) ? `${describedBy} ${noteId}` : noteId,
		);
	}

	/**
	 * The half of the file list that is the value: the seeded files and the finished uploads.
	 * Completeness alone would not do - a seeded file is not COMPLETE while it loads its metadata, yet its
	 * identifier stands from its constructor on. An upload is left out until it finishes even where it
	 * has an identifier, which it has from its first accepted chunk on: that token names a temporary file
	 * the server has not accepted (`Uploader::loadTempFile` answers UNKNOWN_TOKEN for a partial one).
	 */
	static #belongsToValue(file: UploaderFile): boolean
	{
		return file.getOrigin() === FileOrigin.SERVER || file.isComplete();
	}

	/**
	 * An identifier of substance: a file the server named by number, or a token it answered a chunk with.
	 * Weighed the same way wherever a file is turned into a value, so that what the form submits and what
	 * getValue() answers cannot part ways.
	 */
	static #isFileIdentifier(fileId: unknown): fileId is string | number
	{
		return Type.isStringFilled(fileId) || Type.isNumber(fileId);
	}

	/**
	 * An upload that has not finished - the negation of #belongsToValue, so that the two cannot drift
	 * apart. A failed upload is answered no: it is no part of the value and nothing of it is on its way.
	 */
	static #isUploadInFlight(file: UploaderFile): boolean
	{
		return !TaskFileControl.#belongsToValue(file) && !file.isFailed();
	}
}

/**
 * Reads the contract of the container (TPL-01). An unreadable or incomplete configuration answers null: a
 * widget talking to no controller would take files and lose every one of them.
 */
const readConfig = (node: HTMLElement): TaskFileConfig | null => {
	let parsed: unknown = null;

	try
	{
		parsed = JSON.parse(node.dataset.config ?? '');
	}
	catch
	{
		return null;
	}

	if (!Type.isPlainObject(parsed))
	{
		return null;
	}

	const config = parsed as Partial<TaskFileConfig>;

	if (!Type.isStringFilled(config.controller) || !Type.isStringFilled(config.hiddenFieldName))
	{
		return null;
	}

	return {
		controller: config.controller,
		controllerOptions: Type.isPlainObject(config.controllerOptions) ? config.controllerOptions : {},
		hiddenFieldName: config.hiddenFieldName,
		multiple: config.multiple === true,
		required: config.required === true,
		files: Type.isArray(config.files) ? config.files : [],
	};
};

/** Mounts the control into a container the server drew. Answers null where the container carries none. */
export const mountTaskFileControl = (
	node: HTMLElement,
	options: TaskFileControlOptions = {},
): TaskFileControl | null => {
	const config = readConfig(node);

	return Type.isNull(config) ? null : new TaskFileControl(node, config, options);
};

/* eslint-disable */
/** The contract of the container the server draws (TPL-01), as far as this control reads it. */
type TaskFileConfig = {
	controller: string;
	controllerOptions: TaskUploaderControllerOptions;
	/** The name of the form control (`bpriact_<code>`), NOT the code of the field. */
	hiddenFieldName: string;
	multiple: boolean;
	required: boolean;
	files: BX.UI.Uploader.UploaderFileOptions[];
};

/**
 * What the controller is sent (DTO-02), taken from the container as the server wrote it. The set goes into
 * the salt of the token signature (`Uploader::getTokenSalt`) whole, so a key added here would leave the
 * files already in the dropzone with tokens the server no longer accepts.
 */
type TaskUploaderControllerOptions = {
	[key: string]: string | number;
};

type TaskFileControlOptions = {
	/** The value changed: an upload of the person finished, or a tile was taken away. */
	onChange?: () => void;
	/** An upload started or ended. While it is on, the task has no value to decide on yet. */
	onUploadingChange?: (uploading: boolean) => void;
};

/**
 * Widget options this control is responsible for. The declared type calls `hideDropArea` and `readonly`
 * required too, while the constructor defaults its options to `{}` - so they are left out here.
 */
type TaskFileWidgetOptions = {
	autoCollapse: boolean;
	compact: boolean;
	removeFromServer: boolean;
};

/** The mounted widget: no instance type is exported, so it is spelled through the class. */
type UploaderWidget = InstanceType<typeof BX.UI.Uploader.TileWidget>;

declare namespace BX.Bizproc.Task {
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
	class TaskFileControl {
		constructor(node: HTMLElement, config: TaskFileConfig, options?: TaskFileControlOptions);
		/** A seam: a mounted widget raises a real uploader, so tests replace this method, not the widget. */
		protected createWidget(uploaderOptions: BX.UI.Uploader.UploaderOptions, widgetOptions: TaskFileWidgetOptions, node: HTMLElement): UploaderWidget;
		/**
		 * The identifiers the value is made of, read off the uploader and never off the DOM: the hidden inputs
		 * are written after the event that announces the file, so the markup is one file behind.
		 */
		getValue(): string[];
		/** An upload of the person is still running, so the field has no value to decide on yet. */
		isUploading(): boolean;
		/**
		 * Takes the control off the container, keeping every file it holds on the server. Idempotent.
		 *
		 * Step order is the order of `FileField#release`: mute the events first, then clear the
		 * server-deletion flag, because destroying the adapter deletes its files from the server by default.
		 * Destroy after unmount: the adapter is owned from outside, so unmounted() leaves it alone.
		 */
		destroy(): void;
	}

	/** Mounts the control into a container the server drew. Answers null where the container carries none. */
	const mountTaskFileControl: (node: HTMLElement, options?: TaskFileControlOptions) => TaskFileControl | null;
}

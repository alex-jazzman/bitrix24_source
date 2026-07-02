import {
	captureLinkSelection,
	showLinkSelectionOverlay,
	clearLinkSelectionOverlay,
	applyLink as applyLinkService,
	unsetLink as unsetLinkService,
} from './link-editing';

export class LinkEditingState
{
	linkValue: string;
	linkSelection: Object | null;
	_getEditor: () => Object | null;

	constructor({ getEditor }: { getEditor: () => Object | null })
	{
		this.linkValue = '';
		this.linkSelection = null;
		this._getEditor = getEditor;
	}

	open(): void
	{
		const editor = this._getEditor();
		this.linkSelection = captureLinkSelection(editor);
		showLinkSelectionOverlay(editor, this.linkSelection);
		this.linkValue = editor?.getAttributes('link').href ?? '';
	}

	close(): void
	{
		clearLinkSelectionOverlay(this._getEditor());
	}

	apply(): boolean
	{
		const editor = this._getEditor();
		if (!editor)
		{
			return false;
		}

		if (!this.linkValue)
		{
			this.unset();

			return true;
		}

		const { applied, href } = applyLinkService(editor, this.linkValue, this.linkSelection);
		if (!applied)
		{
			return false;
		}

		this.linkValue = href;
		this.linkSelection = null;
		clearLinkSelectionOverlay(editor);

		return true;
	}

	unset(): void
	{
		const editor = this._getEditor();
		if (!editor)
		{
			return;
		}

		unsetLinkService(editor, this.linkSelection);
		this.linkValue = '';
		this.linkSelection = null;
		clearLinkSelectionOverlay(editor);
	}

	setLinkValue(value: string): void
	{
		this.linkValue = value;
	}
}

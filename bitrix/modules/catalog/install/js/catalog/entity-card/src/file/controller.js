import { EventEmitter } from 'main.core.events';

export default class FileController extends BX.UI.EntityEditorController
{
	constructor(id, settings)
	{
		super();
		this.initialize(id, settings);
		EventEmitter.subscribe('Catalog.File.Input:onRemove', this.markAsChanged.bind(this));
		EventEmitter.subscribe('Catalog.File.Input:onUploadComplete', this.markAsChanged.bind(this));
	}

	rollback()
	{
		super.rollback();
		if (this._isChanged)
		{
			this._isChanged = false;
		}
	}
}

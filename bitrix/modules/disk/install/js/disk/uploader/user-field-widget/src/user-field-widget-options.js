import type { BaseEvent } from 'main.core.events';
import type { UploaderFileInfo } from 'ui.uploader.core';
import type { TileWidgetOptions } from 'ui.uploader.tile-widget';

export type UserFieldWidgetOptions = {
	eventObject?: HTMLElement,
	mainPostFormId?: string,
	files?: UploaderFileInfo[] | number[],
	canCreateDocuments?: boolean,
	disableLocalEdit?: boolean,
	allowDocumentFieldName?: string,
	photoTemplate?: 'grid' | 'gallery' | null,
	photoTemplateFieldName?: string,
	photoTemplateMode?: 'auto' | 'manual',
	tileWidgetOptions?: TileWidgetOptions,
	insertIntoText?: boolean,
	events?: { [eventName: string]: (event: BaseEvent) => void },
	withControlPanel: boolean,
	isEmbedded: boolean,
};

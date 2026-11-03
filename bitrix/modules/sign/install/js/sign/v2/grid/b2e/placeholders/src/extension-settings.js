/**
 * The settings the panel was mounted with: the name of the extension and the reading of a setting live
 * here alone, so the panel and the rows of it read the same setting from one place.
 *
 * The core keeps the settings of an extension after the first reading, so a caller needs no cache of
 * its own.
 */

import { Extension } from 'main.core';

const EXTENSION_NAME = 'sign.v2.grid.b2e.placeholders';

/** Region of the portal license: a group of a region of its own is offered in that region alone. */
export const panelRegion = (): string => {
	return Extension.getSettings(EXTENSION_NAME).get('region') ?? '';
};

/**
 * Languages of the portal, the way the field configurator asks for them: the panel hands the value
 * over untouched and never looks inside it.
 */
export const panelLanguages = (): mixed => {
	return Extension.getSettings(EXTENSION_NAME).get('languages');
};

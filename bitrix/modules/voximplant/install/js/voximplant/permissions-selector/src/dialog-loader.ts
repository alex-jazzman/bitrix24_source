import { Runtime } from 'main.core';

import { createScopedDialog, type DialogConstructor } from './scoped-dialog';

type EntitySelectorExports = {
	Dialog: DialogConstructor,
};

/**
 * The selection dialog is the heaviest thing this screen can pull - the selector alone outweighs the
 * screen itself many times over, and drags in the icon sets on top - while the permission table is
 * plain DOM the screen handles on its own. So `ui.entity-selector` is deliberately absent from the
 * dependencies of the extension and arrives on the first click of the add link.
 *
 * Keep it that way: an import of `ui.entity-selector` for anything but a type puts it straight back
 * into the `rel` of the generated config.php and the whole page pays for it again.
 */
let scopedDialogPromise: Promise<DialogConstructor> | null = null;

export function loadScopedDialog(): Promise<DialogConstructor>
{
	scopedDialogPromise ??= Runtime
		.loadExtension('ui.entity-selector')
		.then((exports: unknown) => createScopedDialog((exports as EntitySelectorExports).Dialog))
	;

	return scopedDialogPromise;
}

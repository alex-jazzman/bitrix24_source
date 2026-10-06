/**
 * `$testId` of the templates: the label of an element, optionally narrowed by the ids of the entities
 * it belongs to (`$testId('complexNodeSettingsPreview', port.id, 'drag')`).
 *
 * A plugin of its own rather than a part of the application bootstrap: a component test mounts a
 * component without the application, and a template calling `$testId` needs the helper all the same.
 */
export const TestId = {
	install(app): void
	{
		// eslint-disable-next-line no-param-reassign
		app.config.globalProperties.$testId = (id: string, ...args: Array<string>): string => {
			if (!id)
			{
				throw new Error('bizprocdesiner: not found test id');
			}

			const preparedArgs = args.reduce((acc, arg) => {
				return `${acc}-${arg}`;
			}, '');

			return `${id}${preparedArgs}`;
		};
	},
};

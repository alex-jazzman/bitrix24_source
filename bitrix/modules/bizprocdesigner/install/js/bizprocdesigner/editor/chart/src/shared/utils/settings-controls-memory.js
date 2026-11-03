type EmptySettingsControls = {
	brokenLinks: Array<empty>,
	controls: null,
	useDocumentContext: boolean,
};

// An empty getSettingsControls response is a function of the action type alone, so within one page
// of the editor the same type never has to be asked twice. Only empty responses live here: a
// response with controls carries per-node values, and an error carries nothing worth keeping.
// The document type joins the key even though the response does not depend on it: the server checks
// the rights on that document type, and a panel does mix document types — an action reading a
// selected source stands in the document of that source, not in the document of the template.
const emptyByKey: Map<string, boolean> = new Map();

function buildKey(activityType: ?string, documentType: ?Array<string>): ?string
{
	if (!activityType || !Array.isArray(documentType) || documentType.length === 0)
	{
		return null;
	}

	return [activityType, ...documentType].join('@');
}

export const settingsControlsMemory = {
	remember(activityType: ?string, documentType: ?Array<string>, response: ?Object): void
	{
		const key = buildKey(activityType, documentType);
		if (!key || response?.controls !== null)
		{
			return;
		}

		emptyByKey.set(key, Boolean(response.useDocumentContext));
	},

	get(activityType: ?string, documentType: ?Array<string>): EmptySettingsControls | null
	{
		const key = buildKey(activityType, documentType);
		if (!key || !emptyByKey.has(key))
		{
			return null;
		}

		return {
			brokenLinks: [],
			controls: null,
			useDocumentContext: Boolean(emptyByKey.get(key)),
		};
	},
};

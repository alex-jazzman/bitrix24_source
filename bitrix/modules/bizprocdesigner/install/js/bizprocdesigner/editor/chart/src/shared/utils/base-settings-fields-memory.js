// Whether the base settings of an activity have any field to fill in at all: some nodes are served by
// the unified panel and carry nothing but service properties (a manual-start trigger), and their card
// says so instead of showing an empty form. Kept for the whole page, so a row of the short form can
// answer for a construction whose form was never mounted - the only reader of the answer.
//
// Two levels, and they do not claim the same thing. The answer of a node is exact: the server computes
// it against the properties of that very node (Complex::hasFillableBaseSettingsFields). The answer of a
// type is an approximation of it: the property map of an activity is built against its own properties as
// the context, so an activity that reads them has a field set of its own in every node, and the answer
// of one node is only roughly the answer of the next. A node that has answered for itself therefore
// never reads the approximation, and the approximation answers only the nodes that have not - the row of
// a node the user has not opened.
//
// The form of the base settings writes the approximation alone, and names no node: the exact answer of
// the node it was built in is already kept per construction by the panel of that node
// (baseSettingsFormChecks), and that is read before this memory at all.
//
// The document type joins both keys for the reason it joins the key of settingsControlsMemory: a panel
// does mix document types, and the property map is read against the one the form renders in.
const fillableByType: Map<string, boolean> = new Map();
const fillableByNode: Map<string, boolean> = new Map();

function buildKey(activityType: ?string, documentType: ?Array<string>): ?string
{
	if (!activityType || !Array.isArray(documentType) || documentType.length === 0)
	{
		return null;
	}

	return [activityType, ...documentType].join('@');
}

function buildNodeKey(nodeId: ?string, activityType: ?string, documentType: ?Array<string>): ?string
{
	const typeKey = buildKey(activityType, documentType);

	return nodeId && typeKey ? `${nodeId}@${typeKey}` : null;
}

export const baseSettingsFieldsMemory = {
	/** The approximate answer of an activity type, for the nodes that have none of their own. */
	remember(activityType: ?string, documentType: ?Array<string>, hasFillableFields: boolean): void
	{
		const key = buildKey(activityType, documentType);
		if (key)
		{
			fillableByType.set(key, hasFillableFields);
		}
	},

	/**
	 * The answer of one node, which is exact, next to the approximation of its type: the node reads its
	 * own from now on, while the type keeps answering the nodes that have not answered for themselves.
	 */
	rememberForNode(
		nodeId: ?string,
		activityType: ?string,
		documentType: ?Array<string>,
		hasFillableFields: boolean,
	): void
	{
		const nodeKey = buildNodeKey(nodeId, activityType, documentType);
		if (nodeKey)
		{
			fillableByNode.set(nodeKey, hasFillableFields);
		}

		this.remember(activityType, documentType, hasFillableFields);
	},

	/**
	 * The answer of this node while it has one, the approximation of its type otherwise. Null while
	 * neither the node nor any form of the type has answered on this page.
	 */
	get(activityType: ?string, documentType: ?Array<string>, nodeId: ?string = null): boolean | null
	{
		const nodeKey = buildNodeKey(nodeId, activityType, documentType);
		if (nodeKey && fillableByNode.has(nodeKey))
		{
			return Boolean(fillableByNode.get(nodeKey));
		}

		const key = buildKey(activityType, documentType);

		return key && fillableByType.has(key) ? Boolean(fillableByType.get(key)) : null;
	},
};

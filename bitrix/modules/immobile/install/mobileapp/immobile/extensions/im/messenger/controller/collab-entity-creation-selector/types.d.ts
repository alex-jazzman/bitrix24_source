import {LayoutWidget} from "../../../../../../../../../mobile/dev/janative/api";

type CollabEntityCreationSelectorProps = {
	items: Array<CollabEntityCreationSelectorItem>,
	widget: LayoutWidget,
}

type CollabEntityCreationSelectorState = {};

type CollabEntityCreationSelectorItem = {
	iconType: 'group-chat' | 'task' | 'calendar',
	text: string,
	onClick: () => void,
}
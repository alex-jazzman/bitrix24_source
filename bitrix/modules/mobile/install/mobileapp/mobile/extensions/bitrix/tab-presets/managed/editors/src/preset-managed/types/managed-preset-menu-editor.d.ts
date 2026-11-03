type ManagedPresetMenuEditorProps = {
	testId: string;
	parentWidget: TabPresetLayoutWidget;
	activeItems: Array<ManagedPresetMenuItem>;
	inactiveItems: Array<ManagedPresetMenuItem>;
	configError: string;
	onChange: (items: {
		activeItems: Array<ManagedPresetMenuItem>;
		inactiveItems: Array<ManagedPresetMenuItem>;
	}) => void;
	onDone: () => void;
};

type ManagedPresetAddButtonItem = {
	key: 'add_button';
	type: 'add_button';
	disabled: boolean;
};

type ManagedPresetMenuEditorItem = ManagedPresetMenuItem | ManagedPresetAddButtonItem;

type ManagedPresetMenuEditorDropParams = {
	from: { index: number };
	to: { index: number };
};

type ManagedPresetMenuEditorCardParams = {
	testId: string;
	style: {
		flexShrink?: number;
		flexDirection?: 'row';
		alignItems?: 'center';
		justifyContent?: 'space-between';
	};
	withPressed?: boolean;
};

import {
	$getSelection,
	$getNodeByKey,
	$isNodeSelection,
	$createNodeSelection,
	$setSelection,
	type NodeKey,
	type NodeSelection,
} from 'ui.lexical.core';

import { mergeRegister } from 'ui.lexical.utils';

import { type TextEditor } from '../text-editor';

function isNodeSelected(editor: TextEditor, key: NodeKey): boolean
{
	return editor.getEditorState().read(() => {
		const node = $getNodeByKey(key);
		if (node === null)
		{
			return false;
		}

		return node.isSelected();
	});
}

export function createNodeSelection(editor: TextEditor, key: NodeKey): {
	isSelected: () => boolean,
	destroy: () => void,
	onSelect: (fn: Function) => void,
	setSelected: (selected: boolean) => void,
	clearSelection: () => void,
}
{
	let isSelected = false;
	const subscribers: Set<Function> = new Set();
	const onSelect = (fn: Function) => {
		subscribers.add(fn);
	};

	const unregisterListener = mergeRegister(
		editor.registerUpdateListener(() => {
			isSelected = isNodeSelected(editor, key);
			for (const subscribeFunc of subscribers)
			{
				subscribeFunc(isSelected);
			}
		}),
		editor.registerEditableListener((isEditable: boolean): void => {
			isSelected = isNodeSelected(editor, key);
			for (const subscribeFunc of subscribers)
			{
				subscribeFunc(isSelected && isEditable);
			}
		}),
	);

	const setSelected = (selected: boolean) => {
		editor.update(() => {
			// the next $isNodeSelection check replaces any non-node selection
			let selection: NodeSelection = $getSelection() as NodeSelection;
			if (!$isNodeSelection(selection))
			{
				selection = $createNodeSelection();
				$setSelection(selection);
			}

			if (selected)
			{
				selection.add(key);
			}
			else
			{
				selection.delete(key);
			}
		});
	};

	const clearSelection = () => {
		editor.update(() => {
			const selection = $getSelection();
			if ($isNodeSelection(selection))
			{
				selection.clear();
			}
		});
	};

	return {
		isSelected: () => {
			return isSelected;
		},
		destroy: () => {
			unregisterListener();
		},
		onSelect,
		setSelected,
		clearSelection,
	};
}

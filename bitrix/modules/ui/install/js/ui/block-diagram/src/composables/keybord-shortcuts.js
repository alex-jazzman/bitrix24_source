import { Browser, Event } from 'main.core';
import { onMounted, onUnmounted, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { INPUT_TAGS } from '../constants';
import type { ShortcutHandler, PreparedShortcut } from '../types';

type ShortcutConfig = {
	keys: string[],
	handler: ShortcutHandler,
};

const MODIFIER_KEYS = new Set([
	'control', 'meta', 'shift', 'alt', 'command', 'option', 'ctrl', 'mod',
]);

const KEY_CODE_PREFIX = 'Key';

export function useKeyboardShortcuts(shortcutsConfig: ShortcutConfig[]): void
{
	const { shortcuts, mousePosition, isKeyboardInitialized } = useBlockDiagram();
	const isMac = Browser.isMac();

	const prepareShortcut = ({ keys, handler }): PreparedShortcut => {
		const lowerKeys = keys.map((k) => k.toLowerCase());
		const keySet = new Set(lowerKeys);

		const hasMod = keySet.has('mod');
		const needCtrl = keySet.has('ctrl') || (hasMod && !isMac);
		const needMeta = keySet.has('meta') || (hasMod && isMac);
		const mainKey = lowerKeys.find((k) => !MODIFIER_KEYS.has(k));

		if (!mainKey)
		{
			console.error('Invalid shortcut config: no main key found', keys);
		}

		return {
			id: Math.random().toString(36).slice(2, 11),
			mainKey: mainKey || '',
			requiredModifiers: {
				ctrl: needCtrl,
				meta: needMeta,
				shift: keySet.has('shift'),
				alt: keySet.has('alt'),
			},
			handler,
		};
	};

	const localPrepared = shortcutsConfig.map((element) => prepareShortcut(element));

	const onMouseMove = (event: MouseEvent) => {
		mousePosition.x = event.clientX;
		mousePosition.y = event.clientY;
	};

	const onKeyDown = (event: KeyboardEvent) => {
		const target = event.target;
		const pressedKey = event.code.startsWith(KEY_CODE_PREFIX)
			? event.code.slice(KEY_CODE_PREFIX.length).toLowerCase()
			: event.key.toLowerCase();

		if (MODIFIER_KEYS.has(pressedKey))
		{
			return;
		}

		const isInputActive = (target.tagName in INPUT_TAGS) || target.isContentEditable;
		if (isInputActive)
		{
			return;
		}

		for (const { mainKey, requiredModifiers, handler } of toValue(shortcuts))
		{
			if (mainKey !== pressedKey)
			{
				continue;
			}

			const { ctrl, meta, shift, alt } = requiredModifiers;
			const isMatch = event.ctrlKey === ctrl
				&& event.metaKey === meta
				&& event.shiftKey === shift
				&& event.altKey === alt;

			if (isMatch)
			{
				event.preventDefault();
				handler(event, { x: mousePosition.x, y: mousePosition.y });

				return;
			}
		}
	};

	onMounted(() => {
		shortcuts.value.push(...localPrepared);

		if (!isKeyboardInitialized.value)
		{
			Event.bind(window, 'keydown', onKeyDown);
			Event.bind(window, 'mousemove', onMouseMove);
			isKeyboardInitialized.value = true;
		}
	});

	onUnmounted(() => {
		const idsToRemove = new Set(localPrepared.map((item) => item.id));
		shortcuts.value = shortcuts.value.filter((item) => !idsToRemove.has(item.id));
	});
}

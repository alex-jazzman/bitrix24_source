import { Browser, Event } from 'main.core';
import { onMounted, onUnmounted } from 'ui.vue3';
import { INPUT_TAGS } from '../constants';

type ShortcutHandler = (event: KeyboardEvent, mousePos: { x: number, y: number }) => void;

type ShortcutConfig = {
	keys: string[],
	handler: ShortcutHandler,
};

type PreparedShortcut = {
	mainKey: string;
	requiredModifiers: {
		ctrl: boolean;
		meta: boolean;
		shift: boolean;
		alt: boolean;
	};
	handler: ShortcutHandler;
};

const MODIFIER_KEYS = new Set([
	'control', 'meta', 'shift', 'alt', 'command', 'option', 'ctrl', 'mod',
]);

const KEY_CODE_PREFIX = 'Key';

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]): void
{
	let mouseX = 0;
	let mouseY = 0;

	const isMac = Browser.isMac();

	const preparedShortcuts: PreparedShortcut[] = shortcuts.map(({ keys, handler }) => {
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
			mainKey: mainKey || '',
			requiredModifiers: {
				ctrl: needCtrl,
				meta: needMeta,
				shift: keySet.has('shift'),
				alt: keySet.has('alt'),
			},
			handler,
		};
	});

	function onMouseMove(event: MouseEvent): void
	{
		mouseX = event.clientX;
		mouseY = event.clientY;
	}

	function onKeyDown(event: KeyboardEvent): void
	{
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

		for (const shortcut of preparedShortcuts)
		{
			if (shortcut.mainKey !== pressedKey)
			{
				continue;
			}

			const { ctrl, meta, shift, alt } = shortcut.requiredModifiers;

			const isMatch = event.ctrlKey === ctrl
				&& event.metaKey === meta
				&& event.shiftKey === shift
				&& event.altKey === alt;

			if (isMatch)
			{
				event.preventDefault();
				shortcut.handler(event, { x: mouseX, y: mouseY });

				return;
			}
		}
	}

	onMounted(() => {
		Event.bind(window, 'keydown', onKeyDown);
		Event.bind(window, 'mousemove', onMouseMove);
	});

	onUnmounted(() => {
		Event.unbind(window, 'keydown', onKeyDown);
		Event.unbind(window, 'mousemove', onMouseMove);
	});
}

/**
 * Shared plumbing for the tile-widget accessibility e2e specs.
 *
 * The specs run against the dev page `ui/dev/public/uploader/a11y-modes.php`, which renders the
 * widget in every mode of TileWidgetOptions at once. The page lives in the repository but not in
 * the distribution, so the run needs a portal with the dev contour and an administrator account
 * (BASE_URL / LOGIN / PASSWORD from `.env.test`).
 */
import { expect, type Locator, type Page } from '@playwright/test';

export const PAGE_URL = '/dev/ui/uploader/a11y-modes.php';

export const MODES = [
	'default',
	'compact',
	'readonly',
	'hide-drop-area',
	'settings-button',
	'insert-into-text',
	'auto-collapse',
	'no-item-menu',
	'no-dropzone',
	'disable-selection',
	'readonly-collapsed',
	'empty',
	'errors',
	'upload-progress',
] as const;

export type ModeId = typeof MODES[number];

// preloading the tiles reads files from the portal storage, which takes tens of seconds
const READY_TIMEOUT = 180_000;

export type ElementInfo = {
	tag: string,
	className: string,
	id: string,
	role: string | null,
	name: string,
	width: number,
	height: number,
	outlineWidth: string,
	insideWidget: string | null,
	insideTile: boolean,
	insideList: boolean,
};

export type Announcement = { text: string, politeness: string };

declare global {
	interface Window {
		a11yInfo?: (element: Element | null) => ElementInfo | null;
		a11yStops?: (widgetId: string) => ElementInfo[];
		a11yAnnouncements?: Announcement[];
	}
}

/**
 * The DOM probes live in the page itself: every spec asks the same questions about the active
 * element, and installing them once keeps the specs free of inline serialized functions.
 */
async function installProbes(page: Page): Promise<void>
{
	await page.addInitScript(() => {
		window.a11yInfo = (element: Element | null): any => {
			if (!element || element === document.body || element === document.documentElement)
			{
				return null;
			}

			const rect = element.getBoundingClientRect();
			const styles = getComputedStyle(element);
			const label = element.getAttribute('aria-label');
			let name = label === null ? '' : label.trim();

			if (name === '' && element.tagName === 'INPUT' && element.id !== '')
			{
				name = (document.querySelector(`label[for="${element.id}"]`)?.textContent ?? '').trim();
			}

			if (name === '')
			{
				name = (element.textContent ?? '').trim();
			}

			const widgetNode = element.closest('[id^="widget-"]');

			return {
				tag: element.tagName,
				className: typeof element.className === 'string' ? element.className : '',
				id: element.id,
				role: element.getAttribute('role'),
				name,
				width: rect.width,
				height: rect.height,
				outlineWidth: styles.outlineWidth,
				insideWidget: widgetNode === null ? null : widgetNode.id.replace('widget-', ''),
				insideTile: element.closest('.ui-tile-uploader-item') !== null,
				insideList: element.closest('.ui-tile-uploader-items') !== null,
			};
		};

		window.a11yStops = (widgetId: string): any => {
			const root = document.getElementById(`widget-${widgetId}`);
			if (root === null)
			{
				return [];
			}

			const selector = 'a[href], button, input, select, textarea, [tabindex]';

			return [...root.querySelectorAll(selector)]
				.filter((element: Element) => (
					!element.hasAttribute('disabled')
					&& (element as HTMLElement).tabIndex >= 0
				))
				.map((element: Element) => window.a11yInfo?.(element));
		};
	});
}

export async function openReadyPage(page: Page): Promise<void>
{
	await installProbes(page);
	await page.goto(PAGE_URL);
	await expect(
		page.locator('#dev-tw-ready'),
		'the dev page must finish preloading its tiles',
	).toHaveAttribute('data-ready', 'Y', { timeout: READY_TIMEOUT });
}

export function widget(page: Page, id: ModeId): Locator
{
	return page.locator(`#widget-${id}`);
}

export function tiles(page: Page, id: ModeId): Locator
{
	return widget(page, id).locator('.ui-tile-uploader-item').filter({ hasNot: page.locator('.ui-tile-uploader-item-more') });
}

/** The phrase as the portal itself renders it - the specs must not hardcode a translation. */
export function message(page: Page, key: string): Promise<string>
{
	return page.evaluate((code: string) => String(BX.message(code) ?? ''), key);
}

/**
 * Lets a test see what a screen reader would have heard: live region text is retired quickly,
 * and counting announcements is the only way to prove that progress does not flood it.
 */
export async function recordAnnouncements(page: Page): Promise<void>
{
	await page.evaluate(() => {
		const announcer = BX.UI.Accessibility.LiveAnnouncer;
		const original = announcer.announce.bind(announcer);

		window.a11yAnnouncements = [];
		announcer.announce = (text: string, politeness?: string): void => {
			window.a11yAnnouncements?.push({ text: String(text), politeness: politeness ?? 'polite' });
			original(text, politeness);
		};
	});
}

export function getAnnouncements(page: Page): Promise<Announcement[]>
{
	return page.evaluate(() => window.a11yAnnouncements ?? []);
}

export function activeElementInfo(page: Page): Promise<ElementInfo | null>
{
	return page.evaluate(() => window.a11yInfo?.(document.activeElement) ?? null);
}

/** Everything inside a widget that Tab actually stops on, in document order. */
export function tabStops(page: Page, id: ModeId): Promise<ElementInfo[]>
{
	return page.evaluate((widgetId: string) => window.a11yStops?.(widgetId) ?? [], id);
}

/** Puts the focus on the first action of a tile: the zone walks actions, not tiles. */
export async function focusTileAction(page: Page, id: ModeId, index: number = 0): Promise<void>
{
	await page.evaluate(([widgetId, tileIndex]: [string, number]) => {
		const root = document.getElementById(`widget-${widgetId}`) as HTMLElement;
		const tile = [...root.querySelectorAll('.ui-tile-uploader-item')][tileIndex] as HTMLElement;
		(tile?.querySelector('button') as HTMLElement)?.focus();
	}, [id, index] as [string, number]);
}

export async function focusFirstAction(page: Page, id: ModeId): Promise<void>
{
	await focusTileAction(page, id, 0);
}

export async function focusFileInput(page: Page, id: ModeId): Promise<void>
{
	await page.evaluate((widgetId: string) => {
		const root = document.getElementById(`widget-${widgetId}`) as HTMLElement;
		(root.querySelector('.ui-tile-uploader-drop-input') as HTMLElement).focus();
	}, id);
}

async function isActive(target: Locator): Promise<boolean>
{
	return target.evaluate((element: Element) => element === document.activeElement);
}

/**
 * Waits until an opened menu has finished fading in.
 *
 * Keys pressed before that are lost: the navigation of `main.popup` collects its items through
 * `InteractivityChecker.isVisible` (`menu-navigation.js getItems`), and a popup still at `opacity: 0`
 * has none of them - the arrows then stay where they are. A person never presses that fast, but the
 * tests do, so they have to wait for the animation the same way an eye does.
 */
export async function waitForMenuReady(page: Page): Promise<void>
{
	await page.waitForFunction(() => {
		const popup = document.querySelector('.popup-window[role="menu"]');

		return popup !== null && getComputedStyle(popup).opacity === '1';
	});
}

/**
 * Steps onto a control of a widget with the keyboard.
 *
 * How the focus arrives matters. `main.popup` moves the focus into an opened menu only when the
 * last input was a navigation key - Tab, Escape, the arrows, Home/End (`InputModalityTracker` in
 * `ui.a11y`). Enter and Space are not navigation keys, so `element.focus()` plus Enter looks to
 * the menu like an opening by mouse, where keeping the focus outside is the wanted behaviour.
 * Only arrival by a navigation key reproduces what a keyboard user goes through.
 *
 * Inside the list the walk is flat: Shift+Tab from the file input lands on an action, and the
 * arrows walk every action of every file in one chain.
 */
export async function arriveWithTab(page: Page, id: ModeId, target: Locator): Promise<void>
{
	await focusFileInput(page, id);

	if (await isActive(target))
	{
		return;
	}

	// the settings button sits after the file input, everything else is inside the list
	for (const key of ['Tab', 'Shift+Tab'])
	{
		await focusFileInput(page, id);
		await page.keyboard.press(key);

		if (await isActive(target))
		{
			return;
		}
	}

	await focusFileInput(page, id);
	await page.keyboard.press('Shift+Tab');

	// the widget can hold an action per tile times a few, so the walk needs room
	for (let step = 0; step < 60; step++)
	{
		if (await isActive(target))
		{
			return;
		}

		await page.keyboard.press('ArrowRight');
	}

	throw new Error('the control was not reachable with the keyboard from the file input');
}

/**
 * Enters the list the way a keyboard user does: a step back from the file input, so that the input
 * modality is a navigation key and `:focus-visible` lights up.
 */
export async function arriveAtList(page: Page, id: ModeId): Promise<void>
{
	await focusFileInput(page, id);
	await page.keyboard.press('Shift+Tab');
}

/**
 * Presses a key the way a person does - through the keyboard, not `element.focus()` - so
 * `:focus-visible` and the input modality behave as they do in real use.
 */
export async function pressAndRead(page: Page, key: string): Promise<ElementInfo | null>
{
	await page.keyboard.press(key);

	return activeElementInfo(page);
}

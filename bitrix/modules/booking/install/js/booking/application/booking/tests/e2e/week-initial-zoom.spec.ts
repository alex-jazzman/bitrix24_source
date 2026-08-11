import { type Page } from '@playwright/test';
import { test, expect } from 'ui.test.e2e.auth';

const baseComponentSelector = '[data-id="booking-booking-base-component"]';
const weekButtonSelector = '[data-id="booking-booking-switch-view-week-button"]';
const weekModeSelector = '.--week-mode';

type InitialZoomDomContract = {
	baseComponentWidth: number;
	leftPanelWidth: number;
	weekCellWidth: number;
	sidebarZoneWidth: number;
};

async function openWeekBookingGrid(page: Page): Promise<void>
{
	await page.goto('/booking/');

	const baseComponent = page.locator(baseComponentSelector);
	await expect(baseComponent).toBeAttached();

	const isWeekMode = await baseComponent.evaluate(
		(element, selector) => element.matches(selector),
		weekModeSelector,
	);

	if (!isWeekMode)
	{
		const weekButton = page.locator(weekButtonSelector);
		await expect(weekButton).toBeVisible();
		await weekButton.click();
	}

	await expect(baseComponent).toHaveClass(new RegExp(weekModeSelector.slice(1)));
	await expect(baseComponent).toBeVisible();
}

async function getInitialZoomDomContract(page: Page): Promise<InitialZoomDomContract>
{
	return page.evaluate((baseSelector: string): InitialZoomDomContract => {
		const baseElement = document.querySelector<HTMLElement>(baseSelector);

		const readCssProperty = (element: Element | null, propertyName: string): string => {
			return element ? getComputedStyle(element).getPropertyValue(propertyName).trim() : '';
		};

		const readCssNumber = (element: Element | null, propertyName: string): number => {
			return Number.parseFloat(readCssProperty(element, propertyName));
		};

		return {
			baseComponentWidth: baseElement?.offsetWidth ?? 0,
			leftPanelWidth: readCssNumber(baseElement, '--booking-week-left-panel-width'),
			weekCellWidth: readCssNumber(baseElement, '--booking-week-cell-width'),
			sidebarZoneWidth: readCssNumber(baseElement, '--booking-sidebar-zone-width'),
		};
	}, baseComponentSelector);
}

test('week grid page has required base component initial zoom DOM contract', async ({ page }: { page: Page }) => {
	await openWeekBookingGrid(page);

	const contract = await getInitialZoomDomContract(page);

	expect(contract.baseComponentWidth).toBeGreaterThan(0);
	expect(contract.leftPanelWidth).toBeGreaterThan(0);
	expect(contract.weekCellWidth).toBeGreaterThan(0);
	expect(contract.sidebarZoneWidth).toBeGreaterThan(0);
});

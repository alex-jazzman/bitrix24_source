import { expect } from 'ui.test.e2e.auth';
import type { Frame, Locator, Page } from '@playwright/test';
import { execSync } from 'node:child_process';

export const GRID_ID = 'MAIL_EMPLOYEE_MAILBOX_LIST';
export const GRID_CONTAINER = `#bx-mml-${GRID_ID}-container`;
export const BULK_PANEL = '[data-testid="mail-mailbox-grid-bulk-panel"]';
export const GRID_URL = process.env.MAIL_TEST_GRID_URL ?? '/mail/mailbox-list';

export const seedExec = process.env.MAIL_TEST_SEED_EXEC ?? '';
export const login = process.env.LOGIN ?? '';

export type SeedResult = { id: number; email: string; userId?: number };
export type CheckResult = {
	found: boolean;
	id?: number;
	email?: string;
	active?: boolean;
	crmEnabled?: boolean;
	crmPublic?: boolean;
	calendarEnabled?: boolean;
	modules?: { crm: boolean; calendar: boolean };
};

export function makeRunId(suffix: string = ''): string
{
	const base = `e2e${Date.now().toString(36)}w${process.env.TEST_WORKER_INDEX ?? '0'}`;

	return suffix === '' ? base : `${base}${suffix}`;
}

export function runSeed(args: string): Record<string, any>
{
	const output = execSync(`${seedExec} ${args}`, { encoding: 'utf8' });

	return JSON.parse((output.trim().split('\n').pop() ?? '{}'));
}

export function seedMailbox(runId: string): SeedResult
{
	return runSeed(`seed --login=${login} --run-id=${runId}`) as SeedResult;
}

export function cleanupMailbox(runId: string): void
{
	try
	{
		runSeed(`cleanup --run-id=${runId}`);
	}
	catch
	{
	}
}

export function checkMailbox(runId: string): CheckResult
{
	return runSeed(`check --run-id=${runId}`) as CheckResult;
}

export async function findInAnyFrame(
	page: Page,
	build: (frame: Frame) => Locator,
	timeoutMs = 20_000,
): Promise<{ frame: Frame; locator: Locator }>
{
	const deadline = Date.now() + timeoutMs;
	let lastFrames = '';
	while (Date.now() < deadline)
	{
		for (const frame of page.frames())
		{
			const locator = build(frame).first();
			if (await locator.count() > 0)
			{
				return { frame, locator };
			}
		}
		lastFrames = page.frames().map((pageFrame) => pageFrame.url()).join('\n  ');
		await page.waitForTimeout(500);
	}
	throw new Error(`element not found in any frame within ${timeoutMs}ms. Frames:\n  ${lastFrames}`);
}

export async function openGrid(page: Page): Promise<{ frame: Frame }>
{
	await page.goto(GRID_URL);

	const frame = (await findInAnyFrame(page, (pageFrame) => pageFrame.locator(GRID_CONTAINER))).frame;
	await expect(frame.locator(GRID_CONTAINER)).toBeVisible({ timeout: 10_000 });

	return { frame };
}

export async function selectSeededRow(frame: Frame, mailboxId: number): Promise<void>
{
	const checkbox = frame.locator(`#checkbox_${GRID_ID}_${mailboxId}`);
	await expect(checkbox).toBeVisible({ timeout: 10_000 });
	await checkbox.locator('xpath=ancestor::td[1]').click();

	await expect(frame.locator(`${GRID_CONTAINER} .main-grid-counter-selected`).first())
		.toHaveText('1', { timeout: 10_000 });
}

export async function hasBulkAction(frame: Frame, actionId: string): Promise<boolean>
{
	try
	{
		await frame.locator(`${BULK_PANEL} [data-testid="mail-mailbox-grid-bulk-action-${actionId}"]`)
			.first()
			.waitFor({ state: 'attached', timeout: 3000 });

		return true;
	}
	catch
	{
		return false;
	}
}

export async function chooseAction(frame: Frame, actionId: string): Promise<void>
{
	const enabledItem = frame
		.locator(`${BULK_PANEL} [data-testid="mail-mailbox-grid-bulk-action-${actionId}"]:not(.ui-action-panel-item-is-disabled)`)
		.first();
	await enabledItem.waitFor({ state: 'visible', timeout: 10_000 });
	await enabledItem.click();
}

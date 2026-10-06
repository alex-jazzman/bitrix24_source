import { test as base, type Browser, type BrowserContext, type Page } from '@playwright/test';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const MAX_AGE_MS = 10 * 60 * 1000;
const WAIT_TIMEOUT_MS = 60 * 1000;
const POLL_INTERVAL_MS = 200;
const STALE_LOCK_MS = 90 * 1000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => { setTimeout(resolve, ms); });

function storageStatePathFor(baseURL: string, login: string): string
{
	const key = crypto.createHash('md5').update(`${baseURL}|${login}`).digest('hex').slice(0, 8);

	return path.join(os.tmpdir(), `bitrix-e2e-auth-state-${key}.json`);
}

function hasAuthCookies(state: { cookies?: Array<{ name: string }> }): boolean
{
	const cookies = Array.isArray(state?.cookies) ? state.cookies : [];

	return cookies.some((cookie) => cookie.name === 'PHPSESSID')
		&& cookies.some((cookie) => cookie.name === 'BITRIX_SM_LOGIN');
}

function freshStateExists(statePath: string): boolean
{
	try
	{
		const { mtimeMs } = fs.statSync(statePath);
		if ((Date.now() - mtimeMs) >= MAX_AGE_MS)
		{
			return false;
		}

		return hasAuthCookies(JSON.parse(fs.readFileSync(statePath, 'utf8')));
	}
	catch
	{
		return false;
	}
}

function tryAcquireLock(lockPath: string): boolean
{
	try
	{
		fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });

		return true;
	}
	catch
	{
		try
		{
			const { mtimeMs } = fs.statSync(lockPath);
			if ((Date.now() - mtimeMs) >= STALE_LOCK_MS)
			{
				fs.unlinkSync(lockPath);
				fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });

				return true;
			}
		}
		catch
		{
			// ignore
		}

		return false;
	}
}

/**
 * Resolves which Bitrix account to log in as, from the test's `user` option.
 *
 * The identifier used in tests (`test.use({ user: 'manager' })`) is human-readable
 * and case-insensitive; the matching env variables follow the dotenv convention and
 * are always upper-cased: `LOGIN_MANAGER` / `PASSWORD_MANAGER`. With no `user` set we
 * fall back to the default `LOGIN` / `PASSWORD` (typically the admin) — this keeps
 * every existing spec working unchanged.
 */
function resolveCredentials(user: string | undefined): { login: string, password: string }
{
	if (!user)
	{
		const { LOGIN = '', PASSWORD = '' } = process.env;
		if (!LOGIN || !PASSWORD)
		{
			throw new Error(
				'Missing login credentials. '
				+ 'Create a .env.test file in the project root and define BASE_URL, LOGIN, '
				+ 'and PASSWORD for authentication.',
			);
		}

		return { login: LOGIN, password: PASSWORD };
	}

	if (!/^[a-z0-9_]+$/i.test(user))
	{
		throw new Error(
			`Invalid test user id "${user}": it must match [a-z0-9_] so it maps to a valid `
			+ 'environment variable name. Rename it (e.g. use underscores instead of dashes).',
		);
	}

	const suffix = user.toUpperCase();
	const login = process.env[`LOGIN_${suffix}`] ?? '';
	const password = process.env[`PASSWORD_${suffix}`] ?? '';
	if (!login || !password)
	{
		throw new Error(
			`Missing credentials for test user "${user}". `
			+ `Add LOGIN_${suffix} and PASSWORD_${suffix} to your .env.test file.`,
		);
	}

	return { login, password };
}

async function loginAndSaveState(
	browser: Browser,
	baseURL: string,
	login: string,
	password: string,
	statePath: string,
): Promise<void>
{
	// storageState: undefined forces a clean context. Without it, browser.newContext()
	// inherits the worker's storageState option (the already-logged-in default user),
	// so the login page would redirect away and the auth form would never appear.
	const context = await browser.newContext({ baseURL, storageState: undefined });
	const page = await context.newPage();

	await page.goto('/auth/');
	await page.waitForSelector('form[name="form_auth"]');
	await page.fill('input[name="USER_LOGIN"]', login);
	await page.fill('input[name="USER_PASSWORD"]', password);

	await Promise.all([
		page.waitForResponse((response) => response.url().includes('login=yes')),
		page.click('button[type="submit"]'),
	]);
	await page.waitForLoadState('load');

	await page.goto('/auth/');
	const stillHasForm = await page.locator('form[name="form_auth"]').count();
	if (stillHasForm > 0)
	{
		await context.close();
		throw new Error('Bitrix login failed: the auth form is still present after submitting credentials.');
	}

	const state = await context.storageState();
	if (!hasAuthCookies(state))
	{
		await context.close();
		throw new Error('Bitrix login did not produce the expected auth cookies (PHPSESSID, BITRIX_SM_LOGIN).');
	}

	const tempPath = `${statePath}.${process.pid}.tmp`;
	fs.writeFileSync(tempPath, JSON.stringify(state));
	fs.renameSync(tempPath, statePath);

	await context.close();
}

async function ensureStorageState(
	browser: Browser,
	baseURL: string,
	login: string,
	password: string,
): Promise<string>
{
	const statePath = storageStatePathFor(baseURL, login);
	const lockPath = `${statePath}.lock`;

	if (freshStateExists(statePath))
	{
		return statePath;
	}

	if (tryAcquireLock(lockPath))
	{
		try
		{
			if (!freshStateExists(statePath))
			{
				await loginAndSaveState(browser, baseURL, login, password, statePath);
			}
		}
		finally
		{
			try { fs.unlinkSync(lockPath); }
			catch { /* already gone */ }
		}

		return statePath;
	}

	const deadline = Date.now() + WAIT_TIMEOUT_MS;
	while (Date.now() < deadline)
	{
		if (freshStateExists(statePath))
		{
			return statePath;
		}
		// eslint-disable-next-line no-await-in-loop
		await sleep(POLL_INTERVAL_MS);
	}

	await loginAndSaveState(browser, baseURL, login, password, statePath);

	return statePath;
}

type AuthFixtures = {
	user: string | undefined,
	authStatePath: string,
	loginAs: (user: string) => Promise<Page>,
};

export const test = base.extend<AuthFixtures>({
	// Which account the test (or describe block, or file) authenticates as. Set it with
	// `test.use({ user: 'manager' })`; left undefined it means the default LOGIN/PASSWORD.
	//
	// It's a TEST-scoped option (not worker-scoped) on purpose: Playwright only allows
	// switching test-scoped options via `test.use` inside a describe block. The login
	// itself is cached to a storageState file, so resolving it per test is cheap.
	user: [undefined, { option: true }],

	authStatePath: async ({ browser, user }, use) => {
		const { BASE_URL = '' } = process.env;
		if (!BASE_URL)
		{
			throw new Error(
				'Missing BASE_URL. Create a .env.test file in the project root and define '
				+ 'BASE_URL, LOGIN, and PASSWORD for authentication.',
			);
		}

		const { login, password } = resolveCredentials(user);
		const statePath = await ensureStorageState(browser, BASE_URL, login, password);
		await use(statePath);
	},

	storageState: async ({ authStatePath }, use) => {
		await use(authStatePath);
	},

	// Opens a page authenticated as another user, in its own browser context, for
	// cross-user scenarios in a single test (e.g. an admin shares a preset, then a
	// non-admin opens the same page to check they can see it). The default `page`
	// stays the test's user; each context opened here is closed after the test.
	loginAs: async ({ browser }, use) => {
		const { BASE_URL = '' } = process.env;
		if (!BASE_URL)
		{
			throw new Error(
				'Missing BASE_URL. Create a .env.test file in the project root and define '
				+ 'BASE_URL, LOGIN, and PASSWORD for authentication.',
			);
		}

		const contexts: BrowserContext[] = [];

		const loginAs = async (user: string): Promise<Page> => {
			const { login, password } = resolveCredentials(user);
			const statePath = await ensureStorageState(browser, BASE_URL, login, password);
			const context = await browser.newContext({ baseURL: BASE_URL, storageState: statePath });
			contexts.push(context);

			return context.newPage();
		};

		await use(loginAs);

		await Promise.all(contexts.map((context) => context.close()));
	},
});

export { expect } from '@playwright/test';

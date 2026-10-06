// UI-критерии фичи персонального скрытия.
// Только sandbox-фикстура (без auth) → выполняется без учётных данных портала.
import { test, expect } from 'ui.test.e2e.sandbox';

const SHARED_ACTIVE = { id: 1, title: 'Active Shared', isMine: false, ownerName: 'Bob', kind: '', isHidden: false, isPinned: false, isPublished: true };
const SHARED_HIDDEN = { id: 2, title: 'Hidden Shared', isMine: false, ownerName: 'Bob', kind: '', isHidden: true, isPinned: false, isPublished: true };
const OWN_ACTIVE = { id: 3, title: 'My App', isMine: true, ownerName: '', kind: '', isHidden: false, isPinned: false, isPublished: true };

const MY_TAB = { id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false };

async function mountCatalog(sandbox, items, tabs = [MY_TAB]) {
	await sandbox.loadExtension('vibecodeconnector.catalog');

	// sandbox.mount() пробрасывает в callback только selector, поэтому фикстуру
	// кладём в window до монтирования (page.evaluate поддерживает аргументы).
	await sandbox.page.evaluate((cfg) => {
		window.__catalog = cfg;
	}, { items, tabs });

	await sandbox.mount((selector) => {
		BX.ajax.runAction = (action, config) => {
			if (action === 'vibecodeconnector.Catalog.myList') {
				// Имитируем серверный поиск по названию (подстрока), как реальный myList с q.
				const query = String((config && config.data && config.data.q) || '').toLowerCase();
				const items = query === ''
					? window.__catalog.items
					: window.__catalog.items.filter((it) => String(it.title || '').toLowerCase().includes(query));

				return Promise.resolve({ data: { items } });
			}

			return Promise.resolve({ data: {} });
		};

		const { Catalog } = BX.Vibecodeconnector;
		const catalog = new Catalog({ tabs: window.__catalog.tabs });
		const bindBtn = document.createElement('button');
		document.querySelector(selector).appendChild(bindBtn);
		catalog.show(bindBtn);
	});

	await sandbox.page.getByTestId('vibecode-catalog-tab-my').waitFor({ state: 'visible' });
}

async function selectState(sandbox, itemLabel) {
	await sandbox.page.getByTestId('vibecode-catalog-tab-my').click();
	// ui.system.menu не удаляет прежний popup из DOM — берём пункт из самого свежего меню.
	await sandbox.page.getByText(itemLabel, { exact: true }).last().click();
}

const item = (sandbox) => sandbox.page.getByTestId('vibecode-catalog-item');
const badge = (sandbox) => sandbox.page.getByTestId('vibecode-catalog-item-hidden-badge');

test.describe('vibecodeconnector.catalog — скрытие: фильтры состояния', () => {
	// срез по состоянию
	test('Активные показывают только нескрытые, Скрытые — только скрытые, Все — оба', async ({ sandbox }) => {
		await mountCatalog(sandbox, [SHARED_ACTIVE, SHARED_HIDDEN]);

		// Дефолт — «Активные»: только нескрытый элемент.
		await item(sandbox).first().waitFor({ state: 'visible' });
		await expect(item(sandbox)).toHaveCount(1);
		await expect(sandbox.page.getByTestId('vibecode-catalog-item-title')).toHaveText('Active Shared');

		await selectState(sandbox, 'Скрытые');
		await expect(item(sandbox)).toHaveCount(1);
		await expect(sandbox.page.getByTestId('vibecode-catalog-item-title')).toHaveText('Hidden Shared');

		await selectState(sandbox, 'Все');
		await expect(item(sandbox)).toHaveCount(2);
	});

	// бейдж «Скрыто» только в «Все», с текстовой меткой (не только цвет)
	test('бейдж «Скрыто» виден только в срезе «Все» и имеет текст', async ({ sandbox }) => {
		await mountCatalog(sandbox, [SHARED_ACTIVE, SHARED_HIDDEN]);

		// Активные — бейджа нет.
		await item(sandbox).first().waitFor({ state: 'visible' });
		await expect(badge(sandbox)).toHaveCount(0);

		// Все — бейдж на скрытом, с текстом «Скрыто».
		await selectState(sandbox, 'Все');
		await expect(badge(sandbox)).toHaveCount(1);
		await expect(badge(sandbox)).toBeVisible();
		await expect(badge(sandbox)).toHaveText('Скрыто');

		// Обратно в Активные — бейдж исчезает.
		await selectState(sandbox, 'Активные');
		await expect(badge(sandbox)).toHaveCount(0);
	});

	// поиск действует в пределах выбранного состояния
	test('поиск работает в пределах выбранного состояния (не показывает активное в «Скрытые»)', async ({ sandbox }) => {
		await mountCatalog(sandbox, [
			{ id: 1, title: 'Alpha Active', isMine: false, ownerName: 'Bob', kind: '', isHidden: false, isPinned: false, isPublished: true },
			{ id: 2, title: 'Alpha Hidden', isMine: false, ownerName: 'Bob', kind: '', isHidden: true, isPinned: false, isPublished: true },
			{ id: 3, title: 'Beta Active', isMine: false, ownerName: 'Bob', kind: '', isHidden: false, isPinned: false, isPublished: true },
		]);

		// Активные: два активных.
		await item(sandbox).first().waitFor({ state: 'visible' });
		await expect(item(sandbox)).toHaveCount(2);

		// Переходим в «Скрытые»: только скрытый Alpha.
		await selectState(sandbox, 'Скрытые');
		await expect(item(sandbox)).toHaveCount(1);
		await expect(sandbox.page.getByTestId('vibecode-catalog-item-title')).toHaveText('Alpha Hidden');

		// Поиск «Alpha»: сервер вернёт оба Alpha, но в состоянии «Скрытые» активный Alpha не показывается.
		await sandbox.page.getByPlaceholder('Поиск приложений').fill('Alpha');
		await expect(item(sandbox)).toHaveCount(1);
		await expect(sandbox.page.getByTestId('vibecode-catalog-item-title')).toHaveText('Alpha Hidden');
	});

	// пустое состояние «Скрытые»
	test('пустой срез «Скрытые» показывает «Нет скрытых приложений»', async ({ sandbox }) => {
		await mountCatalog(sandbox, [SHARED_ACTIVE]);
		await item(sandbox).first().waitFor({ state: 'visible' });

		await selectState(sandbox, 'Скрытые');

		const empty = sandbox.page.getByTestId('vibecode-catalog-hidden-empty');
		await expect(empty).toBeVisible();
		await expect(empty).toContainText('Нет скрытых приложений');
		await expect(item(sandbox)).toHaveCount(0);
	});

	// переключатель состояния фокусируется с клавиатуры
	test('чип состояния фокусируется с клавиатуры (role=tab)', async ({ sandbox }) => {
		await mountCatalog(sandbox, [SHARED_ACTIVE]);

		const chip = sandbox.page.getByTestId('vibecode-catalog-tab-my');
		await expect(chip).toHaveAttribute('role', 'tab');
		await chip.focus();
		await expect(chip).toBeFocused();
	});

	// серверная фильтрация состояния при пагинации: скрытые приезжают отдельным срезом,
	// даже если их нет на активной странице
	test('серверная фильтрация: «Скрытые» подгружаются с сервера, минуя активную страницу', async ({ sandbox }) => {
		const mk = (id, hidden) => ({ id, title: (hidden ? 'Hidden ' : 'Active ') + id, isMine: false, ownerName: 'Bob', kind: '', isHidden: hidden, isPinned: false, isPublished: true });
		const dataset = [mk(1, false), mk(2, false), mk(3, false), mk(4, true), mk(5, true)];

		await sandbox.loadExtension('vibecodeconnector.catalog');
		await sandbox.page.evaluate((cfg) => {
			window.__catalog = cfg;
		}, { items: dataset, tabs: [{ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList' }] });

		await sandbox.mount((selector) => {
			BX.ajax.runAction = (action, config) => {
				if (action !== 'vibecodeconnector.Catalog.myList') {
					return Promise.resolve({ data: {} });
				}
				const state = (config && config.data && config.data.state) || 'active';
				const size = (config && config.navigation && config.navigation.size) || 20;
				const page = (config && config.navigation && config.navigation.page) || 1;
				const pool = window.__catalog.items.filter((it) => (state === 'all' ? true : (state === 'hidden' ? it.isHidden : !it.isHidden)));
				const offset = (page - 1) * size;
				const items = pool.slice(offset, offset + size);

				return Promise.resolve({ data: { items, pagination: { offset, limit: size, hasNext: offset + size < pool.length } } });
			};

			const { Catalog } = BX.Vibecodeconnector;
			const catalog = new Catalog({ tabs: window.__catalog.tabs, pageSize: 2 });
			const bindBtn = document.createElement('button');
			document.querySelector(selector).appendChild(bindBtn);
			catalog.show(bindBtn);
		});
		await sandbox.page.getByTestId('vibecode-catalog-tab-my').waitFor({ state: 'visible' });

		// Активные: первая страница = 2 активных, скрытых на ней нет.
		await item(sandbox).first().waitFor({ state: 'visible' });
		await expect(item(sandbox)).toHaveCount(2);
		await expect(badge(sandbox)).toHaveCount(0);

		// «Скрытые»: сервер отдаёт срез скрытых, хотя на активной странице их не было.
		await selectState(sandbox, 'Скрытые');
		await expect(item(sandbox)).toHaveCount(2);
		await expect(sandbox.page.getByTestId('vibecode-catalog-item-title').first()).toHaveText('Hidden 4');
	});

	// переключатель состояния не влияет на вкладку «Маркетплейс»
	test('переключение состояния не влияет на вкладку «Маркетплейс»', async ({ sandbox }) => {
		await mountCatalog(sandbox, [SHARED_ACTIVE, SHARED_HIDDEN], [
			MY_TAB,
			{ id: 'market', title: 'Маркет', action: null, navigateUrl: '/marketplace/' },
		]);

		const market = sandbox.page.getByTestId('vibecode-catalog-tab-market');
		await expect(market).toBeVisible();
		await expect(market).toHaveText('Маркет');

		// Переключаем состояние на «Вайбкод»; «Маркет» не должен измениться.
		await selectState(sandbox, 'Все');
		await expect(sandbox.page.getByTestId('vibecode-catalog-item')).toHaveCount(2);
		await expect(market).toBeVisible();
		await expect(market).toHaveText('Маркет');
	});
});

test.describe('vibecodeconnector.catalog — скрытие: пункты меню ⋯', () => {
	// «Скрыть» на расшаренном активном
	test('меню расшаренного активного приложения содержит «Скрыть»', async ({ sandbox }) => {
		await mountCatalog(sandbox, [SHARED_ACTIVE]);
		await item(sandbox).first().waitFor({ state: 'visible' });

		await sandbox.page.getByTestId('vibecode-catalog-item-action-btn').first().click();
		await expect(sandbox.page.getByText('Скрыть', { exact: true })).toBeVisible();
	});

	// у своего приложения пункта «Скрыть» нет
	test('меню своего приложения не содержит «Скрыть»', async ({ sandbox }) => {
		await mountCatalog(sandbox, [OWN_ACTIVE]);
		await item(sandbox).first().waitFor({ state: 'visible' });

		const actionBtn = sandbox.page.getByTestId('vibecode-catalog-item-action-btn').first();
		if (await actionBtn.count() > 0 && await actionBtn.isVisible()) {
			await actionBtn.click();
			await expect(sandbox.page.getByText('Скрыть', { exact: true })).toHaveCount(0);
		}
	});

	// у скрытого приложения (в срезе «Все») пункт «Восстановить»
	test('меню скрытого приложения содержит «Восстановить»', async ({ sandbox }) => {
		await mountCatalog(sandbox, [SHARED_HIDDEN]);
		await sandbox.page.getByTestId('vibecode-catalog-tab-my').waitFor({ state: 'visible' });

		await selectState(sandbox, 'Все');
		await item(sandbox).first().waitFor({ state: 'visible' });

		await sandbox.page.getByTestId('vibecode-catalog-item-action-btn').first().click();
		await expect(sandbox.page.getByText('Восстановить', { exact: true })).toBeVisible();
	});
});

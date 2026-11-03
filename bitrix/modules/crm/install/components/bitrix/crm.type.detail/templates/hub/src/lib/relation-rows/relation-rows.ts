import { type RelationEntry, type RelationsState } from '../../model/type-hub-store';
import {
	type HubBaseline,
	type RelationCatalogEntry,
	readRelationCatalog,
	readRelationEntries,
} from '../hub-baseline/hub-baseline';

export type RelationDirectionName = 'parent' | 'child';
export type RelationOptionKind = 'field' | 'children-list';

export type RelationOption = {
	id: string;
	direction: RelationDirectionName;
	kind: RelationOptionKind;
	entityTypeId: number;
	checked: boolean;
};

export type RelationRow = {
	entityTypeId: number;
	title: string;
	options: RelationOption[];
	checked: boolean;
};

function findEntry(entries: RelationEntry[], entityTypeId: number): RelationEntry | null
{
	return entries.find((entry) => Number(entry.entityTypeId) === entityTypeId) ?? null;
}

// Copies both the arrays and their entries: RelationEntry holds only primitives, so a shallow spread
// per entry is already deep enough — nothing left for a caller to mutate through to the baseline.
function readState(baseline: HubBaseline): RelationsState
{
	return {
		parent: readRelationEntries(baseline, 'parent').map((entry) => ({ ...entry })),
		child: readRelationEntries(baseline, 'child').map((entry) => ({ ...entry })),
	};
}

function buildOptions(
	baseline: HubBaseline,
	entityTypeId: number,
	inParentCatalog: boolean,
	inChildCatalog: boolean,
): RelationOption[]
{
	const state = readState(baseline);
	const options: RelationOption[] = [];

	if (inParentCatalog)
	{
		const entry = findEntry(state.parent, entityTypeId);
		options.push(
			{
				id: `parent-field-${entityTypeId}`,
				direction: 'parent',
				kind: 'field',
				entityTypeId,
				checked: Boolean(entry),
			},
			{
				id: `parent-children-list-${entityTypeId}`,
				direction: 'parent',
				kind: 'children-list',
				entityTypeId,
				checked: Boolean(entry && entry.isChildrenListEnabled),
			},
		);
	}

	if (inChildCatalog)
	{
		const entry = findEntry(state.child, entityTypeId);
		options.push(
			{
				id: `child-field-${entityTypeId}`,
				direction: 'child',
				kind: 'field',
				entityTypeId,
				checked: Boolean(entry),
			},
			{
				id: `child-children-list-${entityTypeId}`,
				direction: 'child',
				kind: 'children-list',
				entityTypeId,
				checked: Boolean(entry && entry.isChildrenListEnabled),
			},
		);
	}

	return options;
}

// Pivots the relations catalog from "direction -> list of types" into "type -> set of flags":
// the catalog is stored per direction, but the user thinks per entity ("link this to deals").
// The save payload keeps the original per-direction shape — only the presentation is pivoted.
export function buildRelationRows(baseline: HubBaseline): RelationRow[]
{
	const parentCatalog = readRelationCatalog(baseline, 'parent');
	const childCatalog = readRelationCatalog(baseline, 'child');

	const parentIds = new Set(parentCatalog.map((item: RelationCatalogEntry) => Number(item.entityTypeId)));
	const childIds = new Set(childCatalog.map((item: RelationCatalogEntry) => Number(item.entityTypeId)));

	const titles = new Map<number, string>();
	const order: number[] = [];
	[...parentCatalog, ...childCatalog].forEach((item: RelationCatalogEntry) => {
		const entityTypeId = Number(item.entityTypeId);
		if (!titles.has(entityTypeId))
		{
			titles.set(entityTypeId, item.title);
			order.push(entityTypeId);
		}
	});

	return order.map((entityTypeId) => {
		const options = buildOptions(baseline, entityTypeId, parentIds.has(entityTypeId), childIds.has(entityTypeId));

		return {
			entityTypeId,
			title: titles.get(entityTypeId) ?? '',
			options,
			checked: options.some((option) => option.checked),
		};
	});
}

// Splits the pivoted rows into the first card's own rows (CRM core types) and the "other smart
// processes" picker's rows (everything else the catalog carries). A partition, not two independent
// filters: relations-section.ts used to run `.filter(isCore)` and `.filter(!isCore)` as two separate
// computeds over two separate buildRelationRows calls, which could in principle drift into overlap or
// a gap if the two conditions were ever edited independently instead of as one pair.
export function splitRelationRowsByKind(
	rows: RelationRow[],
	coreEntityTypeIds: number[],
): { crmRows: RelationRow[], smartProcessRows: RelationRow[] }
{
	const core = new Set(coreEntityTypeIds);

	return {
		crmRows: rows.filter((row) => core.has(row.entityTypeId)),
		smartProcessRows: rows.filter((row) => !core.has(row.entityTypeId)),
	};
}

export function applyRelationOption(
	baseline: HubBaseline,
	option: RelationOption,
	checked: boolean,
): RelationsState
{
	const state = readState(baseline);
	const entries = state[option.direction];
	const entry = findEntry(entries, option.entityTypeId);

	if (option.kind === 'children-list')
	{
		if (entry)
		{
			// entityTypeId is normalized to the option's number even though the matched entry may have
			// been saved as a numeric string: every entry this module touches must carry the same type,
			// or the payload ends up mixing 2 and '2' for the same entity across directions.
			entry.entityTypeId = option.entityTypeId;
			entry.isChildrenListEnabled = checked;
		}
		else if (checked)
		{
			// The children list cannot exist without the relation itself: enabling it creates both.
			entries.push({ entityTypeId: option.entityTypeId, isChildrenListEnabled: true });
		}

		return state;
	}

	if (checked)
	{
		if (!entry)
		{
			entries.push({ entityTypeId: option.entityTypeId, isChildrenListEnabled: false });
		}

		return state;
	}

	state[option.direction] = entries.filter((item) => Number(item.entityTypeId) !== option.entityTypeId);

	return state;
}

// Both directions are cleared unconditionally, not just the ones row.options lists: options only
// reflect what the catalog currently offers, but a saved relation can outlive its catalog entry
// (e.g. the process type changed) and a stale entry left in the other direction gets re-saved.
const RELATION_DIRECTIONS: RelationDirectionName[] = ['parent', 'child'];

export function clearRelationRow(baseline: HubBaseline, row: RelationRow): RelationsState
{
	const state = readState(baseline);

	RELATION_DIRECTIONS.forEach((direction) => {
		state[direction] = state[direction].filter((item) => Number(item.entityTypeId) !== row.entityTypeId);
	});

	return state;
}

// ── Сценарий пары «процесс ↔ сущность CRM» ────────────────────────────────────────────────────────
//
// Пара имеет ровно три осмысленных состояния, и они же — три ответа на «кто кому главный» (созвон
// N460476, 26:36). Имена сценариев совпадают с именами направлений не случайно: направление `parent`
// и означает «родитель — сущность CRM», `child` — «родитель — процесс» (семантика опций разобрана в
// RELATION_OPTION_GROUP в const/relations-layout.ts).
export type RelationScenario = 'parent' | 'child' | 'both';

// Направление ВКЛЮЧЕНО, когда жив его field: сама запись связи и есть field, а children-list — флаг
// внутри неё (см. applyRelationOption). Поэтому «field отмечен» и «запись направления существует» —
// одно и то же, и спрашивать состояние достаточно у field.
function isDirectionOn(row: RelationRow, direction: RelationDirectionName): boolean
{
	return row.options.some(
		(option) => option.direction === direction && option.kind === 'field' && option.checked,
	);
}

// Направление ДОСТУПНО, когда каталог вообще отдал для него опции: контакт и компания не бывают
// родителями процесса, заказ не бывает ребёнком (RelationManager, D-58).
function hasDirection(row: RelationRow, direction: RelationDirectionName): boolean
{
	return row.options.some((option) => option.direction === direction);
}

// Сценарий, в котором строка стоит сейчас; null — связи нет, строка выключена.
export function scenarioOfRow(row: RelationRow): RelationScenario | null
{
	const parent = isDirectionOn(row, 'parent');
	const child = isDirectionOn(row, 'child');

	if (parent && child)
	{
		return 'both';
	}

	if (parent)
	{
		return 'parent';
	}

	if (child)
	{
		return 'child';
	}

	return null;
}

// Сценарии, которые эта строка вообще умеет. У контакта и компании он один («главный — процесс»),
// у заказа тоже один («главная — сущность CRM») — и тогда переключателю на экране делать нечего:
// предложение показывается как факт (спека 2026-09-17, «Крайние случаи»).
export function availableScenarios(row: RelationRow): RelationScenario[]
{
	const parent = hasDirection(row, 'parent');
	const child = hasDirection(row, 'child');

	if (parent && child)
	{
		return ['parent', 'child', 'both'];
	}

	if (parent)
	{
		return ['parent'];
	}

	if (child)
	{
		return ['child'];
	}

	return [];
}

// Выставить сценарий ЗА ОДИН проход.
//
// Цепочкой из applyRelationOption это не собирается: каждая читает состояние заново из baseline,
// поэтому второй вызов затирает первый — ровно та причина, по которой здесь стояла снятая вместе с
// деревом applyRelationDirections.
//
// Опции выставляются ПАРАМИ — поле и вкладка вместе. Это же закрывает S-06 («вкладка без поля
// бессмысленна»): руками пару можно разомкнуть чипсами, но сценарий такого состояния не создаёт.
export function applyRelationScenario(
	baseline: HubBaseline,
	row: RelationRow,
	scenario: RelationScenario,
): RelationsState
{
	const state = readState(baseline);
	// Смена сценария добавляет или убирает направление, а вкладку у уже существующей записи не
	// трогает: выключенная человеком вкладка не должна молча включаться. Повторное применение того же
	// сценария по-прежнему собирает пару заново; экран его не делает — handleRowScenario выходит раньше.
	const isReapply = scenarioOfRow(row) === scenario;

	RELATION_DIRECTIONS.forEach((direction) => {
		if (scenario !== 'both' && scenario !== direction)
		{
			// Сценарий описывает состояние пары целиком, поэтому лишнее направление стирается —
			// и стирается независимо от каталога, по той же причине, что и в clearRelationRow:
			// сохранённая связь переживает свою запись в каталоге, а оставленный хвост уехал бы
			// в сохранение.
			state[direction] = state[direction].filter(
				(item) => Number(item.entityTypeId) !== row.entityTypeId,
			);

			return;
		}

		// Включается только то, что каталог отдал: запись в parent для контакта была бы мусором,
		// который сервер не примет.
		if (!hasDirection(row, direction))
		{
			return;
		}

		const entry = findEntry(state[direction], row.entityTypeId);
		if (entry)
		{
			// entityTypeId нормализуется к числу по той же причине, что и в applyRelationOption:
			// сохранённая запись могла прийти строкой, и смешивать 2 и '2' в одной посылке нельзя.
			entry.entityTypeId = row.entityTypeId;
			if (isReapply)
			{
				entry.isChildrenListEnabled = true;
			}
		}
		else
		{
			state[direction].push({ entityTypeId: row.entityTypeId, isChildrenListEnabled: true });
		}
	});

	return state;
}

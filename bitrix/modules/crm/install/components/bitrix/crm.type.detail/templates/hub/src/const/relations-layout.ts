// Layout of the "Relations" section: the "Связи с CRM" card (task-8-brief.md) plus its "Другие
// смарт-процессы" row and the "Связи по порталу" card (task-9-brief.md).
//
// CRM core entity type ids, used to split the relations catalog into "CRM relations" (crmRows, the
// rows of the first card) and "other smart processes" (smartProcessRows, the picker row's chips —
// everything the catalog carries that is not one of these). Hardcoded on the client only because the
// catalog carries no "is dynamic type" flag — requested in backend-todo.md.
export const CRM_CORE_ENTITY_TYPE_IDS: number[] = [
	1, // LEAD
	2, // DEAL
	3, // CONTACT
	4, // COMPANY
	7, // QUOTE
	14, // ORDER
	31, // SMART_INVOICE
];

// Key the relations section registers itself under in hubControlRegistry. Not a descriptor record id —
// the section is not a control; it borrows the registry only so "Отменить" can reach the one piece of
// state the store does not own: which smart-process rows are on screen.
export const SMART_PROCESS_ROWS_CONTROL_ID = 'sp-smart-process-rows';

// "Связи по порталу" card record ids: the "Элементы CRM" flag and the linkedUserFields array control
// (Календарь/Задачи/Шаблоны задач on this stand) — no blocking dependency between the two, unlike the
// prototype (app.ts syncs them both ways instead, see applyMasterToggle/applyChildToggle).
export const USE_IN_USERFIELD_RECORD_ID = 'sp-use-in-userfield';
export const LINKED_USER_FIELDS_RECORD_ID = 'sp-linked-user-fields';

// The Outline set has no unprefixed 'crm' / 'settings' glyph (see
// ui/install/js/ui/icon-set/api/core/src/sets/outline.ts): both names exist only with the 'o-' prefix
// ('o-crm', 'o-settings'). Substituted here, same convention as PERMISSIONS_CARD_ICON's 'lock' fix.
export const RELATIONS_CARD_ICON = Object.freeze({
	Crm: 'o-crm',
	Portal: 'o-settings',
});

// Record ids the "Relations" section renders itself, instead of handing them to
// CrmHubControlRenderer. For sp-relation-parent / sp-relation-child / USE_IN_USERFIELD_RECORD_ID this
// keeps raising SUPPLY_STEP from silently dropping the record:
// everything else in `records` still falls through to relations-section.ts's own restRecords
// fallback. LINKED_USER_FIELDS_RECORD_ID is here for a different reason and does NOT get that same
// guarantee: this section draws no row from that record at all, only linkedUserFieldRows built from
// snapshot.linkedUserFieldsMeta (relations-section.ts) — listing the id here only keeps it out of
// restRecords, so it stops reaching CrmHubControlRenderer's legacy control
// (SpControlType.LinkedUserFields, see linked-user-fields-control.ts). If the module is disabled and
// that meta comes back empty, the record renders NOWHERE, not even here. Accepted, not a bug —
// behavior unchanged (task-9d-brief.md, item 4).
export const RELATIONS_LAYOUT_RECORD_IDS: string[] = [
	'sp-relation-parent',
	'sp-relation-child',
	USE_IN_USERFIELD_RECORD_ID,
	LINKED_USER_FIELDS_RECORD_ID,
];

// Icon and description per relation row of "Связи с CRM". The mockup of the third screen draws the
// relations on the same canonical block as every other setting of the hub, and that block has an
// icon and a description — neither of which the relations catalog carries, since it hands over an
// entity type id and a title and nothing else.
//
// The description is shown ONLY while the row is off (PM, 2026-09-01). Once it is on, the chips say
// what appears where, and the sentence above them would be the same thing said twice.
export const RELATION_ROW_ICON: Record<number, string> = Object.freeze({
	1: 'o-lead',
	2: 'o-my-deals',
	3: 'o-person',
	4: 'o-company',
	7: 'o-quote',
	14: 'o-shop-order',
	31: 'o-invoice',
});

// Контакт и компания въехали сюда позже остальных: до D-59 они прятались в строке «Клиент» и
// своего описания не имели, а став строками наравне с лидом, остались на экране голыми — замер
// стенда 17.09 показал их высоту 71 px против 102 у соседей. Выключенная строка обязана продавать
// связь, поэтому описание есть у каждой.
export const RELATION_ROW_DESCRIPTION: Record<number, string> = Object.freeze({
	1: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_LEAD',
	2: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_DEAL',
	3: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_CONTACT',
	4: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_COMPANY',
	7: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_QUOTE',
	14: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_ORDER',
	31: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_INVOICE',
});

// Every row of "Связи с другими смарт-процессами" is a smart process, so one icon covers them all.
export const SMART_PROCESS_ROW_ICON = 'o-smart-process';

// Rows of "Связи по порталу": the master flag plus one row per linked user field. Keyed by the field
// name, which is what buildLinkedUserFieldRows carries; a field without an entry falls back to the
// title the meta already localizes, and to no description.
export const PORTAL_ROW_ICON: Record<string, string> = Object.freeze({
	'CALENDAR_EVENT|UF_CRM_CAL_EVENT': 'o-calendar',
	'TASKS_TASK|UF_CRM_TASK': 'o-task',
	'TASKS_TASK_TEMPLATE|UF_CRM_TASK': 'o-task',
});

export const PORTAL_ROW_DESCRIPTION: Record<string, string> = Object.freeze({
	'CALENDAR_EVENT|UF_CRM_CAL_EVENT': 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_CALENDAR',
	'TASKS_TASK|UF_CRM_TASK': 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_TASK',
	'TASKS_TASK_TEMPLATE|UF_CRM_TASK': 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_TASK_TEMPLATE',
});

export const PORTAL_MASTER_ROW_ICON = 'o-crm';

// Phrase code per option kind: what appears where when the option is on.
export const RELATION_OPTION_PHRASE: Record<string, string> = Object.freeze({
	// The undeclinable fallback: rows whose entity has no hand-written instrumental below keep their
	// name in quotes. Kept keyed by kind so the "every labelled kind has a hint" invariant below still
	// has a parent-field label to check.
	'parent-field': 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_NAMED',
	'parent-children-list': 'CRM_TYPE_DETAIL_HUB_RELATION_CHILDREN_LIST',
	'child-field': 'CRM_TYPE_DETAIL_HUB_RELATION_CHILD_FIELD',
});

// Chip caption of the parent-field option per CRM core entity type: the chip names the entity itself
// ("Поле со сделкой") instead of calling it a "связанный элемент", because the row above it already
// names that entity and the generic wording was the one place on the row that did not. One phrase per
// type, not a substitution: the case is instrumental and the preposition alternates with it (с лидом,
// со сделкой, со счётом), and neither can be produced from a name at runtime. Same five types as
// RELATION_ROW_DESCRIPTION — contact and company are absent from the parent catalog, so they never
// reach this map, and a type missing from it falls back to the quoted form above.
export const RELATION_PARENT_FIELD_TITLE: Record<number, string> = Object.freeze({
	1: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_LEAD',
	2: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_DEAL',
	7: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_QUOTE',
	14: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_ORDER',
	31: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_INVOICE',
});

// Две стороны связи, они же две карточки миниатюры (D-63). Ключ группы — только имя стороны, на экран
// он не выводится; звать его по имени лучше, чем сравнивать со строковым литералом в каждом потребителе.
export const RELATION_GROUP_KEY = Object.freeze({
	Process: 'process',
	Entity: 'entity',
});

// Side of the relation per option — which card the option's artifact appears in:
//   parent-field          — a field in THIS process's element card, holding the CRM element;
//   parent-children-list  — a tab in the CRM entity's card, listing this process's elements;
//   child-field           — a field in the CRM entity's card, holding this process's element;
//   child-children-list   — a tab in THIS process's card, listing CRM entity elements.
// So the "process" side is the process's own card and the "entity" side is the other one.
export const RELATION_OPTION_GROUP: Record<string, string> = Object.freeze({
	'parent-field': RELATION_GROUP_KEY.Process,
	'parent-children-list': RELATION_GROUP_KEY.Entity,
	'child-field': RELATION_GROUP_KEY.Entity,
	'child-children-list': RELATION_GROUP_KEY.Process,
});

// ── Части предложения строки-конструктора (спека 2026-09-17, раздел «Тексты») ─────────────────────
//
// Имя процесса НЕ склоняется — оно пользовательское. Поэтому падеж всегда падает на слово «элемент»,
// а имя стоит в кавычках и в именительном; тот же приём уже применён к чипсам
// (RELATION_PARENT_FIELD_NAMED). Утверждено PM 17.09.
//
// Сущность CRM, наоборот, склоняется, и её формы нельзя получить из имени в рантайме — поэтому под
// каждый падеж свой набор фраз, по одной на тип. Тип, которого в наборе нет (другой смарт-процесс),
// уходит в ..._NAMED и получает ту же конструкцию через «элемент», что и сам процесс.
//
// Наборы заполнены на все семь типов ядра, включая контакт и компанию: сегодня они бывают только
// детьми (D-58) и в роли «одного» на экран не попадают, но набор с дырой молча подставил бы им
// «одного элемента „Контакт“» в день, когда каталог отдаст их родителями.

// Родительный единственного с согласованным числительным: «У ОДНОЙ СДЕЛКИ может быть …».
export const RELATION_ENTITY_ONE: Record<number, string> = Object.freeze({
	1: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_LEAD',
	2: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_DEAL',
	3: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_CONTACT',
	4: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_COMPANY',
	7: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_QUOTE',
	14: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_ORDER',
	31: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_INVOICE',
});

// Родительный множественного: «… может быть НЕСКОЛЬКО СДЕЛОК».
export const RELATION_ENTITY_MANY: Record<number, string> = Object.freeze({
	1: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_LEAD',
	2: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_DEAL',
	3: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_CONTACT',
	4: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_COMPANY',
	7: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_QUOTE',
	14: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_ORDER',
	31: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_INVOICE',
});

// Предложный вместе с предлогом: «… создавать элементы прямо В СДЕЛКЕ». Предлог внутри фразы, а не
// в рамке, потому что он часть склонения и в других языках может исчезнуть совсем.
export const RELATION_ENTITY_IN: Record<number, string> = Object.freeze({
	1: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_LEAD',
	2: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_DEAL',
	3: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_CONTACT',
	4: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_COMPANY',
	7: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_QUOTE',
	14: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_ORDER',
	31: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_INVOICE',
});

// Именительный множественного с заглавной — начало подписи чипсы: «ЛИДЫ в процессе».
export const RELATION_ENTITY_PLURAL: Record<number, string> = Object.freeze({
	1: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_LEAD',
	2: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_DEAL',
	3: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_CONTACT',
	4: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_COMPANY',
	7: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_QUOTE',
	14: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_ORDER',
	31: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_INVOICE',
});

// Несклоняемая половина: то же самое про «элемент „#TITLE#“» — и для процесса, который настраивают,
// и для строки другого смарт-процесса.
export const RELATION_NAMED_ONE = 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_NAMED';
export const RELATION_NAMED_MANY = 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_NAMED';
export const RELATION_NAMED_IN = 'CRM_TYPE_DETAIL_HUB_RELATION_IN_NAMED';
export const RELATION_NAMED_PLURAL = 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_NAMED';

// Рамки предложения. Обе читаются кардинальностью: связь описывает себя одним предложением, как в
// прототипе 2026-09-17. Двусторонняя договаривает «и наоборот» — пересказывать ею подпись выбранной
// кнопки («Оба главные») значило бы сказать одно и то же дважды (PM, 17.09).
export const RELATION_SENTENCE: Record<string, string> = Object.freeze({
	oneToMany: 'CRM_TYPE_DETAIL_HUB_RELATION_SENTENCE_ONE_TO_MANY',
	both: 'CRM_TYPE_DETAIL_HUB_RELATION_SENTENCE_BOTH',
});

// «Это позволит…» — та же тройка, но про пользу, а не про устройство (заказано PM 17.09: «Это
// позволит начинать процесс с этой сущности…»).
export const RELATION_CONSEQUENCE: Record<string, string> = Object.freeze({
	parent: 'CRM_TYPE_DETAIL_HUB_RELATION_CONSEQUENCE_PARENT',
	child: 'CRM_TYPE_DETAIL_HUB_RELATION_CONSEQUENCE_CHILD',
	both: 'CRM_TYPE_DETAIL_HUB_RELATION_CONSEQUENCE_BOTH',
});

// Подписи переключателя сценария: ГДЕ появится список — «Процесс в сделке / Сделки в процессе / В обе
// стороны» (выбор PM 25.09). Подпись говорит, что человек получит, а не порядок работы. Сущность
// склоняется своими формами (IN, PLURAL); строка другого смарт-процесса уходит в «элемент „#TITLE#“».
export const RELATION_SCENARIO_LABEL: Record<string, string> = Object.freeze({
	parent: 'CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_PARENT',
	child: 'CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_CHILD',
	both: 'CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_BOTH',
});

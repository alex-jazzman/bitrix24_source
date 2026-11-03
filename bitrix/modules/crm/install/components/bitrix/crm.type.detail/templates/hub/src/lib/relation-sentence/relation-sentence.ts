import { type RelationScenario } from '../relation-rows/relation-rows';
import {
	RELATION_CONSEQUENCE,
	RELATION_ENTITY_IN,
	RELATION_ENTITY_MANY,
	RELATION_ENTITY_ONE,
	RELATION_ENTITY_PLURAL,
	RELATION_NAMED_IN,
	RELATION_NAMED_MANY,
	RELATION_NAMED_ONE,
	RELATION_NAMED_PLURAL,
	RELATION_SCENARIO_LABEL,
	RELATION_SENTENCE,
} from '../../const/relations-layout';

// Предложение, которым связь объясняет себя в своей строке (D-61, спека 2026-09-17).
//
// Собирается из кусков, а не пишется целиком, по одной причине: имя процесса склонять нельзя, а имя
// сущности CRM — нужно. Поэтому рамка предложения знает только места (#ONE#, #MANY#, #IN#,
// #ENTITY#, #PROCESS#), а падеж каждой половины приходит своей фразой. Фразу здесь никто не
// резолвит: как и resolveRelationOptionTitle рядом, эта библиотека остаётся чистой и отдаёт коды —
// loc() зовёт компонент.

export type RelationTitlePart = {
	// Код фразы; несёт #TITLE#, когда `title` заполнен. ПУСТОЙ код означает «текст взять из `title`
	// как есть» — так на экран попадает имя сущности из каталога, у которого фразы и не бывает.
	code: string;
	title: string;
};

export type RelationPhrase = {
	// Код фразы-рамки; несёт #КЛЮЧ# на каждую часть.
	code: string;
	// Части по ключу подстановки, без решёток: { ONE: …, MANY: … }.
	parts: Record<string, RelationTitlePart>;
};

function verbatim(title: string): RelationTitlePart
{
	return { code: '', title };
}

// Форма сущности CRM из своего набора; тип, которого в наборе нет, — другой смарт-процесс, и он
// получает ту же конструкцию через «элемент», что и сам настраиваемый процесс.
function entityPart(
	forms: Record<number, string>,
	namedCode: string,
	entityTypeId: number,
	rowTitle: string,
): RelationTitlePart
{
	const code = forms[entityTypeId];

	return code ? { code, title: '' } : { code: namedCode, title: rowTitle };
}

// Само предложение: «У одной сделки может быть несколько элементов „Заявки на закупку 24“».
//
// Кто встал в «одного», тот и главный — иерархия и кардинальность сказаны одной фразой, и оба
// вопроса созвона (26:29 «сколько к скольким», 26:36 «кто кому главный») закрываются ею разом.
export function buildRelationSentence(
	scenario: RelationScenario,
	entityTypeId: number,
	rowTitle: string,
	processTitle: string,
): RelationPhrase
{
	// Сценарий `parent` — родитель сущность CRM, значит в «одного» встаёт она; `child` — родитель
	// процесс, и половины меняются местами. У двусторонней связи головой берётся сущность CRM, а
	// вторая сторона договаривается хвостом «и наоборот»: пересказывать ею подпись выбранной кнопки
	// («Оба главные») — значит сказать одно и то же дважды, на что PM и указал 17.09.
	const entityIsHead = scenario !== 'child';

	return {
		code: scenario === 'both' ? RELATION_SENTENCE.both : RELATION_SENTENCE.oneToMany,
		parts: {
			ONE: entityIsHead
				? entityPart(RELATION_ENTITY_ONE, RELATION_NAMED_ONE, entityTypeId, rowTitle)
				: { code: RELATION_NAMED_ONE, title: processTitle },
			MANY: entityIsHead
				? { code: RELATION_NAMED_MANY, title: processTitle }
				: entityPart(RELATION_ENTITY_MANY, RELATION_NAMED_MANY, entityTypeId, rowTitle),
		},
	};
}

// «Это позволит…» — то же состояние, пересказанное пользой. Предложение выше говорит, КАК устроена
// связь; эта фраза — ЗАЧЕМ она, и именно её заказал PM вместо заголовка «CRM → Процесс».
export function buildRelationConsequence(
	scenario: RelationScenario,
	entityTypeId: number,
	rowTitle: string,
	processTitle: string,
): RelationPhrase
{
	if (scenario === 'both')
	{
		return { code: RELATION_CONSEQUENCE.both, parts: {} };
	}

	if (scenario === 'parent')
	{
		return {
			code: RELATION_CONSEQUENCE.parent,
			parts: {
				PROCESS: verbatim(processTitle),
				IN: entityPart(RELATION_ENTITY_IN, RELATION_NAMED_IN, entityTypeId, rowTitle),
			},
		};
	}

	return {
		code: RELATION_CONSEQUENCE.child,
		parts: {
			PROCESS: verbatim(processTitle),
			MANY: entityPart(RELATION_ENTITY_MANY, RELATION_NAMED_MANY, entityTypeId, rowTitle),
		},
	};
}

// Подпись кнопки сценария — где появится список (PM, 25.09): «Процесс в сделке» — вкладка с
// элементами процесса в сделке, «Сделки в процессе» — вкладка со сделками в процессе.
export function buildScenarioLabel(
	scenario: RelationScenario,
	entityTypeId: number,
	rowTitle: string,
): RelationPhrase
{
	if (scenario === 'parent')
	{
		return {
			code: RELATION_SCENARIO_LABEL.parent,
			parts: { IN: entityPart(RELATION_ENTITY_IN, RELATION_NAMED_IN, entityTypeId, rowTitle) },
		};
	}

	if (scenario === 'child')
	{
		return {
			code: RELATION_SCENARIO_LABEL.child,
			parts: { PLURAL: entityPart(RELATION_ENTITY_PLURAL, RELATION_NAMED_PLURAL, entityTypeId, rowTitle) },
		};
	}

	return { code: RELATION_SCENARIO_LABEL[scenario] ?? '', parts: {} };
}

// Разбор собранной фразы на куски для показа.
//
// Прототип 2026-09-17 подсвечивает в предложении ровно те половины, которые меняет сценарий:
// «У одной СДЕЛКИ может быть НЕСКОЛЬКО заявок». Подсветка объясняет, на что смотреть при смене
// сценария, поэтому места подстановки и есть куски: что рамка подставляет — то и меняется.
export type RelationPhraseChunk = {
	text: string;
	// true — подставленная половина, её и подсвечивают.
	slot: boolean;
};

// Разбирает рамку по её же местам подстановки. Значения уже разрешены вызывающим — библиотека
// по-прежнему не зовёт loc().
export function splitFramePhrase(frame: string, values: Record<string, string>): RelationPhraseChunk[]
{
	const chunks: RelationPhraseChunk[] = [];
	let rest = frame;

	// Идём по ближайшему из оставшихся мест, а не по ключам подряд: порядок мест задаёт фраза, и
	// в переводе он может быть другим, чем в русском оригинале.
	for (;;)
	{
		let at = -1;
		let key = '';

		for (const name of Object.keys(values))
		{
			const index = rest.indexOf(`#${name}#`);
			if (index !== -1 && (at === -1 || index < at))
			{
				at = index;
				key = name;
			}
		}

		if (at === -1)
		{
			break;
		}

		if (at > 0)
		{
			chunks.push({ text: rest.slice(0, at), slot: false });
		}
		chunks.push({ text: values[key], slot: true });
		rest = rest.slice(at + key.length + 2);
	}

	if (rest !== '')
	{
		chunks.push({ text: rest, slot: false });
	}

	return chunks;
}

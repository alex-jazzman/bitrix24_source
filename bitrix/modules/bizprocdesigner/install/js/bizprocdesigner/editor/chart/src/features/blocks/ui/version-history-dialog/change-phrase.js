import { Loc, Text, Type } from 'main.core';

export type TemplateChangeEntry = {
	elementType: string,
	elementId: ?string,
	elementTitle: ?string,
	kind: string,
	oldValue: ?string,
	newValue: ?string,
	settingTitle: ?string,
};

const CHANGE_PHRASE_PREFIX = 'BIZPROCDESIGNER_EDITOR_HISTORY_CHANGE_';
const UNTITLED_ELEMENT_PHRASE = 'BIZPROCDESIGNER_EDITOR_HISTORY_ELEMENT_UNTITLED';
const EMPTY_VALUE_PHRASE = 'BIZPROCDESIGNER_EDITOR_HISTORY_VALUE_EMPTY';

function getPhrase(phraseCode: string): string
{
	return Loc.getMessage(phraseCode) ?? '';
}

/**
 * A value the server left out is unknown, an empty one is a value of its own: the setting was cleared
 * or filled in, and the line saying so reads better than the wording without any values.
 */
function getDisplayValue(value: ?string): ?string
{
	if (!Type.isString(value))
	{
		return null;
	}

	const empty = getPhrase(EMPTY_VALUE_PHRASE);

	return value === '' ? (Type.isStringFilled(empty) ? empty : null) : value;
}

function upperSnake(value: string): string
{
	return Text.toKebabCase(value).toUpperCase().replaceAll('-', '_');
}

/**
 * The wording is not stored with the change: the server sends the structure and the phrase is
 * assembled here, so an element or a kind without a phrase of its own still gets a readable line.
 * A phrase naming the values is skipped when a value is missing: filling an empty name into
 * quotes reads worse than the wording that does without it.
 * The values come from the template a person edits, so they are filled into the phrase in a single
 * pass: a value carrying a placeholder of its own must not take the slot of another value.
 */
export function buildChangePhrase(entry: TemplateChangeEntry): string
{
	const element = upperSnake(entry.elementType);
	const kind = upperSnake(entry.kind);
	const untitled = getPhrase(UNTITLED_ELEMENT_PHRASE);
	const title = Type.isStringFilled(entry.elementTitle) ? entry.elementTitle : untitled;

	const replacements = { '#TITLE#': title };
	const unfilled = [];

	Object.entries({
		'#SETTING#': entry.settingTitle,
		'#OLD#': getDisplayValue(entry.oldValue),
		'#NEW#': getDisplayValue(entry.newValue),
	}).forEach(([placeholder, value]) => {
		if (Type.isStringFilled(value))
		{
			replacements[placeholder] = value;
		}
		else
		{
			unfilled.push(placeholder);
		}
	});

	const fillPhrase = (phraseCode: string): ?string => {
		const template = getPhrase(phraseCode);
		if (!Type.isStringFilled(template) || unfilled.some((placeholder) => template.includes(placeholder)))
		{
			return null;
		}

		return template.replaceAll(/#[A-Z_]+#/g, (placeholder) => replacements[placeholder] ?? placeholder);
	};

	return fillPhrase(`${CHANGE_PHRASE_PREFIX}${element}_${kind}`)
		?? fillPhrase(`${CHANGE_PHRASE_PREFIX}${element}_FALLBACK`)
		?? untitled;
}

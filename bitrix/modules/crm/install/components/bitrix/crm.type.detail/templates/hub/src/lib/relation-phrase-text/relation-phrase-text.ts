import { type RelationPhrase } from '../relation-sentence/relation-sentence';

export type RelationPhraseLoc = (code: string) => string | null | undefined;

// Половины фразы, разрешённые в текст. Пустой код части означает «текст готов» — так на экран
// попадает имя сущности из каталога, у которого фразы и не бывает. loc приходит параметром:
// библиотека сама его не зовёт.
export function resolveRelationPhraseParts(phrase: RelationPhrase, loc: RelationPhraseLoc): Record<string, string>
{
	const values: Record<string, string> = {};

	Object.keys(phrase.parts).forEach((key) => {
		const part = phrase.parts[key];
		values[key] = part.code === ''
			? part.title
			: (loc(part.code) ?? '').replace('#TITLE#', () => part.title);
	});

	return values;
}

export function resolveRelationPhrase(phrase: RelationPhrase, loc: RelationPhraseLoc): string
{
	const values = resolveRelationPhraseParts(phrase, loc);
	let text = loc(phrase.code) ?? '';

	Object.keys(values).forEach((key) => {
		text = text.replace(`#${key}#`, () => values[key]);
	});

	return text;
}

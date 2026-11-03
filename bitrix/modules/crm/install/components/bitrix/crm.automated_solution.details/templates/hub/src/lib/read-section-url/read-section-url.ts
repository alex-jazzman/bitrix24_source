// Адрес кастом-раздела, как его кладёт prepareVuexState(): ключ верхнего уровня, СОСЕД
// automatedSolution, а не его поле. Вложенным он быть не может — содержимое automatedSolution
// собирает конвертер по белому списку, новых ключей он не создаёт. Читатель вынесен из app.ts
// потому, что params типизирован Record<string, any>: инлайновое выражение там не проверяется
// типами, и первая версия этой правки молча отдавала null при исправном бэкенде.
export function readSectionUrl(state: Record<string, any> | null | undefined): string | null
{
	const raw = state?.intranetCustomSectionUrl;

	return typeof raw === 'string' && raw !== '' ? raw : null;
}

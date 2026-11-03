import { type AvailableStep, type HubSectionDescriptor, type SettingsRecord } from 'crm.settings-hub';

// Дерево разделов ЦРМ-хаба после роспуска «Настроек» (D-03). Прежние CrmSectionId / CRM_HUB_SECTIONS
// остаются в descriptor.ts нетронутыми: этот модуль лежит рядом, а не переписывает их.
export const CrmHubTreeSectionId = Object.freeze({
	// Псевдо-секция: записи паспорта поднимаются в шапку шелла и видны над разделом.
	Passport: 'passport',
	Types: 'types',
	// Тоже псевдо-секция: раздела `vibe` в дереве нет, карточку «Главной страницы» рисует app.ts
	// внутри единственного раздела, под «Смарт-процессами».
	Vibe: 'vibe',
});

// Записи паспорта рисует CrmHubCrmPassport из полного списка, запись `crm-vibe` — карточка
// «Главной страницы» в app.ts. Разделов `passport` и `vibe` нет в HUB_TREE_SECTIONS, поэтому шелл
// за ними не приходит — фильтровать их отдельно не нужно.
export const HUB_TREE_SECTION_BY_RECORD: Record<string, string> = {
	'crm-title': CrmHubTreeSectionId.Passport,
	'crm-description': CrmHubTreeSectionId.Passport,
	'crm-section-address': CrmHubTreeSectionId.Passport,
	'crm-types': CrmHubTreeSectionId.Types,
	'crm-vibe': CrmHubTreeSectionId.Vibe,
};

// Один раздел, меню разделов нет: всё на одном экране — паспорт, «Смарт-процессы», «Главная
// страница» (слово владельца). Раздел `types` держит обе карточки, поэтому его невидимый заголовок —
// метка региона для скринридера — общий «Настройки», а не «Смарт-процессы».
// hideTitle: заголовок раздела гасится, имена читаются с шапок карточек — как в СП-хабе.
export const HUB_TREE_SECTIONS: HubSectionDescriptor[] = [
	{
		id: CrmHubTreeSectionId.Types,
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_TAB_COMMON',
		hideTitle: true,
	},
];

// Считается ОТ ТАБА, а не переводится из старой секции: прод-таб `common` вёл в «Настройки»,
// а «Настройки» больше нет — перевод секция→секция привёл бы в никуда.
export const HUB_TREE_SECTION_BY_TAB: Record<string, string> = {
	common: CrmHubTreeSectionId.Types,
	types: CrmHubTreeSectionId.Types,
};

export const HUB_TREE_DEFAULT_SECTION_ID: string = CrmHubTreeSectionId.Types;

// Копия записей с переписанным sectionId. Дескриптор — общая константа модуля: мутировать её
// нельзя, иначе второй монтаж приложения получит уже переписанные секции.
export function applyHubTree(records: SettingsRecord[]): SettingsRecord[]
{
	return records.map((record) => {
		const sectionId = HUB_TREE_SECTION_BY_RECORD[record.id];

		return sectionId ? { ...record, sectionId } : record;
	});
}

// Записи псевдо-секции, которую шелл не рисует, — тем же фильтром, что у шелла: секция совпадает и
// запись доступна на текущем шаге поставки. У кита это filterSectionRecords, но наружу он не
// экспортирован. Шаг приходит параметром: из кита сюда можно импортировать только типы, рантайм-
// импорт повалил бы весь тест-прогон (D-10).
export function pickSectionRecords(
	records: SettingsRecord[],
	sectionId: string,
	supplyStep: AvailableStep,
): SettingsRecord[]
{
	return records.filter(
		(record) => record.sectionId === sectionId && record.availableFromStep <= supplyStep,
	);
}

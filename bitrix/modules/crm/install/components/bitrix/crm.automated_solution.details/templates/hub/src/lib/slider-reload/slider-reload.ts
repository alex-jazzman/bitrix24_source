// Чистая часть рецепта перезагрузки слайдера, снятая с types-control.ts:266-282
// (openTypeCreationSlider -> reloadWithNewUri): после любого успешного сохранения слайдер не
// закрывается, а перезагружается адресом записи /details/<id>/ — создание переезжает в режим
// настройки, настройка перерисовывается сервером. Сама навигация (Router.Instance
// .getAutomatedSolutionDetailUrl + window.location.href) сюда не переезжает: импорт crm.router в
// src/lib повалил бы весь тест-прогон (D-10), поэтому здесь только решения, а не вызовы.

// Раздел не параметризуется и параметризован быть не может: class.php:25-28 знает ровно два таба
// ('common', 'types'), таба секции vibe не существует, неизвестный activeTabId сервер молча
// перепишет в current(TAB_IDS) = common, а HUB_TREE_SECTION_BY_TAB (src/const/hub-tree.ts) переведёт
// common обратно в types. Маппинг не инъективен, обратный из него не строится. Поэтому всегда
// 'types'. Раздел на экране и так один: «Главная страница» стоит в нём под «Смарт-процессами».
// Объект каждый раз новый: вызывающий домешивает к нему IFRAME-параметры.
export function buildReloadQuery(): Record<string, string>
{
	return { activeTabId: 'types' };
}

// После любого успешного сохранения слайдер не закрывается, а перезагружается адресом записи —
// на обоих экранах, поэтому от режима решение не зависит, только от id. Ветка на id <= 0
// обязательна: без неё адрес соберётся в /details/0/, и пользователь получит вечный экран создания
// при уже созданной записи. На такой ответ вызывающий не делает ничего: ни навигации, ни закрытия.
export function shouldReloadAfterSave(id: unknown): boolean
{
	return Number(id ?? 0) > 0;
}

// IFRAME-параметры нужны, только когда перезагружается фрейм слайдера: на странице, открытой
// напрямую, IFRAME=Y выключает шапку и подвал портала.
export function buildFrameQuery(isInSlider: boolean): Record<string, string>
{
	return isInSlider ? { IFRAME: 'Y', IFRAME_TYPE: 'SIDE_SLIDER' } : {};
}

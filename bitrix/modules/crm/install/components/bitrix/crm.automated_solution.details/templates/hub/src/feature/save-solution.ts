import { Dictionary } from 'crm.integration.analytics';
import { Router } from 'crm.router';
import { sendData as sendAnalyticsData } from 'ui.analytics';

import { createSaveAnalyticsBuilder } from '../lib/save-analytics';
import { runHubSave } from '../lib/create-mode/create-mode';
import { dispatchSave } from '../lib/save-request/save-request';
import { buildFrameQuery, buildReloadQuery, shouldReloadAfterSave } from '../lib/slider-reload/slider-reload';
import { RecoverSolution } from './recover-solution';

declare const BX: any;

export type SaveSolutionDeps = {
	// Returns the shared Vuex store.
	getStore: () => any;
	// Toggles the kit save-panel wait state (replaces prod ui-btn-wait / unlockButtons).
	setWaiting: (waiting: boolean) => void;
	// Refreshes the App savedSnapshot after a successful save.
	commitSnapshot: () => void;
	// Suppresses the duplicate cancel analytics after a successful save (prod isCancelEventAlreadyRegistered).
	markCancelEventRegistered: () => void;
	// The hub description field rule for the request copy (normalizeHubDescription of crm.settings-hub).
	normalizeDescription: (value: unknown) => string;
	// The hub read-only mode (the app params): the page switch is not sent from a read-only hub.
	readOnly: boolean;
	// Tells the form about a failed save: an add that has created the solution turns it into the settings screen.
	reportFailure: () => void;
};

// Save flow, parity with prod Main.save(): analytics element = ELEMENT_CREATE_BUTTON (the
// same for create and edit), one dispatch of the store `save` action (single request, empty
// typeIds -> false, sliderCode promo-slider and the error banner all live inside the action),
// then on success mark the cancel-dedup flag, refresh the snapshot and reload the slider at the
// record's address. After any successful save the slider is NOT closed, on both screens: creation
// turns into the settings screen of the new record, settings is redrawn by the server with fresh
// state. The panel wait state replaces prod unlockButtons(); on error the form stays open with the
// state intact.
export class SaveSolution
{
	#deps: SaveSolutionDeps;

	constructor(deps: SaveSolutionDeps)
	{
		this.#deps = deps;
	}

	execute(): void
	{
		const store = this.#deps.getStore();
		const builder: any = createSaveAnalyticsBuilder(store).setElement(Dictionary.ELEMENT_CREATE_BUTTON);

		// A save during the read-back of a failed one is not sent at all, so it reports nothing either.
		void runHubSave({
			isBlocked: () => RecoverSolution.isPending(store.state),
			setWaiting: (waiting: boolean) => this.#deps.setWaiting(waiting),
			dispatchSave: () => dispatchSave(store, this.#deps.normalizeDescription, this.#deps.readOnly),
			onSuccess: () => {
				sendAnalyticsData(
					builder
						.setStatus(Dictionary.STATUS_SUCCESS)
						.setId(store.state.automatedSolution.id)
						.buildData(),
				);

				this.#deps.markCancelEventRegistered();
				this.#deps.commitSnapshot();

				// Сохранение слайдер не закрывает — ни на создании, ни на настройке (T17). Слайдер
				// перезагружается адресом записи: создание открывается уже экраном настройки
				// (критерий #8), настройку сервер рисует заново. Форму на месте не оставляем: экшен
				// `save` кладёт в стор только automatedSolution, и setState сбрасывает права, названия
				// типов и флаг прав к умолчаниям, а новый адрес раздела после переименования знает
				// только рендер class.php. Оповещение внешних страниц уже ушло из стора (actions.ts:63)
				// и от закрытия не зависит. closeSliderOrRedirect остаётся для удаления и «Отменить»
				// на создании. shouldReloadAfterSave ложно при id <= 0: адрес собрался бы в
				// /details/0/ — вечный экран создания при уже созданной записи; тогда экран просто
				// остаётся открытым, без навигации и без закрытия.
				const solutionId = store.state.automatedSolution.id;
				if (shouldReloadAfterSave(solutionId))
				{
					reloadWithNewUri(solutionId, buildReloadQuery());
				}
			},
			onFailure: () => {
				sendAnalyticsData(
					builder
						.setStatus(Dictionary.STATUS_ERROR)
						.setId(store.state.automatedSolution.id)
						.buildData(),
				);

				this.#deps.reportFailure();
			},
		});
	}
}

// Prod App.closeSliderOrRedirect: close the slider, falling back to the solution list URL.
export function closeSliderOrRedirect(): void
{
	setTimeout(() => {
		Router.Instance.closeSliderOrRedirect(
			Router.Instance.getAutomatedSolutionListUrl() as any,
			window,
		);
	});
}

// Вторая половина «куда уходим после сохранения»: слайдер не закрывается, а переезжает на адрес
// рабочего места, дорисовав IFRAME-параметры, без которых страница откроется как обычная, вне
// слайдера. Страница, открытая напрямую, уходит на тот же адрес без них. Раньше это был приватный метод types-control.ts (reloadWithNewUri) — единственная копия
// теперь здесь, рядом с closeSliderOrRedirect, и контрол зовёт её отсюда. Обратного импорта нет:
// фича сохранения компонент раздела не знает.
//
// В src/lib этим строкам не место: они тянут Router из crm.router, а рантайм-импорт экстеншна валит
// весь тест-прогон (D-10). Чистая часть рецепта — выбор раздела и решение «перезагружаться ли» —
// живёт там, в lib/slider-reload, и покрыта юнитами.
//
// setTimeout — как и у closeSliderOrRedirect: навигация уходит из промиса сохранения, чтобы .finally
// с снятием ожидания успел отработать на живой странице.
//
// ConfirmCloseGuard этому не мешает и beforeunload здесь не нужен: гард висит на
// SidePanel.Slider:onClose / onCloseByEsc, а это навигация айфрейма, а не закрытие слайдера; плюс
// setState успешного сохранения уже сбросил isModified (mutations.ts:38).
export function reloadWithNewUri(automatedSolutionId: number, queryParams: Record<string, string> = {}): void
{
	setTimeout(() => {
		const uri: any = (Router.Instance as any).getAutomatedSolutionDetailUrl(automatedSolutionId);

		const isInSlider = Boolean(BX.SidePanel?.Instance?.getSliderByWindow(window));

		uri.setQueryParams({
			...queryParams,
			...buildFrameQuery(isInSlider),
		});

		window.location.href = uri.toString();
	});
}

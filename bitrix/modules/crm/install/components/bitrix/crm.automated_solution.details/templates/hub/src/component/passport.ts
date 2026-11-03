import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { TextXs } from 'ui.system.typography.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { CrmHubPassportHero, type ScalarRecord, type SettingsRecord } from 'crm.settings-hub';

import { hasPassportAddress } from '../lib/passport-address/passport-address';
import { readSectionUrl } from '../lib/read-section-url/read-section-url';
import { canSubmitCreate } from '../lib/create-mode/create-mode';
import { buildPassportUpdate } from '../lib/hub-update/hub-update';
import {
	applyPassportReadOnlyTransition,
	isCreateEditPinned,
	isPassportReadOnly,
} from '../lib/read-only/read-only';

// Паспорт ЦРМ: арт-аватар (фоном плитки, см. src/style.css), название и описание с инлайн-правкой
// и адрес раздела. На создании под верхним рядом ещё «Сохранить» и «Отменить». Живёт в слоте
// `passport` шелла, поэтому виден над каждым разделом, а не исчезает при уходе с первого.
// Чипа расположения, как у паспорта СП, здесь нет и быть не должно: у СП он выбирает рабочее
// место процесса, а самому рабочему месту выбирать нечего (T11).
// Раскладка создания — эталон паспорта создания смарт-процесса (D-19).
//
// Своего теста с монтажом нет и не будет: шаблон компонента — не экстеншн, у него нет config.php
// с rel, поэтому chef не грузит crm.settings-hub в тест-раннер, и импорт рантайм-значений отсюда
// валит весь прогон, а не только один тест (см. tests/unit/passport-address.test.ts и коммит
// c382dac9e0ec). Решение "рисовать строку адреса или нет" вынесено в чистый модуль и покрыто там;
// сам компонент проверяет живой прогон в Task 8.

// Плейсхолдер названия на СОЗДАНИИ. Экран открывается сразу в режиме правки с пустым полем, и герой
// кладёт titleLabel в data-placeholder редактируемого заголовка — серым его рисует сам кит
// (passport-hero.css: .--editable:empty::before -> --ui-color-design-outline-content-secondary).
// Поэтому текст должен звать заполнить, а не называть поле: «Название рабочего места» в пустом
// заголовке читается как уже введённое имя. На экране настройки titleLabel остаётся подписью поля.
const CREATE_TITLE_PLACEHOLDER_PHRASE = 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CREATE_TITLE_PLACEHOLDER';

// Prompt of an empty description on the settings screen. The creation screen has none: its edit mode is pinned
// and the empty field is on screen anyway.
const DESCRIPTION_PLACEHOLDER_PHRASE = 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_DESCRIPTION_PLACEHOLDER';

export const CrmHubCrmPassport = defineComponent({
	name: 'CrmHubCrmPassport',
	components: { CrmHubPassportHero, TextXs, UiButton },
	mixins: [locMixin],
	props: {
		// ПОЛНЫЙ список записей, не срез раздела: паспорт стоит над секциями, и своих записей слот
		// шелла ему не передаёт.
		records: {
			type: Array as PropType<SettingsRecord[]>,
			default: () => [],
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		// Режим создания приходит уже ЗАЩЁЛКНУТЫМ из app.ts: компонент стор не читает и режим сам не
		// вычисляет — он остаётся пропсовым, как и был.
		isCreateMode: {
			type: Boolean,
			default: false,
		},
		// Ожидание ответа сохранения: та же роль, что у одноимённого пропа панели кита.
		isWaiting: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update', 'save', 'cancel'],
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize };
	},
	computed: {
		heroReadOnly(): boolean
		{
			return isPassportReadOnly(this.readOnly, this.isCreateMode, this.isWaiting);
		},
		titleRecord(): ScalarRecord | null
		{
			return (this.records.find((record) => record.id === 'crm-title') ?? null) as ScalarRecord | null;
		},
		title(): string
		{
			return String(this.snapshot.title ?? '');
		},
		// The live store value, like the title: an edit makes the form modified at once, and "Cancel" and the save
		// answer bring it back through setState.
		description(): string
		{
			return String(this.snapshot.description ?? '');
		},
		descriptionPlaceholder(): string
		{
			return this.isCreateMode ? '' : DESCRIPTION_PLACEHOLDER_PHRASE;
		},
		// На настройке — подпись поля из дескриптора, как было. На создании — приглашение ввести имя:
		// герой подставляет titleLabel и в заголовок показа, и в data-placeholder режима правки.
		titleLabelPhrase(): string
		{
			if (this.isCreateMode)
			{
				return CREATE_TITLE_PLACEHOLDER_PHRASE;
			}

			return this.titleRecord ? this.titleRecord.title : '';
		},
		addressRecord(): SettingsRecord | null
		{
			return this.records.find((record) => record.id === 'crm-section-address') ?? null;
		},
		// Адрес резолвит сервер (class.php) и кладёт его в snapshot.intranetCustomSectionUrl —
		// см. readSectionUrl() в app.ts. Голый intranetCustomSectionId сюда не попадает намеренно:
		// это то самое «1», ради которого правка и делалась (D-04). Значение не перечитывается и не
		// провалидировано заново — readSectionUrl уже сделал это при сборке snapshot; typeof здесь
		// защищает только входную границу этого компонента (snapshot типизирован как unknown-запись).
		// Тот же guard, что и на шаг раньше в конвейере, поэтому зовём готовую и протестированную
		// функцию, а не переписываем её здесь: компонент юнит-тестами не покрывается, и копия
		// осталась бы без регрессионной сети. `?? ''` — потому что здесь пустая строка означает
		// «адреса нет» и её ждёт hasPassportAddress.
		addressUrl(): string
		{
			return readSectionUrl(this.snapshot) ?? '';
		},
		hasAddress(): boolean
		{
			return hasPassportAddress(this.addressUrl, this.addressRecord);
		},
		// Имя — единственное обязательное поле рабочего места, без него crm.automatedsolution.add
		// вернёт ошибку. `disabled` тут законен: запрет заказчика на disabled относится к содержимому
		// погашенных разделов, а не к живой кнопке сохранения.
		canSave(): boolean
		{
			return canSubmitCreate(this.title);
		},
	},
	// Создание открывается СРАЗУ в режиме правки: имя там пусто всегда, и шаг «найди карандаш» лишний —
	// каретка обязана стоять в поле с первого кадра. Режим открывает сам герой своим методом
	// (passport-hero.ts:87-112, публичный: компонент не объявляет expose), поэтому кит не правится, а
	// состояние правки остаётся его собственным. Дочерние компоненты монтируются раньше родителя, так
	// что к этому моменту ref уже заполнен. На экране настройки хук не делает ничего.
	watch: {
		// readOnly кита лишь запрещает открыть редактор, поэтому уже открытое название закрывается
		// здесь на время сохранения. После ошибки оно открывается снова только на создании.
		async heroReadOnly(readOnly: boolean): Promise<void>
		{
			await applyPassportReadOnlyTransition({
				isCreateMode: this.isCreateMode,
				readOnly,
				stopEdit: () => (this.$refs.hero as { stopEdit?: () => void } | null)?.stopEdit?.(),
				waitForRender: () => this.$nextTick(),
				focusTitle: () => this.focusTitle(),
			});
		},
	},
	mounted(): void
	{
		this.pinEditMode();
		this.focusTitle();
	},
	methods: {
		// Закрепка режима правки на СОЗДАНИИ. По эталону пустое имя там остаётся серым плейсхолдером,
		// а поле описания — на экране. Кит же закрывает режим сам: Enter в имени, уход фокуса из колонки
		// (Tab на «Отменить», клик мимо героя) зовут stopEdit(), и пустое имя рисуется чёрным
		// заголовком с карандашом, а textarea в режиме показа из DOM пропадает. Стилем это не вернуть,
		// кит не правится — поэтому флаг возвращается здесь, наблюдателем на экземпляре героя.
		//
		// Возврат успевает ДО перерисовки: у $watch flush 'pre', и для одного экземпляра такая задача
		// встаёт в очередь раньше его рендера. Ветки шаблона не переключаются, h2 и textarea остаются
		// теми же узлами, фокус никуда не прыгает. НЕ через startEdit(): тот ещё и тащит фокус в имя,
		// и Tab на «Отменить» стал бы ловушкой.
		//
		// Цена — связка с внутренним полем isEditing кита, того же рода, что вызов startEdit() через
		// ref. Поле переименуют — закрепка молча отвалится; ловит это живая проверка (К7 спеки T8).
		// Esc сюда не относится: слайдер закрывается по нему сам.
		pinEditMode(): void
		{
			if (!this.isCreateMode)
			{
				return;
			}

			const hero = this.$refs.hero as {
				isEditing: boolean,
				$watch?: (source: string, callback: (value: boolean) => void) => void,
			} | null;
			hero?.$watch?.('isEditing', (editing: boolean) => {
				if (!editing && isCreateEditPinned(this.isCreateMode, this.heroReadOnly))
				{
					hero.isEditing = true;
				}
			});
		},
		// Каретка в имени. Зовётся дважды: здесь, на монтаже, и ещё раз из app.ts по загрузке слайдера —
		// сам монтаж фокус не удерживает. Хаб живёт во фрейме слайдера, и на `load` фрейма слайдер
		// зовёт FocusTrap.applyInitialFocus() (slider.ts:2255). Ловушка сидит в РОДИТЕЛЬСКОМ документе:
		// её `container.contains(activeElement)` для узла из фрейма всегда false (focus-trap.ts:386-391),
		// поэтому ранний выход не срабатывает и фокус уезжает на контейнер слайдера — внутри фрейма
		// `document.activeElement` становится BODY. Повтор после этого события и ставит каретку.
		//
		// Повторный заход безопасен: `startEdit` у героя идемпотентен (openEditor снова выставляет тот же
		// isEditing и ре-фокусит поле), а primeTitleContent переписывает текст только при расхождении с
		// пропом `title` — набранное к этому моменту имя уже пришло обратно через update:title.
		focusTitle(): void
		{
			if (!this.isCreateMode)
			{
				return;
			}

			const hero = this.$refs.hero as { startEdit?: () => void } | null;
			hero?.startEdit?.();
		},
		handleTitleUpdate(value: string): void
		{
			const record = this.titleRecord;
			if (record)
			{
				this.$emit('update', { id: record.id, valueKey: record.valueKey, value });
			}
		},
		// Сохранение и отмена целиком за родителем: паспорт стора не знает и знать не должен —
		// наружу уходят события, решение принимает app.ts.
		handleSave(): void
		{
			this.$emit('save');
		},
		handleCancel(): void
		{
			this.$emit('cancel');
		},
		handleDescriptionUpdate(value: string): void
		{
			const update = buildPassportUpdate(this.records, 'crm-description', value);
			if (update)
			{
				this.$emit('update', update);
			}
		},
	},
	template: `
		<CrmHubPassportHero
			ref="hero"
			class="crm-automated-solution-hub-passport"
			:title="title"
			:title-label="titleLabelPhrase"
			:description="description"
			:description-placeholder="descriptionPlaceholder"
			limit-description
			icon="o-crm"
			:read-only="heroReadOnly"
			@update:title="handleTitleUpdate"
			@update:description="handleDescriptionUpdate"
		>
			<!--
				Описание правится на обоих экранах: на создании режим правки закреплён и textarea всегда под
				названием, на настройке его открывают карандаш или клик по тексту. Длину ограничивает кит
				(limit-description) по правилу поля; запрет правки и блокировку на время запроса даёт
				heroReadOnly, как у названия.
			-->
			<!--
				Кнопки создания — в слот #details героя, как «Сохранить» на эталоне создания СП (D-19):
				кит рисует его прямым потомком карточки под верхним рядом, через корневой gap и от левого
				края карточки, под картинкой. Слот #action того же места не даёт даром: он рисует
				тонированную строку __location с иконкой и пустой подписью, которую пришлось бы гасить.
				Кнопки теперь вне __content, и уход фокуса на них закрыл бы режим правки, — его держит
				закрепка pinEditMode().

				Отмены у панели кита на создании нет — панели нет вовсе, поэтому «Отменить» здесь своя.
				Фразы тоже свои: сообщения кита до шаблона не доезжают (см. lang/ru/template.php).
			-->
			<template v-if="isCreateMode" #details>
				<div class="crm-automated-solution-hub-passport__save">
					<UiButton
						:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CREATE_SAVE')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED"
						:loading="isWaiting"
						:disabled="isWaiting || !canSave"
						:dataset="{ testid: 'crm-automated-solution-hub-create-save-btn' }"
						@click="handleSave"
					/>
					<UiButton
						:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CREATE_CANCEL')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.PLAIN"
						:disabled="isWaiting"
						:dataset="{ testid: 'crm-automated-solution-hub-create-cancel-btn' }"
						@click="handleCancel"
					/>
				</div>
			</template>
			<!--
				Адрес — в слот placement (под названием и подписью), а НЕ в prop locationTitle: тот
				прогоняется через loc() и ждёт код фразы, поэтому URL там стал бы пустой строкой.
			-->
			<template v-if="hasAddress" #placement>
				<span
					class="crm-automated-solution-hub-passport__address"
					data-testid="crm-automated-solution-hub-passport-address"
				>
					<TextXs class="crm-automated-solution-hub-passport__address-label">{{ loc(addressRecord.title) }}</TextXs>
					<TextXs accent class="crm-automated-solution-hub-passport__address-value">{{ addressUrl }}</TextXs>
				</span>
			</template>
		</CrmHubPassportHero>
	`,
});

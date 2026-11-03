import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { hint } from 'ui.vue3.directives.hint';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Vue as ChipVue, ChipDesign, ChipSize } from 'ui.system.chip';
import { BLine } from 'ui.system.skeleton.vue';

import {
	availableScenarios,
	scenarioOfRow,
	type RelationOption,
	type RelationRow,
	type RelationScenario,
} from '../lib/relation-rows/relation-rows';
import {
	buildRelationConsequence,
	buildRelationSentence,
	buildScenarioLabel,
	splitFramePhrase,
	type RelationPhrase,
	type RelationPhraseChunk,
} from '../lib/relation-sentence/relation-sentence';
import {
	buildRelationPreviewCards,
	type RelationPreviewCard,
	type RelationPreviewCardKey,
} from '../lib/relation-preview-cards/relation-preview-cards';
import { resolveRelationOptionTitle } from '../lib/relation-option-title/relation-option-title';
import {
	resolveRelationPhrase,
	resolveRelationPhraseParts,
} from '../lib/relation-phrase-text/relation-phrase-text';
import { nextRelationCardKey } from '../lib/relation-card-tabs/relation-card-tabs';

// Chip берётся из РОДИТЕЛЬСКОГО экстеншна: у обёртки `ui.system.chip.vue` нет собранного бандла и
// нет `js` в конфиге, а namespace создаёт базовый `ui.system.chip` (он же реэкспортирует Vue-часть).
// У скелетона всё наоборот — своя сборка и свой namespace, поэтому BLine приходит прямо из
// `ui.system.skeleton.vue`.
const Chip = ChipVue.Chip;

// Внутренность включённой строки связи — «заход C» созвона, живущий внутри списка (D-61).
// Схема сверху снята: единицей раздела стала строка, и объясняет она себя сама.
//
// Четыре слоя, в порядке правки от 17.09:
//   1. ПРЕДЛОЖЕНИЕ — «У одной сделки может быть несколько элементов „Заявки на закупку 24“».
//      Одно предложение, как в прототипе, и подсвечены в нём ровно те половины, которые меняет
//      сценарий. Двусторонняя связь договаривает «и наоборот»: пересказывать ею подпись выбранной
//      кнопки («Оба главные») значило бы сказать одно и то же дважды.
//   2. СЦЕНАРИЙ — три AIR-чипсы БЕЗ заголовка над ними: подписи говорят сами за себя, а читалке имя
//      группы отдаёт aria-label. Стоят они последними в том же блоке, что и текст: сначала человек
//      читает, что за связь получилась, и уже потом выбирает другую. Подробности невыбранного
//      сценария — подсказкой при наведении. У контакта, компании и заказа сценарий один (D-58), и
//      переключателя тогда нет вовсе.
//   3. ЧТО ПОЗВОЛИТ — та же связь, пересказанная пользой, и стоит она ВПЛОТНУЮ к предложению: одна
//      голубая подложка на оба текста, без рамки, буквы синие (правка PM 17.09, вечер). Раньше это
//      были два разных куска — чёрная фраза и отдельная tinted-плашка ui.system.alert под
//      переключателем, — и объяснение стояло дальше от того, что объясняет, чем кнопки выбора.
//   4. ЧТО ПОЯВИТСЯ — МИНИАТЮРА ПОРТАЛА (D-63 + круг 5). Не список названий, а картинка: кадр
//      портала с обоями, шапкой и рабочей областью, внутри неё карточка, и опция — это
//      подсвеченное место на ней. Поля с дропдаунами, стоявшие здесь до вечера 17.09, отвечали на
//      «что за галочка», но не на «ГДЕ это появится», — а созвон N460476 спрашивал именно второе.
//
// ⚠ КРУГ 5 (D-69): РАСКРЫТИЯ БОЛЬШЕ НЕТ. Механика «Вклейки» отменена — миниатюра показывается
// сразу, без предварительного клика, и кнопки «Что появится» не существует. Поэтому у компонента
// нет ни пропа expanded, ни события toggle: включённая строка всегда показывает всё.
// Цена замерена и принята: строка выросла со 191 px (свёрнутая) до ~500 px. Подробности и почему
// ниже этой цифры не опуститься — в D-69.
//
// Порядок блоков задан правкой 25.09: ЧИПСЫ СЦЕНАРИЯ → МОКАП → ПРЕДЛОЖЕНИЕ с ПОЛЬЗОЙ. Выбор стоит
// первым, под ним — что он даёт на экране, и только внизу — связь словами, одним блоком с тем,
// зачем она.
//
// Переключатель карточек уехал в tab-navigation ШАПКИ мокапа — туда, где в настоящем Битриксе и
// живёт переход между разделами. Своего ряда табов строка больше не тратит.
//
// На корне стоит @click.stop: кликом по строке кит гасит связь (handleRowClick в feature-card.ts),
// а внутри есть текст, а не только кнопки, — клик по объяснению иначе выключал бы связь, о которой
// это объяснение рассказывает.
export const CrmTypeHubRelationRow = defineComponent({
	name: 'CrmTypeHubRelationRow',
	components: { BIcon, BLine, Chip },
	directives: { hint },
	mixins: [locMixin],
	props: {
		row: {
			type: Object as PropType<RelationRow>,
			required: true,
		},
		// Имя настраиваемого процесса. Не склоняется: падеж падает на слово «элемент», а имя стоит
		// в кавычках и в именительном (решение PM 17.09).
		processTitle: {
			type: String,
			default: '',
		},
	},
	emits: ['scenario', 'option'],
	setup(): Object
	{
		return { ChipDesign, ChipSize };
	},
	// Какую из двух карточек видно. Показывается одна, а не обе: миниатюра отвечает на «где это
	// появится», и две карточки рядом в 391 px были бы двумя нечитаемыми.
	data(): { previewCardKey: RelationPreviewCardKey }
	{
		return { previewCardKey: 'process' };
	},
	computed: {
		scenario(): RelationScenario | null
		{
			return scenarioOfRow(this.row);
		},
		scenarios(): RelationScenario[]
		{
			return availableScenarios(this.row);
		},
		// Куски предложения: подсвечиваются подставленные половины — то есть ровно то, что меняет
		// сценарий. Подсветка объясняет, на что смотреть, когда переключатель нажат.
		sentenceChunks(): RelationPhraseChunk[]
		{
			if (this.scenario === null)
			{
				return [];
			}

			const phrase = buildRelationSentence(
				this.scenario,
				this.row.entityTypeId,
				this.row.title,
				this.processTitle,
			);

			return splitFramePhrase(this.loc(phrase.code) ?? '', this.resolveParts(phrase));
		},
		consequence(): string
		{
			return this.scenario === null
				? ''
				: this.resolvePhrase(buildRelationConsequence(
					this.scenario,
					this.row.entityTypeId,
					this.row.title,
					this.processTitle,
				));
		},
		previewCards(): RelationPreviewCard[]
		{
			return buildRelationPreviewCards(this.row.options);
		},
		activeCard(): RelationPreviewCard
		{
			return this.previewCards.find((card) => card.key === this.previewCardKey) ?? this.previewCards[0];
		},
		// Таб объявляет карточку своей панелью, поэтому id обязан быть уникальным на всей странице,
		// а не только внутри строки. Идентификаторов панели раскрытия и пользы больше нет: раскрытия
		// нет вовсе, и объявлять кнопке нечего (D-69).
		cardId(): string
		{
			return `crm-type-hub-relation-card-${this.row.entityTypeId}`;
		},
	},
	methods: {
		resolveParts(phrase: RelationPhrase): Record<string, string>
		{
			return resolveRelationPhraseParts(phrase, (code) => this.loc(code));
		},
		resolvePhrase(phrase: RelationPhrase): string
		{
			return resolveRelationPhrase(phrase, (code) => this.loc(code));
		},
		scenarioLabel(scenario: RelationScenario): string
		{
			return this.resolvePhrase(buildScenarioLabel(scenario, this.row.entityTypeId, this.row.title));
		},
		// Подсказка при наведении договаривает то, на что у чипсы не хватает места: подпись говорит
		// «Процесс в лиде», подсказка — что это даст. Главное здесь НЕВЫБРАННЫЙ сценарий: его последствие
		// иначе не прочитать, не нажав его.
		//
		// В подсказке только польза, без самого предложения: на связи «сначала процесс» они
		// пересказывают друг друга слово в слово («У одного элемента „X“ может быть несколько
		// лидов» ≈ «Это позволит вести из одного элемента „X“ несколько лидов»).
		scenarioHint(scenario: RelationScenario): Object
		{
			const text = this.resolvePhrase(buildRelationConsequence(
				scenario,
				this.row.entityTypeId,
				this.row.title,
				this.processTitle,
			));

			// offsetTop — идиома CRM (тег карточки таймлайна). Текст не кодируем: директива сама
			// прогоняет его через Text.encode.
			return { text, popupOptions: { offsetTop: 5 } };
		},
		// Берёт строку, потому что parent-field и child-children-list называют сущность строки, а
		// две другие опции — процесс; без обоих имён опцию не разрешить.
		optionTitle(option: RelationOption): string
		{
			const label = resolveRelationOptionTitle(option, this.row.title, this.processTitle);

			return (this.loc(label.code) ?? '').replace('#TITLE#', () => label.title);
		},
		// Имя карточки на табе приходит из данных, а не из фразы: одну зовут именем настраиваемого
		// процесса, вторую — именем строки. Заголовки групп («В лиде», «В „Заявки на закупку 24“»)
		// миниатюре больше не нужны — карточку называет её таб.
		cardTitle(card: RelationPreviewCard): string
		{
			return card.key === 'process' ? this.processTitle : this.row.title;
		},
		selectCard(key: RelationPreviewCardKey): void
		{
			this.previewCardKey = key;
		},
		// Стрелки по ряду табов — обязанность роли tablist: неактивный таб выключен из Tab-обхода
		// (roving tabindex), и без стрелок до него было бы не добраться с клавиатуры вовсе.
		handleCardKeydown(event: KeyboardEvent): void
		{
			const next = nextRelationCardKey(
				this.previewCards.map((card) => card.key),
				this.previewCardKey,
				event.key,
			);
			if (next === null)
			{
				return;
			}

			event.preventDefault();

			this.selectCard(next);
			this.$nextTick(() => {
				const node = this.$el?.querySelector(`[data-card="${next}"]`);
				if (node instanceof HTMLElement)
				{
					node.focus();
				}
			});
		},
		// Место на миниатюре — это и есть выбор: клик по нему включает и выключает опцию. Отдельных
		// полей с дропдаунами больше нет (D-63).
		handleSpotClick(option: RelationOption): void
		{
			this.$emit('option', { option, checked: !option.checked });
		},
	},
	template: `
		<div v-if="scenario" class="crm-type-hub-relation-row" @click.stop>
			<div
				v-if="scenarios.length > 1"
				class="crm-type-hub-relation-row__switcher"
				role="group"
				:aria-label="loc('CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_TITLE')"
			>
				<button
					v-for="item in scenarios"
					:key="item"
					v-hint="scenarioHint(item)"
					type="button"
					class="crm-type-hub-relation-row__scenario"
					:aria-pressed="item === scenario ? 'true' : 'false'"
					:data-testid="'crm-type-detail-hub-relation-scenario-' + item + '-' + row.entityTypeId"
					@click="$emit('scenario', item)"
				>
					<Chip
						:text="scenarioLabel(item)"
						:design="item === scenario ? ChipDesign.Filled : ChipDesign.Outline"
						:size="ChipSize.Md"
						tabindex="-1"
					/>
				</button>
			</div>
			<div
				class="crm-type-hub-relation-preview --ui-context-edge-dark"
				:data-testid="'crm-type-detail-hub-relation-preview-' + row.entityTypeId"
			>
				<div class="crm-type-hub-relation-preview__bar">
					<BIcon
						class="crm-type-hub-relation-preview__glyph"
						name="o-hamburger-menu"
						:size="18"
						aria-hidden="true"
					/>
					<div
						class="crm-type-hub-relation-preview__tabs"
						role="tablist"
						:aria-label="loc('CRM_TYPE_DETAIL_HUB_RELATION_PREVIEW_TITLE')"
					>
						<button
							v-for="card in previewCards"
							:key="card.key"
							type="button"
							role="tab"
							class="crm-type-hub-relation-preview__tab"
							:class="{ '--on': card.key === previewCardKey }"
							:data-card="card.key"
							:aria-selected="card.key === previewCardKey ? 'true' : 'false'"
							:aria-controls="cardId"
							:aria-label="cardTitle(card)"
							:tabindex="card.key === previewCardKey ? 0 : -1"
							:data-testid="'crm-type-detail-hub-relation-preview-tab-' + card.key + '-' + row.entityTypeId"
							@click="selectCard(card.key)"
							@keydown="handleCardKeydown"
						>
							<span class="crm-type-hub-relation-preview__tab-name">{{ cardTitle(card) }}</span>
						</button>
					</div>
					<span class="crm-type-hub-relation-preview__plate --bar-name" aria-hidden="true"></span>
					<BIcon
						class="crm-type-hub-relation-preview__glyph --dim"
						name="o-clock"
						:size="16"
						aria-hidden="true"
					/>
					<span class="crm-type-hub-relation-preview__dot" aria-hidden="true"></span>
				</div>
				<div class="crm-type-hub-relation-preview__stage">
					<div class="crm-type-hub-relation-preview__menu" aria-hidden="true">
						<span class="crm-type-hub-relation-preview__plate --menu-glyph"></span>
						<span
							v-for="n in 5"
							:key="n"
							class="crm-type-hub-relation-preview__dot"
							:class="{ '--lit': n === 1 }"
						></span>
					</div>
					<div class="crm-type-hub-relation-preview__work --ui-context-content-light">
						<div class="crm-type-hub-relation-preview__work-bar" aria-hidden="true">
							<BLine class="crm-type-hub-relation-preview__sk --w4" />
							<span class="crm-type-hub-relation-preview__work-rest">
								<BLine class="crm-type-hub-relation-preview__sk --tab --w3" />
								<BLine class="crm-type-hub-relation-preview__sk --tab --w1" />
							</span>
						</div>
						<div class="crm-type-hub-relation-preview__stack">
							<span class="crm-type-hub-relation-preview__ghost" aria-hidden="true"></span>
							<div :id="cardId" class="crm-type-hub-relation-preview__card" role="tabpanel">
								<div class="crm-type-hub-relation-preview__head">
									<BLine class="crm-type-hub-relation-preview__sk --glyph" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w4" aria-hidden="true" />
									<div class="crm-type-hub-relation-preview__head-rest">
										<BLine class="crm-type-hub-relation-preview__sk --w3" aria-hidden="true" />
										<BLine class="crm-type-hub-relation-preview__sk --w1" aria-hidden="true" />
									</div>
								</div>
								<div class="crm-type-hub-relation-preview__tabs-row">
									<BLine class="crm-type-hub-relation-preview__sk --tab --w1" aria-hidden="true" />
									<button
										v-if="activeCard.tab"
										type="button"
										class="crm-type-hub-relation-preview__spot --tab"
										:class="activeCard.tab.checked ? '--on' : '--off'"
										:aria-pressed="activeCard.tab.checked ? 'true' : 'false'"
										:data-testid="'crm-type-detail-hub-relation-spot-' + activeCard.tab.id"
										@click="handleSpotClick(activeCard.tab)"
									>{{ optionTitle(activeCard.tab) }}</button>
									<BLine v-else class="crm-type-hub-relation-preview__sk --tab --w2" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --tab --w2" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --tab --w3" aria-hidden="true" />
								</div>
								<div class="crm-type-hub-relation-preview__body">
									<BLine class="crm-type-hub-relation-preview__sk --w5" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w6" aria-hidden="true" />
									<button
										v-if="activeCard.field"
										type="button"
										class="crm-type-hub-relation-preview__spot"
										:class="activeCard.field.checked ? '--on' : '--off'"
										:aria-pressed="activeCard.field.checked ? 'true' : 'false'"
										:data-testid="'crm-type-detail-hub-relation-spot-' + activeCard.field.id"
										@click="handleSpotClick(activeCard.field)"
									>{{ optionTitle(activeCard.field) }}</button>
									<BLine v-else class="crm-type-hub-relation-preview__sk --w4" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w5" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w6" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w5" aria-hidden="true" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="crm-type-hub-relation-row__statement">
				<p
					class="crm-type-hub-relation-row__sentence"
					:data-testid="'crm-type-detail-hub-relation-sentence-' + row.entityTypeId"
				><span class="crm-type-hub-relation-row__text"><template
					v-for="(chunk, index) in sentenceChunks"
					:key="index"
				><span
					v-if="chunk.slot"
					class="crm-type-hub-relation-row__slot"
				>{{ chunk.text }}</span><template v-else>{{ chunk.text }}</template></template></span></p>
				<p
					class="crm-type-hub-relation-row__consequence"
					:data-testid="'crm-type-detail-hub-relation-consequence-' + row.entityTypeId"
				>{{ consequence }}</p>
			</div>
		</div>
	`,
});

import { defineComponent, type Component, type PropType } from 'ui.vue3';
import { CrmHubCard, CrmHubControlRenderer, type SettingsRecord } from 'crm.settings-hub';

// Единственная рамка «оформленной секции» ЦРМ-хаба: белая карточка кита с шапкой (иконка +
// заголовок + шеврон) вокруг рядов, которые рисует ControlRenderer кита. Что отличается между
// разделами — ДАННЫЕ (cardId / title / icon / records), а не код, поэтому второй раздел не
// становится вторым файлом.
//
// Сетка фичкарточек с тумблерами тут не нужна: у ЦРМ нет булевых настроек (D-01), поэтому от
// движка СП-хаба взята только эта, вторая его половина.
export const CrmHubCrmSectionCard = defineComponent({
	name: 'CrmHubCrmSectionCard',
	components: { CrmHubCard, CrmHubControlRenderer },
	props: {
		cardId: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			default: '',
		},
		icon: {
			type: String,
			default: '',
		},
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
		controls: {
			type: Object as PropType<Record<string, Component>>,
			default: null,
		},
		// Режим создания рабочего места: содержимое раздела видно, но мертво. Признак приходит
		// снаружи уже защёлкнутым — компонент стор не читает и сам режим не вычисляет.
		isCreateMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update', 'action'],
	// `|| null` — не стиль, а защита. Vue ставит `false` на неизвестный ему булев атрибут как
	// `inert="false"`, а для HTML это ВСЁ РАВНО inert: экран настройки стал бы мёртвым. `null`
	// убирает атрибут совсем.
	//
	// Гасим на НАШЕЙ обёртке, а не на кит-секции: одна точка накрывает оба раздела
	// («Смарт-процессы» и «Главную страницу») — компонент один, инстансов два.
	template: `
		<div class="crm-automated-solution-hub-section" :inert="isCreateMode || null">
			<CrmHubCard :card-id="cardId" :title="title" :icon="icon" collapsible>
				<div class="crm-automated-solution-hub-section__rows">
					<CrmHubControlRenderer
						v-for="record in records"
						:key="record.id"
						:descriptor="record"
						:snapshot="snapshot"
						:read-only="readOnly"
						:controls="controls"
						@update="$emit('update', $event)"
						@action="$emit('action', $event)"
					/>
				</div>
			</CrmHubCard>
		</div>
	`,
});

import './catalog-item.css';
import { computed, ref, useTemplateRef, toValue } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { DragBlock } from 'ui.block-diagram';
import { Type } from 'main.core';
import type { DragData } from 'ui.block-diagram';
import { createUniqueId } from '../../../../shared/utils';
import type { Block } from '../../../../shared/types';
import { getDragItemSlotName } from '../../utils';
import type { GetDragItemSlotName } from '../../utils';
import type { CatalogMenuItem } from '../../types';
import { BLOCK_TYPES } from '../../../../entities/blocks';

type CatalogItemSetup = {
	preparedBlock: Block,
	catalogItemClassNames: { [string]: boolean },
	iconWrapperClassNames: { [string]: boolean },
	getDragItemSlotName: GetDragItemSlotName,
	getIconName: (name: ?string) => string,
	getIconColor: (colorIndex: ?Number) => ?string;
	isUrl: (value: string) => boolean,
	getSafeUrl: (url: string) => string | null,
	getBackgroundImage: (value: string) => Object,
	onDragStart: (event: DragEvent) => void,
	onDragEnd: (event: DragEvent) => void,
};

const CATALOG_ITEM_CLASS_NAMES = {
	base: 'editor-chart-catalog-item',
	active: '--active',
	drag: '--drag',
};

const ICON_WRAPPER_CLASS_NAMES = {
	base: 'editor-chart-catalog-item__icon-wrapper',
	bg_0: '--bg-0',
	bg_1: '--bg-1',
	bg_2: '--bg-2',
	bg_3: '--bg-3',
	bg_4: '--bg-4',
	bg_5: '--bg-5',
	bg_6: '--bg-6',
	bg_7: '--bg-7',
	bg_8: '--bg-8',
};

const ICON_COLORS = {
	0: '#9C5CEF',
	1: '#188AE6',
	2: '#E08907',
	3: '#8E96A2',
	4: '#3CB811',
	5: '#52BCBC',
	6: '#B4B959',
	7: '#FFFFFF',
	8: '#FFFFFF',
};

const DEFAULT_ICON_NAME = Outline.FOLDER;

// @vue/component
export const CatalogItem = {
	name: 'catalog-item',
	components: {
		BIcon,
	},
	directives: {
		DragBlock,
	},
	props: {
		/** @type CatalogMenuItem */
		item: {
			type: Object,
			required: true,
		},
		active: {
			type: Boolean,
			default: false,
		},
	},
	// eslint-disable-next-line max-lines-per-function
	setup(props): CatalogItemSetup
	{
		const iconSet = Outline;
		const draggedItem = useTemplateRef('draggedItem');
		const preparedBlock: Block = ref(getPreparedNewBlock(props.item));

		const catalogItemClassNames = computed((): { [string]: boolean } => ({
			[CATALOG_ITEM_CLASS_NAMES.base]: true,
			[CATALOG_ITEM_CLASS_NAMES.active]: props.active,
		}));

		const iconWrapperClassNames = computed((): { [string]: boolean } => {
			if (isUrl(props.item.icon))
			{
				return {
					[ICON_WRAPPER_CLASS_NAMES.base]: true,
					'--custom': true,
				};
			}

			const baseStyles = {
				[ICON_WRAPPER_CLASS_NAMES.base]: true,
				[ICON_WRAPPER_CLASS_NAMES.bg_0]: props.item.colorIndex === 0,
				[ICON_WRAPPER_CLASS_NAMES.bg_1]: props.item.colorIndex === 1,
				[ICON_WRAPPER_CLASS_NAMES.bg_2]: props.item.colorIndex === 2,
				[ICON_WRAPPER_CLASS_NAMES.bg_3]: props.item.colorIndex === 3,
				[ICON_WRAPPER_CLASS_NAMES.bg_4]: props.item.colorIndex === 4,
				[ICON_WRAPPER_CLASS_NAMES.bg_5]: props.item.colorIndex === 5,
				[ICON_WRAPPER_CLASS_NAMES.bg_6]: props.item.colorIndex === 6,
				[ICON_WRAPPER_CLASS_NAMES.bg_7]: props.item.colorIndex === 7,
				[ICON_WRAPPER_CLASS_NAMES.bg_8]: props.item.colorIndex === 8,
			};

			if (props.item.type === BLOCK_TYPES.TOOL)
			{
				baseStyles['--rounded'] = true;
			}

			return baseStyles;
		});

		const dragPayload = computed(() => ({
			dragData: preparedBlock,
			dragImage: draggedItem,
		}));

		function getIconName(name: ?string): string
		{
			if (name && Object.prototype.hasOwnProperty.call(iconSet, name))
			{
				return iconSet[name];
			}

			return DEFAULT_ICON_NAME;
		}

		function getIconColor(colorIndex: ?Number): ?string
		{
			if (colorIndex !== false && ICON_COLORS[colorIndex])
			{
				return ICON_COLORS[colorIndex];
			}

			return null;
		}

		function getBackgroundImage(url: string): Object
		{
			const safeUrl = getSafeUrl(url);
			if (!safeUrl)
			{
				return {};
			}

			return {
				'background-image': `url('${safeUrl}')`,
			};
		}

		function getPreparedNewBlock(item: CatalogMenuItem): Block
		{
			const id = createUniqueId();
			const {
				id: itemId,
				type,
				presetId,
				title,
				properties = {},
				returnProperties = [],
				colorIndex,
				icon = DEFAULT_ICON_NAME,
				defaultSettings: { width, height, ports = { input: [], output: [], aux: [], topAux: [] } },
			} = toValue(item);

			return {
				id,
				type,
				activity: {
					Name: id,
					Type: itemId,
					PresetId: presetId,
					Properties: {
						Title: title,
						...properties,
					},
					ReturnProperties: returnProperties || [],
					Activated: 'Y',
				},
				dimensions: {
					width,
					height,
				},
				position: {
					x: 0,
					y: 0,
				},
				ports,
				node: {
					colorIndex,
					icon,
					title,
					type,
				},
			};
		}

		function getDragPayload(): DragData
		{
			return {
				dragData: getPreparedNewBlock(props.item),
				dragImage: draggedItem,
			};
		}

		function isUrl(value: string): boolean
		{
			if (!value || !Type.isString(value))
			{
				return false;
			}

			return value.startsWith('https://');
		}

		function getSafeUrl(url: string): string | null
		{
			if (!url || !Type.isString(url))
			{
				return null;
			}

			const trimmedUrl = url.trim();

			const allowedProtocols = ['https://',];
			const isSafeProtocol = allowedProtocols.some((protocol) => trimmedUrl.startsWith(protocol));

			if (!isSafeProtocol)
			{
				return null;
			}

			return trimmedUrl;
		}

		return {
			dragPayload,
			preparedBlock,
			catalogItemClassNames,
			iconWrapperClassNames,
			getDragItemSlotName,
			getDragPayload,
			getIconName,
			getIconColor,
			isUrl,
			getBackgroundImage,
		};
	},
	template: `
		<div
			v-drag-block="getDragPayload"
			:class="catalogItemClassNames"
			:data-test-id="$testId('catalogItem', item.id)"
		>
			<div
				ref="draggedItem"
				class="editor-chart-catalog-item__drag-item"
			>
				<slot
					:name="getDragItemSlotName(preparedBlock.type)"
					:item="preparedBlock"
				/>
			</div>
			<div :class="iconWrapperClassNames">
				<div
					v-if="isUrl(item.icon)"
					:style="getBackgroundImage(item.icon)"
					class="ui-selector-item-avatar"
				/>
				<BIcon
					v-else
					:name="getIconName(item.icon)"
					:color="getIconColor(item.colorIndex)"
					:size="28"
					class="editor-chart-catalog-item__icon"
				/>
			</div>
			<div class="editor-chart-catalog-item__content">
				<div class="editor-chart-catalog-item__title">
					{{ item.title }}
				</div>
				<div
					v-if="item.subtitle"
					class="editor-chart-catalog-item__subtitle">
					{{ item.subtitle }}
				</div>
			</div>
		</div>
	`,
};

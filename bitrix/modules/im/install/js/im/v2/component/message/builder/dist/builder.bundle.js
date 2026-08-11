/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_message_base, im_v2_component_message_elements, im_v2_lib_feature, main_core, ui_iconSet_api_vue, im_v2_lib_parser, im_v2_component_animation, im_v2_const, ui_lottie) {
	'use strict';

	// @vue/component
	const BaseBlock = {
		name: 'BaseBlock',
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="bx-im-message-block-base__container">
			<slot></slot>
		</div>
	`
	};

	// @vue/component
	const MapBlock = {
		name: 'MapBlock',
		components: {
			BaseBlock,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			mapBlock() {
				return this.block;
			},
			hasStatus() {
				return main_core.Type.isStringFilled(this.mapBlock.status);
			},
			hasText() {
				return main_core.Type.isStringFilled(this.mapBlock.text);
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="block"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-map__container">
				<div class="bx-im-message-block-map__image-container">
					<img :src="mapBlock.imageUrl" :alt="mapBlock.text" class="bx-im-message-block-map__image">
					<div
						v-if="hasStatus"
						:title="mapBlock.status"
						class="bx-im-message-block-map__location-status --ellipsis"
					>
						{{ mapBlock.status }}
					</div>
				</div>
				<div v-if="hasText" class="bx-im-message-block-map__location">
					<BIcon :name="OutlineIcons.LOCATION" class="bx-im-message-block-map__location-icon" />
					<div
						:title="mapBlock.text" 
						class="bx-im-message-block-map__location-text --line-clamp-2"
					>
						{{ mapBlock.text }}
					</div>
				</div>
			</div>
		</BaseBlock>
	`
	};

	// @vue/component
	const TextBlock = {
		name: 'TextBlock',
		components: {
			BaseBlock,
			BuilderTextContent: im_v2_component_message_elements.BuilderTextContent,
			SourceHandler: im_v2_component_message_elements.SourceHandler
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			textBlock() {
				return this.block;
			},
			formattedText() {
				return im_v2_lib_parser.Parser.decodeText(this.textBlock.text);
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="textBlock"
			:dialogId="dialogId"
		>
			<SourceHandler :block="block" :messageId="message.id">
				<BuilderTextContent :text="formattedText" />
			</SourceHandler>
		</BaseBlock>
	`
	};

	const getTextColorClass = (listItem, listBlock) => {
		const color = listItem.color || listBlock.color || null;
		if (!im_v2_const.MessageBuilderPlainColorToken[color] || !im_v2_const.MessageBuilderGradientColorToken[color]) {
			return '';
		}
		return color ? `--color-${color}` : '';
	};

	const getIconColorClass = (listItem, listBlock) => {
		const itemIconColor = listItem.icon?.color;
		const blockIconColor = listBlock.icon?.color;
		const itemColor = listItem.color;
		const blockColor = listBlock.color;
		const color = itemIconColor || blockIconColor || itemColor || blockColor;
		if (!im_v2_const.MessageBuilderPlainColorToken[color]) {
			return '';
		}
		return color ? `--color-${color}` : '';
	};

	const DEFAULT_ICON = 'bullet';
	const IconMap = {
		arrow: ui_iconSet_api_vue.Outline.ARROW_RIGHT_L,
		search: ui_iconSet_api_vue.Outline.SEARCH
	};

	// @vue/component
	const ListItem = {
		name: 'ListItem',
		components: {
			BuilderTextContent: im_v2_component_message_elements.BuilderTextContent,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			block: {
				type: Object,
				required: true
			},
			item: {
				type: Object,
				required: true
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			listBlock() {
				return this.block;
			},
			listItem() {
				return this.item;
			},
			iconColorClass() {
				return getIconColorClass(this.listItem, this.listBlock);
			},
			textColorClass() {
				return getTextColorClass(this.listItem, this.listBlock);
			},
			formattedText() {
				return im_v2_lib_parser.Parser.decodeText(this.listItem.text);
			},
			itemIconType() {
				const iconType = this.listItem.icon?.type || this.listBlock.icon?.type;
				if (!IconMap[iconType]) {
					return DEFAULT_ICON;
				}
				return IconMap[iconType];
			},
			isDefaultIcon() {
				return this.itemIconType === DEFAULT_ICON;
			}
		},
		template: `
		<li class="bx-im-message-block-unordered-list-item__container">
			<span
				class="bx-im-message-block-unordered-list-item__marker"
				:class="iconColorClass"
			>
				<span 
					v-if="isDefaultIcon" 
					class="bx-im-message-block-unordered-list-item__bullet"
				>
					&bull;
				</span>
				<BIcon
					v-else
					:name="itemIconType"
					class="bx-im-message-block-unordered-list-item__icon"
				/>
			</span>
			<span :class="textColorClass">
				<BuilderTextContent :text="formattedText" />
			</span>
		</li>
	`
	};

	// @vue/component
	const UnorderedList = {
		name: 'UnorderedList',
		components: {
			ListItem
		},
		props: {
			block: {
				type: Object,
				required: true
			}
		},
		computed: {
			listBlock() {
				return this.block;
			}
		},
		template: `
		<ul class="bx-im-message-block-unordered-list__container">
			<ListItem
				v-for="(item, index) in listBlock.elements"
				:key="index"
				:block="listBlock"
				:item="item"
			/>
		</ul>
	`
	};

	// @vue/component
	const OrderedList = {
		name: 'OrderedList',
		components: {
			BuilderTextContent: im_v2_component_message_elements.BuilderTextContent
		},
		props: {
			block: {
				type: Object,
				required: true
			}
		},
		computed: {
			listBlock() {
				return this.block;
			}
		},
		methods: {
			getFormattedText(text) {
				return im_v2_lib_parser.Parser.decodeText(text);
			},
			getTextColorClass(item) {
				return getTextColorClass(item, this.listBlock);
			},
			getIconColorClass(item) {
				return getIconColorClass(item, this.listBlock);
			}
		},
		template: `
		<ol class="bx-im-message-block-ordered-list__container">
			<li
				v-for="(item, index) in listBlock.elements"
				:key="index"
				class="bx-im-message-block-ordered-list__item"
			>
				<span
					class="bx-im-message-block-ordered-list__marker"
					:class="getIconColorClass(item)"
				>{{ index + 1 }}.</span>
				<span :class="getTextColorClass(item)">
					<BuilderTextContent :text="getFormattedText(item.text)" />
				</span>
			</li>
		</ol>
	`
	};

	// @vue/component
	const ListBlock = {
		name: 'ListBlock',
		components: {
			BaseBlock,
			ExpandAnimation: im_v2_component_animation.ExpandAnimation,
			BIcon: ui_iconSet_api_vue.BIcon,
			SourceHandler: im_v2_component_message_elements.SourceHandler
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isOpened: true
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			listBlock() {
				return this.block;
			},
			listComponent() {
				const typeToComponent = {
					orderedList: OrderedList,
					unorderedList: UnorderedList
				};
				return typeToComponent[this.listBlock.type] ?? UnorderedList;
			},
			fold() {
				return this.listBlock.fold;
			},
			isFoldable() {
				return main_core.Type.isPlainObject(this.fold);
			},
			foldTitle() {
				return this.fold?.title ?? '';
			}
		},
		created() {
			this.isOpened = this.fold?.isOpened ?? true;
		},
		methods: {
			toggle() {
				this.isOpened = !this.isOpened;
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="listBlock"
			:dialogId="dialogId"
		>
			<div
				v-if="isFoldable"
				class="bx-im-message-block-list-fold__header"
				@click="toggle"
			>
				<div class="bx-im-message-block-list-fold__title">{{ foldTitle }}</div>
				<BIcon
					:name="OutlineIcons.CHEVRON_DOWN_L"
					:class="{ '--folded': !isOpened }"
					class="bx-im-message-block-list-fold__icon"
				/>
			</div>
			<ExpandAnimation>
				<div v-if="isOpened">
					<SourceHandler :block="listBlock" :messageId="message.id">
						<component :is="listComponent" :block="listBlock" />
					</SourceHandler>
				</div>
			</ExpandAnimation>
		</BaseBlock>
	`
	};

	// @vue/component
	const TitleBlock = {
		name: 'TitleBlock',
		components: {
			BaseBlock
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			titleBlock() {
				return this.block;
			},
			containerClasses() {
				const classes = [];
				if (this.titleBlock.color) {
					classes.push(`--color-${this.titleBlock.color}`);
				}

				// eslint-disable-next-line unicorn/explicit-length-check
				if (this.titleBlock.size) {
					classes.push(`--size-${this.titleBlock.size}`);
				}
				return classes;
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="titleBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-header__container" :class="containerClasses">
				<span
					:title="titleBlock.text"
					class="bx-im-message-block-header__text --line-clamp-3"
				>
					{{ titleBlock.text }}
				</span>
			</div>
		</BaseBlock>
	`
	};

	// @vue/component
	const LineDivider = {
		name: 'LineDivider',
		components: {
			BaseBlock
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			lineDividerBlock() {
				return this.block;
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="lineDividerBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-line-divider__container">
				<div class="bx-im-message-block-line-divider__line"></div>
			</div>
		</BaseBlock>
	`
	};

	// @vue/component
	const SpaceDivider = {
		name: 'SpaceDivider',
		components: {
			BaseBlock
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			spaceDividerBlock() {
				return this.block;
			},
			containerClasses() {
				return [`--size-${this.spaceDividerBlock.size}`];
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="spaceDividerBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-space-divider__container" :class="containerClasses"></div>
		</BaseBlock>
	`
	};

	// @vue/component
	const TableBlock = {
		name: 'TableBlock',
		components: {
			BaseBlock,
			BuilderTextContent: im_v2_component_message_elements.BuilderTextContent,
			SourceHandler: im_v2_component_message_elements.SourceHandler
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isNarrow: false,
				naturalWidth: 0
			};
		},
		computed: {
			tableBlock() {
				return this.block;
			},
			columnCount() {
				return this.tableBlock.rows[0].length ?? 1;
			}
		},
		mounted() {
			this.naturalWidth = this.measureNaturalWidth();
			this.initResizeObserver();
		},
		beforeUnmount() {
			this.resizeObserver.disconnect();
		},
		methods: {
			initResizeObserver() {
				this.resizeObserver = new ResizeObserver(([entry]) => {
					this.isNarrow = entry.contentRect.width < this.naturalWidth;
				});
				this.resizeObserver.observe(this.$refs.container.closest('.bx-im-message-base__wrap'));
			},
			measureNaturalWidth() {
				const COLUMN_GAP = 10;
				const tbody = this.$refs.container.querySelector('tbody');
				const gridTemplateColumns = getComputedStyle(tbody).gridTemplateColumns.split(' ');
				const [firstColumn, secondColumn] = gridTemplateColumns.map(element => {
					return parseFloat(element);
				});
				if (secondColumn) {
					return firstColumn + secondColumn + COLUMN_GAP;
				}
				return firstColumn;
			},
			getFormattedText(text) {
				return im_v2_lib_parser.Parser.decodeText(text);
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="tableBlock"
			:dialogId="dialogId"
		>
			<SourceHandler :block="block" :messageId="message.id">
				<div
					:class="{ '--narrow': isNarrow }"
					:style="{ '--im-message-builder-table-cols': columnCount }"
					ref="container"
					class="bx-im-message-block-table__container" 
				>
					<table class="bx-im-message-block-table__table">
						<tbody>
							<tr
								v-for="(row, rowIndex) in tableBlock.rows"
								:key="rowIndex"
							>
								<td
									v-for="(cell, cellIndex) in row"
									:key="cellIndex"
								>
									<BuilderTextContent
										:text="getFormattedText(cell.text)"
										class="--line-clamp-3"
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</SourceHandler>
		</BaseBlock>
	`
	};

	var fr = 60;
	var v = "5.9.6";
	var ip = 0;
	var op = 119;
	var w = 20;
	var h = 20;
	var nm = "bitrixgpt animation";
	var ddd = 0;
	var markers = [
	];
	var assets = [
		{
			nm: "[FRAME] bitrixgpt animation - Null / color - Null / Rectangle 240665030 - Null / Rectangle 240665030 / Rectangle 240665030 - Null / Rectangle 240665030 / Rectangle 240665030 - Null / Rectangle 240665030 / Rectangle 240665030 - Null / Rectangle 240665030 / Rectangle 240665030 - Null / Rectangle 240665030",
			fr: 60,
			id: "mn7jaykx8d3pzo8h",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "bitrixgpt animation - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "color - Null",
					sr: 1,
					parent: 8,
					ks: {
						a: {
							a: 0,
							k: [
								8,
								8
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								10,
								10
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 0.486,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.25
										]
									},
									i: {
										x: [
											0.5
										],
										y: [
											0.75
										]
									}
								},
								{
									t: 119.736,
									s: [
										360
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								-0.4422,
								6.9658
							]
						},
						r: {
							a: 0,
							k: -9.7722
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 11,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 10,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.2175,
												0.26666666666666666,
												0.6588235294117647,
												1,
												1,
												0.26666666666666666,
												0.48627450980392156,
												1,
												0.2175,
												1,
												1,
												0.4
											]
										}
									},
									s: {
										a: 0,
										k: [
											2.621579473192672,
											0.3766901861601525
										]
									},
									e: {
										a: 0,
										k: [
											4.815379404212134,
											9.99663191633054
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 12,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								6.2525,
								-0.61
							]
						},
						r: {
							a: 0,
							k: 62.5152
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 13,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 12,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.2175,
												0.3843137254901961,
												0.8431372549019608,
												0.996078431372549,
												1,
												0.3843137254901961,
												0.8431372549019608,
												0.996078431372549,
												0.2175,
												1,
												1,
												0.4
											]
										}
									},
									s: {
										a: 0,
										k: [
											3.104028036851783,
											0.7722080398253591
										]
									},
									e: {
										a: 0,
										k: [
											5.976973099035836,
											9.875584482622632
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 14,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								15.414,
								3.3644
							]
						},
						r: {
							a: 0,
							k: 133.8219
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 15,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 14,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.1621,
												1,
												0.6509803921568628,
												0,
												0.8136,
												1,
												0.6509803921568628,
												0,
												0.1621,
												1,
												0.8136,
												0.3
											]
										}
									},
									s: {
										a: 0,
										k: [
											3.3854617405731235,
											0.4432974655054862
										]
									},
									e: {
										a: 0,
										k: [
											6.031566431255089,
											9.33843307341526
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 16,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								14.4785,
								13.4146
							]
						},
						r: {
							a: 0,
							k: -154.0824
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 17,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 16,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.2272,
												0.8549019607843137,
												0.36470588235294116,
												1,
												1,
												0.7803921568627451,
												0.3254901960784314,
												0.9137254901960784,
												0.2272,
												1,
												1,
												0
											]
										}
									},
									s: {
										a: 0,
										k: [
											3.187980422349081,
											-0.25433631245205346
										]
									},
									e: {
										a: 0,
										k: [
											5.419462905652353,
											10.057472459776616
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 18,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								4.6642,
								15.6651
							]
						},
						r: {
							a: 0,
							k: -81.7154
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 19,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 18,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.226,
												0.23137254901960785,
												0.4627450980392157,
												1,
												1,
												0.3058823529411765,
												0.5019607843137255,
												1,
												0.226,
												1,
												1,
												0.1
											]
										}
									},
									s: {
										a: 0,
										k: [
											0.5311314392758093,
											0.7672309962979321
										]
									},
									e: {
										a: 0,
										k: [
											7.366772246863869,
											7.079478423523419
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "bitrixgpt animation",
			fr: 60,
			id: "mn7jaykuz286myi4",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 20,
					hd: false,
					nm: "bitrixgpt animation - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 21,
					hd: false,
					nm: "stars - Null",
					sr: 1,
					parent: 20,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								5.25,
								4.5
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 22,
					hd: false,
					nm: "stars",
					sr: 1,
					parent: 21,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													4.1551,
													1.3058
												],
												[
													5.1153,
													1.3058
												],
												[
													5.4979,
													2.714
												],
												[
													7.5434,
													4.8244
												],
												[
													8.9068,
													5.2203
												],
												[
													8.9068,
													6.2105
												],
												[
													7.5435,
													6.6055
												],
												[
													5.498,
													8.7169
												],
												[
													5.1154,
													10.1251
												],
												[
													4.1552,
													10.1251
												],
												[
													3.7726,
													8.7169
												],
												[
													1.7271,
													6.6055
												],
												[
													0.3638,
													6.2105
												],
												[
													0.3638,
													5.2203
												],
												[
													1.7272,
													4.8244
												],
												[
													3.7727,
													2.714
												],
												[
													4.1551,
													1.3058
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.1362,
													-0.5003
												],
												[
													0,
													0
												],
												[
													-0.9917,
													-0.2874
												],
												[
													0,
													0
												],
												[
													0.4847,
													-0.1406
												],
												[
													0,
													0
												],
												[
													0.2785,
													-1.0236
												],
												[
													0,
													0
												],
												[
													0.1364,
													0.5
												],
												[
													0,
													0
												],
												[
													0.9918,
													0.2874
												],
												[
													0,
													0
												],
												[
													-0.4849,
													0.1405
												],
												[
													0,
													0
												],
												[
													-0.2785,
													1.0236
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.1362899999999998,
													-0.50022
												],
												[
													0,
													0
												],
												[
													0.27853999999999957,
													1.02358
												],
												[
													0,
													0
												],
												[
													0.4847199999999994,
													0.1406200000000002
												],
												[
													0,
													0
												],
												[
													-0.9917300000000004,
													0.28739000000000026
												],
												[
													0,
													0
												],
												[
													-0.1362899999999998,
													0.5001099999999994
												],
												[
													0,
													0
												],
												[
													-0.27848000000000006,
													-1.0236799999999997
												],
												[
													0,
													0
												],
												[
													-0.48492,
													-0.14052000000000042
												],
												[
													0,
													0
												],
												[
													0.9916600000000002,
													-0.28742
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													7.9913,
													0.2547
												],
												[
													8.643,
													0.2547
												],
												[
													8.7154,
													0.5195
												],
												[
													9.4968,
													1.326
												],
												[
													9.7534,
													1.4008
												],
												[
													9.7534,
													2.0735
												],
												[
													9.4968,
													2.1473
												],
												[
													8.7154,
													2.9538
												],
												[
													8.643,
													3.2186
												],
												[
													7.9913,
													3.2186
												],
												[
													7.9198,
													2.9538
												],
												[
													7.1384,
													2.1473
												],
												[
													6.8818,
													2.0735
												],
												[
													6.8818,
													1.4008
												],
												[
													7.1384,
													1.3261
												],
												[
													7.9198,
													0.5196
												],
												[
													7.9913,
													0.2547
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.0926,
													-0.3396
												],
												[
													0,
													0
												],
												[
													-0.3788,
													-0.1098
												],
												[
													0,
													0
												],
												[
													0.3289,
													-0.0956
												],
												[
													0,
													0
												],
												[
													0.1064,
													-0.3909
												],
												[
													0,
													0
												],
												[
													0.0925,
													0.3399
												],
												[
													0,
													0
												],
												[
													0.3787,
													0.1098
												],
												[
													0,
													0
												],
												[
													-0.3293,
													0.0954
												],
												[
													0,
													0
												],
												[
													-0.1063,
													0.3909
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.09255999999999975,
													-0.3396
												],
												[
													0,
													0
												],
												[
													0.10636000000000045,
													0.39105
												],
												[
													0,
													0
												],
												[
													0.3288100000000007,
													0.09566999999999992
												],
												[
													0,
													0
												],
												[
													-0.37875999999999976,
													0.10976000000000008
												],
												[
													0,
													0
												],
												[
													-0.09244999999999948,
													0.33991000000000016
												],
												[
													0,
													0
												],
												[
													-0.10635999999999957,
													-0.39094000000000007
												],
												[
													0,
													0
												],
												[
													-0.32930999999999955,
													-0.0954299999999999
												],
												[
													0,
													0
												],
												[
													0.37868999999999975,
													-0.10986999999999991
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ddd: 0,
					ind: 23,
					ty: 0,
					nm: "color",
					refId: "mn7jaykx8d3pzo8h",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 20,
					h: 20,
					ip: 0,
					op: 120,
					st: 0,
					hd: false,
					bm: 0
				}
			]
		}
	];
	var layers = [
		{
			ty: 3,
			ddd: 0,
			ind: 20,
			hd: false,
			nm: "bitrixgpt animation - Null",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				o: {
					a: 0,
					k: 100
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				r: {
					a: 0,
					k: 0
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				}
			},
			ao: 0,
			ip: 0,
			op: 120,
			st: 0,
			bm: 0
		},
		{
			ddd: 0,
			ind: 2,
			ty: 0,
			nm: "bitrixgpt animation",
			refId: "mn7jaykuz286myi4",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 20,
			h: 20,
			ip: 0,
			op: 120,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var AiAssistantAnimation = {
		fr: fr,
		v: v,
		ip: ip,
		op: op,
		w: w,
		h: h,
		nm: nm,
		ddd: ddd,
		markers: markers,
		assets: assets,
		layers: layers,
		meta: meta
	};

	// @vue/component
	const AiAssistantSearch = {
		name: 'AiAssistantSearch',
		components: {
			BaseBlock
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			aiAssistantSearchBlock() {
				return this.block;
			}
		},
		mounted() {
			this.currentAnimation = ui_lottie.Lottie.loadAnimation({
				animationData: AiAssistantAnimation,
				container: this.$refs.animationContainer,
				renderer: 'svg',
				loop: true,
				autoplay: true
			});
		},
		beforeUnmount() {
			if (!this.currentAnimation) {
				return;
			}
			this.currentAnimation.destroy();
		},
		template: `
		<BaseBlock
			:message="message"
			:block="aiAssistantSearchBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-ai-assistant-search__container">
				<div class="bx-im-message-block-ai-assistant-search__title-container">
					<div class="bx-im-message-block-ai-assistant-search__icon" ref="animationContainer"></div>
					<div 
						:title="aiAssistantSearchBlock.title" 
						class="bx-im-message-block-ai-assistant-search__title --ellipsis"
					>
						{{ aiAssistantSearchBlock.title }}
					</div>
				</div>
				<div 
					:title="aiAssistantSearchBlock.text" 
					class="bx-im-message-block-ai-assistant-search__text --ellipsis"
				>
					{{ aiAssistantSearchBlock.text }}
				</div>
			</div>
		</BaseBlock>
	`
	};

	const UNKNOWN_BLOCK_TYPE = 'unknown';

	// @vue/component
	const BuilderMessage = {
		name: 'BuilderMessage',
		components: {
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			MessageFooter: im_v2_component_message_elements.MessageFooter,
			BaseMessage: im_v2_component_message_base.BaseMessage,
			DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent,
			ReactionSelector: im_v2_component_message_elements.ReactionSelector,
			MessageKeyboard: im_v2_component_message_elements.MessageKeyboard,
			SourceListButton: im_v2_component_message_elements.SourceListButton
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			withTitle: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			message() {
				return this.item;
			},
			messageBlocks() {
				return this.$store.getters['messages/builder/getBlocks'](this.message.id);
			},
			isAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isMessageBuilderAvailable);
			},
			hasKeyboard() {
				return this.message.keyboard.length > 0;
			}
		},
		methods: {
			getComponentNameByType(type) {
				const componentMap = {
					title: TitleBlock,
					text: TextBlock,
					unorderedList: ListBlock,
					orderedList: ListBlock,
					map: MapBlock,
					table: TableBlock,
					lineDivider: LineDivider,
					spaceDivider: SpaceDivider,
					aiAssistantSearch: AiAssistantSearch
				};
				return componentMap[type] || UNKNOWN_BLOCK_TYPE;
			}
		},
		template: `
		<BaseMessage :item="item" :dialogId="dialogId" :afterMessageWidthLimit="false">
			<template #before-message v-if="$slots['before-message']">
				<slot name="before-message"></slot>
			</template>
			<div class="bx-im-message-default__container">
				<MessageHeader :withTitle="withTitle" :item="item" />
				<DefaultMessageContent
					:item="item"
					:dialogId="dialogId"
					:withAttach="false"
					:withText="false"
				>
					<template v-if="isAvailable">
						<component
							v-for="(block, index) in messageBlocks"
							:is="getComponentNameByType(block.type)"
							:key="index"
							:message="message"
							:block="block"
							:dialogId="dialogId"
						/>
						<SourceListButton :messageBlocks="messageBlocks" />
					</template>
				</DefaultMessageContent>
			</div>
			<MessageFooter :item="item" :dialogId="dialogId" />
			<template #after-message v-if="hasKeyboard">
				<MessageKeyboard :item="item" :dialogId="dialogId" />
			</template>
		</BaseMessage>
	`
	};

	exports.BuilderMessage = BuilderMessage;

})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Lib, BX, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Const, BX.UI);
//# sourceMappingURL=builder.bundle.js.map

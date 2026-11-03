/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
(function (exports, main_core, ui_vue3, ui_vue3_mixins_locMixin, ui_system_typography_vue, main_date, ui_system_chip_vue) {
	'use strict';

	function createReadyNotifier(onReady) {
		let isNotified = false;
		return () => {
			if (isNotified) {
				return;
			}
			isNotified = true;
			onReady?.();
		};
	}

	function isTextTruncated(isExpanded, currentValue, scrollHeight, clientHeight) {
		return isExpanded ? currentValue : scrollHeight > clientHeight + 1;
	}

	const DEFAULT_LINE_CLAMP = 3;
	const CollapsibleText = ui_vue3.defineComponent({
		name: 'SocialnetworkProjectInfoCollapsibleText',
		components: {
			TextSm: ui_system_typography_vue.TextSm
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			text: {
				type: String,
				default: ''
			},
			lineClamp: {
				type: Number,
				default: DEFAULT_LINE_CLAMP
			},
			balanced: {
				type: Boolean,
				default: false
			},
			accent: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isTruncated: false,
				isExpanded: false,
				textId: `sonet-project-info-text-${main_core.Text.getRandom()}`,
				resizeObserver: null
			};
		},
		computed: {
			clampStyle() {
				return {
					'--sonet-project-info-line-clamp': this.lineClamp
				};
			},
			toggleText() {
				const phrase = this.isExpanded ? 'SONET_PROJECT_INFO_EMBED_TEXT_COLLAPSE' : 'SONET_PROJECT_INFO_EMBED_TEXT_EXPAND';
				return this.loc(phrase) ?? '';
			}
		},
		watch: {
			text() {
				this.isExpanded = false;
				void this.$nextTick(() => this.detectTruncation());
			}
		},
		mounted() {
			const element = this.textElement();
			if (element) {
				this.resizeObserver = ui_vue3.markRaw(new ResizeObserver(() => this.detectTruncation()));
				this.resizeObserver.observe(element);
			}
			this.detectTruncation();
		},
		updated() {
			this.detectTruncation();
		},
		beforeUnmount() {
			this.resizeObserver?.disconnect();
			this.resizeObserver = null;
		},
		methods: {
			textElement() {
				const element = this.$refs.text?.$el;
				return element instanceof HTMLElement ? element : null;
			},
			detectTruncation() {
				const element = this.textElement();
				if (element) {
					this.isTruncated = isTextTruncated(this.isExpanded, this.isTruncated, element.scrollHeight, element.clientHeight);
				}
			},
			handleToggle() {
				this.isExpanded = !this.isExpanded;
			}
		},
		template: `
		<div class="sonet-project-info-collapsible">
			<TextSm
				:id="textId"
				ref="text"
				:accent="accent"
				:title="isTruncated && !isExpanded ? text : null"
				class="sonet-project-info-collapsible-text"
				:class="{ '--expanded': isExpanded, '--balanced': balanced }"
				:style="clampStyle"
			>{{ text }}</TextSm>
			<button
				v-if="isTruncated"
				type="button"
				class="sonet-project-info-link-button sonet-project-info-collapsible__toggle"
				:aria-expanded="isExpanded ? 'true' : 'false'"
				:aria-controls="textId"
				data-testid="project-info-text-toggle"
				@click="handleToggle"
			>{{ toggleText }}</button>
		</div>
	`
	});

	function formatCalendarDate(date, formatTimestamp) {
		const timestamp = Date.UTC(date.year, date.month - 1, date.day) / 1000;
		return formatTimestamp(timestamp, true);
	}
	function formatProjectDates(dates, formatDate, loc) {
		if (!dates) {
			return '';
		}
		const start = dates.start ? formatDate(dates.start) : '';
		const finish = dates.finish ? formatDate(dates.finish) : '';
		if (start && finish) {
			return loc('SONET_PROJECT_INFO_EMBED_DATE_RANGE', {
				'#START#': start,
				'#FINISH#': finish
			}) ?? '';
		}
		if (start) {
			return loc('SONET_PROJECT_INFO_EMBED_DATE_FROM', {
				'#DATE#': start
			}) ?? '';
		}
		if (finish) {
			return loc('SONET_PROJECT_INFO_EMBED_DATE_TO', {
				'#DATE#': finish
			}) ?? '';
		}
		return '';
	}

	const DatesSection = ui_vue3.defineComponent({
		name: 'SocialnetworkProjectInfoDatesSection',
		components: {
			TextSm: ui_system_typography_vue.TextSm
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			dates: {
				type: Object,
				default: null
			}
		},
		computed: {
			formatted() {
				return formatProjectDates(this.dates, date => formatCalendarDate(date, (timestamp, utc) => {
					const format = main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT') || '';
					return main_date.DateTimeFormat.format(format, timestamp, null, utc);
				}), (phrase, replacements) => this.loc(phrase, replacements));
			}
		},
		template: `
		<TextSm v-if="formatted">{{ formatted }}</TextSm>
		<TextSm v-else class="sonet-project-info-empty">
			{{ loc('SONET_PROJECT_INFO_EMBED_DATES_EMPTY') }}
		</TextSm>
	`
	});

	const CHIP_GAP = 6;
	function pickMoreWidth(moreWidths, hiddenCount) {
		if (hiddenCount <= 0 || moreWidths.length === 0) {
			return 0;
		}
		const index = Math.min(String(hiddenCount).length, moreWidths.length) - 1;
		return moreWidths[index];
	}
	function layOutPrefixes(chipWidths, available, maxRows) {
		const layouts = [{
			rows: 1,
			used: 0
		}];
		let rows = 1;
		let used = 0;
		for (const width of chipWidths) {
			const extended = used === 0 ? width : used + CHIP_GAP + width;
			if (extended <= available || used === 0) {
				used = extended;
			} else {
				rows++;
				used = width;
			}
			if (rows > maxRows) {
				break;
			}
			layouts.push({
				rows,
				used
			});
		}
		return layouts;
	}
	function fitsWithToggle(layout, toggleWidth, available, maxRows) {
		if (toggleWidth <= 0) {
			return true;
		}
		const extended = layout.used === 0 ? toggleWidth : layout.used + CHIP_GAP + toggleWidth;
		return extended <= available || layout.used === 0 || layout.rows + 1 <= maxRows;
	}
	function calcVisibleTagCount(available, chipWidths, moreWidths, collapseWidth, maxRows) {
		const total = chipWidths.length;
		const layouts = layOutPrefixes(chipWidths, available, maxRows);
		if (layouts.length === total + 1) {
			return total;
		}
		for (let count = layouts.length - 1; count > 0; count--) {
			const toggleWidth = Math.max(pickMoreWidth(moreWidths, total - count), collapseWidth);
			if (fitsWithToggle(layouts[count], toggleWidth, available, maxRows)) {
				return count;
			}
		}
		return 0;
	}

	const MAX_COLLAPSED_ROWS = 2;
	const TagsSection = ui_vue3.defineComponent({
		name: 'SocialnetworkProjectInfoTagsSection',
		components: {
			Chip: ui_system_chip_vue.Chip,
			TextSm: ui_system_typography_vue.TextSm
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			tags: {
				type: Array,
				default: () => []
			}
		},
		setup() {
			return {
				ChipDesign: ui_system_chip_vue.ChipDesign,
				ChipSize: ui_system_chip_vue.ChipSize
			};
		},
		data() {
			return {
				visibleCount: this.tags.length,
				isExpanded: false,
				rowId: `sonet-project-info-tags-${main_core.Text.getRandom()}`,
				measuredWidth: -1,
				resizeObserver: null
			};
		},
		computed: {
			hasTags() {
				return this.tags.length > 0;
			},
			displayedTags() {
				return this.isExpanded ? this.tags : this.tags.slice(0, this.visibleCount);
			},
			hiddenCount() {
				return Math.max(this.tags.length - this.visibleCount, 0);
			},
			toggleText() {
				if (this.isExpanded) {
					return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_COLLAPSE') ?? '';
				}
				return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_MORE', {
					'#COUNT#': String(this.hiddenCount)
				}) ?? '';
			},
			toggleLabel() {
				if (this.isExpanded) {
					return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_COLLAPSE_ARIA') ?? '';
				}
				return main_core.Loc.getMessagePlural('SONET_PROJECT_INFO_EMBED_TAGS_MORE_ARIA', this.hiddenCount, {
					'#COUNT#': String(this.hiddenCount)
				}) ?? '';
			},
			measureMoreCounts() {
				const total = this.tags.length;
				if (total === 0) {
					return [];
				}
				const counts = [];
				for (let cap = 9; cap < total; cap = cap * 10 + 9) {
					counts.push(cap);
				}
				counts.push(total);
				return counts;
			},
			groupLabel() {
				return this.hasTags ? this.loc('SONET_PROJECT_INFO_EMBED_SECTION_TAGS') ?? null : null;
			},
			measureMoreTexts() {
				return this.measureMoreCounts.map(count => {
					return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_MORE', {
						'#COUNT#': String(count)
					}) ?? '';
				});
			},
			collapseText() {
				return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_COLLAPSE') ?? '';
			}
		},
		watch: {
			tags() {
				this.isExpanded = false;
				void this.$nextTick(() => this.recompute(true));
			},
			hiddenCount(value) {
				if (value > 0) {
					return;
				}
				this.isExpanded = false;
				this.keepFocusInSection();
			}
		},
		mounted() {
			const container = this.$refs.container;
			if (container instanceof HTMLElement) {
				this.resizeObserver = ui_vue3.markRaw(new ResizeObserver(() => this.recompute()));
				this.resizeObserver.observe(container);
			}
			this.recompute(true);
		},
		beforeUnmount() {
			this.resizeObserver?.disconnect();
			this.resizeObserver = null;
		},
		methods: {
			recompute(force = false) {
				const container = this.$refs.container;
				if (!(container instanceof HTMLElement)) {
					return;
				}
				const available = container.clientWidth;
				if (!force && available === this.measuredWidth) {
					return;
				}
				this.measuredWidth = available;
				const chipWidths = this.measureChipWidths();
				if (available <= 0 || chipWidths.length === 0) {
					this.visibleCount = this.tags.length;
					return;
				}
				this.visibleCount = this.calcVisibleCount(available, chipWidths, this.measureMoreWidths(), this.measureCollapseWidth());
			},
			elementOf(ref) {
				if (ref instanceof HTMLElement) {
					return ref;
				}
				const element = ref?.$el;
				return element instanceof HTMLElement ? element : null;
			},
			measureWidths(ref) {
				if (!Array.isArray(ref)) {
					return [];
				}
				return ref.map(item => this.elementOf(item)?.offsetWidth ?? 0);
			},
			measureChipWidths() {
				return this.measureWidths(this.$refs.measureChip);
			},
			measureMoreWidths() {
				return this.measureWidths(this.$refs.measureMore).sort((a, b) => a - b);
			},
			measureCollapseWidth() {
				return this.elementOf(this.$refs.measureCollapse)?.offsetWidth ?? 0;
			},
			calcVisibleCount(available, chipWidths, moreWidths, collapseWidth, maxRows = MAX_COLLAPSED_ROWS) {
				return calcVisibleTagCount(available, chipWidths, moreWidths, collapseWidth, maxRows);
			},
			handleToggle() {
				this.isExpanded = !this.isExpanded;
			},
			keepFocusInSection() {
				const toggleEl = this.elementOf(this.$refs.toggle);
				if (toggleEl === null || document.activeElement !== toggleEl) {
					return;
				}
				void this.$nextTick(() => {
					const container = this.$refs.container;
					if (container instanceof HTMLElement) {
						container.focus();
					}
				});
			}
		},
		template: `
		<div
			ref="container"
			class="sonet-project-info-tags"
			tabindex="-1"
			:role="hasTags ? 'group' : null"
			:aria-label="groupLabel"
		>
			<template v-if="hasTags">
				<div
					:id="rowId"
					class="sonet-project-info-tags__row"
					:class="{ '--expanded': isExpanded }"
					data-testid="project-info-tags-row"
				>
					<Chip
						v-for="tag in displayedTags"
						:key="tag"
						:text="tag"
						:size="ChipSize.Sm"
						:design="ChipDesign.OutlineNoAccent"
						trimmable
						rounded
						tabindex="-1"
						class="sonet-project-info-tags__chip"
						data-testid="project-info-tag"
					/>
					<button
						v-if="hiddenCount > 0"
						ref="toggle"
						type="button"
						class="sonet-project-info-link-button sonet-project-info-tags__toggle"
						:aria-expanded="isExpanded ? 'true' : 'false'"
						:aria-controls="rowId"
						:aria-label="toggleLabel"
						data-testid="project-info-tags-more"
						@click="handleToggle"
					>{{ toggleText }}</button>
				</div>
				<div ref="measurer" class="sonet-project-info-tags__measurer" aria-hidden="true">
					<Chip
						v-for="tag in tags"
						:key="tag"
						ref="measureChip"
						:text="tag"
						:size="ChipSize.Sm"
						:design="ChipDesign.OutlineNoAccent"
						trimmable
						rounded
						class="sonet-project-info-tags__chip"
					/>
					<button
						v-for="text in measureMoreTexts"
						:key="text"
						ref="measureMore"
						type="button"
						tabindex="-1"
						class="sonet-project-info-link-button sonet-project-info-tags__toggle"
					>{{ text }}</button>
					<button
						ref="measureCollapse"
						type="button"
						tabindex="-1"
						class="sonet-project-info-link-button sonet-project-info-tags__toggle"
					>{{ collapseText }}</button>
				</div>
			</template>
			<TextSm v-else class="sonet-project-info-empty">
				{{ loc('SONET_PROJECT_INFO_EMBED_TAGS_EMPTY') }}
			</TextSm>
		</div>
	`
	});

	const ProjectInfoBlock = ui_vue3.defineComponent({
		name: 'SocialnetworkProjectInfoBlock',
		components: {
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs,
			CollapsibleText,
			DatesSection,
			TagsSection
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			goal: {
				type: String,
				default: ''
			},
			description: {
				type: String,
				default: ''
			},
			dates: {
				type: Object,
				default: null
			},
			tags: {
				type: Array,
				default: () => []
			}
		},
		template: `
		<div class="sonet-project-info-block" data-testid="project-info-block-root">
			<span class="sonet-project-info-block__icon" aria-hidden="true"></span>
			<dl class="sonet-project-info-block__fields">
			<div class="sonet-project-info-block__section --lead" data-testid="project-info-goal">
					<dt class="sonet-project-info-visually-hidden">{{ loc('SONET_PROJECT_INFO_EMBED_SECTION_GOAL') }}</dt>
				<dd class="sonet-project-info-block__value">
					<CollapsibleText v-if="goal" :text="goal" balanced accent/>
					<TextSm v-else class="sonet-project-info-empty">
						{{ loc('SONET_PROJECT_INFO_EMBED_GOAL_EMPTY') }}
					</TextSm>
				</dd>
			</div>
			<div class="sonet-project-info-block__section" data-testid="project-info-description">
				<dt class="sonet-project-info-visually-hidden">{{ loc('SONET_PROJECT_INFO_EMBED_SECTION_DESCRIPTION') }}</dt>
				<dd class="sonet-project-info-block__value">
					<CollapsibleText v-if="description" :text="description"/>
					<TextSm v-else class="sonet-project-info-empty">
						{{ loc('SONET_PROJECT_INFO_EMBED_DESCRIPTION_EMPTY') }}
					</TextSm>
				</dd>
			</div>
			<div class="sonet-project-info-block__section" data-testid="project-info-dates">
				<TextXs tag="dt" accent class="sonet-project-info-block__label">
						{{ loc('SONET_PROJECT_INFO_EMBED_SECTION_DATES') }}
					</TextXs>
				<dd class="sonet-project-info-block__value">
					<DatesSection :dates="dates"/>
				</dd>
			</div>
			<div class="sonet-project-info-block__section" data-testid="project-info-tags">
				<TextXs tag="dt" accent class="sonet-project-info-block__label">
						{{ loc('SONET_PROJECT_INFO_EMBED_SECTION_TAGS') }}
					</TextXs>
				<dd class="sonet-project-info-block__value">
					<TagsSection :tags="tags"/>
				</dd>
			</div>
			</dl>
		</div>
	`
	});

	const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
	function mapCalendarDate(value) {
		if (!main_core.Type.isStringFilled(value)) {
			return null;
		}
		const match = value.match(CALENDAR_DATE_PATTERN);
		if (!match) {
			return null;
		}
		const year = Number(match[1]);
		const month = Number(match[2]);
		const day = Number(match[3]);
		const date = new Date(Date.UTC(year, month - 1, day));
		if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
			return null;
		}
		return {
			year,
			month,
			day
		};
	}
	function mapDtoToProjectViewInfo(dto) {
		const start = mapCalendarDate(dto.dateStart);
		const finish = mapCalendarDate(dto.dateFinish);
		const dates = start || finish ? {
			start,
			finish
		} : null;
		return {
			description: main_core.Type.isString(dto.description) ? dto.description : '',
			goal: main_core.Type.isString(dto.goal) ? dto.goal : '',
			dates,
			tags: main_core.Type.isArray(dto.tags) ? dto.tags.filter(tag => main_core.Type.isString(tag)) : []
		};
	}

	class ProjectViewInfoService {
		async get(projectId) {
			const response = await main_core.ajax.runAction('socialnetwork.V2.Project.getViewInfo', {
				json: {
					projectId
				}
			});
			return mapDtoToProjectViewInfo(response.data);
		}
	}
	const projectViewInfoService = new ProjectViewInfoService();

	async function loadProjectViewInfo(options) {
		let project = null;
		try {
			project = await projectViewInfoService.get(options.projectId);
		} catch {
			project = null;
		}
		if (options.isDestroyed()) {
			return;
		}
		if (project) {
			options.applyProject(project);
		}
		options.showContent();
		await options.waitForDomUpdate();
		if (!options.isDestroyed()) {
			options.onReady();
		}
	}

	const App = ui_vue3.defineComponent({
		name: 'SocialnetworkProjectInfoEmbedApp',
		components: {
			ProjectInfoBlock
		},
		props: {
			projectId: {
				type: Number,
				required: true
			},
			onReady: {
				type: Function,
				default: null
			}
		},
		data() {
			return {
				goal: '',
				description: '',
				tags: [],
				dates: null,
				isSettled: false,
				isDestroyed: false
			};
		},
		created() {
			void this.loadProject();
		},
		beforeUnmount() {
			this.isDestroyed = true;
		},
		methods: {
			async loadProject() {
				await loadProjectViewInfo({
					projectId: this.projectId,
					isDestroyed: () => this.isDestroyed,
					applyProject: project => this.applyProject(project),
					showContent: () => {
						this.isSettled = true;
					},
					waitForDomUpdate: () => this.$nextTick(),
					onReady: () => this.onReady?.()
				});
			},
			applyProject(project) {
				this.goal = project.goal;
				this.description = project.description;
				this.tags = project.tags;
				this.dates = project.dates;
			}
		},
		template: `
		<ProjectInfoBlock
			v-if="isSettled"
			:goal="goal"
			:description="description"
			:dates="dates"
			:tags="tags"
		/>
	`
	});

	function embedProjectInfo({
		projectId,
		onReady
	}) {
		let application = null;
		const notifyReady = createReadyNotifier(onReady);
		return {
			mount: container => {
				if (application !== null || !main_core.Type.isDomNode(container)) {
					return;
				}
				application = ui_vue3.BitrixVue.createApp(App, {
					projectId,
					onReady: notifyReady
				});
				application.mount(container);
			},
			unmount: () => {
				application?.unmount();
				application = null;
			}
		};
	}

	exports.embedProjectInfo = embedProjectInfo;

})(this.BX.Socialnetwork.V2.Application = this.BX.Socialnetwork.V2.Application || {}, BX, BX.Vue3, BX.Vue3.Mixins, BX.UI.System.Typography.Vue, BX.Main, BX.UI.System.Chip.Vue);
//# sourceMappingURL=project-info-embed.bundle.js.map

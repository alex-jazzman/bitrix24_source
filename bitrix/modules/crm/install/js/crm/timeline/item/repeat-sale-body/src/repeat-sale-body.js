// RepeatSale-only content block (redesigned body) of the timeline card.
// An extension of its own, loaded on demand by the RepeatSale controller of crm.timeline.item: the card
// is rare, and every page with a timeline would otherwise carry its component and styles.
// Registered via RepeatSale controller.getContentBlockComponents(); PHP renderer name: 'RepeatSaleBody'.
//
// Layout: copilot blob-gradient banner
//   [segment chip] -> action headline -> copilot suggestion reasoning panel
// followed by a purchase-history list in its own white area (expand / collapse).

import { NameService } from 'crm.ai.name-service';
import { ajax as Ajax, Type } from 'main.core';
import { FocusNavigator } from 'ui.a11y';
import { Hint } from 'ui.hint';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { HeadlineSm, Text2Xs, TextSm, TextXs } from 'ui.system.typography.vue';

import { ItemAction } from 'crm.timeline.item';

import './repeat-sale-body.css';

// Ids of the screen-reader copy of the segment description: several cards live in one timeline, and
// aria-describedby needs a target unique to the document.
let segmentDescriptionSeq = 0;

// @vue/component
export const RepeatSaleBody = {
	components: {
		Chip,
		HeadlineSm,
		Text2Xs,
		TextSm,
		TextXs,
	},
	props: {
		segmentName: { type: String, default: '' },
		segmentId: { type: Number, default: 0 },
		// Segment chip action, resolved server-side: open the segment or show the restriction
		// promo. The component knows nothing about permissions; no action means an inert chip.
		segmentAction: { type: Object, default: null },
		segmentDescription: { type: String, default: '' },
		// A string remains accepted while cached cards produced by the previous server contract expire.
		scenarioNote: { type: [Object, String], default: '' },
		action: { type: String, default: '' },
		reasoning: { type: String, default: '' },
		// Purchase-history rows. A row is { prod, prodRest, date, sum, url, isBase }: prod is the
		// visible part of the name and the only part linking to the deal, prodRest holds the
		// remaining product names the row unfolds behind its counter.
		history: { type: Array, default: () => [] },
		visibleCount: { type: Number, default: 2 },
		historyTotalHint: { type: String, default: '' },
		// A pushed card comes without history: one pull payload reaches every subscriber of the deal,
		// and the history depends on who is reading it. Such a card names its activity and the rows
		// are asked for separately, in a request of this very user.
		historyDeferred: { type: Boolean, default: false },
		activityId: { type: Number, default: 0 },
	},
	setup(): Object {
		return { ChipDesign, ChipSize, Outline };
	},
	data(): Object {
		segmentDescriptionSeq += 1;

		return {
			segmentDescriptionId: `crm-timeline-repeat-sale-segment-desc-${segmentDescriptionSeq}`,
			expanded: false,
			// Rows and hint the table showed last, with the activity they belong to (0 - they came with
			// the props). A pull update arrives without the history, so this is what stays on screen
			// until the deferred read answers for the reader of the card.
			shownHistory: null,
			// Activity the deferred read is in flight or already answered for, so a repeated update of
			// the same card asks for its history once.
			requestedActivityId: 0,
			// Rows whose composition is unfolded, keyed by the row position in the current history:
			// each row unfolds on its own, and collapsing the table must not shuffle that state.
			unfoldedRows: {},
		};
	},
	computed: {
		// The rows the table works with: the ones the card came with, or - while the card waits for its
		// deferred read - the last ones it showed, be they loaded for this reader or left from the
		// previous props. A full render tells the whole truth about the card, so an empty history there
		// empties the table: the purchases may have been deleted or become unreadable.
		historyRows(): Array {
			if (this.history.length > 0) {
				return this.history;
			}

			return this.historyDeferred ? this.shownHistory?.rows ?? [] : [];
		},
		historyHint(): string {
			if (this.history.length > 0) {
				return this.historyTotalHint;
			}

			return this.historyDeferred ? this.shownHistory?.hint ?? '' : '';
		},
		// Rows paired with their position in history, so a row keeps its identity no matter how
		// many of them the table currently shows.
		historyEntries(): Array {
			return this.historyRows.map((row, index) => ({ row, index }));
		},
		// Rows visible before expansion: the first visibleCount ones plus the base purchase,
		// the one the deal was created for. Filtering keeps the chronological order intact.
		collapsedEntries(): Array {
			return this.historyEntries.filter(({ row, index }) => index < this.visibleCount || row.isBase === true);
		},
		shownEntries(): Array {
			return this.expanded ? this.historyEntries : this.collapsedEntries;
		},
		hiddenCount(): number {
			return this.historyRows.length - this.collapsedEntries.length;
		},
		// First row hidden before the expansion: the base purchase is already shown collapsed,
		// so it is skipped even when it sits past visibleCount.
		firstRevealedIndex(): number {
			return this.historyRows.findIndex((row, index) => index >= this.visibleCount && row.isBase !== true);
		},
		segmentClassName(): Object {
			return { '--static': !this.segmentAction };
		},
		segmentRole(): ?string {
			return this.segmentAction ? 'button' : null;
		},
		segmentTabIndex(): number {
			return this.segmentAction ? 0 : -1;
		},
		// The description of the segment rule reaches a mouse user through the ui.hint tooltip, which
		// only listens to mouseenter. The same text is kept next to the chip for the accessibility tree.
		segmentDescriptionRef(): ?string {
			return this.segmentDescription ? this.segmentDescriptionId : null;
		},
		ariaExpanded(): string {
			return String(this.expanded);
		},
		suggestionTitle(): string {
			return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_COPILOT_SUGGESTION_TITLE', NameService.copilotNameReplacement());
		},
		historyTitle(): string {
			return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_HISTORY_TITLE');
		},
		// The base purchase is the one the deal was created for. Visually it is set apart by the
		// accent weight of its row, and weight alone says nothing to a screen reader.
		basePurchaseLabel(): string {
			return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_HISTORY_BASE_PURCHASE');
		},
		// Visible caption of the unfolded switch: short, because it stands inside the row. Its
		// accessible name says which list it closes - out of the row that is not obvious.
		restCollapseText(): string {
			return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_HISTORY_PRODUCTS_COLLAPSE_TEXT');
		},
		restCollapseLabel(): string {
			return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_HISTORY_PRODUCTS_COLLAPSE');
		},
		historyToggleText(): string {
			return this.expanded
				? this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_HISTORY_COLLAPSE')
				: this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_HISTORY_EXPAND', { '#COUNT#': this.hiddenCount });
		},
		disclaimer(): string {
			return this.$Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_COPILOT_DISCLAIMER', NameService.copilotNameReplacement());
		},
		scenarioNoteParts(): Object {
			if (Type.isString(this.scenarioNote)) {
				return {
					textBefore: this.scenarioNote,
					linkText: '',
					textAfter: '',
					href: '',
				};
			}

			const note = Type.isObject(this.scenarioNote) ? this.scenarioNote : {};

			return {
				textBefore: Type.isString(note.textBefore) ? note.textBefore : '',
				linkText: Type.isString(note.linkText) ? note.linkText : '',
				textAfter: Type.isString(note.textAfter) ? note.textAfter : '',
				href: Type.isString(note.href) ? note.href : '',
			};
		},
		hasScenarioNote(): boolean {
			return [
				this.scenarioNoteParts.textBefore,
				this.scenarioNoteParts.linkText,
				this.scenarioNoteParts.textAfter,
			].some((part) => part !== '');
		},
	},
	watch: {
		historyRows(): void {
			this.unfoldedRows = {};
		},
		history(): void {
			this.rememberShownHistory();
		},
		// A pull update reaches a card already on screen: the same block key and the same renderer, so
		// Vue updates the props of this very instance and mounted() does not run again.
		historyDeferred(): void {
			this.loadDeferredHistory();
		},
		activityId(activityId: number): void {
			// Rows read for another activity are not the history of this one.
			if (this.shownHistory?.activityId > 0 && this.shownHistory.activityId !== activityId) {
				this.shownHistory = null;
			}

			this.loadDeferredHistory();
		},
	},
	mounted(): void {
		if (this.segmentDescription && this.$refs.seg) {
			Hint.initNode(this.$refs.seg.$el);
		}

		this.rememberShownHistory();
		this.loadDeferredHistory();
	},
	methods: {
		rememberShownHistory(): void {
			if (this.history.length === 0) {
				return;
			}

			this.shownHistory = {
				rows: this.history,
				hint: this.historyTotalHint,
				activityId: this.activityId,
			};
		},
		// The rows the pushed card left out, read with the rights of whoever is looking at it. A failure
		// leaves the card as it is and lets the next update ask again: the history also returns with
		// the next full render of the timeline.
		loadDeferredHistory(): void {
			if (!this.historyDeferred || this.activityId <= 0 || this.requestedActivityId === this.activityId) {
				return;
			}

			const activityId = this.activityId;
			this.requestedActivityId = activityId;

			Ajax.runAction('crm.repeatsale.timelinecard.getPurchaseHistory', {
				data: { activityId },
			}).then((response) => {
				// The props may have moved on while the read was in flight: a full render brought the rows
				// itself, or the card stands for another activity by now. Either way the answer is no
				// longer the history of what is on screen.
				if (!this.historyDeferred || this.activityId !== activityId) {
					return;
				}

				const data = response?.data ?? null;
				if (!data) {
					return;
				}

				// The answer is what this reader may see, so it replaces the rows on screen even when
				// it brings none.
				this.shownHistory = {
					rows: Type.isArray(data.history) ? data.history : [],
					hint: Type.isString(data.historyTotalHint) ? data.historyTotalHint : '',
					activityId,
				};
			}).catch(() => {
				// Only the read that failed reopens the way to ask again: the marker may already belong to
				// a read started for another activity.
				if (this.requestedActivityId === activityId) {
					this.requestedActivityId = 0;
				}
			});
		},
		toggleHistory(): void {
			this.expanded = !this.expanded;

			if (this.expanded) {
				void this.$nextTick(() => this.focusFirstRevealedRow());
			}
		},
		// Keyboard users continue from the first row the expansion has just shown.
		focusFirstRevealedRow(): void {
			const row = this.$refs.hist?.querySelectorAll('.crm-timeline__repeat-sale-history-row')[this.firstRevealedIndex] ?? null;
			if (!row) {
				return;
			}

			if (FocusNavigator.focusFirst(row) === null) {
				FocusNavigator.focusContainer(row);
			}
		},
		executeSegmentAction(): void {
			if (!this.segmentAction) {
				return;
			}

			void new ItemAction(this.segmentAction).execute(this);
		},
		restCount(row: Object): number {
			return row.prodRest?.length ?? 0;
		},
		isRowUnfolded(index: number): boolean {
			return this.unfoldedRows[index] === true;
		},
		// The switch keeps its meaning and changes its place: folded it is the counter right after
		// the visible part of the name, unfolded it closes the composition it has just shown. The
		// node the click came from is gone by then, so focus follows to the one that took over.
		toggleRowProducts(index: number): void {
			this.unfoldedRows[index] = !this.isRowUnfolded(index);

			void this.$nextTick(() => this.focusRowProductsSwitch(index));
		},
		focusRowProductsSwitch(index: number): void {
			const position = this.shownEntries.findIndex((entry) => entry.index === index);
			const row = this.$refs.hist?.querySelectorAll('.crm-timeline__repeat-sale-history-row')[position] ?? null;

			FocusNavigator.focusTarget(row?.querySelector('.crm-timeline__repeat-sale-history-rest-toggle') ?? null);
		},
		// The rest continues the name, so it reads as one enumeration with the visible part.
		restText(row: Object): string {
			return `, ${row.prodRest.join(', ')}`;
		},
		// '+8' alone tells a screen reader nothing about what the control does.
		restExpandLabel(row: Object): string {
			return this.$Bitrix.Loc.getMessage(
				'CRM_TIMELINE_ITEM_REPEAT_SALE_HISTORY_PRODUCTS_EXPAND',
				{ '#COUNT#': this.restCount(row) },
			);
		},
	},
	// language=Vue
	template: `
		<div class="crm-timeline__repeat-sale-body" data-testid="crm-timeline-repeat-sale-card">

			<div class="crm-timeline__repeat-sale-banner" data-testid="crm-timeline-repeat-sale-banner">
				<div class="crm-timeline__repeat-sale-banner-bg" aria-hidden="true">
					<div class="crm-timeline__repeat-sale-banner-blob --b1"></div>
					<div class="crm-timeline__repeat-sale-banner-blob --b2"></div>
					<div class="crm-timeline__repeat-sale-banner-blob --b3"></div>
					<div class="crm-timeline__repeat-sale-banner-blob --b4"></div>
				</div>
				<div class="crm-timeline__repeat-sale-banner-top">
					<Chip
						ref="seg"
						class="crm-timeline__repeat-sale-segment"
						:class="segmentClassName"
						:design="ChipDesign.Filled"
						:size="ChipSize.Md"
						:icon="Outline.REPEAT_SALES"
						:text="segmentName"
						:role="segmentRole"
						:tabindex="segmentTabIndex"
						:data-hint="segmentDescription"
						:aria-describedby="segmentDescriptionRef"
						data-hint-no-icon
						data-testid="crm-timeline-repeat-sale-segment-chip"
						@click="executeSegmentAction"
						@keydown.space.prevent="executeSegmentAction"
					/>
					<span v-if="segmentDescription" class="crm-timeline__repeat-sale-sr-only" :id="segmentDescriptionId">{{ segmentDescription }}</span>
				</div>

				<HeadlineSm v-if="action" accent className="crm-timeline__repeat-sale-banner-headline" data-testid="crm-timeline-repeat-sale-action">{{ action }}</HeadlineSm>

				<div class="crm-timeline__repeat-sale-panel" v-if="reasoning" data-testid="crm-timeline-repeat-sale-suggestion">
					<div class="crm-timeline__repeat-sale-panel-head">
						<span class="crm-timeline__repeat-sale-panel-logo" aria-hidden="true"><svg viewBox="-0.922852 1.07692 29.8462 29.8461" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.8606 22.2719C10.0602 20.3681 10.1601 18.3827 10.3623 17.1158C10.5011 16.2467 11.1332 15.5778 12.009 15.4909C12.8162 15.4107 14.0212 15.4026 15.7128 15.6491C17.7355 15.9437 19.7935 16.6492 21.2314 17.222C22.0399 17.5442 22.0609 18.6294 21.292 19.0372C21.0386 19.1716 20.7701 19.3149 20.4939 19.4637C19.6095 19.9401 18.4603 20.5734 18.0177 20.8529C16.856 21.5865 16.1222 22.1435 15.6088 22.5196C15.0954 22.8956 12.1795 25.4093 10.8606 22.2719Z" fill="url(#rsg_p1)"/><path d="M20.83 19.72C18.7732 19.9061 16.9113 19.2095 15.7652 18.633C14.979 18.2375 14.533 17.4324 14.7154 16.5715C14.8836 15.7779 15.2409 14.627 15.9882 13.0896C16.8817 11.2511 18.1774 9.50355 19.1589 8.30677C19.7108 7.63381 20.7514 7.94256 20.9071 8.79884C20.9585 9.08108 21.0137 9.38032 21.0718 9.68864C21.2579 10.6758 21.5134 11.9628 21.6457 12.4693C21.9929 13.7986 22.3015 14.6666 22.5044 15.2699C22.7072 15.8731 24.2195 19.4134 20.83 19.72Z" fill="url(#rsg_p2)"/><path d="M21.5432 9.42066C21.0879 11.4351 19.8527 12.9926 18.9517 13.906C18.3337 14.5325 17.4305 14.7094 16.6673 14.2711C15.9639 13.8672 14.9786 13.1733 13.7453 11.9896C12.2706 10.5741 11.006 8.80396 10.1689 7.50205C9.69824 6.76999 10.3119 5.87472 11.1746 5.98978C11.459 6.0277 11.7607 6.06712 12.072 6.10659C13.0685 6.23297 14.3718 6.38558 14.8944 6.41539C16.266 6.49364 17.1869 6.46688 17.8233 6.45928C18.4597 6.45168 22.2934 6.10104 21.5432 9.42066Z" fill="url(#rsg_p3)"/><path d="M12.0783 5.58415C13.8405 6.66105 14.92 8.3303 15.4964 9.47644C15.8918 10.2627 15.7699 11.1749 15.1102 11.7574C14.5021 12.2942 13.529 13.0052 12.0125 13.794C10.199 14.7372 8.11693 15.3678 6.61541 15.7435C5.7711 15.9547 5.11976 15.0864 5.50524 14.3061C5.6323 14.0489 5.76634 13.7757 5.9035 13.4936C6.3426 12.5901 6.90485 11.4045 7.1006 10.919C7.61434 9.64478 7.88414 8.7639 8.08089 8.15867C8.27765 7.55344 9.17424 3.80951 12.0783 5.58415Z" fill="url(#rsg_p4)"/><path d="M5.42428 13.4999C6.98627 12.1488 8.9048 11.6284 10.172 11.428C11.0412 11.2905 11.8732 11.6842 12.2273 12.4899C12.5537 13.2325 12.9349 14.3757 13.2249 16.0603C13.5717 18.0748 13.5389 20.25 13.44 21.7946C13.3843 22.6632 12.359 23.0195 11.733 22.4149C11.5267 22.2156 11.3072 22.0048 11.0801 21.7883C10.3531 21.0951 9.39474 20.1988 8.99182 19.8647C7.9343 18.9876 7.17726 18.4626 6.66058 18.091C6.1439 17.7195 2.85024 15.7263 5.42428 13.4999Z" fill="url(#rsg_p5)"/><path d="M13.245 10.027C13.3858 9.52565 14.0965 9.52565 14.2372 10.027L14.633 11.4368C14.9209 12.4623 15.7223 13.2636 16.7477 13.5515L18.1575 13.9473C18.6589 14.088 18.6589 14.7988 18.1575 14.9395L16.7477 15.3353C15.7223 15.6232 14.9209 16.4245 14.633 17.45L14.2372 18.8598C14.0965 19.3611 13.3858 19.3611 13.245 18.8598L12.8492 17.45C12.5613 16.4245 11.76 15.6232 10.7346 15.3353L9.32474 14.9395C8.82339 14.7988 8.82339 14.088 9.32475 13.9473L10.7346 13.5515C11.76 13.2636 12.5613 12.4622 12.8492 11.4368L13.245 10.027Z" fill="white"/><path d="M17.2111 8.97428C17.3067 8.63382 17.7893 8.63382 17.8849 8.97428L17.9594 9.23954C18.0694 9.63123 18.3755 9.93733 18.7671 10.0473L19.0324 10.1218C19.3729 10.2173 19.3729 10.7 19.0324 10.7956L18.7671 10.87C18.3755 10.98 18.0694 11.2861 17.9594 11.6778L17.8849 11.9431C17.7893 12.2835 17.3067 12.2835 17.2111 11.9431L17.1366 11.6778C17.0267 11.2861 16.7206 10.98 16.3289 10.87L16.0636 10.7956C15.7232 10.7 15.7232 10.2173 16.0636 10.1218L16.3289 10.0473C16.7206 9.93733 17.0267 9.63123 17.1366 9.23954L17.2111 8.97428Z" fill="white"/><defs><linearGradient id="rsg_p0" x1="14.0002" y1="1.07692" x2="14.0002" y2="26.9231" gradientUnits="userSpaceOnUse"><stop stop-color="white"/><stop offset="1" stop-color="#E9F5FF"/></linearGradient><linearGradient id="rsg_p1" x1="10.0302" y1="19.3893" x2="22.6952" y2="21.2334" gradientUnits="userSpaceOnUse"><stop offset="0.225962" stop-color="#3B76FF"/><stop offset="1" stop-color="#4E80FF" stop-opacity="0.1"/></linearGradient><linearGradient id="rsg_p2" x1="17.8313" y1="19.6382" x2="23.4252" y2="8.1268" gradientUnits="userSpaceOnUse"><stop offset="0.22724" stop-color="#DA5DFF"/><stop offset="1" stop-color="#C753E9" stop-opacity="0"/></linearGradient><linearGradient id="rsg_p3" x1="20.5404" y1="12.2521" x2="11.3062" y2="3.39012" gradientUnits="userSpaceOnUse"><stop offset="0.162132" stop-color="#FFA600"/><stop offset="0.813577" stop-color="#FFA600" stop-opacity="0.3"/></linearGradient><linearGradient id="rsg_p4" x1="14.437" y1="7.43761" x2="3.08294" y2="13.3443" gradientUnits="userSpaceOnUse"><stop offset="0.217475" stop-color="#62D7FE"/><stop offset="1" stop-color="#62D7FE" stop-opacity="0.4"/></linearGradient><linearGradient id="rsg_p5" x1="7.90755" y1="11.8168" x2="10.0799" y2="24.4297" gradientUnits="userSpaceOnUse"><stop offset="0.217475" stop-color="#44A8FF"/><stop offset="1" stop-color="#447CFF" stop-opacity="0.4"/></linearGradient><filter id="rsg_d" x="-0.922852" y="1.07692" width="29.8462" height="29.8461" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="2"/><feGaussianBlur stdDeviation="1"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter></defs></svg></span>
						<TextSm accent className="crm-timeline__repeat-sale-panel-title">{{ suggestionTitle }}</TextSm>
					</div>
					<TextSm tag="div" className="crm-timeline__repeat-sale-panel-body" data-testid="crm-timeline-repeat-sale-suggestion-text">{{ reasoning }}</TextSm>
				</div>
			</div>

			<div class="crm-timeline__repeat-sale-history" v-if="historyRows.length" ref="hist" data-testid="crm-timeline-repeat-sale-history">
				<TextSm accent tag="div" className="crm-timeline__repeat-sale-history-head">{{ historyTitle }}</TextSm>
				<div v-for="{ row: h, index: i } in shownEntries" :key="i" class="crm-timeline__repeat-sale-history-row" data-testid="crm-timeline-repeat-sale-history-row">
					<div class="crm-timeline__repeat-sale-history-name">
						<TextSm v-if="h.url" tag="a" :accent="h.isBase" className="crm-timeline__repeat-sale-history-product" :href="h.url" target="_top" data-testid="crm-timeline-repeat-sale-history-product">{{ h.prod }}</TextSm>
						<TextSm v-else :accent="h.isBase" className="crm-timeline__repeat-sale-history-product" data-testid="crm-timeline-repeat-sale-history-product">{{ h.prod }}</TextSm>
						<span v-if="h.isBase" class="crm-timeline__repeat-sale-sr-only">{{ basePurchaseLabel }}</span>
						<TextSm
							v-if="restCount(h) > 0 && !isRowUnfolded(i)"
							tag="button"
							type="button"
							className="crm-timeline__repeat-sale-history-rest-toggle"
							aria-expanded="false"
							:aria-label="restExpandLabel(h)"
							data-testid="crm-timeline-repeat-sale-history-products-toggle"
							@click="toggleRowProducts(i)"
						>+{{ restCount(h) }}</TextSm>
						<template v-if="isRowUnfolded(i)">
							<TextSm className="crm-timeline__repeat-sale-history-rest" data-testid="crm-timeline-repeat-sale-history-products-rest">{{ restText(h) }}</TextSm>
							<TextSm
								tag="button"
								type="button"
								className="crm-timeline__repeat-sale-history-rest-toggle"
								aria-expanded="true"
								:aria-label="restCollapseLabel"
								data-testid="crm-timeline-repeat-sale-history-products-toggle"
								@click="toggleRowProducts(i)"
							>{{ restCollapseText }}</TextSm>
						</template>
					</div>
					<TextXs className="crm-timeline__repeat-sale-history-date" data-testid="crm-timeline-repeat-sale-history-date">{{ h.date }}</TextXs>
					<TextXs className="crm-timeline__repeat-sale-history-sum" data-testid="crm-timeline-repeat-sale-history-sum">{{ h.sum }}</TextXs>
				</div>
				<TextXs
					v-if="hiddenCount > 0"
					tag="button"
					type="button"
					className="crm-timeline__repeat-sale-history-more"
					:aria-expanded="ariaExpanded"
					data-testid="crm-timeline-repeat-sale-history-toggle"
					@click="toggleHistory"
				>{{ historyToggleText }}</TextXs>
				<Text2Xs v-if="historyHint" tag="div" className="crm-timeline__repeat-sale-history-total" data-testid="crm-timeline-repeat-sale-history-total">{{ historyHint }}</Text2Xs>
			</div>
			<Text2Xs tag="div" className="crm-timeline__repeat-sale-note" data-testid="crm-timeline-repeat-sale-disclaimer">{{ disclaimer }}</Text2Xs>
			<Text2Xs v-if="hasScenarioNote" tag="div" className="crm-timeline__repeat-sale-scenario" data-testid="crm-timeline-repeat-sale-scenario-note">{{ scenarioNoteParts.textBefore }}<a v-if="scenarioNoteParts.href && scenarioNoteParts.linkText" :href="scenarioNoteParts.href" target="_blank" rel="noopener noreferrer" data-testid="crm-timeline-repeat-sale-scenario-link">{{ scenarioNoteParts.linkText }}</a><template v-else>{{ scenarioNoteParts.linkText }}</template>{{ scenarioNoteParts.textAfter }}</Text2Xs>
		</div>
	`,
};

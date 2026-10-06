import { Type, Runtime, Dom } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { Text2Xs } from 'ui.system.typography.vue';
import { BInput, InputSize, InputDesign } from 'ui.system.input.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BMenu, type MenuOptions } from 'ui.system.menu.vue';

import { useLoc } from '../../../../shared/composables';
import { ReadableExpressions } from '../../directives/readable-expressions';

import { SourceList } from './source-list';
import {
	loadFunctionItems,
	getSystemVariableItems,
	getDocumentFieldItems,
	collectSchemaSourceItems,
	withFunctionArgument,
	type NodeContext,
	type SourceItem,
} from './expression-sources';
import {
	assembleFormula,
	buildPreview,
	parseExpression,
	describeFormulaParts,
	CALC_OP,
	CALC_OPERATIONS,
	PREVIEW_KIND,
	PREVIEW_WARNING,
} from './formula-assembler';
import {
	getApplicableModifiers,
	isSourceTypeKnown,
	findModifierById,
	applyModifier,
	MODIFIERS,
	type SourceTypes,
} from './modifier-catalog';

import './style.css';

export type ExpressionBuilderMode = 'functions' | 'calculator' | 'modification';

export const EXPRESSION_BUILDER_MODES: { [key: string]: ExpressionBuilderMode } = Object.freeze({
	functions: 'functions',
	calculator: 'calculator',
	modification: 'modification',
});

// Where an in-window source pick lands: a calculator operand or the modification source.
type PickTarget = 'A' | 'B' | 'modifier' | null;

type ModeItem = {
	id: ExpressionBuilderMode,
	title: string,
};

type Section = {
	id: string,
	title: string,
	items: Array<SourceItem>,
};

function matchModifierId(modifierText: ?string): ?string
{
	if (!Type.isStringFilled(modifierText))
	{
		return null;
	}

	const normalized = modifierText.trim().toLowerCase();
	const modifier = MODIFIERS.find(
		(item) => item.id === normalized || item.nameInCode.toLowerCase() === normalized,
	);

	return modifier?.id ?? null;
}

/**
 * The mode a saved value belongs to: a reference with an output modifier is what the modification
 * mode assembles, an arithmetic expression is what the calculator assembles. Everything else — a
 * function call, a hand-written expression, an empty value — starts in functions.
 */
export function resolveExpressionMode(value: string): ExpressionBuilderMode
{
	const parsed = parseExpression(value);

	if (parsed.kind === 'reference' && parsed.modifier)
	{
		return EXPRESSION_BUILDER_MODES.modification;
	}

	if (parsed.kind === 'arithmetic' && parsed.operationId)
	{
		return EXPRESSION_BUILDER_MODES.calculator;
	}

	return EXPRESSION_BUILDER_MODES.functions;
}

/**
 * Everything the value constructor shows: the assembled formula, the mode switch, the three mode
 * panels and the footer. Kept apart from the popup around it ({@see ExpressionBuilder}) so a host
 * with a window of its own — the data view "modify value" dialog — embeds the same body instead of
 * a second implementation of it.
 *
 * A host that drives the mode itself passes `mode` (the own switch is then not drawn) and takes the
 * value through `applyOnChange` (the own footer is then not drawn either).
 */
// @vue/component
export const ExpressionBuilderBody = {
	name: 'ExpressionBuilderBody',
	components: { Chip, UiButton, BInput, BMenu, SourceList, BxText2Xs: Text2Xs },
	directives: { ReadableExpressions },
	props:
	{
		initialValue:
		{
			type: String,
			default: '',
		},
		nodeContext:
		{
			type: Object,
			default: (): NodeContext => ({}),
		},
		/** Mode owned by the host: a filled one replaces the own switch, null keeps it. */
		mode:
		{
			type: String,
			default: null,
		},
		/** Source sections owned by the host; null collects them from the diagram. */
		sourceSections:
		{
			type: Array,
			default: null,
		},
		/** Emit `apply` on every assembled value instead of drawing the own footer. */
		applyOnChange:
		{
			type: Boolean,
			default: false,
		},
		/**
		 * The source the formula is about, as a reference. A host that binds the formula to something
		 * — the data view dialog binds it to a column — passes it, and every mode starts from it
		 * instead of from nothing. Empty for a host where the formula is about nothing in particular.
		 * A bound source is also fixed: modification applies to it and offers no source to pick.
		 */
		boundSource:
		{
			type: String,
			default: '',
		},
		/** Types of `boundSource` when the host knows them — what the modifier chips are filtered by. */
		boundSourceTypes:
		{
			type: Object,
			default: (): SourceTypes => ({ type: null, baseType: null }),
		},
		/**
		 * Names of the functions the host accepts — a host that takes only part of the catalog, as the
		 * data view does, passes them and the rest are not offered. `null` is the whole catalog.
		 */
		allowedFunctions:
		{
			type: Array,
			default: null,
		},
	},
	emits: ['apply', 'close'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			ChipSize,
			InputSize,
			InputDesign,
			AirButtonStyle,
			ButtonSize,
			EXPRESSION_BUILDER_MODES,
			CALC_OP,
		};
	},
	data(): {
		currentMode: ExpressionBuilderMode,
		operandA: string,
		operandB: string,
		operationId: string,
		modifierSource: string,
		modifierSourceTypes: SourceTypes,
		modifierId: ?string,
		pickingFor: PickTarget,
		functionItems: Array<SourceItem>,
		systemItems: Array<SourceItem>,
		schemaItems: Array<SourceItem>,
		documentItems: Array<SourceItem>,
		isLoadingFunctions: boolean,
		isLoadingSources: boolean,
		hasFunctionsError: boolean,
		isOperationMenuShown: boolean,
		operationMenuBindElement: ?HTMLElement,
		}
	{
		return {
			currentMode: EXPRESSION_BUILDER_MODES.functions,
			operandA: '',
			operandB: '',
			operationId: CALC_OP.add,
			modifierSource: '',
			modifierSourceTypes: { type: null, baseType: null },
			modifierId: null,
			pickingFor: null,
			functionItems: [],
			systemItems: [],
			schemaItems: [],
			documentItems: [],
			isLoadingFunctions: false,
			isLoadingSources: false,
			hasFunctionsError: false,
			isOperationMenuShown: false,
			operationMenuBindElement: null,
		};
	},
	computed:
	{
		activeMode(): ExpressionBuilderMode
		{
			return Type.isStringFilled(this.mode) ? this.mode : this.currentMode;
		},
		hasOwnModeSwitch(): boolean
		{
			return !Type.isStringFilled(this.mode);
		},
		modes(): Array<ModeItem>
		{
			return [
				{
					id: EXPRESSION_BUILDER_MODES.functions,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODE_FUNCTIONS'),
				},
				{
					id: EXPRESSION_BUILDER_MODES.calculator,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODE_CALCULATOR'),
				},
				{
					id: EXPRESSION_BUILDER_MODES.modification,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODE_MODIFICATION'),
				},
			];
		},
		operations(): Array<{ id: string, title: string }>
		{
			return CALC_OPERATIONS.map((operation) => ({
				id: operation.id,
				title: this.getMessage(operation.labelKey),
			}));
		},
		currentOperationTitle(): string
		{
			const operation = this.operations.find((item) => item.id === this.operationId);

			return operation ? operation.title : '';
		},
		operationMenuOptions(): MenuOptions
		{
			return {
				bindElement: (
					this.operationMenuBindElement
					|| this.getButtonElement('operationButton')
					|| this.$refs.operationAnchor
				),
				width: 220,
				// main.popup always gives the container role="dialog", so the menu needs its own name.
				ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_MENU_LABEL'),
				// The menu is a popup of its own in document.body, outside the window container the
				// window trap loops Tab inside, so without a trap around the menu itself its items
				// are unreachable from the keyboard. Closing it returns the focus to the button.
				// initialFocus: true is the first item; FocusTrap reads any string as a selector,
				// so the named 'first-tabbable' would fall back to focusing the container.
				focusTrap: {
					initialFocus: true,
					restoreFocus: () => this.getButtonElement('operationButton'),
				},
				autoHideHandler: this.shouldOperationMenuAutoHide,
				items: this.operations.map((operation) => ({
					title: operation.title,
					onClick: () => this.selectOperation(operation.id),
				})),
			};
		},
		/** Function names are lowercase on both sides, but the server compares them case-insensitively. */
		offeredFunctionItems(): Array<SourceItem>
		{
			if (!Type.isArray(this.allowedFunctions))
			{
				return this.functionItems;
			}

			const allowed = new Set(this.allowedFunctions.map((name) => String(name).toLowerCase()));

			return this.functionItems.filter((item) => allowed.has(item.title.toLowerCase()));
		},
		functionSections(): Array<Section>
		{
			return [{ id: 'functions', title: '', items: this.offeredFunctionItems }];
		},
		// A load failure is told apart from a portal without functions: the list must not pass an
		// empty result off as the answer when it never got one.
		functionsErrorText(): string
		{
			return this.hasFunctionsError
				? this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FUNCTIONS_LOAD_ERROR')
				: '';
		},
		collectedSourceSections(): Array<Section>
		{
			return [
				{
					id: 'documents',
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SECTION_DOCUMENT'),
					items: this.documentItems,
				},
				{
					id: 'schema',
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SECTION_SCHEMA'),
					items: this.schemaItems,
				},
				{
					id: 'system',
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SECTION_SYSTEM'),
					items: this.systemItems,
				},
			].filter((section) => Type.isArrayFilled(section.items));
		},
		visibleSourceSections(): Array<Section>
		{
			return this.sourceSections ?? this.collectedSourceSections;
		},
		isRoundOperation(): boolean
		{
			return this.operationId === CALC_OP.round;
		},
		secondOperandLabel(): string
		{
			return this.isRoundOperation
				? this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_N')
				: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_B');
		},
		canApplyCalculator(): boolean
		{
			return Type.isStringFilled(this.operandA.trim()) && Type.isStringFilled(this.operandB.trim());
		},
		assembledFormula(): string
		{
			return assembleFormula(this.operationId, [this.operandA.trim(), this.operandB.trim()]);
		},
		preview(): Object
		{
			return buildPreview([this.operandA.trim(), this.operandB.trim()], this.operationId);
		},
		previewText(): string
		{
			if (this.preview.kind === PREVIEW_KIND.dependsOnData)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_PREVIEW_DEPENDS');
			}

			if (this.preview.kind === PREVIEW_KIND.warning)
			{
				return this.preview.code === PREVIEW_WARNING.divByZero
					? this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_WARNING_DIV_ZERO')
					: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_WARNING_NAN');
			}

			return this.getMessage(
				'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_PREVIEW_RESULT',
				{ '#VALUE#': String(this.preview.value) },
			);
		},
		isPreviewWarning(): boolean
		{
			return this.preview.kind === PREVIEW_KIND.warning;
		},
		/**
		 * A guaranteed runtime error, so it is the only warning that blocks Apply: buildPreview
		 * raises div-by-zero for numeric literals only (any source-reference operand short-circuits
		 * to depends-on-data). not-a-number must NOT block — such an operand may well be a runtime
		 * numeric expression the preview cannot evaluate.
		 */
		isLiteralDivisionByZero(): boolean
		{
			return this.preview.kind === PREVIEW_KIND.warning
				&& this.preview.code === PREVIEW_WARNING.divByZero;
		},
		hasSelectedSource(): boolean
		{
			return Type.isStringFilled(this.modifierSource);
		},
		/** A host that binds the formula owns the source too: there is nothing here to pick or change. */
		isModifierSourceFixed(): boolean
		{
			return Type.isStringFilled(this.boundSource);
		},
		/** Types of the source in hand: known to the host for the one it binds, picked up with the rest. */
		modifierTypes(): SourceTypes
		{
			return this.modifierSource === this.boundSource ? this.boundSourceTypes : this.modifierSourceTypes;
		},
		/**
		 * Where a source pick lands right now. Modification opens on the source list, so the pick
		 * target is implied there; both the list and the pick handler must read this one value.
		 */
		pickTarget(): PickTarget
		{
			if (this.pickingFor !== null)
			{
				return this.pickingFor;
			}

			const isModification = this.activeMode === EXPRESSION_BUILDER_MODES.modification;

			return (isModification && !this.hasSelectedSource) ? 'modifier' : null;
		},
		isPickingModifierSource(): boolean
		{
			return this.pickTarget === 'modifier';
		},
		modifierList(): Array<Object>
		{
			return this.hasSelectedSource ? getApplicableModifiers(this.modifierTypes) : [];
		},
		showModifierWarning(): boolean
		{
			return this.hasSelectedSource && !isSourceTypeKnown(this.modifierTypes);
		},
		noModifiersForType(): boolean
		{
			return this.hasSelectedSource
				&& isSourceTypeKnown(this.modifierTypes)
				&& this.modifierList.length === 0;
		},
		selectedModifier(): ?Object
		{
			return findModifierById(this.modifierId);
		},
		modifierExpression(): string
		{
			return (this.hasSelectedSource && this.selectedModifier)
				? applyModifier(this.modifierSource, this.selectedModifier.wire)
				: '';
		},
		currentFormula(): string
		{
			if (this.activeMode === EXPRESSION_BUILDER_MODES.calculator && this.canApplyCalculator)
			{
				return this.assembledFormula;
			}

			if (this.activeMode === EXPRESSION_BUILDER_MODES.modification && this.modifierExpression)
			{
				return this.modifierExpression;
			}

			return this.initialValue ?? '';
		},
		formulaParts(): Array<{ type: string, text: string }>
		{
			return describeFormulaParts(this.currentFormula);
		},
		hasFormulaParts(): boolean
		{
			return this.formulaParts.length > 0;
		},
		canApplyCurrent(): boolean
		{
			if (this.activeMode === EXPRESSION_BUILDER_MODES.calculator)
			{
				return this.canApplyCalculator && !this.isLiteralDivisionByZero;
			}

			if (this.activeMode === EXPRESSION_BUILDER_MODES.modification)
			{
				return Type.isStringFilled(this.modifierExpression);
			}

			return false;
		},
	},
	watch:
	{
		previewText(text: string): void
		{
			if (this.canApplyCalculator)
			{
				this.announcePreview(text);
			}
		},
		showModifierWarning(shown: boolean): void
		{
			if (shown)
			{
				LiveAnnouncer.announce(
					this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_UNKNOWN_TYPE_WARNING'),
				);
			}
		},
		// Every state that re-creates the calculator buttons or changes what they announce, see
		// syncButtonsAria.
		activeMode: 'scheduleButtonsAriaSync',
		pickTarget(target: PickTarget): void
		{
			this.scheduleButtonsAriaSync();

			// Entering the source list is what the sources are collected for, see ensureSourcesLoaded.
			if (target !== null)
			{
				void this.ensureSourcesLoaded();
			}
		},
		secondOperandLabel: 'scheduleButtonsAriaSync',
		isOperationMenuShown: 'scheduleButtonsAriaSync',
		// A host that took the footer takes the value as it is assembled instead.
		currentFormula(formula: string): void
		{
			if (this.applyOnChange && this.canApplyCurrent)
			{
				this.$emit('apply', formula);
			}
		},
	},
	created(): void
	{
		this.prefillFromValue(this.initialValue);
		this.isDestroyed = false;
		// Not in data(): a promise is no part of the render state, see ensureSourcesLoaded.
		this.sourcesPromise = null;
		// Debounced: the preview changes on every keystroke, one announcement per pause is enough.
		// Runtime.debounce gives no cancel, so a pending call is dropped by the flag instead —
		// after the window is closed the announcement would read out a stale preview.
		this.announcePreview = Runtime.debounce((text: string) => {
			if (!this.isDestroyed)
			{
				LiveAnnouncer.announce(text);
			}
		}, 400, this);
		void this.loadFunctions();
	},
	mounted(): void
	{
		this.syncButtonsAria();
	},
	beforeUnmount(): void
	{
		this.isDestroyed = true;
	},
	methods:
	{
		/**
		 * UiButton builds its native button imperatively, so attributes put on the component in the
		 * template never reach it: they are written straight to the button elements. The whole
		 * markup is a slot of Popup, so this component itself never re-renders and cannot rely on
		 * updated(): every relevant state calls this through scheduleButtonsAriaSync.
		 *
		 * aria-haspopup is "dialog" because ui.system.menu renders a popup with role="dialog" and
		 * plain buttons inside, not a role="menu" list.
		 */
		syncButtonsAria(): void
		{
			const operationEl = this.getButtonElement('operationButton');
			Dom.attr(operationEl, 'aria-haspopup', 'dialog');
			Dom.attr(operationEl, 'aria-expanded', this.isOperationMenuShown ? 'true' : 'false');

			// Both source buttons carry the same text, so each one is named after its own operand.
			Dom.attr(
				this.getButtonElement('pickSourceA'),
				'aria-label',
				this.pickSourceLabel(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_A')),
			);
			Dom.attr(
				this.getButtonElement('pickSourceB'),
				'aria-label',
				this.pickSourceLabel(this.secondOperandLabel),
			);
		},
		scheduleButtonsAriaSync(): void
		{
			void this.$nextTick(this.syncButtonsAria);
		},
		getButtonElement(ref: string): ?HTMLElement
		{
			return this.$refs[ref]?.button?.getContainer?.() ?? null;
		},
		showOperationMenu(): void
		{
			this.operationMenuBindElement = this.getButtonElement('operationButton') || this.$refs.operationAnchor;
			this.isOperationMenuShown = true;
		},
		pickSourceLabel(operandLabel: string): string
		{
			return this.getMessage(
				'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_PICK_SOURCE_ARIA',
				{ '#OPERAND#': operandLabel },
			);
		},
		/**
		 * Outside click closes the operation menu, as the default handler of ui.system.menu does,
		 * but the focus stays where the click landed: the menu trap would otherwise pull it back to
		 * the operation button, off the control the user has just clicked.
		 */
		shouldOperationMenuAutoHide({ target }: MouseEvent): boolean
		{
			const popupInstance = this.$refs.operationMenu?.menu?.getPopup?.();
			const containerEl = popupInstance?.getPopupContainer?.();
			if (containerEl && Type.isDomNode(target) && (containerEl === target || containerEl.contains(target)))
			{
				return false;
			}

			popupInstance?.getFocusTrap?.()?.setRestoreFocus(false);

			return true;
		},
		focusSourceSearch(): void
		{
			void this.$nextTick(() => {
				this.$refs.sourceList?.focusSearch();
			});
		},
		// Leaving the source list drops the focused row from the DOM: put the focus on the control
		// that received the pick, so it does not fall back to the body.
		focusPickTarget(target: PickTarget): void
		{
			void this.$nextTick(() => {
				switch (target)
				{
					case 'A':
						this.$refs.operandA?.focus();
						break;
					case 'B':
						this.$refs.operandB?.focus();
						break;
					case 'modifier':
						this.$refs.sourceValue?.focus();
						break;
					default:
						break;
				}
			});
		},
		async loadFunctions(): Promise<void>
		{
			this.isLoadingFunctions = true;
			this.hasFunctionsError = false;
			try
			{
				this.functionItems = await loadFunctionItems();
			}
			catch
			{
				// The reason is already in the console (see loadFunctionItems); here it only has to
				// become a state the list can show instead of a plain "nothing found".
				this.hasFunctionsError = true;
			}
			finally
			{
				this.isLoadingFunctions = false;
			}
		},
		/**
		 * Sources are collected on the first entry into the source list, not when the window opens:
		 * it starts in Functions mode, while collecting walks the diagram ancestors and, on a cold
		 * cache, fetches the document fields. Memoized by the promise, so re-entering the list
		 * neither re-walks nor re-fetches, and a pick right after the entry waits for the same load.
		 */
		async ensureSourcesLoaded(): Promise<void>
		{
			if (this.sourceSections !== null)
			{
				return;
			}

			this.sourcesPromise ??= this.loadSources();

			await this.sourcesPromise;
		},
		async loadSources(): Promise<void>
		{
			this.systemItems = getSystemVariableItems(this.getMessage);
			this.schemaItems = collectSchemaSourceItems(this.nodeContext);

			const documentItems = getDocumentFieldItems();
			if (documentItems instanceof Promise)
			{
				this.isLoadingSources = true;
				try
				{
					this.documentItems = await documentItems;
				}
				finally
				{
					this.isLoadingSources = false;
				}
			}
			else
			{
				this.documentItems = documentItems;
			}
		},
		prefillFromValue(value: string): void
		{
			const parsed = parseExpression(value);

			if (parsed.kind === 'reference' && parsed.modifier)
			{
				this.currentMode = EXPRESSION_BUILDER_MODES.modification;
				this.modifierSource = `{=${parsed.object}:${parsed.field}}`;
				this.modifierSourceTypes = { type: null, baseType: null };
				this.modifierId = matchModifierId(parsed.modifier);
			}
			else if (parsed.kind === 'arithmetic' && parsed.operationId)
			{
				this.currentMode = EXPRESSION_BUILDER_MODES.calculator;
				this.operandA = parsed.operandA;
				this.operandB = parsed.operandB;
				this.operationId = parsed.operationId;
			}
			else if (!Type.isStringFilled(value) && Type.isStringFilled(this.boundSource))
			{
				// Only with nothing saved yet: a formula already built is what the user left here.
				this.operandA = this.boundSource;
			}

			if (this.isModifierSourceFixed && !Type.isStringFilled(this.modifierSource))
			{
				this.modifierSource = this.boundSource;
			}
		},
		modeDesign(modeId: ExpressionBuilderMode): string
		{
			return this.activeMode === modeId ? ChipDesign.OutlineAccent2 : ChipDesign.Outline;
		},
		modifierDesign(modifierId: string): string
		{
			return this.modifierId === modifierId ? ChipDesign.OutlineAccent2 : ChipDesign.Outline;
		},
		partClass(part: { type: string }): Array<string>
		{
			return ['bizprocdesigner-expression-builder__part', `--${part.type}`];
		},
		selectMode(modeId: ExpressionBuilderMode): void
		{
			this.currentMode = modeId;
			this.pickingFor = null;
		},
		selectOperation(operationId: string): void
		{
			this.operationId = operationId;
			this.isOperationMenuShown = false;
			this.operationMenuBindElement = null;
		},
		selectModifier(modifierId: string): void
		{
			this.modifierId = modifierId;
		},
		startPicking(target: PickTarget): void
		{
			this.pickingFor = target;
			this.focusSourceSearch();
		},
		cancelPicking(): void
		{
			const target = this.pickTarget;
			this.pickingFor = null;
			this.focusPickTarget(target);
		},
		applyPickedSource(item: SourceItem): void
		{
			const target = this.pickTarget;

			switch (target)
			{
				case 'A':
					this.operandA = item.value;
					break;
				case 'B':
					this.operandB = item.value;
					break;
				case 'modifier':
					this.modifierSource = item.value;
					this.modifierSourceTypes = { type: item.type ?? null, baseType: item.baseType ?? null };
					this.modifierId = null;
					break;
				default:
					break;
			}

			this.pickingFor = null;
			this.focusPickTarget(target);
		},
		handleSourceSelect(item: SourceItem): void
		{
			this.applyPickedSource(item);
		},
		applyFunction(item: SourceItem): void
		{
			if (Type.isStringFilled(item?.value))
			{
				this.$emit('apply', withFunctionArgument(item, this.boundSource));
			}
		},
		handleApply(): void
		{
			if (this.activeMode === EXPRESSION_BUILDER_MODES.calculator && this.canApplyCurrent)
			{
				this.$emit('apply', this.assembledFormula);

				return;
			}

			if (this.activeMode === EXPRESSION_BUILDER_MODES.modification && this.modifierExpression)
			{
				this.$emit('apply', this.modifierExpression);
			}
		},
		handleClose(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<div
			class="bizprocdesigner-expression-builder"
			data-testid="bizprocdesigner-expression-builder"
		>
			<div
				v-if="hasFormulaParts && !applyOnChange"
				class="bizprocdesigner-expression-builder__formula"
				data-testid="bizprocdesigner-expression-builder-formula"
			>
				<span
					v-for="(part, index) in formulaParts"
					:key="index"
					:class="partClass(part)"
				>{{ part.text }}</span>
			</div>
			<div
				v-if="hasOwnModeSwitch"
				class="bizprocdesigner-expression-builder__modes"
				role="group"
				:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODES_GROUP_LABEL')"
				data-testid="bizprocdesigner-expression-builder-modes"
			>
				<Chip
					v-for="mode in modes"
					:key="mode.id"
					:text="mode.title"
					:size="ChipSize.Md"
					:design="modeDesign(mode.id)"
					role="button"
					:aria-pressed="activeMode === mode.id"
					:data-testid="'bizprocdesigner-expression-builder-mode-' + mode.id"
					@click="selectMode(mode.id)"
					@keydown.space.prevent="selectMode(mode.id)"
				/>
			</div>
			<div class="bizprocdesigner-expression-builder__body">
				<div
					v-if="activeMode === EXPRESSION_BUILDER_MODES.functions"
					class="bizprocdesigner-expression-builder__mode-body"
					data-testid="bizprocdesigner-expression-builder-panel-functions"
				>
					<BxText2Xs tag="p" className="bizprocdesigner-expression-builder__hint">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FUNCTIONS_HINT') }}
					</BxText2Xs>
					<SourceList
						:sections="functionSections"
						:loading="isLoadingFunctions"
						:error="functionsErrorText"
						:searchPlaceholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FUNCTIONS_SEARCH_PLACEHOLDER')"
						data-testid="bizprocdesigner-expression-builder-function-list"
						@select="applyFunction"
					/>
				</div>
				<div
					v-else-if="activeMode === EXPRESSION_BUILDER_MODES.calculator"
					class="bizprocdesigner-expression-builder__mode-body"
					data-testid="bizprocdesigner-expression-builder-panel-calculator"
				>
					<SourceList
						v-if="pickingFor === 'A' || pickingFor === 'B'"
						ref="sourceList"
						:sections="visibleSourceSections"
						:loading="isLoadingSources"
						:searchPlaceholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SEARCH_PLACEHOLDER')"
						showBack
						data-testid="bizprocdesigner-expression-builder-source-list"
						@select="handleSourceSelect"
						@back="cancelPicking"
					/>
					<template v-else>
						<div class="bizprocdesigner-expression-builder__operand">
							<BInput
								ref="operandA"
								v-model="operandA"
								v-readable-expressions
								:size="InputSize.Sm"
								:design="InputDesign.Grey"
								:label="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_A')"
								:ariaLabel="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_A')"
								:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_PLACEHOLDER')"
								stretched
								data-testid="bizprocdesigner-expression-builder-operand-a"
							/>
							<UiButton
								ref="pickSourceA"
								:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_PICK_SOURCE')"
								:size="ButtonSize.EXTRA_SMALL"
								:style="AirButtonStyle.PLAIN_ACCENT"
								:dataset="{ testid: 'bizprocdesigner-expression-builder-pick-source-a' }"
								@click="startPicking('A')"
							/>
						</div>
						<div class="bizprocdesigner-expression-builder__operation">
							<div ref="operationAnchor" class="bizprocdesigner-expression-builder__operation-select">
								<UiButton
									ref="operationButton"
									:text="currentOperationTitle"
									:size="ButtonSize.SMALL"
									:style="AirButtonStyle.OUTLINE"
									dropdown
									wide
									:dataset="{ testid: 'bizprocdesigner-expression-builder-operation' }"
									@click="showOperationMenu"
								/>
							</div>
							<BMenu
								v-if="isOperationMenuShown"
								ref="operationMenu"
								:options="operationMenuOptions"
								@close="isOperationMenuShown = false; operationMenuBindElement = null"
							/>
						</div>
						<div class="bizprocdesigner-expression-builder__operand">
							<BInput
								ref="operandB"
								v-model="operandB"
								v-readable-expressions
								:size="InputSize.Sm"
								:design="InputDesign.Grey"
								:label="secondOperandLabel"
								:ariaLabel="secondOperandLabel"
								:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_PLACEHOLDER')"
								stretched
								data-testid="bizprocdesigner-expression-builder-operand-b"
							/>
							<UiButton
								v-if="!isRoundOperation"
								ref="pickSourceB"
								:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_PICK_SOURCE')"
								:size="ButtonSize.EXTRA_SMALL"
								:style="AirButtonStyle.PLAIN_ACCENT"
								:dataset="{ testid: 'bizprocdesigner-expression-builder-pick-source-b' }"
								@click="startPicking('B')"
							/>
						</div>
						<div
							v-if="canApplyCalculator"
							class="bizprocdesigner-expression-builder__preview"
							:class="{ '--warning': isPreviewWarning }"
							data-testid="bizprocdesigner-expression-builder-preview"
						>
							<BxText2Xs tag="p" className="bizprocdesigner-expression-builder__preview-text">
								{{ previewText }}
							</BxText2Xs>
						</div>
					</template>
				</div>
				<div
					v-else
					class="bizprocdesigner-expression-builder__mode-body"
					data-testid="bizprocdesigner-expression-builder-panel-modification"
				>
					<SourceList
						v-if="isPickingModifierSource"
						ref="sourceList"
						:sections="visibleSourceSections"
						:loading="isLoadingSources"
						:searchPlaceholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SEARCH_PLACEHOLDER')"
						:showBack="hasSelectedSource"
						data-testid="bizprocdesigner-expression-builder-source-list"
						@select="handleSourceSelect"
						@back="cancelPicking"
					/>
					<template v-else>
						<button
							v-if="!isModifierSourceFixed"
							ref="sourceValue"
							type="button"
							class="bizprocdesigner-expression-builder__source-value"
							:aria-label="getMessage(
								'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_CHANGE_SOURCE_ARIA',
								{ '#SOURCE#': modifierSource },
							)"
							:title="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_CHANGE_SOURCE')"
							data-testid="bizprocdesigner-expression-builder-source-value"
							@click="startPicking('modifier')"
						>
							<BxText2Xs tag="span">{{ modifierSource }}</BxText2Xs>
						</button>
						<div
							v-if="showModifierWarning"
							class="bizprocdesigner-expression-builder__warning"
							data-testid="bizprocdesigner-expression-builder-warning"
						>
							<BxText2Xs tag="p" className="bizprocdesigner-expression-builder__warning-text">
								{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_UNKNOWN_TYPE_WARNING') }}
							</BxText2Xs>
						</div>
						<div
							v-if="modifierList.length > 0"
							class="bizprocdesigner-expression-builder__operations"
							role="group"
							:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFIERS_GROUP_LABEL')"
							data-testid="bizprocdesigner-expression-builder-modifiers"
						>
							<Chip
								v-for="modifier in modifierList"
								:key="modifier.id"
								:text="getMessage(modifier.labelKey)"
								:size="ChipSize.Md"
								:design="modifierDesign(modifier.id)"
								role="button"
								:aria-pressed="modifierId === modifier.id"
								:data-testid="'bizprocdesigner-expression-builder-modifier-' + modifier.id"
								@click="selectModifier(modifier.id)"
								@keydown.space.prevent="selectModifier(modifier.id)"
							/>
						</div>
						<BxText2Xs
							v-else-if="noModifiersForType"
							tag="p"
							className="bizprocdesigner-expression-builder__hint"
							data-testid="bizprocdesigner-expression-builder-no-modifiers"
						>
							{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_NO_MODIFIERS') }}
						</BxText2Xs>
					</template>
				</div>
			</div>
			<div
				v-if="!applyOnChange"
				class="bizprocdesigner-expression-builder__footer"
				data-testid="bizprocdesigner-expression-builder-footer"
			>
				<UiButton
					v-if="activeMode !== EXPRESSION_BUILDER_MODES.functions"
					:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_APPLY')"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.FILLED"
					:disabled="!canApplyCurrent"
					:dataset="{ testid: 'bizprocdesigner-expression-builder-apply' }"
					@click="handleApply"
				/>
				<UiButton
					:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CANCEL')"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:dataset="{ testid: 'bizprocdesigner-expression-builder-cancel' }"
					@click="handleClose"
				/>
			</div>
		</div>
	`,
};

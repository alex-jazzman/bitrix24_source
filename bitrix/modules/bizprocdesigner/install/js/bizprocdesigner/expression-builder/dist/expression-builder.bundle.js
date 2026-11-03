/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_vue3_components_popup, ui_vue3, ui_a11y, ui_system_chip_vue, ui_iconSet_api_vue, ui_iconSet_outline, ui_designTokens, ui_system_typography_vue, ui_system_input_vue, ui_vue3_components_button, ui_system_menu_vue) {
	'use strict';

	function useLoc() {
		const app = ui_vue3.getCurrentInstance()?.appContext.app;
		const bitrix = app?.config?.globalProperties?.$bitrix ?? null;
		return {
			getMessage: (messageId, replacements) => {
				return bitrix?.Loc?.getMessage(messageId, replacements);
			}
		};
	}

	// @vue/component
	const SourceList = {
		name: 'ExpressionBuilderSourceList',
		components: {
			BInput: ui_system_input_vue.BInput,
			UiButton: ui_vue3_components_button.Button,
			BxTextXs: ui_system_typography_vue.TextXs,
			BxText2Xs: ui_system_typography_vue.Text2Xs
		},
		props: {
			sections: {
				type: Array,
				default: () => []
			},
			loading: {
				type: Boolean,
				default: false
			},
			// A filled string means the list could not be loaded: shown instead of the empty-state hint,
			// so a failure is not read as «there is nothing here».
			error: {
				type: String,
				default: ''
			},
			searchPlaceholder: {
				type: String,
				default: ''
			},
			showBack: {
				type: Boolean,
				default: false
			}
		},
		emits: ['select', 'back'],
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage,
				InputSize: ui_system_input_vue.InputSize,
				InputDesign: ui_system_input_vue.InputDesign,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				query: ''
			};
		},
		computed: {
			filteredSections() {
				const needle = this.query.trim().toLowerCase();
				return this.sections.reduce((acc, section) => {
					const items = needle === '' ? section.items : section.items.filter(item => this.matches(item, needle));
					if (main_core.Type.isArrayFilled(items)) {
						acc.push({
							id: section.id,
							title: section.title,
							items
						});
					}
					return acc;
				}, []);
			},
			hasResults() {
				return this.filteredSections.length > 0;
			}
		},
		watch: {
			loading: {
				handler(isLoading) {
					if (isLoading) {
						ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_LOADING'));
					}
				},
				// The list is usually created with the loading already under way.
				immediate: true
			},
			hasResults(has) {
				// Announced on the switch only: filtering runs on every keystroke.
				if (!has && !this.loading && !main_core.Type.isStringFilled(this.error)) {
					ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_EMPTY'));
				}
			},
			error(text) {
				if (main_core.Type.isStringFilled(text)) {
					ui_a11y.LiveAnnouncer.announce(text);
				}
			}
		},
		methods: {
			sectionTitleId(sectionId) {
				return `bizprocdesigner-expression-builder-source-section-${sectionId}`;
			},
			focusSearch() {
				this.$refs.search?.focus();
			},
			matches(item, needle) {
				const title = main_core.Type.isStringFilled(item.title) ? item.title.toLowerCase() : '';
				const subtitle = main_core.Type.isStringFilled(item.subtitle) ? item.subtitle.toLowerCase() : '';
				return title.includes(needle) || subtitle.includes(needle);
			},
			handleSelect(item) {
				this.$emit('select', item);
			},
			handleBack() {
				this.$emit('back');
			}
		},
		template: `
		<div class="bizprocdesigner-expression-builder-source-list">
			<div class="bizprocdesigner-expression-builder-source-list__toolbar">
				<UiButton
					v-if="showBack"
					class="bizprocdesigner-expression-builder-source-list__back"
					:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_BACK')"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:dataset="{ testid: 'bizprocdesigner-expression-builder-source-back' }"
					@click="handleBack"
				/>
				<BInput
					ref="search"
					v-model="query"
					class="bizprocdesigner-expression-builder-source-list__search"
					type="search"
					:size="InputSize.Sm"
					:design="InputDesign.Grey"
					:placeholder="searchPlaceholder"
					:ariaLabel="searchPlaceholder"
					stretched
					data-testid="bizprocdesigner-expression-builder-source-search"
				/>
			</div>
			<div
				class="bizprocdesigner-expression-builder-source-list__scroll"
				:aria-busy="loading ? 'true' : null"
				data-testid="bizprocdesigner-expression-builder-source-scroll"
			>
				<BxText2Xs
					v-if="loading"
					tag="p"
					className="bizprocdesigner-expression-builder-source-list__hint"
					data-testid="bizprocdesigner-expression-builder-source-loading"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_LOADING') }}
				</BxText2Xs>
				<BxText2Xs
					v-else-if="error"
					tag="p"
					className="bizprocdesigner-expression-builder-source-list__hint --error"
					data-testid="bizprocdesigner-expression-builder-source-error"
				>
					{{ error }}
				</BxText2Xs>
				<BxText2Xs
					v-else-if="!hasResults"
					tag="p"
					className="bizprocdesigner-expression-builder-source-list__hint"
					data-testid="bizprocdesigner-expression-builder-source-empty"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_EMPTY') }}
				</BxText2Xs>
				<div
					v-for="section in filteredSections"
					:key="section.id"
					class="bizprocdesigner-expression-builder-source-list__section"
					:role="section.title ? 'group' : null"
					:aria-labelledby="section.title ? sectionTitleId(section.id) : null"
					:data-testid="'bizprocdesigner-expression-builder-source-section-' + section.id"
				>
					<BxText2Xs
						v-if="section.title"
						:id="sectionTitleId(section.id)"
						tag="p"
						className="bizprocdesigner-expression-builder-source-list__section-title"
					>
						{{ section.title }}
					</BxText2Xs>
					<button
						v-for="item in section.items"
						:key="item.id"
						type="button"
						class="bizprocdesigner-expression-builder-source-list__item"
						:data-testid="'bizprocdesigner-expression-builder-source-item-' + item.id"
						@click="handleSelect(item)"
					>
						<BxTextXs
							tag="span"
							className="bizprocdesigner-expression-builder-source-list__item-title"
						>
							{{ item.title }}
						</BxTextXs>
						<BxText2Xs
							v-if="item.subtitle"
							tag="span"
							className="bizprocdesigner-expression-builder-source-list__item-subtitle"
						>
							{{ item.subtitle }}
						</BxText2Xs>
					</button>
				</div>
			</div>
		</div>
	`
	};

	// One record of the catalog bizproc publishes into the settings of `bp_selector`
	// (SystemProvider::getSystemValues(), bizproc/include.php). `label` is resolved on the server,
	// `type` is the real type of the value, string and int included.

	const BP_SELECTOR_EXTENSION = 'bp_selector';
	let pendingFunctionsLoad = null;

	/**
	 * Functions: plain data, no dialog. The editor page has `bp_selector` inlined already, so its
	 * settings are read straight from the DOM on every call — `Extension.getSettings()` caches what it
	 * parsed, so a repeated read is a lookup. The extension itself is loaded only when the settings are
	 * absent, because for a legacy CJSCore extension that costs an ajax round trip and re-runs the
	 * script: a portal whose function list is merely empty is a final answer and never pays for the
	 * load. Loading it at all stays rebuild-safe: an unimported legacy extension cannot live in the
	 * generated config.php `rel`. The load is memoized while in flight only — settings that arrive later
	 * must still be picked up, so a fruitless attempt does not block the next one. Insertion keeps the
	 * `{{=name()}}` shape (arguments typed by the user).
	 *
	 * A failed load rejects instead of passing an empty list off as the answer: "the portal has no
	 * functions" and "the list could not be fetched" are different things to show and the reason has to
	 * stay traceable.
	 */
	function loadFunctionItems() {
		const inlinedItems = readFunctionSettings();
		if (inlinedItems) {
			return Promise.resolve(inlinedItems);
		}
		if (pendingFunctionsLoad) {
			return pendingFunctionsLoad;
		}
		pendingFunctionsLoad = main_core.Runtime.loadExtension(BP_SELECTOR_EXTENSION).then(() => readFunctionSettings() ?? []).catch(error => {
			console.error(`expression builder: failed to load the ${BP_SELECTOR_EXTENSION} extension`, error);
			throw error;
		}).finally(() => {
			pendingFunctionsLoad = null;
		});
		return pendingFunctionsLoad;
	}

	/**
	 * `null` means «the settings are not on the page», as opposed to an empty array — «they are, and
	 * there are no functions». The inlined settings of `bp_selector` always carry the `functions` array
	 * (bizproc/include.php:30), so a missing or malformed key is a missing settings node.
	 */
	function readFunctionSettings() {
		const functions = main_core.Extension.getSettings(BP_SELECTOR_EXTENSION).get('functions');
		if (!main_core.Type.isArray(functions)) {
			return null;
		}
		return functions.reduce((acc, func) => {
			if (main_core.Type.isStringFilled(func?.name)) {
				acc.push({
					id: `fn:${func.name}`,
					title: func.name,
					subtitle: main_core.Type.isStringFilled(func.description) ? func.description : '',
					value: `{{=${func.name}()}}`,
					type: null,
					baseType: null,
					acceptsArguments: func.args !== false
				});
			}
			return acc;
		}, []);
	}

	/**
	 * Function items carry a call with empty parentheses, for a host where the user writes the arguments
	 * in afterwards. A host that already knows what the formula is about — the data view dialog, where
	 * the formula belongs to one column — passes that source and gets it as the first argument. A function
	 * declared to take no arguments (`true`, `false`) keeps its empty parentheses: anything inside them is
	 * a parse error.
	 */
	function withFunctionArgument(item, argument) {
		return item.acceptsArguments !== false && main_core.Type.isStringFilled(argument) ? item.value.replace('()', `(${argument})`) : item.value;
	}

	/**
	 * System values: the catalog the server publishes into the settings of `bp_selector`, captions
	 * included. Every record carries its real type, so Modification mode offers the modifiers of that
	 * type and nothing else: date, datetime and user have their own, string and int have none (CTR-01).
	 * A type left out would instead read as "unknown" there and offer all of them.
	 *
	 * The catalog itself is the host's to read and to pass in: on a page without the settings inlined it
	 * takes a load of `bp_selector`, and waiting for the server is an errand of the host that owns the
	 * sections, not of the window that shows them.
	 */
	function getSystemVariableItems(values) {
		return values.map(value => ({
			id: value.expression,
			title: main_core.Type.isStringFilled(value.label) ? value.label : value.expression,
			subtitle: value.expression,
			value: value.expression,
			// The declared types are bizproc base types themselves, so the two coincide here.
			type: value.type,
			baseType: value.type
		}));
	}

	// The single scan of a calculator expression inside the value builder: the draft model, the
	// highlight parts and the preview all read this one token stream, and no consumer parses again.

	const MAX_PARSE_LENGTH = 2000;

	// MAX_PARSE_LENGTH / 10: a nesting level the builder can produce costs at least ten characters
	// (`round(` plus `, N)`), so the limit is out of reach for any chain assembled by clicks and works
	// as a guard only for a value typed by hand.
	const MAX_PAREN_DEPTH = 200;
	const TOKEN_KIND = Object.freeze({
		formulaOpen: 'formula-open',
		formulaClose: 'formula-close',
		reference: 'reference',
		string: 'string',
		number: 'number',
		functionName: 'function-name',
		parenOpen: 'paren-open',
		parenClose: 'paren-close',
		comma: 'comma',
		operator: 'operator',
		text: 'text',
		space: 'space'
	});
	const FORMULA_OPEN = '{{=';
	const FORMULA_CLOSE = '}}';

	// Mirrors bizproc `CBPActivity::ValueSinglePattern` (`bizproc/classes/general/activity.php:42`):
	// `{=Object:Field}` with an optional `> mod1` and `, mod2`.
	const REFERENCE_SOURCE = '\\{=\\s*(\\w+)\\s*:\\s*([\\w.]+)(?:\\s*>\\s*([\\w:]+)(?:\\s*,\\s*(\\w+))?)?\\s*\\}';

	// A lexical pattern per token kind, tried top down at every position: the first match wins. Kinds
	// are lexical and not semantic on purpose - a predicate cannot say how `1.2.3`, `0x10` or a lone `-`
	// is cut. The operand kinds are disjoint from `\s`, so no kind ever swallows whitespace.
	// The number is the decimal form alone: the workflow parser (`bizproc/lib/Calc/Parser.php:151`)
	// reads a number as `[\d.]+` and fails on the exponent form, so `1e5` is a text like any other.
	const KIND_PATTERNS = Object.freeze([{
		kind: TOKEN_KIND.reference,
		source: REFERENCE_SOURCE,
		flags: 'diy'
	}, {
		kind: TOKEN_KIND.string,
		source: '"[^"]*"|\'[^\']*\'',
		flags: 'y'
	}, {
		kind: TOKEN_KIND.number,
		source: '\\d+(?:\\.\\d+)?(?![\\w.])',
		flags: 'y'
	}, {
		kind: TOKEN_KIND.functionName,
		source: '[_a-z]\\w*(?=\\s*\\()',
		flags: 'iy'
	}, {
		kind: TOKEN_KIND.parenOpen,
		source: '\\(',
		flags: 'y'
	}, {
		kind: TOKEN_KIND.parenClose,
		source: '\\)',
		flags: 'y'
	}, {
		kind: TOKEN_KIND.comma,
		source: ',',
		flags: 'y'
	}, {
		kind: TOKEN_KIND.operator,
		source: '[+\\-*/]',
		flags: 'y'
	}, {
		kind: TOKEN_KIND.text,
		source: '[^\\s(),{}"\'+\\-*/]+',
		flags: 'y'
	}, {
		kind: TOKEN_KIND.space,
		source: '\\s+',
		flags: 'y'
	}]);

	// One scanner per kind for the whole module: `matchKind` sets `lastIndex` right before every `exec`
	// and reads nothing the previous call left behind, so the shared instances hold no state between
	// scans - neither between two values, nor between a value and the fragments of its operands.
	const SCANNERS = KIND_PATTERNS.map(({
		kind,
		source,
		flags
	}) => {
		return {
			kind,
			regex: new RegExp(source, flags)
		};
	});
	const toOffsets = indices => {
		return indices ? {
			start: indices[0],
			end: indices[1]
		} : null;
	};

	/**
	 * Offsets of the reference parts, taken from the match itself: without them the highlight builder
	 * would have to cut the reference text with a grammar of its own, which is the second parse the
	 * single-scan invariant forbids.
	 */
	const readRefParts = match => {
		const indices = match.indices ?? [];
		return {
			object: toOffsets(indices[1]),
			field: toOffsets(indices[2]),
			modifier: toOffsets(indices[3]),
			secondModifier: toOffsets(indices[4])
		};
	};
	const createToken = (kind, value, start, end, extra = {}) => {
		return {
			kind,
			text: value.slice(start, end),
			start,
			end,
			depth: extra.depth ?? null,
			refParts: extra.refParts ?? null
		};
	};
	const failure = reason => {
		return {
			ok: false,
			tokens: [],
			reason
		};
	};
	const guardInput = value => {
		if (!main_core.Type.isStringFilled(value)) {
			return failure('empty');
		}

		// Before any pattern runs: the ceiling is the duty of the scanner and not of its caller.
		if (value.length > MAX_PARSE_LENGTH) {
			return failure('too-long');
		}
		return null;
	};
	const matchKind = (value, position) => {
		for (const scanner of SCANNERS) {
			scanner.regex.lastIndex = position;
			const match = scanner.regex.exec(value);
			if (match !== null) {
				return {
					kind: scanner.kind,
					match
				};
			}
		}
		return null;
	};
	const matchFormulaBrace = (value, position, openAt, closeEnd) => {
		if (position === openAt && value.startsWith(FORMULA_OPEN, position)) {
			return createToken(TOKEN_KIND.formulaOpen, value, position, position + FORMULA_OPEN.length);
		}

		// Only at the last non-space position: a `}}` anywhere else closes nothing.
		if (value.startsWith(FORMULA_CLOSE, position) && position + FORMULA_CLOSE.length === closeEnd) {
			return createToken(TOKEN_KIND.formulaClose, value, position, position + FORMULA_CLOSE.length);
		}
		return null;
	};

	/**
	 * One pass left to right, the index only growing. Covers the value character for character,
	 * whitespace included, so `tokens.map((token) => token.text).join('')` gives the input back.
	 */
	const scanTokens = value => {
		const openAt = value.search(/\S/);
		const closeEnd = value.trimEnd().length;
		const tokens = [];
		let position = 0;
		let depth = 0;
		while (position < value.length) {
			const brace = matchFormulaBrace(value, position, openAt, closeEnd);
			if (brace !== null) {
				tokens.push(brace);
				position = brace.end;
				continue;
			}
			const matched = matchKind(value, position);
			if (matched === null) {
				return failure('unknown-token');
			}
			const end = position + matched.match[0].length;
			switch (matched.kind) {
				case TOKEN_KIND.parenOpen:
					depth += 1;
					if (depth > MAX_PAREN_DEPTH) {
						return failure('too-deep');
					}
					tokens.push(createToken(matched.kind, value, position, end, {
						depth
					}));
					break;
				case TOKEN_KIND.parenClose:
					if (depth === 0) {
						return failure('unbalanced');
					}
					tokens.push(createToken(matched.kind, value, position, end, {
						depth
					}));
					depth -= 1;
					break;
				case TOKEN_KIND.reference:
					{
						const refParts = readRefParts(matched.match);
						tokens.push(createToken(matched.kind, value, position, end, {
							refParts
						}));
						break;
					}
				default:
					tokens.push(createToken(matched.kind, value, position, end));
			}
			position = end;
		}
		return depth === 0 ? {
			ok: true,
			tokens,
			reason: null
		} : failure('unbalanced');
	};
	const meaningfulTokens$1 = tokens => {
		return tokens.filter(token => token.kind !== TOKEN_KIND.space);
	};

	/**
	 * A value that is a single reference and nothing else: a field value the builder opens for
	 * modification rather than as a formula, and the one stream shape without the formula braces.
	 */
	const isSingleReferenceStream = tokens => {
		const meaningful = meaningfulTokens$1(tokens);
		return meaningful.length === 1 && meaningful[0].kind === TOKEN_KIND.reference;
	};
	const isFormulaStream = tokens => {
		const hasOpen = tokens.some(token => token.kind === TOKEN_KIND.formulaOpen);
		const hasClose = tokens.some(token => token.kind === TOKEN_KIND.formulaClose);
		return hasOpen && hasClose || isSingleReferenceStream(tokens);
	};

	/**
	 * Tokens of a whole field value. An empty and an unparsable value are different outcomes: the
	 * prefill of the builder stands on the difference.
	 */
	const tokenizeExpression = value => {
		const guarded = guardInput(value);
		if (guarded !== null) {
			return guarded;
		}
		const scanned = scanTokens(value);
		if (!scanned.ok) {
			return scanned;
		}
		return isFormulaStream(scanned.tokens) ? scanned : failure('not-a-formula');
	};

	/**
	 * The same scanner over a piece of a value - one operand of the chain - where the formula braces of
	 * a whole value are not expected.
	 */
	const tokenizeFragment = value => {
		return guardInput(value) ?? scanTokens(value);
	};

	// The flat n-ary draft of a calculator formula: operands, one sign per gap between neighbours and
	// non-overlapping, non-nested groups. Assembly, reading back, preview and highlight parts all live
	// here, over the single token stream of `expression-tokenizer`. No `eval` and no `new Function`:
	// the preview computes over parsed numeric literals with plain math.

	const CALC_OP = Object.freeze({
		add: 'add',
		subtract: 'subtract',
		multiply: 'multiply',
		divide: 'divide',
		round: 'round'
	});

	// Operation id -> assembly metadata. `symbol` is the infix operator (null for round, whose scope is
	// the whole prefix of the chain) and the only field the assembly reads. `displaySymbol` is the sign
	// shown in the chain: a display-only field, never part of an assembled expression.
	const CALC_OPERATIONS = Object.freeze([{
		id: CALC_OP.add,
		symbol: '+',
		displaySymbol: '+',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ADD'
	}, {
		id: CALC_OP.subtract,
		symbol: '-',
		displaySymbol: '−',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_SUB'
	}, {
		id: CALC_OP.multiply,
		symbol: '*',
		displaySymbol: '×',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_MUL'
	}, {
		id: CALC_OP.divide,
		symbol: '/',
		displaySymbol: '÷',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_DIV'
	}, {
		id: CALC_OP.round,
		symbol: null,
		displaySymbol: '≈',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ROUND'
	}]);
	const PREVIEW_KIND = Object.freeze({
		value: 'value',
		dependsOnData: 'depends-on-data',
		warning: 'warning'
	});
	const PREVIEW_WARNING = Object.freeze({
		notANumber: 'not-a-number',
		divByZero: 'div-by-zero'
	});
	const FORMULA_PART = Object.freeze({
		brace: 'brace',
		function: 'function',
		source: 'source',
		modifier: 'modifier',
		operator: 'operator',
		number: 'number',
		value: 'value',
		plain: 'plain',
		paren: 'paren'
	});
	const ROUND_FUNCTION_NAME = 'round';
	const OPERATION_BY_ID = new Map(CALC_OPERATIONS.map(operation => [operation.id, operation]));
	const OPERATION_BY_SYMBOL = Object.freeze({
		'+': CALC_OP.add,
		'-': CALC_OP.subtract,
		'*': CALC_OP.multiply,
		'/': CALC_OP.divide
	});

	/**
	 * The kinds of token a term is made of - the operands the workflow parser reads and no others
	 * (`bizproc/lib/Calc/Parser.php`): unquoted text is a syntax error there, so `abc`, `1e5` and `0x10`
	 * are terms of nothing, and a chain assembled around one would be saved only to fall on the start of
	 * the process. None of the kinds carries a parenthesis or a formula brace of its own - a reference
	 * and a number exclude both lexically, and a string is scanned whole - which is what
	 * `isSingleTermOperand` stands on, so the table is exported for the test that walks it.
	 */
	const TERM_TOKEN_KINDS = Object.freeze([TOKEN_KIND.reference, TOKEN_KIND.number, TOKEN_KIND.string]);

	/**
	 * A source-reference operand is any operand carrying a BP expression reference
	 * (`{=...}` or `{{=...}}`): its runtime value is unknown at configuration time.
	 */
	const isSourceReference = operand => {
		return main_core.Type.isString(operand) && (operand.includes('{=') || operand.includes('{{='));
	};
	const isTermToken = token => {
		return Boolean(token) && TERM_TOKEN_KINDS.includes(token.kind);
	};
	const isUnarySignToken = token => {
		return Boolean(token) && token.kind === TOKEN_KIND.operator && (token.text === '+' || token.text === '-');
	};

	/**
	 * The term a fragment consists of, past the unary sign the chain grammar absorbs into the operand,
	 * or `null` for a fragment that is not one term. The stream is gapless, so spacing of its own would
	 * make the fragment longer than two tokens - and a padded operand would come back from the round
	 * trip trimmed.
	 */
	const readSingleTerm = text => {
		const {
			ok,
			tokens
		} = tokenizeFragment(text);
		if (!ok) {
			return null;
		}
		if (tokens.length === 1) {
			return isTermToken(tokens[0]) ? tokens[0] : null;
		}
		const isSignedTerm = tokens.length === 2 && isUnarySignToken(tokens[0]) && isTermToken(tokens[1]);
		return isSignedTerm ? tokens[1] : null;
	};

	/** One operand of the chain: a single term, carrying the unary sign of its own. */
	const isSingleTerm = text => {
		return readSingleTerm(text) !== null;
	};

	/**
	 * The number the operand stands for, read by the grammar of the scanner and not by `Number()`: the
	 * cast also takes the radix literals `0x10`, `0b1`, `0o7` and the exponent form `1e5`, and none of
	 * those is a number to the workflow - the first three it casts to zero, the last it does not parse
	 * at all. An operand that is a number already comes in as it is: there is no text anyone typed.
	 */
	const parseLiteralNumber = operand => {
		if (main_core.Type.isNumber(operand)) {
			return Number.isFinite(operand) ? {
				ok: true,
				value: operand
			} : {
				ok: false
			};
		}
		if (!main_core.Type.isString(operand)) {
			return {
				ok: false
			};
		}
		const text = operand.trim();
		if (readSingleTerm(text)?.kind !== TOKEN_KIND.number) {
			return {
				ok: false
			};
		}
		const parsed = Number(text);
		return Number.isFinite(parsed) ? {
			ok: true,
			value: parsed
		} : {
			ok: false
		};
	};
	const FORMULA_BRACES_LENGTH = '{{=}}'.length;

	/**
	 * The length half of `isSingleTermOperand`, asked on its own: the formula of this one operand alone
	 * still fits the parse. Separate from the form on purpose - the scan refuses an input past the
	 * ceiling before it reads a single token (`guardInput` of the tokenizer), so every operand longer
	 * than that answers "not a term" to `isSingleTerm` no matter how it is written. A caller that asks
	 * about the form first would name a length as a broken form, and send the one who filled the
	 * operand to fix what is not broken.
	 */
	const fitsOperandLength = operand => {
		return main_core.Type.isString(operand) && operand.length + FORMULA_BRACES_LENGTH <= MAX_PARSE_LENGTH;
	};
	const isDraftShape = draft => {
		return main_core.Type.isPlainObject(draft) && main_core.Type.isArray(draft.operands) && main_core.Type.isArray(draft.signs) && main_core.Type.isArray(draft.groups);
	};
	const areGroupsPlaced = (groups, operandCount) => {
		let previousTo = -1;
		for (const group of groups) {
			if (!main_core.Type.isNumber(group?.from) || !main_core.Type.isNumber(group?.to)) {
				return false;
			}
			if (group.from <= previousTo || group.from > group.to || group.to >= operandCount) {
				return false;
			}
			previousTo = group.to;
		}
		return true;
	};

	/**
	 * Whether the last sign inside the group is a round one - the sign that puts the parenthesis of a
	 * call on the right boundary of the range. A group of a single operand has no sign inside it at
	 * all, and the sign at that index is the one standing right after the group.
	 */
	const endsWithRoundCall = (group, signs) => {
		return group.to > group.from && signs[group.to - 1] === CALC_OP.round;
	};

	/**
	 * Whether the group assembles the very string the chain assembles without it: on a group that
	 * starts the chain and ends with a round call, both parentheses of the call already stand on the
	 * boundaries of the range, so the string carries no group and the reading gives none back.
	 */
	const assemblesAsFlatCall = (group, signs) => {
		return group.from === 0 && endsWithRoundCall(group, signs);
	};

	/**
	 * Whether the range may stand as a group of the chain. Two placements are refused, and a round sign
	 * inside the range is not one of them - limiting the reach of a rounding is what a group is for.
	 */
	const isGroupPlacementAllowed = (group, signs) => {
		// The string of the group would take the place of the precision, and a precision is one operand.
		if (group.from > 0 && signs[group.from - 1] === CALC_OP.round) {
			return false;
		}
		return !assemblesAsFlatCall(group, signs);
	};
	const sameDrafts = (left, right) => {
		return left.operands.length === right.operands.length && left.signs.length === right.signs.length && left.groups.length === right.groups.length && left.operands.every((operand, index) => operand === right.operands[index]) && left.signs.every((signId, index) => signId === right.signs[index]) && left.groups.every((group, index) => {
			return group.from === right.groups[index].from && group.to === right.groups[index].to;
		});
	};

	/**
	 * The circular invariant holds exactly on canonical drafts, and confirmation is unavailable outside
	 * of them: an operand that is not a single term, or a chain whose assembled string falls out of the
	 * parse limits, would be silently lost on the next open.
	 */
	const isCanonicalDraft = draft => {
		if (!isDraftShape(draft)) {
			return false;
		}
		const {
			operands,
			signs,
			groups
		} = draft;
		if (operands.length === 0 || signs.length !== operands.length - 1) {
			return false;
		}
		if (!signs.every(signId => OPERATION_BY_ID.has(signId))) {
			return false;
		}
		if (!operands.every(operand => isSingleTerm(operand))) {
			return false;
		}
		if (!areGroupsPlaced(groups, operands.length)) {
			return false;
		}
		if (!groups.every(group => isGroupPlacementAllowed(group, signs))) {
			return false;
		}
		const built = buildFormulaString(draft);
		if (built.length > MAX_PARSE_LENGTH) {
			return false;
		}

		// The paired guard on the assembly side, carried to its end: the scanner is the only place the
		// nesting level is measured, and a stream that merely tokenizes says nothing about the reading.
		// The proof of the round trip is the reading itself - the same chain, or no canonicity at all.
		const {
			ok,
			tokens
		} = tokenizeExpression(built);
		if (!ok) {
			return false;
		}
		const readBack = parseChainFromTokens(tokens);
		return readBack !== null && sameDrafts(readBack, draft);
	};
	const cloneDraft = draft => {
		return {
			operands: [...draft.operands],
			signs: [...draft.signs],
			groups: draft.groups.map(group => ({
				...group
			}))
		};
	};

	/** Appends an operand to the right end of the chain; the default sign of a new operand is `+`. */
	const appendOperand = (draft, operand, signId = CALC_OP.add) => {
		const next = cloneDraft(draft);
		if (next.operands.length > 0) {
			next.signs.push(signId);
		}
		next.operands.push(operand);
		return next;
	};
	const setOperand = (draft, index, operand) => {
		const next = cloneDraft(draft);
		if (index >= 0 && index < next.operands.length) {
			next.operands[index] = operand;
		}
		return next;
	};
	const setSign = (draft, gapIndex, signId) => {
		const next = cloneDraft(draft);
		if (gapIndex >= 0 && gapIndex < next.signs.length) {
			next.signs[gapIndex] = signId;
		}
		return next;
	};

	/**
	 * The sign a removed operand takes with it: the one on its left, except where the operand is the
	 * first of a group opened by a round sign. That sign rounds the very operand being removed, and
	 * after the shrink it would stand right before the group, where the group reads as the precision of
	 * the call - so it goes together with its argument. The group is asked for an inner sign first: a
	 * group of a single operand has none, and the sign at that index is the one standing after it.
	 */
	const signIndexRemovedWith = (draft, index) => {
		const group = draft.groups.find(item => item.from <= index && index <= item.to) ?? null;
		const losesRoundArgument = group !== null && index === group.from && group.from > 0 && group.to > group.from && draft.signs[group.from] === CALC_OP.round;
		return losesRoundArgument ? index : Math.max(index - 1, 0);
	};

	/**
	 * Removing an operand takes a sign with it and shrinks the group it belonged to; a group left
	 * without operands is gone. Adjacency is a property of the model, so the chain does not recount
	 * group indices itself.
	 */
	const removeOperand = (draft, index) => {
		const next = cloneDraft(draft);
		if (index < 0 || index >= next.operands.length) {
			return next;
		}
		const signIndex = signIndexRemovedWith(next, index);
		next.operands.splice(index, 1);
		if (next.signs.length > 0) {
			next.signs.splice(signIndex, 1);
		}
		next.groups = next.groups.map(group => ({
			from: group.from > index ? group.from - 1 : group.from,
			to: group.to >= index ? group.to - 1 : group.to
		})).filter(group => group.to >= group.from)
		// A chain shrunk from the left can leave a group at its head that the assembly says flat,
		// and the reading would give no group back. Dropping it changes not a character of the
		// string and keeps the draft one the window can confirm.
		.filter(group => !assemblesAsFlatCall(group, next.signs));
		return next;
	};

	/**
	 * Whether the range can become a group: it holds a placement the assembly can say (see
	 * isGroupPlacementAllowed) and overlaps no group already standing in the chain. The placement is
	 * asked here and not only on the assembled draft, so the window never offers an action that leads
	 * to a draft it would then refuse.
	 */
	const canGroupOperands = (draft, from, to) => {
		if (!isDraftShape(draft) || from < 0 || from > to || to >= draft.operands.length) {
			return false;
		}
		if (!isGroupPlacementAllowed({
			from,
			to
		}, draft.signs)) {
			return false;
		}
		return !draft.groups.some(group => group.from <= to && from <= group.to);
	};
	const groupOperands = (draft, from, to) => {
		if (!canGroupOperands(draft, from, to)) {
			return null;
		}
		const next = cloneDraft(draft);
		next.groups = [...next.groups, {
			from,
			to
		}].sort((left, right) => {
			return left.from - right.from;
		});
		return next;
	};

	/** Drops the group the operand belongs to; a draft without such a group comes back as it was. */
	const ungroupOperands = (draft, index) => {
		const next = cloneDraft(draft);
		next.groups = next.groups.filter(group => index < group.from || index > group.to);
		return next;
	};
	const infixSymbol = signId => {
		return OPERATION_BY_ID.get(signId)?.symbol ?? '';
	};

	/**
	 * One pass left to right over the terms of a chain: an infix sign appends a term to the accumulated
	 * prefix, a round sign closes the whole prefix into a call and the chain continues over its result.
	 */
	const assembleChain = (terms, signs) => {
		let acc = terms[0] ?? '';
		for (const [index, term] of terms.entries()) {
			if (index === 0) {
				continue;
			}
			acc = signs[index - 1] === CALC_OP.round ? `round(${acc}, ${term})` : `${acc} ${infixSymbol(signs[index - 1])} ${term}`;
		}
		return acc;
	};

	/**
	 * The one term a group stands as in the chain above it. Its own parentheses are left out where the
	 * call already put a pair on both boundaries of the range (see endsWithRoundCall): a second pair
	 * would read back as a nesting the model does not express.
	 */
	const groupTerm = (draft, group) => {
		const inner = assembleChain(draft.operands.slice(group.from, group.to + 1), draft.signs.slice(group.from, group.to));
		return endsWithRoundCall(group, draft.signs) ? inner : `(${inner})`;
	};

	/**
	 * Assembly goes in two levels: the chain of a group is assembled by the very rules of the chain
	 * above it, and the string it gives stands there as a single term. Groups do not nest, so two
	 * levels is all there is. No parenthesis of precedence is ever added.
	 */
	const buildFormulaString = draft => {
		const {
			operands,
			signs,
			groups
		} = draft;
		const groupStarts = new Map(groups.map(group => [group.from, group]));
		const terms = [];
		const termSigns = [];
		let index = 0;
		while (index < operands.length) {
			const group = groupStarts.get(index) ?? null;
			const to = group === null ? index : group.to;
			terms.push(group === null ? operands[index] : groupTerm(draft, group));
			if (to + 1 < operands.length) {
				termSigns.push(signs[to]);
			}
			index = Math.max(to, index) + 1;
		}
		return `{{=${assembleChain(terms, termSigns)}}}`;
	};

	/**
	 * Whether the parentheses of the group are left out of the string buildFormulaString assembles (see
	 * groupTerm). The rule of the assembly belongs to the assembly, so the drawing of the chain asks it
	 * here instead of keeping a second copy of the condition.
	 */
	const omitsGroupParens = (draft, group) => {
		return endsWithRoundCall(group, draft.signs);
	};
	const meaningfulTokens = tokens => {
		return tokens.filter(token => token.kind !== TOKEN_KIND.space);
	};

	/**
	 * Appends a parsed term to the chain being read, in place. The chain is a mutable accumulator owned
	 * by the reading alone, so an operator costs one term and not a copy of the whole prefix before it.
	 */
	const appendTermToChain = (chain, signId, term) => {
		const offset = chain.operands.length;
		chain.signs.push(signId, ...term.signs);
		chain.operands.push(...term.operands);
		for (const group of term.groups) {
			chain.groups.push({
				from: group.from + offset,
				to: group.to + offset
			});
		}
	};
	const singleOperandDraft = operand => {
		return {
			operands: [operand],
			signs: [],
			groups: []
		};
	};
	const isRoundCallAt = (tokens, index) => {
		return tokens[index]?.kind === TOKEN_KIND.functionName && tokens[index].text.toLowerCase() === ROUND_FUNCTION_NAME && tokens[index + 1]?.kind === TOKEN_KIND.parenOpen;
	};
	const parseGroupTerm = (tokens, start) => {
		const inner = parseChain(tokens, start + 1);
		if (inner === null || tokens[inner.cursor]?.kind !== TOKEN_KIND.parenClose) {
			return null;
		}

		// A group inside a group is a nesting the model does not express. A round call read past the
		// head of the inner chain has become a group of its own, so it arrives here as the same nesting.
		if (inner.draft.groups.length > 0) {
			return null;
		}

		// Copied out and not spread: what the group hands back becomes the accumulator its caller
		// appends to, and a spread would leave that caller writing into the arrays of the chain read
		// inside the parentheses. One copy per group, the length of that group.
		return {
			draft: {
				operands: [...inner.draft.operands],
				signs: [...inner.draft.signs],
				groups: [{
					from: 0,
					to: inner.draft.operands.length - 1
				}]
			},
			cursor: inner.cursor + 1
		};
	};
	const parseRoundTerm = (tokens, start) => {
		const inner = parseChain(tokens, start + 2);
		if (inner === null || tokens[inner.cursor]?.kind !== TOKEN_KIND.comma) {
			return null;
		}

		// The precision is read the same way as any other operand, unary sign and all: the chain assembles
		// `round(x, -2)` from an operand the calculator carries, so the reading has to give it back.
		const precision = parseOperandTerm(tokens, inner.cursor + 1);
		if (precision === null || tokens[precision.cursor]?.kind !== TOKEN_KIND.parenClose) {
			return null;
		}
		appendTermToChain(inner.draft, CALC_OP.round, precision.draft);
		return {
			draft: inner.draft,
			cursor: precision.cursor + 1
		};
	};

	// `[unary sign] operand`: the sign is absorbed by the operand at the head of a chain and right after
	// another operator; anywhere else `-` and `+` are the infix operators they look like.
	const parseOperandTerm = (tokens, start) => {
		const sign = isUnarySignToken(tokens[start]) ? tokens[start] : null;
		const operand = sign === null ? tokens[start] : tokens[start + 1];
		if (!isTermToken(operand)) {
			return null;
		}
		const text = sign === null ? operand.text : `${sign.text}${operand.text}`;
		return {
			draft: singleOperandDraft(text),
			cursor: sign === null ? start + 1 : start + 2
		};
	};
	const parseTerm = (tokens, start) => {
		const token = tokens[start];
		if (!token) {
			return null;
		}
		if (token.kind === TOKEN_KIND.parenOpen) {
			return parseGroupTerm(tokens, start);
		}
		return isRoundCallAt(tokens, start) ? parseRoundTerm(tokens, start) : parseOperandTerm(tokens, start);
	};

	/**
	 * The draft of a round call read past the head of its chain: its first argument is written out
	 * between its own parentheses and not taken from the prefix on its left, which is exactly what a
	 * group is. A group already inside the call is a nesting the model does not express - and the
	 * parentheses of precedence it stands for carry meaning, so the value stays raw instead of losing
	 * them: `1 + round((2 + 3) * 4, 5)` counts 20, and the same chain without them counts 14.
	 */
	const closeCallIntoGroup = draft => {
		if (draft.groups.length > 0) {
			return null;
		}
		return {
			...draft,
			groups: [{
				from: 0,
				to: draft.operands.length - 1
			}]
		};
	};
	const parseChain = (tokens, start) => {
		// The leftmost term is the one place a round call is read flat: there its first argument is the
		// whole prefix of the chain by construction, and that is how every value saved so far is read.
		const first = parseTerm(tokens, start);
		if (first === null) {
			return null;
		}

		// Every term hands over a draft of its own, so the chain grows into the draft of its first term
		// and the accumulated prefix is never copied again: the reading stays linear in the operands.
		const draft = first.draft;
		let cursor = first.cursor;
		while (tokens[cursor]?.kind === TOKEN_KIND.operator) {
			const signId = OPERATION_BY_SYMBOL[tokens[cursor].text];
			const isRoundCall = isRoundCallAt(tokens, cursor + 1);
			const term = parseTerm(tokens, cursor + 1);
			if (!signId || term === null) {
				return null;
			}
			const termDraft = isRoundCall ? closeCallIntoGroup(term.draft) : term.draft;
			if (termDraft === null) {
				return null;
			}
			appendTermToChain(draft, signId, termDraft);
			cursor = term.cursor;
		}
		return {
			draft,
			cursor
		};
	};

	/**
	 * The chain a stream spells out, before any judgement about it: the canonicity predicate reads the
	 * string it assembles through this same entry, so the two sides of the round trip cannot part ways.
	 */
	const parseChainFromTokens = tokens => {
		const meaningful = meaningfulTokens(tokens);
		const lastIndex = meaningful.length - 1;
		if (lastIndex < 1 || meaningful[0].kind !== TOKEN_KIND.formulaOpen || meaningful[lastIndex].kind !== TOKEN_KIND.formulaClose) {
			return null;
		}
		const chain = parseChain(meaningful, 1);
		return chain !== null && chain.cursor === lastIndex ? chain.draft : null;
	};

	/**
	 * The draft behind a stream already scanned: the entry for a caller holding the tokens of the value,
	 * so the value is read once and not once per question asked about it.
	 */
	const readDraftFromTokens = tokens => {
		const draft = parseChainFromTokens(tokens);
		return draft !== null && isCanonicalDraft(draft) ? draft : null;
	};

	/** The call behind a stream already scanned, on the same terms as `readDraftFromTokens`. */
	const readCallFromTokens = tokens => {
		const meaningful = meaningfulTokens(tokens);
		const lastIndex = meaningful.length - 1;
		if (lastIndex < 4 || meaningful[0].kind !== TOKEN_KIND.formulaOpen || meaningful[1].kind !== TOKEN_KIND.functionName || meaningful[2].kind !== TOKEN_KIND.parenOpen || meaningful[lastIndex - 1].kind !== TOKEN_KIND.parenClose || meaningful[lastIndex].kind !== TOKEN_KIND.formulaClose) {
			return null;
		}
		return {
			name: meaningful[1].text
		};
	};

	/**
	 * Moves the decimal point through the exponent notation instead of multiplying by a power of ten:
	 * `1.005 * 100` is 100.49999999999999 and would round down, while the server rounds 1.005 to 1.01.
	 * A value already written with an exponent cannot take a second one - such a number falls back to
	 * the multiplication, where the precision it has left no longer matters.
	 */
	const shiftExponent = (value, exponent) => {
		if (exponent === 0 || !Number.isFinite(value)) {
			return value;
		}
		const shifted = Number(`${value}e${exponent}`);
		return Number.isFinite(shifted) ? shifted : value * 10 ** exponent;
	};

	/**
	 * The semantics of the server-side `round((float) $value, (int) $precision)` the workflow will run
	 * (bizproc `MathLib::callRound()`): the precision is truncated to an integer and halves are rounded
	 * away from zero, unlike `Math.round`, which takes them towards positive infinity.
	 */
	const roundTo = (value, digits) => {
		const precision = Math.trunc(digits);
		const scaled = shiftExponent(value, precision);
		return shiftExponent(Math.sign(scaled) * Math.round(Math.abs(scaled)), -precision);
	};
	const divByZero = Object.freeze({
		ok: false,
		code: PREVIEW_WARNING.divByZero
	});

	/**
	 * What an operand whose value the preview cannot know stands for - a source reference above all,
	 * whose value the workflow resolves on start. The computation carries it through instead of stopping
	 * on it, so an error that holds at every value of the unknowns is still found (see
	 * `evaluateFormulaDraft`).
	 */
	const UNKNOWN = null;
	/** An operation over an unknown gives an unknown: there is nothing to compute it from. */
	const overKnown = (left, right, operation) => {
		return left === UNKNOWN || right === UNKNOWN ? UNKNOWN : operation(left, right);
	};
	const sum = (left, right) => left + right;
	const difference = (left, right) => left - right;
	const product = (left, right) => left * right;
	const quotient = (left, right) => left / right;

	/**
	 * `*` and `/` before `+` and `-`. Division by zero is signalled from inside the computation: by the
	 * end `x / 0` has become infinity and `0 / 0` a non-number, and a literal zero divisor is no longer
	 * distinguishable from an overflow.
	 */
	const evaluateInfix = (values, signs) => {
		const terms = [values[0]];
		const additive = [];
		for (const [index, signId] of signs.entries()) {
			const right = values[index + 1];
			if (signId === CALC_OP.multiply) {
				terms[terms.length - 1] = overKnown(terms[terms.length - 1], right, product);
			} else if (signId === CALC_OP.divide) {
				// A divisor known to be zero is an error whatever the unknowns around it turn out to be:
				// the workflow computes the whole expression and stops on the division either way.
				if (right === 0) {
					return divByZero;
				}
				terms[terms.length - 1] = overKnown(terms[terms.length - 1], right, quotient);
			} else {
				additive.push(signId);
				terms.push(right);
			}
		}
		let result = terms[0];
		for (const [index, signId] of additive.entries()) {
			result = overKnown(result, terms[index + 1], signId === CALC_OP.add ? sum : difference);
		}
		return {
			ok: true,
			value: result
		};
	};

	// Groups first: the chain of a group is computed by the very rules of the chain above it (see
	// evaluateSegments), so a rounding inside a group reaches exactly the operands of that group - the
	// same two levels the assembly writes into the string. Reduced to single values, the groups leave a
	// chain of items the top level then computes the same way.
	const reduceGroups = (values, signs, groups) => {
		const groupStarts = new Map(groups.map(group => [group.from, group]));
		const items = [];
		const itemSigns = [];
		let index = 0;
		while (index < values.length) {
			const group = groupStarts.get(index) ?? null;
			const to = group === null ? index : group.to;
			const reduced = group === null ? {
				ok: true,
				value: values[index]
			} : evaluateSegments(values.slice(index, to + 1), signs.slice(index, to));
			if (!reduced.ok) {
				return reduced;
			}
			items.push(reduced.value);
			if (to + 1 < values.length) {
				itemSigns.push(signs[to]);
			}
			index = Math.max(to, index) + 1;
		}
		return {
			ok: true,
			items,
			itemSigns
		};
	};

	// A round sign is a boundary of the computation: the prefix is computed by the usual precedence, the
	// result is rounded and the chain continues over that result.
	const evaluateSegments = (items, itemSigns) => {
		let values = [items[0]];
		let signs = [];
		for (const [index, item] of items.entries()) {
			if (index === 0) {
				continue;
			}
			if (itemSigns[index - 1] === CALC_OP.round) {
				const segment = evaluateInfix(values, signs);
				if (!segment.ok) {
					return segment;
				}
				values = [overKnown(segment.value, item, roundTo)];
				signs = [];
			} else {
				values.push(item);
				signs.push(itemSigns[index - 1]);
			}
		}
		return evaluateInfix(values, signs);
	};

	/**
	 * Preview over the chain, with the operands the preview cannot read as numbers carried through as
	 * unknowns instead of stopping it: the workflow computes the whole expression by precedence, so
	 * `{=Document:PRICE} + 8 / 0` is an error at every value the reference can take, and the chain has
	 * to say so while Apply is still available. What the unknowns leave undecided is undecided here as
	 * well - `8 / {=Document:PRICE}` depends on the data and is no warning of ours.
	 *
	 * A chain that comes out unknown is read by what made it so: a source reference means the value is
	 * waiting for the run, and anything else the preview could not read as a number means the value is
	 * not a number.
	 */
	const evaluateFormulaDraft = draft => {
		const {
			operands,
			signs,
			groups
		} = draft;
		const notANumber = {
			kind: PREVIEW_KIND.warning,
			code: PREVIEW_WARNING.notANumber
		};
		if (operands.length === 0) {
			return notANumber;
		}
		const values = operands.map(operand => {
			const parsed = parseLiteralNumber(operand);
			return parsed.ok ? parsed.value : UNKNOWN;
		});
		const reduced = reduceGroups(values, signs, groups);
		if (!reduced.ok) {
			return {
				kind: PREVIEW_KIND.warning,
				code: reduced.code
			};
		}
		const evaluated = evaluateSegments(reduced.items, reduced.itemSigns);
		if (!evaluated.ok) {
			return {
				kind: PREVIEW_KIND.warning,
				code: evaluated.code
			};
		}
		if (evaluated.value !== UNKNOWN) {
			return {
				kind: PREVIEW_KIND.value,
				value: evaluated.value
			};
		}
		return operands.some(operand => isSourceReference(operand)) ? {
			kind: PREVIEW_KIND.dependsOnData
		} : notANumber;
	};
	const PART_BY_TOKEN_KIND = Object.freeze({
		[TOKEN_KIND.formulaOpen]: FORMULA_PART.brace,
		[TOKEN_KIND.formulaClose]: FORMULA_PART.brace,
		[TOKEN_KIND.functionName]: FORMULA_PART.function,
		[TOKEN_KIND.string]: FORMULA_PART.value,
		// A reference is a kind of its own and never arrives as `text`: the kind excludes the braces.
		[TOKEN_KIND.text]: FORMULA_PART.value,
		[TOKEN_KIND.number]: FORMULA_PART.number,
		[TOKEN_KIND.operator]: FORMULA_PART.operator,
		[TOKEN_KIND.parenOpen]: FORMULA_PART.paren,
		[TOKEN_KIND.parenClose]: FORMULA_PART.paren,
		[TOKEN_KIND.comma]: FORMULA_PART.plain,
		[TOKEN_KIND.space]: FORMULA_PART.plain
	});
	const referenceSpans = (value, token) => {
		const {
			object,
			field,
			modifier,
			secondModifier
		} = token.refParts ?? {};
		const spans = [{
			type: FORMULA_PART.brace,
			start: token.start,
			end: token.start + 2,
			depth: null
		}];
		for (const offsets of [object, field]) {
			if (offsets) {
				spans.push({
					type: FORMULA_PART.source,
					start: offsets.start,
					end: offsets.end,
					depth: null
				});
			}
		}
		if (modifier) {
			// The one `>` between the field and the modifier: located inside the span the offsets give,
			// never by parsing the reference again.
			const operatorAt = value.indexOf('>', field ? field.end : token.start);
			if (operatorAt !== -1 && operatorAt < modifier.start) {
				spans.push({
					type: FORMULA_PART.operator,
					start: operatorAt,
					end: operatorAt + 1,
					depth: null
				});
			}
			spans.push({
				type: FORMULA_PART.modifier,
				start: modifier.start,
				end: modifier.end,
				depth: null
			});
		}
		if (secondModifier) {
			// The named exception to "fits the model or stays raw": recognition leaves a value with a
			// second modifier raw, because the modification panel cannot carry two transforms at once
			// and Apply would drop one (`recognizeReference` in the assembler of the builder), while the
			// highlight still marks the reference up by roles. Highlighting rewrites nothing, and the
			// offsets of both modifiers come from the same scan - painting the second one plainly would
			// only tell the reader that a part of the reference is unrecognized, which it is not.
			spans.push({
				type: FORMULA_PART.modifier,
				start: secondModifier.start,
				end: secondModifier.end,
				depth: null
			});
		}
		spans.push({
			type: FORMULA_PART.brace,
			start: token.end - 1,
			end: token.end,
			depth: null
		});
		return spans;
	};
	const tokenSpans = (value, tokens) => {
		const spans = [];
		for (const token of tokens) {
			if (token.kind === TOKEN_KIND.reference) {
				spans.push(...referenceSpans(value, token));
				continue;
			}
			const type = PART_BY_TOKEN_KIND[token.kind];
			spans.push({
				type,
				start: token.start,
				end: token.end,
				depth: token.depth
			});
		}
		return spans;
	};

	/**
	 * Parts carry text only - a slice of the source - so spacing and letter case stay the ones that were
	 * typed. Gaps between typed parts are filled with the `plain` role, and neighbouring fillers join:
	 * the caller renders parts as text nodes and never as markup.
	 */
	const fillGaps = (value, spans) => {
		const parts = [];
		let cursor = 0;
		const pushPart = (type, from, to, depth) => {
			const previous = parts[parts.length - 1];
			if (type === FORMULA_PART.plain && previous?.type === FORMULA_PART.plain) {
				previous.text += value.slice(from, to);
				return;
			}
			parts.push({
				type,
				text: value.slice(from, to),
				depth
			});
		};
		for (const span of spans) {
			if (span.start > cursor) {
				pushPart(FORMULA_PART.plain, cursor, span.start, null);
			}
			pushPart(span.type, span.start, span.end, span.depth ?? null);
			cursor = span.end;
		}
		if (cursor < value.length) {
			pushPart(FORMULA_PART.plain, cursor, value.length, null);
		}
		return parts;
	};
	const plainOnly = value => {
		return [{
			type: FORMULA_PART.plain,
			text: value,
			depth: null
		}];
	};

	/**
	 * Typed parts of a whole value for the highlight. The decision "fits the model or not" is the same
	 * one recognition makes: a value `readFormulaDraft` refuses gives a single `plain` part, and typed
	 * parts appear only for a value that fits, a single reference or a single function call.
	 *
	 * `maxParts` is how many parts the caller is willing to show at once: every part is an element of
	 * the document, and the parse alone allows a value of some two thousand of them - a value that no
	 * one assembled by hand and that the caller is about to render synchronously. Past the ceiling the
	 * value is given as it is, in the one filler part, the way any value the model does not express is.
	 * The ceiling belongs to the caller and not here: it follows from what the caller shows the value
	 * with, see MAX_HIGHLIGHT_PARTS of the window.
	 */
	const describeFormulaParts = (value, maxParts = Infinity) => {
		if (!main_core.Type.isStringFilled(value)) {
			return [];
		}
		const {
			ok,
			tokens
		} = tokenizeExpression(value);
		if (!ok) {
			return plainOnly(value);
		}
		const fits = readDraftFromTokens(tokens) !== null || isSingleReferenceStream(tokens) || readCallFromTokens(tokens) !== null;
		if (!fits) {
			return plainOnly(value);
		}
		const parts = fillGaps(value, tokenSpans(value, tokens));
		return parts.length > maxParts ? plainOnly(value) : parts;
	};

	/** Typed parts of one operand of the chain: the chain shows its operands separately. */
	const describeOperandParts = operand => {
		if (!main_core.Type.isStringFilled(operand)) {
			return [];
		}
		const {
			ok,
			tokens
		} = tokenizeFragment(operand);
		return ok ? fillGaps(operand, tokenSpans(operand, tokens)) : plainOnly(operand);
	};

	// What a saved field value turns out to be. The answer is built over the single token stream of
	// `expression-tokenizer` and the flat model of `formula-draft` - the value is never parsed a second
	// time - so the recognition belongs here, beside them, and the window reaches it through the
	// calculator facade.

	/** What a saved field value turns out to be, and everything the window needs to open on it. */

	const referencePart = (value, offsets) => {
		return offsets ? value.slice(offsets.start, offsets.end) : null;
	};

	/**
	 * The parts of a single reference, cut by the offsets its own token carries: the reference is not
	 * read a second time. A second modifier has no place in the modification panel (one transform at a
	 * time), and prefilling from the first one alone would let Apply drop it, so such a value stays raw
	 * like any other the window does not express.
	 */
	const recognizeReference = (value, token) => {
		const {
			object,
			field,
			modifier,
			secondModifier
		} = token.refParts ?? {};
		const secondModifierText = referencePart(value, secondModifier);
		if (main_core.Type.isStringFilled(secondModifierText)) {
			return {
				kind: 'raw',
				raw: value,
				secondModifier: secondModifierText
			};
		}
		return {
			kind: 'reference',
			object: referencePart(value, object) ?? '',
			field: referencePart(value, field) ?? '',
			modifier: referencePart(value, modifier),
			raw: value
		};
	};

	/**
	 * What a saved field value is: the empty value, a single reference, a chain the model expresses, a
	 * single function call, or a value that is none of those. The mode the window opens in and the chain
	 * it is prefilled with both follow from this one answer, and a `raw` value is shown as it is and
	 * never rewritten.
	 *
	 * A chain is looked for before a call: `round(A, N)` is a sign of the chain, while `round` with any
	 * other number of arguments is the function call it looks like. The ceiling of the parse belongs to
	 * the scanner, so a value longer than it never reaches the model at all.
	 */
	function recognizeFieldValue(value) {
		if (!main_core.Type.isStringFilled(value)) {
			return {
				kind: 'empty'
			};
		}
		const {
			ok,
			tokens
		} = tokenizeExpression(value);
		if (!ok) {
			return {
				kind: 'raw',
				raw: value
			};
		}
		if (isSingleReferenceStream(tokens)) {
			// The predicate holds on one meaningful token only, and that token is the reference itself.
			const reference = tokens.find(token => token.kind === TOKEN_KIND.reference);
			return recognizeReference(value, reference);
		}
		const draft = readDraftFromTokens(tokens);
		if (draft !== null) {
			return {
				kind: 'draft',
				draft,
				raw: value
			};
		}
		const call = readCallFromTokens(tokens);
		return call === null ? {
			kind: 'raw',
			raw: value
		} : {
			kind: 'function',
			name: call.name,
			raw: value
		};
	}

	// No CSS of its own: the palette of the parts paints elements of the window body as well - the
	// operator of the chain, its parentheses and the separator of the operands are parts of the same
	// palette rendered by the body itself - so the whole of it lives with the body, and the parts are
	// only ever shown inside the body, which brings that CSS along.

	// The palette of the window, one class per role of a part (TPL-04). A Map and not an object: the
	// role comes from the parse of a field value, and a plain object would answer a lookup of
	// `constructor` or `toString` with something inherited from its prototype - a class attribute built
	// out of a value is exactly what the insertion invariant forbids.
	const CLASS_BY_ROLE = new Map([[FORMULA_PART.function, '--function'], [FORMULA_PART.modifier, '--modifier'], [FORMULA_PART.operator, '--operator'], [FORMULA_PART.source, '--source'], [FORMULA_PART.value, '--value'], [FORMULA_PART.number, '--number'], [FORMULA_PART.brace, '--brace'], [FORMULA_PART.plain, '--plain']]);

	// A role the palette does not know is painted as the filler of the seams is: no class of its own,
	// and none built out of the role either.
	const UNKNOWN_ROLE_CLASS = CLASS_BY_ROLE.get(FORMULA_PART.plain);

	// The cycle of the nesting: the fourth level starts it over. Three classes and not a number put
	// into a name, so a depth of any size, sign or fraction still lands inside the list.
	const PAREN_DEPTH_CLASSES = Object.freeze(['--paren-depth-1', '--paren-depth-2', '--paren-depth-3']);

	/**
	 * The class of a parenthesis by how deep it stands, counted from one. The depth is brought to a
	 * whole number and taken modulo the length of the cycle: whatever comes in - a depth of any size,
	 * sign or fraction, and a `NaN` as well - what goes out is one of the three names above.
	 */
	function parenDepthClass(depth) {
		const level = Math.trunc(Number(depth));
		if (!Number.isFinite(level)) {
			return PAREN_DEPTH_CLASSES[0];
		}
		const size = PAREN_DEPTH_CLASSES.length;
		return PAREN_DEPTH_CLASSES[((level - 1) % size + size) % size];
	}

	/** The class of one part: by its role, and for a parenthesis by its depth as well. */
	function formulaPartClass(part) {
		if (part?.type === FORMULA_PART.paren) {
			return parenDepthClass(part.depth);
		}
		return CLASS_BY_ROLE.get(part?.type) ?? UNKNOWN_ROLE_CLASS;
	}

	/**
	 * The typed parts of a value, painted in the palette of the window: one element per part, the class
	 * picked from the list above and the text interpolated, so it reaches the document as a text node
	 * by construction. Nothing here reads the value: the parts come ready ({@see describeFormulaParts},
	 * {@see describeOperandParts}), and the renderer keeps no state and touches no store.
	 *
	 * A bare span and not a typography component: the parts stand inside the text element of the chip,
	 * which is a typography component already, and a second one nested in it would set the size and the
	 * line height a second time. A parenthesis of the chain is a text element of its own and takes its
	 * class from parenDepthClass instead.
	 *
	 * @vue/component
	 */
	const FormulaParts = {
		name: 'ExpressionBuilderFormulaParts',
		props: {
			/** @type Array<FormulaPart> */
			parts: {
				type: Array,
				default: () => []
			}
		},
		methods: {
			partClass(part) {
				return formulaPartClass(part);
			},
			partText(part) {
				return main_core.Type.isString(part?.text) ? part.text : '';
			}
		},
		template: `
		<span
			v-for="(part, index) in parts"
			:key="index"
			class="bizprocdesigner-expression-builder__part"
			:class="partClass(part)"
		>{{ partText(part) }}</span>
	`
	};

	// Modification-mode catalog.
	// Mirrors (does not import) bizproc.automation's modifiersMap + applicability-by-type logic,
	// adding a display `name` per modifier and the `name` modifier for `file`.
	// Every modifier carries a label and a description: the menu shows both, so the list of transforms
	// is readable without knowing what `> printable` does to a value.

	/**
	 * The two type strings a source carries. `type` is the concrete field type, `baseType` the bizproc
	 * base type behind it, and they part ways for user field types: a `S:Money` field is `string` at the
	 * base, a custom date one is `datetime`. automation picks a specific one per modifier
	 * (`enrichFieldsWithModifiers()`), so applicability needs both and not just one of them.
	 *
	 * `presentable` is the source schema telling that the provider prints the field itself — a funnel id
	 * has a funnel name behind it. Such a field takes printable whatever its type is; a host that knows
	 * nothing about it leaves the flag out and the type alone decides, as it always did.
	 */

	// A field of a user type: string at the base, but not the plain string type — automation offers the
	// printable form for exactly these (`isCustomField`).
	function isCustomType({
		type,
		baseType
	}) {
		return baseType === 'string' && type !== 'string';
	}
	const MODIFIERS = Object.freeze([{
		id: 'friendly',
		nameInCode: 'friendly',
		wire: '> friendly',
		appliesTo: ({
			type
		}) => type === 'user',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_FRIENDLY',
		descriptionKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_FRIENDLY_DESC'
	}, {
		id: 'printable',
		nameInCode: 'printable',
		wire: '> printable',
		appliesTo: types => types.presentable === true || ['bool', 'file'].includes(types.type) || isCustomType(types),
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_PRINTABLE',
		descriptionKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_PRINTABLE_DESC'
	}, {
		id: 'server',
		nameInCode: 'server',
		wire: '> server',
		appliesTo: ({
			baseType
		}) => ['date', 'datetime', 'time'].includes(baseType),
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_SERVER',
		descriptionKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_SERVER_DESC'
	}, {
		id: 'responsible',
		nameInCode: 'responsible',
		wire: '> responsible',
		appliesTo: ({
			baseType
		}) => ['date', 'datetime', 'time'].includes(baseType),
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_RESPONSIBLE',
		descriptionKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_RESPONSIBLE_DESC'
	}, {
		id: 'shortlink',
		nameInCode: 'shortLink',
		wire: '> shortlink',
		appliesTo: ({
			type
		}) => type === 'file',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_SHORTLINK',
		descriptionKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_SHORTLINK_DESC'
	}, {
		id: 'name',
		nameInCode: 'name',
		wire: '> name',
		appliesTo: ({
			type
		}) => type === 'file',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_NAME',
		descriptionKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_NAME_DESC'
	}]);

	/**
	 * A source type is "known" when node-settings provided at least one concrete type string.
	 * Functions and manual input have no type at all, so their type is unknown.
	 */
	function isSourceTypeKnown(types) {
		return main_core.Type.isStringFilled(types?.type) || main_core.Type.isStringFilled(types?.baseType);
	}

	/**
	 * Known type: only the modifiers applicable to it. Unknown type (nil/empty): all modifiers,
	 * and the caller shows the warning.
	 */
	function getApplicableModifiers(types) {
		if (!isSourceTypeKnown(types)) {
			return [...MODIFIERS];
		}
		return MODIFIERS.filter(modifier => modifier.appliesTo(types));
	}
	function findModifierById(modifierId) {
		return MODIFIERS.find(modifier => modifier.id === modifierId) ?? null;
	}

	/**
	 * Append a modifier to a source expression, mirroring automation's createNewField:
	 * `{=Obj:Field}` -> `{=Obj:Field > modifier}`; `{{=expr}}` -> `{{=expr modifier}}`
	 * (comment after `#` is dropped, as in automation).
	 */
	function applyModifier(source, modifierWire) {
		if (!main_core.Type.isStringFilled(source) || !main_core.Type.isStringFilled(modifierWire)) {
			return main_core.Type.isStringFilled(source) ? source : '';
		}
		const modifier = modifierWire.trim();
		if (source.startsWith('{{') && source.endsWith('}}')) {
			let inner = source.slice(2, -2);
			const commentIndex = inner.indexOf('#');
			if (commentIndex >= 0) {
				inner = inner.slice(0, commentIndex);
			}
			return `{{${inner.trim()} ${modifier}}}`;
		}
		if (source.startsWith('{=') && source.endsWith('}')) {
			const inner = source.slice(2, -1).trim();
			return `{=${inner} ${modifier}}`;
		}
		return `{=${source.trim()} ${modifier}}`;
	}

	const EXPRESSION_BUILDER_MODES = Object.freeze({
		functions: 'functions',
		calculator: 'calculator',
		modification: 'modification'
	});

	// How many operands one chain of the window may hold. The length the parse reads back would allow
	// some five hundred of them - hundreds of component subtrees mounted at once and a full pass over
	// every one of them on every keystroke - while a formula anyone assembles by hand stays within a
	// handful. The ceiling is an order of magnitude above that hand and an order below the pathology.
	const MAX_CHAIN_OPERANDS = 50;

	/**
	 * A chain the window works with: canonical to the model, and no longer than the ceiling above. The
	 * two halves are one rule and not a guard on the button alone - a chain the window will not grow is
	 * a chain it will not open either, see prefillFromValue: a value the window would neither apply nor
	 * read back is shown as it is and rewritten by nothing, the way any unreadable value is.
	 */
	const isExpressibleChain = draft => {
		return isCanonicalDraft(draft) && draft.operands.length <= MAX_CHAIN_OPERANDS;
	};

	/**
	 * How many parts one operand of the chain adds to the highlight, taken from the widest chain of the
	 * ceiling length there is: fifty references padded in every gap the grammar allows, laid out in
	 * twenty-five groups, was measured at 849 parts. It splits into thirteen parts per reference (the
	 * two braces, the object, the field, both modifiers, the `>` and the six fillers between them),
	 * three per sign and one group parenthesis per operand. The value a part more would have to be is
	 * past the parse already, so 849 is the widest a chain can get and 18 per operand is the nearest
	 * budget above it.
	 */
	const MAX_PARTS_PER_OPERAND = 18;

	/**
	 * How many parts a value may be shown in. Every part is an element of the document, and the length
	 * the parse reads back allows a value of some five hundred operands - around two thousand parts
	 * built and mounted at once for a value the window does not open as a chain anyway, see
	 * isExpressibleChain. Past the ceiling the value is shown as it is, in the one filler part.
	 *
	 * Derived from the ceiling of the chain and not chosen on its own: what the window paints in full
	 * is what it can also assemble, so moving MAX_CHAIN_OPERANDS moves this along with it and the two
	 * cannot drift apart. Nothing a chain of the ceiling length can be assembled of falls out of the
	 * highlight - the budget above is the widest one operand of such a chain was measured to be, and
	 * the test of the window guards the margin between the two.
	 */
	const MAX_HIGHLIGHT_PARTS = MAX_CHAIN_OPERANDS * MAX_PARTS_PER_OPERAND;

	/**
	 * The mode a saved value belongs to: a reference with an output modifier is what the modification
	 * mode assembles, a chain the window expresses is what the calculator assembles, and a bare
	 * reference is what a chain grows out of - the calculator takes it as its first operand. Everything
	 * else - a function call, a hand-written expression, a chain past the ceiling of operands, an empty
	 * value - starts in functions.
	 *
	 * The answer is the one the window itself opens on, and it has to stay that: a host that owns the
	 * mode chooses by this and hands the choice back to the window, so a mode of its own would leave the
	 * host naming one mode while the window has the state of another ready, see prefillFromValue.
	 */
	function resolveExpressionMode(value) {
		const recognized = recognizeFieldValue(value);
		if (recognized.kind === 'reference') {
			return recognized.modifier ? EXPRESSION_BUILDER_MODES.modification : EXPRESSION_BUILDER_MODES.calculator;
		}
		if (recognized.kind === 'draft') {
			return isExpressibleChain(recognized.draft) ? EXPRESSION_BUILDER_MODES.calculator : EXPRESSION_BUILDER_MODES.functions;
		}
		return EXPRESSION_BUILDER_MODES.functions;
	}

	// Where an in-window source pick lands: an operand of the calculator by its place in the chain, or
	// the modification source.

	// Which operand is open in its field right now: the chain shows a chip for every other one.

	// One sign of the chain: the gap of that index between two neighbouring operands.

	/**
	 * One parenthesis of the chain. The pair of a group is a control that takes the group off; the pair
	 * of a rounding call only shows how far the call reaches and is no control at all: rounding is
	 * taken off by changing the operation of its own sign. Where the assembly leaves the parentheses of
	 * a group out because the call already stands on both of its boundaries, the one pair written is
	 * the pair of the group - the role and the name go to it, see groupOpenings.
	 */

	// The chain the calculator opens with: one empty operand and no sign at all. It is also what is
	// left once the last operand is removed (see removeOperandAt) - the chain always shows an operand,
	// and longer chains are grown from here.
	const initialDraft = () => ({
		operands: [''],
		signs: [],
		groups: []
	});

	// What stands in for an operand that is not ready yet while the chain is measured against the
	// limits of the parse: the shortest term there is, so what is measured is the chain and not the
	// text half-typed into one of its operands (see canAddOperand).
	const PROBE_TERM = '0';

	// How many digits of the result are worth showing. A double carries some fifteen decimal digits
	// that mean anything, and what comes after them is the noise of the binary sum: 0.1 + 0.2 adds up
	// to 0.30000000000000004. The preview only says what the formula is about to give - the value that
	// gets stored is computed by the server - so cutting the noise here rewrites nothing of the formula.
	const PREVIEW_PRECISION = 15;
	const formatPreviewValue = value => {
		return String(Number(value.toPrecision(PREVIEW_PRECISION)));
	};

	// The one element under the mode chips: it describes the chip of the current mode and only it -
	// the hint tells what that mode does, and a description put on the group itself is what NVDA and
	// JAWS announce unevenly. See the template.
	const MODE_HINT_ID = 'bizprocdesigner-expression-builder-mode-hint';

	// A section is named by the title above it: the group of mode chips by the one, the formula
	// section by the other.
	const MODES_TITLE_ID = 'bizprocdesigner-expression-builder-modes-title';
	const FORMULA_TITLE_ID = 'bizprocdesigner-expression-builder-formula-title';

	// The hint that explains why the modifier chip is disabled, see the template.
	const NO_MODIFIERS_HINT_ID = 'bizprocdesigner-expression-builder-no-modifiers';

	// The hint that explains why the button growing the chain is disabled, see the template.
	const ADD_OPERAND_LIMIT_HINT_ID = 'bizprocdesigner-expression-builder-calc-add-operand-limit';

	// The hint that explains why the picked range cannot be grouped, see the template.
	const GROUP_BLOCK_HINT_ID = 'bizprocdesigner-expression-builder-calc-group-block';
	function matchModifierId(modifierText) {
		if (!main_core.Type.isStringFilled(modifierText)) {
			return null;
		}
		const normalized = modifierText.trim().toLowerCase();
		const modifier = MODIFIERS.find(item => item.id === normalized || item.nameInCode.toLowerCase() === normalized);
		return modifier?.id ?? null;
	}

	/**
	 * A chip of the value chain: its body opens the layer that fills it (the source list, the modifier
	 * menu), the clear button empties it. Every chip of the window is this one - the source and the
	 * modifier here, the calculator operands later - so the chain reads the same everywhere.
	 *
	 * Two buttons and not the design-system chip: its own clear is an icon without an accessible name of
	 * its own, while clearing must be a control a screen reader can find and name.
	 *
	 * @vue/component
	 */
	const FormulaChip = {
		name: 'ExpressionBuilderFormulaChip',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			FormulaParts,
			BxTextMd: ui_system_typography_vue.TextMd
		},
		props: {
			// A value shown as one label: the readable title of a source, the name of a modifier. A chip
			// that holds a value of the workflow shows it by its parts instead, see below.
			text: {
				type: String,
				default: ''
			},
			/**
			 * The value of the chip split into the typed parts of the formula: every part is painted by
			 * its own role, so a reference with a modifier reads inside one chip the way it reads in the
			 * formula. Parts and a label are the two ways one chip shows a value, and never both at once.
			 *
			 * @type Array<FormulaPart>
			 */
			parts: {
				type: Array,
				default: () => []
			},
			// Shown instead of an empty text, as the placeholder of a field does.
			placeholder: {
				type: String,
				default: ''
			},
			// Names the readonly chip as well: it is a scrollable region of its own (see expression-builder-body.css) and
			// takes the focus so that its value can be scrolled from the keyboard, so it needs a name -
			// its own one, the title of the section around it already names the section.
			ariaLabel: {
				type: String,
				default: ''
			},
			// Names the element that explains the state of the chip: the hint of a disabled chip.
			ariaDescribedby: {
				type: String,
				default: ''
			},
			// What a chip showing a label holds, in the vocabulary of the formula parts (FORMULA_PART):
			// it paints the label in the same palette the parts are painted with. A chip that shows
			// parts needs none: every part of it carries its own role.
			kind: {
				type: String,
				default: ''
			},
			// A filled label is what turns the clear button on: it is also its accessible name.
			clearLabel: {
				type: String,
				default: ''
			},
			// Marks the chip as one of those a rounding sign of the chain reaches over, see showSignScope.
			highlighted: {
				type: Boolean,
				default: false
			},
			/**
			 * Turns the chip into a toggle: in the range-selection mode its body does not open a layer
			 * but adds the operand to the range and takes it back out. The pressed state is what says
			 * so: a chip told apart by its color alone says nothing to a screen reader.
			 */
			toggle: {
				type: Boolean,
				default: false
			},
			pressed: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			// The chip only shows its value: no layer to open, nothing to clear, so it is no control at
			// all and must not be one for a screen reader either.
			readonly: {
				type: Boolean,
				default: false
			},
			testId: {
				type: String,
				default: ''
			}
		},
		emits: ['click', 'clear'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			isEmpty() {
				return this.parts.length === 0 && !main_core.Type.isStringFilled(this.text);
			},
			// The placeholder of an empty chip; a chip showing parts never gets here.
			label() {
				return this.isEmpty ? this.placeholder : this.text;
			},
			// The kind belongs to the value, so an empty chip has none: its own muted color stays the one
			// the placeholder is shown in.
			kindClass() {
				return this.isEmpty || !main_core.Type.isStringFilled(this.kind) ? null : `--${this.kind}`;
			}
		},
		methods: {
			// The control the layer belongs to: it carries aria-haspopup / aria-expanded and takes the
			// focus back when the layer closes. The wrapper around it would mean nothing to a reader.
			getTriggerElement() {
				return this.$refs.body ?? null;
			}
		},
		template: `
		<span
			class="bizprocdesigner-expression-builder-chip"
			:class="[kindClass, {
				'--empty': isEmpty,
				'--disabled': disabled,
				'--scope': highlighted,
				'--selected': toggle && pressed,
			}]"
		>
			<span
				v-if="readonly"
				class="bizprocdesigner-expression-builder-chip__value"
				role="group"
				tabindex="0"
				:aria-label="ariaLabel || null"
				:data-testid="testId || null"
			>
				<BxTextMd tag="span" className="bizprocdesigner-expression-builder-chip__text">
					<FormulaParts v-if="parts.length" :parts="parts"/>
					<template v-else>{{ label }}</template>
				</BxTextMd>
			</span>
			<template v-else>
				<button
					ref="body"
					type="button"
					class="bizprocdesigner-expression-builder-chip__body"
					:disabled="disabled"
					:aria-label="ariaLabel || null"
					:aria-describedby="ariaDescribedby || null"
					:aria-pressed="toggle ? String(pressed) : null"
					:data-testid="testId || null"
					@click="$emit('click')"
				>
					<BxTextMd tag="span" className="bizprocdesigner-expression-builder-chip__text">
						<FormulaParts v-if="parts.length" :parts="parts"/>
						<template v-else>{{ label }}</template>
					</BxTextMd>
				</button>
				<button
					v-if="clearLabel"
					type="button"
					class="bizprocdesigner-expression-builder-chip__clear"
					:aria-label="clearLabel"
					:data-testid="testId ? testId + '-clear' : null"
					@click="$emit('clear')"
				>
					<BIcon :name="Outline.CROSS_S" :size="20" aria-hidden="true"/>
				</button>
			</template>
		</span>
	`
	};

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
	const ExpressionBuilderBody = {
		name: 'ExpressionBuilderBody',
		components: {
			Chip: ui_system_chip_vue.Chip,
			UiButton: ui_vue3_components_button.Button,
			BInput: ui_system_input_vue.BInput,
			BMenu: ui_system_menu_vue.BMenu,
			BIcon: ui_iconSet_api_vue.BIcon,
			SourceList,
			FormulaChip,
			BxTextMd: ui_system_typography_vue.TextMd,
			BxText2Xs: ui_system_typography_vue.Text2Xs,
			BxText3Xs: ui_system_typography_vue.Text3Xs
		},
		props: {
			initialValue: {
				type: String,
				default: ''
			},
			/** Mode owned by the host: a filled one replaces the own switch, null keeps it. */
			mode: {
				type: String,
				default: null
			},
			/**
			 * The sections of the source list, ready made: the window owns no source of its own and
			 * shows what the host gives it, headings and all. A host that has them at hand passes them
			 * here; one that has to collect them passes `sourcesProvider` instead, and the two are never
			 * passed together — a filled list is the answer, and nothing is collected for it. Neither of
			 * the two means a window with no source to offer, which is a state of its own and no error.
			 *
			 * @type ?Array<Section>
			 */
			sourceSections: {
				type: Array,
				default: null
			},
			/**
			 * Collects the sections of the source list, once per window and not before that list is first
			 * shown: the sources of a host are worth a walk of its own — the schema of a workflow, a
			 * request for the fields of a document — and a window that opens on the functions shows none
			 * of them until the entry into the list.
			 *
			 * Gives the sections back, a promise of them, or — for a host whose sections are ready in
			 * parts — what is ready now along with a promise of the next stage, which answers the same
			 * way again: so a host with several sources of its own hands each one over as soon as it is
			 * there, and the chain ends on the stage that answers with the sections themselves. What a
			 * stage brought is shown before the wait for the next one starts, and every stage replaces
			 * the set whole — a host repeats in it what it has already given.
			 *
			 * Collecting fails in one state, whichever way the failure comes: a promise that rejects, a
			 * throw out of the provider itself and an answer that is no list of sections all leave the
			 * list saying so, instead of any of them passing for a host with nothing to offer. What the
			 * stages before published stays on the screen next to that state.
			 *
			 * @type ?() => Answer, where Answer is
			 *   Array<Section>
			 *   | Promise<Answer>
			 *   | { sections: Array<Section>, pending: Promise<Answer> }
			 */
			sourcesProvider: {
				type: Function,
				default: null
			},
			/**
			 * Lets the window name the values of `sourceSections` on the chips: a value the host handed
			 * in outright wears the title of its item instead of the reference behind it. Off unless the
			 * host says otherwise — the sections it brought are the host's, see loadedSourceItems. Says
			 * nothing about the sections `sourcesProvider` collects: those the window names always.
			 */
			allowSourceSectionLabels: {
				type: Boolean,
				default: false
			},
			/** Emit `apply` on every assembled value instead of drawing the own footer. */
			applyOnChange: {
				type: Boolean,
				default: false
			},
			/**
			 * The source the formula is about, as a reference. A host that binds the formula to something
			 * — the data view dialog binds it to a column — passes it, and every mode starts from it
			 * instead of from nothing. Empty for a host where the formula is about nothing in particular.
			 * A bound source is also fixed: modification applies to it and offers no source to pick.
			 */
			boundSource: {
				type: String,
				default: ''
			},
			/** Types of `boundSource` when the host knows them — what the modifier chips are filtered by. */
			boundSourceTypes: {
				type: Object,
				default: () => ({
					type: null,
					baseType: null
				})
			},
			/**
			 * Names of the functions the host accepts — a host that takes only part of the catalog, as the
			 * data view does, passes them and the rest are not offered. `null` is the whole catalog.
			 */
			allowedFunctions: {
				type: Array,
				default: null
			}
		},
		emits: ['apply', 'close'],
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage,
				Outline: ui_iconSet_api_vue.Outline,
				ChipSize: ui_system_chip_vue.ChipSize,
				InputSize: ui_system_input_vue.InputSize,
				InputDesign: ui_system_input_vue.InputDesign,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				EXPRESSION_BUILDER_MODES,
				CALC_OP,
				FORMULA_PART,
				MODE_HINT_ID,
				MODES_TITLE_ID,
				FORMULA_TITLE_ID,
				NO_MODIFIERS_HINT_ID,
				ADD_OPERAND_LIMIT_HINT_ID,
				GROUP_BLOCK_HINT_ID
			};
		},
		data() {
			return {
				currentMode: EXPRESSION_BUILDER_MODES.functions,
				draft: initialDraft(),
				editingOperand: null,
				modifierSource: '',
				modifierSourceTypes: {
					type: null,
					baseType: null
				},
				modifierId: null,
				pickingFor: null,
				functionItems: [],
				providedSections: [],
				isLoadingFunctions: false,
				isLoadingSources: false,
				hasFunctionsError: false,
				hasSourcesError: false,
				openSignIndex: null,
				operationMenuBindElement: null,
				scopeSignIndex: null,
				isSelectingGroup: false,
				groupSelection: null,
				isModifierMenuShown: false,
				modifierMenuBindElement: null
			};
		},
		computed: {
			activeMode() {
				return main_core.Type.isStringFilled(this.mode) ? this.mode : this.currentMode;
			},
			hasOwnModeSwitch() {
				return !main_core.Type.isStringFilled(this.mode);
			},
			modes() {
				return [{
					id: EXPRESSION_BUILDER_MODES.functions,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODE_FUNCTIONS'),
					icon: ui_iconSet_api_vue.Outline.SIGMA_SUMM,
					hint: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FUNCTIONS_HINT'),
					note: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FUNCTIONS_INSERT_HINT'),
					noteTestId: 'bizprocdesigner-expression-builder-functions-insert-hint'
				}, {
					id: EXPRESSION_BUILDER_MODES.modification,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODE_MODIFICATION'),
					icon: ui_iconSet_api_vue.Outline.ARROW_RIGHT_M,
					hint: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_HINT'),
					note: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_TYPE_HINT'),
					noteTestId: 'bizprocdesigner-expression-builder-modifier-type-hint'
				}, {
					id: EXPRESSION_BUILDER_MODES.calculator,
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODE_CALCULATOR'),
					icon: ui_iconSet_api_vue.Outline.DIGITS_123,
					hint: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_HINT'),
					note: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_CHAIN_HINT'),
					noteTestId: 'bizprocdesigner-expression-builder-calc-chain-hint'
				}];
			},
			currentModeItem() {
				return this.modes.find(mode => mode.id === this.activeMode) ?? null;
			},
			currentModeHint() {
				return this.currentModeItem?.hint ?? '';
			},
			currentModeNote() {
				return this.currentModeItem?.note ?? '';
			},
			currentModeNoteTestId() {
				return this.currentModeItem?.noteTestId ?? null;
			},
			/**
			 * The operations as the window shows them, with the two signs each of them stands by. The
			 * chain stands for the expression, so it shows the infix operator; the menu names the
			 * operations, so it shows the typographic sign of every one. Rounding has no infix operator
			 * at all, and its rounding sign is the one sign that stands in both places - and in neither assembled
			 * string, which is built from `symbol` alone (see buildFormulaString).
			 */
			operations() {
				return CALC_OPERATIONS.map(operation => ({
					id: operation.id,
					title: this.getMessage(operation.labelKey),
					chainSign: operation.symbol ?? operation.displaySymbol,
					menuSign: operation.displaySymbol ?? operation.symbol
				}));
			},
			// Every gap of the chain has a sign of its own, and every sign is a control of its own.
			signViews() {
				return this.draft.signs.map((signId, index) => {
					const operation = this.operations.find(item => item.id === signId) ?? null;
					const title = operation?.title ?? '';
					return {
						index,
						text: operation?.chainSign ?? title,
						// A bare symbol says nothing to a screen reader, so the sign is named after its
						// operation and its place in the chain: every sign offers the same operations,
						// and named after the operation alone they would all be called the same.
						ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERATION_ARIA', {
							'#NUMBER#': String(index + 1),
							'#OPERATION#': title
						}),
						isRound: signId === CALC_OP.round,
						testId: `bizprocdesigner-expression-builder-sign-${index}`
					};
				});
			},
			// The one menu of the window is open on exactly one sign, or on none at all.
			isOperationMenuShown() {
				return this.openSignIndex !== null;
			},
			/**
			 * The operands a shown rounding scope covers, or none while no scope is shown. A rounding
			 * sign takes the accumulated prefix of its own chain as its first argument (see
			 * buildFormulaString), so that prefix is what the sign marks while it is hovered or focused:
			 * from the head of the group the sign stands in, or of the whole formula, up to the operand
			 * before the sign - the sign itself is not part of the argument and keeps its own hover
			 * instead. The narrowed mark is the main way the boundary of a rounding is seen.
			 */
			roundScope() {
				const index = this.scopeSignIndex;
				if (index === null || this.signViews[index]?.isRound !== true) {
					return null;
				}
				return {
					from: this.groupAroundSign(index)?.from ?? 0,
					to: index
				};
			},
			operationMenuOptions() {
				return {
					bindElement: this.operationMenuBindElement,
					width: 220,
					// main.popup always gives the container role="dialog", so the menu needs its own name.
					ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_MENU_LABEL'),
					// The menu is a popup of its own in document.body, outside the window container the
					// window trap loops Tab inside, so without a trap around the menu itself its items
					// are unreachable from the keyboard. Closing it returns the focus to the button of
					// the sign that opened it - the element itself and not its index, which the closing
					// has already cleared. initialFocus: true is the first tabbable item of the menu.
					focusTrap: {
						initialFocus: true,
						restoreFocus: () => this.operationMenuBindElement
					},
					autoHideHandler: this.shouldOperationMenuAutoHide,
					items: this.operations.map(operation => this.buildOperationItem(operation))
				};
			},
			/** Function names are lowercase on both sides, but the server compares them case-insensitively. */
			offeredFunctionItems() {
				if (!main_core.Type.isArray(this.allowedFunctions)) {
					return this.functionItems;
				}
				const allowed = new Set(this.allowedFunctions.map(name => String(name).toLowerCase()));
				return this.functionItems.filter(item => allowed.has(item.title.toLowerCase()));
			},
			functionSections() {
				return [{
					id: 'functions',
					title: '',
					items: this.offeredFunctionItems
				}];
			},
			// A load failure is told apart from a portal without functions: the list must not pass an
			// empty result off as the answer when it never got one.
			functionsErrorText() {
				return this.hasFunctionsError ? this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FUNCTIONS_LOAD_ERROR') : '';
			},
			// The same failure the function list has, and told apart from a host with nothing to offer for
			// the same reason: an answer that never arrived must not pass for an empty one.
			sourcesErrorText() {
				return this.hasSourcesError ? this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCES_LOAD_ERROR') : '';
			},
			// Whichever of the two inputs the host filled, see ensureSourcesLoaded; neither of them means
			// a window with no source to offer.
			visibleSourceSections() {
				return this.sourceSections ?? this.providedSections;
			},
			/**
			 * The collected sources by their value: the chain asks for a label once per operand, and a
			 * walk over every section per operand is what that costs otherwise. Rebuilt when the sections
			 * arrive and never before - the map reads what the window already has and starts no
			 * collection of its own, see findLoadedSourceItem.
			 *
			 * What the provider collected is always read; the sections a host handed in outright are read
			 * only when that host allows it, see allowSourceSectionLabels. A value found here loses its
			 * reference on the chip and wears a title instead, and that is a naming not every host asks
			 * for - the value modifier of the data view brings its columns in itself and shows
			 * `{=Column:CODE}` as written, so by default what the host brought stays the host's. A host
			 * whose titles are the better name - the fields of a form know theirs before the window opens -
			 * turns the naming on, and then a value is named the same whichever of the two inputs it came
			 * from.
			 *
			 * With the naming on the map reads what the list itself shows, precedence and all: naming a
			 * value the list does not offer would be a rule of its own, free to drift away from the list.
			 *
			 * The section an item is first found in wins, as the walk over the three lists did: a document
			 * field stands for a value before a schema source, and a schema source before a system
			 * variable.
			 */
			loadedSourceItems() {
				const items = new Map();
				const namedSections = this.allowSourceSectionLabels ? this.visibleSourceSections : this.providedSections;
				for (const section of namedSections) {
					for (const item of section.items) {
						if (!items.has(item.value)) {
							items.set(item.value, item);
						}
					}
				}
				return items;
			},
			/**
			 * Everything the chain needs about its operands, in order: every operand reads the same way
			 * and keeps its own name in every label, see buildOperandView.
			 *
			 * A view is built once for the state it belongs to and kept for as long as that state holds:
			 * a keystroke rebuilds the operand it lands in and leaves the rest of the chain alone - both
			 * the parse behind every other chip and, since those views stay the same objects, the
			 * re-render of every other chip. Everything a view is built from besides the text of its own
			 * operand belongs to the chain as a whole, and that is what the memo is dropped by, see
			 * keptOperandViews.
			 *
			 * The memo is written where it is owned and not from here: a computed property has to read
			 * as one, see rememberOperandViews.
			 */
			operandViews() {
				return this.withBracketDepth(this.rememberOperandViews());
			},
			// The value of the one operand open in its field: the field writes into the model through it.
			editedOperandValue: {
				get() {
					return this.editingOperand === null ? '' : this.draft.operands[this.editingOperand] ?? '';
				},
				set(value) {
					if (this.editingOperand !== null) {
						this.draft = setOperand(this.draft, this.editingOperand, value);
					}
				}
			},
			/**
			 * The chain as it is assembled and computed: an operand carries no padding of its own into
			 * the expression, and the round trip through the parse would bring it back trimmed anyway.
			 */
			trimmedDraft() {
				return {
					...this.draft,
					operands: this.draft.operands.map(operand => operand.trim())
				};
			},
			/**
			 * Confirmation is available on a chain the window expresses and on no other: the predicate
			 * of the domain answers at once for the chain being complete, for every operand being a
			 * single term and for the assembled string staying inside the limits of the parse -
			 * everything that would otherwise be lost without a word on the next open of the window.
			 */
			canApplyCalculator() {
				return isExpressibleChain(this.trimmedDraft);
			},
			/**
			 * Why confirmation is unavailable, said in the words of the chain: a disabled button with no
			 * reason beside it leaves the one who filled the operands guessing. The reasons go from the
			 * most particular to the most general, and the general one is the chain itself - what it
			 * assembles no longer fits what the parse reads back.
			 */
			calcBlockReason() {
				if (this.canApplyCalculator) {
					return '';
				}
				const operands = this.trimmedDraft.operands;
				const emptyIndex = operands.findIndex(operand => !main_core.Type.isStringFilled(operand));
				if (emptyIndex >= 0) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_BLOCK_OPERAND_EMPTY', {
						'#OPERAND#': this.operandViews[emptyIndex].name
					});
				}

				// The length of the operand is asked before its form and not after: the scan refuses an
				// operand past the ceiling before it reads a token of it, so every such operand answers
				// "not a term" as well - and calling a length a broken form would send the one who
				// filled it to rewrite what is written right.
				if (operands.some(operand => !fitsOperandLength(operand))) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_BLOCK_TOO_LONG');
				}

				// The lexical form of the operand alone: an operand that is a term and too long for the
				// formula around it is no fault of its form, and the length above is what says so.
				const brokenIndex = operands.findIndex(operand => !isSingleTerm(operand));
				if (brokenIndex >= 0) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_BLOCK_OPERAND_TERM', {
						'#OPERAND#': this.operandViews[brokenIndex].name
					});
				}

				// A sign with no operand after it: the chain the window builds never has one, but a
				// chain read out of a saved value might, and it must not be blamed on the length below.
				if (this.trimmedDraft.signs.length !== operands.length - 1) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_BLOCK_DANGLING_SIGN');
				}
				return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_BLOCK_TOO_LONG');
			},
			/**
			 * Whether the chain has room for one more operand - the guard paired with the predicate of an
			 * expressible chain: the window does not offer to assemble what it would neither read back
			 * nor open again. Measured on the chain as it would be right after the click, with every
			 * operand that is not a term yet standing in as the shortest term there is: what decides is
			 * the chain, not the text half-typed into one of its operands.
			 *
			 * An operand too long for the formula around it stands in for nothing and goes in as it is:
			 * it is no term either, but its length is the whole matter here, and a probe term put in its
			 * place would offer to grow a chain that could never be applied.
			 */
			canAddOperand() {
				const operands = this.trimmedDraft.operands.map(operand => isSingleTerm(operand) || !fitsOperandLength(operand) ? operand : PROBE_TERM);
				return isExpressibleChain(appendOperand({
					...this.trimmedDraft,
					operands
				}, PROBE_TERM, CALC_OP.add));
			},
			/**
			 * Why the chain cannot grow any further, or nothing at all while it still can: the ceiling
			 * of operands the window works by, or the length the parse reads back. Two reasons and not
			 * one - a chain of three short operands stopped by a ceiling of fifty would leave the one
			 * who filled them looking for the length that is not the matter here.
			 */
			addOperandBlockReason() {
				if (this.canAddOperand) {
					return '';
				}
				return this.trimmedDraft.operands.length >= MAX_CHAIN_OPERANDS ? this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_ADD_OPERAND_COUNT_LIMIT', {
					'#LIMIT#': String(MAX_CHAIN_OPERANDS)
				}) : this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_ADD_OPERAND_LIMIT');
			},
			/**
			 * Whether the range-selection mode can be entered: a group is two neighbouring operands at
			 * the least, and the mode is not entered twice.
			 */
			canStartGrouping() {
				return this.draft.operands.length > 1 && !this.isSelectingGroup;
			},
			/**
			 * Whether the picked range may become a group. What makes a range groupable is the model's
			 * to answer (see canGroupOperands): the window only adds the length of a group, which is a
			 * rule of the interface and not of the expression - the model reads `(A)` back just fine.
			 */
			canConfirmGroup() {
				const selection = this.groupSelection;
				return selection !== null && selection.to > selection.from && canGroupOperands(this.draft, selection.from, selection.to);
			},
			/**
			 * Why the picked range cannot be grouped, said in the words of the chain. The model answers
			 * with a plain no, so the reason is narrowed down by what the window can see for itself -
			 * the length of the range and the groups already standing in the chain - and the two
			 * placements the model itself refuses are told apart by where the range begins. A range
			 * that starts the chain assembles the very string the chain assembles without it: the call
			 * of the rounding it ends with already stands on both of its boundaries. Any other refused
			 * range begins on the number of decimal places of a rounding, and that is one operand:
			 * grouping it would assemble `round(A, (B) + C)`, which the server reads as rounding to
			 * `B + C` places instead of the "round to B places, then add C" put together here.
			 */
			groupBlockReason() {
				const selection = this.groupSelection;
				if (!this.isSelectingGroup || selection === null || this.canConfirmGroup) {
					return '';
				}
				if (selection.to === selection.from) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_BLOCK_SHORT');
				}
				const overlaps = this.draft.groups.some(group => group.from <= selection.to && selection.from <= group.to);
				if (overlaps) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_BLOCK_OVERLAP');
				}
				return this.getMessage(selection.from === 0 ? 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_BLOCK_WHOLE_CHAIN' : 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_BLOCK_PRECISION');
			},
			// What the picked range is, in the names the chain gives its operands: the selection is a
			// state of the window with no reading of its own, so this is what announces it.
			groupSelectionText() {
				const selection = this.groupSelection;
				if (selection === null) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_SELECTION_NONE');
				}
				if (selection.from === selection.to) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_SELECTION_ONE', {
						'#OPERAND#': this.operandViews[selection.from].name
					});
				}
				return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_SELECTION_RANGE', {
					'#FROM#': this.operandViews[selection.from].name,
					'#TO#': this.operandViews[selection.to].name
				});
			},
			assembledFormula() {
				return buildFormulaString(this.trimmedDraft);
			},
			preview() {
				return evaluateFormulaDraft(this.trimmedDraft);
			},
			/**
			 * What the preview warns about, or nothing at all. The model answers with the warnings of
			 * the chain, and one more comes from the arithmetic itself: a sum that ran out of the range
			 * of a double is an infinity, and the difference of two infinities is not a number at all.
			 * Neither is a result to show as one, and to the reader it means what a non-numeric operand
			 * means - the value is not a number.
			 */
			previewWarningCode() {
				if (this.preview.kind === PREVIEW_KIND.warning) {
					return this.preview.code;
				}
				return this.preview.kind === PREVIEW_KIND.value && !Number.isFinite(this.preview.value) ? PREVIEW_WARNING.notANumber : null;
			},
			previewText() {
				if (this.preview.kind === PREVIEW_KIND.dependsOnData) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_PREVIEW_DEPENDS');
				}
				if (this.previewWarningCode !== null) {
					return this.previewWarningCode === PREVIEW_WARNING.divByZero ? this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_WARNING_DIV_ZERO') : this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_WARNING_NAN');
				}
				return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_PREVIEW_RESULT', {
					'#VALUE#': formatPreviewValue(this.preview.value)
				});
			},
			isPreviewWarning() {
				return this.previewWarningCode !== null;
			},
			/**
			 * A guaranteed runtime error, so it is the only warning that blocks Apply: the preview
			 * raises div-by-zero for a divisor it knows to be nought, and it knows one whatever the
			 * references beside it are worth - an operation over an unknown value is unknown, and a
			 * division by nought is an error. not-a-number must NOT block: such an operand may well be a
			 * runtime numeric expression the preview cannot evaluate.
			 */
			isLiteralDivisionByZero() {
				return this.previewWarningCode === PREVIEW_WARNING.divByZero;
			},
			/** A host that binds the formula owns the source too: there is nothing here to pick or change. */
			isModifierSourceFixed() {
				return main_core.Type.isStringFilled(this.boundSource);
			},
			/** Types of the source in hand: known to the host for the one it binds, picked up with the rest. */
			modifierTypes() {
				return this.modifierSource === this.boundSource ? this.boundSourceTypes : this.modifierSourceTypes;
			},
			hasSelectedSource() {
				return main_core.Type.isStringFilled(this.modifierSource);
			},
			/**
			 * Where a source pick lands right now. Modification opens on the source list, so the pick
			 * target is implied there; both the list and the pick handler must read this one value.
			 */
			pickTarget() {
				if (this.pickingFor !== null) {
					return this.pickingFor;
				}
				const isModification = this.activeMode === EXPRESSION_BUILDER_MODES.modification;
				return isModification && !this.hasSelectedSource ? 'modifier' : null;
			},
			isPickingModifierSource() {
				return this.pickTarget === 'modifier';
			},
			isPickingOperand() {
				return main_core.Type.isNumber(this.pickTarget);
			},
			modifierList() {
				return this.hasSelectedSource ? getApplicableModifiers(this.modifierTypes) : [];
			},
			hasModifiers() {
				return this.modifierList.length > 0;
			},
			// Recomputed both when the source changes and when the loaded lists arrive, see sourceChipLabel.
			modifierSourceLabel() {
				return this.sourceChipLabel(this.modifierSource);
			},
			sourceChipAriaLabel() {
				return this.hasSelectedSource ? this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_CHANGE_SOURCE_ARIA', {
					'#SOURCE#': this.modifierSourceLabel
				}) : this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_CHANGE_SOURCE');
			},
			// Named after the modifier itself, as the operation button is named after its operation: the
			// chip is the value, and the menu behind it is how the value is changed.
			modifierChipText() {
				return this.selectedModifier ? this.getMessage(this.selectedModifier.labelKey) : '';
			},
			modifierMenuOptions() {
				return {
					bindElement: this.modifierMenuBindElement || this.getChipElement('modifierChip'),
					width: 320,
					// main.popup always gives the container role="dialog", so the menu needs its own name.
					ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_MENU_LABEL'),
					// Its own trap, as for the operation menu: the window trap loops Tab inside the window
					// and does not reach a layer opened on top of it. Closing returns the focus to the chip.
					focusTrap: {
						initialFocus: true,
						restoreFocus: () => this.getChipElement('modifierChip')
					},
					autoHideHandler: this.shouldModifierMenuAutoHide,
					items: this.modifierList.map(modifier => ({
						id: `bizprocdesigner-expression-builder-modifier-${modifier.id}`,
						title: this.getMessage(modifier.labelKey),
						subtitle: this.getMessage(modifier.descriptionKey),
						// A boolean is what makes the item a checkbox for the menu: it writes aria-checked.
						isSelected: this.modifierId === modifier.id,
						onClick: () => this.selectModifier(modifier.id)
					}))
				};
			},
			showModifierWarning() {
				return this.hasSelectedSource && !isSourceTypeKnown(this.modifierTypes);
			},
			noModifiersForType() {
				return this.hasSelectedSource && isSourceTypeKnown(this.modifierTypes) && this.modifierList.length === 0;
			},
			selectedModifier() {
				return findModifierById(this.modifierId);
			},
			hasSelectedModifier() {
				return this.selectedModifier !== null;
			},
			modifierExpression() {
				return this.hasSelectedSource && this.selectedModifier ? applyModifier(this.modifierSource, this.selectedModifier.wire) : '';
			},
			/**
			 * What the formula block shows in Functions mode: the value the field holds right now, as it
			 * is stored and split into its typed parts. The mode inserts a call into the field itself,
			 * so there is no chain of its own to show, and the chip only shows the value - see the
			 * readonly prop of FormulaChip. A value the model does not express comes back as the one
			 * filler part, so such a value is shown as it is and nothing of it is rewritten.
			 *
			 * A value of more parts than the window paints is shown the same way, see
			 * MAX_HIGHLIGHT_PARTS: the chip is one element per part, and a value the parse still reads
			 * back is thousands of them at once.
			 */
			fieldValueParts() {
				return describeFormulaParts(this.initialValue ?? '', MAX_HIGHLIGHT_PARTS);
			},
			// The name of the value chip, which is a scrollable region and needs one. Its own phrase, not
			// the one of the placeholder: the placeholder stands in for a missing value, so an empty chip
			// would be read out twice over - once as its text, once as its name. The title above the
			// section names the section.
			formulaValueLabel() {
				return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FORMULA_VALUE_LABEL');
			},
			/**
			 * Whether the footer has anything to apply. Functions never have: the call goes into the
			 * field on click, so the button of the footer stays in place and inactive there - a button
			 * that comes and goes with the mode reads as a failure of the window.
			 */
			canApplyCurrent() {
				if (this.activeMode === EXPRESSION_BUILDER_MODES.calculator) {
					return this.canApplyCalculator && !this.isLiteralDivisionByZero;
				}
				if (this.activeMode === EXPRESSION_BUILDER_MODES.modification) {
					return main_core.Type.isStringFilled(this.modifierExpression);
				}
				return false;
			},
			// What the mode in hand has assembled, whether or not it may be applied yet.
			currentFormula() {
				if (this.activeMode === EXPRESSION_BUILDER_MODES.calculator) {
					return this.assembledFormula;
				}
				if (this.activeMode === EXPRESSION_BUILDER_MODES.modification) {
					return this.modifierExpression;
				}
				return '';
			}
		},
		watch: {
			previewText(text) {
				if (this.canApplyCalculator) {
					this.announceChainState(text);
				}
			},
			// The reason confirmation is unavailable stands under the chain, and the chain is what has
			// the focus while it is being filled: the reader hears the reason from here, on the same
			// pause the preview is announced on. The two never stand together - a chain the preview can
			// be computed for has no reason to show.
			calcBlockReason(reason) {
				if (main_core.Type.isStringFilled(reason)) {
					this.announceChainState(reason);
				}
			},
			showModifierWarning(shown) {
				if (shown) {
					ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_UNKNOWN_TYPE_WARNING'));
				}
			},
			// The hint appears after a source is picked, when the focus has already moved on to its
			// chip: nothing else tells a reader that there is no modifier to choose here.
			noModifiersForType(shown) {
				if (shown) {
					ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_NO_MODIFIERS'));
				}
			},
			// Every state that re-creates the calculator buttons or changes what they announce, see
			// syncButtonsAria.
			activeMode: ['scheduleButtonsAriaSync', 'leaveMode'],
			/**
			 * A host that took the footer takes the value as it is assembled instead - but only what a
			 * human has assembled: while the formula is still the one the prefill put together, the
			 * field of the host keeps the value it had. The latch is one-way, so an edit that comes back
			 * to the hint reaches the host like any other, see created().
			 *
			 * The latch itself belongs to the window and not to that host: both ways a value leaves the
			 * window go by it, see handleApply.
			 */
			currentFormula(formula) {
				this.isFormulaTouched ||= !this.prefilledFormulas.has(formula);
				if (this.applyOnChange && this.isFormulaTouched && this.canApplyCurrent) {
					this.$emit('apply', formula);
				}
			},
			pickTarget(target) {
				this.scheduleButtonsAriaSync();

				// Entering the source list is what the sources are collected for, see ensureSourcesLoaded.
				if (target !== null) {
					void this.ensureSourcesLoaded();
				}
			},
			/**
			 * Why the picked range cannot be grouped is told the same way the chain tells why it cannot
			 * be applied: on the same pause, through the same channel. The selection itself is announced
			 * at once by the click that changed it (see toggleOperandSelection) - the reason follows it
			 * and does not race it.
			 */
			groupBlockReason(reason) {
				if (main_core.Type.isStringFilled(reason)) {
					this.announceChainState(reason);
				}
			},
			// The chain re-creates its buttons whenever it grows, shrinks or changes what a sign says.
			draft: 'scheduleButtonsAriaSync',
			editingOperand: ['scheduleButtonsAriaSync', 'syncOperandDocumentListeners'],
			openSignIndex: 'scheduleButtonsAriaSync',
			isSelectingGroup: 'scheduleButtonsAriaSync',
			groupSelection: 'scheduleButtonsAriaSync',
			isModifierMenuShown: 'scheduleButtonsAriaSync'
		},
		created() {
			this.prefillFromValue(this.initialValue);
			// Opening the window changes no value of the field: what the prefill has assembled is a
			// starting hint and not a formula anyone has built, so a host that takes the value as it is
			// assembled gets nothing until an edit moves the formula off that hint, see the watcher of
			// currentFormula. Non-reactive, as everything the template does not draw.
			// The empty formula of the functions mode is one of them: that mode assembles nothing (see
			// currentFormula), so a visit to it and back is no edit of the value.
			this.prefilledFormulas = new Set(['', this.assembledFormula, this.modifierExpression]);
			this.isFormulaTouched = false;
			this.isDestroyed = false;
			// Not in data(): a promise is no part of the render state, see ensureSourcesLoaded.
			this.sourcesPromise = null;
			// Neither is the map of the chain elements: the template does not draw it and nothing
			// re-renders by it, see registerChainElement. The ref functions that fill it are kept the
			// same way and for the same reason, see chainElementRef.
			this.chainElements = new Map();
			this.chainElementSetters = new Map();
			// Neither the memo of the operand views: it is read and written while operandViews is
			// computed, and a reactive memo would make that computation depend on itself.
			this.operandViewMemo = new Map();
			this.operandViewMemoKey = null;
			this.operandViewMemoSources = null;
			// Neither the state of the pointer nor the fold waiting for its click is drawn by the
			// template, see handleOperandBlur - and neither is whether the document listeners those two
			// belong to are bound right now, see setOperandDocumentListeners.
			this.isPointerPressed = false;
			this.operandToFoldOnClick = null;
			this.isOperandDocumentBound = false;
			// Debounced: what the chain says about itself - the preview, or the reason it cannot be
			// applied - changes on every keystroke, and one announcement per pause is enough.
			// Runtime.debounce gives no cancel, so a pending call is dropped by the flag instead —
			// after the window is closed the announcement would read out a stale preview.
			this.announceChainState = main_core.Runtime.debounce(text => {
				if (!this.isDestroyed) {
					ui_a11y.LiveAnnouncer.announce(text);
				}
			}, 400, this);
			void this.loadFunctions();
			// The watcher of pickTarget never sees the value the component was created with, and a host
			// that fixes mode="modification" opens on the source list from the very first frame: the entry
			// the watcher waits for has already happened. Here and not an immediate watcher - that call
			// would run before the body above and lose its memo to sourcesPromise = null, asking the
			// provider a second time on the first entry into the list.
			if (this.pickTarget !== null) {
				void this.ensureSourcesLoaded();
			}
		},
		mounted() {
			this.syncButtonsAria();
		},
		beforeUnmount() {
			this.isDestroyed = true;
			this.setOperandDocumentListeners(false);
			// The markup of the chain is gone, what it filled is not: the elements of its places, the
			// ref functions filling them, the views kept for them and the lists of sources those were
			// built from live on for as long as anything holds the component - the debounced
			// announcement waiting out its pause among such holders.
			this.chainElements.clear();
			this.chainElementSetters.clear();
			this.operandViewMemo = new Map();
			this.operandViewMemoKey = null;
			this.operandViewMemoSources = null;
		},
		methods: {
			/**
			 * UiButton builds its native button imperatively, so attributes put on the component in the
			 * template never reach it: they are written straight to the button elements. The whole
			 * markup is a slot of Popup, so this component itself never re-renders and cannot rely on
			 * updated(): every relevant state calls this through scheduleButtonsAriaSync.
			 *
			 * aria-haspopup is "menu" because ui.system.menu gives its popup role="menu" and every item
			 * inside it role="menuitem": what opens is a menu, and the reader has to name it as one.
			 *
			 * The signs of the chain and the modifier chip go the same way even though both are own
			 * markup: ui.system.menu stamps the same two attributes on its trigger and rolls them back
			 * when the menu is destroyed, which would strip a value a template binding believes it has already
			 * written. Writing them after every state change repairs that. A node absent from the
			 * current mode is a no-op here (Dom.attr ignores a nil node).
			 */
			syncButtonsAria() {
				// The whole chain and not the open sign alone: a sign the menu has left, and a sign that
				// took the index of a deleted one, would otherwise keep the state of another one.
				for (const sign of this.signViews) {
					const signEl = this.signElement(sign.index);
					main_core.Dom.attr(signEl, 'aria-haspopup', 'menu');
					main_core.Dom.attr(signEl, 'aria-expanded', this.openSignIndex === sign.index ? 'true' : 'false');
				}
				const modifierEl = this.getChipElement('modifierChip');
				main_core.Dom.attr(modifierEl, 'aria-haspopup', 'menu');
				main_core.Dom.attr(modifierEl, 'aria-expanded', this.isModifierMenuShown ? 'true' : 'false');

				// Every source button carries the same text, so each one is named after its own operand.
				for (const operand of this.operandViews) {
					main_core.Dom.attr(this.pickSourceElement(operand.index), 'aria-label', this.pickSourceLabel(operand.name));
				}

				// The reason the chain cannot grow any further stands under the button; a reader that
				// reaches a disabled button gets the reason with it.
				main_core.Dom.attr(this.addOperandElement(), 'aria-describedby', this.addOperandBlockReason ? ADD_OPERAND_LIMIT_HINT_ID : null);

				// Same for the range that cannot be grouped: the reason stands under the button that is
				// disabled by it, and a reader that reaches the button is told which one it is.
				main_core.Dom.attr(this.groupConfirmElement(), 'aria-describedby', this.groupBlockReason ? GROUP_BLOCK_HINT_ID : null);
			},
			/**
			 * The views kept from the previous state of the chain, or none at all when that state is
			 * gone: what an operand view carries besides its own text is the sign before it, the
			 * parentheses around it, whether the range being picked covers it and the readable title of
			 * the source behind it - so the memo lives exactly as long as the signs, the groups, the
			 * picked range and the loaded source lists all stay as they were.
			 *
			 * The key answers for the depth of the parentheses as well: withBracketDepth writes that
			 * depth into the very bracket objects of a kept view, and counts it from the signs and the
			 * groups - both of them in the key already. Whatever the depth ever starts counting from
			 * has to enter the key too: the objects stay the same ones, so a class left over from the
			 * previous state is a class nothing re-renders.
			 */
			keptOperandViews() {
				const selection = this.groupSelection;
				const chainKey = [this.draft.signs.join(','), this.draft.groups.map(group => `${group.from}-${group.to}`).join(','), this.isSelectingGroup ? '1' : '0', selection === null ? '' : `${selection.from}-${selection.to}`].join('|');
				if (chainKey !== this.operandViewMemoKey || this.loadedSourceItems !== this.operandViewMemoSources) {
					this.operandViewMemo = new Map();
					this.operandViewMemoKey = chainKey;
					this.operandViewMemoSources = this.loadedSourceItems;
				}
				return this.operandViewMemo;
			},
			/**
			 * The views of the chain as it stands, each of them either kept from the previous state or
			 * built now, and the memo left holding exactly these: an operand left behind by an edit is
			 * of no use to anyone, and the memo would grow with every keystroke otherwise.
			 */
			rememberOperandViews() {
				const memo = this.keptOperandViews();
				const kept = new Map();
				const views = this.draft.operands.map((value, index) => {
					const key = `${index}:${value}`;
					const view = memo.get(key) ?? this.buildOperandView(value, index);
					kept.set(key, view);
					return view;
				});
				this.operandViewMemo = kept;
				return views;
			},
			scheduleButtonsAriaSync() {
				void this.$nextTick(this.syncButtonsAria);
			},
			getChipElement(ref) {
				return this.$refs[ref]?.getTriggerElement?.() ?? null;
			},
			/**
			 * Where an element of the chain is put down and taken away. The repeater cannot address its
			 * elements through $refs: same-named refs inside it are collected into an array whose order
			 * is not guaranteed to follow the model, so the row registers what it renders by its place
			 * instead. A function ref is called with null on unmount, which is what keeps a shrunken
			 * chain from leaving the element of a gone operand behind - and the ref function of that
			 * place goes with it, so both maps of the chain shrink as the chain does.
			 */
			registerChainElement(kind, index, element) {
				const key = `${kind}:${index}`;
				if (main_core.Type.isNil(element)) {
					this.chainElements.delete(key);
					this.chainElementSetters.delete(key);
					return;
				}
				this.chainElements.set(key, element);
			},
			/**
			 * The ref of one element of the chain: one function per place in it, and always the same
			 * one for as long as that place is drawn. An arrow written in the template is a fresh
			 * function for every element of the chain on every render, and the chain re-renders on
			 * every keystroke - a chain of any length would allocate a closure per element and per
			 * keystroke, and every one of them would reach the bookkeeping of refs as a ref it has
			 * never seen before.
			 */
			chainElementRef(kind, index) {
				const key = `${kind}:${index}`;
				let setElement = this.chainElementSetters.get(key);
				if (!setElement) {
					setElement = element => this.registerChainElement(kind, index, element);
					this.chainElementSetters.set(key, setElement);
				}
				return setElement;
			},
			chainElement(kind, index) {
				return main_core.Type.isNumber(index) ? this.chainElements.get(`${kind}:${index}`) ?? null : null;
			},
			// The sign of the chain is the trigger of the operation menu: a control of its own, so the
			// menu names itself after it, stamps it and gives the focus back to it.
			signElement(index) {
				return this.chainElement('sign', index);
			},
			operandChipElement(index) {
				return this.chainElement('chip', index)?.getTriggerElement?.() ?? null;
			},
			pickSourceElement(index) {
				return this.chainElement('pick-source', index)?.button?.getContainer?.() ?? null;
			},
			// Not elements of the chain and so not in its map: the buttons stand under the chain and
			// there is one of each. Their markup is built imperatively, hence the walk to the container.
			addOperandElement() {
				return this.$refs.addOperandButton?.button?.getContainer?.() ?? null;
			},
			groupStartElement() {
				return this.$refs.groupStartButton?.button?.getContainer?.() ?? null;
			},
			groupConfirmElement() {
				return this.$refs.groupConfirmButton?.button?.getContainer?.() ?? null;
			},
			// The field of the open operand and the row it lives in: there is at most one of each.
			openOperandField() {
				return this.chainElement('field', this.editingOperand);
			},
			openOperandRow() {
				return this.chainElement('row', this.editingOperand);
			},
			showOperationMenu(index) {
				this.operationMenuBindElement = this.signElement(index);
				this.openSignIndex = index;
			},
			/**
			 * The bound element outlives the closing on purpose: the menu gives the focus back to its
			 * trigger while it is being destroyed, and the index of the open sign is gone by then. The
			 * next opening puts the trigger of its own sign in its place.
			 */
			closeOperationMenu() {
				this.openSignIndex = null;
			},
			showModifierMenu() {
				this.modifierMenuBindElement = this.getChipElement('modifierChip');
				this.isModifierMenuShown = true;
			},
			closeModifierMenu() {
				this.isModifierMenuShown = false;
				this.modifierMenuBindElement = null;
			},
			pickSourceLabel(operandLabel) {
				return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_PICK_SOURCE_ARIA', {
					'#OPERAND#': operandLabel
				});
			},
			shouldOperationMenuAutoHide(event) {
				return this.shouldMenuAutoHide('operationMenu', event);
			},
			shouldModifierMenuAutoHide(event) {
				return this.shouldMenuAutoHide('modifierMenu', event);
			},
			/**
			 * Outside click closes an in-window menu, as the default handler of ui.system.menu does, but
			 * the focus stays where the click landed: the menu trap would otherwise pull it back to the
			 * control the menu belongs to, off the one the user has just clicked.
			 */
			shouldMenuAutoHide(menuRef, {
				target
			}) {
				const popupInstance = this.$refs[menuRef]?.menu?.getPopup?.();
				const containerEl = popupInstance?.getPopupContainer?.();
				if (containerEl && main_core.Type.isDomNode(target) && (containerEl === target || containerEl.contains(target))) {
					return false;
				}
				popupInstance?.getFocusTrap?.()?.setRestoreFocus(false);
				return true;
			},
			focusSourceSearch() {
				void this.$nextTick(() => {
					this.$refs.sourceList?.focusSearch();
				});
			},
			// Leaving the source list drops the focused row from the DOM: put the focus on the control
			// that received the pick, so it does not fall back to the body.
			focusPickTarget(target) {
				void this.$nextTick(() => {
					if (main_core.Type.isNumber(target)) {
						// A pick folds the operand back into its chip (see applyPickedSource), while
						// leaving the list with the Back button keeps its field open.
						if (this.editingOperand === target) {
							this.openOperandField()?.focus();
						} else {
							this.operandChipElement(target)?.focus();
						}
						return;
					}
					if (target === 'modifier') {
						this.getChipElement('sourceChip')?.focus();
					}
				});
			},
			async loadFunctions() {
				this.isLoadingFunctions = true;
				this.hasFunctionsError = false;
				try {
					this.functionItems = await loadFunctionItems();
				} catch {
					// The reason is already in the console (see loadFunctionItems); here it only has to
					// become a state the list can show instead of a plain "nothing found".
					this.hasFunctionsError = true;
				} finally {
					this.isLoadingFunctions = false;
				}
			},
			/**
			 * Sources are asked of the provider when the source list is first shown - on the entry into
			 * it, or at once for a window a host created in Modification mode, which opens on that list -
			 * and not before: collecting is worth a walk of the host's own - the schema of a workflow, a
			 * request for the fields of a document. Memoized by the promise, so re-entering the list asks
			 * nothing twice, and a pick right after the entry waits for the same collection. A host that
			 * gave the sections outright has nothing to ask for, and a host that gave neither input has
			 * no one to ask.
			 */
			async ensureSourcesLoaded() {
				if (this.sourceSections !== null || !main_core.Type.isFunction(this.sourcesProvider)) {
					return;
				}
				this.sourcesPromise ??= this.loadSources();
				await this.sourcesPromise;
			},
			/**
			 * Walks the stages of the answer of the provider: keeps the loading indicator over the
			 * sections a stage already published and turns every kind of failure into the error state of
			 * the list. For the staged contract itself see the `sourcesProvider` prop docblock.
			 */
			async loadSources() {
				// Flow checks nothing at runtime and the answer is another module's to shape: an answer of
				// another kind would break the search of the list and loadedSourceItems instead of failing
				// into the error state. Guarded is the answer of the provider, not the `sourceSections`
				// prop, and not a section item - its fields are read where they are shown.
				const accept = sections => {
					const isSectionShaped = section => {
						return main_core.Type.isPlainObject(section) && main_core.Type.isArray(section.items);
					};
					if (!main_core.Type.isArray(sections) || !sections.every(isSectionShaped)) {
						throw new TypeError('the sources are no list of sections');
					}
					this.providedSections = sections;
					this.hasSourcesError = false;
				};
				try {
					let answer = this.sourcesProvider();

					// Walks the stages of the answer: every one either hands the whole set over or shows
					// what it has and points at the next. A provider answering at once is no loading at
					// all — the indicator belongs to the wait, and a synchronous answer has none to show.
					for (;;) {
						if (main_core.Type.isPlainObject(answer) && answer.pending instanceof Promise) {
							// The rest is kept observed before the ready sections are checked: accept()
							// throws on an answer that is no list, and the await below is then never
							// reached, so a rejection of the rest would land in the console as unhandled
							// instead of in the failure state of the list. The sink changes nothing about
							// where the failure goes — the same promise is awaited below, and its
							// rejection travels to the catch of this method.
							answer.pending.catch(() => null);
							accept(answer.sections);
							this.isLoadingSources = true;
							answer = await answer.pending;
							continue;
						}
						if (answer instanceof Promise) {
							this.isLoadingSources = true;
							answer = await answer;
							continue;
						}
						accept(answer);
						return;
					}
				} catch (error) {
					// The list shows a state of its own for this, instead of passing the failure off as a
					// host with nothing to offer; the reason stays traceable in the console.
					console.error('expression builder: failed to collect the sources', error);
					this.hasSourcesError = true;
				} finally {
					this.isLoadingSources = false;
				}
			},
			/**
			 * What the window opens on: the mode the saved value belongs to and the state that mode
			 * starts from. The chain is taken from the read model whole, wherever its rounding stands,
			 * as long as it is one the window works with - a chain past the ceiling of operands, like
			 * any value the model does not express, fills nothing in and is left to the value chip of
			 * the functions mode, which shows it as it is.
			 *
			 * A reference alone is what the value picker of the field leaves behind, and the calculator
			 * is where a formula grows out of it: the reference takes the first operand of the chain, so
			 * the window opens on the value it was called over instead of beside it.
			 */
			prefillFromValue(value) {
				const recognized = recognizeFieldValue(value);
				if (recognized.kind === 'reference' && recognized.modifier) {
					this.currentMode = EXPRESSION_BUILDER_MODES.modification;
					this.modifierSource = `{=${recognized.object}:${recognized.field}}`;
					this.modifierSourceTypes = {
						type: null,
						baseType: null
					};
					this.modifierId = matchModifierId(recognized.modifier);
				} else if (recognized.kind === 'reference') {
					// The reference goes in canonical, the way it will be stored, and into the operand
					// the modes share, the one of index zero.
					this.currentMode = EXPRESSION_BUILDER_MODES.calculator;
					this.draft = setOperand(this.draft, 0, `{=${recognized.object}:${recognized.field}}`);
				} else if (recognized.kind === 'draft' && isExpressibleChain(recognized.draft)) {
					this.currentMode = EXPRESSION_BUILDER_MODES.calculator;
					this.draft = recognized.draft;
				} else if (recognized.kind === 'empty' && main_core.Type.isStringFilled(this.boundSource)) {
					// Only with nothing saved yet: a formula already built is what the user left here.
					// The bound source goes into the operand the modes share, the one of index zero.
					this.draft = setOperand(this.draft, 0, this.boundSource);
				}
				if (this.isModifierSourceFixed && !main_core.Type.isStringFilled(this.modifierSource)) {
					this.modifierSource = this.boundSource;
				}
			},
			modeDesign(modeId) {
				return this.activeMode === modeId ? ui_system_chip_vue.ChipDesign.Filled : ui_system_chip_vue.ChipDesign.TintedNoAccent;
			},
			/**
			 * The source item of a value among the ones already collected. Never starts the collection:
			 * the sources are loaded on the first entry into the source list (see ensureSourcesLoaded),
			 * and a label must not be a reason to walk the diagram and fetch the document fields.
			 */
			findLoadedSourceItem(value) {
				return this.loadedSourceItems.get(value) ?? null;
			},
			/**
			 * What a chip shows for a value: the readable title of the field when the window knows it,
			 * the canonical reference otherwise. Display only - the value that goes into the expression
			 * stays the canonical one.
			 */
			sourceChipLabel(value) {
				if (!main_core.Type.isStringFilled(value)) {
					return '';
				}
				if (!isSourceReference(value)) {
					return value;
				}
				return this.findLoadedSourceItem(value)?.title ?? value;
			},
			/**
			 * How one operand shows up in the chain. What it is called follows the sign on its left: the
			 * operand right after a rounding sign is the number of decimal places of that rounding, and
			 * a source is no such number. The accessible labels carry the name of the operand along with
			 * its value: the chips are the same control otherwise, and a reader would not tell one value
			 * from another.
			 *
			 * The chip shows the operand the way it will be stored, split into its parts and painted by
			 * their roles - a title of a field carries no roles to paint. The readable title is kept
			 * where the reader of the screen needs it, in the accessible name of the same chip, so the
			 * reader still hears the name of the field and not the reference behind it.
			 */
			buildOperandView(value, index) {
				const sign = this.signViews[index - 1] ?? null;
				const isRoundArgument = sign?.isRound === true;
				const readableValue = this.sourceChipLabel(value);
				const isFilled = main_core.Type.isStringFilled(value.trim());
				const testId = `bizprocdesigner-expression-builder-operand-${index}`;
				const name = this.operandName(index, isRoundArgument);
				return {
					index,
					label: this.operandLabel(index, isRoundArgument),
					name,
					// Rounding takes a number of decimal places, and a source is no such number.
					canPickSource: !isRoundArgument,
					sign,
					openBrackets: this.openBrackets(index),
					closeBrackets: this.closeBrackets(index),
					isSelected: this.isOperandSelected(index),
					testId,
					chipTestId: `${testId}-chip`,
					pickSourceTestId: `bizprocdesigner-expression-builder-pick-source-${index}`,
					chipParts: describeOperandParts(value),
					chipAriaLabel: this.chipAriaLabel(index, name, readableValue, isFilled),
					// An empty operand has a remove button as well: it blocks confirmation while it
					// stands in the chain, and with nothing to remove it with the chain would be stuck.
					removeLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_REMOVE', {
						'#OPERAND#': name
					})
				};
			},
			/**
			 * The caption above the field of the operand. Named by its place in the chain and numbered
			 * from one: the chain is of any length, so there is no other name to give the fourth operand
			 * of it - and the numbering is recounted from the model, which is what keeps it unbroken
			 * after an operand has been removed from the middle.
			 */
			operandLabel(index, isRoundArgument) {
				if (isRoundArgument) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_N');
				}
				return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND', {
					'#NUMBER#': String(index + 1)
				});
			},
			// The name the chip and the accessible labels of the operand are built from: the caption of
			// the field is too long for a sentence.
			operandName(index, isRoundArgument) {
				if (isRoundArgument) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_N_SHORT');
				}
				return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_SHORT', {
					'#NUMBER#': String(index + 1)
				});
			},
			/**
			 * The name of the chip. In the selection mode it is a toggle that takes the operand into the
			 * range, so it is named after that and not after opening the operand for editing; the value
			 * is left out of the name there - what the range is picked by is the place in the chain.
			 *
			 * The value in the name is the readable one and not the canonical one the chip shows: the
			 * reader of the screen is told the title of the field, see sourceChipLabel.
			 */
			chipAriaLabel(index, name, readableValue, isFilled) {
				if (this.isSelectingGroup) {
					return this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_PICK_ARIA', {
						'#OPERAND#': name
					});
				}
				return isFilled ? this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_CHANGE_ARIA', {
					'#OPERAND#': name,
					'#VALUE#': readableValue
				}) : this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_SET_ARIA', {
					'#OPERAND#': name
				});
			},
			/**
			 * How deep every parenthesis of the chain stands, counted by walking the chain itself: an
			 * opening one takes the level it opens, and the closing one of the pair takes the same, so a
			 * pair is painted with one color. The walk and not the nesting rules of groups and rounding
			 * calls read a second time - the order of the parentheses in the markup is the order
			 * buildFormulaString puts them in, and counting along it is what keeps the two from drifting.
			 */
			withBracketDepth(views) {
				let depth = 0;
				for (const view of views) {
					for (const bracket of view.openBrackets) {
						depth += 1;
						bracket.depthClass = parenDepthClass(depth);
					}
					for (const bracket of view.closeBrackets) {
						bracket.depthClass = parenDepthClass(depth);
						depth -= 1;
					}
				}
				return views;
			},
			/**
			 * The group whose own chain the sign belongs to, or none for a sign of the chain of the
			 * whole formula. The gap at the last operand of a range is not inside it: that one joins
			 * the range to the rest of the formula.
			 */
			groupAroundSign(signIndex) {
				return this.draft.groups.find(group => {
					return group.from <= signIndex && signIndex < group.to;
				}) ?? null;
			},
			/**
			 * Whether the parentheses of the group are left out of the assembled string, and then the
			 * parentheses of a rounding call stand on both boundaries of the range instead. The chain
			 * draws as many pairs as the string carries, so the rule of the assembly is asked of the
			 * assembly itself (see omitsGroupParens) and not kept here as a second copy of it.
			 */
			isGroupBracketDropped(group) {
				return omitsGroupParens(this.draft, group);
			},
			/**
			 * The parentheses standing right before an operand: the calls of the chain of the whole
			 * formula, which begins at its first operand, and then everything the group starting here
			 * opens.
			 */
			openBrackets(index) {
				const brackets = index === 0 ? this.chainRoundOpenings() : [];
				const groupIndex = this.draft.groups.findIndex(group => group.from === index);
				return groupIndex >= 0 ? [...brackets, ...this.groupOpenings(groupIndex)] : brackets;
			},
			/**
			 * The calls of the chain of the whole formula, all opening on its first operand: such a call
			 * takes the prefix accumulated so far as its first argument, so the leftmost rounding sign
			 * is the innermost call - hence the walk from the tail. A sign inside a group belongs to the
			 * chain of that group and opens on the first operand of that one instead.
			 */
			chainRoundOpenings() {
				const brackets = [];
				for (let signIndex = this.draft.signs.length - 1; signIndex >= 0; signIndex--) {
					if (this.draft.signs[signIndex] === CALC_OP.round && this.groupAroundSign(signIndex) === null) {
						brackets.push(this.roundBracket(signIndex, true));
					}
				}
				return brackets;
			},
			/**
			 * What opens on the first operand of a group: its own parenthesis, and after it the calls of
			 * the chain inside it, outermost first for the same reason. Where the parentheses of the
			 * group are dropped, the outermost of those calls is the one standing on its boundaries, and
			 * it takes the role and the name of the group parenthesis with it.
			 */
			groupOpenings(groupIndex) {
				const group = this.draft.groups[groupIndex];
				const isDropped = this.isGroupBracketDropped(group);
				const brackets = isDropped ? [] : [this.groupBracket(groupIndex, true)];
				for (let signIndex = group.to - 1; signIndex >= group.from; signIndex--) {
					if (this.draft.signs[signIndex] !== CALC_OP.round) {
						continue;
					}
					brackets.push(isDropped && signIndex === group.to - 1 ? this.groupBracket(groupIndex, true) : this.roundBracket(signIndex, true));
				}
				return brackets;
			},
			/**
			 * The parentheses standing right after an operand: the group whose range ends here, and the
			 * rounding call whose second argument this operand is. Both at once means the parentheses of
			 * the group are dropped and the call stands on its boundaries - one pair and not two, the
			 * one that takes the group off. Two drawn pairs never meet here: a group ending on the
			 * argument of a rounding is not canonical (see isCanonicalDraft), and a group ending right
			 * before it has its own parentheses dropped by that very sign.
			 */
			closeBrackets(index) {
				const brackets = [];
				const groupIndex = this.draft.groups.findIndex(group => group.to === index);
				const isDropped = groupIndex >= 0 && this.isGroupBracketDropped(this.draft.groups[groupIndex]);
				if (groupIndex >= 0 && !isDropped) {
					brackets.push(this.groupBracket(groupIndex, false));
				}
				if (index > 0 && this.draft.signs[index - 1] === CALC_OP.round) {
					brackets.push(isDropped ? this.groupBracket(groupIndex, false) : this.roundBracket(index - 1, false));
				}
				return brackets;
			},
			/**
			 * Whether the group is what limits a rounding: a rounding sign stands on one of the gaps
			 * inside the range, so the call it opens begins at the head of that range and not at the
			 * head of the formula. Taking such a group off hands the whole prefix back to the rounding,
			 * and that is what the control is named after.
			 *
			 * A group that starts the chain limits nothing: the call begins at the first operand with the
			 * group and without it alike, so taking it off leaves the reach of the rounding as it was.
			 */
			groupLimitsRound(group) {
				return group.from > 0 && this.draft.signs.slice(group.from, group.to).includes(CALC_OP.round);
			},
			// How many roundings the chain carries: a change that leaves the groups alone can still take
			// one of them away, see removeOperandAt.
			roundSignCount() {
				return this.draft.signs.filter(sign => sign === CALC_OP.round).length;
			},
			/**
			 * A parenthesis of a group: a control that takes its own group off, named after the place of
			 * that group in the chain - the chain can hold several groups, and a name shared by all of
			 * them would leave a reader with no way to tell which one is being taken off. A group
			 * holding a rounding is named by what taking it off leads to and not by the action alone:
			 * the rounding is about to reach the whole formula to its left.
			 */
			groupBracket(groupIndex, isOpening) {
				const group = this.draft.groups[groupIndex];
				const side = isOpening ? 'open' : 'close';
				const labelKey = this.groupLimitsRound(group) ? 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_UNGROUP_ROUND_ARIA' : 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_UNGROUP_ARIA';
				return {
					key: `group-${side}-${groupIndex}`,
					text: isOpening ? '(' : ')',
					isGroup: true,
					ariaLabel: this.getMessage(labelKey, {
						'#NUMBER#': String(groupIndex + 1),
						'#FROM#': this.operandName(group.from, false),
						'#TO#': this.operandName(group.to, false)
					}),
					ungroupAt: group.from,
					testId: `bizprocdesigner-expression-builder-group-${side}-${isOpening ? group.from : group.to}`
				};
			},
			/**
			 * A parenthesis of a rounding call that is not the boundary of a group: it shows how far the
			 * call reaches, next to the mark the sign raises while it is hovered (see showSignScope),
			 * and that is all it does. Rounding is taken off in the menu of its own sign, so this is no
			 * control and no stop of the keyboard walk either.
			 */
			roundBracket(signIndex, isOpening) {
				const side = isOpening ? 'open' : 'close';
				return {
					key: `round-${side}-${signIndex}`,
					text: isOpening ? '(' : ')',
					isGroup: false,
					ariaLabel: null,
					ungroupAt: null,
					testId: `bizprocdesigner-expression-builder-round-${side}-${signIndex}`
				};
			},
			selectMode(modeId) {
				this.currentMode = modeId;
				this.leaveMode();
				// The mode redraws the whole formula block, and aria-pressed alone does not tell what is
				// in the window now: the hint of the mode does.
				ui_a11y.LiveAnnouncer.announce(this.currentModeHint);
			},
			/**
			 * What no mode carries into the next one: the source list is entered for the mode that
			 * opened it, and the open operand and the picked range are of the chain, which is out of
			 * reach everywhere but the calculator.
			 *
			 * Both ways the mode changes lead here - the own switch and the host that owns the mode
			 * through its prop, see the watcher of activeMode - so an unfinished range never waits out
			 * a visit to another tab.
			 */
			leaveMode() {
				this.pickingFor = null;
				this.editingOperand = null;
				this.exitGrouping();
			},
			/**
			 * One row of the sign menu. Rounding closes the prefix of its own chain to the left of the
			 * sign into a call, so it is unavailable wherever the model would refuse such a draft: the
			 * item stays reachable and names the reason instead of going silent (the disabled option of
			 * ui.system.menu keeps the item focusable and still calls the handler).
			 */
			buildOperationItem(operation) {
				const gapIndex = this.openSignIndex ?? 0;
				const isBlocked = operation.id === CALC_OP.round && !this.isRoundAllowedAt(gapIndex);
				const reason = isBlocked ? this.roundBlockReason(gapIndex) : '';
				return {
					id: `bizprocdesigner-expression-builder-sign-${gapIndex}-operation-${operation.id}`,
					// The sign leads the name, as it stands in the chain itself.
					title: operation.menuSign ? `${operation.menuSign} ${operation.title}` : operation.title,
					subtitle: reason,
					disabled: isBlocked,
					onClick: () => {
						if (isBlocked) {
							ui_a11y.LiveAnnouncer.announce(reason);
							return;
						}
						this.selectOperation(operation.id);
					}
				};
			},
			/**
			 * Whether the sign can become a rounding one. A rounding inside a group is what limits its
			 * reach, so the rule is no longer about the sign at all: it is about the groups already
			 * standing in the chain, each of which has to keep a placement the model allows once the
			 * sign has changed. Every group is asked about by taking it off and offering it back, so
			 * the condition itself lives in the model alone (see canGroupOperands) - the rule of the
			 * sign, the rule of grouping and the canonicity predicate are one condition, and a copy of
			 * it here would be the place the three drift apart.
			 */
			isRoundAllowedAt(gapIndex) {
				const rounded = setSign(this.draft, gapIndex, CALC_OP.round);
				return rounded.groups.every(group => {
					return canGroupOperands(ungroupOperands(rounded, group.from), group.from, group.to);
				});
			},
			/**
			 * Why the sign cannot become a rounding one, told apart by what stands right after it. A
			 * group there would take the place of the number of decimal places of the call, and that is
			 * one operand. Otherwise the group the sign would close begins the chain, and the call
			 * reaches the whole of it with the parentheses and without them alike - the chain assembles
			 * the same string either way.
			 */
			roundBlockReason(gapIndex) {
				const startsGroup = this.draft.groups.some(group => group.from === gapIndex + 1);
				return this.getMessage(startsGroup ? 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ROUND_BLOCK_PRECISION' : 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ROUND_BLOCK_WHOLE_CHAIN');
			},
			/**
			 * Whether the rounding on the gap is one a group holds back: the call it opens begins at the
			 * head of that group instead of the head of the formula. Asked of one gap where
			 * groupLimitsRound is asked of a whole range, and holding back takes the same `from > 0`
			 * there - a group from the first operand of the chain holds nothing back.
			 */
			isRoundLimitedAt(gapIndex) {
				if (this.draft.signs[gapIndex] !== CALC_OP.round) {
					return false;
				}
				return (this.groupAroundSign(gapIndex)?.from ?? 0) > 0;
			},
			/**
			 * Choosing a sign inside a group is what gives a rounding its boundary and what takes that
			 * boundary away again, and the chain says so both ways - the same change said out loud when
			 * the group itself is taken off, see ungroupAt. The parentheses of the group give way to the
			 * ones of the call here, so a reader left without the announcement would only learn the new
			 * reach of the rounding by walking the parentheses again.
			 */
			selectOperation(operationId) {
				if (this.openSignIndex !== null) {
					const gapIndex = this.openSignIndex;
					const wasLimited = this.isRoundLimitedAt(gapIndex);
					this.draft = setSign(this.draft, gapIndex, operationId);
					const isLimited = this.isRoundLimitedAt(gapIndex);
					if (isLimited !== wasLimited) {
						ui_a11y.LiveAnnouncer.announce(this.getMessage(isLimited ? 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ROUND_LIMITED' : 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ROUND_UNDONE'));
					}
				}
				this.closeOperationMenu();
			},
			/**
			 * A rounding sign reaches back over its own chain to its left, so it marks that prefix while
			 * it is hovered or focused: read one sign at a time, it would otherwise pass for "round the
			 * operand before me". Decoration only - the model is not touched and the mark takes no part
			 * in the assembly.
			 */
			showSignScope(index) {
				this.scopeSignIndex = index;
			},
			hideSignScope() {
				this.scopeSignIndex = null;
			},
			// Whether the operand is one of those the shown rounding scope covers, see roundScope.
			isOperandInRoundScope(index) {
				const scope = this.roundScope;
				return scope !== null && scope.from <= index && index <= scope.to;
			},
			// Whether the sign stands between two operands the shown rounding scope covers.
			isSignInRoundScope(index) {
				const scope = this.roundScope;
				return scope !== null && scope.from <= index && index < scope.to;
			},
			focusOperandChip(index) {
				void this.$nextTick(() => {
					this.operandChipElement(index)?.focus();
				});
			},
			isOperandSelected(index) {
				const selection = this.groupSelection;
				return selection !== null && selection.from <= index && index <= selection.to;
			},
			/**
			 * What a click on a chip does: in the selection mode it moves the border of the range, and
			 * everywhere else it opens the operand for editing. The two never overlap - entering the
			 * mode folds the open operand back into its chip first, see startGrouping.
			 */
			handleOperandClick(index) {
				if (this.isSelectingGroup) {
					this.toggleOperandSelection(index);
					return;
				}
				this.startEditingOperand(index);
			},
			/**
			 * How the picked range follows the clicks. The range is a continuous one, so a neighbour of
			 * either end extends it, an end of it trims it back, and a click that lands away from the
			 * range starts a new one from there. Nothing of this reaches the model: the chain is
			 * untouched until the range is confirmed, which is what makes cancelling free by
			 * construction.
			 */
			toggleOperandSelection(index) {
				this.groupSelection = this.nextSelection(index);
				ui_a11y.LiveAnnouncer.announce(this.groupSelectionText);
			},
			nextSelection(index) {
				const selection = this.groupSelection;
				if (selection === null || index < selection.from - 1 || index > selection.to + 1) {
					return {
						from: index,
						to: index
					};
				}
				const {
					from,
					to
				} = selection;
				if (index === from - 1) {
					return {
						from: index,
						to
					};
				}
				if (index === to + 1) {
					return {
						from,
						to: index
					};
				}
				if (index === from) {
					return from === to ? null : {
						from: from + 1,
						to
					};
				}

				// Inside the range, its far end included: the click trims the range down to the operand
				// it landed on, and the last operand of the range takes the range off it altogether.
				return {
					from,
					to: index === to ? to - 1 : index
				};
			},
			/**
			 * Enters the range-selection mode. The open operand is folded back into its chip first: the
			 * chain holds at most one open operand, and in this mode a chip is a toggle and not the
			 * opener of a field. The mode changes what every chip of the chain does, and the pressed
			 * state of one chip is no announcement of that - the mode says so itself.
			 *
			 * The focus goes to the first chip of the chain: the button the mode was entered by goes
			 * disabled with it and holds the focus no longer, and the chips are what the mode is for.
			 */
			startGrouping() {
				this.editingOperand = null;
				this.groupSelection = null;
				this.isSelectingGroup = true;
				ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_MODE_ON'));
				this.focusOperandChip(0);
			},
			/**
			 * Puts the picked range into the model. The focus goes to the opening parenthesis of the new
			 * group: the button just pressed is gone with the mode, and the parenthesis is what the
			 * group can be taken off by.
			 *
			 * A range picked around a rounding sign already standing there is what gives that rounding
			 * its boundary - the same change said out loud from the other side when the sign itself is
			 * chosen, see selectOperation. The parentheses drawn here are the ones of the call, so a
			 * reader told only of the grouping would learn the new reach of the rounding by walking the
			 * parentheses again.
			 */
			confirmGrouping() {
				const selection = this.groupSelection;
				const grouped = selection === null ? null : groupOperands(this.draft, selection.from, selection.to);
				if (grouped === null) {
					return;
				}
				const from = selection.from;
				this.draft = grouped;
				this.exitGrouping();
				ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_DONE'));
				const group = this.draft.groups.find(item => item.from === from) ?? null;
				if (group !== null && this.groupLimitsRound(group)) {
					ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ROUND_LIMITED'));
				}
				void this.$nextTick(() => {
					this.chainElement('group-open', from)?.focus();
				});
			},
			/**
			 * Leaves the mode with the chain as it was - and it cannot be otherwise: the range never
			 * reached the model. The focus goes back to the button the mode was entered by.
			 */
			cancelGrouping() {
				this.exitGrouping();
				ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_CANCELLED'));
				void this.$nextTick(() => {
					this.groupStartElement()?.focus();
				});
			},
			exitGrouping() {
				this.isSelectingGroup = false;
				this.groupSelection = null;
			},
			/**
			 * Takes off the group the operand belongs to - which group that is the model counts itself
			 * (see ungroupOperands), so both parentheses of a pair lead here with the same operand. The
			 * parenthesis just clicked goes away with the group, so the focus moves to the chip of the
			 * operand the group started at.
			 *
			 * A group holding a rounding is taken off with the consequence said out loud: the boundary
			 * of that rounding is gone with the group, and the call it opens moves to the head of the
			 * formula. Which case it is the chain being left behind answers, not the one just built -
			 * the group is what carried the rounding, and it is no longer there to be asked.
			 */
			ungroupAt(index) {
				const group = this.draft.groups.find(item => {
					return item.from <= index && index <= item.to;
				});
				const isRoundReleased = group !== undefined && this.groupLimitsRound(group);
				this.draft = ungroupOperands(this.draft, index);
				ui_a11y.LiveAnnouncer.announce(this.getMessage(isRoundReleased ? 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_UNDONE_ROUND' : 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_UNDONE'));
				this.focusOperandChip(index);
			},
			/**
			 * Opens the operand in the field its chip stands for - the field keeps the canonical value,
			 * the one that goes into the expression, while the chip shows the readable label of it. One
			 * operand at a time: opening another one folds this one back into its chip.
			 */
			startEditingOperand(index) {
				this.editingOperand = index;
				void this.$nextTick(() => {
					this.openOperandField()?.focus();
				});
			},
			/**
			 * Enter finishes the input: the operand folds back into its chip, and the focus follows it,
			 * because the field it was in is gone. Escape is left to the window, where it closes it.
			 *
			 * The keystroke has to be cancelled (see the template): the focus lands on the chip button
			 * while the very same Enter is still being processed, and the keypress that follows would
			 * activate it - the operand would open right back into its field.
			 */
			finishEditingOperand() {
				const index = this.editingOperand;
				this.editingOperand = null;
				// Only ever called from the open field, so there is an operand to fold; a chip is
				// focused for that operand and never for another one.
				if (index !== null) {
					this.focusOperandChip(index);
				}
			},
			/**
			 * Leaving the field for another control finishes the input as well, and the focus stays where
			 * it went. A blur to nowhere (no relatedTarget: a click on non-focusable markup, and any
			 * click on a button in Safari) says nothing about where the click went, so the click itself
			 * decides: the fold waits for it, and handleDocumentClick keeps the field open for a click
			 * that stayed in the row.
			 *
			 * A pointer gesture is the same case: the blur it causes comes before its own click, so the
			 * fold waits for that click - see handleDocumentPointerUp and handleDocumentClick. With no
			 * gesture there is no click to wait for, and a blur to nowhere is a programmatic one - the
			 * field stays open.
			 */
			handleOperandBlur({
				relatedTarget
			}) {
				const rowEl = this.openOperandRow();
				if (main_core.Type.isDomNode(relatedTarget) && rowEl?.contains(relatedTarget)) {
					return;
				}
				if (this.isPointerPressed) {
					this.operandToFoldOnClick = this.editingOperand;
					return;
				}
				if (!main_core.Type.isDomNode(relatedTarget)) {
					return;
				}
				this.editingOperand = null;
			},
			handleDocumentPointerDown() {
				this.isPointerPressed = true;
			},
			/**
			 * A mouse leaves the field while its button is still down, so for it the press alone tells
			 * that a click is on its way. A touch is released earlier than that: the compatibility mouse
			 * events that move the focus come after pointerup, so for anything but a mouse the gesture is
			 * only over once its click has been delivered - see handleDocumentClick. A cancelled pointer
			 * brings no click at all and ends the gesture right here.
			 */
			handleDocumentPointerUp(event) {
				this.isPointerPressed = event.type === 'pointerup' && event.pointerType !== 'mouse';
			},
			/**
			 * The listeners below serve one state - an operand opened into its field - so they live
			 * exactly as long as it does: with the chain folded, and in the two modes where the chain is
			 * out of reach, every click in the editor behind the window would pass through them for
			 * nothing. The pressed pointer and the fold waiting for its click belong to a gesture over
			 * that open field, so they go away together with the listeners instead of waiting for a click
			 * that may never come.
			 */
			syncOperandDocumentListeners() {
				this.setOperandDocumentListeners(this.editingOperand !== null);
			},
			setOperandDocumentListeners(isBound) {
				if (isBound === this.isOperandDocumentBound) {
					return;
				}
				this.isOperandDocumentBound = isBound;
				const subscribe = isBound ? main_core.Event.bind : main_core.Event.unbind;
				subscribe(document, 'pointerdown', this.handleDocumentPointerDown);
				subscribe(document, 'pointerup', this.handleDocumentPointerUp);
				subscribe(document, 'pointercancel', this.handleDocumentPointerUp);
				subscribe(document, 'click', this.handleDocumentClick);
				if (!isBound) {
					this.isPointerPressed = false;
					this.operandToFoldOnClick = null;
				}
			},
			/**
			 * Finishes the input a click started elsewhere, now that the click has been delivered: the
			 * document sees it after the control it landed on, so the row was still in place while it
			 * travelled there. Folding it any earlier moves everything below - the footer buttons and the
			 * chip of the other operand - out from under the cursor, and the click lands on nothing.
			 *
			 * The operand is only folded if it is still the one the field was left for: a click on the
			 * chip of the other operand opens that one instead, and there is nothing to fold any more.
			 * A click that landed in the row itself leaves the field open - the source button of the
			 * operand lives there, and a blur to nowhere is the only thing its click reports in Safari.
			 */
			handleDocumentClick({
				target
			}) {
				// The click ends the gesture, whether or not anything was waiting for it.
				this.isPointerPressed = false;
				const index = this.operandToFoldOnClick;
				this.operandToFoldOnClick = null;
				if (index === null || this.editingOperand !== index) {
					return;
				}
				const rowEl = this.openOperandRow();
				if (main_core.Type.isDomNode(target) && rowEl?.contains(target)) {
					return;
				}
				this.editingOperand = null;
			},
			/**
			 * Grows the chain by one empty operand and opens it right away: the button is pressed to
			 * fill the operand it adds, and the field is where that is done. The sign of the new operand
			 * is the sum - the first operation of the catalogue and the neutral one for adding things up.
			 */
			addOperand() {
				this.draft = appendOperand(this.draft, '', CALC_OP.add);
				this.startEditingOperand(this.draft.operands.length - 1);
			},
			/**
			 * Removing an operand takes the sign that belongs to it along, so the chain stays connected;
			 * which sign that is the domain counts itself (see removeOperand). The last operand is not
			 * removed but replaced by an empty chain of one: the calculator always shows an operand, and
			 * an empty one is the state it opens in.
			 *
			 * The focus goes to the chip that took the place of the removed operand, or to the last chip
			 * of a chain that has just lost its tail - the button just pressed is gone with the operand.
			 */
			removeOperandAt(index) {
				const groupCount = this.draft.groups.length;
				const roundCount = this.roundSignCount();
				this.draft = this.draft.operands.length > 1 ? removeOperand(this.draft, index) : initialDraft();
				// The shrink can take a group along: the operand was the only one it held, or the range
				// left over assembles the very string the chain assembles without it (see removeOperand).
				// The parenthesis that took the group off leaves the chain with it, and the chip the
				// focus lands on says nothing about a grouping that is no longer there.
				if (this.draft.groups.length < groupCount) {
					ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_UNDONE'));
				}
				// The first operand of a group is the first argument of the rounding that group holds,
				// so the shrink can take the sign along while the group itself lives on (see
				// removeOperand). That is an operation gone and not a range narrowed, and neither the
				// chain that keeps its parentheses nor the preview of a reference says so on its own.
				if (this.roundSignCount() < roundCount) {
					ui_a11y.LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ROUND_UNDONE'));
				}
				// The removed operand is a folded chip, so no field of its own was open; a field opened
				// on another operand is being left by this very click, and its index has just shifted.
				this.editingOperand = null;
				this.focusOperandChip(Math.min(index, this.draft.operands.length - 1));
			},
			selectModifier(modifierId) {
				this.modifierId = modifierId;
				this.closeModifierMenu();
			},
			/**
			 * Clearing the source drops its types and the chosen modifier with it: a modifier is only
			 * applicable to a type, and the type is gone. The panel goes back to the source list on its
			 * own (see pickTarget), so the focus goes to its search - the button just clicked is gone.
			 */
			clearModifierSource() {
				this.modifierSource = '';
				this.modifierSourceTypes = {
					type: null,
					baseType: null
				};
				this.modifierId = null;
				this.closeModifierMenu();
				this.focusSourceSearch();
			},
			/**
			 * Clearing the modifier leaves the source and its types alone: the source is where the set of
			 * modifiers comes from, and it stays chosen. The clear button goes away with the value, so the
			 * focus moves to the chip body - the control that fills the chip again.
			 */
			clearModifier() {
				this.modifierId = null;
				this.closeModifierMenu();
				void this.$nextTick(() => {
					this.getChipElement('modifierChip')?.focus();
				});
			},
			startPicking(target) {
				this.pickingFor = target;
				this.focusSourceSearch();
			},
			cancelPicking() {
				const target = this.pickTarget;
				this.pickingFor = null;
				this.focusPickTarget(target);
			},
			applyPickedSource(item) {
				const target = this.pickTarget;
				if (main_core.Type.isNumber(target)) {
					this.draft = setOperand(this.draft, target, item.value);
					// The chip now has a value to show, so the operand folds back into the chain.
					this.editingOperand = null;
				} else if (target === 'modifier') {
					this.modifierSource = item.value;
					this.modifierSourceTypes = {
						type: item.type ?? null,
						baseType: item.baseType ?? null
					};
					this.modifierId = null;
				}
				this.pickingFor = null;
				this.focusPickTarget(target);
			},
			handleSourceSelect(item) {
				this.applyPickedSource(item);
			},
			applyFunction(item) {
				if (main_core.Type.isStringFilled(item?.value)) {
					this.$emit('apply', withFunctionArgument(item, this.boundSource));
				}
			},
			/**
			 * The footer applies what a human has assembled, on the same latch a host that takes the
			 * value as it is assembled goes by, see the watcher of currentFormula: a press that follows
			 * no edit at all may not change the value of the field. The prefill of a bare reference is
			 * what that costs otherwise - the value would leave the window wrapped into a calc formula
			 * and start being computed instead of substituted. A prefill that assembles back into the
			 * very value of the field changes nothing and goes through as it always has.
			 */
			handleApply() {
				if (!this.isFormulaTouched && this.currentFormula !== this.initialValue) {
					this.$emit('close');
					return;
				}
				if (this.activeMode === EXPRESSION_BUILDER_MODES.calculator && this.canApplyCurrent) {
					this.$emit('apply', this.assembledFormula);
					return;
				}
				if (this.activeMode === EXPRESSION_BUILDER_MODES.modification && this.modifierExpression) {
					this.$emit('apply', this.modifierExpression);
				}
			},
			// Closing the window is the third way out of the range-selection mode, next to confirming
			// and cancelling: a host that keeps the body alive must not find it still in that mode.
			handleClose() {
				this.exitGrouping();
				this.$emit('close');
			}
		},
		template: `
		<div
			class="bizprocdesigner-expression-builder"
			data-testid="bizprocdesigner-expression-builder"
		>
			<div
				class="bizprocdesigner-expression-builder__content"
				data-testid="bizprocdesigner-expression-builder-content"
			>
				<div
					v-if="hasOwnModeSwitch"
					class="bizprocdesigner-expression-builder__modes-section"
					data-testid="bizprocdesigner-expression-builder-modes-section"
				>
					<BxText3Xs
						tag="p"
						transform="uppercase"
						className="bizprocdesigner-expression-builder__section-title"
						:id="MODES_TITLE_ID"
						data-testid="bizprocdesigner-expression-builder-modes-title"
					>
						{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODES_TITLE') }}
					</BxText3Xs>
					<div
						class="bizprocdesigner-expression-builder__modes"
						role="group"
						:aria-labelledby="MODES_TITLE_ID"
						data-testid="bizprocdesigner-expression-builder-modes"
					>
						<Chip
							v-for="mode in modes"
							:key="mode.id"
							:text="mode.title"
							:icon="mode.icon"
							:size="ChipSize.Md"
							:design="modeDesign(mode.id)"
							role="button"
							:aria-pressed="activeMode === mode.id"
							:aria-describedby="activeMode === mode.id ? MODE_HINT_ID : null"
							:data-testid="'bizprocdesigner-expression-builder-mode-' + mode.id"
							@click="selectMode(mode.id)"
							@keydown.space.prevent="selectMode(mode.id)"
						/>
					</div>
					<BxText2Xs
						:id="MODE_HINT_ID"
						tag="p"
						className="bizprocdesigner-expression-builder__hint"
						data-testid="bizprocdesigner-expression-builder-mode-hint"
					>
						{{ currentModeHint }}
					</BxText2Xs>
				</div>
				<div
					class="bizprocdesigner-expression-builder__formula-section"
					role="group"
					:aria-labelledby="FORMULA_TITLE_ID"
					data-testid="bizprocdesigner-expression-builder-formula-section"
				>
					<BxText3Xs
						tag="p"
						transform="uppercase"
						className="bizprocdesigner-expression-builder__section-title"
						:id="FORMULA_TITLE_ID"
						data-testid="bizprocdesigner-expression-builder-formula-title"
					>
						{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FORMULA_SECTION_TITLE') }}
					</BxText3Xs>
					<div
						v-if="activeMode === EXPRESSION_BUILDER_MODES.functions"
						class="bizprocdesigner-expression-builder__chips"
						data-testid="bizprocdesigner-expression-builder-value-chain"
					>
						<FormulaChip
							readonly
							:parts="fieldValueParts"
							:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FORMULA_VALUE_PLACEHOLDER')"
							:ariaLabel="formulaValueLabel"
							testId="bizprocdesigner-expression-builder-value-chip"
						/>
					</div>
					<div
						v-else-if="activeMode === EXPRESSION_BUILDER_MODES.calculator"
						class="bizprocdesigner-expression-builder__mode-body"
						data-testid="bizprocdesigner-expression-builder-panel-calculator"
					>
						<SourceList
							v-if="isPickingOperand"
							ref="sourceList"
							:sections="visibleSourceSections"
							:loading="isLoadingSources"
							:error="sourcesErrorText"
							:searchPlaceholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SEARCH_PLACEHOLDER')"
							showBack
							data-testid="bizprocdesigner-expression-builder-source-list"
							@select="handleSourceSelect"
							@back="cancelPicking"
						/>
						<template v-else>
							<div
								class="bizprocdesigner-expression-builder__chips --calc"
								data-testid="bizprocdesigner-expression-builder-calc-chain"
							>
								<template v-for="operand in operandViews" :key="operand.index">
									<button
										v-if="operand.sign"
										:ref="chainElementRef('sign', operand.sign.index)"
										type="button"
										class="bizprocdesigner-expression-builder__operation-sign"
										:class="{ '--scope': isSignInRoundScope(operand.sign.index) }"
										:aria-label="operand.sign.ariaLabel"
										:data-testid="operand.sign.testId"
										@click="showOperationMenu(operand.sign.index)"
										@mouseenter="showSignScope(operand.sign.index)"
										@mouseleave="hideSignScope"
										@focus="showSignScope(operand.sign.index)"
										@blur="hideSignScope"
									>
										<BxTextMd
											tag="span"
											accent
											className="bizprocdesigner-expression-builder__part --operator"
										>{{ operand.sign.text }}</BxTextMd>
									</button>
									<template v-for="bracket in operand.openBrackets" :key="bracket.key">
										<button
											v-if="bracket.isGroup"
											:ref="chainElementRef('group-open', operand.index)"
											type="button"
											class="bizprocdesigner-expression-builder__group-bracket"
											:aria-label="bracket.ariaLabel"
											:data-testid="bracket.testId"
											@click="ungroupAt(bracket.ungroupAt)"
										>
											<BxTextMd
												tag="span"
												accent
												:className="['bizprocdesigner-expression-builder__part', bracket.depthClass]"
											>{{ bracket.text }}</BxTextMd>
										</button>
										<BxTextMd
											v-else
											tag="span"
											:className="['bizprocdesigner-expression-builder__part', bracket.depthClass]"
											aria-hidden="true"
											:data-testid="bracket.testId"
										>{{ bracket.text }}</BxTextMd>
									</template>
									<div
										v-if="editingOperand === operand.index"
										:ref="chainElementRef('row', operand.index)"
										class="bizprocdesigner-expression-builder__operand"
									>
										<BInput
											:ref="chainElementRef('field', operand.index)"
											v-model="editedOperandValue"
											:size="InputSize.Sm"
											:design="InputDesign.Grey"
											:label="operand.label"
											:ariaLabel="operand.label"
											:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OPERAND_PLACEHOLDER')"
											stretched
											:data-testid="operand.testId"
											@keydown.enter.prevent="finishEditingOperand"
											@blur="handleOperandBlur"
										/>
										<UiButton
											v-if="operand.canPickSource"
											:ref="chainElementRef('pick-source', operand.index)"
											:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_PICK_SOURCE')"
											:size="ButtonSize.EXTRA_SMALL"
											:style="AirButtonStyle.PLAIN_ACCENT"
											:dataset="{ testid: operand.pickSourceTestId }"
											@click="startPicking(operand.index)"
										/>
									</div>
									<FormulaChip
										v-else
										:ref="chainElementRef('chip', operand.index)"
										:parts="operand.chipParts"
										:placeholder="operand.name"
										:highlighted="isOperandInRoundScope(operand.index)"
										:toggle="isSelectingGroup"
										:pressed="operand.isSelected"
										:ariaLabel="operand.chipAriaLabel"
										:clearLabel="isSelectingGroup ? '' : operand.removeLabel"
										:testId="operand.chipTestId"
										@click="handleOperandClick(operand.index)"
										@clear="removeOperandAt(operand.index)"
									/>
									<template v-for="bracket in operand.closeBrackets" :key="bracket.key">
										<button
											v-if="bracket.isGroup"
											type="button"
											class="bizprocdesigner-expression-builder__group-bracket"
											:aria-label="bracket.ariaLabel"
											:data-testid="bracket.testId"
											@click="ungroupAt(bracket.ungroupAt)"
										>
											<BxTextMd
												tag="span"
												accent
												:className="['bizprocdesigner-expression-builder__part', bracket.depthClass]"
											>{{ bracket.text }}</BxTextMd>
										</button>
										<BxTextMd
											v-else
											tag="span"
											:className="['bizprocdesigner-expression-builder__part', bracket.depthClass]"
											aria-hidden="true"
											:data-testid="bracket.testId"
										>{{ bracket.text }}</BxTextMd>
									</template>
								</template>
								<BMenu
									v-if="isOperationMenuShown"
									ref="operationMenu"
									:options="operationMenuOptions"
									@close="closeOperationMenu"
								/>
							</div>
							<div
								class="bizprocdesigner-expression-builder__chain-actions"
								data-testid="bizprocdesigner-expression-builder-calc-actions"
							>
								<UiButton
									ref="addOperandButton"
									:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_ADD_OPERAND')"
									:size="ButtonSize.SMALL"
									:style="AirButtonStyle.TINTED"
									:leftIcon="Outline.CIRCLE_PLUS"
									:disabled="!canAddOperand"
									:dataset="{ testid: 'bizprocdesigner-expression-builder-calc-add-operand' }"
									@click="addOperand"
								/>
								<UiButton
									ref="groupStartButton"
									:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_START')"
									:size="ButtonSize.SMALL"
									:style="AirButtonStyle.OUTLINE"
									:disabled="!canStartGrouping"
									:dataset="{ testid: 'bizprocdesigner-expression-builder-group-start' }"
									@click="startGrouping"
								/>
								<template v-if="isSelectingGroup">
									<UiButton
										ref="groupConfirmButton"
										:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_CONFIRM')"
										:size="ButtonSize.SMALL"
										:style="AirButtonStyle.FILLED"
										:disabled="!canConfirmGroup"
										:dataset="{ testid: 'bizprocdesigner-expression-builder-group-confirm' }"
										@click="confirmGrouping"
									/>
									<UiButton
										:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_GROUP_CANCEL')"
										:size="ButtonSize.SMALL"
										:style="AirButtonStyle.PLAIN_NO_ACCENT"
										:dataset="{ testid: 'bizprocdesigner-expression-builder-group-cancel' }"
										@click="cancelGrouping"
									/>
								</template>
							</div>
							<BxText2Xs
								v-if="addOperandBlockReason"
								tag="p"
								className="bizprocdesigner-expression-builder__hint"
								:id="ADD_OPERAND_LIMIT_HINT_ID"
								data-testid="bizprocdesigner-expression-builder-calc-add-operand-limit"
							>
								{{ addOperandBlockReason }}
							</BxText2Xs>
							<BxText2Xs
								v-if="groupBlockReason"
								tag="p"
								className="bizprocdesigner-expression-builder__hint"
								:id="GROUP_BLOCK_HINT_ID"
								data-testid="bizprocdesigner-expression-builder-calc-group-block"
							>
								{{ groupBlockReason }}
							</BxText2Xs>
							<div
								v-if="calcBlockReason"
								class="bizprocdesigner-expression-builder__preview-warning"
								data-testid="bizprocdesigner-expression-builder-calc-block-reason"
							>
								<BIcon
									:name="Outline.CIRCLE_CROSS"
									:size="18"
									color="currentColor"
									aria-hidden="true"
								/>
								<BxTextMd
									tag="p"
									className="bizprocdesigner-expression-builder__preview-warning-text"
								>{{ calcBlockReason }}</BxTextMd>
							</div>
							<template v-else>
								<div
									v-if="isPreviewWarning"
									class="bizprocdesigner-expression-builder__preview-warning"
									data-testid="bizprocdesigner-expression-builder-preview"
								>
									<BIcon
										:name="Outline.CIRCLE_CROSS"
										:size="18"
										color="currentColor"
										aria-hidden="true"
									/>
									<BxTextMd
										tag="p"
										className="bizprocdesigner-expression-builder__preview-warning-text"
									>{{ previewText }}</BxTextMd>
								</div>
								<div
									v-else
									class="bizprocdesigner-expression-builder__preview"
									data-testid="bizprocdesigner-expression-builder-preview"
								>
									<BxText2Xs tag="p" className="bizprocdesigner-expression-builder__preview-text">
										{{ previewText }}
									</BxText2Xs>
								</div>
							</template>
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
							:error="sourcesErrorText"
							:searchPlaceholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_SEARCH_PLACEHOLDER')"
							:showBack="hasSelectedSource"
							data-testid="bizprocdesigner-expression-builder-source-list"
							@select="handleSourceSelect"
							@back="cancelPicking"
						/>
						<template v-else>
							<div
								class="bizprocdesigner-expression-builder__chips"
								data-testid="bizprocdesigner-expression-builder-chips"
							>
								<FormulaChip
									ref="sourceChip"
									:readonly="isModifierSourceFixed"
									:text="modifierSourceLabel"
									:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_SOURCE_PLACEHOLDER')"
									:kind="FORMULA_PART.source"
									:ariaLabel="sourceChipAriaLabel"
									:clearLabel="hasSelectedSource && !isModifierSourceFixed ? getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_SOURCE_CLEAR') : ''"
									testId="bizprocdesigner-expression-builder-source-chip"
									@click="startPicking('modifier')"
									@clear="clearModifierSource"
								/>
								<BxTextMd
									tag="span"
									className="bizprocdesigner-expression-builder__part --separator"
									aria-hidden="true"
								>&gt;</BxTextMd>
								<FormulaChip
									ref="modifierChip"
									:text="modifierChipText"
									:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_MODIFIER_PLACEHOLDER')"
									:kind="FORMULA_PART.modifier"
									:clearLabel="hasSelectedModifier ? getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_MODIFIER_CLEAR') : ''"
									:disabled="!hasModifiers"
									:ariaDescribedby="noModifiersForType ? NO_MODIFIERS_HINT_ID : ''"
									testId="bizprocdesigner-expression-builder-modifier-chip"
									@click="showModifierMenu"
									@clear="clearModifier"
								/>
								<BMenu
									v-if="isModifierMenuShown"
									ref="modifierMenu"
									:options="modifierMenuOptions"
									@close="closeModifierMenu"
								/>
							</div>
							<div
								v-if="showModifierWarning"
								class="bizprocdesigner-expression-builder__warning"
								data-testid="bizprocdesigner-expression-builder-warning"
							>
								<BxText2Xs tag="p" className="bizprocdesigner-expression-builder__warning-text">
									{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_UNKNOWN_TYPE_WARNING') }}
								</BxText2Xs>
							</div>
							<BxText2Xs
								v-if="noModifiersForType"
								tag="p"
								className="bizprocdesigner-expression-builder__hint"
								:id="NO_MODIFIERS_HINT_ID"
								data-testid="bizprocdesigner-expression-builder-no-modifiers"
							>
								{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MODIFICATION_NO_MODIFIERS') }}
							</BxText2Xs>
						</template>
					</div>
					<BxText2Xs
						tag="p"
						className="bizprocdesigner-expression-builder__hint"
						:data-testid="currentModeNoteTestId"
					>
						{{ currentModeNote }}
					</BxText2Xs>
				</div>
				<div
					v-if="activeMode === EXPRESSION_BUILDER_MODES.functions"
					class="bizprocdesigner-expression-builder__mode-body"
					data-testid="bizprocdesigner-expression-builder-panel-functions"
				>
					<SourceList
						:sections="functionSections"
						:loading="isLoadingFunctions"
						:error="functionsErrorText"
						:searchPlaceholder="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_FUNCTIONS_SEARCH_PLACEHOLDER')"
						data-testid="bizprocdesigner-expression-builder-function-list"
						@select="applyFunction"
					/>
				</div>
			</div>
			<div
				v-if="!applyOnChange"
				class="bizprocdesigner-expression-builder__footer"
				data-testid="bizprocdesigner-expression-builder-footer"
			>
				<UiButton
					:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CANCEL')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:dataset="{ testid: 'bizprocdesigner-expression-builder-cancel' }"
					@click="handleClose"
				/>
				<UiButton
					:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_APPLY')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					:disabled="!canApplyCurrent"
					:dataset="{ testid: 'bizprocdesigner-expression-builder-apply' }"
					@click="handleApply"
				/>
			</div>
		</div>
	`
	};

	// Geometry of the builder popup relative to its trigger.
	// Pure module: the component measures the DOM, this turns the measurements into the limits the
	// stylesheet holds the window to. Where the window is placed is main.popup's business, not ours.

	// Visible breathing room between the popup and the window edges.
	const VIEWPORT_MARGIN = 16;

	// Distance main.popup itself keeps between the trigger and the popup for the angle
	// (`angleTopOffset`), on either side of the trigger: see calculatePopupTopFromBelow() in
	// main/install/js/main/popup.
	const POPUP_ANGLE_GAP = 10;

	// The width the popup asks for; a window too narrow for it gets all it can spare.
	// The layout card is 460 wide counting a 1px border on each side, and this window draws no border
	// of its own, while `.popup-window` sizes itself by its outer edge (`box-sizing: border-box`): 458
	// is what leaves the content the working area of the layout. A border here brings this back to 460.
	const POPUP_WIDTH = 458;
	/**
	 * A ceiling, not a height: the window is as tall as its content asks for and this only says how
	 * tall it may grow. The ceiling follows the side the window is bound by:
	 *
	 * - `top` - the window is latched above the trigger and will stay there, so it may only grow up
	 *   to the top edge of the screen: the ceiling is the room above and nothing else. This ceiling is
	 *   also what keeps the window on that side, and that is an invariant to keep, not a side effect:
	 *   main.popup returns a window whose top edge comes out past the top of the document back below
	 *   the trigger (`top < 0` in calculatePopupTopFromAbove(), main/install/js/main/popup), and
	 *   `forceTop` does not disable that branch. A floor raising the ceiling over the room above the
	 *   trigger therefore brings the window back under it on a trigger standing high on the screen.
	 * - `bottom` - the side is still main.popup's to choose: it opens the popup below the trigger and
	 *   moves it above when it does not fit below. The ceiling is the room on the roomier of the two
	 *   sides, and for a reason: cut down to the room below, it would never let the window outgrow
	 *   that room, main.popup would never see the window not fitting, and one opened low on the
	 *   screen would be squeezed instead of moved above. Cut down to the room above, the window
	 *   would hang past the bottom edge while it still stands below the trigger.
	 *
	 * The stylesheet caps the window by its own ceiling as well and takes the lower of the two, so on
	 * a screen with room to spare the window keeps the size of its content.
	 */
	function calculatePopupMaxHeight(measurements) {
		const {
			triggerTop,
			triggerBottom,
			viewportHeight,
			side = 'bottom',
			gap = POPUP_ANGLE_GAP,
			margin = VIEWPORT_MARGIN
		} = measurements;
		const roomAbove = triggerTop - gap - margin;
		if (side === 'top') {
			return Math.max(0, Math.floor(roomAbove));
		}
		const roomBelow = viewportHeight - triggerBottom - gap - margin;
		return Math.max(0, Math.floor(Math.max(roomBelow, roomAbove)));
	}

	/**
	 * The width the popup takes: `POPUP_WIDTH` while the window has room for it, everything the
	 * window can spare between the margins when it does not, so a narrow window gets a narrower popup
	 * instead of one reaching past its side edge.
	 */
	function calculatePopupWidth(measurements) {
		const {
			viewportWidth,
			maxWidth = POPUP_WIDTH,
			margin = VIEWPORT_MARGIN
		} = measurements;
		return Math.max(0, Math.min(maxWidth, Math.floor(viewportWidth - 2 * margin)));
	}

	// The side is a one-way latch, see latchPopupSideAbove(). While the window is below its trigger
	// the side is main.popup's to choose: it moves the window above when it does not fit below, angle
	// and all, and it shifts it left off the right edge on its own too. Once the window is above the
	// trigger it is bound by these options instead, and forceTop takes one of the two ways back below
	// out of calculatePopupTopFromAbove(): the one that returns a window standing above the scroll
	// position. The other one - a top edge past the top of the document - forceTop leaves in place,
	// so what actually keeps the window above the trigger is the ceiling it is given: see the `top`
	// side of calculatePopupMaxHeight() in popup-fit.js for the invariant that holds it there.
	// forceBindPosition lets every re-fit recompute the placement in both cases.
	// Passed on as a copy: main.popup keeps the object it is given and writes its own fields into it
	// (forceTop, when there is no bindElement), which would both throw on the frozen constant and leak
	// that state into the next opening.
	const POPUP_BIND_OPTIONS_BELOW = Object.freeze({
		position: 'bottom',
		forceBindPosition: true
	});
	const POPUP_BIND_OPTIONS_ABOVE = Object.freeze({
		position: 'top',
		forceTop: true,
		forceBindPosition: true
	});

	/**
	 * The value constructor as a popup bound to the field it writes to: everything the window shows is
	 * {@see ExpressionBuilderBody}, everything about the window itself — its size, its place in the
	 * viewport, what closes it and where the focus goes afterwards — is here.
	 */
	// @vue/component
	const ExpressionBuilder = {
		name: 'ExpressionBuilder',
		components: {
			Popup: ui_vue3_components_popup.Popup,
			ExpressionBuilderBody
		},
		props: {
			bindElement: {
				type: Object,
				default: null
			},
			initialValue: {
				type: String,
				default: ''
			},
			/** Source sections owned by the host, handed on to the body as they are. */
			sourceSections: {
				type: Array,
				default: null
			},
			/** Collects the source sections on demand, handed on to the body as it is. */
			sourcesProvider: {
				type: Function,
				default: null
			},
			/** Lets the body name the values of `sourceSections` on the chips, handed on as it is. */
			allowSourceSectionLabels: {
				type: Boolean,
				default: false
			}
		},
		emits: ['apply', 'close'],
		setup() {
			const {
				getMessage
			} = useLoc();
			return {
				getMessage
			};
		},
		computed: {
			popupOptions() {
				return {
					id: 'bizprocdesigner-expression-builder-popup',
					ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_DIALOG_LABEL'),
					// Explicit trap: the portal setting that would turn it on by default is off outside
					// dev environments. Focus returns to the trigger on close; the apply path opts out
					// of the return (see suppressFocusRestore).
					focusTrap: {
						initialFocus: 'container',
						restoreFocus: this.bindElement
					},
					// Rendered in document.body (default targetContainer) so the narrow, overflow:hidden
					// settings panel cannot clip it; the viewport is then the whole window.
					bindElement: this.bindElement,
					width: calculatePopupWidth({
						viewportWidth: window.innerWidth
					}),
					autoHide: true,
					closeByEsc: true,
					cacheable: false,
					padding: 0,
					angle: true,
					// position:fixed container (main.popup setFixed) keeps the popup out of document
					// flow, so placing it low on the page does not grow document.scrollHeight and no
					// page scrollbar appears. The editor is a full-viewport SPA (page not scrolled), so
					// viewport coords == doc coords and the getBoundingClientRect-based height calc
					// stays correct.
					fixed: true,
					// The window always opens with the side free; the latch closes later, if it closes.
					bindOptions: {
						...POPUP_BIND_OPTIONS_BELOW
					},
					autoHideHandler: this.shouldAutoHide
				};
			}
		},
		created() {
			this.onWindowResize = main_core.Runtime.debounce(this.scheduleReposition, 100, this);
			this.resizeObserver = null;
			// Which side the window is bound by is nothing the template draws, see latchPopupSideAbove().
			this.isPopupLatchedAbove = false;
		},
		mounted() {
			main_core.Event.bind(window, 'resize', this.onWindowResize);
			this.scheduleReposition();

			// The window is as tall as its content, so a mode switch or a filtered list changes its
			// height. main.popup places the popup once and watches nothing of the kind: a window opened
			// above its trigger would grow down over the field it belongs to. The re-fit keeps the side
			// the window already stands on, see latchPopupSideAbove().
			// typeof, not Type.isFunction: the identifier may be absent, and reading it would throw
			const rootEl = this.getBodyElement();
			if (rootEl && typeof ResizeObserver === 'function') {
				this.resizeObserver = new ResizeObserver(() => this.adjustPopupPosition());
				this.resizeObserver.observe(rootEl);
			}
		},
		beforeUnmount() {
			main_core.Event.unbind(window, 'resize', this.onWindowResize);
			this.resizeObserver?.disconnect();
			this.resizeObserver = null;
		},
		methods: {
			// The body is a component of its own, so its root element is the one the window sizes.
			getBodyElement() {
				const rootEl = this.$refs.body?.$el;
				return main_core.Type.isDomNode(rootEl) ? rootEl : null;
			},
			scheduleReposition() {
				void this.$nextTick(() => {
					// A resized browser window is a new screen, not a changed content: the room on
					// either side of the trigger is different now, so the side is chosen anew.
					this.isPopupLatchedAbove = false;
					// Limits first, place second: main.popup reads the popup height inside
					// adjustPosition() to decide whether the popup goes below the trigger or above it,
					// so the window must already be at its final size by then.
					this.applyViewportFit();
					this.adjustPopupPosition();
				});
			},
			/**
			 * Gives the window the limits the screen sets - the width a narrow window can hold and the
			 * ceiling of the side it is bound by - and nothing more: the height itself comes from the
			 * content, and where the window is placed is main.popup's business.
			 */
			applyViewportFit() {
				const rootEl = this.getBodyElement();
				if (!rootEl || !main_core.Type.isDomNode(this.bindElement)) {
					return;
				}
				const {
					top: triggerTop,
					bottom: triggerBottom
				} = this.bindElement.getBoundingClientRect();
				const maxHeight = calculatePopupMaxHeight({
					triggerTop,
					triggerBottom,
					viewportHeight: window.innerHeight,
					// Read off the bind options rather than kept alongside them: a ceiling counted from
					// one side while the window is bound by the other lets it overhang the screen.
					side: this.getPopupBindOptions().position
				});
				main_core.Dom.style(rootEl, '--eb-max-height', `${maxHeight}px`);
				this.$refs.popup?.getPopupInstance?.()?.setWidth(calculatePopupWidth({
					viewportWidth: window.innerWidth
				}));
			},
			/**
			 * Decides whether an outside click closes the builder (true hides it, see main.popup
			 * handleAutoHide). Everything the builder opens on top of itself (the operation menu, the
			 * HR selector) is a popup of its own in document.body, so without this a click on a menu
			 * item counts as a click outside the builder and closes it mid-interaction.
			 */
			shouldAutoHide({
				target
			}) {
				const containerEl = this.$refs.popup?.getPopupInstance?.()?.getPopupContainer?.();
				if (!containerEl || !main_core.Type.isDomNode(target)) {
					return true;
				}
				if (containerEl === target || containerEl.contains(target)) {
					return false;
				}

				// Any popup layer, ours or one opened from it: main.popup gives them all this class.
				return target.closest('.popup-window') === null;
			},
			getPopupBindOptions() {
				return {
					...(this.isPopupLatchedAbove ? POPUP_BIND_OPTIONS_ABOVE : POPUP_BIND_OPTIONS_BELOW)
				};
			},
			adjustPopupPosition() {
				const popupInstance = this.$refs.popup?.getPopupInstance?.();
				if (!popupInstance) {
					return;
				}
				popupInstance.adjustPosition(this.getPopupBindOptions());
				if (this.latchPopupSideAbove(popupInstance)) {
					// The ceiling came from the roomier side while the side was still free; now that
					// the window is bound above the trigger, it may only grow up to the top edge.
					this.applyViewportFit();
				}
			},
			/**
			 * A one-way latch on the side of the trigger the window stands on: main.popup may still
			 * move the window above the trigger, but once it is there it stays until the window is
			 * closed. Without this every content change - a mode switch, a filtered list - has
			 * main.popup pick the side anew, and the window jumps from under the cursor to above it
			 * and back.
			 *
			 * The side is read off the placed window instead of being computed: repeating the move
			 * condition of main.popup here would be a second copy of it, free to drift away from the
			 * original. Read by the bottom edge, not by the top one: a window standing above the
			 * trigger ends where the trigger begins and one standing below it starts lower, so the two
			 * cases are the whole height of the window apart, and a window not placed yet does not
			 * pass for one standing above.
			 *
			 * Returns true only on the change, so the caller can re-fit the window once.
			 */
			latchPopupSideAbove(popupInstance) {
				if (this.isPopupLatchedAbove || !main_core.Type.isDomNode(this.bindElement)) {
					return false;
				}
				const containerEl = popupInstance.getPopupContainer?.();
				if (!main_core.Type.isDomNode(containerEl)) {
					return false;
				}
				const {
					bottom: popupBottom,
					height: popupHeight
				} = containerEl.getBoundingClientRect();
				if (popupHeight === 0) {
					// A window of no size is a window not placed yet: it stands on neither side.
					return false;
				}
				const {
					top: triggerTop
				} = this.bindElement.getBoundingClientRect();
				this.isPopupLatchedAbove = popupBottom <= triggerTop;
				return this.isPopupLatchedAbove;
			},
			// The applied value lands in the target field, which takes the focus itself
			// (see insertExpression), so the popup must not pull it back to the trigger on close.
			suppressFocusRestore() {
				this.$refs.popup?.getPopupInstance?.()?.getFocusTrap?.()?.setRestoreFocus(false);
			},
			handleApply(value) {
				this.suppressFocusRestore();
				this.$emit('apply', value);
			},
			handleClose() {
				this.$emit('close');
			}
		},
		template: `
		<Popup ref="popup" :options="popupOptions" @close="handleClose">
			<ExpressionBuilderBody
				ref="body"
				:initialValue="initialValue"
				:sourceSections="sourceSections"
				:sourcesProvider="sourcesProvider"
				:allowSourceSectionLabels="allowSourceSectionLabels"
				@apply="handleApply"
				@close="handleClose"
			/>
		</Popup>
	`
	};

	exports.CALC_OP = CALC_OP;
	exports.CALC_OPERATIONS = CALC_OPERATIONS;
	exports.EXPRESSION_BUILDER_MODES = EXPRESSION_BUILDER_MODES;
	exports.ExpressionBuilder = ExpressionBuilder;
	exports.ExpressionBuilderBody = ExpressionBuilderBody;
	exports.FORMULA_PART = FORMULA_PART;
	exports.MAX_PARSE_LENGTH = MAX_PARSE_LENGTH;
	exports.PREVIEW_KIND = PREVIEW_KIND;
	exports.PREVIEW_WARNING = PREVIEW_WARNING;
	exports.SourceList = SourceList;
	exports.describeFormulaParts = describeFormulaParts;
	exports.getSystemVariableItems = getSystemVariableItems;
	exports.recognizeFieldValue = recognizeFieldValue;
	exports.resolveExpressionMode = resolveExpressionMode;
	exports.tokenizeExpression = tokenizeExpression;

})(this.BX.Bizprocdesigner = this.BX.Bizprocdesigner || {}, BX, BX.UI.Vue3.Components, BX.Vue3, BX.UI.Accessibility, BX.UI.System.Chip.Vue, BX.UI.IconSet, window, window, BX.UI.System.Typography.Vue, BX.UI.System.Input.Vue, BX.Vue3.Components, BX.UI.System.Menu);
//# sourceMappingURL=expression-builder.bundle.js.map

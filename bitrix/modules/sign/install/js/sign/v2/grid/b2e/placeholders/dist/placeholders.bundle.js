/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, sign_v2_b2e_vueUtil, main_core, ui_notification, ui_iconSet_api_vue, ui_iconSet_outline, ui_a11y, ui_system_chip_vue, ui_system_typography_vue, ui_vue3_components_button, sign_v2_helper, ui_buttons, sign_v2_b2e_companySelector, sign_v2_b2e_hcmLinkCompanySelector, ui_vue3, sign_v2_api, sign_v2_analytics, main_loader, sign_v2_b2e_fieldSelector) {
	'use strict';

	const TabType = {
		BITRIX24: 'bitrix24',
		HCM_LINK: 'hcmLink'
	};
	const SectionType = {
		HCM_LINK: 'hcmLink',
		EMPLOYEE: 'employee',
		SMART_B2E_DOC: 'smartB2eDoc',
		COMPANY: 'company',
		REPRESENTATIVE: 'representative'
	};
	const SelectorType = {
		hcmLinkCompany: 'hcmLinkCompany',
		myCompany: 'myCompany'
	};

	/**
	 * The settings the panel was mounted with: the name of the extension and the reading of a setting live
	 * here alone, so the panel and the rows of it read the same setting from one place.
	 *
	 * The core keeps the settings of an extension after the first reading, so a caller needs no cache of
	 * its own.
	 */

	const EXTENSION_NAME = 'sign.v2.grid.b2e.placeholders';

	/** Region of the portal license: a group of a region of its own is offered in that region alone. */
	const panelRegion = () => {
		return main_core.Extension.getSettings(EXTENSION_NAME).get('region') ?? '';
	};

	/**
	 * Languages of the portal, the way the field configurator asks for them: the panel hands the value
	 * over untouched and never looks inside it.
	 */
	const panelLanguages = () => {
		return main_core.Extension.getSettings(EXTENSION_NAME).get('languages');
	};

	/**
	 * Copying with an unambiguous answer. The clipboard of the browser goes first, the temporary
	 * textarea of this extension picks up any refusal, and the caller learns whether the text really
	 * reached the clipboard: only then the row may report success.
	 */

	const writeTextOfBrowser = text => {
		if (!navigator.clipboard || !window.isSecureContext) {
			return Promise.reject(new Error('Clipboard of the browser is unavailable'));
		}
		return navigator.clipboard.writeText(text);
	};
	const copyViaTextarea = text => {
		const focusedBeforeCopy = document.activeElement;
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.readOnly = true;
		// Out of the view of the page: a field inserted into the flow would pull the scroll to itself.
		main_core.Dom.style(textarea, {
			position: 'fixed',
			top: '0',
			left: '-9999px'
		});
		main_core.Dom.append(textarea, document.body);
		textarea.select();
		try {
			return document.execCommand('copy');
		} catch (error) {
			console.error('Failed to copy via the textarea of the extension:', error);
			return false;
		} finally {
			main_core.Dom.remove(textarea);

			// `select()` takes the focus and the removal of the textarea loses it: the zone of the row the
			// user copied from has to keep its place in the list, and the scroll of the list with it.
			// The node is recognised by the predicate of the core and never by `instanceof`: a page of the
			// portal may hold no usable global constructor, and a throw here would take the answer of the
			// copy with it.
			if (main_core.Type.isElementNode(focusedBeforeCopy)) {
				focusedBeforeCopy.focus({
					preventScroll: true
				});
			}
		}
	};
	const browserBackends = {
		writeText: writeTextOfBrowser,
		copyViaTextarea
	};
	const copyToClipboard = async (text, backends = browserBackends) => {
		try {
			await backends.writeText(text);
			return true;
		} catch {
			return backends.copyViaTextarea(text);
		}
	};

	/**
	 * Payload of the copy event. A copied field is described by its type and by the modifier groups the
	 * user applied: the code of the field, its name and its value never reach analytics, otherwise the
	 * builder would turn into a channel leaking the field set of the portal.
	 */

	const UNKNOWN_FIELD_TYPE = 'unknown';
	const NO_GROUPS = 'none';

	/** A single underscore of `p1`..`p5` separates the prefix, so the value keeps none of its own. */
	const asParameterValue = value => value.replace(/_/g, '-');
	const buildCopyCodeEvent = input => {
		const groups = [...input.groupIds].sort();
		const fieldType = asParameterValue(input.fieldType ?? '');
		return {
			category: 'placeholders',
			event: 'copy_placeholder_code',
			c_section: 'sign',
			c_sub_section: 'placeholders',
			type: groups.length > 0 ? 'with-modifiers' : 'without-modifiers',
			p1: `fieldtype_${fieldType === '' ? UNKNOWN_FIELD_TYPE : fieldType}`,
			p2: `groups_${groups.length > 0 ? groups.map(asParameterValue).join('-') : NO_GROUPS}`,
			status: input.isCopied ? 'success' : 'error'
		};
	};

	/**
	 * Declarative catalog of placeholder modifiers.
	 *
	 * Every parameter string is stored literally, character by character as the module that owns the
	 * semantics reads it. Case matters and is never produced by transforming another spelling:
	 *  - name declension and address: capitalized aliases `Case`, `Format`, `Separator`
	 *    (`documentgenerator/lib/value/name.php`,
	 *    `signsafe/lib/Integrations/DocumentGenerator/Value/AddressValue.php`);
	 *  - letter case: the single spelling `letterCase` with `upper|lower|title`
	 *    (`documentgenerator/lib/value/planestring.php`);
	 *  - date format: a bare format string of `FormatDate` (`documentgenerator/lib/value/datetime.php`);
	 *  - phone format: lowercase `format` with values of `Bitrix\Main\PhoneNumber\Format`
	 *    (`signsafe/lib/Integrations/DocumentGenerator/Value/StringWithPhoneFormat.php`);
	 *  - several values: lowercase `all`, `index` (`documentgenerator/lib/body.php`) and
	 *    `mseparator`, `mfirst` (`signsafe/lib/Integrations/DocumentGenerator/Value/ListValue.php`).
	 *
	 * The catalog says only how to assemble the string. The meaning of a substitution, the order in
	 * which modifiers apply and any prediction of the result are out of its scope.
	 */

	// The parts of a name and the composite name itself: the server builds all four from the same
	// `Value\Name`, so declension applies to each of them
	// (`signsafe/lib/Service/Placeholder/ModifierValueResolver.php`).
	const NAME_TYPES = ['fullname', 'firstname', 'lastname', 'patronymic'];

	// Letter case applies to the string a typed value has already produced, so only a type whose value
	// holds letters belongs here: digits have no case.
	const TEXT_TYPES = [...NAME_TYPES, 'position', 'string', 'address', 'list', 'email', 'external_id'];

	// The base variant of a group means "reset the group". A group whose layout gives it a name of its
	// own passes that label key: the case and the letter case do, the rest keep the common one.
	const asIsVariant = (labelKey = 'PLACEHOLDER_MODIFIER_VARIANT_AS_IS') => {
		return {
			id: 'asIs',
			labelKey,
			parameters: [],
			exclusive: false,
			mechanics: null
		};
	};
	const modifierCatalog = {
		groups: [{
			// Declension goes without a written form of its own: `Value\Name` declines every part
			// separately and only then formats them, so the word order cannot spoil the case.
			id: 'case',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_CASE',
			applicableTypes: NAME_TYPES,
			regions: ['ru'],
			variants: [asIsVariant('PLACEHOLDER_MODIFIER_VARIANT_CASE_NOMINATIVE'), {
				id: 'genitive',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_GENITIVE',
				parameters: ['Case=0'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'dative',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_DATIVE',
				parameters: ['Case=1'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'accusative',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_ACCUSATIVE',
				parameters: ['Case=2'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'instrumental',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_INSTRUMENTAL',
				parameters: ['Case=3'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'prepositional',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_PREPOSITIONAL',
				parameters: ['Case=4'],
				exclusive: false,
				mechanics: null
			}]
		}, {
			// The order of the parts and the initials are both the single `Format` of `Value\Name`, and a
			// code carries only the last `Format` of all (`documentgenerator/lib/value.php`), so the group
			// offers ready combinations. Substitutions are those of `CUser::FormatName`, where `#TITLE#`,
			// `#EMAIL#` and `#ID#` render empty. `Format` sets the composition of the parts as a whole,
			// so the group is offered to the composite name only: on a single part every choice but the
			// base one would print parts the field does not stand for.
			id: 'fullName',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_FULL_NAME',
			applicableTypes: ['fullname'],
			regions: [],
			variants: [asIsVariant(), {
				id: 'lastFirstPatronymic',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_LAST_FIRST_PATRONYMIC',
				parameters: ['Format=#LAST_NAME# #NAME# #SECOND_NAME#'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'firstPatronymicLast',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_FIRST_PATRONYMIC_LAST',
				parameters: ['Format=#NAME# #SECOND_NAME# #LAST_NAME#'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'lastWithInitials',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_LAST_WITH_INITIALS',
				parameters: ['Format=#LAST_NAME# #NAME_SHORT##SECOND_NAME_SHORT#'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'initialsWithLast',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_INITIALS_WITH_LAST',
				parameters: ['Format=#NAME_SHORT##SECOND_NAME_SHORT# #LAST_NAME#'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'lastFirst',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_LAST_FIRST',
				parameters: ['Format=#LAST_NAME# #NAME#'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'firstLast',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_FIRST_LAST',
				parameters: ['Format=#NAME# #LAST_NAME#'],
				exclusive: false,
				mechanics: null
			}]
		}, {
			id: 'datetime',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_DATETIME',
			applicableTypes: ['date', 'external_date'],
			regions: [],
			variants: [asIsVariant(), {
				id: 'digits',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_DATETIME_DIGITS',
				parameters: ['d.m.Y'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'digitsWithTime',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_DATETIME_DIGITS_WITH_TIME',
				parameters: ['d.m.Y H:i'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'monthInWords',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_DATETIME_MONTH_IN_WORDS',
				parameters: ['j F Y'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'monthInWordsWithTime',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_DATETIME_MONTH_IN_WORDS_WITH_TIME',
				parameters: ['j F Y, H:i'],
				exclusive: true,
				mechanics: null
			}]
		}, {
			id: 'phone',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_PHONE',
			applicableTypes: ['phone'],
			regions: [],
			variants: [asIsVariant(), {
				id: 'international',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_PHONE_INTERNATIONAL',
				parameters: ['format=International'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'national',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_PHONE_NATIONAL',
				parameters: ['format=National'],
				exclusive: false,
				mechanics: null
			}, {
				// `Format::E164` keeps the plus of the code of the country and drops the separators
				// (`+79112223344`), so the variant is about the compact spelling and not about digits alone.
				id: 'compact',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_PHONE_COMPACT',
				parameters: ['format=E.164'],
				exclusive: false,
				mechanics: null
			}]
		}, {
			id: 'address',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_ADDRESS',
			applicableTypes: ['address'],
			regions: [],
			variants: [asIsVariant(), {
				id: 'oneLine',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_ADDRESS_ONE_LINE',
				parameters: ['Separator=1'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'partPerLine',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_ADDRESS_PART_PER_LINE',
				parameters: ['Separator=2'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'postalCodeLast',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_ADDRESS_POSTAL_CODE_LAST',
				parameters: ['Format=4'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'postalCodeFirst',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_ADDRESS_POSTAL_CODE_FIRST',
				parameters: ['Format=5'],
				exclusive: false,
				mechanics: null
			}]
		}, {
			// Both mechanics behind the group need a value that holds a list of items, and that is the
			// `list` type of the field - the multiplicity flag of the field says nothing about it.
			id: 'multiValue',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_MULTI_VALUE',
			applicableTypes: ['list'],
			regions: [],
			variants: [asIsVariant(), {
				id: 'allValues',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_MULTI_VALUE_ALL',
				parameters: ['all=y'],
				exclusive: false,
				mechanics: 'collection'
			}, {
				id: 'firstValue',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_MULTI_VALUE_FIRST',
				parameters: ['mfirst=y'],
				exclusive: false,
				mechanics: 'multiValue'
			}, {
				id: 'valuePerLine',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_MULTI_VALUE_PER_LINE',
				parameters: ['mseparator=2'],
				exclusive: false,
				mechanics: 'multiValue'
			}]
		}, {
			// Letter case goes last: the catalog order is what makes the assembled code stable.
			id: 'letterCase',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_LETTER_CASE',
			applicableTypes: TEXT_TYPES,
			regions: [],
			variants: [asIsVariant('PLACEHOLDER_MODIFIER_VARIANT_LETTER_CASE_REGULAR'), {
				id: 'title',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_LETTER_CASE_TITLE',
				parameters: ['letterCase=title'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'upper',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_LETTER_CASE_UPPER',
				parameters: ['letterCase=upper'],
				exclusive: false,
				mechanics: null
			}, {
				id: 'lower',
				labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_LETTER_CASE_LOWER',
				parameters: ['letterCase=lower'],
				exclusive: false,
				mechanics: null
			}]
		}]
	};

	/**
	 * Assembling the symbolic code from a chosen set of modifiers and switching the choice inside a group.
	 *
	 * Pure functions over the catalog: no Vue, no DOM, no network.
	 */

	const groupIdsOf = selection => {
		return Object.keys(selection);
	};
	const withoutExclusive = selection => {
		const next = {};
		groupIdsOf(selection).forEach(groupId => {
			const variant = selection[groupId];
			if (variant && !variant.exclusive) {
				next[groupId] = variant;
			}
		});
		return next;
	};

	/**
	 * Parameter strings of the chosen set, in catalog order: what the assembled code carries after the
	 * tilde. An exclusive variant leaves nothing but itself.
	 */
	const selectionParameters = selection => {
		const parameters = [];
		for (const group of modifierCatalog.groups) {
			const variant = selection[group.id];
			if (!variant || variant.parameters.length === 0) {
				continue;
			}
			if (variant.exclusive) {
				return [...variant.parameters];
			}
			parameters.push(...variant.parameters);
		}
		return parameters;
	};

	/**
	 * The code of the field together with the chosen set, the way the history stores it. Parameters of
	 * different groups and several parameters of one variant are joined by a comma on the same level, so
	 * the result never holds more than one tilde.
	 */
	const assembledCode = (baseCode, selection) => {
		const parameters = selectionParameters(selection);
		return parameters.length === 0 ? baseCode : `${baseCode}~${parameters.join(',')}`;
	};

	/** The same code wrapped for the clipboard: the braces belong to the copy and to nothing else. */
	const buildCode = (baseCode, selection) => {
		return `{${assembledCode(baseCode, selection)}}`;
	};

	/** Switches the choice inside a group: the base variant resets it, an exclusive one drops the rest. */
	const toggle = (selection, group, variant) => {
		if (variant.parameters.length === 0) {
			const next = {
				...selection
			};
			delete next[group.id];
			return next;
		}
		if (variant.exclusive) {
			const exclusiveOnly = {};
			exclusiveOnly[group.id] = variant;
			return exclusiveOnly;
		}
		const next = withoutExclusive(selection);
		next[group.id] = variant;
		return next;
	};

	/**
	 * The type of the field decides which groups of the catalog it is offered, and the groups keep the
	 * catalog order. A field whose type no group names - an unknown type among them - gets none at all,
	 * and the panel leaves such a row without an accordion.
	 *
	 * Pure functions over the catalog: no Vue, no DOM, no network.
	 */


	/** The part of a fields list item the filter reads. */

	const isApplicable = (group, field, region) => {
		if (group.regions.length > 0 && !group.regions.includes(region)) {
			return false;
		}
		return group.applicableTypes.includes(field.type);
	};
	const orderGroups = (field, region) => {
		return modifierCatalog.groups.filter(group => isApplicable(group, field, region));
	};

	/**
	 * One group of the catalog: its label and a row of chips. Phrases are the only text here - a field name
	 * or its code never reaches the accordion.
	 */
	// @vue/component
	const ModifierGroupChips = {
		name: 'SignPlaceholderModifierGroup',
		components: {
			Chip: ui_system_chip_vue.Chip,
			Text2Xs: ui_system_typography_vue.Text2Xs
		},
		props: {
			group: {
				/** @type ModifierGroup */
				type: Object,
				required: true
			},
			/** Chosen variant of the group; `null` means the group keeps its base variant. */
			selected: {
				/** @type ModifierVariant | null */
				type: Object,
				default: null
			}
		},
		emits: ['select'],
		setup() {
			return {
				ChipSize: ui_system_chip_vue.ChipSize
			};
		},
		methods: {
			label(phraseCode) {
				return main_core.Loc.getMessage(phraseCode);
			},
			groupTestId() {
				return `sign-placeholder-modifier-group-${this.group.id}`;
			},
			testId(variant) {
				return `sign-placeholder-modifier-${this.group.id}-${variant.id}`;
			},
			isSelected(variant) {
				return this.selected === null ? variant.parameters.length === 0 : this.selected.id === variant.id;
			},
			// The chip has no "selected" prop: the state is the design it is drawn with.
			design(variant) {
				return this.isSelected(variant) ? ui_system_chip_vue.ChipDesign.Tinted : ui_system_chip_vue.ChipDesign.OutlineNoAccent;
			}
		},
		/**
		 * The chip is a single-node component without `inheritAttrs: false`, so the role and the pressed
		 * state travel to its root along with the test identifier. Activation by Space stays out of reach:
		 * the keydown handler of the chip belongs to the design system and answers Enter alone.
		 */
		template: `
		<div class="sign-placeholders-modifier-group" :data-testid="groupTestId()">
			<Text2Xs class-name="sign-placeholders-modifier-group-title">{{ label(group.labelKey) }}</Text2Xs>
			<div
				class="sign-placeholders-modifier-group-chips"
				role="group"
				:aria-label="label(group.labelKey)"
			>
				<Chip
					v-for="variant in group.variants"
					:key="variant.id"
					:text="label(variant.labelKey)"
					:size="ChipSize.Xs"
					:design="design(variant)"
					role="button"
					:aria-pressed="isSelected(variant)"
					:data-testid="testId(variant)"
					@click="$emit('select', variant)"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ModifierAccordion = {
		name: 'SignPlaceholderModifierAccordion',
		components: {
			ModifierGroupChips
		},
		props: {
			/** Groups the type of the field is offered, in catalog order. */
			groups: {
				/** @type ModifierGroup[] */
				type: Array,
				required: true
			},
			/** Chips drawn as chosen right now. */
			selection: {
				/** @type ModifierSelection */
				type: Object,
				default: () => ({})
			}
		},
		emits: ['select'],
		methods: {
			selectedVariant(group) {
				return this.selection[group.id] ?? null;
			},
			handleSelect(group, variant) {
				this.$emit('select', {
					group,
					variant
				});
			}
		},
		template: `
		<div class="sign-placeholders-modifier-accordion" data-testid="sign-placeholder-modifier-accordion">
			<ModifierGroupChips
				v-for="group in groups"
				:key="group.id"
				:group="group"
				:selected="selectedVariant(group)"
				@select="handleSelect(group, $event)"
			/>
		</div>
	`
	};

	const COPIED_STATE_DURATION = 1500;
	const NOTIFICATION_HIDE_DELAY$2 = 4000;
	// An unavailable clipboard refuses every copy, so the toasts of the refusals replace one another.
	const COPY_FAILED_NOTIFICATION_ID = 'sign-placeholders-copy-failed';

	// @vue/component
	const PlaceholderItem = {
		name: 'PlaceholderItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			ModifierAccordion
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			placeholder: {
				type: Object,
				required: true
			},
			/** Functional identity of the row: the accordion of the panel opens and closes by it. */
			itemId: {
				type: String,
				default: ''
			},
			testId: {
				type: String,
				default: ''
			},
			sectionType: {
				type: String,
				default: ''
			},
			/**
			 * The open accordion travels as a state of the row and not as the identity of the open one: the
			 * value of a row the user did not touch stays the same, so raising one accordion patches two
			 * rows and not the whole catalog.
			 */
			expanded: {
				type: Boolean,
				default: false
			},
			/**
			 * The set the row starts with and comes back to: a row of the history is drawn with the set it
			 * was copied with, a row of the list with none.
			 */
			storedSelection: {
				/** @type ModifierSelection */
				type: Object,
				default: () => ({})
			},
			/** A row of the recent fields block offers no deletion: the history is no place to manage fields from. */
			deletable: {
				type: Boolean,
				default: true
			}
		},
		emits: ['toggle-expand', 'delete-field'],
		inject: ['analytics', 'recordFieldUsage'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				region: panelRegion(),
				// The timer of the state is kept out of the reactive state: nothing renders its descriptor, and
				// a proxy of one is no descriptor the environment would take back.
				copiedState: {
					timerId: null
				}
			};
		},
		data() {
			return {
				isCopied: false,
				selection: {
					...this.storedSelection
				}
			};
		},
		computed: {
			hasCode() {
				return Boolean(this.placeholder.value);
			},
			/**
			 * Groups the type of the field is offered; an empty list leaves the row without an accordion.
			 * An unknown type of the field is one of the reasons, and the user is not told about it.
			 */
			modifierGroups() {
				return orderGroups(this.placeholder, this.region);
			},
			hasModifiers() {
				return this.modifierGroups.length > 0;
			},
			isExpanded() {
				return this.hasCode && this.expanded;
			},
			/**
			 * The server marks the items it lets the user delete: the identifier of the user field comes
			 * with the item only then. The zone is a shortcut, not a permission: the delete action checks
			 * the right again.
			 */
			canDelete() {
				return this.deletable && Boolean(this.placeholder.fieldId);
			},
			hasExpandZone() {
				return this.hasCode && this.hasModifiers;
			},
			copyZoneClasses() {
				return {
					'sign-placeholders-item-copy-zone': true,
					'--clickable': this.hasCode
				};
			},
			expandZoneClasses() {
				return {
					'sign-placeholders-item-expand-zone': true,
					'--expanded': this.isExpanded,
					'--covered': this.isCopied
				};
			},
			deleteZoneClasses() {
				return {
					'sign-placeholders-item-delete-zone': true,
					'--covered': this.isCopied
				};
			},
			typeIconClasses() {
				const iconType = Object.values(SectionType).includes(this.sectionType) ? this.sectionType : 'default';
				return {
					'sign-placeholders-type-icon': true,
					[`sign-placeholders-type-icon--${iconType}`]: true
				};
			}
		},
		watch: {
			/**
			 * Opening and closing the accordion bring the row back to the set it was given: a row of the list
			 * starts over with nothing chosen, a row of the history with the set it was copied with.
			 */
			isExpanded() {
				this.selection = {
					...this.storedSelection
				};
			}
		},
		beforeUnmount() {
			clearTimeout(this.copiedState.timerId);
		},
		methods: {
			/**
			 * The name of the field belongs to the accessible name of every zone and to every announcement
			 * of the row: the rows of the list differ by it alone, and a nameless delete is dangerous.
			 */
			withFieldName(phraseCode) {
				return this.loc(phraseCode, {
					'#FIELD_NAME#': this.placeholder.name
				});
			},
			handleCopy() {
				if (!this.hasCode) {
					return;
				}
				void this.copyCode(this.selection);
			},
			handleToggleExpand() {
				this.$emit('toggle-expand', this.itemId);
			},
			handleDelete() {
				this.$emit('delete-field', this.placeholder);
			},
			handleModifierSelect({
				group,
				variant
			}) {
				this.selection = toggle(this.selection, group, variant);
				void this.copyCode(this.selection);
			},
			// Both the copy zone and a chip copy the code of the set the row holds right now.
			async copyCode(selection) {
				const code = buildCode(this.placeholder.value, selection);
				const isCopied = await copyToClipboard(code);
				this.analytics.send(buildCopyCodeEvent({
					fieldType: this.placeholder.type ?? null,
					groupIds: Object.keys(selection),
					isCopied
				}));

				// The field was used even when the clipboard refused it: the toast still hands the code over.
				// The history takes the assembled code, so the row it draws copies what was copied here.
				void this.recordFieldUsage(assembledCode(this.placeholder.value, selection));
				if (!isCopied) {
					this.notifyToCopyManually(code);
					return;
				}
				this.showCopiedState();
				ui_a11y.LiveAnnouncer.announce(this.withFieldName('PLACEHOLDER_LIST_COPIED_ANNOUNCEMENT'));
			},
			/**
			 * A repeated copy restarts the state instead of laying a second timer over the first one. The
			 * panel is rebuilt as a whole after a field is created or deleted, so the timer of a row must
			 * not outlive it either.
			 */
			showCopiedState() {
				clearTimeout(this.copiedState.timerId);
				this.isCopied = true;
				this.copiedState.timerId = setTimeout(() => {
					this.isCopied = false;
					this.copiedState.timerId = null;
				}, COPIED_STATE_DURATION);
			},
			// An unavailable clipboard must not lose the built code: the toast shows it in full.
			notifyToCopyManually(code) {
				ui_notification.UI.Notification.Center.notify({
					id: COPY_FAILED_NOTIFICATION_ID,
					content: this.loc('PLACEHOLDER_LIST_COPY_FAILED_NOTIFICATION', {
						'#CODE#': main_core.Text.encode(code)
					}),
					autoHideDelay: NOTIFICATION_HIDE_DELAY$2
				});

				// The toast is no live region and it takes the only copy of the code away with it, so the
				// announcement of the refusal carries the code itself.
				ui_a11y.LiveAnnouncer.announce(this.loc('PLACEHOLDER_LIST_COPY_FAILED_NOTIFICATION', {
					'#CODE#': code
				}), 'assertive');
			}
		},
		// The copied state is laid over the strip of the zones instead of replacing it: a zone activated
		// from the keyboard must keep the focus. The zones the state hides take no input while it is shown,
		// the copy zone stays live; `null` keeps `inert` out of the markup, `inert="false"` would still
		// leave the zone inert. The pointer is kept out by the class as well - a browser that knows no
		// `inert` would let a blind click through to the deletion of a field.
		template: `
		<div class="sign-placeholders-item" :data-testid="testId">
			<div class="sign-placeholders-item-zones">
				<div
					:class="copyZoneClasses"
					:role="hasCode ? 'button' : null"
					:tabindex="hasCode ? 0 : null"
					:aria-label="hasCode ? withFieldName('PLACEHOLDER_LIST_COPY_CODE_LABEL_MSGVER_1') : null"
					:data-testid="hasCode ? testId + '-copy' : null"
					@click="handleCopy"
					@keydown.enter="handleCopy"
					@keydown.space.prevent="handleCopy"
				>
					<span :class="typeIconClasses" :title="placeholder.value"></span>
					<span class="sign-placeholders-item-name">{{ placeholder.name }}</span>
				</div>
				<div
					v-if="canDelete"
					:class="deleteZoneClasses"
					role="button"
					tabindex="0"
					:inert="isCopied || null"
					:aria-label="withFieldName('PLACEHOLDER_LIST_DELETE_FIELD_LABEL_MSGVER_1')"
					:data-testid="testId + '-delete'"
					@click="handleDelete"
					@keydown.enter="handleDelete"
					@keydown.space.prevent="handleDelete"
				>
					<BIcon :name="Outline.TRASHCAN" :size="20" color="var(--ui-color-accent-main-alert)"/>
				</div>
				<template v-if="hasExpandZone">
					<span class="sign-placeholders-item-zones-divider"></span>
					<div
						:class="expandZoneClasses"
						role="button"
						tabindex="0"
						:inert="isCopied || null"
						:aria-expanded="isExpanded"
						:aria-label="withFieldName('PLACEHOLDER_LIST_MODIFIERS_LABEL_MSGVER_1')"
						:data-testid="testId + '-expand'"
						@click="handleToggleExpand"
						@keydown.enter="handleToggleExpand"
						@keydown.space.prevent="handleToggleExpand"
					>
						<BIcon
							class="sign-placeholders-item-expand-chevron"
							:name="Outline.CHEVRON_DOWN_M"
							:size="20"
							color="var(--ui-color-base-2)"
						/>
					</div>
				</template>
				<div v-if="isCopied" class="sign-placeholders-copied" aria-hidden="true">
					<BIcon
						class="sign-placeholders-copied-icon"
						:name="Outline.CHECK_M"
						:size="20"
						color="var(--ui-color-accent-main-primary)"
					/>
					<span class="sign-placeholders-copied-message">
						{{ loc('PLACEHOLDER_LIST_COPIED_LABEL_MSGVER_1') }}
					</span>
				</div>
			</div>
			<div v-if="isExpanded" class="sign-placeholders-item-accordion">
				<span class="sign-placeholders-item-accordion-divider"></span>
				<ModifierAccordion
					:groups="modifierGroups"
					:selection="selection"
					@select="handleModifierSelect"
				/>
			</div>
		</div>
	`
	};

	const ROW_TEST_ID_PREFIX = 'sign-placeholder-item';

	/** A row of the section: the field, the identity it lives by and the label of the autotests. */

	// @vue/component
	const PlaceholderSection = {
		name: 'PlaceholderSection',
		components: {
			PlaceholderItem
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			section: {
				type: Object,
				required: true
			},
			expandedItemId: {
				type: String,
				default: ''
			}
		},
		emits: ['toggle-expand', 'delete-field'],
		computed: {
			/**
			 * Rows of the section, built once per list: the open accordion travels to the rows as a boolean
			 * of its own, so raising one of them rebuilds no arrays and patches no row but the two that
			 * changed.
			 */
			rows() {
				return this.buildRows(this.section, null);
			},
			subsectionRows() {
				return (this.section.subsections ?? []).map((subsection, index) => this.buildRows(subsection, index));
			},
			hasSubsections() {
				return Array.isArray(this.section.subsections) && this.section.subsections.length > 0;
			},
			hasItems() {
				if (this.hasSubsections) {
					return this.section.subsections.some(subsection => subsection.items && subsection.items.length > 0);
				}
				return this.section.items && this.section.items.length > 0;
			}
		},
		methods: {
			/**
			 * Row identity: the scope of the row - the type of its section and of its subsection - keeps it
			 * unique for a code the response holds in more than one place, the code of the field keeps it
			 * stable while the list is filtered. Filtering drops the subsections left empty and shifts the
			 * indexes of the survivors, so the index names only a row the response gave no code at all.
			 */
			getItemId(item, scope, itemIndex) {
				return [this.getItemSectionType(), ...scope, item.value || `index-${itemIndex}`].join('-');
			},
			// The label of the autotests follows the identity of the row instead of taking part in it.
			buildRows(itemsHolder, subsectionIndex) {
				const scope = subsectionIndex === null ? [] : [this.getSubsectionKey(itemsHolder, subsectionIndex)];
				return (itemsHolder.items ?? []).map((item, itemIndex) => {
					const itemId = this.getItemId(item, scope, itemIndex);
					return {
						item,
						itemId,
						testId: [ROW_TEST_ID_PREFIX, itemId].join('-')
					};
				});
			},
			// The type of the subsection survives the filtering the way the code of the field does.
			getSubsectionKey(subsection, index) {
				return subsection.type || `index-${index}`;
			},
			isRowExpanded(itemId) {
				return itemId !== '' && itemId === this.expandedItemId;
			},
			getItemSectionType() {
				if (this.section.type === SectionType.HCM_LINK && this.section.subsectionType) {
					return this.section.subsectionType;
				}
				return this.section.type;
			}
		},
		template: `
		<div v-if="hasItems" class="sign-placeholders-section">
			<div class="sign-placeholders-section-title">{{ section.title }}</div>
			<div v-if="!hasSubsections" class="sign-placeholders-section-content">
				<PlaceholderItem
					v-for="row in rows"
					:key="row.itemId"
					:placeholder="row.item"
					:section-type="getItemSectionType()"
					:item-id="row.itemId"
					:test-id="row.testId"
					:expanded="isRowExpanded(row.itemId)"
					@toggle-expand="$emit('toggle-expand', $event)"
					@delete-field="$emit('delete-field', $event)"
				/>
			</div>

			<div v-else>
				<div
					v-for="(subsection, index) in section.subsections"
					:key="getSubsectionKey(subsection, index)"
					class="sign-placeholders-subsection"
				>
					<div class="sign-placeholders-subsection-title">{{ subsection.title }}</div>
					<div>
						<PlaceholderItem
							v-for="row in subsectionRows[index]"
							:key="row.itemId"
							:placeholder="row.item"
							:section-type="getItemSectionType()"
							:item-id="row.itemId"
							:test-id="row.testId"
							:expanded="isRowExpanded(row.itemId)"
							@toggle-expand="$emit('toggle-expand', $event)"
							@delete-field="$emit('delete-field', $event)"
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const PlaceholderTabs = {
		name: 'PlaceholderTabs',
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			currentTab: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				TabType,
				tabs: [{
					type: TabType.BITRIX24,
					locKey: 'PLACEHOLDER_LIST_TAB_BITRIX24'
				}, {
					type: TabType.HCM_LINK,
					locKey: 'PLACEHOLDER_LIST_TAB_1C'
				}]
			};
		},
		methods: {
			switchTab(tab) {
				this.$emit('switch-tab', tab);
			},
			getTabDataTestId(type) {
				return `sign-placeholder-tab-${type}`;
			}
		},
		template: `
		<div class="sign-placeholders-tabs">
			<div
				v-for="tab in tabs"
				:key="tab.type"
				class="sign-placeholders-tab"
				:class="{ 'sign-placeholders-tab--active': currentTab === tab.type }"
				@click="switchTab(tab.type)"
				:data-testid="getTabDataTestId(tab.type)"
			>
				{{ loc(tab.locKey) }}
			</div>
		</div>
	`
	};

	/**
	 * Search of the panel. It exists only while the search mode is on and takes the place of the header,
	 * so it opens focused and hands the exit back to the panel: the cross of the input and Escape both
	 * leave the mode instead of merely emptying the query.
	 */
	// @vue/component
	const PlaceholderSearch = {
		name: 'PlaceholderSearch',
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			searchQuery: {
				type: String,
				default: ''
			}
		},
		emits: ['update:searchQuery', 'exit'],
		mounted() {
			this.$refs.input?.focus();
		},
		methods: {
			onInput(event) {
				this.$emit('update:searchQuery', event.target.value);
			},
			exit() {
				this.$emit('exit');
			}
		},
		template: `
		<div class="sign-placeholders-search">
			<input
				ref="input"
				type="text"
				class="sign-placeholders-search-input"
				:value="searchQuery"
				:placeholder="loc('PLACEHOLDER_LIST_SEARCH_PLACEHOLDER_MSGVER_1')"
				data-testid="sign-placeholder-search-input"
				@input="onInput"
				@keydown.esc="exit"
			/>
			<div class="sign-placeholders-search-icon-search"></div>
			<div
				class="sign-placeholders-search-icon-clear"
				role="button"
				tabindex="0"
				:aria-label="loc('PLACEHOLDER_LIST_SEARCH_CLOSE')"
				data-testid="sign-placeholder-search-exit"
				@click="exit"
				@keydown.enter="exit"
				@keydown.space.prevent="exit"
			></div>
		</div>
	`
	};

	/**
	 * Identity of a row of the block. The panel keeps a single open accordion for the whole of it, so the
	 * prefix is what tells a row of the history from the row of the same field in the list; the stored
	 * code tells the rows of the block apart, and one field copied with two sets holds two of them.
	 */
	const RECENT_ITEM_ID_PREFIX = 'recent-';

	/**
	 * Recently copied fields, offered by the search mode while the query is empty. The rows are the rows of
	 * the list without their deletion: a row comes drawn with the set of modifiers its code was copied
	 * with, and both the copy zone and the accordion answer for that set. The join with the current list
	 * happens outside the block.
	 */
	// @vue/component
	const RecentFields = {
		name: 'SignPlaceholderRecentFields',
		components: {
			PlaceholderItem,
			TextXs: ui_system_typography_vue.TextXs
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			fields: {
				/** @type RecentField[] */
				type: Array,
				default: () => []
			},
			expandedItemId: {
				type: String,
				default: ''
			}
		},
		emits: ['toggle-expand'],
		methods: {
			itemId(field) {
				return `${RECENT_ITEM_ID_PREFIX}${field.storedCode}`;
			},
			isExpanded(field) {
				return this.itemId(field) === this.expandedItemId;
			},
			// The block itself keeps the bare identifier: a suffixed one would answer the locator of a row too.
			testId(index) {
				return `sign-placeholder-recent-${index}`;
			}
		},
		template: `
		<div class="sign-placeholders-recent" data-testid="sign-placeholder-recent">
			<TextXs tag="div" class-name="sign-placeholders-recent-title">
				{{ loc('PLACEHOLDER_LIST_RECENT_TITLE') }}
			</TextXs>
			<PlaceholderItem
				v-for="(field, index) in fields"
				:key="field.storedCode"
				:placeholder="field.placeholder"
				:section-type="field.sectionType"
				:item-id="itemId(field)"
				:test-id="testId(index)"
				:expanded="isExpanded(field)"
				:stored-selection="field.selection"
				:deletable="false"
				@toggle-expand="$emit('toggle-expand', $event)"
			/>
		</div>
	`
	};

	const createFieldDataset = Object.freeze({
		testid: 'sign-placeholder-search-create-field'
	});

	/**
	 * The query goes into the label of the button as the name of the field to be, and the panel is narrow:
	 * a long query is cut so the label keeps its shape. The full query still reaches the editor of the
	 * field - the button hands over the query itself, not the label.
	 */
	const QUERY_LENGTH_LIMIT = 20;
	const ELLIPSIS = '\u2026';

	// @vue/component
	const PlaceholderSearchNotFound = {
		name: 'PlaceholderSearchNotFound',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			searchQuery: {
				type: String,
				default: ''
			},
			/** The panel creates fields of Bitrix24 alone, so the tab of the external system offers none. */
			canCreateField: {
				type: Boolean,
				default: true
			}
		},
		emits: ['create-field'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				createFieldDataset
			};
		},
		computed: {
			/** The state also meets a tab without a chosen company, and there is no name to offer then. */
			hasQuery() {
				return main_core.Type.isStringFilled(this.searchQuery);
			},
			shouldShowCreateField() {
				return this.canCreateField && this.hasQuery;
			},
			createFieldText() {
				const query = this.searchQuery.length > QUERY_LENGTH_LIMIT ? this.searchQuery.slice(0, QUERY_LENGTH_LIMIT) + ELLIPSIS : this.searchQuery;
				return this.loc('PLACEHOLDER_LIST_SEARCH_CREATE_FIELD', {
					'#QUERY#': query
				});
			}
		},
		template: `
		<div class="sign-placeholders-nothing-found-container" data-testid="sign-placeholder-search-not-found">
			<div class="sign-placeholders-nothing-found-img"></div>
			<div class="sign-placeholders-nothing-found-text-container">
				<div class="sign-placeholders-nothing-found-title">
					{{ loc('PLACEHOLDER_LIST_NOTHING_FOUND_TITLE') }}
				</div>
				<div class="sign-placeholders-nothing-found-description">
					{{ loc('PLACEHOLDER_LIST_NOTHING_FOUND_DESCRIPTION') }}
				</div>
			</div>
			<UiButton
				v-if="shouldShowCreateField"
				:text="createFieldText"
				:size="ButtonSize.LARGE"
				:style="AirButtonStyle.PLAIN_ACCENT"
				:left-icon="ButtonIcon.ADD_M"
				:dataset="createFieldDataset"
				@click="$emit('create-field', searchQuery)"
			/>
		</div>
	`
	};

	// @vue/component
	const PlaceholderSearchNotConfigured = {
		name: 'PlaceholderSearchNotConfigured',
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		template: `
		<div class="sign-placeholders-nothing-found-container">
			<div class="sign-placeholders-nothing-configured-img"></div>
			<div class="sign-placeholders-nothing-found-text-container">
				<div class="sign-placeholders-nothing-found-title">
					{{ loc('PLACEHOLDER_LIST_NOTHING_CONFIGURED_TITLE') }}
				</div>
				<div class="sign-placeholders-nothing-found-description">
					{{ loc('PLACEHOLDER_LIST_NOTHING_CONFIGURED_DESCRIPTION') }}
				</div>
			</div>
		</div>
	`
	};

	/**
	 * Reading a stored code back into the set of modifiers it was assembled from: the exact reverse of
	 * `assembledCode`, so a code the panel wrote is always understood, and a code it could not have
	 * written is refused instead of guessed.
	 *
	 * Pure functions over the catalog: no Vue, no DOM, no network.
	 */


	/** A stored code taken apart: the code of the field itself and what the tilde carries after it. */

	const splitStoredCode = storedCode => {
		const tildePosition = storedCode.indexOf('~');
		if (tildePosition === -1) {
			return {
				baseCode: storedCode,
				tail: ''
			};
		}
		return {
			baseCode: storedCode.slice(0, tildePosition),
			tail: storedCode.slice(tildePosition + 1)
		};
	};

	/**
	 * The parameters of a variant stand at the head of what is left: either they are all of it, or a
	 * comma of the assembly follows them. A comma inside a single parameter value is no separator, so
	 * the tail is never split by commas - it is eaten by the very strings the catalog holds.
	 */
	const startsWithParameters = (remaining, parameters) => {
		return remaining === parameters || remaining.startsWith(`${parameters},`);
	};

	/**
	 * The longest of the variants standing at the head wins: a variant whose value carries a comma has a
	 * shorter one of the same group inside it (`j F Y, H:i` holds `j F Y`), and only the longer reading
	 * leaves the rest of the tail explainable.
	 */
	const matchVariant = (group, remaining) => {
		let matched = null;
		for (const variant of group.variants) {
			if (variant.parameters.length === 0) {
				continue;
			}
			const parameters = variant.parameters.join(',');
			if (startsWithParameters(remaining, parameters) && parameters.length > (matched?.parameters.length ?? 0)) {
				matched = {
					variant,
					parameters
				};
			}
		}
		return matched;
	};

	/**
	 * Groups are walked in catalog order, the very order the assembly writes them in, and every match
	 * eats its own parameters off the head of the tail. A tail left unexplained - an unknown parameter,
	 * an order the assembly never produces, an exclusive variant standing next to another group - is no
	 * set of the catalog and comes back as `null`.
	 */
	const parseParameters = tail => {
		if (tail === '') {
			return null;
		}
		const selection = {};
		let remaining = tail;
		for (const group of modifierCatalog.groups) {
			const matched = matchVariant(group, remaining);
			if (!matched) {
				continue;
			}

			// An exclusive variant leaves nothing but itself in the assembled code, so it answers for the
			// whole tail or the reading is wrong.
			if (matched.variant.exclusive) {
				return matched.parameters === tail ? {
					[group.id]: matched.variant
				} : null;
			}
			selection[group.id] = matched.variant;
			remaining = remaining.slice(matched.parameters.length);
			if (remaining === '') {
				break;
			}

			// The match ended on a separator of the assembly, and a separator carries another parameter.
			remaining = remaining.slice(1);
			if (remaining === '') {
				return null;
			}
		}
		return remaining === '' ? selection : null;
	};

	/**
	 * The set the row is drawn with. The type of the field could have changed since the code reached the
	 * history, so every restored group is asked for again - a group the field is no longer offered takes
	 * the whole set with it: showing a state we cannot explain is worse than showing none.
	 */
	const restoreSelection = (tail, field, region) => {
		const selection = parseParameters(tail);
		if (selection === null) {
			return {};
		}
		const offeredGroupIds = orderGroups(field, region).map(group => group.id);
		return Object.keys(selection).every(groupId => offeredGroupIds.includes(groupId)) ? selection : {};
	};

	/** How many rows the recent fields block offers, whatever the length of the history is. */
	const RECENT_FIELDS_LIMIT = 6;

	/**
	 * A row of the recent fields block: the field itself, the section its icon comes from, the code the
	 * history stored and the set of modifiers that code carries.
	 */

	/** What the current list gives a row of the block: the field and the section its icon comes from. */

	/** Icon scope of the items: a section of the external human resources system names its own. */
	const itemsSectionType = section => {
		if (section.type === SectionType.HCM_LINK && section.subsectionType) {
			return section.subsectionType;
		}
		return section.type;
	};
	const indexFieldsByCode = sections => {
		const byCode = new Map();
		sections.forEach(section => {
			const sectionType = itemsSectionType(section);
			const holders = main_core.Type.isArray(section.subsections) ? section.subsections : [section];
			holders.forEach(holder => {
				if (!main_core.Type.isArray(holder.items)) {
					return;
				}
				holder.items.forEach(item => {
					if (item.value && !byCode.has(item.value)) {
						byCode.set(item.value, {
							placeholder: item,
							sectionType
						});
					}
				});
			});
		});
		return byCode;
	};

	/**
	 * A stored code names the field by its part before the tilde; the modifiers behind it are restored
	 * only as far as the catalog explains them and the field is still offered them.
	 */
	const buildRecentField = (byCode, storedCode, region) => {
		if (!main_core.Type.isStringFilled(storedCode)) {
			return null;
		}
		const {
			baseCode,
			tail
		} = splitStoredCode(storedCode);
		const field = byCode.get(baseCode);
		if (!field) {
			return null;
		}
		const selection = restoreSelection(tail, field.placeholder, region);
		// A tail nothing explains would leave the row copying the base code - a twin of the row the same
		// field keeps in the block without any modifiers at all.
		if (tail !== '' && Object.keys(selection).length === 0) {
			return null;
		}
		return {
			...field,
			storedCode,
			selection
		};
	};

	/**
	 * Joins the copying history with the fields the user sees now: the history gives the codes, the
	 * modifiers they were copied with and their order, the current list gives the names and the icons. A
	 * code the list no longer holds never shows up, and a history that failed to arrive simply leaves the
	 * block empty. One field copied with two different sets keeps two rows of its own.
	 */
	const collectRecentFields = (sections, recentFieldCodes, region = '') => {
		if (!main_core.Type.isArray(sections) || !main_core.Type.isArray(recentFieldCodes)) {
			return [];
		}
		const byCode = indexFieldsByCode(sections);
		return recentFieldCodes.map(storedCode => buildRecentField(byCode, storedCode, region)).filter(Boolean).slice(0, RECENT_FIELDS_LIMIT);
	};
	class SectionFilter {
		filterBySearchQuery(sections, searchQuery) {
			const normalizedQueryValue = searchQuery.toLowerCase().replaceAll('{', '').replaceAll('}', '').trim();
			if (!normalizedQueryValue) {
				return sections;
			}
			return sections.map(section => this.#filterSection(section, normalizedQueryValue)).filter(section => this.#hasContent(section));
		}
		#hasContent(section) {
			if (main_core.Type.isArray(section.subsections)) {
				return section.subsections.some(subsection => main_core.Type.isArray(subsection.items) && subsection.items.length > 0);
			}
			return !main_core.Type.isNil(section.items) || !main_core.Type.isNil(section.data);
		}
		#filterSection(section, query) {
			if (main_core.Type.isArray(section.items)) {
				return this.#filterSimpleSection(section, query);
			}
			if (main_core.Type.isArray(section.subsections)) {
				return this.#filterNestedSection(section, query);
			}
			return {};
		}
		#filterNestedSection(section, query) {
			const matchedSubsections = section.subsections.map(subsection => {
				const matchedItems = this.#filterItems(subsection.items, query);
				return matchedItems.length > 0 ? {
					...subsection,
					items: matchedItems
				} : null;
			}).filter(Boolean);
			return matchedSubsections.length > 0 ? {
				...section,
				subsections: matchedSubsections
			} : {};
		}
		#filterSimpleSection(section, query) {
			const matchedItems = this.#filterItems(section.items, query);
			return matchedItems.length > 0 ? {
				...section,
				items: matchedItems
			} : {};
		}
		#filterItems(items, query) {
			return items.filter(item => {
				const name = item.name?.toLowerCase() ?? '';
				const value = item.value?.toLowerCase() ?? '';
				return name.includes(query) || value.includes(query);
			});
		}
	}

	const DIALOG_WIDTH = 400;
	const DIALOG_EXTENSION = 'ui.system.dialog';
	const NOTIFICATION_HIDE_DELAY$1 = 4000;
	// Every deletion asks for the same extension, so the toasts of the refusals replace one another.
	const UNAVAILABLE_NOTIFICATION_ID = 'sign-placeholders-delete-unavailable';

	/** The zone of the deletion stays live while the extension is on its way, and it waits for nobody. */
	let isOpening = false;
	/**
	 * The dialog of the design system is asked for by the confirmation alone, while the panel itself comes
	 * with the page of the documents: the extension arrives on the first deletion instead of the first
	 * render of the page.
	 */
	const loadDialogClass = async () => {
		try {
			const {
				Dialog
			} = await main_core.Runtime.loadExtension(DIALOG_EXTENSION);
			return Dialog;
		} catch {
			return null;
		}
	};

	/**
	 * A refused load leaves the cross of the row without any answer at all, so the refusal is told to the
	 * user: the extension arrives on the first deletion, and a click is what asked for it.
	 */
	const reportUnavailableDialog = () => {
		const message = main_core.Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_UNAVAILABLE_NOTIFICATION');
		ui_notification.UI.Notification.Center.notify({
			id: UNAVAILABLE_NOTIFICATION_ID,
			content: message,
			autoHideDelay: NOTIFICATION_HIDE_DELAY$1
		});
		ui_a11y.LiveAnnouncer.announce(message, 'assertive');
	};

	/**
	 * Confirmation of the deletion of a user field. The dialog names the field being deleted and waits on
	 * the confirm button while the request runs: a refusal of the server keeps the dialog open and speaks
	 * for itself through the common error toast.
	 */
	class DeleteFieldConfirmation {
		#options;
		#dialogClass;

		// A second click while the extension is on its way would build a second dialog over the first one,
		// and a confirmation in that one would delete a field that is already gone.
		static async show(options) {
			if (isOpening) {
				return;
			}
			isOpening = true;
			try {
				const dialogClass = await loadDialogClass();
				if (!dialogClass) {
					console.error(`The confirmation of the deletion of a field got no ${DIALOG_EXTENSION}.`);
					reportUnavailableDialog();
					return;
				}
				new DeleteFieldConfirmation(options, dialogClass).#show();
			} finally {
				isOpening = false;
			}
		}
		constructor(options, dialogClass) {
			this.#options = options;
			this.#dialogClass = dialogClass;
		}

		/**
		 * A dialog per opening, never a kept one: `ui.system.dialog` builds its popup non-cacheable, so
		 * every way out - the buttons, Escape, the overlay, the cross - destroys it, and a second opening
		 * of the same instance would have nothing left to show.
		 */
		#show() {
			this.#createDialog().show();
		}
		#createDialog() {
			const Dialog = this.#dialogClass;
			let dialog = null;
			const close = () => {
				dialog?.hide();
			};
			dialog = new Dialog({
				title: main_core.Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_TITLE'),
				content: this.#renderContent(),
				centerButtons: [this.#createConfirmButton(close), this.#createCancelButton(close)],
				width: DIALOG_WIDTH,
				hasOverlay: true,
				closeByEsc: true
			});
			return dialog;
		}

		// The name of the field is written by a human, and the content of the dialog is a plain element.
		#renderContent() {
			const message = main_core.Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_TEXT', {
				'#FIELD_NAME#': this.#options.fieldName
			});
			return main_core.Tag.render`
			<div class="sign-placeholders-delete-confirmation" data-testid="sign-placeholder-delete-confirmation">
				${main_core.Text.encode(message)}
			</div>
		`;
		}
		#createConfirmButton(close) {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_CONFIRM'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED_ALERT,
				size: ui_buttons.ButtonSize.LARGE,
				dataset: {
					testid: 'sign-placeholder-delete-confirmation-confirm'
				},
				onclick: async button => {
					button.setWaiting(true);
					try {
						await this.#options.onConfirm();
						close();
					} catch {
						button.setWaiting(false);
					}
				}
			});
		}
		#createCancelButton(close) {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_CANCEL'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN,
				size: ui_buttons.ButtonSize.LARGE,
				dataset: {
					testid: 'sign-placeholder-delete-confirmation-cancel'
				},
				onclick: close
			});
		}
	}

	const HelpdeskCodes = Object.freeze({
		DocumentEditor: '27216628'
	});
	const NOTIFICATION_HIDE_DELAY = 4000;
	// A refusal of the deletion repeats itself while its reason holds, so the toasts replace one another.
	const DELETE_FAILED_NOTIFICATION_ID = 'sign-placeholders-delete-failed';

	/** Personal state of the panel: the codes of the copied fields, the modifiers of a copy among them. */

	const EMPTY_PERSONAL_SETTINGS = Object.freeze({
		recentFieldCodes: []
	});

	/**
	 * The history reaches the panel from two sides, and they differ in one right alone: the right of the
	 * block of the recent fields to take the place of the tree.
	 */
	const PersonalSettingsSource = Object.freeze({
		FIRST_LOAD: 'firstLoad',
		FIELD_USAGE: 'fieldUsage'
	});

	/**
	 * Personal requests run with `notifyError = false`, so a refusal comes back as a resolved error
	 * object instead of a rejection: the answer is judged by its shape.
	 */
	const isPersonalSettings = response => {
		return Boolean(response) && typeof response === 'object' && Array.isArray(response.recentFieldCodes);
	};

	/**
	 * A refused personal request is an expected answer: the panel works without the personal state and
	 * says nothing about it to the user. An answer of an unknown shape is worth the console of the
	 * developer, and so is a refused write - see `applyPersonalSettings()`.
	 */
	const isRefusalOfRequest = response => {
		return response instanceof Error || Boolean(response) && typeof response === 'object' && Array.isArray(response.errors);
	};

	/** The refusal of the transport comes either as an error of its own or as the errors of the answer. */
	const refusalReason = response => {
		if (response instanceof Error) {
			return response.message;
		}
		const [error] = response?.errors ?? [];
		return [error?.code, error?.message].filter(Boolean).join(': ');
	};

	// @vue/component
	const PlaceholdersApp = {
		name: 'PlaceholdersApp',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			PlaceholderSection,
			PlaceholderTabs,
			PlaceholderSearch,
			PlaceholderSearchNotFound,
			PlaceholderSearchNotConfigured,
			RecentFields
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			sectionsData: {
				type: Array,
				required: true
			},
			showHeader: {
				type: Boolean,
				default: true
			},
			/**
			 * The panel took the place of a previous copy of itself (a field was deleted), so the focus has
			 * nowhere to return: it goes to the entry of the restored panel, unless the user has already
			 * moved somewhere else by then.
			 */
			restoreFocus: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			// Class instance stays out of the reactive state: a Proxy breaks its private fields.
			return {
				analytics: new sign_v2_analytics.Analytics(),
				Outline: ui_iconSet_api_vue.Outline,
				region: panelRegion(),
				// Nothing renders the state of the write of the history, so it stays out of the reactive state.
				fieldUsage: {
					requestedCode: '',
					pendingCode: '',
					isRequestRunning: false
				}
			};
		},
		provide() {
			return {
				analytics: this.analytics,
				recordFieldUsage: this.recordFieldUsage
			};
		},
		data() {
			return {
				currentTab: TabType.BITRIX24,
				companySelector: null,
				hcmLinkCompanySelector: null,
				searchQuery: '',
				hcmLinkSections: null,
				api: new sign_v2_api.Api(),
				selectedCompanyId: null,
				selectedHcmLinkCompanyId: null,
				hcmLinkPlaceholdersLoader: null,
				lastSelectedCompanyId: null,
				lastSelectedHcmLinkCompanyId: null,
				expandedItemId: '',
				personalSettings: EMPTY_PERSONAL_SETTINGS,
				isSearchMode: false,
				/**
				 * The order the recent fields block is drawn in. The history behind it is written anew by every
				 * copy, and rows moving under the cursor would send the next click of the user to another field.
				 */
				shownRecentFieldCodes: []
			};
		},
		computed: {
			sections() {
				if (this.isHcmLinkTab && (!this.selectedCompanyId || !this.selectedHcmLinkCompanyId)) {
					return [];
				}
				const sections = this.currentTab === TabType.BITRIX24 ? this.sectionsData.filter(section => section.type !== SectionType.HCM_LINK) : this.hcmLinkSections;
				if (!sections) {
					return [];
				}
				return new SectionFilter().filterBySearchQuery(sections, this.searchQuery);
			},
			hasItems() {
				return this.sections.length > 0;
			},
			isHcmLinkTab() {
				return this.currentTab === TabType.HCM_LINK;
			},
			isRuRegionLicense() {
				return this.region === 'ru';
			},
			shouldShowSearch() {
				if (!this.isHcmLinkTab) {
					return true;
				}
				return this.selectedCompanyId !== null && this.selectedHcmLinkCompanyId !== null;
			},
			shouldShowSearchNotFoundState() {
				if (!this.hasItems && this.shouldShowSearch) {
					if (this.searchQuery) {
						return true;
					}
					if (this.isHcmLinkTab && this.hcmLinkSections !== null) {
						return true;
					}
				}
				return false;
			},
			shouldShowSearchNotConfiguredState() {
				return !this.hasItems && !this.shouldShowSearch;
			},
			recentFields() {
				return collectRecentFields(this.sections, this.shownRecentFieldCodes, this.region);
			},
			/**
			 * The place of the tree belongs to the block while the search mode waits for a query - whatever
			 * the history holds right now, and even while it holds nothing at all.
			 */
			isRecentFieldsPlace() {
				return this.isSearchMode && this.searchQuery === '';
			},
			/** An empty history leaves the tree where it was: the search keeps working without the block. */
			shouldShowRecentFields() {
				return this.isRecentFieldsPlace && this.recentFields.length > 0;
			}
		},
		watch: {
			// A tab without a chosen company has nothing to search through, so the mode ends with the search.
			shouldShowSearch(available) {
				if (!available) {
					this.exitSearchMode();
				}
			}
		},
		async mounted() {
			this.initCreateButton();
			void this.loadPersonalSettings();
			if (this.restoreFocus && this.isFocusUnclaimed()) {
				this.focusPanelEntry();
			}
			if (this.isRuRegionLicense) {
				this.initHcmLinkCompanySelector();
				this.initCompanySelector();
				await this.loadLastUserSelections();
			}
		},
		methods: {
			initCreateButton() {
				const createButton = new ui_buttons.CreateButton({
					text: this.loc('PLACEHOLDER_LIST_ADD_FIELD'),
					// The button hands its own instance to the handler, and that is not an initial name.
					onclick: () => this.onCreateClick(),
					useAirDesign: true,
					color: ui_buttons.Button.Color.SUCCESS_DARK,
					size: ui_buttons.Button.Size.MEDIUM,
					style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
					icon: ui_buttons.ButtonIcon.ADD_M,
					dataset: {
						testid: 'sign-placeholder-add-field'
					}
				});
				main_core.Dom.append(createButton.render(), this.$refs.createButtonContainer);
			},
			/**
			 * Creation of a field, the single path of the panel: the choice of the field and the standard
			 * editor of user fields behind it. The empty result of a search offers the same path with the
			 * query as the name of the field to be.
			 */
			onCreateClick(initialName) {
				const fieldSelector = new sign_v2_b2e_fieldSelector.FieldSelector({
					initialFieldTitle: main_core.Type.isStringFilled(initialName) ? initialName : null,
					multiple: false,
					disableSelection: true,
					fieldsFactory: {
						filter: {
							'-types': ['url', 'address']
						}
					},
					controllerOptions: {
						hideVirtual: true,
						hideRequisites: false,
						hideSmartB2eDocument: true
					},
					events: {
						onSliderCloseComplete: () => {
							this.$emit('listUpdate');
						}
					},
					languages: panelLanguages(),
					filter: {
						'+categories': ['PROFILE', 'DYNAMIC_MEMBER', 'COMPANY', 'REPRESENTATIVE', 'EMPLOYEE', 'SMART_B2E_DOC'],
						'+fields': ['list', 'string', 'date', 'typed_string', 'text', 'enumeration', 'address', 'url', 'double', 'integer', 'snils'],
						allowEmptyFieldList: true
					},
					title: main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_TITLE'),
					hint: this.isRuRegionLicense ? main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_HINT') : null,
					categoryCaptions: {
						PROFILE: main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_PROFILE_ITEM'),
						DYNAMIC_MEMBER: main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_DYNAMIC_MEMBER_ITEM')
					}
				});
				fieldSelector.show();
			},
			/**
			 * A field of the personal data lives in two places of the answer, so the list is reloaded as a
			 * whole - the same way it is reloaded after a field is created. The reload builds the panel from
			 * scratch, so the row that started the deletion is gone by then: the panel asks for the focus of
			 * its own copy instead of returning it to the initiator.
			 */
			handleDeleteField(placeholder) {
				void DeleteFieldConfirmation.show({
					fieldName: placeholder.name,
					onConfirm: async () => {
						let result = null;
						try {
							result = await this.api.placeholder.deleteField(placeholder.fieldId, placeholder.category);
						} catch (error) {
							// Every refusal of the server comes back as a rejection, and the toast the transport
							// raises with it is silent for a screen reader.
							this.announceDeletionFailure(placeholder.name);
							throw error;
						}

						// The answer carries the flag of the deletion, and an answer without it is no deletion:
						// the dialog stays open with its button released instead of reporting a success.
						if (result?.deleted !== true) {
							this.reportDeletionFailure(placeholder.name);
							throw new Error('The user field was not deleted');
						}
						ui_a11y.LiveAnnouncer.announce(this.loc('PLACEHOLDER_LIST_FIELD_DELETED_ANNOUNCEMENT', {
							'#FIELD_NAME#': placeholder.name
						}));
						this.$emit('listUpdate', {
							restoreFocus: true
						});
					}
				});
			},
			/** The refusal reaches the eye through a toast of the transport, and the ear only through this. */
			announceDeletionFailure(fieldName) {
				ui_a11y.LiveAnnouncer.announce(this.deletionFailureMessage(fieldName), 'assertive');
			},
			/**
			 * A successful answer that carries no deletion is the defence of the panel against a change of the
			 * contract: no toast comes with such an answer, so the panel answers the click of the user itself.
			 */
			reportDeletionFailure(fieldName) {
				ui_notification.UI.Notification.Center.notify({
					id: DELETE_FAILED_NOTIFICATION_ID,
					content: main_core.Text.encode(this.deletionFailureMessage(fieldName)),
					autoHideDelay: NOTIFICATION_HIDE_DELAY
				});
				this.announceDeletionFailure(fieldName);
			},
			deletionFailureMessage(fieldName) {
				return this.loc('PLACEHOLDER_LIST_DELETE_FIELD_FAILED_NOTIFICATION', {
					'#FIELD_NAME#': fieldName
				});
			},
			async loadPersonalSettings() {
				this.applyPersonalSettings(await this.api.placeholder.getPersonalSettings(), PersonalSettingsSource.FIRST_LOAD);
			},
			/**
			 * The user copied the code of a field. The server answers with the personal state it stored, so
			 * the panel never guesses what got written.
			 *
			 * A code the history already holds is written no second time, and a request is never laid over a
			 * running one: a chip of the accordion copies anew on every click, and the server rebuilds the
			 * whole collection of the fields of the company to validate a single write. A copy made while a
			 * write runs waits for its turn, and only the last of them does: the user who ran through the
			 * chips keeps in the buffer what the last click copied, and that is the copy the history is
			 * about.
			 */
			async recordFieldUsage(code) {
				if (!code || this.isFieldUsageRecorded(code)) {
					return;
				}
				if (this.fieldUsage.isRequestRunning) {
					this.fieldUsage.pendingCode = code;
					return;
				}

				// The server validates the code against the collection the user sees, and on the tab of the
				// external human resources system that collection depends on the chosen company.
				const hcmLinkCompanyId = this.isHcmLinkTab ? this.selectedHcmLinkCompanyId : null;
				this.fieldUsage.pendingCode = '';
				this.fieldUsage.requestedCode = code;
				this.fieldUsage.isRequestRunning = true;
				try {
					this.applyPersonalSettings(await this.api.placeholder.saveFieldUsage(code, hcmLinkCompanyId), PersonalSettingsSource.FIELD_USAGE);
				} finally {
					this.fieldUsage.isRequestRunning = false;
				}
				const pendingCode = this.fieldUsage.pendingCode;
				this.fieldUsage.pendingCode = '';
				if (pendingCode !== '') {
					await this.recordFieldUsage(pendingCode);
				}
			},
			/**
			 * The head of the stored history answers for the copies of an earlier session of the panel; the
			 * code of the last request answers for a refused write, which changes no history and must not be
			 * asked for again on every chip of the same row.
			 */
			isFieldUsageRecorded(code) {
				return code === this.fieldUsage.requestedCode || code === this.personalSettings.recentFieldCodes[0];
			},
			applyPersonalSettings(response, source) {
				if (!isPersonalSettings(response)) {
					if (!isRefusalOfRequest(response)) {
						console.error('Unexpected answer of the personal settings of the placeholder panel:', response);
					} else if (source === PersonalSettingsSource.FIELD_USAGE) {
						const refusedCode = this.fieldUsage.requestedCode;

						// A refusal of the transport says nothing about the code itself, so the next copy of that
						// code tries again; a refusal of the server is about the code and is not asked twice.
						if (response instanceof Error) {
							this.fieldUsage.requestedCode = '';
						}

						// A refused write drops the copied code out of the history, and nothing else reports it: the
						// read of the state is refused on its own terms and keeps the console clean.
						console.error(`The write of the use of the field ${refusedCode} was refused:`, refusalReason(response));
					}
					return;
				}

				// A write answers with the stored history too, so a load answered after a write of the user
				// carries the history from before that copy: it is no news to the panel.
				const isFirstLoad = source === PersonalSettingsSource.FIRST_LOAD;
				if (isFirstLoad && this.personalSettings !== EMPTY_PERSONAL_SETTINGS) {
					return;
				}
				this.personalSettings = {
					recentFieldCodes: response.recentFieldCodes
				};

				// A history the copy of the user wrote takes the place of the tree no sooner than the next entry
				// into the mode: the list would swap under the cursor that clicked it. The first history of the
				// panel has no click behind it, and the mode may well be open before it arrives - but that right
				// ends with the first copy the user makes, whatever the write of it answers and whenever.
				const hasClickBehindIt = this.fieldUsage.requestedCode !== '';
				if (isFirstLoad && !hasClickBehindIt || !this.isRecentFieldsPlace) {
					this.takeRecentFieldsOrder();
				}
			},
			async loadLastUserSelections() {
				try {
					const [companyData, hcmLinkData] = await Promise.all([this.api.placeholder.getLastSelectionBySelectorType(SelectorType.myCompany), this.api.placeholder.getLastSelectionBySelectorType(SelectorType.hcmLinkCompany)]);
					if (hcmLinkData?.value && this.hcmLinkCompanySelector) {
						this.hcmLinkCompanySelector.setLastSavedId(hcmLinkData.value);
					}
					if (companyData?.value && this.companySelector) {
						await this.companySelector.load(null, companyData.value);
					}
				} catch (error) {
					console.error('Failed to load last user selections:', error);
				}
			},
			initCompanySelector() {
				if (!this.$refs.companySelectorContainer) {
					return;
				}
				const companySelector = new sign_v2_b2e_companySelector.CompanySelector({
					canCreateCompany: false,
					canEditCompany: false,
					isCompaniesDeselectable: false
				});
				companySelector.subscribe('onSelect', async event => {
					const data = event.getData ? event.getData() : event.data;
					const companyId = data?.companyId;
					if (companyId === this.lastSelectedCompanyId) {
						return;
					}
					this.lastSelectedCompanyId = companyId;
					if (companyId && this.hcmLinkCompanySelector) {
						this.selectedCompanyId = companyId;
						this.selectedHcmLinkCompanyId = null;
						this.hcmLinkCompanySelector.setCompanyId(companyId);
						await this.api.placeholder.saveLastSelectionBySelectorType(SelectorType.myCompany, companyId);
					} else {
						this.selectedCompanyId = null;
						this.selectedHcmLinkCompanyId = null;
						this.lastSelectedCompanyId = null;
					}
				});
				this.companySelector = ui_vue3.markRaw(companySelector);
				main_core.Dom.append(this.companySelector.getLayout(), this.$refs.companySelectorContainer);
			},
			initHcmLinkCompanySelector() {
				if (!this.$refs.hcmLinkCompanySelectorContainer) {
					return;
				}
				const hcmLinkCompanySelector = new sign_v2_b2e_hcmLinkCompanySelector.HcmLinkCompanySelector();
				hcmLinkCompanySelector.setAvailability(true);
				hcmLinkCompanySelector.subscribe('integrations:loaded', event => {
					const data = event.getData ? event.getData() : event.data;
					const hasIntegrations = data?.hasIntegrations ?? false;
					if (!hasIntegrations) {
						this.selectedHcmLinkCompanyId = null;
						this.lastSelectedHcmLinkCompanyId = null;
					}
				});
				hcmLinkCompanySelector.subscribe('selected', async event => {
					const data = event.getData ? event.getData() : event.data;
					const hcmLinkCompanyId = data?.id;
					if (hcmLinkCompanyId === this.lastSelectedHcmLinkCompanyId) {
						return;
					}
					this.lastSelectedHcmLinkCompanyId = hcmLinkCompanyId;
					if (hcmLinkCompanyId) {
						this.selectedHcmLinkCompanyId = hcmLinkCompanyId;
						this.loadHcmLinkPlaceholders(hcmLinkCompanyId);
						await this.api.placeholder.saveLastSelectionBySelectorType(SelectorType.hcmLinkCompany, hcmLinkCompanyId);
					} else {
						this.selectedHcmLinkCompanyId = null;
						this.lastSelectedHcmLinkCompanyId = null;
					}
				});
				this.hcmLinkCompanySelector = ui_vue3.markRaw(hcmLinkCompanySelector);
				main_core.Dom.append(this.hcmLinkCompanySelector.render(), this.$refs.hcmLinkCompanySelectorContainer);
				this.hcmLinkCompanySelector.show();
			},
			getDocumentEditorHelpdeskLink() {
				return sign_v2_helper.Helpdesk.replaceLink(this.loc('PLACEHOLDER_LIST_HELPDESK'), HelpdeskCodes.DocumentEditor);
			},
			switchTab(tab) {
				if (!Object.values(TabType).includes(tab)) {
					return;
				}
				this.currentTab = tab;
				this.searchQuery = '';
				this.expandedItemId = '';
			},
			enterSearchMode() {
				this.takeRecentFieldsOrder();
				this.isSearchMode = true;
			},
			/**
			 * The block of the recent fields keeps the order it appeared with until it leaves the screen: the
			 * next entry into the search mode is where the copies made meanwhile show up.
			 */
			takeRecentFieldsOrder() {
				this.shownRecentFieldCodes = [...this.personalSettings.recentFieldCodes];
			},
			/**
			 * Leaving the mode brings the tree back the way it was: the query goes, the open accordion stays.
			 * The search is left by a control inside it, and that control is destroyed with the mode, so the
			 * focus goes back to the icon that opened the search - the same contract a popup keeps.
			 */
			exitSearchMode() {
				const shouldRestoreFocus = this.isFocusInsideSearch();
				this.isSearchMode = false;
				this.searchQuery = '';
				if (shouldRestoreFocus) {
					void this.$nextTick(() => {
						this.focusPanelEntry();
					});
				}
			},
			/**
			 * The panel takes the focus only when nobody holds it: the copy of the panel that replaces a
			 * previous one is built while the user may already work somewhere else.
			 */
			isFocusUnclaimed() {
				const focused = document.activeElement;
				return focused === null || focused === document.body || focused === document.documentElement;
			},
			/**
			 * The icon of the search is the entry of the panel for the keyboard. The tab of the external human
			 * resources system without a chosen company draws no icon at all, so the root of the panel takes
			 * the focus instead: otherwise it would silently land on the body.
			 */
			focusPanelEntry() {
				const entry = this.$refs.searchToggle ?? this.$refs.panel;
				entry?.focus();
			},
			/**
			 * The mode also ends by itself when the tab loses the chosen company: such an exit must leave the
			 * focus of the user where it is.
			 */
			isFocusInsideSearch() {
				const searchRoot = this.$refs.search?.$el;
				return Boolean(searchRoot) && searchRoot.contains(document.activeElement);
			},
			toggleExpandedItem(itemId) {
				this.expandedItemId = this.expandedItemId === itemId ? '' : itemId;
			},
			loadHcmLinkPlaceholders(hcmLinkCompanyId) {
				if (!this.$refs.placeholdersSectionsContainer) {
					return;
				}
				if (!this.hcmLinkPlaceholdersLoader) {
					this.hcmLinkPlaceholdersLoader = new main_loader.Loader({
						target: this.$refs.placeholdersSectionsContainer
					});
				}
				void this.hcmLinkPlaceholdersLoader.show();
				this.api.placeholder.listByHcmLinkCompanyId(hcmLinkCompanyId).then(data => {
					this.hcmLinkSections = data;
				}).catch(error => {
					console.error('Failed to load hcmLink placeholders:', error);
				}).finally(() => {
					void this.hcmLinkPlaceholdersLoader.hide();
				});
			}
		},
		template: `
		<div
			ref="panel"
			class="sign-placeholders-content"
			tabindex="-1"
			data-testid="sign-placeholder-panel"
		>
			<div v-if="showHeader" class="sign-placeholders-common-title-container">
				<div class="sign-placeholders-common-title-header-container">
					<div class="sign-placeholders-common-title">
						{{ loc('PLACEHOLDER_LIST_FIELDS_TITLE_MSGVER_1') }}
					</div>
					<div ref="createButtonContainer"></div>
				</div>
				<div class="sign-placeholders-common-subtitle" v-html="getDocumentEditorHelpdeskLink()"></div>
			</div>
			<div class="sign-placeholders-content-body">
				<div class="sign-placeholders-header">
					<div v-if="!isSearchMode" class="sign-placeholders-content-header">
						<PlaceholderTabs v-show="isRuRegionLicense" :current-tab="currentTab" @switch-tab="switchTab"/>
						<div
							v-if="shouldShowSearch"
							ref="searchToggle"
							class="sign-placeholders-search-toggle"
							role="button"
							tabindex="0"
							:aria-label="loc('PLACEHOLDER_LIST_SEARCH_OPEN')"
							data-testid="sign-placeholder-search-toggle"
							@click="enterSearchMode"
							@keydown.enter="enterSearchMode"
							@keydown.space.prevent="enterSearchMode"
						>
							<BIcon :name="Outline.SEARCH" :size="24" color="var(--ui-color-base-4)"/>
						</div>
					</div>
					<PlaceholderSearch
						v-else
						ref="search"
						v-model:searchQuery="searchQuery"
						@exit="exitSearchMode"
					/>
				</div>
				<div v-show="isHcmLinkTab" class="sign-placeholders-selectors-container">
					<div>
						<div class="sign-placeholders-selector-title">
							{{ loc('PLACEHOLDER_LIST_COMPANY_SELECTOR') }}
						</div>
						<div ref="companySelectorContainer" class="sign-placeholders-company-selector"></div>
					</div>
					<div>
						<div class="sign-placeholders-selector-hcmlink-title">
							{{ loc('PLACEHOLDER_LIST_HCMLINK_COMPANY_SELECTOR') }}
						</div>
						<div ref="hcmLinkCompanySelectorContainer" class="sign-placeholders-hcm-link-company-selector"></div>
					</div>
				</div>
				<div class="sign-placeholders-scrollable-content">
					<div
						ref="placeholdersSectionsContainer"
						class="sign-placeholders-sections"
						data-testid="sign-placeholder-list"
					>
						<RecentFields
							v-if="shouldShowRecentFields"
							:fields="recentFields"
							:expanded-item-id="expandedItemId"
							@toggle-expand="toggleExpandedItem"
						/>
						<PlaceholderSearchNotFound
							v-else-if="shouldShowSearchNotFoundState"
							:search-query="searchQuery"
							:can-create-field="!isHcmLinkTab"
							@create-field="onCreateClick"
						/>
						<PlaceholderSearchNotConfigured v-else-if="shouldShowSearchNotConfiguredState"/>
						<PlaceholderSection
							v-else
							v-for="(section, index) in sections"
							:key="index"
							:section="section"
							:expanded-item-id="expandedItemId"
							@toggle-expand="toggleExpandedItem"
							@delete-field="handleDeleteField"
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	/**
	 * The surfaces of the panel - the slider and the floating widget - differ in the frame they give it,
	 * not in the way it is built: both load the list and build the whole application anew from it.
	 */
	class PlaceholdersMount {
		#api = new sign_v2_api.Api();
		#options;
		#loader;
		#app = null;
		#appInstance = null;
		constructor(options) {
			this.#options = options;
			this.#loader = new main_loader.Loader({
				target: options.container
			});
		}
		getAppInstance() {
			return this.#appInstance;
		}
		async load(clearCache = false, restoreFocus = false) {
			void this.#loader.show();
			try {
				const placeholdersData = await this.#api.placeholder.list(clearCache);
				this.mount(placeholdersData, restoreFocus);
			} catch (error) {
				console.error('Load placeholders data error:', error);
			} finally {
				void this.#loader.hide();
			}
		}

		// The reload replaces the whole application, so the request for the focus travels with the update:
		// the panel that asked for it is unmounted before the new one appears.
		mount(placeholdersData, restoreFocus = false) {
			this.unmount();
			this.#app = ui_vue3.BitrixVue.createApp(PlaceholdersApp, {
				sectionsData: placeholdersData,
				showHeader: this.#options.showHeader ?? true,
				restoreFocus,
				onListUpdate: options => {
					void this.load(true, options?.restoreFocus === true);
				}
			});
			this.#appInstance = this.#app.mount(this.#options.container);
		}
		unmount() {
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
				this.#appInstance = null;
			}
		}
	}

	const sidePanelConfig = Object.freeze({
		link: 'sign:stub:placeholder-list',
		width: 500
	});
	class Placeholders {
		#mount = null;
		async show() {
			return new Promise(resolve => {
				BX.SidePanel.Instance.open(sidePanelConfig.link, {
					width: sidePanelConfig.width,
					cacheable: false,
					contentCallback: async () => {
						const container = this.#createContainer();
						this.#mount = new PlaceholdersMount({
							container
						});
						await this.#mount.load();
						return container;
					},
					events: {
						onOpen: () => {
							resolve();
						},
						onClose: () => {
							this.#mount?.unmount();
						}
					}
				});
			});
		}
		#createContainer() {
			return BX.Tag.render`<div class="sign-placeholders-container"></div>`;
		}
	}

	exports.Placeholders = Placeholders;
	exports.PlaceholdersApp = PlaceholdersApp;
	exports.PlaceholdersMount = PlaceholdersMount;

})(this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}, BX.Sign.V2.B2e, BX, BX.UI.Notification, BX.UI.IconSet, window, BX.UI.Accessibility, BX.UI.System.Chip.Vue, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.Sign.V2, BX.UI, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Vue3, BX.Sign.V2, BX.Sign.V2, BX, BX.Sign.B2e);

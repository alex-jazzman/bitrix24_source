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

import type { ModifierCatalog, ModifierVariant, PlaceholderFieldType } from './types';

// The parts of a name and the composite name itself: the server builds all four from the same
// `Value\Name`, so declension applies to each of them
// (`signsafe/lib/Service/Placeholder/ModifierValueResolver.php`).
const NAME_TYPES: PlaceholderFieldType[] = ['fullname', 'firstname', 'lastname', 'patronymic'];

// Letter case applies to the string a typed value has already produced, so only a type whose value
// holds letters belongs here: digits have no case.
const TEXT_TYPES: PlaceholderFieldType[] = [
	...NAME_TYPES,
	'position',
	'string',
	'address',
	'list',
	'email',
	'external_id',
];

// The base variant of a group means "reset the group". A group whose layout gives it a name of its
// own passes that label key: the case and the letter case do, the rest keep the common one.
const asIsVariant = (labelKey: string = 'PLACEHOLDER_MODIFIER_VARIANT_AS_IS'): ModifierVariant => {
	return {
		id: 'asIs',
		labelKey,
		parameters: [],
		exclusive: false,
		mechanics: null,
	};
};

export const modifierCatalog: ModifierCatalog = {
	groups: [
		{
			// Declension goes without a written form of its own: `Value\Name` declines every part
			// separately and only then formats them, so the word order cannot spoil the case.
			id: 'case',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_CASE',
			applicableTypes: NAME_TYPES,
			regions: ['ru'],
			variants: [
				asIsVariant('PLACEHOLDER_MODIFIER_VARIANT_CASE_NOMINATIVE'),
				{
					id: 'genitive',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_GENITIVE',
					parameters: ['Case=0'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'dative',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_DATIVE',
					parameters: ['Case=1'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'accusative',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_ACCUSATIVE',
					parameters: ['Case=2'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'instrumental',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_INSTRUMENTAL',
					parameters: ['Case=3'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'prepositional',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_CASE_PREPOSITIONAL',
					parameters: ['Case=4'],
					exclusive: false,
					mechanics: null,
				},
			],
		},
		{
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
			variants: [
				asIsVariant(),
				{
					id: 'lastFirstPatronymic',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_LAST_FIRST_PATRONYMIC',
					parameters: ['Format=#LAST_NAME# #NAME# #SECOND_NAME#'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'firstPatronymicLast',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_FIRST_PATRONYMIC_LAST',
					parameters: ['Format=#NAME# #SECOND_NAME# #LAST_NAME#'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'lastWithInitials',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_LAST_WITH_INITIALS',
					parameters: ['Format=#LAST_NAME# #NAME_SHORT##SECOND_NAME_SHORT#'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'initialsWithLast',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_INITIALS_WITH_LAST',
					parameters: ['Format=#NAME_SHORT##SECOND_NAME_SHORT# #LAST_NAME#'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'lastFirst',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_LAST_FIRST',
					parameters: ['Format=#LAST_NAME# #NAME#'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'firstLast',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_FULL_NAME_FIRST_LAST',
					parameters: ['Format=#NAME# #LAST_NAME#'],
					exclusive: false,
					mechanics: null,
				},
			],
		},
		{
			id: 'datetime',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_DATETIME',
			applicableTypes: ['date', 'external_date'],
			regions: [],
			variants: [
				asIsVariant(),
				{
					id: 'digits',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_DATETIME_DIGITS',
					parameters: ['d.m.Y'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'digitsWithTime',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_DATETIME_DIGITS_WITH_TIME',
					parameters: ['d.m.Y H:i'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'monthInWords',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_DATETIME_MONTH_IN_WORDS',
					parameters: ['j F Y'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'monthInWordsWithTime',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_DATETIME_MONTH_IN_WORDS_WITH_TIME',
					parameters: ['j F Y, H:i'],
					exclusive: true,
					mechanics: null,
				},
			],
		},
		{
			id: 'phone',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_PHONE',
			applicableTypes: ['phone'],
			regions: [],
			variants: [
				asIsVariant(),
				{
					id: 'international',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_PHONE_INTERNATIONAL',
					parameters: ['format=International'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'national',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_PHONE_NATIONAL',
					parameters: ['format=National'],
					exclusive: false,
					mechanics: null,
				},
				{
					// `Format::E164` keeps the plus of the code of the country and drops the separators
					// (`+79112223344`), so the variant is about the compact spelling and not about digits alone.
					id: 'compact',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_PHONE_COMPACT',
					parameters: ['format=E.164'],
					exclusive: false,
					mechanics: null,
				},
			],
		},
		{
			id: 'address',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_ADDRESS',
			applicableTypes: ['address'],
			regions: [],
			variants: [
				asIsVariant(),
				{
					id: 'oneLine',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_ADDRESS_ONE_LINE',
					parameters: ['Separator=1'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'partPerLine',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_ADDRESS_PART_PER_LINE',
					parameters: ['Separator=2'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'postalCodeLast',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_ADDRESS_POSTAL_CODE_LAST',
					parameters: ['Format=4'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'postalCodeFirst',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_ADDRESS_POSTAL_CODE_FIRST',
					parameters: ['Format=5'],
					exclusive: false,
					mechanics: null,
				},
			],
		},
		{
			// Both mechanics behind the group need a value that holds a list of items, and that is the
			// `list` type of the field - the multiplicity flag of the field says nothing about it.
			id: 'multiValue',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_MULTI_VALUE',
			applicableTypes: ['list'],
			regions: [],
			variants: [
				asIsVariant(),
				{
					id: 'allValues',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_MULTI_VALUE_ALL',
					parameters: ['all=y'],
					exclusive: false,
					mechanics: 'collection',
				},
				{
					id: 'firstValue',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_MULTI_VALUE_FIRST',
					parameters: ['mfirst=y'],
					exclusive: false,
					mechanics: 'multiValue',
				},
				{
					id: 'valuePerLine',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_MULTI_VALUE_PER_LINE',
					parameters: ['mseparator=2'],
					exclusive: false,
					mechanics: 'multiValue',
				},
			],
		},
		{
			// Letter case goes last: the catalog order is what makes the assembled code stable.
			id: 'letterCase',
			labelKey: 'PLACEHOLDER_MODIFIER_GROUP_LETTER_CASE',
			applicableTypes: TEXT_TYPES,
			regions: [],
			variants: [
				asIsVariant('PLACEHOLDER_MODIFIER_VARIANT_LETTER_CASE_REGULAR'),
				{
					id: 'title',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_LETTER_CASE_TITLE',
					parameters: ['letterCase=title'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'upper',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_LETTER_CASE_UPPER',
					parameters: ['letterCase=upper'],
					exclusive: false,
					mechanics: null,
				},
				{
					id: 'lower',
					labelKey: 'PLACEHOLDER_MODIFIER_VARIANT_LETTER_CASE_LOWER',
					parameters: ['letterCase=lower'],
					exclusive: false,
					mechanics: null,
				},
			],
		},
	],
};

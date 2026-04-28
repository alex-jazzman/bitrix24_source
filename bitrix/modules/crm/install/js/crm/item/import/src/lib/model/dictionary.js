import { Type } from 'main.core';
import { SelectOption } from '../../components/layout';

export type DictionaryOptions = {
	encodings: SelectOption[],
	nameFormats: SelectOption[],
	delimiters: SelectOption[],
	requisitePresets: SelectOption[],
	contactTypes: SelectOption[],
	sources: SelectOption[],
	duplicateControlBehaviors: SelectOption[],
	duplicateControlTargets: SelectOption[],
	isDuplicateControlPermitted: boolean,
};

export class Dictionary
{
	#encodings: SelectOption[] = [];
	#nameFormats: SelectOption[] = [];
	#delimiters: SelectOption[] = [];
	#requisitePresets: SelectOption[] = [];
	#contactTypes: SelectOption[] = [];
	#sources: SelectOption[] = [];
	#duplicateControlBehaviors: SelectOption[];
	#duplicateControlTargets: SelectOption[];
	#isDuplicateControlPermitted: boolean;

	constructor(options: DictionaryOptions = {})
	{
		this.#setEncodings(options);
		this.#setNameFormats(options);
		this.#setDelimiters(options);
		this.#setRequisitePresets(options);
		this.#setContactTypes(options);
		this.#setSources(options);
		this.#setDuplicateControlBehaviors(options);
		this.#setDuplicateControlTargets(options);
		this.#setDuplicateControlPermitted(options);
	}

	getEncodings(): SelectOption[]
	{
		return this.#encodings;
	}

	getNameFormats(): SelectOption[]
	{
		return this.#nameFormats;
	}

	getDelimiters(): SelectOption[]
	{
		return this.#delimiters;
	}

	getRequisitePresets(): SelectOption[]
	{
		return this.#requisitePresets;
	}

	getContactTypes(): SelectOption[]
	{
		return this.#contactTypes;
	}

	getSources(): SelectOption[]
	{
		return this.#sources;
	}

	getDuplicateControlBehaviors(): SelectOption[]
	{
		return this.#duplicateControlBehaviors;
	}

	getDuplicateControlTargets(): SelectOption[]
	{
		return this.#duplicateControlTargets;
	}

	isDuplicateControlPermitted(): boolean
	{
		return this.#isDuplicateControlPermitted;
	}

	#isCorrectSelectOption(option: Object): boolean
	{
		return Type.isPlainObject(option)
			&& Type.isStringFilled(option.title)
			&& (
				Type.isStringFilled(option.value)
				|| Type.isNumber(option.value)
			)
		;
	}

	#setEncodings(options: DictionaryOptions): void
	{
		this.#encodings = options
			.encodings
			.filter((encoding: SelectOption) => this.#isCorrectSelectOption(encoding))
		;
	}

	#setNameFormats(options: DictionaryOptions): void
	{
		this.#nameFormats = options
			.nameFormats
			.filter((nameFormat: SelectOption) => this.#isCorrectSelectOption(nameFormat))
		;
	}

	#setDelimiters(options: DictionaryOptions): void
	{
		this.#delimiters = options
			.delimiters
			.filter((delimiter: SelectOption) => this.#isCorrectSelectOption(delimiter))
		;
	}

	#setRequisitePresets(options: DictionaryOptions): void
	{
		this.#requisitePresets = options
			.requisitePresets
			.filter((requisitePreset: SelectOption) => this.#isCorrectSelectOption(requisitePreset))
		;
	}

	#setContactTypes(options: DictionaryOptions): void
	{
		this.#contactTypes = options
			.contactTypes
			.filter((contactType: SelectOption) => this.#isCorrectSelectOption(contactType))
		;
	}

	#setSources(options: DictionaryOptions): void
	{
		this.#sources = options
			.sources
			.filter((source: SelectOption) => this.#isCorrectSelectOption(source))
		;
	}

	#setDuplicateControlBehaviors(options: DictionaryOptions): void
	{
		this.#duplicateControlBehaviors = options
			.duplicateControlBehaviors
			.filter((behavior: SelectOption) => this.#isCorrectSelectOption(behavior))
		;
	}

	#setDuplicateControlTargets(options: DictionaryOptions): void
	{
		this.#duplicateControlTargets = options
			.duplicateControlTargets
			.filter((target: SelectOption) => this.#isCorrectSelectOption(target))
		;
	}

	#setDuplicateControlPermitted(options: DictionaryOptions): void
	{
		this.#isDuplicateControlPermitted = Boolean(options.isDuplicateControlPermitted);
	}
}

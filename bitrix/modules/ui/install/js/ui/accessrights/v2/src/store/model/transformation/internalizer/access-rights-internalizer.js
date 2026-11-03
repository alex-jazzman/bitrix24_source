import { Text, Type } from 'main.core';
import { DEFAULT_ALIAS_SEPARATOR, normalizeAliasKey } from '../../../../utils';
import type {
	AccessRightItem,
	AccessRightsCollection,
	AccessRightSection,
	AccessRightSectionAction,
	AccessRightSectionIcon,
	Preset,
	Variable,
	VariablesSource,
} from '../../access-rights-model';
import type { Transformer } from '../transformer';

export type ExternalAccessRightSection = {
	sectionTitle: ?any,
	sectionSubTitle: ?any,
	sectionCode: ?any,
	sectionHint: ?any,
	sectionIcon: ?any,
	rights: ExternalAccessRightItem[],
	action: ?ExternalAccessRightSectionAction,
};

export type ExternalAccessRightSectionAction = {
	buttonText: string,
};

export type ExternalAccessRightItem = {
	id: any,
	type: any,
	title: any,
	subtitle: ?any,
	hint: ?any,
	group: ?any,
	groupHead: ?any,
	minValue?: any | any[],
	maxValue?: any | any[],
	defaultValue?: any | any[],
	nothingSelectedValue?: any | any[],
	setEmptyOnSetMinMaxValueInColumn: ?any,

	variables?: ExternalVariable[],
	presets?: ExternalPreset[],

	allSelectedCode: ?any,
	allSelectedTitle: ?any,
	variablesSource: ?any,
	unloadedVariableTitlePattern: ?any,
	selectedVariablesAliases: {[key: string]: string} & {separator?: string},
	enableSearch?: any,
	showAvatars?: any,
	compactView?: any,
	hintTitle: ?any,
	dependentVariablesPopupHint: ?any,

	iconClass: ?any,
	isClickable: ?any,
	isDeletable: ?any,
	isNew: ?any,
	isModified: ?any,
};

export type ExternalVariable = {
	id: any,
	title: any,
	entityId: ?any,
	supertitle: ?any,
	avatar: ?any,
	avatarOptions: ?any,
	conflictsWith?: any[],
	dependant?: any[],
	requires?: any[],
	secondary: ?any,
	hint: ?any,
	isUseGroupHeadValuesInHint: ?any,
}

export type ExternalPreset = {
	id: any,
	title: any,
	icon?: ?any,
	description?: ?any,
	showGroupHeadItems?: ?any,
	variableIds?: any[],
}

export class AccessRightsInternalizer implements Transformer<ExternalAccessRightSection[], AccessRightsCollection>
{
	transform(externalSource: ExternalAccessRightSection[]): AccessRightsCollection
	{
		const result: AccessRightsCollection = new Map();

		for (const external of externalSource)
		{
			const internalized = this.#internalizeExternalSection(external);
			result.set(internalized.sectionCode, internalized);
		}

		return result;
	}

	#internalizeExternalSection(externalSection: ExternalAccessRightSection): AccessRightSection
	{
		const internalizedSection: AccessRightSection = {
			sectionCode: Type.isStringFilled(externalSection.sectionCode)
				? externalSection.sectionCode
				: Text.getRandom(),
			sectionTitle: String(externalSection.sectionTitle),
			sectionSubTitle: Type.isStringFilled(externalSection.sectionSubTitle)
				? externalSection.sectionSubTitle
				: null,
			sectionHint: Type.isStringFilled(externalSection.sectionHint)
				? externalSection.sectionHint
				: null,
			sectionIcon: this.#internalizeExternalIcon(externalSection.sectionIcon),
			rights: new Map(),
			isExpanded: true,
			isShown: true,
			action: this.#internalizeExternalSectionAction(externalSection.action),
		};

		for (const externalItem of externalSection.rights)
		{
			const internalizedItem = this.internalizeExternalItem(externalItem);

			internalizedSection.rights.set(internalizedItem.id, internalizedItem);
		}

		return internalizedSection;
	}

	#internalizeExternalIcon(externalIcon: ?any): ?AccessRightSectionIcon
	{
		if (Type.isStringFilled(externalIcon?.type) && Type.isStringFilled(externalIcon?.bgColor))
		{
			return {
				type: externalIcon.type,
				bgColor: externalIcon.bgColor,
			};
		}

		return null;
	}

	#internalizeExternalSectionAction(externalSectionAction: ExternalAccessRightSectionAction): ?AccessRightSectionAction
	{
		if (Type.isStringFilled(externalSectionAction?.buttonText))
		{
			return {
				buttonText: externalSectionAction.buttonText,
			};
		}

		return null;
	}

	internalizeExternalItem(externalItem: ExternalAccessRightItem): AccessRightItem
	{
		const [aliases, separator] = this.#internalizeSelectedVariablesAliases(externalItem.selectedVariablesAliases);

		const normalizedItem: AccessRightItem = {
			id: String(externalItem.id),
			type: String(externalItem.type),
			title: String(externalItem.title),
			subtitle: Type.isStringFilled(externalItem.subtitle) ? externalItem.subtitle : null,
			hint: Type.isStringFilled(externalItem.hint) ? externalItem.hint : null,
			group: Type.isNil(externalItem.group) ? null : String(externalItem.group),
			groupHead: Type.isBoolean(externalItem.groupHead) ? externalItem.groupHead : false,
			isShown: true,
			minValue: this.#internalizeValueSet(externalItem.minValue),
			maxValue: this.#internalizeValueSet(externalItem.maxValue),
			defaultValue: this.#internalizeValueSet(externalItem.defaultValue),
			emptyValue: this.#internalizeValueSet(externalItem.emptyValue),
			nothingSelectedValue: this.#internalizeValueSet(externalItem.nothingSelectedValue),
			setEmptyOnSetMinMaxValueInColumn: this.#internalizeSetEmptyOnSetMinMaxValueInColumn(externalItem),
			variables: Type.isArray(externalItem.variables) || Type.isMap(externalItem.variables) ? new Map() : null,
			presets: new Map(),

			allSelectedCode: Type.isStringFilled(externalItem.allSelectedCode) ? externalItem.allSelectedCode : null,
			allSelectedTitle: Type.isStringFilled(externalItem.allSelectedTitle) ? externalItem.allSelectedTitle : null,
			variablesSource: this.#internalizeVariablesSource(externalItem.variablesSource),
			unloadedVariableTitlePattern: Type.isStringFilled(externalItem.unloadedVariableTitlePattern)
				? externalItem.unloadedVariableTitlePattern
				: null,
			selectedVariablesAliases: aliases,
			selectedVariablesAliasesSeparator: separator,
			enableSearch: Type.isBoolean(externalItem.enableSearch) ? externalItem.enableSearch : null,
			showAvatars: Type.isBoolean(externalItem.showAvatars) ? externalItem.showAvatars : null,
			compactView: Type.isBoolean(externalItem.compactView) ? externalItem.compactView : null,
			hintTitle: Type.isStringFilled(externalItem.hintTitle) ? externalItem.hintTitle : null,
			dependentVariablesPopupHint: Type.isStringFilled(externalItem.dependentVariablesPopupHint)
				? externalItem.dependentVariablesPopupHint
				: null,

			iconClass: Type.isStringFilled(externalItem.iconClass) ? externalItem.iconClass : null,
			isClickable: Type.isBoolean(externalItem.isClickable) ? externalItem.isClickable : false,
			isDeletable: Type.isBoolean(externalItem.isDeletable) ? externalItem.isDeletable : false,
			isNew: Type.isBoolean(externalItem.isNew) ? externalItem.isNew : false,
			isModified: Type.isBoolean(externalItem.isModified) ? externalItem.isModified : false,
		};
		if (normalizedItem.groupHead || normalizedItem.group)
		{
			normalizedItem.isGroupExpanded = false;
		}

		if (Type.isArray(externalItem.variables))
		{
			for (const variable of externalItem.variables)
			{
				const normalizedVariable = this.#internalizeExternalVariable(variable);

				normalizedItem.variables.set(normalizedVariable.id, normalizedVariable);
			}
		}
		else if (Type.isMap(externalItem.variables))
		{
			for (const variable of externalItem.variables.values())
			{
				const normalizedVariable = this.#internalizeExternalVariable(variable);

				normalizedItem.variables.set(normalizedVariable.id, normalizedVariable);
			}
		}

		const knownVariableIds: Set<string> = new Set(
			normalizedItem.variables ? normalizedItem.variables.keys() : [],
		);
		const externalPresets = Type.isMap(externalItem.presets)
			? [...externalItem.presets.values()]
			: (Type.isArray(externalItem.presets) ? externalItem.presets : []);
		for (const preset of externalPresets)
		{
			const normalizedPreset = this.#internalizePreset(preset, knownVariableIds);
			if (normalizedPreset)
			{
				normalizedItem.presets.set(normalizedPreset.id, normalizedPreset);
			}
		}

		return normalizedItem;
	}

	#internalizeSelectedVariablesAliases(externalAliases: {[key: string]: string} & {separator?: string}): [Map, string]
	{
		if (!Type.isPlainObject(externalAliases))
		{
			return [new Map(), DEFAULT_ALIAS_SEPARATOR];
		}

		const separator = Type.isString(externalAliases.separator) ? externalAliases.separator : DEFAULT_ALIAS_SEPARATOR;

		const result = new Map();
		for (const [key, value] of Object.entries(externalAliases))
		{
			if (key === 'separator')
			{
				continue;
			}

			result.set(normalizeAliasKey(key, separator), String(value));
		}

		return [result, separator];
	}

	#internalizeValueSet(value: any | any[] | undefined): ?Set<string>
	{
		if (Type.isNil(value))
		{
			return null;
		}

		if (Type.isArray(value))
		{
			return new Set(value.map((item) => String(item)));
		}

		if (Type.isSet(value))
		{
			return new Set(Array.from(value, (item) => String(item)));
		}

		return new Set([String(value)]);
	}

	#internalizeSetEmptyOnSetMinMaxValueInColumn(externalItem: ExternalAccessRightItem): ?boolean
	{
		const boolOrNull = (x: any) => (Type.isBoolean(x) ? x : null);

		if (!Type.isUndefined(externalItem.setEmptyOnSetMinMaxValueInColumn))
		{
			return boolOrNull(externalItem.setEmptyOnSetMinMaxValueInColumn);
		}

		// todo compatibility, can be removed when crm update is out
		return boolOrNull(externalItem.setEmptyOnGroupActions);
	}

	#internalizePreset(externalPreset: ?any, knownVariableIds: Set<string>): ?Preset
	{
		if (!Type.isPlainObject(externalPreset) || Type.isNil(externalPreset.id))
		{
			return null;
		}

		const variableIds = (Type.isArray(externalPreset.variableIds) ? externalPreset.variableIds : [])
			.map((x) => String(x))
			.filter((id) => knownVariableIds.has(id));

		if (variableIds.length === 0)
		{
			return null;
		}

		return {
			id: String(externalPreset.id),
			title: Type.isStringFilled(externalPreset.title) ? String(externalPreset.title) : '',
			icon: Type.isStringFilled(externalPreset.icon) ? externalPreset.icon : null,
			description: Type.isStringFilled(externalPreset.description) ? externalPreset.description : null,
			showGroupHeadItems: Type.isBoolean(externalPreset.showGroupHeadItems) ? externalPreset.showGroupHeadItems : false,
			variableIds,
		};
	}

	#internalizeExternalVariable(externalVariable: ExternalVariable): Variable
	{
		return {
			id: String(externalVariable.id),
			title: String(externalVariable.title),
			entityId: Type.isStringFilled(externalVariable.entityId) ? externalVariable.entityId : null,
			supertitle: Type.isStringFilled(externalVariable.supertitle) ? externalVariable.supertitle : null,
			avatar: Type.isStringFilled(externalVariable.avatar) ? externalVariable.avatar : null,
			avatarOptions: Type.isPlainObject(externalVariable.avatarOptions) ? externalVariable.avatarOptions : null,
			conflictsWith: Type.isArray(externalVariable.conflictsWith)
				? new Set(externalVariable.conflictsWith.map((x) => String(x)))
				: null,
			requires: Type.isArray(externalVariable.requires)
				? new Set(externalVariable.requires.map((x) => String(x)))
				: null,
			dependant: Type.isArray(externalVariable.dependant)
				? new Set(externalVariable.dependant.map((x) => String(x)))
				: null,
			secondary: Type.isBoolean(externalVariable.secondary) ? externalVariable.secondary : null,
			hint: Type.isStringFilled(externalVariable.hint) ? externalVariable.hint : null,
			isUseGroupHeadValuesInHint: Type.isBoolean(externalVariable.isUseGroupHeadValuesInHint) ? externalVariable.isUseGroupHeadValuesInHint : false,
		};
	}

	#internalizeVariablesSource(externalSource: ?any): ?VariablesSource
	{
		if (!Type.isPlainObject(externalSource) || !Type.isStringFilled(externalSource.entityId))
		{
			return null;
		}

		if (externalSource.dynamicLoad === false)
		{
			// nothing else fills such a dialog, so the host module gets an empty list instead of its source
			console.warn(
				'ui.accessrights.v2: variablesSource with dynamicLoad disabled leaves the dialog without items',
				{ entityId: externalSource.entityId },
			);
		}

		return {
			entityId: externalSource.entityId,
			dynamicLoad: Type.isBoolean(externalSource.dynamicLoad) ? externalSource.dynamicLoad : true,
			dynamicSearch: Type.isBoolean(externalSource.dynamicSearch) ? externalSource.dynamicSearch : true,
			dynamicSearchMatchMode: Type.isStringFilled(externalSource.dynamicSearchMatchMode)
				? externalSource.dynamicSearchMatchMode
				: null,
			providerOptions: Type.isPlainObject(externalSource.providerOptions) ? externalSource.providerOptions : {},
			fillRecentItems: Type.isBoolean(externalSource.fillRecentItems) ? externalSource.fillRecentItems : false,
			itemEntityId: Type.isStringFilled(externalSource.itemEntityId)
				? externalSource.itemEntityId
				: externalSource.entityId,
		};
	}
}

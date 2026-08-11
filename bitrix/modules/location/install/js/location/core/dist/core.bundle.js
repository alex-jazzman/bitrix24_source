/* eslint-disable */
this.BX = this.BX || {};
this.BX.Location = this.BX.Location || {};
(function (exports, main_core, location_core, main_md5, main_core_events) {
	'use strict';

	class Field {
		#type;
		constructor(props) {
			if (typeof props.type === 'undefined') {
				throw new Error('Field type must be defined');
			}
			this.#type = parseInt(props.type);
		}
		get type() {
			return this.#type;
		}
	}

	class FieldCollection {
		#fields = {};
		constructor(props = {}) {
			this.fields = props.fields ? props.fields : [];
		}
		set fields(fields) {
			if (!Array.isArray(fields)) {
				throw new Error('Items must be array!');
			}
			for (const field of fields) {
				this.setField(field);
			}
			return this;
		}
		get fields() {
			return this.#fields;
		}

		/**
		 * Checks if field already exist in collection
		 * @param {int} type
		 * @returns {boolean}
		 */
		isFieldExists(type) {
			return typeof this.#fields[type] !== 'undefined';
		}
		getField(type) {
			return this.isFieldExists(type) ? this.#fields[type] : null;
		}
		setField(field) {
			if (!(field instanceof Field)) {
				throw new Error('Argument field must be instance of Field!');
			}
			this.#fields[field.type] = field;
			return this;
		}
		deleteField(type) {
			if (this.isFieldExists(type)) {
				delete this.#fields[type];
			}
		}
		getMaxFieldType() {
			const types = Object.keys(this.#fields).sort((a, b) => {
				return parseInt(a) - parseInt(b);
			});
			let result = 0;
			if (types.length > 0) {
				result = types[types.length - 1];
			}
			return result;
		}
		isEqual(addressFieldCollection, upTo) {
			return FieldCollection.areEqual(this, addressFieldCollection, upTo) && FieldCollection.areEqual(addressFieldCollection, this, upTo);
		}
		static areEqual(addressFieldCollection1, addressFieldCollection2, upTo) {
			for (let type in addressFieldCollection1.fields) {
				if (type > upTo) {
					continue;
				}
				let field = addressFieldCollection2.getField(type);
				if (!field) {
					return false;
				}
				if (addressFieldCollection1.fields[type].value !== field.value) {
					return false;
				}
			}
			return true;
		}
	}

	class AddressField extends Field {
		#value;

		//todo: Fields validation
		constructor(props) {
			super(props);
			this.#value = props.value || '';
		}
		get value() {
			return this.#value;
		}
		set value(value) {
			this.#value = value;
			return this;
		}
	}

	class AddressFieldCollection extends FieldCollection {
		getFieldValue(type) {
			let result = null;
			if (this.isFieldExists(type)) {
				const field = this.getField(type);
				if (field) {
					result = field.value;
				}
			}
			return result;
		}
		setFieldValue(type, value) {
			this.setField(new AddressField({
				type,
				value
			}));
			return this;
		}
	}

	class AddressLink {
		#entityId;
		#entityType;
		constructor(props) {
			this.#entityId = props.entityId;
			this.#entityType = props.entityType;
		}
		get entityId() {
			return this.#entityId;
		}
		get entityType() {
			return this.#entityType;
		}
	}

	class AddressLinkCollection {
		#links = [];
		constructor(props = {}) {
			this.links = !!props.links ? props.links : [];
		}
		set links(links) {
			if (!Array.isArray(links)) {
				throw new Error('links must be array!');
			}
			for (let link of links) {
				this.addLink(link);
			}
		}
		get links() {
			return this.#links;
		}
		addLink(link) {
			if (!(link instanceof AddressLink)) {
				throw new Error('Argument link must be instance of Field!');
			}
			this.#links.push(link);
		}
		clearLinks() {
			this.#links = [];
		}
	}

	class FormatField extends Field {
		#sort;
		#name;
		#description;

		// todo: Fields validation
		constructor(props) {
			super(props);
			this.#sort = parseInt(props.sort);
			this.#name = props.name || '';
			this.#description = props.description || '';
		}
		get sort() {
			return this.#sort;
		}
		set sort(sort) {
			this.#sort = sort;
		}
		get name() {
			return this.#name;
		}
		set name(name) {
			this.#name = name;
		}
		get description() {
			return this.#description;
		}
		set description(description) {
			this.#description = description;
		}
	}

	class FormatFieldCollection extends FieldCollection {
		initFields(fieldsData) {
			if (Array.isArray(fieldsData)) {
				fieldsData.forEach(data => {
					const field = new FormatField(data);
					if (field) {
						this.setField(field);
					}
				});
			}
		}
	}

	class LocationType {
		static UNKNOWN = 0;
		static COUNTRY = 100;
		static ADM_LEVEL_1 = 200;
		static ADM_LEVEL_2 = 210;
		static ADM_LEVEL_3 = 220;
		static ADM_LEVEL_4 = 230;
		static LOCALITY = 300;
		static SUB_LOCALITY = 310;
		static SUB_LOCALITY_LEVEL_1 = 320;
		static SUB_LOCALITY_LEVEL_2 = 330;
		static STREET = 340;
		static BUILDING = 400;
		static ADDRESS_LINE_1 = 410;
		static FLOOR = 420;
		static ROOM = 430;
		static TMP_TYPE_HINT = 5010;
		static TMP_TYPE_CLARIFICATION = 5020;
	}

	class AddressType extends LocationType {
		static POSTAL_CODE = 50;
		static ADDRESS_LINE_2 = 600;
		static RECIPIENT_COMPANY = 700;
		static RECIPIENT = 710;
		static PO_BOX = 800;
	}

	class FormatTemplate {
		constructor(type, template) {
			this.type = type;
			this.template = template;
		}
	}

	class FormatTemplateCollection {
		#templates = {};
		constructor(templateData) {
			for (const type in templateData) {
				// eslint-disable-next-line no-prototype-builtins
				if (templateData.hasOwnProperty(type)) {
					this.setTemplate(new FormatTemplate(type, templateData[type]));
				}
			}
		}
		isTemplateExists(type) {
			return typeof this.#templates[type] !== 'undefined';
		}
		getTemplate(type) {
			return this.isTemplateExists(type) ? this.#templates[type] : null;
		}
		setTemplate(template) {
			if (!(template instanceof FormatTemplate)) {
				throw new Error('Argument template must be instance of FormatTemplate!');
			}
			this.#templates[template.type] = template;
		}
	}

	/**
	 * Template types
	 */
	class FormatTemplateType {
		// Default template
		static DEFAULT = 'DEFAULT';

		// Template for autocomplete
		static AUTOCOMPLETE = 'AUTOCOMPLETE';

		// Template for field ADDRESS_LINE_1
		static ADDRESS_LINE_1 = 'ADDRESS_LINE_1';
	}

	/**
	 * Class defines how the Address will look like
	 */
	class Format {
		constructor(props) {
			if (main_core.Type.isUndefined(props.languageId)) {
				throw new TypeError('LanguageId must be defined');
			}
			this.languageId = props.languageId;
			this.code = props.code || '';
			this.name = props.name || '';
			this.templateAutocomplete = props.templateAutocomplete || '';
			this.templateAddressLine1 = props.templateAddressLine1 || '';
			this.description = props.description || '';
			this.delimiter = props.delimiter || ', ';
			this.fieldForUnRecognized = props.fieldForUnRecognized || AddressType.UNKNOWN;
			this.fieldCollection = new FormatFieldCollection();
			if (main_core.Type.isObject(props.fieldCollection)) {
				this.fieldCollection.initFields(props.fieldCollection);
			}
			let collection = {};
			if (main_core.Type.isObject(props.templateCollection)) {
				collection = props.templateCollection;
			}
			this.templateCollection = new FormatTemplateCollection(collection);
		}
		getField(type) {
			return this.fieldCollection.getField(type);
		}
		isFieldExists(type) {
			return this.fieldCollection.isFieldExists(type);
		}
		getTemplate(type = FormatTemplateType.DEFAULT) {
			return this.templateCollection.getTemplate(type);
		}
		isTemplateExists(type) {
			return this.templateCollection.isTemplateExists(type);
		}
		get template() {
			return this.templateCollection.getTemplate();
		}
	}

	const STR_DELIMITER_PLACEHOLDER = "#S#";
	const REGEX_COMMA_AMONG_EMPTY_SPACE = "\\s*,\\s*";
	const REGEX_GROUP_DELIMITER = "(\\\"([^\"\\\\]*|\\\\\"|\\\\\\\\|\\\\)*\")";
	const REGEX_GROUP_FIELD_TEXT = REGEX_GROUP_DELIMITER;
	const REGEX_GROUP_FIELD_NAME = "([a-zA-Z][a-zA-Z_0-9]*(:(NU|UN|N|U))?)";
	const REGEX_GROUP_FIELD_LIST_END = "\\s*\\]";
	const REGEX_GROUP_END = REGEX_GROUP_FIELD_LIST_END;
	const REGEX_PART_FROM_DELIMITER_TO_FIELD_LIST = "\\s*,\\s*\\[\\s*";
	const REGEX_GROUP_PART_BEFORE_FIELDS = "(([^\\[\\\\]|\\\\\\[|\\\\\\\\)*)(\\[\\s*)(\"([^\"\\\\]*|\\\\\"|\\\\\\\\|\\\\)*\")\\s*,\\s*\\[\\s*";
	const ERR_PARSE_GROUP_START_POSITION = 1100;
	const ERR_PARSE_GROUP_START = 1110;
	const ERR_PARSE_GROUP_DELIMITER = 1120;
	const ERR_PARSE_PART_FROM_DELIMITER_TO_FIELD_LIST = 1130;
	const ERR_PARSE_GROUP_FIELD_TEXT = 1140;
	const ERR_PARSE_GROUP_FIELD_NAME = 1150;
	const ERR_PARSE_GROUP_FIELD = 1160;
	const ERR_PARSE_GROUP_FIELD_LIST = 1170;
	const ERR_PARSE_GROUP_FIELD_LIST_DELIMITER = 1180;
	const ERR_PARSE_GROUP_FIELD_LIST_END = 1190;
	const ERR_PARSE_GROUP_END = 1200;
	const ERR_PARSE_GROUP = 1210;
	class StringTemplateConverter {
		#template = "";
		#delimiter = "";
		#htmlEncode = false;
		#format = null;
		constructor(template, delimiter, htmlEncode, format = null) {
			this.#template = template;
			this.#delimiter = delimiter;
			this.#htmlEncode = htmlEncode;
			this.#format = format;
		}
		getErrorCodes() {
			let result = {};
			result[ERR_PARSE_GROUP_START_POSITION] = "ERR_PARSE_GROUP_START_POSITION";
			result[ERR_PARSE_GROUP_START] = "ERR_PARSE_GROUP_START";
			result[ERR_PARSE_GROUP_DELIMITER] = "ERR_PARSE_GROUP_DELIMITER";
			result[ERR_PARSE_PART_FROM_DELIMITER_TO_FIELD_LIST] = "ERR_PARSE_PART_FROM_DELIMITER_TO_FIELD_LIST";
			result[ERR_PARSE_GROUP_FIELD_TEXT] = "ERR_PARSE_GROUP_FIELD_TEXT";
			result[ERR_PARSE_GROUP_FIELD_NAME] = "ERR_PARSE_GROUP_FIELD_NAME";
			result[ERR_PARSE_GROUP_FIELD] = "ERR_PARSE_GROUP_FIELD";
			result[ERR_PARSE_GROUP_FIELD_LIST] = "ERR_PARSE_GROUP_FIELD_LIST";
			result[ERR_PARSE_GROUP_FIELD_LIST_DELIMITER] = "ERR_PARSE_GROUP_FIELD_LIST_DELIMITER";
			result[ERR_PARSE_GROUP_FIELD_LIST_END] = "ERR_PARSE_GROUP_FIELD_LIST_END";
			result[ERR_PARSE_GROUP_END] = "ERR_PARSE_GROUP_END";
			result[ERR_PARSE_GROUP] = "ERR_PARSE_GROUP";
			return result;
		}
		getErrorsText(context) {
			let result = "";
			const errorCodes = this.getErrorCodes();
			const errors = context["error"]["errors"];
			for (let i = 0; i < errors.length; i++) {
				result += `Error: ${errors[i]["position"]}, ${errorCodes[errors[i]["code"]]}\n`;
				if (errors[i].hasOwnProperty("info") && main_core.Type.isPlainObject(errors[i]["info"])) {
					const errorInfo = errors[i]["info"];
					let needHeader = true;
					for (let paramName in errorInfo) {
						if (errorInfo.hasOwnProperty(paramName)) {
							let paramValue = errorInfo[paramName];
							let needPrint = false;
							if (main_core.Type.isString(paramValue)) {
								paramValue = `"${paramValue}"`;
								needPrint = true;
							} else if (main_core.Type.isNumber(paramValue) || main_core.Type.isFloat(paramValue)) {
								needPrint = true;
							} else if (main_core.Type.isBoolean(paramValue)) {
								paramValue = paramValue ? "true" : "false";
								needPrint = true;
							} else if (main_core.Type.isArray(paramValue)) {
								paramValue = "[...]";
								needPrint = true;
							} else if (main_core.Type.isObject(paramValue)) {
								paramValue = '{...}';
								needPrint = true;
							}
							if (needPrint) {
								if (needHeader) {
									result += "  Error info:\n";
									needHeader = false;
								}
								result += `    ${paramName}: ${paramValue}\n`;
							}
						}
					}
				}
			}
			let templateValue = context["template"].replace("\n", "\\n");
			templateValue = templateValue.replace("\"", "\\\"");
			result += `Template: "${templateValue}"\n\n`;
			return result;
		}
		createContext() {
			return {
				"level": 0,
				"position": 0,
				"template": "",
				"address": null,
				"info": {},
				"hasError": false,
				"error": {
					"code": 0,
					"position": 0,
					"errors": [],
					"info": {}
				}
			};
		}
		clearContextInfo(context) {
			context["info"] = {};
			return context;
		}
		clearContextError(context) {
			context["hasError"] = false;
			context["error"] = {
				"code": 0,
				"position": 0,
				"errors": [],
				"info": {}
			};
			return context;
		}
		clearContextInfoAndError(context) {
			return this.clearContextError(this.clearContextInfo(context));
		}
		unescapeText(text) {
			let result = "";
			let i;
			for (i = 0; i < text.length; i++) {
				if (text[i] === "\\") {
					if (text.length - i > 1) {
						result += text[++i];
					}
				} else {
					result += text[i];
				}
			}
			return result;
		}
		parseGroupDelimiter(context) {
			// Capturing the group's separator
			const delimiterStartPosition = context["position"];
			//                [", ", [ADDRESS_LINE_1:N,ADDRESS_LINE_2,"Text",LOCALITY,ADM_LEVEL_2]]
			// Are looking for ^^^^
			const regEx = new RegExp(REGEX_GROUP_DELIMITER, "mg");
			regEx.lastIndex = delimiterStartPosition;
			const matches = regEx.exec(context["template"]);
			if (matches && matches.index === delimiterStartPosition) {
				context["info"] = {
					"position": delimiterStartPosition,
					"end": delimiterStartPosition + matches[0].length,
					"value": this.unescapeText(context["template"].substr(delimiterStartPosition + 1, matches[0].length - 2))
				};
				context["position"] = context["info"]["end"];
			} else {
				this.addContextError(context, ERR_PARSE_GROUP_DELIMITER, delimiterStartPosition);
			}
			return context;
		}
		parseFieldText(context) {
			const textBlockStartPosition = context["position"];
			// [", ", [ADDRESS_LINE_1:N,ADDRESS_LINE_2,"Text",LOCALITY,ADM_LEVEL_2]]
			// Are looking for                         ^^^^^^
			const regEx = new RegExp(REGEX_GROUP_FIELD_TEXT, "mg");
			regEx.lastIndex = textBlockStartPosition;
			const matches = regEx.exec(context["template"]);
			if (matches && matches.index === textBlockStartPosition) {
				context["info"] = {
					"type": "text",
					"position": textBlockStartPosition,
					"end": textBlockStartPosition + matches[0].length,
					"value": this.unescapeText(context["template"].substr(textBlockStartPosition + 1, matches[0].length - 2))
				};
				context["position"] = context["info"]["end"];
			} else {
				this.addContextError(context, ERR_PARSE_GROUP_FIELD_TEXT, textBlockStartPosition);
			}
			return context;
		}
		splitFieldName(fieldName) {
			const parts = fieldName.split(":");
			const namePart = parts[0];
			const modifiersPart = parts.length > 1 ? parts[1] : "";
			return [namePart, modifiersPart];
		}
		#isTemplateForFieldExists(fieldName) {
			return this.#format && this.#format.getTemplate(fieldName) !== null;
		}
		#getFieldValueByTemplate(fieldName, address) {
			if (!this.#isTemplateForFieldExists(fieldName)) {
				return null;
			}
			const template = this.#format.getTemplate(fieldName).template;
			const templateConverter = new StringTemplateConverter(template, this.#delimiter, this.#htmlEncode, this.#format);
			return templateConverter.convert(address);
		}
		#getAlterFieldValue(address, fieldType) {
			let localityValue = address.getFieldValue(AddressType.LOCALITY);
			localityValue = main_core.Type.isString(localityValue) ? localityValue : "";
			let result = address.getFieldValue(fieldType);
			if (!main_core.Type.isString(result)) {
				result = "";
			}
			if (result !== "" && localityValue !== "") {
				const localityValueUpper = localityValue.toUpperCase();
				const targetValueUpper = result.toUpperCase();
				if (targetValueUpper.length >= localityValueUpper.length) {
					const targetValueSubstr = targetValueUpper.substr(targetValueUpper.length - localityValueUpper.length);
					if (localityValueUpper === targetValueSubstr) {
						result = "";
					}
				}
			}
			return result;
		}
		getAddressFieldValue(address, fieldName, fieldModifiers) {
			let result = "";
			if (!main_core.Type.isUndefined(AddressType[fieldName])) {
				if (fieldName === "ADM_LEVEL_1" || fieldName === "ADM_LEVEL_2") {
					// Scratch "Province & Region by Locality"
					result = this.#getAlterFieldValue(address, AddressType[fieldName]);
				} else {
					result = address.getFieldValue(AddressType[fieldName]);
				}
				if (result === null) {
					result = this.#getFieldValueByTemplate(fieldName, address);
				}
			}
			if (!main_core.Type.isString(result)) {
				result = "";
			}
			if (result !== "") {
				if (fieldModifiers.indexOf("N") >= 0) {
					result = result.replace(/(\r\n|\n|\r)/g, "#S#");
				}
				if (fieldModifiers.indexOf("U") >= 0) {
					result = result.toUpperCase();
				}
			}
			return result;
		}
		parseFieldName(context) {
			const fieldNameStartPosition = context["position"];
			//          [", ", [ADDRESS_LINE_1:N,ADDRESS_LINE_2,"Text",LOCALITY,ADM_LEVEL_2]]
			// Are looking for  ^^^^^^^^^^^^^^^^
			const regEx = new RegExp(REGEX_GROUP_FIELD_NAME, "mg");
			regEx.lastIndex = fieldNameStartPosition;
			const matches = regEx.exec(context["template"]);
			if (matches && matches.index === fieldNameStartPosition) {
				context["position"] = fieldNameStartPosition + matches[0].length;
				const fieldParts = this.splitFieldName(matches[0]);
				const fieldName = fieldParts[0];
				const fieldModifiers = fieldParts[1];
				const fieldValue = this.getAddressFieldValue(context["address"], fieldName, fieldModifiers);
				context["info"] = {
					"type": "field",
					"position": fieldNameStartPosition,
					"end": context["position"],
					"modifiers": fieldModifiers,
					"name": fieldName,
					"value": fieldValue
				};
			} else {
				this.addContextError(context, ERR_PARSE_GROUP_FIELD_NAME, fieldNameStartPosition);
			}
			return context;
		}
		parseFieldListDelimiter(context) {
			const markerStartPosition = context["position"];
			// [", ", [ADDRESS_LINE_1:N , ADDRESS_LINE_2,"Text",LOCALITY,ADM_LEVEL_2]]
			// Are looking for         ^^^
			const regEx = new RegExp(REGEX_COMMA_AMONG_EMPTY_SPACE, "mg");
			regEx.lastIndex = markerStartPosition;
			const matches = regEx.exec(context["template"]);
			if (matches && matches.index === markerStartPosition) {
				context["position"] = markerStartPosition + matches[0].length;
			} else {
				this.addContextError(context, ERR_PARSE_GROUP_FIELD_LIST_DELIMITER, markerStartPosition);
			}
			return context;
		}
		parseFieldListEnd(context) {
			const markerStartPosition = context["position"];
			// [", ", [ADDRESS_LINE_1:N,ADDRESS_LINE_2,"Text",LOCALITY,ADM_LEVEL_2]]
			// Are looking for                                                    ^
			const regEx = new RegExp(REGEX_GROUP_FIELD_LIST_END, "mg");
			regEx.lastIndex = markerStartPosition;
			const matches = regEx.exec(context["template"]);
			if (matches && matches.index === markerStartPosition) {
				context["position"] = markerStartPosition + matches[0].length;
			} else {
				this.addContextError(context, ERR_PARSE_GROUP_FIELD_LIST_END, markerStartPosition);
			}
			return context;
		}
		parseField(context) {
			let fieldInfo = [];
			const fieldStartPosition = context["position"];
			const errors = [];

			// Checking for the presence of a text block
			context = this.parseFieldText(context);
			if (context["hasError"]) {
				this.unshiftError(errors, context["error"]["code"], context["error"]["position"]);
				context = this.clearContextInfoAndError(context);
				// Checking for the presence of a field name
				context = this.parseFieldName(context);
			}
			if (context["hasError"]) {
				this.unshiftError(errors, context["error"]["code"], context["error"]["position"]);
				context = this.clearContextInfoAndError(context);
				// Checking for the presence of a nested group
				context = this.parseGroup(context);
				if (context["hasError"]) {
					this.unshiftError(errors, context["error"]["code"], context["error"]["position"]);
				} else if (context["info"]["position"] > fieldStartPosition) {
					// Group found beyond the expected position
					this.addContextError(context, ERR_PARSE_GROUP_START_POSITION, fieldStartPosition);
					this.unshiftError(errors, context["error"]["code"], context["error"]["position"]);
				}
			}
			if (!context["hasError"]) {
				fieldInfo = context["info"];
				fieldInfo["isFieldListEnd"] = false;
				context = this.clearContextInfo(context);

				// Checking for the presence of a field separator
				context = this.parseFieldListDelimiter(context);
				if (context["hasError"]) {
					this.unshiftError(errors, context["error"]["code"], context["error"]["position"]);
					context = this.clearContextInfoAndError(context);
					// Checking for the presence of the end sign of the field list
					context = this.parseFieldListEnd(context);
					if (context["hasError"]) {
						this.unshiftError(errors, context["error"]["code"], context["error"]["position"]);
					} else {
						fieldInfo["isFieldListEnd"] = true;
					}
				}
			}
			if (context["hasError"]) {
				this.unshiftError(errors, ERR_PARSE_GROUP_FIELD, fieldStartPosition);
				this.addContextErrors(context, errors);
			} else {
				context["info"] = fieldInfo;
			}
			return context;
		}
		parseGroupFieldList(context) {
			const fieldListStartPosition = context["position"];
			const fieldValues = [];
			//            [", ", [ADDRESS_LINE_1:N,ADDRESS_LINE_2,"Text",LOCALITY,ADM_LEVEL_2]]
			// Are looking for ^^^
			const regEx = new RegExp(REGEX_PART_FROM_DELIMITER_TO_FIELD_LIST, "mg");
			regEx.lastIndex = fieldListStartPosition;
			const matches = regEx.exec(context["template"]);
			if (matches && matches.index === fieldListStartPosition) {
				context["position"] = fieldListStartPosition + matches[0].length;
				let isFieldListEnd = false;
				while (!(context["hasError"] || isFieldListEnd)) {
					context = this.parseField(context);
					if (!context["hasError"]) {
						isFieldListEnd = context["info"].hasOwnProperty("isFieldListEnd") && context["info"]["isFieldListEnd"];
						if (context["info"]["value"] !== "") {
							fieldValues.push(context["info"]["value"]);
						}
						context = this.clearContextInfo(context);
					}
				}
				if (!context["hasError"]) {
					context["info"] = {
						"fieldValues": fieldValues
					};
				}
			} else {
				this.addContextError(context, ERR_PARSE_PART_FROM_DELIMITER_TO_FIELD_LIST, fieldListStartPosition);
			}
			if (context["hasError"]) {
				this.addContextError(context, ERR_PARSE_GROUP_FIELD_LIST, fieldListStartPosition);
			}
			return context;
		}
		parseGroupStart(context) {
			//                 [", ", [ADDRESS_LINE_1:N,ADDRESS_LINE_2,"Text",LOCALITY,ADM_LEVEL_2]]
			// Are looking for ^^^^^^^^
			const regEx = new RegExp(REGEX_GROUP_PART_BEFORE_FIELDS, "mg");
			regEx.lastIndex = context["position"];
			const matches = regEx.exec(context["template"]);
			if (matches) {
				context["info"]["groupStartPosition"] = matches.index + matches[1].length;
				context["info"]["groupDelimiterStartPosition"] = matches.index + matches[1].length + matches[3].length;
			} else {
				this.addContextError(context, ERR_PARSE_GROUP_START, context["position"]);
			}
			return context;
		}
		parseGroupEnd(context) {
			const markerStartPosition = context["position"];
			// [", ", [ADDRESS_LINE_1:N,ADDRESS_LINE_2,"Text",LOCALITY,ADM_LEVEL_2]]
			// Are looking for                                                     ^
			const regEx = new RegExp(REGEX_GROUP_END, "mg");
			regEx.lastIndex = markerStartPosition;
			const matches = regEx.exec(context["template"]);
			if (matches && matches.index === markerStartPosition) {
				context["position"] = markerStartPosition + matches[0].length;
			} else {
				this.addContextError(context, ERR_PARSE_GROUP_END, markerStartPosition);
			}
			return context;
		}
		parseGroup(context) {
			const startSearchPosition = context["position"];
			let groupStartPosition = 0;
			let delimiterValue = "";
			let fieldValues = [];
			context["level"]++;

			// Checking for the presence of a start of a group
			context = this.parseGroupStart(context);
			if (!context["hasError"]) {
				// Found a sign of the beginning of a group
				groupStartPosition = context["info"]["groupStartPosition"];
				context["position"] = context["info"]["groupDelimiterStartPosition"];
				context = this.clearContextInfo(context);
				context = this.parseGroupDelimiter(context);
			}
			if (!context["hasError"]) {
				// The value of the group separator was got
				delimiterValue = context["info"]["value"];
				context = this.clearContextInfo(context);
				context = this.parseGroupFieldList(context);
			}
			if (!context["hasError"]) {
				// The values of the field list was got
				fieldValues = context["info"]["fieldValues"];
				context = this.clearContextInfo(context);
				context = this.parseGroupEnd(context);
			}
			if (!context["hasError"]) {
				// Kremlin,Moscow,Moscow,Russia,103132 -> Kremlin,Moscow,Russia,103132
				fieldValues = [...new Set(fieldValues)];
				let value = fieldValues.join(delimiterValue);

				// Kaliningrad, Narvskaya, 72, , kv 8 -> Kaliningrad, Narvskaya, 72, kv 8
				const reg = new RegExp(`(${delimiterValue}){2,}`, 'gim');
				value = value.replace(new RegExp(reg), delimiterValue);

				// The sign of the end of the group is received, the assembly of the group value.
				context["info"] = {
					"type": "group",
					"position": groupStartPosition,
					"end": context["position"],
					"value": value
				};
			}
			context["level"]--;
			if (context["hasError"]) {
				this.addContextError(context, ERR_PARSE_GROUP, startSearchPosition, {
					"groupStartPosition": groupStartPosition
				});
			}
			return context;
		}
		appendTextBlock(blocks, position, value) {
			let lastBlockIndex = blocks.length - 1;
			let lastBlock = lastBlockIndex >= 0 ? blocks[lastBlockIndex] : null;
			if (lastBlock && lastBlock.hasOwnProperty("type") && lastBlock["type"] === "text") {
				blocks[lastBlockIndex]["value"] += value;
				blocks[lastBlockIndex]["length"] += value.length;
			} else {
				blocks[++lastBlockIndex] = {
					"type": "text",
					"position": position,
					"length": value.length,
					"value": value
				};
			}
		}
		appendGroupBlock(blocks, position, value) {
			blocks.push({
				"type": "group",
				"position": position,
				"length": value.length,
				"value": value
			});
		}
		unshiftError(errors, code, position, info = null) {
			errors.unshift({
				"code": code,
				"position": position,
				"info": main_core.Type.isPlainObject(info) ? info : {}
			});
		}
		addContextError(context, code, position, info = null) {
			context["hasError"] = true;
			context["error"]["code"] = code;
			context["error"]["position"] = position;
			context["error"]["info"] = main_core.Type.isPlainObject(info) ? info : {};
			this.unshiftError(context["error"]["errors"], code, position, info);
		}
		addContextErrors(context, errors, info = null) {
			context["hasError"] = true;
			context["error"]["code"] = errors[0]["code"];
			context["error"]["position"] = errors[0]["position"];
			context["error"]["info"] = main_core.Type.isPlainObject(info) ? info : {};
			context["error"]["errors"].splice(0, 0, errors);
		}
		parseBlocks(context) {
			/* Variable for debug only
			let errorDisplayed = false;
			*/

			const blocks = [];
			const templateLength = context["template"].length;
			while (context["position"] < templateLength) {
				const blockStartPosition = context["position"];
				context = this.parseGroup(context);
				if (context["hasError"]) {
					// Debug info
					/*if (!errorDisplayed)
					{
						console.info(this.getErrorsText(context));
						errorDisplayed = true;
					}*/

					const errorInfo = context["error"]["info"];
					let blockLength;
					if (!main_core.Type.isPlainObject(errorInfo) && errorInfo.hasOwnProperty("groupStartPosition") && errorInfo["groupStartPosition"] > blockStartPosition) {
						blockLength = errorInfo["groupStartPosition"] - blockStartPosition + 1;
					} else {
						blockLength = 1;
					}
					this.appendTextBlock(blocks, context["error"]["position"], context["template"].substr(blockStartPosition, blockLength));
					context = this.clearContextInfoAndError(context);
					context["position"] = blockStartPosition + blockLength;
				} else {
					const groupStartPosition = context["info"]["position"];
					if (groupStartPosition > blockStartPosition) {
						this.appendTextBlock(blocks, blockStartPosition, context["template"].substr(blockStartPosition, groupStartPosition - blockStartPosition));
					}
					if (context["info"]["value"] !== "") {
						this.appendGroupBlock(blocks, groupStartPosition, context["info"]["value"]);
					}
					context = this.clearContextInfo(context);
				}
			}
			if (!context["hasError"]) {
				context["info"] = {
					"blocks": blocks
				};
			}
			return context;
		}
		convert(address) {
			let result = "";
			let context = this.createContext();
			context["template"] = this.#template;
			context["address"] = address;
			context = this.parseBlocks(context);
			if (!context["hasError"]) {
				const blocks = context["info"]["blocks"];
				for (let i = 0; i < blocks.length; i++) {
					if (blocks[i]["type"] === "text") {
						result += this.unescapeText(blocks[i]["value"]);
					} else {
						result += blocks[i]["value"];
					}
				}
			}
			if (result !== "") {
				const temp = result.split(STR_DELIMITER_PLACEHOLDER);
				let parts = [];
				for (let i = 0; i < temp.length; i++) {
					if (temp[i] !== "") {
						parts.push(temp[i]);
					}
				}
				if (this.#htmlEncode && parts.length > 0) {
					for (let i = 0; i < parts.length; i++) {
						parts[i] = main_core.Text.encode(parts[i]);
					}
				}
				result = parts.join(this.#delimiter);
			}
			return result;
		}
	}

	class StringConverter {
		static STRATEGY_TYPE_TEMPLATE = 'template';
		static STRATEGY_TYPE_TEMPLATE_COMMA = 'template_comma';
		static STRATEGY_TYPE_TEMPLATE_NL = 'template_nl';
		static STRATEGY_TYPE_TEMPLATE_BR = 'template_br';
		static STRATEGY_TYPE_FIELD_SORT = 'field_sort';
		static STRATEGY_TYPE_FIELD_TYPE = 'field_type';
		static CONTENT_TYPE_HTML = 'html';
		static CONTENT_TYPE_TEXT = 'text';
		/**
		 * Convert address to string
		 * @param {Address} address
		 * @param {Format} format
		 * @param {string} strategyType
		 * @param {string} contentType
		 * @returns {string}
		 */
		static convertAddressToString(address, format, strategyType, contentType) {
			let result;
			if (strategyType === StringConverter.STRATEGY_TYPE_TEMPLATE || strategyType === StringConverter.STRATEGY_TYPE_TEMPLATE_COMMA || strategyType === StringConverter.STRATEGY_TYPE_TEMPLATE_NL || strategyType === StringConverter.STRATEGY_TYPE_TEMPLATE_BR) {
				let delimiter = null;
				switch (strategyType) {
					case StringConverter.STRATEGY_TYPE_TEMPLATE_COMMA:
						delimiter = ', ';
						break;
					case StringConverter.STRATEGY_TYPE_TEMPLATE_NL:
						delimiter = '\n';
						break;
					case StringConverter.STRATEGY_TYPE_TEMPLATE_BR:
						delimiter = '<br />';
						break;
				}
				result = StringConverter.convertAddressToStringTemplate(address, format.getTemplate(), contentType, delimiter, format);
			} else if (strategyType === StringConverter.STRATEGY_TYPE_FIELD_SORT) {
				const fieldSorter = (a, b) => {
					return a.sort - b.sort;
				};
				result = StringConverter.convertAddressToStringByField(address, format, fieldSorter, contentType);
			} else if (strategyType === StringConverter.STRATEGY_TYPE_FIELD_TYPE) {
				const fieldSorter = (a, b) => {
					let sortResult;

					// We suggest that UNKNOWN must be the last
					if (a.type === 0) {
						sortResult = 1;
					} else if (b.type === 0) {
						sortResult = -1;
					} else {
						sortResult = a.type - b.type;
					}
					return sortResult;
				};
				result = StringConverter.convertAddressToStringByField(address, format, fieldSorter, contentType);
			} else {
				throw TypeError('Wrong strategyType');
			}
			return result;
		}

		/**
		 * Convert address to string
		 * @param {Address} address
		 * @param {string} template
		 * @param {string} contentType
		 * @param {string|null} delimiter
		 * @param {Format|null} format
		 * @returns {string}
		 */
		static convertAddressToStringTemplate(address, template, contentType, delimiter = null, format = null) {
			const needHtmlEncode = contentType === StringConverter.CONTENT_TYPE_HTML;
			if (delimiter === null) {
				delimiter = needHtmlEncode ? '<br />' : '\n';
			}
			const templateConverter = new StringTemplateConverter(template.template, delimiter, needHtmlEncode, format);
			return templateConverter.convert(address);
		}

		/**
		 * Convert address to string
		 * @param {Address} address
		 * @param {Format} format
		 * @param {Function} fieldSorter
		 * @param {string} contentType
		 * @returns {string}
		 */
		static convertAddressToStringByField(address, format, fieldSorter, contentType) {
			if (!(format instanceof Format)) {
				BX.debug('format must be instance of Format');
			}
			if (!(address instanceof Address)) {
				BX.debug('address must be instance of Address');
			}
			const fieldCollection = format.fieldCollection;
			if (!fieldCollection) {
				return '';
			}
			const fields = Object.values(fieldCollection.fields);

			// todo: make only once or cache?
			fields.sort(fieldSorter);
			let result = '';
			for (const field of fields) {
				let value = address.getFieldValue(field.type);
				if (value === null) {
					continue;
				}
				if (contentType === StringConverter.CONTENT_TYPE_HTML) {
					value = main_core.Text.encode(value);
				}
				if (result !== '') {
					result += format.delimiter;
				}
				result += value;
			}
			return result;
		}
	}

	class JsonConverter {
		/**
		 * @param {Object} jsonData
		 * @returns {Address}
		 */
		static convertJsonToAddress(jsonData) {
			return new Address(jsonData);
		}

		/**
		 * @param {Address} address
		 * @returns {{languageId: string, location: ({"'...'"}|null), id: number, fieldCollection: {"'...'"}}} Json data
		 */
		static convertAddressToJson(address) {
			const obj = {
				id: address.id,
				languageId: address.languageId,
				latitude: address.latitude,
				longitude: address.longitude,
				fieldCollection: JsonConverter.#objectifyFieldCollection(address.fieldCollection),
				links: JsonConverter.#objectifyLinks(address.links),
				location: null
			};
			if (address.location) {
				obj.location = JSON.parse(address.location.toJson());
			}
			return JSON.stringify(obj);
		}

		/**
		 * @param {AddressFieldCollection} fieldCollection
		 * @returns {Object}
		 */
		static #objectifyFieldCollection(fieldCollection) {
			const result = {};
			Object.values(fieldCollection.fields).forEach(field => {
				result[field.type] = field.value;
			});
			return result;
		}
		static #objectifyLinks(links) {
			return links.map(link => {
				return {
					entityId: link.entityId,
					entityType: link.entityType
				};
			});
		}
	}

	class Address {
		#id;
		#languageId;
		#latitude;
		#longitude;
		#fieldCollection;
		#links;
		#location;

		/**
		 * @param {{...}} props
		 */
		constructor(props) {
			if (main_core.Type.isUndefined(props.languageId)) {
				throw new TypeError('languageId must be defined');
			}
			this.#languageId = props.languageId;
			this.#id = props.id || 0;
			this.#latitude = props.latitude || '';
			this.#longitude = props.longitude || '';
			this.#fieldCollection = new AddressFieldCollection();
			if (main_core.Type.isObject(props.fieldCollection)) {
				for (const [type, value] of Object.entries(props.fieldCollection)) {
					this.setFieldValue(type, value);
				}
			}
			this.#links = new AddressLinkCollection();
			if (main_core.Type.isArray(props.links)) {
				for (const link of props.links) {
					this.addLink(link.entityId, link.entityType);
				}
			}
			this.#location = null;
			if (props.location) {
				if (props.location instanceof Location) {
					this.#location = props.location;
				} else if (main_core.Type.isObject(props.location)) {
					this.#location = new Location(props.location);
				} else {
					BX.debug('Wrong typeof props.location');
				}
			}
		}

		/**
		 * @returns {int}
		 */
		get id() {
			return this.#id;
		}

		/**
		 * @returns {Location}
		 */
		get location() {
			return this.#location;
		}

		/**
		 * @returns {string}
		 */
		get languageId() {
			return this.#languageId;
		}

		/**
		 * @returns {AddressFieldCollection}
		 */
		get fieldCollection() {
			return this.#fieldCollection;
		}

		/**
		 * @param {int} id
		 */
		set id(id) {
			this.#id = id;
		}

		/**
		 * @param {Location} location
		 */
		set location(location) {
			this.#location = location;
		}

		/**
		 * @returns {string}
		 */
		get latitude() {
			return this.#latitude;
		}

		/**
		 * @param {string} latitude
		 */
		set latitude(latitude) {
			this.#latitude = latitude;
		}

		/**
		 * @returns {string}
		 */
		get longitude() {
			return this.#longitude;
		}

		/**
		 * @param {string} longitude
		 */
		set longitude(longitude) {
			this.#longitude = longitude;
		}

		/**
		 * @returns {AddressLinkCollection}
		 */
		get links() {
			return this.#links.links;
		}

		/**
		 * @param {number} type
		 * @param {mixed} value
		 */
		setFieldValue(type, value) {
			this.#fieldCollection.setFieldValue(type, value);
		}

		/**
		 * @param {number} type
		 * @returns {?string}
		 */
		getFieldValue(type) {
			return this.#fieldCollection.getFieldValue(type);
		}

		/**
		 * Check if field exist
		 * @param type
		 * @returns {boolean}
		 */
		isFieldExists(type) {
			return this.#fieldCollection.isFieldExists(type);
		}

		/**
		 * @return {string} JSON
		 */
		toJson() {
			return JsonConverter.convertAddressToJson(this);
		}

		/**
		 * @param {Format}format
		 * @param {?string}strategyType
		 * @param {?string}contentType
		 * @return {string}
		 */
		toString(format, strategyType, contentType) {
			if (!(format instanceof Format)) {
				console.error('format must be instance of Format');
				return '';
			}
			const strategy = strategyType || StringConverter.STRATEGY_TYPE_TEMPLATE;
			const type = contentType || StringConverter.CONTENT_TYPE_HTML;
			return StringConverter.convertAddressToString(this, format, strategy, type);
		}

		/**
		 * @returns {?Location}
		 */
		toLocation() {
			let result = null;
			if (this.location) {
				const locationObj = JSON.parse(this.location.toJson());
				locationObj.address = JSON.parse(this.toJson());
				result = new Location(locationObj);
			}
			return result;
		}

		/**
		 * @return {number}
		 */
		getType() {
			return this.#fieldCollection.getMaxFieldType();
		}

		/**
		 * @param {string} entityId
		 * @param {string} entityType
		 */
		addLink(entityId, entityType) {
			this.#links.addLink(new AddressLink({
				entityId: entityId,
				entityType: entityType
			}));
		}
		clearLinks() {
			this.#links.clearLinks();
		}
	}

	class LocationField extends Field {
		#value;

		// todo: Fields validation
		constructor(props) {
			super(props);
			this.#value = props.value || '';
		}
		get value() {
			return this.#value;
		}
		set value(value) {
			this.#value = value;
		}
	}

	class LocationFieldCollection extends FieldCollection {
		getFieldValue(type) {
			let result = null;
			if (this.isFieldExists(type)) {
				const field = this.getField(type);
				if (field) {
					result = field.value;
				}
			}
			return result;
		}
		setFieldValue(type, value) {
			this.setField(new LocationField({
				type,
				value
			}));
			return this;
		}
	}

	class LocationObjectConverter {
		static convertLocationToObject(location) {
			if (!(location instanceof Location)) {
				throw new TypeError('location must be type of location');
			}
			const obj = {
				id: location.id,
				code: location.code,
				externalId: location.externalId,
				sourceCode: location.sourceCode,
				type: location.type,
				name: location.name,
				languageId: location.languageId,
				latitude: location.latitude,
				longitude: location.longitude,
				fieldCollection: LocationObjectConverter.#objectifyFieldCollection(location.fieldCollection),
				address: null
			};
			if (location.address) {
				obj.address = JSON.parse(location.address.toJson());
			}
			return obj;
		}
		static #objectifyFieldCollection(fieldCollection) {
			let result = {};
			Object.values(fieldCollection.fields).forEach(field => {
				result[field.type] = field.value;
			});
			return result;
		}
	}

	class LocationJsonConverter {
		/**
		 * @param {{...}}jsonData
		 * @returns {Location}
		 */
		static convertJsonToLocation(jsonData) {
			const initData = {
				...jsonData
			};
			if (jsonData.address) {
				initData.address = new Address(jsonData.address);
			}
			return new Location(initData);
		}

		/**
		 * @param {Location} location
		 * @returns {{...}}
		 */
		static convertLocationToJson(location) {
			if (!(location instanceof Location)) {
				throw new TypeError('location must be type of location');
			}
			const obj = LocationObjectConverter.convertLocationToObject(location);
			return obj ? JSON.stringify(obj) : '';
		}
	}

	class Location {
		#id;
		#code;
		#externalId;
		#sourceCode;
		#type;
		#name;
		#languageId;
		#latitude;
		#longitude;
		#address;
		#fieldCollection;
		constructor(props = {}) {
			this.#id = parseInt(props.id) || 0;
			this.#code = props.code || '';
			this.#externalId = props.externalId || '';
			this.#sourceCode = props.sourceCode || '';
			this.#type = parseInt(props.type) || 0;
			this.#name = props.name || '';
			this.#languageId = props.languageId || '';
			this.#latitude = props.latitude || '';
			this.#longitude = props.longitude || '';
			this.#fieldCollection = new LocationFieldCollection();
			if (main_core.Type.isObject(props.fieldCollection)) {
				for (const [type, value] of Object.entries(props.fieldCollection)) {
					this.setFieldValue(type, value);
				}
			}
			this.#address = null;
			if (props.address) {
				if (props.address instanceof Address) {
					this.#address = props.address;
				} else if (typeof props.address === 'object') {
					this.#address = new Address(props.address);
				} else {
					BX.debug('Wrong typeof props.address');
				}
			}
		}
		get id() {
			return this.#id;
		}
		get code() {
			return this.#code;
		}
		get externalId() {
			return this.#externalId;
		}
		get sourceCode() {
			return this.#sourceCode;
		}
		get type() {
			return this.#type;
		}
		get name() {
			return this.#name;
		}
		get languageId() {
			return this.#languageId;
		}
		set id(value) {
			this.#id = value;
		}
		set code(code) {
			this.#code = code;
		}
		set externalId(value) {
			this.#externalId = value;
		}
		set sourceCode(value) {
			this.#sourceCode = value;
		}
		set type(value) {
			this.#type = value;
		}
		set name(value) {
			this.#name = value;
		}
		set languageId(value) {
			this.#languageId = value;
		}
		get latitude() {
			return this.#latitude;
		}
		set latitude(latitude) {
			this.#latitude = latitude;
		}
		get longitude() {
			return this.#longitude;
		}
		set longitude(longitude) {
			this.#longitude = longitude;
		}
		set address(address) {
			this.#address = address;
		}
		get address() {
			return this.#address;
		}
		toJson() {
			return LocationJsonConverter.convertLocationToJson(this);
		}
		toAddress() {
			let result = null;
			if (this.address) {
				const addressObj = JSON.parse(this.address.toJson());
				addressObj.location = JSON.parse(this.toJson());
				result = new Address(addressObj);
			}
			return result;
		}
		get fieldCollection() {
			return this.#fieldCollection;
		}
		setFieldValue(type, value) {
			this.#fieldCollection.setFieldValue(type, value);
		}
		getFieldValue(type) {
			return this.#fieldCollection.getFieldValue(type);
		}
		isFieldExists(type) {
			return this.#fieldCollection.isFieldExists(type);
		}
		hasExternalRelation() {
			return this.#externalId && this.#sourceCode;
		}
	}

	class ActionRunner {
		#path = '';
		constructor(props) {
			if (!props.path) {
				throw new Error('props.path must not be empty!');
			}
			this.#path = props.path;
		}
		run(action, data) {
			if (!action) {
				throw new Error('action can not be empty!');
			}
			return BX.ajax.runAction(`${this.#path}.${action}`, {
				data
			});
		}
	}

	class BaseRepository {
		#actionRunner = null;
		constructor(props = {}) {
			this._path = props.path;
			if (props.actionRunner && props.actionRunner instanceof ActionRunner) {
				this.#actionRunner = props.actionRunner;
			} else {
				this.#actionRunner = new ActionRunner({
					path: this._path
				});
			}
		}
		get path() {
			return this._path;
		}
		get actionRunner() {
			return this.#actionRunner;
		}
		processResponse(response) {
			if (response.status !== 'success') {
				BX.debug('Request was not successful');
				let message = '';
				if (Array.isArray(response.errors) && response.errors.length > 0) {
					for (const error of response.errors) {
						if (typeof error.message === 'string' && error.message !== '') {
							message += `${error}\n`;
						}
					}
				}
				throw new Error(message);
			}
			return response.data ? response.data : null;
		}
	}

	class LocationRepository extends BaseRepository {
		constructor(props = {}) {
			props.path = props.path || 'location.api.location';
			super(props);
		}
		findByExternalId(externalId, sourceCode, languageId) {
			if (!externalId || !sourceCode || !languageId) {
				throw new Error('externalId and sourceCode and languageId must be defined');
			}
			return this.actionRunner.run('findByExternalId', {
				externalId: externalId,
				sourceCode: sourceCode,
				languageId: languageId
			}).then(this.processResponse.bind(this)).then(this.#convertLocation.bind(this));
		}
		findById(locationId, languageId) {
			if (!locationId || !languageId) {
				throw new Error('locationId and languageId must be defined');
			}
			return this.actionRunner.run('findById', {
				id: locationId,
				languageId: languageId
			}).then(this.processResponse.bind(this)).then(this.#convertLocation.bind(this));
		}
		#convertLocation(locationData) {
			if (!locationData) {
				return null;
			}
			if (typeof locationData !== 'object') {
				throw new Error('Can\'t convert location data');
			}
			return LocationJsonConverter.convertJsonToLocation(locationData);
		}
	}

	class AddressRepository extends BaseRepository {
		constructor(props = {}) {
			props.path = 'location.api.address';
			super(props);
		}
		findById(addressId) {
			if (addressId <= 0) {
				throw new Error('addressId must be more than zero');
			}
			return this.actionRunner.run('findById', {
				addressId: addressId
			}).then(this.processResponse).then(address => {
				// address json data or null
				let result = null;
				if (address) {
					result = this.convertJsonToAddress(address);
				}
				return result;
			});
		}
		save(address) {
			if (!address) {
				throw new Error('address must be defined');
			}
			return this.actionRunner.run('save', {
				address: address
			}).then(this.processResponse).then(response => {
				//Address json data
				let result = null;
				if (typeof response === 'object') {
					result = this.convertJsonToAddress(response);
				}
				return result;
			});
		}
		convertJsonToAddress(jsonData) {
			return new location_core.Address(jsonData);
		}
	}

	/**
	 * Class responsible for the addresses format obtaining.
	 */
	class FormatRepository extends BaseRepository {
		constructor(props = {}) {
			props.path = 'location.api.format';
			super(props);
		}

		/**
		 * Find all available formats
		 * @param {string} languageId
		 * @returns {Promise}
		 */
		findAll(languageId) {
			if (!main_core.Type.isString(languageId)) {
				throw new TypeError('languageId must be type of string');
			}
			return this.actionRunner.run('findAll', {
				languageId: languageId
			}).then(this.processResponse).then(data => this.convertFormatCollection(data));
		}

		/**
		 * Find address format by its code
		 * @param {string} formatCode
		 * @param {string} languageId
		 * @returns {Promise}
		 */
		findByCode(formatCode, languageId) {
			if (!main_core.Type.isString(formatCode)) {
				throw new TypeError('formatCode must be type of string');
			}
			if (!main_core.Type.isString(languageId)) {
				throw new TypeError('languageId must be type of string');
			}
			return this.actionRunner.run('findByCode', {
				formatCode: formatCode,
				languageId: languageId
			}).then(this.processResponse).then(this.convertFormatData);
		}

		/**
		 * Find default address format
		 * @param {string} languageId
		 * @returns {Promise}
		 */
		findDefault(languageId) {
			if (!main_core.Type.isString(languageId)) {
				throw new TypeError('languageId must be type of string');
			}
			return this.actionRunner.run('findDefault', {
				languageId: languageId
			}).then(this.processResponse).then(this.convertFormatData);
		}
		convertFormatCollection(formatDataCollection) {
			if (!main_core.Type.isArray(formatDataCollection)) {
				throw new TypeError('Can\'t convert format collection data');
			}
			let result = [];
			formatDataCollection.forEach(format => {
				result.push(this.convertFormatData(format));
			});
			return result;
		}
		convertFormatData(formatData) {
			if (!main_core.Type.isObject(formatData)) {
				throw new TypeError('Can\'t convert format data');
			}
			return new Format(formatData);
		}
	}

	class SourceRepository extends BaseRepository {
		constructor(props = {}) {
			props.path = 'location.api.source';
			super(props);
		}
		getProps() {
			return this.actionRunner.run('getProps', {}).then(this.processResponse);
		}
	}

	/**
	 * Autocomplete search parameters
	 */

	/**
	 * Base class for the source autocomplete services.
	 */
	class AutocompleteServiceBase {
		/**
		 * @param {String} text
		 * @param {AutocompleteServiceParams} params
		 */
		// eslint-disable-next-line no-unused-vars
		autocomplete(text, params) {
			throw new Error('Method autocomplete() Must be implemented');
		}
	}

	const MAX_ITEMS_CNT = 100;
	const MAX_SIZE_IN_BYTES = 5 * 1024 * 1024;
	const CACHE_TTL = 3600;
	class AutocompleteCache {
		static set(sourceCode, params, data) {
			const results = AutocompleteCache.#getAll(sourceCode);
			results.push({
				hash: AutocompleteCache.#makeParamsHash(params),
				data: data
			});
			BX.localStorage.set(AutocompleteCache.#getStorageName(sourceCode), AutocompleteCache.#getResultsToStore(results), CACHE_TTL);
		}
		static get(sourceCode, params) {
			const hash = AutocompleteCache.#makeParamsHash(params);
			const results = AutocompleteCache.#getAll(sourceCode);
			for (const result of results) {
				if (result && result.hash === hash) {
					return result;
				}
			}
			return null;
		}
		static #getResultsToStore(results) {
			if (new Blob([JSON.stringify(results)]).size > MAX_SIZE_IN_BYTES) {
				return [];
			}
			if (results.length > MAX_ITEMS_CNT) {
				return results.slice(results.length - MAX_ITEMS_CNT);
			}
			return results;
		}
		static #getAll(sourceCode) {
			const currentResults = BX.localStorage.get(AutocompleteCache.#getStorageName(sourceCode));
			return Array.isArray(currentResults) ? currentResults : [];
		}
		static #makeParamsHash(params) {
			return main_md5.md5(JSON.stringify(params));
		}
		static #getStorageName(sourceCode) {
			return `location${sourceCode}AutocompleteCache`;
		}
	}

	class PhotoServiceBase {
		requestPhotos(props) {
			throw new Error('Must be implemented');
		}
	}

	/**
	 * Base class for source maps
	 */
	class MapBase extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.Location.Core.MapBase');
		}
		render(props) {
			throw new Error('Must be implemented');
		}
		set location(location) {
			throw new Error('Must be implemented');
		}
		panTo(latitude, longitude) {
			throw new Error('Must be implemented');
		}
		set mode(mode) {
			throw new Error('Must be implemented');
		}
		set zoom(zoom) {
			throw new Error('Must be implemented');
		}
		static getZoomByLocation(location) {
			const defaultZoom = 18;
			if (!location) {
				return defaultZoom;
			}
			const locationType = location.type;
			if (locationType <= 0) {
				return defaultZoom;
			}
			if (locationType < location_core.LocationType.COUNTRY) {
				return 1;
			} else if (locationType === location_core.LocationType.COUNTRY) {
				return 4;
			} else if (locationType <= location_core.LocationType.ADM_LEVEL_1) {
				return 6;
			} else if (locationType <= location_core.LocationType.LOCALITY) {
				return 11;
			} else if (locationType <= location_core.LocationType.STREET) {
				return 16;
			}
			return defaultZoom;
		}
		onLocationChangedEventSubscribe(listener) {
			throw new Error('Must be implemented');
		}
		onMapShow() {}
		destroy() {}
	}

	/**
	 * Base class for the sources
	 */
	class SourceBase {
		get sourceCode() {
			throw new Error('Must be implemented');
		}
		get map() {
			throw new Error('Must be implemented');
		}
		get autocompleteService() {
			throw new Error('Must be implemented');
		}
		get photoService() {
			throw new Error('Must be implemented');
		}
		get geocodingService() {
			throw new Error('Must be implemented');
		}
	}

	/**
	 * Base class for the source geocoding service
	 */
	class GeocodingServiceBase {
		geocode(addressString) {
			if (!addressString) {
				return Promise.resolve([]);
			}
			return this.geocodeConcrete(addressString);
		}
		geocodeConcrete(addressString) {
			throw new Error('Method geocodeConcrete() must be implemented');
		}
	}

	class ControlMode {
		static get edit() {
			return 'edit';
		}
		static get view() {
			return 'view';
		}
		static isValid(mode) {
			return mode === ControlMode.edit || mode === ControlMode.view;
		}
	}

	class LocationFieldType {
		static POSTAL_CODE = 50;
		static ISO_3166_1_ALPHA_2 = 1000;
	}

	class SourceCreationError extends Error {}
	class MethodNotImplemented extends Error {}

	class ErrorPublisher extends main_core_events.EventEmitter {
		static #instance = null;
		static #onErrorEvent = 'onError';
		static getInstance() {
			if (ErrorPublisher.#instance === null) {
				ErrorPublisher.#instance = new ErrorPublisher();
			}
			return ErrorPublisher.#instance;
		}
		constructor() {
			super();
			this.setEventNamespace('BX.Location.Core.ErrorPublisher');
		}
		notify(errors) {
			this.emit(ErrorPublisher.#onErrorEvent, {
				errors
			});
		}
		subscribe(listener) {
			super.subscribe(ErrorPublisher.#onErrorEvent, listener);
		}
	}

	class Storage {
		#lastAddressLocalStorageKey = `bitrixLocationLastAddress`;
		static #instance = null;
		static getInstance() {
			if (Storage.#instance === null) {
				Storage.#instance = new Storage();
			}
			return Storage.#instance;
		}
		set lastAddress(address) {
			if (address) {
				BX.localStorage.set(this.#lastAddressLocalStorageKey, {
					'json': address.toJson()
				}, 86400 * 30);
			}
		}
		get lastAddress() {
			const lastAddress = BX.localStorage.get(this.#lastAddressLocalStorageKey);
			if (lastAddress && lastAddress['json']) {
				try {
					return JsonConverter.convertJsonToAddress(JSON.parse(lastAddress['json']));
				} catch (e) {}
			}
			return null;
		}
	}

	/**
	 * Base class for the working with latitude and longitude
	 */
	class Point {
		/** {String} */
		#latitude;
		/** {String} */
		#longitude;
		constructor(latitude, longitude) {
			this.#latitude = latitude;
			this.#longitude = longitude;
		}
		get latitude() {
			return this.#latitude;
		}
		get longitude() {
			return this.#longitude;
		}
		toArray() {
			return [this.latitude, this.longitude];
		}
		static fromJson(jsonData) {
			return new Point(jsonData.latitude, jsonData.longitude);
		}
	}

	class DistanceCalculator {
		/**
		 * @param {number} lat1
		 * @param {number} lon1
		 * @param {number} lat2
		 * @param {number} lon2
		 * @returns {number}
		 */
		static getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
			const R = 6371; // Radius of the earth in km
			const dLat = DistanceCalculator.deg2rad(lat2 - lat1);
			const dLon = DistanceCalculator.deg2rad(lon2 - lon1);
			const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(DistanceCalculator.deg2rad(lat1)) * Math.cos(DistanceCalculator.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return R * c;
		}

		/**
		 * @param {number} deg
		 * @returns {number}
		 */
		static deg2rad(deg) {
			return deg * (Math.PI / 180);
		}
	}

	const CheckInMapEventType = {
		MAP_LOADED: 'mapLoaded',
		PAGE_WITH_MAP_LOADED: 'pageWithMapLoaded',
		MARKER_CLICKED: 'markerClicked',
		CLUSTER_CLICKED: 'clusterClicked'
	};

	const CheckInMapCommandType = {
		INIT_MAP: 'initMap',
		ADD_MARKERS: 'addMarkers',
		REMOVE_MARKERS: 'removeMarkers',
		CLEAR_MARKERS: 'clearMarkers',
		ADD_LAYERS: 'addLayers',
		REMOVE_LAYERS: 'removeLayers',
		CLEAR_LAYERS: 'clearLayers',
		FIT_BOUNDS: 'fitBounds',
		SET_ZOOM: 'setZoom',
		ZOOM_IN: 'zoomIn',
		ZOOM_OUT: 'zoomOut',
		FIT_TO_LAYERS: 'fitToLayers',
		ENABLE_CLUSTERING: 'enableClustering',
		DISABLE_CLUSTERING: 'disableClustering',
		UPDATE_CLUSTER_ICON: 'updateClusterIcon',
		UPDATE_SETTINGS: 'updateSettings',
		SET_GRAYSCALE: 'setGrayscale'
	};

	/**
	 * Base abstract class for map services.
	 * All methods must be implemented in derived classes.
	 */
	class CheckInMapServiceBase {
		/**
		 * Initialize the map with provided props.
		 * @param {Object} props - Initialization properties
		 * @param {String} [props.containerId] - Map container selector
		 * @param {Array} [props.mapCenter] - Initial map center coordinates [lat, lng]
		 * @param {Number} [props.mapZoom] - Initial zoom level
		 * @param {String} [props.zoomControlPosition] - Position of zoom control
		 * @param {Array} [props.fitBoundsPadding] - Default padding for fitBounds
		 * @param {Number} [props.fitBoundsMaxZoom] - Default max zoom for fitBounds
		 */
		init(props) {
			throw new Error('Must be implemented');
		}

		/**
		 * Destroy the map instance and clean up resources.
		 * Removes all markers, layers, and the map instance itself.
		 */
		destroy() {
			throw new Error('Must be implemented');
		}

		/**
		 * Add multiple markers to the map at once.
		 * @param {Array<Object>} markers - Array of marker objects
		 * @param {String|Number} markers[].id - Unique marker identifier
		 * @param {Object} markers[].config - Marker configuration
		 * @param {Array} markers[].config.coords - Marker coordinates [lat, lng]
		 * @param {Object} markers[].config.icon - Icon configuration
		 * @param {String} markers[].config.icon.html - HTML content for icon
		 * @param {String} markers[].config.icon.className - CSS class for icon
		 * @param {Array} markers[].config.icon.iconSize - Icon size [width, height]
		 * @param {Array} markers[].config.icon.iconAnchor - Icon anchor point [x, y]
		 */
		addMarkers(markers) {
			throw new Error('Must be implemented');
		}

		/**
		 * Remove markers from the map by their identifiers.
		 * @param {Array<String|Number>} ids - Array of marker identifiers to remove
		 */
		removeMarkers(ids) {
			throw new Error('Must be implemented');
		}

		/**
		 * Remove all markers from the map.
		 */
		clearMarkers() {
			throw new Error('Must be implemented');
		}

		/**
		 * Add multiple layers to the map at once.
		 * @param {Array<Object>} layers - Array of layer objects
		 * @param {String|Number} layers[].id - Unique layer identifier
		 * @param {Object} layers[].config - Layer configuration
		 * @param {String} layers[].config.type - Layer type: 'polyline', 'polygon', or 'circle'
		 * @param {Array<Array>} layers[].config.points - Array of coordinate points [[lat, lng], ...]
		 * @param {Object} layers[].config.options - Layer styling options
		 * @param {String} [layers[].config.options.color] - Line/fill color
		 * @param {Number} [layers[].config.options.weight] - Line weight
		 * @param {Number} [layers[].config.options.opacity] - Opacity (0-1)
		 * @param {String} [layers[].config.options.dashArray] - Dash pattern for lines
		 */
		addLayers(layers) {
			throw new Error('Must be implemented');
		}

		/**
		 * Remove layers from the map by their identifiers.
		 * @param {Array<String|Number>} ids - Array of layer identifiers to remove
		 */
		removeLayers(ids) {
			throw new Error('Must be implemented');
		}

		/**
		 * Remove all layers from the map.
		 */
		clearLayers() {
			throw new Error('Must be implemented');
		}

		/**
		 * Fit map view to contain all provided bounds.
		 * @param {Array<Array>} bounds - Array of coordinate points [[lat, lng], ...]
		 * @param {Object} [options={}] - Fit bounds options
		 * @param {Array} [options.padding] - Padding around bounds [top/bottom, left/right]
		 * @param {Number} [options.maxZoom] - Maximum zoom level to use
		 */
		fitBounds(bounds, options = {}) {
			throw new Error('Must be implemented');
		}

		/**
		 * Set the map zoom level.
		 * @param {Number} zoom - Zoom level to set
		 */
		setZoom(zoom) {
			throw new Error('Must be implemented');
		}

		/**
		 * Increase map zoom by one level.
		 */
		zoomIn() {
			throw new Error('Must be implemented');
		}

		/**
		 * Decrease map zoom by one level.
		 */
		zoomOut() {
			throw new Error('Must be implemented');
		}

		/**
		 * Fit map view to contain all currently added layers.
		 * @param {Number|null} [maxZoom=null] - Maximum zoom level to use
		 */
		fitToLayers(maxZoom = null) {
			throw new Error('Must be implemented');
		}

		/**
		 * Enable automatic marker clustering based on zoom level and pixel distance.
		 * @param {Object} [options={}]
		 * @param {Number} [options.maxClusterRadius=80] - Pixel radius for grouping markers into a cluster
		 * @param {Function} [options.clusterIconFactory] - Custom factory: (count) => { html, className, iconSize, iconAnchor }
		 */
		enableClustering(options = {}) {
			throw new Error('Must be implemented');
		}

		/**
		 * Disable marker clustering and restore individual markers.
		 */
		disableClustering() {
			throw new Error('Must be implemented');
		}

		/**
		 * Get the stored config for a marker by its ID.
		 * @param {String|Number} id - Marker identifier
		 * @returns {Object|null}
		 */
		getMarkerConfig(id) {
			throw new Error('Must be implemented');
		}

		/**
		 * Update the icon of a cluster identified by its member marker IDs.
		 * @param {Array<String|Number>} markerIds - IDs of the markers in the cluster
		 * @param {Object} iconConfig - Icon configuration { html, className, iconSize, iconAnchor }
		 */
		setClusterIcon(markerIds, iconConfig) {
			throw new Error('Must be implemented');
		}

		/**
		 * Update map settings after initialization.
		 * @param {Object} props
		 * @param {Array<Number>} [props.fitBoundsPadding] - [vertical, horizontal] or [top, right, bottom, left]
		 * @param {Number} [props.fitBoundsMaxZoom] - Range: 0..22
		 */
		updateSettings(props) {
			throw new Error('Must be implemented');
		}

		/**
		 * Enable or disable grayscale filter on the map tiles.
		 * Markers and layers remain unaffected.
		 * @param {boolean} enabled
		 */
		setGrayscale(enabled) {
			throw new Error('Must be implemented');
		}
	}

	exports.Address = Address;
	exports.AddressRepository = AddressRepository;
	exports.AddressStringConverter = StringConverter;
	exports.AddressType = AddressType;
	exports.AutocompleteCache = AutocompleteCache;
	exports.AutocompleteServiceBase = AutocompleteServiceBase;
	exports.BaseSource = SourceBase;
	exports.CheckInMapEventType = CheckInMapEventType;
	exports.CheckInMapServiceBase = CheckInMapServiceBase;
	exports.CheckinMapCommandType = CheckInMapCommandType;
	exports.ControlMode = ControlMode;
	exports.DistanceCalculator = DistanceCalculator;
	exports.ErrorPublisher = ErrorPublisher;
	exports.Format = Format;
	exports.FormatRepository = FormatRepository;
	exports.FormatTemplate = FormatTemplate;
	exports.FormatTemplateCollection = FormatTemplateCollection;
	exports.FormatTemplateType = FormatTemplateType;
	exports.GeocodingServiceBase = GeocodingServiceBase;
	exports.Location = Location;
	exports.LocationFieldType = LocationFieldType;
	exports.LocationJsonConverter = LocationJsonConverter;
	exports.LocationRepository = LocationRepository;
	exports.LocationType = LocationType;
	exports.MapBase = MapBase;
	exports.MethodNotImplemented = MethodNotImplemented;
	exports.PhotoServiceBase = PhotoServiceBase;
	exports.Point = Point;
	exports.SourceCreationError = SourceCreationError;
	exports.SourceRepository = SourceRepository;
	exports.Storage = Storage;

})(this.BX.Location.Core = this.BX.Location.Core || {}, BX, BX.Location.Core, BX, BX.Event);
//# sourceMappingURL=core.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, bp_field_type, main_popup, main_date, ui_buttons, ui_forms, ui_iconSet_actions, ui_hint, main_core_events) {
	'use strict';

	class Operator {
		static EMPTY = 'empty';
		static NOT_EMPTY = '!empty';
		static EQUAL = '=';
		static NOT_EQUAL = '!=';
		static CONTAIN = 'contain';
		static NOT_CONTAIN = '!contain';
		static IN = 'in';
		static NOT_IN = '!in';
		static GREATER_THEN = '>';
		static GREATER_THEN_OR_EQUAL = '>=';
		static LESS_THEN = '<';
		static LESS_THEN_OR_EQUAL = '<=';
		static MODIFIED = 'modified';
		static BETWEEN = 'between';
		static getAll() {
			return [this.NOT_EMPTY, this.EMPTY, this.EQUAL, this.NOT_EQUAL, this.CONTAIN, this.NOT_CONTAIN, this.IN, this.NOT_IN, this.GREATER_THEN, this.GREATER_THEN_OR_EQUAL, this.LESS_THEN, this.LESS_THEN_OR_EQUAL, this.MODIFIED, this.BETWEEN];
		}
		static getAllLabels() {
			return Object.fromEntries([[this.EMPTY, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_EMPTY')], [this.NOT_EMPTY, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_NOT_EMPTY')], [this.EQUAL, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_EQ')], [this.NOT_EQUAL, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_NE')], [this.CONTAIN, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_CONTAIN')], [this.NOT_CONTAIN, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_NOT_CONTAIN')], [this.IN, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_IN')], [this.NOT_IN, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_NOT_IN')], [this.GREATER_THEN, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_GT')], [this.GREATER_THEN_OR_EQUAL, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_GTE')], [this.LESS_THEN, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_LT')], [this.LESS_THEN_OR_EQUAL, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_LTE')], [this.BETWEEN, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_BETWEEN')], [this.MODIFIED, main_core.Loc.getMessage('BIZPROC_JS_CONDITION_MODIFIED')]]);
		}
		static getOperatorLabel(operator) {
			return this.getAllLabels()[operator] ?? '';
		}
		static getOperatorFieldTypeFilter(operator, isRobot = false) {
			if (!this.getAll().includes(operator)) {
				return [];
			}
			if (operator === this.BETWEEN) {
				return ['int', 'double', 'date', 'datetime', 'time'];
			}
			return [];
		}
		static getAllSortedForBp() {
			return [this.EQUAL, this.NOT_EQUAL, this.GREATER_THEN, this.GREATER_THEN_OR_EQUAL, this.LESS_THEN, this.LESS_THEN_OR_EQUAL, this.IN, this.NOT_IN, this.CONTAIN, this.NOT_CONTAIN, this.NOT_EMPTY, this.EMPTY, this.MODIFIED, this.BETWEEN];
		}
		static getOperatorsWithoutRenderValue() {
			return [this.EMPTY, this.NOT_EMPTY, this.MODIFIED];
		}
	}

	class BpCondition {
		#operator = Operator.EQUAL;
		#operatorName = '';
		#valueName = '';
		#value;
		#documentType;
		#useModified = false;
		#operatorElement;
		#valueElement;
		#lastFieldProperty;
		constructor(parameters) {
			if (!main_core.Type.isPlainObject(parameters)) {
				return;
			}
			if (Operator.getAll().includes(parameters.operator)) {
				this.#operator = parameters.operator;
			}
			if (main_core.Type.isStringFilled(parameters.selectName)) {
				this.#operatorName = parameters.selectName;
			}
			if (main_core.Type.isStringFilled(parameters.inputName)) {
				this.#valueName = parameters.inputName;
			}
			if (main_core.Type.isBoolean(parameters.useOperatorModified)) {
				this.#useModified = parameters.useOperatorModified;
			}
			this.#value = parameters.value;
			this.#documentType = parameters.documentType;
		}
		renderOperator(fieldType) {
			const select = main_core.Tag.render`<select name="${main_core.Text.encode(this.#operatorName)}"></select>`;
			main_core.Event.bind(select, 'change', this.#onChangeOperator.bind(this));
			this.#getFilteredOperatorsByFieldType(fieldType).forEach(operator => {
				main_core.Dom.append(main_core.Tag.render`
					<option value="${main_core.Text.encode(operator)}"${this.#operator === operator ? ' selected' : ''}>
						${main_core.Text.encode(Operator.getOperatorLabel(operator))}
					</option>
				`, select);
			});
			this.#operatorElement = select;
			return main_core.Tag.render`
			<tr>
				<td align="right" width="40%" class="adm-detail-content-cell-l">
					${main_core.Loc.getMessage('BIZPROC_JS_CONDITION')}
				</td>
				<td width="60%" class="adm-detail-content-cell-r">
					${select}
				</td>
			</tr>
		`;
		}
		#onChangeOperator(event) {
			const select = event.target;
			const previousOperator = String(this.#operator);
			this.#operator = select.selectedOptions[0].value;
			const valueRow = this.#valueElement.closest('tr');
			if (Operator.getOperatorsWithoutRenderValue().includes(this.#operator)) {
				if (main_core.Dom.isShown(valueRow)) {
					main_core.Dom.hide(valueRow);
				}
				return;
			}
			if (!main_core.Dom.isShown(valueRow)) {
				main_core.Dom.show(valueRow);
			}
			const needRerender = previousOperator === Operator.BETWEEN || this.#operator === Operator.BETWEEN || Operator.getOperatorsWithoutRenderValue().includes(previousOperator);
			if (needRerender) {
				this.rerenderValue(this.#lastFieldProperty);
			}
		}
		rerenderOperator(fieldType) {
			const filterOperators = this.#getFilteredOperatorsByFieldType(fieldType);
			if (this.#operatorElement.options.length === filterOperators.length) {
				return;
			}
			main_core.Dom.clean(this.#operatorElement);
			filterOperators.forEach(operator => {
				main_core.Dom.append(main_core.Tag.render`
					<option value="${main_core.Text.encode(operator)}"${this.#operator === operator ? ' selected' : ''}>
						${main_core.Text.encode(Operator.getOperatorLabel(operator))}
					</option>
				`, this.#operatorElement);
			});
			this.#operator = this.#operatorElement.selectedOptions[0].value;
		}
		#getFilteredOperatorsByFieldType(fieldType) {
			return Operator.getAllSortedForBp().filter(operator => {
				if (!this.#useModified && operator === Operator.MODIFIED) {
					return false;
				}
				if (fieldType === 'document') {
					return operator === Operator.EMPTY || operator === Operator.NOT_EMPTY;
				}
				const filterFields = Operator.getOperatorFieldTypeFilter(operator);

				// todo: white list
				return filterFields.length === 0 || filterFields.includes(fieldType);
			});
		}
		renderOperatorTo(fieldType, to) {
			main_core.Dom.append(this.renderOperator(fieldType), to);
		}
		renderValue(fieldProperty) {
			this.#lastFieldProperty = fieldProperty;
			this.#valueElement = this.#operator === Operator.BETWEEN ? this.#renderBetweenValue(fieldProperty, this.#value) : this.#getFieldControl(fieldProperty, this.#value);
			return main_core.Tag.render`
			<tr${Operator.getOperatorsWithoutRenderValue().includes(this.#operator) ? ' hidden' : ''}>
				<td align="right" width="40%" class="adm-detail-content-cell-l">
					${main_core.Loc.getMessage('BIZPROC_JS_CONDITION_VALUE')}
				</td>
				<td width="60%" class="adm-detail-content-cell-r">
					${this.#valueElement}
				</td>
			</tr>
		`;
		}
		#renderBetweenValue(fieldProperty, value) {
			const property = Object.assign(main_core.Runtime.clone(fieldProperty), {
				Multiple: false
			});
			const valueElement1 = this.#getFieldControl(property, value[0] || '', `${this.#valueName}_greater_then`);
			const valueElement2 = this.#getFieldControl(property, value[1] || '', `${this.#valueName}_less_then`);
			return main_core.Tag.render`
			<table>
				<tbody>
					<tr><td>${valueElement1}</td></tr>
					<tr><td>${valueElement2}</td></tr>
				</tbody>
			</table>
		`;
		}
		rerenderValue(fieldProperty) {
			this.#lastFieldProperty = fieldProperty;
			if (this.#operator === Operator.BETWEEN) {
				this.#rerenderBetweenValue(fieldProperty);
				return;
			}
			const valueElement = this.#getFieldControl(fieldProperty, '');
			main_core.Dom.replace(this.#valueElement, valueElement);
			this.#valueElement = valueElement;
		}
		#rerenderBetweenValue(fieldProperty) {
			const valueElement = this.#renderBetweenValue(fieldProperty, ['', '']);
			main_core.Dom.replace(this.#valueElement, valueElement);
			this.#valueElement = valueElement;
		}
		#getFieldControl(fieldProperty, value, valueName) {
			const name = main_core.Type.isNil(valueName) ? this.#valueName : valueName;
			return BX.Bizproc.FieldType.renderControl(this.#documentType, fieldProperty, name, value, 'designer');
		}
		renderValueTo(fieldType, to) {
			main_core.Dom.append(this.renderValue(fieldType), to);
		}
		destroy() {
			this.#operator = null;
			this.#value = null;
			this.#documentType = null;
			this.#operatorName = null;
			this.#valueName = null;
			main_core.Dom.remove(this.#operatorElement.parentElement.parentElement);
			this.#operatorElement = null;
			main_core.Dom.remove(this.#valueElement.parentElement.parentElement);
			this.#valueElement = null;
			this.#lastFieldProperty = null;
		}
	}

	class Condition {
		#object;
		#field;
		#operator;
		#value;
		constructor(params, group) {
			this.#object = 'Document';
			this.#field = '';
			this.#operator = '!empty';
			this.#value = '';
			this.parentGroup = null;
			if (main_core.Type.isPlainObject(params)) {
				if (params.object) {
					this.setObject(params.object);
				}
				if (params.field) {
					this.setField(params.field);
				}
				if (params.operator) {
					this.setOperator(params.operator);
				}
				if ('value' in params) {
					this.setValue(params.value);
				}
			}
			if (group) {
				this.parentGroup = group;
			}
		}
		clone() {
			return new Condition({
				object: this.#object,
				field: this.#field,
				operator: this.#operator,
				value: Array.isArray(this.#value) ? [...this.#value] : this.#value
			}, this.parentGroup);
		}
		setObject(object) {
			if (main_core.Type.isStringFilled(object)) {
				this.#object = object;
			}
		}
		get object() {
			return this.#object;
		}
		setField(field) {
			if (main_core.Type.isStringFilled(field)) {
				this.#field = field;
			}
		}
		get field() {
			return this.#field;
		}
		setOperator(operator) {
			this.#operator = operator ?? Operator.EQUAL;
		}
		get operator() {
			return this.#operator;
		}
		setValue(value) {
			this.#value = value;
			if (this.#operator === Operator.EQUAL && this.#value === '') {
				this.#operator = 'empty';
			} else if (this.#operator === Operator.NOT_EQUAL && this.#value === '') {
				this.#operator = '!empty';
			} else if (this.#operator === Operator.IN && this.#isEmptyArrayValue(this.#value)) {
				this.#operator = Operator.EMPTY;
			} else if (this.#operator === Operator.NOT_IN && this.#isEmptyArrayValue(this.#value)) {
				this.#operator = Operator.NOT_EMPTY;
			}
		}
		#isEmptyArrayValue(value) {
			return Array.isArray(value) && value.every(item => item === '');
		}
		get value() {
			return this.#value;
		}
		serialize() {
			return {
				object: this.#object,
				field: this.#field,
				operator: this.#operator,
				value: Array.isArray(this.#value) ? [...this.#value] : this.#value
			};
		}
	}

	const isMultiValueOperator = operator => operator === Operator.IN || operator === Operator.NOT_IN;
	const isValuelessOperator = operator => operator === Operator.EMPTY || operator === Operator.NOT_EMPTY;

	// Bring a value entered under the previous operator into the shape the new one reads. An array is a
	// value only for `in`/`!in` (transported as JSON) and for BETWEEN (transported as a pair of slots);
	// anywhere else it is not a value but its first item, and an operator without a value carries none.
	function adaptValueToOperator(operator, value) {
		if (isValuelessOperator(operator)) {
			return '';
		}
		if (isMultiValueOperator(operator) || operator === Operator.BETWEEN) {
			return value;
		}
		return Array.isArray(value) ? value[0] ?? '' : value;
	}
	const isScalarValue = value => main_core.Type.isString(value) || main_core.Type.isNumber(value) || main_core.Type.isBoolean(value);

	// array value of an `in`/`!in` condition is transported as a JSON string in a single value slot.
	function serializeConditionValue(operator, value) {
		if (isMultiValueOperator(operator) && Array.isArray(value)) {
			return JSON.stringify(value);
		}
		return Array.isArray(value) ? value[0] ?? '' : value;
	}

	// unserialize a single value slot back to an array only for `in`/`!in` with a valid JSON array of scalars.
	function unserializeConditionValue(operator, rawValue) {
		if (!isMultiValueOperator(operator) || !main_core.Type.isString(rawValue) || !/^\s*\[/.test(rawValue)) {
			return rawValue;
		}
		let parsed;
		try {
			parsed = JSON.parse(rawValue);
		} catch (error) {
			return rawValue;
		}
		if (!Array.isArray(parsed) || !parsed.every(isScalarValue)) {
			return rawValue;
		}

		// Mirror PHP `(string)` scalar coercion of unserializeConditionValue: true → '1', false → ''.
		return parsed.map(item => {
			if (main_core.Type.isBoolean(item)) {
				return item ? '1' : '';
			}
			return String(item);
		});
	}

	class ConditionGroup {
		static CONDITION_TYPE = {
			Field: 'field',
			Mixed: 'mixed'
		};
		static JOINER = {
			And: 'AND',
			Or: 'OR',
			message(type) {
				if (type === this.Or) {
					return main_core.Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_CONDITION_OR');
				}
				return main_core.Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_CONDITION_AND');
			}
		};
		#type;
		#items;
		#activityNames;
		constructor(params) {
			this.#type = ConditionGroup.CONDITION_TYPE.Field;
			this.#items = [];
			if (main_core.Type.isPlainObject(params)) {
				if (params.type) {
					this.#type = params.type;
				}
				if (main_core.Type.isArray(params.items)) {
					params.items.forEach(item => {
						const condition = new Condition(item[0], this);
						this.addItem(condition, item[1]);
					});
				}
				if (main_core.Type.isPlainObject(params.activityNames)) {
					this.#activityNames = params.activityNames;
				}
			}
		}
		clone() {
			const clonedGroup = new ConditionGroup({
				type: this.#type
			});
			this.#items.forEach(([condition, joiner]) => {
				const clonedCondition = condition.clone();
				clonedCondition.parentGroup = clonedGroup;
				clonedGroup.addItem(clonedCondition, joiner);
			});
			return clonedGroup;
		}
		get conditionNamesList() {
			if (main_core.Type.isPlainObject(this.#activityNames)) {
				return [this.#activityNames.Activity, this.#activityNames.Branch1, this.#activityNames.Branch2];
			}
			return [];
		}
		get type() {
			return this.#type;
		}
		set type(type) {
			if (Object.values(ConditionGroup.CONDITION_TYPE).includes(type)) {
				this.#type = type;
			}
			return this;
		}
		get items() {
			return this.#items;
		}
		static createFromForm(formFields, prefix) {
			const conditionGroup = new ConditionGroup();
			if (!prefix) {
				prefix = 'condition_';
			}
			if (main_core.Type.isArray(formFields[prefix + 'field'])) {
				for (let i = 0, valueIndex = 0; i < formFields[prefix + 'field'].length; ++i, ++valueIndex) {
					if (formFields[prefix + 'field'][i] === '') {
						continue;
					}
					const condition = new Condition({}, conditionGroup);
					condition.setObject(formFields[prefix + 'object'][i]);
					condition.setField(formFields[prefix + 'field'][i]);
					condition.setOperator(formFields[prefix + 'operator'][i]);
					const value = condition.operator === Operator.BETWEEN ? [formFields[prefix + 'value'][valueIndex], formFields[prefix + 'value'][valueIndex + 1]] : unserializeConditionValue(condition.operator, formFields[prefix + 'value'][valueIndex]);
					condition.setValue(value);
					let joiner = ConditionGroup.JOINER.And;
					if (formFields[prefix + 'joiner'] && formFields[prefix + 'joiner'][i] === ConditionGroup.JOINER.Or) {
						joiner = ConditionGroup.JOINER.Or;
					}
					if (condition.operator === Operator.BETWEEN) {
						valueIndex++;
					}
					conditionGroup.addItem(condition, joiner);
				}
			}
			return conditionGroup;
		}
		addItem(condition, joiner) {
			this.#items.push([condition, joiner]);
		}
		getItems() {
			return this.#items;
		}
		serialize() {
			const itemsArray = [];
			this.#items.forEach(item => {
				if (item.field !== '') {
					itemsArray.push([item[0].serialize(), item[1]]);
				}
			});
			return {
				type: this.#type,
				items: itemsArray,
				activityNames: this.#activityNames
			};
		}
	}

	class DelayInterval {
		static BASIS_TYPE = {
			CurrentDate: '{=System:Date}',
			CurrentDateTime: '{=System:Now}',
			CurrentDateTimeLocal: '{=System:NowLocal}'
		};
		static DELAY_TYPE = {
			After: 'after',
			Before: 'before',
			In: 'in'
		};
		#basis = DelayInterval.BASIS_TYPE.CurrentDateTime;
		#type = DelayInterval.DELAY_TYPE.After;
		#value = 0;
		#valueType = 'i';
		#workTime = false;
		#waitWorkDay = false;
		#inTime = null;
		#sourceExpression = null;
		constructor(params = null) {
			if (main_core.Type.isPlainObject(params)) {
				this.setType(params.type);
				this.setValue(params.value);
				this.setValueType(params.valueType);
				this.setBasis(params.basis);
				this.setWorkTime(params.workTime);
				this.setWaitWorkDay(params.waitWorkDay);
				this.setInTime(params.inTime);
			}
		}
		get basis() {
			return this.#basis;
		}
		get type() {
			return this.#type;
		}
		get value() {
			return this.#value;
		}
		get valueType() {
			return this.#valueType;
		}
		get workTime() {
			return this.#workTime;
		}
		get waitWorkDay() {
			return this.#waitWorkDay;
		}
		get hasSourceExpression() {
			return main_core.Type.isStringFilled(this.#sourceExpression);
		}
		get inTime() {
			return this.getInTimeAtOffset(this.#getUserOffset());
		}
		get inTimeString() {
			const inTime = this.inTime;
			if (!inTime) {
				return '';
			}
			return `${String(inTime[0]).padStart(2, '0')}:${String(inTime[1]).padStart(2, '0')}`;
		}
		getStoredInTime() {
			return this.#inTime ? [...this.#inTime] : null;
		}
		getInTimeAtOffset(userOffset) {
			if (!this.#inTime) {
				return null;
			}
			if (!main_core.Type.isNumber(this.#inTime[2]) || this.#inTime[2] === userOffset) {
				return [...this.#inTime];
			}
			const diffOffsetMin = Math.floor((this.#inTime[2] - userOffset) / 60);
			let allMinutes = this.#inTime[0] * 60 + this.#inTime[1] - diffOffsetMin;
			if (allMinutes < 0) {
				allMinutes += 24 * 60;
			}
			return [Math.floor(allMinutes / 60), allMinutes % 60, userOffset];
		}
		static isSystemBasis(basis) {
			return Object.values(this.BASIS_TYPE).includes(basis);
		}
		static fromString(expression, basisFields = []) {
			const interval = new this();
			const sourceExpression = String(expression || '').trim();
			let value = sourceExpression.replace(/^=/, '');
			if (!value) {
				return interval;
			}
			const setTimeMatch = value.match(/^settime\((.+?),\s*(\d+),\s*(\d+)(?:,\s*(-?\d+))?\)$/);
			if (setTimeMatch) {
				value = setTimeMatch[1];
				interval.setInTime([Number(setTimeMatch[2]), Number(setTimeMatch[3]), ...(main_core.Type.isString(setTimeMatch[4]) ? [Number(setTimeMatch[4])] : [])]);
			}
			const addMatch = value.match(/^(workdateadd|dateadd)\((.*),\s*["']?(-?[\d]+[ihd])["']?(?:,.*)?\)$/);
			if (addMatch) {
				interval.setWorkTime(addMatch[1] === 'workdateadd');
				interval.setBasis(DelayInterval.#normalizeBasis(addMatch[2].trim(), basisFields));
				const amount = addMatch[3];
				interval.setType(amount.startsWith('-') ? this.DELAY_TYPE.Before : this.DELAY_TYPE.After);
				interval.setValue(Math.abs(parseInt(amount, 10)));
				interval.setValueType(amount.slice(-1));
			} else {
				interval.setBasis(DelayInterval.#normalizeBasis(value, basisFields));
				if (interval.basis !== this.BASIS_TYPE.CurrentDateTime || interval.inTime) {
					interval.setType(this.DELAY_TYPE.In);
				}
			}
			const isKnownBasis = this.isSystemBasis(value) || basisFields.some(field => field.SystemExpression === value || field.Expression === value);
			if (!addMatch && !isKnownBasis) {
				interval.#sourceExpression = sourceExpression;
			}
			return interval;
		}
		static #normalizeBasis(basis, fields) {
			if (this.isSystemBasis(basis)) {
				return basis;
			}
			const field = fields.find(item => item.SystemExpression === basis || item.Expression === basis);
			return field ? field.SystemExpression : this.BASIS_TYPE.CurrentDateTime;
		}
		setType(type) {
			this.#sourceExpression = null;
			this.#type = Object.values(DelayInterval.DELAY_TYPE).includes(type) ? type : DelayInterval.DELAY_TYPE.After;
			return this;
		}
		setValue(value) {
			this.#sourceExpression = null;
			this.#value = Math.max(0, parseInt(value, 10) || 0);
			return this;
		}
		setValueType(type) {
			this.#sourceExpression = null;
			this.#valueType = ['i', 'h', 'd'].includes(type) ? type : 'i';
			return this;
		}
		setBasis(basis) {
			this.#sourceExpression = null;
			if (main_core.Type.isStringFilled(basis)) {
				this.#basis = basis;
			}
			return this;
		}
		setWorkTime(flag) {
			this.#sourceExpression = null;
			this.#workTime = Boolean(flag);
			return this;
		}
		setWaitWorkDay(flag) {
			this.#sourceExpression = null;
			this.#waitWorkDay = Boolean(flag);
			return this;
		}
		setInTime(value) {
			this.#sourceExpression = null;
			let normalized = value;
			if (main_core.Type.isArray(normalized) && normalized.length >= 2 && !main_core.Type.isNumber(normalized[2])) {
				normalized = [...normalized, this.#getUserOffset()];
			}
			this.#inTime = main_core.Type.isArray(normalized) && normalized.length >= 2 ? [Number(normalized[0]), Number(normalized[1]), ...(main_core.Type.isNumber(normalized[2]) ? [Number(normalized[2])] : [])] : null;
			return this;
		}
		isNow() {
			return this.#type === DelayInterval.DELAY_TYPE.After && this.#basis === DelayInterval.BASIS_TYPE.CurrentDateTime && this.#value === 0 && !this.#workTime && !this.#inTime;
		}
		setNow() {
			return this.setType(DelayInterval.DELAY_TYPE.After).setValue(0).setValueType('i').setBasis(DelayInterval.BASIS_TYPE.CurrentDateTime).setInTime(null);
		}
		clone() {
			const clone = new this.constructor(this.serialize());
			clone.#sourceExpression = this.#sourceExpression;
			return clone;
		}
		serialize() {
			return {
				type: this.#type,
				value: this.#value,
				valueType: this.#valueType,
				basis: this.#basis,
				workTime: this.#workTime ? 1 : 0,
				waitWorkDay: this.#waitWorkDay ? 1 : 0,
				inTime: this.getStoredInTime()
			};
		}
		static fromMinutes(minutes) {
			if (minutes % 1440 === 0) {
				return [minutes / 1440, 'd'];
			}
			if (minutes % 60 === 0) {
				return [minutes / 60, 'h'];
			}
			return [minutes, 'i'];
		}
		static toMinutes(value, valueType) {
			return value * ({
				i: 1,
				h: 60,
				d: 1440
			}[valueType] || 0);
		}
		format(emptyText, fields = []) {
			let result = emptyText;
			if (this.#type === DelayInterval.DELAY_TYPE.In) {
				result = main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_IN_TIME_2');
				const field = fields.find(item => item.SystemExpression === this.#basis);
				if (field) {
					result += ` ${field.Name}`;
				}
				if (this.inTime) {
					result += ` ${this.inTimeString}`;
				}
			} else if (this.#value) {
				const prefix = this.#type === DelayInterval.DELAY_TYPE.After ? main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_THROUGH_3') : main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_FOR_TIME_3');
				result = `${prefix} ${this.getFormattedPeriodLabel(this.#value, this.#valueType)}`;
				const field = fields.find(item => item.SystemExpression === this.#basis);
				if (field) {
					result += ` ${this.#type === DelayInterval.DELAY_TYPE.After ? main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_AFTER') : main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_BEFORE_1')} ${field.Name}`;
				}
			}
			return this.#workTime ? `${result}, ${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_IN_WORKTIME')}` : result;
		}
		getFormattedPeriodLabel(value, type) {
			const labels = DelayInterval.getPeriodLabels(type);
			const normalizedValue = value > 20 ? value % 10 : value;
			const labelIndex = normalizedValue === 1 ? 0 : normalizedValue > 1 && normalizedValue < 5 ? 1 : 2;
			return `${value} ${labels[labelIndex] || ''}`;
		}
		static getPeriodLabels(period) {
			const key = {
				i: 'MIN',
				h: 'HOUR',
				d: 'DAY'
			}[period];
			return key ? [1, 2, 3].map(index => main_core.Loc.getMessage(`BIZPROC_AUTOMATION_CMP_${key}${index}`)) : [];
		}
		toExpression(basisFields = [], workerExpression = null) {
			if (this.hasSourceExpression) {
				return this.#sourceExpression;
			}
			let basis = this.#basis;
			const field = basisFields.find(item => item.SystemExpression === basis);
			if (field) {
				basis = field.Expression;
			}
			if (this.isNow() || this.#type === DelayInterval.DELAY_TYPE.In && !this.#workTime && !this.#inTime) {
				return basis;
			}
			let amount = this.#value ? `${this.#value}${this.#valueType}` : '';
			if (amount && this.#type === DelayInterval.DELAY_TYPE.Before) {
				amount = `-${amount}`;
			}
			if (this.#workTime && !amount) {
				amount = '0d';
			}
			let result = amount ? `${this.#workTime ? 'workdateadd' : 'dateadd'}(${basis},"${amount}"${this.#workTime && workerExpression ? `,${workerExpression}` : ''})` : basis;
			if (this.#inTime) {
				result = `settime(${result}, ${this.#inTime[0]}, ${this.#inTime[1]}, ${this.#inTime[2] || 0})`;
			}
			return result === basis ? result : `=${result}`;
		}
		#getUserOffset() {
			const offset = Number(main_core.Loc.getMessage('USER_TZ_OFFSET'));
			return main_core.Type.isNumber(offset) ? offset : 0;
		}
	}

	/**
	 * Standalone time picker used by `DelayIntervalSelector` to edit the "exact time"
	 * (HH:MM) row. It intentionally does not extend the robot inline-selector: the
	 * control only needs a dropdown of half-hour marks over a text input, so it stays
	 * free of any `bizproc.automation` dependency.
	 */
	class InlineTimeSelector {
		#labelNode = null;
		#inputNode = null;
		#timeValues = [];
		#timeFormat;
		#selector;
		#chevron;
		#onchange = null;
		targetInput = null;
		constructor(options) {
			if (main_core.Type.isPlainObject(options) && main_core.Type.isFunction(options.onchange)) {
				this.#onchange = options.onchange;
			}
			this.#fillTimeFormat();
			this.#fillTimeValues();
		}
		#fillTimeFormat() {
			const getFormat = formatId => BX.Main.Date.convertBitrixFormat(main_core.Loc.getMessage(formatId)).replace(/:?\s*s/, '');
			const dateFormat = getFormat('FORMAT_DATE');
			const dateTimeFormat = getFormat('FORMAT_DATETIME');
			this.#timeFormat = dateTimeFormat.replace(dateFormat, '').trim();
		}
		#fillTimeValues() {
			const onclick = (event, item) => {
				event.preventDefault();
				this.#inputNode.value = main_core.Text.encode(item.text);
				item.getMenuWindow().close();
				if (this.#onchange) {
					this.#onchange(this.#inputNode);
				}
			};
			for (let hour = 0; hour < 24; hour++) {
				this.#timeValues.push({
					id: hour * 60,
					text: this.#formatTime(hour, 0),
					onclick
				}, {
					id: hour * 60 + 30,
					text: this.#formatTime(hour, 30),
					onclick
				});
			}
		}
		#formatTime(hour, minute) {
			const date = new Date();
			date.setHours(hour, minute);
			return main_date.DateTimeFormat.format(this.#timeFormat, date.getTime() / 1000);
		}
		renderTo(targetInput) {
			targetInput.parentNode.replaceChild(this.renderWith(targetInput), targetInput);
		}
		renderWith(targetInput) {
			this.targetInput = main_core.Runtime.clone(targetInput);
			this.targetInput.setAttribute('autocomplete', 'off');
			this.targetInput.setAttribute('data-testid', 'bp-condition-time-input');
			this.#init();
			return this.#labelNode;
		}
		#init() {
			const {
				root,
				chevron
			} = main_core.Tag.render`
			<span onclick="${this.#onLabelClick.bind(this)}" style="width: 100%; position: relative">
				${this.targetInput}
				<span
					ref="chevron"
					class="ui-icon-set --chevron-down bizproc-automation-inline-time-selector-chevron"
					data-testid="bp-condition-time-chevron"
				></span>
			</span>
		`;
			this.#labelNode = root;
			this.#inputNode = this.targetInput;
			this.#chevron = chevron;
		}
		#onLabelClick(event) {
			this.#showTimeSelector();
			event.preventDefault();
		}
		#showTimeSelector() {
			if (main_core.Type.isNil(this.#selector)) {
				this.#selector = new main_popup.Menu({
					autoHide: true,
					bindElement: this.#labelNode,
					items: this.#timeValues,
					maxHeight: 230,
					width: this.#labelNode.offsetWidth || this.#labelNode.clientWidth || 100,
					events: {
						onPopupClose: () => {
							if (main_core.Dom.hasClass(this.#chevron, '--chevron-up')) {
								main_core.Dom.toggleClass(this.#chevron, ['--chevron-down', '--chevron-up']);
							}
						}
					}
				});
			}
			this.#selector.show();
			if (main_core.Dom.hasClass(this.#chevron, '--chevron-down')) {
				main_core.Dom.toggleClass(this.#chevron, ['--chevron-down', '--chevron-up']);
			}
		}
	}

	class DelayIntervalSelector {
		constructor(options) {
			this.basisFields = [];
			this.onchange = null;
			if (main_core.Type.isPlainObject(options)) {
				this.labelNode = options.labelNode;
				this.useAfterBasis = options.useAfterBasis;
				if (main_core.Type.isArray(options.basisFields)) {
					this.basisFields = options.basisFields;
				}
				this.onchange = options.onchange;
				this.minLimitM = options.minLimitM;
				this.maxLimitD = options.maxLimitD;
			}
		}
		init(delay) {
			this.delay = delay;
			this.setLabelText();
			this.bindLabelNode();
			this.prepareBasisFields();
		}
		setLabelText() {
			if (this.delay && this.labelNode) {
				this.labelNode.textContent = this.delay.format(main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_AT_ONCE_2'), this.basisFields);
			}
		}
		bindLabelNode() {
			if (this.labelNode) {
				main_core.Event.bind(this.labelNode, 'click', this.onLabelClick.bind(this));
			}
		}
		onLabelClick(event) {
			this.showDelayIntervalPopup();
			event.preventDefault();
		}
		showDelayIntervalPopup() {
			const uid = main_core.Text.getRandom();
			const form = main_core.Tag.render`
			 <form class="bizproc-automation-popup-select-block">
				${this.#createNowControlNode(uid)}
				${this.createAfterControlNode()}
				${this.basisFields.length > 0 ? this.createBeforeControlNode() : ''}
				${this.basisFields.length > 0 ? this.createInControlNode() : ''}
				${this.renderAdditionalSettings(uid)}
			</form>
		`;
			BX.UI.Hint.init(form);
			const popup = new main_popup.Popup({
				id: main_core.Text.getRandom(),
				bindElement: this.labelNode,
				content: form,
				closeByEsc: true,
				buttons: [new ui_buttons.Button({
					color: ui_buttons.Button.Color.PRIMARY,
					text: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CHOOSE_BUTTON_CAPS'),
					onclick: () => {
						this.saveFormData(new FormData(form));
						popup.close();
					}
				}), new ui_buttons.Button({
					color: ui_buttons.Button.Color.LINK,
					text: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CANCEL_BUTTON_CAPS'),
					onclick: () => {
						popup.close();
					}
				})],
				width: 482,
				padding: 20,
				closeIcon: false,
				autoHide: true,
				events: {
					onPopupClose: () => {
						if (this.fieldsMenu) {
							this.fieldsMenu.popupWindow.close();
						}
						if (this.valueTypeMenu) {
							this.valueTypeMenu.popupWindow.close();
						}
						popup.destroy();
					}
				},
				titleBar: false,
				angle: {
					offset: 40
				},
				overlay: {
					backgroundColor: 'transparent'
				}
			});
			popup.show();
		}
		#createNowControlNode(uid) {
			const labelText = main_core.Loc.getMessage(this.useAfterBasis ? 'BIZPROC_AUTOMATION_CMP_BASIS_NOW' : 'BIZPROC_AUTOMATION_CMP_AT_ONCE_2');
			const hintText = main_core.Loc.getMessage(this.useAfterBasis ? 'BIZPROC_AUTOMATION_CMP_DELAY_NOW_HELP_2' : 'BIZPROC_AUTOMATION_CMP_DELAY_NOW_HELP');
			const {
				root,
				labelAfter,
				radioNow
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-select-item">
				<label
					ref="labelAfter"
					class="bizproc-automation-popup-select__wrapper --first ui-ctl ui-ctl-radio ui-ctl-w100"
					for="${uid}now"
					data-role="select-item"
				>
					<input
						ref="radioNow"
						class="bizproc-automation-popup-select__input ui-ctl-element"
						id="${uid}now"
						type="radio"
						value="now"
						name="type"
					/>
					<span class="bizproc-automation-popup-settings__text --first">${labelText}</span>
					<span
						class="bizproc-automation-status__help"
						data-hint="${hintText}"
					></span>
				</label>
			</div>
		`;
			main_core.Event.bind(radioNow, 'change', this.#onChangeDelayIntervalType.bind(this, labelAfter));
			if (this.delay.isNow()) {
				radioNow.setAttribute('checked', 'checked');
				main_core.Dom.addClass(labelAfter, '--active');
			}
			return root;
		}
		#onChangeDelayIntervalType(labelNode) {
			document.querySelectorAll('[data-role="select-item"]').forEach(node => {
				main_core.Dom.removeClass(node, '--active');
			});
			main_core.Dom.addClass(labelNode, '--active');
		}
		saveFormData(formData) {
			this.#saveDelayIntervalTypeFromForm(formData);
			if (!this.delay.isNow()) {
				const timeName = `basis_in_time_${main_core.Text.encode(this.delay.type)}`;
				this.delay.setInTime(this.#parseInTimeValue(formData.get(timeName)));
			}
			this.saveAdditionalSettings(formData);
			this.setLabelText();
			if (this.onchange) {
				this.onchange(this.delay);
			}
		}
		#saveDelayIntervalTypeFromForm(formData) {
			const type = formData.get('type');
			if (type === 'now') {
				this.delay.setNow();
			} else if (type === DelayInterval.DELAY_TYPE.In) {
				this.delay.setType(DelayInterval.DELAY_TYPE.In);
				this.delay.setValue(0);
				this.delay.setValueType('i');
				this.delay.setBasis(formData.get('basis_in'));
			} else {
				this.delay.setType(type);
				this.delay.setValue(formData.get(`value_${type}`));
				this.delay.setValueType(formData.get(`value_type_${type}`));
				if (type === DelayInterval.DELAY_TYPE.After) {
					if (this.useAfterBasis) {
						this.delay.setBasis(formData.get('basis_after'));
					} else {
						this.delay.setBasis(DelayInterval.BASIS_TYPE.CurrentDateTime);
					}
					if (this.minLimitM > 0 && this.delay.basis === DelayInterval.BASIS_TYPE.CurrentDateTime && this.delay.valueType === 'i' && this.delay.value < this.minLimitM) {
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('BIZPROC_AUTOMATION_DELAY_MIN_LIMIT_LABEL')
						});
						this.delay.setValue(this.minLimitM);
					}
					if (this.maxLimitD > 0 && this.delay.basis === DelayInterval.BASIS_TYPE.CurrentDateTime && this.delay.valueType === 'd' && this.delay.value > this.maxLimitD) {
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('BIZPROC_AUTOMATION_DELAY_MAX_LIMIT_LABEL')
						});
						this.delay.setValue(this.maxLimitD);
					}
				} else {
					this.delay.setBasis(formData.get('basis_before'));
				}
			}
		}
		#parseInTimeValue(value) {
			if (main_core.Type.isStringFilled(value)) {
				const result = value.trim();
				if (/^\d{2}:\d{2}\s?[ap]?m?$/.test(result)) {
					if (result.includes('am')) {
						return [String(main_core.Text.toInteger(result.slice(0, 2)) % 12).padStart(2, '0'), String(main_core.Text.toInteger(result.slice(3)) % 60).padStart(2, '0')];
					}
					if (result.includes('pm')) {
						return [String(main_core.Text.toInteger(result.slice(0, 2)) % 12 + 12).padStart(2, '0'), String(main_core.Text.toInteger(result.slice(3)) % 60).padStart(2, '0')];
					}
					return [String(main_core.Text.toInteger(result.slice(0, 2)) % 24).padStart(2, '0'), String(main_core.Text.toInteger(result.slice(3)) % 60).padStart(2, '0')];
				}
			}
			return null;
		}
		createAfterControlNode() {
			const delay = this.delay;
			const uid = main_core.Text.getRandom();
			const valueAfter = delay.type === DelayInterval.DELAY_TYPE.After && delay.value ? delay.value : this.minLimitM || 5;
			const hiddenRow = this.#createHiddenRow(DelayInterval.DELAY_TYPE.After, 'value_type_after');
			const chevron = this.#createShowHiddenRowChevron(hiddenRow, delay.valueType !== 'd', 'value_type_after');
			const {
				root,
				labelAfter,
				radioAfter
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-select-item">
				<label
					ref="labelAfter"
					class="bizproc-automation-popup-select__wrapper ui-ctl ui-ctl-radio ui-ctl-w100"
					for="${uid}"
					data-role="select-item"
				>
					<div class="bizproc-automation-popup-select__visible-row">
						<input
							ref="radioAfter"
							type="radio"
							id="${uid}"
							class="bizproc-automation-popup-select__input ui-ctl-element"
							value="${DelayInterval.DELAY_TYPE.After}"
							name="type"
						/>
						<span class="bizproc-automation-popup-settings__text --first">
							${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_THROUGH_3')}
						</span>
						<input
							type="text"
							name="value_after"
							class="bizproc-automation-popup-settings__input"
							value="${main_core.Text.encode(valueAfter)}"
						/>
						${this.createValueTypeSelector('value_type_after')}
						${this.#createAfterBasis()}
						${this.useAfterBasis ? chevron : ''}
					</div>
					${this.useAfterBasis ? hiddenRow : ''}
				</label>
			</div>
		`;
			main_core.Event.bind(radioAfter, 'change', this.#onChangeDelayIntervalType.bind(this, labelAfter));
			if (delay.type === DelayInterval.DELAY_TYPE.After && delay.value > 0) {
				radioAfter.setAttribute('checked', 'checked');
				main_core.Dom.addClass(labelAfter, '--active');
				if (delay.valueType === 'd' && this.delay.inTime) {
					main_core.Dom.addClass(hiddenRow, '--visible');
					main_core.Dom.addClass(chevron, '--active');
				}
			}
			return root;
		}
		#createHiddenRow(delayIntervalType, role) {
			return main_core.Tag.render`
			<div class="bizproc-automation-popup-select__hidden-row" data-role="hidden_row_${role}">
				${this.#createTimeSelector(delayIntervalType)}
			</div>
		`;
		}
		#createShowHiddenRowChevron(hiddenRow, disabled, type) {
			const chevron = main_core.Tag.render`
			<div
				class="ui-icon-set --chevron-down bizproc-automation-popup-select__chevron"
				data-role="chevron_${type}"
			></div>
		`;
			if (disabled) {
				this.#disableSetTimeRow(chevron, hiddenRow);
			}
			main_core.Event.bind(chevron, 'click', () => {
				if (main_core.Dom.hasClass(chevron, '--disabled')) {
					return;
				}
				main_core.Dom.toggleClass(chevron, '--active');
				main_core.Dom.toggleClass(hiddenRow, '--visible');
			});
			return chevron;
		}
		#disableSetTimeRow(chevron, hiddenRow) {
			main_core.Dom.removeClass(chevron, '--active');
			main_core.Dom.addClass(chevron, '--disabled');
			main_core.Dom.attr(chevron, {
				'data-hint-html': 'Y',
				'data-hint-no-icon': 'Y'
			});
			chevron.dataset.hint = main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_DELAY_INTERVAL_CHEVRON_DISABLED');
			main_core.Dom.removeClass(hiddenRow, '--visible');
			BX.UI.Hint.initNode(chevron);
		}
		#enableSetTimeRow(chevron, hiddenRow) {
			main_core.Dom.replace(chevron, this.#createShowHiddenRowChevron(hiddenRow, false, main_core.Dom.attr(chevron, 'data-role').replace('chevron_', '')));
		}
		#createAfterBasis() {
			if (!this.useAfterBasis) {
				return '';
			}
			const delay = this.delay;
			let basisField = this.getBasisField(delay.basis, true);
			let basisValue = delay.basis;
			if (!basisField) {
				basisField = this.getBasisField(DelayInterval.BASIS_TYPE.CurrentDateTime, true);
				basisValue = basisField.SystemExpression;
			}
			const beforeBasisNodeText = basisField ? main_core.Text.encode(basisField.Name) : main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_CHOOSE_DATE_FIELD');
			const {
				root,
				beforeBasisValueNode,
				beforeBasisNode
			} = main_core.Tag.render`
			<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-auto-width">
				${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_AFTER')}
			</span>
			<input ref="beforeBasisValueNode" type="hidden" name="basis_after" value="${main_core.Text.encode(basisValue)}">
			<span class="bizproc-automation-popup-settings-link bizproc-automation-delay-interval-basis">
				<span ref="beforeBasisNode">
					${main_core.Text.encode(beforeBasisNodeText)}
				</span>
			</span>
		`;
			main_core.Event.bind(beforeBasisNode, 'click', event => {
				const callback = field => {
					beforeBasisNode.textContent = main_core.Text.encode(field.Name);
					beforeBasisValueNode.value = field.SystemExpression;
				};
				this.onBasisClick(event, beforeBasisNode, callback, DelayInterval.DELAY_TYPE.After);
			});
			return root;
		}
		createBeforeControlNode() {
			const delay = this.delay;
			const uid = main_core.Text.getRandom();
			const valueBefore = delay.type === DelayInterval.DELAY_TYPE.Before && delay.value ? delay.value : this.minLimitM || 5;
			const hiddenRow = this.#createHiddenRow(DelayInterval.DELAY_TYPE.Before, 'value_type_before');
			const chevron = this.#createShowHiddenRowChevron(hiddenRow, delay.valueType !== 'd', 'value_type_before');
			const {
				root,
				labelBefore,
				radioBefore
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-select-item">
				<label
					ref="labelBefore"
					class="bizproc-automation-popup-select__wrapper ui-ctl ui-ctl-radio ui-ctl-w100"
					for="${uid}"
					data-role="select-item"
				>
					<div class="bizproc-automation-popup-select__visible-row">
						<input
							ref="radioBefore"
							type="radio"
							id="${uid}"
							class="bizproc-automation-popup-select__input ui-ctl-element"
							value="${DelayInterval.DELAY_TYPE.Before}"
							name="type"
						/>
						<span class="bizproc-automation-popup-settings__text --first">
							${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_FOR_TIME_3')}
						</span>
						<input
							type="text"
							name="value_before"
							class="bizproc-automation-popup-settings__input"
							value="${main_core.Text.encode(valueBefore)}"
						/>
						${this.createValueTypeSelector('value_type_before')}
						${this.#createBeforeBasis()}
						${chevron}
					</div>
					${hiddenRow}
				</label>
			</div>
		`;
			main_core.Event.bind(radioBefore, 'change', this.#onChangeDelayIntervalType.bind(this, labelBefore));
			if (delay.type === DelayInterval.DELAY_TYPE.Before) {
				radioBefore.setAttribute('checked', 'checked');
				main_core.Dom.addClass(labelBefore, '--active');
				if (delay.valueType === 'd' && this.delay.inTime) {
					main_core.Dom.addClass(hiddenRow, '--visible');
					main_core.Dom.addClass(chevron, '--active');
				}
			}
			return root;
		}
		#createBeforeBasis() {
			const delay = this.delay;
			let basisField = this.getBasisField(delay.basis);
			let basisValue = delay.basis;
			if (!basisField) {
				basisField = this.basisFields[0];
				basisValue = basisField.SystemExpression;
			}
			const {
				root,
				beforeBasisValueNode,
				beforeBasisNode
			} = main_core.Tag.render`
			<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-auto-width">
				${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_BEFORE_1')}
			</span>
			<input ref="beforeBasisValueNode" type="hidden" name="basis_before" value="${main_core.Text.encode(basisValue)}">
			<span class="bizproc-automation-popup-settings-link bizproc-automation-delay-interval-basis">
				<span ref="beforeBasisNode">
					${basisField ? main_core.Text.encode(basisField.Name) : main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_CHOOSE_DATE_FIELD')}
				</span>
			</span>
		`;
			main_core.Event.bind(beforeBasisNode, 'click', event => {
				const callback = field => {
					beforeBasisNode.textContent = main_core.Text.encode(field.Name);
					beforeBasisValueNode.value = main_core.Text.encode(field.SystemExpression);
				};
				this.onBasisClick(event, beforeBasisNode, callback, DelayInterval.DELAY_TYPE.Before);
			});
			return root;
		}
		createInControlNode() {
			const delay = this.delay;
			const uid = main_core.Text.getRandom();
			const hiddenRow = this.#createHiddenRow(DelayInterval.DELAY_TYPE.In, 'value_type_in');
			const chevron = this.#createShowHiddenRowChevron(hiddenRow, false, 'value_type_in');
			const {
				root,
				labelIn,
				radioIn
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-select-item">
				<label
					ref="labelIn"
					class="bizproc-automation-popup-select__wrapper --last ui-ctl ui-ctl-radio ui-ctl-w100"
					for="${uid}"
					data-role="select-item"
				>
					<div class="bizproc-automation-popup-select__visible-row">
						<input
							ref="radioIn"
							class="bizproc-automation-popup-select__input ui-ctl-element"
							id="${uid}"
							type="radio"
							value="${DelayInterval.DELAY_TYPE.In}"
							name="type"
						>
						${this.#createInBasis()}
						${chevron}
					</div>
					${hiddenRow}
				</label>
			</div>
		`;
			main_core.Event.bind(radioIn, 'change', this.#onChangeDelayIntervalType.bind(this, labelIn));
			if (delay.type === DelayInterval.DELAY_TYPE.In) {
				radioIn.setAttribute('checked', 'checked');
				main_core.Dom.addClass(labelIn, '--active');
				if (this.delay.inTime) {
					main_core.Dom.addClass(hiddenRow, '--visible');
					main_core.Dom.addClass(chevron, '--active');
				}
			}
			return root;
		}
		#createInBasis() {
			const delay = this.delay;
			let basisField = this.getBasisField(delay.basis, true);
			let basisValue = delay.basis;
			if (!basisField) {
				basisField = this.basisFields[0];
				basisValue = basisField.SystemExpression;
			}
			const {
				root,
				inBasisValueNode,
				inBasisNode
			} = main_core.Tag.render`
			<span class="bizproc-automation-popup-settings__text --first">
				${main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_IN_TIME_2')}
			</span>
			<input ref="inBasisValueNode" type="hidden" name="basis_in" value="${main_core.Text.encode(basisValue)}"/>
			<span class="bizproc-automation-popup-settings-link bizproc-automation-delay-interval-basis">
				<span ref="inBasisNode">
					${basisField ? main_core.Text.encode(basisField.Name) : main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_CHOOSE_DATE_FIELD')}
				</span>
			</span>
		`;
			main_core.Event.bind(inBasisNode, 'click', event => {
				const callback = field => {
					inBasisNode.textContent = main_core.Text.encode(field.Name);
					inBasisValueNode.value = main_core.Text.encode(field.SystemExpression);
				};
				this.onBasisClick(event, inBasisNode, callback, DelayInterval.DELAY_TYPE.In);
			});
			return root;
		}
		#createTimeSelector(delayType) {
			const value = delayType === this.delay.type ? this.delay.inTime : [];
			const formattedValue = this.#formatTimeToString(value ?? []);
			const {
				root,
				input
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings__text">
				<span style="margin-right: 10px">
					${main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_DELAY_INTERVAL_SET_TIME_LABEL')}
				</span>
				<input
					ref="input"
					type="text"
					name="basis_in_time_${main_core.Text.encode(delayType)}"
					class="bizproc-automation-delay-interval-set-time bizproc-automation-popup-settings__input"
					autocomplete="off"
					value="${main_core.Text.encode(formattedValue)}"
				/>
			</div>
		`;
			new InlineTimeSelector().renderTo(input);
			return root;
		}
		#formatTimeToString(time) {
			const dateFormat = BX.Main.Date.convertBitrixFormat(main_core.Loc.getMessage('FORMAT_DATE')).replace(/:?\s*s/, '');
			const timeFormat = BX.Main.Date.convertBitrixFormat(main_core.Loc.getMessage('FORMAT_DATETIME')).replace(`${dateFormat} `, '').replace(':s', '');
			const date = new Date();
			date.setHours(time[0] ?? 0, time[1] ?? 0, 0, 0);
			return main_core.Type.isArrayFilled(time) ? main_date.DateTimeFormat.format(timeFormat, date) : '';
		}
		createValueTypeSelector(name) {
			const delay = this.delay;
			const labelTexts = {
				i: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_INTERVAL_M'),
				h: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_INTERVAL_H'),
				d: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_INTERVAL_D')
			};
			const {
				root,
				label,
				input
			} = main_core.Tag.render`
			<span>
				<label ref="label" class="bizproc-automation-popup-settings-link">
					${main_core.Text.encode(labelTexts[delay.valueType])}
				</label>
				<input ref="input" type="hidden" name="${main_core.Text.encode(name)}" value="${main_core.Text.encode(delay.valueType)}"/>
			</span>
		`;
			main_core.Event.bind(label, 'click', this.onValueTypeSelectorClick.bind(this, label, input));
			return root;
		}
		onValueTypeSelectorClick(label, input) {
			const uid = main_core.Text.getRandom();
			const handler = (event, item) => {
				item.getMenuWindow().close();
				// eslint-disable-next-line no-param-reassign
				input.value = item.valueId;
				// eslint-disable-next-line no-param-reassign
				label.textContent = item.text;
				if (item.valueId === 'd') {
					this.#enableSetTimeRow(document.querySelector(`[data-role="chevron_${input.name}"]`), document.querySelector(`[data-role="hidden_row_${input.name}"]`));
				} else {
					this.#disableSetTimeRow(document.querySelector(`[data-role="chevron_${input.name}"]`), document.querySelector(`[data-role="hidden_row_${input.name}"]`));
				}
			};
			const menuItems = [{
				text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_INTERVAL_M'),
				valueId: 'i',
				onclick: handler
			}, {
				text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_INTERVAL_H'),
				valueId: 'h',
				onclick: handler
			}, {
				text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_INTERVAL_D'),
				valueId: 'd',
				onclick: handler
			}];
			main_popup.MenuManager.show(uid, label, menuItems, {
				autoHide: true,
				offsetLeft: 25,
				angle: {
					position: 'top'
				},
				events: {
					onPopupClose() {
						this.destroy();
					}
				},
				overlay: {
					backgroundColor: 'transparent'
				}
			});
			this.valueTypeMenu = main_popup.MenuManager.currentItem;
		}
		onBasisClick(event, labelNode, callback, delayType) {
			const menuItems = [];
			const onMenuItemClick = (e, item) => {
				if (callback) {
					callback(item.field || item.options.field);
				}
				item.getMenuWindow().close();
			};
			if (delayType === DelayInterval.DELAY_TYPE.After || delayType === DelayInterval.DELAY_TYPE.In) {
				menuItems.push({
					text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_BASIS_NOW'),
					field: {
						Name: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_BASIS_NOW'),
						SystemExpression: DelayInterval.BASIS_TYPE.CurrentDateTime
					},
					onclick: onMenuItemClick
				}, {
					text: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_BASIS_DATE'),
					field: {
						Name: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_BASIS_DATE'),
						SystemExpression: DelayInterval.BASIS_TYPE.CurrentDate
					},
					onclick: onMenuItemClick
				}, {
					delimiter: true
				});
			}
			for (let i = 0; i < this.basisFields.length; ++i) {
				if (delayType !== DelayInterval.DELAY_TYPE.After && this.basisFields[i].Id.includes('DATE_CREATE')) {
					continue;
				}
				menuItems.push({
					text: main_core.Text.encode(this.basisFields[i].Name),
					field: this.basisFields[i],
					onclick: onMenuItemClick
				});
			}
			let menuId = labelNode.getAttribute('data-menu-id');
			if (!menuId) {
				menuId = main_core.Text.getRandom();
				labelNode.setAttribute('data-menu-id', menuId);
			}
			main_popup.MenuManager.show(menuId, labelNode, menuItems, {
				autoHide: true,
				offsetLeft: main_core.Dom.getPosition(labelNode).width / 2,
				angle: {
					position: 'top',
					offset: 0
				},
				overlay: {
					backgroundColor: 'transparent'
				}
			});
			this.fieldsMenu = main_popup.MenuManager.currentItem;
		}
		getBasisField(basis, system) {
			if (system && (basis === DelayInterval.BASIS_TYPE.CurrentDateTime || basis === DelayInterval.BASIS_TYPE.CurrentDateTimeLocal)) {
				return {
					Name: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_BASIS_NOW'),
					SystemExpression: DelayInterval.BASIS_TYPE.CurrentDateTime
				};
			}
			if (system && basis === DelayInterval.BASIS_TYPE.CurrentDate) {
				return {
					Name: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_BASIS_DATE'),
					SystemExpression: DelayInterval.BASIS_TYPE.CurrentDate
				};
			}
			let field = null;
			for (let i = 0; i < this.basisFields.length; ++i) {
				if (basis === this.basisFields[i].SystemExpression) {
					field = this.basisFields[i];
				}
			}
			return field;
		}
		prepareBasisFields() {
			const fields = [];
			for (let i = 0; i < this.basisFields.length; ++i) {
				const fld = this.basisFields[i];
				if (!fld.Id.includes('DATE_MODIFY') && !fld.Id.includes('EVENT_DATE') && !fld.Id.includes('BIRTHDATE')) {
					fields.push(fld);
				}
			}
			this.basisFields = fields;
		}
		renderAdditionalSettings(uid) {
			return '';
		}
		saveAdditionalSettings(formData) {}
	}

	/**
	 * Injection seam between the context-agnostic condition control and its
	 * environment. All methods are lazy - they are called while the control renders.
	 * The robot-flavoured implementation lives in `bizproc.automation`
	 * (`AutomationConditionContext`); the default lives here (`SimpleConditionContext`).
	 */
	class ConditionContext {
		getFields() {
			return [];
		}
		setFields(fields) {}
		resolveField(object, id) {
			return this.createSyntheticField(object, id);
		}
		getDocumentType() {
			return null;
		}
		getTitle() {
			return '';
		}
		createValueSelector(node, ctx) {
			return null;
		}
		createFieldMenu(condition, ctx) {
			return null;
		}
		createSyntheticField(object, id) {
			return {
				Id: id,
				ObjectId: object,
				Name: id,
				Type: 'string',
				Expression: id,
				SystemExpression: `{=${object}:${id}}`
			};
		}
	}

	/**
	 * Default, robot-free implementation. Fields/documentType/title come straight
	 * from the data it is built with (constructor options or `setFields`). The
	 * value-selector wraps a runtime callback and owns its date expression editor;
	 * the field menu is built from the plain field list.
	 */
	class SimpleConditionContext extends ConditionContext {
		#fields;
		#documentType;
		#title;
		constructor(options) {
			super();
			this.#fields = [];
			this.#documentType = null;
			this.#title = '';
			if (main_core.Type.isPlainObject(options)) {
				if (main_core.Type.isArray(options.fields)) {
					this.#fields = options.fields;
				}
				if (main_core.Type.isArray(options.documentType)) {
					this.#documentType = options.documentType;
				}
				if (main_core.Type.isStringFilled(options.title)) {
					this.#title = options.title;
				}
			}
		}
		getFields() {
			return this.#fields;
		}
		setFields(fields) {
			this.#fields = main_core.Type.isArray(fields) ? fields : [];
		}
		resolveField(object, id) {
			let field;
			if (object === 'Document') {
				for (let i = 0; i < this.#fields.length; ++i) {
					if (id === this.#fields[i].Id) {
						field = this.#fields[i];
					}
				}
			}
			return field || this.createSyntheticField(object, id);
		}
		getDocumentType() {
			return this.#documentType;
		}
		getTitle() {
			return this.#title;
		}
		createValueSelector(node, ctx) {
			const customSelectorFn = ctx?.customSelectorFn;
			const isDate = ['date', 'datetime'].includes(node.getAttribute('data-selector-type'));
			const isTime = node.getAttribute('data-selector-type') === 'time';
			const basisFields = this.#fields.filter(field => field.Type === 'date' || field.Type === 'datetime' || field.Type === 'UF:date');
			return {
				subscribe() {},
				parseTargetProperties() {},
				targetInput: null,
				renderTo(target) {
					if (!(target instanceof HTMLElement) || !target.parentNode) {
						return;
					}
					target.setAttribute('autocomplete', 'off');
					if (!target.id) {
						target.id = `${target.getAttribute('name') || 'bp-condition-value'}-${main_core.Text.getRandom()}`;
					}
					const calendarIcon = target.parentNode.querySelector('.calendar-icon');
					if (calendarIcon) {
						main_core.Dom.remove(calendarIcon);
					}
					const dotted = main_core.Tag.render`<span class="bizproc-automation-popup-select-dotted" data-testid="bp-condition-value-dotted"></span>`;
					if (main_core.Type.isFunction(customSelectorFn)) {
						main_core.Event.bind(dotted, 'click', () => customSelectorFn(target.id));
					}
					const wrapper = main_core.Tag.render`<div class="bizproc-automation-popup-select"></div>`;
					target.parentNode.replaceChild(wrapper, target);
					wrapper.appendChild(target);
					if (isDate) {
						new DelayIntervalSelector({
							labelNode: target,
							basisFields,
							useAfterBasis: true,
							onchange: delay => {
								target.value = delay.toExpression(basisFields);
								BX.fireEvent(target, 'change');
							}
						}).init(DelayInterval.fromString(target.value, basisFields));
					} else if (isTime) {
						new InlineTimeSelector({
							onchange: input => {
								BX.fireEvent(input, 'change');
							}
						}).renderTo(target);
					}
					wrapper.appendChild(dotted);
				}
			};
		}
		createFieldMenu(condition, ctx) {
			const fields = main_core.Type.isArrayFilled(ctx?.fields) ? ctx.fields : this.#fields;
			const menu = new main_popup.Menu({
				id: `bp-condition-field-menu-${main_core.Text.getRandom()}`,
				bindElement: ctx?.target,
				items: fields.map(field => ({
					text: main_core.Text.encode(field.Name),
					onclick: () => {
						menu.close();
						if (main_core.Type.isFunction(ctx?.onFieldChange)) {
							ctx.onFieldChange({
								...field,
								ObjectId: field.ObjectId ?? 'Document'
							});
						}
					}
				}))
			});
			return {
				openMenu: () => menu.show(),
				destroy: () => menu.destroy()
			};
		}
	}

	// `ui.entity-selector` is 244Kb of JS and 31Kb of CSS wanted by the `new` view alone, so it is kept
	// out of the `rel` of the extension: the condition dialogs of the robots, of the activities and of
	// the storage fields load `bizproc.condition` too and never build this control. The first open of
	// the list is a click of the user - a place where waiting for an extension is allowed.
	const ENTITY_SELECTOR_EXTENSION = 'ui.entity-selector';
	class ConditionFieldSelector {
		#fields;
		#target;
		#onSelect;
		#dialog = null;
		// A show that is still waiting for the extension is already open as far as the host is concerned:
		// a repeated click has to close it, and the load it started must not open a list behind it.
		#showId = 0;
		#isLoading = false;
		constructor(fields, target, onSelect) {
			this.#fields = fields;
			this.#target = target;
			this.#onSelect = onSelect;
		}
		isOpen() {
			return this.#dialog !== null || this.#isLoading;
		}
		async show() {
			this.destroy();
			const showId = ++this.#showId;
			this.#isLoading = true;
			let Dialog;
			try {
				({
					Dialog
				} = await main_core.Runtime.loadExtension(ENTITY_SELECTOR_EXTENSION));
			} finally {
				if (showId === this.#showId) {
					this.#isLoading = false;
				}
			}

			// The row may have been closed, repainted or removed while the extension was loading.
			if (showId !== this.#showId || !this.#target.isConnected) {
				return;
			}
			const dialog = new Dialog({
				targetNode: this.#target,
				width: 500,
				height: 300,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				showAvatars: false,
				compactView: true,
				cacheable: false,
				// Keep the dialog open on a click on its own target: the host toggles it instead.
				autoHideHandler: event => !this.#target.contains(event.target),
				items: this.#fields.map(field => ({
					// The dialog keys its items by id, and fields of different objects (Document,
					// Variable, Constant) may share an Id - without the object they collapse into one.
					id: `${field.ObjectId ?? ''}:${field.SystemExpression || field.Id}`,
					entityId: 'bp',
					tabs: 'recents',
					title: field.Name || field.Id,
					customData: {
						field
					}
				})),
				events: {
					onDestroy: () => {
						if (this.#dialog === dialog) {
							this.#dialog = null;
						}
					},
					'Item:onBeforeSelect': event => {
						if (this.#dialog !== dialog) {
							return;
						}
						event.preventDefault();
						const field = event.getData().item.getCustomData().get('field');
						// A non-cacheable dialog destroys itself on hide, and entity-selector keeps
						// calling it right after select(), so close it off that stack.
						setTimeout(() => this.destroy(), 0);
						this.#onSelect(field);
					}
				}
			});
			this.#dialog = dialog;
			dialog.show();
		}
		destroy() {
			this.#showId++;
			this.#isLoading = false;
			const dialog = this.#dialog;
			this.#dialog = null;
			// The dialog may already be destroyed by its own popup, which nulls the instance.
			if (dialog && main_core.Type.isFunction(dialog.destroy)) {
				dialog.destroy();
			}
		}
	}

	const ConditionViewMode = {
		Legacy: 'legacy',
		New: 'new'
	};
	const ICON_SIZE = 20;
	// The plus of the add button is the `icon l` of the mockup, a size below the icons of the cards.
	const ADD_ICON_SIZE = 18;

	// The plus is the only glyph the extension takes from the outline set, and the set costs 128Kb of
	// stylesheet on every page the extension is loaded on - the pages of the robots and of the debugger
	// included, where the `new` view is never built. So it is drawn here instead, with the geometry of
	// `ui/install/js/ui/icon-set/outline/dist/images/plus-l.svg` and `currentColor` in place of the
	// baked-in fill: the glyph keeps following the colour of the caption and the theme along with it.
	const ADD_ICON_PATH = 'M11.2998 18.3C11.2998 18.6866 11.6132 19 11.9998 19C12.3864 19 12.6998 18.6866 12.6998 18.3V12.6998H18.3C18.6866 12.6998 19 12.3864 19 11.9998C19 11.6132 18.6866 11.2998 18.3 11.2998H12.6998V5.7C12.6998 5.3134 12.3864 5 11.9998 5C11.6132 5 11.2998 5.3134 11.2998 5.7V11.2998H5.7C5.3134 11.2998 5 11.6132 5 11.9998C5 12.3864 5.3134 12.6998 5.7 12.6998H11.2998V18.3Z';

	// The cross of a card is the `cross-20` of `ui.icon-set.actions` - the set the legacy view of this
	// extension already draws its own cross from. It is written out here instead of being built by the
	// `Icon` of `ui.icon-set.api.core`: that extension is 52Kb of JS on every page `bizproc.condition`
	// is loaded on, the robots designer and the debugger included, where this view is never built. The
	// markup is the one `Icon.render()` produces, so the glyph and the colour still come from the set:
	// the icon is decorative and the accessible name stays on the control that carries it.
	function renderRemoveIcon() {
		const node = main_core.Tag.render`<div class="ui-icon-set --cross-20" aria-hidden="true"></div>`;
		main_core.Dom.style(node, '--ui-icon-set__icon-size', `${ICON_SIZE}px`);
		return node;
	}
	function normalizeConditionViewMode(viewMode) {
		return viewMode === ConditionViewMode.New ? ConditionViewMode.New : ConditionViewMode.Legacy;
	}
	class ConditionViewRenderer {
		// The description of a joined card states the rule its switch applies, so it belongs to the
		// joiner and not to the card.
		getJoinerDescription(joiner) {
			return main_core.Loc.getMessage(joiner === ConditionGroup.JOINER.Or ? 'BIZPROC_JS_AUTOMATION_CONDITION_JOINER_DESCRIPTION_OR' : 'BIZPROC_JS_AUTOMATION_CONDITION_JOINER_DESCRIPTION_AND');
		}

		// `Tag.render` appends an element substitution after the bare text of its tag, whatever their
		// order in the template, so the caption of the add button is an element of its own - that is
		// what keeps the plus in front of it.
		createGroupNode(conditionNodes) {
			return main_core.Tag.render`
			<div class="bizproc-condition-group-list" data-testid="bp-condition-group">
				<div ref="draggableNode" class="bizproc-condition-group__items">${conditionNodes}</div>
				<button ref="addButton" type="button" class="bizproc-condition-group__add" data-testid="bp-condition-group-add">
					<svg class="bizproc-condition-group__add-icon" width="${ADD_ICON_SIZE}" height="${ADD_ICON_SIZE}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${ADD_ICON_PATH}" fill="currentColor"></path></svg>
					<span class="bizproc-condition-group__add-caption">
						${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_TITLE'))}
					</span>
				</button>
			</div>
		`;
		}
		createRootGroupNode(conditionNode) {
			return main_core.Tag.render`
			<div class="bizproc-condition-group ui-draggable--item" data-testid="bp-condition-group-card">
				<div class="bizproc-condition-group__header" data-testid="bp-condition-header">
					<span class="bizproc-condition-group__drag" aria-hidden="true" data-testid="bp-condition-group-drag"></span>
					<span class="bizproc-condition-group__badge" data-testid="bp-condition-group-badge">
						${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_TITLE'))}
					</span>
					<span class="bizproc-condition-group__description" data-testid="bp-condition-group-description">
						${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_DESCRIPTION'))}
					</span>
					<span class="bizproc-condition-group__header-action" data-role="condition-header-action"></span>
				</div>
				<div class="bizproc-condition-group__items">${conditionNode}</div>
			</div>
		`;
		}
		createNestedGroupNode(conditionNode, joiner) {
			return main_core.Tag.render`
			<div class="bizproc-condition-group bizproc-condition-group--nested ui-draggable--item" data-testid="bp-condition-group-nested">
				<div class="bizproc-condition-group__header" data-testid="bp-condition-header">
					<span class="bizproc-condition-group__drag" aria-hidden="true" data-testid="bp-condition-group-drag"></span>
					<span class="bizproc-condition-group__joiner" data-role="condition-joiner">
						<button data-role="condition-joiner-and" data-testid="bp-condition-logic-and" type="button" aria-pressed="${joiner === ConditionGroup.JOINER.And ? 'true' : 'false'}" class="bizproc-condition-row__joiner-button ${joiner === ConditionGroup.JOINER.And ? '--active' : ''}">${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_CONDITION_AND'))}</button>
						<button data-role="condition-joiner-or" data-testid="bp-condition-logic-or" type="button" aria-pressed="${joiner === ConditionGroup.JOINER.Or ? 'true' : 'false'}" class="bizproc-condition-row__joiner-button ${joiner === ConditionGroup.JOINER.Or ? '--active' : ''}">${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_CONDITION_OR'))}</button>
					</span>
					<span class="bizproc-condition-group__description" data-role="condition-joiner-description" data-testid="bp-condition-group-description">${main_core.Text.encode(this.getJoinerDescription(joiner))}</span>
					<span class="bizproc-condition-group__header-action" data-role="condition-header-action"></span>
				</div>
				<div class="bizproc-condition-group__items">${conditionNode}</div>
			</div>
		`;
		}
	}

	const OPERATOR_MENU_MAX_HEIGHT = 320;
	class ConditionSelector extends main_core_events.EventEmitter {
		#condition;
		#fields;
		#joiner;
		#fieldPrefix;
		#rootGroupTitle;
		#onOpenFieldMenu;
		#onOpenMenu;
		#showValuesSelector;
		#context;
		#valueNode2 = null;
		#selectedField;
		#customSelectorFn = null;
		#viewMode = ConditionViewMode.Legacy;
		#fieldSelector = null;
		#operatorMenu = null;
		constructor(condition, options) {
			super();
			this.setEventNamespace('BX.Bizproc.Condition');
			this.#condition = condition;
			this.#fields = [];
			this.#joiner = ConditionGroup.JOINER.And;
			this.#fieldPrefix = 'condition_';
			if (main_core.Type.isPlainObject(options)) {
				if (main_core.Type.isArray(options.fields)) {
					// Shallow-clone each field so tagging ObjectId doesn't mutate the caller's array.
					this.#fields = options.fields.map(field => ({
						...field,
						ObjectId: 'Document'
					}));
				}
				if (options.joiner && options.joiner === ConditionGroup.JOINER.Or) {
					this.#joiner = ConditionGroup.JOINER.Or;
				}
				if (options.fieldPrefix) {
					this.#fieldPrefix = options.fieldPrefix;
				}
				this.#rootGroupTitle = options.rootGroupTitle;
				this.#onOpenFieldMenu = options.onOpenFieldMenu;
				this.#onOpenMenu = options.onOpenMenu;
				this.#showValuesSelector = options.showValuesSelector ?? true;
				this.#customSelectorFn = options.customSelectorFn;
				this.#context = options.context;
				this.#viewMode = normalizeConditionViewMode(options.viewMode);
			}
			if (!(this.#context instanceof ConditionContext)) {
				this.#context = new SimpleConditionContext({
					fields: this.#fields
				});
			}
		}
		getCondition() {
			return this.#condition;
		}
		getJoiner() {
			return this.#joiner;
		}
		setJoiner(joiner) {
			if (joiner !== ConditionGroup.JOINER.And && joiner !== ConditionGroup.JOINER.Or) {
				return;
			}
			this.#joiner = joiner;
			if (this.joinerNode) {
				this.joinerNode.value = this.#joiner;
			}
			this.emit('onChange', new main_core_events.BaseEvent({
				data: {
					conditionSelector: this
				}
			}));
		}
		createNode() {
			if (this.#viewMode === ConditionViewMode.New) {
				return this.#createNewNode();
			}
			return this.#createLegacyNode();
		}
		#createLegacyNode() {
			const conditionValueNode = this.#createValueNode(serializeConditionValue(this.#condition.operator, this.#condition.value));
			const conditionValueNode2 = this.#createSecondValueNode();
			const {
				root,
				conditionObjectNode,
				conditionFieldNode,
				conditionOperatorNode,
				labelNode
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings__condition-selector ui-draggable--item" data-testid="bp-condition-row">
				<div class="bizproc-automation-popup-settings__condition-item">
					<input
						ref="conditionObjectNode"
						type="hidden"
						name="${main_core.Text.encode(`${this.#fieldPrefix}object[]`)}"
						value="${main_core.Text.encode(this.#condition.object)}"
					/>
					<input
						ref="conditionFieldNode"
						type="hidden"
						name="${main_core.Text.encode(`${this.#fieldPrefix}field[]`)}"
						value="${main_core.Text.encode(this.#condition.field)}"
					/>
					<input
						ref="conditionOperatorNode"
						type="hidden"
						name="${main_core.Text.encode(`${this.#fieldPrefix}operator[]`)}"
						value="${main_core.Text.encode(this.#condition.operator)}"
					/>
					${conditionValueNode}
					${conditionValueNode2}
					<div class="bizproc-automation-popup-settings__condition-item_draggable" data-testid="bp-condition-drag">
						<div class="ui-icon-set --more-points"></div>
					</div>
					<div
						ref="labelNode"
						class="bizproc-automation-popup-settings__condition-item_content"
						data-testid="bp-condition-row-label"
					></div>
					${this.#createRemoveButton()}
				</div>
				${this.#createJoinerSwitcher()}
			</div>
		`;
			this.node = root;
			this.objectNode = conditionObjectNode;
			this.fieldNode = conditionFieldNode;
			this.operatorNode = conditionOperatorNode;
			this.valueNode = conditionValueNode;
			this.#valueNode2 = conditionValueNode2 === '' ? null : conditionValueNode2;
			this.labelNode = labelNode;
			this.setLabelText();
			this.bindLabelNode();
			return this.node;
		}
		#createNewNode() {
			const conditionValueNode = this.#createValueNode(serializeConditionValue(this.#condition.operator, this.#condition.value));
			const conditionValueNode2 = this.#createSecondValueNode();
			const valueRow = this.#createNewValueRow();
			const {
				root,
				conditionObjectNode,
				conditionFieldNode,
				conditionOperatorNode,
				conditionJoinerNode,
				fieldEditorNode,
				operatorEditorNode,
				labelNode,
				removeButtonNode
			} = main_core.Tag.render`
			<div class="bizproc-condition-row ui-draggable--item" data-testid="bp-condition-row">
				<input ref="conditionObjectNode" type="hidden" name="${main_core.Text.encode(`${this.#fieldPrefix}object[]`)}" value="${main_core.Text.encode(this.#condition.object)}" />
				<input ref="conditionFieldNode" type="hidden" name="${main_core.Text.encode(`${this.#fieldPrefix}field[]`)}" value="${main_core.Text.encode(this.#condition.field)}" />
				<input ref="conditionOperatorNode" type="hidden" name="${main_core.Text.encode(`${this.#fieldPrefix}operator[]`)}" value="${main_core.Text.encode(this.#condition.operator)}" />
				<input ref="conditionJoinerNode" type="hidden" name="${main_core.Text.encode(`${this.#fieldPrefix}joiner[]`)}" value="${main_core.Text.encode(this.#joiner)}" />
				${conditionValueNode}
				${conditionValueNode2}
				<div class="bizproc-condition-row__field">
					<span class="bizproc-condition-row__field-label" data-testid="bp-condition-field-label">
						${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_FIELD'))}
					</span>
					<div ref="fieldEditorNode" class="bizproc-condition-row__field-control ui-ctl ui-ctl-after-icon ui-ctl-dropdown" data-testid="bp-condition-field-control"></div>
				</div>
				<div class="bizproc-condition-row__operator">
					<span class="bizproc-condition-row__operator-label" data-testid="bp-condition-operator-label">
						${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_OPERATOR'))}
					</span>
					<button ref="operatorEditorNode" type="button" class="bizproc-condition-row__operator-control" data-testid="bp-condition-operator-control"></button>
				</div>
				${valueRow}
				<button ref="labelNode" type="button" class="bizproc-condition-row__editor" data-testid="bp-condition-row-label"></button>
				<button ref="removeButtonNode" type="button" class="bizproc-condition-row__remove" data-testid="bp-condition-remove" aria-label="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_REMOVE_ARIA_LABEL'))}">${renderRemoveIcon()}</button>
			</div>
		`;
			this.node = root;
			this.objectNode = conditionObjectNode;
			this.fieldNode = conditionFieldNode;
			this.operatorNode = conditionOperatorNode;
			this.joinerNode = conditionJoinerNode;
			this.valueNode = conditionValueNode;
			this.#valueNode2 = conditionValueNode2 === '' ? null : conditionValueNode2;
			this.fieldEditorNode = fieldEditorNode;
			this.operatorEditorNode = operatorEditorNode;
			this.labelNode = labelNode;
			this.setLabelText();
			this.bindLabelNode();
			main_core.Event.bind(fieldEditorNode, 'click', this.onInlineFieldClick.bind(this));
			main_core.Event.bind(operatorEditorNode, 'click', this.onInlineOperatorClick.bind(this));
			main_core.Event.bind(removeButtonNode, 'click', this.removeCondition.bind(this));
			return this.node;
		}
		#createNewValueRow() {
			if (isValuelessOperator(this.#condition.operator)) {
				return '';
			}
			const {
				root,
				valueEditorNode
			} = main_core.Tag.render`
			<div class="bizproc-condition-row__value">
				<span class="bizproc-condition-row__value-label" data-testid="bp-condition-value-label">
					${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_VALUE'))}
				</span>
				<div ref="valueEditorNode" class="bizproc-condition-row__value-control" data-testid="bp-condition-value-control"></div>
			</div>
		`;
			this.valueEditorNode = valueEditorNode;

			// A control the registry has no local renderer for is drawn by the server and lands here
			// after the row is built, so the row - not the inputs - carries the handlers, and the
			// inputs are read at event time. Capture: `blur` does not bubble, and the host writes its
			// own value with a `change` that does not bubble either.
			const saveValue = () => this.#saveValue(valueEditorNode);
			main_core.Event.bind(valueEditorNode, 'change', saveValue, true);
			main_core.Event.bind(valueEditorNode, 'blur', saveValue, true);
			return root;
		}

		// Only the fields the control was asked to name carry the value. Everything else it renders -
		// the "..." button of the value selector, printable `_text` companions, the timezone of a
		// datetime - must stay out, or the last node in the container becomes the saved value.
		#getValueInputs(valueEditorNode) {
			const name = `${this.#fieldPrefix}value`;
			return [...valueEditorNode.querySelectorAll(`[name="${name}"], [name="${name}[]"]`)];
		}
		#saveValue(valueEditorNode) {
			// A row replaced by an operator change keeps its handlers until it is dropped.
			if (!this.#condition || valueEditorNode !== this.valueEditorNode) {
				return;
			}
			const valueInputs = this.#getValueInputs(valueEditorNode);
			if (valueInputs.length === 0) {
				return;
			}
			const lastInput = valueInputs[valueInputs.length - 1];
			let value = lastInput.value;
			if (this.#condition.operator === Operator.BETWEEN && valueInputs.length > 1) {
				value = [valueInputs[0].value, valueInputs[1].value];
			} else if (isMultiValueOperator(this.#condition.operator) && lastInput.multiple) {
				value = [...lastInput.selectedOptions].map(option => option.value);
			}

			// Bound to both `change` and `blur`, so one edit gets here more than once; each pass
			// re-serializes the whole group for the host, so a pass without a new value is skipped.
			if (this.#isCurrentValue(value)) {
				return;
			}

			// setValue('') collapses '=' / '!=' into the empty operators: keep the chosen one.
			const currentOperator = this.#condition.operator;
			this.#condition.setValue(value);
			this.#condition.setOperator(currentOperator);
			this.updateValueNode();
			this.emit('onChange', new main_core_events.BaseEvent({
				data: {
					conditionSelector: this
				}
			}));
		}

		// Compared as read from the control: a BETWEEN pair and a multi-select list have to differ
		// element by element, which the single-slot serialization of the transport cannot express.
		#isCurrentValue(value) {
			return JSON.stringify(value ?? '') === JSON.stringify(this.#condition.value ?? '');
		}

		// BETWEEN is transported as two consecutive value slots (see ConditionGroup.createFromForm),
		// so a row that carries it renders both from the start - one slot would take the value of the
		// next row for its second end.
		#createSecondValueNode() {
			if (this.#condition.operator !== Operator.BETWEEN) {
				return '';
			}
			return this.#createValueNode(this.#getSecondValue());
		}

		// Only a pair carries a second end: until both ends are filled the value is a plain string,
		// and indexing that puts its second character into the slot.
		#getSecondValue() {
			const value = this.#condition.value;
			return main_core.Type.isArrayFilled(value) && value.length > 1 ? value[1] : '';
		}
		#createValueNode(value) {
			return main_core.Tag.render`
			<input
				type="hidden"
				name="${main_core.Text.encode(`${this.#fieldPrefix}value[]`)}"
				value="${main_core.Text.encode(value)}"
			>
		`;
		}
		#getPopupValueInputs(valueWrapper) {
			const name = `${this.#fieldPrefix}value`;
			return [...valueWrapper.querySelectorAll(`[name="${name}"], [name="${name}[]"]`)];
		}
		#createRemoveButton() {
			const {
				root,
				removeButtonNode
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings__condition-item_close">
				<div ref="removeButtonNode" class="ui-icon-set --cross-20" data-testid="bp-condition-remove"></div>
			</div>
		`;
			main_core.Event.bind(removeButtonNode, 'click', this.removeCondition.bind(this));
			return root;
		}
		#createJoinerSwitcher() {
			const {
				root,
				switcherBtnAnd,
				switcherBtnOr,
				inputNode
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings__condition-switcher" data-testid="bp-condition-logic-toggle">
				<div class="bizproc-automation-popup-settings__condition-switcher_wrapper">
					<span
						ref="switcherBtnAnd"
						class="bizproc-automation-popup-settings__condition-switcher_btn ${this.#joiner === 'AND' ? '--active' : ''}"
						data-testid="bp-condition-logic-and"
					>
						${main_core.Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_CONDITION_AND')}
					</span>
					<span
						ref="switcherBtnOr"
						class="bizproc-automation-popup-settings__condition-switcher_btn ${this.#joiner === 'OR' ? '--active' : ''}"
						data-testid="bp-condition-logic-or"
					>
						${main_core.Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_CONDITION_OR')}
					</span>
				</div>
				<input
					ref="inputNode"
					type="hidden"
					name="${main_core.Text.encode(`${this.#fieldPrefix}joiner[]`)}"
					value="${main_core.Text.encode(this.#joiner)}"
				/>
			</div>
		`;
			this.joinerNode = inputNode;
			main_core.Event.bind(root, 'click', () => {
				this.#joiner = this.#joiner === ConditionGroup.JOINER.Or ? ConditionGroup.JOINER.And : ConditionGroup.JOINER.Or;
				if (this.joinerNode) {
					this.joinerNode.value = this.#joiner;
				}
				main_core.Dom.toggleClass(switcherBtnOr, '--active');
				main_core.Dom.toggleClass(switcherBtnAnd, '--active');
			});
			return root;
		}
		init(condition) {
			this.#condition = condition;
			this.setLabelText();
			this.bindLabelNode();
		}
		setLabelText() {
			if (!this.labelNode || !this.#condition) {
				return;
			}
			main_core.Dom.clean(this.labelNode);
			if (this.#viewMode === ConditionViewMode.New) {
				const field = this.getField(this.#condition.object, this.#condition.field);
				main_core.Dom.clean(this.fieldEditorNode);
				main_core.Dom.append(main_core.Tag.render`
					<div class="ui-ctl-element bizproc-condition-row__field-control-text">
						${main_core.Text.encode(field?.Name || this.#condition.field || main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_FIELD_NOT_SELECTED'))}
					</div>
				`, this.fieldEditorNode);
				main_core.Dom.append(main_core.Tag.render`<span class="ui-ctl-after ui-ctl-icon-angle" aria-hidden="true"></span>`, this.fieldEditorNode);
				main_core.Dom.clean(this.operatorEditorNode);
				main_core.Dom.append(main_core.Tag.render`<span class="bizproc-condition-row__operator-control-text">${main_core.Text.encode(this.getOperatorLabel(this.#condition.operator))}</span>`, this.operatorEditorNode);
				main_core.Dom.append(main_core.Tag.render`<span class="bizproc-condition-row__control-chevron" aria-hidden="true"></span>`, this.operatorEditorNode);
				this.#renderValueEditor(field);
				return;
			}
			const textClass = 'bizproc-automation-popup-settings__condition-text';
			if (this.#condition.field === '') {
				main_core.Dom.append(main_core.Tag.render`
					<span class="${textClass}">
						${main_core.Text.encode(this.getOperatorLabel(Operator.EMPTY))}
					</span>
				`, this.labelNode);
			} else {
				const field = this.getField(this.#condition.object, this.#condition.field) || '?';
				const valueLabel = this.#getValueLabel(field, this.labelNode);
				main_core.Dom.append(main_core.Tag.render`<span class="${textClass}">${main_core.Text.encode(field.Name)}</span>`, this.labelNode);
				main_core.Dom.append(main_core.Tag.render`
					<span class="${textClass}">
						${main_core.Text.encode(this.getOperatorLabel(this.#condition.operator))}
					</span>
				`, this.labelNode);
				if (valueLabel) {
					main_core.Dom.append(main_core.Tag.render`<span data-role="value-label" class="${textClass}">${main_core.Text.encode(valueLabel)}</span>`, this.labelNode);
				}
			}
		}
		#getValueLabel(field, labelNode) {
			const operator = this.#condition.operator;
			const value = this.#condition.value;
			if (operator === 'between') {
				return main_core.Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_CONDITION_BETWEEN_VALUE_1', {
					'#VALUE_1#': BX.Bizproc.FieldType.formatValuePrintable(field, main_core.Type.isArrayFilled(value) ? value[0] : value),
					'#VALUE_2#': BX.Bizproc.FieldType.formatValuePrintable(field, main_core.Type.isArrayFilled(value) ? value[1] : '')
				});
			}
			if (!operator.includes('empty')) {
				return BX.Bizproc.FieldType.formatValuePrintable(field, value, labelNode);
			}
			return null;
		}
		bindLabelNode() {
			if (this.labelNode) {
				main_core.Event.bind(this.labelNode, 'click', this.onLabelClick.bind(this));
			}
		}
		onLabelClick() {
			this.showPopup();
		}
		onInlineFieldClick() {
			if (this.#fieldSelector?.isOpen()) {
				this.#fieldSelector.destroy();
				this.#fieldSelector = null;
				return;
			}
			const fields = this.filterFields();
			this.#fieldSelector?.destroy();
			const fieldSelector = new ConditionFieldSelector(fields, this.fieldEditorNode, field => {
				if (this.#fieldSelector !== fieldSelector || !field || !this.#condition || !this.fieldEditorNode?.isConnected) {
					return;
				}
				this.#fieldSelector = null;
				this.#condition.setObject(field.ObjectId);
				this.#condition.setField(field.Id);
				const operators = this.getOperators(field.Type, field.Multiple);
				const nextOperator = operators[this.#condition.operator] ? this.#condition.operator : Operator.EQUAL;
				this.#condition.setValue('');
				// setValue('') collapses '=' / '!=' into the empty operators, so restore the intended one.
				this.#condition.setOperator(nextOperator);
				// Data first, painting last: the value control belongs to the host and may fail to
				// render, and a failed repaint must not leave the transport on the previous field.
				this.updateValueNode();
				this.emit('onChange', new main_core_events.BaseEvent({
					data: {
						conditionSelector: this
					}
				}));
				this.#refreshNewValueRow();
				this.setLabelText();
			});
			this.#fieldSelector = fieldSelector;
			fieldSelector.show().catch(error => console.error(error));
		}
		onInlineOperatorClick() {
			const field = this.getField(this.#condition.object, this.#condition.field);
			if (!field || !this.operatorEditorNode) {
				return;
			}
			const operatorList = this.getOperators(field.Type, field.Multiple);
			// Esc, a click outside or a repeated click on the control only close the popup, and a
			// closed popup stays in the manager registry holding this row - so the previous menu
			// goes before a new one is built.
			this.#destroyOperatorMenu();
			this.#operatorMenu = new main_popup.Menu({
				id: `bp-condition-operator-menu-${main_core.Text.getRandom()}`,
				bindElement: this.operatorEditorNode,
				maxHeight: OPERATOR_MENU_MAX_HEIGHT,
				items: Object.entries(operatorList).map(([operator, label]) => ({
					// MenuItem escapes only ["'<>] for the `text` option and leaves `&` alone on purpose
					// (`encodeSafe` in main/install/js/main/popup/src/menu/menu-item.ts), then renders the
					// result as html - so the two encoders compose instead of escaping twice, and an
					// entity sequence written inside the label survives to the user.
					text: main_core.Text.encode(label),
					dataset: {
						testid: `bp-condition-operator-item-${operator}`
					},
					onclick: () => {
						this.#destroyOperatorMenu();
						// The value was entered under the previous operator: the new one gets it in its own
						// shape, or none at all. setValue() collapses '=' / '!=' into the empty operators,
						// so the picked operator is set after it.
						this.#condition.setValue(adaptValueToOperator(operator, this.#condition.value));
						this.#condition.setOperator(operator);
						if (this.operatorNode) {
							this.operatorNode.value = operator;
						}

						// Same order as on a field change: transport and consumer before the repaint.
						this.updateValueNode();
						this.emit('onChange', new main_core_events.BaseEvent({
							data: {
								conditionSelector: this
							}
						}));
						this.#refreshNewValueRow();
						this.setLabelText();
					}
				}))
			});
			this.#operatorMenu.show();
		}
		#destroyOperatorMenu() {
			if (this.#operatorMenu) {
				this.#operatorMenu.close();
				this.#operatorMenu.destroy();
				this.#operatorMenu = null;
			}
		}

		// The value is a live control, like the fields of an action construction: it is rendered at once,
		// keeps its own value selector working and never swaps between a caption and an editor.
		#renderValueEditor(field) {
			if (!this.valueEditorNode) {
				return;
			}
			main_core.Dom.clean(this.valueEditorNode);
			if (!field) {
				return;
			}
			main_core.Dom.append(this.#getValueNode(field, this.#condition.value, this.#condition.operator), this.valueEditorNode);
		}
		#refreshNewValueRow() {
			if (this.#viewMode !== ConditionViewMode.New || !this.node) {
				return;
			}
			const currentRow = this.node.querySelector('.bizproc-condition-row__value');
			const nextRow = this.#createNewValueRow();
			if (currentRow && nextRow === '') {
				main_core.Dom.remove(currentRow);
				this.valueEditorNode = null;
				return;
			}
			if (!currentRow && nextRow !== '') {
				this.operatorEditorNode.parentNode.after(nextRow);
				return;
			}
			if (currentRow && nextRow !== '') {
				main_core.Dom.replace(currentRow, nextRow);
			}
		}
		showPopup() {
			if (this.popup) {
				this.popup.show();
				return;
			}
			const fields = this.filterFields();
			const objectSelect = main_core.Tag.render`<input type="hidden" class="bizproc-automation-popup-settings-dropdown"/>`;
			const {
				root: fieldSelectLabel,
				fieldSelect
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings-dropdown" readonly="readonly" data-testid="bp-condition-field-trigger">
				<input ref="fieldSelect" type="hidden" class="bizproc-automation-popup-settings-dropdown"/>
			</div>
		`;
			main_core.Event.bind(fieldSelectLabel, 'click', this.onFieldSelectorClick.bind(this, fieldSelectLabel, fieldSelect, fields, objectSelect));
			let selectedField = this.getField(this.#condition.object, this.#condition.field);
			if (!this.#condition.field) {
				selectedField = fields[0];
			}
			this.#selectedField = selectedField;
			fieldSelect.value = selectedField.Id;
			objectSelect.value = selectedField.ObjectId ?? this.#condition.object;
			fieldSelectLabel.textContent = selectedField.Name;
			const valueInput = this.#getValueNode(selectedField, this.#condition.value, this.#condition.operator);
			const valueWrapper = main_core.Tag.render`<div class="bizproc-automation-popup-settings" data-testid="bp-condition-value">${valueInput}</div>`;
			const operatorSelect = this.createOperatorNode(selectedField, valueWrapper);
			if (this.#condition.field !== '') {
				operatorSelect.value = this.#condition.operator;
			}
			const {
				root: form,
				operatorWrapper
			} = main_core.Tag.render`
			<form class="bizproc-automation-popup-select-block" data-testid="bp-condition-form">
				<div class="bizproc-automation-popup-settings">${fieldSelectLabel}</div>
				<div ref="operatorWrapper" class="bizproc-automation-popup-settings">${operatorSelect}</div>
				${valueWrapper}
			</form>
		`;
			main_core.Event.bind(fieldSelect, 'change', this.onFieldChange.bind(this, fieldSelect, operatorWrapper, valueWrapper, objectSelect));
			this.popup = new main_popup.Popup({
				id: 'bizproc-automation-popup-set',
				bindElement: this.labelNode,
				content: form,
				closeByEsc: true,
				buttons: [new ui_buttons.Button({
					color: ui_buttons.Button.Color.PRIMARY,
					text: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CHOOSE_BUTTON_CAPS'),
					dataset: {
						testid: 'bp-condition-choose'
					},
					onclick: () => {
						this.#condition.setObject(objectSelect.value);
						this.#condition.setField(fieldSelect.value);
						this.#condition.setOperator(operatorWrapper.firstChild.value);
						const valueInputs = this.#getPopupValueInputs(valueWrapper);
						if (valueInputs.length > 0) {
							const lastInput = valueInputs[valueInputs.length - 1];
							let value = lastInput.value;
							if (this.#condition.operator === Operator.BETWEEN && valueInputs.length > 1) {
								value = [valueInputs[0].value, valueInputs[1].value];
							} else if (isMultiValueOperator(this.#condition.operator) && lastInput.multiple) {
								value = [...lastInput.selectedOptions].map(option => option.value);
							}
							this.#condition.setValue(value);
						} else {
							this.#condition.setValue('');
						}
						this.setLabelText();
						const field = this.getField(this.#condition.object, this.#condition.field);
						if (field && field.Type === 'UF:address') {
							const input = valueWrapper.querySelector(`[name="${this.#fieldPrefix}value"]`);
							this.#condition.setValue(input ? input.value : '');
						}
						this.updateValueNode();
						this.emit('onChange', new main_core_events.BaseEvent({
							data: {
								conditionSelector: this
							}
						}));
						this.popup.close();
					}
				}), new ui_buttons.CancelButton({
					text: main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CANCEL_BUTTON_CAPS'),
					dataset: {
						testid: 'bp-condition-cancel'
					},
					onclick: () => {
						this.popup.close();
					}
				})],
				className: 'bizproc-automation-popup-set',
				closeIcon: false,
				autoHide: false,
				events: {
					onClose: () => {
						this.popup.destroy();
						if (this.fieldDialog) {
							this.fieldDialog.destroy();
							delete this.fieldDialog;
						}
						delete this.popup;
					}
				},
				titleBar: false,
				angle: true,
				overlay: {
					backgroundColor: 'transparent'
				},
				offsetLeft: 45
			});
			this.popup.show();
		}
		onFieldSelectorClick(fieldSelectLabel, fieldSelect, fields, objectSelect, event) {
			if (!this.fieldDialog) {
				this.fieldDialog = this.#context.createFieldMenu(this.#condition, {
					fields: this.#fields,
					rootGroupTitle: this.#rootGroupTitle,
					onOpenFieldMenu: this.#onOpenFieldMenu,
					target: fieldSelectLabel,
					onFieldChange: property => {
						fieldSelectLabel.textContent = property.Name;
						fieldSelect.value = property.Id;
						objectSelect.value = property.ObjectId;
						BX.fireEvent(fieldSelect, 'change');
					}
				});
			}
			if (this.fieldDialog) {
				this.fieldDialog.openMenu(event);
			}
		}
		updateValueNode() {
			if (this.#condition) {
				if (this.objectNode) {
					this.objectNode.value = this.#condition.object;
				}
				if (this.fieldNode) {
					this.fieldNode.value = this.#condition.field;
				}
				if (this.operatorNode) {
					this.operatorNode.value = this.#condition.operator;
				}
				if (this.valueNode) {
					this.valueNode.value = serializeConditionValue(this.#condition.operator, this.#condition.value);
				}
				if (this.#condition.operator === Operator.BETWEEN) {
					const value2 = this.#getSecondValue();
					if (this.#valueNode2) {
						this.#valueNode2.value = value2;
					} else {
						this.#valueNode2 = this.#createValueNode(value2);
						main_core.Dom.append(this.#valueNode2, this.node);
					}
				} else if (main_core.Type.isDomNode(this.#valueNode2)) {
					main_core.Dom.remove(this.#valueNode2);
					this.#valueNode2 = null;
				}
			}
		}
		onFieldChange(selectNode, conditionWrapper, valueWrapper, objectSelect) {
			const field = this.getField(objectSelect.value, selectNode.value);
			const operatorNode = this.createOperatorNode(field, valueWrapper);

			// clean value if field types are different
			if (field.Type !== this.#selectedField?.Type) {
				main_core.Dom.clean(valueWrapper);
			}
			this.#selectedField = field;

			// keep selected operator if possible
			if (this.getOperators(field.Type, field.Multiple)[conditionWrapper.firstChild.value]) {
				operatorNode.value = conditionWrapper.firstChild.value;
			}
			conditionWrapper.replaceChild(operatorNode, conditionWrapper.firstChild);
			this.onOperatorChange(operatorNode, field, valueWrapper);
		}
		onOperatorChange(selectNode, field, valueWrapper) {
			const valueInput = valueWrapper.querySelector(`[name^="${this.#fieldPrefix}value"]`);
			let value = valueInput?.value || this.#condition.value;
			if (valueInput?.multiple) {
				value = [...valueInput.selectedOptions].map(option => option.value);
			}
			main_core.Dom.clean(valueWrapper);
			main_core.Dom.append(this.#getValueNode(field, value, selectNode.value), valueWrapper);
		}
		#getValueNode(field, value, operator) {
			if (operator === Operator.BETWEEN) {
				return main_core.Tag.render`
				<div>
					${this.createValueNode(field, main_core.Type.isArrayFilled(value) ? value[0] : value)}
					<div style="height: 8px;"></div>
					${this.createValueNode(field, main_core.Type.isArrayFilled(value) ? value[1] : '')}
				</div>
			`;
			}
			if (!operator.includes('empty')) {
				const multiValueSelect = field.Type === 'select' && isMultiValueOperator(operator);
				return this.createValueNode(field, value, multiValueSelect);
			}
			return '';
		}
		getField(object, id) {
			return this.#context.resolveField(object, id);
		}
		getOperators(fieldType, multiple) {
			const allLabels = Operator.getAllLabels();
			let list = {
				'!empty': allLabels[Operator.NOT_EMPTY],
				'empty': allLabels[Operator.EMPTY],
				'=': allLabels[Operator.EQUAL],
				'!=': allLabels[Operator.NOT_EQUAL]
			};
			switch (fieldType) {
				case 'file':
				case 'UF:crm':
				case 'UF:resourcebooking':
				case 'email':
				case 'phone':
				case 'web':
				case 'im':
					list = {
						'!empty': allLabels[Operator.NOT_EMPTY],
						'empty': allLabels[Operator.EMPTY]
					};
					break;
				case 'bool':
				case 'entityselector':
					if (multiple) {
						list[Operator.CONTAIN] = allLabels[Operator.CONTAIN];
						list[Operator.NOT_CONTAIN] = allLabels[Operator.NOT_CONTAIN];
					}
					break;
				case 'select':
					list[Operator.IN] = allLabels[Operator.IN];
					list[Operator.NOT_IN] = allLabels[Operator.NOT_IN];
					if (multiple) {
						list[Operator.CONTAIN] = allLabels[Operator.CONTAIN];
						list[Operator.NOT_CONTAIN] = allLabels[Operator.NOT_CONTAIN];
					}
					break;
				case 'user':
					list[Operator.IN] = allLabels[Operator.IN];
					list[Operator.NOT_IN] = allLabels[Operator.NOT_IN];
					list[Operator.CONTAIN] = allLabels[Operator.CONTAIN];
					list[Operator.NOT_CONTAIN] = allLabels[Operator.NOT_CONTAIN];
					break;
				default:
					list[Operator.IN] = allLabels[Operator.IN];
					list[Operator.NOT_IN] = allLabels[Operator.NOT_IN];
					list[Operator.CONTAIN] = allLabels[Operator.CONTAIN];
					list[Operator.NOT_CONTAIN] = allLabels[Operator.NOT_CONTAIN];
					list[Operator.GREATER_THEN] = allLabels[Operator.GREATER_THEN];
					list[Operator.GREATER_THEN_OR_EQUAL] = allLabels[Operator.GREATER_THEN_OR_EQUAL];
					list[Operator.LESS_THEN] = allLabels[Operator.LESS_THEN];
					list[Operator.LESS_THEN_OR_EQUAL] = allLabels[Operator.LESS_THEN_OR_EQUAL];
			}
			if (['time', 'date', 'datetime', 'int', 'double'].includes(fieldType) || main_core.Type.isUndefined(fieldType)) {
				list[Operator.BETWEEN] = allLabels[Operator.BETWEEN];
			}
			return list;
		}
		getOperatorLabel(id) {
			return Operator.getOperatorLabel(id);
		}
		filterFields() {
			const filtered = [];
			for (let i = 0; i < this.#fields.length; ++i) {
				const type = this.#fields[i].Type;
				if (type === 'bool' || type === 'date' || type === 'datetime' || type === 'double' || type === 'file' || type === 'int' || type === 'select' || type === 'string' || type === 'text' || type === 'user' || type === 'UF:money' || type === 'UF:crm' || type === 'UF:resourcebooking' || type === 'UF:url') {
					filtered.push(this.#fields[i]);
				}
			}
			return filtered;
		}
		createValueNode(docField, value, multiple = false) {
			const docType = this.#context.getDocumentType();
			const field = main_core.Runtime.clone(docField);
			field.Multiple = multiple;
			let valueNodes;
			if (this.#customSelectorFn && field.Type === 'user') {
				valueNodes = BX.Bizproc.FieldType.renderControlDesigner(docType, field, `${this.#fieldPrefix}value`, value, false);
			} else {
				valueNodes = BX.Bizproc.FieldType.renderControlPublic(docType, field, `${this.#fieldPrefix}value`, value, false);
			}
			valueNodes.querySelectorAll('[data-role]').forEach(node => {
				const selector = this.#context.createValueSelector(node, {
					rootGroupTitle: this.#rootGroupTitle,
					customSelectorFn: this.#customSelectorFn
				});
				if (selector) {
					if (this.#showValuesSelector === true) {
						if (main_core.Type.isFunction(this.#onOpenMenu)) {
							selector.subscribe('onOpenMenu', this.#onOpenMenu);
						}
						selector.renderTo(node);
					} else {
						selector.targetInput = node;
						selector.parseTargetProperties();
					}
				}
			});
			return valueNodes;
		}
		createOperatorNode(field, valueWrapper) {
			const select = main_core.Dom.create('select', {
				attrs: {
					className: 'bizproc-automation-popup-settings-dropdown'
				},
				dataset: {
					testid: 'bp-condition-operator'
				}
			});
			const operatorList = this.getOperators(field.Type, field.Multiple);
			for (const operatorId in operatorList) {
				if (!operatorList.hasOwnProperty(operatorId)) {
					continue;
				}
				main_core.Dom.append(main_core.Tag.render`
					<option value="${main_core.Text.encode(operatorId)}">${main_core.Text.encode(operatorList[operatorId])}</option>
				`, select);
			}
			main_core.Event.bind(select, 'change', this.onOperatorChange.bind(this, select, field, valueWrapper));
			return select;
		}
		removeCondition(event) {
			this.emit('onRemoveConditionClick', new main_core_events.BaseEvent({
				data: {
					conditionSelector: this
				}
			}));
			this.#fieldSelector?.destroy();
			this.#fieldSelector = null;
			this.#destroyOperatorMenu();
			this.#condition = null;
			main_core.Dom.remove(this.node);
			this.labelNode = null;
			this.fieldEditorNode = null;
			this.operatorEditorNode = null;
			this.valueEditorNode = null;
			this.fieldNode = null;
			this.operatorNode = null;
			this.valueNode = null;
			this.#valueNode2 = null;
			this.node = null;
			event.stopPropagation();
		}
		changeJoiner(btn, event) {}
		destroy() {
			this.#fieldSelector?.destroy();
			this.#fieldSelector = null;
			this.#destroyOperatorMenu();
			if (this.popup) {
				this.popup.close();
			}
		}
	}

	class ConditionGroupSelector extends main_core_events.EventEmitter {
		modern = true; // todo: remove 2024

		#conditionGroup;
		#fields;
		#fieldPrefix;
		#itemSelectors;
		#onOpenFieldMenu;
		#onOpenMenu;
		#showValuesSelector;
		#rootGroupTitle;
		#context;
		#options = {};
		#toggleButtonNode;
		#draggableNode;
		#draggable = null;
		#conditionContentNode = null;
		#toggleTextNode = null;
		#customSelectorFn = null;
		#expandedInputNode = null;
		#renderExpandedInput = false;
		#viewMode = ConditionViewMode.Legacy;
		#renderHeaderAction = null;
		#removeButtons = new WeakMap();
		constructor(conditionGroup, options) {
			super();
			this.setEventNamespace('BX.Bizproc.Condition');
			this.#conditionGroup = conditionGroup;
			this.#fields = [];
			this.#fieldPrefix = 'condition_';
			this.#itemSelectors = [];
			if (main_core.Type.isPlainObject(options)) {
				if (main_core.Type.isArray(options.fields)) {
					this.#fields = options.fields;
				}
				if (options.fieldPrefix) {
					this.#fieldPrefix = options.fieldPrefix;
				}
				this.#rootGroupTitle = options.rootGroupTitle;
				this.#onOpenFieldMenu = options.onOpenFieldMenu;
				this.#onOpenMenu = options.onOpenMenu;
				this.#customSelectorFn = options.customSelectorFn;
				this.#showValuesSelector = options.showValuesSelector ?? true;
				this.#context = options.context;
				this.#renderExpandedInput = options.renderExpandedInput === true;
				this.#viewMode = normalizeConditionViewMode(options.viewMode);
				this.#renderHeaderAction = options.renderHeaderAction;
				this.#options = options;
			}
			if (!(this.#context instanceof ConditionContext)) {
				this.#context = new SimpleConditionContext({
					fields: this.#fields,
					documentType: this.#options.documentType,
					title: this.#rootGroupTitle
				});
			}
		}
		#buildConditionSelector(condition, joiner) {
			const conditionSelector = new ConditionSelector(condition, {
				fields: this.#fields,
				joiner,
				fieldPrefix: this.#fieldPrefix,
				rootGroupTitle: this.#rootGroupTitle,
				onOpenFieldMenu: this.#onOpenFieldMenu,
				onOpenMenu: this.#onOpenMenu,
				showValuesSelector: this.#showValuesSelector,
				customSelectorFn: this.#customSelectorFn,
				context: this.#context,
				viewMode: this.#viewMode
			});
			conditionSelector.subscribe('onRemoveConditionClick', this.#onRemoveConditionClick.bind(this));
			conditionSelector.subscribe('onChange', this.#emitChange.bind(this));
			return conditionSelector;
		}
		createNode() {
			this.#conditionGroup.getItems().forEach(item => {
				this.#itemSelectors.push(this.#buildConditionSelector(item[0], item[1]));
			});
			if (this.#viewMode === ConditionViewMode.New) {
				// Seeding the initial render is not a change made by the user, so nothing is emitted here.
				this.#seedFirstRow();
				const renderer = new ConditionViewRenderer();
				const conditionNodes = this.#itemSelectors.map((selector, index) => this.#createConditionNode(selector, index, renderer));
				const {
					root,
					draggableNode,
					addButton
				} = renderer.createGroupNode(conditionNodes);
				this.#draggableNode = draggableNode;
				main_core.Event.bind(addButton, 'click', this.addItem.bind(this));
				this.#mountHeaderAction();
				this.#initDragNDrop();
				return root;
			}
			const hasConditions = this.#conditionGroup.items.length > 0;
			const isCollapsed = this.#options.isExpanded !== true && hasConditions;
			const collapseButtonTitle = isCollapsed ? main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXPAND_CONDITION') : main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_COLLAPSE_CONDITION');
			const {
				root,
				conditionContent,
				btnToggleList,
				btnTextNode,
				addButton,
				draggableNode
			} = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings" data-testid="bp-condition-group">
				<div
					ref="conditionContent"
					class="bizproc-automation-popup-settings__condition-content ${isCollapsed ? '' : '--active'}"
				>
					<div class="bizproc-automation-popup-settings__condition-header">
						<span class="bizproc-automation-popup-settings-title">
							${main_core.Text.encode(this.#options.caption?.head)}
						</span>
						<div
							ref="btnToggleList"
							class="bizproc-automation-popup-settings__btn-toggle ${hasConditions ? '' : '--disabled'}"
							data-role="condition-toggle"
							data-testid="bp-condition-group-toggle"
						>
							<span ref="btnTextNode" class="bizproc-automation-popup-settings-title">
								${collapseButtonTitle}
							</span>
							<div class="ui-icon-set --chevron-down" style="--ui-icon-set__icon-size: 16px;"></div>
						</div>
					</div>
					<div class="bizproc-automation-popup-settings__transition-height-wrapper">
						<div class="bizproc-automation-popup-settings__transition-height-content">
							<div class="bizproc-automation-popup-settings__condition-body">
								<div ref="draggableNode" class="bizproc-automation-popup-settings__condition">
									${this.#itemSelectors.map(selector => selector.createNode())}
								</div>
								<span class="bizproc-automation-popup-settings-link-wrapper">
									<a ref="addButton" class="bizproc-automation-popup-settings-link" data-testid="bp-condition-group-add">
										${main_core.Text.encode(this.#options.caption?.add || main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_ADD_CONDITION'))}
									</a>
								</span>
							</div>
						</div>
					</div>
					<div class="bizproc-automation-popup-settings__transition-height-wrapper --revert">
						<div class="bizproc-automation-popup-settings__transition-height-content">
							<div class="bizproc-automation-popup-settings__condition-help">
								${main_core.Text.encode(this.#options.caption?.collapsed || main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_COLLAPSED_TITLE_1'))}
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
			this.#toggleButtonNode = btnToggleList;
			this.#draggableNode = draggableNode;
			this.#conditionContentNode = conditionContent;
			this.#toggleTextNode = btnTextNode;
			main_core.Event.bind(btnToggleList, 'click', this.#onToggleGroupViewClick.bind(this));
			main_core.Event.bind(addButton, 'click', this.addItem.bind(this));
			this.#initDragNDrop();

			// The expanded/collapsed state is submitted with the form as part of the field value.
			if (this.#renderExpandedInput) {
				this.#expandedInputNode = main_core.Tag.render`
				<input type="hidden" name="${this.#fieldPrefix}isExpanded" value="${isCollapsed ? 'N' : 'Y'}">
			`;
				main_core.Dom.prepend(this.#expandedInputNode, root);
			}
			return root;
		}
		#createConditionNode(selector, index, renderer = null) {
			if (this.#viewMode !== ConditionViewMode.New) {
				return selector.createNode();
			}

			// A row that is already painted is moved into the new card as it stands: the position in the
			// list belongs to the card, while the row holds live value controls built by the host - and
			// the values the user typed into them.
			const conditionNode = selector.node ?? selector.createNode();
			const viewRenderer = renderer || new ConditionViewRenderer();
			if (index === 0) {
				const rootNode = viewRenderer.createRootGroupNode(conditionNode);
				this.#mountRemoveButton(selector, rootNode);
				return rootNode;
			}

			// The joiner is stored the way the backend reads it: items[i][1] links condition i to the
			// next one, and the joiner of the last condition is never looked at. The switch is painted
			// in the header of a card, above its own condition, so it describes the link to the
			// previous one and belongs to the previous selector.
			const joinerOwner = this.#itemSelectors[index - 1];
			const nestedNode = viewRenderer.createNestedGroupNode(conditionNode, joinerOwner.getJoiner());
			this.#mountRemoveButton(selector, nestedNode);
			const andButton = nestedNode.querySelector('[data-role="condition-joiner-and"]');
			const orButton = nestedNode.querySelector('[data-role="condition-joiner-or"]');
			const descriptionNode = nestedNode.querySelector('[data-role="condition-joiner-description"]');
			const setJoiner = joiner => {
				joinerOwner.setJoiner(joiner);
				this.#paintJoinerButton(andButton, joiner === ConditionGroup.JOINER.And);
				this.#paintJoinerButton(orButton, joiner === ConditionGroup.JOINER.Or);
				main_core.Dom.adjust(descriptionNode, {
					text: viewRenderer.getJoinerDescription(joiner)
				});
			};
			main_core.Event.bind(andButton, 'click', () => setJoiner(ConditionGroup.JOINER.And));
			main_core.Event.bind(orButton, 'click', () => setJoiner(ConditionGroup.JOINER.Or));
			return nestedNode;
		}

		// The two buttons of the switch differ by the class the theme paints and by the pressed state a
		// screen reader reads out, so both are set from the same choice.
		#paintJoinerButton(button, isActive) {
			main_core.Dom.toggleClass(button, '--active', isActive);
			main_core.Dom.attr(button, 'aria-pressed', isActive ? 'true' : 'false');
		}

		// The new view always shows the first row, so a group left with no conditions is painted with one
		// blank condition instead of a lone "add" button - both when it arrives empty and when the user
		// empties it. The blank row carries no field, so getValue() drops it until it gets one.
		#seedFirstRow() {
			if (this.#viewMode !== ConditionViewMode.New || this.#itemSelectors.length > 0) {
				return;
			}
			this.#itemSelectors.push(this.#buildConditionSelector(new Condition({}, this.#conditionGroup)));
		}

		// The button is drawn inside the row and lives in the header of the card. A row that is remounted
		// has already given its button away, so the button is remembered instead of being looked for in
		// the row it has left.
		#mountRemoveButton(selector, cardNode) {
			const removeButton = this.#removeButtons.get(selector) ?? selector.node?.querySelector('[data-testid="bp-condition-remove"]');
			const headerAction = cardNode.querySelector('[data-role="condition-header-action"]');
			if (removeButton && headerAction) {
				this.#removeButtons.set(selector, removeButton);
				main_core.Dom.append(removeButton, headerAction);
			}
		}

		// The host is handed one slot, the one of the first card. Headers are built with their cards and
		// go with them on every repaint, so the action is placed again into the slot that replaced it.
		#mountHeaderAction() {
			if (!this.#renderHeaderAction || !main_core.Type.isDomNode(this.#draggableNode)) {
				return;
			}
			const container = this.#draggableNode.querySelector('[data-role="condition-header-action"]');
			if (container) {
				this.#renderHeaderAction(container);
			}
		}

		// Cards carry their position (root card vs joined card), so after a removal or a reorder the cards
		// are built anew around the rows, which carry nothing of the sort and are kept as they are.
		#rerenderItems() {
			if (this.#viewMode !== ConditionViewMode.New || !this.#draggableNode) {
				return;
			}
			const renderer = new ConditionViewRenderer();
			// The cards are built before the list is emptied: building one moves the row it wraps out of
			// the card it came from, so what is dropped here are the headers alone.
			const cards = this.#itemSelectors.map((selector, index) => this.#createConditionNode(selector, index, renderer));
			main_core.Dom.clean(this.#draggableNode);
			cards.forEach(card => main_core.Dom.append(card, this.#draggableNode));
			this.#mountHeaderAction();
		}
		#onToggleGroupViewClick() {
			const isExpanded = !main_core.Dom.hasClass(this.#conditionContentNode, '--active');
			this.#setExpanded(isExpanded);
			this.emit('onToggleGroupViewClick', new main_core_events.BaseEvent({
				data: {
					isCollapsed: !isExpanded,
					isExpanded
				}
			}));
		}
		#setExpanded(isExpanded) {
			if (!main_core.Type.isDomNode(this.#conditionContentNode)) {
				return;
			}
			if (isExpanded) {
				main_core.Dom.addClass(this.#conditionContentNode, '--active');
			} else {
				main_core.Dom.removeClass(this.#conditionContentNode, '--active');
			}
			if (this.#expandedInputNode) {
				this.#expandedInputNode.value = isExpanded ? 'Y' : 'N';
			}
			if (main_core.Type.isDomNode(this.#toggleTextNode)) {
				main_core.Dom.adjust(this.#toggleTextNode, {
					text: isExpanded ? main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_COLLAPSE_CONDITION') : main_core.Loc.getMessage('BIZPROC_JS_AUTOMATION_EXPAND_CONDITION')
				});
			}
		}
		#initDragNDrop() {
			// `Draggable` is read from the runtime global (not a static import) so the
			// `ui.draganddrop.draggable` namespace is dereferenced at method-call time,
			// after all extensions have initialised - avoiding a module-init race in the
			// lean `bizproc.condition` bundle. The host that mounts the control provides
			// the extension (robots designer via `bizproc.automation`).
			const Draggable = BX?.UI?.DragAndDrop?.Draggable;
			if (!Draggable) {
				return;
			}

			// Its sensors listen on `document`, so a previous instance has to go before a new one
			// is mounted onto the same group.
			this.#destroyDragNDrop();
			this.#draggable = new Draggable({
				container: this.#draggableNode,
				type: Draggable.CLONE,
				draggable: this.#viewMode === ConditionViewMode.New ? '.ui-draggable--item' : '.bizproc-automation-popup-settings__condition-selector',
				dragElement: this.#viewMode === ConditionViewMode.New ? '.bizproc-condition-group__drag' : '.bizproc-automation-popup-settings__condition-item_draggable'
			});
			this.#draggable.subscribe('end', this.#onDragEnd.bind(this));
		}
		#destroyDragNDrop() {
			this.#draggable?.destroy();
			this.#draggable = null;
		}

		// Dragging moves the cards in the DOM only, so the order is read back from there: the value
		// is built from #itemSelectors, and in the new view a card also carries its position (root
		// card with the badge vs card joined by AND/OR), which has to be repainted for the new order.
		#onDragEnd() {
			if (!main_core.Type.isDomNode(this.#draggableNode)) {
				return;
			}
			const reordered = [...this.#draggableNode.children].map(card => this.#itemSelectors.find(selector => selector.node && card.contains(selector.node))).filter(Boolean);
			if (reordered.length !== this.#itemSelectors.length) {
				return;
			}
			const isSameOrder = reordered.every((selector, index) => selector === this.#itemSelectors[index]);
			if (isSameOrder) {
				return;
			}
			this.#itemSelectors = reordered;
			this.#rerenderItems();
			this.#emitChange();
		}
		addItem() {
			const conditionSelector = this.#buildConditionSelector(new Condition({}, this.#conditionGroup));
			this.#itemSelectors.push(conditionSelector);
			main_core.Dom.append(this.#createConditionNode(conditionSelector, this.#itemSelectors.length - 1), this.#draggableNode);
			if (this.#viewMode === ConditionViewMode.Legacy && main_core.Dom.hasClass(this.#toggleButtonNode, '--disabled')) {
				main_core.Dom.removeClass(this.#toggleButtonNode, '--disabled');
			}
			this.#emitChange();
		}

		/**
		 * Public post-mount API: replace the field set and repaint the rows.
		 * Used by activities from `afterFormRender` when the field list is dynamic.
		 */
		setFields(fields) {
			this.#fields = main_core.Type.isArray(fields) ? fields : [];
			if (this.#context && main_core.Type.isFunction(this.#context.setFields)) {
				this.#context.setFields(this.#fields);
			}
			this.#refreshItems();
		}

		/**
		 * Public post-mount API: set a runtime value-selector callback
		 * `(targetInputId) => void` (not serialisable into `data-config`).
		 */
		setValueSelector(fn) {
			this.#customSelectorFn = main_core.Type.isFunction(fn) ? fn : null;
			this.#refreshItems();
		}

		/**
		 * Public post-mount API: drop all conditions and repaint an empty group - in the new view the
		 * card stays and is emptied, exactly as an empty group is first painted. Used by activities
		 * when the field context fully changes (e.g. a different storage) - conditions built for the
		 * previous field set are invalid there and must not leak into the new one.
		 */
		clear() {
			this.#itemSelectors.forEach(selector => selector.destroy());
			this.#itemSelectors = [];
			if (main_core.Type.isDomNode(this.#draggableNode)) {
				main_core.Dom.clean(this.#draggableNode);
			}
			if (this.#viewMode === ConditionViewMode.New) {
				this.#seedFirstRow();
				this.#rerenderItems();
				return;
			}

			// An empty group must stay editable: expand the content so the "add condition"
			// link is reachable (matching the zero-condition initial render), then disable
			// the toggle since there is nothing to collapse.
			if (!main_core.Dom.hasClass(this.#conditionContentNode, '--active')) {
				this.#setExpanded(true);
			}
			if (main_core.Type.isDomNode(this.#toggleButtonNode) && !main_core.Dom.hasClass(this.#toggleButtonNode, '--disabled')) {
				main_core.Dom.addClass(this.#toggleButtonNode, '--disabled');
			}
		}
		#refreshItems() {
			if (!main_core.Type.isDomNode(this.#draggableNode)) {
				return;
			}

			// Rebuild from the live selectors (their current conditions + joiners), not from the
			// initial #conditionGroup model - user-added/removed/edited rows must survive a
			// setFields()/setValueSelector() repaint. The model is only the initial snapshot and
			// is not kept in sync with addItem / remove / joiner toggles.
			const currentItems = this.#itemSelectors.map(selector => [selector.getCondition(), selector.getJoiner()]);
			this.#itemSelectors.forEach(selector => selector.destroy());
			this.#itemSelectors = [];
			main_core.Dom.clean(this.#draggableNode);
			currentItems.forEach(([condition, joiner], index) => {
				const conditionSelector = this.#buildConditionSelector(condition, joiner);
				this.#itemSelectors.push(conditionSelector);
				main_core.Dom.append(this.#createConditionNode(conditionSelector, index), this.#draggableNode);
			});
			if (this.#viewMode === ConditionViewMode.New) {
				this.#mountHeaderAction();
			}
		}
		#onRemoveConditionClick(event) {
			const conditionSelector = event.getData().conditionSelector;
			// Only the new view wraps a row into a card of its own; in the legacy view the class belongs
			// to whatever the host painted around the group, and that must not be searched for.
			if (this.#viewMode === ConditionViewMode.New) {
				const cardNode = conditionSelector?.node?.closest('.bizproc-condition-group');
				if (cardNode) {
					main_core.Dom.remove(cardNode);
				}
			}
			if (conditionSelector) {
				const index = this.#itemSelectors.indexOf(conditionSelector);
				if (index > -1) {
					this.#itemSelectors.splice(index, 1);
				}
			}
			this.#seedFirstRow();
			this.#rerenderItems();
			if (this.#viewMode === ConditionViewMode.Legacy && this.#itemSelectors.length <= 0 && !main_core.Dom.hasClass(this.#toggleButtonNode, '--disabled')) {
				main_core.Dom.addClass(this.#toggleButtonNode, '--disabled');
			}
			this.#emitChange();
		}
		getValue() {
			const initialValue = this.#conditionGroup.serialize();
			return new ConditionGroup({
				type: initialValue.type,
				activityNames: initialValue.activityNames,
				// A row the user added but never filled in is dropped by createFromForm, so it must
				// not reach the backend through this channel either. ConditionGroup.serialize() has
				// its own guard, but it reads `.field` off the [condition, joiner] tuple and never
				// fires; that behaviour is shared with the robots and is locked by its own test.
				items: this.#itemSelectors.map(selector => [selector.getCondition().serialize(), selector.getJoiner()]).filter(([condition]) => condition.field !== '')
			}).serialize();
		}
		#emitChange() {
			this.emit('onChange', new main_core_events.BaseEvent({
				data: {
					value: this.getValue()
				}
			}));
		}
		destroy() {
			this.#destroyDragNDrop();
			this.#itemSelectors.forEach(selector => selector.destroy());
			this.#itemSelectors = [];
		}
	}

	// One mounted control per node. The designer render can invoke the mount twice
	// (renderControlCollection + the self-bootstrap <script> from the server HTML),
	// so decoration is guarded and idempotent.
	const mountedControls = new WeakMap();

	/**
	 * Mounts the standard `conditiongroup` control from its server-rendered node.
	 * Reads (`data-config`): `{ config: { fields, documentType, value, prefix }, property, ... }`
	 * and mounts a robot-free `ConditionGroupSelector` (auto-built `SimpleConditionContext`).
	 * Idempotent: a repeated call for the same node returns the already-mounted control.
	 *
	 * @param {?HTMLElement} node - the `[data-role="bp-condition-group"]` element.
	 * @returns {?ConditionGroupSelector}
	 */
	function decorateConditionGroupField(node) {
		if (!main_core.Type.isDomNode(node)) {
			return null;
		}
		if (mountedControls.has(node)) {
			return mountedControls.get(node);
		}
		const params = parseConfig(node.dataset.config);
		const config = main_core.Type.isPlainObject(params.config) ? params.config : {};
		const fields = main_core.Type.isArray(config.fields) ? config.fields : [];
		const documentType = main_core.Type.isArray(config.documentType) ? config.documentType : null;
		const fieldPrefix = main_core.Type.isStringFilled(config.prefix) ? config.prefix : '';
		const title = main_core.Type.isPlainObject(params.property) ? params.property.Name || '' : '';
		const caption = main_core.Type.isPlainObject(config.caption) ? config.caption : null;
		const selector = new ConditionGroupSelector(new ConditionGroup(config.value ?? null), {
			fields,
			fieldPrefix,
			documentType,
			rootGroupTitle: title,
			caption,
			// Default to expanded when the value carries no flag (e.g. activities saved before the flag moved into the value).
			isExpanded: config.isExpanded !== false,
			renderExpandedInput: true
		});
		main_core.Dom.clean(node);
		main_core.Dom.append(selector.createNode(), node);
		mountedControls.set(node, selector);
		return selector;
	}

	/**
	 * Returns the control already mounted into `node` (or `null`). Lets the hosting
	 * activity reach it from `afterFormRender` to re-feed fields / wire the value
	 * selector (`setFields` / `setValueSelector`).
	 *
	 * @param {?HTMLElement} node
	 * @returns {?ConditionGroupSelector}
	 */
	function getMountedConditionGroupField(node) {
		return main_core.Type.isDomNode(node) && mountedControls.has(node) ? mountedControls.get(node) : null;
	}
	function parseConfig(raw) {
		if (!main_core.Type.isStringFilled(raw)) {
			return {};
		}
		try {
			const parsed = JSON.parse(raw);
			return main_core.Type.isPlainObject(parsed) ? parsed : {};
		} catch (e) {
			return {};
		}
	}

	exports.BpCondition = BpCondition;
	exports.Condition = Condition;
	exports.ConditionContext = ConditionContext;
	exports.ConditionGroup = ConditionGroup;
	exports.ConditionGroupSelector = ConditionGroupSelector;
	exports.ConditionSelector = ConditionSelector;
	exports.ConditionViewMode = ConditionViewMode;
	exports.DelayInterval = DelayInterval;
	exports.DelayIntervalSelector = DelayIntervalSelector;
	exports.InlineTimeSelector = InlineTimeSelector;
	exports.Operator = Operator;
	exports.SimpleConditionContext = SimpleConditionContext;
	exports.decorateConditionGroupField = decorateConditionGroupField;
	exports.getMountedConditionGroupField = getMountedConditionGroupField;

})(this.BX.Bizproc = this.BX.Bizproc || {}, BX, BX, BX.Main, BX.Main, BX.UI, BX, window, BX.UI, BX.Event);
//# sourceMappingURL=condition.bundle.js.map

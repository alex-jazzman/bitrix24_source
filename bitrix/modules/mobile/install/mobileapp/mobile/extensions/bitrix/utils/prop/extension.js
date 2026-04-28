(() => {
	/**
	 * @deprecated use utils/type or utils/object extensions
	 */
	BX.prop = {
		get(object, key, defaultValue)
		{
			return object && object.hasOwnProperty(key) ? object[key] : defaultValue;
		},
		getObject(object, key, defaultValue)
		{
			return object && BX.type.isPlainObject(object[key]) ? object[key] : defaultValue;
		},
		getElementNode(object, key, defaultValue)
		{
			return object && BX.type.isElementNode(object[key]) ? object[key] : defaultValue;
		},
		getArray(object, key, defaultValue)
		{
			return object && BX.type.isArray(object[key]) ? object[key] : defaultValue;
		},
		getFunction(object, key, defaultValue)
		{
			return object && BX.type.isFunction(object[key]) ? object[key] : defaultValue;
		},
		getNumber(object, key, defaultValue)
		{
			if (!(object && object.hasOwnProperty(key)))
			{
				return defaultValue;
			}

			let value = object[key];
			if (BX.type.isNumber(value))
			{
				return value;
			}

			value = parseFloat(value);

			return isNaN(value) ? defaultValue : value;
		},
		getInteger(object, key, defaultValue)
		{
			if (!(object && object.hasOwnProperty(key)))
			{
				return defaultValue;
			}

			let value = object[key];
			if (BX.type.isNumber(value))
			{
				return value;
			}

			value = parseInt(value);

			return isNaN(value) ? defaultValue : value;
		},
		getBoolean(object, key, defaultValue)
		{
			if (!(object && object.hasOwnProperty(key)))
			{
				return defaultValue;
			}

			const value = object[key];

			return (BX.type.isBoolean(value)
					? value
					: (BX.type.isString(value) ? (value.toLowerCase() === 'true') : Boolean(value))
			);
		},
		getString(object, key, defaultValue)
		{
			if (!(object && object.hasOwnProperty(key)))
			{
				return defaultValue;
			}

			const value = object[key];

			return BX.type.isString(value) ? value : (value ? value.toString() : '');
		},
		extractDate(datetime)
		{
			if (!BX.type.isDate(datetime))
			{
				datetime = new Date();
			}

			datetime.setHours(0);
			datetime.setMinutes(0);
			datetime.setSeconds(0);
			datetime.setMilliseconds(0);

			return datetime;
		},
	};
})();

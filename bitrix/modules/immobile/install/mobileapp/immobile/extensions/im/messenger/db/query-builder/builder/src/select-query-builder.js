/**
 * @module im/messenger/db/query-builder/builder/src/select-query-builder
 */
jn.define('im/messenger/db/query-builder/builder/src/select-query-builder', (require, exports, module) => {
	const { Type } = require('type');
	const { ExpressionField, FieldAlias } = require('im/messenger/db/schema/field');
	const { getFieldOwner } = require('im/messenger/db/schema/schema-ref');
	const { and } = require('im/messenger/db/query-builder/condition');
	const { inlineValues } = require('im/messenger/db/query-builder/utils');
	const { SelectResult } = require('im/messenger/db/query-builder/result');

	/**
	 * @class SelectQueryBuilder
	 */
	class SelectQueryBuilder
	{
		#schema;
		#connection;
		#conditionCompiler;
		#orderCompiler;
		#joins = [];
		#useDefaultAll = true;
		#projections = [];
		#conditions = [];
		#orderClauses = [];
		#groupByFields = [];
		#isDistinctFlag = false;
		#limitValue = null;
		#offsetValue = null;

		constructor({ schema = null, connection, conditionCompiler, orderCompiler })
		{
			this.#schema = schema;
			this.#connection = connection;
			this.#conditionCompiler = conditionCompiler;
			this.#orderCompiler = orderCompiler;
		}

		/**
		 * @param {typeof BaseSchema|SchemaRef} schema
		 * @return {this}
		 */
		from(schema)
		{
			this.#schema = schema;

			return this;
		}

		/**
		 * @param {typeof BaseSchema|SchemaRef} schema
		 * @param {Condition} condition
		 * @return {this}
		 */
		leftJoin(schema, condition)
		{
			this.#joins.push({ type: 'LEFT', schema, condition });

			return this;
		}

		/**
		 * @param {typeof BaseSchema|SchemaRef} schema
		 * @param {Condition} condition
		 * @return {this}
		 */
		innerJoin(schema, condition)
		{
			this.#joins.push({ type: 'INNER', schema, condition });

			return this;
		}

		/**
		 * @param {...(BaseField|{field,alias}|ExpressionField)} items
		 * @return {this}
		 */
		setSelect(...items)
		{
			this.#useDefaultAll = false;
			this.#projections = items.filter(Boolean);

			return this;
		}

		/**
		 * @param {...(BaseField|{field,alias}|ExpressionField)} items
		 * @return {this}
		 */
		addSelect(...items)
		{
			this.#projections.push(...items.filter(Boolean));

			return this;
		}

		/**
		 * @param {...(Condition|null|undefined|false)} conditions
		 * @return {this}
		 */
		where(...conditions)
		{
			this.#conditions.push(...conditions.filter(Boolean));

			return this;
		}

		/**
		 * @param {...OrderClause} clauses
		 * @return {this}
		 */
		orderBy(...clauses)
		{
			this.#orderClauses.push(...clauses.filter(Boolean));

			return this;
		}

		/**
		 * @param {...BaseField} fields
		 * @return {this}
		 */
		groupBy(...fields)
		{
			this.#groupByFields.push(...fields.filter(Boolean));

			return this;
		}

		/**
		 * @return {this}
		 */
		distinct()
		{
			this.#isDistinctFlag = true;

			return this;
		}

		/**
		 * @param {number} n
		 * @return {this}
		 */
		limit(n)
		{
			this.#limitValue = n;

			return this;
		}

		/**
		 * @param {number} n
		 * @return {this}
		 */
		offset(n)
		{
			this.#offsetValue = n;

			return this;
		}

		/**
		 * @return {Map<object, string>}
		 */
		getAliases()
		{
			if (!Type.isArrayFilled(this.#joins))
			{
				return new Map();
			}

			return this.#buildAliasMap();
		}

		/**
		 * @return {Promise<SelectResult>}
		 */
		async execute()
		{
			if (!this.#schema)
			{
				throw new Error('SelectQueryBuilder: call .from(schema) before .execute().');
			}

			await this.#ensureSchemas();

			const compiled = this.#compile();
			const result = await this.#connection.executeSql({
				query: compiled.query,
				values: compiled.values,
			});

			const rawRows = this.#mapResult(result, compiled.resultPlan);
			const joinMap = compiled.aliasMap ? this.#buildJoinOnlyMap(compiled.aliasMap) : null;

			return new SelectResult(rawRows, this.#schema, joinMap);
		}

		/**
		 * Debug helper — returns the final SQL with values inlined.
		 *
		 * @return {string}
		 */
		toSql()
		{
			if (!this.#schema)
			{
				throw new Error('SelectQueryBuilder: call .from(schema) before .toSql().');
			}

			const compiled = this.#compile();
			const sql = inlineValues(compiled.query, compiled.values);

			return sql.split('\n').map((line) => {
				if (line.startsWith('SELECT'))
				{
					return line
						.replace(/^(SELECT(?:\s+DISTINCT)?)\s+/, '$1\n\t')
						.replace(/, /g, ',\n\t');
				}

				if (line.startsWith('WHERE '))
				{
					const unwrapped = this.#unwrapParens(line.slice(6));
					const conditions = this.#splitTopLevel(unwrapped, ' AND ');
					if (conditions.length > 1)
					{
						const formatted = conditions.map((condition, i) => {
							const prefix = i === 0 ? '' : 'AND ';
							const inner = this.#unwrapParens(condition);
							const orParts = this.#splitTopLevel(inner, ' OR ');

							if (orParts.length > 1)
							{
								const orLines = orParts.map((orPart, j) => `\t\t${j === 0 ? '' : 'OR '}${orPart}`).join('\n');

								return `${prefix}(\n${orLines}\n\t)`;
							}

							return `${prefix}${condition}`;
						});

						return `WHERE\n\t${formatted.join('\n\t')}`;
					}
				}

				return line;
			}).join('\n');
		}

		/**
		 * Removes wrapping parentheses if the entire string is enclosed in one pair.
		 *
		 * @param {string} str
		 * @return {string}
		 */
		#unwrapParens(str)
		{
			if (!str.startsWith('(') || !str.endsWith(')'))
			{
				return str;
			}

			let depth = 0;
			for (let i = 0; i < str.length - 1; i++)
			{
				if (str[i] === '(')
				{
					depth++;
				}
				else if (str[i] === ')')
				{
					depth--;
				}

				if (depth === 0)
				{
					return str;
				}
			}

			return str.slice(1, -1);
		}

		/**
		 * Splits `str` by `delimiter` only at parenthesis depth 0.
		 *
		 * @param {string} str
		 * @param {string} delimiter
		 * @return {Array<string>}
		 */
		#splitTopLevel(str, delimiter)
		{
			const parts = [];
			let depth = 0;
			let current = 0;

			for (let i = 0; i < str.length; i++)
			{
				if (str[i] === '(')
				{
					depth++;
				}
				else if (str[i] === ')')
				{
					depth--;
				}
				else if (depth === 0 && str.startsWith(delimiter, i))
				{
					parts.push(str.slice(current, i));
					current = i + delimiter.length;
					i += delimiter.length - 1;
				}
			}

			parts.push(str.slice(current));

			return parts;
		}

		// ─── schema lifecycle ──────────────────────────────────────────

		async #ensureSchemas()
		{
			const seen = new Set();
			const promises = [];

			const ensure = (schema) => {
				const tableName = schema.getTableName();
				if (seen.has(tableName))
				{
					return;
				}

				seen.add(tableName);
				promises.push(this.#connection.ensureSchema(schema));
			};

			ensure(this.#schema);
			for (const join of this.#joins)
			{
				ensure(join.schema);
			}

			await Promise.all(promises);
		}

		// ─── alias & field resolution ──────────────────────────────────

		/**
		 * @return {Map<object, string>}
		 */
		#buildAliasMap()
		{
			const aliasMap = new Map();
			const counters = {};

			const assignAlias = (schema) => {
				const tableName = schema.getTableName();
				counters[tableName] = (counters[tableName] ?? -1) + 1;
				aliasMap.set(schema, `${tableName}_${counters[tableName]}`);
			};

			assignAlias(this.#schema);
			for (const join of this.#joins)
			{
				assignAlias(join.schema);
			}

			return aliasMap;
		}

		/**
		 * @param {Map<object, string>} aliasMap
		 * @return {Map<object, string>}
		 */
		#buildJoinOnlyMap(aliasMap)
		{
			const out = new Map();
			for (const [schema, alias] of aliasMap)
			{
				if (schema !== this.#schema)
				{
					out.set(schema, alias);
				}
			}

			return out;
		}

		/**
		 * @return {Map<BaseField, object>}
		 */
		#buildFieldToSchemaMap()
		{
			const map = new Map();

			const registerSchema = (schema) => {
				for (const field of schema.getFields())
				{
					map.set(field, schema);
				}
			};

			registerSchema(this.#schema);
			for (const join of this.#joins)
			{
				registerSchema(join.schema);
			}

			return map;
		}

		/**
		 * @param {BaseField} field
		 * @param {Map<BaseField, object>} fieldToSchema
		 * @param {Map<object, string>} aliasMap
		 * @return {string}
		 */
		#resolveFieldRef(field, fieldToSchema, aliasMap)
		{
			if (field instanceof ExpressionField)
			{
				return field.alias;
			}

			const schema = fieldToSchema.get(field);
			if (schema)
			{
				if (aliasMap)
				{
					return `${aliasMap.get(schema)}.${field.name}`;
				}

				return field.name;
			}

			if (getFieldOwner(field) && aliasMap)
			{
				const alias = aliasMap.get(getFieldOwner(field));
				if (alias)
				{
					return `${alias}.${field.name}`;
				}
			}

			throw new Error(
				`SelectQueryBuilder: field '${field.name}' is not part of this query. `
				+ 'Ensure it belongs to a schema registered via .from() or .leftJoin().',
			);
		}

		// ─── compile ───────────────────────────────────────────────────

		#compile()
		{
			const values = [];
			const parts = [];
			const hasJoins = Type.isArrayFilled(this.#joins);

			const fieldToSchema = this.#buildFieldToSchemaMap();
			const aliasMap = hasJoins ? this.#buildAliasMap() : null;
			const context = {
				resolveField: (field) => this.#resolveFieldRef(field, fieldToSchema, aliasMap),
			};

			// SELECT
			const fields = this.#resolveProjection();
			this.#validateFields(fields, fieldToSchema);
			const resultPlan = this.#buildResultPlan(fields, fieldToSchema, aliasMap, hasJoins);
			const distinctKeyword = this.#isDistinctFlag ? 'DISTINCT ' : '';
			const selectClause = resultPlan.map((entry) => entry.sqlExpression).join(', ');
			parts.push(`SELECT ${distinctKeyword}${selectClause}`);

			// FROM
			const tableName = this.#schema.getTableName();
			if (hasJoins)
			{
				parts.push(`FROM ${tableName} ${aliasMap.get(this.#schema)}`);
			}
			else
			{
				parts.push(`FROM ${tableName}`);
			}

			// JOINs
			for (const join of this.#joins)
			{
				const joinTable = join.schema.getTableName();
				const joinAlias = aliasMap.get(join.schema);
				const onCompiled = this.#conditionCompiler.compile(join.condition, context);
				parts.push(`${join.type} JOIN ${joinTable} ${joinAlias} ON ${onCompiled.query}`);
				values.push(...onCompiled.values);
			}

			// WHERE
			if (Type.isArrayFilled(this.#conditions))
			{
				const whereCondition = and(...this.#conditions);
				if (whereCondition)
				{
					const compiled = this.#conditionCompiler.compile(whereCondition, context);
					parts.push(`WHERE ${compiled.query}`);
					values.push(...compiled.values);
				}
			}

			// GROUP BY
			if (Type.isArrayFilled(this.#groupByFields))
			{
				const groupCols = this.#groupByFields.map(
					(field) => context.resolveField(field),
				);
				parts.push(`GROUP BY ${groupCols.join(', ')}`);
			}

			// ORDER BY
			if (Type.isArrayFilled(this.#orderClauses))
			{
				const orderSql = this.#orderCompiler.compile(this.#orderClauses, context);
				parts.push(`ORDER BY ${orderSql}`);
			}

			// LIMIT
			if (!Type.isNull(this.#limitValue))
			{
				parts.push('LIMIT ?');
				values.push(this.#limitValue);
			}

			// OFFSET
			if (!Type.isNull(this.#offsetValue))
			{
				parts.push('OFFSET ?');
				values.push(this.#offsetValue);
			}

			return {
				query: parts.join('\n'),
				values,
				resultPlan,
				aliasMap,
			};
		}

		/**
		 * @return {Array}
		 */
		#resolveProjection()
		{
			const base = this.#useDefaultAll ? this.#getDefaultSelectFields() : [];
			const merged = [...base, ...this.#projections];

			if (!Type.isArrayFilled(merged))
			{
				throw new Error(
					'SelectQueryBuilder: no fields selected. '
					+ 'Call setSelect() or addSelect() before execute().',
				);
			}

			return this.#deduplicateFields(merged);
		}

		/**
		 * Validates that all fields belong to schemas registered in this query.
		 * ExpressionField and .as() wrappers are excluded from validation.
		 *
		 * @param {Array} fields
		 * @param {Map<BaseField, object>} fieldToSchema
		 */
		#validateFields(fields, fieldToSchema)
		{
			const registeredSchemas = new Set(fieldToSchema.values());

			for (const item of fields)
			{
				if (item instanceof ExpressionField)
				{
					continue;
				}

				const field = item instanceof FieldAlias ? item.field : item;
				const isRegistered = fieldToSchema.has(field)
					|| registeredSchemas.has(getFieldOwner(field));

				if (!isRegistered)
				{
					throw new Error(
						`SelectQueryBuilder: field '${field.name}' is not part of this query. `
						+ 'Ensure it belongs to a schema registered via .from() or .leftJoin().',
					);
				}
			}
		}

		/**
		 * @param {Array} fields
		 * @return {Array}
		 */
		#deduplicateFields(fields)
		{
			const seen = new Set();

			return fields.filter((item) => {
				if (item instanceof ExpressionField)
				{
					return true;
				}

				const ref = item instanceof FieldAlias ? item.field : item;
				if (seen.has(ref))
				{
					return false;
				}

				seen.add(ref);

				return true;
			});
		}

		#getDefaultSelectFields()
		{
			if (!Type.isArrayFilled(this.#joins))
			{
				return this.#schema.getFields();
			}

			return [
				...this.#schema.getFields(),
				...this.#joins.flatMap((j) => j.schema.getFields()),
			];
		}

		/** @private */
		#buildResultPlan(fields, fieldToSchema, aliasMap, hasJoins)
		{
			this.#detectCollisions(fields, fieldToSchema, aliasMap, hasJoins);

			return fields.map((item) => {
				// expressionField → top-level by alias
				if (item instanceof ExpressionField)
				{
					return {
						sqlExpression: this.#compileExpressionField(item, hasJoins, fieldToSchema, aliasMap),
						resultKey: item.alias,
						destination: 'top-level',
						topLevelKey: item.alias,
						field: item,
					};
				}

				// FieldAlias wrapper → top-level by user alias
				if (item instanceof FieldAlias)
				{
					const field = item.field;
					const columnRef = hasJoins
						? this.#resolveFieldRef(field, fieldToSchema, aliasMap)
						: field.name;

					return {
						sqlExpression: `${columnRef} AS ${item.alias}`,
						resultKey: item.alias,
						destination: 'top-level',
						topLevelKey: item.alias,
						field,
					};
				}

				// Plain field — destination depends on whether it belongs to primary or JOIN
				const schema = hasJoins ? fieldToSchema?.get(item) : null;

				if (!hasJoins)
				{
					return {
						sqlExpression: item.name,
						resultKey: item.name,
						destination: 'top-level',
						topLevelKey: item.name,
						field: item,
					};
				}

				const columnRef = this.#resolveFieldRef(item, fieldToSchema, aliasMap);
				const isPrimary = schema === this.#schema;

				if (isPrimary)
				{
					return {
						sqlExpression: `${columnRef} AS ${item.name}`,
						resultKey: item.name,
						destination: 'top-level',
						topLevelKey: item.name,
						field: item,
					};
				}

				// JOIN schema → nested under schemaAlias
				const schemaAlias = aliasMap.get(schema) ?? aliasMap.get(getFieldOwner(item));
				const asAlias = `${schemaAlias}__${item.name}`;

				return {
					sqlExpression: `${columnRef} AS ${asAlias}`,
					resultKey: asAlias,
					destination: 'nested',
					schemaAlias,
					nestedKey: item.name,
					field: item,
				};
			});
		}

		#compileExpressionField(expr, hasJoins, fieldToSchema, aliasMap)
		{
			let index = 0;
			const sql = expr.sqlTemplate.replace(/%s/g, () => {
				const ref = (expr.buildFrom ?? [])[index];
				index += 1;

				if (ref && ref.name && Type.isString(ref.name))
				{
					return hasJoins
						? this.#resolveFieldRef(ref, fieldToSchema, aliasMap)
						: ref.name;
				}

				return String(ref);
			});

			return `${sql} AS ${expr.alias}`;
		}

		#detectCollisions(fields, fieldToSchema, aliasMap, hasJoins)
		{
			const seen = new Map();

			for (const item of fields)
			{
				const key = this.#getResultKey(item, fieldToSchema, aliasMap, hasJoins);
				const ref = item instanceof FieldAlias ? item.field : item;
				const existingRef = seen.get(key);

				if (existingRef)
				{
					if (existingRef === ref)
					{
						continue;
					}

					throw new Error(
						`SelectQueryBuilder: column name collision '${key}'. `
						+ "Use .as('alias') to disambiguate.",
					);
				}

				seen.set(key, ref);
			}
		}

		#getResultKey(item, fieldToSchema, aliasMap, hasJoins)
		{
			if (item instanceof ExpressionField)
			{
				return item.alias;
			}

			if (item instanceof FieldAlias)
			{
				return item.alias;
			}

			if (!hasJoins)
			{
				return item.name;
			}

			const schema = fieldToSchema?.get(item);
			const isPrimary = schema === this.#schema;

			if (isPrimary)
			{
				return item.name;
			}

			const schemaAlias = schema && aliasMap ? aliasMap.get(schema) : '';

			return `${schemaAlias}__${item.name}`;
		}

		// ─── result mapping ────────────────────────────────────────────

		/**
		 * @param {object|null} result
		 * @param {Array<object>} resultPlan
		 * @return {Array<object>}
		 */
		#mapResult(result, resultPlan)
		{
			if (!result || !result.columns || !result.rows)
			{
				return [];
			}

			return result.rows.map((row) => {
				const data = {};

				for (let i = 0; i < result.columns.length; i++)
				{
					const plan = resultPlan[i];
					const rawValue = row[i];

					if (!plan)
					{
						console.warn(`SelectQueryBuilder: column '${result.columns[i]}' has no matching plan entry`);
						data[result.columns[i]] = rawValue;
						continue;
					}

					const value = plan.field ? plan.field.restore(rawValue) : rawValue;

					if (plan.destination === 'nested')
					{
						if (!data[plan.schemaAlias])
						{
							data[plan.schemaAlias] = {};
						}
						data[plan.schemaAlias][plan.nestedKey] = value;
						continue;
					}

					// top-level
					data[plan.topLevelKey] = value;
				}

				return data;
			});
		}
	}

	module.exports = { SelectQueryBuilder };
});

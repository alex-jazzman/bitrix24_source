/**
 * @module im/messenger/db/query-builder/compiler
 */
jn.define('im/messenger/db/query-builder/compiler', (require, exports, module) => {
	const { ConditionCompiler } = require('im/messenger/db/query-builder/compiler/src/condition-compiler');
	const { OrderCompiler } = require('im/messenger/db/query-builder/compiler/src/order-compiler');
	const {
		compileSelectColumns,
		compileInsertParts,
		restoreRows,
	} = require('im/messenger/db/query-builder/compiler/src/helpers');
	const { SchemaCompiler } = require('im/messenger/db/query-builder/compiler/src/schema-compiler');

	module.exports = {
		ConditionCompiler,
		OrderCompiler,
		SchemaCompiler,
		compileSelectColumns,
		compileInsertParts,
		restoreRows,
	};
});

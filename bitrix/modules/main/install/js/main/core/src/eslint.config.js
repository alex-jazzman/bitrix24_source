import rootConfig from '../../../../../../eslint.config.js';

export default [
	...rootConfig,
	{
		files: ['**/*.ts'],
		rules: {
			'@bitrix24/bitrix24-rules/no-typeof': 'off',
			'import/no-default-export': 'off',
			'no-prototype-builtins': 'off',
			'@bitrix24/bitrix24-rules/no-native-events-binding': 'off',
			'@bitrix24/bitrix24-rules/no-classlist': 'off',
			'@bitrix24/bitrix24-rules/no-style': 'off',
			'@bitrix24/bitrix24-rules/no-native-dom-methods': 'off',
			'no-param-reassign': 'off',
			'no-console': 'off',
		},
	},
	{
		/**
		 * The legacy layer is a transcription of `src/old/core.js`, not new code: its brief is
		 * that nothing changes at runtime. Each rule below is off because applying its fix would
		 * change what a caller sees, and the functions here have between 67 and 720 of them.
		 * Everything else the config asks for is met by the code, and the list is meant to shrink
		 * rather than grow - the exemption belongs to the transcription, not to the directory.
		 */
		files: ['legacy/**/*.ts'],
		rules: {
			// Loose comparison is observable: `array_unique` collapses 1 and '1' because it
			// compares with ==, `in_array` and `array_search` match across types, `merge` skips
			// a value because `== null` catches undefined as well.
			eqeqeq: 'off',
			'no-eq-null': 'off',

			// An implicit radix is what the callers of `even`, `getInteger` and `number_format`
			// have always got, and `isNaN` coerces where `Number.isNaN` does not - `objectSort`
			// sorts numeric strings as numbers only because of that coercion.
			radix: 'off',
			'no-restricted-globals': 'off',

			// Several functions are documented, and tested, as walking the prototype chain:
			// `_array_values_ob`, `array_flip`, `buildQueryString`, `ext`. `Object.keys` would
			// quietly narrow them to own properties.
			'no-restricted-syntax': 'off',
			'guard-for-in': 'off',

			// `concat` and the spread operator part ways on array-like arguments, which
			// `deleteFromArray` and `insertIntoArray` accept today.
			'unicorn/prefer-spread': 'off',

			// `charCodeAt` and `codePointAt` differ on surrogate pairs, and `hashCode` is used as
			// a cache key: a different hash is a different resource.
			'unicorn/prefer-code-point': 'off',

			// The names are the public surface: `str_pad`, `_array_keys_ob`, `parent_class` and
			// the rest are what the consumers call and what `contract.test.ts` asserts.
			camelcase: 'off',
			'no-underscore-dangle': 'off',

			// Size and shape are inherited from the source file. Splitting a function up is the
			// kind of change this task exists to avoid.
			'sonarjs/cognitive-complexity': 'off',
			'init-declarations': 'off',

			// The layer writes into the global BX and reads its neighbours back out of it by
			// design (ADR 3.4) - that indirection is the whole point of `internal/global.ts`.
			'@bitrix24/bitrix24-rules/no-bx': 'off',

			// `substr` and `slice` disagree on a negative start, `replace` and `replaceAll` on a
			// string pattern: `formatName` replaces only the first `#MARKER#` of each kind and is
			// tested for exactly that. Rewriting either is a change of result, not of style.
			'unicorn/prefer-string-slice': 'off',
			'unicorn/prefer-string-replace-all': 'off',

			// `indexOf` on an array-like is not `includes`, and `includes` finds NaN where
			// `indexOf` does not. The layer passes array-likes and strings to both.
			'unicorn/prefer-includes': 'off',

			// The regular expressions are the ones the source file shipped. `better-regex` rewrites
			// `/YYYY/ig` into `/y{4}/gi` and relettering a format marker table by hand is how a
			// date parser quietly starts reading a different format.
			'unicorn/better-regex': 'off',

			// `BX.message` is the reader the layer has always used, and it resolves at call time
			// against the global message table. `Loc` binds the modern kernel at module scope,
			// which the layer may not do (ORD-01).
			'@bitrix24/bitrix24-rules/no-bx-message': 'off',

			// `_adjustWait`, `__show`, `__hide`, `bInited` and the rest are the names consumers
			// reach for and `contract.test.ts` asserts, exactly like the underscore names above.
			'@bitrix24/bitrix24-rules/no-pseudo-private': 'off',

			// `arguments` is forwarded verbatim by `objectMerge`, `defer`, `proxy` and the delegate
			// family; a rest parameter changes `arguments.callee`-era call shapes and `fn.length`.
			'prefer-rest-params': 'off',

			// An arrow has no own `this` and no `arguments`. The callbacks here are handlers the
			// layer hands to the DOM and to `BX.delegate`, both of which rebind `this`.
			'prefer-arrow-callback': 'off',

			// Chained and in-condition assignment is the source file's own idiom, and the `while
			// ((m = re.exec(s)))` loops in `processHTML` depend on the assignment being the test.
			'no-multi-assign': 'off',
			'no-cond-assign': 'off',

			// `+x`, `!!x` and `'' + x` coerce the way the callers have always seen; `Boolean()` and
			// `String()` differ on a `Symbol` and on an object with a custom `valueOf`.
			'no-implicit-coercion': 'off',

			// `javascript:void(0)` is the href the hint writes into the document. It is markup the
			// consumers see, not code this task may restyle.
			'no-script-url': 'off',

			// Branch shape, nesting and function size are inherited from the source file. Collapsing
			// or inverting a condition is the kind of edit that silently drops an `else`.
			'unicorn/no-negated-condition': 'off',
			'unicorn/no-lonely-if': 'off',
			'unicorn/prefer-logical-operator-over-ternary': 'off',
			'no-unneeded-ternary': 'off',
			'no-else-return': 'off',
			'no-empty': 'off',
			'max-depth': 'off',
			'max-lines-per-function': 'off',
			'sonarjs/no-collapsible-if': 'off',
			'sonarjs/no-redundant-boolean': 'off',
			'sonarjs/no-small-switch': 'off',

			// Indexed loops walk array-likes and strings, which `for-of` cannot do here; the three
			// sites that could be converted already carry their own disable comment and reason.
			'unicorn/no-for-loop': 'off',

			// `catch (err) {}` keeps the binding the source file named; dropping it is a change to
			// code that exists to swallow an error, and nothing else.
			'unicorn/prefer-optional-catch-binding': 'off',

			// Concatenation and the comment banners are transcribed verbatim. `/******* HINT ***/`
			// is the source file's own separator, kept because MOD-01 asks for it.
			'prefer-template': 'off',
			'sonarjs/no-nested-template-literals': 'off',
			'spaced-comment': 'off',

			// The escape in the fallback phone pattern is FIX-01 defect 1: `\s` single-escaped is a
			// literal `s`. It is carried over on purpose and is listed for a separate task.
			'no-useless-escape': 'off',

			// Long lines are the transcribed signatures and conditions of the source file.
			'max-len': 'off',
		},
	},
];

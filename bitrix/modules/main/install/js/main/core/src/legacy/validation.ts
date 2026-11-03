import { BX } from './internal/global';

/**
 * The two validators (MOD-01). No shared state; they are one namespace on the public surface and
 * `contract.test.ts` asserts both members of it.
 *
 * `checkIfPhone` carries three defects and all three are carried over verbatim (Q-2, FIX-01
 * "handled separately" #1). Fixing any of them changes the answer for a consumer, and the first
 * one changes it on every portal that has the telephony module:
 *
 * 1. the condition is inverted - the branch taken when `BX.PhoneNumber` is *absent* is the one
 *    that calls into it, so the function throws exactly where it meant to fall back, and the
 *    fallback pattern runs only where the module is present;
 * 2. the `\s` after the optional plus is written with a single backslash, so it reaches the
 *    constructor as a literal `s` rather than a whitespace class;
 * 3. inside `[0-9(-)\s]` the hyphen sits between two characters and is read as a range from `(`
 *    to `)`, so a number written with dashes is refused.
 *
 * `test/old/core/misc.test.ts` pins all three as facts.
 */

export const validation = {
	checkIfEmail(s: any): boolean
	{
		const atom = "[=a-z0-9_+~'!$&*^`|#%/?{}-]";

		return (new RegExp(`^\\s*${atom}+(\\.${atom}+)*@([a-z0-9-]+\\.)+[a-z0-9-]{2,20}\\s*$`, 'i')).test(s);
	},
	checkIfPhone(s: any): boolean
	{
		// the cast only silences the narrowing TypeScript does from the inverted condition; the
		// runtime is unchanged, and that inversion is defect 1 described above
		const regexp = new RegExp(
			typeof (BX.PhoneNumber) === 'undefined'
				? (BX.PhoneNumber as any).getValidNumberPattern()
				// NOT a typo of the translation: the third escape is single in the source too,
				// so the pattern matches a literal "s" there instead of whitespace. Kept verbatim
				// - see defect 2 above. Doubling it changes what the pattern accepts.
				: '^\\s*\\+?\s*[0-9(-)\\s]+\\s*$',
			'i',
		);

		return regexp.test(s);
	},
};

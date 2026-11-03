import { type Klass, type LexicalNode } from 'ui.lexical.core';

import { type SchemeValidation } from '../scheme-validation';

export type SchemeValidationOptions = {
	nodes?: SchemeNodeValidation[];
	bbcodeMap?: Record<string, string>;
};

export type SchemeNodeValidation = {
	nodeClass: Klass<LexicalNode>;
	validate?: (node: LexicalNode, schemeValidation: SchemeValidation) => boolean;
};

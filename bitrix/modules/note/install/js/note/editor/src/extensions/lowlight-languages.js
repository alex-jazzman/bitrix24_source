import { lowlight } from 'lowlight/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import go from 'highlight.js/lib/languages/go';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import kotlin from 'highlight.js/lib/languages/kotlin';
import less from 'highlight.js/lib/languages/less';
import lua from 'highlight.js/lib/languages/lua';
import makefile from 'highlight.js/lib/languages/makefile';
import markdown from 'highlight.js/lib/languages/markdown';
import perl from 'highlight.js/lib/languages/perl';
import php from 'highlight.js/lib/languages/php';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import scss from 'highlight.js/lib/languages/scss';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

export const DEFAULT_LANGUAGE = 'plaintext';
export const MERMAID_LANGUAGE = 'mermaid';

// Mermaid is diagram source, not a highlighted language: in read mode the block renders as a
// diagram instead (see code-block/mermaid-diagram.js). It still needs a registered grammar:
// the lowlight plugin falls back to highlightAuto() for anything unregistered, which would
// colorize diagram source as whatever language it guessed. A no-op grammar keeps edit mode
// showing the raw text.
const mermaidSource = () => ({ name: 'Mermaid', disableAutodetect: true, contains: [] });

const LANGUAGES = {
	plaintext: { def: plaintext, label: 'Plain text' },
	bash: { def: bash, label: 'Bash' },
	c: { def: c, label: 'C' },
	cpp: { def: cpp, label: 'C++' },
	csharp: { def: csharp, label: 'C#' },
	css: { def: css, label: 'CSS' },
	diff: { def: diff, label: 'Diff' },
	go: { def: go, label: 'Go' },
	ini: { def: ini, label: 'INI' },
	java: { def: java, label: 'Java' },
	javascript: { def: javascript, label: 'JavaScript' },
	json: { def: json, label: 'JSON' },
	kotlin: { def: kotlin, label: 'Kotlin' },
	less: { def: less, label: 'Less' },
	lua: { def: lua, label: 'Lua' },
	makefile: { def: makefile, label: 'Makefile' },
	markdown: { def: markdown, label: 'Markdown' },
	[MERMAID_LANGUAGE]: { def: mermaidSource, label: 'Mermaid' },
	perl: { def: perl, label: 'Perl' },
	php: { def: php, label: 'PHP' },
	python: { def: python, label: 'Python' },
	ruby: { def: ruby, label: 'Ruby' },
	rust: { def: rust, label: 'Rust' },
	scss: { def: scss, label: 'SCSS' },
	shell: { def: shell, label: 'Shell' },
	sql: { def: sql, label: 'SQL' },
	swift: { def: swift, label: 'Swift' },
	xml: { def: xml, label: 'XML' },
	yaml: { def: yaml, label: 'YAML' },
};

for (const [id, { def }] of Object.entries(LANGUAGES))
{
	lowlight.registerLanguage(id, def);
}

// Default language goes first; the rest is alphabetical by label.
export const SUPPORTED_LANGUAGES = [
	{ id: DEFAULT_LANGUAGE, label: LANGUAGES[DEFAULT_LANGUAGE].label },
	...Object.entries(LANGUAGES)
		.filter(([id]) => id !== DEFAULT_LANGUAGE)
		.map(([id, { label }]) => ({ id, label }))
		.sort((a, b) => a.label.localeCompare(b.label)),
];

// Broken markdown (e.g. a fence inside a GFM table cell) can put arbitrary text into the
// info string, and that text reaches us as the `language` attribute. Everything downstream
// treats it as a CSS class token, so only known ids may pass through.
export function normalizeLanguage(id: ?string): string
{
	if (typeof id !== 'string')
	{
		return DEFAULT_LANGUAGE;
	}

	const normalized = id.trim().toLowerCase();

	return LANGUAGES[normalized] ? normalized : DEFAULT_LANGUAGE;
}

export function getLanguageLabel(id: ?string): string
{
	if (typeof id === 'string' && LANGUAGES[id])
	{
		return LANGUAGES[id].label;
	}

	return LANGUAGES[DEFAULT_LANGUAGE].label;
}

export { lowlight };

const path = require('path');

const resolveTiptapPm = {
	name: 'resolve-tiptap-pm',
	resolveId(source)
	{
		if (!source.startsWith('@tiptap/pm/') || source.startsWith('@tiptap/pm/dist/'))
		{
			return null;
		}

		const moduleName = source.slice('@tiptap/pm/'.length);

		return path.resolve(__dirname, `node_modules/@tiptap/pm/dist/${moduleName}/index.js`);
	},
};

const resolveTiptapY = {
	name: 'resolve-tiptap-y',
	resolveId(source)
	{
		if (source === '@tiptap/y-tiptap')
		{
			return path.resolve(__dirname, 'node_modules/@tiptap/y-tiptap/dist/y-tiptap.js');
		}

		return null;
	},
};

const resolveMarked = {
	name: 'resolve-marked',
	resolveId(source)
	{
		if (source === 'marked')
		{
			return path.resolve(__dirname, 'node_modules/marked/lib/marked.esm.js');
		}

		return null;
	},
};

module.exports = {
	input: 'src/index.js',
	output: 'dist/editor.bundle.js',
	namespace: 'BX.Note.Editor',
	browserslist: true,
	plugins: {
		resolve: true,
		custom: [
			resolveTiptapPm,
			resolveTiptapY,
			resolveMarked,
		],
	},
};

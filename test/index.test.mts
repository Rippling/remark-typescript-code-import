import { remark } from 'remark';
import path from 'node:path';
import remarkDirectivePlugin from 'remark-directive';
import { VFile } from 'vfile';
import { expect, test } from 'vitest';
import remarkTypescriptCodeImport from '../dist/index.js';

const cwd = process.cwd();

const vfile = (value: string) =>
  new VFile({
    value,
    path: path.resolve('./test.md'),
  });

test('No directive used', async () => {
  const inputData = vfile(`# Hello World`);
  const result = await remark()
    .use(remarkDirectivePlugin)
    .use(remarkTypescriptCodeImport)
    .process(inputData);

  expect(result.toString()).toMatchInlineSnapshot(`
    "# Hello World
    "
  `);
});

test('Directive used as textDirective', async () => {
  const inputData = vfile(`:typescript{file="./__fixtures__/types.ts#People"}`);

  try {
    await remark()
      .use(remarkDirectivePlugin)
      .use(remarkTypescriptCodeImport)
      .process(inputData);
    expect(true).toBe(false);
  } catch (e) {
    expect(true).toBe(true);
  }
});

test('Directive used as containerDirective', async () => {
  const inputData = vfile(
    `:::typescript{file="./__fixtures__/types.ts#People"}\n\n:::`
  );

  try {
    await remark()
      .use(remarkDirectivePlugin)
      .use(remarkTypescriptCodeImport)
      .process(inputData);
    expect(true).toBe(false);
  } catch (e) {
    expect(true).toBe(true);
  }
});

test('No `file` attribute provided', async () => {
  const inputData = vfile(`::typescript`);

  try {
    await remark()
      .use(remarkDirectivePlugin)
      .use(remarkTypescriptCodeImport)
      .process(inputData);
    expect(true).toBe(false);
  } catch (e) {
    expect(true).toBe(true);
  }
});

test('Valid usage', async () => {
  const inputData = vfile(
    '::typescript{file="./__fixtures__/types.ts#People"}'
  );

  const result = await remark()
    .use(remarkDirectivePlugin)
    .use(remarkTypescriptCodeImport)
    .process(inputData);

  expect(result.toString()).toMatchInlineSnapshot(`
  "\`\`\`tsx
  type People = {
    name: string;
    age: number;
  };
  \`\`\`
  "
  `);
});

test('Valid usage with <rootDir>', async () => {
  const inputData = vfile(
    '::typescript{file="<rootDir>/__fixtures__/types.ts#People"}'
  );

  const result = await remark()
    .use(remarkDirectivePlugin)
    .use(remarkTypescriptCodeImport)
    .process(inputData);

  expect(result.toString()).toMatchInlineSnapshot(`
  "\`\`\`tsx
  type People = {
    name: string;
    age: number;
  };
  \`\`\`
  "
  `);
});

test('Used Options', async () => {
  const inputData = vfile(
    '::type{filePath="<rootDir>/../__fixtures__/types.ts#People" additionalProp="value"}'
  );

  const result = await remark()
    .use(remarkDirectivePlugin)
    .use(remarkTypescriptCodeImport, {
      directiveName: 'type',
      fileAttrName: 'filePath',
      rootDir: `${cwd}/src`,
    })
    .process(inputData);

  expect(result.toString()).toMatchInlineSnapshot(`
  "\`\`\`tsx additionalProp="value"
  type People = {
    name: string;
    age: number;
  };
  \`\`\`
  "
  `);
});

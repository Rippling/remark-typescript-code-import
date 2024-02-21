# `remark-typescript-code-import`

📝 A remark plugin to import code from typescript files

[![npm version](https://badge.fury.io/js/remark-typescript-code-import.svg)](https://badge.fury.io/js/remark-typescript-code-import)

## Installation

```sh
npm install -D remark-directive remark-typescript-code-import
```

## Setup

```js
import remarkTypescriptCodeImport from 'remark-typescript-code-import';
// or
// const remarkTypescriptCodeImport = require('remark-typescript-code-import').default;
```

See [**Using plugins**](https://github.com/remarkjs/remark/blob/master/doc/plugins.md#using-plugins) for more instructions in the official documentation.

## Usage

For example, given a file named `example.mdx` with the following contents:

```md
::typescript{file="./Component.tsx#ComponentProps"}
```

and `Component.tsx`

```tsx
type ComponentProps = {
  propA: string;
}

function Component(props: ComponentProps) {
  ...
}

```

The following script:

```js
import { remark } from 'remark';
import path from 'node:path';
import remarkDirectivePlugin from 'remark-directive';
import { read } from 'to-vfile';

const result = await remark()
  .use(remarkDirectivePlugin)
  .use(remarkTypescriptCodeImport)
  .process(await read('example.md'));

console.log(result.toString());
```

yields:

````md
```tsx
type ComponentProps = {
  propA: string;
};
```
````

The file path is relative to the markdown file path. You can use `<rootDir>` at the start of the path to import files relatively from the rootDir:

```md
::typescript{file="<rootDir>/Button.tsx#ButtonComponent"}
```

It supports multiple files and types

```md
::typescript{file="./Button.tsx#ButtonComponent,ButtonProps ./Chip.tsx#ChipComponent,ChipProps"}
```

## Options

- `directiveName: string`: The directive name. Defaults to `component-docs`.
- `fileAttrName: string`: The attribute name for file path. Defaults to `file`.
- `rootDir: string`: Change what `<rootDir>` refers to. Defaults to `process.cwd()`.
- `reactDocGenOptions: object`: Options for [`react-docgen-typescript`](https://github.com/styleguidist/react-docgen-typescript?tab=readme-ov-file#options).

## Testing

After installing dependencies with `npm install`, the tests can be run with: `npm test`

## License

Rippling People Center Inc.
[Apache 2.0](LICENSE)

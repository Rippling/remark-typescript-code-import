/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast';
import path from 'node:path';
import * as ts from 'typescript';

export type PluginOptions = {
  directiveName?: string;
  fileAttributeName?: string;
  rootDir?: string;
};

function getHelpersText(params: { directiveName: string }) {
  const { directiveName } = params;
  return `
    Correct Usage:
    ::${directiveName}{file="./src/components/MyComponent.tsx#ComponentProps"}

    Multiple types/variables:
    ::${directiveName}{file="./src/components/MyComponent.tsx#ComponentProps,ComponentState"}

    Multiple files:
    ::${directiveName}{file="./src/components/MyComponent.tsx#ComponentProps ./src/components/AnotherComponent.tsx#AnotherComponentProps"}
  `;
}

function extract(file: string, identifiers: string[]) {
  // Create a Program with the file you want to extract types from
  const program = ts.createProgram([file], { allowJs: true });

  // Get the SourceFile
  const sourceFile = program.getSourceFile(file);

  // Initiate the TypeChecker
  program.getTypeChecker();

  const result = [] as { name: string; source: string }[];

  function visit(node: ts.Node) {
    if (
      ts.isInterfaceDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isVariableDeclaration(node)
    ) {
      const nodeName = node.name.getText();
      const source = ts.isVariableDeclaration(node)
        ? node.parent.getText()
        : node.getText();

      if (identifiers && nodeName && identifiers.includes(nodeName)) {
        result.push({ name: nodeName, source });
      }
    }
    ts.forEachChild(node, visit);
  }

  if (sourceFile) {
    visit(sourceFile);
  }

  return { result };
}

const attacher = ({
  directiveName = 'typescript',
  fileAttributeName = 'file',
  rootDir = process.cwd(),
}: PluginOptions = {}) => {
  return async (tree: Root, vfile: any) => {
    const { visit } = await import('unist-util-visit');
    const { path: mdxFilePath } = vfile;

    visit(tree, node => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (node.name !== directiveName) return;
        if (node.type === 'textDirective') {
          vfile.fail(
            `
            Unexpected ':${directiveName}' text directive, use two colons for a leaf directive
            
            ${getHelpersText({ directiveName })}
            `,
            node
          );
          return;
        }
        if (node.type !== 'leafDirective') {
          vfile.fail(
            `
            ${directiveName} directive must be a leaf directive.
            
            ${getHelpersText({ directiveName })}
            `,
            node
          );
          return;
        }

        const attributes = node.attributes || {};
        const { [fileAttributeName]: fileMetadata, ...restAttrs } = attributes;

        if (!fileMetadata) {
          vfile.fail(
            `
            ${directiveName} directive must have ${fileAttributeName} attribute.
            
            ${getHelpersText({ directiveName })}
            `,
            node
          );
          return;
        }

        const metaValues = fileMetadata
          .trim()
          .split(' ') // multiple files
          .map(meta => meta.split('#')); // Separate file path and type/variable list

        const sourceCodes = [] as string[];

        metaValues.forEach(item => {
          if (item.length !== 2) {
            return;
          }

          const [filePath, tsTypes] = item;

          const resolvedRootDirFilePath = /^<rootDir>/.test(filePath)
            ? path.resolve(rootDir, filePath.replace(/^<rootDir>/, '.'))
            : filePath;

          const absoluteFilePath = require.resolve(
            resolvedRootDirFilePath.startsWith('.')
              ? path.resolve(path.dirname(mdxFilePath), resolvedRootDirFilePath)
              : resolvedRootDirFilePath
          );

          const tsTypesArray = tsTypes.split(',');

          const { result } = extract(absoluteFilePath, tsTypesArray);

          sourceCodes.push(result.map(type => type.source).join('\n\n'));
        });

        Object.assign(node, {
          type: 'code',
          lang: 'tsx',
          meta: Object.entries(restAttrs)
            .reduce(
              (acc, [key, value]) => (value ? `${acc} ${key}="${value}"` : acc),
              ''
            )
            .trim(),
          value: sourceCodes.join('\n\n'),
        });
      }
    });
  };
};

export default attacher;

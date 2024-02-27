import * as path from 'path';
import * as webpack from 'webpack';
import * as WebpackBar from 'webpackbar';
// import FBIEngineComponentBuildPlugin from '@alife/fbi-engine-component-build/buildPlugin';
import { PRI_PACKAGE_NAME } from './constants';
import { globalState } from './global-state';
import { plugin } from './plugins';

class FBIEngineComponentBuildPlugin {
  apply(compiler: any) {
    compiler.resolverFactory.hooks.resolver.for('normal').tap('name', (resolver: any) => {
      resolver.hooks.resolveStep.tap('MyPlugin', (hook: any, request: any) => {
        // 修改目标文件名
        if (
          request.path &&
          request.path.match(/@alife/) &&
          request.request &&
          request.request.match(/@babel\/runtime\/.*\.js/)
        ) {
          request.request = request.request.replace(/(\.js)$/, '');
        }
      });
    });
  }
}

export interface IDllOptions {
  dllOutPath: string;
  dllFileName: string;
  dllMainfestName: string;
  pipeConfig?: (config?: webpack.Configuration) => Promise<webpack.Configuration>;
}

const stats = {
  warnings: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false,
};

const vendors = [
  'react',
  'react-dom',
  'lodash',
  'highlight.js',
  'react-router',
  'history',
  `${PRI_PACKAGE_NAME}/client`,
  ...(globalState.sourceConfig.extraVendors ?? []),
];

export const getWebpackDllConfig = (opts: IDllOptions) => {
  console.log('dll config run---------');
  const result: webpack.Configuration = {
    mode: 'development',

    entry: {
      library: plugin.devDllPipes.reduce((all, fn) => {
        return fn(all);
      }, vendors),
    },

    output: {
      filename: opts.dllFileName,
      path: opts.dllOutPath,
      library: 'library',
    },

    plugins: [
      new webpack.DllPlugin({
        path: path.join(opts.dllOutPath, opts.dllMainfestName),
        name: 'library',
      }),
      new WebpackBar(),
      new FBIEngineComponentBuildPlugin(),
    ],

    module: {
      rules: [
        {
          test: /\.css/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
        // {
        //   test: /\.worker\.tsx?$/,
        //   use: [
        //     {
        //       loader: 'worker-loader',
        //       options: {
        //         inline: true,
        //       },
        //     },
        //   ],
        // },
      ],
    },

    resolve: {
      modules: [
        // From project node_modules
        path.join(globalState.projectRootPath, 'node_modules'),
        // Self node_modules
        path.join(__dirname, '../../../node_modules'),
      ],
      extensions: ['.js', '.jsx', '.tsx', '.ts', '.scss', '.less', '.css'],
    },

    resolveLoader: {
      modules: [
        // From project node_modules
        path.join(globalState.projectRootPath, 'node_modules'),
        // Self node_modules
        path.join(__dirname, '../../node_modules'),
      ],
    },

    stats,
  };

  return result;
};

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FileParser
 * @flow
 * @format
 */

'use strict';

const {Map: ImmutableMap} = require('immutable');

import type {File} from '../codegen/RelayCodegenTypes';
import type {DocumentNode} from 'graphql';

type ParseFn = (baseDir: string, file: File) => ?DocumentNode;

class FileParser {
  _documents: Map<string, DocumentNode> = new Map();

  _baseDir: string;
  _parse: ParseFn;

  constructor(config: {baseDir: string, parse: ParseFn}) {
    this._baseDir = config.baseDir;
    this._parse = config.parse;
  }

  // Short-term: we don't do subscriptions/delta updates, instead always use all definitions
  documents(): ImmutableMap<string, DocumentNode> {
    return ImmutableMap(this._documents);
  }

  // parse should return the set of changes
  parseFiles(files: Set<File>): ImmutableMap<string, DocumentNode> {
    let documents = ImmutableMap();

    files.forEach(file => {
      const doc = (() => {
        try {
          return this._parse(this._baseDir, file);
        } catch (error) {
          throw new Error(`Parse error: ${error} in "${file.relPath}"`);
        }
      })();

      if (!doc) {
        this._documents.delete(file.relPath);
        return;
      }

      documents = documents.set(file.relPath, doc);
      this._documents.set(file.relPath, doc);
    });

    return documents;
  }
}

module.exports = FileParser;

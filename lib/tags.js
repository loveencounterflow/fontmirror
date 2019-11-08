(function() {
  'use strict';
  var CND, FS, PATH, alert, assign, badge, cast, debug, echo, help, info, isa, jr, log, rpr, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'FONTMIRROR/TAGS';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  whisper = CND.get_logger('whisper', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  FS = require('fs');

  PATH = require('path');

  ({assign, jr} = CND);

  // { walk_cids_in_cid_range
  //   cwd_abspath
  //   cwd_relpath
  //   here_abspath
  //   _drop_extension
  //   project_abspath }       = require './helpers'
  this.types = require('./types');

  ({isa, validate, cast, type_of} = this.types);

  //...........................................................................................................
  // require                   './exception-handler'

  //-----------------------------------------------------------------------------------------------------------
  this.link_all_sources = function(dry = false) {
    var FONTMIRROR, cache, extensions, fontnick, i, idx, j, len, len1, name, new_fontnick, partitioner, path, paths, paths_by_fontnicks, pattern, source_path, target_path;
    FONTMIRROR = require('..');
    source_path = FONTMIRROR.CFG.set_or_get('source_path');
    target_path = FONTMIRROR.CFG.set_or_get('target_path');
    partitioner = FONTMIRROR.NICKS.partitioner;
    extensions = FONTMIRROR.CFG.set_or_get('extensions');
    pattern = PATH.join(source_path, `/**/*.+(${extensions})`);
    paths = (require('glob')).sync(pattern);
    paths_by_fontnicks = {};
//.........................................................................................................
/* collect all filepaths */
    for (i = 0, len = paths.length; i < len; i++) {
      path = paths[i];
      name = PATH.basename(path);
      fontnick = FONTMIRROR.NICKS.escape(name);
      cache = paths_by_fontnicks[fontnick] != null ? paths_by_fontnicks[fontnick] : paths_by_fontnicks[fontnick] = [];
      cache.push(path);
    }
//.........................................................................................................
/* disambiguate fontnicks as `fooːA`, `fooːB`, ... */
    for (fontnick in paths_by_fontnicks) {
      cache = paths_by_fontnicks[fontnick];
      //.......................................................................................................
      if (cache.length === 1) {
        paths_by_fontnicks[fontnick] = cache[0];
        continue;
      }
      if (cache.length > 25) {
        throw new Error(`^fontmirror/tags@4443^ too many paths for fontnick ${rpr(fontnick)}: ${rpr(cache)}`);
      }
      //.......................................................................................................
      delete paths_by_fontnicks[fontnick];
      for (idx = j = 0, len1 = cache.length; j < len1; idx = ++j) {
        path = cache[idx];
        new_fontnick = fontnick + partitioner + String.fromCodePoint(0x41 + idx);
        paths_by_fontnicks[new_fontnick] = path;
      }
    }
//.........................................................................................................
/* rewrite paths to relative as used in symlink */
// for fontnick, path of paths_by_fontnicks

//.........................................................................................................
    for (fontnick in paths_by_fontnicks) {
      path = paths_by_fontnicks[fontnick];
      echo(CND.white((fontnick + ':').padEnd(70)), CND.lime(path));
      if (dry) {
        continue;
      }
      this._symlink;
    }
    //.........................................................................................................
    if (dry) {
      echo(CND.grey("dry run; no links have been written"));
    }
    return null;
  };

  //###########################################################################################################
  if (require.main === module) {
    (() => {
      return debug('^3332^');
    })();
  }

}).call(this);

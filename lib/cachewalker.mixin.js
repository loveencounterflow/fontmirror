(function() {
  'use strict';
  var $, $async, $drain, $show, $watch, CND, FS, PATH, SP, alert, badge, cast, debug, echo, glob, help, info, isa, jr, line_pattern, log, rpr, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'FONTMIRROR/CACHEWALKER';

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

  //...........................................................................................................
  ({isa, validate, cast, type_of} = require('./types'));

  //...........................................................................................................
  // require                   './exception-handler'
  //...........................................................................................................
  SP = require('steampipes');

  ({$, $async, $watch, $show, $drain} = SP.export());

  ({jr} = CND);

  glob = require('glob');

  PATH = require('path');

  line_pattern = /^0x(?<cid_hex>[0-9a-f]+),(?<glyph>.),(?<advance>[0-9]+),"(?<pathdata>.*)"$/u;

  //-----------------------------------------------------------------------------------------------------------
  this.walk_cached_outlines = function*(me, XXX_target_path) {
    var advance, cache_path, cache_paths, cache_pattern, cid_hex, glyph, i, len, line, match, pathdata, ref, source_path;
    // target_path     = PATH.join me.target_path, content_hash
    // cache_pattern   = PATH.join me.target_path, '*'
    validate.fontmirror_existing_folder(XXX_target_path);
    cache_pattern = PATH.join(XXX_target_path, '*');
    cache_paths = glob.sync(cache_pattern);
    yield ({
      key: '^first'
    });
    for (i = 0, len = cache_paths.length; i < len; i++) {
      cache_path = cache_paths[i];
      ref = this._walk_file_lines(cache_path);
      for (line of ref) {
        if (line.startsWith('{')) {
          ({source_path} = JSON.parse(line));
          yield ({
            key: '^new-font',
            path: source_path
          });
        } else {
          if ((match = line.match(line_pattern)) == null) {
            continue;
          }
          ({cid_hex, glyph, advance, pathdata} = match.groups);
          yield ({
            key: '^outline',
            cid_hex,
            glyph,
            advance,
            pathdata
          });
        }
      }
    }
    yield ({
      key: '^last'
    });
    return null;
  };

  // #-----------------------------------------------------------------------------------------------------------
  // @_walk_outlines_from_cache_path = ( me, cache_path ) ->
  //   whisper '^fontmirror/cachewalker@343^', "yielding from cache_path"
  //   # validate.content_hash content_hash
  //   pipeline        = []
  //   pipeline.push SP.read_from_file cache_path
  //   pipeline.push SP.$split()
  //   pipeline.push $show()
  //   pipeline.push $watch ( d ) -> yield d
  //   pipeline.push $drain =>
  //     whisper '^fontmirror/cachewalker@344^', "finished with cache_path"
  //   return null

  //-----------------------------------------------------------------------------------------------------------
  this._walk_file_lines = function*(path) {
    var Readlines, line, liner;
    Readlines = require('n-readlines');
    liner = new Readlines(path);
    while (line = liner.next()) {
      yield line.toString();
    }
    return null;
  };

}).call(this);

(function() {
  'use strict';
  var CND, FS, PATH, alert, assign, badge, cast, debug, echo, help, info, isa, jr, log, mkdirp, rpr, type_of, urge, validate, warn, whisper;

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
  mkdirp = require('mkdirp');

  //-----------------------------------------------------------------------------------------------------------
  this.link_all_sources = async function(settings) {
    var FONTMIRROR, cache, extensions, font_count, fontnick, i, idx, j, len, len1, link_path, link_relpath, link_text, links_home, name, new_fontnick, partitioner, path, paths, paths_by_fontnicks, pattern, source_name, source_path, target_path;
    validate.fontmirror_cli_command_settings(settings);
    FONTMIRROR = require('..');
    source_path = FONTMIRROR.CFG.set_or_get('source_path');
    target_path = FONTMIRROR.CFG.set_or_get('target_path');
    partitioner = FONTMIRROR.NICKS.partitioner;
    extensions = FONTMIRROR.CFG.set_or_get('extensions');
    pattern = PATH.join(source_path, `/**/*.+(${extensions})`);
    paths = (require('glob')).sync(pattern);
    paths_by_fontnicks = {};
    links_home = PATH.join(target_path, 'all');
    font_count = 0;
    //.........................................................................................................
    FONTMIRROR.LINKS.relink(PATH.join(target_path, 'sources'), source_path);
    mkdirp.sync(links_home);
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
    for (fontnick in paths_by_fontnicks) {
      path = paths_by_fontnicks[fontnick];
      font_count++;
      source_name = PATH.basename(path);
      link_text = PATH.join('../sources', PATH.relative(source_path, path));
      link_path = PATH.join(links_home, fontnick);
      link_relpath = PATH.relative(process.cwd(), link_path);
      if (!settings.quiet) {
        echo(CND.white(link_relpath.padEnd(80)), '->', CND.yellow(link_text));
      }
      if (settings.dry) {
        continue;
      }
      await FONTMIRROR.LINKS.relink(link_path, link_text);
    }
    //.........................................................................................................
    info(`linked ${font_count} fonts in ${links_home}`);
    if (settings.dry) {
      info("dry run; no links have been written");
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

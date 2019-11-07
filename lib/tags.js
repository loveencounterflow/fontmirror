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
  this.link_all_sources = function() {
    var FONTMIRROR, source_path, target_path;
    FONTMIRROR = require('..');
    source_path = FONTMIRROR.CFG.set_or_get('source_path');
    target_path = FONTMIRROR.CFG.set_or_get('target_path');
    debug('^4778^', source_path, source_path);
    debug('^4778^', target_path, target_path);
    return null;
  };

  //###########################################################################################################
  if (require.main === module) {
    (() => {
      return debug('^3332^');
    })();
  }

}).call(this);

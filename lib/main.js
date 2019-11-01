(function() {
  'use strict';
  var CND, FS, FSP, MAIN, Multimix, PATH, UCDB, Ucdb, _drop_extension, alert, assign, badge, cast, cwd_abspath, cwd_relpath, debug, echo, glob, help, here_abspath, info, isa, jr, log, project_abspath, rpr, type_of, urge, validate, walk_cids_in_cid_range, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'FONTMIRROR';

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

  FSP = FS.promises;

  PATH = require('path');

  ({assign, jr} = CND);

  ({walk_cids_in_cid_range, cwd_abspath, cwd_relpath, here_abspath, _drop_extension, project_abspath} = require('./helpers'));

  this.types = require('./types');

  //...........................................................................................................
  ({isa, validate, cast, type_of} = this.types);

  //...........................................................................................................
  glob = require('glob');

  // glob                      = ( require 'util' ).promisify _glob
  require('./exception-handler');

  // PD                        = require 'pipedreams'
  // { $
  //   $async
  //   $watch
  //   $show  }                = PD.export()
  //...........................................................................................................
  Multimix = require('multimix');

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  MAIN = this;

  Ucdb = (function() {
    class Ucdb extends Multimix {};

    Ucdb.include(MAIN, {
      overwrite: false
    });

    return Ucdb;

  }).call(this);

  // @include ( require './styles.mixin'         ), { overwrite: false, }
  // @include ( require './configuration.mixin'  ), { overwrite: false, }
  // @extend MAIN, { overwrite: false, }
  module.exports = UCDB = new Ucdb();

  //###########################################################################################################
  if (require.main === module) {
    (() => {
      return null;
    })();
  }

}).call(this);

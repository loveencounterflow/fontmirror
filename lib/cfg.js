(function() {
  'use strict';
  var CND, PATH, alert, badge, cast, cfg, debug, defaults, echo, help, info, isa, jr, key_infos, log, package_json, rpr, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'FONTMIRROR/CFG';

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
  jr = JSON.stringify;

  PATH = require('path');

  this.types = require('./types');

  ({isa, validate, cast, type_of} = this.types);

  //...........................................................................................................
  defaults = {
    source_path: null,
    target_path: process.cwd(),
    extensions: 'otf|ttf|woff|woff2|ttc'
  };

  //...........................................................................................................
  package_json = require('../package.json');

  this.name = package_json.name;

  this.version = package_json.version;

  cfg = new (require('configstore'))(this.name, defaults);

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT consider to move this to types module */
  key_infos = {
    extensions: {
      type: 'nonempty_text'
    },
    source_path: {
      type: 'fontmirror_existing_folder'
    },
    target_path: {
      type: 'fontmirror_existing_folder'
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  this.set_or_get = function(key, value, display) {
    var R, key_info, ref, ref1, type;
    if ((key_info = key_infos[key]) == null) {
      throw new Error(`^fontmirror/cfg@3782^ unknown key ${rpr(key)}`);
    }
    type = (ref = key_info.type) != null ? ref : null;
    if (value !== void 0) {
      if (type != null) {
        validate[type](value);
      }
      R = cfg.set(key, value);
      if (display) {
        whisper(`fontmirror ${key} set to ${jr(value)}`);
      }
      return R;
    }
    R = (ref1 = cfg.get(key)) != null ? ref1 : null;
    if (type != null) {
      validate[type](R);
    }
    if (display) {
      info(`fontmirror ${key}: ${jr(R)}`);
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.show_cfg = function() {
    var key, ref, value;
    whisper(`configuration values in ${cfg.path}`);
    ref = cfg.all;
    for (key in ref) {
      value = ref[key];
      info(CND.white((key + ':').padEnd(50)), CND.lime(value));
    }
    return null;
  };

  // ############################################################################################################
// if require.main is module then do =>
//   debug '^334521^'

}).call(this);

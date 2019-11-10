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
    source_path: {
      type: 'fontmirror_existing_folder',
      default: null
    },
    target_path: {
      type: 'fontmirror_existing_folder',
      default: null
    },
    extensions: {
      type: 'fontmirror_fontfile_extensions',
      default: ['otf', 'ttf', 'woff', 'woff2', 'ttc']
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  this.new_tagger = function(_job_settings) {
    var FONTMIRROR, R;
    FONTMIRROR = require('..');
    R = assign({}, FONTMIRROR.CFG.all());
    R.fontnick_sep = FONTMIRROR.NICKS.partitioner;
    R.glob_fonts = PATH.join(R.source_path, `**/*.+(${R.extensions})`);
    R.path_fonts = R.source_path;
    R.path_fmcatalog = R.target_path;
    R.path_all = PATH.join(R.target_path, 'all');
    R.path_cfg = PATH.join(R.target_path, 'cfg');
    R.path_cache = PATH.join(R.target_path, 'cache');
    R.path_tagged = PATH.join(R.target_path, 'tagged');
    R.path_untagged = PATH.join(R.target_path, 'untagged');
    R.path_outlines = PATH.join(R.target_path, 'outlines');
    //.........................................................................................................
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.set = function(me, key, value, display) {
    var key_info, ref, type;
    if ((key_info = key_infos[key]) == null) {
      throw new Error(`^fontmirror/cfg@3782^ unknown key ${rpr(key)}`);
    }
    if ((type = (ref = key_info.type) != null ? ref : null) != null) {
      validate[type](value);
    }
    me[key] = value;
    cfg.set(key, value);
    if (display) {
      whisper(`fontmirror ${key} set to ${jr(value)}`);
    }
    return value;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.get = function(me, key, display) {
    var key_info, ref, ref1, type, value;
    if ((key_info = key_infos[key]) == null) {
      throw new Error(`^fontmirror/cfg@3782^ unknown key ${rpr(key)}`);
    }
    value = (ref = cfg.get(key)) != null ? ref : null;
    if ((type = (ref1 = key_info.type) != null ? ref1 : null) != null) {
      validate[type](value);
    }
    if (display) {
      info(`fontmirror ${key}: ${jr(value)}`);
    }
    return value;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.all = function() {
    return cfg.all;
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

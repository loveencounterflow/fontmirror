(function() {
  'use strict';
  var CND, FS, Failure, PATH, alert, badge, debug, defaults, echo, help, info, isa, log, rpr, type_of, types, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'FONTMIRROR/HELPERS';

  log = CND.get_logger('plain', badge);

  debug = CND.get_logger('debug', badge);

  info = CND.get_logger('info', badge);

  warn = CND.get_logger('warn', badge);

  alert = CND.get_logger('alert', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  this.cwd_abspath = CND.cwd_abspath.bind(CND);

  this.cwd_relpath = CND.cwd_relpath.bind(CND);

  this.here_abspath = CND.here_abspath.bind(CND);

  this._drop_extension = function(path) {
    return path.slice(0, path.length - (PATH.extname(path)).length);
  };

  this.project_abspath = (function(...P) {
    return this.here_abspath(__dirname, '..', ...P);
  }).bind(this);

  PATH = require('path');

  FS = require('fs');

  types = require('./types');

  ({isa, validate, type_of, defaults, Failure} = types);

  //-----------------------------------------------------------------------------------------------------------
  this.load_configuration = function() {
    var x;
    return Object.assign(...((function() {
      var i, len, ref, results;
      ref = this._load_configurations_from_standard_locations();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        x = ref[i];
        results.push(x.settings);
      }
      return results;
    }).call(this)));
  };

  //-----------------------------------------------------------------------------------------------------------
  this._load_configurations_from_standard_locations = function() {
    var R, error, home, path, start_home;
    home = start_home = this.project_abspath();
    R = [];
    while (true) {
      if (home === '/') {
        break;
      }
      path = PATH.resolve(PATH.join(home, 'ucdb.json'));
      try {
        R.push({
          path,
          settings: require(path)
        });
      } catch (error1) {
        error = error1;
        if (error.code !== 'MODULE_NOT_FOUND') {
          throw error;
        }
      }
      home = PATH.dirname(home);
    }
    if (R.length === 0) {
      throw new Error(`^ucdb#2201 unable to locate file ucdb.json in any parent directory of ${start_home}`);
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._get_user_home = function() {
    return PATH.abspath((require('os')).homedir());
  };

  // debug @load_configuration()
  // debug ( k for k of require.main)
  // debug require.main.filename
  // debug ( require 'app-root-path' ).path
  // debug ( require 'os' ).homedir()

  // PATH                      = require 'path'
  // #...........................................................................................................
  // @assign                   = Object.assign

  // info @here_abspath  '/foo/bar', '/baz/coo'
  // info @cwd_abspath   '/foo/bar', '/baz/coo'
  // info @here_abspath  '/baz/coo'
  // info @cwd_abspath   '/baz/coo'
  // info @here_abspath  '/foo/bar', 'baz/coo'
  // info @cwd_abspath   '/foo/bar', 'baz/coo'
  // info @here_abspath  'baz/coo'
  // info @cwd_abspath   'baz/coo'
  // info @here_abspath  __dirname, 'baz/coo', 'x.js'

  //-----------------------------------------------------------------------------------------------------------
  this.walk_cids_in_cid_range = (range) => {
    if (isa.text(range)) {
      return (function*() {        /* TAINT this method should conceivably be in a type casting module */
        var chr, i, len, ref, results;
        ref = [...range];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          chr = ref[i];
          results.push((yield chr.codePointAt(0)));
        }
        return results;
      })();
    }
    return (function*() {      /* TAINT do some type checking (must be list of two CIDs) */
      var cid, i, ref, ref1, results;
      results = [];
      for (cid = i = ref = range[0], ref1 = range[1]; (ref <= ref1 ? i <= ref1 : i >= ref1); cid = ref <= ref1 ? ++i : --i) {
        results.push((yield cid));
      }
      return results;
    })();
  };

  // #-----------------------------------------------------------------------------------------------------------
  // @readable_stream_from_text = ( text ) ->
  //   ### thx to https://stackoverflow.com/a/22085851/7568091 ###
  //   R = new ( require 'stream' ).Readable()
  //   R._read = () => {} # redundant?
  //   R.push text
  //   R.push null
  //   return R

  //###########################################################################################################
  /* TAINT the following methods that are prefixed with `SQL_` should become part of an updated ICQL APLI */
  //###########################################################################################################

  //-----------------------------------------------------------------------------------------------------------
  this.SQL_text_as_literal = function(x) {
    /* NOTE: lifted from ICQL */
    validate.text(x);
    return "'" + (x.replace(/'/g, "''")) + "'";
  };

  // #-----------------------------------------------------------------------------------------------------------
  // @SQL_list_as_json_literal = ( x ) ->
  //   ### NOTE: lifted from ICQL ###
  //   validate.list x
  //   return @SQL_text_as_literal JSON.stringify x

  //-----------------------------------------------------------------------------------------------------------
  this.SQL_escape_value = function(x) {
    /* NOTE: lifted from ICQL */
    var type;
    switch (type = type_of(x)) {
      case 'text':
        return this.SQL_text_as_literal(x);
      // when 'list'     then return @SQL_list_as_json_literal x
      case 'number':
        return x.toString();
      case 'boolean':
        return (x ? '1' : '0');
      case 'null':
        return 'null';
    }
    throw new Failure('^sfm/sql@error_no_literal^', `unable to express a ${type} as SQL literal, got ${rpr(x)}`);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.SQL_generate_values_tuple = function(values) {
    var x;
    validate.list(values);
    return '( ' + (((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = values.length; i < len; i++) {
        x = values[i];
        results.push(this.SQL_escape_value(x));
      }
      return results;
    }).call(this)).join(', ')) + ' )';
  };

}).call(this);

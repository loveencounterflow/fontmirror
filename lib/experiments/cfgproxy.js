(function() {
  'use strict';
  var CND, FS, PATH, alert, assign, badge, cast, debug, defaults, echo, help, info, isa, jr, log, rpr, type_of, types, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'FONTMIRROR/CFGPROXY';

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
  types = require('./types');

  ({isa, validate, cast, defaults, type_of} = types);

  // #-----------------------------------------------------------------------------------------------------------
  // ### TAINT consider to move this to types module ###
  // key_infos =
  //   source_path:
  //     type:       'fontmirror_existing_folder'
  //     default:    null
  //   target_path:
  //     type:       'fontmirror_existing_folder'
  //     default:    null
  //   extensions:
  //     type:       'fontmirror_fontfile_extensions'
  //     default:    [ 'otf', 'ttf', 'woff', 'woff2', 'ttc', ]

  // R.fontnick_sep        = FONTMIRROR.NICKS.partitioner                          # read-only
  // R.glob_fonts          = PATH.join R.source_path, "**/*.+(#{R.extensions})"    # read-only
  // R.path_fonts          = R.source_path                                         # read-only; set to link target of join path.path_fmcatalog, sources
  // R.path_fmcatalog      = R.target_path                                         # read-only; set to process.cwd() where not present on command line
  // R.path_all            = PATH.join R.target_path, 'all'                        # read-only
  // R.path_cfg            = PATH.join R.target_path, 'cfg'                        # read-only
  // R.path_cache          = PATH.join R.target_path, 'cache'                      # read-only
  // R.path_tagged         = PATH.join R.target_path, 'tagged'                     # read-only
  // R.path_untagged       = PATH.join R.target_path, 'untagged'                   # read-only
  // R.path_outlines       = PATH.join R.target_path, 'outlines'                   # read-only

  //-----------------------------------------------------------------------------------------------------------
  this.new_cfgproxy = function(_job_settings) {
    /*

    `cfgproxy`

    */
    var R, X;
    X = {
      get: function(target, name) {
        return 42;
      },
      set: function(target, name, value) {
        return target[name] = value != null ? value : null;
      }
    };
    R = new Proxy({}, X);
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.demo = function() {
    var cfg;
    return cfg = this.new_cfgproxy({});
  };

  //###########################################################################################################
  if (require.main === module) {
    (async() => {
      return (await this.demo());
    })();
  }

}).call(this);

//# sourceMappingURL=cfgproxy.js.map
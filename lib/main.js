(function() {
  'use strict';
  var CND, FONTMIRROR, FS, Fontmirror, MAIN, Multimix, PATH, alert, assign, badge, cast, debug, echo, glob, help, info, isa, jr, log, rpr, type_of, urge, validate, warn, whisper;

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
  glob = require('glob');

  require('./exception-handler');

  Multimix = require('multimix');

  //-----------------------------------------------------------------------------------------------------------
  this._content_hash_from_path = function(me, path) {
    return CND.id_from_route(path, 17);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.new_job = function(source_path, target_path, force_overwrite) {
    var source_paths;
    // fonts_home  = project_abspath '.', 'font-sources'
    // pattern     = fonts_home + '/**/*'
    // settings    = { matchBase: true, follow: true, stat:true, }
    // R           = {}
    // info "^ucdb@1003^ building font cache..."
    // globber     = new _glob.Glob pattern, settings, ( error, filepaths ) =>
    //   return reject error if error?
    //   info "^ucdb@1004^ found #{filepaths.length} files"
    //   for filepath in filepaths
    //     unless ( stat = globber.statCache[ filepath ] )?
    //       ### TAINT stat missing file instead of throwing error ###
    //       return reject new Error "^77464^ not found in statCache: #{rpr filepath}"
    //     filename      = PATH.basename filepath
    //     continue if R[ filename ]?
    //     filesize      = stat.size
    //     R[ filename ] = { filepath, filesize, }
    //   resolve R
    /* TAINT may want to configure Glob as shown above */
    source_path = PATH.resolve(source_path);
    target_path = PATH.resolve(target_path);
    //.........................................................................................................
    if (isa.fontmirror_existing_file(source_path)) {
      source_paths = [source_path];
    } else if (isa.fontmirror_existing_folder(source_path)) {
      source_paths = glob.sync(PATH.join(source_path, '/**/*'));
    } else {
      throw new Error(`^445552^ expected path to existing file or folder, got ${rpr(source_path)}`);
    }
    //.........................................................................................................
    if (!isa.fontmirror_existing_folder(target_path)) {
      throw new Error(`^fontmirror@445^ expected path to existing folder, got ${rpr(target_path)}`);
    }
    //.........................................................................................................
    return {source_path, target_path, source_paths, force_overwrite};
  };

  //-----------------------------------------------------------------------------------------------------------
  this._is_cached = function(me, target_path) {
    return isa.fontmirror_existing_file(target_path);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.cache_font_outlines = async function(source_path, target_path, force_overwrite) {
    /* source must be an existing font file or a directory of font files; target must be an existing
    directory */
    var content_hash, i, len, me, ref, source, source_relpath;
    me = this.new_job(source_path, target_path, force_overwrite);
    ref = me.source_paths;
    for (i = 0, len = ref.length; i < len; i++) {
      source_path = ref[i];
      if ((source_path.match(/F\.TTF$/)) == null) {
        continue;
      }
      source_relpath = PATH.relative(process.cwd(), source_path);
      source = {
        path: source_path,
        relpath: source_relpath
      };
      content_hash = this._content_hash_from_path(me, source.path);
      target_path = PATH.join(me.target_path, content_hash);
      if ((!me.force_overwrite) && this._is_cached(me, target_path)) {
        whisper(`cached: ${source.relpath}`);
        continue;
      }
      whisper(`not cached: ${source.relpath}`);
      await this._write_font_outlines(me, source, target_path);
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.main = function() {
    var app;
    app = require('commander');
    app.version((require('../package.json')).version).command('cache <source> <target>').option('-f --force', "force overwrite existing cache").action(async function(source_path, target_path, d) {
      var force_overwrite, ref;
      force_overwrite = (ref = d.force) != null ? ref : false;
      return (await FONTMIRROR.cache_font_outlines(source_path, target_path, force_overwrite));
    });
    app.parse(process.argv);
    return null;
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  MAIN = this;

  Fontmirror = (function() {
    class Fontmirror extends Multimix {};

    Fontmirror.include(MAIN, {
      overwrite: false
    });

    Fontmirror.include(require('./outliner.mixin'), {
      overwrite: false
    });

    return Fontmirror;

  }).call(this);

  // @extend MAIN, { overwrite: false, }
  module.exports = FONTMIRROR = new Fontmirror();

  //###########################################################################################################
  if (require.main === module) {
    (() => {
      return FONTMIRROR.main();
    })();
  }

}).call(this);

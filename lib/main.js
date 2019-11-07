(function() {
  'use strict';
  var CND, FONTMIRROR, FS, Fontmirror, MAIN, Multimix, PATH, TEXFONTNAMESAKE, alert, assign, badge, cast, debug, echo, fontfile_extensions, glob, help, info, isa, jr, log, rpr, type_of, urge, validate, warn, whisper,
    indexOf = [].indexOf;

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

  TEXFONTNAMESAKE = require('./texfontnamesake');

  fontfile_extensions = 'otf|ttf|woff|woff2|ttc';

  // 'eot|svg'

  //-----------------------------------------------------------------------------------------------------------
  this._content_hash_from_path = function(me, path) {
    return CND.id_from_route(path, 17);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.new_job = function(source_path, target_path, force_overwrite) {
    var glob_pattern, glob_settings, source_paths;
    source_path = PATH.resolve(source_path);
    target_path = PATH.resolve(target_path);
    glob_settings = {
      matchBase: true,
      follow: true,
      nocase: true
    };
    glob_pattern = PATH.join(source_path, `/**/*.+(${fontfile_extensions})`);
    help(`^fontmirror@4452^ matching against ${glob_pattern}`);
    //.........................................................................................................
    if (isa.fontmirror_existing_file(source_path)) {
      source_paths = [source_path];
    } else if (isa.fontmirror_existing_folder(source_path)) {
      source_paths = glob.sync(glob_pattern, glob_settings);
    } else {
      throw new Error(`^445552^ expected path to existing file or folder, got ${rpr(source_path)}`);
    }
    //.........................................................................................................
    if (!isa.fontmirror_existing_folder(target_path)) {
      throw new Error(`^fontmirror@445^ expected path to existing folder, got ${rpr(target_path)}`);
    }
    return {
      //.........................................................................................................
      source_path,
      target_path,
      source_paths,
      force_overwrite,
      outline_count: 0
    };
  };

  //-----------------------------------------------------------------------------------------------------------
  this._is_cached = function(me, target_path) {
    return isa.fontmirror_existing_file(target_path);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.cache_font_outlines = async function(source_path, target_path, force_overwrite) {
    /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
    /* source must be an existing font file or a directory of font files; target must be an existing
    directory */
    /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
    var XXX_excludes, content_hash, filename, fontnick, i, len, me, ref, source, source_relpath;
    me = this.new_job(source_path, target_path, force_overwrite);
    XXX_excludes = null;
    // andːregularːotf     !!! intentional fallback glyph font
    // andːregularːttf     !!! intentional fallback glyph font
    // lastːresortːttf     !!! intentional fallback glyph font

    // �￾￿￯
    // '�￾￿' 0xfffd, 0xfffe, 0xffff
    // '﷐﷑﷒﷓﷔﷕﷖﷗﷘﷙﷚﷛﷜﷝﷞﷟﷠﷡﷢﷣﷤﷥﷦﷧﷨﷩﷪﷫﷬﷭﷮﷯' 0xfdd0..0xfdef non-characters
    // '鿿' 0x9fff unassigned
    // dejaːvuːsansːmonoːboldːobliqueːttf
    // iosevkaːslabːthinːttf
    // thːtshynːpːoneːttf
    // wenːyueːguːdianːmingːchaoːtiːncːwːfiveːːoneːotf has fallback image? at 乸, but correctly missing glyphs othwerwise
    // babelːstoneːhanːttf
    // dejaːvuːsansːmonoːboldːobliqueːttf
    // iosevkaːslabːthinːttf
    // sunːextaːttf
    // thːtshynːpːoneːttf
    // thːtshynːpːoneːttf
    // wenːyueːguːdianːmingːchaoːtiːncːwːfiveːːoneːotf
    XXX_excludes = "andːregularːotf\nandːregularːttf\nlastːresortːttf\ndroidːsansːfallbackːfullːttf";
    if (XXX_excludes != null) {
      XXX_excludes = XXX_excludes.split(/\s+/);
      XXX_excludes = XXX_excludes.filter(function(x) {
        return x !== '';
      });
    }
    ref = me.source_paths;
    /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
    for (i = 0, len = ref.length; i < len; i++) {
      source_path = ref[i];
      filename = PATH.basename(source_path);
      fontnick = TEXFONTNAMESAKE.escape(filename);
      if ((XXX_excludes != null) && indexOf.call(XXX_excludes, fontnick) >= 0) {
        /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
        continue;
      }
      source_relpath = PATH.relative(process.cwd(), source_path);
      source = {
        path: source_path,
        relpath: source_relpath,
        fontnick
      };
      content_hash = this._content_hash_from_path(me, source.path);
      target_path = PATH.join(me.target_path, content_hash);
      if (this._is_cached(me, target_path)) {
        if (!me.force_overwrite) {
          help(`skipping:    ${content_hash} ${source.fontnick}`);
          continue;
        }
        urge(`overwriting: ${content_hash} ${source.fontnick}`);
      } else {
        info(`new:         ${content_hash} ${source.fontnick}`);
      }
      await this._write_font_outlines(me, source, target_path);
    }
    return null;
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  MAIN = this;

  Fontmirror = (function() {
    class Fontmirror extends Multimix {
      // @extend MAIN, { overwrite: false, }

      //---------------------------------------------------------------------------------------------------------
      /* !!!!!!!!!!!!!!!!!!!!!!!!!!! */      constructor(target = null) {
        super();
        this.CLI = require('./cli');
        this.CFG = require('./cfg');
        this.TAGS = require('./tags');
        if (target != null) {
          this.export(target);
        }
      }

    };

    Fontmirror.include(MAIN, {
      overwrite: false
    });

    Fontmirror.include(require('./outliner.mixin'), {
      overwrite: false
    });

    Fontmirror.include(require('./cachewalker.mixin'), {
      overwrite: false
    });

    Fontmirror.include(require('./_temp_svgttf'), {
      overwrite: false
    });

    return Fontmirror;

  }).call(this);

  module.exports = FONTMIRROR = new Fontmirror();

  //###########################################################################################################
  if (require.main === module) {
    (() => {
      return FONTMIRROR.cli();
    })();
  }

}).call(this);

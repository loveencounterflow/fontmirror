(function() {
  'use strict';
  var $, $async, $show, $watch, CND, FS, FSP, MIRAGE, MKNCR, Multimix, PATH, PD, SVGTTF, _drop_extension, _glob, alert, assign, badge, cast, cwd_abspath, cwd_relpath, debug, declare, echo, glob, help, here_abspath, info, isa, jr, last_of, log, mkts_glyph_styles, mkts_options, project_abspath, rpr, runmode, size_of, type_of, urge, validate, walk_cids_in_cid_range, warn, whisper,
    indexOf = [].indexOf;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'UCDB';

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
  ({isa, validate, declare, cast, size_of, last_of, type_of} = this.types);

  //...........................................................................................................
  _glob = require('glob');

  glob = (require('util')).promisify(_glob);

  require('./exception-handler');

  PD = require('pipedreams');

  ({$, $async, $watch, $show} = PD.export());

  //...........................................................................................................
  mkts_options = require('./_TEMPORARY_options');

  mkts_glyph_styles = mkts_options.tex['glyph-styles'];

  MKNCR = require('mingkwai-ncr');

  SVGTTF = require('svgttf');

  MIRAGE = require('sqlite-file-mirror');

  // RCFG                      = require './read-configuration'
  Multimix = require('multimix');

  //...........................................................................................................
  runmode = 'production';

  runmode = 'debug';

  runmode = 'debug_small';

  runmode = 'debug_cross_cjk';

  //-----------------------------------------------------------------------------------------------------------
  this.read_rsgs = function(me) {
    return new Promise(function(resolve) {
      var $as_datom, $collect, path, pipeline, rsgs;
      //.........................................................................................................
      $as_datom = function() {
        var lnr;
        lnr = 0;
        return $(function(line, send) {
          var match;
          lnr++;
          if (isa.blank_text(line)) {
            return null;
          }
          if ((line.match(/^\s*#/)) != null) {
            return null;
          }
          if ((match = line.match(/^(?<new_rsg>\S+)\s+(?<old_rsg>\S+)\s+(?<block_name>.+)$/)) == null) {
            throw new Error(`^ucdb@1001^ unexpected line format in line ${lnr}`);
          }
          return send(PD.new_datom('^entry', {...match.groups, lnr}));
        });
      };
      //.........................................................................................................
      $collect = function(collector) {
        var last;
        last = Symbol('last');
        return $({last}, function(d, send) {
          if (d === last) {
            collector.new_by_old['u'] = 'u-----';
            collector.old_by_new['u-----'] = 'u';
            collector.new_by_old['jzr'] = 'jzr---';
            collector.old_by_new['jzr---'] = 'jzr';
            return send(collector);
          }
          collector.new_by_old[d.old_rsg] = d.new_rsg;
          return collector.old_by_new[d.new_rsg] = d.old_rsg;
        });
      };
      //.........................................................................................................
      // debug FS.readFileSync path
      // debug path
      path = project_abspath('../../io/mingkwai-rack/jzrds/ucdx/rsgs.txt');
      pipeline = [];
      rsgs = {
        new_by_old: {},
        old_by_new: {}
      };
      pipeline.push(PD.read_from_file(path));
      pipeline.push(PD.$split());
      pipeline.push($as_datom());
      pipeline.push($collect(rsgs));
      // pipeline.push PD.$show()
      pipeline.push(PD.$drain(function() {
        me.rsgs = rsgs;
        return resolve(null);
      }));
      return PD.pull(...pipeline);
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this._get_iclabel = function(me, cid, glyph, csg, old_rsg) {
    var cid_hex, new_rsg, realm, swatch;
    if ((new_rsg = me.rsgs.new_by_old[old_rsg]) == null) {
      throw new Error(`^ucdb@1002^ unknown RSG ${rpr(old_rsg)}`);
    }
    // A:uc0---:005750:坐
    switch (csg) {
      case 'u':
        realm = 'A';
        swatch = glyph;
        break;
      case 'jzr':
        realm = 'I';
        swatch = glyph;
        break;
      case 'test':
        realm = 'X';
        swatch = glyph;
        break;
      default:
        realm = 'L';
        swatch = '�';
    }
    cid_hex = (cid.toString(16)).padStart(6, '0');
    return `${realm}:${new_rsg}:${cid_hex}:${swatch}`;
  };

  //===========================================================================================================
  // FONTNICKS
  //-----------------------------------------------------------------------------------------------------------
  this.read_fontnicks = function(me) {
    var R, filename, fontnick, has_rows, otf, ref, row;
    R = {};
    has_rows = false;
    ref = me.db.configured_fontnicks_and_files();
    for (row of ref) {
      ({fontnick, filename, otf} = row);
      has_rows = true;
      R[fontnick] = {filename};
      if (otf != null) {
        R[fontnick].otf = otf;
      }
    }
    if (!has_rows) {
      throw new Error("^ucdb@98567 unable to find any configured fonts");
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._build_fontcache = function(me) {
    return new Promise((resolve, reject) => {
      var R, fonts_home, globber, pattern, settings;
      /* TAINT cache data to avoid walking the tree many times, see https://github.com/isaacs/node-glob#readme */
      // validate.ucdb_clean_filename filename
      //.........................................................................................................
      fonts_home = project_abspath('.', 'font-sources');
      pattern = fonts_home + '/**/*';
      settings = {
        matchBase: true,
        follow: true,
        stat: true
      };
      R = {};
      info("^ucdb@1003^ building font cache...");
      return globber = new _glob.Glob(pattern, settings, (error, filepaths) => {
        var filename, filepath, filesize, i, len, stat;
        if (error != null) {
          return reject(error);
        }
        info(`^ucdb@1004^ found ${filepaths.length} files`);
        for (i = 0, len = filepaths.length; i < len; i++) {
          filepath = filepaths[i];
          if ((stat = globber.statCache[filepath]) == null) {
            /* TAINT stat missing file instead of throwing error */
            return reject(new Error(`^77464^ not found in statCache: ${rpr(filepath)}`));
          }
          filename = PATH.basename(filepath);
          if (R[filename] != null) {
            continue;
          }
          filesize = stat.size;
          R[filename] = {filepath, filesize};
        }
        return resolve(R);
      });
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this._describe_filename = async function(me, filename) {
    var filepath, filesize;
    filepath = (await this._locate_fontfile(me, filename));
    filesize = (await this._filesize_from_path(me, filepath));
    return {filepath, filesize};
  };

  //-----------------------------------------------------------------------------------------------------------
  this.populate_table_fontnicks = function(me) {
    return new Promise(async(resolve, reject) => {
      var cache_entry, data, filename, filepath, filesize, font_cache, fontnick, last_idx, line_count, otf, preamble, ref, row, sql;
      me.fontnicks = (await this.read_fontnicks(me));
      font_cache = (await this._build_fontcache(me));
      preamble = [];
      data = [];
      line_count = 0;
      preamble.push(me.db.create_table_fontnicks_first());
      ref = me.fontnicks;
      //.........................................................................................................
      for (fontnick in ref) {
        ({filename, otf} = ref[fontnick]);
        line_count++;
        if ((cache_entry = font_cache[filename]) == null) {
          warn('^4432^', `unable to find fontnick ${fontnick}, filename ${filename}`);
          continue;
        }
        ({filepath, filesize} = cache_entry);
        if (otf == null) {
          otf = null;
        }
        row = {fontnick, filename, filepath, filesize, otf};
        data.push((me.db.create_table_fontnicks_middle(row)) + ',');
      }
      if ((last_idx = data.length - 1) > -1) {
        data[last_idx] = data[last_idx].replace(/,\s*$/g, '');
      }
      //.........................................................................................................
      sql = [...preamble, ...data, ';'].join('\n');
      me.db.$.execute(sql);
      me.line_count += line_count;
      return resolve(null);
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this._fontnick_from_tex_block = function(me, tex_block) {
    var fontnick, match, ref, texstyle;
    if (tex_block == null) {
      return null;
    }
    // unless tex_block?
    //   throw new Error "^ucdb@1005^ tex_block must not be null"
    if ((match = tex_block.match(/^\\(?<texstyle>[a-zA-Z]+)\{\}$/)) == null) {
      throw new Error(`^ucdb@1006^ unexpected tex_block format ${rpr(tex_block)}`);
    }
    texstyle = (ref = typeof style !== "undefined" && style !== null ? style.cmd : void 0) != null ? ref : match.groups.texstyle;
    // texstyle  = @_fontnick_from_texname texstyle
    if ((fontnick = this.fontnick_by_texstyles[texstyle]) == null) {
      throw new Error(`^ucdb@1007^ unknown texstyle ${rpr(texstyle)}`);
    }
    return fontnick;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._fontnick_from_style = function(me, style = null) {
    var command, fontnick;
    if (style == null) {
      return null;
    }
    if ((command = style.cmd) == null) {
      return null;
    }
    validate.nonempty_text(command);
    if ((fontnick = this.fontnick_by_texstyles[command]) == null) {
      // throw new Error "^ucdb@1008^ unknown texstyle #{rpr style}"
      warn(`^ucdb@1008^ unknown texstyle ${rpr(style)}`);
      return null;
    }
    return fontnick;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._fontnick_from_style_or_tex_block = function(me, style, tex_block) {
    var fontnick_A, fontnick_B, ref;
    // try
    fontnick_A = this._fontnick_from_style(me, style);
    fontnick_B = this._fontnick_from_tex_block(me, tex_block);
    // catch error
    //   if not me._seen_unknown.has error.message
    //     me._seen_unknown.add error.message
    //     warn '^47474', fncr, glyph, error.message
    return (ref = fontnick_A != null ? fontnick_A : fontnick_B) != null ? ref : null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._cleanup_style = function(me, style) {
    if (style == null) {
      return null;
    }
    if (style.cmd != null) {
      /* Remove redundant `cmd` property, drop empty styles: */
      delete style.cmd;
    }
    if ((Object.keys(style)).length === 0) {
      return null;
    } else {
      return style;
    }
  };

  //===========================================================================================================
  // MAIN TABLE
  //-----------------------------------------------------------------------------------------------------------
  this._XXX_get_all_glyphs_as_list_from_cfg_glyphsets = function(me) {
    /* TAINT to be replaced by a configuration that maps from runmodes to sets of glyphs and fonts */
    return Array.from((this._XXX_get_all_glyphstrings_from_cfg_glyphsets(me)).join(''));
  };

  this._XXX_get_all_glyphstrings_from_cfg_glyphsets = function(me) {
    var row;
    return (function() {
      var ref, results;
      ref = me.db.$.query("select setname, glyphs from cfg_glyphsets;");
      results = [];
      for (row of ref) {
        /* TAINT to be replaced by a configuration that maps from runmodes to sets of glyphs and fonts */
        results.push(row.glyphs);
      }
      return results;
    })();
  };

  //-----------------------------------------------------------------------------------------------------------
  this.populate_table_main = function(me) {
    return new Promise(async(resolve, reject) => {
      var cid, cid_range, cid_ranges, cids, csg, data, description, fncr, glyph, i, iclabel, is_u9cjkidg, last_idx, len, line_count, ncr, preamble, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, row, rsg, sfncr, sql, style, tags, xncr;
      preamble = [];
      data = [];
      line_count = 0;
      me._seen_unknown = new Set();
      preamble.push(me.db.create_table_main_first());
      await this.read_rsgs(me);
      cid_ranges = this._XXX_get_all_glyphstrings_from_cfg_glyphsets(me);
//.........................................................................................................
/* TAINT see remark in method */      for (i = 0, len = cid_ranges.length; i < len; i++) {
        cid_range = cid_ranges[i];
        //.......................................................................................................
        /* TAINT use casting or call subroutine to derive range iterator */
        if (isa.text(cid_range)) {
          cids = function*() {
            var _glyph, j, len1, ref, results;
            ref = [...cid_range];
            results = [];
            for (j = 0, len1 = ref.length; j < len1; j++) {
              _glyph = ref[j];
              results.push((yield _glyph.codePointAt(0)));
            }
            return results;
          };
        } else {
          //.......................................................................................................
          cids = function*() {
            var cid, j, ref, ref1, results;
            results = [];
            for (cid = j = ref = cid_range[0], ref1 = cid_range[1]; (ref <= ref1 ? j <= ref1 : j >= ref1); cid = ref <= ref1 ? ++j : --j) {
              results.push((yield cid));
            }
            return results;
          };
        }
        ref = cids();
        //.......................................................................................................
        for (cid of ref) {
          if ((++line_count % 10000) === 0) {
            whisper('^ucdb@1009^', CND.format_number(line_count));
          }
          description = MKNCR.describe(cid);
          glyph = String.fromCodePoint(cid);
          style = (ref1 = mkts_glyph_styles[glyph]) != null ? ref1 : null;
          tags = ((ref2 = description != null ? description.tag : void 0) != null ? ref2 : []).sort();
          is_u9cjkidg = (indexOf.call(tags, 'assigned') >= 0) && (indexOf.call(tags, 'cjk') >= 0) && (indexOf.call(tags, 'ideograph') >= 0);
          tags = ';' + (tags.join(';')) + ';';
          csg = (ref3 = description != null ? description.csg : void 0) != null ? ref3 : null;
          rsg = (ref4 = description != null ? description.rsg : void 0) != null ? ref4 : null;
          fncr = (ref5 = description != null ? description.fncr : void 0) != null ? ref5 : null;
          sfncr = (ref6 = description != null ? description.sfncr : void 0) != null ? ref6 : null;
          ncr = (ref7 = description != null ? description.ncr : void 0) != null ? ref7 : null;
          xncr = (ref8 = description != null ? description.xncr : void 0) != null ? ref8 : null;
          iclabel = this._get_iclabel(me, cid, glyph, csg, rsg);
          // tex_glyph   = description?.tex?.codepoint ? null
          //.....................................................................................................
          // tex_block   = description?.tex?.block     ? null
          // fontnick    = @_fontnick_from_style_or_tex_block me, style, tex_block
          // unless fontnick?
          //   warn "^ucdb@1010^ missing fontnick for #{fncr} #{glyph}"
          //   continue
          // style       = jr @_cleanup_style me, style
          //.....................................................................................................
          row = {iclabel, glyph, cid, is_u9cjkidg, tags, csg, rsg, fncr, sfncr, ncr, xncr};
          data.push((me.db.create_table_main_middle(row)) + ',');
        }
      }
      //.........................................................................................................
      if ((last_idx = data.length - 1) > -1) {
        data[last_idx] = data[last_idx].replace(/,\s*$/g, '');
      }
      //.........................................................................................................
      sql = [...preamble, ...data, ';'].join('\n');
      me.db.$.execute(sql);
      me.line_count += line_count;
      me.db.create_main_indexes();
      resolve({line_count});
      return null;
    });
  };

  //===========================================================================================================
  // OUTLINES
  //-----------------------------------------------------------------------------------------------------------
  this.filepath_from_fontnick = function(me, fontnick) {
    return me.db.$.single_value(me.db.filepath_from_fontnick({fontnick}));
  };

  //-----------------------------------------------------------------------------------------------------------
  this.populate_table_outlines = function(me) {
    /* TAINT do not retrieve all glyphrows, iterate instead; call @_insert_into_table_outlines with
    single glyphrow */
    var XXX_includes, XXX_sql, fontnick, fontnicks, glyphrows, i, known_hashes, len, row;
    me.db.create_table_contents();
    me.db.create_table_outlines();
    known_hashes = new Set();
    XXX_includes = null;
    // XXX_includes      = 'jizurafourbmp'
    // XXX_includes      = 'kai'
    // XXX_includes      = """sunexta sourcehansansboldone sourcehansansboldsix sourcehansansboldthree"""
    // XXX_includes      = """sunexta thtshynptwo thtshynpone fandolheibold
    //   sourcehansansboldone
    //   sourcehansansboldtwo
    //   sourcehansansboldthree
    //   sourcehansansboldfour
    //   sourcehansansboldfive
    //   sourcehansansboldsix
    //   sourcehansansboldseven
    //   sourcehansansboldeight
    //   sourcehanserifheavyjapan
    //   sourcehanserifregularjapan
    //   sourcehanserifheavykorea
    //   sourcehanserifregularkorea
    //   sourcehanserifheavymainland
    //   sourcehanserifregularmainland
    //   sourcehanserifheavytaiwan
    //   sourcehanserifregulartaiwan"""
    // XXX_includes      = """sourcehanserifheavyjapan
    //   sourcehanserifregularjapan
    //   sourcehanserifheavykorea
    //   sourcehanserifregularkorea
    //   sourcehanserifheavymainland
    //   sourcehanserifregularmainland
    //   sourcehanserifheavytaiwan
    //   sourcehanserifregulartaiwan"""
    // XXX_includes      = 'thtshynpone'
    // XXX_includes      = 'thtshynptwo'
    if (XXX_includes != null) {
      XXX_includes = XXX_includes.split(/\s+/);
      XXX_includes = XXX_includes.filter(function(x) {
        return x !== '';
      });
    }
    XXX_sql = "select\n    *\n  from main\n  order by cid;";
    glyphrows = (function() {
      var ref, results;
      ref = me.db.$.query(XXX_sql);
      results = [];
      for (row of ref) {
        results.push(row);
      }
      return results;
    })();
    fontnicks = (function() {
      var ref, results;
      ref = me.db.walk_fontnick_table();
      results = [];
      for (row of ref) {
        results.push(row.fontnick);
      }
      return results;
    })();
    me._outline_count = 0;
    debug("^ucdb@43847^ XXX_includes:", jr(XXX_includes));
    for (i = 0, len = fontnicks.length; i < len; i++) {
      fontnick = fontnicks[i];
      if ((XXX_includes != null) && indexOf.call(XXX_includes/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */, fontnick) < 0) {
        continue;
      }
      info(`^ucdb@1011^ adding outlines for ${fontnick}`);
      this._insert_into_table_outlines(me, known_hashes, fontnick, glyphrows);
    }
    me.db.finalize_outlines();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._get_false_fallback_pathdata_from_SVGTTF_font = function(me, SVGTTF_font) {
    var cid, d, fontnick, ref, row;
    fontnick = SVGTTF_font.nick;
    row = (ref = me.db.$.first_row(me.db.false_fallback_probe_from_fontnick({fontnick}))) != null ? ref : null;
    if (row == null) {
      return null;
    }
    cid = row.probe.codePointAt(0);
    d = SVGTTF.glyph_and_pathdata_from_cid(SVGTTF_font.metrics, SVGTTF_font.otjsfont, cid);
    if (d == null) {
      return null;
    }
    return d.pathdata;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._insert_into_table_outlines = function(me, known_hashes, fontnick, glyphrows) {
    /* TAINT code repetition */
    /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
    /* NOTE to be called once for each font with all or some cid_ranges */
    var SVGTTF_font, XXX_advance_scale_factor, advance, batch_size, cid, cid_hex, content, content_data, d, duplicate_count, error, false_fallback_pathdata, glyph, hash, iclabel, line_count, outlines_data, progress_count, ref, ref1, y;
    outlines_data = [];
    content_data = [];
    line_count = 0;
    duplicate_count = 0;
    batch_size = 5000;
    progress_count = 100/* output progress whenever multiple of this number reached */
    // fragment insert_into_outlines_first(): insert into outlines ( iclabel, fontnick, pathdata ) values
    //.........................................................................................................
    /* TAINT refactor */
    SVGTTF_font = {};
    SVGTTF_font.nick = fontnick;
    SVGTTF_font.path = this.filepath_from_fontnick(me, fontnick);
    SVGTTF_font.metrics = SVGTTF.new_metrics();
    try {
      SVGTTF_font.otjsfont = SVGTTF.otjsfont_from_path(SVGTTF_font.path);
    } catch (error1) {
      error = error1;
      warn(`^ucdb@1012^ when trying to open font ${rpr(fontnick)}, an error occurred: ${error.message}`);
      return null;
    }
    // return null
    SVGTTF_font.advance_factor = SVGTTF_font.metrics.em_size / SVGTTF_font.otjsfont.unitsPerEm;
    XXX_advance_scale_factor = SVGTTF_font.advance_factor * ((ref = SVGTTF_font.metrics.global_glyph_scale) != null ? ref : 1);
    //.........................................................................................................
    false_fallback_pathdata = this._get_false_fallback_pathdata_from_SVGTTF_font(me, SVGTTF_font);
    if (false_fallback_pathdata != null) {
      warn('^ucdb@6374445^', "filtering codepoints with outlines that look like fallback (placeholder glyph)");
    }
    ref1 = cast.iterator(glyphrows);
    //.........................................................................................................
    for (y of ref1) {
      ({iclabel, cid, glyph} = y);
      d = SVGTTF.glyph_and_pathdata_from_cid(SVGTTF_font.metrics, SVGTTF_font.otjsfont, cid);
      if ((d == null) || ((false_fallback_pathdata != null) && (d.pathdata === false_fallback_pathdata))) {
        continue;
      }
      if ((me._outline_count++ % progress_count) === 0) {
        whisper('^ucdb@1013^', me._outline_count - 1);
      }
      advance = d.glyph.advanceWidth * XXX_advance_scale_factor;
      /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
      if ((isa.nan(advance)) || (advance === 0)) {
        cid_hex = '0x' + (cid.toString(16)).padStart(4, '0');
        warn(`^ucdb@3332^ illegal advance for ${SVGTTF_font.nick} ${cid_hex}: ${rpr(advance)}; setting to 1`);
        advance = 1;
      }
      content = jr({
        advance,
        pathdata: d.pathdata
      });
      hash = MIRAGE.sha1sum_from_text(content);
      //.......................................................................................................
      if (known_hashes.has(hash)) {
        duplicate_count++;
      } else {
        known_hashes.add(hash);
        content_data.push((me.db.insert_into_contents_middle({hash, content})) + ',');
      }
      //.......................................................................................................
      outlines_data.push((me.db.insert_into_outlines_middle({
        iclabel,
        fontnick,
        outline_json_hash: hash
      })) + ',');
      if ((outlines_data.length + content_data.length) >= batch_size) {
        line_count += this._flush_outlines(me, content_data, outlines_data);
      }
    }
    //.........................................................................................................
    line_count += this._flush_outlines(me, content_data, outlines_data);
    if (duplicate_count > 0) {
      urge(`^ucdb@3376^ found ${duplicate_count} duplicates for font ${fontnick}`);
    }
    return line_count;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._flush_outlines = function(me, content_data, outlines_data) {
    var line_count, remove_comma, store_data;
    /* TAINT code duplication, use ICQL method (TBW) */
    //.........................................................................................................
    remove_comma = function(data) {
      var last_idx;
      last_idx = data.length - 1;
      data[last_idx] = data[last_idx].replace(/,\s*$/g, '');
      return null;
    };
    //.........................................................................................................
    store_data = function(name, data) {
      var sql;
      if (data.length === 0) {
        return;
      }
      remove_comma(data);
      sql = me.db[name]() + '\n' + (data.join('\n')) + ';';
      me.db.$.execute(sql);
      data.length = 0;
      return null;
    };
    //.........................................................................................................
    line_count = content_data.length + outlines_data.length;
    store_data('insert_into_contents_first', content_data);
    store_data('insert_into_outlines_first', outlines_data);
    me.line_count += line_count;
    return line_count;
  };

  //===========================================================================================================
  // DB CREATION
  //-----------------------------------------------------------------------------------------------------------
  this.new_ucdb = function(settings = null) {
    var R, defaults;
    defaults = {
      db_path: project_abspath('./db/ucdb.db'),
      icql_path: project_abspath('./db/ucdb.icql')
    };
    //.........................................................................................................
    settings = {...defaults, ...settings};
    validate.ucdb_settings(settings);
    //.........................................................................................................
    R = {};
    R.db = (require('./db')).new_db(settings);
    R.dbr = R.db;
    R.dbw = (require('./db')).new_db(settings);
    R.line_count = 0;
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.create = function(settings = null) {
    return new Promise(async(resolve, reject) => {
      var me;
      me = this.new_ucdb(settings);
      urge('ucdb/create@1/4');
      await this.read_configuration(me);
      urge('ucdb/create@2/4');
      await this.populate_table_fontnicks(me);
      urge('ucdb/create@3/4');
      await this.populate_table_main(me);
      urge('ucdb/create@4/4');
      await this.compile_configurations(me);
      urge('ucdb/create@5/4');
      await this.populate_table_outlines(me);
      urge('ucdb/create@6/4');
      // me.db.create_view_main_with_deltas_etc()
      return resolve(me);
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.write_ucdb = async function(settings = null) {
    var dt, dts, error, f, t0, t1, ucdb;
    t0 = Date.now();
    try {
      ucdb = (await this.create(settings));
    } catch (error1) {
      error = error1;
      warn(error.message);
      process.exit(1);
    }
    t1 = Date.now();
    dt = t1 - t0;
    dts = (dt / 1000).toFixed(3);
    f = (ucdb.line_count / dt * 1000).toFixed(3);
    help(`^ucdb@1014^ wrote ${ucdb.line_count} records in ${dts} s (${f} Hz)`);
    return null;
  };

  // count = 0
// for row from ucdb.db.read_codepoint_records()
//   count++
//   break if count > 5
//   info 'µ33211', jr row
// help 'ok'

}).call(this);

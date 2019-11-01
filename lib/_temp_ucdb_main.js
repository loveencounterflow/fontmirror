(function() {
  'use strict';
  var CND, FS, FSP, PATH, _drop_extension, alert, assign, badge, cast, cwd_abspath, cwd_relpath, debug, declare, echo, help, here_abspath, info, isa, jr, last_of, log, project_abspath, rpr, size_of, type_of, urge, validate, walk_cids_in_cid_range, warn, whisper,
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
  this.populate_table_outlines = function(me) {
    /* TAINT do not retrieve all glyphrows, iterate instead; call @_insert_into_table_outlines with
    single glyphrow */
    var XXX_sql, fontnick, fontnicks, glyphrows, i, known_hashes, len, row;
    me.db.create_table_contents();
    me.db.create_table_outlines();
    known_hashes = new Set();
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
      if ((typeof XXX_includes !== "undefined" && XXX_includes !== null) && indexOf.call(XXX_includes/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */, fontnick) < 0) {
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
    var SVGTTF_font, XXX_advance_scale_factor, advance, batch_size, cid, cid_hex, content, content_data, d, duplicate_count, error, false_fallback_pathdata, glyph, hash, iclabel, line_count, outlines_data, progress_count, ref, ref1, x;
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
    for (x of ref1) {
      ({iclabel, cid, glyph} = x);
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

  /*
#-----------------------------------------------------------------------------------------------------------
@write_ucdb = ( settings = null ) ->
t0      = Date.now()
try
  ucdb  = await @create settings
catch error
  warn error.message
  process.exit 1
t1      = Date.now()
dt      = t1 - t0
dts     = ( dt / 1000 ).toFixed 3
f       = ( ucdb.line_count / dt * 1000 ).toFixed 3
help "^ucdb@1014^ wrote #{ucdb.line_count} records in #{dts} s (#{f} Hz)"
return null
 */

}).call(this);

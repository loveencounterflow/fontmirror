(function() {
  /* TAINT pending code cleanup */
  'use strict';
  var CND, FS, OT, PATH, alert, badge, debug, declare, echo, first_of, help, info, isa, jr, last_of, log, rpr, size_of, spawn_sync, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr.bind(CND);

  badge = 'FONTMIRROR/_TEMP_SVGTTF';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  urge = CND.get_logger('urge', badge);

  whisper = CND.get_logger('whisper', badge);

  help = CND.get_logger('help', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  FS = require('fs');

  PATH = require('path');

  // exec                      = ( require 'util' ).promisify ( require 'child_process' ).exec
  spawn_sync = (require('child_process')).spawnSync;

  // CP                        = require 'child_process'
  jr = JSON.stringify;

  //...........................................................................................................
  ({isa, validate, declare, first_of, last_of, size_of, type_of} = require('./types'));

  //...........................................................................................................
  require('./exception-handler');

  OT = require('opentype.js');

  // #-----------------------------------------------------------------------------------------------------------
  // @_find_ideographic_advance_factor = ( otjsfont ) ->
  //   ### In some fonts, the advance width of CJK ideographs differs from the font design size; this is
  //   especially true for fonts from the `cwTeXQ` series. This routine probes the font with a number of CJK
  //   codepoints and returns the ratio of the font design size and the advance width of the first CJK glyph.
  //   The function always returns 1 for fonts that do not contain CJK characters. ###
  //   probe = Array.from '一丁乘㐀㑔㙜𠀀𠀁𠀈𪜵𪝘𪜲𫝀𫝄𫠢𫡄𫡦𬺰𬻂'
  //   for chr in probe
  //     cid = chr.codePointAt 0
  //     continue unless ( glyph = @glyph_from_cid otjsfont, cid )?
  //     return otjsfont.unitsPerEm / glyph.advanceWidth
  //   return 1
  // #-----------------------------------------------------------------------------------------------------------
  // @save_otjsfont = ( path, otjsfont ) ->
  //   # FS.writeFileSync path, buffer = otjsfont.toBuffer() # deprecated
  //   # buffer = Buffer.from otjsfont.toArrayBuffer()
  //   buffer = Buffer.from @_otjsfont_toArrayBuffer otjsfont
  //   FS.writeFileSync path, buffer
  //   return buffer.length

  // @_otjsfont_toArrayBuffer = ( otjsfont ) ->
  //   sfntTable = otjsfont.toTables();
  //   bytes     = sfntTable.encode();
  //   buffer    = new ArrayBuffer(bytes.length);
  //   intArray  = new Uint8Array(buffer);
  //   ```
  //   for (let i = 0; i < bytes.length; i++) {
  //       intArray[i] = bytes[i];
  //   }
  //   ```
  //   return buffer;
  // #-----------------------------------------------------------------------------------------------------------
  // @list_glyphs_in_otjsfont = ( otjsfont ) ->
  //   R = new Set()
  //   #.........................................................................................................
  //   for idx, glyph of otjsfont.glyphs.glyphs
  //     # if glyph.name in [ '.notdef', ] or ( not glyph.unicode? ) or ( glyph.unicode < 0x20 )
  //     if ( not glyph.unicode? ) or ( glyph.unicode < 0x20 )
  //       warn "skipping glyph #{rpr glyph.name}"
  //       continue
  //     unicodes  = glyph.unicodes
  //     unicodes  = [ glyph.unicode, ] if ( not unicodes? ) or ( unicodes.length is 0 )
  //     # debug rpr glyph
  //     # debug rpr unicodes
  //     for cid in unicodes
  //       # debug rpr cid
  //       R.add String.fromCodePoint cid
  //   #.........................................................................................................
  //   return [ R... ].sort()
  // #-----------------------------------------------------------------------------------------------------------
  // @otjspath_from_pathdata = ( pathdata ) ->
  //   SvgPath                   = @_SvgPath = require 'svgpath'
  //   validate.nonempty_text pathdata
  //   svg_path  = new SvgPath pathdata
  //   R         = new OT.Path()
  //   d = R.commands
  //   for [ type, tail..., ] in svg_path.segments
  //     # debug '^svgttf#3342', [ type, tail..., ]
  //     ### TAINT consider to use API (moveTo, lineTo etc) ###
  //     switch type
  //       when 'M', 'L'
  //         [ x, y, ] = tail
  //         d.push { type, x, y, }
  //       when 'C'
  //         [ x1, y1, x2, y2, x, y, ] = tail
  //         d.push { type, x1, y1, x2, y2, x, y, }
  //       when 'Q'
  //         [ x1, y1, x, y, ] = tail
  //         d.push { type, x1, y1, x, y, }
  //       when 'Z'
  //         d.push { type, }
  //       else throw new Error "^svgttf#2231 unknown SVG path element #{rpr type}"
  //   return R
  // #-----------------------------------------------------------------------------------------------------------
  // @new_otjs_font = ( me, name, glyphs ) ->
  //   validate.nonempty_text name
  //   return new OT.Font {
  //     familyName:   name,
  //     styleName:    'Medium',
  //     unitsPerEm:   me.em_size,
  //     ascender:     me.ascender,
  //     descender:    me.descender,
  //     glyphs:       glyphs }

  //===========================================================================================================
  // METRICS
  //-----------------------------------------------------------------------------------------------------------
  this.new_metrics = function() {
    var R;
    R = {
      em_size: 4096/* a.k.a. design size, grid size */,
      // em_size:          1000  ### a.k.a. design size, grid size ###
      font_size: 360/* in pixels */,
      scale_factor: null
    };
    // ### TAINT magic number
    // for whatever reason, we have to calculate advanceWidth with an additional tracking factor:
    // advanceWidth = glyph.advanceWidth * metrics.scale_factor * metrics.tracking_factor ###
    // tracking_factor:  256 / 182
    R.scale_factor = R.em_size / R.font_size;
    R.path_precision = 0;
    // R.global_glyph_scale  = 50 / 48.5 ### TAINT value must come from configuration ###
    R.global_glyph_scale = 256 / 248/* TAINT value must come from configuration */
    // R.global_glyph_scale  = 1 ### TAINT value must come from configuration ###
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.svg_path_from_cid = function(otjsfont, cid) {
    var cid_hex, glyph, pathdata;
    pathdata = this.svg_pathdata_from_cid(otjsfont, cid);
    glyph = String.fromCodePoint(cid);
    cid_hex = `0x${cid.toString(16)}`;
    return `<!-- ${cid_hex} ${glyph} --><path d='${pathdata}'/>`;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._otjsglyph_from_glyph = function(otjsfont, glyph) {
    var R;
    R = otjsfont.charToGlyph(glyph);
    if (R.unicode != null) {
      return R;
    } else {
      return null;
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  this._quickscale = function(path_obj, scale_x, scale_y = null) {
    var command, i, key, len, ref, value;
    if (scale_y == null) {
      scale_y = scale_x;
    }
    ref = path_obj.commands;
    for (i = 0, len = ref.length; i < len; i++) {
      command = ref[i];
      for (key in command) {
        value = command[key];
        switch (key) {
          case 'x':
          case 'x1':
          case 'x2':
            command[key] *= scale_x;
            break;
          case 'y':
          case 'y1':
          case 'y2':
            command[key] *= scale_y;
        }
      }
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._get_otjsglyph_and_pathdata = function(me, SVGTTF_font, cid, glyph) {
    var global_glyph_scale, metrics, otjsglyph, path_obj, pathdata, ref, scale_factor;
    // validate.positive_integer cid
    ({metrics} = SVGTTF_font);
    otjsglyph = this._otjsglyph_from_glyph(SVGTTF_font.otjsfont, glyph);
    if (otjsglyph == null) {
      // debug '^svgttf/_get_otjsglyph_and_pathdata@277262', otjsglyph?.name
      return null;
    }
    // return null if ( not otjsglyph? ) or ( otjsglyph.name is '.notdef' )
    path_obj = otjsglyph.getPath(0, 0, metrics.font_size);
    if (path_obj.commands.length === 0) {
      return null;
    }
    global_glyph_scale = (ref = metrics.global_glyph_scale) != null ? ref : 1;
    scale_factor = metrics.scale_factor * global_glyph_scale;
    this._quickscale(path_obj, scale_factor, -scale_factor);
    pathdata = path_obj.toPathData(metrics.path_precision);
    return {otjsglyph, pathdata};
  };

  //-----------------------------------------------------------------------------------------------------------
  this._open_font = function(path, relpath) {
    var error;
    try {
      return OT.loadSync(path);
    } catch (error1) {
      error = error1;
      warn(`^fontmirror@1012^ when trying to open font ${rpr(relpath)}, an error occurred: ${error.message}`);
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.walk_font_outlines = function*(me, source) {
    /* Yield one commented line to show the path to the file cached; this also makes sure a file will exist
    in the cache even if no outlines were obtained so we can avoid re-openening the font whenever cache
    is amended without `force_overwrite`: */
    /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
    var SVGTTF_font, XXX_advance_scale_factor, advance, cid, cid_hex, cids, d, description, fallback_pathdata, fontnick, glyph, i, len, metrics, otjsfont, path, pathdata, pathdata_json, progress_count, ref, relpath;
    ({fontnick, path, relpath} = source);
    description = {
      key: '^new-font',
      fontnick,
      path
    };
    yield `${jr(description)}\n`;
    if ((otjsfont = this._open_font(path, source.relpath)) == null) {
      return;
    }
    progress_count = 100/* output progress whenever multiple of this number reached */
    SVGTTF_font = {};
    SVGTTF_font.otjsfont = otjsfont;
    SVGTTF_font.path = path;
    SVGTTF_font.relpath = relpath;
    SVGTTF_font.metrics = metrics = this.new_metrics();
    SVGTTF_font.advance_factor = SVGTTF_font.metrics.em_size / SVGTTF_font.otjsfont.unitsPerEm;
    XXX_advance_scale_factor = SVGTTF_font.advance_factor * ((ref = SVGTTF_font.metrics.global_glyph_scale) != null ? ref : 1);
    // #.........................................................................................................
    fallback_pathdata = null;
    // false_fallback_pathdata = @_get_false_fallback_pathdata_from_SVGTTF_font me, SVGTTF_font
    //.........................................................................................................
    /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
    cids = [];
    // cids = [ cids..., [ 0x4e00 .. 0x4e03 ]..., ]
    // cids = [ cids..., 0x9fff, ]
    // cids = [ cids..., 0xfffd, 0xfffe, 0xffff, ]
    cids = [
      ...cids,
      ...(function() {
        var results = [];
        for (var i = 0x01; i <= 255; i++){ results.push(i); }
        return results;
      }).apply(this)
    ];
    cids = [
      ...cids,
      0x004e00 // A:uc0---:004e00:一
    ];
    cids = [
      ...cids,
      0x004e01 // A:uc0---:004e01:丁
    ];
    cids = [
      ...cids,
      0x004e02 // A:uc0---:004e02:丂
    ];
    cids = [
      ...cids,
      0x004e03 // A:uc0---:004e03:七
    ];
    cids = [
      ...cids,
      0x004e04 // A:uc0---:004e04:丄
    ];
    cids = [
      ...cids,
      0x004e05 // A:uc0---:004e05:丅
    ];
    cids = [
      ...cids,
      0x004e07 // A:uc0---:004e07:万
    ];
    cids = [
      ...cids,
      0x004df0 // A:ucyijg:004df0:䷰
    ];
    cids = [
      ...cids,
      0x004df1 // A:ucyijg:004df1:䷱
    ];
    cids = [
      ...cids,
      0x004df2 // A:ucyijg:004df2:䷲
    ];
    cids = [
      ...cids,
      0x00243f // A:u-----:00243f:
    ];
    cids = [
      ...cids,
      0x00245f // A:u-----:00245f:
    ];
    cids = [
      ...cids,
      0x00fdd0 // A:u-----:00fdd0:
    ];
    cids = [
      ...cids,
      0x00fdd1 // A:u-----:00fdd1:
    ];
    cids = [
      ...cids,
      0x00fdd2 // A:u-----:00fdd2:
    ];
    cids = [
      ...cids,
      0x00fffd // A:u-----:00fffd:�
    ];
    cids = [
      ...cids,
      0x00fffe // A:u-----:00fffe:
    ];
    cids = [
      ...cids,
      0x00ffff // A:u-----:00ffff:
    ];
    cids = [
      ...cids,
      0x030000 // A:u-----:030000:
    ];
    cids = [
      ...cids,
      0x10fffe // A:u-----:10fffe:
    ];
    cids = [
      ...cids,
      0x10ffff // A:u-----:10ffff:
    ];
    cids = [
      ...cids,
      0x009fff // A:uc0---:009fff:
    ];
    cids = [...(new Set(cids))];
/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
//.........................................................................................................
    for (i = 0, len = cids.length; i < len; i++) {
      cid = cids[i];
      cid_hex = '0x' + (cid.toString(16)).padStart(4, '0');
      glyph = String.fromCodePoint(cid);
      d = this._get_otjsglyph_and_pathdata(me, SVGTTF_font, cid, glyph);
      if (d == null) {
        continue;
      }
      if (d.pathdata === fallback_pathdata) {
        continue;
      }
      if ((me.outline_count++ % progress_count) === 0) {
        whisper('^ucdb@1013^', me.outline_count - 1);
      }
      pathdata = d.pathdata;
      advance = (d.otjsglyph.advanceWidth * XXX_advance_scale_factor).toFixed(metrics.path_precision);
      /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
      if ((isa.nan(advance)) || (advance === 0)) {
        /* TAINT code repetition */
        warn(`^ucdb@3332^ illegal advance for ${SVGTTF_font.nick} ${cid_hex}: ${rpr(advance)}; setting to 1`);
        advance = 1;
      }
      pathdata_json = jr(pathdata);
      yield `${cid_hex},${glyph},${advance},${pathdata_json}\n`;
    }
    //.........................................................................................................
    return null;
  };

}).call(this);

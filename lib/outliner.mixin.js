(function() {
  'use strict';
  var $, $async, $drain, $show, $watch, CND, FS, SP, alert, badge, cast, debug, echo, help, info, isa, jr, log, rpr, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'FONTMIRROR/OUTLINER';

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

  //...........................................................................................................
  ({isa, validate, cast, type_of} = require('./types'));

  //...........................................................................................................
  SP = require('steampipes');

  ({$, $async, $watch, $show, $drain} = SP.export());

  ({jr} = CND);

  //-----------------------------------------------------------------------------------------------------------
  this._XXXXXXXXXXXXX_get_fallback_pathdata = function(me, SVGTTF_font) {
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
  this._write_font_outlines = function(me, source, target_path) {
    return new Promise((resolve, reject) => {
      var line_count, pipeline;
      if (FS.existsSync(target_path)) {
        /* TAINT decide whether to as sync or async writing, benchmark */
        FS.unlinkSync(target_path);
      }
      source = this.walk_font_outlines(me, source);
      line_count = 0;
      pipeline = [];
      //.........................................................................................................
      pipeline.push(source);
      pipeline.push($watch(function(d) {
        return line_count++;
      }));
      // pipeline.push SP.tee_write_to_file path
      pipeline.push(SP.tee_write_to_file_sync(target_path));
      pipeline.push($drain(() => {
        return resolve(line_count);
      }));
      SP.pull(...pipeline);
      return null;
    });
  };

}).call(this);

//# sourceMappingURL=outliner.mixin.js.map
(function() {
  'use strict';
  var CND, Failure, alert, badge, debug, defaults, echo, help, info, isa, log, rpr, type_of, types, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'FONTMIRROR/TEXFONTNAMESAKE';

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
  types = require('./types');

  ({isa, validate, type_of, defaults, Failure} = types);

  //-----------------------------------------------------------------------------------------------------------
  this.partitioner = 'ː';

  this.latindigitnames = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine'
  };

  //-----------------------------------------------------------------------------------------------------------
  this.escape = function(text) {
    /* replace Latin digits by partitioner plus name: */
    var R;
    /* See https://github.com/latex3/unicode-data; thx to https://tex.stackexchange.com/a/514731/128255 */
    validate.nonempty_text(text);
    R = text;
    R = R.replace(/[0-9]/gu, ($0) => {
      return this.partitioner + this.latindigitnames[$0];
    });
    /* insert partitioner between sequences of lower and upper case (aB -> aːB) */
    R = R.replace(/(\p{Ll})(\p{Lu})/gu, (_, $1, $2) => {
      return $1 + this.partitioner + $2;
    });
    /* replace each code point that is not a Unicode 'Letter' or 'Mark' with partitioner: */
    R = R.replace(/[^\p{Letter}\p{Mark}]/gu, this.partitioner);
    /* turn the result into lower case: */
    return R.toLowerCase();
  };

  //###########################################################################################################
  if (require.main === module) {
    (() => {
      var i, j, len, len1, name, path, paths, results, text, texts;
      texts = [
        '辛亥革命',
        '一二三',
        '¥ÄÖå',
        '　、。〃〄々〇〈〉',
        '、。〃〄々〇〈〉',
        // ''
        'Ⅶ',
        'µ¶ƐⅦⓇⓈ',
        '书法家超明体.ttf',
        'Aleo-Bold.otf',
        'Aleo-BoldItalic.otf',
        'unifont_upper-12.1.03.ttf',
        'Sun-ExtB.ttf',
        'SUN-EXTB.TTF',
        'legalnameₘ'
      ];
      paths = (require('glob')).sync('/home/flow/jzr/benchmarks/assets/fontmirror/fonts/*/**');
      for (i = 0, len = paths.length; i < len; i++) {
        path = paths[i];
        name = (require('path')).basename(path);
        debug('^89973^', CND.lime(rpr(name)), CND.white(rpr(this.escape(name))));
      }
      results = [];
      for (j = 0, len1 = texts.length; j < len1; j++) {
        text = texts[j];
        results.push(debug('^89973^', CND.lime(rpr(text)), CND.white(rpr(this.escape(text)))));
      }
      return results;
    })();
  }

  // for cid in [ 0x1ff .. 0x4ff ]
//   glyph = String.fromCodePoint cid
//   continue unless ( glyph.match ///^[\p{Letter}\p{Mark}]$///gu )?
//   debug '^3473^', ( cid.toString 16 ), ( rpr glyph )

}).call(this);

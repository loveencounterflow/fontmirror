(function() {
  'use strict';
  /*
  tags =
    cjk:    new Set()
    kai:    new Set()
    medium: new Set()
    heavy:  new Set()
    ming:   new Set()

   * thːtshynːpːzeroːttf = new Set() # +ming,+medium
   * thːtshynːpːzeroːttf.name = 'thːtshynːpːzeroːttf'
   * thːtshynːpːzeroːttf.add 'cjk'
   * thːtshynːpːzeroːttf.add 'ming'
   * thːtshynːpːzeroːttf.add 'medium'

   * 书法家超明体ːttf     = new Set() # +ming,+heavy
   * 书法家超明体ːttf.name = '书法家超明体ːttf'
   * 书法家超明体ːttf.add 'cjk'
   * 书法家超明体ːttf.add 'ming'
   * 书法家超明体ːttf.add 'heavy'

  tags.cjk.add      'thːtshynːpːzeroːttf'
  tags.ming.add      'thːtshynːpːzeroːttf'
  tags.medium.add    'thːtshynːpːzeroːttf'
  tags.cjk.add      '书法家超明体ːttf'
  tags.ming.add      '书法家超明体ːttf'
  tags.heavy.add    '书法家超明体ːttf'

  info tags
  help thːtshynːpːzeroːttf
  urge 书法家超明体ːttf
   */
  var CND, R, alert, badge, cherrypick, combo, debug, fontnick, fontnicks, fonts, help, i, idx, info, j, k, key, keys, l, len, len1, log, ref, ref1, rpr, tag, tags, tagset, urge, warn, whisper,
    indexOf = [].indexOf;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr.bind(CND);

  badge = 'RECURSIVE-TAGGING';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  whisper = CND.get_logger('whisper', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  tags = {
    cjk: new Set(),
    kai: new Set(),
    medium: new Set(),
    heavy: new Set(),
    ming: new Set()
  };

  fonts = {
    thːtshynːpːzeroːttf: ['+cjk', '+ming', '+medium', '+@th-thsyn'],
    书法家超明体ːttf: ['+cjk', '+ming', '+heavy'],
    sunːextaːttf: ['+cjk', '+ming', '+medium', '+@sun'],
    unifrakturːcookːlightːttf: ['+fraktur', '+light', '+@unifraktur', '+@cook'],
    unifrakturːcookːttf: ['+fraktur', '+medium', '+@unifraktur', '+@cook'],
    unifrakturːmaguntiaːttf: ['+fraktur', '+medium', '+@unifraktur', '+@maguntia'],
    kangːxiːziːdian: ['+cjk', '+kangxiziti'],
    wenːyueːguːdianːmingːchaoːti: ['+cjk', '+ming', '+heavy'],
    sourceːcodeːproːboldːotf: ['+linear', '+heavy']
  };

  // info tags
  // urge fonts
  R = {};

  cherrypick = ['+heavy', '+linear', '+@unifraktur', '+@sun'];

  for (fontnick in fonts) {
    tagset = fonts[fontnick];
    for (idx = i = 0, ref = tagset.length; (0 <= ref ? i < ref : i > ref); idx = 0 <= ref ? ++i : --i) {
      combo = tagset.slice(0, +idx + 1 || 9e9).join('');
      (R[combo] != null ? R[combo] : R[combo] = []).push(fontnick);
    }
    for (idx = j = 0, len = tagset.length; j < len; idx = ++j) {
      tag = tagset[idx];
      if (idx === 0) {
        continue;
      }
      if (indexOf.call(cherrypick, tag) < 0) {
        continue;
      }
      (R[tag] != null ? R[tag] : R[tag] = []).push(fontnick);
    }
  }

  keys = (Object.keys(R)).sort();

  for (k = 0, len1 = keys.length; k < len1; k++) {
    key = keys[k];
    fontnicks = R[key];
    urge(key.padEnd(50), CND.white(fontnicks[0]));
    for (idx = l = 1, ref1 = fontnicks.length; l < ref1; idx = l += +1) {
      urge(' '.padEnd(50), CND.white(fontnicks[idx]));
    }
  }

}).call(this);

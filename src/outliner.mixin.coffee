
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR/OUTLINER'
log                       = CND.get_logger 'plain',     badge
info                      = CND.get_logger 'info',      badge
whisper                   = CND.get_logger 'whisper',   badge
alert                     = CND.get_logger 'alert',     badge
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
echo                      = CND.echo.bind CND
#...........................................................................................................
FS                        = require 'fs'
#...........................................................................................................
{ isa
  validate
  cast
  type_of }               = require './types'
#...........................................................................................................
SP                        = require 'steampipes'
{ $
  $async
  $watch
  $show
  $drain }                = SP.export()
{ jr, }                   = CND


#-----------------------------------------------------------------------------------------------------------
@_XXXXXXXXXXXXX_get_fallback_pathdata = ( me, SVGTTF_font ) ->
  fontnick  = SVGTTF_font.nick
  row       = ( me.db.$.first_row me.db.false_fallback_probe_from_fontnick { fontnick, } ) ? null
  return null unless row?
  cid       = row.probe.codePointAt 0
  d         = SVGTTF.glyph_and_pathdata_from_cid SVGTTF_font.metrics, SVGTTF_font.otjsfont, cid
  return null unless d?
  return d.pathdata

#-----------------------------------------------------------------------------------------------------------
@_write_font_outlines = ( me, source, target_path ) -> new Promise ( resolve, reject ) =>
  ### TAINT decide whether to as sync or async writing, benchmark ###
  FS.unlinkSync target_path if FS.existsSync target_path
  source      = @walk_font_outlines me, source
  line_count  = 0
  pipeline    = []
  #.........................................................................................................
  pipeline.push source
  pipeline.push $watch ( d ) -> line_count++
  # pipeline.push SP.tee_write_to_file path
  pipeline.push SP.tee_write_to_file_sync target_path
  pipeline.push $drain =>
    resolve line_count
  SP.pull pipeline...
  return null







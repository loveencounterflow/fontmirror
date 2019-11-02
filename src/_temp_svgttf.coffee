

'use strict'

############################################################################################################
CND                       = require 'cnd'
CHR                       = require 'coffeenode-chr'
rpr                       = CND.rpr.bind CND
badge                     = 'SVGTTF/MAIN'
log                       = CND.get_logger 'plain',   badge
info                      = CND.get_logger 'info',    badge
alert                     = CND.get_logger 'alert',   badge
debug                     = CND.get_logger 'debug',   badge
warn                      = CND.get_logger 'warn',    badge
urge                      = CND.get_logger 'urge',    badge
whisper                   = CND.get_logger 'whisper', badge
help                      = CND.get_logger 'help',    badge
echo                      = CND.echo.bind CND
#...........................................................................................................
FS                        = require 'fs'
PATH                      = require 'path'
# exec                      = ( require 'util' ).promisify ( require 'child_process' ).exec
spawn_sync                = ( require 'child_process' ).spawnSync
# CP                        = require 'child_process'
jr                        = JSON.stringify
#...........................................................................................................
@types                    = require './types'
{ isa
  validate
  declare
  first_of
  last_of
  size_of
  type_of }               = @types
#...........................................................................................................
require                   './exception-handler'
#...........................................................................................................
OT                        = @_OT      = require 'opentype.js'
SvgPath                   = @_SvgPath = require 'svgpath'
# DUMBSVGPATH               = require './experiments/dumb-svg-parser'
path_precision            = 3


#===========================================================================================================
# METRICS
#-----------------------------------------------------------------------------------------------------------
@new_metrics = ->
  R =
    em_size:          4096  ### a.k.a. design size, grid size ###
    ascender:         null,
    descender:        null,
    font_size:        360   ### in pixels ###
    scale_factor:     null
    # ### TAINT magic number
    # for whatever reason, we have to calculate advanceWidth with an additional tracking factor:
    # advanceWidth = glyph.advanceWidth * metrics.scale_factor * metrics.tracking_factor ###
    # tracking_factor:  256 / 182
  R.scale_factor        =  R.em_size / R.font_size
  R.ascender            =  R.em_size / ( 256 / 220 )
  R.descender           = -R.em_size / 5
  # R.global_glyph_scale  = 50 / 48.5 ### TAINT value must come from configuration ###
  R.global_glyph_scale  = 256 / 248 ### TAINT value must come from configuration ###
  # R.global_glyph_scale  = 1 ### TAINT value must come from configuration ###
  return R

#-----------------------------------------------------------------------------------------------------------
@new_otjs_font = ( me, name, glyphs ) ->
  validate.nonempty_text name
  return new OT.Font {
    familyName:   name,
    styleName:    'Medium',
    unitsPerEm:   me.em_size,
    ascender:     me.ascender,
    descender:    me.descender,
    glyphs:       glyphs }

# #-----------------------------------------------------------------------------------------------------------
# @_find_ideographic_advance_factor = ( otjsfont ) ->
#   ### In some fonts, the advance width of CJK ideographs differs from the font design size; this is
#   especially true for fonts from the `cwTeXQ` series. This routine probes the font with a number of CJK
#   codepoints and returns the ratio of the font design size and the advance width of the first CJK glyph.
#   The function always returns 1 for fonts that do not contain CJK characters. ###
#   probe = Array.from '一丁乘㐀㑔㙜𠀀𠀁𠀈𪜵𪝘𪜲𫝀𫝄𫠢𫡄𫡦𬺰𬻂'
#   for chr in probe
#     cid = chr.codePointAt 0
#     continue unless ( glyph = @glyph_from_cid otjsfont, cid )?
#     return otjsfont.unitsPerEm / glyph.advanceWidth
#   return 1



#===========================================================================================================
# OPENTYPE.JS
#-----------------------------------------------------------------------------------------------------------
@otjsfont_from_path = ( path ) -> OT.loadSync path

# #-----------------------------------------------------------------------------------------------------------
# @save_otjsfont = ( path, otjsfont ) ->
#   # FS.writeFileSync path, buffer = otjsfont.toBuffer() # deprecated
#   # buffer = Buffer.from otjsfont.toArrayBuffer()
#   buffer = Buffer.from @_otjsfont_toArrayBuffer otjsfont
#   FS.writeFileSync path, buffer
#   return buffer.length

# @_otjsfont_toArrayBuffer = ( otjsfont ) ->
#   sfntTable = otjsfont.toTables();
#   bytes     = sfntTable.encode();
#   buffer    = new ArrayBuffer(bytes.length);
#   intArray  = new Uint8Array(buffer);
#   ```
#   for (let i = 0; i < bytes.length; i++) {
#       intArray[i] = bytes[i];
#   }
#   ```
#   return buffer;

###
#-----------------------------------------------------------------------------------------------------------
@list_glyphs_in_otjsfont = ( otjsfont ) ->
  R = new Set()
  #.........................................................................................................
  for idx, glyph of otjsfont.glyphs.glyphs
    # if glyph.name in [ '.notdef', ] or ( not glyph.unicode? ) or ( glyph.unicode < 0x20 )
    if ( not glyph.unicode? ) or ( glyph.unicode < 0x20 )
      warn "skipping glyph #{rpr glyph.name}"
      continue
    unicodes  = glyph.unicodes
    unicodes  = [ glyph.unicode, ] if ( not unicodes? ) or ( unicodes.length is 0 )
    # debug rpr glyph
    # debug rpr unicodes
    for cid in unicodes
      # debug rpr cid
      R.add String.fromCodePoint cid
  #.........................................................................................................
  return [ R... ].sort()
###

#-----------------------------------------------------------------------------------------------------------
@svg_path_from_cid = ( otjsfont, cid ) ->
  pathdata    = @svg_pathdata_from_cid otjsfont, cid
  glyph       = String.fromCodePoint cid
  cid_hex     = "0x#{cid.toString 16}"
  return "<!-- #{cid_hex} #{glyph} --><path d='#{pathdata}'/>"

#-----------------------------------------------------------------------------------------------------------
### TAINT rename to something like `otjsglyph_from_...()` ###
@glyph_from_cid = ( otjsfont, cid ) ->
  validate.positive_integer cid
  return @glyph_from_glyph otjsfont, String.fromCodePoint cid

#-----------------------------------------------------------------------------------------------------------
### TAINT rename to something like `otjsglyph_from_...()` ###
@glyph_from_glyph = ( otjsfont, glyph ) ->
  ### TAINT validate is character ###
  # validate.positive_integer cid
  R = otjsfont.charToGlyph glyph
  return if R.unicode? then R else null

#-----------------------------------------------------------------------------------------------------------
@_quickscale = ( path_obj, scale_x, scale_y = null ) ->
  scale_y ?= scale_x
  for command in path_obj.commands
    for key, value of command
      switch key
        when 'x', 'x1', 'x2' then command[ key ] *= scale_x
        when 'y', 'y1', 'y2' then command[ key ] *= scale_y
  return null

#-----------------------------------------------------------------------------------------------------------
@glyph_and_pathdata_from_cid = ( me, otjsfont, cid ) ->
  validate.positive_integer cid
  fglyph              = @glyph_from_cid otjsfont, cid
  # debug '^svgttf/glyph_and_pathdata_from_cid@277262', fglyph?.name
  return null if ( not fglyph? )
  # return null if ( not fglyph? ) or ( fglyph.name is '.notdef' )
  path_obj            = fglyph.getPath 0, 0, me.font_size
  return null if path_obj.commands.length is 0
  global_glyph_scale  = me.global_glyph_scale ? 1
  scale_factor        = me.scale_factor * global_glyph_scale
  @_quickscale path_obj, scale_factor, -scale_factor
  pathdata = path_obj.toPathData path_precision
  return { glyph: fglyph, pathdata, }

#-----------------------------------------------------------------------------------------------------------
@otjspath_from_pathdata = ( pathdata ) ->
  validate.nonempty_text pathdata
  svg_path  = new SvgPath pathdata
  R         = new OT.Path()
  d = R.commands
  for [ type, tail..., ] in svg_path.segments
    # debug '^svgttf#3342', [ type, tail..., ]
    ### TAINT consider to use API (moveTo, lineTo etc) ###
    switch type
      when 'M', 'L'
        [ x, y, ] = tail
        d.push { type, x, y, }
      when 'C'
        [ x1, y1, x2, y2, x, y, ] = tail
        d.push { type, x1, y1, x2, y2, x, y, }
      when 'Q'
        [ x1, y1, x, y, ] = tail
        d.push { type, x1, y1, x, y, }
      when 'Z'
        d.push { type, }
      else throw new Error "^svgttf#2231 unknown SVG path element #{rpr type}"
  return R


#-----------------------------------------------------------------------------------------------------------
@_insert_into_table_outlines = ( me, known_hashes, fontnick, glyphrows ) ->
  ### NOTE to be called once for each font with all or some cid_ranges ###
  outlines_data     = []
  content_data      = []
  progress_count    = 100 ### output progress whenever multiple of this number reached ###
  # fragment insert_into_outlines_first(): insert into outlines ( iclabel, fontnick, pathdata ) values
  #.........................................................................................................
  ### TAINT refactor ###
  SVGTTF_font                 = {}
  SVGTTF_font.nick            = fontnick
  SVGTTF_font.path            = @filepath_from_fontnick me, fontnick
  SVGTTF_font.metrics         = SVGTTF.new_metrics()
  try
    SVGTTF_font.otjsfont        = SVGTTF.otjsfont_from_path SVGTTF_font.path
  catch error
    warn "^ucdb@1012^ when trying to open font #{rpr fontnick}, an error occurred: #{error.message}"
    return null
  # return null
  SVGTTF_font.advance_factor  = SVGTTF_font.metrics.em_size / SVGTTF_font.otjsfont.unitsPerEm
  XXX_advance_scale_factor    = SVGTTF_font.advance_factor * ( SVGTTF_font.metrics.global_glyph_scale ? 1 )
  #.........................................................................................................
  false_fallback_pathdata = @_get_false_fallback_pathdata_from_SVGTTF_font me, SVGTTF_font
  if false_fallback_pathdata?
    warn '^ucdb@6374445^', "filtering codepoints with outlines that look like fallback (placeholder glyph)"
  #.........................................................................................................
  for { iclabel, cid, glyph, } from cast.iterator glyphrows
    d = SVGTTF.glyph_and_pathdata_from_cid SVGTTF_font.metrics, SVGTTF_font.otjsfont, cid
    continue if ( not d? ) or ( false_fallback_pathdata? and ( d.pathdata is false_fallback_pathdata ) )
    whisper '^ucdb@1013^', me._outline_count - 1 if ( me._outline_count++ % progress_count ) is 0
    advance           = d.glyph.advanceWidth * XXX_advance_scale_factor
    ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    if ( isa.nan advance ) or ( advance is 0 )
      ### TAINT code repetition ###
      cid_hex = '0x' + ( cid.toString 16 ).padStart 4, '0'
      warn "^ucdb@3332^ illegal advance for #{SVGTTF_font.nick} #{cid_hex}: #{rpr advance}; setting to 1"
      advance           = 1
    ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    content           = jr { advance, pathdata: d.pathdata, }
    hash              = MIRAGE.sha1sum_from_text content

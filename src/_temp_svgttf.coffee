
### TAINT pending code cleanup ###

'use strict'

############################################################################################################
CND                       = require 'cnd'
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
{ isa
  validate
  declare
  first_of
  last_of
  size_of
  type_of }               = require './types'
#...........................................................................................................
require                   './exception-handler'
OT                        = require 'opentype.js'

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
# #-----------------------------------------------------------------------------------------------------------
# @list_glyphs_in_otjsfont = ( otjsfont ) ->
#   R = new Set()
#   #.........................................................................................................
#   for idx, glyph of otjsfont.glyphs.glyphs
#     # if glyph.name in [ '.notdef', ] or ( not glyph.unicode? ) or ( glyph.unicode < 0x20 )
#     if ( not glyph.unicode? ) or ( glyph.unicode < 0x20 )
#       warn "skipping glyph #{rpr glyph.name}"
#       continue
#     unicodes  = glyph.unicodes
#     unicodes  = [ glyph.unicode, ] if ( not unicodes? ) or ( unicodes.length is 0 )
#     # debug rpr glyph
#     # debug rpr unicodes
#     for cid in unicodes
#       # debug rpr cid
#       R.add String.fromCodePoint cid
#   #.........................................................................................................
#   return [ R... ].sort()
# #-----------------------------------------------------------------------------------------------------------
# @otjspath_from_pathdata = ( pathdata ) ->
#   SvgPath                   = @_SvgPath = require 'svgpath'
#   validate.nonempty_text pathdata
#   svg_path  = new SvgPath pathdata
#   R         = new OT.Path()
#   d = R.commands
#   for [ type, tail..., ] in svg_path.segments
#     # debug '^svgttf#3342', [ type, tail..., ]
#     ### TAINT consider to use API (moveTo, lineTo etc) ###
#     switch type
#       when 'M', 'L'
#         [ x, y, ] = tail
#         d.push { type, x, y, }
#       when 'C'
#         [ x1, y1, x2, y2, x, y, ] = tail
#         d.push { type, x1, y1, x2, y2, x, y, }
#       when 'Q'
#         [ x1, y1, x, y, ] = tail
#         d.push { type, x1, y1, x, y, }
#       when 'Z'
#         d.push { type, }
#       else throw new Error "^svgttf#2231 unknown SVG path element #{rpr type}"
#   return R
# #-----------------------------------------------------------------------------------------------------------
# @new_otjs_font = ( me, name, glyphs ) ->
#   validate.nonempty_text name
#   return new OT.Font {
#     familyName:   name,
#     styleName:    'Medium',
#     unitsPerEm:   me.em_size,
#     ascender:     me.ascender,
#     descender:    me.descender,
#     glyphs:       glyphs }





#===========================================================================================================
# METRICS
#-----------------------------------------------------------------------------------------------------------
@new_metrics = ->
  R =
    # em_size:          4096  ### a.k.a. design size, grid size ###
    em_size:          1000  ### a.k.a. design size, grid size ###
    font_size:        360   ### in pixels ###
    scale_factor:     null
    # ### TAINT magic number
    # for whatever reason, we have to calculate advanceWidth with an additional tracking factor:
    # advanceWidth = glyph.advanceWidth * metrics.scale_factor * metrics.tracking_factor ###
    # tracking_factor:  256 / 182
  R.scale_factor        =  R.em_size / R.font_size
  R.path_precision      = 0
  # R.global_glyph_scale  = 50 / 48.5 ### TAINT value must come from configuration ###
  R.global_glyph_scale  = 256 / 248 ### TAINT value must come from configuration ###
  # R.global_glyph_scale  = 1 ### TAINT value must come from configuration ###
  return R

#-----------------------------------------------------------------------------------------------------------
@svg_path_from_cid = ( otjsfont, cid ) ->
  pathdata    = @svg_pathdata_from_cid otjsfont, cid
  glyph       = String.fromCodePoint cid
  cid_hex     = "0x#{cid.toString 16}"
  return "<!-- #{cid_hex} #{glyph} --><path d='#{pathdata}'/>"

#-----------------------------------------------------------------------------------------------------------
@_otjsglyph_from_glyph = ( otjsfont, glyph ) ->
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
@_get_otjsglyph_and_pathdata = ( me, SVGTTF_font, cid, glyph ) ->
  # validate.positive_integer cid
  { metrics, }        = SVGTTF_font
  otjsglyph           = @_otjsglyph_from_glyph SVGTTF_font.otjsfont, glyph
  # debug '^svgttf/_get_otjsglyph_and_pathdata@277262', otjsglyph?.name
  return null if ( not otjsglyph? )
  # return null if ( not otjsglyph? ) or ( otjsglyph.name is '.notdef' )
  path_obj            = otjsglyph.getPath 0, 0, metrics.font_size
  return null if path_obj.commands.length is 0
  global_glyph_scale  = metrics.global_glyph_scale ? 1
  scale_factor        = metrics.scale_factor * global_glyph_scale
  @_quickscale path_obj, scale_factor, -scale_factor
  pathdata            = path_obj.toPathData metrics.path_precision
  return { otjsglyph, pathdata, }

#-----------------------------------------------------------------------------------------------------------
@_open_font = ( path, relpath ) ->
  try
    return OT.loadSync path
  catch error
    warn "^fontmirror@1012^ when trying to open font #{rpr relpath}, an error occurred: #{error.message}"
  return null

#-----------------------------------------------------------------------------------------------------------
@walk_font_outlines = ( me, source ) ->
  ### Yield one commented line to show the path to the file cached; this also makes sure a file will exist
  in the cache even if no outlines were obtained so we can avoid re-openening the font whenever cache
  is amended without `force_overwrite`: ###
  description = { source_path: source.path, }
  yield "#{jr description}\n"
  return unless ( otjsfont = @_open_font source.path, source.relpath )?
  progress_count              = 100 ### output progress whenever multiple of this number reached ###
  SVGTTF_font                 = {}
  SVGTTF_font.otjsfont        = otjsfont
  SVGTTF_font.path            = source.path
  SVGTTF_font.relpath         = source.relpath
  SVGTTF_font.metrics         = metrics = @new_metrics()
  SVGTTF_font.advance_factor  = SVGTTF_font.metrics.em_size / SVGTTF_font.otjsfont.unitsPerEm
  XXX_advance_scale_factor    = SVGTTF_font.advance_factor * ( SVGTTF_font.metrics.global_glyph_scale ? 1 )
  # #.........................................................................................................
  fallback_pathdata = null
  # false_fallback_pathdata = @_get_false_fallback_pathdata_from_SVGTTF_font me, SVGTTF_font
  #.........................................................................................................
  for cid in [ 0x4e00 .. 0x4eff ]
    cid_hex     = '0x' + ( cid.toString 16 ).padStart 4, '0'
    glyph       = String.fromCodePoint cid
    d           = @_get_otjsglyph_and_pathdata me, SVGTTF_font, cid, glyph
    continue if not d?
    continue if d.pathdata is fallback_pathdata
    whisper '^ucdb@1013^', me.outline_count - 1 if ( me.outline_count++ % progress_count ) is 0
    pathdata    = d.pathdata
    advance     = ( d.otjsglyph.advanceWidth * XXX_advance_scale_factor ).toFixed metrics.path_precision
    ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    if ( isa.nan advance ) or ( advance is 0 )
      ### TAINT code repetition ###
      warn "^ucdb@3332^ illegal advance for #{SVGTTF_font.nick} #{cid_hex}: #{rpr advance}; setting to 1"
      advance           = 1
    ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    outline_json = jr { advance, pathdata, }
    yield "#{cid_hex},#{glyph},#{outline_json}\n"


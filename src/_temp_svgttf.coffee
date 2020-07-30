
### TAINT pending code cleanup ###

'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr.bind CND
badge                     = 'FONTMIRROR/_TEMP_SVGTTF'
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
OT                        = require 'opentype.js'


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@new_font = ( me, source ) ->
  { fontnick
    path
    relpath } = source
  otjsfont    = @_open_font path, source.relpath
  if otjsfont? then metrics = @new_metrics otjsfont
  else              metrics = null
  return { fontnick, path, relpath, metrics, otjsfont, }

#-----------------------------------------------------------------------------------------------------------
@_open_font = ( path, relpath ) ->
  try
    return OT.loadSync path
  catch error
    warn "^fontmirror@1012^ when trying to open font #{rpr relpath}, an error occurred: #{error.message}"
  return null

#-----------------------------------------------------------------------------------------------------------
@new_metrics = ( otjsfont ) ->
  upm             = 4096
  source_upm      = otjsfont.unitsPerEm
  # upm             = 1000
  path_precision  = 0
  advance_factor  = upm / source_upm
  return { upm, source_upm, path_precision, advance_factor, }


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@svg_path_from_cid = ( otjsfont, cid ) ->
  pathdata    = @svg_pathdata_from_cid otjsfont, cid
  glyph       = String.fromCodePoint cid
  cid_hex     = "0x#{cid.toString 16}"
  return "<!-- #{cid_hex} #{glyph} --><path d='#{pathdata}'/>"

#-----------------------------------------------------------------------------------------------------------
@_otjsglyph_from_glyph = ( otjsfont, glyph ) ->
  return otjsfont.glyphs.get 0 if glyph is 'fallback'
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
@_get_otjsglyph_and_pathdata = ( me, font, cid, glyph ) ->
  # validate.positive_integer cid
  { metrics, }  = font
  return null unless ( otjsglyph = @_otjsglyph_from_glyph font.otjsfont, glyph )?
  path_obj      = otjsglyph.getPath 0, 0, metrics.upm
  return null if path_obj.commands.length is 0
  @_quickscale path_obj, 1, -1
  pathdata      = path_obj.toPathData metrics.path_precision
  advance       = ( otjsglyph.advanceWidth * metrics.advance_factor ).toFixed metrics.path_precision
  return { otjsglyph, advance, pathdata, }


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@walk_font_outlines = ( me, source ) ->
  ### Yield one commented line to show the path to the file cached; this also makes sure a file will exist
  in the cache even if no outlines were obtained so we can avoid re-openening the font whenever cache
  is amended without `force_overwrite`: ###
  { fontnick
    path
    relpath }                 = source
  #.........................................................................................................
  progress_count  = 10000 ### output progress whenever multiple of this number reached ###
  font            = @new_font me, source
  metrics         = font.metrics
  description     = { key: '^new-font', fontnick, path, metrics, }
  yield "#{jr description}\n"
  return unless font.metrics?
  #.........................................................................................................
  fallback_pathdata = null
  if ( d = @_get_otjsglyph_and_pathdata me, font, null, 'fallback' )?
    help '^55562^', 'fallback pathdata', fontnick, d.pathdata[ .. 80 ]
    fallback_pathdata = d.pathdata
  else
    warn '^55562^', 'no fallback pathdata', fontnick
  #.........................................................................................................
  ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
  cids = []
  # cids = [ cids..., [ 0x4e00 .. 0x4e03 ]..., ]
  # cids = [ cids..., 0x9fff, ]
  # cids = [ cids..., 0xfffd, 0xfffe, 0xffff, ]

  # cids = [ cids..., [ 0x01 .. 0xff ]..., ]
  # cids = [ cids..., 0x004e00, ] # A:uc0---:004e00:一
  # cids = [ cids..., 0x004e01, ] # A:uc0---:004e01:丁
  # cids = [ cids..., 0x004e02, ] # A:uc0---:004e02:丂
  # cids = [ cids..., 0x004e03, ] # A:uc0---:004e03:七
  # cids = [ cids..., 0x004e04, ] # A:uc0---:004e04:丄
  # cids = [ cids..., 0x004e05, ] # A:uc0---:004e05:丅
  # cids = [ cids..., 0x004e07, ] # A:uc0---:004e07:万
  # cids = [ cids..., 0x004df0, ] # A:ucyijg:004df0:䷰
  # cids = [ cids..., 0x004df1, ] # A:ucyijg:004df1:䷱
  # cids = [ cids..., 0x004df2, ] # A:ucyijg:004df2:䷲
  # cids = [ cids..., 0x00243f, ] # A:u-----:00243f:
  # cids = [ cids..., 0x00245f, ] # A:u-----:00245f:
  # cids = [ cids..., 0x00fdd0, ] # A:u-----:00fdd0:
  # cids = [ cids..., 0x00fdd1, ] # A:u-----:00fdd1:
  # cids = [ cids..., 0x00fdd2, ] # A:u-----:00fdd2:
  # cids = [ cids..., 0x00fffd, ] # A:u-----:00fffd:�
  # cids = [ cids..., 0x00fffe, ] # A:u-----:00fffe:
  # cids = [ cids..., 0x00ffff, ] # A:u-----:00ffff:
  # cids = [ cids..., 0x030000, ] # A:u-----:030000:
  # cids = [ cids..., 0x10fffe, ] # A:u-----:10fffe:
  # cids = [ cids..., 0x10ffff, ] # A:u-----:10ffff:
  # cids = [ cids..., 0x009fff, ] # A:uc0---:009fff:
  cids = [ 0x4e00 .. 0x9fff ]
  cids = [ ( new Set cids )..., ]
  ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
  #.........................................................................................................
  for cid in cids
    cid_hex       = '0x' + ( cid.toString 16 ).padStart 4, '0'
    glyph         = String.fromCodePoint cid
    d             = @_get_otjsglyph_and_pathdata me, font, cid, glyph
    continue if ( not d? ) or ( d.pathdata is fallback_pathdata )
    pathdata_json = jr d.pathdata
    advance       = d.advance
    #.......................................................................................................
    if isa.nan advance
      warn "^ucdb@3332^ illegal advance for #{font.nick} #{cid_hex}: #{rpr advance}; setting to UPM"
      advance = font.metrics.upm
    #.......................................................................................................
    whisper '^ucdb@1013^', me.outline_count - 1 if ( me.outline_count++ % progress_count ) is 0
    yield "#{cid_hex},#{glyph},#{advance},#{pathdata_json}\n"
  #.........................................................................................................
  return null




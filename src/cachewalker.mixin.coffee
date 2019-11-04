
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR/CACHEWALKER'
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
# require                   './exception-handler'
#...........................................................................................................
SP                        = require 'steampipes'
{ $
  $async
  $watch
  $show
  $drain }                = SP.export()
{ jr, }                   = CND
glob                      = require 'glob'
PATH                      = require 'path'
line_pattern              = ///
  ^ 0x
    (?<cid_hex>   [ 0-9 a-f ]+  ),
    (?<glyph>     .             ),
    (?<advance>   [ 0-9 ]+      ),
   "(?<pathdata>  .*            )"
   $ ///u


#-----------------------------------------------------------------------------------------------------------
@walk_cached_outlines = ( me, XXX_target_path ) ->
  # target_path     = PATH.join me.target_path, content_hash
  # cache_pattern   = PATH.join me.target_path, '*'
  validate.fontmirror_existing_folder XXX_target_path
  cache_pattern   = PATH.join XXX_target_path, '*'
  cache_paths     = glob.sync cache_pattern
  #.........................................................................................................
  # signal SOT:
  yield { key: '^first', }
  #.........................................................................................................
  for cache_path in cache_paths
    for line from @_walk_file_lines cache_path
      #.....................................................................................................
      # yield embedded JSON objects:
      if line.startsWith '{'
        yield JSON.parse line
        continue
      #.....................................................................................................
      # silently skip unrecognized lines:
      unless ( match = line.match line_pattern )?
        continue
      #.....................................................................................................
      # assemble `^outline` datoms for the majority of lines:
      { cid_hex
        glyph
        advance
        pathdata  } = match.groups
      yield { key: '^outline', cid_hex, glyph, advance, pathdata, }
  #.........................................................................................................
  # signal EOT:
  yield { key: '^last', }
  return null

# #-----------------------------------------------------------------------------------------------------------
# @_walk_outlines_from_cache_path = ( me, cache_path ) ->
#   whisper '^fontmirror/cachewalker@343^', "yielding from cache_path"
#   # validate.content_hash content_hash
#   pipeline        = []
#   pipeline.push SP.read_from_file cache_path
#   pipeline.push SP.$split()
#   pipeline.push $show()
#   pipeline.push $watch ( d ) -> yield d
#   pipeline.push $drain =>
#     whisper '^fontmirror/cachewalker@344^', "finished with cache_path"
#   return null

#-----------------------------------------------------------------------------------------------------------
@_walk_file_lines = ( path ) ->
  Readlines = require 'n-readlines'
  liner     = new Readlines path
  while line = liner.next()
    yield line.toString()
  return null



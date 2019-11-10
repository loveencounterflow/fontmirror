
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR/TAGS'
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
PATH                      = require 'path'
{ assign
  jr }                    = CND
# { walk_cids_in_cid_range
#   cwd_abspath
#   cwd_relpath
#   here_abspath
#   _drop_extension
#   project_abspath }       = require './helpers'
@types                    = require './types'
{ isa
  validate
  cast
  type_of }               = @types
#...........................................................................................................
# require                   './exception-handler'
mkdirp                    = require 'mkdirp'
#...........................................................................................................
SP                        = require 'steampipes'
{ $
  $async
  $watch
  $show
  $drain }                = SP.export()
#...........................................................................................................
### TAINT only needed until datoms are implemented in SteamPipes ###
XXX_PD                    = require 'pipedreams'
{ new_datom
  select }                = XXX_PD.export()
last                      = Symbol 'last'
first                     = Symbol 'first'


#===========================================================================================================
# HELPERS
#-----------------------------------------------------------------------------------------------------------
$skip_comments_and_blanks = ->
  ### TAINT implement in SteamPipes ###
  return SP.$filter ( line ) -> not ( line.match /^\s*#/ )? and not ( line.match /^\s*$/ )?


#===========================================================================================================
# VOCABULARY
#-----------------------------------------------------------------------------------------------------------
@read_vocabulary = ( settings ) -> new Promise ( resolve ) =>
  FONTMIRROR          = require '..'
  target_path         = FONTMIRROR.CFG.set_or_get 'target_path'
  source_path         = PATH.join target_path, 'cfg/tag-vocabulary.txt'
  source              = SP.read_from_file source_path
  pipeline            = []
  #.........................................................................................................
  pipeline.push source
  pipeline.push SP.$split()
  pipeline.push $skip_comments_and_blanks()
  pipeline.push $split_vocabulary_fields()
  pipeline.push $collect_vocabulary()
  pipeline.push $drain ( [ vocabulary ] ) -> resolve vocabulary
  #.........................................................................................................
  SP.pull pipeline...
  return null

#-----------------------------------------------------------------------------------------------------------
$split_vocabulary_fields = ->
  ### TAINT show source location on error ###
  return $ ( line, send ) ->
    [ tag_with_markup
      tail... ]       = line.split /\s+/
    comment           = tail.join ' '
    unless tag_with_markup.startsWith '+'
      throw new Error "^fontmirror/tags@4543^ not a legal tag: #{rpr tag}"
    if ( is_vip = tag_with_markup.endsWith '!' )  then  tag = tag_with_markup.replace /!$/, ''
    else                                                tag = tag_with_markup
    send new_datom '^tag', { tag, is_vip, }

#-----------------------------------------------------------------------------------------------------------
$collect_vocabulary = ->
  ### TAINT show source location on error ###
  R     = {}
  return $ { last, }, ( d, send ) ->
    return send R if d is last
    { tag, is_vip, } = d
    if R[ tag ]?
      throw new Error "^fontmirror/tags@4548^ duplicate tag: #{rpr tag}"
    R[ tag ] = { is_vip, }
    return null


#===========================================================================================================
# FONTNICKS AND TAGS
#-----------------------------------------------------------------------------------------------------------
$split_tags_fields = ->
  return $ ( line, send ) ->
    [ fontnick
      tail... ]       = line.split /\s+/
    tags              = tail.join ''
    tags              = tags.replace  /\s/g, ''
    tags              = tags.split    /(?=\+)/
    send new_datom '^tagged-fontnick', { fontnick, tags, }

#-----------------------------------------------------------------------------------------------------------
$validate_tags = ( vocabulary ) -> $watch ( d ) ->
  ### TAINT show source location on error ###
  for tag in d.tags
    unless vocabulary[ tag ]?
      throw new Error "^fontmirror/tags@4549^ unknown tag: #{rpr tag}"
  return null

#-----------------------------------------------------------------------------------------------------------
$inject_vocabulary = ( vocabulary ) ->
  return $ { first, }, ( d, send ) ->
    return send new_datom '^vocabulary', { value: vocabulary, } if d is first
    send d

#-----------------------------------------------------------------------------------------------------------
@_new_tag_source = ( settings ) -> new Promise ( resolve ) =>
  validate.fontmirror_cli_command_settings settings
  vocabulary          = await @read_vocabulary settings
  FONTMIRROR          = require '..'
  # source_path         = FONTMIRROR.CFG.set_or_get 'source_path'
  target_path         = FONTMIRROR.CFG.set_or_get 'target_path'
  source_path         = PATH.join target_path, 'cfg/tags.txt'
  # partitioner         = FONTMIRROR.NICKS.partitioner
  # extensions          = FONTMIRROR.CFG.set_or_get 'extensions'
  # pattern             = PATH.join source_path, "/**/*.+(#{extensions})"
  # paths               = ( require 'glob' ).sync pattern
  # paths_by_fontnicks  = {}
  # links_home          = PATH.join target_path, 'all'
  # font_count          = 0
  source              = SP.read_from_file source_path
  pipeline            = []
  #.........................................................................................................
  pipeline.push source
  pipeline.push SP.$split()
  pipeline.push $skip_comments_and_blanks()
  pipeline.push $split_tags_fields()
  pipeline.push $validate_tags vocabulary
  pipeline.push $inject_vocabulary vocabulary
  #.........................................................................................................
  resolve SP.pull pipeline...


#===========================================================================================================
# REFRESH
#-----------------------------------------------------------------------------------------------------------
@refresh = ( settings ) -> new Promise ( resolve ) =>
  debug '^344772^', settings; process.exit 1
  FONTMIRROR          = require '..'
  target_path         = FONTMIRROR.CFG.set_or_get 'target_path'
  path_to_fontnicks   = PATH.join target_path, 'all'
  fontnicks           = FONTMIRROR.LINKS._list_all_fontnicks()
  source              = await @_new_tag_source settings
  pipeline            = []
  #.........................................................................................................
  pipeline.push source
  pipeline.push $show()
  pipeline.push $drain -> resolve()
  #.........................................................................................................
  SP.pull pipeline...
  return null


############################################################################################################
if require.main is module then do =>
  debug '^3332^'



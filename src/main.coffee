
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR'
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
glob                      = require 'glob'
require                   './exception-handler'
Multimix                  = require 'multimix'
TEXFONTNAMESAKE           = require './texfontnamesake'
fontfile_extensions       = 'otf|ttf|woff|woff2|ttc'
# 'eot|svg'

#-----------------------------------------------------------------------------------------------------------
@_content_hash_from_path = ( me, path ) -> CND.id_from_route path, 17

#-----------------------------------------------------------------------------------------------------------
@new_job = ( source_path, target_path, force_overwrite ) ->
  source_path   = PATH.resolve source_path
  target_path   = PATH.resolve target_path
  glob_settings = { matchBase: true, follow: true, nocase: true, }
  glob_pattern  = PATH.join source_path, "/**/*.+(#{fontfile_extensions})"
  help "^fontmirror@4452^ matching against #{glob_pattern}"
  #.........................................................................................................
  if isa.fontmirror_existing_file source_path
    source_paths = [ source_path, ]
  else if isa.fontmirror_existing_folder source_path
    source_paths = glob.sync glob_pattern, glob_settings
  else
    throw new Error "^445552^ expected path to existing file or folder, got #{rpr source_path}"
  #.........................................................................................................
  unless isa.fontmirror_existing_folder target_path
    throw new Error "^fontmirror@445^ expected path to existing folder, got #{rpr target_path}"
  #.........................................................................................................
  return { source_path, target_path, source_paths, force_overwrite, outline_count: 0, }

#-----------------------------------------------------------------------------------------------------------
@_is_cached = ( me, target_path ) -> isa.fontmirror_existing_file target_path

#-----------------------------------------------------------------------------------------------------------
@cache_font_outlines = ( source_path, target_path, force_overwrite ) ->
  ### source must be an existing font file or a directory of font files; target must be an existing
  directory ###
  me = @new_job source_path, target_path, force_overwrite
  ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
  XXX_includes = null
  # andːregularːotf     !!! intentional fallback glyph font
  # andːregularːttf     !!! intentional fallback glyph font
  # lastːresortːttf     !!! intentional fallback glyph font
  #
  # �￾￿￯
  # '�￾￿' 0xfffd, 0xfffe, 0xffff
  # '﷐﷑﷒﷓﷔﷕﷖﷗﷘﷙﷚﷛﷜﷝﷞﷟﷠﷡﷢﷣﷤﷥﷦﷧﷨﷩﷪﷫﷬﷭﷮﷯' 0xfdd0..0xfdef non-characters
  # '鿿' 0x9fff unassigned
  # dejaːvuːsansːmonoːboldːobliqueːttf
  # iosevkaːslabːthinːttf
  # thːtshynːpːoneːttf
  # wenːyueːguːdianːmingːchaoːtiːncːwːfiveːːoneːotf has fallback image? at 乸, but correctly missing glyphs othwerwise
  XXX_includes = """
    andːregularːotf
    andːregularːttf
    babelːstoneːhanːttf
    dejaːvuːsansːmonoːboldːobliqueːttf
    iosevkaːslabːthinːttf
    lastːresortːttf
    sunːextaːttf
    thːtshynːpːoneːttf
    thːtshynːpːoneːttf
    wenːyueːguːdianːmingːchaoːtiːncːwːfiveːːoneːotf
    """
  if XXX_includes?
    XXX_includes = XXX_includes.split /\s+/
    XXX_includes = XXX_includes.filter ( x ) -> x isnt ''
  ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
  for source_path in me.source_paths
    filename                    = PATH.basename source_path
    fontnick                    = TEXFONTNAMESAKE.escape filename
    ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    continue if XXX_includes? and fontnick not in XXX_includes
    ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    source_relpath  = PATH.relative process.cwd(), source_path
    source          = { path: source_path, relpath: source_relpath, fontnick, }
    content_hash    = @_content_hash_from_path me, source.path
    target_path     = PATH.join me.target_path, content_hash
    if @_is_cached me, target_path
      if not me.force_overwrite
        help "skipping:    #{content_hash} #{source.fontnick}"
        continue
      urge "overwriting: #{content_hash} #{source.fontnick}"
    else
      info "new:         #{content_hash} #{source.fontnick}"
    await @_write_font_outlines me, source, target_path
  return null

#-----------------------------------------------------------------------------------------------------------
@cli = ->
  app = require 'commander'
  app
    .version ( require '../package.json' ).version
    .command 'cache <source> <target>'
    .option '-f --force', "force overwrite existing cache"
    .action ( source_path, target_path, d ) ->
      force_overwrite = d.force ? false
      await FONTMIRROR.cache_font_outlines source_path, target_path, force_overwrite
  app.parse(process.argv);
  return null


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
MAIN = @
class Fontmirror extends Multimix
  @include MAIN,                              { overwrite: false, }
  @include ( require './outliner.mixin' ),    { overwrite: false, }
  @include ( require './cachewalker.mixin' ), { overwrite: false, }
  @include ( require './_temp_svgttf' ),      { overwrite: false, } ### !!!!!!!!!!!!!!!!!!!!!!!!!!! ###
  # @extend MAIN, { overwrite: false, }

module.exports = FONTMIRROR = new Fontmirror()



############################################################################################################
if require.main is module then do => FONTMIRROR.cli()



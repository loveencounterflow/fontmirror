

'use strict'



############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR/TEXFONTNAMESAKE'
log                       = CND.get_logger 'plain',     badge
debug                     = CND.get_logger 'debug',     badge
info                      = CND.get_logger 'info',      badge
warn                      = CND.get_logger 'warn',      badge
alert                     = CND.get_logger 'alert',     badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
types                     = require './types'
{ isa
  validate
  type_of
  defaults
  Failure }               = types

#-----------------------------------------------------------------------------------------------------------
@partitioner      = 'ː'
@latindigitnames  =
  0:    'zero'
  1:    'one'
  2:    'two'
  3:    'three'
  4:    'four'
  5:    'five'
  6:    'six'
  7:    'seven'
  8:    'eight'
  9:    'nine'

#-----------------------------------------------------------------------------------------------------------
@escape = ( text ) ->
  ### See https://github.com/latex3/unicode-data; thx to https://tex.stackexchange.com/a/514731/128255 ###
  validate.nonempty_text text
  R = text
  ### replace Latin digits by partitioner plus name: ###
  R = R.replace ///[0-9]///gu,                  ( $0        ) => @partitioner + @latindigitnames[ $0 ]
  ### insert partitioner between sequences of lower and upper case (aB -> aːB) ###
  R = R.replace ///(\p{Ll})(\p{Lu})///gu,       ( _, $1, $2 ) => $1 + @partitioner + $2
  ### replace each code point that is not a Unicode 'Letter' or 'Mark' with partitioner: ###
  R = R.replace ///[^\p{Letter}\p{Mark}]///gu,  @partitioner
  ### turn the result into lower case: ###
  return R.toLowerCase()


############################################################################################################
if require.main is module then do =>
  texts = [
    '辛亥革命'
    '一二三'
    '¥ÄÖå'
    '　、。〃〄々〇〈〉'
    '、。〃〄々〇〈〉'
    # ''
    'Ⅶ'
    'µ¶ƐⅦⓇⓈ'
    '书法家超明体.ttf'
    'Aleo-Bold.otf'
    'Aleo-BoldItalic.otf'
    'unifont_upper-12.1.03.ttf'
    'Sun-ExtB.ttf'
    'SUN-EXTB.TTF'
    'legalnameₘ'
    ]
  paths = ( require 'glob' ).sync '/home/flow/jzr/benchmarks/assets/fontmirror/fonts/*/**'
  for path in paths
    name = ( require 'path' ).basename path
    debug '^89973^', ( CND.lime rpr name ), ( CND.white rpr @escape name )
  for text in texts
    debug '^89973^', ( CND.lime rpr text ), ( CND.white rpr @escape text )

  # for cid in [ 0x1ff .. 0x4ff ]
  #   glyph = String.fromCodePoint cid
  #   continue unless ( glyph.match ///^[\p{Letter}\p{Mark}]$///gu )?
  #   debug '^3473^', ( cid.toString 16 ), ( rpr glyph )


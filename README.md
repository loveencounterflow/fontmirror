

# FontMirror



<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Font Catalog](#font-catalog)
  - [Cataloging by Symlinking](#cataloging-by-symlinking)
  - [Fontnicks](#fontnicks)
  - [Tagging](#tagging)
- [Outline Cache](#outline-cache)
- [Details](#details)
  - [Details on Fontnicks](#details-on-fontnicks)
  - [Details on Tagging](#details-on-tagging)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->




## Font Catalog

### Cataloging by Symlinking

The FM Font Catalog is implemented as a number of directories which contain symbolic links (symlinks as
provided by the file system) to build collections of pointers to the objects of interest. Apart from reading
file metadata and file contents, FM will not touch, move or alter any object file, and it will not change
anything outside a designated catalog location; thus, all effects of its actions are purely local and
discardable without risk of data loss beyond what FM has produced itself.

In order to use FontMirror,

* give it a source location in the file system where to look for font files; call it `myfonts` and assume it
  points to, say, `/home/user/fonts`;

* give it a a target location where to store the resulting symlinks; let's say we tell it to use
  `/home/user/fmcatalog`;

The source is stored as a symlink in the `sources` subdirectory of the target, so there will be a symlink
`/home/user/fmcatalog/sources/myfonts ↷ /home/user/fonts`.

### Fontnicks

FM will then go and and look for fonts by running [glob](https://github.com/isaacs/node-glob) against the
pattern `/home/user/fonts/**/*.+(otf|ttf|woff|woff2|ttc)`. For each file found, it will produce a nickname
(a fontnick) by substituting 'problematic' letters in the filename by unproblematic replacement characters;
the fontnicks then become the names to the fonts under `fmcatalog/all`.

Here is what `ls fmcatalog/all` might look like after this step:

```
TARGET                                    LINKS TO  SOURCE FILES
fmcatalog/all/cwːteːxqyuanːmediumːttf           ↷ ../sources/myfonts/cwTeXQYuan-Medium.ttf
fmcatalog/all/simfangːttf                       ↷ ../sources/myfonts/simfang.ttf
fmcatalog/all/notoːserifːjpːblackːotf           ↷ ../sources/myfonts/NotoSerif/NotoSerifJP-Black.otf
fmcatalog/all/robotoːcondensedːboldːitalicːttf  ↷ ../sources/myfonts/Roboto/RobotoCondensed-BoldItalic.ttf
fmcatalog/all/sourceːcodeːproːboldːotf          ↷ ../sources/myfonts/SourceCodePro-Bold.otf
```

As one can see, subdirectories in the source location have been ignored in the target. This is intentional:
we want to obtain a flat namespace for all fonts, no matter where they are actually stored. Also, the target
entities are referenced by referring back to the link established in `sources`; in principle, when moving
the catalog relative to the font files, rewriting the links in sources should suffice to keeping valid links
throughout the catalog (this may become important when effort has been spent to collect many megabytes worth
of outline data as discussed below, as re-writing the symlinks alsone is done in seconds, but pathdata
extraction requires significantly more computational effort).

### Tagging

So now we have a catalog in `fmcatalog/all` with a flat list of all our fonts, which is great but just part
of what cataloging fonts is all about. This is where tags come in. FontMirror adopts a very simple tagging
model that may be characterized as follows:

* **each tag is a short word** that describes a useful quality of an entity;
* tags are symbolized as strings prefixed with a `+` (plus sign) because
* all **tags are affirmative**, so `+bold` will (presumably) mean 'yes, this font has bold letters';
  negatives (a la `-bold`) can (currently) only be formed by introducing mutually-exclusive tags (say,
  `+light`), but
* observe that (currently) no efforts are made, by the tagging subsystem, to validate any rules beyond those
  listed here, so users can totally label a given font as being *both* `+bold` and `+light` without the
  software going to complain about that;
* the set of tags used within a given catalog forms a **controlled vocabulary**;
* there's a **total ordering of tags** within a given vocabulary, so of two distinct tags, one always
  precedes the other (and the other always succedes the one);
* because of total ordering, we can always write **any set of tags in a unique way**; this is called a
  combined tag or a 'combotag', wich, because of its uniqueness, lends itself to build file system names
  from;


## Outline Cache


## Details

### Details on Fontnicks

> 'Problematic' in this case means 'cannot be used within a legal (Xe)(La)TeX name', as defined by
> [`latex3/unicode-data`](https://github.com/latex3/unicode-data); I realize this is a very specific
> requirement that may not suit every use case, so probably in the future the sanitizing rules will be made
> configurable. Don't get thrown off by the ː (U+02D0 Modifier Letter Triangular Colon) mark you see in the
> fontnicks, it's a sleight of hand to make names more readable, achieve reasonable chance of uniqueness of
> moderate number of source files, and obtain strings that are accepted as font names in TeX.

> A quick look at
> [texfontnamesake.coffee](https://github.com/loveencounterflow/fontmirror/blob/master/src/texfontnamesake.coffee#L48)
> shows that name clashes, as a necessity, become ever more likely as the number of fonts goes up, so a
> future version of FontMirror will implement a way to deal with those cases. We *could* build the entire
> catalog either from hashes of the `realpath`s of files or their contents, but that would make the results
> rather unreadable for humans; it also does not solve the problem how to organize one's fonts in references
> from CSS or TeX or other systems unless one is willing to copy-paste untractable strings of arbitrary
> letters.

> There's also the likelyhood of certain fonts to be stored multiple times in different locations. Because
> we refer, in the outline cache, to fontfiles using their contents' `sha1sum`, there is less of a problem
> for files that are exact duplicates of each other.



### Details on Tagging

Tags are notated as whitespace-less words with a `+` (plus sign) as prefix. U+002D `-` (hyphen-minus) is
not allowed in tags as it is reserved for future use as a negation operator.

Tags serve to positively identify subset of entities. For example, when one tags

* `a` as `+latin+vowel+letter`
* `b` as `+latin+consonant+letter`
* `A` as `+latin+vowel+letter+uppercase`
* `B` as `+latin+consonant+letter+uppercase`
* `&` as `+latin+symbol`
* `δ` as `+greek+consonant+letter`
* `Δ` as `+greek+consonant+letter+uppercase`

then

* `+latin`              selects `abAB&`
* `+latin+uppercase`    selects `AB`
* `+latin+letter`       selects `abAB`
* `+letter`             selects `abABδΔ`
* `+consonant`          selects `bBδΔ`

Combinations of tags (*combotags*) may be written without intervening spaces. As demonstrated above,
combotags select the *intersection* of their constituent tags, that is, adding another tag to an existing
combotag will always result in the selection staying constant or becoming smaller.



<!-- --------------------------------------------------------------------------------------------------- -->
> **Extensions (not implemented)**
>
> There is (currently) no way to express the *union* of tagged entities, as in 'give me everything tagged
> `+consonant` or `+symbol`' (which would result in `bB&δΔ`).
>
> The Universe of Discourse (Grundmenge) may be written as `+*` ('plus-any'), which selects `abAB&δΔ`.
>
> To exclude a subset identified by a common tag, that tag may be written with a leading `-` ('minus'), as
> in `+latin+letter-uppercase`, which selects `ab`.
>
> The set of all untagged entities may be written as `-*` ('minus-any').

<!-- --------------------------------------------------------------------------------------------------- -->



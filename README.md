

# FontMirror



<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Font Catalog](#font-catalog)
  - [Cataloging by Symlinking](#cataloging-by-symlinking)
  - [Fontnicks](#fontnicks)
  - [Tagging](#tagging)
  - [Plain Tags and Names, Cherry-Picking and Combotags](#plain-tags-and-names-cherry-picking-and-combotags)
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
* tags are symbolized as **strings prefixed with a `+` (plus sign)** because
* all **tags are affirmative**, so `+bold` will (presumably) mean 'yes, this font has bold letters';
  negatives (a la `-bold`) can (currently) only be formed by introducing mutually-exclusive tags (say,
  `+light`), but
* the set of tags used within a given catalog forms a **controlled vocabulary**;
* there's a **total ordering of tags** within a given vocabulary, so of two distinct tags, one always
  precedes the other (and the other always succedes the one);
* because of total ordering, we can always write **any set of tags in a unique way**; this is called a
  combined tag or 'combotag', wich, because of its uniqueness, lends itself to build file system names from.

What you then do is you go and build a vocabulary, which is realized as basically just a file with a bunch
of words in it; this establishes both what the allowed tags are and what ordering they have. This file
should be saved as `fmcatalog/cfg/tag-vocabulary.txt`.

Generally speaking, one will want to have one's tags grouped and ordered such that more general and more
important terms come first, and more specific and less important ones come later. Having a definitive list
of tags is a good thing as it facilitates spotting typos; ordering tags is instrumental to building a
systematic catalog of combotags without getting drowned in a combinatorial explosion.

Building such a vocabulary is probably best done in tandem with assigning tags to fonts to get a feeling for
breadth and depth of bases one wants to cover at all. It's also probably a good idea to start out with a
specific purpose in mind, so even just grabbing those quality typefaces first and marking them `+good` so as
to sort the wheat from the chaff may be a valuable first step.

The actual tagging takes place in `fmcatalog/cfg/tags.txt`, which lists one font per line, and has two
fields, the fontnick and the tags, separated by whitespace.

**Note** Observe that (currently) no efforts are made, by the tagging subsystem, to validate any rules
beyond those listed here, so users can totally label a given font as being *both* `+bold` and `+light`
without the software going to complain about that.

### Plain Tags and Names, Cherry-Picking and Combotags

Let's take a gander at a small set of tagged fonts to drive home what has been said above and to get an idea
of what the resulting FontMirror catalog is going look like. We will also use this example to motivate the
introduction of two features on top of the tagging system outlined above: tags that are treated as proper
names, and cherry-picking of tags.

Let's assume we have the following entries in `fmcatalog/cfg/tags.txt` (in a bid to improve readability,
I've spaced out the tags to achieve a tabular effect; this is purely optional):

```
# fmcatalog/cfg/tags.txt (version 1)
cwːteːxqyuanːmediumːttf                                     +cjk    +linear             +roundtips
takaoːpgothicːttf                                           +cjk    +linear             +squaretips
simfangːttf                                                 +cjk    +ming     +medium   +skewed
sunːextaːttf                                                +cjk    +ming     +medium
sunːextːbːttf                                               +cjk    +ming     +medium
notoːserifːjpːblackːotf                                     +cjk    +ming     +heavy
书法家超明体ːttf                                              +cjk    +ming     +heavy
thːkhaaiːtpːzeroːttf                                        +cjk    +kai      +medium
thːkhaaiːtpːtwoːttf                                         +cjk    +kai      +medium
robotoːcondensedːboldːitalicːttf                            +latin
sourceːcodeːproːboldːotf                                    +latin  +monospace
unifrakturːcookːlightːttf                                   +latin  +fraktur  +light
unifrakturːcookːttf                                         +latin  +fraktur  +medium
unifrakturːmaguntiaːttf                                     +latin  +fraktur  +medium
unifrakturːmaguntiaːoneːsixːttf                             +latin  +fraktur  +medium
unifrakturːmaguntiaːoneːsevenːttf                           +latin  +fraktur  +medium
unifrakturːmaguntiaːoneːeightːttf                           +latin  +fraktur  +medium
unifrakturːmaguntiaːoneːnineːttf                            +latin  +fraktur  +medium
unifrakturːmaguntiaːtwoːzeroːttf                            +latin  +fraktur  +medium
unifrakturːmaguntiaːtwoːoneːttf                             +latin  +fraktur  +medium
```

As can be readily seen, I like CJK fonts and Blackletter (Fraktur), which is how I labelled these fonts.
Also, I used tags like `+ming`, `+linear`, `+kai`, `+monospace` to further classify fonts according to their
broadest stylistic characteristics. Another layer of differentiation is brought in by annotating the weight
of some typefaces using a tripartite scale ranging from `+light` over `+medium` to `+heavy`.

Incidentally, I've taken care to order all of the tags in the listing such that it fits their order of
appearance in the corresponding `tag-vocabulary.txt`. I could've used any order when writing out the tag
sets, but it's probably a good idea to keep things consistent, so there you go. The vocabulary is defined by
this list:

```coffee
# script of interest
+cjk!
+latin!

# style

+kai
+linear!
+ming!
+kai

+roundtips
+squaretips

+fraktur
+monospace

# weight
+light
+medium
+heavy!

# modifications
+skewed
+oblique
```

This file is roughly partitioned into groups, sometimes with a code comment like `script` or `weight` above
it, but keep in mind this is only dony by and for the author, as tag groups do not formally exist in FM.

The reader may notice the exclamation signs in some tags: there's `+medium` but `+heavy!`, `+ming!` next to
`+kai` and so forth: these denote cherry-picked tags, to which we come back mementarily.

From the above data—the catalog of font files derived from a source location, the tag vocabulary, and the
associations between fonts and tags, FontMirror can now proceed to produce the catalog proper, which will be
realized as a series of subdirectories under `fmcatalog/tagged`. Here's how that works:

For each entry in `tags.txt`, FM will sort the tags as declared by their ordering in the vocabulary to
derive a normalized combotag for that entry, so for example `sunːextaːttf +medium +cjk +ming` will be read
as `sunːextaːttf` being tagged as `+cjk+ming+medium`. Consequently, FM will create a directory with that
name (`fmcatalog/tagged/+cjk+ming+medium`, unless it already exists) and create a symlink from the fontnick
to the namesake fontnick in `fmcatalog/all`:

```
fmcatalog/tagged/+cjk+ming+medium/sunːextaːttf ↷ ../all/sunːextaːttf
```

The symlink means that now you can query all fonts tagged as `+cjk+ming+medium` by using the `ls` command;
similarly, in order to trace back where the referenced font file is located, `realpath` can be used:

```sh
ls       fmcatalog/tagged/+cjk+ming+medium/
realpath fmcatalog/tagged/+cjk+ming+medium/sunːextaːttf
```

This is great because now all the standard tools you're used to read and write files with can be pointed to
an intermediate dispatcher to obtain a view that is not structured by filenames but by your own ontology.

But there's more, and that's *partial* or *subset* combotags. Obviously, tags being defined the way they
are, `sunːextaːttf` is not only a `+medium` weight in `+ming` style that has some coverage of `+cjk`
characters, it is also an element in every *super*set defined by and *sub*set of these three tags, so it's
tempting to establish *all of those* subdirectories, each with its own symlink to the same target:

```
# NB this is not how it works
fmcatalog/tagged/+cjk+medium/sunːextaːttf       ↷ ../all/sunːextaːttf
fmcatalog/tagged/+cjk+ming+medium/sunːextaːttf  ↷ ../all/sunːextaːttf
fmcatalog/tagged/+cjk+ming/sunːextaːttf         ↷ ../all/sunːextaːttf
fmcatalog/tagged/+cjk/sunːextaːttf              ↷ ../all/sunːextaːttf
fmcatalog/tagged/+medium/sunːextaːttf           ↷ ../all/sunːextaːttf
fmcatalog/tagged/+ming+medium/sunːextaːttf      ↷ ../all/sunːextaːttf
fmcatalog/tagged/+ming/sunːextaːttf             ↷ ../all/sunːextaːttf
```

While this approach would yield maximum coverage for your fonts, it'd also provide maximum coverage for your
hard disk storage, because the size of the powerset of a given set `S` equals two to the size (cardinality)
of S (i.e. `2 ^ n` with `n = |S|`). Meaning that if you characterize a given font by a meager 16 tags, and why
not, you'd get a virtually unusable catalog choc-full with no less than 16635 subdirectories. There's
probably a reason it's called a powerset after all.

Therefore, instead of producing *all* the subsets, FM will only produce all possible *prefixes* for a given
combotag; for `+cjk+ming+medium`, that's `+cjk+ming` and `+cjk` (so `n - 1` prefixes instead of `2 ^ n`
subsets). Therefore, the complete entries for the font in question look like this:

```
fmcatalog / tagged / +cjk+ming+medium / sunːextaːttf↷
fmcatalog / tagged / +cjk+ming        / sunːextaːttf↷
fmcatalog / tagged / +cjk             / sunːextaːttf↷
```

------------------------------------------------------------------------------



```
# fmcatalog/cfg/tags.txt (version 2)
cwːteːxqyuanːmediumːttf                                     +cjk+linear+roundtips
simfangːttf                                                 +cjk+ming+skewed
notoːserifːjpːblackːotf                                     +cjk+ming+heavy
takaoːpgothicːttf                                           +cjk+linear+squaretips+@takao
thːkhaaiːtpːzeroːttf                                        +cjk+kai+medium+@ththsyn
thːkhaaiːtpːtwoːttf                                         +cjk+kai+medium+@ththsyn
sunːextaːttf                                                +cjk+ming+medium+@sun
sunːextːbːttf                                               +cjk+ming+medium+@sun
书法家超明体ːttf                                             +cjk+ming+heavy
robotoːcondensedːboldːitalicːttf                            +latin
sourceːcodeːproːboldːotf                                    +latin+monospace
unifrakturːcookːlightːttf                                   +latin+fraktur+light+@unifraktur+@cook
unifrakturːcookːttf                                         +latin+fraktur+medium+@unifraktur+@cook
unifrakturːmaguntiaːttf                                     +latin+fraktur+medium+@unifraktur+@maguntia
unifrakturːmaguntiaːoneːsixːttf                             +latin+fraktur+medium+@unifraktur+@maguntia
unifrakturːmaguntiaːoneːsevenːttf                           +latin+fraktur+medium+@unifraktur+@maguntia
unifrakturːmaguntiaːoneːeightːttf                           +latin+fraktur+medium+@unifraktur+@maguntia
unifrakturːmaguntiaːoneːnineːttf                            +latin+fraktur+medium+@unifraktur+@maguntia
unifrakturːmaguntiaːtwoːzeroːttf                            +latin+fraktur+medium+@unifraktur+@maguntia
unifrakturːmaguntiaːtwoːoneːttf                             +latin+fraktur+medium+@unifraktur+@maguntia
```


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



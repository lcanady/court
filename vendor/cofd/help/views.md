+VIEWS

Detail views on a place (room). Like **+notes**, but for locations.
Optional locks use normal lock logic (`flag()`, `perm()`, and, or, not).

SYNTAX
  +views                        List views you can see here.
  +views <name>                 Read one view in full.
  +views/list [<place>]         List views (default: here).
  +views/add <name>=<text>      Create (needs canEdit on the place).
  +views/edit <name>=<text>     Replace text.
  +views/del <name>             Delete a view.
  +views/lock <name>=<lock>     Set lock; `!` or empty clears.

When any view is visible to you, look shows a centered
`+views Available` line under the description.

EXAMPLES
  +views/add Angel=The bronze angel's wings weep verdigris.
  +views/lock Angel=flag(approved)
  +views Angel
  +views/lock Angel=!

SEE ALSO: +help notes, +help lock

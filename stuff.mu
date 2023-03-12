
// Create the chargen objects if they don't exist.
@if not(v(d.cdo)) = {
        @create Chargen Data Object <CDO>;
        @fo me = {
            &d.cfo me=lastcreate(me,t); 
            @set lastcreate(me,t) = safe inherit;
        };
    }

@if not(v(d.cfo)) = {
        @create Chargen Function Object <CFO>;
        @fo me = {
            &d.cfo me=lastcreate(me,t); 
            @set lastcreate(me,t) = safe inherit;
        };
    }

@if not(v(d.cco)) = {
        @create Chargen Command Object <CCO>;
        @fo me = {
            &d.cco me=lastcreate(me,t); 
            @set lastcreate(me,t) = safe inherit;
            @va 
        };
    }

@if not(v(d.cso)) = {
        @create Chargen Staff Object <CSO>;
        @fo me = {
            &d.cso me=lastcreate(me,t); 
            @set lastcreate(me,t) = safe inherit;
        };
    }

/*
=============================================================================
=== +trademark/add ==========================================================

    SYNTAX: +trademark/add <name>=<edge>[,<edge>...][|<flaw>[,<flaw>...]

    This command allows an admin to add a trademark, and that trademarks
    edges to the chargen system.

=============================================================================
*/

&cmd.trademark/add [v(d.cso)] = $[/+@]trademark[s]?\/add\s+(.*)\s*=\s*(.*):
    
    @assert orflags(%#, wW) = {
        @pemit %#= You do not have permission to add trademarks.
    };

    // split the edges and flaws.
    [setq( 0, before(%2, |))]
    [setq( 1, after(%2, |))]

    // Split the trait/category. 
    [setq( 2, before(%1, /))]
    [setq( 3, after(%1, /))];

    &trademark_[edit( %q2, %b, ~)] %vb = iter(%q0, lcstr(##), %,,|);
    &flaws_[edit( %q2, %b, ~)] %vb = iter(%q1, lcstr(##), %,,|);
    
    @if words(%q3) = {
        &trait_cats %vb = setunion(get(%vb/trait_cats), lcstr(%q3), |);
        &cat_[edit(%q3, %b, %~)] = setunion(get(%vb/cat_[edit(%q3, %b, %~)]), lcstr(%q2), |);
    };


    @pemit %#= Trademark %ch[capstr(%q2)][if(words(%q3),%([lcstr(%q3)]%))]%cn added with the following:
        %r%chEdges:%cn [itemize(iter(%q0, capstr(##), %,, |), |)].
        [if(words(%q1, %,), %r%chFlaws:%cn [itemize(iter(%q1, capstr(##), %,, |), |)]. )];

@set [v(d.cso)]/cmd.trademark/add = reg 



/*
=============================================================================
=== +trademark/remove =======================================================

    SYNTAX: +trademark/remove <name>

    This command allows an admin to remove a trademark from the chargen
    system.

=============================================================================
*/

&cmd.trademark/remove [v(d.cso)] = $[/+@]trademark[s]?\/re[move]+\s+(.*):
    
    @assert orflags(%#, wW) = {
        @pemit %#= You do not have permission to remove trademarks.
    };

    @assert hasattr(%vb,trademark_[edit(%1, %b, ~)]) = {
        @pemit %#= Trademark %ch[capstr(%1)]%cn does not exist.
    };

    @pemit %#= Trademark %ch[capstr(%1)]%cn removed.;
    &trademark_[edit( %1, %b, ~)] %vb =;
    &flaws_[edit( %1, %b, ~)] %vb =;

@set [v(d.cso)]/cmd.trademark/remove = reg


/*
=============================================================================
=== +trademark/edit =========================================================

    SYNTAX: 
        +trademark/edit <name> <edge>=<edge>[,<edge>...][|<flaw>=<flaw>[,<flaw>...]

    This command allows an admin to edit a trademark, and that trademarks
    edges to the chargen system.
=============================================================================
*/

&cmd.trademarks/all [v(d.cco)] = $[/+@]?trademark[s]?\/all$:
    @pemit %#= [wheader(%chTrademarks/all%cn)]%r
        The following %chTrademarks%cn are avaliable:%r
        [repeat(-, width(%#))]%r
        [table(
            iter(
                lattr(%vb/trademark_*),
                capstr(lcstr(after(##, TRADEMARK_))),,|
            ), 26,width(%#),|
        )]%r
        [repeat(-, width(%#))]%r
        Type '%ch+trademark <trademark>%cn' for more information on a specific %chTrademark%cn.%r
        Type '%ch+trademarks/list%cn' for a list of all %chTrademark%cn categories.%r
        [repeat(=, width(%#))]

@set [v(d.cco)]/cmd.trademarks/all = reg

/*
=============================================================================
=== +trademarks/list ========================================================

    SYNTAX: +trademarks/list

    This command allows an admin to list all trademarks in the chargen
    system.

=============================================================================
*/

&cmd.trademarks/list [v(d.cco)] = $[/+@]?trademark[s]?$:
    @pemit %#= The following %chTrademark%cn categories are avaliable: 
        [itemize(iter(get(%vb/trait_cats), %ch[capstr(##)]%cn , %,, |), |)]. 

@set [v(d.cco)]/cmd.trademarks/list = reg  

/*
=============================================================================
===== cmd: +help ============================================================

    SYNTAX: +help

    This command displays a list of all commands available to the user.
=============================================================================
*/

&cmd.+help hs = $[/+]help$:

    [setq(0, iter(lattr(me/cmd_*),  after(##, CMD_),,|))]
    [setq(1, sort(lattr(me/cat_*)))]
    [iter(
        %q1,
        [iter(
            get(me/##),
            setq(0, setdiff(setdiff(%q0,ucstr(v(hidden)),|,|), ucstr(itext()),|,|))  
        )]
    )];

    @pemit %#= [wheader(%ch+Help%cn)]%r
        The following %chCommands%cn are avaliable:%r
        [if(words(%q0,|),%r)]
        [table(iter(%q0, capstr(lcstr(##)),|,|), 26, sub(width(%#),1), |)]
        [iter( %q1, 
            %r[wdivider(%ch[ucstr(lcstr(after(##, CAT_)))]%cn, sub(width(%#),1))]%r
            [table(
                [iter(
                    get(me/##),
                    capstr(lcstr(itext())),, |
                )] , 26, width(%#), |
            )]
        )]%r

        %r
        [repeat(-, width(%#))]%r
        Type '%ch+help <command>%cn' for more information on a specific %chCommand%cn.%r
        [repeat(=, width(%#))]

@set hs/cmd.+help = reg

/*
=============================================================================
===== cmd: +help/addcat =====================================================

    SYNTAX: +help/addcat <topic> = <category>

    This command allows an admin to add a help topic to a category.
=============================================================================
*/

&cmd.+help/addcat hs = $[/+]help\/addcat\s+(.*)\s*=\s*(.*):
    @assert orflags(%#, wW) = {
        @pemit %#= You do not have permission to add help categories.
    };

    @assert hasattr(me, cmd_[%1]) = {
        @pemit %#= +help topic  %ch[ucstr(%1)]%cn does not exist.
    };

    // Make sure the entry isn't in any other categories.
    @dolist lattr(me/cat_*)=&## me = setdiff(get(me/##), %1);

    @wait 1=&cat_[edit(%2, %b, ~)] me = setunion(get(me/cat_[edit(%2, %b, ~)]), %1);
    @pemit %#= Help entry %ch[ucstr(%1)]%cn added to category %ch[capstr(%2)]%cn.

@set hs/cmd.+help/addcat = reg

/*
=============================================================================
===== cmd: +help/add ========================================================

    SYNTAX: +help/add <topic> = <text>

    This command allows an admin to add a help topic to the chargen system.
=============================================================================
*/

&cmd.+help/add hs = $+help\/add *:
    @assert orflags(%#, wW) = {
        @pemit %#= You do not have permission to add help.
    };

    // setup registers
    [setq(0, before(%0, =))]
    [setq(1, after(%0, =))];

    &cmd_[edit(%q0, %b, ~)] me = if(%q1,%q1,0);
    @pemit %#= Help for %ch[ucstr(%q0)]%cn added.


/*
=============================================================================
===== cmd: +help/delete =====================================================

    SYNTAX: +help/delete <topic>

    This command allows an admin to delete a help topic from the chargen
    system.
=============================================================================
*/

&cmd.+help/delete hs=$+help/delete *:
    @assert orflags(%#, wW) = {
        @pemit %#= You do not have permission to delete help.
    };

    @assert hasattr(me, cmd_[%0]) = {
        @pemit %#= +help topic  %ch[ucstr(%0)]%cn does not exist.
    };

    @dolist lattr(me/cat_*)=&## me = setdiff(get(me/##), %0);

    &cmd_[edit(%0, %b, ~)] me =;
    @pemit %#= Help for %ch[capstr(%0)]%cn deleted.

/*
=============================================================================
===== cmd: +help <topic> ====================================================

    SYNTAX: +help <topic>

    This command displays help for a specific topic.
=============================================================================
*/

&textfile hs = +help2
&cmd.+help2 hs = $[/+]help\s+(.*)$:

    [setq(0, get(me/cmd_[edit(%1, %b, ~)]))];

    @pemit %#=  
        [if(
            or(
                strmatch(%q0, 0), 
                not(hasattr(me, cmd_[edit(%1, %b, ~)]))
            ), 
            if( 
                strmatch(setr(1, textfile(v(textfile), %1)), #-*),
                No help found for %ch[ucstr(%1)]%cn., %q1
            ), 
            [repeat(-,width(##))]%r%q0%r[repeat(-,width(##))]
        )]

@set hs/cmd.+help2 = reg

/*
=============================================================================
===== cmd: +help/hide =======================================================

    SYNTAX: +help/hide <topic>

    This command allows an admin to hide a help topic from the chargen system.
=============================================================================
*/

&cmd.+help/hide hs = $+help/hide *:
    @assert orflags(%#, wW) = {
        @pemit %#= You do not have permission to hide help.
    };

    @assert hasattr(me, cmd_[%0]) = {
        @pemit %#= +help topic  %ch[ucstr(%0)]%cn does not exist.
    };

    &hidden me = setunion(get(me/hidden), %0);
    @pemit %#= Help for %ch[ucstr(%0)]%cn hidden.


// +roll [<#d>][vs #d]
&cmd.roll [v(d.cco)] = $[/+@]?roll (\d+)d6?(\s+vs\s+(\d+)d6?)?:
    [setq(0, u(%va/fn.dicelist, iter(lnum(%1), rand(1,6)),iter(lnum(%3), rand(1,6))))];
    @remit loc(%#) = ROLL >> [moniker(%#)] rolls %1d6
        [if(isnum(%3),%bvs %3d6 danger )] 
        for a total of %ch[if(first(%q0), first(%q0), 0)]  
        [switch(1,
            eq(first(%q0), 6), %(success%),
            eq(first(%q0), 5), %(partial success%),
            eq(first(%q0), 4), %(partial success%),
            eq(first(%q0), 3), %(failure%),
            eq(first(%q0), 2), %(failure%),
             %(botch%)
        )]%cn.

@set [v(d.cco)]/cmd.roll = reg



&fn.dicelist cfo=
    trim(
        [setq(0, %0)]
        [iter( %1,
            [setq(0, ldelete(%q0, member(%q0, ##)))]
        )]
        [revwords(sort(%q0))]
    )


// Tear a dungeon down automatically.
&cmd.+dungeon/teardown zpo = $[/+]dungeon\/teardown:
    @assert orflags(%#, wW) = {
        @pemit %#= You do not have permission to tear down the dungeon.
    };

/*

Dungeon Master

This is code that covers the dungeon master system.  Which is responsible
for creating mission grids, assigning missions, handling parties, etc.

It will also cover the active salving system that takes place while clearing
a dungeon.


This will be handled through a time based function that checks a mysql database
for current build requests given by a player.  It will then build the dungeon
and assign it to the player.

+run - 'Run' for supplies and salvage.  This will trigger the dungeon master
to generate a new dungeon for the player to clear.  This will also trigger the
dungeon master to generate a new mission grid for the player to clear.

+recruit <name> - Add players to your run.  This will mark them as being part of a run
for the week.  This will also add them to the party list for the dungeon.

+party - List the players in your party.

*/

think creating SQL table %chdungeons%cn...
think sql(
        CREATE TABLE IF NOT EXISTS dungeons (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY%,
            type VARCHAR(255) NOT NULL%,
            owner VARCHAR(255) NOT NULL%,
            start VARCHAR(255) NOT NULL%,
            code VARCHAR(255) NOT NULL%,
            fufilled INT NOT NULL

        );
    )


&data.types.dungeon gco =   
    grid|
    street|
    pharmacy|
    school|
    warehouse|
    hospital    

&fn.query.insert.dungeon gfo = 
    sql(

        INSERT INTO dungeons (
            type%, 
            owner%, 
            start%, 
            code%,
            fufilled
        ) VALUES (
            '%0'%, 
            '%1'%, 
            '%2'%, 
            '%3'%,
            '%4'
        );

    )


&fn.query.select.dungeon gfo =
    sql(
        select * from dungeons 
        where code = '%0' and fufilled = 0;
    )


&cmd.+gemerate gco = $^[\+@]?generate(\s(.*))?:

    @assert orflags(%#, wW) = {
        @pemit %#= You do not have permission to generate a dungeon.
    };

    @assert sql(select 1) = {
        @pemit %#= Error connecting to database.
    };

    @assert not(hasattr(%#, _generating)) = {
        @pemit %#= You are already generating a dungeon. 
            Type %ch+dungeon/status%cn to check the status.
    };

    [u(%va/fn.query.insert.dungeon, %1, %#, [loc(%#)], [setr(0,pack(secs()))] ,0)];
    @assert words(u(%va/fn.query.select.dungeon, %q0))  = {
        @pemit %#= Error creating dungeon.
    };

    &_generating %#= %q0;
    @pemit %#= Dungeon queued. Code: %ch[ucstr(%q0)]%cn

@set gco/cmd.+gemerate = reg


&cmd.+dungeon/status gco = $^[\+@]?dungeon\/status:
    @assert orflags(%#, wW) = {
        @pemit %#= You do not have permission to check the status of a dungeon.
    };

    @assert sql(select 1) = {
        @pemit %#= Error connecting to database.
    };

    @assert hasattr(%#, _generating) = {
        @pemit %#= You are not currently generating a dungeon.
    };

    [setq(0, u(%va/fn.query.select.dungeon, get(%#/_generating)))]
    [setq(1, extract(%q0, 1, 1))]
    [setq(2, extract(%q0, 2, 1))]
    [setq(3, extract(%q0, 3, 1))]
    [setq(4, extract(%q0, 4, 1))]
    [setq(5, extract(%q0, 5, 1))]
    [setq(6, extract(%q0, 6, 1))];

    @assert words(%q0) = {
        @pemit %#= Error checking dungeon status.
    };

  @pemit %#= Status for dungeon %ch[ucstr(%q5)]%cn is %ch
        [switch(1,
            eq(%q6, 0), %(queued%),
            eq(%q6, 1), %(building%),
            eq(%q6, 2), %(complete%)
        )]%cn.;

@set gco/cmd.+dungeon/status = reg


&traits gdo = 
    acrobat|
    alchemist|
    armor master|
    barfighter|
    beastspeaker|
    berserker|
    blacksmith|
    brawler|
    charismatic|
    cleave|
    dark-fighter|
    defender|
    diehard|
    drunken master|
    dungoneer|
    educated|
    edietic memory|
    familiar|
    fleet of foot|
    healer|
    insightful|
    lucky|
    marksman|
    martial artist|
    nible fingers|
    opportunist|
    perceptive|
    quartermaster|
    quick shot|
    resolute|
    shield bearer|
    sneaky|
    spell reader|
    spell-touched|
    strong|
    survivalist|
    tough|
    tracker|
    trampmaster|
    vigilant


You are basically an intelligent giant, single-celled life form. Your character’s
body is composed of translucent protoplasm (capable of squeezing
through tiny apertures), and it derives sustenance by absorbing whatever
it can. Ameboid characters can breathe equally well underwater as on
land. The character communicates by developing pseudopods capable of
imitating conventional speech organs, and objects are manipulated by
growing tendrils that have the same manual dexterity as an arm and hand.
Blunt and thrown weapons (e.g., rocks, clubs, etc.) do no damage whatsoever
to the character; although acidic, cold, edged, energy-based, fire, and
projectile weapons are effective. Lacking legs, they slither slowly along the
ground and have a maximum speed of 15 feet per turn. Due to their appearance,
a character with this Trait suffers Disadvantage to reaction rolls
when meeting others for the first time.


&desc.acrobat gdo = You gain Advantage to do acrobatic tricks.
&desc.alchemist gdo = You can mix potions and identify them.
&desc.armor~master gdo = 3 extra HP before taking damage. Must be repaired.
&desc.barfighter gdo = Gain one extra action when improvising a weapon.
&desc.beastspeaker gdo = You can speak to animals.

&msg gfo = 
    switch(1,
        strmatch(lcstr(%0), error), %ch%crERROR%cn >>,
        strmatch(lcstr(%0), traits), %ch%cyTRAITS%cn >>,
        strmatch(lcstr(%0), roll), %ch%cyROLL%cn >>,
        %ch[ucstr(%0)]%cn >>
    )

&global.msg gfo = u(#18/msg, %0)

&fn.hastrait gfo = match( get(%0/_traits), [trim(%1)]*, |)
&global.hastrait gfo = u(#18/fn.hastrait, %0, %1)

&fn.istrait gfo = gt(member(get(#15/traits), %0, |),0)
&global.istrait gfo = u(#18/fn.istrait, %0)
&global.WHEADER gfo= [center(%b%0%b, width(%#), = )]
&global.WFOOTER gfo= [repeat(=, width(%#) )]
&global.TITLESTR gfo= %ch%0%cn
&global.WDIVIDER gfo =  [center(%b%0%b, width(%#), - )]

&fn.roll gfo = iter(lnum(%0), die(1,6))
&global.roll gfo = u(#18/fn.roll, %0)

@startup gfo = 
     @dolist lattr( %!/global.* )= @function/preserve [last( ##, . )]= %!/##;
     @dolist lattr( %!/global.priv.* )= @function/preserve/privileged [last( ##, . )]= %!/##;

&cmd.settrait gco = $[/+@]?trait[s]?\s+(.*)\s*=\s*(.*):
    @assert orflags(%#, wW) = {
        @pemit %#= [msg(error)] Permission denied.
    };

    @assert isdbref(pmatch(%1)) = {
        @pemit %#= [msg(error)] I can't find that player.
    };

   @trigger me/tr.traits = %# %1 %2;

@set gco/cmd.settrait = reg


&fn.colordice gfo = 
    iter(%0,
        if(
            gte(##, if(%1, %1, 5)), 
            %ch%cg##%cn, 
            ##
        )
    )


/*
    SYNTAX: trait/add <trait>[/hp][ = <background>]

*/

&cmd.trait/add #14 = $[/+@]?trait[s]?\/add\s+(.*):
    @assert orflags(%#, wW) = {
        @pemit %#= [msg(error)] Permission denied.
    };

    // split the trait and the potential background.
    [setq( 0, before(%1, =))]
    [setq( 1, after(%1,  =))]

    // See if there's a category listed for this trait.
    [setq(2, before(%q0, /))]
    [setq(3, if(after(%q0,  /), after(%q0,  /), 6))];

    // If there's a category, see if it's a valid one.
    @assert  ianum(%q3) = {
        @pemit %#= [msg(error)] Invalid trait category.
    };


    &traits %vb=setunion(get(%vb/traits), %q2, |);
    &trait_cat_%q3 %vb=setunion(get(%vb/trait_cat_%q3), %q2, |);
    &trait_desc_[edit(%q2,%b,~)] %vb=trim(%q1);

    @pemit %#= [msg(traits)] Added trait %q2.

@set #14/cmd.trait/add = reg

/*
    SYNTAX: trait/del <trait>

*/
&cmd.trait/del #14 = $[/+@]?trait[s]?\/del\s+(.*):
    @assert orflags(%#, wW) = {
        @pemit %#= [msg(error)] Permission denied.
    };

    [setq(0, grab(get(%vb/traits), %1*, |))];

    &traits %vb=setdiff(get(%vb/traits), %1, |);
    @dolist lattr(%vb/trait_cat_*)=&## %vb=setdiff(get(%vb/##), %1, |);
    &trait_desc_[edit( %1, %b, ~)] %vb=;

    @pemit %#= [msg(traits)] trait %(%q0%) removed.

@set #14/cmd.trait/del = reg


/*
====== roll =================================================================
    SYNTAX: roll[/flags]

    Roll the game dice. 2d6 by default, with success on a 5 or 6
    on either die. This can be modified with flags.

    FLAGS:
        /advantage    - roll 3d6, success on 5 or 6.
        /disadvantage - roll 3d6, success on 5 or 6.
        /focus        - threshold reduced to 4, 5 or 6.
=============================================================================
*/
&cmd.roll #14 = $[/+@]?roll(\/(.*))?:

    @dolist/delim / %2  = {
        @assert or(
            match(##, dis*),
            match(##, adv*),
            match(##, foc*),
            not(words(##))
        ) = {
            @pemit %#= [msg(error)] Invalid roll type.
        };
    };

    // How many d6?
    [setq(0, 
       switch(1,
            match(%2, adv*, /), 3,
            match(%2, dis*, /), 1,
            2
       )
    )]

    // Roll
    [setq(1, 
        roll(%q0)
    )]
    
    // What's the threshold?
    [setq(2, 
        if( match(%2, foc*, /), 4, 5)
    )]

    // success or failure??
    [setq(3,
        if(
            gte(lmax(%q1), %q2),
            %ch%cgsuccess%cn!,
            %ch%crfailure%cn.
        )
    )];

    @pemit %#= [msg(roll)] [if(lt(%q2,5),%ch%ch%cc-focus-%cn%cn%b)][moniker(%#)] rolls %ch[%q0]d6%cn 
        %([u( %va/fn.colordice, %q1, %q2 )]%) for a %q3
       

@set gco/cmd.roll = reg

&cmd.damage #14 = $[/+@]?da[mage]+(\/(\w+))?:
    @assert or(
        strmatch(lcstr(%2), li*),
        strmatch(lcstr(%2), he*),
        not(words(%2))
    ) = {
        @pemit %#= [msg(error)] Invalid damage type.
    };
    
    [setq(0,
        if(
            strmatch(lcstr(%2), li*),
            add(rand(1, 2),1),
            add(rand(1, 3),1)
        )
    )];

    [setq(1,
        switch(1,
            strmatch(lcstr(%2), li*), light,
            strmatch(lcstr(%2), he*), heavy,
            light
        )
    )];
    
    @pemit %#= [msg(damage)] [moniker(%#)] rolls %ch%q0%cn damage%(%).;
    
    
@set #14/cmd.damage = reg



&cmd.cg/set #14 = $[/+@]?cg/set\s+(.*)\s*=\s*(.*):
    
    @switch 1 = 
        strmatch(lcstr(%1), trait*), {@tr me/tr.traits = %#, %#,  %2},
        { @pemit %#= [msg(error)] Invalid cg/set command. }

@set #14/cmd.cg/set = reg

&tr.traits #14 = 
     @dolist/delimit , %2 = {
        @if member(u(%vb/traits), if(words(after(##,!)), after(trim(##), !), trim(##)), |) = {
            @if regmatch(##, !(.*), 0) = {
                &_traits %0 = [setdiff(get(%1/_traits), [lcstr(after(%q0,!))],|,|)];
                @pemit %0 = [msg(traits)] %ch[after(%q0,!)]%cn removed from [moniker(%0)].
            }, {
                &_traits %0 = [setunion(get(%1/_traits), [lcstr(##)],|,|)];
                @pemit %0 = [msg(traits)] %ch##%cn added to [moniker(%0)].
            };
        }, {
            @pemit %0= [msg(error)] Trait %(%ch[lcstr(##)]%cn%) is not valid.
        };
    };
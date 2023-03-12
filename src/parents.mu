@create Global Function Object <GFO>
@set Global Function Object <GFO>=inherit safe
@fo me=&d.gfo me=[search( name=Global Function Object <GFO> )]

@startup gfo = 
    @dolist lattr( %!/ufunc.* )=@function/preserve [rest( ##, . )]= %!/##; 
    @dolist lattr( %!/ufunc/privileged.* )=@function/preserve/privileged [rest( ##, . )]=%!/##

&ufunc.wheader [v(d.gfo)] = [center(%b%0%b, width(%#), = )]
&ufunc.wfooter [v(d.gfo)] = 
    [if(
        words(%0), 
        center(%b%0%b, width(%#), = ), 
        repeat(=, width(%#) )
    )]
&ufunc.wdivider [v(d.gfo)] = [center(%b%0%b, width(%#), - )]
&ufunc.titlestr [v(d.gfo)] = %ch%0%cn


/*
===============================================================================
====== @nameformat ============================================================
*/
@nameformat #11= 
    [wheader(
        %ch[if(not(hasflag(%!, IC )), %(OOC Area%)%b)]
        [first(name(%!),-)][if(orflags(%#, wWZ), %(%![flags(%!)]%)  )]
        //[if( not(strmatch(zone(%!), #-1)), %b-%b%cm[after(name(zone(%!)),-)])]%cn
    )]
/*
===============================================================================
====== @conformat  ============================================================
*/
@conformat #11=    
    [if(
        or( not(hasflag(%!, dark)), orflags(%#,wWZ) ),
        [wdivider(%chCharacters%cn)]
        [iter(
            lcon(%!, CONNECT),
            %r[ljust(moniker(##),25)]
            [rjust(
                [switch(1,
                    lte(idle(##), mul(60,10)), %ch%cg[singletime(idle(##))]%cn,
                    lte(idle(##), mul(60,15)), %ch%cy[singletime(idle(##))]%cn,
                    lte(idle(##), mul(60,30)), %ch%cr[singletime(idle(##))]%cn,
                    %ch%ch%cx[singletime(idle(##))]%cn
                )], 5 
            )]%b%b
            [ljust(
                default(
                    ##/short-desc, 
                    %ch%cxUse &short-desc me=<desc> to set this.%cn
                ),
                sub(width(%#), 34)
            )]
        )]
    )]
    [if(
        not(words(lexits(%!))),
        %r[wfooter()]    
    )]

/*
===============================================================================
====== @descformat ============================================================
*/
@descformat #11= %r%0%r

/*
===============================================================================
====== @exitformat ============================================================
*/
@exitformat #11= 
    [if(words(
        setr(0,iter(
                lexits(%!),
                
                if(
                    not(hasattr(##, street)),
                    if(hasflag(##, dark),
                        if(orflags(%#,wWZ), u(.fullname, ##) ),
                        u(.fullname, ##)   
                    )   
                ),,|
            )),|
    ), 
        [wdivider(%chExits%cn)]%r
        [table(trim(squish(%q0),,|), sub(div(width(%#),2),1), sub(width(%#),1),|)]
    )]
    [if(
        words(
            setr(1,iter(
                lexits(%!),
                
                if(
                    hasattr(##, street),
                    if(hasflag(##, dark),
                        if(orflags(%#,wWZ), u(.fullname, ##) ),
                        u(.fullname, ##)   
                    )   
                ),,|
            )),|
       ), 
        %r[wdivider(%chDirections%cn)]%r
        [table(trim(squish(%q1,|),,|), sub(div(width(%#),2),1), sub(width(%#),1),|)]
    )]
    [wfooter()]


&.fullname #11=
    [if(not(hasflag(%0, dark)),
        [if(words( after( fullname(%0), ; ), ; ),
            <%ch[ucstr(first(after(fullname(%0),;), ;)) ]%cn>%b
        )]
        [first(fullname(%0), ;)],
        %ch%cx[if(words( after( fullname(%0), ; ), ; ),
            <[ucstr(first(after(fullname(%0),;), ;)) ]>%b
        )]
        [first(fullname(%0), ;)]%cn
    )]
    
@Create Global Player Parent <GPO>
@set gpo = safe

@descformat #96= [default([loc(me)]/exterior,%0)]
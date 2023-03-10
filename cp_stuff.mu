

@startup gfo=
    @dolist lattr( %!/ufunc.* )=@function/preserve [rest( ##, . )]= %!/##; 
    @dolist lattr( %!/ufunc/privileged.* )=@function/preserve/privileged [rest( ##, . )]=%!/##;
    @dolist lattr(me/global.pre.*)=@function after(##, GLOBAL.PRE.)=me/##;

&fn.expld6 gfo = 
    if( eq( setr(0, rand(1,6)),6), u(fn.expld6), %q0)


&fn.roll gfo = 
    [setq(0, rand(1,6))]
    [setq(1, rand(1,6))]
    [setq(2, rand(1,6))]
    [if(
        strmatch(lcstr(%0), gl*),
        setq(3, sort(%q0 %q1 %q2)),
        if(
            strmatch(lcstr(%0), up*),
            setq(3, revwords(sort(%q0 %q1 %q2))),
            setq(3, %q0 %q1)
        )      
    )]
    [if(strmatch( extract(%q3, 1, 2) ,6 6),
        ladd([extract(%q3, 1, 2)] [ulocal(fn.expld6)]),
        ladd(extract(%q3,1,2))
    )]


&global.pre.roll gfo = ulocal(#15/fn.roll, %0)


// +roll[/flag] vs <DS>[ = <bonus>]

&cmd.roll gco=$[\\+@]?roll(\/(.*)\s+)?(.*)?:   
    [setq(0, before(%3, ds))]
    [setq(1,  after(%3, ds))];
    [setq(3,
        switch(1,
            strmatch(lcstr(%2), dis*), disadvantage,
            strmatch(lcstr(%2), ad*), advantage
        )
    )]
    [setq(4, roll(%q3))]
    [setq(5, edit(%q0, +, %b, -, %b-))];
    [setq(6, ladd(%q0 %q4))]

    @pemit %#= GAME>> %q6

@set gco/cmd.roll = reg 



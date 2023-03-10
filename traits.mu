@create Global Command Object <GCO>
@set gco = inherit safe

&cmd.traits gco = $[\\+@]?traits\s+(.*)\s*=\s*(.*):

    @assert orflags(%#, wW) = { @pemit %#= Permission denied. };

    @dolist/delim | %2 = {
        @if strmatch(##, !*) = {
            &_traits *%1 = setdiff(get(*%1/_traits), after(##, !), |);
            @pemit %#= Trait %ch[lcstr(after(##, !))]%cn removed from [moniker(%1)].;
        }, {
            &_traits *%1 = setunion(get(*%1/_traits), ##, |);
            @pemit %#= Trait %ch[lcstr(##)]%cn added to [moniker(%1)].;
        }
    };

@set gco/cmd.traits = reg
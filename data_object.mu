@create Chargen Data Object <CDO>
@tag/add cdo = lastcreate(me, t)
@set #cdo = safe indestructable


&attribute.strength #cdo = 1.2.3.4.5.6.7.8.9.10
&attribute.dexterity #cdo = 1.2.3.4.5.6.7.8.9.10
&attribute.stamina #cdo = 1.2.3.4.5.6.7.8.9.10
&attribute.charisma #cdo = 1.2.3.4.5.6.7.8.9.10
&attribute.manipulation #cdo = 1.2.3.4.5.6.7.8.9.10
&attribute.composure #cdo = 1.2.3.4.5.6.7.8.9.10
&attribute.intelligence #cdo = 1.2.3.4.5.6.7.8.9.10
&attribute.wits #cdo = 1.2.3.4.5.6.7.8.9.10
&attribute.resolve #cdo = 1.2.3.4.5.6.7.8.9.10

&attribute.strength.default #cdo = 1
&attribute.dexterity.default #cdo = 1
&attribute.stamina.default #cdo = 1
&attribute.charisma.default #cdo = 1
&attribute.manipulation.default #cdo = 1
&attribute.composure.default #cdo = 1
&attribute.intelligence.default #cdo = 1
&attribute.wits.default #cdo = 1
&attribute.resolve.default #cdo = 1



&advantage.bloodpotency #cdo = 1.2.3.4.5.6.7.8.9.10
&default.bloodpotency #cdo = 0



&bio.fullname #cdo = *
&bio.concept #cdo = *
&bio.teplate #cdo = Human.Ghoul.Vampire






//test
&bio.fullname #cdo = "test"

@create Chargen Command Object <CCO>
@tag/add cco = lastcreate(me, t)
@set #cco = safe indestructable



&cmd.stat/set #cco = $[@/+]?stat\/set\s+(.*)\/(.*)\s*=\s*(.*)?:
    @assert
        or(
          orflags(%#, iW),
          strmatch(lcstr(%1) , me)  
        )  = {  @pemit %#=Permission denied. }


    // Check to see if it's a valid attribute

    // Check to make sure it's a valid value

    // Set the value!




.



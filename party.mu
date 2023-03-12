/*
=============================================================================
    Party System

    This is a simple party system that allows players to invite other
    players to their party. It also allows players to accept party invites
    from other players.  Being in a party allows you to go on supply raids
    and hunts together.

    Requirements:

    - MUX 2.8.0 or later

    The folling commands are available:
    
    +recruit <name> - recruit a player to your party.
    +recruit/accept - accept a party invite.
    +party - show your party members.
*/

&cmd.recruit gco = $^[@\+]?recruit\s+(.*)$:

    // make sure the party they want to invite is a player
    @assert hasflag(%#, connected) = {
        @pemit %#= You can only invite a connected player.
    }

    // make sure they're not already in a party
    @assert not(hasattr(*%1, _isparty)) = {
        @pemit %#= They aren't available to be invited.
    }

    @pemit *%1 = [moniker(%#)] has invited you to join their party. 
        Type +recruit/accept to join.
    
    &_invited *%1 = %#;

    // The invited player has 60 seconds to approve, or the invite is
    // automatically rejected.

    @wait 60 = {
        @assert hasattr(*%1, _party) = {
            @pemit %#= The invite to [moniker(*%1)] has expired.;
            @pemit *%1 = [moniker(%#)]'s invite has expired.;
            &_invited *%1 =;
        }
    }

@set gco/cmd.recruit = reg



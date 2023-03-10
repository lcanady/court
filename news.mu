/*
#############################################################################
#### News/Help System #######################################################

    This is a news/help system that uses a database to store the articles.
    It is designed to be used with the help system, but can be used for
    other things as well.  I  wrote my queries to work with Strapi.io, but
    they should work with any database that supports MySQL queries.
    Some updates may be needed to make it work with other codebases.

    1.  Make sure you have SQL compiled in your MUX.  Check the INSTALL
        document for more information and create your databaase!
    
    2.  Edit your netmux.conf with your mysql connection informtion 
        following the directions in INSTALL and SQL.

    3. Install this code.

    This is a work in progress, and is not yet complete.
#############################################################################
*/

@create Global News System <GNS>
@set gns = inherit trace

@startup gns = 
    @dolist lattr(me/global.fn.*)= @function after(##, GLOBAL.FN.)= me/##;

/*

Database QUERIES

=============================================================================
==== fn.query.categories ====================================================

    Returns a list of categories from the database.
=============================================================================
*/
&fn.query.categories gns= sql(SELECT DISTINCT category from newsfiles,,|)

&global.fn.categories gns= u(#15/fn.query.categories)
&fn.timefmt news = timefmt($F $R:$S.00000000,%0)

/*
=============================================================================
==== fn.query.article =======================================================

    Returns an article from the database.

    Parameters:
        %0 - Slug
=============================================================================
*/
&fn.query.article news = 
    sql(
        SELECT 
            slug%, 
            editor%,
            author%, 
            body%, 
            updated_at%,
            title %,
            category%,
            featured%,
            hidden 
        FROM newsfiles WHERE slug RLIKE '[lcstr(%0)]%%';,~,|
    )

/*
=============================================================================
==== fn.query.save.article ==================================================

    Saves an article to the database.

    Parameters:
        %0 - Slug
        %1 - Title
        %2 - Body
        %3 - Category
        %4 - Editor
        %5 - Author
=============================================================================
*/
&fn.query.save.article news = 
    sql(
        INSERT INTO newsfiles (
            slug%,  
            title%, 
            body%, 
            category%, 
            editor%, 
            author%, 
            featured%, 
            hidden%, 
            updated_at%, 
            created_at 
        ) 
        VALUES ( 
            '[edit(%0, %b,-)]'%,
            '%0'%,
            '%1'%,
            '%2'%,
            '%3'%,
            '%4'%,
            '%5'%,
            '%6'%,
            '[u(fn.timefmt, secs())]'%,
            '[u(fn.timefmt, secs())]'
        );
    )

&fn.slug news = edit(%0, !,%b, %,,%b,%b,-)


&fn.query.name.by.category news = 
    sql(
        SELECT slug%,
            featured%,
            hidden 
        FROM newsfiles 
        WHERE LOWER(category) RLIKE '%0%%';,~,|
    ) 

&fn.query.update.article news = 
    sql(
        UPDATE newsfiles SET 
            slug = '[u(fn.slug, %0)]'%, 
            title = '%1'%, 
            body = '%2'%, 
            category = '%3'%, 
            editor = '%4'%,
            featured = '%5'%,
            hidden = '%6'%, 
            updated_at = '[u(fn.timefmt, secs())]'  
        WHERE slug RLIKE '[lcstr(edit(%0, %b,-))]%%';
    )

&global.fn.article news = u(#15/fn.query.article, %0)

&cmd.news/add news = $^[\+@]?news\/add\s+(.*)\s*=\s*([\s\S]+):
    @assert orflags(%#,wW) = { @pemit %#= Permission denied. };
    @assert sql(select 1) = { @pemit %#= Database is not connected. };

    @assert words(%1) = { @pemit %#= You must specify a title. };
    @assert words(%2) = { @pemit %#= You must specify a body. };

    [setq(0, before(%1, /))]
    [setq(1, after(%1, /))];
    [setq(2, edit(%1, %b, -))]
    [setq(3, if(%q1, %q1, General))];

    @assert [not(words(u(fn.query.article, edit(%q0,%b,-))))] = {
        @pemit %#= Article already exists. Use %chnews/edit%cn to edit it.
    };

    [u(fn.query.save.article, %q0, %2, %q3, name(%#), name(%#),0,0)];

    @assert [u(fn.query.article, edit(%q0,%b,-))] = {
        @pemit %#= Article failed to save.
    };

    @pemit %#= Article %ch[%q0]%cn saved.

@set gns/cmd.news/add = reg


&cmd.news/edit news = $^[\+@]?news\/edit\s+(.*)\s*=\s*([\s\S]+):
    @assert orflags(%#,wW) = { @pemit %#= Permission denied. };
    @assert sql(select 1) = { @pemit %#= Database is not connected. };

    @assert words(%1) = { @pemit %#= You must specify a title. };
    @assert words(%2) = { @pemit %#= You must specify a body. };

    [setq(0, before(%1, /))]
    [setq(1, after(%1, /))]
    [setq(2, edit(%1, %b, -))]
    [setq(3, if(%q1, %q1))];


    @assert [words(setr(4, u(fn.query.article, edit(%q0,%b,-))))] = {
        @pemit %#= Article doesn't exist.  Use %chnews/add%cn to create it.
    };

    [u(
        fn.query.update.article,  
        %q0, 
        extract(%q4,6,1,|),
        %2, 
        if(%q3,%q3,extract(%q4,7,1,|)), 
        name(%#),
        extract(%q4,8,1,|),
        extract(%q4,9,1,|)
    )];
    
    @pemit %#= Article %ch[extract(%q4,6,1,|)]%cn updated.

@set gns/cmd.news/edit = reg

&cmd.news.edit.title news = $^[\+@]?news\/title\s+(.*)\s*=\s*(.*):
    @assert orflags(%#,wW) = { @pemit %#= Permission denied. };
    @assert sql(select 1) = { @pemit %#= Database is not connected. };

    @assert words(%1) = { @pemit %#= You must specify a source. };
    @assert words(%2) = { @pemit %#= You must specify a replacement title. };

    @assert [words(setr(0, u(fn.query.article, edit(%1,%b,-))))] = {
        @pemit %#= Article doesn't exist.  Use %chnews/add%cn to create it.
    };

    [setq(1, extract(%q0,1,1,|))]
    [setq(2, extract(%q0,2,1,|))]
    [setq(3, extract(%q0,3,1,|))]
    [setq(4, extract(%q0,4,1,|))]
    [setq(5, extract(%q0,5,1,|))]
    [setq(6, extract(%q0,6,1,|))]
    [setq(7, extract(%q0,7,1,|))]
    [setq(8, extract(%q0,8,1,|))]
    [setq(9, extract(%q0,9,1,|))]
    [u(fn.query.update.article, %q1, %2, %q4, %q7, name(%#), %q8, %q9)];
    
    @pemit %#= Article %ch[%2]%cn updated.

@set gns/cmd.news.edit.title = reg

&cmd.news news = $^[\+@]?news$:
    [setq(0, categories())];
    @assert sql(SELECT 1) = { @pemit %#= Database is not connected. };
    @pemit %# = [wheader(%chNEWS%cn)]
        [iter(
            %q0, 
            %r[wdivider(%ch##%cn)]%r
            [table(
                 iter(
                    sort(u(fn.query.name.by.category, ##),i,~,~),
                    [if([extract(itext(),2,1,|)],%ch%cr*%cn)]
                    [extract(itext(),1,1,|)], ~, ~
                 ), div(width(%#),3), width(%#), ~)]
        )]
        
        %r[wfooter(Use '%ch+news <article>%cn' to view an article )]

@set gns/cmd.news = reg

&cmd.news2 news = $^[@\+]?news\s+(.*)$:
    [setq(0, article(%1))]
    [setq(1, extract(%q0, 1, 1, |))]
    [setq(2, extract(%q0, 2, 1, |))]
    [setq(3, extract(%q0, 3, 1, |))]
    [setq(4, extract(%q0, 4, 1, |))]
    [setq(5, extract(%q0, 5, 1, |))]
    [setq(6, extract(%q0, 6, 1, |))];
    
    @if words(%q3) = {
        @pemit %#= [wheader(%chNEWS: [%q6]%cn)]%r%r%q4%r%r
        [wdivider(
            %chLast update by 
                [moniker(if(words(%q2),%q3,%q3))] on 
                [timefmt($m/$d/$Y, convtime(%q5))]%cn
        )]%r
        [wfooter()]
    }, {
        @pemit %#= I can't find that news article.
    };

@set gns/cmd.news2 = reg
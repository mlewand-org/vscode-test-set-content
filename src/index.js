const vscode = require( 'vscode' ),
    execall = require( 'execall' );

/**
 * Returns a promise that will provide a tet editor with given `content`.
 *
 * @param {String} content
 * @param {Object} [options] Config object.
 * @param {String} [options.language='text'] Indicates what language should the editor use.
 * @returns {Promise<TextEditor>}
 */
function setContent( content, options ) {
    options = options || {
        language: 'text'
    };

    return vscode.workspace.openTextDocument( {
            language: options.language
        } )
        .then( doc => vscode.window.showTextDocument( doc ) )
        .then( editor => {
            let editBuilder = textEdit => {
                textEdit.insert( new vscode.Position( 0, 0 ), String( content ) );
            };

            return editor.edit( editBuilder, {
                    undoStopBefore: true,
                    undoStopAfter: false
                } )
                .then( () => editor );
        } );
}

function* readLines( content ) {
    let newLineRegexp = /\r\n?|\n/gm,
        curOffset = 0,
        lastLineMatch;

    while ( ( lastLineMatch = newLineRegexp.exec( content ) ) !== null ) {
        yield content.substring( curOffset, lastLineMatch.index );
        curOffset = lastLineMatch.index + lastLineMatch[ 0 ].length;
    };

    if ( curOffset < content.length ) {
        yield content.substring( curOffset );
    }
}

/**
 * Extracts selections and markerless content out of given `inContent`.
 *
 * @private
 * @param {String} inContent Input content with selection markers.
 * @returns {Object} ret
 * @returns {String} ret.content Content without selection-specific markers.
 * @returns {Selection[]} ret.selections Selections picked from `inContent`.
 */
setContent._extractSelections = function( inContent ) {
    let selections = [],
        ret = {
            content: '',
            selections: selections
        };

    let collapsedRegexp = /\^/gm,
        updatedContent = '',
        lineNumber = -1;

    for ( let line of readLines( inContent ) ) {
        let matches = execall( collapsedRegexp, line );

        lineNumber += 1;

        if ( lineNumber > 0 ) {
            // So far unix style line ending only.
            updatedContent += '\n';
        }

        if ( matches && matches.length ) {
            updatedContent += matches.reduce( ( accumulator, curMatch, curIndex, array ) => {
                // Basically what we're doing here is:
                // for n we're adding part from **after** n.index till n+1.index (excluding char matched at n).
                // For last iteration we want to match all the way to the end of string, thus undefined.
                let nextPartStart = curMatch.index + curMatch.match.length,
                    nextPartEnd = curIndex === array.length - 1 ? undefined : array[ curIndex + 1 ].index,
                    // Current accumulated length, is the position of caret in updatedContent.
                    pos = new vscode.Position( lineNumber, accumulator.length );

                selections.push( new vscode.Selection( pos, pos ) );

                return accumulator + line.substring( nextPartStart, nextPartEnd );
            }, line.substr( 0, matches[ 0 ].index ) );
        } else {
            updatedContent += line;
        }
    }

    ret.content = updatedContent;

    return ret;
};

setContent.withSelection = function( content, options ) {

    let parsedContent = setContent._extractSelections( content );

    return setContent( parsedContent.content, options )
        .then( editor => {
            if ( parsedContent.selections.length ) {
                // Set the selections only if we picked some, it's not recommended to set editor.selections to an
                // empty array.
                editor.selections = parsedContent.selections;
            }

            // Make the selections.
            return editor;
        } );
};

module.exports = setContent;
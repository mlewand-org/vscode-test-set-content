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
        firstIteration = true;

    for ( let line of readLines( inContent ) ) {
        let matches = execall( collapsedRegexp, line );

        if ( firstIteration ) {
            firstIteration = false;
        } else {
            // So far unix style line ending only.
            updatedContent += '\n';
        }

        if ( matches && matches.length ) {
            updatedContent += matches.reduce( ( accumulator, curMatch, curIndex, array ) => {
                // Basically what we're doing here is:
                // for n we're adding part from **after** n.index till n+1.index (excluding char matched at n).
                // For last iteration we want to match all the way to the end of string, thus undefined.
                let nextPartStart = curMatch.index + curMatch.match.length,
                    nextPartEnd = curIndex === array.length - 1 ? undefined : array[ curIndex + 1 ].index;

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
    return setContent( content, options )
        .then( editor => {
            // Make the selections.
            return editor;
        } );
};

module.exports = setContent;
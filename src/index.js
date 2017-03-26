const vscode = require( 'vscode' ),
    execall = require( 'execall' ),
    clone = require( 'clone' );

/**
 * Returns a promise that will provide a tet editor with given `content`.
 *
 * @param {String} content
 * @param {Object} [options] Config object.
 * @param {String} [options.language='text'] Indicates what language should the editor use.
 * @param {String} [options.caret='^'] Character used to represent caret (collapsed selection).
 * @param {Object} [options.anchor]
 * @param {String} [options.anchor.start='['] Selection anchor open character.
 * @param {String} [options.anchor.end=']'] Selection anchor close character.
 * @param {Object} [options.active]
 * @param {String} [options.active.start='{'] Selection active part open character.
 * @param {String} [options.active.end='}'] Selection active part close character.
 * @returns {Promise<TextEditor>}
 */
function setContent( content, options ) {
    options = getOptions( options );

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

function getOptions( inOptions ) {
    inOptions = clone( inOptions ) || {};

    inOptions.caret = inOptions.caret || '^';

    inOptions.language = inOptions.language || 'text';

    inOptions.anchor = inOptions.anchor || {
        start: '[',
        end: ']'
    };

    inOptions.active = inOptions.active || {
        start: '{',
        end: '}'
    };

    return inOptions;
}

/**
 * Extracts selections and markerless content out of given `inContent`.
 *
 * @private
 * @param {String} inContent Input content with selection markers.
 * @param {Object} options Options as passed to `setContent` method.
 * @returns {Object} ret
 * @returns {String} ret.content Content without selection-specific markers.
 * @returns {Selection[]} ret.selections Selections picked from `inContent`.
 */
setContent._extractSelections = function( inContent, options ) {
    options = getOptions( options );

    let selections = [],
        ret = {
            content: '',
            selections: selections
        };

    let selectionMarkers = [
            options.caret,
            options.active.start,
            options.active.end,
            options.anchor.start,
            options.anchor.end
        ],
        collapsedRegexp = new RegExp( selectionMarkers.map( ch => '\\' + ch ).join( '|' ), 'gm' ),
        updatedContent = '',
        lineNumber = -1,
        // An array of { pos: Position, anchor: Boolean } objects.
        unbalancedRangeOpenings = [],
        // A mapping of handling methods to a given marker.
        markerHandlers = {
            [ options.caret ]: pos => selections.push( new vscode.Selection( pos, pos ) ),
            [ options.anchor.start ]: pos => unbalancedRangeOpenings.push( { pos: pos, anchor: true } ),
            [ options.active.start ]: pos => unbalancedRangeOpenings.push( { pos: pos, anchor: false } ),
            [ options.anchor.end ]: pos => {
                if ( !unbalancedRangeOpenings.length ) {
                    return;
                }

                let matchedOpening = unbalancedRangeOpenings.shift();

                selections.push( new vscode.Selection( pos, matchedOpening.pos ) );
            },
            [ options.active.end ]: pos => {
                if ( !unbalancedRangeOpenings.length ) {
                    return;
                }

                let matchedOpening = unbalancedRangeOpenings.shift();

                selections.push( new vscode.Selection( matchedOpening.pos, pos ) );
            }
        };

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

                markerHandlers[ curMatch.match ]( pos );

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
    options = getOptions( options );

    let parsedContent = setContent._extractSelections( content, options );

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
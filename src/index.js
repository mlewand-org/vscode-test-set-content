let vscode = require( 'vscode' );

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
            language: 'text'
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

    ret.content = inContent;

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
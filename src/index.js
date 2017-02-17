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
            return editor;
        } );
}

setContent.withSelection = function( content, options ) {};

module.exports = setContent;
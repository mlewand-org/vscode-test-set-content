
# vscode-test-set-content

Provides a set of helper functions for setting the content of the Visual Studio Code instance.

## Usage

```
const vscode = vscode = require( 'vscode' ),
    setContent = require( 'vscode-set-content' );

setContent( 'Fancy content!' )
    .then( textEditor => {
        assert.equal( textEditor.document.lineAt( 0 ).text, 'Fancy content!' );
    } );
```

Or set editor with a selection:

```
const vscode = vscode = require( 'vscode' ),
    setContent = require( 'vscode-set-content' );

setContent.withSelection( 'Fancy [content}!' )
    .then( textEditor => {
        assert.equal( textEditor.document.lineAt( 0 ).text, 'Fancy content!' );
		assert.equal( false, textEditor.selection.isEmpty );
    } );
```
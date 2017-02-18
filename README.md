
# vscode-test-set-content [![Build Status](https://travis-ci.org/mlewand-org/vscode-test-set-content.svg?branch=master)](https://travis-ci.org/mlewand-org/vscode-test-set-content)

Provides a set of helper functions for setting the content of the Visual Studio Code instance.

## Usage

```javascript
const vscode = vscode = require( 'vscode' ),
    setContent = require( 'vscode-set-content' );

setContent( 'Fancy content!' )
    .then( textEditor => {
        assert.equal( textEditor.document.lineAt( 0 ).text, 'Fancy content!' );
    } );
```

Setting the content with a collapsed selection (`^`):

```javascript
const vscode = vscode = require( 'vscode' ),
    setContent = require( 'vscode-set-content' );

setContent.withSelection( 'Put a collapsed selection here ^' )
    .then( textEditor => {
        assert.strictEqual( textEditor.document.lineAt( 0 ).text, 'Put a collapsed selection here ' );
        assert.equal( textEditor.selection.isEmpty, true );
        assert.equal( textEditor.selection.start.character, 31 );
    } );
```

Setting the content with a ranged selection (`[`, `]`, `{`, `}`):

```javascript
setContent.withSelection( 'Fancy [content}!' )
    .then( textEditor => {
        assert.equal( textEditor.document.lineAt( 0 ).text, 'Fancy content!' );
        assert.equal( textEditor.selection.isEmpty, false );
        assert.equal( textEditor.selection.start.character, 6 );
        assert.equal( textEditor.selection.end.character, 13 );
        assert.strictEqual( textEditor.selection.active, textEditor.selection.end );
    } );
```

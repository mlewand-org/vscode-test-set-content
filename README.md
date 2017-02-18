
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

## Markers

* Collapsed:
    * `^` - Simply marks where the selection caret should be.
* Ranged:
    * `[`, `]` - Marks where selection _anchor_ opening or close should be. Anchor is a position where the selection was started.
    * `{`, `}` - Marks where selection _active_ opening or close should be.

        Active part is the part where the selection ended, and it's the point from which the selection is continued from if you continue to enlarge the selection.

## Limitations

* Nested and intersecting ranges are not handled, since those are not handled in VSCode itself as of version 1.9.1.

## Related

If you need to easily get your content with or without selection, be sure to check [vscode-test-get-content](https://www.npmjs.com/package/vscode-test-get-content) package.
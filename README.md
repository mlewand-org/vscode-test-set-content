
# vscode-test-set-content [![Build Status](https://travis-ci.org/mlewand-org/vscode-test-set-content.svg?branch=master)](https://travis-ci.org/mlewand-org/vscode-test-set-content)

Provides a set of helper functions for setting the content of the Visual Studio Code instance.

## Usage

```javascript
const setContent = require( 'vscode-test-set-content' );

setContent( 'Fancy content!' )
    .then( textEditor => {
        assert.equal( textEditor.document.lineAt( 0 ).text, 'Fancy content!' );
        // You'd want to continue your assertions here.
    } );
```

Setting the content with a collapsed selection (`^`):

```javascript
setContent.withSelection( 'Put a collapsed selection here ^' )
    .then( textEditor => {
        // Sets editor's content to "Put a collapsed selection here " and puts a collapsed selection at the end.
    } );
```

Setting the content with a ranged selection (`[`, `]`, `{`, `}`):

```javascript
setContent.withSelection( 'Fancy [content}!' )
    .then( textEditor => {
        // Now you have textEditor with "Fancy content!", where "content" word is selected.
    } );
```

## Markers

* Collapsed:
  * `^` - Simply marks where the selection caret should be.
* Ranged:
  * `[`, `]` - Marks where selection _anchor_ opening or close should be. Anchor is a position where the selection was started.
  * `{`, `}` - Marks where selection _active_ opening or close should be.

        Active part is the part where the selection ended, and it's the point from which the selection is continued from if you continue to enlarge the selection.

### Customizing Markers

If the default markers collide with your use case, you can customize it.

```javascript
const setContent = require( 'vscode-test-set-content' );

setContent.withSelection( 'let 🦄foo = () => { 🍕return🚒 []; };', {
        caret: '🦄',
        anchor: {
            start: '🍕',
            end: '🙈'
        },
        active: {
            start: '🤦',
            end: '🚒'
        }
    } )
    .then( textEditor => {
        // Sets editor content to "let foo = () => { return []; };" with caret before "foo", and "return" selected.
    } );
```

## Limitations

* Nested and intersecting ranges are not handled, since those are not handled in VSCode itself as of version 1.9.1.

## Related

If you need to easily get your content with or without selection, be sure to check [vscode-test-get-content](https://www.npmjs.com/package/vscode-test-get-content) package.
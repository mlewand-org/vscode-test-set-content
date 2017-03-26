/* global suite, test */
( function() {
    "use strict";

    const assert = require( 'assert' ),
        vscode = require( 'vscode' ),
        setContent = require( '../src' ),
        getContent = require( 'vscode-test-get-content' );

    suite( 'setContent', () => {
        test( 'It returns a valid type', function() {
            let ret = setContent( 'foo' );

            assert.strictEqual( ret && ret.then instanceof Function, true, 'Thenable value returned' );

            return ret;
        } );

        test( 'It resolves to valid value', function() {
            return setContent( 'foo' )
                .then( editor => {
                    // I don't know reliable way to check TS instance, without having the TextEditor class
                    // exposed by vscode namespace, so... duck typing FTW );
                    assert.equal( !!editor.document, true, 'Editor has document' );
                    assert.equal( !!editor.options, true, 'Editor has options' );
                } );
        } );

        test( 'It sets given single line content', function() {
            return setContent( 'foo bar' )
                .then( editor => {
                    assert.strictEqual( 'foo bar', getContent( editor ), 'Editor has invalid value' );
                } );
        } );

        test( 'It sets given multiline content', function() {
            return setContent( 'foo bar\nbaz\n\t bom' )
                .then( editor => {
                    assert.strictEqual( 'foo bar\nbaz\n\t bom', getContent( editor ), 'Editor has invalid value' );
                } );
        } );

        suite( 'setContent.withSelection', () => {
            suite( 'Collapsed', function() {
                test( 'It sets the content', function() {
                    return setContent.withSelection( 'foo' )
                        .then( editor => assert.strictEqual( getContent( editor ), 'foo', 'Invalid content' ) );
                } );

                test( 'It sets a collapsed selection', function() {
                    return setContent.withSelection( 'fo^o' )
                        .then( editor => {
                            let sel = editor.selection,
                                startPosition = sel.start;

                            assert.strictEqual( sel.isEmpty, true, 'Selection is not empty' );
                            assert.strictEqual( startPosition.line, 0, 'Invalid start.line' );
                            assert.strictEqual( startPosition.character, 2, 'Invalid start.character' );

                            assert.strictEqual( getContent( editor ), 'foo', 'Invalid content' );
                        } );
                } );

                test( 'It sets multiple collapsed selections multiline', function() {
                    let content = 'a^a^\n\n^\n^foo^\nbar';

                    return setContent.withSelection( content )
                        .then( editor => {
                            assert.strictEqual( getContent( editor ), 'aa\n\n\nfoo\nbar', 'Invalid content' );
                            assert.strictEqual( getContent.withSelection( editor ), content, 'Invalid content with selection' );
                        } );
                } );
            } );

            test( 'integration', function() {
                let content = '^foo{ ba]r\nb[az\nb}o^m^';

                return setContent.withSelection( content )
                    .then( editor => {
                        assert.strictEqual( getContent( editor ), 'foo bar\nbaz\nbom', 'Invalid content' );
                        assert.strictEqual( getContent.withSelection( editor ), content, 'Invalid content with selection' );
                    } );
            } );
        } );

        suite( 'Ranged', function() {
            test( 'It sets ranged selection', function() {
                let content = 'f[oo}';

                return setContent.withSelection( content )
                    .then( editor => {
                        assert.strictEqual( getContent( editor ), 'foo' );
                        assert.strictEqual( getContent.withSelection( editor ), content, 'Invalid content with selection' );
                    } );
            } );

            test( 'It sets reversed ranged selection', function() {
                let content = 'f{oo]';

                return setContent.withSelection( content )
                    .then( editor => {
                        assert.strictEqual( getContent( editor ), 'foo' );
                        assert.strictEqual( getContent.withSelection( editor ), content, 'Invalid content with selection' );
                    } );
            } );

            test( 'It supports multiple ranges', function() {
                let content = '[foo} {bar] baz [bom}';

                return setContent.withSelection( content )
                    .then( editor => {
                        assert.strictEqual( getContent( editor ), 'foo bar baz bom' );
                        assert.strictEqual( getContent.withSelection( editor ), content, 'Invalid content with selection' );
                    } );
            } );

            test( 'It supports ranges spanning through multiple lines', function() {
                let content = 'foo[ bar\n\t baz }bom';

                return setContent.withSelection( content )
                    .then( editor => {
                        assert.strictEqual( getContent( editor ), 'foo bar\n\t baz bom' );
                        assert.strictEqual( getContent.withSelection( editor ), content, 'Invalid content with selection' );
                    } );
            } );

            test( 'It supports multiple lines', function() {
                let content = [ 'foo', 'b[ar}', 'baz', '{bom]' ].join( '\n' );

                return setContent.withSelection( content )
                    .then( editor => {
                        assert.strictEqual( getContent( editor ), 'foo\nbar\nbaz\nbom' );
                        assert.strictEqual( getContent.withSelection( editor ), content, 'Invalid content with selection' );
                    } );
            } );

            test( 'It supports custom markers', function() {
                let content = '&aa<bb)cc(dd>[e}{e]';

                return setContent.withSelection( content, {
                        anchor: {
                            start: '<',
                            end: '>'
                        },
                        active: {
                            start: '(',
                            end: ')'
                        },
                        caret: '&'
                    } )
                    .then( editor => {
                        assert.strictEqual( getContent( editor ), 'aabbccdd[e}{e]' );
                        assert.strictEqual( getContent.withSelection( editor ), '^aa[bb}cc{dd][e}{e]',
                            'Invalid content with selection' );
                    } );
            } );
        } );
    } );

    suite( '_extractSelections', () => {
        /**
         *
         *      assertSelection( sel, { line: 0, character: 6 }, { line: 0, character: 8 } );
         *
         * @private
         * @param {Selection} actual
         * @param {Object} start
         * @param {Number} start.line
         * @param {Number} start.character
         * @param {Object} [end] If skipped it's assumed to be a collapsed selection.
         * @param {Number} [end.line]
         * @param {Number} [end.character]
         */
        function assertSelection( actual, start, end, selectionName ) {
            selectionName = selectionName || 'Selection';

            assert.equal( actual instanceof vscode.Selection, true, `${selectionName} is invalid type (${typeof actual}) ` );

            if ( !end ) {
                assert.equal( actual.isEmpty, true, `${selectionName} is not empty` );
            }

            assert.equal( actual.start.line, start.line, `Invalid ${selectionName}.start.line` );
            assert.equal( actual.start.character, start.character, `Invalid ${selectionName}.start.character` );

            if ( end ) {
                assert.equal( actual.end.line, end.line, `Invalid ${selectionName}.end.line` );
                assert.equal( actual.end.character, end.character, `Invalid ${selectionName}.end.character` );
            }
        }

        test( 'Works with selectionless content', function() {
            let ret = setContent._extractSelections( 'abc' );

            assert.deepEqual( ret, {
                content: 'abc',
                selections: []
            }, 'Invalid return value' );
        } );

        test( 'Works a single caret', function() {
            let ret = setContent._extractSelections( '^abc' );

            assert.strictEqual( ret.content, 'abc', 'Invalid content' );
            assertSelection( ret.selections[ 0 ], {
                line: 0,
                character: 0
            } );
        } );

        test( 'Works multiple carets', function() {
            let ret = setContent._extractSelections( '^ab^c' );

            assert.strictEqual( ret.content, 'abc', 'Invalid content' );
            assertSelection( ret.selections[ 0 ], {
                line: 0,
                character: 0
            }, null, 'Sel#1' );

            assertSelection( ret.selections[ 1 ], {
                line: 0,
                character: 2
            }, null, 'Sel#2' );
        } );

        test( 'Works multiple carets multiline', function() {
            let ret = setContent._extractSelections( '^abc^\n^\n\naa^' );

            assert.strictEqual( ret.content, 'abc\n\n\naa', 'Invalid content' );
            assertSelection( ret.selections[ 0 ], {
                line: 0,
                character: 0
            }, null, 'Sel#1' );

            assertSelection( ret.selections[ 1 ], {
                line: 0,
                character: 3
            }, null, 'Sel#2' );

            assertSelection( ret.selections[ 2 ], {
                line: 1,
                character: 0
            }, null, 'Sel#3' );

            assertSelection( ret.selections[ 3 ], {
                line: 3,
                character: 2
            }, null, 'Sel#4' );
        } );

        test( 'Works with unicode', function() {
            let ret = setContent._extractSelections( 'aa śśćęęę.ęęść óóóÓÓÓóó^.ęęężźźź' );

            assert.strictEqual( ret.content, 'aa śśćęęę.ęęść óóóÓÓÓóó.ęęężźźź' );
            assertSelection( ret.selections[ 0 ], {
                line: 0,
                character: 23
            }, null, 'Sel#1' );
        } );

        test( 'Supports custom selection characters', function() {
            let ret = setContent._extractSelections( 'aa<bb)cc(dd>[e}{e]', {
                anchor: {
                    start: '<',
                    end: '>'
                },
                active: {
                    start: '(',
                    end: ')'
                },
                caret: '^'
            } );

            assert.strictEqual( ret.content, 'aabbccdd[e}{e]' );

            assertSelection( ret.selections[ 0 ], {
                line: 0,
                character: 2
            }, {
                line: 0,
                character: 4
            }, 'Sel#1' );
        } )
    } );

    suite( 'Readme examples', () => {
        test( 'example 1', function() {
            return setContent( 'Fancy content!' )
                .then( textEditor => {
                    assert.equal( textEditor.document.lineAt( 0 ).text, 'Fancy content!' );
                } );
        } );

        test( 'example 2', function() {
            return setContent.withSelection( 'Put a collapsed selection here ^' )
                .then( textEditor => {
                    assert.equal( textEditor.document.lineAt( 0 ).text, 'Put a collapsed selection here ' );
                    assert.equal( textEditor.selection.isEmpty, true );
                    assert.equal( textEditor.selection.start.character, 31 );
                } );
        } );

        test( 'example 3', function() {
            return setContent.withSelection( 'Fancy [content}!' )
                .then( textEditor => {
                    assert.equal( textEditor.document.lineAt( 0 ).text, 'Fancy content!' );
                    assert.equal( textEditor.selection.isEmpty, false );
                    assert.equal( textEditor.selection.start.character, 6 );
                    assert.equal( textEditor.selection.end.character, 13 );
                    assert.equal( textEditor.selection.active, textEditor.selection.end );
                } );
        } );
    } );
} )();
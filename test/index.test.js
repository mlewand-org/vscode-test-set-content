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
    } );

    suite( 'setContent.withSelection', () => {
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
    } );

    suite( '_extractSelections', () => {
        // Usage:
        // assertSelection( sel, { line: 0, character: 6 }, { line: 0, character: 8 } );
        /**
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
    } );
} )();
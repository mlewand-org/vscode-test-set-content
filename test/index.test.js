/* global suite, test */
( function() {
    "use strict";

    const assert = require( 'assert' ),
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
        test( 'works with selectionless content', function() {
            let ret = setContent._extractSelections( 'abc' );

            assert.deepEqual( ret, {
                content: 'abc',
                selections: []
            }, 'Invalid return value' );
        } );
    } );
} )();
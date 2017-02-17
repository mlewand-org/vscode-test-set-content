/* global suite, test */
( function() {
    "use strict";

    const assert = require( 'assert' ),
        vscode = require( 'vscode' ),
        setContent = require( '../src' );

    suite( 'setContent', function() {
        test( 'It returns a valid type', function() {
            let ret = setContent( 'foo' );

            assert.strictEqual( ret && ret.then instanceof Function, true, 'Thenable value returned' );

            return ret;
        } );
    } );
} )();
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var testEnv = (function(){
    
    var error = {
            generic: 'Error',
            testDidNotReturnError: 'errorTest is supposed to thow error',
            isTrue: 'isTrue failed',
            isFalse: 'isFalse failed',
            areEqual: 'areEqual failed',
            areEquiv: 'areEquiv failed',
            isFunction: 'isFunction failed',
            isObject: 'isObject failed',
            isNumber: 'isNumber failed',
            isString: 'isString failed',
            hasProp: 'hasProp failed',
            lengthIs: 'lengthIs failed',
            isEmpty: 'isEmpty failed',
            invalidTestId: 'Invalid test id'
        },
        assertPredicats = {
            isTrue: { predicat: function(x){ return x; }, errMessage: error.isTrue },
            isFalse: { predicat: function(x){ return !x; }, errMessage: error.isFalse },
            areEqual: { predicat: function(x, y){ return x == y; }, errMessage: error.areEqual },
            areEquiv: { predicat: function(x, y){ return x === y; }, errMessage: error.areEquiv },
            isFunction: { predicat: function(x){ return typeof x === 'function'; }, errMessage: error.isFunction },
            isObject: { predicat: function(x){ return typeof x === 'object'; }, errMessage: error.isObject },
            isNumber: { predicat: function(x){ return typeof x === 'number'; }, errMessage: error.isNumber },
            isString: { predicat: function(x){ return typeof x === 'string'; }, errMessage: error.isString },
            hasProp: { predicat: function(x, y){ return x.hasOwnProperty(y); }, errMessage: error.hasProp },
            array: {
                lengthIs: { predicat: function(a, l){ return a.length == l; }, errMessage: error.lengthIs },
                isEmpty: { predicat: function(a){ return a.length == 0; }, errMessage: error.isEmpty }
            }
        },
        assertionContext = {assert: {}},
        
        testableUnitType = {
            assertive: 0,
            throwingError: 1,
            notThrowingError: 2
        },
        testResult = function(success, methodName, executionTime, message){
            this.success = success;
            this.methodName = methodName;
            this.message = message;
            this.executionTime = executionTime;
        },
        testableUnit = function(method, type){
            this.method = method;
            this.type = type || testableUnitType.assertive;
        },
        
        registerAssert = function(predicat, errorMsg){
            return function(){
                if(!predicat.apply(this, arguments)) throw new Error(errorMsg);
            };
        };
    
    (function buildAssertionContext(assertionContext, assertPredicats){
        for(var propName in assertPredicats){
            if(!assertPredicats[propName].hasOwnProperty('predicat')){
                assertionContext[propName] = {};
                buildAssertionContext(assertionContext[propName], 
                    assertPredicats[propName]);
            }else{
                assertionContext[propName] = registerAssert(assertPredicats[propName].predicat, 
                    assertPredicats[propName].errMessage);
            }
        }
    })(assertionContext.assert, assertPredicats);
        
    function testEnv(init){
        this.init = init;
        this.testResults = [];
        this.testUnits = [];
        this.cntFailed = 0;
        
        return this;
    }
    
    function runTestableUnit(testUnit){
        var startTime = new Date().getTime(),
            message = "",
            success = true;
        
        try{
            testUnit.method.call(assertionContext);
        }catch(error){
            message = error;
            success = false;
            this.cntFailed++;
        }
        var duration = new Date().getTime() - startTime;
        
        if(testUnit.type == testableUnitType.throwingError){
            if(success){
                message = error.testDidNotReturnError;
                this.cntFailed++;
            }
            else{
                this.cntFailed--;
                message = "";
            }
                
            success = !success;
        }
        
        return new testResult(success, testUnit.method.name, duration, message);
    }
    
    function runAll(){
        var me = this;
        this.testUnits.forEach(function(testUnit){
            me.testResults.push(runTestableUnit.call(me, testUnit));
        });
    }
    
    function printResults(tableMod){
        console.log('%c All: ' + this.testResults.length + 
                    ' | Failed: ' + this.cntFailed + 
                    ' | Succeeded: ' + (this.testResults.length - this.cntFailed),
                    'color: #999;');
        
        if(tableMod){
            console.table(this.testResults);
        }else{
            var testCnt = 0;
            this.testResults.forEach(function(testResult){
                console.log('%c' + 
                            testCnt++ + " " +
                            testResult.methodName +
                            '%c [' + testResult.executionTime + 'ms] ' + 
                            '%c '+ (testResult.message ? testResult.message : ""),
                            'color: ' + (testResult.success ? 'green' : 'red'),
                            'font-size: 8pt;',
                            '');
            });
        }
        
        return this;
    }
    
    testEnv.prototype = {
        addTest: function(testMethod){
            this.testUnits.push(new testableUnit(testMethod, testableUnitType.assertive));
            return this;
        },
        addErrorTest: function(testMethod){
            this.testUnits.push(new testableUnit(testMethod, testableUnitType.throwingError));
            return this;
        },
        addNotErrorTest: function(testMethod){
            this.testUnits.push(new testableUnit(testMethod, testableUnitType.notThrowingError));
            return this;
        },
        runTests: function(){
            this.testResults.length = 0;
            if(typeof this.init === 'function') this.init();
            
            runAll.call(this);
            return this;
        },
        runTest: function(id){
            if(id >= 0 && id < this.testUnits.length){
                var testResult = runTestableUnit.call(this, this.testUnits[id]);
                this.testResults[id] = testResult;
                return testResult;
            }
            
            throw new Error(error.invalidTestId);
        },
        runTestResult: function(id){
            if(id >= 0 && id < this.testResults.length)
                return this.testResults[id];
            
            throw new Error(error.invalidTestId);
        },
        printResults: printResults,
        assertionContext: assertionContext
    };
    
    return {
        init: function(init){
            return new testEnv(init);
        }
    };
    
})();

var module = module || {};
module.exports = testEnv;
},{}],2:[function(require,module,exports){
var testEnv = require("./testEnv.js");

var tests = testEnv.init()

    .addTest(function checkIfPythagoreWasRight(){
        this.assert.areEqual(5 * 5, 3 * 3 + 4 * 4);
    })
    
    .addTest(function simpleMath(){
        this.assert.isTrue(1 + 1 == 2);
    })
    
    .addTest(function chackIfFunction(){
        this.assert.isFunction(function(){});
    })
    
    .addTest(function longExecution(){
        for(var i = 0;i < 1000;i++)
            for(var j = i + 1;j < 5000;j++)
                this.assert.isFalse(i == j);
    })
    
    .addErrorTest(function errorTestFail(){
        this.assert.areEqual(1, 1);
    })
    
    .addErrorTest(function errorTestSuccess(){
        throw new Error('Something went wrong, and this is what we wanted');
    })
    
    .addTest(function anotherFailingTest(){
        throw new Error('This is not supposed to happen');
    })
    
    .runTests()
    .printResults();

},{"./testEnv.js":1}]},{},[2]);

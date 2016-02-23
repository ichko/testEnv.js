var testEnv = (function(){
    
    var assertionErrors = {
            error: 'Error',
            testDidNotReturnError: 'Error test did not fail',
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
            isEmpty: 'isEmpty failed'
        },
        assertPredicats = {
            isTrue: { predicat: function(x){ return x; }, errMessage: assertionErrors.isTrue },
            isFalse: { predicat: function(x){ return !x; }, errMessage: assertionErrors.isFalse },
            areEqual: { predicat: function(x, y){ return x == y; }, errMessage: assertionErrors.areEqual },
            areEquiv: { predicat: function(x, y){ return x === y; }, errMessage: assertionErrors.areEquiv },
            isFunction: { predicat: function(x){ return typeof x === 'function'; }, errMessage: assertionErrors.isFunction },
            isObject: { predicat: function(x){ return typeof x === 'object'; }, errMessage: assertionErrors.isObject },
            isNumber: { predicat: function(x){ return typeof x === 'number'; }, errMessage: assertionErrors.isNumber },
            isString: { predicat: function(x){ return typeof x === 'string'; }, errMessage: assertionErrors.isString },
            hasProp: { predicat: function(x, y){ return x.hasOwnProperty(y); }, errMessage: assertionErrors.hasProp },
            array: {
                lengthIs: { predicat: function(a, l){ return a.length == l; }, errMessage: assertionErrors.lengthIs },
                isEmpty: { predicat: function(a){ return a.length == 0; }, errMessage: assertionErrors.isEmpty }
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
                message = assertionErrors.testDidNotReturnError;
                this.cntFailed++;
            }
            else{
                this.cntFailed--;
                message = "";
            }
                
            success = !success;
        }
        
        this.testResults.push(new testResult(success, testUnit.method.name, duration, message));
    }
    
    function runAll(){
        var me = this;
        this.testUnits.forEach(function(testUnit){
            runTestableUnit.call(me, testUnit);
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
        printResults: printResults,
        assertionContext: assertionContext
    };
    
    return {
        init: function(init){
            return new testEnv(init);
        }
    };
    
})();

module.exports = testEnv;
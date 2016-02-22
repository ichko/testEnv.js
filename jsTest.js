var testEnv = (function(){
    
    var assertionErrors = {
            error: 'ERROR'
        },
        assertPredicats = {
            isTrue: { predicat: function(x){ return x; }, errMessage: assertionErrors.error },
            isFalse: { predicat: function(x){ return !x; }, errMessage: assertionErrors.error },
            areEqual: { predicat: function(x, y){ return x == y; }, errMessage: assertionErrors.error },
            areEquiv: { predicat: function(x, y){ return x === y; }, errMessage: assertionErrors.error },
            isFunction: { predicat: function(x){ return typeof x === 'function'; }, errMessage: assertionErrors.error },
            isObject: { predicat: function(x){ return typeof x === 'object'; }, errMessage: assertionErrors.error },
            isNumber: { predicat: function(x){ return typeof x === 'number'; }, errMessage: assertionErrors.error },
            isString: { predicat: function(x){ return typeof x === 'string'; }, errMessage: assertionErrors.error },
            hasProp: { predicat: function(x, y){ return x.hasOwnProperty(y); }, errMessage: assertionErrors.error },
            array: {
                lengthIs: { predicat: function(a, l){ return a.length == l; }, errMessage: assertionErrors.error },
                isEmpty: { predicat: function(a){ return a.length == 0; }, errMessage: assertionErrors.error }
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
        
        return this;
    }
    
    function runTestableUnit(testUnit){
        var startTime = new Date().getTime(),
            endTime = 0,
            message = "",
            success = true;
        
        try{
            testUnit.method.call(assertionContext);
            endTime = new Date().getTime();
        }catch(error){
            endTime = new Date().getTime();
            message = error.message;
            success = false;
        }
        var duration = startTime - endTime;
        
        if(testUnit.type == testableUnitType.throwingError){
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
            this.init();
            runAll.call(this);
            return this;
        }
    };
    
    return {
        init: function(init){
            return new testEnv(init);
        }
    };
    
})();
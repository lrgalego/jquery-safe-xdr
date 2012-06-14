describe("jquery safe xdr", function () {

   beforeEach(function() {
    spyOn(window, "Date").andReturn({getTime: function() { return 1234;} });
  });

  describe("when not passed a callback", function () {
    it("should use an image", function () {
      var imageMock = {};
      spyOn(window, "Image").andReturn(imageMock);
      $.safeXDR("http://domain", {param1: "first", param2: "second"});
      expect(imageMock.src).toEqual("http://domain?param1=first&param2=second&nocache=1234");
    });
  });

  describe("when a callack is passed", function() {

    describe("when browser is IE", function() {

      var xDomainRequestMock = {
        open: function () {},
        send: function () {}
      }

      beforeEach(function() {
        window.XDomainRequest = function () {}
        window.XDomainRequest.prototype = xDomainRequestMock;
      });

      afterEach(function() {
        delete window.XDomainRequest;
      });

      it("should open the request in the url with the parameters and a nocache flag", function (){
        spyOn(xDomainRequestMock, 'open');
        spyOn(xDomainRequestMock, 'send');

        $.safeXDR("http://domain", {param1: "first", param2: "second"}, function () {});

        expect(xDomainRequestMock.open).toHaveBeenCalledWith("GET","http://domain?param1=first&param2=second&nocache=1234");
        expect(xDomainRequestMock.send).toHaveBeenCalled();
      });

      it("should invoke callback with the text response when the request is successfull", function (){
        spyOn(xDomainRequestMock, 'send').andCallFake(function () {
          this.responseText = 'response';
          this.onload();
        });

        var callback = jasmine.createSpy();

        $.safeXDR("http://domain", {param1: "first", param2: "second"}, callback);

        expect(callback).toHaveBeenCalledWith('response');
      });

      it("should invoke callback with the object response when the request is successfull", function (){
        spyOn(xDomainRequestMock, 'send').andCallFake(function () {
          this.responseText = '{"key": "value"}';
          this.onload();
        });

        var callback = jasmine.createSpy();

        $.safeXDR("http://domain", {param1: "first", param2: "second"}, callback);

        expect(callback).toHaveBeenCalledWith({"key": "value"});
      });

      it("should invoke callack with an empty response when the request is not successfull", function (){
        spyOn(xDomainRequestMock, 'send').andCallFake(function () {
          this.onerror();
        });

        var callback = jasmine.createSpy();

        $.safeXDR("http://domain", {param1: "first", param2: "second"}, callback);

        expect(callback).toHaveBeenCalledWith(undefined);
      });

      it("should invoke callack with an empty response when the request timeout", function (){
        spyOn(xDomainRequestMock, 'send').andCallFake(function () {
          this.ontimeout();
        });

        var callback = jasmine.createSpy();

        $.safeXDR("http://domain", {param1: "first", param2: "second"}, callback);

        expect(callback).toHaveBeenCalledWith(undefined);
      });

    });

    describe("when browser is NOT IE", function() {

      var parameters;
      var callback;
      var ajaxCallParameters;

      beforeEach(function() {
        spyOn($,"ajax");
        parameters = {param1: "first", param2: "second"};
        callback = jasmine.createSpy("callback");

        $.safeXDR("http://domain", parameters, callback);
        ajaxCallParameters = $.ajax.mostRecentCall.args[0];
      });

      it("should call the ajax function of jquery", function() {
        expect($.ajax).toHaveBeenCalled();
        expect(ajaxCallParameters.url).toEqual("http://domain");
        expect(ajaxCallParameters.data).toEqual(parameters);
        expect(ajaxCallParameters.type).toEqual("GET");
        expect(ajaxCallParameters.cache).toEqual(false);
        expect(ajaxCallParameters.timeout).toEqual(500);
      });

      it("should invoke the callback with a valid text response when sucessfull", function() {
        var success = ajaxCallParameters.success;
        success("result");
        expect(callback).toHaveBeenCalledWith("result");
      });

      it("should invoke the callback with a valid object response when sucessfull", function() {
        var success = ajaxCallParameters.success;
        success('{"key": "value"}');
        expect(callback).toHaveBeenCalledWith({key: 'value'});
      });

      it("should invoke the callback with an empty response when sucessfull", function() {
        var success = ajaxCallParameters.success;
        success();
        expect(callback).toHaveBeenCalledWith(undefined);
      });


      it("should invoke the callback when error", function() {
        var error = ajaxCallParameters.error;
        error();
        expect(callback).toHaveBeenCalledWith(undefined);
      });
    });
  });
});
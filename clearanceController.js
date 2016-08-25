var clearanceControllers = angular.module('clearanceControllers', ['ngSanitize']);
var thisURL = location.href;
var spLocation = thisURL.indexOf("/SitePages");
var hostweburl = thisURL.substring(0,spLocation);
var itemResponse; //store the entire rest response so we can figure out which values have changed as we move through the process.
var clearanceListID; //store the GUID of the SharePoint clearance List (used in the search mechanism)
//begin shared properties service
clearanceControllers.service('sharedProperties',function(){
    var employeeID = "";
    var authorID = "";
    var superID = "";
    var office365User = "";
    var employeeName="";
    var lab = "";
    var supervisorDisplayName = "";
    var initiatedByDisplayName = "";
    var employeeAction = "";
    var division1 = "";
    var division2 = "";
    var location = "";
    var room = "";
    var phone = "";
    var requestDigest;
    var currentUser;
    var currentUserAccount;
    var safetyGroup=false;
    var amgGroup=false;
    var libraryGroup=false;
    var clothingAndGlasswareGroup=false;
    var telecomGroup=false;
    var itsGroup=false;
    var adminGroup=false;
    var securityGroup=false;
    var keyGroup=false;
    var changeHistory="";
    var thisUserID;
    var currentUserData; //will contain the entire current user object.
    var currentItem;
    return{
        setCurrentItem: function(value){
            currentItem=value;
        },
        getCurrentItem: function(){
            return currentItem;
        },
        setThisUserID: function(value){
            thisUserID=value;
        },
        getThisUserID: function(){
            return thisUserID;
        },
        setCurrentUserData: function(value){
            currentUserData=value;
        },
        getCurrentUserData: function(){
            return currentUserData;
        },
        setChangeHistory: function(value){
            changeHistory=value;
        },
        getChangeHistory: function(){
            return changeHistory;
        },
        getSafetyGroup: function(){
            return safetyGroup;
        },
        setSafetyGroup: function(value){
            safetyGroup = value;
        },
        getCurrentUserAccount: function(){
            return currentUserAccount;
        },
        setCurrentUserAccount: function(value){
            currentUserAccount = value;
        },
        getCurrentUser: function(){
            return currentUser;
        },
        setCurrentUser: function(value){
            currentUser = value;
        }, 
        getRequestDigest: function(){
            return requestDigest;
        },
        setRequestDigest: function(value){
            requestDigest = value;
        }, 
        getLabs: function(){
            return labs;
        },
        setLabs: function(value){
            labs = value;
        },        
        getEmployeeID: function(){
            return employeeID;
        },
        setEmployeeID: function(value){
            employeeID = value;
        },        
        getSuperID: function(){
            return superID;
        },
        setSuperID: function(value){
            superID = value;
        },
        getAuthorID: function(){
            return authorID;
        },
        setAuthorID: function(value){
            authorID = value;
        },        
        getOffice365User: function(){
            return office365User;
        },
        setOffice365User: function(value){
            office365User = value
        },        
        getEmployeeID: function(){
            return employeeID;
        },
        setEmployeeID: function(value){
            employeeID = value
        },
        getEmployeeName: function(){
            return employeeName;
        },
        setEmployeeName: function(value){
            employeeName = value
        },
        getLab: function(){
            return lab;
        },
        setLab: function(value){
            lab = value
        },
        getSuper: function(){
            return supervisorDisplayName;
        },
        setSuper: function(value){
            supervisorDisplayName = value
        },
        getInitiatedBy: function(){
            return initiatedByDisplayName;
        },
        setInitiatedBy: function(value){
            initiatedByDisplayName = value
        },
        getEmployeeAction: function(){
            return employeeAction;
        },
        setEmployeeAction: function(value){
            employeeAction = value
        },
        getDivision1: function(){
            return division1;
        },
        setDivision1: function(value){
            division1 = value
        },
        getDivision2: function(){
            return division2;
        },
        setDivision2: function(value){
            division2 = value
        },
        getLocation: function(){
            return location;
        },
        setLocation: function(value){
            location = value
        },
        getRoom: function(){
            return room;
        },
        setRoom: function(value){
            room = value
        },
        getPhone: function(){
            return phone;
        },
        setPhone: function(value){
            phone = value
        },
    };  
})
//end of service to contain parameters
//begin inprocess controller
clearanceControllers.controller('inProcessCtrl',['$scope','sharedProperties','$http','$timeout','$routeParams',
    function($scope,sharedProperties,$http,$timeout,$routeParams){
        var filterDivision = $routeParams.division;
        var processedStatus = $routeParams.status;
        var unsignedGroup = $routeParams.unsigned;
        if (!processedStatus) {
            processedStatus="inprocess";
            //processedStatus should be set to something
        }
        //status can be either inprocess, processed, leftwc, all, or withdrawn
        //leftwc means all requests where their last day has passed, regardless of whether or not the clearance process is complete.
        //processed means 
        //note that this controller will also handle requests for withdrawn and process items
        //pagination stuff
        $scope.currentPage = 1;
        $scope.pageSize = 10;
        //they asked me to switch sorting to final day instead of by name. JBL August 12, 2016
        //$scope.orderProp = 'eName';
        $scope.orderProp = 'finalD';
        $scope.pageChangeHandler = function(num) {
          console.log('Page changed to ' + num);
        };
        //end pagination stuff
        var employeeObjectArray=[];
        var eArray;
        var filterString="";
        if (processedStatus) {
            //there should always be a status
            switch(processedStatus){
                case "inprocess":
                    filterString = "?$filter=ClearanceCompleted%20eq%20'No%27";
                    break;
                case "processed":
                    filterString = "?$filter=ClearanceCompleted%20eq%20'Yes%27";
                    break;
                case "leftwc":
                    var today = new Date();
                    var thisMonth = today.getMonth() + 1;
                    var todayString = today.getFullYear() + "-" + thisMonth + "-" + today.getDate() + "T12:00:00";
                    filterString = "?$filter=ClearanceCompleted%20ne%20'Withdrawn'%20and%20DateTime'"+ todayString +"'%20gt%20FinalDay";
                    break;
                case "withdrawn":
                    filterString = "?$filter=ClearanceCompleted%20eq%20'Withdrawn%27";
                    break;
                default:
                    filterString="";
            }
        }
        if (unsignedGroup == "ITG") {
            filterString += "%20and%20ITSSignature%20eq%20null"
        }
        if (filterDivision) {
            filterString += "%20and%20%28DivCode%20eq%20'" + filterDivision + "'%20or%20DivCode2%20eq%20'" + filterDivision +"'%29";
        }
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items" + filterString;
        $http.get(restURL).success(function (data){
            if (filterDivision) {
                if (processedStatus=="inprocess") {
                    $scope.dataDescription = "In Process Employees - " + filterDivision;
                }
                if (processedStatus=="processed") {
                    $scope.dataDescription = "Processed Employees - " + filterDivision;
                }
               if (processedStatus=="leftwc") {
                    $scope.dataDescription = "Left WC - " + filterDivision;
                }
            }
            else
            {
                switch(processedStatus){
                     case "inprocess":
                        $scope.dataDescription = "In Process";
                        break;
                     case "processed":
                        $scope.dataDescription = "All Processed";
                        break;
                     case "leftwc":
                        $scope.dataDescription = "Left WC";
                        break;
                    case "all":
                        $scope.dataDescription = "All Clearance Items";
                        break;
                    case "withdrawn":
                        $scope.dataDescription = "Withdrawn";
                        break;
                     default:
                         $scope.dataDescription = "All Processed Items";
                 }
            }
            if (data.value) {
                eArray = data.value;
            }
            else
            {
                eArray = data.d.results;
            }
            var arrayLength = eArray.length;
            var employeeObject={};
            var employeeName;
            var employeeFirstName;
            var employeeLastName;
            var office365User;
            var clearanceItemID;
            var piR;
            var division1;
            var division2;
            var piEdit;
            var safetySignDate;
            var fiscalSignDate;
            var librarySignDate;
            var labSignDate;
            var telecomSignDate;
            var itgSignDate;
            var sphSignDate;
            var adminSignDate;
            var keysSignDate;
            var securitySignDate;
            var PrincipalInvestigator;
            var finalDay;
            var isSPH;
            var clearanceItemID="";
                for (i=0;i<arrayLength;i++) {
                    employeeName = eArray[i].Employee_x0020_Display_x0020_Nam;
                    clearanceItemID = eArray[i].Id;
                    finalDay = eArray[i].FinalDay;
                    division1 = eArray[i].DivCode;
                    division2 = eArray[i].DivCode2;
                    employeeLastName = eArray[i].EmployeeLastName;
                    employeeFirstName = eArray[i].EmployeeFirstName;
                    office365User = eArray[i].Office365User;
                    if (office365User == "No") {
                        employeeName = employeeLastName + ", " + employeeFirstName
                    };
                    if (eArray[i].piResponded) { piR = true } else { piR = false };
                    if (eArray[i].PrincipalInvestigator) { isPI = true } else { isPI = false };
                    if(eArray[i].SafetySignDate){safetySignDate="fui-check"}else{safetySignDate="blankIcon"};
                    if(eArray[i].FiscalSignDate){fiscalSignDate="fui-check"}else{fiscalSignDate="blankIcon"};
                    if(eArray[i].DickermanSignDate){librarySignDate="fui-check"}else{librarySignDate="blankIcon"};
                    if(eArray[i].LabClothingSignDate){labSignDate="fui-check"}else{labSignDate="blankIcon"};
                    if(eArray[i].TeleCommDate){telecomSignDate="fui-check"}else{telecomSignDate="blankIcon"};
                    if(eArray[i].ITSDate){itgSignDate="fui-check"}else{itgSignDate="blankIcon"};
                    if(eArray[i].SPHSignDate || eArray[i].BMSSignDate) { sphSignDate = "fui-check" } else { sphSignDate = "blankIcon" };
                    if(eArray[i].Status == "SPH Student/Faculty Leaving") { isSPH = true } else { isSPH = false };
                    if(eArray[i].DivAdminDate){adminSignDate="fui-check"}else{adminSignDate="blankIcon"};
                    if(eArray[i].MSODate){keysSignDate="fui-check"}else{keysSignDate="blankIcon"};
                    if(eArray[i].securitySignDate){securitySignDate="fui-check"}else{securitySignDate="blankIcon"};
                    employeeObject = {eName:employeeName,
                    id:clearanceItemID,
                    finalD: finalDay,
                    division1: division1,
                    division2:division2,
                    pi: piR,
                    isPI: isPI,
                    safety:safetySignDate,
                    fiscal:fiscalSignDate,
                    library:librarySignDate,
                    lab:labSignDate,
                    telecom:telecomSignDate,
                    itg:itgSignDate,
                    sph:sphSignDate,
                    admin:adminSignDate,
                    keys:keysSignDate,
                    security: securitySignDate,
                    isSPH: isSPH
                    };
                    employeeObjectArray.push(employeeObject);
                }
            $scope.clearanceEmployees = employeeObjectArray;
//            jQuery('table').dataTable();
            }).error(function (data) {
	            alert("Error Getting List of Employees in Process");
	        });
        //get list of labs, we'll need it later.
        var restUrl = hostweburl + "/_api/lists/getbytitle('WC%20Organizations')/items?$select=Title";
        $http.get(restUrl).success(function (data){
            var labs=[];
            var arrayLength = data.value.length;
            for (i=0;i<arrayLength;i++) {
                labs.push(data.value[i].Title);
            }
            sharedProperties.setLabs(labs);
                }).error(function (data) {
                alert("Error getting list of labs from WC Organizations");
            });
        //end get list of labs
        $scope.sortByFinalDay = function(){
            $scope.orderProp = 'finalD';
        }
        $scope.sortByName = function(){
            $scope.orderProp = 'eName';
        }
        searchEventAdd();//add the ability to have the user hit return.
        //get GUID of clearance list so we can use it to search the list later.
        var listRESTURL = hostweburl + "/_api/lists/getbytitle('Clearance%27%29";
        $http.get(listRESTURL).success(function (data) {
            if (data.d) {
                clearanceListID = data.d.Id;
            }
            else {
                clearanceListID = data.Id;
            }
            //old stuff from when the data was coming back differently
//            var xmlDoc = jQuery.parseXML(data);
//            var thisXML = jQuery(xmlDoc);
//            var thisIDHTML = thisXML.find("Id")[0];
//            var listID = thisIDHTML.textContent;
//            clearanceListID = listID;
            });
        //end of get list GUID for clearance
        $scope.searchClearance = function(){
            var thisSearchText = jQuery("#searchText").val();
            doTheSearch(hostweburl, thisSearchText)
        }
        $scope.closeSearchResults = function(){
            jQuery("#searchResultsRow").prop("hidden",true);
        }
    }]);
//end inprocess controller
//begin new clearance controller
clearanceControllers.controller('newClearanceCtrl',['$scope','sharedProperties','$filter','$http','$timeout','$q',
    function ($scope, sharedProperties, $filter, $http, $timeout, $q) {
	//initialize people picker
        var schema = {};
        schema['PrincipalAccountType'] = 'User';
        schema['SearchPrincipalSource'] = 15;
        schema['ResolvePrincipalSource'] = 15;
        schema['AllowMultipleValues'] = false;
        schema['MaximumEntitySuggestions'] = 50;
        schema['Width'] = '350px';     
        SPClientPeoplePicker_InitStandaloneControlWrapper('peoplePickerDiv', null, schema);
	//end of people picker
	//checkbox flat UI
        $('[data-toggle="checkbox"]').radiocheck();
        //change on 7/13 always hide PI checkbox and always display AMG tab
        $scope.pichecked = true;
        $scope.hidePICheckbox = true;
    //set up date picker
    var datepickerSelector2 = $('#datepicker-02');
        datepickerSelector2.datepicker({
          showOtherMonths: true,
          selectOtherMonths: true,
          dateFormat: "d MM, yy",
          yearRange: '-1:+1',
          changeMonth: true,
          changeYear: true
        }).prev().on('click', function (e) {
          e && e.preventDefault();
          datepickerSelector2.focus().blur();
        });
        $.extend($.datepicker, {_checkOffset:function(inst,offset,isFixed){return offset}});
      // Now let's align datepicker with the prepend button
      datepickerSelector2.datepicker('widget').css({'margin-left': -datepickerSelector2.prev('.input-group-btn').find('.btn').outerWidth()});
    //end of set up date picker.
    //event handler for SPH
    jQuery("#sphTab").hide();
    jQuery("#employeeAction").change(function() {
        var eactionValue = jQuery("#employeeAction").val();
        if (eactionValue=="SPH Student/Faculty Leaving") {
            jQuery("#sphTab").show();
        }
        else
        {
            jQuery("#sphTab").hide();
        }
    });
    //end event handler for SPH
	//get list of labs
	var restUrl = hostweburl + "/_api/lists/getbytitle('WC%20Organizations')/items?$select=Title";
	$http.get(restUrl).success(function (data){
	    var labs=[];
	    var arrayLength = data.value.length;
	    for (i=0;i<arrayLength;i++) {
		labs.push(data.value[i].Title);
	    }
	    labs.sort();
	    $scope.labs = labs;
	    //cannot get to work the "angular" way using ng-options, so I'll do it this wat for now.
	    var selectLabHTML = '<select id="labSelect" data-toggle="select" class="form-control select select-inverse mrs mbm">';
	    for(i=0;i<labs.length;i++){
		selectLabHTML += '<option value="' + labs[i] + '">' + labs[i] + '</option>';
	    }
	    selectLabHTML += '</select>';
	    document.getElementById("labUnit").innerHTML = selectLabHTML;
        jQuery("#labSelect").select2();
            }).error(function (data) {
	        alert("Error getting list of labs from WC Organizations");
	    });
	//end get list of labs
	//supervisor people picker
	SPClientPeoplePicker_InitStandaloneControlWrapper('supervisor', null, schema);
	//end of supervisor people picker
	//get user's display name
	restUrl = hostweburl + "/_api/sp.userprofiles.peoplemanager/getmyproperties";
	var isClearanceInitiator = false;
	$http.get(restUrl).success(function (data){
		var displayName = data.DisplayName;
		$scope.initiatedByDisplayName = displayName;
	    $.when(getGroupMembership("Clearance-Initiators")).done(function (a1) {
	        var memberObject = a1.value;
	        for (i = 0; i < memberObject.length;i++){
	            var memberDisplayName = memberObject[i].Title;
	            if (memberDisplayName == displayName) {
	                isClearanceInitiator = true;
	            }
	        }
	        if (!isClearanceInitiator) {
	            //disable save button because they're not in the right group
	            $("#saveButton").prop("disabled", true);
	            $("#NoSave").prop("hidden", false);
	        }
		}).fail(function () {
		    alert("Failed to get membership of Clearance-Initiators.");
		});
            }).error(function (data) {
	        alert("Error display name");
	    });
        //end get user's display name
        //determine group membership
	function getGroupMembership(groupName) {
	    restUrl = hostweburl + "/_api/web/SiteGroups/getByName('" + groupName + "')/users";
	    return jQuery.ajax({ url: restUrl, dataType: 'json' });
	};
	  // Tabs
	$('.nav-tabs a').on('click', function (e) {
	  e.preventDefault();
	  $(this).tab('show');
	});
	//initial tab
	$('<a href="#tab1">Safety</a>').tab('show');
	//end tabs
    //get request digest
    restUrl = hostweburl + "/_api/contextinfo";
    $http.post(restUrl).success(function(data){
    var requestDigest = data.FormDigestValue;
    sharedProperties.setRequestDigest(requestDigest);
    }).error(function(data){alert("Could not get request digest")});
    //end of request digest
    jQuery('select').select2(); //flat UI changed from select to select2;
    var today = new Date();
    $scope.todaysDate = today;
    document.getElementById("dateCreated").innerHTML = today;
	//begin save new
    var superLoginName = "";
    var loginName = "";
    var loginID = "";
    var superLoginID = "";
	$scope.saveNew = function(){
	    var clearanceDisplayName;
	    var selectedLab;
	    var supervisorName;
	    var employeeAction;
        var finalDay;
        var employeeType;
        var employeeEmail;
        var firstName;
        var lastName;
        var specialInstructions;
        var principalInvestigator = document.getElementById("piCheckbox").checked;
        var office365user = document.getElementById("office365user").checked;
	    //get selected user
        if (office365user)
        {
            //if this is true, then the person does NOT have an Office 365 account
            firstName = document.getElementById("firstNameInput").value;
            lastName = document.getElementById("lastNameInput").value;
            clearanceDisplayName = firstName + " " + lastName;
            if (lastName == "") {
                alert("An employee last name is required.");
                return false;
            };
        }
        else
        {
            var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;
            var users = peoplePicker.GetAllUserInfo();
            if (users.length==0) {
                alert("An employee name is required.");
                return false;
            }else{
                loginName = users[0].Key;
                for (var i = 0; i < users.length; i++) {
                var user = users[i];
                for (var userProperty in user) {
                    if (userProperty == "DisplayText") {
                        clearanceDisplayName = user[userProperty];
                        var lastNamePos = clearanceDisplayName.indexOf(",");
                        lastName = clearanceDisplayName.substring(0, lastNamePos);
                    }
                    if (userProperty == "Description") {
                        var fnPos = user[userProperty].indexOf(".");
                        firstName = user[userProperty].substring(0, fnPos);
                        firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1);
                    }
                }
                }                    
            }
        }
        if (!clearanceDisplayName) {
            alert("An employee name is required.")
        }
        $scope.clearanceDisplayName = clearanceDisplayName;
        //get supervisor   
        var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict.supervisor_TopSpan;
        var users = peoplePicker.GetAllUserInfo();
        if (users.length==0) {
            alert("Supervisor is required.")
        }else{
            superLoginName = users[0].Key;
            for (var i = 0; i < users.length; i++) {
            var user = users[i];
            for (var userProperty in user) {
                if (userProperty=="DisplayText") {
                supervisorName = user[userProperty];
                }
            }
            }            
        }
//end get supervisor
        if (office365user)
        {
            //if the person is not an office 365 user, then we will only get the supervisor's ID.
            loginID = null;
            getSuperId();    
        }
        else
        {
            getUserId();    
        }
            //get user ID
        function getUserId() {
            var context = new SP.ClientContext.get_current();
            this.user = context.get_web().ensureUser(loginName);
            context.load(this.user);
            context.executeQueryAsync(
                 Function.createDelegate(null, ensureUserSuccess), 
                 Function.createDelegate(null, onFail)
            );
        }     
        function ensureUserSuccess() {
            loginID = this.user.get_id();
            employeeEmail = this.user.get_email();
            getSuperId();
        }
        function onFail(sender, args) {
            alert('Query failed. Error: ' + args.get_message());
        }
        //get supervisor ID
        function getSuperId() {
            var context = new SP.ClientContext.get_current();
            this.user = context.get_web().ensureUser(superLoginName);
            context.load(this.user);
            context.executeQueryAsync(
                 Function.createDelegate(null, ensureSuperSuccess), 
                 Function.createDelegate(null, onSuperFail)
            );
        }     
        function ensureSuperSuccess() {
            superID = this.user.get_id();
            addListItem();
        }
        function onSuperFail(sender, args) {
            alert('Query failed. Error: ' + args.get_message());
        }
        //end get super ID
        function addListItem() {
            var Office365UserText="";
            var emailInput;
            if (office365user) {
                Office365UserText = "No";
                emailInput = document.getElementById("emailInput").value;
            }
            else
            {
                Office365UserText = "Yes";
                emailInput = employeeEmail;
            };
            selectedLab = $( "#labSelect" ).val();
            employeeAction = $( "#employeeAction" ).val();
            var division = $("#division").val();
            var division2 = $("#division2").val();
            var location = $("#location").val();
            var finalDay = $("#datepicker-02").val();
            var employeeType = $("#employeeType").val();
            var room = document.getElementById("roomInput").value;
            if (!room) {room=""};
            var specialInstructions = document.getElementById("specialInstructions").value;
            var itemType = "SP.Data.ClearanceListItem";
            if (!finalDay) {
                alert("Please select a final day.")
            };
            var item = {"__metadata": { "type": itemType },
            "SafetyComment": "",
            "FiscalComment": "",
            "DickermanComment": "",
            "LabClothingComment": "",
            "TeleCommComment": "",
            "ITSComment": "",
            "SPHComment": "",
            "DivAdminComment": "",
            "BMSComment": "",
            "dohSecurityComment": "",
            "wadsworthSecurityComment": "",
            "cmsSecurityComment": "",
            "westernAveSecurityComment": "",
            "MSOComment": "",
            "Title":clearanceDisplayName,
            "Status":employeeAction,
            "EmployeeNameId": loginID,
            "Employee_x0020_Display_x0020_Nam":clearanceDisplayName,
            "SupervisorId":superID,
            "Lab":selectedLab,
            "Office365User": Office365UserText,
            "DivCode": division,
            "DivCode2": division2,
            "Location": location,
            "EmployeeEmail": emailInput,
            "EmployeeFirstName": firstName,
            "EmployeeLastName": lastName,
            "Room": room,
            "FinalDay": finalDay,
            "EmployeeType":employeeType,
            "PrincipalInvestigator":principalInvestigator,
            "SpecialInstructions":specialInstructions,
            "ClearanceCompleted":"No",
            "ChangeHistory":""
            };
            var requestDigest = sharedProperties.getRequestDigest();
            $http.defaults.headers.common.Accept = "application/json;odata=verbose";
            $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
            $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
            $http.defaults.headers.post['If-Match'] = "*";
            $http.defaults.headers.post['X-HTTP-Method'] = "";
            $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
            var dfd = $q.defer();
            var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items";
            $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var newID = data.d.Id;
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path + "#/viewClearance/" + newID;
            window.location.href = finalURL;
            }).error(function (data) {
                var requestDigest = sharedProperties.getRequestDigest();
                dfd.reject("failed to add a clearance request");
                //begin generic sendmail function
                function sendEmail(from, to, body, subject) {
                    function postItem(from, to, body, subject) {
                        var urlTemplate = hostweburl + "/_api/SP.Utilities.Utility.SendEmail";
                        jQuery.ajax({
                            contentType: 'application/json',
                            url: urlTemplate,
                            type: "POST",
                            data: JSON.stringify({
                                'properties': {
                                    '__metadata': {
                                        'type': 'SP.Utilities.EmailProperties'
                                    },
                                    'From': from,
                                    'To': {
                                        'results': to
                                    },
                                    'Body': body,
                                    'Subject': subject
                                }
                            }),
                            headers: {
                                "Accept": "application/json;odata=verbose",
                                "content-type": "application/json;odata=verbose",
                                "X-RequestDigest": requestDigest
                            },
                            success: function (data) {
                                alert('Error Email Sent Successfully to Joseph LeMay');
                            },
                            error: function (err) {
                                alert('Error in sending Email: ' + JSON.stringify(err));
                            }
                        });
                    }
                    var requestDigest = sharedProperties.getRequestDigest();
                    if (requestDigest) {
                        postItem(from, to, body, subject);
                    }
                    else {
                        var restUrl = hostweburl + "/_api/contextinfo";
                        $http.post(restUrl).success(function (data) {
                            var results;
                            if (data.d) {
                                results = data.d;
                            } else {
                                results = data;
                            };
                            requestDigest = results.GetContextWebInformation.FormDigestValue;
                            sharedProperties.setRequestDigest(requestDigest);
                            postItem(from, to, body, subject);
                        }).error(function (data) { alert("Could not get request digest") });
                    };
                };
                //end generic sendmail function
                sendEmail("noreply@sharepointonline.com", ["joseph.lemay@its.ny.gov"], data, "error creating clearance item");
            });
            return dfd.promise;
        }//end addListItem
	}//end save new
    
    }]);
//end new clearance controller
//begin view clearance controller
clearanceControllers.controller('viewClearanceCtrl',['$scope','$filter','sharedProperties','$http','$timeout','$q','$routeParams',
    function($scope,$filter,sharedProperties,$http,$timeout,$q,$routeParams){
        var itemID = $routeParams.itemId;
        var targetEmployeeDisplayName;
        var employeeEmail;
        var division1;
        var division2;
        var divisionHeads = [];
        jQuery("#sendNotificationsSpinner").hide();
        $scope.hidePICheckbox = true;
         $scope.itemId = itemID;
         // Tabs
          $('.nav-tabs a').on('click', function (e) {
            e.preventDefault();
            $(this).tab('show');
          });
          //initial tab
          $('<a href="#tab1">Safety</a>').tab('show');
        //end tabs
          //get request digest
        var restUrl = hostweburl + "/_api/contextinfo";
          $http.post(restUrl).success(function(data){
          var requestDigest = data.FormDigestValue;
          sharedProperties.setRequestDigest(requestDigest);
          }).error(function(data){alert("Could not get request digest")});
          //end of request digest
        restUrl = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + "%29";
        $http.get(restUrl).success(function (data)
        {
                var results;
                if (data.d) { results = data.d } else { results = data };
                var employeeID = results.EmployeeNameId; //if the person is not an Office 365 user, then this will be null
                sharedProperties.setEmployeeID(employeeID);
                var displayName = results.Employee_x0020_Display_x0020_Nam;
                $scope.displayName = displayName;
                targetEmployeeDisplayName = displayName;
                sharedProperties.setEmployeeName(displayName);
                var office365User = results.Office365User;
                sharedProperties.setOffice365User(office365User);
                employeeEmail = results.EmployeeEmail;
                var lab = results.Lab;
                $scope.lab = lab;
                sharedProperties.setLab(lab);
                var authorID = results.AuthorId;
                sharedProperties.setAuthorID(authorID);
                var supervisorID = results.SupervisorId;
                var principalInvestigator = results.PrincipalInvestigator;
                $scope.laptopComment = results.LaptopComment;
                $scope.laptopTagNumber = results.LaptopTagNumber;
                $scope.createdOn = results.Created;
                $scope.finalDay = results.FinalDay;
                $scope.employeeType = results.EmployeeType;
                sharedProperties.setSuperID(supervisorID);
                var employeeAction = results.Status;
                sharedProperties.setEmployeeAction(employeeAction);
                division1 = results.DivCode;
                var changeHistory = results.ChangeHistory;
                $scope.changeHistory = changeHistory;
                sharedProperties.setChangeHistory(changeHistory);
                sharedProperties.setDivision1(division1);
                division2 = results.DivCode2;
                if (division2=="None") {
                    $scope.division2Row=false;
                }
                else
                {
                    sharedProperties.setDivision2(division2);
                    $scope.division2Row=true;
                }
                var location = results.Location;
                sharedProperties.setLocation(location);
                var room = results.Room;
                var specialInstructions = results.SpecialInstructions;
                sharedProperties.setRoom(room);
                var safetySignature = results.SafetySignatureId;
                $scope.safetyComment = results.SafetyComment;
                $scope.signatureDate = results.SafetySignDate;
                var amgSignature = results.FiscalSignatureId;
                $scope.amgComment = results.FiscalComment
                $scope.amgSignDate = results.FiscalSignDate;
                var dickermanSignature = results.DickermanSignatureId;
                $scope.librarySignDate = results.DickermanSignDate;
                $scope.libraryComment = results.DickermanComment;
                var labClothingSignature = results.LabClothingSignatureId;
                $scope.labSignDate = results.LabClothingSignDate;
                $scope.labComment = results.LabClothingComment;
                teleCommSignature = results.TeleCommSignatureId;
                $scope.teleCommDate = results.TeleCommDate;
                $scope.teleCommComment = results.TeleCommComment;
                var itsSignature = results.ITSSignatureId;
                $scope.itsDate = results.ITSDate;
                $scope.itsComment = results.ITSComment;
                var sphSignature = results.SPHSignatureId;
                $scope.sphSignDate = results.SPHSignDate;
                $scope.sphComment = results.SPHComment;
                var bmsSignature = results.BMSSignatureId;
                $scope.bmsSignDate = results.BMSSignDate;
                $scope.bmsComment = results.BMSComment;
                var divAdminSignature = results.DivAdminSignatureId;
                $scope.divAdminDate = results.DivAdminDate;
                $scope.divAdminComment = results.DivAdminComment;
                var securitySignature = results.securitySignatureId;
                $scope.securitySignDate = results.securitySignDate;
                $scope.dohSecurityComment = results.dohSecurityComment;
                $scope.wadsworthSecurityComment = results.wadsworthSecurityComment;
                $scope.cmsSecurityComment = results.cmsSecurityComment;
                $scope.westernAveSecurityComment = results.westernAveSecurityComment;
                $scope.keysCommentBiggs = results.keysCommentBiggs;
                $scope.keysCommentDAI = results.keysCommentDAI;
                $scope.keysCommentGL = results.keysCommentGL;
                var keysSignature = results.MSOSignatureId;
                $scope.keysDate = results.MSODate;
                if(employeeAction!="Completion of Non-Employee Assignment"){
                    jQuery("#statusAsterisk").hide();
                }
                else
                {
                    employeeAction += "*";    
                }
                function getUserName(userID) {
                    restUrl = hostweburl + "/_api/web/GetUserById(" + userID + ")";
                    return jQuery.ajax({url: restUrl,dataType:'json'});
                }
                employeeEmail = results.EmployeeEmail;
                if (office365User=="Yes")
                {
                    document.getElementById("office365user").checked=false;
                    jQuery("#office365userLabel").hide();
                }
                else
                {
                    document.getElementById("office365user").checked=true;
                }
                if (principalInvestigator) {
                    jQuery("#piCheckbox").css("hidden", true);
                    document.getElementById("piCheckbox").checked = true;
                    $scope.pichecked = true;
                }
            //change on 7/13/2016, from now on we show the AMG Tab no matter what.
                $scope.pichecked = true;
                $scope.hidePICheckbox = true;
                jQuery("#sphTab").hide();
                if (employeeAction=="SPH Student/Faculty Leaving") {
                    jQuery("#sphTab").show();
                }
                document.getElementById("personName").innerHTML = displayName;
                document.getElementById("employeeEmail").innerHTML = employeeEmail;
                //var labNode = document.createTextNode(lab);
                //document.getElementById("labUnit").appendChild(labNode);
                var employeeActionDiv = document.getElementById("employeeAction")
                var employeeActionNode = document.createTextNode(employeeAction);
                employeeActionDiv.appendChild(employeeActionNode);
                document.getElementById("division").innerHTML = division1;
                document.getElementById("division2").innerHTML = division2;
                document.getElementById("location").innerHTML = location;
                document.getElementById("room").innerHTML = room;
                document.getElementById("SpecialInstructions").innerHTML = specialInstructions;
                jQuery.when(getUserName(supervisorID),getUserName(authorID)).done(function(a1,a2){
                    var supervisorDisplayName = a1[0].Title;
                    $scope.supervisorDisplayName = supervisorDisplayName;
                    var initiatedByDisplayName = a2[0].Title;
                    displayNameNode=document.createTextNode(initiatedByDisplayName);
                    document.getElementById("initiatedBy").appendChild(displayNameNode);
                    }).fail(function(){
                        alert("Failed to get name of user or supervisor or both.");
                    });
                jQuery.when(getUserName(safetySignature)).done(function(answer){
                    $scope.signatureDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.signatureDisplayName = "Not Signed";
                });
                jQuery.when(getUserName(amgSignature)).done(function(answer){
                    $scope.amgDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.amgDisplayName = "Not Signed";
                });
                jQuery.when(getUserName(dickermanSignature)).done(function(answer){
                    $scope.libraryDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.libraryDisplayName = "Not Signed";
                });
                jQuery.when(getUserName(labClothingSignature)).done(function(answer){
                    $scope.labDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.labDisplayName = "Not Signed";
                });                
                jQuery.when(getUserName(teleCommSignature)).done(function(answer){
                    $scope.teleCommSignatureDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.teleCommSignatureDisplayName = "Not Signed";
                });
                jQuery.when(getUserName(itsSignature)).done(function(answer){
                    $scope.itsSignatureDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.itsSignatureDisplayName = "Not Signed";
                });
                jQuery.when(getUserName(sphSignature)).done(function(answer){
                    $scope.sphSignatureDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.sphSignatureDisplayName = "Not Signed";
                });                
                jQuery.when(getUserName(bmsSignature)).done(function(answer){
                    $scope.bmsSignatureDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.bmsSignatureDisplayName = "Not Signed";
                });                
                jQuery.when(getUserName(divAdminSignature)).done(function(answer){
                    $scope.divAdminSignatureDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.divAdminSignatureDisplayName = "Not Signed";
                });
                jQuery.when(getUserName(securitySignature)).done(function(answer){
                    $scope.securitySignatureDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.securitySignatureDisplayName = "Not Signed";
                });
                jQuery.when(getUserName(keysSignature)).done(function(answer){
                    $scope.keysSignatureDisplayName = answer.Title;
                    $scope.$apply();
                }).fail(function(){
                    $scope.keysSignatureDisplayName = "Not Signed";
                });
            });
            //get user's display name
            restUrl = hostweburl + "/_api/sp.userprofiles.peoplemanager/getmyproperties";
            $http.get(restUrl).success(function (data){
                var ThisUsersDisplayName = data.DisplayName;
                var thisUsersAccountName = data.AccountName;
                sharedProperties.setCurrentUser(ThisUsersDisplayName);
                sharedProperties.setCurrentUserAccount(thisUsersAccountName);
                sharedProperties.setCurrentUserData(data);
                    }).error(function (data) {
                    alert("Error getting current user");
                });
            //end get user's display name         
         jQuery("#changeHistory").hide();
         jQuery("#hideHistoryButton").hide();
         $scope.viewHistory = function(){
            jQuery("#changeHistory").slideToggle();
            jQuery("#viewHistoryButton").slideUp();
            jQuery("#hideHistoryButton").slideDown();
         };
         $scope.hideHistory = function(){
            jQuery("#changeHistory").slideToggle();
            jQuery("#hideHistoryButton").slideUp();
            jQuery("#viewHistoryButton").slideDown();
         };
         readAllAttachments();
        function readAllAttachments(){
            var restURL = hostweburl + "/_api/web/lists/getbytitle('Clearance')/items(" + itemID + ")/attachmentFiles";
            jQuery.ajax({url: restURL,
                        method: "GET",
                        headers: { "Accept": "application/json; odata=verbose" },
                        success: filesSucceed,
                        error: filesFail
                        })
        }
        function filesSucceed(data){
            var results = data.d.results;
            var filesArray=[];
            var fileObject={};
            for (var i = 0; i < results.length; i++) {
                var htmlFileName = results[i].FileName;
                var htmlFileRelativeURL = results[i].ServerRelativeUrl;
                fileObject = {fileName: htmlFileName,url: htmlFileRelativeURL};
                filesArray.push(fileObject);
            }
            $scope.amgFiles = filesArray;
            $scope.$apply();
        }
        function filesFail(){
            alert("could not read attachments");
        }
        //begin send PI Reminder
        $scope.closePIReminderDialog = function () {
            jQuery("#sendPIReminder").prop("hidden", true)
        }
        $scope.openPIReminderDialog = function () {
            jQuery("#sendPIReminder").prop("hidden", false);
            jQuery("#emailStakeholders").prop("hidden", true);
            jQuery("#sendNotifications").prop("hidden", true);
            jQuery("#sendEmployeeOnly").prop("hidden", true);
        }
        $scope.sendPIReminder = function(){
            var itemType = "SP.Data.ClearanceListItem";
            var displayName = sharedProperties.getCurrentUser();
            var changeHistory = sharedProperties.getChangeHistory();
            if (changeHistory==null) {
                changeHistory="";
            };
            var today = new Date();
            var todayText = today.toLocaleString();
            var stuffThatChanged = todayText + " PI Reminder sent by " + displayName +"<br>";
            stuffThatChanged = changeHistory + stuffThatChanged;
            var item = {"__metadata": { "type": itemType },
            "sendPIReminder":true,
            "ChangeHistory": stuffThatChanged
            };
            function postItem() {
                $http.defaults.headers.common.Accept = "application/json;odata=verbose";
                $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
                $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
                $http.defaults.headers.post['If-Match'] = "*";
                $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
                $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
                var dfd = $q.defer();
                var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
                $http.post(restURL, item).success(function (data) {
                    //resolve the new data
                    dfd.resolve(data.d);
                    var protocol = window.location.protocol;
                    var path = window.location.pathname;
                    var host = window.location.hostname;
                    var finalURL = protocol + "//" + host + path;
                    window.location.href = finalURL;
                }).error(function (data) {
                    dfd.reject("failed to update a clearance request");
                });
                return dfd.promise;
            };
            var requestDigest = sharedProperties.getRequestDigest();
            if (requestDigest) {
                postItem();
            }
            else {
                var restUrl = hostweburl + "/_api/contextinfo";
                $http.post(restUrl).success(function (data) {
                    var results;
                    if (data.d) {
                        results = data.d;
                    } else {
                        results = data;
                    };
                    requestDigest = results.GetContextWebInformation.FormDigestValue;
                    sharedProperties.setRequestDigest(requestDigest);
                    postItem();
                }).error(function (data) { alert("Could not get request digest") });
            };
         }                    
        //end send PI reminder.
        //begin send Notifications
        $scope.sendNotifications = function () {
            jQuery("#sendNotificationsButton").hide();
            jQuery("#sendNotificationsSpinner").show();
            var itemType = "SP.Data.ClearanceListItem";
            var allSiteUsers = [];
            var displayName = sharedProperties.getCurrentUser();
            var changeHistory = sharedProperties.getChangeHistory();
            if (changeHistory==null) {
                changeHistory="";
            };
            var today = new Date();
            var todayText = today.toLocaleString();
            var stuffThatChanged = todayText + " Notifications sent by " + displayName +"<br>";
            stuffThatChanged = changeHistory + stuffThatChanged;
            var item = {
                "__metadata": { "type": itemType },
                "sendPIReminder": true,
                "sendNotifications":true,
                "ChangeHistory": stuffThatChanged
            };
            function postItem() {
                $http.defaults.headers.common.Accept = "application/json;odata=verbose";
                $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
                $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
                $http.defaults.headers.post['If-Match'] = "*";
                $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
                $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
                var dfd = $q.defer();
                var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
                $http.post(restURL, item).success(function (data) {
                    function emailDirectors() {
                        /*
                        this function notifies division heads that person is leaving.
                        this function must be done in javascript instead of in a workflow because...
                        a workflow will only return a single value in a lookup and 
                        we need for it to return multiple.
                        */
                        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance-Notifications')/items"
                        $http.get(restURL).success(function (data) {
                            var results = data.d.results;
                            var noticeNameIDs = [];
                            var noticeNameEmails = [];
                            var divObject = {};
                            var division1 = sharedProperties.getDivision1();
                            for (var i = 0; i < results.length; i++) {
                                divObject = results[i];
                                if (divObject.Division == division1) {
                                    noticeNameIDs = divObject.NameId.results;
                                    divisionHeads = noticeNameIDs; //we'll use this later for the Clearance-Admin email
                                }
                            }
                            console.log("Directors in division " + division1 + " are " + noticeNameIDs);
                            function getAllUsers() {
                                restUrl = hostweburl + "/_api/web/siteusers?$top=5000&$select=Email,Id";
                                return jQuery.ajax({ url: restUrl, dataType: 'json' });
                            };
                            jQuery.when(getAllUsers().done(function (answer) {
                                var results = answer.value;
                                allSiteUsers = results;
                                var nameID;
                                for (var i = 0; i < noticeNameIDs.length; i++) {
                                    nameID = noticeNameIDs[i];
                                    for (var j = 0; j < results.length; j++) {
                                        if (results[j].Id == nameID) {
                                            noticeNameEmails.push(results[j].Email)
                                        }
                                    }
                                }
                                //send email here
                                var employeeEmailArray = [];
                                employeeEmailArray.push(employeeEmail);
                                var dos = new Date($scope.finalDay);
                                var monthText = dos.getMonth() + 1;
                                var dosText = dos.getFullYear() + "-" + monthText + "-" + dos.getDate();
                                var clearanceBody = "Dear " + targetEmployeeDisplayName + ",";
                                clearanceBody += "<br><br>Clearance has been initiated for you based on your upcoming separation from the Wadsworth Center which is scheduled to become effective " + dosText + ".";
                                clearanceBody += "<br><br>Please see your Division Administrator as soon as possible to discuss items that must be completed prior to your last day at the Wadsworth Center.";
                                var clearanceSubject = "Wadsworth Separation of Service Procedures for " + targetEmployeeDisplayName;
                                //begin generic sendmail function
                                function sendEmail(from, to,cc, body, subject) {
                                    function postItem(from, to,cc, body, subject) {
                                        var urlTemplate = hostweburl + "/_api/SP.Utilities.Utility.SendEmail";
                                        jQuery.ajax({
                                            contentType: 'application/json',
                                            url: urlTemplate,
                                            type: "POST",
                                            data: JSON.stringify({
                                                'properties': {
                                                    '__metadata': {
                                                        'type': 'SP.Utilities.EmailProperties'
                                                    },
                                                    'From': from,
                                                    'To': {
                                                        'results': to
                                                    },
                                                    'Body': body,
                                                    'CC':{'results':cc},
                                                    'Subject': subject
                                                }
                                            }),
                                            headers: {
                                                "Accept": "application/json;odata=verbose",
                                                "content-type": "application/json;odata=verbose",
                                                "X-RequestDigest": requestDigest
                                            },
                                            success: function (data) {
                                                emailClearanceAdmin();
                                            },
                                            error: function (err) {
                                                alert('Error in sending Email: ' + JSON.stringify(err));
                                            }
                                        });
                                    }
                                    var requestDigest = sharedProperties.getRequestDigest();
                                    if (requestDigest) {
                                        postItem(from, to,cc, body, subject);
                                    }
                                    else {
                                        var restUrl = hostweburl + "/_api/contextinfo";
                                        $http.post(restUrl).success(function (data) {
                                            var results;
                                            if (data.d) {
                                                results = data.d;
                                            } else {
                                                results = data;
                                            };
                                            requestDigest = results.GetContextWebInformation.FormDigestValue;
                                            sharedProperties.setRequestDigest(requestDigest);
                                            postItem(from, to,cc,body, subject);
                                        }).error(function (data) { alert("Could not get request digest") });
                                    };
                                };
                                //end generic sendmail function
                                sendEmail('no-reply@sharepointonline.com', employeeEmailArray, noticeNameEmails, clearanceBody, clearanceSubject);
                            }));
                        });
                    }
                    //resolve the new data
                    dfd.resolve(data.d);
                    emailDirectors();
                }).error(function (data) {
                    dfd.reject("failed to update a clearance request");
                });
                return dfd.promise;
            }
            function emailClearanceAdmin() {
                function redirectViewWindow() {
                    var protocol = window.location.protocol;
                    var path = window.location.pathname;
                    var host = window.location.hostname;
                    var finalURL = protocol + "//" + host + path;
                    window.location.href = finalURL;
                };
                /* 
                special function to email clearance admin
                This is being done here in javascript instead of in the workflow because...
                For Clearance-Admin stakeholders, they only get the email if the employee being
                discharged is in their division.
                Everyone else gets an email as in the workflow
                */
                //step 1 get list of people in Clearance-Admin
                var clearanceAdminIDs = [];
                function getGroupMembership(groupName) {
                    restUrl = hostweburl + "/_api/web/SiteGroups/getByName('" + groupName + "')/users";
                    return jQuery.ajax({ url: restUrl, dataType: 'json' });
                };
                $.when(getGroupMembership("Clearance-Admin")).done(function (admin) {
                    var adminMembers = admin.value;
                    var thisID;
                    for (i = 0; i < adminMembers.length; i++) {
                        thisID = adminMembers[i].Id;
                        clearanceAdminIDs.push(thisID);
                    };
                    var clearanceAdminList = [];
                    for (i = 0; i < clearanceAdminIDs.length; i++) {
                        for (j = 0; j < divisionHeads.length; j++) {
                            if (clearanceAdminIDs[i] == divisionHeads[j]) {
                                clearanceAdminList.push(clearanceAdminIDs[i])
                            }
                        }
                    };
                    var clearanceAdminEmails = [];
                    for (i = 0; i < clearanceAdminList.length; i++) {
                        for (j = 0; j < allSiteUsers.length; j++) {
                            if (clearanceAdminList[i] == allSiteUsers[j].Id) {
                                clearanceAdminEmails.push(allSiteUsers[j].Email)
                            }
                        }
                    }
                    //begin generic sendmail function
                    function sendEmail(from, to, cc, body, subject) {
                        function postItem(from, to, cc, body, subject) {
                            var urlTemplate = hostweburl + "/_api/SP.Utilities.Utility.SendEmail";
                            jQuery.ajax({
                                contentType: 'application/json',
                                url: urlTemplate,
                                type: "POST",
                                data: JSON.stringify({
                                    'properties': {
                                        '__metadata': {
                                            'type': 'SP.Utilities.EmailProperties'
                                        },
                                        'From': from,
                                        'To': {
                                            'results': to
                                        },
                                        'Body': body,
                                        'CC': { 'results': cc },
                                        'Subject': subject
                                    }
                                }),
                                headers: {
                                    "Accept": "application/json;odata=verbose",
                                    "content-type": "application/json;odata=verbose",
                                    "X-RequestDigest": requestDigest
                                },
                                success: function (data) {
                                    redirectViewWindow();
                                },
                                error: function (err) {
                                    alert('Error in sending Email: ' + JSON.stringify(err));
                                }
                            });
                        }
                        var requestDigest = sharedProperties.getRequestDigest();
                        if (requestDigest) {
                            postItem(from, to, cc, body, subject);
                        }
                        else {
                            var restUrl = hostweburl + "/_api/contextinfo";
                            $http.post(restUrl).success(function (data) {
                                var results;
                                if (data.d) {
                                    results = data.d;
                                } else {
                                    results = data;
                                };
                                requestDigest = results.GetContextWebInformation.FormDigestValue;
                                sharedProperties.setRequestDigest(requestDigest);
                                postItem(from, to, cc, body, subject);
                            }).error(function (data) { alert("Could not get request digest") });
                        };
                    };
                    //end generic sendmail function
                    var adminSubject = "Clearance form for " + targetEmployeeDisplayName + " division " + division1 +  " has been initiated";
                    var adminBody = "An employee, " + targetEmployeeDisplayName;
                    adminBody += " is going through the Wadsworth Center clearance process. ";
                    adminBody += "Please use the following URL and complete the information for your group. ";
                    adminBody += "<br>";
                    adminBody += "Clearance for " + '<a href="' + hostweburl + "/SitePages/editClearanceParameters.aspx?itemID=" + itemID + '">';
                    adminBody += targetEmployeeDisplayName + "</a>";
                    sendEmail("no-reply@sharepointonline.com", clearanceAdminEmails, [""], adminBody,adminSubject);
                });
            };
            var requestDigest = sharedProperties.getRequestDigest();
            if (requestDigest) {
                postItem();
            }
            else {
                var restUrl = hostweburl + "/_api/contextinfo";
                $http.post(restUrl).success(function (data) {
                    var results;
                    if (data.d) {
                        results = data.d;
                    } else {
                        results = data;
                    };
                    requestDigest = results.GetContextWebInformation.FormDigestValue;
                    sharedProperties.setRequestDigest(requestDigest);
                    postItem();
                }).error(function (data) { alert("Could not get request digest") });
            };
        }
        //end send Notifications
        $scope.openEmailDialog = function(){
            jQuery("#emailStakeholders").prop("hidden", false);
            jQuery("#sendNotifications").prop("hidden", true);
            jQuery("#sendPIReminder").prop("hidden", true);
            jQuery("#sendEmployeeOnly").prop("hidden", true);
        }
        $scope.closeEmailDialog = function(){
            jQuery("#emailStakeholders").prop("hidden",true);
        }
        $scope.openNotificationDialog = function(){
            jQuery("#sendNotifications").prop("hidden", false);
            jQuery("#emailStakeholders").prop("hidden", true);
            jQuery("#sendPIReminder").prop("hidden", true);
            jQuery("#sendEmployeeOnly").prop("hidden", true);
        }
        $scope.closeNotificationDialog = function(){
            jQuery("#sendNotifications").prop("hidden",true)
        }
        $scope.openEmployeeOnlyDialog = function () {
            jQuery("#sendEmployeeOnly").prop("hidden", false);
            jQuery("#emailStakeholders").prop("hidden", true);
            jQuery("#sendNotifications").prop("hidden", true);
            jQuery("#sendPIReminder").prop("hidden", true);
        }
        $scope.closeEmployeeOnlyDialog = function () {
            jQuery("#sendEmployeeOnly").prop("hidden", true);
        }
        
        //begin send to employee only
        $scope.sendEmployeeNotification = function(){
            var itemType = "SP.Data.ClearanceListItem";
            var displayName = sharedProperties.getCurrentUser();
            var changeHistory = sharedProperties.getChangeHistory();
            if (changeHistory==null) {
                changeHistory="";
            };
            var today = new Date();
            var todayText = today.toLocaleString();
            var stuffThatChanged = todayText + " Employee Notice sent by " + displayName +"<br>";
            stuffThatChanged = changeHistory + stuffThatChanged;
            var item = {"__metadata": { "type": itemType },
            "sendEmployeeNotification":true,
            "ChangeHistory": stuffThatChanged
            };
            function postItem() {
                $http.defaults.headers.common.Accept = "application/json;odata=verbose";
                $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
                $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
                $http.defaults.headers.post['If-Match'] = "*";
                $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
                $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
                var dfd = $q.defer();
                var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
                $http.post(restURL, item).success(function (data) {
                    //resolve the new data
                    dfd.resolve(data.d);
                    var protocol = window.location.protocol;
                    var path = window.location.pathname;
                    var host = window.location.hostname;
                    var finalURL = protocol + "//" + host + path;
                    //window.location.href = finalURL;
                    alert("Email Sent");
                }).error(function (data) {
                    dfd.reject("failed to update a clearance request");
                });
                return dfd.promise;
            }
            var requestDigest = sharedProperties.getRequestDigest();
            if (requestDigest) {
                postItem();
            }
            else
            {
                var restUrl = hostweburl + "/_api/contextinfo";
                $http.post(restUrl).success(function (data) {
                    var results;
                    if (data.d) {
                        results = data.d;
                    } else {
                        results = data;
                    };
                    requestDigest = results.GetContextWebInformation.FormDigestValue;
                    sharedProperties.setRequestDigest(requestDigest);
                    postItem();
                }).error(function (data) { alert("Could not get request digest") });
            };
        }
        //end send to employee only
        //begin send to stakeholders
        function getGroupMembership(groupName) {
            restUrl = hostweburl + "/_api/web/SiteGroups/getByName('" + groupName + "')/users";
            return jQuery.ajax({ url: restUrl, dataType: 'json' });
        }
        $scope.sendStakeholders = function(){
            var currentUser = sharedProperties.getCurrentUserData();
            var from = currentUser.Email;
            var checkSafety = document.getElementById("checkSafety").checked;
            var checkAMG = document.getElementById("checkAMG").checked;
            var checkLibrary = document.getElementById("checkLibrary").checked;
            var checkLab = document.getElementById("checkLab").checked;
            var checkAdmin = document.getElementById("checkAdmin").checked;
            var checkSecurity = document.getElementById("checkSecurity").checked;
            var checkTelecomm = document.getElementById("checkTelecomm").checked;
            var checkITS = document.getElementById("checkITS").checked;
            var checkSPH = document.getElementById("checkSPH").checked;
            var checkBMS = document.getElementById("checkBMS").checked;
            var checkKeys = document.getElementById("checkKeys").checked;
            /*Note that in late-stage development, it was requested that the group named Clearance-SPH 
            be changed to Clearance-EHS. Therefore the group named Clearance-EHS is granted access to 
            sign off on the sections with SPH in the div id and you'll see SPH throughout the code.
            SPH stands for School of Public Health and EHS is Environmental Health Services*/
            jQuery.when(getGroupMembership('Clearance-Safety'),getGroupMembership('Clearance-AMG'),
                        getGroupMembership('Clearance-Library'),getGroupMembership('Clearance-Lab'),
                        getGroupMembership('Clearance-Telecomm'),getGroupMembership('Clearance-ITS'),
                        getGroupMembership('Clearance-EHS'),getGroupMembership('Clearance-Admin'),
                        getGroupMembership('Clearance-BMS'),getGroupMembership('Clearance-Security'),
                        getGroupMembership('Clearance-Keys')
                        ).done(function(safety,amg,library,lab,tele,its,sph,admin,bms,security,keys)
                        {
                            var i;
                            var thisEmail;
                            var allEmails=[];
                            if (checkSafety){
                                var safetyMembers = safety[0].value;
                                for (i=0;i<safetyMembers.length;i++) {
                                    thisEmail=safetyMembers[i].Email;
                                    allEmails.push(thisEmail);
                                }
                            }
                            if (checkAMG){
                                var amgMembers = amg[0].value;
                                for (i=0;i<amgMembers.length;i++) {
                                    thisEmail=amgMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }
                            if (checkLibrary){
                                var libraryMembers = library[0].value;
                                for (i=0;i<libraryMembers.length;i++) {
                                    thisEmail=libraryMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }
                            if (checkLab) {
                                var labMembers = lab[0].value;
                                for(i=0;i<labMembers.length;i++){
                                    thisEmail = labMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }
                            if (checkAdmin) {
                                var adminMembers = admin[0].value;
                                for(i=0;i<adminMembers.length;i++){
                                    thisEmail = adminMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }
                            if (checkSecurity) {
                                var securityMembers = security[0].value;
                                for(i=0;i<securityMembers.length;i++){
                                    thisEmail = securityMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }
                            if (checkTelecomm) {
                                var teleMembers = tele[0].value;
                                for(i=0;i<teleMembers.length;i++){
                                    thisEmail = teleMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }
                            if (checkITS) {
                                var itsMembers = its[0].value;
                                for(i=0;i<itsMembers.length;i++){
                                    thisEmail = itsMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }
                            if (checkSPH) {
                                var sphMembers = sph[0].value;
                                for(i=0;i<sphMembers.length;i++){
                                    thisEmail = sphMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }
                            if (checkBMS) {
                                var bmsMembers = bms[0].value;
                                for(i=0;i<bmsMembers.length;i++){
                                    thisEmail = bmsMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }
                            if (checkKeys) {
                                var keysMembers = keys[0].value;
                                for(i=0;i<keysMembers.length;i++){
                                    thisEmail = keysMembers[i].Email;
                                    if (jQuery.inArray(thisEmail,allEmails)==-1) {
                                        allEmails.push(thisEmail);
                                    }
                                }
                            }                            
                            formulateEmail(allEmails);
                        });
            function formulateEmail(allEmails){
                var currentUserData = sharedProperties.getCurrentUserData();
                var from = currentUserData.Email;
                var to = allEmails;
                var subject = jQuery("#stakeholderSubject").val();
                var body = jQuery("#stakeholderBody").val();
                body += '<br><br><a href="' + hostweburl + "/SitePages/viewClearanceParameters.aspx?itemID=" + itemID+ '">Click here to view clearance form</a>';
                sendEmail(from, to, body, subject);                
            }
        }
        //end send to stakeholders
        //begin generic sendmail function
        function sendEmail(from, to, body, subject) {
            function postItem(from, to, body, subject) {
                var urlTemplate = hostweburl + "/_api/SP.Utilities.Utility.SendEmail";
                jQuery.ajax({
                    contentType: 'application/json',
                    url: urlTemplate,
                    type: "POST",
                    data: JSON.stringify({
                        'properties': {
                            '__metadata': {
                                'type': 'SP.Utilities.EmailProperties'
                            },
                            'From': from,
                            'To': {
                                'results': to
                            },
                            'Body': body,
                            'Subject': subject
                        }
                    }),
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "content-type": "application/json;odata=verbose",
                        "X-RequestDigest": requestDigest
                    },
                    success: function (data) {
                        alert('Email Sent Successfully');
                    },
                    error: function (err) {
                        alert('Error in sending Email: ' + JSON.stringify(err));
                    }
                });
            }
            var requestDigest = sharedProperties.getRequestDigest();
            if (requestDigest) {
                postItem(from, to, body, subject);
            }
            else {
                var restUrl = hostweburl + "/_api/contextinfo";
                $http.post(restUrl).success(function (data) {
                    var results;
                    if (data.d) {
                        results = data.d;
                    } else {
                        results = data;
                    };
                    requestDigest = results.GetContextWebInformation.FormDigestValue;
                    sharedProperties.setRequestDigest(requestDigest);
                    postItem(from, to, body, subject);
                }).error(function (data) { alert("Could not get request digest") });
            };
        };        
        //end generic sendmail function
        //get stakeholders names
        jQuery.when(getGroupMembership('Clearance-Safety'), getGroupMembership('Clearance-AMG'),
            getGroupMembership('Clearance-Library'), getGroupMembership('Clearance-Lab'),
            getGroupMembership('Clearance-Telecomm'), getGroupMembership('Clearance-ITS'),
            getGroupMembership('Clearance-EHS'), getGroupMembership('Clearance-Admin'),
            getGroupMembership('Clearance-BMS'), getGroupMembership('Clearance-Security'),
            getGroupMembership('Clearance-Keys')
            ).done(function (safety, amg, library, lab, tele, its, sph, admin, bms, security, keys) {
                var i;
                //safety
                var safetyMembers = safety[0].value;
                var safetyMembersTitles = "";
                for (i = 0; i < safetyMembers.length; i++) {
                    if (safetyMembersTitles == "") {
                        safetyMembersTitles = safetyMembers[i].Title;
                    }
                    else{safetyMembersTitles += ", " + safetyMembers[i].Title}
                }
                var safetyCheckHTML = '<label class="checkbox" for="checkSafety">';
                safetyCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkSafety">';
                safetyCheckHTML += '<a title="' + safetyMembersTitles + '" data-toggle="tooltip" href="#">Safety</a></label>';
                document.getElementById("safetyPeopleCheckBox").innerHTML = safetyCheckHTML;
                //AMG
                var AMGMembers = amg[0].value;
                var amgMembersTitles = "";
                for (i = 0; i < AMGMembers.length; i++) {
                    if (amgMembersTitles == "") {
                        amgMembersTitles = AMGMembers[i].Title;
                    }
                    else { amgMembersTitles += ", " + AMGMembers[i].Title }
                }
                var amgCheckHTML = '<label class="checkbox" for="checkAMG">';
                amgCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkAMG">';
                amgCheckHTML += '<a title="' + amgMembersTitles + '" data-toggle="tooltip" href="#">Accounts Management Group</a></label>';
                document.getElementById("amgPeopleCheckBox").innerHTML = amgCheckHTML;
                //library
                var libraryMembers = library[0].value;
                var libraryMembersTitles = "";
                for (i = 0; i < libraryMembers.length; i++) {
                    if (libraryMembersTitles == "") {
                        libraryMembersTitles = libraryMembers[i].Title;
                    }
                    else { libraryMembersTitles += ", " + libraryMembers[i].Title }
                }
                var libraryCheckHTML = '<label class="checkbox" for="checkLibrary">';
                libraryCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkLibrary">';
                libraryCheckHTML += '<a title="' + libraryMembersTitles + '" data-toggle="tooltip" href="#">Library</a></label>';
                document.getElementById("libraryPeopleCheckBox").innerHTML = libraryCheckHTML;
                //Lab
                var labMembers = lab[0].value;
                var labMembersTitles = "";
                for (i = 0; i < labMembers.length; i++) {
                    if (labMembersTitles == "") {
                        labMembersTitles = labMembers[i].Title;
                    }
                    else { labMembersTitles += ", " + labMembers[i].Title }
                }
                var labCheckHTML = '<label class="checkbox" for="checkLab">';
                labCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkLab">';
                labCheckHTML += '<a title="' + labMembersTitles + '" data-toggle="tooltip" href="#">Lab</a></label>';
                document.getElementById("labPeopleCheckBox").innerHTML = labCheckHTML;
                //Admin
                var adminMembers = admin[0].value;
                var adminMembersTitles = "";
                for (i = 0; i < adminMembers.length; i++) {
                    if (adminMembersTitles == "") {
                        adminMembersTitles = adminMembers[i].Title;
                    }
                    else { adminMembersTitles += ", " + adminMembers[i].Title }
                }
                var adminCheckHTML = '<label class="checkbox" for="checkAdmin">';
                adminCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkAdmin">';
                adminCheckHTML += '<a title="' + adminMembersTitles + '" data-toggle="tooltip" href="#">Admin</a></label>';
                document.getElementById("adminPeopleCheckBox").innerHTML = adminCheckHTML;
                //security
                var securityMembers = security[0].value;
                var securityMembersTitles = "";
                for (i = 0; i < securityMembers.length; i++) {
                    if (securityMembersTitles == "") {
                        securityMembersTitles = securityMembers[i].Title;
                    }
                    else { securityMembersTitles += ", " + securityMembers[i].Title }
                }
                var securityCheckHTML = '<label class="checkbox" for="checkSecurity">';
                securityCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkSecurity">';
                securityCheckHTML += '<a title="' + securityMembersTitles + '" data-toggle="tooltip" href="#">Security</a></label>';
                document.getElementById("securityPeopleCheckBox").innerHTML = securityCheckHTML;
                //Telecommunications
                var teleMembers = tele[0].value;
                var teleMembersTitles = "";
                for (i = 0; i < teleMembers.length; i++) {
                    if (teleMembersTitles == "") {
                        teleMembersTitles = teleMembers[i].Title;
                    }
                    else { teleMembersTitles += ", " + teleMembers[i].Title }
                }
                var teleCheckHTML = '<label class="checkbox" for="checkTelecomm">';
                teleCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkTelecomm">';
                teleCheckHTML += '<a title="' + teleMembersTitles + '" data-toggle="tooltip" href="#">Telecommunications</a></label>';
                document.getElementById("telePeopleCheckBox").innerHTML = teleCheckHTML;
                //ITS
                var itsMembers = its[0].value;
                var itsMembersTitles = "";
                for (i = 0; i < itsMembers.length; i++) {
                    if (itsMembersTitles == "") {
                        itsMembersTitles = itsMembers[i].Title;
                    }
                    else { itsMembersTitles += ", " + itsMembers[i].Title }
                }
                var itsCheckHTML = '<label class="checkbox" for="checkITS">';
                itsCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkITS">';
                itsCheckHTML += '<a title="' + itsMembersTitles + '" data-toggle="tooltip" href="#">ITS</a></label>';
                document.getElementById("itsPeopleCheckBox").innerHTML = itsCheckHTML;
                //EHS
                var sphMembers = sph[0].value;
                var sphMembersTitles = "";
                for (i = 0; i < sphMembers.length; i++) {
                    if (sphMembersTitles == "") {
                        sphMembersTitles = sphMembers[i].Title;
                    }
                    else { sphMembersTitles += ", " + sphMembers[i].Title }
                }
                var sphCheckHTML = '<label class="checkbox" for="checkSPH">';
                sphCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkSPH">';
                sphCheckHTML += '<a title="' + sphMembersTitles + '" data-toggle="tooltip" href="#">EHS</a></label>';
                document.getElementById("sphPeopleCheckBox").innerHTML = sphCheckHTML;
                //BMS
                var bmsMembers = bms[0].value;
                var bmsMembersTitles = "";
                for (i = 0; i < bmsMembers.length; i++) {
                    if (bmsMembersTitles == "") {
                        bmsMembersTitles = bmsMembers[i].Title;
                    }
                    else { bmsMembersTitles += ", " + bmsMembers[i].Title }
                }
                var bmsCheckHTML = '<label class="checkbox" for="checkBMS">';
                bmsCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkBMS">';
                bmsCheckHTML += '<a title="' + bmsMembersTitles + '" data-toggle="tooltip" href="#">BMS</a></label>';
                document.getElementById("bmsPeopleCheckBox").innerHTML = bmsCheckHTML;
                //Keys
                var keysMembers = keys[0].value;
                var keysMembersTitles = "";
                for (i = 0; i < keysMembers.length; i++) {
                    if (keysMembersTitles == "") {
                        keysMembersTitles = keysMembers[i].Title;
                    }
                    else { keysMembersTitles += ", " + keysMembers[i].Title }
                }
                var keysCheckHTML = '<label class="checkbox" for="checkKeys">';
                keysCheckHTML += '<input type="checkbox" data-toggle="checkbox" value="" id="checkKeys">';
                keysCheckHTML += '<a title="' + keysMembersTitles + '" data-toggle="tooltip" href="#">Keys</a></label>';
                document.getElementById("keysPeopleCheckBox").innerHTML = keysCheckHTML;
                //checkboxes
                $('[data-toggle="checkbox"]').radiocheck();
                //end checkboxes
                // Tooltips
                $('[data-toggle="tooltip"]').tooltip();
                //end tooltips
            });

        $scope.$apply();
        //end get stakeholders names
    }]);
//end of view controller
//begin PI controller
clearanceControllers.controller('piClearanceCtrl',['$scope','$filter','sharedProperties','$http','$timeout','$q','$routeParams',
    function($scope,$filter,sharedProperties,$http,$timeout,$q,$routeParams){
        var itemID = $routeParams.itemId;
        $scope.itemId = itemID;
          //get request digest
        var restUrl = hostweburl + "/_api/contextinfo";
          $http.post(restUrl).success(function(data){
          var requestDigest = data.FormDigestValue;
          sharedProperties.setRequestDigest(requestDigest);
          }).error(function(data){alert("Could not get request digest")});
          //end of request digest
        //get user's display name
        var ThisUsersDisplayName;
        restUrl = hostweburl + "/_api/sp.userprofiles.peoplemanager/getmyproperties";
        $http.get(restUrl).success(function (data){
            ThisUsersDisplayName = data.DisplayName;
            var thisUsersAccountName = data.AccountName;
            sharedProperties.setCurrentUser(ThisUsersDisplayName);
            sharedProperties.setCurrentUserAccount(thisUsersAccountName);
            sharedProperties.setCurrentUserData(data);
            activatePISubmitButton();            
                }).error(function (data) {
                alert("Error getting current user");
            });
        //end get user's display name           
        function activatePISubmitButton() {
            restUrl = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
            var safetyComment;
            var superID;            
         $http.get(restUrl).success(function (data)
            {
                sharedProperties.setCurrentItem(data);
                var employeeID = data.EmployeeNameId; //if the person is not an Office 365 user, then this will be null
                sharedProperties.setEmployeeID(employeeID);
                var displayName = data.Employee_x0020_Display_x0020_Nam;
                $scope.displayName = displayName;
                sharedProperties.setChangeHistory(data.ChangeHistory);
                sharedProperties.setEmployeeName(displayName);
                superID = data.SupervisorId;
                jQuery.when(getUserInfo(superID)).done(function(answer){
                    superName = answer.Title;
                    if (superName==ThisUsersDisplayName) {
                        jQuery("#piButton").prop("disabled", false);
                    }
                    else
                    {
                        $scope.isNotSuper=true;
                        $scope.$apply();
                    }
                }).fail(function(){
                    console.log("could not retrieve super name");
                }); 
            });
            function getUserInfo(userID){
                restUrl = hostweburl + "/_api/web/GetUserById(" + userID + ")";
                return jQuery.ajax({url: restUrl,dataType:'json'});
            }                
        };
         $scope.savePI = function(){
            var itemType = "SP.Data.ClearanceListItem";
            var displayName = sharedProperties.getCurrentUser();
            var changeHistory = sharedProperties.getChangeHistory();
            var currentItem = sharedProperties.getCurrentItem();
            var safetyComment = currentItem.SafetyComment;
            var laptopComment="";
            var laptopTagNumber="";
            var labClothingComment = currentItem.LabClothingComment;
            var sphComment = currentItem.SPHComment;
            var dosimeter = jQuery("input[name=optionsDosimeter]:checked").val();
            if (dosimeter=="Yes") {
                if (safetyComment) { safetyComment += "  Employee has a dosimeter. -PI" }
                else { safetyComment = "Employee has a dosimeter. -PI" }
            }else
            {
                if (safetyComment) {safetyComment += "   Employee does not have a dosimeter - PI"}
                else { safetyComment = "Employee does not have a dosimeter - PI" }
            }
            var laptop = jQuery("input[name=optionsLaptop]:checked").val();
            if (laptop=="Yes") {
                laptopComment =  "Employee has a laptop. -PI";
                laptopTagNumber = jQuery("#laptopTagNumber").val();
            }
            if (laptop=="No") {
                laptopComment = "Employee does not have a laptop. -PI";
            }
            var sph = jQuery("input[name=optionsSPH]:checked").val();
            if (sph=="Yes") {
                if (sphComment) { sphComment += "   Employee is a SPH student. -PI  " }
                else{sphComment = "Employee is a SPH student. -PI  ";}
                
            }else{
                if (sphComment) { sphComment += "   Employee is not an SPH student. -PI  " }
                else{sphComment = "Employee is not an SPH student. -PI  "}
            }
            if (changeHistory==null) {
                changeHistory="";
            };
            var today = new Date();
            var todayText = today.toLocaleString();
            var stuffThatChanged = todayText + " PI form submitted by " + displayName +"<br>";
            stuffThatChanged += todayText + " Safety Comment set to " + safetyComment + "by " + displayName +"<br>";
            stuffThatChanged += todayText + " Laptop comment set to " + laptopComment + "by " + displayName +"<br>";
            if (laptopTagNumber) {
                stuffThatChanged += todayText + " Laptop tag number set to " + laptopTagNumber + "by " + displayName +"<br>";               
            }
            stuffThatChanged = changeHistory + stuffThatChanged;
            var item = {"__metadata": { "type": itemType },
            "piResponded":"Yes",
            "SafetyComment":safetyComment,
            "LaptopComment":laptopComment,
            "LaptopTagNumber":laptopTagNumber,
            "SPHComment": sphComment,
            "ChangeHistory": stuffThatChanged
            };
            var requestDigest = sharedProperties.getRequestDigest();
            $http.defaults.headers.common.Accept = "application/json;odata=verbose";
            $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
            $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
            $http.defaults.headers.post['If-Match'] = "*";
            $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
            $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
            var dfd = $q.defer();
            var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
            $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path;
            window.location.href = finalURL;
            }).error(function (data) {
                dfd.reject("failed to update a clearance request");
            });
            return dfd.promise;            
         }
}]);
//end PI controller
//beginning of edit controller
clearanceControllers.controller('editClearanceCtrl',['$scope','sharedProperties','$http','$timeout','$q','$routeParams',
    function ($scope, sharedProperties, $http, $timeout, $q, $routeParams) {
        $scope.hidePICheckbox = true;
        $scope.pichecked = true;
        var thisUser={}; //holds the ID of the user being cleared in memory (just in case people toggle the checkbox off and on)
        var employeeID;
        var displayName;
        var safetySignature = null;
        var amgSignature = null;
        var dickermanSignature = null;
        var teleCommSignature = null;
        var itsSignature = null;
        var sphSignature = null;
        var bmsSignature = null;
        var divAdminSignature = null;
        var securitySignature = null;
        var keysSignature = null;
        var office365User;
        var lab;
        var labs=[];
        var authorID;
        var superID;
        var employeeAction;
        var division1;
        var division2;
        var location;
        var room;
        var employeeType;
        var dateCreated;
        var finalDay;
        var employeeEmail;
        var firstName;
        var lastName;
        var principalInvestigator;
        var specialInstructions;
        var clearanceCompleted;
        var schema = {};//schema object for any people pickers
        schema['PrincipalAccountType'] = 'User';
        schema['SearchPrincipalSource'] = 15;
        schema['ResolvePrincipalSource'] = 15;
        schema['AllowMultipleValues'] = false;
        schema['MaximumEntitySuggestions'] = 50;
        schema['Width'] = '350px';         
        //checkbox flat UI
        $('[data-toggle="checkbox"]').radiocheck();
            // Tabs
          $('.nav-tabs a').on('click', function (e) {
            e.preventDefault();
            $(this).tab('show');
          });
          //initial tab
          $('<a href="#tab1">Safety</a>').tab('show');
          //end tabs
        //set up date picker
        var datepickerSelector2 = $('#datepicker-02');
            datepickerSelector2.datepicker({
              showOtherMonths: true,
              selectOtherMonths: true,
              dateFormat: "d MM, yy",
              yearRange: '-1:+1',
              changeMonth: true,
              changeYear: true
            }).prev().on('click', function (e) {
              e && e.preventDefault();
              datepickerSelector2.focus().blur();
            });
            $.extend($.datepicker, {_checkOffset:function(inst,offset,isFixed){return offset}});
          // Now let's align datepicker with the prepend button
          datepickerSelector2.datepicker('widget').css({'margin-left': -datepickerSelector2.prev('.input-group-btn').find('.btn').outerWidth()});
        //end of set up date picker.                   
            //initialize the people picker for the person. this fires if the end used checks and unchecks the office 365 box.
            function initPersonPeoplePicker(){
                var users = new Array(1);
                users[0] = thisUser;
                SPClientPeoplePicker_InitStandaloneControlWrapper('peoplePickerDiv', users, schema);
            };
          //end office 365 user checkbox event handler
          //get request digest
          restUrl = hostweburl + "/_api/contextinfo";
          $http.post(restUrl).success(function(data){
          var requestDigest = data.FormDigestValue;
          sharedProperties.setRequestDigest(requestDigest);
          }).error(function(data){alert("Could not get request digest")});
          //end of request digest
          //get data for clearance request
            var itemID = $routeParams.itemId;
            $scope.itemId = itemID;
         var restUrl = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + "%29";
         $http.get(restUrl).success(function (data)
            {
                var itemResponse;
                if (data.d) {
                    itemResponse = data.d;
                }
                else{itemResponse = data;}
                sharedProperties.setCurrentItem(itemResponse);
                employeeID = itemResponse.EmployeeNameId; //if the person is not an Office 365 user, then this will be null
                displayName = itemResponse.Employee_x0020_Display_x0020_Nam;
                $scope.displayName = displayName;
                sharedProperties.setEmployeeName(displayName);
                office365User = itemResponse.Office365User;
                lab = itemResponse.Lab;
                clearanceCompleted = itemResponse.ClearanceCompleted;
                $scope.clearanceCompleted = clearanceCompleted;
                if (clearanceCompleted=="Withdrawn") {
                    jQuery("#withdrawButton").toggle(false);
                    jQuery("#reinstateButton").toggle(true);
                }else{jQuery("#reinstateButton").toggle(false);};
                authorID = itemResponse.AuthorId;
                superID = itemResponse.SupervisorId;
                employeeAction = itemResponse.Status;
                $scope.employeeAction = employeeAction;
                division1 = itemResponse.DivCode;
                division2 = itemResponse.DivCode2;
                location = itemResponse.Location;
                room = itemResponse.Room;
                $scope.laptopComment = itemResponse.LaptopComment;
                $scope.laptopTagNumber = itemResponse.LaptopTagNumber;
                finalDay = itemResponse.FinalDay;
                employeeType = itemResponse.EmployeeType;
                firstName = itemResponse.EmployeeFirstName;
                $scope.employeeFirstName = firstName;
                lastName = itemResponse.EmployeeLastName;
                $scope.employeeLastName = lastName;
                employeeEmail = itemResponse.EmployeeEmail;
                $scope.employeeEmail = employeeEmail;
                dateCreated = itemResponse.Created;
                var stuffThatChanged = itemResponse.ChangeHistory;
                sharedProperties.setChangeHistory(stuffThatChanged);
                principalInvestigator = itemResponse.PrincipalInvestigator;
                specialInstructions = itemResponse.SpecialInstructions;
                safetySignature = itemResponse.SafetySignatureId;                
                $scope.signatureDate = itemResponse.SafetySignDate;
                $scope.safetyComment = itemResponse.SafetyComment;
                amgSignature = itemResponse.FiscalSignatureId;
                $scope.amgSignatureDate = itemResponse.FiscalSignDate;
                $scope.amgComment = itemResponse.FiscalComment;
                dickermanSignature = itemResponse.DickermanSignatureId;
                $scope.dickermanSignDate = itemResponse.DickermanSignDate;
                $scope.dickermanComment = itemResponse.DickermanComment;
                labClothingSignature = itemResponse.LabClothingSignatureId;
                $scope.labClothingSignDate = itemResponse.LabClothingSignDate;
                $scope.labClothingComment = itemResponse.LabClothingComment;
                teleCommSignature = itemResponse.TeleCommSignatureId;
                $scope.teleCommDate = itemResponse.TeleCommDate;
                $scope.teleCommComment = itemResponse.TeleCommComment;
                itsSignature = itemResponse.ITSSignatureId;
                $scope.itsDate = itemResponse.ITSDate;
                $scope.itsComment = itemResponse.ITSComment;
                sphSignature = itemResponse.SPHSignatureId;
                $scope.sphSignDate = itemResponse.SPHSignDate;
                $scope.sphComment = itemResponse.SPHComment;
                bmsSignature = itemResponse.BMSSignatureId;
                $scope.bmsSignDate = itemResponse.BMSSignDate;
                $scope.bmsComment = itemResponse.BMSComment;
                divAdminSignature = itemResponse.DivAdminSignatureId;
                $scope.divAdminDate = itemResponse.DivAdminDate;
                $scope.divAdminComment = itemResponse.DivAdminComment;
                securitySignature = itemResponse.securitySignatureId;
                $scope.securityDate = itemResponse.securitySignDate;
                $scope.dohSecurityComment = itemResponse.dohSecurityComment;
                $scope.wadsworthSecurityComment = itemResponse.wadsworthSecurityComment;
                $scope.cmsSecurityComment = itemResponse.cmsSecurityComment;
                $scope.westernAveSecurityComment = itemResponse.westernAveSecurityComment;
                $scope.keysCommentBiggs = itemResponse.keysCommentBiggs;
                $scope.keysCommentDAI = itemResponse.keysCommentDAI;
                $scope.keysCommentGL = itemResponse.keysCommentGL;
                keysSignature = itemResponse.MSOSignatureId;
                $scope.keysDate = itemResponse.MSODate;               
                if(employeeAction!="Completion of Non-Employee Assignment"){
                    jQuery("#statusAsterisk").hide();
                }
                else
                {
                    employeeAction += "*";    
                }
                function getUserInfo(userID){
                    restUrl = hostweburl + "/_api/web/GetUserById(" + userID + ")";
                    return jQuery.ajax({url: restUrl,dataType:'json'});
                }
                //we'll do the names first
                if (office365User=="Yes") {
                    jQuery.when(getUserInfo(employeeID),getUserInfo(superID),getUserInfo(authorID)).done(function(a1,a2,a3)
                    {
                        //see http://blog.ianchivers.com/2013/05/client-side-people-picker-control-for.html
                        $scope.checked = false;
                        var user = a1[0];
                        var users = new Array(1); 
                        var defaultUser = new Object();
                        defaultUser.AutoFillDsiplsyText = user.Title;
                        defaultUser.AutoFillKey = user.LoginName;
                        defaultUser.Description = user.Email;
                        defaultUser.DisplayText = user.Title;  
                        defaultUser.EntityType = "User";  
                        defaultUser.IsResolved = true;  
                        defaultUser.Key = user.LoginName;  
                        defaultUser.Resolved = true;
                        users[0] = defaultUser;
                        thisUser = defaultUser;
                        SPClientPeoplePicker_InitStandaloneControlWrapper('peoplePickerDiv', users, schema);
                        //repeat for supervisor
                        var superObj = a2[0];
                        var supers = new Array(1);
                        var defaultSuper = new Object();
                        defaultSuper.AutoFillDsiplsyText = superObj.Title;
                        defaultSuper.AutoFillKey = superObj.LoginName;
                        defaultSuper.Description = superObj.Email;
                        defaultSuper.DisplayText = superObj.Title;
                        sharedProperties.setSuper(superObj.Title);
                        defaultSuper.EntityType = "User";  
                        defaultSuper.IsResolved = true;  
                        defaultSuper.Key = superObj.LoginName;  
                        defaultSuper.Resolved = true;
                        supers[0] = defaultSuper;  
                        SPClientPeoplePicker_InitStandaloneControlWrapper('supervisor', supers, schema);
                        //repeat for author
                        var initiatorObj = a3[0];
                        var initiators = new Array(1);
                        var defaultInit = new Object();
                        defaultInit.AutoFillDsiplsyText = initiatorObj.Title;
                        defaultInit.AutoFillKey = initiatorObj.LoginName;
                        defaultInit.Description = initiatorObj.Email;
                        defaultInit.DisplayText = initiatorObj.Title;
                        sharedProperties.setInitiatedBy(initiatorObj.Title);
                        defaultInit.EntityType = "User";  
                        defaultInit.IsResolved = true;  
                        defaultInit.Key = initiatorObj.LoginName;  
                        defaultInit.Resolved = true;
                        initiators[0] = defaultInit;  
                        SPClientPeoplePicker_InitStandaloneControlWrapper('initiatedBy', initiators, schema);
                    });
                }
                else
                {
                    jQuery.when(getUserInfo(superID),getUserInfo(authorID)).done(function(a2,a3){
                        //check the "Office 365 User" box. Note that checking this box indicates the user does NOT have an Office 365 account
                        document.getElementById("office365user").checked = true;
                        //initiate the people picket anyway, even though the person does not have an office 365 account.
                        //it's possible someone might initially check that they don't have account and want to change it.
                        SPClientPeoplePicker_InitStandaloneControlWrapper('peoplePickerDiv', users, schema);
                        $scope.checked = true;
                        var users = new Array(1); 
                        var defaultUser = new Object();
                        //supervisor
                        var user = a2[0];
                        defaultUser.AutoFillDsiplsyText = user.Title;
                        defaultUser.AutoFillKey = user.LoginName;
                        defaultUser.Description = user.Email;
                        defaultUser.DisplayText = user.Title;
                        sharedProperties.setSuper(user.Title);
                        defaultUser.EntityType = "User";  
                        defaultUser.IsResolved = true;  
                        defaultUser.Key = user.LoginName;  
                        defaultUser.Resolved = true;
                        users[0] = defaultUser;  
                        SPClientPeoplePicker_InitStandaloneControlWrapper('supervisor', users, schema);
                        //repeat for author
                        var initiatorObj = a3[0];
                        var initiators = new Array(1);
                        var defaultInit = new Object();
                        defaultInit.AutoFillDsiplsyText = initiatorObj.Title;
                        defaultInit.AutoFillKey = initiatorObj.LoginName;
                        defaultInit.Description = initiatorObj.Email;
                        defaultInit.DisplayText = initiatorObj.Title;
                        sharedProperties.setInitiatedBy(initiatorObj.Title);
                        defaultInit.EntityType = "User";  
                        defaultInit.IsResolved = true;  
                        defaultInit.Key = initiatorObj.LoginName;  
                        defaultInit.Resolved = true;
                        initiators[0] = defaultInit;  
                        SPClientPeoplePicker_InitStandaloneControlWrapper('initiatedBy', initiators, schema);
                    });            
                }
                //end of names
                //other employee information
            function getLabs(){
                var restUrl = hostweburl + "/_api/lists/getbytitle('WC%20Organizations')/items?$select=Title";
                return jQuery.ajax({url: restUrl,dataType:'json'});
                }
            jQuery.when(getLabs()).done(function(allLabs){
                var arrayLength = allLabs.value.length;
                        for (i=0;i<arrayLength;i++) {
                                labs.push(allLabs.value[i].Title);
                        }
                        labs.sort();
            var selectLabHTML = '<select id="labSelect" data-toggle="select" class="form-control select select-inverse mrs mbm">';
            for(i=0;i<labs.length;i++){
                if (labs[i]==lab) {
                    selectLabHTML += '<option value="' + labs[i] + '" selected>' + labs[i] + '</option>';
                }
                else{selectLabHTML += '<option value="' + labs[i] + '">' + labs[i] + '</option>';}
            }
            selectLabHTML += '</select>';
            document.getElementById("labUnit").innerHTML = selectLabHTML;
            jQuery('select').select2(); //flat UI changed from select to select2;
                });
            //end of labs                
            //employee types
            var employeeTypeArray=['Visiting Scientist',
                                    'Volunteer',
                                    'Temporary Contract Staff',
                                    'Contractor/Vendor',
                                    'Employee',
                                    'HRI Stipend',
                                    'School of Public Health'];
            var employeeTypeHTML = '<select id="employeeType" data-toggle="select" class="form-control select select-inverse mrs mbm">';
            for(i=0;i<employeeTypeArray.length;i++){
                  if (employeeTypeArray[i]==employeeType) {
                    employeeTypeHTML += '<option value="' + employeeTypeArray[i] + '" selected>' + employeeTypeArray[i] + '</option>';
                  }
                  else
                  {
                    employeeTypeHTML += '<option value="' + employeeTypeArray[i] + '">' + employeeTypeArray[i] + '</option>';
                  }
            };
            employeeTypeHTML += '</select>';
            document.getElementById("employeeTypeDiv").innerHTML = employeeTypeHTML;
            //end employee types
            //employee Action (status)
            var employeeActionArray=['Changing Status from Employee to Non-Employee',
                                     'Leaving Employment',
                                     'Completion of Non-Employee Assignment*',
                                     'Transferring to Main Health',
                                     'SPH Student/Faculty Leaving'];
            var employeeActionHTML = '<select id="employeeAction" data-toggle="select" class="form-control select select-inverse mrs mbm">';
            for(i=0; i<employeeActionArray.length;i++){
                if (employeeActionArray[i]==employeeAction) {
                    employeeActionHTML += '<option value="' + employeeActionArray[i] + '" selected>' + employeeActionArray[i] + '</option>';
                }
                else
                {
                    employeeActionHTML += '<option value="' + employeeActionArray[i] + '">' + employeeActionArray[i] + '</option>';
                }
            }
            employeeActionHTML += "</select>";
            document.getElementById("employeeActionSelect").innerHTML = employeeActionHTML;
            //end employee Action (status)
 //event handler for SPH
                jQuery("#sphTab").hide();
                if (employeeAction=="SPH Student/Faculty Leaving") {
                    jQuery("#sphTab").show();
                }                             
            //sph event handler
            jQuery("#employeeAction").change(function() {
                var eactionValue = jQuery("#employeeAction").val();
                if (eactionValue=="SPH Student/Faculty Leaving") {
                    jQuery("#sphTab").show();
                }
                else
                {
                    jQuery("#sphTab").hide();
                }
            });
            //end event handler for SPH            
            //begin divisions 1 and 2
            var divisionsArray = [['DEHS','Division of Environmental Health Sciences']];
            divisionsArray.push(['DID','Division of Infectious Diseases']);
            divisionsArray.push(['DIR',"Wadsworth Center Director's Office"]);
            divisionsArray.push(['DLQC','Division of Laboratory Quality Certification']);
            divisionsArray.push(['DOG','Division of Genetics']);
            divisionsArray.push(['DTM','Division of Translational Medicine']);
            divisionsArray.push(['SPH','School of Public Health']);
            var division1HTML = '<select id="division1" data-toggle="select" class="form-control select select-inverse mrs mbm">';
            for(i=0; i<divisionsArray.length;i++){
                if (divisionsArray[i][0]==division1) {
                    division1HTML += '<option value="' + divisionsArray[i][0] + '" selected>' + divisionsArray[i][1] + '</option>';
                }
                else
                {
                    division1HTML += '<option value="' + divisionsArray[i][0] + '">' + divisionsArray[i][1] + '</option>';
                }
            }
            division1HTML += "</select disabled>";
            document.getElementById("division1Select").innerHTML = division1HTML;
            var division2HTML = '<select id="division2" data-toggle="select" class="form-control select select-inverse mrs mbm">';
            division2HTML += '<option value="None">--blank--</option>';
            for(i=0; i<divisionsArray.length;i++){
                if (divisionsArray[i][0]==division2) {
                    division2HTML += '<option value="' + divisionsArray[i][0] + '" selected>' + divisionsArray[i][1] + '</option>';
                }
                else
                {
                    division2HTML += '<option value="' + divisionsArray[i][0] + '">' + divisionsArray[i][1] + '</option>';
                }
            }
            division2HTML += "</select>";
            document.getElementById("division2Select").innerHTML = division2HTML;
            //end divisions 1 and 2.
            //location
            var locationArray=['1450','CMS','DAI','ESP','GL'];
            var locationHTML = '<select id="location" data-toggle="select" class="form-control select select-inverse mrs mbm">';
            for(i=0; i<locationArray.length;i++){
                if (locationArray[i]==location) {
                    locationHTML += '<option value="' + locationArray[i] + '" selected>' + locationArray[i] + '</option>';
                }
                else
                {
                    locationHTML += '<option value="' + locationArray[i] + '">' + locationArray[i] + '</option>';
                }
            }
            locationHTML += "</select>";
            document.getElementById("locationSelect").innerHTML = locationHTML;
            //end location
            if(principalInvestigator){
                document.getElementById("piCheckbox").checked=true;
                $scope.pichecked = true;
//                jQuery("#amgTab").hide();
            };
            $('#piCheckbox').change(function () {
                $('#amgTab').toggle(this.checked);
            });
            $scope.room = room;
            var finalDayDate = new Date(finalDay);
            var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            var finalDayMonth = months[finalDayDate.getMonth()];            
            var finalDayText = finalDayDate.getDate() + " " + finalDayMonth + ", " + finalDayDate.getFullYear();
            $scope.finalDay = finalDayText;
            document.getElementById("specialInstructions").value = specialInstructions;
            jQuery('select').select2(); //flat UI changed from select to select2;
            //get user's display name
            restUrl = hostweburl + "/_api/sp.userprofiles.peoplemanager/getmyproperties";
            $http.get(restUrl).success(function (data){
                var ThisUsersDisplayName = data.DisplayName;
                var thisUsersAccountName = data.AccountName;
                sharedProperties.setCurrentUser(ThisUsersDisplayName);
                sharedProperties.setCurrentUserAccount(thisUsersAccountName);
                sharedProperties.setCurrentUserData(data);
                getCurrentUserGroupColl();
                    }).error(function (data) {
                    alert("Error getting current user");
                });
            //end get user's display name
            //populate Safety Stuff
             jQuery.when(getUserInfo(safetySignature)).done(function(answer){
                $scope.signatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.signatureDisplayName = "Not Signed";
                });
            //end populate safety stuff
            //populate AMG Stuff
             jQuery.when(getUserInfo(amgSignature)).done(function(answer){
                $scope.amgSignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.amgSignatureDisplayName = "Not Signed";
                });
            //end populate AMG Stuff
            //populate library
             jQuery.when(getUserInfo(dickermanSignature)).done(function(answer){
                $scope.dickermanSignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.dickermanSignatureDisplayName = "Not Signed";
                });            
            //end populate library
            //populate lab
             jQuery.when(getUserInfo(labClothingSignature)).done(function(answer){
                $scope.labSignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.labSignatureDisplayName = "Not Signed";
                });
            //end populate lab
            //populate telecomm
             jQuery.when(getUserInfo(teleCommSignature)).done(function(answer){
                $scope.teleCommSignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.teleCommSignatureDisplayName = "Not Signed";
                });
            //end populate telecomm
            //populate IT Group
             jQuery.when(getUserInfo(itsSignature)).done(function(answer){
                $scope.itsSignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.itsSignatureDisplayName = "Not Signed";
                });
            //end populate IT Group
            //populate sph signature
             jQuery.when(getUserInfo(sphSignature)).done(function(answer){
                $scope.sphSignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.sphSignatureDisplayName = "Not Signed";
                });
            //end populate sph signature
            //populate bms signature
             jQuery.when(getUserInfo(bmsSignature)).done(function(answer){
                $scope.bmsSignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.bmsSignatureDisplayName = "Not Signed";
                });
            //end populate bms signature
            //populate div admin signature
             jQuery.when(getUserInfo(divAdminSignature)).done(function(answer){
                $scope.divAdminSignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.divAdminSignatureDisplayName = "Not Signed";
                });
            //end populate div admin signature
            //populate security signature
             jQuery.when(getUserInfo(securitySignature)).done(function(answer){
                $scope.securitySignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.securitySignatureDisplayName = "Not Signed";
                });
            //end populate doh signature
            //populate mso signature
             jQuery.when(getUserInfo(keysSignature)).done(function(answer){
                $scope.keysSignatureDisplayName = answer.Title;
                $scope.$apply();
                }).fail(function(){
                    $scope.keysSignatureDisplayName = "Not Signed";
                });
            //end populate mso signature            
            readAllAttachments();
            });
         //begin update
    $scope.updateEdit = function(){
      //save any updates...
     	var clearanceDisplayName = "";
	    var selectedLab = "";
	    var supervisorName = "";
	    var employeeAction = "";
	    var employeeEmail;
	    var firstName;
	    var lastName;
        var specialInstructions;
        var office365user = document.getElementById("office365user").checked;
	    //get selected user
        if (office365user)
        {
            //if this is true, then the person does NOT have an Office 365 account
            firstName = document.getElementById("firstNameInput").value;
            lastName = document.getElementById("lastNameInput").value;
            clearanceDisplayName = firstName + " " + lastName;
            employeeEmail = document.getElementById("emailInput").value;
        }
        else
        {
            var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;
            var users = peoplePicker.GetAllUserInfo();
            loginName = users[0].Key;
            for (var i = 0; i < users.length; i++) {
            var user = users[i];
                for (var userProperty in user) {
                    if (userProperty=="DisplayText") {
                        clearanceDisplayName = user[userProperty];
                        var lastNamePos = clearanceDisplayName.indexOf(",");
                        lastName = clearanceDisplayName.substring(0, lastNamePos);
                    }
                    if (userProperty == "Description") {
                        var fnPos = user[userProperty].indexOf(".");
                        firstName = user[userProperty].substring(0, fnPos);
                        firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1);
                    }
                }
            }    
        }
        $scope.clearanceDisplayName = clearanceDisplayName;
        //get supervisor   
        var peoplePickerSuper = SPClientPeoplePicker.SPClientPeoplePickerDict.supervisor_TopSpan;
        var users = peoplePickerSuper.GetAllUserInfo();
        superLoginName = users[0].Key;
        for (var i = 0; i < users.length; i++) {
        var user = users[i];
        for (var userProperty in user) {
            if (userProperty=="DisplayText") {
            supervisorName = user[userProperty];
            }
        }
        }//end get supervisor
        if (office365user)
        {
            //if the person is not an office 365 user, then we will only get the supervisor's ID.
            loginID = null;
            getSuperId();    
        }
        else
        {
            getUserId();    
        }
            //get user ID
        function getUserId() {
            var context = new SP.ClientContext.get_current();
            this.user = context.get_web().ensureUser(loginName);
            context.load(this.user);
            context.executeQueryAsync(
                 Function.createDelegate(null, ensureUserSuccess), 
                 Function.createDelegate(null, onFail)
            );
        }     
        function ensureUserSuccess() {
            loginID = this.user.get_id();
            employeeEmail = this.user.get_email();
            getSuperId();
        }
        function onFail(sender, args) {
            alert('Query failed. Error: ' + args.get_message());
        }
        //get supervisor ID
        function getSuperId() {
            var context = new SP.ClientContext.get_current();
            this.user = context.get_web().ensureUser(superLoginName);
            context.load(this.user);
            context.executeQueryAsync(
                 Function.createDelegate(null, ensureSuperSuccess), 
                 Function.createDelegate(null, onSuperFail)
            );
        }     
        function ensureSuperSuccess() {
            superID = this.user.get_id();
            addListItem();
        }
        function onSuperFail(sender, args) {
            alert('Query failed. Error: ' + args.get_message());
        }
        //end get super ID
        function addListItem() {
            var itemResponse = sharedProperties.getCurrentItem();
            var Office365UserText="";
            if (office365user) {
                Office365UserText = "No"
            }else{Office365UserText = "Yes"};
            selectedLab = $("#labSelect").val();
            employeeAction = $("#employeeAction").val();
            var division = $("#division1").val();
            var division2 = $("#division2").val();
            var location = $("#location").val();
            var laptopComment = jQuery("#laptopComment").val();
            var laptopTagNumber = jQuery("#laptopTagNumber").val();
            var principalInvestigator = document.getElementById("piCheckbox").checked;
            var room = document.getElementById("roomInput").value;
            var specialInstructions = document.getElementById("specialInstructions").value;
            var finalDay = jQuery("#datepicker-02").val();
            var employeeType = $("#employeeType").val();
        //using REST
            var itemType = "SP.Data.ClearanceListItem";
            //figure out what has changed
            var currentUser = sharedProperties.getCurrentUser();
            var stuffThatChanged=sharedProperties.getChangeHistory();
            if (stuffThatChanged==undefined) {
                stuffThatChanged="";
            }
            var today = new Date();
            var todayText = today.toLocaleString();
            if (division!=itemResponse.DivCode) {
                stuffThatChanged += todayText + " Division changed to " + division + " by " + currentUser + "<br>";
            };
            if (division2!=itemResponse.DivCode2) {
                stuffThatChanged += todayText + " Division 2 changed to " + division2 + " by " + currentUser + "<br>";
            };  
            if (clearanceDisplayName!=itemResponse.Employee_x0020_Display_x0020_Nam) {
                stuffThatChanged += todayText + " Name was changed to " + clearanceDisplayName + " by " + currentUser + "<br>";
            };
            if (office365User!=itemResponse.Office365User) {
                stuffThatChanged += todayText + " Office 365 User Status was changed to " + office365User + " by " + currentUser + "<br>";
            };
            if (selectedLab!=itemResponse.Lab) {
                stuffThatChanged += todayText + " Lab was changed to " + selectedLab + " by " + currentUser + "<br>";
            };
            if (superID!=itemResponse.SupervisorId) {
                stuffThatChanged += todayText + " Supervisor was changed to " + supervisorName + " by " + currentUser + "<br>";
            };
            if (employeeAction!=itemResponse.Status) {
                stuffThatChanged += todayText + " Action was changed to " + employeeAction + " by " + currentUser + "<br>";
            };
            if (location!=itemResponse.Location) {
                stuffThatChanged += todayText + " Location was changed to " + location + " by " + currentUser + "<br>";
            };
            if (itemResponse.Room) {var roomCompare=itemResponse.Room}else{var roomCompare=""};
            if (room!=roomCompare) {
                stuffThatChanged += todayText + " Room was changed to " + room + " by " + currentUser + "<br>";
            };
            var finalDayDate = new Date(finalDay);
            var finalDayCompare = new Date(itemResponse.FinalDay);
            var newTime = finalDayDate.getTime();
            var oldTime = finalDayCompare.getTime();
            if (newTime!=oldTime) {
                stuffThatChanged += todayText + " Final Day was changed to " + finalDayDate.toLocaleString() + " by " + currentUser + "<br>";
            };
            if (employeeType!=itemResponse.EmployeeType) {
                stuffThatChanged += todayText + " Employee Type was changed to " + employeeType + " by " + currentUser + "<br>";
            };
            if (itemResponse.EmployeeEmail) {var eeCompare=itemResponse.EmployeeEmail}else{var eeCompare=""};
            if (employeeEmail!=eeCompare) {
                stuffThatChanged += todayText + " Employee Email was changed to " + employeeEmail + " by " + currentUser + "<br>";
            };
            if (principalInvestigator!=itemResponse.PrincipalInvestigator) {
                stuffThatChanged += todayText + " Principal Investigator was changed to " + principalInvestigator + " by " + currentUser + "<br>";
            };
            if (itemResponse.SpecialInstructions) {var siCompare=itemResponse.SpecialInstructions}else{var siCompare=""};
            if (specialInstructions!=siCompare) {
                stuffThatChanged += todayText + " Special Instructions was changed to " + specialInstructions + " by " + currentUser + "<br>";
            };
            var signatureComment = jQuery("#safetyComment").val();
            var amgComment = document.getElementById("amgComment").value;
            var libraryComment = jQuery("#dickermanComment").val();
            var teleCommComment = jQuery("#teleCommComment").val();
            var itsComment = jQuery("#itsComment").val();
            var sphComment = jQuery("#sphComment").val();
            var divAdminComment = jQuery("#divAdminComment").val();
            var bmsComment = jQuery("#bmsComment").val();
            var dohComment = jQuery("#dohSecurityComment").val();
            var wadsworthSecurityComment = jQuery("#wadsworthSecurityComment").val();
            var cmsSecurityComment = jQuery("#cmsSecurityComment").val();
            var westernAveSecurityComment = jQuery("#westernAveSecurityComment").val();
            var keysCommentBiggs = jQuery("#keysCommentBiggs").val();
            var keysCommentDAI = jQuery("#keysCommentDAI").val();
            var keysCommentGL = jQuery("#keysCommentGL").val();
            if (itemResponse.keysCommentBiggs) { var keysBiggsCompare = itemResponse.keysCommentBiggs } else { var keysBiggsCompare = "" };
            if (keysCommentBiggs != keysBiggsCompare) {
                stuffThatChanged += todayText + " Keys Biggs Comment changed to " + keysCommentBiggs + " by " + currentUser + "<br>";
            }
            if (itemResponse.keysCommentDAI) { var keysDAICompare = itemResponse.keysCommentDAI } else { var keysDAICompare = "" };
            if (keysCommentDAI != keysDAICompare) {
                stuffThatChanged += todayText + " Keys DAI Comment changed to " + keysCommentDAI + " by " + currentUser + "<br>";
            }
            if (itemResponse.keysCommentGL) { var keysGLCompare = itemResponse.keysCommentGL } else { var keysGLCompare = "" };
            if (keysCommentGL != keysGLCompare) {
                stuffThatChanged += todayText + " Keys GL Comment changed to " + keysCommentGL + " by " + currentUser + "<br>";
            }
            if (itemResponse.SafetyComment) {var safetyCompare=itemResponse.SafetyComment}else{var safetyCompare=""};
            if (signatureComment!=safetyCompare) {
                stuffThatChanged += todayText + " Safety Comment changed to " + signatureComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.FiscalComment) {var fiscalCompare=itemResponse.FiscalComment}else{var fiscalCompare=""};
            if (amgComment!=fiscalCompare) {
                stuffThatChanged += todayText + " AMG Comment changed to " + amgComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.DickermanComment) {var libraryCompare=itemResponse.DickermanComment}else{var libraryCompare=""};
            if (libraryComment!=libraryCompare) {
                stuffThatChanged += todayText + " Library Comment changed to " + libraryComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.TeleCommComment) {var teleCompare=itemResponse.TeleCommComment}else{var teleCompare=""};
            if (teleCommComment!=teleCompare) {
                stuffThatChanged += todayText + " Telecomm Comment changed to " + teleCommComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.ITSComment) {var itsCompare=itemResponse.ITSComment}else{var itsCompare=""};
            if (itsComment!=itsCompare) {
                stuffThatChanged += todayText + " ITS Comment changed to " + itsComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.SPHComment) {var sphCompare=itemResponse.SPHComment}else{var sphCompare=""};
            if (sphComment!=sphCompare) {
                stuffThatChanged += todayText + " SPH Comment changed to " + sphComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.DivAdminComment) {var divAdminCompare=itemResponse.DivAdminComment}else{var divAdminCompare=""};
            if (divAdminComment!=divAdminCompare) {
                stuffThatChanged += todayText + " Admin Comment changed to " + divAdminComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.BMSComment) {var bmsCompare=itemResponse.BMSComment}else{var bmsCompare=""};
            if (bmsComment!=bmsCompare) {
                stuffThatChanged += todayText + " BMS Comment changed to " + bmsComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.dohSecurityComment) {var dohCompare=itemResponse.dohSecurityComment}else{var dohCompare=""};
            if (dohComment!=dohCompare) {
                stuffThatChanged += todayText + " DOH Security Comment changed to " + dohComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.wadsworthSecurityComment) {var wCompare=itemResponse.wadsworthSecurityComment}else{var wCompare=""};
            if (wadsworthSecurityComment!=wCompare) {
                stuffThatChanged += todayText + " Wadsworth Security Comment changed to " + wadsworthSecurityComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.cmsSecurityComment) {var cmsCompare=itemResponse.cmsSecurityComment}else{var cmsCompare=""};
            if (cmsSecurityComment!=cmsCompare) {
                stuffThatChanged += todayText + " CMS Security Comment changed to " + cmsSecurityComment + " by " + currentUser + "<br>";
            }
            if (itemResponse.westernAveSecurityComment) {var westernCompare=itemResponse.westernAveSecurityComment}else{var westernCompare=""};
            if (westernAveSecurityComment!=westernCompare) {
                stuffThatChanged += todayText + " Western Ave Security Comment changed to " + westernAveSecurityComment + " by " + currentUser + "<br>";
            }
            var item = {"__metadata": { "type": itemType },
            "SafetyComment": signatureComment,
            "FiscalComment": amgComment,
            "DickermanComment": libraryComment,
            "TeleCommComment": teleCommComment,
            "ITSComment": itsComment,
            "SPHComment": sphComment,
            "DivAdminComment": divAdminComment,
            "BMSComment": bmsComment,
            "dohSecurityComment": dohComment,
            "wadsworthSecurityComment": wadsworthSecurityComment,
            "cmsSecurityComment": cmsSecurityComment,
            "westernAveSecurityComment": westernAveSecurityComment,
            "keysCommentBiggs": keysCommentBiggs,
            "keysCommentDAI": keysCommentDAI,
            "keysCommentGL": keysCommentGL,
            "Title":clearanceDisplayName,
            "Status":employeeAction,
            "EmployeeNameId": loginID,
            "Employee_x0020_Display_x0020_Nam": clearanceDisplayName,
            "EmployeeFirstName": firstName,
            "EmployeeLastName": lastName,
            "SupervisorId":superID,
            "Lab":selectedLab,
            "Office365User": Office365UserText,
            "DivCode": division,
            "DivCode2": division2,
            "Location": location,
            "Room": room,
            "EmployeeEmail":employeeEmail,
            "FinalDay":finalDay,
            "EmployeeType":employeeType,
            "SpecialInstructions":specialInstructions,
            "PrincipalInvestigator":principalInvestigator,
            "ChangeHistory":stuffThatChanged,
            "LaptopComment":laptopComment,
            "LaptopTagNumber":laptopTagNumber
            };
            var requestDigest = sharedProperties.getRequestDigest();
            $http.defaults.headers.common.Accept = "application/json;odata=verbose";
            $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
            $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
            $http.defaults.headers.post['If-Match'] = "*";
            $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
            $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
            var dfd = $q.defer();
            var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
            $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path;
            window.location.href = finalURL;
            }).error(function (data) {
                dfd.reject("failed to add a clearance request");
            });
            return dfd.promise;
        }//end addListItem
      
    };
    //end update
    //get user groups
    function getCurrentUserGroupColl()
    {
        var accountName = sharedProperties.getCurrentUserAccount();
        var context = new SP.ClientContext.get_current();
        this.user = context.get_web().ensureUser(accountName);
        context.load(this.user);
        context.executeQueryAsync(
            Function.createDelegate(null, ensureUserSuccess),
            Function.createDelegate(null, onUserFail)
            );
        }     
        function ensureUserSuccess() {
            var thisUserID = this.user.get_id();
            sharedProperties.setThisUserID(thisUserID);
            var restURL = hostweburl + "/_api/web/GetUserById("+ thisUserID +")/Groups";
            jQuery.ajax({
                url: restURL, 
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" },
                success: userGroupSuccess,
                error: userGroupFailure});
        }
        function onUserFail(sender, args) {
            alert('Query failed. Error: ' + args.get_message());
        }
    function userGroupSuccess(data){
        var permissionToEditTop = false;
        var results = data.d.results;
        var safetyGroup;
        var groupArraySize = results.length;
        for(var i=0; i < groupArraySize;i++){
            groupTitle = results[i].Title;
          if(groupTitle==="Clearance-Safety"){
            permissionToEditTop = true;
            jQuery("#safetyButton").prop("disabled",false);
            jQuery("#safetyComment").prop("disabled", false);
            if (safetySignature!=null) {//it's been signed.
                jQuery("#unsafetyButton").prop("disabled", false);
            }
            }
          if(groupTitle==="Clearance-AMG"){
            permissionToEditTop = true;
            jQuery("#amgButton").prop("disabled",false);
            jQuery("#amgComment").prop("disabled", false);
            if (amgSignature != null) {
                jQuery("#unAMGButton").prop("disabled", false);
            }
            }
          if(groupTitle==="Clearance-Library"){
            permissionToEditTop = true;
            jQuery("#dickermanButton").prop("disabled",false);
            jQuery("#dickermanComment").prop("disabled", false);
            if (dickermanSignature != null) {
                jQuery("#unDickermanButton").prop("disabled", false);
            }
            }
          if(groupTitle==="Clearance-Telecomm"){
            permissionToEditTop = true;
            jQuery("#telecommButton").prop("disabled",false);
            jQuery("#teleCommComment").prop("disabled", false);
            if (teleCommSignature != null) {
                jQuery("#unTelecommButton").prop("disabled", false);
            }
            }
          if(groupTitle==="Clearance-ITS"){
            permissionToEditTop = true;
            jQuery("#itsButton").prop("disabled",false);
            jQuery("#itsComment").prop("disabled", false);
            if (itsSignature != null) {
                jQuery("#unITSButton").prop("disabled", false);
            }
            }
          if(groupTitle==="Clearance-EHS"){
            permissionToEditTop = true;
            jQuery("#sphButton").prop("disabled",false);
            jQuery("#sphComment").prop("disabled", false);
            if (sphSignature != null) {
                jQuery("#unSPHButton").prop("disabled", false);
            }
            }
          if(groupTitle==="Clearance-BMS"){
            permissionToEditTop = true;
            jQuery("#bmsButton").prop("disabled",false);
            jQuery("#bmsComment").prop("disabled", false);
            if (bmsSignature != null) {
                jQuery("#unBMSButton").prop("disabled", false);
            }
            }            
          if(groupTitle==="Clearance-Admin"){//these people can edit everything
            permissionToEditTop = true;
            jQuery("#safetyButton").prop("disabled",false);
            jQuery("#safetyComment").prop("disabled",false);
            jQuery("#amgButton").prop("disabled",false);
            jQuery("#amgComment").prop("disabled",false);
            jQuery("#dickermanButton").prop("disabled",false);
            jQuery("#dickermanComment").prop("disabled",false);
            jQuery("#telecommButton").prop("disabled",false);
            jQuery("#teleCommComment").prop("disabled",false);
            jQuery("#itsButton").prop("disabled",false);
            jQuery("#itsComment").prop("disabled",false);            
            jQuery("#sphButton").prop("disabled",false);
            jQuery("#sphComment").prop("disabled",false);
            jQuery("#bmsButton").prop("disabled",false);
            jQuery("#bmsComment").prop("disabled",false);
            jQuery("#adminButton").prop("disabled",false);
            jQuery("#divAdminComment").prop("disabled",false);
            var studentBool=false;
            if ($scope.employeeAction=="SPH Student/Faculty Leaving") {
                if ($scope.sphSignDate || $scope.bmsSignDate ) {
                    studentBool=true
                }
            } else { studentBool = true };
              //if they're a PI, then the AMG section does need to be signed, so treat it as signed for the 
              //purposes of allowing this item to be marked complete.
            var amgBool = false;
            if (!principalInvestigator) { amgBool = true } else {
                if($scope.amgSignatureDate){amgBool=true}
            }
            if ($scope.signatureDate && amgBool &&
                $scope.dickermanSignDate &&
                $scope.teleCommDate && $scope.itsDate &&
                studentBool &&
                $scope.divAdminDate && $scope.securityDate &&
                $scope.keysDate) {
                jQuery("#completedButton").prop("disabled", false);
            }
            jQuery("#unCompletedButton").prop("disabled",false);
            jQuery("#withdrawButton").prop("disabled", false);
            jQuery("#securityButton").prop("disabled",false);
            jQuery("#dohSecurityComment").prop("disabled",false);
            jQuery("#wadsworthSecurityComment").prop("disabled",false);
            jQuery("#cmsSecurityComment").prop("disabled",false);
            jQuery("#westernAveSecurityComment").prop("disabled",false);            
            jQuery("#keysButton").prop("disabled",false);
            jQuery("#keysCommentBiggs").prop("disabled", false);
            jQuery("#keysCommentDAI").prop("disabled", false);
            jQuery("#keysCommentGL").prop("disabled", false);
            if (divAdminSignature != null) {
                jQuery("#unAdminButton").prop("disabled", false);
            }
            }
          if(groupTitle==="Clearance-Security"){
            permissionToEditTop = true;
            jQuery("#securityButton").prop("disabled",false);
            jQuery("#dohSecurityComment").prop("disabled",false);
            jQuery("#wadsworthSecurityComment").prop("disabled",false);
            jQuery("#cmsSecurityComment").prop("disabled",false);
            jQuery("#westernAveSecurityComment").prop("disabled", false);
            if (securitySignature != null) {
                jQuery("#unSecurityButton").prop("disabled", false)
            }
            }
          if(groupTitle==="Clearance-Keys"){
            permissionToEditTop = true;
            jQuery("#keysButton").prop("disabled",false);
            jQuery("#keysCommentBiggs").prop("disabled", false);
            jQuery("#keysCommentDAI").prop("disabled", false);
            jQuery("#keysCommentGL").prop("disabled", false);
            if (keysSignature != null) {
                jQuery("#unKeysButton").prop("disabled", false)
            }
            }            
          }
          if(permissionToEditTop){
                jQuery("#saveButton").prop("disabled",false);
            }else{
            //these people are not in any of the groups, so we should disable all controls.
            jQuery("#nameInput").prop("disabled", true);
            jQuery("#emailInput").prop("disabled", true);
            jQuery("#saveButton").prop("disabled", true);
            document.getElementById("peoplePickerDiv").innerText = displayName;
            document.getElementById("labUnit").innerText = lab;
            document.getElementById("supervisor").innerText = sharedProperties.getSuper();
            document.getElementById("initiatedBy").innerText = sharedProperties.getInitiatedBy();
            jQuery("#piCheckbox").prop("disabled",true);
            jQuery("#datepicker-02").prop("disabled",true);
            document.getElementById("employeeTypeDiv").innerText = employeeType;
            document.getElementById("employeeActionSelect").innerText = employeeAction;
            var division1 = $("#division1").val();
            var division2 = $("#division2").val();
            document.getElementById("division1Select").innerText = division1;
            document.getElementById("division2Select").innerText = division2;
            document.getElementById("locationSelect").innerText = location;
            jQuery("#roomInput").prop("disabled",true);
            jQuery("#specialInstructions").prop("disabled",true);
            jQuery("#laptopTagNumber").prop("disabled",true);
            jQuery("#laptopComment").prop("disabled",true);
            $scope.isNotEditor=true;
            $scope.$apply();
          }
    }
    function userGroupFailure(){
        //do nothing
    }    
    //end get user groups
    //File read
    function readAllAttachments(){
        var restURL = hostweburl + "/_api/web/lists/getbytitle('Clearance')/items(" + itemID + ")/attachmentFiles";
        jQuery.ajax({url: restURL,
                    method: "GET",
                    headers: { "Accept": "application/json; odata=verbose" },
                    success: filesSucceed,
                    error: filesFail
                    })
    }
    function filesSucceed(data){
        var results = data.d.results;
        var filesArray=[];
        var fileObject={};
        for (var i = 0; i < results.length; i++) {
            var htmlFileName = results[i].FileName;
            var htmlFileRelativeURL = results[i].ServerRelativeUrl;
            fileObject = {fileName: htmlFileName,url: htmlFileRelativeURL};
            filesArray.push(fileObject);
        }
        $scope.amgFiles = filesArray;
        $scope.$apply();
    }
    function filesFail(){
        alert("could not read attachments");
    }
    $scope.deleteFile = function(htmlFileRelativeURL){
        var requestDigest = sharedProperties.getRequestDigest();
        var restDeleteURL = hostweburl + "/_api/web/GetFileByServerRelativeUrl('"+ htmlFileRelativeURL +"')/recycle()";
        jQuery.ajax({
            url: restDeleteURL,
            type: "POST",
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-Http-Method": "DELETE",
                "X-RequestDigest": requestDigest
                },             
                success: function (data) {
                readAllAttachments()
                },  
                error: function (err) {  
                console.log(JSON.stringify(err));
                }
        });
    }
    //end file read
    //begin file upload
    $scope.fileUpload = function(){
        var fileInput = jQuery('#amgFileInput');
        for (var i = 0; i < fileInput[0].files.length; i++) {
            var file = fileInput[0].files[i];
            var fileSize = file.size;
            var fileName = file.name;
            if (fileSize > 10485760) {
                alert("File sizes are restricted to 10 mb.")
            } else {
                var getFile = getFileBuffer();
                getFile.done(function(arrayBuffer){
                    var addFile = addFileToListItem(arrayBuffer,fileName);
                    jQuery.when(addFile).done(function(){
                        readAllAttachments()
                        }).fail(function(){
                            console.log("Couldn't add file");
                        });
                });
            }
        }
        function addFileToListItem(arrayBuffer, fileName){
            var restURL = hostweburl + "/_api/web/lists/GetByTitle('Clearance')/items(" + itemID + ")/AttachmentFiles/add(FileName='" + fileName + "')";
            //document.getElementById("attachmentsList").innerHTML = "File uploading..." + '<img src="../Images/bar90.gif">';
            var requestDigest = sharedProperties.getRequestDigest();
            return jQuery.ajax({
                url: restURL,
                type: "POST",
                data: arrayBuffer,
                processData: false,
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "X-RequestDigest": requestDigest,
                    "content-length": arrayBuffer.bytelength
                },
                contentType: "application/json;odata=verbose"
                });
        }
        function getFileBuffer() {
            var fileInput = jQuery('#amgFileInput');
            var deferred = jQuery.Deferred();
            var reader = new FileReader();
            reader.onloadend = function (e) {
                deferred.resolve(e.target.result);
            }
            reader.onerror = function (e) {
                deferred.reject(e.target.error);
            }
            reader.readAsArrayBuffer(fileInput[0].files[0]);
            return deferred.promise();
        }
        function readAllAttachments(){
            var restURL = hostweburl + "/_api/web/lists/getbytitle('Clearance')/items(" + itemID + ")/attachmentFiles";
            jQuery.ajax({url: restURL,
                        method: "GET",
                        headers: { "Accept": "application/json; odata=verbose" },
                        success: filesSucceed,
                        error: filesFail
                        })
        }
        function filesSucceed(data){
            var results = data.d.results;
            var filesArray=[];
            var fileObject={};
            for (var i = 0; i < results.length; i++) {
                var htmlFileName = results[i].FileName;
                var htmlFileRelativeURL = results[i].ServerRelativeUrl;
                fileObject = {fileName: htmlFileName,url: htmlFileRelativeURL};
                filesArray.push(fileObject);
            }
            $scope.amgFiles = filesArray;
            $scope.$apply();
        }
        function filesFail(){
            alert("could not read attachments");
        }     
    }
    //end file upload
    //begin security Signature
    $scope.signSafety = function(){
        var signatureComment = jQuery("#safetyComment").val();
        var loginID;
        var restUrl = hostweburl + "/_api/sp.userprofiles.peoplemanager/getmyproperties";
        //get user ID
        $http.get(restUrl).success(function(data){
            var accountName = data.AccountName;
            var context = new SP.ClientContext.get_current();
            this.user = context.get_web().ensureUser(accountName);
            context.load(this.user);
            context.executeQueryAsync(
                 Function.createDelegate(null, ensureLoginSuccess), 
                 Function.createDelegate(null, onLoginFail)
            );
            function ensureLoginSuccess() {
                loginID = this.user.get_id();
                var displayName = this.user.get_title();
                continueSignature(displayName);
            };
            function onLoginFail(sender, args) {
                alert('Query failed. Error: ' + args.get_message());
            };
            function continueSignature(displayName){
                var today = new Date();
                var itemType = "SP.Data.ClearanceListItem";
                var changeHistory = sharedProperties.getChangeHistory();
                if (changeHistory==null) {
                    changeHistory="";
                };
                var today = new Date();
                var todayText = today.toLocaleString();
                var stuffThatChanged = todayText + " Safety signed by " + displayName + " Comment: " + signatureComment+"<br>";
                stuffThatChanged = changeHistory + stuffThatChanged;
                var item = {"__metadata": { "type": itemType },
                "SafetySignatureId":loginID,
                "SafetySignDate":today,
                "SafetyComment": signatureComment,
                "ChangeHistory": stuffThatChanged
                };
                var requestDigest = sharedProperties.getRequestDigest();
                $http.defaults.headers.common.Accept = "application/json;odata=verbose";
                $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
                $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
                $http.defaults.headers.post['If-Match'] = "*";
                $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
                $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
                var dfd = $q.defer();
                var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
                $http.post(restURL, item).success(function (data) {
                //resolve the new data
                dfd.resolve(data.d);
                var protocol = window.location.protocol;
                var path = window.location.pathname;
                var host = window.location.hostname;
                var finalURL = protocol + "//" + host + path;
                window.location.href = finalURL;
                }).error(function (data) {
                    dfd.reject("failed to update a clearance request");
                });
                return dfd.promise;
            };
        });
    };
        //end security signature
        //begin unsign security
    $scope.unSignSafety = function () {
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var signatureComment = jQuery("#safetyComment").val();
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory == null) {
            changeHistory = "";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var displayName = sharedProperties.getCurrentUser();
        var stuffThatChanged = todayText + " Safety signature withdrawn by " + displayName + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {
            "__metadata": { "type": itemType },
            "SafetySignatureId": null,
            "SafetySignDate": null,
            "SafetyComment": signatureComment,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path;
            $scope.signatureDisplayName = "Not Signed";
            $scope.signatureDate = "";
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };
        //end unsign security
    //begin AMG Signature
    $scope.signAMG = function(){
        var amgComment = jQuery("#amgComment").val();
        var loginID;
        var restUrl = hostweburl + "/_api/sp.userprofiles.peoplemanager/getmyproperties";
        //get user ID
        $http.get(restUrl).success(function(data){
            var accountName = data.AccountName;
            var context = new SP.ClientContext.get_current();
            this.user = context.get_web().ensureUser(accountName);
            context.load(this.user);
            context.executeQueryAsync(
                 Function.createDelegate(null, ensureLoginSuccess), 
                 Function.createDelegate(null, onLoginFail)
            );
            function ensureLoginSuccess() {
                loginID = this.user.get_id();
                var displayName = this.user.get_title();
                continueSignature(displayName);
            };
            function onLoginFail(sender, args) {
                alert('Query failed. Error: ' + args.get_message());
            };
            function continueSignature(displayName){
                var today = new Date();
                var itemType = "SP.Data.ClearanceListItem";
                var changeHistory = sharedProperties.getChangeHistory();
                if (changeHistory==null) {
                    changeHistory="";
                };
                var today = new Date();
                var todayText = today.toLocaleString();
                var stuffThatChanged = todayText + " AMG signed by " + displayName + " Comment: " + amgComment+"<br>";
                stuffThatChanged = changeHistory + stuffThatChanged;
                var item = {"__metadata": { "type": itemType },
                "FiscalSignatureId":loginID,
                "FiscalSignDate":today,
                "FiscalComment": amgComment,
                "ChangeHistory": stuffThatChanged
                };
                var requestDigest = sharedProperties.getRequestDigest();
                $http.defaults.headers.common.Accept = "application/json;odata=verbose";
                $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
                $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
                $http.defaults.headers.post['If-Match'] = "*";
                $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
                $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
                var dfd = $q.defer();
                var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
                $http.post(restURL, item).success(function (data) {
                //resolve the new data
                dfd.resolve(data.d);
                var protocol = window.location.protocol;
                var path = window.location.pathname;
                var host = window.location.hostname;
                var finalURL = protocol + "//" + host + path;
                window.location.href = finalURL;
                }).error(function (data) {
                    dfd.reject("failed to update a clearance request");
                });
                return dfd.promise;
            };
        });
    };    
        //end AMG Signature
        //begin unsign AMG
    $scope.unSignAMG = function () {
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var amgComment = jQuery("#amgComment").val();
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory == null) {
            changeHistory = "";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var displayName = sharedProperties.getCurrentUser();
        var stuffThatChanged = todayText + " AMG signature withdrawn by " + displayName + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {
            "__metadata": { "type": itemType },
            "FiscalSignatureId": null,
            "FiscalSignDate": null,
            "FiscalComment": amgComment,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            $scope.amgDisplayName = "Not Signed";
            $scope.amgSignDate = "";
            var finalURL = protocol + "//" + host + path;
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };
        //end unsign AMG
    //begin library signature
    $scope.signLibrary = function(){
        var libraryComment = jQuery("#dickermanComment").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " Library signed by " + displayName + " Comment: " + libraryComment+"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "DickermanSignatureId":loginID,
        "DickermanSignDate":today,
        "DickermanComment": libraryComment,
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };     
        //end library signature
        //begin unsign library
    $scope.unSignLibrary = function () {
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var libraryComment = jQuery("#dickermanComment").val();
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory == null) {
            changeHistory = "";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var displayName = sharedProperties.getCurrentUser();
        var stuffThatChanged = todayText + " Library signature withdrawn by " + displayName + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {
            "__metadata": { "type": itemType },
            "DickermanSignatureId": null,
            "DickermanSignDate": null,
            "DickermanComment": libraryComment,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path;
            $scope.libraryDisplayName = "Not Signed";
            $scope.librarySignDate = "";
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    }
        //end unsign library
    //begin telecommunications signature
    $scope.signTelecomm = function(){
        var teleCommComment = jQuery("#teleCommComment").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " Telecommunications signed by " + displayName + " Comment: " + teleCommComment+"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "TeleCommSignatureId":loginID,
        "TeleCommDate":today,
        "TeleCommComment": teleCommComment,
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };    
        //end telecommunications signature
        //begin unsign telecommunications
    $scope.unSignTelecomm=function(){
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var teleCommComment = jQuery("#teleCommComment").val();
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory == null) {
            changeHistory = "";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var displayName = sharedProperties.getCurrentUser();
        var stuffThatChanged = todayText + " Telecomm signature withdrawn by " + displayName + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {
            "__metadata": { "type": itemType },
            "TeleCommSignatureId": null,
            "TeleCommDate": null,
            "TeleCommComment": teleCommComment,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path;
            $scope.teleCommSignatureDisplayName = "Not Signed";
            $scope.teleCommDate = "";
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    }
        //end unsign telecommunications
    //begin ITS signature
    $scope.signITS = function(){
        var itsComment = jQuery("#itsComment").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " ITS signed by " + displayName + " Comment: " + itsComment +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "ITSSignatureId":loginID,
        "ITSDate":today,
        "ITSComment": itsComment,
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };    
        //end ITS signature
        //begin unsign ITS
    $scope.unSignITS = function () {
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var itsComment = jQuery("#itsComment").val();
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory == null) {
            changeHistory = "";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var displayName = sharedProperties.getCurrentUser();
        var stuffThatChanged = todayText + " ITS signature withdrawn by " + displayName + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {
            "__metadata": { "type": itemType },
            "ITSSignatureId": null,
            "ITSDate": null,
            "ITSComment": itsComment,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path;
            $scope.itsSignatureDisplayName = "Not Signed";
            $scope.itsDate = "";
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    }
        //end unsign ITS
    //begin SPH
    $scope.signSPH = function(){
        var sphComment = jQuery("#sphComment").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " SPH signed by " + displayName + " Comment: " + sphComment +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "SPHSignatureId":loginID,
        "SPHSignDate":today,
        "SPHComment": sphComment,
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };        
        //end sph
        //begin unsign sph
    $scope.unSignSPH = function () {
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var sphComment = jQuery("#sphComment").val();
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory == null) {
            changeHistory = "";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var displayName = sharedProperties.getCurrentUser();
        var stuffThatChanged = todayText + " EHS signature withdrawn by " + displayName + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {
            "__metadata": { "type": itemType },
            "SPHSignatureId": null,
            "SPHSignDate": null,
            "SPHComment": sphComment,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path;
            $scope.sphSignatureDisplayName = "Not Signed";
            $scope.sphSignDate = "";
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    }
        //end unsign sph
    //begin sign admin
    $scope.signAdmin = function(){
        var divAdminComment = jQuery("#divAdminComment").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " Admin signed by " + displayName + " Comment: " + divAdminComment +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "DivAdminSignatureId":loginID,
        "DivAdminDate":today,
        "DivAdminComment": divAdminComment,
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
            dfd.resolve(data.d);
            document.location.reload();
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };            
        //end sign admin
        //begin unsign admin
    $scope.unSignAdmin = function () {
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var divAdminComment = jQuery("#divAdminComment").val();
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory == null) {
            changeHistory = "";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var displayName = sharedProperties.getCurrentUser();
        var stuffThatChanged = todayText + " Admin signature withdrawn by " + displayName + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {
            "__metadata": { "type": itemType },
            "DivAdminSignatureId": null,
            "DivAdminDate": null,
            "DivAdminComment": divAdminComment,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path;
            $scope.divAdminSignatureDisplayName = "Not Signed";
            $scope.divAdminDate = "";
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    }
        //end unsign admin
    //begin sign BMS
    $scope.signBMS = function(){
        var bmsComment = jQuery("#bmsComment").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " SPH signed by " + displayName + " Comment: " + bmsComment +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "BMSSignatureId":loginID,
        "BMSSignDate":today,
        "BMSComment": bmsComment,
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };    
        //end sign BMS
        //begin unsign BMS
    $scope.unSignBMS = function () {
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var bmsComment = jQuery("#bmsComment").val();
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory == null) {
            changeHistory = "";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var displayName = sharedProperties.getCurrentUser();
        var stuffThatChanged = todayText + " BMS signature withdrawn by " + displayName + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {
            "__metadata": { "type": itemType },
            "BMSSignatureId": null,
            "BMSSignDate": null,
            "BMSComment": bmsComment,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            var finalURL = protocol + "//" + host + path;
            $scope.bmsSignatureDisplayName = "Not Signed";
            $scope.bmsSignDate = "";
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    }
        //end unsign BMS
    //begin sign Security
    $scope.signSecurity = function(){
        var currentItem = sharedProperties.getCurrentItem();
        var dohComment = jQuery("#dohSecurityComment").val();
        var wadsworthSecurityComment = jQuery("#wadsworthSecurityComment").val();
        var cmsSecurityComment = jQuery("#cmsSecurityComment").val();
        var westernAveSecurityComment = jQuery("#westernAveSecurityComment").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var thisComment = "";
        if (dohComment) {
            thisComment += dohComment + " ";
        }
        if (wadsworthSecurityComment) {
            thisComment += wadsworthSecurityComment + " ";
        }
        if (cmsSecurityComment) {
            thisComment += cmsSecurityComment + " ";
        }
        if (westernAveSecurityComment) {
            thisComment += westernAveSecurityComment + " ";
        }
        var stuffThatChanged = todayText + " Security signed by " + displayName + " Comment: " + thisComment +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "securitySignatureId":loginID,
        "securitySignDate":today,
        "dohSecurityComment": dohComment,
        "wadsworthSecurityComment": wadsworthSecurityComment,
        "cmsSecurityComment": cmsSecurityComment,
        "westernAveSecurityComment": westernAveSecurityComment,
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };        
        //end sign Security
        //begin unsign security
    $scope.unSignSecurity = function () {
        var currentItem = sharedProperties.getCurrentItem();
        var dohComment = jQuery("#dohSecurityComment").val();
        var wadsworthSecurityComment = jQuery("#wadsworthSecurityComment").val();
        var cmsSecurityComment = jQuery("#cmsSecurityComment").val();
        var westernAveSecurityComment = jQuery("#westernAveSecurityComment").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory == null) {
            changeHistory = "";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var thisComment = "";
        if (dohComment) {
            thisComment += dohComment + " ";
        }
        if (wadsworthSecurityComment) {
            thisComment += wadsworthSecurityComment + " ";
        }
        if (cmsSecurityComment) {
            thisComment += cmsSecurityComment + " ";
        }
        if (westernAveSecurityComment) {
            thisComment += westernAveSecurityComment + " ";
        }
        var stuffThatChanged = todayText + " Security signature withdrawn by " + displayName + " Comment: " + thisComment + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {
            "__metadata": { "type": itemType },
            "securitySignatureId": null,
            "securitySignDate": null,
            "dohSecurityComment": dohComment,
            "wadsworthSecurityComment": wadsworthSecurityComment,
            "cmsSecurityComment": cmsSecurityComment,
            "westernAveSecurityComment": westernAveSecurityComment,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            $scope.securitySignatureDisplayName = "Not Signed";
            $scope.securitySignDate = "";
            var finalURL = protocol + "//" + host + path;
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    }
        //end unsign security
    //begin sign keys
    $scope.signKeys = function(){
        var keysCommentBiggs = jQuery("#keysCommentBiggs").val();
        var keysCommentDAI = jQuery("#keysCommentDAI").val();
        var keysCommentGL = jQuery("#keysCommentGL").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var thisComment = "";
        if (keysCommentBiggs) {
            thisComment += keysCommentBiggs + " ";
        }
        if (keysCommentDAI) {
            thisComment += keysCommentDAI + " ";
        }
        if (keysCommentGL) {
            thisComment += keysCommentGL + " ";
        }
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " Keys signed by " + displayName + " Comment: " + thisComment + "<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "MSOSignatureId":loginID,
        "MSODate":today,
        "keysCommentBiggs": keysCommentBiggs,
        "keysCommentDAI": keysCommentDAI,
        "keysCommentGL": keysCommentGL,
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    };    
        //end sign keys
        //begin unsign keys
    $scope.unSignKeys=function(){
        var keysCommentBiggs = jQuery("#keysCommentBiggs").val();
        var keysCommentDAI = jQuery("#keysCommentDAI").val();
        var keysCommentGL = jQuery("#keysCommentGL").val();
        var loginID = sharedProperties.getThisUserID();
        var displayName = sharedProperties.getCurrentUser();
        var today = new Date();
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var thisComment = "";
        if (keysCommentBiggs) {
            thisComment += keysCommentBiggs + " ";
        }
        if (keysCommentDAI) {
            thisComment += keysCommentDAI + " ";
        }
        if (keysCommentGL) {
            thisComment += keysCommentGL + " ";
        }
        var stuffThatChanged = todayText + " Keys signature withdrawn by " + displayName + " Comment: " + thisComment +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
            "MSOSignatureId":null,
            "MSODate":null,
            "keysCommentBiggs": keysCommentBiggs,
            "keysCommentDAI": keysCommentDAI,
            "keysCommentGL": keysCommentGL,
            "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
            //resolve the new data
            dfd.resolve(data.d);
            var protocol = window.location.protocol;
            var path = window.location.pathname;
            var host = window.location.hostname;
            $scope.keysSignatureDisplayName = "";
            $scope.keysDate = "";
            var finalURL = protocol + "//" + host + path;
            window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
    }
        //end unsign keys
    //begin mark complete
     $scope.markCompleted = function(){
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " Marked Complete by " + sharedProperties.getCurrentUser() +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "ClearanceCompleted":"Yes",
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
     }
    //end mark complete
    //begin withdraw
     $scope.withdraw = function(){
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " Withdrawn by " + sharedProperties.getCurrentUser() +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "ClearanceCompleted":"Withdrawn",
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
     }    
    //end withdraw
    //begin reinstate
     $scope.reinstate = function(){
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " Reinstated by " + sharedProperties.getCurrentUser() +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "ClearanceCompleted":"No",
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
     }
    //end reinstate
    //begin unmark complete
     $scope.unMarkCompleted = function(){
        var itemType = "SP.Data.ClearanceListItem";
        var changeHistory = sharedProperties.getChangeHistory();
        if (changeHistory==null) {
            changeHistory="";
        };
        var today = new Date();
        var todayText = today.toLocaleString();
        var stuffThatChanged = todayText + " un-marked complete by " + sharedProperties.getCurrentUser() +"<br>";
        stuffThatChanged = changeHistory + stuffThatChanged;
        var item = {"__metadata": { "type": itemType },
        "ClearanceCompleted":"No",
        "ChangeHistory": stuffThatChanged
        };
        var requestDigest = sharedProperties.getRequestDigest();
        $http.defaults.headers.common.Accept = "application/json;odata=verbose";
        $http.defaults.headers.post['Content-Type'] = 'application/json;odata=verbose';
        $http.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
        $http.defaults.headers.post['If-Match'] = "*";
        $http.defaults.headers.post['X-HTTP-Method'] = "MERGE";
        $http.defaults.headers.post['X-RequestDigest'] = requestDigest;
        var dfd = $q.defer();
        var restURL = hostweburl + "/_api/lists/getbytitle('Clearance')/items(" + itemID + ")";
        $http.post(restURL, item).success(function (data) {
        //resolve the new data
        dfd.resolve(data.d);
        var protocol = window.location.protocol;
        var path = window.location.pathname;
        var host = window.location.hostname;
        var finalURL = protocol + "//" + host + path;
        window.location.href = finalURL;
        }).error(function (data) {
            dfd.reject("failed to update a clearance request");
        });
        return dfd.promise;
     };
    //end unmark complete
    }]);
//end of edit controller
//pagination controls
function OtherController($scope) {
  $scope.pageChangeHandler = function(num) {
    console.log('going to page ' + num);
  };
}
clearanceControllers.controller('OtherController', OtherController);
//end pagination controls

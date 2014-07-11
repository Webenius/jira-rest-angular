
var module = angular.module('JiraRESTClientApp', ['ngResource', 'ngRoute']);

module.factory('Base64', function() {
    var keyStr = 'ABCDEFGHIJKLMNOP' +
        'QRSTUVWXYZabcdef' +
        'ghijklmnopqrstuv' +
        'wxyz0123456789+/' +
        '=';
    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;
 
            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
 
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
 
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);
 
            return output;
        },
 
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;
 
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));
 
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
 
                output = output + String.fromCharCode(chr1);
 
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
 
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
 
            } while (i < input.length);
 
            return output;
        }
    };
});

module.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'login.html'
			})
			.when('/pages/login', {
				templateUrl: 'login.html',
				controller: 'ApplicationController'
			})
			.when('/pages/search', {
				templateUrl: 'search.html',
				controller: 'ApplicationController'
			})
			.when('/pages/create', {
				templateUrl: 'create.html',
				controller: 'ApplicationController'
			});
	});

module.factory('JiraIssues', function ($resource) {
    var maxResults = 15,
        jiraServer = 'https://jira';
    return $resource(jiraServer + '/rest/api/2/search?jql=issuetype%20%3D%20Bug%20AND%20created%20%3E%3D%20-8h%20ORDER%20BY%20createdDate%20DESC&maxResults='+maxResults, {
    }, {
        query: {
            method: 'GET',
            params: {},
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET', //POST, GET, OPTIONS, PUT, DELETE, HEAD', //, PATCH, DELETE',
                'Access-Control-Allow-Headers': 'Content-Type'//, X-PINGOTHER, Origin, X-Requested-With, Accept',
            }
        }
    })
});

module.controller('ApplicationController', ['$scope', '$http', 'Base64', 'JiraIssues', function ($scope, $http, Base64, JiraIssues) {
    
	$scope.title = "";
    $scope.description = "";
    $scope.jiraData = {
        currentIssue: null,
        issueList: [],
        issueListState: 'open',
        issueListSort: 'created',
        issueListDirection: 'desc',
        issueListPage: 1
    };
    $scope.credentials = { username: '', password: ''};
    $scope.jiraServer = 'https://jira';
	var maxResults = 15;
	
    $scope.login = function (credentials) {
        $http.defaults.headers.common = {"Access-Control-Request-Headers": "accept, origin, authorization"};
        $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode($scope.credentials.username + ':' + $scope.credentials.password);
        $http({method: 'GET', url: $scope.jiraServer}).

            success(function(data) {
                console.log("----Auth success: " + JSON.stringify(data));
            }).
            error(function(data) {
                console.log("----Auth error: " + JSON.stringify(data));
            });
    };

    /*$scope.getIssues = function () {
        JiraIssues.query({
        }, function (data) {
    	    $scope.jiraIssues = data.issues;
            $scope.jiraData.issueList = data.issues;
            console.log("Jira response: " + JSON.stringify(data));
        });
    };*/
    $scope.getIssues = function () {
        var request = $http({
            method: "GET", // issuetype%20%3D%20Bug%20AND%20created%20%3E%3D%20-8h%20AND%20reporter%20in%20(" + $scope.credentials.username + ")
            url: $scope.jiraServer + "/rest/api/2/search?jql=project=" + $scope.project +"%20AND%20ORDER%20BY%20createdDate%20DESC&maxResults="+maxResults
        });
        request.success(
            function(data) {
                $scope.jiraIssues = data.issues;
                $scope.jiraData.issueList = data.issues;
                console.log("Jira response: " + JSON.stringify(data));
            }
        );
        request.error(
            function(data) {
                console.log("Error, Jira response: " + JSON.stringify(data));
            }
        );
    };

    $scope.setSort = function (sort) {
        var oldSort = angular.copy($scope.jiraData.issueListSort);
        $scope.jiraData.issueListSort = sort;
        if (oldSort == sort) {
            $scope.setDirection($scope.jiraData.issueListDirection == 'desc' ? 'asc' : 'desc');
        } else {
            $scope.setDirection('desc');
        }
    };

    $scope.setDirection = function (direction) {
        $scope.jiraData.issueListDirection = direction;
        $scope.getIssues();
    };

    $scope.sortClass = function (column) {
        return column == $scope.jiraData.issueListSort && 'sort-' + $scope.jiraData.issueListDirection;
    };

    $scope.setCurrentIssue = function (number) {
        /*AI.getIssue({
            number: number
        }, function (data) {
            $scope.jiraData.currentIssue = data;
        });*/
    };

    $scope.showAll = function () {
        $scope.jiraData.currentIssue = null;
    };

    $scope.getIssues();

    $scope.addComment = function () {
        var request = $http({
            method: "POST",
            url: $scope.jiraServer + "/rest/api/2/issue/RES-1208/comment",
            data: {
                "body": $scope.description
            }
        });
        request.success(
            function(data) {
                $scope.jiraResponse = data;
                console.log("Jira response: " + JSON.stringify(data));
            }
        );
    };

    $scope.createIssue = function () {
        var request = $http({
            method: "POST",
            url: $scope.jiraServer + "/rest/api/2/issue",
            data: {
                "fields": {
                    "project": { 
                         "key": "RES"
                    },
                    "summary": $scope.title,
                    "description": $scope.description,
                    "issuetype": {
                        "name": "Bug" // New Feature
                    }
                }
            }
        });
        request.success(
            function(data) {
                $scope.jiraResponse = data;
                console.log("Jira response: " + JSON.stringify(data));
            }
        );
    };

    $scope.jiraIssues = [
                            {
                            "expand": "editmeta,renderedFields,transitions,changelog,operations",
                            "id": "342374",
                            "self": "https://jira.atlassian.com/rest/api/2/issue/342374",
                            "key": "RES-1917",
                            "fields": {
                            "progress": {
                            "progress": 0,
                            "total": 0
                            },
                            "summary": "Cross origin",
                            "issuetype": {
                            "self": "https://jira.atlassian.com/rest/api/2/issuetype/1",
                            "id": "1",
                            "description": "Implement a Cross origin resource sharing (CORS).",
                            "iconUrl": "https://jira.atlassian.com/images/icons/issuetypes/bug.png",
                            "name": "Bug",
                            "subtask": false
                            },
                            "reporter": {
                            "self": "https://jira.atlassian.com/rest/api/2/user?username=aglowacki",
                            "name": "aglowacki",
                            "emailAddress": "aglowacki@atlassian.com",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/useravatar?size=xsmall&ownerId=aglowacki&avatarId=48654",
                            "24x24": "https://jira.atlassian.com/secure/useravatar?size=small&ownerId=aglowacki&avatarId=48654",
                            "32x32": "https://jira.atlassian.com/secure/useravatar?size=medium&ownerId=aglowacki&avatarId=48654",
                            "48x48": "https://jira.atlassian.com/secure/useravatar?ownerId=aglowacki&avatarId=48654"
                            },
                            "displayName": "Sami Ayari",
                            "active": true
                            },
                            "updated": "2014-06-26T13:20:18.000+0000",
                            "created": "2014-06-26T13:13:41.000+0000",
                            "description": "User can inherit permissions.",
                            "priority": {
                            "self": "https://jira.atlassian.com/rest/api/2/priority/3",
                            "iconUrl": "https://jira.atlassian.com/images/icons/priorities/major.png",
                            "name": "Major",
                            "id": "3"
                            },
                            "customfield_13430": null,
                            "issuelinks": [
                            {
                            "id": "138858",
                            "self": "https://jira.atlassian.com/rest/api/2/issueLink/138858",
                            "type": {
                            "id": "10000",
                            "name": "Reference",
                            "inward": "is related to",
                            "outward": "relates to",
                            "self": "https://jira.atlassian.com/rest/api/2/issueLinkType/10000"
                            },
                            "inwardIssue": {
                            "id": "341082",
                            "key": "JRA-38822",
                            "self": "https://jira.atlassian.com/rest/api/2/issue/341082",
                            "fields": {
                            "summary": "Removing user from LDAP doesn't clear LDAP group membership",
                            "status": {
                            "self": "https://jira.atlassian.com/rest/api/2/status/10005",
                            "description": "This issue has been verified",
                            "iconUrl": "https://jira.atlassian.com/images/icons/statuses/visible.png",
                            "name": "Verified",
                            "id": "10005",
                            "statusCategory": {
                            "self": "https://jira.atlassian.com/rest/api/2/statuscategory/4",
                            "id": 4,
                            "key": "indeterminate",
                            "colorName": "yellow",
                            "name": "In Progress"
                            }
                            },
                            "priority": {
                            "self": "https://jira.atlassian.com/rest/api/2/priority/3",
                            "iconUrl": "https://jira.atlassian.com/images/icons/priorities/major.png",
                            "name": "Major",
                            "id": "3"
                            },
                            "issuetype": {
                            "self": "https://jira.atlassian.com/rest/api/2/issuetype/1",
                            "id": "1",
                            "description": "A problem which impairs or prevents the functions of the product.",
                            "iconUrl": "https://jira.atlassian.com/images/icons/issuetypes/bug.png",
                            "name": "Bug",
                            "subtask": false
                            }
                            }
                            }
                            }
                            ],
                            "subtasks": [],
                            "status": {
                            "self": "https://jira.atlassian.com/rest/api/2/status/1",
                            "description": "The issue is open and ready for the assignee to start work on it.",
                            "iconUrl": "https://jira.atlassian.com/images/icons/statuses/open.png",
                            "name": "Open",
                            "id": "1",
                            "statusCategory": {
                            "self": "https://jira.atlassian.com/rest/api/2/statuscategory/2",
                            "id": 2,
                            "key": "new",
                            "colorName": "blue-gray",
                            "name": "New"
                            }
                            },
                            "customfield_10575": null,
                            "labels": [
                            "activedirectory",
                            "security"
                            ],
                            "workratio": -1,
                            "project": {
                            "self": "https://jira.atlassian.com/rest/api/2/project/11291",
                            "id": "11291",
                            "key": "CWD",
                            "name": "Crowd",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/projectavatar?size=xsmall&pid=11291&avatarId=17393",
                            "24x24": "https://jira.atlassian.com/secure/projectavatar?size=small&pid=11291&avatarId=17393",
                            "32x32": "https://jira.atlassian.com/secure/projectavatar?size=medium&pid=11291&avatarId=17393",
                            "48x48": "https://jira.atlassian.com/secure/projectavatar?pid=11291&avatarId=17393"
                            },
                            "projectCategory": {
                            "self": "https://jira.atlassian.com/rest/api/2/projectCategory/10031",
                            "id": "10031",
                            "description": "",
                            "name": "Atlassian Products"
                            }
                            },
                            "customfield_12931": null,
                            "environment": null,
                            "aggregateprogress": {
                            "progress": 0,
                            "total": 0
                            },
                            "lastViewed": null,
                            "components": [],
                            "timeoriginalestimate": null,
                            "customfield_10150": [
                            "aglowacki(aglowacki)"
                            ],
                            "votes": {
                            "self": "https://jira.atlassian.com/rest/api/2/issue/CWD-3967/votes",
                            "votes": 0,
                            "hasVoted": false
                            },
                            "fixVersions": [],
                            "resolution": null,
                            "customfield_10680": null,
                            "resolutiondate": null,
                            "creator": {
                            "self": "https://jira.atlassian.com/rest/api/2/user?username=aglowacki",
                            "name": "aglowacki",
                            "emailAddress": "aglowacki@atlassian.com",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/useravatar?size=xsmall&ownerId=aglowacki&avatarId=48654",
                            "24x24": "https://jira.atlassian.com/secure/useravatar?size=small&ownerId=aglowacki&avatarId=48654",
                            "32x32": "https://jira.atlassian.com/secure/useravatar?size=medium&ownerId=aglowacki&avatarId=48654",
                            "48x48": "https://jira.atlassian.com/secure/useravatar?ownerId=aglowacki&avatarId=48654"
                            },
                            "displayName": "Sami Ayari",
                            "active": true
                            },
                            "aggregatetimeoriginalestimate": null,
                            "duedate": null,
                            "customfield_12730": null,
                            "watches": {
                            "self": "https://jira.atlassian.com/rest/api/2/issue/CWD-3967/watchers",
                            "watchCount": 1,
                            "isWatching": false
                            },
                            "assignee": null,
                            "customfield_14130": null,
                            "aggregatetimeestimate": null,
                            "versions": [
                            {
                            "self": "https://jira.atlassian.com/rest/api/2/version/37493",
                            "id": "37493",
                            "description": "Public bug-fix release",
                            "name": "2.7.2",
                            "archived": false,
                            "released": true,
                            "releaseDate": "2014-05-13"
                            },
                            {
                            "self": "https://jira.atlassian.com/rest/api/2/version/41494",
                            "id": "41494",
                            "description": "Internal release, used by JIRA",
                            "name": "2.8.0-OD-6",
                            "archived": false,
                            "released": true,
                            "releaseDate": "2014-01-08"
                            }
                            ],
                            "timeestimate": null,
                            "aggregatetimespent": null
                            }
                            },
                            {
                            "expand": "editmeta,renderedFields,transitions,changelog,operations",
                            "id": "342373",
                            "self": "https://jira.atlassian.com/rest/api/2/issue/342373",
                            "key": "RES-1905",
                            "fields": {
                            "progress": {
                            "progress": 0,
                            "total": 0
                            },
                            "summary": "The save-button",
                            "issuetype": {
                            "self": "https://jira.atlassian.com/rest/api/2/issuetype/1",
                            "id": "1",
                            "description": "A problem which impairs or prevents the functions of the product.",
                            "iconUrl": "https://jira.atlassian.com/images/icons/issuetypes/bug.png",
                            "name": "Bug",
                            "subtask": false
                            },
                            "timespent": null,
                            "reporter": {
                            "self": "https://jira.atlassian.com/rest/api/2/user?username=bayers",
                            "name": "bayers",
                            "emailAddress": "bayers@atlassian.com",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/useravatar?size=xsmall&ownerId=bayers&avatarId=47058",
                            "24x24": "https://jira.atlassian.com/secure/useravatar?size=small&ownerId=bayers&avatarId=47058",
                            "32x32": "https://jira.atlassian.com/secure/useravatar?size=medium&ownerId=bayers&avatarId=47058",
                            "48x48": "https://jira.atlassian.com/secure/useravatar?ownerId=bayers&avatarId=47058"
                            },
                            "displayName": "Rakia Ben Sassi",
                            "active": true
                            },
                            "customfield_13231": null,
                            "updated": "2014-06-26T12:56:46.000+0000",
                            "created": "2014-05-06T11:56:46.000+0000",
                            "customfield_10180": null,
                            "priority": {
                            "self": "https://jira.atlassian.com/rest/api/2/priority/4",
                            "iconUrl": "https://jira.atlassian.com/images/icons/priorities/minor.png",
                            "name": "Minor",
                            "id": "4"
                            },
                            "description": "The save-button, after editing a product details, does not work. See the attachment.",
                            "customfield_13430": null,
                            "issuelinks": [],
                            "subtasks": [],
                            "status": {
                            "self": "https://jira.atlassian.com/rest/api/2/status/1",
                            "description": "The issue is open and ready for the assignee to start work on it.",
                            "iconUrl": "https://jira.atlassian.com/images/icons/statuses/open.png",
                            "name": "Open",
                            "id": "1",
                            "statusCategory": {
                            "self": "https://jira.atlassian.com/rest/api/2/statuscategory/2",
                            "id": 2,
                            "key": "new",
                            "colorName": "blue-gray",
                            "name": "New"
                            }
                            },
                            "customfield_10575": null,
                            "labels": [],
                            "workratio": -1,
                            "project": {
                            "self": "https://jira.atlassian.com/rest/api/2/project/10240",
                            "id": "10240",
                            "key": "JRA",
                            "name": "JIRA",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/projectavatar?size=xsmall&pid=10240&avatarId=17294",
                            "24x24": "https://jira.atlassian.com/secure/projectavatar?size=small&pid=10240&avatarId=17294",
                            "32x32": "https://jira.atlassian.com/secure/projectavatar?size=medium&pid=10240&avatarId=17294",
                            "48x48": "https://jira.atlassian.com/secure/projectavatar?pid=10240&avatarId=17294"
                            },
                            "projectCategory": {
                            "self": "https://jira.atlassian.com/rest/api/2/projectCategory/10031",
                            "id": "10031",
                            "description": "",
                            "name": "Atlassian Products"
                            }
                            },
                            "environment": null,
                            "aggregateprogress": {
                            "progress": 0,
                            "total": 0
                            },
                            "lastViewed": null,
                            "components": [],
                            "timeoriginalestimate": null,
                            "votes": {
                            "self": "https://jira.atlassian.com/rest/api/2/issue/JRA-38922/votes",
                            "votes": 0,
                            "hasVoted": false
                            },
                            "customfield_10401": null,
                            "fixVersions": [],
                            "resolution": null,
                            "customfield_10680": null,
                            "resolutiondate": null,
                            "creator": {
                            "self": "https://jira.atlassian.com/rest/api/2/user?username=bayers",
                            "name": "bayers",
                            "emailAddress": "bayers@atlassian.com",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/useravatar?size=xsmall&ownerId=bayers&avatarId=47058",
                            "24x24": "https://jira.atlassian.com/secure/useravatar?size=small&ownerId=bayers&avatarId=47058",
                            "32x32": "https://jira.atlassian.com/secure/useravatar?size=medium&ownerId=bayers&avatarId=47058",
                            "48x48": "https://jira.atlassian.com/secure/useravatar?ownerId=bayers&avatarId=47058"
                            },
                            "displayName": "Alex Hauptmann",
                            "active": true
                            },
                            "aggregatetimeoriginalestimate": null,
                            "duedate": null,
                            "customfield_12730": null,
                            "watches": {
                            "self": "https://jira.atlassian.com/rest/api/2/issue/JRA-38922/watchers",
                            "watchCount": 1,
                            "isWatching": false
                            },
                            "assignee": null,
                            "customfield_14130": null,
                            "aggregatetimeestimate": null,
                            "versions": [
                            {
                            "self": "https://jira.atlassian.com/rest/api/2/version/40599",
                            "id": "40599",
                            "name": "6.3",
                            "archived": false,
                            "released": false
                            }
                            ],
                            "timeestimate": null,
                            "aggregatetimespent": null
                            }
                            },
                            {
                            "expand": "editmeta,renderedFields,transitions,changelog,operations",
                            "id": "342272",
                            "self": "https://jira.atlassian.com/rest/api/2/issue/342272",
                            "key": "RES-1940",
                            "fields": {
                            "progress": {
                            "progress": 0,
                            "total": 0
                            },
                            "summary": "Displaying product price",
                            "issuetype": {
                            "self": "https://jira.atlassian.com/rest/api/2/issuetype/1",
                            "id": "1",
                            "description": "A problem which impairs or prevents the functions of the product.",
                            "iconUrl": "https://jira.atlassian.com/images/icons/issuetypes/bug.png",
                            "name": "Bug",
                            "subtask": false
                            },
                            "timespent": null,
                            "reporter": {
                            "self": "https://jira.atlassian.com/rest/api/2/user?username=cchan",
                            "name": "cchan",
                            "emailAddress": "cchan@atlassian.com",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/useravatar?size=xsmall&ownerId=cchan&avatarId=47606",
                            "24x24": "https://jira.atlassian.com/secure/useravatar?size=small&ownerId=cchan&avatarId=47606",
                            "32x32": "https://jira.atlassian.com/secure/useravatar?size=medium&ownerId=cchan&avatarId=47606",
                            "48x48": "https://jira.atlassian.com/secure/useravatar?ownerId=cchan&avatarId=47606"
                            },
                            "displayName": "Alex Hauptmann",
                            "active": true
                            },
                            "updated": "2014-06-26T09:22:55.000+0000",
                            "created": "2014-06-26T09:22:00.000+0000",
                            "description": "As a user I want to see the product price.",
                            "priority": {
                            "self": "https://jira.atlassian.com/rest/api/2/priority/4",
                            "iconUrl": "https://jira.atlassian.com/images/icons/priorities/minor.png",
                            "name": "Minor",
                            "id": "4"
                            },
                            "issuelinks": [],
                            "subtasks": [],
                            "status": {
                            "self": "https://jira.atlassian.com/rest/api/2/status/1",
                            "description": "The issue is open and ready for the assignee to start work on it.",
                            "iconUrl": "https://jira.atlassian.com/images/icons/statuses/open.png",
                            "name": "Open",
                            "id": "1",
                            "statusCategory": {
                            "self": "https://jira.atlassian.com/rest/api/2/statuscategory/2",
                            "id": 2,
                            "key": "new",
                            "colorName": "blue-gray",
                            "name": "New"
                            }
                            },
                            "labels": [],
                            "workratio": -1,
                            "project": {
                            "self": "https://jira.atlassian.com/rest/api/2/project/14710",
                            "id": "14710",
                            "key": "DCON",
                            "name": "JIRA DVCS Connector",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/projectavatar?size=xsmall&pid=14710&avatarId=10011",
                            "24x24": "https://jira.atlassian.com/secure/projectavatar?size=small&pid=14710&avatarId=10011",
                            "32x32": "https://jira.atlassian.com/secure/projectavatar?size=medium&pid=14710&avatarId=10011",
                            "48x48": "https://jira.atlassian.com/secure/projectavatar?pid=14710&avatarId=10011"
                            }
                            },
                            "customfield_12931": null,
                            "environment": null,
                            "aggregateprogress": {
                            "progress": 0,
                            "total": 0
                            },
                            "lastViewed": null,
                            "components": [],
                            "timeoriginalestimate": null,
                            "customfield_10150": [
                            "cchan(cchan)"
                            ],
                            "votes": {
                            "self": "https://jira.atlassian.com/rest/api/2/issue/DCON-440/votes",
                            "votes": 1,
                            "hasVoted": false
                            },
                            "fixVersions": [],
                            "resolution": null,
                            "resolutiondate": null,
                            "creator": {
                            "self": "https://jira.atlassian.com/rest/api/2/user?username=cchan",
                            "name": "cchan",
                            "emailAddress": "cchan@atlassian.com",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/useravatar?size=xsmall&ownerId=cchan&avatarId=47606",
                            "24x24": "https://jira.atlassian.com/secure/useravatar?size=small&ownerId=cchan&avatarId=47606",
                            "32x32": "https://jira.atlassian.com/secure/useravatar?size=medium&ownerId=cchan&avatarId=47606",
                            "48x48": "https://jira.atlassian.com/secure/useravatar?ownerId=cchan&avatarId=47606"
                            },
                            "displayName": "Rakia Ben Sassi",
                            "active": true
                            },
                            "aggregatetimeoriginalestimate": null,
                            "duedate": null,
                            "customfield_12730": null,
                            "watches": {
                            "self": "https://jira.atlassian.com/rest/api/2/issue/DCON-440/watchers",
                            "watchCount": 2,
                            "isWatching": false
                            },
                            "assignee": null,
                            "aggregatetimeestimate": null,
                            "versions": [
                            {
                            "self": "https://jira.atlassian.com/rest/api/2/version/41895",
                            "id": "41895",
                            "description": "GitHub bug fixes",
                            "name": "2.0.6",
                            "archived": false,
                            "released": true,
                            "releaseDate": "2014-05-26"
                            }
                            ],
                            "timeestimate": null,
                            "aggregatetimespent": null
                            }
                            },
                            {
                            "expand": "editmeta,renderedFields,transitions,changelog,operations",
                            "id": "342259",
                            "self": "https://jira.atlassian.com/rest/api/2/issue/342259",
                            "key": "RES-1913",
                            "fields": {
                            "progress": {
                            "progress": 0,
                            "total": 0
                            },
                            "summary": "Activate the home link",
                            "issuetype": {
                            "self": "https://jira.atlassian.com/rest/api/2/issuetype/1",
                            "id": "1",
                            "description": "A problem which impairs or prevents the functions of the product.",
                            "iconUrl": "https://jira.atlassian.com/images/icons/issuetypes/bug.png",
                            "name": "Bug",
                            "subtask": false
                            },
                            "timespent": null,
                            "reporter": {
                            "self": "https://jira.atlassian.com/rest/api/2/user?username=edalgliesh",
                            "name": "edalgliesh",
                            "emailAddress": "edalgliesh@atlassian.com",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/useravatar?size=xsmall&ownerId=edalgliesh&avatarId=49127",
                            "24x24": "https://jira.atlassian.com/secure/useravatar?size=small&ownerId=edalgliesh&avatarId=49127",
                            "32x32": "https://jira.atlassian.com/secure/useravatar?size=medium&ownerId=edalgliesh&avatarId=49127",
                            "48x48": "https://jira.atlassian.com/secure/useravatar?ownerId=edalgliesh&avatarId=49127"
                            },
                            "displayName": "Hammadi Romba",
                            "active": true
                            },
                            "updated": "2014-06-26T06:03:33.000+0000",
                            "created": "2014-05-21T16:03:53.000+0000",
                            "description": "The link does not get turned into the home page.",
                            "priority": {
                            "self": "https://jira.atlassian.com/rest/api/2/priority/4",
                            "iconUrl": "https://jira.atlassian.com/images/icons/priorities/minor.png",
                            "name": "Minor",
                            "id": "4"
                            },
                            "issuelinks": [],
                            "subtasks": [],
                            "status": {
                            "self": "https://jira.atlassian.com/rest/api/2/status/10071",
                            "description": "",
                            "iconUrl": "https://jira.atlassian.com/images/icons/statuses/open.png",
                            "name": "In progress",
                            "id": "10071",
                            "statusCategory": {
                            "self": "https://jira.atlassian.com/rest/api/2/statuscategory/2",
                            "id": 2,
                            "key": "new",
                            "colorName": "blue-gray",
                            "name": "New"
                            }
                            },
                            "labels": [],
                            "workratio": -1,
                            "project": {
                            "self": "https://jira.atlassian.com/rest/api/2/project/15611",
                            "id": "15611",
                            "key": "JSD",
                            "name": "JIRA Service Desk",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/projectavatar?size=xsmall&pid=15611&avatarId=38146",
                            "24x24": "https://jira.atlassian.com/secure/projectavatar?size=small&pid=15611&avatarId=38146",
                            "32x32": "https://jira.atlassian.com/secure/projectavatar?size=medium&pid=15611&avatarId=38146",
                            "48x48": "https://jira.atlassian.com/secure/projectavatar?pid=15611&avatarId=38146"
                            },
                            "projectCategory": {
                            "self": "https://jira.atlassian.com/rest/api/2/projectCategory/10050",
                            "id": "10050",
                            "description": "",
                            "name": "Atlassian Add-ons"
                            }
                            },
                            "environment": null,
                            "aggregateprogress": {
                            "progress": 0,
                            "total": 0
                            },
                            "lastViewed": null,
                            "components": [],
                            "timeoriginalestimate": null,
                            "votes": {
                            "self": "https://jira.atlassian.com/rest/api/2/issue/JSD-613/votes",
                            "votes": 0,
                            "hasVoted": false
                            },
                            "resolution": null,
                            "fixVersions": [],
                            "resolutiondate": null,
                            "creator": {
                            "self": "https://jira.atlassian.com/rest/api/2/user?username=edalgliesh",
                            "name": "edalgliesh",
                            "emailAddress": "edalgliesh@atlassian.com",
                            "avatarUrls": {
                            "16x16": "https://jira.atlassian.com/secure/useravatar?size=xsmall&ownerId=edalgliesh&avatarId=49127",
                            "24x24": "https://jira.atlassian.com/secure/useravatar?size=small&ownerId=edalgliesh&avatarId=49127",
                            "32x32": "https://jira.atlassian.com/secure/useravatar?size=medium&ownerId=edalgliesh&avatarId=49127",
                            "48x48": "https://jira.atlassian.com/secure/useravatar?ownerId=edalgliesh&avatarId=49127"
                            },
                            "displayName": "",
                            "active": true
                            },
                            "aggregatetimeoriginalestimate": null,
                            "duedate": null,
                            "watches": {
                            "self": "https://jira.atlassian.com/rest/api/2/issue/JSD-613/watchers",
                            "watchCount": 1,
                            "isWatching": false
                            },
                            "assignee": null,
                            "aggregatetimeestimate": null,
                            "versions": [],
                            "timeestimate": null,
                            "aggregatetimespent": null
                            }
                            }
                            ];
}]);
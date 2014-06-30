
var module = angular.module('JiraRESTClientApp', ['ngResource']);

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
}]);
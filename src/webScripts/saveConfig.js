var key, newConfig;

// retrieve the existing configuration from OpenLearning
var configuration = ((OpenLearning.page.getData(request.user).data || {}).configuration) || {};

var responseJSON = {
	success: true
};

var hasWritePermission = request.sessionData.permissions && (request.sessionData.permissions.indexOf('write') >= 0);

if (request.method == 'POST' && hasWritePermission) {
	// this is a POST request, and the current user has write permissions to alter the configuration

	if (request.args['format'] === 'json' || request.data['format'] === 'json') {
		// a format=json argument has been given; interpret the 'config' field as JSON data
		try {
			newConfig = JSON.parse(request.data['config']);	
		} catch (e) {
			responseJSON.success = false;
			responseJSON.message = e.toString();
		}
	} else {
		// no format argument is given, use each POST field as new config data
		newConfig = request.data;
	}

	if (request.data['type']) {
		OpenLearning.activity.setSubmissionType(request.data['type']);
	}

	if (responseJSON.success) {
		// so far, so good.

		for (key in newConfig) {
			if (newConfig.hasOwnProperty(key)) {
				// update the old config, key by key (at the top level)
				configuration[key] = newConfig[key];
			}
		}

		// send this new configuration back to OpenLearning
		OpenLearning.page.setData({
			isEmbedded: true,
			configuration: configuration
		}, request.user);

		// also return the new configuration in the response
		responseJSON.config = configuration;
	}
} else {
	// i don't know what to do with this request

	responseJSON.success = false;
	responseJSON.message = 'Unable to process request. This may be due to incorrect permissions.'
}

if (!responseJSON.success) {
	// set a 400 http status code if something went wrong
	response.setStatusCode(400);
}

// respond with JSON
response.writeJSON(responseJSON);

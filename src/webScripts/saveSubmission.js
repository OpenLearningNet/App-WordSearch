var responseJSON = {
	success: true,
};

var markObject = {};
var updateObject = {};

try {
	// update the submission

	if (request.data['html']) {
		updateObject.html = request.data['html'];
	}

	if (request.data['file']) {
		updateObject.file = JSON.parse(request.data['file']);
	}

	if (request.data['files']) {
		updateObject.files = JSON.parse(request.data['files']);
	}

	if (request.data['metadata']) {
		updateObject.metadata = JSON.parse(request.data['metadata']);
	}

	if (request.data['grading']) {
		// of the format: request.data['grading'] = {completed: true, score: 42}
		markObject[request.user] = JSON.parse(request.data['grading']);
		updateObject.metadata.completed = true;
	}
} catch (e) {
	// catch any JSON parse errors, etc.

	responseJSON.success = false;
	response.setStatusCode(400);
	response.message = e.toString();
}

if (responseJSON.success) {
	// send this submission to OpenLearning
	OpenLearning.activity.saveSubmission(request.user, updateObject);

	// additional actions
	if (request.data['submit'] && request.data['submit'].toString() === 'true') {
		OpenLearning.activity.submit(request.user);
		updateObject.submitted = true;
	}

	if (request.data['grading']) {
		OpenLearning.activity.setMarks(markObject);
		updateObject.graded = true;
	}

	responseJSON.update = updateObject;
}

response.writeJSON(responseJSON);

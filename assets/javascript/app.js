  // Initialize Firebase
  var config = {
  	apiKey: "AIzaSyAdKZq_lBAjKIj4MUZVDn9QLpPkdpCv_9s",
  	authDomain: "project-41115.firebaseapp.com",
  	databaseURL: "https://project-41115.firebaseio.com",
  	projectId: "project-41115",
  	storageBucket: "project-41115.appspot.com",
  	messagingSenderId: "622940413284"
  };
  firebase.initializeApp(config);

  var database = firebase.database();



// -------------------------------------------------------------- (CRITICAL - BLOCK) --------------------------- //
// connectionsRef references a specific location in our database.
// All of our connections will be stored in this directory.
var connectionsRef = database.ref("/connections");

// '.info/connected' is a special location provided by Firebase that is updated every time
// the client's connection state changes.
// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
var connectedRef = database.ref(".info/connected");

// When the client's connection state changes...
connectedRef.on("value", function(snap) {

  // If they are connected..
  if (snap.val()) {

    // Add user to the connections list.
    var con = connectionsRef.push(true);

    // Remove user from the connection list when they disconnect.
    con.onDisconnect().remove();
}
});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function(snap) {

  // Display the viewer count in the html.
  // The number of online users is the number of children in the connections list.
  $("#watchers").html(snap.numChildren());
});


// Whenever a user clicks the submit-bid button
$("#add-line").on("click", function(event) {
  // Prevent form from submitting
  event.preventDefault();

//get the inputs
  var name = $("#name-input").val().trim()
  var destination = $("#destination-input").val().trim()

 var firstTrainTime = $("#firsttrain-input").val().trim()//grabs in the format 2014-09-20
 var frequency = $("#frequency-input").val().trim()

//push stuff into firebase database
 database.ref("/clicks").push({

 	name: name,
 	destination: destination,
 	firstTrainTime: firstTrainTime,
 	frequency: frequency

 });

});

//when something pushed into database

var finishedLoading = false

//get the train stuff from the firebase database once. used for initial startup of the webpage
database.ref("/clicks").orderByChild("dateAdded").once('value').then(function(snapshot) {
  var sv=snapshot.val()
  stuff=snapshot.val()
  // for every key in the snapshot get a single line of train data
  for (var key in sv) {
    var obj = sv[key];
    addData(obj)//pass the train data acquired from database to this function. display it on the dom
  }
  finishedLoading = true;//this function only runs once
}, function(errorObject) {
  console.log("Errors handled: " + errorObject.code);
});


//finishedLoading used as a flag
//to tell the code to skip the first load of this function below
database.ref("/clicks").orderByChild("dateAdded").limitToLast(1).on("child_added", function(snapshot) {

	if(finishedLoading) {//skips getting/displaying last child on first webpage load
		var sv = snapshot.val();
		if(sv.name!=undefined)//name is undefined in database do not do the function
			addData(sv)//addData onto the dom
	}

}, function(errorObject) {
	console.log("Errors handled: " + errorObject.code);
});


//grab the stuff from the database and recallculate everything every minute
//a better way could be to save a copy of the database locally
//and only download when theres new stuff in the database
setInterval(function(){
	database.ref("/clicks").orderByChild("dateAdded").once('value').then(function(snapshot) {
//dbRef.on('value', function(snapshot) {
	$("#table-body").empty()
	var sv=snapshot.val()
	stuff=snapshot.val()
	for (var key in sv) {
		var obj = sv[key];
		addData(obj)
	}
	finishedLoading = true;
}, function(errorObject) {
	console.log("Errors handled: " + errorObject.code);
});
},60000);

function addData (sv) {
	//console.log(sv)
    // Assumptions
    var name = sv.name;
    var destination = sv.destination;
    var tFrequency = sv.frequency;
    // Time is 3:30 AM
    var firstTime = sv.firstTrainTime;
    // First Time (pushed back 1 year to make sure it comes before current time)
    var firstTimeConverted = moment(firstTime, "HH:mm").subtract(1, "years");
    console.log(firstTimeConverted);
    // Current Time
    var currentTime = moment();
    console.log("CURRENT TIME: " + moment(currentTime).format("hh:mm"));
    // Difference between the times
    var diffTime = moment().diff(moment(firstTimeConverted), "minutes");
    console.log("DIFFERENCE IN TIME: " + diffTime);
    // Time apart (remainder)
    var tRemainder = diffTime % tFrequency;
    console.log(tRemainder);
    // Minute Until Train
    var tMinutesTillTrain = tFrequency - tRemainder;
    console.log("MINUTES TILL TRAIN: " + tMinutesTillTrain);
    // Next Train
    var nextTrain = moment().add(tMinutesTillTrain, "minutes");
    console.log("ARRIVAL TIME: " + moment(nextTrain).format("hh:mm"));
    var nextArrival = moment(nextTrain).format("LT");	

    //create a new row
    //set the parameters for each column
    var trElement = $("<tr>")
    var tdName = $("<td>" + name + "</td>")
    var tdDestination = $("<td>" + destination + "</td>")
    var tdFrequency = $("<td>" + tFrequency + "</td>")
    var tdNextArrival = $("<td>" + nextArrival + "</td>");
    var tdtMinutesTillTrain = $("<td>" + tMinutesTillTrain + "</td>")

    //append all the columns to the row element
    trElement.append(tdName)
    trElement.append(tdDestination)
    trElement.append(tdFrequency)
    trElement.append(tdNextArrival)
    trElement.append(tdtMinutesTillTrain)

    //append the row element to the table body
    $("#table-body").append(trElement)
}
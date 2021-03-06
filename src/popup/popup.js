const FRAMERATE = 1/15;

// Initialize global variables.
var pOneBtn = document.getElementById("spb_one");
var pTwoBtn = document.getElementById("spb_two");
var infoBtn = document.getElementById("info-button");
var timeContainer = document.querySelector('.time-container');
var timerBackground = document.querySelector('.timer-background');
var timer = document.querySelector('.timer');
// Get all the buttons that add time.
var addBtns = document.querySelectorAll('.add');
var blckBtn = document.querySelector('.blacklist');
var ublckBtn = document.querySelector('.unblacklist');
var clearBtn = document.querySelector('.clear');
var clearTimeBtn = document.querySelector('.clearTime');
var global_bg_script = browser.extension.getBackgroundPage(); // Get the background script.
var popup_time = global_bg_script.global_time_left;

// Add event listeners to buttons.
// https://stackoverflow.com/a/256763 showed me how to pass variables in functions
// called by addEventListener.
pOneBtn.addEventListener('click', function() {
	switchPage(1);
});
pTwoBtn.addEventListener('click', function() {
	switchPage(2);
});
infoBtn.addEventListener('click', function() {
	switchPage(3); // Redirects user to another page.
});

// Attach an event listener to all the add buttons.
addBtns[0].addEventListener('click', function() {
	addTime(5);
});
addBtns[1].addEventListener('click', function() {
	addTime(15);
});
addBtns[2].addEventListener('click', function() {
	addTime(30);
});
// Subtraction buttons.
addBtns[3].addEventListener('click', function() {
	addTime(-5);
});
addBtns[4].addEventListener('click', function() {
	addTime(-15);
});
addBtns[5].addEventListener('click', function() {
	addTime(-30);
});

blckBtn.addEventListener('click', blacklistWebsite);
ublckBtn.addEventListener('click', unblacklistWebsite);
clearBtn.addEventListener('click', clearBlacklist);
clearTimeBtn.addEventListener('click', clearTime);

fixDisplay(); // Used to fix inconsistency in Ubuntu.
updateDisplay(); // Just to overwrite anything that the button says.
switchPage(1); // Make the buttons look pretty, since the initial css isn't quite good.

setInterval(mainLoop, FRAMERATE);

function onError(error) {
	console.log(error);
}

function fixDisplay() {
	var operating_system = navigator.platform.toLowerCase();
	
	// If the browser is running in a linux machine, fix the time display.
	// I have NO idea how to fix this without writing hacky os-specific code.
	// The problem (as far as I know) has to do with how linux (at least ubuntu) handles custom fonts differently.
	if(operating_system.includes("linux")) {
		// Change timer paragraph
		timer.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: center;
			height: 70%;
			width: 92.5%;
			padding-top: 1%;
			padding-bottom: 5%;
			border-radius: 10px;
			font-family: "Digital";
			font-size: 3em;
			text-align: center;
			color: #FB0206;
			background-color: #500104;`;
		// Change timer background
		timerBackground.style.cssText = `
			padding-top: 1.75%;
			padding-bottom: 1.75%;`;
	} else {
		// Change font for Windows (and Mac) to emulate what appears on linux (at least ubuntu).
		document.body.style.cssText = `
			width: 250px;
			height: 350px;
			margin: 0;
			padding: 0;
			border: 0;
			font-family: "Times New Roman", Times, serif;`;
		let buttons = document.querySelectorAll('.button');
		for(var i=0; i<10; i++) {
			buttons[i].style.fontSize = "1.7em";
		}
	}
}

/*
 * Switch to a specified page.
 */
function switchPage(page_number) {
	if(page_number === 1) {
		// Keeping the below line for reference.
		// document.getElementById("page_one").display = "inline";
		//
		// This is the wrong way to go about it!
		// The end is .style.display, NOT just .display.

		// Also! See how the display is set to flex? This makes it so that the
		// divs keep their css. Using block or inline destroys the css.
		document.getElementById("page_one").style.display = "flex";
		document.getElementById("page_two").style.display = "none";

		// Depress the first button.
		pOneBtn.style.marginTop = "5px";
		pOneBtn.style.marginBottom = "6px";
		pOneBtn.style.boxShadow = "0 2px #505050";
		// Reset the second button.
		pTwoBtn.style.marginBottom = "7px";
		pTwoBtn.style.boxShadow = "0 7px #505050";
	} else if(page_number === 2) {
		document.getElementById("page_one").style.display = "none";
		document.getElementById("page_two").style.display = "flex";

		// Depress the second button.
		pTwoBtn.style.marginBottom = "2px";
		pTwoBtn.style.boxShadow = "0 2px #505050";
		// Reset the first button.
		pOneBtn.style.marginTop = "0";
		pOneBtn.style.marginBottom = "15px";
		pOneBtn.style.boxShadow = "0 7px #505050";
	} else if(page_number === 3) { // Docs
		browser.tabs.create({
			active: true,
			url: "/docs/docs.html"
		});

		// Close the popup.
		window.close();
	}
}

/*
 * Run the popup at the constant frame rate defined at the top.
 */
function mainLoop() {
	// Get the current time from the background script.
	var new_time = GTFB();
	// To limit the amount of rewrites done, only change the displayed time
	// if the new time is different from the popup time.
	if(new_time != popup_time) {
		popup_time = new_time;

		updateDisplay();
	}
}

/*
 * Get Time From Background (GTFB).
 * Basically, it reaches into the extension window and grabs the global variable global_time_left.
 * Yes, I know that global variables are a bad practice. But when I was trying sending and receiving
 * messages from the popup js to the background js, I was at a complete loss. This is much easier to
 * execute. I do know that using global variables can be circumvented by using local storage, buuuut...
 * I needed to accomplish this first.
 */
function GTFB() {
	return global_bg_script.global_time_left;
}

/*
 * Set Global Time (SGT).
 * Sets the global time from the background script.
 */
function SGT(time) {
	// If the resulting time is less than zero, bring it back up to zero.
	if(time < 0) {
		time = 0;
	}

	global_bg_script.global_time_left = time;
}

/*
 * Updates the time display with the current time.
 */
function updateDisplay() {
	var new_time = document.createTextNode(formatTime());
	timer.removeChild(timer.firstChild);
	timer.appendChild(new_time);
}

/*
 * Takes any amount of minutes and adds them to the time left.
 */
function addTime(mins_to_add) {
	var time_left = GTFB();
	time_left += mins_to_add * 60; // * 60 because we want 15 minutes in seconds.

	// Set the time to the global time.
	SGT(time_left);

	updateDisplay();
}

/*
 * Take any number of seconds and spit out how many minutes and seconds the user has
 * left to browse.
 */
function formatTime() {
	// Get the time from the background script and assign it a variable.
	var time = popup_time;

	// Figure out how many hours, minutes, and seconds there are in the given time.
	// Code shameleslly "inspired" from:
	//  https://stackoverflow.com/questions/26794703/swift-integer-conversion-to-hours-minutes-seconds
	// I added the Math.floor() function to all of them as it would be a bit weird without it.
	//  For example, if there were only 30 minutes, then it would display: "0.5 H 30 M 0 S".
	var hours = Math.floor(time / 3600);
	var minutes = Math.floor((time % 3600) / 60);
	var seconds = (time % 3600) % 60;

	// Return a string including these numbers.
	return (hours + ":" + padString(minutes, 2) + ":" + padString(seconds, 2));
}

/*
 * Pad strings with 0s.
 * Code source: https://gist.github.com/endel/321925f6cafa25bbfbde
 * Slightly modified to work as an addon.
 */
function padString(string, size) {
	var s = String(string);
	while (s.length < (size || 2)) {s = "0" + s;}
	return s;
}

/*
 * Get the domain name of the current website.
 */
function trimURL(tab_url) {
	var split_string = tab_url.split("/");
	// Check if the first element of the array contains http: or https:.
	// If it does, the domain is in the third element. (second in the array)
	// If it doesn't, the domain is in the first element. (zeroth in the array)
	if(split_string[0] === "http:" || split_string[0] === "https:") {
		trimmed_tab_url = split_string[2];
	} else if(split_string[0].includes(":")) {
		trimmed_tab_url = ""; // Return nothing; prevents blocking of default mozilla pages and addons.
		// That means that "empty websites" are able to get blocked. However, the background script
		// doesn't check for empty websites to block, so new tabs will not get blocked.
	} else {
		trimmed_tab_url = split_string[0];
	}

	return trimmed_tab_url;
}

function blacklistWebsite() {
	browser.tabs.query({currentWindow: true, active: true}).then(pushURLToBlacklist, onError);
}

function pushURLToBlacklist(tabs) {
	var tab_url = tabs[0].url;
	var trimmed_tab_url;

	trimmed_tab_url = trimURL(tab_url);
	
	// Now that the domain name is isolated, make sure that it's not in the blacklist before the url is added to the blacklist.
	if(global_bg_script.checkBlacklistMatch(trimmed_tab_url)) {
		return;
	}

	// Add the url to the blacklist.
	global_bg_script.global_blacklist.push(trimmed_tab_url);

	// Make sure to save the blacklist.
	global_bg_script.saveWebsiteLists();
}

function unblacklistWebsite() {
	browser.tabs.query({currentWindow: true, active: true}).then(popURLFromBlacklist, onError);
}

/*
 * Remove the current website from the blacklist.
 */
function popURLFromBlacklist(tabs) {
	var tab_url = tabs[0].url;
	var trimmed_tab_url;

	trimmed_tab_url = trimURL(tab_url);
	
	// Now that the domain name is isolated, make sure that it's in the blacklist so that it can be popped.
	if(!global_bg_script.checkBlacklistMatch(trimmed_tab_url) || trimmed_tab_url === "") {
		return;
	}

	// Splice the url from the blacklist.
	global_bg_script.global_blacklist.splice(global_bg_script.global_blacklist.indexOf(trimmed_tab_url), 1);

	// Save the blacklist.
	global_bg_script.saveWebsiteLists();
}

function clearBlacklist() {
	//global_bg_script.global_blacklist = [];
	//
	// Leaving the above line up there to remind myself in the future what NOT TO DO.
	// When an array is 0'd out by defining it as [], the original array is DESTROYED.
	// After the array got destroyed and the tabs were switched, global_blacklist would become
	// a dead object. No good. The below line does the job perfectly.
	global_bg_script.global_blacklist.length = 0;

	global_bg_script.saveWebsiteLists();
}

function clearTime() {
	global_bg_script.global_time_left = 0;
}

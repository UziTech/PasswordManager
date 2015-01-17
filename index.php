<?php
$pageid = 27;
require_once("../includes/updateviews.inc");
?>
<!DOCTYPE html>
<html manifest="pws.appcache">
	<head>
		<title>UziTech PWS</title>
		<meta charset="utf-8">
		<meta name="description" content="PWS is a web application to save your passwords so you don't need to remember them. It may be used online or offline if used by a browser that supports application cache. Your information is securely encrypted on your device. The only way to decrypt the database is with your password. As with all of my programs it is free for everyone to use. All I ask is that you let me know if you find any bugs." />
		<meta name="keywords" content="passwords, pws, save" />
		<meta name="author" content="Tony Brix" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />

		<link rel="apple-touch-icon" sizes="57x57" href="/pws/images/icon_57x57.png" />
		<link rel="apple-touch-icon" sizes="72x72" href="/pws/images/icon_72x72.png" />
		<link rel="apple-touch-icon" sizes="114x114" href="/pws/images/icon_114x114.png" />
		<link rel="apple-touch-startup-image" href="/pws/images/image_320x460.png">
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black" />

		<link rel="stylesheet" type="text/css" href="/pws/css/smoothness/jquery-ui-1.8.18.custom.css" />
		<link rel="stylesheet" type="text/css" href="/pws/css/add2home.css" />
		<link rel="stylesheet" type="text/css" href="/pws/css/style.css" />

		<script type="text/javascript" src="/pws/js/jquery.1.7.1.min.js"></script>
		<script type="text/javascript" src="/pws/js/jquery-ui-1.8.18.custom.min.js"></script>
		<script type="text/javascript" src="/pws/js/blowfish.js"></script>
		<script type="text/javascript" src="/pws/js/jquery.idletimeout.js"></script>
		<script type="text/javascript" src="/pws/js/jquery.idletimer.js"></script>
		<script type="text/javascript">
			var addToHomeConfig = {
				returningVisitor: true,
				animationIn: "bubble",
				lifespan: 10000,
				expire: 2,
				touchIcon: true
			};
		</script>
		<script type="text/javascript" src="/pws/js/add2home.js"></script>
		<script type="text/javascript" src="/pws/js/database.js"></script>
		<script type="text/javascript" src="/pws/js/local.js"></script>
	</head>
	<body>
		<div id="loading">Loading...</div>
		<div id="header">
		</div>
		<div id="content">
			<button type="button" id="logout">Logout</button><button type="button" id="settings">Settings</button>
			<fieldset>
				<legend>URL:</legend>
				<select id="urls" disabled>
					<option value="">No URLs</option>
				</select><br />
				<button type="button" id="addurl" class="addbutton">+</button><button type="button" id="deleteurl" class="deletebutton">-</button><button type="button" id="editurl" class="changebutton">Edit</button>
			</fieldset>
			<fieldset>
				<legend>Username:</legend>
				<select id="usernames" disabled>
					<option value="">Choose A URL</option>
				</select><br />
				<button type="button" id="addusername" class="addbutton">+</button><button type="button" id="deleteusername" class="deletebutton">-</button><button type="button" id="editusername" class="changebutton">Edit</button>
			</fieldset>
			<fieldset>
				<legend>Passwords:</legend>
				<button type="button" id="showhide">Show Passwords</button><br />
				<select id="passwords" disabled>
					<option value="">Choose A Username</option>
				</select><br />
				<button type="button" id="addpassword" class="addbutton">+</button><button type="button" id="deletepassword" class="deletebutton">-</button><button type="button" id="editpassword" class="changebutton">Edit</button>
			</fieldset>
			<fieldset>
				<legend>Notes:</legend>
				<textarea id="notes" readonly="readonly"></textarea><br />
				<button type="button" id="editnotes">Edit</button>
			</fieldset>
		</div>
		<div id="footer">
			&copy; Copyright UziTech 2012 <span id="online"></span>
		</div>
	</body>
</html>

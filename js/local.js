/*if (top.location.href != location.href) {
 top.location.href = location.href;
 }*/
var count = 0;
var cdtimer, dialogwidth, db, uid, maxwidth;
var showhideCount = 5;
var hidePass = true;
var msgQ = 0;
var msgShowing = 0;
var loadingQueue = 0;
var documentTop = ((!!navigator.standalone) ? 20 : 0);
var HIDDEN_PASS = "&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;";

if (!window.openDatabase && !window.indexedDB) {
	alert('This application will not work in your browser yet.\nTry updating your browser.');
	location.href = "http://browsehappy.com";
}

if (window.applicationCache) {
	$(window.applicationCache)
			.on("noupdate error", function () {
				getDatabase(function (database) {
					db = database;
					$("#loading").css("display", "none");
					$("#header, #content, #footer").css("display", "block");
					showLogin();
				}, function (err) {
					error(err);
				});
			})
			.on("downloading", function () {
				$("#loading").html("Downloading Update...");
			})
			.on("progress", function (e) {
				if (e.originalEvent.lengthComputable) {
					$("#loading").html("Downloading Update... " + Math.ceil(100 * e.originalEvent.loaded / e.originalEvent.total) + "%");
				}
			})
			.on("updateready cached", function () {
				location.reload();
			});
//	$(window).on("online offline", function () {
//		$("#online").html(navigator.onLine ? "Online" : "Offline");
//	});
} else if (confirm("This browser does not support offline apps. You may still use this browser while online.\n\nWould you like to download a compatible browser?")) {
	location.href = "http://browsehappy.com";
}

$(window).on("orientationchange", OrientationChange);

$(function () {//***********start doc ready***************
	//$("#online").html(navigator.onLine ? "Online" : "Offline");
	$("#loading").css("top", documentTop);
	$("body").css("padding-top", documentTop);
	$("#urls").change(function ()
	{
		if ($("#urls").val() === "") {
			$("#usernames").html("<option value=''>Choose A URL</option>").prop("disabled", true);
			$("#passwords").html("<option value=''>Choose A Username</option>").prop("disabled", true);
			$("#notes").text("");
		} else {
			$("#usernames").html("<option value=''>Loading Usernames...</option>").prop("disabled", true);
			$("#passwords").html("<option value=''>Choose A Username</option>").prop("disabled", true);
			getUsernames(db, key, +$("#urls").val(), function (usernames) {
				if (usernames.length > 0) {
					$("#usernames").html("<option value=''>Select A Username</option>").prop("disabled", false);
					for (var i = 0; i < usernames.length; i++)
					{
						$("#usernames").append("<option value='" + usernames[i].id + "'>" + usernames[i].username + "</option>");
					}
					$("#usernames option").sort(sortAlpha).appendTo("#usernames");
					if (usernames.length === 1) {
						$("#usernames").val(usernames[0].id);
						$("#usernames").change();
					}
				} else {
					$("#usernames").html("<option value=''>No Usernames</option>").prop("disabled", true);
					$("#passwords").html("<option value=''>Choose A Username</option>").prop("disabled", true);
				}
			}, function (err) {
				error(err);
			});
			getNotes(db, key, +$("#urls").val(), function (notes) {
				if (notes === "") {
					$("#notes").text("");
				} else {
					$("#notes").text(notes);
				}
			}, function (err) {
				error(err);
			});
		}
	});
	$("#usernames").change(function () {
		if ($("#usernames").val() === "") {
			$("#passwords").html("<option value=''>Choose A Username</option>").prop("disabled", true);
		} else {
			$("#passwords").html("<option value=''>Loading Passwords...</option>").prop("disabled", true);
			getPasswords(db, key, +$("#usernames").val(), function (passwords) {
				if (passwords.length > 0) {
					$("#passwords").html("<option value=''>Select A Password</option>").prop("disabled", false);
					for (var i = 0; i < passwords.length; i++)
					{
						$("#passwords").append("<option value='" + passwords[i].id + "' data-password='" + passwords[i].password + "'>" + ((hidePass) ? HIDDEN_PASS : passwords[i].password) + "</option>");
					}
					$("#passwords option").sort(sortAlpha).appendTo("#passwords");
					if (passwords.length === 1) {
						$("#passwords").val(passwords[0].id);
					}
				} else {
					$("#passwords").html("<option value=''>No Passwords</option>").prop("disabled", true);
				}
			}, function (err) {
				error(err);
			});
		}
	});
	$("#deleteurl").click(function () {
		if ($("#urls").val() === "") {
			error("Select a URL first.");
		} else {
			if (confirm("Are you sure?")) {
				deleteUrl(db, +$("#urls").val(), function () {
					if ($("#urls option").size() === 2) {
						$("#urls").html("<option value=''>No URLs</option>").prop("disabled", true);
					} else {
						$("#urls option:selected").remove();
						if ($("#urls option").size() === 2) {
							$("#urls").val($("#urls option")[1].value);
						}
					}
					$("#urls").change();
				}, function (err) {
					error(err);
				});
			}
		}
	});
	$("#editurl").click(function () {
		if ($("#urls").val() === "") {
			error("Select a URL first.");
		} else {
			$("<div id='changeurldialog'>" +
					"<input type='text' placeholder='New URL' style='width: " + (maxwidth - 67) + "px;' autocorrect='off' autocomplete='off' autocapitalize='none' id='newurl' value='" + $("#urls option:selected").text() + "' />" +
					"</div>")
					.dialog({
						buttons: {"Change": function () {
								if ($("#urls option:selected").text() === $("#changeurldialog #newurl").val()) {
									$(this).dialog("close");
								} else {
									var unique = true;
									$("#urls option").each(function () {
										if ($(this).text() === $("#changeurldialog #newurl").val()) {
											unique = false;
											return false;
										}
									});
									if (unique) {
										var dlg = this;
										changeUrl(db, key, +$("#urls").val(), $("#changeurldialog #newurl").val(), function () {
											$("#urls option:selected").text($("#changeurldialog #newurl").val());
											$("#urls option").sort(sortAlpha).appendTo("#urls");
											$(dlg).dialog("close");
										}, function (err) {
											error(err);
										});
									} else {
										error("URL already exists.");
									}
								}
							}, "Cancel": function () {
								$(this).dialog("close");
							}},
						close: function (event, ui) {
							$(this).remove();
						},
						closeOnEscape: false,
						draggable: true,
						height: 'auto',
						modal: true,
						position: ['center', documentTop],
						resizable: false,
						title: "Change URL",
						width: dialogwidth
					});
			$("#changeurldialog input[type='text']").keydown(function (event) {
				if (event.which === 13) {
					$("div.ui-dialog-buttonset button")[0].click();
				}
			});
		}
	});
	$("#addurl").click(function () {
		$("<div id='addurldialog'>" +
				"<input type='text' placeholder='New URL' style='width: " + (maxwidth - 67) + "px;' autocorrect='off' autocomplete='off' autocapitalize='none' id='url' />" +
				"</div>")
				.dialog({
					buttons: {"Add": function () {
							var unique = true;
							$("#urls option").each(function () {
								if ($(this).text() === $("#addurldialog #url").val()) {
									unique = false;
									return false;
								}
							});
							if (unique) {
								var dlg = this;
								addUrl(db, key, uid, $("#addurldialog #url").val(), function (insertId) {
									if ($("#urls option").length === 1) {
										$("#urls").html("<option value=''>Select A URL</option>");
									}
									$("#urls").append("<option value='" + insertId + "'>" + $("#addurldialog #url").val() + "</option>");
									$("#urls option").sort(sortAlpha).appendTo("#urls");
									$("#urls").val(insertId).prop("disabled", false);
									$("#usernames").html("<option value=''>No Usernames</option>").prop("disabled", true);
									$("#passwords").html("<option value=''>Choose A Username</option>").prop("disabled", true);
									$("#notes").text("");
									$(dlg).dialog("close");
								}, function (err) {
									error(err);
								});
							} else {
								error("URL already exists.");
							}
						}, "Cancel": function () {
							$(this).dialog("close");
						}},
					close: function (event, ui) {
						$(this).remove();
					},
					closeOnEscape: false,
					draggable: true,
					height: 'auto',
					modal: true,
					position: ['center', documentTop],
					resizable: false,
					title: "Add URL",
					width: dialogwidth
				});
		$("#addurldialog input[type='text']").keydown(function (event) {
			if (event.which === 13) {
				$("div.ui-dialog-buttonset button")[0].click();
			}
		});
	});
	$("#deleteusername").click(function () {
		if ($("#usernames").val() === "") {
			error("Select a username first.");
		} else {
			if (confirm("Are you sure?")) {
				deleteUsername(db, +$("#usernames").val(), function () {
					if ($("#usernames option").size() === 2) {
						$("#usernames").html("<option value=''>No Usernames</option>").prop("disabled", true);
					} else {
						$("#usernames option:selected").remove();
						if ($("#usernames option").size() === 2) {
							$("#usernames").val($("#usernames option")[1].value);
						}
					}
					$("#usernames").change();
				}, function (err) {
					error(err);
				});
			}
		}
	});
	$("#editusername").click(function () {
		if ($("#usernames").val() === "") {
			error("Select a username first.");
		} else {
			$("<div id='changeusernamedialog'>" +
					"<input type='text' placeholder='New Username' style='width: " + (maxwidth - 67) + "px;' autocorrect='off' autocomplete='off' autocapitalize='none' id='newusername' value='" + $("#usernames option:selected").text() + "' />" +
					"</div>")
					.dialog({
						buttons: {"Change": function () {
								if ($("#usernames option:selected").text() === $("#changeusernamedialog #newusername").val()) {
									$(this).dialog("close");
								} else {
									var unique = true;
									$("#usernames option").each(function () {
										if ($(this).text() === $("#changeusernamedialog #newusername").val()) {
											unique = false;
											return false;
										}
									});
									if (unique) {
										var dlg = this;
										changeUsername(db, key, +$("#usernames").val(), $("#changeusernamedialog #newusername").val(), function () {
											$("#usernames option:selected").text($("#changeusernamedialog #newusername").val());
											$("#usernames option").sort(sortAlpha).appendTo("#usernames");
											$(dlg).dialog("close");
										}, function (err) {
											error(err);
										});
									} else {
										error("Username already exists.");
									}
								}
							}, "Cancel": function () {
								$(this).dialog("close");
							}},
						close: function (event, ui) {
							$(this).remove();
						},
						closeOnEscape: false,
						draggable: true,
						height: 'auto',
						modal: true,
						position: ['center', documentTop],
						resizable: false,
						title: "Change Username",
						width: dialogwidth
					});
			$("#changeusernamedialog input[type='text']").keydown(function (event) {
				if (event.which === 13) {
					$("div.ui-dialog-buttonset button")[0].click();
				}
			});
		}
	});
	$("#addusername").click(function () {
		if ($("#urls").val() === "") {
			error("Select a URL first.");
		} else {
			$("<div id='addusernamedialog'>" +
					"<input type='text' placeholder='New Username' style='width: " + (maxwidth - 67) + "px;' autocorrect='off' autocomplete='off' autocapitalize='none' id='username' />" +
					"</div>")
					.dialog({
						buttons: {"Add": function () {
								var unique = true;
								$("#usernames option").each(function () {
									if ($(this).text() === $("#addusernamedialog #username").val()) {
										unique = false;
										return false;
									}
								});
								if (unique) {
									var dlg = this;
									addUsername(db, key, +$("#urls").val(), $("#addusernamedialog #username").val(), function (insertId) {
										if ($("#usernames option").size() === 1) {
											$("#usernames").html("<option value=''>Select A Username</option>");
										}
										$("#usernames").append("<option value='" + insertId + "'>" + $("#addusernamedialog #username").val() + "</option>");
										$("#usernames option").sort(sortAlpha).appendTo("#usernames");
										$("#usernames").val(insertId).prop("disabled", false);
										$("#passwords").html("<option value=''>No Passwords</option>").prop("disabled", true);
										$(dlg).dialog("close");
									}, function (err) {
										error(err);
									});
								} else {
									error("Username already exists.");
								}
							}, "Cancel": function () {
								$(this).dialog("close");
							}},
						close: function (event, ui) {
							$(this).remove();
						},
						closeOnEscape: false,
						draggable: true,
						height: 'auto',
						modal: true,
						position: ['center', documentTop],
						resizable: false,
						title: "Add Username",
						width: dialogwidth
					});
			$("#addusernamedialog input[type='text']").keydown(function (event) {
				if (event.which === 13) {
					$("div.ui-dialog-buttonset button")[0].click();
				}
			});
		}
	});
	$("#deletepassword").click(function () {
		if ($("#passwords").val() === "") {
			error("Select a password first.");
		} else {
			if (confirm("Are you sure?")) {
				deletePassword(db, +$("#passwords").val(), function () {
					if ($("#passwords option").size() === 2) {
						$("#passwords").html("<option value=''>No Passwords</option>").prop("disabled", true);
					} else {
						$("#passwords option:selected").remove();
						if ($("#passwords option").size() === 2) {
							$("#passwords").val($("#passwords option")[1].value);
						}
					}
				}, function (err) {
					error(err);
				});
			}
		}
	});
	$("#editpassword").click(function () {
		if ($("#passwords").val() === "") {
			error("Select a password first.");
		} else {
			$("<div id='changepassworddialog'>" +
					"<input type='password' placeholder='New Password' style='display: inline;width: " + (maxwidth - 67) + "px;' id='newpassword' value='" + $("#passwords option:selected").attr("data-password") + "' />" +
					"<input type='text' placeholder='New Password' style='display: none;width: " + (maxwidth - 67) + "px;' autocorrect='off' autocomplete='off' autocapitalize='none' id='newpasswordtext' value='" + $("#passwords option:selected").attr("data-password") + "' /><br />" +
					"<input type='checkbox' id='showcharacters' /> Show Characters" +
					"</div>")
					.dialog({
						buttons: {"Change": function () {
								if ($("#passwords option:selected").attr("data-password") === $("#changepassworddialog #newpassword").val()) {
									$(this).dialog("close");
								} else {
									var unique = true;
									$("#passwords option").each(function () {
										if ($(this).attr("data-password") === $("#changepassworddialog #newpassword").val()) {
											unique = false;
											return false;
										}
									});
									if (unique) {
										var dlg = this;
										changePassword(db, key, +$("#passwords").val(), $("#changepassworddialog #newpassword").val(), function () {
											$("#passwords option:selected").attr("data-password", $("#changepassworddialog #newpassword").val());
											if (!hidePass) {
												$("#passwords option:selected").html($("#changepassworddialog #newpassword").val());
											}
											$("#passwords option").sort(sortPasswordsAlpha).appendTo("#passwords");
											$(dlg).dialog("close");
										}, function (err) {
											error(err);
										});
									} else {
										error("Password already exists.");
									}
								}
							}, "Cancel": function () {
								$(this).dialog("close");
							}},
						close: function (event, ui) {
							$(this).remove();
						},
						closeOnEscape: false,
						draggable: true,
						height: 'auto',
						modal: true,
						position: ['center', documentTop],
						resizable: false,
						title: "Change Password",
						width: dialogwidth
					});
			$("#changepassworddialog input[type='text'], #changepassworddialog input[type='password']").keydown(function (event) {
				if (event.which === 13) {
					$("div.ui-dialog-buttonset button")[0].click();
				}
			});
			$("#changepassworddialog #showcharacters").click(function () {
				$("#changepassworddialog #newpassword").css("display", (($(this).prop("checked")) ? "none" : "inline"));
				$("#changepassworddialog #newpasswordtext").css("display", (($(this).prop("checked")) ? "inline" : "none"));
			});
			$("#changepassworddialog #newpasswordtext").change(function () {
				$("#changepassworddialog #newpassword").val($(this).val());
			});
			$("#changepassworddialog #newpassword").change(function () {
				$("#changepassworddialog #newpasswordtext").val($(this).val());
			});
		}
	});
	$("#addpassword").click(function () {
		if ($("#usernames").val() === "") {
			error("Select a username first.");
		} else {
			$("<div id='addpassworddialog'>" +
					"<input type='password' placeholder='New Password' style='display: inline;width: " + (maxwidth - 67) + "px;' onkeydown='if (event.which === 13) { $(\"div.ui-dialog-buttonset button\")[0].click(); }' id='password' />" +
					"<input type='text' placeholder='New Password' style='display: none;width: " + (maxwidth - 67) + "px;' autocorrect='off' autocomplete='off' autocapitalize='none' id='passwordtext' /><br />" +
					"<input type='checkbox' id='showcharacters' /> Show Characters" +
					"</div>")
					.dialog({
						buttons: {"Add": function () {
								var unique = true;
								$("#passwords option").each(function () {
									if ($(this).attr("data-password") === $("#addpassworddialog #password").val()) {
										unique = false;
										return false;
									}
								});
								if (unique) {
									var dlg = this;
									addPassword(db, key, +$("#usernames").val(), $("#addpassworddialog #password").val(), function (insertId) {
										if ($("#passwords option").size() === 1) {
											$("#passwords").html("<option value=''>Select A Password</option>");
										}
										$("#passwords").append("<option value='" + insertId + "' data-password='" + $("#addpassworddialog #password").val() + "'>" + ((hidePass) ? HIDDEN_PASS : $("#addpassworddialog #password").val()) + "</option>");
										$("#passwords option").sort(sortPasswordsAlpha).appendTo("#passwords");
										$("#passwords").val(insertId).prop("disabled", false);
										$(dlg).dialog("close");
									}, function (err) {
										error(err);
									});
								} else {
									error("Password already exists.");
								}
							}, "Cancel": function () {
								$(this).dialog("close");
							}},
						close: function (event, ui) {
							$(this).remove();
						},
						closeOnEscape: false,
						draggable: true,
						height: 'auto',
						modal: true,
						position: ['center', documentTop],
						resizable: false,
						title: "Add Password",
						width: dialogwidth
					});
			$("#addpassworddialog input[type='text'], #addpassworddialog input[type='password']").keydown(function (event) {
				if (event.which === 13) {
					$("div.ui-dialog-buttonset button")[0].click();
				}
			});
			$("#addpassworddialog #showcharacters").click(function () {
				$("#addpassworddialog #password").css("display", (($(this).prop("checked")) ? "none" : "inline"));
				$("#addpassworddialog #passwordtext").css("display", (($(this).prop("checked")) ? "inline" : "none"));
			});
			$("#addpassworddialog #passwordtext").change(function () {
				$("#addpassworddialog #password").val($(this).val());
			});
			$("#addpassworddialog #password").change(function () {
				$("#addpassworddialog #passwordtext").val($(this).val());
			});
		}
	});
	$("#editnotes").click(function () {
		if ($("#urls").val() === "") {
			error("Select a URL first.");
		} else {
			$("<div id='changenotesdialog'>" +
					"<textarea id='newnotes' placeholder='Notes' style='width: " + (maxwidth - 67) + "px;'>" + $("#notes").text() + "</textarea>" +
					"</div>")
					.dialog({
						buttons: {"Change": function () {
								var dlg = this;
								changeNotes(db, key, +$("#urls").val(), $("#changenotesdialog #newnotes").val(), function () {
									$("#notes").text($("#changenotesdialog #newnotes").val());
									$(dlg).dialog("close");
								}, function (err) {
									error(err);
								});
							}, "Cancel": function () {
								$(this).dialog("close");
							}},
						close: function (event, ui) {
							$(this).remove();
						},
						closeOnEscape: false,
						draggable: true,
						height: "auto",
						modal: true,
						position: ['center', documentTop],
						resizable: false,
						title: "Change Notes",
						width: dialogwidth
					});
		}
	});
	$("#settings").click(function () {
		$("<div id='settingsdialog'>" +
				//"<button type='button' style='" + (maxwidth - 67) + "' id='exportbackup'>Export/Backup Passwords</button><br />" +
				//"<button type='button' style='" + (maxwidth - 67) + "' id='importrestore'>Import/Restore Passwords</button><br />" +
				//"<button type='button' style='" + (maxwidth - 67) + "' id='uploadtoserver'>Upload To Server</button><br />" +
				//"<button type='button' style='" + (maxwidth - 67) + "' id='downloadfromserver'>Download From Server</button><br />" +
				"<button type='button' style='" + (maxwidth - 67) + "' id='changeusername'>Change Username</button><br />" +
				"<button type='button' style='" + (maxwidth - 67) + "' id='changepassword'>Change Password</button><br />" +
				"<button type='button' style='" + (maxwidth - 67) + "' id='deleteuser'>Delete User</button>" +
				"</div>")
				.dialog({
					buttons: {"Close": function () {
							$(this).dialog("close");
						}},
					close: function (event, ui) {
						$(this).remove();
					},
					closeOnEscape: false,
					draggable: true,
					height: "auto",
					modal: true,
					position: ['center', documentTop],
					resizable: false,
					title: "Settings",
					width: dialogwidth
				});
		$("#settingsdialog button").button();
		/*$("#exportbackup").click(function(){
		 $("<div id='exportbackupdialog'>" +
		 "<input type='password' style='width: " + (maxwidth - 67) + "px;' id='password' />" +
		 "</div>")
		 .dialog({
		 buttons: {
		 "Export/Backup": function(){
		 var dlg = this;
		 db.transaction(function (tx) {
		 tx.executeSql('SELECT password FROM users WHERE id = ?', [uid], function(tx, results){
		 if ($("#exportbackup #password").val() === decrypt(results.rows.item(0).password)) {
		 tx.executeSql('SELECT urls.id AS urlid, usernames.id AS usernameid, passwords.id AS passwordid, url, notes, username, password FROM urls LEFT JOIN usernames ON urls.id = usernames.urlid LEFT JOIN passwords ON usernames.id = passwords.usernameid WHERE urls.userid = ? ORDER BY urlid, usernameid, passwordid', [uid], function(tx, results){
		 var xmlDoc = "<r>";
		 var urlid = usernameid = null;
		 for(var i = 0; i < results.rows.length; i++)
		 {
		 if (results.rows.item(i).urlid != urlid) {
		 if (urlid != null) {
		 if (usernameid != null) {
		 xmlDoc += "</n>";
		 }
		 xmlDoc += "</u>";
		 usernameid = null;
		 }
		 urlid = results.rows.item(i).urlid;
		 xmlDoc += "<u t='" + decrypt(results.rows.item(i).url) + "' z='" + decrypt(results.rows.item(0).notes) + "'>";
		 }
		 if (results.rows.item(i).usernameid != usernameid) {
		 if (usernameid != null) {
		 xmlDoc += "</n>";
		 }
		 if (results.rows.item(i).usernameid != null) {
		 usernameid = results.rows.item(i).usernameid;
		 xmlDoc += "<n t='" + decrypt(results.rows.item(i).username) + "'>";
		 }
		 }
		 if (results.rows.item(i).passwordid != null) {
		 xmlDoc += "<p t='" + decrypt(results.rows.item(i).password) + "' />";
		 }
		 }
		 if (usernameid != null) {
		 xmlDoc += "</n>";
		 }
		 if (urlid != null) {
		 xmlDoc += "</u>";
		 }
		 xmlDoc += "</r>";
		 window.open("backup.php?pws=" + encrypt(xmlDoc, $("#exportbackup #password").val()))////
		 }, function(tx, err)
		 {
		 error(err.message);
		 });
		 $(dlg).dialog("close");
		 } else {
		 error("Invalid Password");
		 }
		 }, function(tx, err){
		 error(err.message);
		 });
		 });
		 },
		 "Cancel": function() { $(this).dialog("close"); }
		 },
		 close: function(event, ui){ $(this).remove(); },
		 closeOnEscape: false,
		 draggable: true,
		 height: "auto",
		 modal: true,
		 position: ['center', documentTop],
		 resizable: false,
		 title: "Export/Backup Passwords",
		 width: dialogwidth
		 });
		 $("#exportbackupdialog input[type='password']").keydown(function(event){
		 if (event.which === 13) { 
		 $("div.ui-dialog-buttonset button")[0].click();
		 }
		 });
		 });
		 $("#importrestore").click(function(){
		 $("<div id='importrestoredialog'>" +
		 "<input type='password' style='width: " + (maxwidth - 67) + "px;' id='password' />" +
		 "</div>")
		 .dialog({
		 buttons: {
		 "Import/Restore": function(){
		 ////
		 },
		 "Cancel": function() { $(this).dialog("close"); }
		 },
		 close: function(event, ui){ $(this).remove(); },
		 closeOnEscape: false,
		 draggable: true,
		 height: "auto",
		 modal: true,
		 position: ['center', documentTop],
		 resizable: false,
		 title: "Import/Restore Passwords",
		 width: dialogwidth
		 });
		 $("#importrestoredialog input[type='password']").keydown(function(event){
		 if (event.which === 13) { 
		 $("div.ui-dialog-buttonset button")[0].click();
		 }
		 });
		 });
		 
		 $("#uploadtoserver").click(function () {
		 $("<div id='uploadtoserverdialog'>" +
		 "<div>Your passwords will be uploaded to the server and you will be given a code. That code can download the passwords one time. Your username and password must be the same when you download the passwords as when you upload the passwords.</div>" +
		 "<button type='button' style='" + (maxwidth - 67) + "' id='sync'>Sync</button><br />" +
		 "<input type='text' style='width: " + (maxwidth - 67) + "px;' id='syncid' readonly='readonly' />" +
		 "</div>")
		 .dialog({
		 buttons: {
		 "Upload": function () {
		 var dlg = this;
		 db.transaction(function (tx) {
		 tx.executeSql('SELECT password FROM users WHERE id = ?', [uid], function (tx, results) {
		 if ($("#changeusernamedialog #password").val() === decrypt(results.rows.item(0).password)) {
		 tx.executeSql('SELECT id FROM users WHERE username = ?', [$("#changeusernamedialog #username").val()], function (tx, results) {
		 if (results.rows.length === 0) {
		 tx.executeSql('UPDATE users SET username = ?, key = ? WHERE id = ?', [$("#changeusernamedialog #username").val(), encrypt(key, $("#changeusernamedialog #username").val() + $("#changeusernamedialog #password").val()), uid]);
		 $(dlg).dialog("close");
		 }
		 else if (results.rows.item(0).id === uid) {
		 $(dlg).dialog("close");
		 } else {
		 error("Username already exists.");
		 $("#changeusernamedialog #username").val("").focus();
		 }
		 }, function (tx, err) {
		 error(err.message);
		 });
		 } else {
		 error("Invalid Password");
		 $("#changeusernamedialog #password").val("").focus();
		 }
		 }, function (tx, err) {
		 error(err.message);
		 });
		 });
		 },
		 "Cancel": function () {
		 $(this).dialog("close");
		 }
		 },
		 close: function (event, ui) {
		 $(this).remove();
		 },
		 closeOnEscape: false,
		 draggable: true,
		 height: "auto",
		 modal: true,
		 position: ['center', documentTop],
		 resizable: false,
		 title: "Change Username",
		 width: dialogwidth
		 });
		 });*/
		$("#changeusername").click(function () {
			$("<div id='changeusernamedialog'>" +
					"<input type='password' style='width: " + (maxwidth - 67) + "px;' placeholder='Enter Your Password' id='password' />" +
					"<input type='text' style='width: " + (maxwidth - 67) + "px;' autocorrect='off' autocomplete='off' autocapitalize='none' placeholder='New Username' id='username' />" +
					"</div>")
					.dialog({
						buttons: {
							"Change": function () {
								var dlg = this;
								changeUserUsername(db, key, uid, $("#changeusernamedialog #username").val(), $("#changeusernamedialog #password").val(), function () {
									$(dlg).dialog("close");
								}, function (err) {
									error(err);
								});
							},
							"Cancel": function () {
								$(this).dialog("close");
							}
						},
						close: function (event, ui) {
							$(this).remove();
						},
						closeOnEscape: false,
						draggable: true,
						height: "auto",
						modal: true,
						position: ['center', documentTop],
						resizable: false,
						title: "Change Username",
						width: dialogwidth
					});
		});
		$("#changepassword").click(function () {
			$("<div id='changepassworddialog'>" +
					"<input type='password' style='width: " + (maxwidth - 67) + "px;' placeholder='Old Password' id='oldpassword' />" +
					"<input type='password' style='width: " + (maxwidth - 67) + "px;' placeholder='New Password' id='newpassword' />" +
					"<input type='password' style='width: " + (maxwidth - 67) + "px;' placeholder='Confirm Password' id='confpassword' />" +
					"</div>")
					.dialog({
						buttons: {
							"Change": function () {
								if ($("#changepassworddialog #newpassword").val() === $("#changepassworddialog #confpassword").val()) {
									var dlg = this;
									changeUserPassword(db, key, uid, $("#changepassworddialog #oldpassword").val(), $("#changepassworddialog #newpassword").val(), function () {
										$(dlg).dialog("close");
									}, function (err) {
										error(err);
										$("#changepassworddialog #newpassword").val("");
										$("#changepassworddialog #confpassword").val("");
										$("#changepassworddialog #oldpassword").val("").focus();
									});
								} else {
									error("New passwords don't match.");
									$("#changepassworddialog #newpassword").val("");
									$("#changepassworddialog #confpassword").val("");
									$("#changepassworddialog #oldpassword").val("").focus();
								}
							},
							"Cancel": function () {
								$(this).dialog("close");
							}
						},
						close: function (event, ui) {
							$(this).remove();
						},
						closeOnEscape: false,
						draggable: true,
						height: "auto",
						modal: true,
						position: ['center', documentTop],
						resizable: false,
						title: "Change Password",
						width: dialogwidth
					});
		});
		$("#deleteuser").click(function () {
			if (confirm("Are you sure you want to delete this user and all of their information? This is not reversable!")) {
				$("<div id='deleteuserdialog'>" +
						"<input type='password' placeholder='Enter your password' style='width: " + (maxwidth - 67) + "px;' id='password' />" +
						"</div>")
						.dialog({
							buttons: {
								"Delete": function () {
									deleteUser(db, key, uid, $("#deleteuserdialog #password").val(), function () {
										location.reload();
									}, function (err) {
										error(err);
									});
								},
								"Cancel": function () {
									$(this).dialog("close");
								}
							},
							close: function (event, ui) {
								$(this).remove();
							},
							closeOnEscape: false,
							draggable: true,
							height: "auto",
							modal: true,
							position: ['center', documentTop],
							resizable: false,
							title: "Delete User",
							width: dialogwidth
						});
			}
		});
	});
	$("#showhide").click(function () {
		hidePass = !hidePass;
		if (hidePass) {
			clearInterval(showhideTimer);
			showhideCount = 5;
			$("#passwords option").each(function () {
				if ($(this).val() !== "") {
					$(this).html(HIDDEN_PASS);
				}
			});
			$("#showhide .ui-button-text").text("Show Passwords");
		} else {
			showhideTimer = setInterval(function () {
				if (!hidePass) {
					if (--showhideCount === 0) {
						$("#showhide").click();
					} else {
						$("#showhide .ui-button-text").text("Hide Passwords..." + showhideCount);
					}
				}
			}, 1000);
			$("#showhide .ui-button-text").text("Hide Passwords..." + showhideCount);
			$("#passwords option").each(function (index) {
				if ($(this).val() !== "") {
					$(this).html($(this).attr("data-password"));
				}
			});
		}
	});
	$("#logout").click(function () {
		location.reload();
	});
//	if (!navigator.onLine) {
//		$("#online").html("Offline").attr("id", "offline");
//	}
	$("div[data-href]").click(function () {
		location.href = $(this).attr("data-href");
	});
	$("button").button();
	OrientationChange();
	if(!window.applicationCache.status){
		$(window.applicationCache).trigger("noupdate");
	}
});//***************End document ready****************

function message(msg)
{
	if (msgShowing < msgQ) {
		msgQ = 0;
	} else {
		msgQ++;
	}
	msgShowing++;
	$("<div id='msg" + msgQ + "' style='position: fixed; top: " + (30 + (msgQ * 20)) + "px; right: 20px; color: #fff; font-weight: bold; font-size: 20px;'>" + msg + "</div>").appendTo("body");
	setTimeout("$('#msg" + msgQ + "').animate({top:'-=20',opacity:0},1000,function(){ $(this).remove();msgShowing--;});", 1000);
}

function startLoading(s)
{
	loadingQueue++;
	if (loadingQueue === 1) {
		$("<div id='loading' style='text-align: center;'><div data='" + s + "'>" + s + "</div></div>").appendTo("body");
	} else {
		$("#loading").append("<div data='" + s + "'>" + s + "</div>");
	}
}

function endLoading(s)
{
	if (loadingQueue > 0) {
		loadingQueue--;
		if (loadingQueue === 0) {
			$("#loading").remove();
		} else {
			$("#loading div[data='" + s + "']").remove();
		}
	}
}

function error(msg)
{
	alert(msg);
}

function OrientationChange()
{
	maxwidth = ((window.orientation === 0 || window.orientation === 180 || window.orientation === undefined) ? 318 : 478);
	dialogwidth = maxwidth - 17;
	$("#username, #password, #confpassword, #fname, #lname, #email").width(maxwidth - 12);
	$(".ui-dialog").width(dialogwidth);
	$("#logout, #settings").width((maxwidth - 4) / 2);
	$("fieldset, select, #editnotes, #showhide").width(maxwidth - 16);
	$("#notes").width(maxwidth - 22);
	$("button.addbutton, button.deletebutton").width((maxwidth - 26) / 4);
	$("button.changebutton").width((maxwidth - 26) / 2);
	$(".ui-dialog-content button, .ui-dialog-content input[type=password], .ui-dialog-content input[type=text], .ui-dialog-content textarea").width(maxwidth - 67);
	$("body").width(maxwidth);
	$("div.ui-widget-overlay").width($(window).width());
}

function sortAlpha(a, b) {
	if (a.getAttribute("value") === "") {
		return -1;
	}
	else if (b.getAttribute("value") === "") {
		return 1;
	}
	return a.innerHTML.toLowerCase() > b.innerHTML.toLowerCase() ? 1 : -1;
}

function sortPasswordsAlpha(a, b) {
	if (a.getAttribute("value") === "") {
		return -1;
	}
	else if (b.getAttribute("value") === "") {
		return 1;
	}
	return a.getAttribute("data-password").toLowerCase() > b.getAttribute("data-password").toLowerCase() ? 1 : -1;
}

function getTimeIdle()
{
	var cdTime = $.idleTimeout.options.idleAfter + $.idleTimeout.options.warningLength - Math.floor($.idleTimer("getElapsedTime") / 1000);
	if (cdTime < 0) {
		location.href = "/pws/";
	} else {
		$("#idleTimerCD").text(Math.floor(cdTime / 60) + ":" + ((cdTime % 60 < 10) ? "0" : "") + (cdTime % 60));
	}
}

function showLogin()
{
	if (!$("#login").length) {
		$("<div id='login' style='text-align:left'>" +
				"<input type='text' placeholder='Username' style='width: " + (maxwidth - 67) + "px' autocorrect='off' autocomplete='off' autocapitalize='none' id='username' /><br />" +
				"<input type='password' placeholder='Password' style='width: " + (maxwidth - 67) + "px' id='password' />" +
				"</div>")
				.dialog({
					buttons: {"Login": function () {
							var dlg = this;
							login(db, $("#login #username").val(), $("#login #password").val(), function (data) {
								key = data.key;
								uid = data.userId;
								getUrls(db, key, uid, function (urls) {
									if (urls.length > 0) {
										$("#urls").html("<option value=''>Select A URL</option>").prop("disabled", false);
										for (var i = 0; i < urls.length; i++)
										{
											$("#urls").append("<option value='" + urls[i].id + "'>" + urls[i].url + "</option>");
										}
										$("#urls option").sort(sortAlpha).appendTo("#urls");
										if (urls.length === 1) {
											$("#urls").val(urls[0].id);
											$("#urls").change();
										}
									} else {
										$("#urls").html("<option value=''>No URLs</option>").prop("disabled", true);
									}
									$(dlg).dialog("close");
								}, function (err) {
									error(err);
								});
							}, function (err) {
								error(err);
							});
						}},
					close: function (event, ui)
					{
						$(this).remove();
						$.idleTimeout({
							idleAfter: 50, // in seconds
							warningLength: 10, //in seconds
							onEvent: function ()
							{
								clearInterval(cdtimer);
								cdtimer = setInterval(getTimeIdle, 1000);
								var cdTime = $.idleTimeout.options.idleAfter + $.idleTimeout.options.warningLength;
								$("#idleTimerCD").text(Math.floor(cdTime / 60) + ":" + ((cdTime % 60 < 10) ? "0" : "") + (cdTime % 60));
							},
							onTimeout: function ()
							{
								location.href = "/pws/";
							},
							onIdle: function () {
								$("#idleTimerCD").css("display", "none");
								$('<div id="idle">Continue your session?</div>')
										.dialog({
											buttons: {
												"Continue": function ()
												{
													$(this).dialog('close');
												},
												"Logout": function ()
												{
													$.idleTimeout.options.onTimeout.call(this);
												}
											},
											close: function (event, ui) {
												$.idleTimeout.options.onResume.call();
												$("#idleTimerCD").css("display", "block");
												$(this).remove();
											},
											closeOnEscape: false,
											draggable: true,
											height: "auto",
											modal: true,
											position: ['center', documentTop],
											resizable: false,
											title: "Session expires in <span id='countdown'></span>",
											width: dialogwidth
										});
								$("a.ui-dialog-titlebar-close").remove();
							},
							onResume: function ()
							{
								$.idleTimeout.onResume();
							},
							onCountdown: function (counter)
							{
								$("#countdown").html(counter);

							}
						});
						var cdTime = $.idleTimeout.options.idleAfter + $.idleTimeout.options.warningLength;
						$("<span id='idleTimerCD' style='float:right;'>" + Math.floor(cdTime / 60) + ":" + ((cdTime % 60 < 10) ? "0" : "") + (cdTime % 60) + "</span>").prependTo("#footer");
						cdtimer = setInterval(getTimeIdle, 1000);
					},
					closeOnEscape: false,
					draggable: true,
					height: 'auto',
					modal: true,
					position: ['center', documentTop],
					resizable: false,
					title: "Login",
					width: dialogwidth
				});
		$("a.ui-dialog-titlebar-close").remove();
		$("#login input").keydown(function (event) {
			if (event.which === 13) {
				$("div.ui-dialog-buttonset button")[0].click();
			}
		});
		$("#login #username").focus();
	}
}